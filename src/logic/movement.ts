import type { PiecePosition, PieceDefinition } from "./types"

export const manhattan = (a: PiecePosition, b: PiecePosition) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)

export function reachableCells(piece: PieceDefinition, pieces: PieceDefinition[], boardSize: number, range = 5) {
    const res: PiecePosition[] = []
    for (let dx = -range; dx <= range; dx++) {
        for (let dy = -range; dy <= range; dy++) {
            if (Math.abs(dx) + Math.abs(dy) <= range) {
                const nx = piece.position.x + dx
                const ny = piece.position.y + dy
                if (nx >= 0 && ny >= 0 && nx < boardSize && ny < boardSize) {
                    const occupied = pieces.some((p) => p.position.x === nx && p.position.y === ny && p.id !== piece.id)
                    if (!occupied) {
                        res.push({ x: nx, y: ny })
                    }
                }
            }
        }
    }
    return res
}

// Encontra a casa adjacente ao alvo (8 vizinhas, com diagonais) mais próxima do
// atacante e livre. Se o atacante já está adjacente, retorna sua própria posição.
// Retorna null se nenhuma das 8 casas em volta do alvo estiver disponível.
export function findApproachCell(
    attacker: PieceDefinition,
    target: PieceDefinition,
    pieces: PieceDefinition[],
    boardSize: number,
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

    const valid = candidates.filter((c) => {
        if (c.x < 0 || c.y < 0 || c.x >= boardSize || c.y >= boardSize) return false
        const occupant = pieces.find((p) => p.position.x === c.x && p.position.y === c.y)
        return !occupant || occupant.id === attacker.id
    })

    if (valid.length === 0) return null

    return valid.reduce((best, c) => (manhattan(attacker.position, c) < manhattan(attacker.position, best) ? c : best))
}
