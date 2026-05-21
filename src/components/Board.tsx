import React, { type JSX } from "react"
import { Box } from "@mui/material"
import { Cell } from "./Cell"
import { PhaserBoard } from "./PhaserBoard"
import type { PieceDefinition, SpecialItem } from "../logic/types"
import type { PiecePosition } from "../logic/types"

interface BoardProps {
    boardSize: number
    cellSize: number
    pieces: PieceDefinition[]
    items: SpecialItem[]
    highlighted: PiecePosition[]
    attackHighlighted: PiecePosition[]
    selectedPieceId: string | null
    onCellClick: (pos: PiecePosition, left: boolean) => void
    onCellContextMenu: (event: React.MouseEvent, pos: PiecePosition) => void
}

export const Board: React.FC<BoardProps> = ({
    boardSize,
    cellSize,
    pieces,
    items,
    highlighted,
    attackHighlighted,
    selectedPieceId,
    onCellClick,
    onCellContextMenu,
}) => {
    const cells: JSX.Element[] = []
    for (let y = 0; y < boardSize; y++) {
        for (let x = 0; x < boardSize; x++) {
            const piece = pieces.find((p) => p.position.x === x && p.position.y === y)
            const isHighlighted = highlighted.some((h) => h.x === x && h.y === y)
            const isAttackHighlighted = attackHighlighted.some((h) => h.x === x && h.y === y)
            const isSelected = piece?.id === selectedPieceId
            cells.push(
                <Cell
                    key={`${x}-${y}`}
                    x={x}
                    y={y}
                    size={cellSize}
                    isHighlighted={isHighlighted}
                    isAttackHighlighted={isAttackHighlighted}
                    isSelected={isSelected}
                    onCellClick={onCellClick}
                    onCellContextMenu={onCellContextMenu}
                />
            )
        }
    }

    return (
        <Box sx={{ position: "relative", width: boardSize * cellSize, height: boardSize * cellSize }}>
            {cells}
            <PhaserBoard boardSize={boardSize} cellSize={cellSize} pieces={pieces} items={items} />
        </Box>
    )
}
