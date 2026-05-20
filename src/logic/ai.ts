import type { PieceDefinition, PieceColor, PiecePosition } from "./types"
import { reachableCells, manhattan, findApproachCell } from "./movement"
import { PIECE_STATS } from "../constants/gameRules"
import { STEP_MS } from "../game/BoardScene"

export interface PendingDamage {
    targetId: string
    damage: number
    delayMs: number
}

export class SimpleAI {
    static makeMove(
        pieces: PieceDefinition[],
        color: PieceColor,
        boardSize: number,
    ): { updatedPieces: PieceDefinition[]; pendingDamage?: PendingDamage } {
        const enemyColor = color === "light" ? "dark" : "light"
        const myPieces = pieces.filter((p) => p.color === color && !p.movedThisTurn)
        const enemyPieces = pieces.filter((p) => p.color === enemyColor)

        // Tentar atacar primeiro
        for (const myPiece of myPieces) {
            const found = this.findAttackTarget(myPiece, enemyPieces, pieces, boardSize)
            if (found) {
                const { target, approach } = found
                const moveSteps = manhattan(myPiece.position, approach)
                const damage = PIECE_STATS[myPiece.type].attackDamage

                const updatedPieces = pieces.map((p) => (p.id === myPiece.id ? { ...p, position: approach, movedThisTurn: true } : p))

                return {
                    updatedPieces,
                    pendingDamage: {
                        targetId: target.id,
                        damage,
                        delayMs: moveSteps * STEP_MS + 50,
                    },
                }
            }
        }

        // Se não pode atacar, mover aleatoriamente
        for (const myPiece of myPieces) {
            const possibleMoves = reachableCells(myPiece, pieces, boardSize, PIECE_STATS[myPiece.type].moveRange).filter(
                (pos) => !pieces.some((p) => p.position.x === pos.x && p.position.y === pos.y),
            )

            if (possibleMoves.length > 0) {
                const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)]
                const updatedPieces = pieces.map((p) => (p.id === myPiece.id ? { ...p, position: randomMove, movedThisTurn: true } : p))

                return { updatedPieces }
            }
        }

        return { updatedPieces: pieces }
    }

    private static findAttackTarget(
        myPiece: PieceDefinition,
        enemyPieces: PieceDefinition[],
        pieces: PieceDefinition[],
        boardSize: number,
    ): { target: PieceDefinition; approach: PiecePosition } | null {
        const range = PIECE_STATS[myPiece.type].attackRange
        for (const enemy of enemyPieces) {
            if (manhattan(myPiece.position, enemy.position) > range) continue
            const approach = findApproachCell(myPiece, enemy, pieces, boardSize)
            if (approach) return { target: enemy, approach }
        }
        return null
    }
}
