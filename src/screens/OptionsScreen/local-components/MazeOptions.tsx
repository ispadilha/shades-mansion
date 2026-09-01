import React from "react"
import { Box } from "@mui/material"
import { NumberSetting } from "./NumberSetting"
import { useLanguage } from "../../../hooks/useLanguage"
import { useSettings } from "../../../hooks/useSettings"
import { BOARD_SIZE_RANGE, ROOM_SIZE_RANGE } from "../../../constants/rules"

interface MazeOptionsProps {}

export const MazeOptions: React.FC<MazeOptionsProps> = ({}) => {
    const { t } = useLanguage()
    const { boardSize, minRoomSize, maxRoomSize, setBoardSize, setMinRoomSize, setMaxRoomSize } = useSettings()

    // As salas precisam caber no tabuleiro e a mínima nunca pode passar da máxima
    const roomCeiling = Math.min(ROOM_SIZE_RANGE.max, boardSize)

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: 560, maxWidth: "90vw" }}>
            <NumberSetting
                label={t("boardSide")}
                unit={t("cells")}
                value={boardSize}
                min={BOARD_SIZE_RANGE.min}
                max={BOARD_SIZE_RANGE.max}
                onChange={setBoardSize}
            />
            <NumberSetting
                label={t("minRoomSide")}
                unit={t("cells")}
                value={minRoomSize}
                min={ROOM_SIZE_RANGE.min}
                max={Math.min(roomCeiling, maxRoomSize)}
                onChange={setMinRoomSize}
            />
            <NumberSetting
                label={t("maxRoomSide")}
                unit={t("cells")}
                value={maxRoomSize}
                min={Math.max(ROOM_SIZE_RANGE.min, minRoomSize)}
                max={roomCeiling}
                onChange={setMaxRoomSize}
            />
        </Box>
    )
}
