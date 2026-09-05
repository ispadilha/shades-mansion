import React from "react"
import { Box, Button } from "@mui/material"
import type { ColorModeSetting, PieceColor, TextKey } from "../../../logic/types"
import { useColorMode } from "../../../hooks/useColorMode"
import { useLanguage } from "../../../hooks/useLanguage"
import { usePalette } from "../../../hooks/usePalette"
import { TEAM_BUTTON_PALETTE } from "../../../constants/palette"

interface ColorModeOptionsProps {}

const MODE_BUTTONS: Array<{ setting: ColorModeSetting; label: TextKey; team: PieceColor }> = [
    { setting: "light", label: "modeLight", team: "light" },
    { setting: "gray", label: "modeGray", team: "gray" },
    { setting: "dark", label: "modeDark", team: "dark" },
]

interface ModeColors {
    bg: string
    text: string
    outline: string
}

export const ColorModeOptions: React.FC<ColorModeOptionsProps> = ({}) => {
    const palette = usePalette()
    const { t } = useLanguage()
    const { setting, setSetting } = useColorMode()

    const modeButton = (choice: ColorModeSetting, label: TextKey, colors: ModeColors) => (
        <Button
            key={choice}
            onClick={() => setSetting(choice)}
            sx={{
                bgcolor: colors.bg,
                color: colors.text,
                borderColor: colors.outline,
                outline: setting === choice ? `2px solid ${palette.ui.text}` : "none",
                outlineOffset: "2px",
            }}
        >
            {t(label)}
        </Button>
    )

    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <Box sx={{ display: "flex", gap: 2 }}>
                {MODE_BUTTONS.map((button) => modeButton(button.setting, button.label, TEAM_BUTTON_PALETTE[button.team]))}
            </Box>

            {modeButton("system", "modeSystem", {
                bg: palette.ui.buttonAltBg,
                text: palette.ui.text,
                outline: palette.ui.buttonOutline,
            })}
        </Box>
    )
}
