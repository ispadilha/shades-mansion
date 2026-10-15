import React, { createContext, useState, type ReactNode } from "react"
import type { CharacterColor, PlayerSelection } from "../logic/types"
import type { MatchSetup } from "../logic/setup"

interface GameContextValue {
    selection: PlayerSelection | null
    setSelection: (selection: PlayerSelection) => void
    // Labirinto, personagens, itens e ordem dos turnos preparados na tela de iniciativa.
    // A tela de jogo só começa depois que isto está pronto — assim o tabuleiro nunca
    // aparece sendo montado.
    match: MatchSetup | null
    setMatch: (match: MatchSetup | null) => void
    winner: CharacterColor | null
    setWinner: (winner: CharacterColor | null) => void
}

interface GameProviderProps {
    children: ReactNode
}

const GameContext = createContext<GameContextValue>({} as GameContextValue)
export default GameContext

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
    const [selection, setSelection] = useState<PlayerSelection | null>(null)
    const [match, setMatch] = useState<MatchSetup | null>(null)
    const [winner, setWinner] = useState<CharacterColor | null>(null)

    return (
        <GameContext.Provider value={{ selection, setSelection, match, setMatch, winner, setWinner }}>
        {children}
        </GameContext.Provider>
    )
}
