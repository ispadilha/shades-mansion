import React, { type JSX } from "react"
import { Box } from "@mui/material"
import { Cell } from "./Cell"
import type { Piece } from "../logic/types"
import type { Position } from "../logic/types"

interface Props {
    boardSize: number
    cellSize: number
    pieces: Piece[]
    highlighted: Position[]
    onCellClick: (pos: Position, left: boolean) => void
    onPieceRightClick: (pieceId: string) => void
    selectedPieceId: string | null
}

export const Board: React.FC<Props> = ({
    boardSize, cellSize, pieces, highlighted,
    onCellClick, onPieceRightClick, selectedPieceId
}) => {
    const cells: JSX.Element[] = []
        for (let y = 0; y < boardSize; y++) {
            for (let x = 0; x < boardSize; x++) {
                const piece = pieces.find(p => p.position.x === x && p.position.y === y)
                const isHighlighted = highlighted.some(h => h.x === x && h.y === y)
                const isSelected = piece?.id === selectedPieceId
                cells.push(
                    <Cell
                    key={`${x}-${y}`}
                    x={x} y={y}
                    size={cellSize}
                    piece={piece}
                    isHighlighted={isHighlighted}
                    isSelected={isSelected}
                    onCellClick={onCellClick}
                    onPieceRightClick={onPieceRightClick}
                    />
                )
            }
        }

    return (
        <Box sx={{ position: "relative", width: boardSize * cellSize, height: boardSize * cellSize }}>
        {cells}
        </Box>
    )
}
