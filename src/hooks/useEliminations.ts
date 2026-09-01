import { useEffect, useRef } from "react"
import type { PieceColor, PieceDefinition } from "../logic/types"

interface EliminationHandlers {
    onPieceEliminated: (pieceId: string) => void
    onTeamDefeated: (color: PieceColor) => void
}

// Peças eliminadas (id que desapareceu) e times derrotados (cor que desapareceu) entre
// renders. A lista de peças é a única fonte: quem sai dela saiu da partida.
export const useEliminations = (
    pieces: PieceDefinition[],
    { onPieceEliminated, onTeamDefeated }: EliminationHandlers,
) => {
    const previousRef = useRef(pieces)

    useEffect(() => {
        const previous = previousRef.current
        if (previous === pieces) return

        const currentIds = new Set(pieces.map((p) => p.id))
        for (const piece of previous) {
            if (!currentIds.has(piece.id)) onPieceEliminated(piece.id)
        }

        const previousColors = new Set(previous.map((p) => p.color))
        const currentColors = new Set(pieces.map((p) => p.color))
        for (const color of previousColors) {
            if (!currentColors.has(color)) onTeamDefeated(color)
        }

        previousRef.current = pieces
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pieces])
}
