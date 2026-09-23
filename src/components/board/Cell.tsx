import React from "react"
import { Box } from "@mui/material"
import type { PiecePosition } from "../../logic/types"
import { usePalette } from "../../hooks/usePalette"

interface CellProps {
    x: number
    y: number
    size: number
    isWall: boolean
    isHighlighted: boolean
    isAttackHighlighted: boolean
    isSkillHighlighted: boolean
    isSelected: boolean
    onCellClick: (pos: PiecePosition) => void
    onCellContextMenu: (event: React.MouseEvent, pos: PiecePosition) => void
}

export const Cell: React.FC<CellProps> = ({
    x,
    y,
    size,
    isWall,
    isHighlighted,
    isAttackHighlighted,
    isSkillHighlighted,
    isSelected,
    onCellClick,
    onCellContextMenu,
}) => {
    const palette = usePalette()
    const base = (x + y) % 2 === 0 ? palette.board.floorLight : palette.board.floorDark
    const range = isSkillHighlighted
        ? palette.range.skill
        : isHighlighted && isAttackHighlighted
          ? palette.range.both
          : isAttackHighlighted
            ? palette.range.attack
            : isHighlighted
              ? palette.range.move
              : null
    const bg = isWall ? palette.board.wall : (range ?? base)
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
