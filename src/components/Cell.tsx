import React from "react"
import { Box } from "@mui/material"
import { Piece } from "./Piece"
import type { PieceType } from "../logic/types"
import type { PiecePosition } from "../logic/types"

interface CellProps {
    x: number
    y: number
    size: number
    piece?: PieceType | undefined
    isHighlighted: boolean
    isSelected: boolean
    onCellClick: (pos: PiecePosition, left: boolean) => void
    onPieceRightClick: (pieceId: string) => void
}

export const Cell: React.FC<CellProps> = ({ x, y, size, piece, isHighlighted, isSelected, onCellClick, onPieceRightClick }) => {
    const base = (x + y) % 2 === 0 ? "#4b2f26" : "#3b241c"
    const bg = isHighlighted ? "#a6763a" : base
    const border = isSelected ? "2px solid #ffd700" : "1px solid rgba(0,0,0,0.2)"

    return (
        <Box
            onClick={(e) => {
                e.stopPropagation()
                onCellClick({ x, y }, true)
            }}
            onContextMenu={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (piece) onPieceRightClick(piece.id)
            }}
            sx={{
                position: "absolute",
                left: x * size,
                top: y * size,
                width: size,
                height: size,
                bgcolor: bg,
                border,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                userSelect: "none",
            }}
        >
            {piece && <Piece piece={piece} />}
        </Box>
    )
}
