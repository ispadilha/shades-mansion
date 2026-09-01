import { useRef, useState } from "react"
import type { RollView } from "../logic/rolls"

// A fila de rolagens da partida: uma de cada vez, com o controle voltando para quem a
// pediu quando ela termina de ser encenada.
export interface RollQueue {
    // Rolagem em cena (null quando não há nenhuma)
    current: RollView | null
    // Uma rolagem em resolução trava a IA e os controles do jogador até o resultado sair
    resolving: boolean
    setResolving: (resolving: boolean) => void
    // Mostra uma rolagem e devolve o controle a quem pediu quando ela termina
    show: (view: RollView, onDone: () => void) => void
    // Chamado pelo modal quando a encenação acaba
    finish: () => void
}

export const useRolls = (): RollQueue => {
    const [current, setCurrent] = useState<RollView | null>(null)
    const [resolving, setResolving] = useState(false)
    // Guardado em ref porque quem continua a jogada é decidido no momento da rolagem,
    // e não no render em que o modal se fecha
    const doneRef = useRef<(() => void) | null>(null)

    const show = (view: RollView, onDone: () => void) => {
        doneRef.current = onDone
        setCurrent(view)
    }

    const finish = () => {
        const done = doneRef.current
        doneRef.current = null
        setCurrent(null)
        done?.()
    }

    return { current, resolving, setResolving, show, finish }
}
