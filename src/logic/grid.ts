import type { Barrier, CharacterColor, CharacterDefinition, CharacterPosition, Facing } from "./types"

// Contas de grade que o labirinto, o movimento, o combate e a montagem da partida
// compartilham. Ficam aqui para existirem uma vez só, e porque não dependem de nada:
// qualquer arquivo pode importá-las sem risco de importação circular.

// As quatro casas vizinhas. O jogo anda e se espalha "em cruz".
export const ORTHOGONAL_STEPS: Array<[number, number]> = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
]

// As oito em volta, diagonais inclusive. É por elas que uma personagem encosta em outra:
// andar é ortogonal, mas golpear alcança o canto.
export const SURROUNDING_STEPS: Array<[number, number]> = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
]

// Identificador de uma casa, para guardá-la em Set/Map
export const positionKey = (p: CharacterPosition) => `${p.x},${p.y}`

export const samePosition = (a: CharacterPosition, b: CharacterPosition) => a.x === b.x && a.y === b.y

export const manhattan = (a: CharacterPosition, b: CharacterPosition) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)

// Duas casas encostadas: uma é uma das oito em volta da outra
export const touching = (a: CharacterPosition, b: CharacterPosition) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) === 1

// Para que lado a personagem fica virada indo de uma casa a outra: o eixo em que ela mais anda
export const facingToward = (from: CharacterPosition, to: CharacterPosition): Facing => {
    const dx = to.x - from.x
    const dy = to.y - from.y
    if (Math.abs(dx) >= Math.abs(dy)) return dx < 0 ? "left" : "right"
    return dy < 0 ? "up" : "down"
}

export const neighbors = (p: CharacterPosition): CharacterPosition[] =>
    ORTHOGONAL_STEPS.map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy }))

// O que está em uma casa. Serve para personagens e para itens: os dois têm posição.
export const atPosition = <T extends { position: CharacterPosition }>(
    entries: T[],
    position: CharacterPosition,
): T | undefined => entries.find((entry) => samePosition(entry.position, position))

export const includesPosition = (cells: CharacterPosition[], position: CharacterPosition) =>
    cells.some((cell) => samePosition(cell, position))

// As casas fechadas para quem está andando: as barreiras e as personagens dos outros times.
// Cada time vê um tabuleiro um pouco diferente, e é por isso que o conjunto é
// calculado por cor, e não uma vez para todos.
//
// Personagem aliada não fecha caminho mas ocupa a casa,
// que continua não servindo de destino: disso cuida `reachableCells`.
export type BlockedCells = ReadonlySet<string>

export const NO_BLOCKED_CELLS: BlockedCells = new Set<string>()

export const blockedCellsFor = (
    color: CharacterColor,
    barriers: Barrier[],
    characters: CharacterDefinition[],
): BlockedCells => {
    const closed = new Set<string>()
    for (const barrier of barriers) if (barrier.color !== color) closed.add(positionKey(barrier.position))
    for (const character of characters) if (character.color !== color) closed.add(positionKey(character.position))
    return closed
}
