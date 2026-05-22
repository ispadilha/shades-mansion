import type { PieceDefinition, PieceColor, PiecePosition, SpecialItem, Inventories, SpecialItemKey } from "./types"
import { itemKeyColor } from "./types"
import { reachableCells, manhattan, findApproachCell } from "./movement"
import { PIECE_STATS } from "../constants/gameRules"
import { STEP_MS } from "../game/BoardScene"

export interface PendingDamage {
    targetId: string
    damage: number
    delayMs: number
    // Preenchidos quando o dano vem de um item de manipulação — o item é consumido ao aplicar o dano
    consumedItemKey?: SpecialItemKey
    consumerColor?: PieceColor
}

export interface AIMoveResult {
    updatedPieces: PieceDefinition[]
    pendingDamage?: PendingDamage
}

export interface HealResult {
    pieces: PieceDefinition[]
    inventories: Inventories
    healed: boolean
}

export class SimpleAI {
    // Para cada peça ferida do time, gasta o item homônimo do inventário (id == key) para curar
    static applyHeals(pieces: PieceDefinition[], color: PieceColor, inventories: Inventories): HealResult {
        const teamInv = [...inventories[color]]
        let updatedPieces = pieces
        let healed = false

        for (const piece of pieces) {
            if (piece.color !== color || piece.hp >= piece.maxHp) continue
            const idx = teamInv.indexOf(piece.id as SpecialItemKey)
            if (idx === -1) continue

            teamInv.splice(idx, 1)
            updatedPieces = updatedPieces.map((p) => (p.id === piece.id ? { ...p, hp: p.maxHp } : p))
            healed = true
        }

        return { pieces: updatedPieces, inventories: { ...inventories, [color]: teamInv }, healed }
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
        const myInv: SpecialItemKey[] = inventories[color]

        // Prioridade 1: usar item de manipulação para forçar um ataque vantajoso
        const manipulation = this.tryManipulationAttack(pieces, color, myInv, boardSize)
        if (manipulation) return manipulation

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

    // Para cada item de manipulação no inventário, verifica se a peça correspondente
    // pode atacar alguém que NÃO seja do time da IA. Escolhe o alvo de menor HP
    // (mais chance de morte). Se nenhum item rende um ataque útil, retorna null.
    private static tryManipulationAttack(
        pieces: PieceDefinition[],
        color: PieceColor,
        myInv: SpecialItemKey[],
        boardSize: number,
    ): AIMoveResult | null {
        for (const itemKey of myInv) {
            if (itemKeyColor(itemKey) === color) continue
            const manipulated = pieces.find((p) => p.id === itemKey)
            if (!manipulated) continue

            const range = PIECE_STATS[manipulated.type].attackRange
            const damage = PIECE_STATS[manipulated.type].attackDamage

            let best: { target: PieceDefinition; approach: PiecePosition } | null = null
            for (const other of pieces) {
                if (other.id === manipulated.id) continue
                if (other.color === color) continue
                if (manhattan(manipulated.position, other.position) > range) continue
                const approach = findApproachCell(manipulated, other, pieces, boardSize)
                if (!approach) continue
                if (!best || other.hp < best.target.hp) {
                    best = { target: other, approach }
                }
            }

            if (!best) continue

            const moveSteps = manhattan(manipulated.position, best.approach)
            const updatedPieces = pieces.map((p) =>
                p.id === manipulated.id ? { ...p, position: best!.approach, movedThisTurn: true } : p,
            )
            return {
                updatedPieces,
                pendingDamage: {
                    targetId: best.target.id,
                    damage,
                    delayMs: moveSteps * STEP_MS + 50,
                    consumedItemKey: itemKey,
                    consumerColor: color,
                },
            }
        }
        return null
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
