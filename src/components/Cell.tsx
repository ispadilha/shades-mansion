import React from "react"
import { Box } from "@mui/material"
import type { PiecePosition } from "../logic/types"
import { BOARD_PALETTE, RANGE_PALETTE } from "../constants/palette"

interface CellProps {
    x: number
    y: number
    size: number
    isWall: boolean
    isHighlighted: boolean
    isAttackHighlighted: boolean
    isSelected: boolean
    onCellClick: (pos: PiecePosition) => void
    onCellContextMenu: (event: React.MouseEvent, pos: PiecePosition) => void
}

export const Cell: React.FC<CellProps> = ({ x, y, size, isWall, isHighlighted, isAttackHighlighted, isSelected, onCellClick, onCellContextMenu }) => {
    const base = (x + y) % 2 === 0 ? BOARD_PALETTE.floorLight : BOARD_PALETTE.floorDark
    const range =
        isHighlighted && isAttackHighlighted
            ? RANGE_PALETTE.both
            : isAttackHighlighted
              ? RANGE_PALETTE.attack
              : isHighlighted
                ? RANGE_PALETTE.move
                : null
    const bg = isWall ? BOARD_PALETTE.wall : (range ?? base)
    const border = isWall
        ? `1px solid ${BOARD_PALETTE.wall}`
        : isSelected
          ? `2px solid ${BOARD_PALETTE.selected}`
          : `1px solid ${BOARD_PALETTE.cellBorder}`

    return (
        <Box
            onClick={() => onCellClick({ x, y })}
            onContextMenu={(e) => {
                e.preventDefault()
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
