import { useContext } from "react"
import GameContext from "../contexts/GameContext"

// A partida escolhida: o time do jogador, a montagem vinda da iniciativa e quem venceu
export const useGame = () => useContext(GameContext)
