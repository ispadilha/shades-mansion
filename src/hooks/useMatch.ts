import { useContext } from "react"
import MatchContext from "../contexts/MatchContext"

// A partida em curso, para quem a desenha.
// Cada pedaço é um assunto do jogo, e cabe a quem lê traduzir o assunto
// nas props do componente que vai mostrá-lo.
export const useMatch = () => useContext(MatchContext)
