import React, { type JSX } from "react"
import { Box } from "@mui/material"
import { Cell } from "./Cell"
import { PhaserBoard } from "./PhaserBoard"
import type { PieceAuras } from "../game/BoardScene"
import type { PieceDefinition, SpecialItem } from "../logic/types"
import type { FireBurst } from "../logic/combat"
import type { PiecePosition } from "../logic/types"
import type { Maze } from "../logic/maze"
import { isWall } from "../logic/maze"

interface BoardProps {
    cellSize: number
    maze: Maze
    pieces: PieceDefinition[]
    items: SpecialItem[]
    highlighted: PiecePosition[]
    attackHighlighted: PiecePosition[]
    fireBursts: FireBurst[]
    auras: PieceAuras
    selectedPieceId: string | null
    onCellClick: (pos: PiecePosition) => void
    onCellContextMenu: (event: React.MouseEvent, pos: PiecePosition) => void
}

export const Board: React.FC<BoardProps> = ({
    cellSize,
    maze,
    pieces,
    items,
    highlighted,
    attackHighlighted,
    fireBursts,
    auras,
    selectedPieceId,
    onCellClick,
    onCellContextMenu,
}) => {
    const cells: JSX.Element[] = []
    for (let y = 0; y < maze.size; y++) {
        for (let x = 0; x < maze.size; x++) {
            const piece = pieces.find((p) => p.position.x === x && p.position.y === y)
            const isHighlighted = highlighted.some((h) => h.x === x && h.y === y)
            const isAttackHighlighted = attackHighlighted.some((h) => h.x === x && h.y === y)
            const isSelected = piece?.id === selectedPieceId
            const wall = isWall(maze, x, y)
            cells.push(
                <Cell
                    key={`${x}-${y}`}
                    x={x}
                    y={y}
                    size={cellSize}
                    isWall={wall}
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
        <Box sx={{ position: "relative", width: maze.size * cellSize, height: maze.size * cellSize }}>
            {cells}
            <PhaserBoard
                cellSize={cellSize}
                maze={maze}
                pieces={pieces}
                items={items}
                fireBursts={fireBursts}
                auras={auras}
            />
        </Box>
    )
}
