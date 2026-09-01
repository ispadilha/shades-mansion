import { useEffect, useRef } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { Inventories, PieceColor, PieceDefinition, PiecePosition, SpecialItem, SpecialItemKey, TextKey } from "../logic/types"
import type { Maze } from "../logic/maze"
import { pathLength } from "../logic/movement"
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
    items: SpecialItem[]
    inventories: Inventories
    setInventories: Dispatch<SetStateAction<Inventories>>
    maze: Maze
    // Uma rolagem em andamento trava a IA até o resultado sair
    resolving: boolean
    endTurn: () => void
    // Agenda a coleta do item pisado, para acontecer quando a peça chegar na casa
    schedulePickup: (color: PieceColor, position: PiecePosition, delayMs: number) => void
    // Diz se o destino tem item: é o que separa "mover" de "coletar" no log
    moveActionFor: (position: PiecePosition) => { actionKey: TextKey; target?: string }
    removeFromInventory: (color: PieceColor, key: SpecialItemKey) => void
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
    resolving,
    endTurn,
    schedulePickup,
    moveActionFor,
    removeFromInventory,
    combat,
    log,
}: AiTurnOptions) => {
    // Turno em que a fase de cura já foi resolvida (ela acontece uma vez por turno)
    const healPhaseDoneRef = useRef<string | null>(null)

    useEffect(() => {
        if (!activePiece) return
        if (isPlayerTurn) {
            healPhaseDoneRef.current = null
            return
        }
        if (resolving) return

        const turnKey = `${round}-${turnIndex}`
        const color = activePiece.color

        // Fase de cura: no começo do turno, o time da peça da vez gasta os itens que tem
        // para curar suas peças (uma vez por turno)
        if (healPhaseDoneRef.current !== turnKey) {
            const heal = SimpleAI.applyHeals(pieces, color, inventories)
            healPhaseDoneRef.current = turnKey
            if (heal.healed) {
                for (const p of pieces) {
                    const after = heal.pieces.find((q) => q.id === p.id)
                    if (after && after.hp > p.hp) log.healed(color, p.id)
                }
                setPieces(heal.pieces)
                setInventories(heal.inventories)
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
            const { updatedPieces, pendingAttack } = SimpleAI.makeMove(pieces, activePiece, maze, items, inventories)

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
                    const delayMs = pathLength(old.position, movedPiece.position, maze) * STEP_MS + ACTION_SETTLE_MS
                    schedulePickup(movedPiece.color, movedPiece.position, delayMs)
                }
                return movedPiece
            }

            if (pendingAttack) {
                const forced =
                    pendingAttack.consumedItemKey && pendingAttack.consumerColor
                        ? { itemKey: pendingAttack.consumedItemKey, color: pendingAttack.consumerColor }
                        : null

                // Ataque forçado por item: primeiro a moeda decide se a peça obedece. O item
                // é gasto na tentativa e a peça só sai do lugar se a manipulação pegar.
                if (forced) {
                    removeFromInventory(forced.color, forced.itemKey)
                    log.usedTo(forced.color, forced.itemKey, "toManipulate")
                    combat.resolveManipulation(forced.color, forced.itemKey, (success) => {
                        if (!success) return
                        applyMove()
                        log.manipulatedTo(forced.color, pendingAttack.attackerId, "toAttack", pendingAttack.targetId)
                        combat.resolveAttack(pendingAttack)
                    })
                    return
                }

                applyMove()
                log.usedTo(color, pendingAttack.attackerId, "toAttack", pendingAttack.targetId)
                combat.resolveAttack(pendingAttack)
                return
            }

            // Movimento puro (sem ataque pendente): loga mover ou coletar baseado no destino
            const movedPiece = applyMove()
            if (movedPiece) {
                const { actionKey, target } = moveActionFor(movedPiece.position)
                log.usedTo(movedPiece.color, movedPiece.id, actionKey, target)
            }
        }, AI_STEP_MS)

        return () => clearTimeout(timer)
        // endTurn fecha sobre `turnIndex`/`pieces` (ambos nas deps), então a closure está sempre atualizada
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [turnIndex, round, pieces, isPlayerTurn, inventories, items, resolving])
}
