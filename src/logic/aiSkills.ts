import type { Barrier, CharacterDefinition, CharacterPosition, SkillId } from "./types"
import { SKILLS, imitableSkillOf, skillAreaSideOf, skillMaxRangeOf, skillUsesOf, type Skill } from "./skills"
import {
    SURROUNDING_STEPS,
    atPosition,
    blockedCellsFor,
    includesPosition,
    manhattan,
    positionKey,
    samePosition,
} from "./grid"
import { isCorridor } from "./maze"
import { distanceMap, findPath, moveRangeOf } from "./movement"
import { lineOfFire } from "./sight"
import { areaCells, charactersInCells, mayAttack } from "./combat"
import { barrierCells, isProtected, litBarrier } from "./barriers"
import { chargeCells, chargeVictims } from "./charge"
import { pickRandom } from "./random"
import {
    closerCell,
    distanceToGoals,
    itemWorth,
    meleeOptions,
    minBy,
    movementGoals,
    opponentsOf,
    pickMeleeTarget,
    planAction,
    strikeOf,
    type AiAction,
    type AiBoard,
    type AiMemory,
    type AiMood,
} from "./ai"
import { AI_TACTICS } from "../constants/rules"

// O que a IA leva em conta para usar uma habilidade:
// o alcance (o fixo, o sorteado, ou o maior que os dados tiram,
// quando ela ainda está decidindo se vale a pena rolá-los), o "ânimo", e a memória da vez.
export interface SkillContext {
    range: number
    mood: AiMood
    memory: AiMemory
}

// A jogada que a IA faria com a habilidade, ou null quando ela não vale a pena agora
type SkillPlanner = (character: CharacterDefinition, board: AiBoard, context: SkillContext) => AiAction | null

const surrounding = (cell: CharacterPosition) =>
    SURROUNDING_STEPS.map(([dx, dy]) => ({ x: cell.x + dx, y: cell.y + dy }))

// Quantas das personagens atingidas são oponentes, e quantas são aliadas
// (a própria personagem inclusive).
const tally = (character: CharacterDefinition, hit: CharacterDefinition[]) => {
    const opponents = hit.filter((p) => mayAttack(character, p, character.color)).length
    return { opponents, allies: hit.length - opponents }
}

// Vale atingir: alguma oponente, e pelo menos `ratio` delas para cada aliada que vai junto
const worthHitting = ({ opponents, allies }: { opponents: number; allies: number }, ratio: number) =>
    opponents > 0 && opponents >= ratio * allies

// Movimento extra: um segundo golpe, de preferência em outra oponente,
// e na mesma quando não há outra ao alcance.
// Sem ninguém ao alcance, é mais uma ação comum, com o alcance sorteado.
const planExtraMove: SkillPlanner = (character, board, { range, mood, memory }) => {
    const options = meleeOptions(character, board, range)
    if (options.length > 0) return strikeOf(character, pickMeleeTarget(options, memory.struck, true))
    return planAction(character, board, mood, memory, range)
}

// O caminho mais curto da oponente até encostar em alguma aliada, com estas barreiras acesas.
// Vazio quando ela já está encostada, ou quando não tem como chegar.
const pathToAllies = (
    opponent: CharacterDefinition,
    allies: CharacterDefinition[],
    board: AiBoard,
    barriers: Barrier[],
): CharacterPosition[] => {
    const blocked = blockedCellsFor(opponent.color, barriers, board.characters)
    const distances = distanceMap(opponent.position, board.maze, blocked)
    const beside = allies
        .flatMap((ally) => surrounding(ally.position))
        .filter((cell) => distances.has(positionKey(cell)))
    if (beside.length === 0) return []
    return findPath(opponent.position, minBy(beside, (cell) => distances.get(positionKey(cell))!), board.maze, blocked)
}

// Onde cortar o caminho das oponentes até as aliadas:
// numa casa de corredor ao alcance, a primeira do caminho mais curto entre os das oponentes
// que encostariam numa aliada em `barrierThreatTurns` vezes de caminhada.
// Depois de cada corte o caminho que sobra é refeito, e cortado de novo,
// até acabarem as barreiras ou os corredores ao alcance.
const corridorCuts = (owner: CharacterDefinition, board: AiBoard, free: CharacterPosition[], uses: number) => {
    const allies = board.characters.filter((p) => p.color === owner.color)
    const horizon = (opponent: CharacterDefinition) => AI_TACTICS.barrierThreatTurns * moveRangeOf(opponent)
    // Andando, ninguém chega antes do que em linha reta:
    // a oponente longe demais nem tem o caminho medido.
    const near = opponentsOf(owner, board.characters).filter((opponent) =>
        allies.some((ally) => manhattan(opponent.position, ally.position) - 2 <= horizon(opponent)),
    )
    let paths = near.map((opponent) => ({ opponent, path: pathToAllies(opponent, allies, board, board.barriers) }))
    const cuts: CharacterPosition[] = []

    while (cuts.length < uses) {
        const cut = paths
            .filter(({ opponent, path }) => path.length > 0 && path.length <= horizon(opponent))
            .sort((a, b) => a.path.length - b.path.length)
            .map(({ path }) => path.find((cell) => isCorridor(board.maze, cell) && includesPosition(free, cell)))
            .find((cell) => cell !== undefined)
        if (!cut) break
        cuts.push(cut)

        // Um corte só muda os caminhos que passavam por ele
        const barriers = [...board.barriers, ...cuts.map((cell) => litBarrier(owner, cell))]
        paths = paths.map(({ opponent, path }) => ({
            opponent,
            path: includesPosition(path, cut) ? pathToAllies(opponent, allies, board, barriers) : path,
        }))
    }

    return cuts
}

// Barreira: primeiro fechando os corredores por onde as oponentes chegariam às aliadas;
// depois sobre os itens que elas alcançariam, sobre as aliadas mais ameaçadas,
// e por fim sobre ela mesma, quando já não vai sair do lugar.
// Item, aliada ou ela mesma só entram quando alguma oponente
// chegaria neles em `barrierThreatTurns` vezes de caminhada.
const planBarriers: SkillPlanner = (owner, board, { range }) => {
    const uses = skillUsesOf(SKILLS.barrier, owner) ?? 0
    const sight = { barriers: board.barriers, blockedBy: SKILLS.barrier.blockedBy }
    const free = barrierCells(owner, board.characters, board.maze, range, sight)

    // Em quantas vezes de caminhada a oponente mais rápida chega a alguma das casas
    const walks = opponentsOf(owner, board.characters).map((opponent) => {
        const blocked = blockedCellsFor(opponent.color, board.barriers, board.characters)
        return { range: moveRangeOf(opponent), distances: distanceMap(opponent.position, board.maze, blocked) }
    })
    const turnsToReach = (cells: CharacterPosition[]) =>
        Math.min(
            ...walks.flatMap(({ range, distances }) =>
                cells.map((cell) => (distances.get(positionKey(cell)) ?? Infinity) / range),
            ),
        )
    // As casas ameaçadas, da mais à menos.
    // A ameaça a um item é chegarem nele, e a uma personagem, encostarem nela.
    const threatened = (cells: CharacterPosition[], around: (cell: CharacterPosition) => CharacterPosition[]) =>
        cells
            .map((cell) => ({ cell, turns: turnsToReach(around(cell)) }))
            .filter(({ turns }) => turns <= AI_TACTICS.barrierThreatTurns)
            .sort((a, b) => a.turns - b.turns)
            .map(({ cell }) => cell)

    const itemCells = board.items
        .filter((item) => itemWorth(item, owner.color, board.characters) !== "stray")
        .map((item) => item.position)
    const allyCells = board.characters
        .filter((p) => p.color === owner.color && p.id !== owner.id)
        .map((p) => p.position)
    const candidates = [
        ...corridorCuts(owner, board, free, uses),
        ...threatened(itemCells, (cell) => [cell]),
        ...threatened(allyCells, surrounding),
        ...(owner.movedThisTurn ? threatened([owner.position], surrounding) : []),
    ]
    const first = (cell: CharacterPosition, index: number) =>
        candidates.findIndex((other) => samePosition(other, cell)) === index
    const cells = candidates.filter((cell, index) => includesPosition(free, cell) && first(cell, index)).slice(0, uses)
    return cells.length > 0 ? { kind: "barriers", characterId: owner.id, cells } : null
}

// Investida: atropelar só oponentes, de preferência.
// Sacrificar aliadas só vale levando, para cada uma, pelo menos
// `chargeOpponentsPerAlly` oponentes.
// Sem ninguém que valha atropelar, a investida ainda leva a personagem para mais
// perto de onde ela quer ir, sem passar por cima de ninguém.
const planCharge: SkillPlanner = (runner, board, { range, mood }) => {
    const runs = chargeCells(runner, board.characters, board.items, board.maze, range, board.barriers).map((to) => {
        const victims = chargeVictims(runner, to, board.characters, board.maze, board.barriers)
        return { to, ...tally(runner, victims.map(({ character }) => character)) }
    })

    const [best] = runs
        .filter((run) => worthHitting(run, AI_TACTICS.chargeOpponentsPerAlly))
        .sort((a, b) => Number(a.allies > 0) - Number(b.allies > 0) || b.opponents - a.opponents || a.allies - b.allies)
    if (best) return { kind: "charge", characterId: runner.id, to: best.to }

    const clear = runs.filter((run) => run.opponents + run.allies === 0).map((run) => run.to)
    const distanceTo = distanceToGoals(movementGoals(runner, board, mood), board, runner.color)
    const to = closerCell(clear, runner.position, distanceTo)
    return to ? { kind: "charge", characterId: runner.id, to } : null
}

// Tiro longo: na oponente à vista de mais vigor, ou na de menos; como `longShotTarget` manda
const planLongShot: SkillPlanner = (shooter, board, { range }) => {
    const sight = { barriers: board.barriers, blockedBy: SKILLS.longShot.blockedBy }
    const targets = lineOfFire(shooter, board.characters, board.maze, range, sight).targets.filter(
        (p) => mayAttack(shooter, p, shooter.color) && !isProtected(p, board.barriers),
    )
    if (targets.length === 0) return null

    const sign = AI_TACTICS.longShotTarget === "mostVigor" ? -1 : 1
    const target = minBy(targets, (p) => sign * p.vigor)
    return { kind: "strike", characterId: shooter.id, targetId: target.id, from: shooter.position }
}

// Incêndio: o centro que pega mais oponentes, com pelo menos `fireOpponentsPerAlly` delas
// para cada aliada que o fogo pegar junto (a própria personagem inclusive).
// Como o jogador, ela mira o chão livre, ou uma oponente desprotegida.
const planFire: SkillPlanner = (shooter, board, { range }) => {
    const side = skillAreaSideOf(SKILLS.fire, shooter)
    if (side === null) return null
    const sight = { barriers: board.barriers, blockedBy: SKILLS.fire.blockedBy }
    const blocked = blockedCellsFor(shooter.color, board.barriers, board.characters)
    const fire = { color: shooter.color, barriers: board.barriers }

    const shots = lineOfFire(shooter, board.characters, board.maze, range, sight).cells.flatMap((center) => {
        const occupant = atPosition(board.characters, center)
        const aimable = occupant
            ? mayAttack(shooter, occupant, shooter.color) && !isProtected(occupant, board.barriers)
            : !blocked.has(positionKey(center))
        if (!aimable) return []
        const burned = charactersInCells(board.characters, areaCells(board.maze, center, side, fire))
        return [{ center, targetId: occupant?.id, ...tally(shooter, burned) }]
    })

    const [best] = shots
        .filter((shot) => worthHitting(shot, AI_TACTICS.fireOpponentsPerAlly))
        .sort((a, b) => b.opponents - a.opponents || a.allies - b.allies)
    if (!best) return null
    const area = { center: best.center, side }
    return { kind: "strike", characterId: shooter.id, targetId: best.targetId, from: shooter.position, area }
}

// Imitação: uma personagem qualquer à vista, sorteada, de qualquer time
// e de qualquer tipo que não seja outra imitação.
// Só entra no sorteio quem tem uma habilidade com uso agora
// (a de dado, no maior alcance que ela pode tirar):
// copiar o que não serve deixaria a imitação sem fazer nada.
const planMimic: SkillPlanner = (character, board, context) => {
    const sight = { barriers: board.barriers, blockedBy: SKILLS.mimic.blockedBy }
    const seen = lineOfFire(character, board.characters, board.maze, context.range, sight).targets
    // Cada habilidade é pesada uma vez só, por mais personagens que a tenham
    const skills = new Set(seen.flatMap((model) => imitableSkillOf(model) ?? []))
    const useful = [...skills].filter((skill) => {
        const maxRange = skillMaxRangeOf(skill, character)
        return planSkill(skill, character, board, { ...context, range: maxRange }) !== null
    })
    const models = seen.filter((model) => {
        const copied = imitableSkillOf(model)
        return copied !== null && useful.includes(copied)
    })
    return models.length > 0 ? { kind: "mimic", characterId: character.id, modelId: pickRandom(models).id } : null
}

const PLANNERS: Record<SkillId, SkillPlanner> = {
    extraMove: planExtraMove,
    barrier: planBarriers,
    charge: planCharge,
    longShot: planLongShot,
    mimic: planMimic,
    fire: planFire,
}

// O que a IA faria agora com a habilidade, que pode ser a da personagem ou uma copiada pela imitação
export const planSkill = (
    skill: Skill,
    character: CharacterDefinition,
    board: AiBoard,
    context: SkillContext,
): AiAction | null => PLANNERS[skill.id](character, board, context)
