import React, { createContext, useEffect, useState, type ReactNode } from "react"
import { PALETTES, type Palette } from "../constants/palette"
import type { ColorMode, ColorModeSetting } from "../logic/types"

// A escolha do jogador fica no navegador dele. O mesmo nome de chave está no script de
// `index.html`, que lê este valor antes da primeira pintura para a página já nascer no
// modo certo — sem isso, o jogo pisca no modo errado enquanto o React não monta.
const STORAGE_KEY = "shades-mansion:color-mode"

const DARK_QUERY = "(prefers-color-scheme: dark)"

interface ColorModeContextValue {
    // O que o jogador escolheu: um modo fixo, ou acompanhar o sistema
    setting: ColorModeSetting
    // O modo em vigor, com "system" já resolvido. É este que pinta a tela.
    mode: ColorMode
    setSetting: (setting: ColorModeSetting) => void
    palette: Palette
}

interface ColorModeProviderProps {
    children: ReactNode
}

const ColorModeContext = createContext<ColorModeContextValue>({} as ColorModeContextValue)
export default ColorModeContext

// A escolha guardada, se ainda for uma escolha válida. Qualquer outra coisa (nada
// guardado, valor de uma versão antiga, navegador sem armazenamento) cai no sistema.
const storedSetting = (): ColorModeSetting => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved === "light" || saved === "gray" || saved === "dark" || saved === "system") return saved
        return "system"
    } catch {
        return "system"
    }
}

const systemMode = (): ColorMode => (window.matchMedia(DARK_QUERY).matches ? "dark" : "light")

// O sistema só sabe dizer claro ou escuro: o cinza é um modo do jogo, escolhido à mão.
export const ColorModeProvider: React.FC<ColorModeProviderProps> = ({ children }) => {
    const [setting, setSettingState] = useState<ColorModeSetting>(storedSetting)
    const [system, setSystem] = useState<ColorMode>(systemMode)

    // Enquanto a escolha for "do sistema", trocar o tema do sistema operacional troca o do
    // jogo na hora, sem recarregar a página
    useEffect(() => {
        const query = window.matchMedia(DARK_QUERY)
        const listen = (event: MediaQueryListEvent) => setSystem(event.matches ? "dark" : "light")
        query.addEventListener("change", listen)
        return () => query.removeEventListener("change", listen)
    }, [])

    const mode = setting === "system" ? system : setting

    // O atributo no <html> é o que o CSS enxerga: é dele que sai o fundo da página e o
    // `color-scheme`, que faz o navegador desenhar barra de rolagem e campos nativos no
    // tom certo. O cinza é uma variação do escuro, e se apresenta como tal.
    useEffect(() => {
        document.documentElement.dataset.theme = mode
    }, [mode])

    const setSetting = (next: ColorModeSetting) => {
        setSettingState(next)
        try {
            localStorage.setItem(STORAGE_KEY, next)
        } catch {
            // Navegador sem armazenamento: a escolha vale só para esta sessão
        }
    }

    // Este objeto nasce de novo a cada render, o que faria todo componente que lê o
    // contexto renderizar junto. Aqui isso é o que se quer: o provider só muda quando o
    // modo muda, e quando o modo muda a tela inteira precisa mesmo ser repintada.
    return (
        <ColorModeContext.Provider value={{ setting, mode, setSetting, palette: PALETTES[mode] }}>
            {children}
        </ColorModeContext.Provider>
    )
}
