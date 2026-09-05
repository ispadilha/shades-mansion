import { useContext } from "react"
import ColorModeContext from "../contexts/ColorModeContext"

// As cores do modo em vigor. É por aqui que todo componente pede cor de superfície:
// fundo, texto, borda, botão. As cores de identidade do jogo (times, fogo, itens)
// continuam sendo importadas direto de `constants/palette`, porque não mudam de modo.
export const usePalette = () => {
    return useContext(ColorModeContext).palette
}
