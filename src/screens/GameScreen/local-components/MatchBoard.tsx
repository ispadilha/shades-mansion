import React from "react"
import { BoardArea } from "./BoardArea"
import { useMatch } from "../../../hooks/useMatch"

interface MatchBoardProps {}

// O tabuleiro da partida em curso: pega do contexto o que há no labirinto e entrega à
// área de tabuleiro, que não precisa saber que existe uma partida por trás.
export const MatchBoard: React.FC<MatchBoardProps> = ({}) => {
    const { board } = useMatch()

    return <BoardArea {...board} />
}
