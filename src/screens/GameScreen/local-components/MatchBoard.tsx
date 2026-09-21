import React from "react"
import { BoardArea } from "./BoardArea"
import { useMatch } from "../../../hooks/useMatch"

interface MatchBoardProps {}

// O tabuleiro da partida em curso: pega do contexto o que há no labirinto e entrega à
// área de tabuleiro, que não precisa saber que existe uma partida por trás.
export const MatchBoard: React.FC<MatchBoardProps> = ({}) => {
    const { board } = useMatch()

    return (
        <BoardArea
            scrollRef={board.scrollRef}
            maze={board.maze}
            pieces={board.pieces}
            items={board.items}
            highlighted={board.moveCells}
            attackHighlighted={board.attackCells}
            fireBursts={board.fireBursts}
            auras={board.auras}
            selectedPieceId={board.selectedId}
            droppedItemId={board.droppedItemId}
            onCellClick={board.onCellClick}
            onCellContextMenu={board.onCellContextMenu}
        />
    )
}
