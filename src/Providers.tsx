import React from "react"
import { ColorModeProvider } from "./contexts/ColorModeContext"
import { GameProvider } from "./contexts/GameContext"
import { LanguageProvider } from "./contexts/LanguageContext"
import { MuiThemeProvider } from "./contexts/MuiThemeProvider"
import { SettingsProvider } from "./contexts/SettingsContext"

interface ProvidersProps {
    children: React.ReactNode
}

// O modo de cor fica por fora de todos: o tema do MUI depende dele, e a tela de opções
// precisa alcançá-lo de dentro das rotas.
export const Providers: React.FC<ProvidersProps> = ({ children }) => {
    return (
        <ColorModeProvider>
            <MuiThemeProvider>
                <LanguageProvider>
                    <SettingsProvider>
                        <GameProvider>{children}</GameProvider>
                    </SettingsProvider>
                </LanguageProvider>
            </MuiThemeProvider>
        </ColorModeProvider>
    )
}
