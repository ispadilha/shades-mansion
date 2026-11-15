import type { Barrier, CharacterDefinition, CharacterPosition, LineBlockers } from "./types"
import type { Maze } from "./maze"
import { isWalkable } from "./maze"
import { positionKey } from "./grid"

// A linha reta entre duas casas: por onde passa um tiro, uma investida ou o olhar da imitação.
// Andar é com `movement.ts`. Aqui não contorna parede, a linha para nela.

// Coordenada da linha de tiro em um dos eixos. Normalmente ela cai dentro de uma casa,
// mas pode cair exatamente na divisa entre duas, e aí as duas contam.
// A conta é feita com inteiros para que a divisa seja reconhecida sem erro de arredondamento.
function axisCells(origin: number, delta: number, step: number, steps: number): number[] {
    const numerator = delta * step
    const quotient = Math.floor(numerator / steps)
    const remainder = numerator - quotient * steps

    if (remainder * 2 === steps) return [origin + quotient, origin + quotient + 1]
    return [origin + quotient + (remainder * 2 > steps ? 1 : 0)]
}

// As casas que a linha reta entre duas posições atravessa, sem a origem nem o destino.
// A linha é percorrida pelo eixo de maior variação, um passo por casa andada nesse eixo.
// Cada passo devolve uma casa, ou o par de casas quando ela passa bem na divisa entre duas.
export function lineSteps(from: CharacterPosition, to: CharacterPosition): CharacterPosition[][] {
    const dx = to.x - from.x
    const dy = to.y - from.y
    const steps = Math.max(Math.abs(dx), Math.abs(dy))

    const groups: CharacterPosition[][] = []
    for (let step = 1; step < steps; step++) {
        const xs = axisCells(from.x, dx, step, steps)
        const ys = axisCells(from.y, dy, step, steps)
        groups.push(xs.flatMap((x) => ys.map((y) => ({ x, y }))))
    }
    return groups
}

// A linha só passa enquanto sobrar por onde passar: em cada passo basta uma das
// casas do par estar livre. Quando a linha corre na divisa entre duas casas e as duas
// estão bloqueadas, ela para ali.
export function hasClearLine(
    from: CharacterPosition,
    to: CharacterPosition,
    blocked: (cell: CharacterPosition) => boolean,
): boolean {
    return lineSteps(from, to).every((group) => group.some((cell) => !blocked(cell)))
}

// O que a linha de tiro precisa saber para decidir onde para:
// as barreiras acesas e o que interrompe a linha, dependendo da habilidade.
export interface LineSight {
    barriers: Barrier[]
    blockedBy: LineBlockers
}

// Ataque à distância: acerta qualquer casa a até "range" passos (contados em
// linha reta, na diagonal inclusive) cuja linha de tiro chegue inteira até lá.
// Não precisa ser pela linha, pela coluna ou pela diagonal.
// Paredes sempre interrompem a linha.
// Personagens e barreiras podem interromper conforme a habilidade que dispara.
//
// `cells` são as casas visadas (para destacar no tabuleiro) e `targets`, as personagens que
// estão nelas.
export function lineOfFire(
    character: CharacterDefinition,
    characters: CharacterDefinition[],
    maze: Maze,
    range: number,
    sight: LineSight,
): { cells: CharacterPosition[]; targets: CharacterDefinition[] } {
    const others = characters.filter((p) => p.id !== character.id)
    const occupants = new Map(others.map((p) => [positionKey(p.position), p]))
    // Barreira só interrompe a linha de quem é de outro time
    const opponentBarriers = new Set(
        sight.blockedBy.barriers
            ? sight.barriers.filter((b) => b.color !== character.color).map((b) => positionKey(b.position))
            : [],
    )
    const stopsShot = (cell: CharacterPosition) => {
        const key = positionKey(cell)
        return (
            !isWalkable(maze, cell.x, cell.y) ||
            (sight.blockedBy.characters && occupants.has(key)) ||
            opponentBarriers.has(key)
        )
    }

    const cells: CharacterPosition[] = []
    const targets: CharacterDefinition[] = []

    for (let dy = -range; dy <= range; dy++) {
        for (let dx = -range; dx <= range; dx++) {
            if (dx === 0 && dy === 0) continue

            // A casa visada não passa por `stopsShot`:
            // Ali está o alvo. O que fecha o tiro são as casas no caminho.
            const cell = { x: character.position.x + dx, y: character.position.y + dy }
            if (!isWalkable(maze, cell.x, cell.y)) continue
            if (!hasClearLine(character.position, cell, stopsShot)) continue

            cells.push(cell)
            const occupant = occupants.get(positionKey(cell))
            if (occupant) targets.push(occupant)
        }
    }

    return { cells, targets }
}
