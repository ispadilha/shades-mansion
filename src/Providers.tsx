import React from "react"
import { LanguageProvider } from "./contexts/LanguageContext"
import { GameProvider } from "./contexts/GameContext"
import { SettingsProvider } from "./contexts/SettingsContext"

interface ProvidersProps {
    children: React.ReactNode
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
    return (
        <LanguageProvider>
            <SettingsProvider>
                <GameProvider>{children}</GameProvider>
            </SettingsProvider>
        </LanguageProvider>
    )
}
