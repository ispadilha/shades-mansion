import type { PieceColor, PieceDefinition, PiecePosition, PieceType, SpecialItem } from "./types"
import { ALL_ITEM_KEYS } from "./types"
import type { Maze } from "./maze"
import { isWalkable } from "./maze"
import { MAX_HP } from "../constants/gameRules"

const cellKey = (p: PiecePosition) => `${p.x},${p.y}`

// Cópias de cada item especial espalhadas pelo tabuleiro (reduzidas se o labirinto
// configurado for pequeno demais para todas caberem)
const ITEM_COPIES = 2

// Distribui "count" posições em uma linha começando e terminando nos extremos,
// com espaçamento equivalente entre elas (ex.: 4 peças em 20 casas -> 0, 6, 13, 19).
const spreadColumns = (count: number, size: number): number[] => {
    if (count <= 1) return [Math.floor((size - 1) / 2)]
    return Array.from({ length: count }, (_, i) => Math.round((i * (size - 1)) / (count - 1)))
}

// Casa livre mais próxima da posição ideal. A busca atravessa paredes (é só uma varredura
// por proximidade), mas só devolve casas caminháveis e ainda não ocupadas — assim uma
// posição inicial que caiu dentro de uma parede escorrega para a casa útil mais próxima.
const nearestFreeCell = (maze: Maze, ideal: PiecePosition, occupied: Set<string>): PiecePosition | null => {
    const seen = new Set<string>([cellKey(ideal)])
    const queue: PiecePosition[] = [ideal]

    while (queue.length > 0) {
        const cell = queue.shift()!
        if (isWalkable(maze, cell.x, cell.y) && !occupied.has(cellKey(cell))) return cell

        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const next = { x: cell.x + dx, y: cell.y + dy }
            if (next.x < 0 || next.y < 0 || next.x >= maze.size || next.y >= maze.size) continue
            const key = cellKey(next)
            if (seen.has(key)) continue
            seen.add(key)
            queue.push(next)
        }
    }

    return null
}

const TEAM_TYPES: PieceType[] = ["A", "B", "C", "D"]

// Linha inicial de cada time: escuras no topo, cinzas no meio, claras embaixo
const teamRow = (color: PieceColor, size: number) =>
    color === "dark" ? 0 : color === "gray" ? Math.floor(size / 2) : size - 1

// Monta as peças já com o labirinto pronto: cada time nasce espalhado na sua linha e,
// se o ponto ideal for parede (ou já estiver tomado), a peça vai para a casa livre mais próxima.
export function createInitialPieces(maze: Maze): PieceDefinition[] {
    const occupied = new Set<string>()
    const pieces: PieceDefinition[] = []
    const columns = spreadColumns(TEAM_TYPES.length, maze.size)

    for (const color of ["dark", "gray", "light"] as PieceColor[]) {
        const y = teamRow(color, maze.size)
        TEAM_TYPES.forEach((type, index) => {
            const position = nearestFreeCell(maze, { x: columns[index], y }, occupied)
            if (!position) return
            occupied.add(cellKey(position))
            pieces.push({
                id: `${color[0]}${type}`,
                color,
                type,
                position,
                movedThisTurn: false,
                hp: MAX_HP,
                maxHp: MAX_HP,
            })
        })
    }

    return pieces
}

// Espalha cópias de cada item em casas livres do labirinto (nunca em parede,
// em cima de uma peça ou de outro item).
export function placeItems(maze: Maze, pieces: PieceDefinition[]): SpecialItem[] {
    const occupied = new Set(pieces.map((p) => cellKey(p.position)))

    const available: PiecePosition[] = []
    for (let y = 0; y < maze.size; y++) {
        for (let x = 0; x < maze.size; x++) {
            if (isWalkable(maze, x, y) && !occupied.has(cellKey({ x, y }))) available.push({ x, y })
        }
    }
    for (let i = available.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[available[i], available[j]] = [available[j], available[i]]
    }

    // Em um labirinto apertado é melhor distribuir menos cópias de todos os itens, do que
    // "truncar" e deixar os últimos da lista de fora.
    const copies = Math.min(ITEM_COPIES, Math.max(1, Math.floor(available.length / ALL_ITEM_KEYS.length)))

    const result: SpecialItem[] = []
    for (let copy = 0; copy < copies; copy++) {
        for (const key of ALL_ITEM_KEYS) {
            const position = available.pop()
            if (!position) return result
            result.push({ id: `item-${key}-${copy}`, key, position })
        }
    }
    return result
}
