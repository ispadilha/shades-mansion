import { useRef, useState } from "react"
import type { RollView } from "../logic/rolls"
import { MODAL_FADE_MS } from "../constants/rules"

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
    // Roda `run` quando o modal da rolagem que acabou, terminar de sumir (o fade),
    // ou já, se nenhum estiver sumindo:
    // o que aparece no tabuleiro logo depois de uma rolagem não fica por baixo dele
    afterFade: (run: () => void) => void
}

export const useRolls = (): RollQueue => {
    const [current, setCurrent] = useState<RollView | null>(null)
    const [resolving, setResolving] = useState(false)
    // Guardado em ref porque quem continua a jogada é decidido no momento da rolagem,
    // e não no render em que o modal se fecha
    const doneRef = useRef<(() => void) | null>(null)
    // Até quando o modal da última rolagem ainda está sumindo.
    // Outra rolagem em cena desfaz isso: aí o modal não chega a sumir,
    // só troca de rolagem.
    const fadingUntilRef = useRef(0)

    const show = (view: RollView, onDone: () => void) => {
        doneRef.current = onDone
        fadingUntilRef.current = 0
        setCurrent(view)
    }

    const finish = () => {
        const done = doneRef.current
        doneRef.current = null
        setCurrent(null)
        fadingUntilRef.current = performance.now() + MODAL_FADE_MS
        done?.()
    }

    const afterFade = (run: () => void) => {
        const wait = fadingUntilRef.current - performance.now()
        if (wait > 0) window.setTimeout(run, wait)
        else run()
    }

    return { current, resolving, setResolving, show, finish, afterFade }
}
