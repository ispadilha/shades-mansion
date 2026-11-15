import { useMemo } from "react"
import type { CharacterAuras } from "../logic/types"

interface AurasOptions {
    activeCharacterId: string | null
    // A dupla de afinidade que se revigora agora
    affinityDuo: string[]
    // Quem está usando a habilidade: a personagem do jogador com uma em uso, ou a da IA
    skillCharacterId: string | null
    manipulatedId: string | null
    // As rivais em duelo, enquanto os dados delas rolam
    rivals: string[]
}

// As auras, desenhadas tanto pelo tabuleiro quanto pelo HUD.
// Cada personagem tem uma aura só: quando mais de uma cabe nela, fica a última da lista,
// que é sempre a mais passageira (a dupla que se revigora por cima da vez, e as rivais em
// duelo por cima de tudo).
export const useAuras = ({
    activeCharacterId,
    affinityDuo,
    skillCharacterId,
    manipulatedId,
    rivals,
}: AurasOptions): CharacterAuras =>
    useMemo(() => {
        const auras: CharacterAuras = {}
        if (activeCharacterId) auras[activeCharacterId] = "active"
        for (const id of affinityDuo) auras[id] = "affinity"
        if (skillCharacterId) auras[skillCharacterId] = "skill"
        if (manipulatedId) auras[manipulatedId] = "manipulated"
        for (const id of rivals) auras[id] = "rivalry"
        return auras
    }, [activeCharacterId, affinityDuo, skillCharacterId, manipulatedId, rivals])
