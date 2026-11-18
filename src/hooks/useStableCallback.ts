import { useCallback, useLayoutEffect, useRef } from "react"

// Uma função que mantém a mesma identidade a cada render e sempre chama a versão mais recente de `callback`.
// É o que deixa passar um callback para um componente memorizado (`React.memo`) sem fazê-lo desenhar de novo
// à toa: a função que ele recebe nunca muda, mas o que ela faz enxerga o estado de agora.
export const useStableCallback = <Args extends unknown[], Result>(callback: (...args: Args) => Result) => {
    const latest = useRef(callback)
    // Atualizada logo depois de cada render, antes de qualquer clique chegar
    useLayoutEffect(() => {
        latest.current = callback
    })
    return useCallback((...args: Args) => latest.current(...args), [])
}
