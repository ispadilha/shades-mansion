import type { Position, Piece } from "./types"

export const manhattan = (a: Position, b: Position) =>
    Math.abs(a.x - b.x) + Math.abs(a.y - b.y)

export function reachableCells(
    piece: Piece,
    pieces: Piece[],
    boardSize: number,
    range = 5
) {
    const res: Position[] = [];
    for (let dx = -range; dx <= range; dx++) {
        for (let dy = -range; dy <= range; dy++) {
            if (Math.abs(dx) + Math.abs(dy) <= range) {
                const nx = piece.position.x + dx;
                const ny = piece.position.y + dy;
                if (nx >= 0 && ny >= 0 && nx < boardSize && ny < boardSize) {
                    const occupied = pieces.some(p => 
                        p.position.x === nx && p.position.y === ny && p.id !== piece.id
                    );
                    if (!occupied) {
                        res.push({ x: nx, y: ny });
                    }
                }
            }
        }
    }
    return res;
}
