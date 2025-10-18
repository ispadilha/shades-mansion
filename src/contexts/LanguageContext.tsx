import React, { createContext, useState, type ReactNode } from "react"
import { texts } from "../constants/texts"
import type { Language, TextKey } from "../logic/types"

interface LanguageContextValue {
    value: Language
    setValue: (lang: Language) => void
    t: (key: TextKey) => string
}

interface LanguageProviderProps {
    children: ReactNode
}

const LanguageContext = createContext<LanguageContextValue>({} as LanguageContextValue)
export default LanguageContext

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
    const [value, setValue] = useState<Language>("enUS")

    const t = (key: TextKey): string => {
        return texts[key][value]
    }

    return <LanguageContext.Provider value={{ value, setValue, t }}>{children}</LanguageContext.Provider>
}