import type {
    Barrier,
    CharacterColor,
    CharacterDefinition,
    CharacterPosition,
    MotivationItem,
    MotivationItemKey,
} from "./types"
import { itemKeyColor } from "./types"
import type { Maze } from "./maze"
import { blockedCellsFor, includesPosition, manhattan, positionKey, samePosition, touching } from "./grid"
import { distanceMap, findApproachCell, moveRangeOf, reachableCells } from "./movement"
import { mayAttack, type AttackArea } from "./combat"
import { isProtected } from "./barriers"
import { affinityPartnerOf } from "./affinity"
import { itemUseFor, promoted, reinvigorated, type OwnItemUse } from "./items"
import { chance, pickRandom } from "./random"
import { AI_CHANCES, AI_TACTICS } from "../constants/rules"

// O tabuleiro como a IA o lê para decidir
export interface AiBoard {
    characters: CharacterDefinition[]
    items: MotivationItem[]
    barriers: Barrier[]
    maze: Maze
}

// Uma jogada decidida pela IA. Quem a executa é que sabe por onde ela sai
// (a ação comum, a habilidade ou uma manipulação) e o que isso gasta.
export type AiAction =
    | { kind: "walk"; characterId: string; to: CharacterPosition }
    | { kind: "strike"; characterId: string; targetId?: string; from: CharacterPosition; area?: AttackArea }
    | { kind: "dispel"; characterId: string; barrier: Barrier; from: CharacterPosition }
    | { kind: "charge"; characterId: string; to: CharacterPosition }
    | { kind: "barriers"; characterId: string; cells: CharacterPosition[] }
    | { kind: "mimic"; characterId: string; modelId: string }

// O "ânimo" da vez: o que a IA se dispõe a fazer, sorteado pelas chances de `AI_CHANCES` quando a vez começa
export type AiMood = Record<keyof typeof AI_CHANCES, boolean>

export const rollMood = (): AiMood =>
    Object.fromEntries(Object.entries(AI_CHANCES).map(([key, percent]) => [key, chance(percent)])) as AiMood

// O que já aconteceu na vez e pesa nas decisões seguintes dela
export interface AiMemory {
    // Quem a personagem da vez já golpeou.
    // Personagens do tipo A preferem golpear outro oponente, quando possível.
    struck: string[]
    // Personagem que uma manipulação trouxe até o alcance da personagem da vez, para ela golpear
    lured: string | null
}

// O elemento de menor medida. A lista não pode estar vazia.
export const minBy = <T>(list: T[], measure: (entry: T) => number): T =>
    list.reduce((best, entry) => (measure(entry) < measure(best) ? entry : best))

export const opponentsOf = (character: CharacterDefinition, characters: CharacterDefinition[]) =>
    characters.filter((p) => mayAttack(character, p, character.color))

export type ItemWorth = "team" | "manipulation" | "stray"

export const itemWorth = (
    item: MotivationItem,
    color: CharacterColor,
    characters: CharacterDefinition[],
): ItemWorth => {
    if (!characters.some((p) => p.id === item.key)) return "stray"
    return itemKeyColor(item.key) === color ? "team" : "manipulation"
}

// Um item do time gasto na personagem dele, e como ela ficou
export interface SpentItem {
    key: MotivationItemKey
    use: OwnItemUse
    character: CharacterDefinition
}

// Vigor baixo demais para esperar a parceira de afinidade: usa o item para revigorar
const needsCure = (character: CharacterDefinition) =>
    character.vigor * 100 <= character.maxVigor * AI_TACTICS.shouldUseItemToCureAtVigor

// Os itens do time nas próprias personagens.
// Eles ficam guardados para a promoção, que acontece quando o ânimo deixa,
// e só revigoram quem caiu demais para esperar a afinidade.
// Cada unidade é um uso: com duas, a mesma personagem
// pode ser revigorada e promovida, ou promovida duas vezes.
export function ownItemUses(
    characters: CharacterDefinition[],
    color: CharacterColor,
    inventory: MotivationItemKey[],
    mood: AiMood,
): SpentItem[] {
    const left = [...inventory]
    const spent: SpentItem[] = []

    for (const original of characters) {
        if (original.color !== color) continue
        const key = original.id as MotivationItemKey
        let character = original
        while (left.includes(key)) {
            const use = itemUseFor(key, character, color)
            const promotes = use === "promote" && mood.shouldPromote
            if (!promotes && !(use === "reinvigorate" && needsCure(character))) break
            left.splice(left.indexOf(key), 1)
            character = promotes ? promoted(character) : reinvigorated(character)
            spent.push({ key, use: promotes ? "promote" : "reinvigorate", character })
        }
    }

    return spent
}

// Um alvo que a personagem golpeia corpo a corpo, e a casa ao lado dele de onde o golpe sai
export interface MeleeOption {
    target: CharacterDefinition
    from: CharacterPosition
}

// De onde a personagem golpeia o alvo corpo a corpo, andando até `range` casas,
// ou null quando não alcança.
// Vale o mesmo que para o jogador: só alvo que ela pode atacar sob o comando de `commander`
// (o time dela, ou o que a manipula) e que nenhuma barreira proteja.
const meleeFrom = (
    character: CharacterDefinition,
    target: CharacterDefinition,
    board: AiBoard,
    range: number,
    commander: CharacterColor,
): CharacterPosition | null => {
    if (!mayAttack(character, target, commander) || isProtected(target, board.barriers)) return null
    const blocked = blockedCellsFor(character.color, board.barriers, board.characters)
    return findApproachCell(character, target, board.characters, board.items, board.maze, range, blocked)
}

// Quem a personagem golpeia corpo a corpo andando até `range` casas
export const meleeOptions = (
    character: CharacterDefinition,
    board: AiBoard,
    range: number,
    commander = character.color,
): MeleeOption[] =>
    board.characters.flatMap((target) => {
        const from = meleeFrom(character, target, board, range, commander)
        return from ? [{ target, from }] : []
    })

// O alvo preferido: a personagem de menos vigor, a mais perto de sair da mansão.
// Personagens do tipo A, que golpeiam duas vezes, deixam por último quem já golpeou nesta vez.
export const pickMeleeTarget = (options: MeleeOption[], struck: string[], varies: boolean): MeleeOption => {
    const repeated = (option: MeleeOption) => (varies && struck.includes(option.target.id) ? 1 : 0)
    return [...options].sort((a, b) => repeated(a) - repeated(b) || a.target.vigor - b.target.vigor)[0]
}

export const strikeOf = (character: CharacterDefinition, { target, from }: MeleeOption): AiAction => ({
    kind: "strike",
    characterId: character.id,
    targetId: target.id,
    from,
})

const walkOf = (character: CharacterDefinition, to: CharacterPosition): AiAction => ({
    kind: "walk",
    characterId: character.id,
    to,
})

// A distância andando de uma casa até o destino mais perto, para quem é do time de `color`
export const distanceToGoals = (goals: CharacterPosition[], board: AiBoard, color: CharacterColor) => {
    const blocked = blockedCellsFor(color, board.barriers, board.characters)
    const maps = goals.map((goal) => distanceMap(goal, board.maze, blocked))
    return (cell: CharacterPosition) =>
        Math.min(...maps.map((distances) => distances.get(positionKey(cell)) ?? Infinity))
}

// Entre as casas, a mais perto dos destinos, desde que mais perto do que `from`.
// Null quando nenhuma aproxima.
export const closerCell = (
    cells: CharacterPosition[],
    from: CharacterPosition,
    distanceTo: (cell: CharacterPosition) => number,
): CharacterPosition | null => {
    let best: { cell: CharacterPosition | null; distance: number } = { cell: null, distance: distanceTo(from) }
    for (const cell of cells) {
        const distance = distanceTo(cell)
        if (distance < best.distance) best = { cell, distance }
    }
    return best.cell
}

// Parceiras de afinidade se procuram quando alguma delas perdeu vigor, e ainda não estão encostadas.
// Null quando não há parceira ou nenhuma das duas perdeu vigor.
const partnerToSeek = (character: CharacterDefinition, characters: CharacterDefinition[]) => {
    const partner = affinityPartnerOf(character, characters)
    if (!partner) return null
    return character.vigor < character.maxVigor || partner.vigor < partner.maxVigor ? partner : null
}

// As oponentes que dá para golpear: as que nenhuma barreira protege
const exposedOpponents = (character: CharacterDefinition, board: AiBoard) =>
    opponentsOf(character, board.characters).filter((p) => !isProtected(p, board.barriers))

// Para onde a personagem quer ir quando não tem quem golpear:
// até a parceira, se alguma das duas perdeu vigor e elas ainda não estão encostadas,
// ou atrás das oponentes, se o "ânimo" for esse.
// Vazio quando não quer ir a lugar nenhum.
export function movementGoals(character: CharacterDefinition, board: AiBoard, mood: AiMood): CharacterPosition[] {
    const partner = partnerToSeek(character, board.characters)
    if (partner) return touching(character.position, partner.position) ? [] : [partner.position]
    return mood.shouldSeekOpponent ? exposedOpponents(character, board).map((p) => p.position) : []
}

// A barreira de outro time que a personagem tenta dissipar,
// quando não tem como chegar mais perto das oponentes:
// a que protege uma delas, ou a mais perto delas, que deve estar fechando o caminho.
// Null quando nenhuma está ao alcance.
const planDispel = (character: CharacterDefinition, board: AiBoard, range: number): AiAction | null => {
    const blocked = blockedCellsFor(character.color, board.barriers, board.characters)
    const opponents = opponentsOf(character, board.characters)
    const options = board.barriers.flatMap((barrier) => {
        if (!mayAttack(character, barrier, character.color)) return []
        const from = findApproachCell(character, barrier, board.characters, board.items, board.maze, range, blocked)
        return from ? [{ barrier, from }] : []
    })
    if (options.length === 0 || opponents.length === 0) return null

    const { barrier, from } = minBy(options, (option) =>
        Math.min(...opponents.map((p) => manhattan(p.position, option.barrier.position))),
    )
    return { kind: "dispel", characterId: character.id, barrier, from }
}

// A ação comum da personagem, na ordem do que mais interessa:
// a personagem que a manipulação trouxe, a parceira de afinidade, golpear,
// os itens, as oponentes, e por fim uma casa qualquer.
// `range` é até onde ela anda: o movimento extra o troca pelo sorteado.
// Null quando o melhor é ficar onde está.
export function planAction(
    character: CharacterDefinition,
    board: AiBoard,
    mood: AiMood,
    memory: AiMemory,
    range = moveRangeOf(character),
): AiAction | null {
    const blocked = blockedCellsFor(character.color, board.barriers, board.characters)
    const reachable = reachableCells(character, board.characters, board.maze, range, blocked)
    const options = meleeOptions(character, board, range)
    const strike = (choices: MeleeOption[]) =>
        strikeOf(character, pickMeleeTarget(choices, memory.struck, character.type === "A"))

    // A personagem que uma manipulação trouxe até aqui: foi para isso que ela veio
    const lured = options.filter((option) => option.target.id === memory.lured)
    if (lured.length > 0) return strike(lured)

    // Item de personagem que já fugiu só é pisado quando o "ânimo" é de coletá-lo (raro)
    const worthOf = (item: MotivationItem) => itemWorth(item, character.color, board.characters)
    const strays = board.items.filter((item) => worthOf(item) === "stray")
    const strayCells = strays.map((item) => item.position)
    const free = mood.shouldCollectStrayItems
        ? reachable
        : reachable.filter((cell) => !includesPosition(strayCells, cell))
    const toward = (goals: CharacterPosition[]) => {
        const to = closerCell(free, character.position, distanceToGoals(goals, board, character.color))
        return to ? walkOf(character, to) : null
    }
    const distances = distanceMap(character.position, board.maze, blocked)
    const distanceOf = (cell: CharacterPosition) => distances.get(positionKey(cell)) ?? Infinity

    // Encostada na parceira, com alguma das duas tendo perdido vigor,
    // a personagem fica onde está,
    // para a afinidade revigorá-las quando a vez de uma delas começar.
    // Dali, só golpeia quem estiver ao lado.
    const partner = partnerToSeek(character, board.characters)
    if (partner && touching(character.position, partner.position)) {
        const beside = options.filter((option) => samePosition(option.from, character.position))
        return beside.length > 0 ? strike(beside) : null
    }

    if (options.length > 0) return strike(options)

    // Alguma das duas perdeu vigor:
    // ela procura encostar na parceira, ou chega o mais perto que der dela
    if (partner) {
        const besidePartner = free.filter((cell) => touching(cell, partner.position))
        if (besidePartner.length > 0) return walkOf(character, minBy(besidePartner, distanceOf))
        const step = toward([partner.position])
        if (step) return step
    }

    // Os itens, do grupo mais desejado ao menos:
    // os do próprio time, quando o "ânimo" os prioriza sobre os dos outros times;
    // os que servem para alguma coisa;
    // e os de personagem que já fugiu, quando o "ânimo" é de coletá-los.
    const useful = board.items.filter((item) => worthOf(item) !== "stray")
    const wanted = [mood.shouldPrioritizeTeamItems ? useful.filter((item) => worthOf(item) === "team") : [], useful]
    const nearest = (items: MotivationItem[]) => minBy(items, (item) => distanceOf(item.position))
    // Entre os itens que ela alcança nesta vez, coleta o mais perto do grupo mais desejado
    for (const items of [...wanted, mood.shouldCollectStrayItems ? strays : []]) {
        const within = items.filter((item) => includesPosition(reachable, item.position))
        if (within.length > 0) return walkOf(character, nearest(within).position)
    }
    // Sem nenhum ao alcance, chega mais perto do item útil mais desejado,
    // a até `itemSearchTurns` vezes de caminhada.
    const horizon = AI_TACTICS.itemSearchTurns * moveRangeOf(character)
    for (const items of wanted) {
        const near = items.filter((item) => distanceOf(item.position) <= horizon)
        const step = near.length > 0 ? toward([nearest(near).position]) : null
        if (step) return step
    }

    if (mood.shouldSeekOpponent) {
        const step = toward(exposedOpponents(character, board).map((p) => p.position))
        if (step) return step
        // Sem como chegar mais perto delas, o que sobra é a barreira que as protege,
        // ou que fecha o caminho.
        const dispel = planDispel(character, board, range)
        if (dispel) return dispel
    }

    return free.length > 0 ? walkOf(character, pickRandom(free)) : null
}

// Uma manipulação decidida: o item gasto, o que a personagem manipulada faz se a moeda deixar,
// e se ela está sendo trazida até a personagem da vez, que a golpeia em seguida.
export interface AiManipulation {
    itemKey: MotivationItemKey
    action: AiAction
    lures: boolean
}

// Manipular é jogar os dois times adversários um contra o outro,
// ou trazer uma oponente para onde ela fica exposta.
// `assess` diz se a IA pesa a jogada.
// Pesando, ela só manipula quando vale a pena:
// para golpear o terceiro time, no alvo de menos vigor,
// ou para trazer a personagem até onde a da vez a golpeia, e onde mais aliadas chegariam nela.
// Sem pesar, manipula por impulso uma personagem qualquer, que vai para uma casa qualquer.
// Como a do jogador, a personagem manipulada não usa habilidade.
export function planManipulation(
    active: CharacterDefinition,
    board: AiBoard,
    inventory: MotivationItemKey[],
    assess: boolean,
): AiManipulation | null {
    const color = active.color
    const manipulable = [...new Set(inventory)].flatMap((itemKey) => {
        const character = itemKeyColor(itemKey) === color ? undefined : board.characters.find((p) => p.id === itemKey)
        return character ? [{ itemKey, character }] : []
    })
    if (manipulable.length === 0) return null

    // A manipulada não para em casa com item: pisar nela daria o item ao time dela
    const itemCells = board.items.map((item) => item.position)
    const destinations = (character: CharacterDefinition) => {
        const blocked = blockedCellsFor(character.color, board.barriers, board.characters)
        const cells = reachableCells(character, board.characters, board.maze, moveRangeOf(character), blocked)
        return cells.filter((cell) => !includesPosition(itemCells, cell))
    }

    if (!assess) {
        const { itemKey, character } = pickRandom(manipulable)
        const cells = destinations(character)
        return cells.length > 0 ? { itemKey, action: walkOf(character, pickRandom(cells)), lures: false } : null
    }

    const attacks = manipulable.flatMap(({ itemKey, character }) =>
        meleeOptions(character, board, moveRangeOf(character), color).map((option) => ({ itemKey, character, option })),
    )
    if (attacks.length > 0) {
        const { itemKey, character, option } = minBy(attacks, ({ option }) => option.target.vigor)
        return { itemKey, action: strikeOf(character, option), lures: false }
    }

    // Se trazida para perto da parceira dela, a manipulada ainda ganha a afinidade:
    // essas casas ficam por último.
    const allies = board.characters.filter((p) => p.color === color)
    const lures = manipulable.flatMap(({ itemKey, character }) => {
        const partner = affinityPartnerOf(character, board.characters)
        return destinations(character).flatMap((cell) => {
            const lured = { ...character, position: cell }
            const after = { ...board, characters: board.characters.map((p) => (p.id === lured.id ? lured : p)) }
            if (!meleeFrom(active, lured, after, moveRangeOf(active), color)) return []
            const threats = allies.filter((ally) => meleeFrom(ally, lured, after, moveRangeOf(ally), color)).length
            const healed = partner !== null && touching(cell, partner.position) ? 1 : 0
            return [{ itemKey, character, cell, threats, healed }]
        })
    })
    if (lures.length === 0) return null

    const [best] = lures.sort(
        (a, b) => a.healed - b.healed || b.threats - a.threats || a.character.vigor - b.character.vigor,
    )
    return { itemKey: best.itemKey, action: walkOf(best.character, best.cell), lures: true }
}
