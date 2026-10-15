import { useEffect, useRef } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { Barrier, Inventories, MotivationItem, MotivationItemKey, CharacterColor, CharacterDefinition, CharacterPosition, TextKey } from "../logic/types"
import type { Maze } from "../logic/maze"
import { pathLength } from "../logic/movement"
import { blockedCellsFor } from "../logic/grid"
import { SimpleAI } from "../logic/ai"
import type { CombatResolution } from "./useCombatResolution"
import type { GameLog } from "./useGameLog"
import { ACTION_SETTLE_MS, AI_END_TURN_MS, AI_STEP_MS, STEP_MS } from "../constants/rules"

interface AiTurnOptions {
    activeCharacter: CharacterDefinition | null
    isPlayerTurn: boolean
    round: number
    turnIndex: number
    characters: CharacterDefinition[]
    setCharacters: Dispatch<SetStateAction<CharacterDefinition[]>>
    items: MotivationItem[]
    inventories: Inventories
    setInventories: Dispatch<SetStateAction<Inventories>>
    maze: Maze
    // Barreiras acesas: fecham caminho para personagens adversárias
    barriers: Barrier[]
    // Uma rolagem em andamento trava a IA até o resultado sair
    resolving: boolean
    endTurn: () => void
    // Agenda a coleta do item pisado, para acontecer quando a personagem chegar na casa
    schedulePickup: (color: CharacterColor, position: CharacterPosition, delayMs: number) => void
    // Diz se o destino tem item: é o que separa "mover" de "coletar" no log
    moveActionFor: (position: CharacterPosition) => { actionKey: TextKey; target?: string }
    removeFromInventory: (color: CharacterColor, key: MotivationItemKey) => void
    // Segura a câmera na personagem manipulada enquanto ela ainda caminha até o destino
    holdFocus: (delayMs: number) => void
    combat: CombatResolution
    log: GameLog
}

// Turno de IA: roda para a personagem da vez sempre que ela for de um time que o jogador não
// comanda. Executa uma ação por tick; a mudança de state reentra o efeito até a personagem
// encerrar o turno. No multi-jogador local, nunca roda. Assistindo, roda para todas.
export const useAiTurn = ({
    activeCharacter,
    isPlayerTurn,
    round,
    turnIndex,
    characters,
    setCharacters,
    items,
    inventories,
    setInventories,
    maze,
    barriers,
    resolving,
    endTurn,
    schedulePickup,
    moveActionFor,
    removeFromInventory,
    holdFocus,
    combat,
    log,
}: AiTurnOptions) => {
    // Turno em que a fase dos itens já foi resolvida (ela acontece uma vez por turno)
    const itemPhaseDoneRef = useRef<string | null>(null)
    // Até quando a personagem manipulada ainda caminha. A próxima ação da IA espera ela chegar:
    // a "isca" termina de andar antes do ataque que vem nela.
    const walkEndsAtRef = useRef(0)

    useEffect(() => {
        if (!activeCharacter) return
        if (isPlayerTurn) {
            itemPhaseDoneRef.current = null
            return
        }
        if (resolving) return

        const turnKey = `${round}-${turnIndex}`
        const color = activeCharacter.color

        // Fase dos itens: no começo do turno, o time da personagem da vez gasta os itens que tem
        // nas próprias personagens, revigorando ou promovendo (uma vez por turno)
        if (itemPhaseDoneRef.current !== turnKey) {
            const phase = SimpleAI.applyOwnItems(characters, color, inventories)
            itemPhaseDoneRef.current = turnKey
            if (phase.uses.length > 0) {
                for (const { characterId, use, level } of phase.uses) {
                    if (use === "reinvigorate") log.reinvigorated(color, characterId)
                    else log.promoted(color, characterId, level)
                }
                setCharacters(phase.characters)
                setInventories(phase.inventories)
                return
            }
        }

        // A personagem já agiu (movimento/ataque resolvido): só falta encerrar o turno dela
        if (activeCharacter.movedThisTurn) {
            const endTimer = setTimeout(endTurn, AI_END_TURN_MS)
            return () => clearTimeout(endTimer)
        }

        const timer = setTimeout(() => {
            const previousCharacters = characters
            const { updatedCharacters, pendingAttack, manipulationItem } = SimpleAI.makeMove(
                characters,
                activeCharacter,
                maze,
                items,
                inventories,
                barriers,
            )

            // Aplica a decisão da IA: posiciona as personagens e agenda a coleta do item "pisado".
            // Devolve a personagem que mudou de casa (no máximo uma por chamada de makeMove).
            const applyMove = () => {
                setCharacters(updatedCharacters)
                const movedCharacter = updatedCharacters.find((p) => {
                    const old = previousCharacters.find((q) => q.id === p.id)
                    return old && (old.position.x !== p.position.x || old.position.y !== p.position.y)
                })
                if (movedCharacter) {
                    const old = previousCharacters.find((q) => q.id === movedCharacter.id)!
                    const delayMs =
                        pathLength(
                            old.position,
                            movedCharacter.position,
                            maze,
                            blockedCellsFor(movedCharacter.color, barriers, previousCharacters),
                        ) *
                            STEP_MS +
                        ACTION_SETTLE_MS
                    schedulePickup(movedCharacter.color, movedCharacter.position, delayMs)
                    // A personagem manipulada ainda vai caminhar até o destino: a câmera vai com ela
                    if (manipulationItem) {
                        holdFocus(delayMs)
                        walkEndsAtRef.current = Date.now() + delayMs
                    }
                }
                return movedCharacter
            }

            // A jogada decidida: o ataque, ou o movimento puro
            const play = (record: (character: string, actionKey: TextKey, target?: string) => void) => {
                const movedCharacter = applyMove()
                if (pendingAttack) {
                    record(pendingAttack.attackerId, "toAttack", pendingAttack.targetId)
                    combat.resolveAttack(pendingAttack)
                    return
                }
                if (!movedCharacter) return
                const { actionKey, target } = moveActionFor(movedCharacter.position)
                record(movedCharacter.id, actionKey, target)
            }

            // Manipulação: primeiro a moeda decide se a personagem obedece. O item sai do inventário
            // na tentativa (falhando, cai de volta no tabuleiro) e a personagem só age se a
            // manipulação pegar.
            if (manipulationItem) {
                removeFromInventory(color, manipulationItem)
                log.usedTo(color, manipulationItem, "toManipulate")
                combat.resolveManipulation(color, manipulationItem, (success) => {
                    if (success) play((character, actionKey, target) => log.manipulatedTo(color, character, actionKey, target))
                })
                return
            }

            play((character, actionKey, target) => log.usedTo(color, character, actionKey, target))
        }, Math.max(AI_STEP_MS, walkEndsAtRef.current - Date.now()))

        return () => clearTimeout(timer)
        // endTurn fecha sobre `turnIndex`/`characters` (ambos nas deps), então a closure está sempre atualizada
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [turnIndex, round, characters, isPlayerTurn, inventories, items, resolving, barriers])
}
