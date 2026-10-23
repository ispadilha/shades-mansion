import type {
    Barrier,
    CharacterDefinition,
    CharacterColor,
    CharacterPosition,
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
    updatedCharacters: CharacterDefinition[]
    // Ataque decidido: quem chamou é que rola o dano, as defesas, e aplica o resultado
    pendingAttack?: PendingAttack
    // Item gasto em uma manipulação: quem age é a personagem dele, se a moeda deixar
    manipulationItem?: MotivationItemKey
}

// O que o time fez com os próprios itens no começo do turno
export interface ItemPhaseResult {
    characters: CharacterDefinition[]
    inventories: Inventories
    uses: Array<{ characterId: string; use: ItemUse; level: number }>
}

// Um item de manipulação do time, e a personagem de outro time que ele comanda
interface Manipulable {
    itemKey: MotivationItemKey
    character: CharacterDefinition
}

export class SimpleAI {
    // Gasta os itens do time nas próprias personagens
    static applyOwnItems(characters: CharacterDefinition[], color: CharacterColor, inventories: Inventories): ItemPhaseResult {
        const teamInv = [...inventories[color]]
        let updatedCharacters = characters
        const uses: ItemPhaseResult["uses"] = []

        for (const character of characters) {
            if (character.color !== color) continue
            const key = character.id as MotivationItemKey
            const idx = teamInv.indexOf(key)
            if (idx === -1) continue

            const use = itemUseFor(key, character, color)
            if (use !== "reinvigorate" && use !== "promote") continue

            teamInv.splice(idx, 1)
            const after = use === "reinvigorate" ? reinvigorated(character) : promoted(character)
            updatedCharacters = updatedCharacters.map((p) => (p.id === character.id ? after : p))
            uses.push({ characterId: character.id, use, level: after.level })
        }

        return { characters: updatedCharacters, inventories: { ...inventories, [color]: teamInv }, uses }
    }

    static makeMove(
        characters: CharacterDefinition[],
        activeCharacter: CharacterDefinition,
        maze: Maze,
        items: MotivationItem[],
        inventories: Inventories,
        barriers: Barrier[],
    ): AIMoveResult {
        const color = activeCharacter.color
        // As barreiras dos outros times fecham caminho para as personagens deste
        const blocked = blockedCellsFor(color, barriers, characters)
        const manipulable = this.manipulableWith(inventories[color], color, characters)

        // Prioridade 1: manipular uma personagem de outro time contra o terceiro
        const againstThird = this.manipulateAgainstThirdTeam(manipulable, color, characters, maze, barriers, items)
        if (againstThird) return againstThird

        // Prioridade 2: atacar qualquer inimigo no alcance
        const reach = this.findInRangeTargets(activeCharacter, color, characters, maze, barriers, items)
        if (reach.length > 0) {
            return this.buildAttack(activeCharacter, reach[0].target, reach[0].approach, characters, maze, barriers, null)
        }

        // Prioridade 3: sem alvo, trazer uma personagem manipulada até onde a personagem da vez a ataca
        const lure = this.lureIntoReach(activeCharacter, manipulable, characters, maze, barriers, items)
        if (lure) return lure

        // Prioridade 4: aproximar-se do item mais próximo (qualquer time)
        const towardItem = this.stepToward(activeCharacter, items.map((item) => item.position), characters, maze, blocked)
        if (towardItem) return { updatedCharacters: this.moved(characters, activeCharacter.id, towardItem, true) }

        // Prioridade 5: movimento aleatório
        const possibleMoves = reachableCells(
            activeCharacter,
            characters,
            maze,
            statsFor(activeCharacter.type, activeCharacter.level).moveRange,
            blocked,
        )
        if (possibleMoves.length > 0) {
            return { updatedCharacters: this.moved(characters, activeCharacter.id, pickRandom(possibleMoves), true) }
        }

        // Sem ataque nem movimento possível: a personagem está presa entre paredes e outras personagens.
        // Ela passa a vez — do contrário o turno ficaria travado esperando uma ação que
        // nunca acontece.
        return { updatedCharacters: characters.map((p) => (p.id === activeCharacter.id ? { ...p, movedThisTurn: true, usedSkillThisTurn: true } : p)) }
    }

    // Os itens de manipulação do time, cada um com a personagem que ele comanda
    private static manipulableWith(
        inventory: MotivationItemKey[],
        color: CharacterColor,
        characters: CharacterDefinition[],
    ): Manipulable[] {
        return inventory.flatMap((itemKey) => {
            const character = itemKeyColor(itemKey) === color ? undefined : characters.find((p) => p.id === itemKey)
            return character ? [{ itemKey, character }] : []
        })
    }

    // Manipular é jogar os dois times adversários um contra o outro.
    // A personagem manipulada ataca o terceiro time, no alvo de menor vigor (mais chance de
    // tirá-lo da mansão). Se nenhum item deixa atacar, uma delas anda na direção do
    // terceiro time, como isca. Null quando nenhum item serve para nada disso.
    private static manipulateAgainstThirdTeam(
        manipulable: Manipulable[],
        color: CharacterColor,
        characters: CharacterDefinition[],
        maze: Maze,
        barriers: Barrier[],
        items: MotivationItem[],
    ): AIMoveResult | null {
        for (const { itemKey, character } of manipulable) {
            const reach = this.findInRangeTargets(character, color, characters, maze, barriers, items)
            if (reach.length === 0) continue
            const best = reach.reduce((acc, r) => (r.target.vigor < acc.target.vigor ? r : acc))
            return {
                ...this.buildAttack(character, best.target, best.approach, characters, maze, barriers, color),
                manipulationItem: itemKey,
            }
        }

        // A isca não para em casa com item: pisar nela daria o item ao time da personagem
        const itemCells = items.map((item) => item.position)
        for (const { itemKey, character } of manipulable) {
            const thirdTeam = characters.filter((p) => mayAttack(character, p, color)).map((p) => p.position)
            const blocked = blockedCellsFor(character.color, barriers, characters)
            const step = this.stepToward(character, thirdTeam, characters, maze, blocked, itemCells)
            if (step) return { updatedCharacters: this.moved(characters, character.id, step, false), manipulationItem: itemKey }
        }

        return null
    }

    // A isca para o próprio time: a personagem manipulada anda até onde a personagem da vez consegue
    // atacá-la, e o ataque vem logo em seguida, na mesma vez. Vai a de menor vigor entre as
    // que dá para atrair, pelo caminho mais curto. Null quando nenhuma chega ao alcance.
    private static lureIntoReach(
        activeCharacter: CharacterDefinition,
        manipulable: Manipulable[],
        characters: CharacterDefinition[],
        maze: Maze,
        barriers: Barrier[],
        items: MotivationItem[],
    ): AIMoveResult | null {
        const itemCells = items.map((item) => item.position)
        const weakestFirst = [...manipulable].sort((a, b) => a.character.vigor - b.character.vigor)

        for (const { itemKey, character } of weakestFirst) {
            const blocked = blockedCellsFor(character.color, barriers, characters)
            const range = statsFor(character.type, character.level).moveRange
            for (const cell of reachableCells(character, characters, maze, range, blocked)) {
                if (includesPosition(itemCells, cell)) continue
                // O tabuleiro como fica com ela ali: a personagem da vez consegue atacá-la?
                const board = this.moved(characters, character.id, cell, false)
                const lured = { ...character, position: cell }
                if (this.strikeFrom(activeCharacter, lured, activeCharacter.color, board, maze, barriers, items) === null) continue
                return { updatedCharacters: board, manipulationItem: itemKey }
            }
        }

        return null
    }

    // A casa, entre as que a personagem alcança andando nesta vez, que mais a aproxima de algum
    // dos destinos. As casas de `avoid` ficam de fora. Null se nenhuma a deixa mais perto.
    private static stepToward(
        character: CharacterDefinition,
        goals: CharacterPosition[],
        characters: CharacterDefinition[],
        maze: Maze,
        blocked: BlockedCells,
        avoid: CharacterPosition[] = [],
    ): CharacterPosition | null {
        const maps = goals.map((goal) => distanceMap(goal, maze, blocked))
        const distanceTo = (cell: CharacterPosition) =>
            Math.min(...maps.map((distances) => distances.get(positionKey(cell)) ?? Infinity))

        let best: { cell: CharacterPosition | null; distance: number } = { cell: null, distance: distanceTo(character.position) }
        const range = statsFor(character.type, character.level).moveRange
        for (const cell of reachableCells(character, characters, maze, range, blocked)) {
            if (includesPosition(avoid, cell)) continue
            const distance = distanceTo(cell)
            if (distance < best.distance) best = { cell, distance }
        }
        return best.cell
    }

    // As personagens depois que uma delas vai para outra casa. Na própria vez, isso gasta o turno dela.
    // Manipulada, não gasta nada: ser manipulada é uma ação anormal, e a personagem continua com a
    // ação dela quando chegar a vez.
    private static moved(
        characters: CharacterDefinition[],
        characterId: string,
        position: CharacterPosition,
        spendsTurn: boolean,
    ): CharacterDefinition[] {
        return characters.map((p) => {
            if (p.id !== characterId) return p
            return spendsTurn ? { ...p, position, movedThisTurn: true, usedSkillThisTurn: true } : { ...p, position }
        })
    }

    // A habilidade de alcance da personagem, quando ela tem uma.
    // É com ela que a IA atira. A IA não abre lista de habilidades, ela já escolhe a melhor ação,
    // e é dela que vêm o alcance e o dano do tiro.
    // Sem isso a atiradora da IA acertaria menos longe e mais fraco que a do jogador.
    private static rangedSkillOf(character: CharacterDefinition) {
        return hasRangedAttackSkill(character.type) ? skillFor(character.type) : null
    }

    // `manipulatedBy` é o time que manipula o atacante, quando é o caso
    private static buildAttack(
        attacker: CharacterDefinition,
        target: CharacterDefinition,
        approach: CharacterPosition,
        characters: CharacterDefinition[],
        maze: Maze,
        barriers: Barrier[],
        manipulatedBy: CharacterColor | null,
    ): AIMoveResult {
        const moveSteps = pathLength(attacker.position, approach, maze, blockedCellsFor(attacker.color, barriers, characters))
        const skill = this.rangedSkillOf(attacker)
        const area = attackArea(attacker, skill, target.position)
        return {
            updatedCharacters: this.moved(characters, attacker.id, approach, manipulatedBy === null),
            pendingAttack: {
                attackerId: attacker.id,
                damageDice: damageOf(attacker, skill),
                targetId: target.id,
                delayMs: moveSteps * STEP_MS + ACTION_SETTLE_MS,
                // Quem tem habilidade de alcance atira com ela, e quem não tem anda até o alvo
                melee: skill === null,
                ...(area ? { area } : {}),
                ...(manipulatedBy ? { manipulatedBy } : {}),
            },
        }
    }

    // De onde "myCharacter" golpeia "target" agora: a casa a que ela chega andando, ou a própria
    // casa quando atira. Null quando não dá.
    // `commander` é quem manda no golpe: o time da personagem, ou quem a manipula. Só vale alvo que
    // ela pode atacar e que não esteja protegido por barreira, e um incêndio que pegaria
    // alguém que ela não pode atacar é descartado.
    private static strikeFrom(
        myCharacter: CharacterDefinition,
        target: CharacterDefinition,
        commander: CharacterColor,
        characters: CharacterDefinition[],
        maze: Maze,
        barriers: Barrier[],
        items: MotivationItem[],
    ): CharacterPosition | null {
        if (!mayAttack(myCharacter, target, commander) || isProtected(target, barriers)) return null
        if (friendlyFire(myCharacter, target, characters, maze, commander, barriers).length > 0) return null

        const skill = this.rangedSkillOf(myCharacter)
        if (skill) {
            const sight = { barriers, blockedBy: skill.blockedBy }
            const shot: Strike = { ranged: true, range: skillRangeOf(skill, myCharacter) ?? 0, sight }
            return canHitTarget(myCharacter, target, characters, maze, shot) ? myCharacter.position : null
        }
        const walkRange = statsFor(myCharacter.type, myCharacter.level).moveRange
        const blocked = blockedCellsFor(myCharacter.color, barriers, characters)
        return findApproachCell(myCharacter, target, characters, items, maze, walkRange, blocked)
    }

    // Alvos que "myCharacter" consegue atingir agora, com a casa de onde o golpe sai
    private static findInRangeTargets(
        myCharacter: CharacterDefinition,
        commander: CharacterColor,
        characters: CharacterDefinition[],
        maze: Maze,
        barriers: Barrier[],
        items: MotivationItem[],
    ): Array<{ target: CharacterDefinition; approach: CharacterPosition }> {
        return characters.flatMap((target) => {
            const approach = this.strikeFrom(myCharacter, target, commander, characters, maze, barriers, items)
            return approach ? [{ target, approach }] : []
        })
    }
}
