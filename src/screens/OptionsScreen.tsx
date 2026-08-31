import React from "react"
import { useNavigate } from "react-router-dom"
import { Box, Button, Typography } from "@mui/material"
import { useLanguage } from "../hooks/useLanguage"
import { useSettings } from "../hooks/useSettings"
import { UI_PALETTE } from "../constants/palette"
import { BOARD_SIZE_RANGE, ROOM_SIZE_RANGE } from "../constants/gameRules"

interface NumberSettingProps {
    label: string
    unit: string
    value: number
    min: number
    max: number
    onChange: (value: number) => void
}

// Opções com botões "-" e "+"; os botões desligam nos limites
const NumberSetting: React.FC<NumberSettingProps> = ({ label, unit, value, min, max, onChange }) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
        <Typography sx={{ color: UI_PALETTE.textBody, flex: 1, textAlign: "right" }}>{label}</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button
                onClick={() => onChange(value - 1)}
                disabled={value <= min}
                sx={{ minWidth: 36, bgcolor: UI_PALETTE.buttonBg, color: UI_PALETTE.text, "&.Mui-disabled": { color: UI_PALETTE.buttonDisabledText } }}
            >
                −
            </Button>
            <Typography sx={{ color: UI_PALETTE.text, width: 36, textAlign: "center", fontSize: 20 }}>{value}</Typography>
            <Button
                onClick={() => onChange(value + 1)}
                disabled={value >= max}
                sx={{ minWidth: 36, bgcolor: UI_PALETTE.buttonBg, color: UI_PALETTE.text, "&.Mui-disabled": { color: UI_PALETTE.buttonDisabledText } }}
            >
                +
            </Button>
        </Box>
        <Typography sx={{ color: UI_PALETTE.textMuted, flex: 1 }}>{unit}</Typography>
    </Box>
)

interface OptionsScreenProps {}

export const OptionsScreen: React.FC<OptionsScreenProps> = ({}) => {
    const navigate = useNavigate()
    const { setLanguage, t } = useLanguage()
    const { boardSize, minRoomSize, maxRoomSize, setBoardSize, setMinRoomSize, setMaxRoomSize } = useSettings()

    // As salas precisam caber no tabuleiro e a mínima nunca pode passar da máxima
    const roomCeiling = Math.min(ROOM_SIZE_RANGE.max, boardSize)

    return (
        <Box
            sx={{
                width: "100vw",
                height: "100vh",
                bgcolor: UI_PALETTE.screenBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                flexDirection: "column",
                overflow: "auto",
            }}
        >
            <Typography sx={{ color: UI_PALETTE.text, fontSize: 28 }}>{t("languageSettings")}</Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
                <Button onClick={() => setLanguage("enUS")} sx={{ bgcolor: UI_PALETTE.languageEn.bg, color: UI_PALETTE.languageEn.text }}>
                    {t("enUS")}
                </Button>
                <Button onClick={() => setLanguage("ptBR")} sx={{ bgcolor: UI_PALETTE.languagePt.bg, color: UI_PALETTE.languagePt.text }}>
                    {t("ptBR")}
                </Button>
            </Box>

            <Typography sx={{ color: UI_PALETTE.text, fontSize: 28, mt: 2 }}>{t("mazeSettings")}</Typography>
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

            <Button onClick={() => navigate(-1)} sx={{ mt: 3, color: UI_PALETTE.text }}>
                {t("goBack")}
            </Button>
        </Box>
    )
}
