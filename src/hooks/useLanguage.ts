import { useContext } from "react"
import LanguageContext from "../contexts/LanguageContext"

// O idioma atual e as funções que traduzem cada tipo de texto
export const useLanguage = () => useContext(LanguageContext)
