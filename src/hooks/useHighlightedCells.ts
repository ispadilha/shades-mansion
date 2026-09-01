import { useEffect, useState } from "react"
import type { PieceDefinition, PiecePosition } from "../logic/types"
import type { Maze } from "../logic/maze"
import { lineOfFire, meleeAttackCells, reachableCells } from "../logic/movement"
import { PIECE_STATS, isRanged } from "../constants/rules"

export interface HighlightedCells {
    // Casas em que a peça selecionada pode terminar o movimento
    move: PiecePosition[]
    // Casas que ela consegue atingir
    attack: PiecePosition[]
}

// Recalcula as casas destacadas sempre que a seleção (ou o tabuleiro) muda
export const useHighlightedCells = (
    selectedId: string | null,
    pieces: PieceDefinition[],
    maze: Maze,
): HighlightedCells => {
    const [move, setMove] = useState<PiecePosition[]>([])
    const [attack, setAttack] = useState<PiecePosition[]>([])

    useEffect(() => {
        if (!selectedId) {
            setMove([])
            setAttack([])
            return
        }
        const piece = pieces.find((p) => p.id === selectedId)
        if (!piece) return

        const stats = PIECE_STATS[piece.type]
        setMove(reachableCells(piece, pieces, maze, stats.moveRange))

        // Peças de ataque à distância destacam tudo o que estiver na mira:
        // as casas até onde a linha de tiro chega livre
        if (isRanged(piece.type)) {
            setAttack(lineOfFire(piece, pieces, maze, stats.attackRange).cells)
            return
        }

        // Corpo-a-corpo: casas dentro do alcance, contornando as paredes
        setAttack(meleeAttackCells(piece, pieces, maze, stats.attackRange))
    }, [selectedId, pieces, maze])

    return { move, attack }
}
