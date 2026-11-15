import { useContext } from "react"
import SettingsContext from "../contexts/SettingsContext"

// As opções do labirinto escolhidas pelo jogador
export const useSettings = () => useContext(SettingsContext)
