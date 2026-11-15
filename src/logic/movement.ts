import type { Barrier, MotivationItem, CharacterPosition, CharacterDefinition } from "./types"
import type { Maze } from "./maze"
import { isWalkable } from "./maze"
import {
    NO_BLOCKED_CELLS,
    ORTHOGONAL_STEPS,
    SURROUNDING_STEPS,
    atPosition,
    blockedCellsFor,
    positionKey,
    touching,
    type BlockedCells,
} from "./grid"
import { lineOfFire, type LineSight } from "./sight"
import { ACTION_SETTLE_MS, STEP_MS, statsFor } from "../constants/rules"

interface WalkNode {
    position: CharacterPosition
    distance: number
    previous: string | null
}

// Busca em largura pelas casas por onde se anda. As paredes bloqueiam sempre, o que
// mais bloqueia vem em `blocked` e muda a cada time: personagens e barreiras adversárias.
// O resultado guarda a distância em passos e a casa anterior, o que
// permite reconstruir o caminho andado.
function walkFrom(
    origin: CharacterPosition,
    maze: Maze,
    maxSteps = Infinity,
    blocked: BlockedCells = NO_BLOCKED_CELLS,
): Map<string, WalkNode> {
    const visited = new Map<string, WalkNode>()
    if (!isWalkable(maze, origin.x, origin.y)) return visited

    const start: WalkNode = { position: origin, distance: 0, previous: null }
    visited.set(positionKey(origin), start)

    const queue: WalkNode[] = [start]
    while (queue.length > 0) {
        const node = queue.shift()!
        if (node.distance >= maxSteps) continue

        for (const [dx, dy] of ORTHOGONAL_STEPS) {
            const next = { x: node.position.x + dx, y: node.position.y + dy }
            if (!isWalkable(maze, next.x, next.y)) continue
            const key = positionKey(next)
            if (visited.has(key) || blocked.has(key)) continue

            const child: WalkNode = { position: next, distance: node.distance + 1, previous: positionKey(node.position) }
            visited.set(key, child)
            queue.push(child)
        }
    }

    return visited
}

// Quantas casas a personagem anda numa vez, no nível em que está
export const moveRangeOf = (character: CharacterDefinition) => statsFor(character.type, character.level).moveRange

// Distância andando (contornando paredes) entre duas casas. Infinity se não houver caminho.
export function pathLength(
    from: CharacterPosition,
    to: CharacterPosition,
    maze: Maze,
    blocked: BlockedCells = NO_BLOCKED_CELLS,
): number {
    if (from.x === to.x && from.y === to.y) return 0
    return walkFrom(from, maze, Infinity, blocked).get(positionKey(to))?.distance ?? Infinity
}

// Quanto a personagem leva para chegar a uma casa, andando casa a casa
// e contornando o que está fechado para o time dela,
// com a folga para ela parar antes do que vem depois (os dados do golpe, a coleta do item)
export const walkDurationMs = (
    character: CharacterDefinition,
    to: CharacterPosition,
    maze: Maze,
    barriers: Barrier[],
    characters: CharacterDefinition[],
) => {
    const blocked = blockedCellsFor(character.color, barriers, characters)
    return pathLength(character.position, to, maze, blocked) * STEP_MS + ACTION_SETTLE_MS
}

// Distância andando de "origin" até cada casa livre alcançável, indexada por "positionKey".
export function distanceMap(
    origin: CharacterPosition,
    maze: Maze,
    blocked: BlockedCells = NO_BLOCKED_CELLS,
): Map<string, number> {
    const distances = new Map<string, number>()
    for (const [key, node] of walkFrom(origin, maze, Infinity, blocked)) distances.set(key, node.distance)
    return distances
}

// Caminho casa-a-casa entre duas posições (sem incluir a origem). Vazio se não houver caminho.
export function findPath(
    from: CharacterPosition,
    to: CharacterPosition,
    maze: Maze,
    blocked: BlockedCells = NO_BLOCKED_CELLS,
): CharacterPosition[] {
    const visited = walkFrom(from, maze, Infinity, blocked)
    const destination = visited.get(positionKey(to))
    if (!destination) return []

    const path: CharacterPosition[] = []
    let current: WalkNode | undefined = destination
    while (current && current.previous !== null) {
        path.unshift(current.position)
        current = visited.get(current.previous)
    }
    return path
}

// Casas em que a personagem pode terminar o movimento:
// Dentro do alcance andando pelo labirinto e livres de outras personagens.
export function reachableCells(
    character: CharacterDefinition,
    characters: CharacterDefinition[],
    maze: Maze,
    range = 5,
    blocked: BlockedCells = NO_BLOCKED_CELLS,
) {
    const occupied = new Set(characters.filter((p) => p.id !== character.id).map((p) => positionKey(p.position)))
    const res: CharacterPosition[] = []

    for (const [key, node] of walkFrom(character.position, maze, range, blocked)) {
        if (node.distance === 0 || occupied.has(key)) continue
        res.push(node.position)
    }

    return res
}

// Encontra a casa adjacente ao alvo (8 vizinhas, com diagonais) livre e mais barata de
// alcançar andando. Se o atacante já está adjacente, retorna sua própria posição.
// Retorna null se nenhuma casa em volta do alvo estiver ao alcance.
// O alvo pode ser uma personagem ou uma barreira: só a casa dele importa.
//
// Casa com item não está livre para quem vai golpear: parar nela é coletar, e coletar é
// outra ação. O item precisa sair antes para a casa ficar vaga.
export function findApproachCell(
    attacker: CharacterDefinition,
    target: { position: CharacterPosition },
    characters: CharacterDefinition[],
    items: MotivationItem[],
    maze: Maze,
    walkRange: number,
    blocked: BlockedCells = NO_BLOCKED_CELLS,
): CharacterPosition | null {
    if (touching(attacker.position, target.position)) return attacker.position

    const candidates = SURROUNDING_STEPS.map(([dx, dy]) => ({
        x: target.position.x + dx,
        y: target.position.y + dy,
    }))

    const visited = walkFrom(attacker.position, maze, walkRange, blocked)
    let best: { cell: CharacterPosition; distance: number } | null = null

    for (const candidate of candidates) {
        if (!isWalkable(maze, candidate.x, candidate.y)) continue
        const occupant = atPosition(characters, candidate)
        if (occupant && occupant.id !== attacker.id) continue
        if (atPosition(items, candidate)) continue

        const node = visited.get(positionKey(candidate))
        if (!node) continue
        if (best === null || node.distance < best.distance) best = { cell: candidate, distance: node.distance }
    }

    return best?.cell ?? null
}

export function meleeAttackCells(
    character: CharacterDefinition,
    characters: CharacterDefinition[],
    items: MotivationItem[],
    maze: Maze,
    walkRange: number,
    blocked: BlockedCells = NO_BLOCKED_CELLS,
): CharacterPosition[] {
    const cells = new Map<string, CharacterPosition>()
    const add = (cell: CharacterPosition) => {
        if (!isWalkable(maze, cell.x, cell.y)) return
        cells.set(positionKey(cell), cell)
    }

    // Casas de onde ela não golpeia: as de outras personagens (a própria fica de fora)
    // e as que têm item, que para quem vai golpear não estão vagas
    const occupied = new Set([
        ...characters.filter((p) => p.id !== character.id).map((p) => positionKey(p.position)),
        ...items.map((item) => positionKey(item.position)),
    ])

    for (const [key, node] of walkFrom(character.position, maze, walkRange, blocked)) {
        add(node.position)
        // O ataque melee só parte de onde a personagem consegue ficar parada.
        // Casa de uma aliada se passa, mas não se ocupa.
        if (occupied.has(key)) continue
        for (const [dx, dy] of SURROUNDING_STEPS) add({ x: node.position.x + dx, y: node.position.y + dy })
    }
    cells.delete(positionKey(character.position))

    // Casa ocupada só entra se sobrar onde encostar na personagem que está nela
    return [...cells.values()].filter((cell) => {
        const occupant = atPosition(characters, cell)
        return (
            !occupant ||
            occupant.id === character.id ||
            findApproachCell(character, occupant, characters, items, maze, walkRange, blocked) !== null
        )
    })
}

// O que a personagem anda para golpear: o mesmo que ela anda para se mover. Encostar é que
// alcança a casa seguinte, e isso já está em `meleeAttackCells` e `findApproachCell`.
export const strikeWalkRange = moveRangeOf

// Como o golpe chega ao alvo: andando até encostar, ou por uma linha de tiro. Cada jeito
// precisa de uma coisa diferente: quem anda, das casas fechadas para ele; quem atira, do
// que interrompe a linha da habilidade.
export type Strike =
    | { ranged: false; range: number; blocked: BlockedCells; items: MotivationItem[] }
    | { ranged: true; range: number; sight: LineSight }

// A personagem consegue acertar o alvo daqui? É a mesma pergunta que o destaque do tabuleiro
// responde em cores. O alvo pode ser uma barreira, que só um golpe corpo a corpo alcança.
export function canHitTarget(
    attacker: CharacterDefinition,
    target: { id: string; position: CharacterPosition },
    characters: CharacterDefinition[],
    maze: Maze,
    strike: Strike,
): boolean {
    if (strike.ranged) {
        return lineOfFire(attacker, characters, maze, strike.range, strike.sight).targets.some((t) => t.id === target.id)
    }
    return findApproachCell(attacker, target, characters, strike.items, maze, strike.range, strike.blocked) !== null
}
