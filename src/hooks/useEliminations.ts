import { useEffect, useRef } from "react"
import type { CharacterColor, CharacterDefinition } from "../logic/types"

interface EliminationHandlers {
    onCharacterEliminated: (characterId: string) => void
    onTeamDefeated: (color: CharacterColor) => void
}

// Personagens eliminadas (id que desapareceu) e times derrotados (cor que desapareceu) entre
// renders. A lista de personagens é a única fonte: quem sai dela saiu da partida.
export const useEliminations = (
    characters: CharacterDefinition[],
    { onCharacterEliminated, onTeamDefeated }: EliminationHandlers,
) => {
    const previousRef = useRef(characters)

    useEffect(() => {
        const previous = previousRef.current
        if (previous === characters) return

        const currentIds = new Set(characters.map((p) => p.id))
        for (const character of previous) {
            if (!currentIds.has(character.id)) onCharacterEliminated(character.id)
        }

        const previousColors = new Set(previous.map((p) => p.color))
        const currentColors = new Set(characters.map((p) => p.color))
        for (const color of previousColors) {
            if (!currentColors.has(color)) onTeamDefeated(color)
        }

        previousRef.current = characters
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [characters])
}
