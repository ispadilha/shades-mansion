import type { Barrier, MotivationItem, PieceDefinition, PiecePosition } from "./types"
import type { Maze } from "./maze"
import { isWalkable } from "./maze"
import { atPosition, positionKey } from "./grid"
import { hasClearLine, lineSteps } from "./movement"
import { STEP_MS } from "../constants/rules"

// A investida corre em linha reta, em qualquer direção, e não para em peça nenhuma: passa
// por cima delas, aliadas ou não. O que a fecha são as paredes e as barreiras adversárias.
const chargeStopper = (piece: PieceDefinition, maze: Maze, barriers: Barrier[]) => {
    const rivalBarriers = new Set(
        barriers.filter((barrier) => barrier.color !== piece.color).map((barrier) => positionKey(barrier.position)),
    )
    return (cell: PiecePosition) => !isWalkable(maze, cell.x, cell.y) || rivalBarriers.has(positionKey(cell))
}

// Quanto a corrida leva: a peça corre na velocidade de quem anda, `STEP_MS` por casa de
// distância. Na diagonal a distância é maior, e a corrida leva mais tempo.
export const chargeDurationMs = (from: PiecePosition, to: PiecePosition) =>
    Math.round(Math.hypot(to.x - from.x, to.y - from.y) * STEP_MS)

// As casas em que a investida pode terminar: até `range` passos, com a linha livre de
// paredes e de barreiras de outros times. A casa de chegada precisa estar vazia, sem peça
// e sem item.
export function chargeCells(
    piece: PieceDefinition,
    pieces: PieceDefinition[],
    items: MotivationItem[],
    maze: Maze,
    range: number,
    barriers: Barrier[],
): PiecePosition[] {
    const stops = chargeStopper(piece, maze, barriers)
    const cells: PiecePosition[] = []

    for (let dy = -range; dy <= range; dy++) {
        for (let dx = -range; dx <= range; dx++) {
            if (dx === 0 && dy === 0) continue
            const cell = { x: piece.position.x + dx, y: piece.position.y + dy }
            if (stops(cell) || atPosition(pieces, cell) || atPosition(items, cell)) continue
            if (hasClearLine(piece.position, cell, stops)) cells.push(cell)
        }
    }

    return cells
}

// Quem a investida atropela até `to`, na ordem em que a peça passa por cima, com a fração do
// caminho em que isso acontece (de 0 a 1). Em cada passo a linha cruza uma casa, ou duas
// quando corre bem na divisa entre elas, e quem estiver em qualquer uma das cruzadas leva o
// dano. Casa que fecha a investida não é cruzada: peça protegida por barreira fica de fora.
export function chargeVictims(
    piece: PieceDefinition,
    to: PiecePosition,
    pieces: PieceDefinition[],
    maze: Maze,
    barriers: Barrier[],
): Array<{ piece: PieceDefinition; at: number }> {
    const stops = chargeStopper(piece, maze, barriers)
    const groups = lineSteps(piece.position, to)
    // `lineSteps` devolve os passos do meio do caminho.
    // O último, que chega ao destino, completa a conta.
    const steps = groups.length + 1
    return groups.flatMap((group, index) =>
        group
            .filter((cell) => !stops(cell))
            .flatMap((cell) => {
                const victim = atPosition(pieces, cell)
                return victim ? [{ piece: victim, at: (index + 1) / steps }] : []
            }),
    )
}
