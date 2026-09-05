import React, { useMemo } from "react"
import { ThemeProvider, createTheme } from "@mui/material"
import { LanguageProvider } from "./contexts/LanguageContext"
import { GameProvider } from "./contexts/GameContext"
import { SettingsProvider } from "./contexts/SettingsContext"
import { ColorModeProvider } from "./contexts/ColorModeContext"
import { useColorMode } from "./hooks/useColorMode"
import { usePalette } from "./hooks/usePalette"

interface MuiThemeProps {
    children: React.ReactNode
}

// Sem tema próprio, o MUI desenha no tema claro: modais e menus de contexto sairiam
// brancos no meio de um jogo escuro. O tema abaixo nasce da paleta do modo em vigor,
// então o que o MUI desenha sozinho já sai na cor certa, em qualquer um dos três.
const MuiTheme: React.FC<MuiThemeProps> = ({ children }) => {
    const { mode } = useColorMode()
    const palette = usePalette()

    // Montar um tema do MUI não é barato, e ele só muda quando o modo muda
    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    // O cinza é uma variação do escuro: para o MUI, os dois são o mesmo mundo
                    mode: mode === "light" ? "light" : "dark",
                    background: { default: palette.ui.screenBg, paper: palette.surface.bg },
                    text: { primary: palette.surface.text, secondary: palette.surface.textMuted },
                    primary: { main: palette.surface.accent, contrastText: palette.surface.bg },
                    divider: palette.surface.border,
                    action: { hover: palette.surface.hover },
                },
                components: {
                    // No modo escuro o MUI clareia superfícies elevadas (o menu de contexto,
                    // por exemplo). Sem desligar isso, elas não sairiam na cor exata da paleta.
                    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
                    // Os botões nascem todos contornados. Vindo do tema, nenhuma tela precisa
                    // lembrar disso, e quem tem cor própria (os botões de time) só sobrescreve
                    // a cor da linha pelo `sx`.
                    MuiButton: {
                        styleOverrides: {
                            root: { border: `1px solid ${palette.ui.buttonOutline}` },
                        },
                    },
                },
            }),
        [mode, palette],
    )

    return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}

interface ProvidersProps {
    children: React.ReactNode
}

// O modo de cor fica por fora de todos: o tema do MUI depende dele, e a tela de opções
// precisa alcançá-lo de dentro das rotas.
export const Providers: React.FC<ProvidersProps> = ({ children }) => {
    return (
        <ColorModeProvider>
            <MuiTheme>
                <LanguageProvider>
                    <SettingsProvider>
                        <GameProvider>{children}</GameProvider>
                    </SettingsProvider>
                </LanguageProvider>
            </MuiTheme>
        </ColorModeProvider>
    )
}
