import type { PiecePosition } from "./types"

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

// Identificador de uma casa, para guardá-la em Set/Map
export const positionKey = (p: PiecePosition) => `${p.x},${p.y}`

export const samePosition = (a: PiecePosition, b: PiecePosition) => a.x === b.x && a.y === b.y

export const manhattan = (a: PiecePosition, b: PiecePosition) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)

export const neighbors = (p: PiecePosition): PiecePosition[] =>
    ORTHOGONAL_STEPS.map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy }))

// O que está em uma casa. Serve para peças e para itens: os dois têm posição.
export const atPosition = <T extends { position: PiecePosition }>(
    entries: T[],
    position: PiecePosition,
): T | undefined => entries.find((entry) => samePosition(entry.position, position))

export const includesPosition = (cells: PiecePosition[], position: PiecePosition) =>
    cells.some((cell) => samePosition(cell, position))
