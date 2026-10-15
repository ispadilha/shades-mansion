import type { Barrier, MotivationItem, CharacterDefinition, CharacterPosition } from "./types"
import type { Maze } from "./maze"
import { isWalkable } from "./maze"
import { atPosition, positionKey } from "./grid"
import { hasClearLine, lineSteps } from "./movement"
import { STEP_MS } from "../constants/rules"

// A investida corre em linha reta, em qualquer direção, e não para em personagem nenhuma: passa
// por cima delas, aliadas ou não. O que a fecha são as paredes e as barreiras adversárias.
const chargeStopper = (character: CharacterDefinition, maze: Maze, barriers: Barrier[]) => {
    const rivalBarriers = new Set(
        barriers.filter((barrier) => barrier.color !== character.color).map((barrier) => positionKey(barrier.position)),
    )
    return (cell: CharacterPosition) => !isWalkable(maze, cell.x, cell.y) || rivalBarriers.has(positionKey(cell))
}

// Quanto a corrida leva: a personagem corre na velocidade de quem anda, `STEP_MS` por casa de
// distância. Na diagonal a distância é maior, e a corrida leva mais tempo.
export const chargeDurationMs = (from: CharacterPosition, to: CharacterPosition) =>
    Math.round(Math.hypot(to.x - from.x, to.y - from.y) * STEP_MS)

// As casas em que a investida pode terminar: até `range` passos, com a linha livre de
// paredes e de barreiras de outros times. A casa de chegada precisa estar vazia, sem personagem
// e sem item.
export function chargeCells(
    character: CharacterDefinition,
    characters: CharacterDefinition[],
    items: MotivationItem[],
    maze: Maze,
    range: number,
    barriers: Barrier[],
): CharacterPosition[] {
    const stops = chargeStopper(character, maze, barriers)
    const cells: CharacterPosition[] = []

    for (let dy = -range; dy <= range; dy++) {
        for (let dx = -range; dx <= range; dx++) {
            if (dx === 0 && dy === 0) continue
            const cell = { x: character.position.x + dx, y: character.position.y + dy }
            if (stops(cell) || atPosition(characters, cell) || atPosition(items, cell)) continue
            if (hasClearLine(character.position, cell, stops)) cells.push(cell)
        }
    }

    return cells
}

// Quem a investida atropela até `to`, na ordem em que a personagem passa por cima, com a fração do
// caminho em que isso acontece (de 0 a 1). Em cada passo a linha cruza uma casa, ou duas
// quando corre bem na divisa entre elas, e quem estiver em qualquer uma das cruzadas leva o
// dano. Casa que fecha a investida não é cruzada: personagem protegida por barreira fica de fora.
export function chargeVictims(
    character: CharacterDefinition,
    to: CharacterPosition,
    characters: CharacterDefinition[],
    maze: Maze,
    barriers: Barrier[],
): Array<{ character: CharacterDefinition; at: number }> {
    const stops = chargeStopper(character, maze, barriers)
    const groups = lineSteps(character.position, to)
    // `lineSteps` devolve os passos do meio do caminho.
    // O último, que chega ao destino, completa a conta.
    const steps = groups.length + 1
    return groups.flatMap((group, index) =>
        group
            .filter((cell) => !stops(cell))
            .flatMap((cell) => {
                const victim = atPosition(characters, cell)
                return victim ? [{ character: victim, at: (index + 1) / steps }] : []
            }),
    )
}
