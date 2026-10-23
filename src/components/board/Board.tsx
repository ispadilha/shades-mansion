import React, { type JSX } from "react"
import { Box } from "@mui/material"
import { Cell } from "./Cell"
import { PhaserBoard } from "./PhaserBoard"
import type { Barrier, CharacterAuras, CharacterDefinition, CharacterPosition, MotivationItem, RangeKind } from "../../logic/types"
import type { Aim, ChargeRun, DamagePopup, FireBurst } from "../../logic/combat"
import type { Maze } from "../../logic/maze"
import { isWall } from "../../logic/maze"
import { atPosition, positionKey } from "../../logic/grid"

interface BoardProps {
    cellSize: number
    maze: Maze
    characters: CharacterDefinition[]
    items: MotivationItem[]
    // De que alcance é cada casa destacada, pela `positionKey` dela
    ranges: ReadonlyMap<string, RangeKind>
    barriers: Barrier[]
    fireBursts: FireBurst[]
    damagePopups: DamagePopup[]
    chargeRuns: ChargeRun[]
    aims: Aim[]
    auras: CharacterAuras
    selectedCharacterId: string | null
    // Item que caiu de volta no tabuleiro
    droppedItemId: string | null
    onCellClick: (pos: CharacterPosition) => void
    onCellContextMenu: (event: React.MouseEvent, pos: CharacterPosition) => void
}

// O tabuleiro é desenhado em duas camadas: as casas, em React,
// e por cima delas a cena do Phaser com as personagens, os itens e as animações.
export const Board: React.FC<BoardProps> = ({
    cellSize,
    maze,
    characters,
    items,
    ranges,
    barriers,
    fireBursts,
    damagePopups,
    chargeRuns,
    aims,
    auras,
    selectedCharacterId,
    droppedItemId,
    onCellClick,
    onCellContextMenu,
}) => {
    const cells: JSX.Element[] = []
    for (let y = 0; y < maze.size; y++) {
        for (let x = 0; x < maze.size; x++) {
            const position = { x, y }
            const character = atPosition(characters, position)
            cells.push(
                <Cell
                    key={`${x}-${y}`}
                    x={x}
                    y={y}
                    size={cellSize}
                    isWall={isWall(maze, x, y)}
                    range={ranges.get(positionKey(position)) ?? null}
                    isSelected={character?.id === selectedCharacterId}
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
                characters={characters}
                items={items}
                barriers={barriers}
                fireBursts={fireBursts}
                damagePopups={damagePopups}
                chargeRuns={chargeRuns}
                aims={aims}
                auras={auras}
                droppedItemId={droppedItemId}
            />
        </Box>
    )
}
