import React, { createContext, useState, type ReactNode } from "react"
import type { PieceColor, PlayerSelection } from "../logic/types"

interface GameContextValue {
    selection: PlayerSelection | null
    setSelection: (selection: PlayerSelection) => void
    winner: PieceColor | null
    setWinner: (winner: PieceColor | null) => void
}

interface GameProviderProps {
    children: ReactNode
}

const GameContext = createContext<GameContextValue>({} as GameContextValue)
export default GameContext

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
    const [selection, setSelection] = useState<PlayerSelection | null>(null)
    const [winner, setWinner] = useState<PieceColor | null>(null)

    return (
        <GameContext.Provider value={{ selection, setSelection, winner, setWinner }}>
        {children}
        </GameContext.Provider>
    )
}
