import type { PiecePosition, PieceDefinition } from "./types"
import type { Maze } from "./maze"
import { isWalkable } from "./maze"

export const manhattan = (a: PiecePosition, b: PiecePosition) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)

export const positionKey = (p: PiecePosition) => `${p.x},${p.y}`

const ORTHOGONAL: Array<[number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]]

interface WalkNode {
    position: PiecePosition
    distance: number
    previous: string | null
}

// Busca em largura pelas casas livres do labirinto (as paredes bloqueiam, as peças não;
// elas só impedem que uma casa seja destino). O resultado guarda a distância em passos
// e a casa anterior, o que permite reconstruir o caminho andado.
function walkFrom(origin: PiecePosition, maze: Maze, maxSteps = Infinity): Map<string, WalkNode> {
    const visited = new Map<string, WalkNode>()
    if (!isWalkable(maze, origin.x, origin.y)) return visited

    const start: WalkNode = { position: origin, distance: 0, previous: null }
    visited.set(positionKey(origin), start)

    const queue: WalkNode[] = [start]
    while (queue.length > 0) {
        const node = queue.shift()!
        if (node.distance >= maxSteps) continue

        for (const [dx, dy] of ORTHOGONAL) {
            const next = { x: node.position.x + dx, y: node.position.y + dy }
            if (!isWalkable(maze, next.x, next.y)) continue
            const key = positionKey(next)
            if (visited.has(key)) continue

            const child: WalkNode = { position: next, distance: node.distance + 1, previous: positionKey(node.position) }
            visited.set(key, child)
            queue.push(child)
        }
    }

    return visited
}

// Distância andando (contornando paredes) entre duas casas. Infinity se não houver caminho.
export function pathLength(from: PiecePosition, to: PiecePosition, maze: Maze): number {
    if (from.x === to.x && from.y === to.y) return 0
    return walkFrom(from, maze).get(positionKey(to))?.distance ?? Infinity
}

// Distância andando de "origin" até cada casa livre alcançável, indexada por "positionKey".
export function distanceMap(origin: PiecePosition, maze: Maze): Map<string, number> {
    const distances = new Map<string, number>()
    for (const [key, node] of walkFrom(origin, maze)) distances.set(key, node.distance)
    return distances
}

// Caminho casa-a-casa entre duas posições (sem incluir a origem). Vazio se não houver caminho.
export function findPath(from: PiecePosition, to: PiecePosition, maze: Maze): PiecePosition[] {
    const visited = walkFrom(from, maze)
    const destination = visited.get(positionKey(to))
    if (!destination) return []

    const path: PiecePosition[] = []
    let current: WalkNode | undefined = destination
    while (current && current.previous !== null) {
        path.unshift(current.position)
        current = visited.get(current.previous)
    }
    return path
}

// Casas em que a peça pode terminar o movimento: dentro do alcance andando pelo labirinto
// e livres de outras peças.
export function reachableCells(piece: PieceDefinition, pieces: PieceDefinition[], maze: Maze, range = 5) {
    const occupied = new Set(pieces.filter((p) => p.id !== piece.id).map((p) => positionKey(p.position)))
    const res: PiecePosition[] = []

    for (const [key, node] of walkFrom(piece.position, maze, range)) {
        if (node.distance === 0 || occupied.has(key)) continue
        res.push(node.position)
    }

    return res
}

// Encontra a casa adjacente ao alvo (8 vizinhas, com diagonais) livre e mais barata de
// alcançar andando, respeitando "range" passos. Se o atacante já está adjacente, retorna
// sua própria posição. Retorna null se nenhuma casa em volta do alvo estiver ao alcance.
export function findApproachCell(
    attacker: PieceDefinition,
    target: PieceDefinition,
    pieces: PieceDefinition[],
    maze: Maze,
    range: number,
): PiecePosition | null {
    const dxAbs = Math.abs(attacker.position.x - target.position.x)
    const dyAbs = Math.abs(attacker.position.y - target.position.y)
    if (Math.max(dxAbs, dyAbs) === 1) {
        return attacker.position
    }

    const candidates: PiecePosition[] = []
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue
            candidates.push({ x: target.position.x + dx, y: target.position.y + dy })
        }
    }

    const visited = walkFrom(attacker.position, maze, range)
    let best: { cell: PiecePosition; distance: number } | null = null

    for (const candidate of candidates) {
        if (!isWalkable(maze, candidate.x, candidate.y)) continue
        const occupant = pieces.find((p) => p.position.x === candidate.x && p.position.y === candidate.y)
        if (occupant && occupant.id !== attacker.id) continue

        const node = visited.get(positionKey(candidate))
        if (!node) continue
        if (!best || node.distance < best.distance) best = { cell: candidate, distance: node.distance }
    }

    return best?.cell ?? null
}

// Casas destacadas no ataque corpo-a-corpo: as que o atacante alcança andando dentro do
// alcance e as ocupadas por peças que ele consegue abordar por alguma casa vizinha.
export function meleeAttackCells(
    piece: PieceDefinition,
    pieces: PieceDefinition[],
    maze: Maze,
    range: number,
): PiecePosition[] {
    const cells: PiecePosition[] = []

    for (const [, node] of walkFrom(piece.position, maze, range)) {
        if (node.distance === 0) continue
        const occupant = pieces.find((p) => p.position.x === node.position.x && p.position.y === node.position.y)
        if (occupant && !findApproachCell(piece, occupant, pieces, maze, range)) continue
        cells.push(node.position)
    }

    return cells
}

// As 8 direções que formam as linhas, colunas e diagonais de uma peça
const LINE_DIRECTIONS: Array<{ dx: number; dy: number }> = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: 1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: 1 },
    { dx: -1, dy: -1 },
]

// Ataque à distância: percorre as 8 direções até "range" casas.
// A primeira peça encontrada em cada direção é o alvo daquela linha
// e bloqueia o restante dela — peças no caminho "protegem" quem está atrás.
// Paredes interrompem qualquer linha de tiro.
// `cells` inclui as casas percorridas (para destacar no tabuleiro)
// e `targets`, as peças atingíveis.
export function lineOfFire(
    piece: PieceDefinition,
    pieces: PieceDefinition[],
    maze: Maze,
    range: number,
): { cells: PiecePosition[]; targets: PieceDefinition[] } {
    const cells: PiecePosition[] = []
    const targets: PieceDefinition[] = []

    for (const { dx, dy } of LINE_DIRECTIONS) {
        for (let step = 1; step <= range; step++) {
            const nx = piece.position.x + dx * step
            const ny = piece.position.y + dy * step
            if (!isWalkable(maze, nx, ny)) break

            cells.push({ x: nx, y: ny })

            const occupant = pieces.find((p) => p.position.x === nx && p.position.y === ny)
            if (occupant) {
                if (occupant.id !== piece.id) targets.push(occupant)
                break
            }
        }
    }

    return { cells, targets }
}
