import type { PieceDefinition, PieceColor, PiecePosition, SpecialItem, Inventories, SpecialItemKey } from "./types"
import { itemKeyColor } from "./types"
import { reachableCells, findApproachCell, lineOfFire, pathLength, distanceMap, positionKey } from "./movement"
import type { Maze } from "./maze"
import { PIECE_STATS, isRanged } from "../constants/gameRules"
import { STEP_MS } from "../game/BoardScene"

export interface PendingDamage {
    attackerId: string
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
        maze: Maze,
        items: SpecialItem[],
        inventories: Inventories,
    ): AIMoveResult {
        const myPieces = pieces.filter((p) => p.color === color && !p.movedThisTurn)
        const enemyPieces = pieces.filter((p) => p.color !== color)
        const myInv: SpecialItemKey[] = inventories[color]

        // Prioridade 1: usar item de manipulação para forçar um ataque vantajoso
        const manipulation = this.tryManipulationAttack(pieces, color, myInv, maze)
        if (manipulation) return manipulation

        // Prioridade 2: atacar qualquer inimigo no alcance
        for (const myPiece of myPieces) {
            const reach = this.findInRangeTargets(myPiece, enemyPieces, pieces, maze)
            if (reach.length > 0) {
                return this.buildAttack(myPiece, reach[0].target, reach[0].approach, pieces, maze)
            }
        }

        // Prioridade 3: aproximar-se do item mais próximo (qualquer time)
        if (items.length > 0) {
            const result = this.moveTowardItem(myPieces, items, pieces, maze)
            if (result) return result
        }

        // Prioridade 4: movimento aleatório
        for (const myPiece of myPieces) {
            const possibleMoves = reachableCells(myPiece, pieces, maze, PIECE_STATS[myPiece.type].moveRange)
            if (possibleMoves.length > 0) {
                const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)]
                const updatedPieces = pieces.map((p) => (p.id === myPiece.id ? { ...p, position: randomMove, movedThisTurn: true } : p))
                return { updatedPieces }
            }
        }

        // Sem ataque nem movimento possível: as peças restantes estão presas entre paredes
        // e outras peças. Elas passam a vez — do contrário o turno da IA ficaria travado
        // esperando uma ação que nunca acontece.
        if (myPieces.length > 0) {
            return { updatedPieces: pieces.map((p) => (p.color === color ? { ...p, movedThisTurn: true } : p)) }
        }

        return { updatedPieces: pieces }
    }

    // Para cada item de manipulação no inventário, verifica se a peça correspondente
    // pode atacar alguém que NÃO seja do time da IA. Escolhe o alvo de menor HP
    // (mais chance de eliminar). Se nenhum item rende um ataque útil, retorna null.
    private static tryManipulationAttack(
        pieces: PieceDefinition[],
        color: PieceColor,
        myInv: SpecialItemKey[],
        maze: Maze,
    ): AIMoveResult | null {
        for (const itemKey of myInv) {
            if (itemKeyColor(itemKey) === color) continue
            const manipulated = pieces.find((p) => p.id === itemKey)
            if (!manipulated) continue

            const damage = PIECE_STATS[manipulated.type].attackDamage

            // Alvos possíveis: qualquer peça que não seja da IA nem a própria peça manipulada
            const candidates = pieces.filter((p) => p.id !== manipulated.id && p.color !== color)
            const reach = this.findInRangeTargets(manipulated, candidates, pieces, maze)
            if (reach.length === 0) continue

            // Escolhe o alvo de menor HP (mais chance de eliminá-lo)
            const best = reach.reduce((acc, r) => (r.target.hp < acc.target.hp ? r : acc))

            const moveSteps = pathLength(manipulated.position, best.approach, maze)
            const updatedPieces = pieces.map((p) =>
                p.id === manipulated.id ? { ...p, position: best.approach, movedThisTurn: true } : p,
            )
            return {
                updatedPieces,
                pendingDamage: {
                    attackerId: manipulated.id,
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
        maze: Maze,
    ): AIMoveResult | null {
        let bestPair: { piece: PieceDefinition; distances: Map<string, number>; distance: number } | null = null
        for (const item of items) {
            const distances = distanceMap(item.position, maze)
            for (const myPiece of myPieces) {
                const d = distances.get(positionKey(myPiece.position))
                if (d === undefined) continue
                if (!bestPair || d < bestPair.distance) bestPair = { piece: myPiece, distances, distance: d }
            }
        }
        if (!bestPair || bestPair.distance === 0) return null

        const { piece, distances, distance } = bestPair
        const reachable = reachableCells(piece, pieces, maze, PIECE_STATS[piece.type].moveRange)
        if (reachable.length === 0) return null

        let bestCell = reachable[0]
        let bestDist = distances.get(positionKey(bestCell)) ?? Infinity
        for (const cell of reachable.slice(1)) {
            const d = distances.get(positionKey(cell)) ?? Infinity
            if (d < bestDist) {
                bestCell = cell
                bestDist = d
            }
        }

        if (bestDist >= distance) return null

        const updatedPieces = pieces.map((p) => (p.id === piece.id ? { ...p, position: bestCell, movedThisTurn: true } : p))
        return { updatedPieces }
    }

    private static buildAttack(
        attacker: PieceDefinition,
        target: PieceDefinition,
        approach: PiecePosition,
        pieces: PieceDefinition[],
        maze: Maze,
    ): AIMoveResult {
        const moveSteps = pathLength(attacker.position, approach, maze)
        const damage = PIECE_STATS[attacker.type].attackDamage
        const updatedPieces = pieces.map((p) => (p.id === attacker.id ? { ...p, position: approach, movedThisTurn: true } : p))
        return {
            updatedPieces,
            pendingDamage: {
                attackerId: attacker.id,
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
        maze: Maze,
    ): Array<{ target: PieceDefinition; approach: PiecePosition }> {
        const range = PIECE_STATS[myPiece.type].attackRange

        if (isRanged(myPiece.type)) {
            const { targets } = lineOfFire(myPiece, pieces, maze, range)
            return targets
                .filter((target) => enemyPieces.some((e) => e.id === target.id))
                .map((target) => ({ target, approach: myPiece.position }))
        }

        const result: Array<{ target: PieceDefinition; approach: PiecePosition }> = []
        for (const enemy of enemyPieces) {
            const approach = findApproachCell(myPiece, enemy, pieces, maze, range)
            if (approach) result.push({ target: enemy, approach })
        }
        return result
    }
}
