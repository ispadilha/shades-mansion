import { useContext } from "react"
import ColorModeContext from "../contexts/ColorModeContext"

// A escolha de modo em si. Só quem mexe na escolha precisa disto (a tela de opções);
// quem só quer pintar usa `usePalette`.
export const useColorMode = () => {
    const context = useContext(ColorModeContext)

    return {
        setting: context.setting,
        mode: context.mode,
        setSetting: context.setSetting,
    }
}
