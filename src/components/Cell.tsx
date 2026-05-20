import React from "react"
import { Box } from "@mui/material"
import type { PiecePosition } from "../logic/types"

interface CellProps {
    x: number
    y: number
    size: number
    isHighlighted: boolean
    isAttackHighlighted: boolean
    isSelected: boolean
    onCellClick: (pos: PiecePosition, left: boolean) => void
    onCellContextMenu: (event: React.MouseEvent, pos: PiecePosition) => void
}

export const Cell: React.FC<CellProps> = ({ x, y, size, isHighlighted, isAttackHighlighted, isSelected, onCellClick, onCellContextMenu }) => {
    const base = (x + y) % 2 === 0 ? "#4b2f26" : "#3b241c"
    const bg = isAttackHighlighted ? "#a63a3a" : isHighlighted ? "#a6763a" : base
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
                onCellContextMenu(e, { x, y })
            }}
            sx={{
                position: "absolute",
                left: x * size,
                top: y * size,
                width: size,
                height: size,
                bgcolor: bg,
                border,
                userSelect: "none",
            }}
        />
    )
}
