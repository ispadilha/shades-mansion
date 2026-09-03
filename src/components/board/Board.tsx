import React, { type JSX } from "react"
import { Box } from "@mui/material"
import { Cell } from "./Cell"
import { PhaserBoard } from "./PhaserBoard"
import type { PieceAuras, PieceDefinition, PiecePosition, MotivationItem } from "../../logic/types"
import type { FireBurst } from "../../logic/combat"
import type { Maze } from "../../logic/maze"
import { isWall } from "../../logic/maze"
import { atPosition, includesPosition } from "../../logic/grid"

interface BoardProps {
    cellSize: number
    maze: Maze
    pieces: PieceDefinition[]
    items: MotivationItem[]
    highlighted: PiecePosition[]
    attackHighlighted: PiecePosition[]
    fireBursts: FireBurst[]
    auras: PieceAuras
    selectedPieceId: string | null
    // Item que caiu de volta no tabuleiro
    droppedItemId: string | null
    onCellClick: (pos: PiecePosition) => void
    onCellContextMenu: (event: React.MouseEvent, pos: PiecePosition) => void
}

// O tabuleiro é desenhado em duas camadas: as casas, em React,
// e por cima delas a cena do Phaser com as peças, os itens e as animações.
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
    droppedItemId,
    onCellClick,
    onCellContextMenu,
}) => {
    const cells: JSX.Element[] = []
    for (let y = 0; y < maze.size; y++) {
        for (let x = 0; x < maze.size; x++) {
            const position = { x, y }
            const piece = atPosition(pieces, position)
            cells.push(
                <Cell
                    key={`${x}-${y}`}
                    x={x}
                    y={y}
                    size={cellSize}
                    isWall={isWall(maze, x, y)}
                    isHighlighted={includesPosition(highlighted, position)}
                    isAttackHighlighted={includesPosition(attackHighlighted, position)}
                    isSelected={piece?.id === selectedPieceId}
                    onCellClick={onCellClick}
                    onCellContextMenu={onCellContextMenu}
                />,
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
                droppedItemId={droppedItemId}
            />
        </Box>
    )
}
