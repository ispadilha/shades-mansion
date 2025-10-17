import { useContext } from "react"
import LanguageContext from "../contexts/LanguageContext"

export const useLanguage = () => {
    const context = useContext(LanguageContext)
    
    const language = context.value
    const setLanguage = context.setValue
    const t = context.t

    return { language, setLanguage, t }
}