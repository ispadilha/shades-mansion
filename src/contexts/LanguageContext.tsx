import React, { createContext, useState, type ReactNode } from "react"
import { texts_ui } from "../constants/texts_ui"
import { texts_characters } from "../constants/texts_characters"
import { texts_rules } from "../constants/texts_rules"
import type { CharacterKey, Language, LoreField, RuleKey, TextKey } from "../logic/types"

interface LanguageContextValue {
    value: Language
    setValue: (lang: Language) => void
    t: (key: TextKey) => string
    tCharacter: (key: CharacterKey, field: LoreField) => string
    tRule: (key: RuleKey, field: LoreField) => string
}

interface LanguageProviderProps {
    children: ReactNode
}

const LanguageContext = createContext<LanguageContextValue>({} as LanguageContextValue)
export default LanguageContext

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
    const [value, setValue] = useState<Language>("enUS")

    const t = (key: TextKey): string => {
        return texts_ui[key][value]
    }

    const tCharacter = (key: CharacterKey, field: LoreField): string => {
        return texts_characters[key][field][value]
    }

    const tRule = (key: RuleKey, field: LoreField): string => {
        return texts_rules[key][field][value]
    }

    return (
        <LanguageContext.Provider value={{ value, setValue, t, tCharacter, tRule }}>{children}</LanguageContext.Provider>
    )
}
