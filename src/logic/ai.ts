import type { PieceDefinition, PieceColor, PiecePosition, SpecialItem, Inventories, SpecialItemKey, MainColor } from "./types"
import { reachableCells, manhattan, findApproachCell } from "./movement"
import { PIECE_STATS } from "../constants/gameRules"
import { STEP_MS } from "../game/BoardScene"

const isMainColor = (color: PieceColor): color is MainColor => color === "light" || color === "dark"

export interface PendingDamage {
    targetId: string
    damage: number
    delayMs: number
}

export interface PendingRecruit {
    targetId: string
    recruiter: MainColor
    delayMs: number
    consumedItemKey: SpecialItemKey
}

export interface AIMoveResult {
    updatedPieces: PieceDefinition[]
    pendingDamage?: PendingDamage
    pendingRecruit?: PendingRecruit
}

export interface HealResult {
    pieces: PieceDefinition[]
    inventories: Inventories
    healed: boolean
}

export class SimpleAI {
    static applyHeals(pieces: PieceDefinition[], color: PieceColor, inventories: Inventories): HealResult {
        const teamInv = [...inventories[color]]
        let updatedPieces = pieces
        let healed = false

        for (const piece of pieces) {
            if (piece.color !== color) continue
            if (piece.hp >= piece.maxHp) continue
            const healKey = piece.id as SpecialItemKey
            const idx = teamInv.indexOf(healKey)
            if (idx === -1) continue
            if (piece.id !== healKey) continue

            teamInv.splice(idx, 1)
            updatedPieces = updatedPieces.map((p) => (p.id === piece.id ? { ...p, hp: p.maxHp } : p))
            healed = true
        }

        return {
            pieces: updatedPieces,
            inventories: { ...inventories, [color]: teamInv },
            healed,
        }
    }

    static makeMove(
        pieces: PieceDefinition[],
        color: PieceColor,
        boardSize: number,
        items: SpecialItem[],
        inventories: Inventories,
    ): AIMoveResult {
        const myPieces = pieces.filter((p) => p.color === color && !p.movedThisTurn)
        const enemyPieces = pieces.filter((p) => p.color !== color)
        const teamIsMain = isMainColor(color)
        const myInv: SpecialItemKey[] = inventories[color]

        // Prioridade 1: recrutar (apenas times principais com item correspondente)
        if (teamIsMain) {
            for (const myPiece of myPieces) {
                for (const reach of this.findInRangeTargets(myPiece, enemyPieces, pieces, boardSize)) {
                    if (reach.target.color === "gray" && myInv.includes(reach.target.id as SpecialItemKey)) {
                        return this.buildRecruit(myPiece, reach.target, reach.approach, pieces, color, reach.target.id as SpecialItemKey)
                    }
                }
            }
        }

        // Prioridade 2: atacar qualquer inimigo no alcance
        for (const myPiece of myPieces) {
            const reach = this.findInRangeTargets(myPiece, enemyPieces, pieces, boardSize)
            if (reach.length > 0) {
                return this.buildAttack(myPiece, reach[0].target, reach[0].approach, pieces)
            }
        }

        // Prioridade 3: aproximar-se do item mais próximo (qualquer time)
        if (items.length > 0) {
            const result = this.moveTowardItem(myPieces, items, pieces, boardSize)
            if (result) return result
        }

        // Prioridade 4: movimento aleatório
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

    private static moveTowardItem(
        myPieces: PieceDefinition[],
        items: SpecialItem[],
        pieces: PieceDefinition[],
        boardSize: number,
    ): AIMoveResult | null {
        let bestPair: { piece: PieceDefinition; item: SpecialItem; distance: number } | null = null
        for (const myPiece of myPieces) {
            for (const item of items) {
                const d = manhattan(myPiece.position, item.position)
                if (!bestPair || d < bestPair.distance) {
                    bestPair = { piece: myPiece, item, distance: d }
                }
            }
        }
        if (!bestPair || bestPair.distance === 0) return null

        const moveRange = PIECE_STATS[bestPair.piece.type].moveRange
        const reachable = reachableCells(bestPair.piece, pieces, boardSize, moveRange).filter(
            (pos) => !pieces.some((p) => p.position.x === pos.x && p.position.y === pos.y && p.id !== bestPair!.piece.id),
        )
        if (reachable.length === 0) return null

        const target = bestPair.item.position
        let bestCell = reachable[0]
        let bestDist = manhattan(bestCell, target)
        for (const c of reachable.slice(1)) {
            const d = manhattan(c, target)
            if (d < bestDist) {
                bestCell = c
                bestDist = d
            }
        }

        if (bestDist >= bestPair.distance) return null

        const updatedPieces = pieces.map((p) => (p.id === bestPair!.piece.id ? { ...p, position: bestCell, movedThisTurn: true } : p))
        return { updatedPieces }
    }

    private static buildAttack(
        attacker: PieceDefinition,
        target: PieceDefinition,
        approach: PiecePosition,
        pieces: PieceDefinition[],
    ): AIMoveResult {
        const moveSteps = manhattan(attacker.position, approach)
        const damage = PIECE_STATS[attacker.type].attackDamage
        const updatedPieces = pieces.map((p) => (p.id === attacker.id ? { ...p, position: approach, movedThisTurn: true } : p))
        return {
            updatedPieces,
            pendingDamage: {
                targetId: target.id,
                damage,
                delayMs: moveSteps * STEP_MS + 50,
            },
        }
    }

    private static buildRecruit(
        recruiter: PieceDefinition,
        target: PieceDefinition,
        approach: PiecePosition,
        pieces: PieceDefinition[],
        recruiterColor: MainColor,
        itemKey: SpecialItemKey,
    ): AIMoveResult {
        const moveSteps = manhattan(recruiter.position, approach)
        const updatedPieces = pieces.map((p) => (p.id === recruiter.id ? { ...p, position: approach, movedThisTurn: true } : p))
        return {
            updatedPieces,
            pendingRecruit: {
                targetId: target.id,
                recruiter: recruiterColor,
                delayMs: moveSteps * STEP_MS + 50,
                consumedItemKey: itemKey,
            },
        }
    }

    private static findInRangeTargets(
        myPiece: PieceDefinition,
        enemyPieces: PieceDefinition[],
        pieces: PieceDefinition[],
        boardSize: number,
    ): Array<{ target: PieceDefinition; approach: PiecePosition }> {
        const range = PIECE_STATS[myPiece.type].attackRange
        const result: Array<{ target: PieceDefinition; approach: PiecePosition }> = []
        for (const enemy of enemyPieces) {
            if (manhattan(myPiece.position, enemy.position) > range) continue
            const approach = findApproachCell(myPiece, enemy, pieces, boardSize)
            if (approach) result.push({ target: enemy, approach })
        }
        return result
    }
}
