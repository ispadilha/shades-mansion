import type { Barrier, PieceDefinition, PiecePosition } from "./types"
import type { Maze } from "./maze"
import { atPosition, positionKey } from "./grid"
import { lineOfFire } from "./movement"

// As barreiras que uma peça mantém acesas
export const barriersOf = (barriers: Barrier[], pieceId: string) =>
    barriers.filter((barrier) => barrier.ownerId === pieceId)

// Onde a peça consegue acender uma barreira: dentro do alcance da habilidade e em linha
// desimpedida. É a mesma geometria do tiro, porque a barreira também é acesa à distância
// e não atravessa paredes.
//
// A casa vale se não contiver outra barreira existente, nem peça adversária
export const barrierCells = (
    piece: PieceDefinition,
    pieces: PieceDefinition[],
    barriers: Barrier[],
    maze: Maze,
    range: number,
): PiecePosition[] => {
    const lit = new Set(barriers.map((barrier) => positionKey(barrier.position)))
    // A própria casa não sai na linha de tiro, mas é válida para acender uma barreira
    const candidates = [piece.position, ...lineOfFire(piece, pieces, maze, range).cells]

    return candidates.filter((cell) => {
        if (lit.has(positionKey(cell))) return false
        const occupant = atPosition(pieces, cell)
        return !occupant || occupant.color === piece.color
    })
}

// A barreira acesa por uma peça em uma casa. O id carrega a casa para o desenho da cena
// conseguir distinguir uma barreira nova de uma que só mudou de lugar na lista.
export const litBarrier = (owner: PieceDefinition, position: PiecePosition): Barrier => ({
    id: `${owner.id}@${positionKey(position)}`,
    color: owner.color,
    ownerId: owner.id,
    position,
})
