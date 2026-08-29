import { useContext } from "react"
import GameContext from "../contexts/GameContext"

export const useGame = () => {
    const context = useContext(GameContext)

    const selection = context.selection
    const setSelection = context.setSelection
    const match = context.match
    const setMatch = context.setMatch
    const winner = context.winner
    const setWinner = context.setWinner

    return { selection, setSelection, match, setMatch, winner, setWinner }
}
