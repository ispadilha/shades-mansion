import { useContext } from "react"
import GameContext from "../contexts/GameContext"

export const useGame = () => {
    const context = useContext(GameContext)
    
    const playerColor = context.playerColor
    const setPlayerColor = context.setPlayerColor
    const winner = context.winner
    const setWinner = context.setWinner

    return { playerColor, setPlayerColor, winner, setWinner }
}
