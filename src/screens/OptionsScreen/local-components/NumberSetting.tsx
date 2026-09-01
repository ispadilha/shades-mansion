import React from "react"
import { Box, Button, Typography } from "@mui/material"
import { UI_PALETTE } from "../../../constants/palette"

interface NumberSettingProps {
    label: string
    unit: string
    value: number
    min: number
    max: number
    onChange: (value: number) => void
}

// Opção numérica com botões "-" e "+"; os botões desligam nos limites
export const NumberSetting: React.FC<NumberSettingProps> = ({ label, unit, value, min, max, onChange }) => (
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
