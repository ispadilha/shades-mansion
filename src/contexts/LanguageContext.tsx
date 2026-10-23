import React, { createContext, useState, type ReactNode } from "react"
import { texts_ui } from "../constants/texts_ui"
import { texts_characters } from "../constants/texts_characters"
import { texts_rules } from "../constants/texts_rules"
import type { CharacterField, CharacterKey, Language, LoreField, CharacterColor, RuleKey, TextKey } from "../logic/types"

// O nome de cada time também é um texto da interface
const TEAM_TEXT_KEY: Record<CharacterColor, TextKey> = { light: "light", dark: "dark", gray: "gray" }

interface LanguageContextValue {
    value: Language
    setValue: (lang: Language) => void
    t: (key: TextKey) => string
    tTeam: (color: CharacterColor) => string
    tCharacter: (key: CharacterKey, field: CharacterField) => string
    // O nome da personagem pelo id dela, e o do item que a motiva pela chave dele.
    // Os dois são a mesma chave ("dA"), que fica só no código: o jogador só vê os nomes.
    tCharacterName: (id: string) => string
    tItemName: (key: string) => string
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

    const tTeam = (color: CharacterColor): string => {
        return texts_ui[TEAM_TEXT_KEY[color]][value]
    }

    const tCharacter = (key: CharacterKey, field: CharacterField): string => {
        return texts_characters[key][field][value]
    }

    const tCharacterName = (id: string): string => tCharacter(id as CharacterKey, "name")

    const tItemName = (key: string): string => tCharacter(key as CharacterKey, "item")

    const tRule = (key: RuleKey, field: LoreField): string => {
        return texts_rules[key][field][value]
    }

    return (
        <LanguageContext.Provider value={{ value, setValue, t, tTeam, tCharacter, tCharacterName, tItemName, tRule }}>
            {children}
        </LanguageContext.Provider>
    )
}
