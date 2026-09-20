import { useEffect, useState } from "react"
import { IDLE_HINT_MS } from "../constants/rules"

interface IdleHintOptions {
    // A dica aparece quando é a vez do jogador e não há nada em cena
    enabled: boolean
    // "Fases" para a dica aparecer:
    // Se ainda não selecionou peça, ou se ainda não escolheu ação
    phase: string
}

export interface IdleHint {
    visible: boolean
    dismiss: () => void
}

export const useIdleHint = ({ enabled, phase }: IdleHintOptions): IdleHint => {
    const [visible, setVisible] = useState(false)
    const [dismissedPhase, setDismissedPhase] = useState<string | null>(null)

    useEffect(() => {
        setVisible(false)
        if (!enabled || dismissedPhase === phase) return

        const timer = window.setTimeout(() => setVisible(true), IDLE_HINT_MS)
        return () => clearTimeout(timer)
    }, [enabled, phase, dismissedPhase])

    return { visible, dismiss: () => setDismissedPhase(phase) }
}
