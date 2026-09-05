import React from "react"
import { Box, Button, Typography } from "@mui/material"
import { usePalette } from "../../../hooks/usePalette"

interface NumberSettingProps {
    label: string
    unit: string
    value: number
    min: number
    max: number
    onChange: (value: number) => void
}

// Opção numérica com botões "-" e "+"; os botões desligam nos limites
export const NumberSetting: React.FC<NumberSettingProps> = ({ label, unit, value, min, max, onChange }) => {
    const palette = usePalette()

    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
            <Typography sx={{ color: palette.ui.textBody, flex: 1, textAlign: "right" }}>{label}</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Button
                    onClick={() => onChange(value - 1)}
                    disabled={value <= min}
                    sx={{ minWidth: 36, bgcolor: palette.ui.buttonBg, color: palette.ui.text, "&.Mui-disabled": { color: palette.ui.buttonDisabledText } }}
                >
                    −
                </Button>
                <Typography sx={{ color: palette.ui.text, width: 36, textAlign: "center", fontSize: 20 }}>{value}</Typography>
                <Button
                    onClick={() => onChange(value + 1)}
                    disabled={value >= max}
                    sx={{ minWidth: 36, bgcolor: palette.ui.buttonBg, color: palette.ui.text, "&.Mui-disabled": { color: palette.ui.buttonDisabledText } }}
                >
                    +
                </Button>
            </Box>
            <Typography sx={{ color: palette.ui.textMuted, flex: 1 }}>{unit}</Typography>
        </Box>
    )
}
