import React from "react"
import { LanguageProvider } from "./contexts/LanguageContext"
import { GameProvider } from "./contexts/GameContext"

interface ProvidersProps {
    children: React.ReactNode
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
    return (
        <LanguageProvider>
            <GameProvider>{children}</GameProvider>
        </LanguageProvider>
    )
}
