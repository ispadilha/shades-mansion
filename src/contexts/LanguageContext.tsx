import React, { createContext, useState, type ReactNode } from "react"
import { texts_ui } from "../constants/texts_ui"
import { texts_characters } from "../constants/texts_characters"
import { texts_rules } from "../constants/texts_rules"
import type { CharacterField, CharacterKey, Language, LoreField, CharacterColor, RuleKey, TextKey } from "../logic/types"

interface LanguageContextValue {
    language: Language
    setLanguage: (language: Language) => void
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
    const [language, setLanguage] = useState<Language>("enUS")

    const t = (key: TextKey) => texts_ui[key][language]

    // O nome de cada time é um texto da interface com a própria cor por chave
    const tTeam = (color: CharacterColor) => t(color)

    const tCharacter = (key: CharacterKey, field: CharacterField) => texts_characters[key][field][language]

    const tCharacterName = (id: string) => tCharacter(id as CharacterKey, "name")

    const tItemName = (key: string) => tCharacter(key as CharacterKey, "item")

    const tRule = (key: RuleKey, field: LoreField) => texts_rules[key][field][language]

    return (
        <LanguageContext.Provider
            value={{ language, setLanguage, t, tTeam, tCharacter, tCharacterName, tItemName, tRule }}
        >
            {children}
        </LanguageContext.Provider>
    )
}
