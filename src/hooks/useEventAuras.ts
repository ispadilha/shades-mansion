import { useEffect, useRef, useState } from "react"
import type { AuraKind } from "../logic/types"
import { CAMERA_HOLD_MS } from "../constants/rules"

export type EventAuraKind = Extract<AuraKind, "promoted" | "reinvigorated">

export interface EventAuras {
    // As acesas agora, por personagem
    auras: Record<string, EventAuraKind>
    // Acende a aura na personagem. Ela dura o mesmo que a câmera fica mostrando o acontecimento
    // (`CAMERA_HOLD_MS.long`): mudar um muda o outro.
    light: (characterId: string, kind: EventAuraKind) => void
}

// As auras passageiras dos acontecimentos.
// Cada uma se apaga sozinha, e uma aura nova na mesma personagem recomeça a contagem.
export const useEventAuras = (): EventAuras => {
    const [auras, setAuras] = useState<Record<string, EventAuraKind>>({})
    // O relógio que apaga a aura de cada personagem
    const timersRef = useRef(new Map<string, number>())

    // Saindo da partida, nenhum relógio fica esperando
    useEffect(() => {
        const timers = timersRef.current
        return () => {
            for (const timer of timers.values()) clearTimeout(timer)
        }
    }, [])

    const light = (characterId: string, kind: EventAuraKind) => {
        clearTimeout(timersRef.current.get(characterId))
        setAuras((prev) => ({ ...prev, [characterId]: kind }))
        const timer = window.setTimeout(() => {
            timersRef.current.delete(characterId)
            setAuras((prev) => {
                const next = { ...prev }
                delete next[characterId]
                return next
            })
        }, CAMERA_HOLD_MS.long)
        timersRef.current.set(characterId, timer)
    }

    return { auras, light }
}
