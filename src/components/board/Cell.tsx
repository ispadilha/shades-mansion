import React from "react"
import { Box } from "@mui/material"
import type { PiecePosition, RangeKind } from "../../logic/types"
import { usePalette } from "../../hooks/usePalette"

interface CellProps {
    x: number
    y: number
    size: number
    isWall: boolean
    // O alcance destacado em que a casa está, quando está em algum
    range: RangeKind | null
    isSelected: boolean
    onCellClick: (pos: PiecePosition) => void
    onCellContextMenu: (event: React.MouseEvent, pos: PiecePosition) => void
}

export const Cell: React.FC<CellProps> = ({
    x,
    y,
    size,
    isWall,
    range,
    isSelected,
    onCellClick,
    onCellContextMenu,
}) => {
    const palette = usePalette()
    const base = (x + y) % 2 === 0 ? palette.board.floorLight : palette.board.floorDark
    const bg = isWall ? palette.board.wall : range ? palette.range[range] : base
    const border = isWall
        ? `1px solid ${palette.board.wall}`
        : isSelected
          ? `2px solid ${palette.board.selected}`
          : `1px solid ${palette.board.cellBorder}`

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
