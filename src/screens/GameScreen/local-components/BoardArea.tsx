import React from "react"
import type { RefObject } from "react"
import { Box } from "@mui/material"
import { Board } from "../../../components/board"
import type { PieceAuras, PieceDefinition, PiecePosition, SpecialItem } from "../../../logic/types"
import type { FireBurst } from "../../../logic/combat"
import type { Maze } from "../../../logic/maze"
import { CELL_SIZE } from "../../../constants/rules"

interface BoardAreaProps {
    // A viewport rolável: a câmera da partida mexe nela
    scrollRef: RefObject<HTMLDivElement | null>
    maze: Maze
    pieces: PieceDefinition[]
    items: SpecialItem[]
    highlighted: PiecePosition[]
    attackHighlighted: PiecePosition[]
    fireBursts: FireBurst[]
    auras: PieceAuras
    selectedPieceId: string | null
    droppedItemId: string | null
    onCellClick: (pos: PiecePosition) => void
    onCellContextMenu: (event: React.MouseEvent, pos: PiecePosition) => void
}

// A área do tabuleiro: um labirinto inteiro é maior que a janela, então ele mora dentro
// de uma viewport que rola, centralizado enquanto couber.
export const BoardArea: React.FC<BoardAreaProps> = ({
    scrollRef,
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
    return (
        <Box ref={scrollRef} sx={{ flex: 1, overflow: "auto", position: "relative" }}>
            <Box
                sx={{
                    width: "fit-content",
                    minWidth: "100%",
                    minHeight: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 2,
                    boxSizing: "border-box",
                }}
            >
                <Board
                    cellSize={CELL_SIZE}
                    maze={maze}
                    pieces={pieces}
                    items={items}
                    highlighted={highlighted}
                    attackHighlighted={attackHighlighted}
                    fireBursts={fireBursts}
                    auras={auras}
                    onCellClick={onCellClick}
                    selectedPieceId={selectedPieceId}
                    droppedItemId={droppedItemId}
                    onCellContextMenu={onCellContextMenu}
                />
            </Box>
        </Box>
    )
}
