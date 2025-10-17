import React, { createContext, useState, type ReactNode } from "react"
import { texts } from "../constants/texts"
import type { Language, TextKey } from "../logic/types"

interface LanguageContextType {
    value: Language
    setValue: (lang: Language) => void
    t: (key: TextKey) => string
}

const LanguageContext = createContext<LanguageContextType>({} as LanguageContextType)
export default LanguageContext

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [value, setValue] = useState<Language>("ptbr")

    const t = (key: TextKey): string => {
        return texts[key][value]
    }

    return (
        <LanguageContext.Provider value={{ value, setValue, t }}>
        {children}
        </LanguageContext.Provider>
    )
}