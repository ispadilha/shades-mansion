import React, { type JSX } from "react"
import { Box } from "@mui/material"
import { Cell } from "./Cell"
import { PhaserBoard, type PhaserBoardProps } from "./PhaserBoard"
import type { CharacterPosition, RangeKind } from "../../logic/types"
import { isWall } from "../../logic/maze"
import { positionKey, samePosition } from "../../logic/grid"

// O que a cena desenha, mais o que é das casas em React: os destaques e os cliques
export interface BoardProps extends PhaserBoardProps {
    // De que alcance é cada casa destacada, pela `positionKey` dela
    ranges: ReadonlyMap<string, RangeKind>
    selectedId: string | null
    onCellClick: (position: CharacterPosition) => void
    onCellContextMenu: (event: React.MouseEvent, position: CharacterPosition) => void
}

// O tabuleiro é desenhado em duas camadas: as casas, em React,
// e por cima delas a cena do Phaser com as personagens, os itens e as animações.
export const Board: React.FC<BoardProps> = ({ ranges, selectedId, onCellClick, onCellContextMenu, ...scene }) => {
    const { cellSize, maze, characters } = scene
    // A casa da personagem selecionada, procurada uma vez só, e não a cada casa
    const selected = characters.find((p) => p.id === selectedId)?.position

    const cells: JSX.Element[] = []
    for (let y = 0; y < maze.size; y++) {
        for (let x = 0; x < maze.size; x++) {
            const position = { x, y }
            cells.push(
                <Cell
                    key={`${x}-${y}`}
                    x={x}
                    y={y}
                    size={cellSize}
                    isWall={isWall(maze, x, y)}
                    range={ranges.get(positionKey(position)) ?? null}
                    isSelected={selected !== undefined && samePosition(selected, position)}
                    onCellClick={onCellClick}
                    onCellContextMenu={onCellContextMenu}
                />,
            )
        }
    }

    return (
        <Box sx={{ position: "relative", width: maze.size * cellSize, height: maze.size * cellSize }}>
            {cells}
            <PhaserBoard {...scene} />
        </Box>
    )
}
