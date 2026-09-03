import type { PieceColor, PieceDefinition, PiecePosition, PieceType, SpecialItem } from "./types"
import { ALL_ITEM_KEYS, ALL_PIECE_TYPES } from "./types"
import type { Maze } from "./maze"
import { generateMaze, inside, isWalkable } from "./maze"
import { neighbors, positionKey } from "./grid"
import { pickRandom, shuffle } from "./random"
import { ITEM_COPIES, LINEUP_COLORS, PIECE_STATS, PLACEMENT_COLORS } from "../constants/rules"

// Distribui "count" posições em uma linha começando e terminando nos extremos,
// com espaçamento equivalente entre elas.
const spreadColumns = (count: number, size: number): number[] => {
    if (count <= 1) return [Math.floor((size - 1) / 2)]
    return Array.from({ length: count }, (_, i) => Math.round((i * (size - 1)) / (count - 1)))
}

// Casa livre mais próxima da posição ideal. A busca atravessa paredes (é só uma varredura
// por proximidade), mas só devolve casas caminháveis e ainda não ocupadas — assim uma
// posição inicial que caiu dentro de uma parede escorrega para a casa útil mais próxima.
const nearestFreeCell = (maze: Maze, ideal: PiecePosition, occupied: Set<string>): PiecePosition | null => {
    const seen = new Set<string>([positionKey(ideal)])
    const queue: PiecePosition[] = [ideal]

    while (queue.length > 0) {
        const cell = queue.shift()!
        if (isWalkable(maze, cell.x, cell.y) && !occupied.has(positionKey(cell))) return cell

        for (const next of neighbors(cell)) {
            if (!inside(maze, next.x, next.y)) continue
            const key = positionKey(next)
            if (seen.has(key)) continue
            seen.add(key)
            queue.push(next)
        }
    }

    return null
}

export const pieceId = (color: PieceColor, type: PieceType) => `${color[0]}${type}`

// A "escalação" da partida: quem existe no tabuleiro, independente de labirinto.
// A tela de iniciativa usa isso para rolar os dados antes de o mapa ficar pronto.
export interface PieceSlot {
    id: string
    color: PieceColor
    type: PieceType
}

export const ALL_PIECE_SLOTS: PieceSlot[] = LINEUP_COLORS.flatMap((color) =>
    ALL_PIECE_TYPES.map((type) => ({ id: pieceId(color, type), color, type })),
)

// Linha inicial de cada time: escuras no topo, cinzas no meio, claras embaixo
const teamRow = (color: PieceColor, size: number) =>
    color === "dark" ? 0 : color === "gray" ? Math.floor(size / 2) : size - 1

// Monta as peças já com o labirinto pronto: cada time nasce espalhado na sua linha e,
// se o ponto ideal for parede (ou já estiver tomado), a peça vai para a casa livre mais próxima.
export function createInitialPieces(maze: Maze): PieceDefinition[] {
    const occupied = new Set<string>()
    const pieces: PieceDefinition[] = []
    const columns = spreadColumns(ALL_PIECE_TYPES.length, maze.size)

    for (const color of PLACEMENT_COLORS) {
        const y = teamRow(color, maze.size)
        ALL_PIECE_TYPES.forEach((type, index) => {
            const position = nearestFreeCell(maze, { x: columns[index], y }, occupied)
            if (!position) return
            occupied.add(positionKey(position))
            const { maxHp } = PIECE_STATS[type]
            pieces.push({
                id: pieceId(color, type),
                color,
                type,
                position,
                movedThisTurn: false,
                hp: maxHp,
                maxHp,
                level: 1,
            })
        })
    }

    return pieces
}

// As casas em que um item cabe: nem parede, nem peça, nem outro item em cima
export function freeCells(maze: Maze, pieces: PieceDefinition[], items: SpecialItem[]): PiecePosition[] {
    const taken = new Set([...pieces.map((p) => positionKey(p.position)), ...items.map((i) => positionKey(i.position))])

    const cells: PiecePosition[] = []
    for (let y = 0; y < maze.size; y++) {
        for (let x = 0; x < maze.size; x++) {
            if (isWalkable(maze, x, y) && !taken.has(positionKey({ x, y }))) cells.push({ x, y })
        }
    }
    return cells
}

// Uma delas, sorteada. Null só em um labirinto sem casa livre nenhuma.
export function randomFreeCell(maze: Maze, pieces: PieceDefinition[], items: SpecialItem[]): PiecePosition | null {
    const cells = freeCells(maze, pieces, items)
    return cells.length > 0 ? pickRandom(cells) : null
}

// Espalha cópias de cada item em casas livres do labirinto (nunca em parede,
// em cima de uma peça ou de outro item).
export function placeItems(maze: Maze, pieces: PieceDefinition[]): SpecialItem[] {
    const available = shuffle(freeCells(maze, pieces, []))

    // O tabuleiro mínimo é grande o bastante para as duas cópias de cada item; a saída
    // antecipada abaixo é só uma rede de segurança para um labirinto sem casas livres.
    const result: SpecialItem[] = []
    for (let copy = 0; copy < ITEM_COPIES; copy++) {
        for (const key of ALL_ITEM_KEYS) {
            const position = available.pop()
            if (!position) return result
            result.push({ id: `item-${key}-${copy}`, key, position })
        }
    }
    return result
}

// Tudo o que uma partida precisa para começar. Montagem de uma vez fora da tela de jogo
// (durante as rolagens de iniciativa) para que o tabuleiro apareça já pronto.
export interface GameSetup {
    maze: Maze
    pieces: PieceDefinition[]
    items: SpecialItem[]
}

// Setup + ordem dos turnos sorteada na iniciativa: o "contrato" entre a tela de
// iniciativa e a tela de jogo.
export interface MatchSetup extends GameSetup {
    turnOrder: string[]
}

export function createGameSetup(boardSize: number, minRoomSize: number, maxRoomSize: number): GameSetup {
    const maze = generateMaze(boardSize, minRoomSize, maxRoomSize)
    const pieces = createInitialPieces(maze)
    const items = placeItems(maze, pieces)
    return { maze, pieces, items }
}
