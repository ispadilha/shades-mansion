import React from "react"
import type { RefObject } from "react"
import { Box } from "@mui/material"
import { Board } from "../../../components/board"
import type {
    Barrier,
    CharacterAuras,
    CharacterDefinition,
    CharacterPosition,
    MotivationItem,
    RangeKind,
} from "../../../logic/types"
import type { ChargeRun, DamagePopup, FireBurst } from "../../../logic/combat"
import type { Maze } from "../../../logic/maze"
import { CELL_SIZE } from "../../../constants/rules"

interface BoardAreaProps {
    // A viewport rolável: a câmera da partida mexe nela
    scrollRef: RefObject<HTMLDivElement | null>
    maze: Maze
    characters: CharacterDefinition[]
    items: MotivationItem[]
    ranges: ReadonlyMap<string, RangeKind>
    barriers: Barrier[]
    fireBursts: FireBurst[]
    damagePopups: DamagePopup[]
    chargeRuns: ChargeRun[]
    auras: CharacterAuras
    selectedCharacterId: string | null
    droppedItemId: string | null
    onCellClick: (pos: CharacterPosition) => void
    onCellContextMenu: (event: React.MouseEvent, pos: CharacterPosition) => void
}

// A área do tabuleiro: um labirinto inteiro é maior que a janela, então ele mora dentro
// de uma viewport que rola, centralizado enquanto couber.
export const BoardArea: React.FC<BoardAreaProps> = ({
    scrollRef,
    maze,
    characters,
    items,
    ranges,
    barriers,
    fireBursts,
    damagePopups,
    chargeRuns,
    auras,
    selectedCharacterId,
    droppedItemId,
    onCellClick,
    onCellContextMenu,
}) => {
    return (
        <Box
            ref={scrollRef}
            sx={{
                flex: 1,
                overflow: "auto",
                position: "relative",
                overscrollBehavior: "none",
            }}
        >
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
                    characters={characters}
                    items={items}
                    ranges={ranges}
                    barriers={barriers}
                    fireBursts={fireBursts}
                    damagePopups={damagePopups}
                    chargeRuns={chargeRuns}
                    auras={auras}
                    onCellClick={onCellClick}
                    selectedCharacterId={selectedCharacterId}
                    droppedItemId={droppedItemId}
                    onCellContextMenu={onCellContextMenu}
                />
            </Box>
        </Box>
    )
}
