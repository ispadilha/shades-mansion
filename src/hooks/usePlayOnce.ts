import { useEffect, useRef } from "react"

// Toca cada entrada de uma lista uma vez só, pelo id. As listas de efeitos do tabuleiro
// (as explosões, os números de dano, as investidas, as viradas) são estado da partida
// e voltam inteiras a cada render:
// os ids já tocados ficam guardados para a animação não repetir.
export const usePlayOnce = <T extends { id: string }>(entries: T[], play: (entry: T) => void) => {
    const playedRef = useRef(new Set<string>())

    useEffect(() => {
        for (const entry of entries) {
            if (playedRef.current.has(entry.id)) continue
            playedRef.current.add(entry.id)
            play(entry)
        }
        // `play` nasce de novo a cada render de quem chama: só a lista anuncia efeitos novos
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entries])
}
