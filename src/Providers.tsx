import React from "react"
import { LanguageProvider } from "./contexts/LanguageContext"

interface ProvidersProps {
    children: React.ReactNode
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
    return (
        <LanguageProvider>
            {children}
        </LanguageProvider>
    )
}
