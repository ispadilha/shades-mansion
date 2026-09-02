import type { PieceDefinition, PieceColor, PiecePosition, SpecialItem, Inventories, SpecialItemKey } from "./types"
import { itemKeyColor } from "./types"
import { reachableCells, findApproachCell, lineOfFire, pathLength, distanceMap } from "./movement"
import { positionKey } from "./grid"
import { pickRandom } from "./random"
import type { Maze } from "./maze"
import { alliesInBlast, attackArea, type PendingAttack } from "./combat"
import { ACTION_SETTLE_MS, PIECE_STATS, STEP_MS, isRanged } from "../constants/rules"

export interface AIMoveResult {
    updatedPieces: PieceDefinition[]
    // Ataque decidido: quem chamou é que rola o dano, a defesa do alvo, e aplica o resultado
    pendingAttack?: PendingAttack
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
        activePiece: PieceDefinition,
        maze: Maze,
        items: SpecialItem[],
        inventories: Inventories,
    ): AIMoveResult {
        const color = activePiece.color
        const enemyPieces = pieces.filter((p) => p.color !== color)
        const myInv: SpecialItemKey[] = inventories[color]

        // Prioridade 1: usar item de manipulação para forçar um ataque vantajoso
        const manipulation = this.tryManipulationAttack(pieces, color, myInv, maze)
        if (manipulation) return manipulation

        // Prioridade 2: atacar qualquer inimigo no alcance
        const reach = this.findInRangeTargets(activePiece, enemyPieces, pieces, maze, color)
        if (reach.length > 0) {
            return this.buildAttack(activePiece, reach[0].target, reach[0].approach, pieces, maze)
        }

        // Prioridade 3: aproximar-se do item mais próximo (qualquer time)
        if (items.length > 0) {
            const result = this.moveTowardItem([activePiece], items, pieces, maze)
            if (result) return result
        }

        // Prioridade 4: movimento aleatório
        const possibleMoves = reachableCells(activePiece, pieces, maze, PIECE_STATS[activePiece.type].moveRange)
        if (possibleMoves.length > 0) {
            const randomMove = pickRandom(possibleMoves)
            const updatedPieces = pieces.map((p) =>
                p.id === activePiece.id ? { ...p, position: randomMove, movedThisTurn: true } : p,
            )
            return { updatedPieces }
        }

        // Sem ataque nem movimento possível: a peça está presa entre paredes e outras peças.
        // Ela passa a vez — do contrário o turno ficaria travado esperando uma ação que
        // nunca acontece.
        return { updatedPieces: pieces.map((p) => (p.id === activePiece.id ? { ...p, movedThisTurn: true } : p)) }
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

            // Alvos possíveis: qualquer peça que não seja da IA nem a própria peça manipulada
            const candidates = pieces.filter((p) => p.id !== manipulated.id && p.color !== color)
            const reach = this.findInRangeTargets(manipulated, candidates, pieces, maze, color)
            if (reach.length === 0) continue

            // Escolhe o alvo de menor HP (mais chance de eliminá-lo)
            const best = reach.reduce((acc, r) => (r.target.hp < acc.target.hp ? r : acc))

            const moveSteps = pathLength(manipulated.position, best.approach, maze)
            const area = attackArea(manipulated, best.target.position)
            // Ser manipulada é uma ação anormal: a peça se move e ataca sem gastar a ação
            // que ela ainda tem no próprio turno (movedThisTurn fica como está).
            const updatedPieces = pieces.map((p) =>
                p.id === manipulated.id ? { ...p, position: best.approach } : p,
            )
            return {
                updatedPieces,
                pendingAttack: {
                    attackerId: manipulated.id,
                    attackerType: manipulated.type,
                    targetId: best.target.id,
                    delayMs: moveSteps * STEP_MS + ACTION_SETTLE_MS,
                    ...(area ? { area } : {}),
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
        const area = attackArea(attacker, target.position)
        const updatedPieces = pieces.map((p) => (p.id === attacker.id ? { ...p, position: approach, movedThisTurn: true } : p))
        return {
            updatedPieces,
            pendingAttack: {
                attackerId: attacker.id,
                attackerType: attacker.type,
                targetId: target.id,
                delayMs: moveSteps * STEP_MS + ACTION_SETTLE_MS,
                ...(area ? { area } : {}),
            },
        }
    }

    // Alvos que "myPiece" consegue atingir agora, com a casa de onde o golpe sai.
    // `friendlyColor` é o time que a jogada não pode prejudicar: um ataque em área que
    // pegaria peças dessa cor é descartado, então a IA não queima as próprias peças —
    // nem ao manipular a incendiária de outro time.
    private static findInRangeTargets(
        myPiece: PieceDefinition,
        enemyPieces: PieceDefinition[],
        pieces: PieceDefinition[],
        maze: Maze,
        friendlyColor: PieceColor,
    ): Array<{ target: PieceDefinition; approach: PiecePosition }> {
        const range = PIECE_STATS[myPiece.type].attackRange
        const sparesAllies = (target: PieceDefinition) =>
            alliesInBlast(myPiece, target, pieces, maze, friendlyColor).length === 0

        if (isRanged(myPiece.type)) {
            const { targets } = lineOfFire(myPiece, pieces, maze, range)
            return targets
                .filter((target) => enemyPieces.some((e) => e.id === target.id))
                .filter(sparesAllies)
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
