import React from "react"
import { ThemeProvider, createTheme } from "@mui/material"
import { LanguageProvider } from "./contexts/LanguageContext"
import { GameProvider } from "./contexts/GameContext"
import { SettingsProvider } from "./contexts/SettingsContext"
import { SURFACE_PALETTE, UI_PALETTE } from "./constants/palette"

// Sem tema próprio, o MUI desenha no tema claro: modais e menus de contexto sairiam
// brancos no meio de um jogo escuro. O tema abaixo lê a paleta, então o que o MUI
// desenha sozinho já nasce na cor certa.
const theme = createTheme({
    palette: {
        mode: "dark",
        background: { default: UI_PALETTE.screenBg, paper: SURFACE_PALETTE.bg },
        text: { primary: SURFACE_PALETTE.text, secondary: SURFACE_PALETTE.textMuted },
        primary: { main: SURFACE_PALETTE.accent, contrastText: SURFACE_PALETTE.bg },
        divider: SURFACE_PALETTE.border,
        action: { hover: SURFACE_PALETTE.hover },
    },
    components: {
        // No modo escuro o MUI clareia superfícies elevadas (o menu de contexto, por
        // exemplo). Sem desligar isso, elas não sairiam na cor exata da paleta.
        MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    },
})

interface ProvidersProps {
    children: React.ReactNode
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
    return (
        <ThemeProvider theme={theme}>
            <LanguageProvider>
                <SettingsProvider>
                    <GameProvider>{children}</GameProvider>
                </SettingsProvider>
            </LanguageProvider>
        </ThemeProvider>
    )
}
