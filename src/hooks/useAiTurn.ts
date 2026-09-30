import { useEffect, useRef } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { Barrier, Inventories, MotivationItem, MotivationItemKey, PieceColor, PieceDefinition, PiecePosition, TextKey } from "../logic/types"
import type { Maze } from "../logic/maze"
import { pathLength } from "../logic/movement"
import { blockedCellsFor } from "../logic/grid"
import { SimpleAI } from "../logic/ai"
import type { CombatResolution } from "./useCombatResolution"
import type { GameLog } from "./useGameLog"
import { ACTION_SETTLE_MS, AI_END_TURN_MS, AI_STEP_MS, STEP_MS } from "../constants/rules"

interface AiTurnOptions {
    activePiece: PieceDefinition | null
    isPlayerTurn: boolean
    round: number
    turnIndex: number
    pieces: PieceDefinition[]
    setPieces: Dispatch<SetStateAction<PieceDefinition[]>>
    items: MotivationItem[]
    inventories: Inventories
    setInventories: Dispatch<SetStateAction<Inventories>>
    maze: Maze
    // Barreiras acesas: fecham caminho para peças adversárias
    barriers: Barrier[]
    // Uma rolagem em andamento trava a IA até o resultado sair
    resolving: boolean
    endTurn: () => void
    // Agenda a coleta do item pisado, para acontecer quando a peça chegar na casa
    schedulePickup: (color: PieceColor, position: PiecePosition, delayMs: number) => void
    // Diz se o destino tem item: é o que separa "mover" de "coletar" no log
    moveActionFor: (position: PiecePosition) => { actionKey: TextKey; target?: string }
    removeFromInventory: (color: PieceColor, key: MotivationItemKey) => void
    // Segura a câmera na peça manipulada enquanto ela ainda caminha até o destino
    holdFocus: (delayMs: number) => void
    combat: CombatResolution
    log: GameLog
}

// Turno de IA: roda para a peça da vez sempre que ela for de um time que o jogador não
// comanda. Executa uma ação por tick; a mudança de state reentra o efeito até a peça
// encerrar o turno. No multi-jogador local, nunca roda. Assistindo, roda para todas.
export const useAiTurn = ({
    activePiece,
    isPlayerTurn,
    round,
    turnIndex,
    pieces,
    setPieces,
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
    // Até quando a peça manipulada ainda caminha. A próxima ação da IA espera ela chegar:
    // a "isca" termina de andar antes do ataque que vem nela.
    const walkEndsAtRef = useRef(0)

    useEffect(() => {
        if (!activePiece) return
        if (isPlayerTurn) {
            itemPhaseDoneRef.current = null
            return
        }
        if (resolving) return

        const turnKey = `${round}-${turnIndex}`
        const color = activePiece.color

        // Fase dos itens: no começo do turno, o time da peça da vez gasta os itens que tem
        // nas próprias peças, revigorando ou promovendo (uma vez por turno)
        if (itemPhaseDoneRef.current !== turnKey) {
            const phase = SimpleAI.applyOwnItems(pieces, color, inventories)
            itemPhaseDoneRef.current = turnKey
            if (phase.uses.length > 0) {
                for (const { pieceId, use, level } of phase.uses) {
                    if (use === "reinvigorate") log.reinvigorated(color, pieceId)
                    else log.promoted(color, pieceId, level)
                }
                setPieces(phase.pieces)
                setInventories(phase.inventories)
                return
            }
        }

        // A peça já agiu (movimento/ataque resolvido): só falta encerrar o turno dela
        if (activePiece.movedThisTurn) {
            const endTimer = setTimeout(endTurn, AI_END_TURN_MS)
            return () => clearTimeout(endTimer)
        }

        const timer = setTimeout(() => {
            const previousPieces = pieces
            const { updatedPieces, pendingAttack, manipulationItem } = SimpleAI.makeMove(
                pieces,
                activePiece,
                maze,
                items,
                inventories,
                barriers,
            )

            // Aplica a decisão da IA: posiciona as peças e agenda a coleta do item "pisado".
            // Devolve a peça que mudou de casa (no máximo uma por chamada de makeMove).
            const applyMove = () => {
                setPieces(updatedPieces)
                const movedPiece = updatedPieces.find((p) => {
                    const old = previousPieces.find((q) => q.id === p.id)
                    return old && (old.position.x !== p.position.x || old.position.y !== p.position.y)
                })
                if (movedPiece) {
                    const old = previousPieces.find((q) => q.id === movedPiece.id)!
                    const delayMs =
                        pathLength(
                            old.position,
                            movedPiece.position,
                            maze,
                            blockedCellsFor(movedPiece.color, barriers, previousPieces),
                        ) *
                            STEP_MS +
                        ACTION_SETTLE_MS
                    schedulePickup(movedPiece.color, movedPiece.position, delayMs)
                    // A peça manipulada ainda vai caminhar até o destino: a câmera vai com ela
                    if (manipulationItem) {
                        holdFocus(delayMs)
                        walkEndsAtRef.current = Date.now() + delayMs
                    }
                }
                return movedPiece
            }

            // A jogada decidida: o ataque, ou o movimento puro
            const play = (record: (piece: string, actionKey: TextKey, target?: string) => void) => {
                const movedPiece = applyMove()
                if (pendingAttack) {
                    record(pendingAttack.attackerId, "toAttack", pendingAttack.targetId)
                    combat.resolveAttack(pendingAttack)
                    return
                }
                if (!movedPiece) return
                const { actionKey, target } = moveActionFor(movedPiece.position)
                record(movedPiece.id, actionKey, target)
            }

            // Manipulação: primeiro a moeda decide se a peça obedece. O item sai do inventário
            // na tentativa (falhando, cai de volta no tabuleiro) e a peça só age se a
            // manipulação pegar.
            if (manipulationItem) {
                removeFromInventory(color, manipulationItem)
                log.usedTo(color, manipulationItem, "toManipulate")
                combat.resolveManipulation(color, manipulationItem, (success) => {
                    if (success) play((piece, actionKey, target) => log.manipulatedTo(color, piece, actionKey, target))
                })
                return
            }

            play((piece, actionKey, target) => log.usedTo(color, piece, actionKey, target))
        }, Math.max(AI_STEP_MS, walkEndsAtRef.current - Date.now()))

        return () => clearTimeout(timer)
        // endTurn fecha sobre `turnIndex`/`pieces` (ambos nas deps), então a closure está sempre atualizada
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [turnIndex, round, pieces, isPlayerTurn, inventories, items, resolving, barriers])
}
