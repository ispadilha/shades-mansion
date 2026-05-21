import React, { createContext, useState, type ReactNode } from "react"
import type { MainColor, PieceColor } from "../logic/types"

interface GameContextValue {
    playerColor: MainColor | null
    setPlayerColor: (color: MainColor) => void
    winner: PieceColor | null
    setWinner: (winner: PieceColor | null) => void
}

interface GameProviderProps {
    children: ReactNode
}

const GameContext = createContext<GameContextValue>({} as GameContextValue)
export default GameContext

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
    const [playerColor, setPlayerColor] = useState<MainColor | null>(null)
    const [winner, setWinner] = useState<PieceColor | null>(null)

    return (
        <GameContext.Provider value={{ playerColor, setPlayerColor, winner, setWinner }}>
        {children}
        </GameContext.Provider>
    )
}
