import { useMemo } from "react"
import type { CharacterAuras } from "../logic/types"
import type { EventAuraKind } from "./useEventAuras"

interface AurasOptions {
    activeCharacterId: string | null
    // A dupla de afinidade que se revigora agora
    affinityDuo: string[]
    // Quem acabou de ser promovida ou revigorada pelo item, com a aura do que aconteceu
    eventAuras: Record<string, EventAuraKind>
    // Quem está usando a habilidade: a personagem do jogador com uma em uso, ou a da IA
    skillCharacterId: string | null
    manipulatedId: string | null
    // As rivais em duelo, enquanto os dados delas rolam
    rivals: string[]
}

// As auras, desenhadas tanto pelo tabuleiro quanto pelo HUD.
// Cada personagem tem uma aura só: quando mais de uma cabe nela, fica a última da lista.
// A vez fica por baixo de tudo. Por cima dela, o que acabou de acontecer com a personagem
// (Promoção, revigorar por dupla ou por item). Por cima disso, o que está em curso:
// Habilidade em uso, manipulação. E por cima de tudo, as rivais em duelo.
export const useAuras = ({
    activeCharacterId,
    affinityDuo,
    eventAuras,
    skillCharacterId,
    manipulatedId,
    rivals,
}: AurasOptions): CharacterAuras =>
    useMemo(() => {
        const auras: CharacterAuras = {}
        if (activeCharacterId) auras[activeCharacterId] = "active"
        for (const id of affinityDuo) auras[id] = "affinity"
        Object.assign(auras, eventAuras)
        if (skillCharacterId) auras[skillCharacterId] = "skill"
        if (manipulatedId) auras[manipulatedId] = "manipulated"
        for (const id of rivals) auras[id] = "rivalry"
        return auras
    }, [activeCharacterId, affinityDuo, eventAuras, skillCharacterId, manipulatedId, rivals])
