import type {
    Barrier,
    PieceDefinition,
    PieceColor,
    PiecePosition,
    MotivationItem,
    Inventories,
    MotivationItemKey,
} from "./types"
import { reinvigorated, itemUseFor, promoted, type ItemUse } from "./items"
import { itemKeyColor } from "./types"
import { reachableCells, findApproachCell, canHitTarget, pathLength, distanceMap, type Strike } from "./movement"
import { blockedCellsFor, includesPosition, type BlockedCells } from "./grid"
import { positionKey } from "./grid"
import { pickRandom } from "./random"
import type { Maze } from "./maze"
import { attackArea, friendlyFire, mayAttack, type PendingAttack } from "./combat"
import { isProtected } from "./barriers"
import { damageOf, hasRangedAttackSkill, skillFor, skillRangeOf } from "./skills"
import { ACTION_SETTLE_MS, STEP_MS, statsFor } from "../constants/rules"

export interface AIMoveResult {
    updatedPieces: PieceDefinition[]
    // Ataque decidido: quem chamou é que rola o dano, as defesas, e aplica o resultado
    pendingAttack?: PendingAttack
    // Item gasto em uma manipulação: quem age é a peça dele, se a moeda deixar
    manipulationItem?: MotivationItemKey
}

// O que o time fez com os próprios itens no começo do turno
export interface ItemPhaseResult {
    pieces: PieceDefinition[]
    inventories: Inventories
    uses: Array<{ pieceId: string; use: ItemUse; level: number }>
}

// Um item de manipulação do time, e a peça de outro time que ele comanda
interface Manipulable {
    itemKey: MotivationItemKey
    piece: PieceDefinition
}

export class SimpleAI {
    // Gasta os itens do time nas próprias peças
    static applyOwnItems(pieces: PieceDefinition[], color: PieceColor, inventories: Inventories): ItemPhaseResult {
        const teamInv = [...inventories[color]]
        let updatedPieces = pieces
        const uses: ItemPhaseResult["uses"] = []

        for (const piece of pieces) {
            if (piece.color !== color) continue
            const key = piece.id as MotivationItemKey
            const idx = teamInv.indexOf(key)
            if (idx === -1) continue

            const use = itemUseFor(key, piece, color)
            if (use !== "reinvigorate" && use !== "promote") continue

            teamInv.splice(idx, 1)
            const after = use === "reinvigorate" ? reinvigorated(piece) : promoted(piece)
            updatedPieces = updatedPieces.map((p) => (p.id === piece.id ? after : p))
            uses.push({ pieceId: piece.id, use, level: after.level })
        }

        return { pieces: updatedPieces, inventories: { ...inventories, [color]: teamInv }, uses }
    }

    static makeMove(
        pieces: PieceDefinition[],
        activePiece: PieceDefinition,
        maze: Maze,
        items: MotivationItem[],
        inventories: Inventories,
        barriers: Barrier[],
    ): AIMoveResult {
        const color = activePiece.color
        // As barreiras dos outros times fecham caminho para as peças deste
        const blocked = blockedCellsFor(color, barriers, pieces)
        const manipulable = this.manipulableWith(inventories[color], color, pieces)

        // Prioridade 1: manipular uma peça de outro time contra o terceiro
        const againstThird = this.manipulateAgainstThirdTeam(manipulable, color, pieces, maze, barriers, items)
        if (againstThird) return againstThird

        // Prioridade 2: atacar qualquer inimigo no alcance
        const reach = this.findInRangeTargets(activePiece, color, pieces, maze, barriers, items)
        if (reach.length > 0) {
            return this.buildAttack(activePiece, reach[0].target, reach[0].approach, pieces, maze, barriers, null)
        }

        // Prioridade 3: sem alvo, trazer uma peça manipulada até onde a peça da vez a ataca
        const lure = this.lureIntoReach(activePiece, manipulable, pieces, maze, barriers, items)
        if (lure) return lure

        // Prioridade 4: aproximar-se do item mais próximo (qualquer time)
        const towardItem = this.stepToward(activePiece, items.map((item) => item.position), pieces, maze, blocked)
        if (towardItem) return { updatedPieces: this.moved(pieces, activePiece.id, towardItem, true) }

        // Prioridade 5: movimento aleatório
        const possibleMoves = reachableCells(
            activePiece,
            pieces,
            maze,
            statsFor(activePiece.type, activePiece.level).moveRange,
            blocked,
        )
        if (possibleMoves.length > 0) {
            return { updatedPieces: this.moved(pieces, activePiece.id, pickRandom(possibleMoves), true) }
        }

        // Sem ataque nem movimento possível: a peça está presa entre paredes e outras peças.
        // Ela passa a vez — do contrário o turno ficaria travado esperando uma ação que
        // nunca acontece.
        return { updatedPieces: pieces.map((p) => (p.id === activePiece.id ? { ...p, movedThisTurn: true, usedSkillThisTurn: true } : p)) }
    }

    // Os itens de manipulação do time, cada um com a peça que ele comanda
    private static manipulableWith(
        inventory: MotivationItemKey[],
        color: PieceColor,
        pieces: PieceDefinition[],
    ): Manipulable[] {
        return inventory.flatMap((itemKey) => {
            const piece = itemKeyColor(itemKey) === color ? undefined : pieces.find((p) => p.id === itemKey)
            return piece ? [{ itemKey, piece }] : []
        })
    }

    // Manipular é jogar os dois times adversários um contra o outro.
    // A peça manipulada ataca o terceiro time, no alvo de menor vigor (mais chance de
    // tirá-lo da mansão). Se nenhum item deixa atacar, uma delas anda na direção do
    // terceiro time, como isca. Null quando nenhum item serve para nada disso.
    private static manipulateAgainstThirdTeam(
        manipulable: Manipulable[],
        color: PieceColor,
        pieces: PieceDefinition[],
        maze: Maze,
        barriers: Barrier[],
        items: MotivationItem[],
    ): AIMoveResult | null {
        for (const { itemKey, piece } of manipulable) {
            const reach = this.findInRangeTargets(piece, color, pieces, maze, barriers, items)
            if (reach.length === 0) continue
            const best = reach.reduce((acc, r) => (r.target.vigor < acc.target.vigor ? r : acc))
            return {
                ...this.buildAttack(piece, best.target, best.approach, pieces, maze, barriers, color),
                manipulationItem: itemKey,
            }
        }

        // A isca não para em casa com item: pisar nela daria o item ao time da peça
        const itemCells = items.map((item) => item.position)
        for (const { itemKey, piece } of manipulable) {
            const thirdTeam = pieces.filter((p) => mayAttack(piece, p, color)).map((p) => p.position)
            const blocked = blockedCellsFor(piece.color, barriers, pieces)
            const step = this.stepToward(piece, thirdTeam, pieces, maze, blocked, itemCells)
            if (step) return { updatedPieces: this.moved(pieces, piece.id, step, false), manipulationItem: itemKey }
        }

        return null
    }

    // A isca para o próprio time: a peça manipulada anda até onde a peça da vez consegue
    // atacá-la, e o ataque vem logo em seguida, na mesma vez. Vai a de menor vigor entre as
    // que dá para atrair, pelo caminho mais curto. Null quando nenhuma chega ao alcance.
    private static lureIntoReach(
        activePiece: PieceDefinition,
        manipulable: Manipulable[],
        pieces: PieceDefinition[],
        maze: Maze,
        barriers: Barrier[],
        items: MotivationItem[],
    ): AIMoveResult | null {
        const itemCells = items.map((item) => item.position)
        const weakestFirst = [...manipulable].sort((a, b) => a.piece.vigor - b.piece.vigor)

        for (const { itemKey, piece } of weakestFirst) {
            const blocked = blockedCellsFor(piece.color, barriers, pieces)
            const range = statsFor(piece.type, piece.level).moveRange
            for (const cell of reachableCells(piece, pieces, maze, range, blocked)) {
                if (includesPosition(itemCells, cell)) continue
                // O tabuleiro como fica com ela ali: a peça da vez consegue atacá-la?
                const board = this.moved(pieces, piece.id, cell, false)
                const lured = { ...piece, position: cell }
                if (this.strikeFrom(activePiece, lured, activePiece.color, board, maze, barriers, items) === null) continue
                return { updatedPieces: board, manipulationItem: itemKey }
            }
        }

        return null
    }

    // A casa, entre as que a peça alcança andando nesta vez, que mais a aproxima de algum
    // dos destinos. As casas de `avoid` ficam de fora. Null se nenhuma a deixa mais perto.
    private static stepToward(
        piece: PieceDefinition,
        goals: PiecePosition[],
        pieces: PieceDefinition[],
        maze: Maze,
        blocked: BlockedCells,
        avoid: PiecePosition[] = [],
    ): PiecePosition | null {
        const maps = goals.map((goal) => distanceMap(goal, maze, blocked))
        const distanceTo = (cell: PiecePosition) =>
            Math.min(...maps.map((distances) => distances.get(positionKey(cell)) ?? Infinity))

        let best: { cell: PiecePosition | null; distance: number } = { cell: null, distance: distanceTo(piece.position) }
        const range = statsFor(piece.type, piece.level).moveRange
        for (const cell of reachableCells(piece, pieces, maze, range, blocked)) {
            if (includesPosition(avoid, cell)) continue
            const distance = distanceTo(cell)
            if (distance < best.distance) best = { cell, distance }
        }
        return best.cell
    }

    // As peças depois que uma delas vai para outra casa. Na própria vez, isso gasta o turno dela.
    // Manipulada, não gasta nada: ser manipulada é uma ação anormal, e a peça continua com a
    // ação dela quando chegar a vez.
    private static moved(
        pieces: PieceDefinition[],
        pieceId: string,
        position: PiecePosition,
        spendsTurn: boolean,
    ): PieceDefinition[] {
        return pieces.map((p) => {
            if (p.id !== pieceId) return p
            return spendsTurn ? { ...p, position, movedThisTurn: true, usedSkillThisTurn: true } : { ...p, position }
        })
    }

    // A habilidade de alcance da peça, quando ela tem uma.
    // É com ela que a IA atira. A IA não abre lista de habilidades, ela já escolhe a melhor ação,
    // e é dela que vêm o alcance e o dano do tiro.
    // Sem isso a atiradora da IA acertaria menos longe e mais fraco que a do jogador.
    private static rangedSkillOf(piece: PieceDefinition) {
        return hasRangedAttackSkill(piece.type) ? skillFor(piece.type) : null
    }

    // `manipulatedBy` é o time que manipula o atacante, quando é o caso
    private static buildAttack(
        attacker: PieceDefinition,
        target: PieceDefinition,
        approach: PiecePosition,
        pieces: PieceDefinition[],
        maze: Maze,
        barriers: Barrier[],
        manipulatedBy: PieceColor | null,
    ): AIMoveResult {
        const moveSteps = pathLength(attacker.position, approach, maze, blockedCellsFor(attacker.color, barriers, pieces))
        const area = attackArea(attacker, this.rangedSkillOf(attacker), target.position)
        return {
            updatedPieces: this.moved(pieces, attacker.id, approach, manipulatedBy === null),
            pendingAttack: {
                attackerId: attacker.id,
                damageDice: damageOf(attacker, this.rangedSkillOf(attacker)),
                targetId: target.id,
                delayMs: moveSteps * STEP_MS + ACTION_SETTLE_MS,
                ...(area ? { area } : {}),
                ...(manipulatedBy ? { manipulatedBy } : {}),
            },
        }
    }

    // De onde "myPiece" golpeia "target" agora: a casa a que ela chega andando, ou a própria
    // casa quando atira. Null quando não dá.
    // `commander` é quem manda no golpe: o time da peça, ou quem a manipula. Só vale alvo que
    // ela pode atacar e que não esteja protegido por barreira, e um incêndio que pegaria
    // alguém que ela não pode atacar é descartado.
    private static strikeFrom(
        myPiece: PieceDefinition,
        target: PieceDefinition,
        commander: PieceColor,
        pieces: PieceDefinition[],
        maze: Maze,
        barriers: Barrier[],
        items: MotivationItem[],
    ): PiecePosition | null {
        if (!mayAttack(myPiece, target, commander) || isProtected(target, barriers)) return null
        if (friendlyFire(myPiece, target, pieces, maze, commander, barriers).length > 0) return null

        const skill = this.rangedSkillOf(myPiece)
        if (skill) {
            const sight = { barriers, blockedBy: skill.blockedBy }
            const shot: Strike = { ranged: true, range: skillRangeOf(skill, myPiece) ?? 0, sight }
            return canHitTarget(myPiece, target, pieces, maze, shot) ? myPiece.position : null
        }
        const walkRange = statsFor(myPiece.type, myPiece.level).moveRange
        const blocked = blockedCellsFor(myPiece.color, barriers, pieces)
        return findApproachCell(myPiece, target, pieces, items, maze, walkRange, blocked)
    }

    // Alvos que "myPiece" consegue atingir agora, com a casa de onde o golpe sai
    private static findInRangeTargets(
        myPiece: PieceDefinition,
        commander: PieceColor,
        pieces: PieceDefinition[],
        maze: Maze,
        barriers: Barrier[],
        items: MotivationItem[],
    ): Array<{ target: PieceDefinition; approach: PiecePosition }> {
        return pieces.flatMap((target) => {
            const approach = this.strikeFrom(myPiece, target, commander, pieces, maze, barriers, items)
            return approach ? [{ target, approach }] : []
        })
    }
}
