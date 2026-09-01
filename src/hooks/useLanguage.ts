import { useContext } from "react"
import LanguageContext from "../contexts/LanguageContext"

export const useLanguage = () => {
    const context = useContext(LanguageContext)
    
    const language = context.value
    const setLanguage = context.setValue
    const t = context.t
    const tTeam = context.tTeam
    const tCharacter = context.tCharacter
    const tRule = context.tRule

    return { language, setLanguage, t, tTeam, tCharacter, tRule }
}
