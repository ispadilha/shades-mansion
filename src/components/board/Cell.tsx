import React from "react"
import { Box } from "@mui/material"
import type { CharacterPosition, RangeKind } from "../../logic/types"
import { usePalette } from "../../hooks/usePalette"

interface CellProps {
    x: number
    y: number
    size: number
    isWall: boolean
    // O alcance destacado em que a casa está, quando está em algum
    range: RangeKind | null
    isSelected: boolean
    onCellClick: (pos: CharacterPosition) => void
    onCellContextMenu: (event: React.MouseEvent, pos: CharacterPosition) => void
}

// Uma casa do tabuleiro.
// O tabuleiro tem centenas de casas, e quase toda mudança de estado da partida desenha o tabuleiro de novo.
// Memorizada (`React.memo`), a casa só é desenhada de novo quando alguma das props dela muda, como o destaque
// ou a seleção. Por isso os dois tratadores de clique (esquerdo e direito) precisam chegar sempre com a mesma
// função (ver `useBoardInput`).
export const Cell = React.memo(function Cell({
    x,
    y,
    size,
    isWall,
    range,
    isSelected,
    onCellClick,
    onCellContextMenu,
}: CellProps) {
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
})
