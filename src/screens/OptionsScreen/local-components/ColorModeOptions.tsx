import React from "react"
import { Box, Button } from "@mui/material"
import type { ColorModeSetting, PieceColor, TextKey } from "../../../logic/types"
import { useColorMode } from "../../../hooks/useColorMode"
import { useLanguage } from "../../../hooks/useLanguage"
import { usePalette } from "../../../hooks/usePalette"
import { TEAM_BUTTON_PALETTE } from "../../../constants/palette"

interface ColorModeOptionsProps {}

const MODE_BUTTONS: Array<{ setting: ColorModeSetting; label: TextKey; team: PieceColor | null }> = [
    { setting: "light", label: "modeLight", team: "light" },
    { setting: "gray", label: "modeGray", team: "gray" },
    { setting: "dark", label: "modeDark", team: "dark" },
    { setting: "system", label: "modeSystem", team: null },
]

export const ColorModeOptions: React.FC<ColorModeOptionsProps> = ({}) => {
    const palette = usePalette()
    const { t } = useLanguage()
    const { setting, setSetting } = useColorMode()

    return (
        <Box sx={{ display: "flex", gap: 2 }}>
            {MODE_BUTTONS.map((button) => {
                const colors = button.team
                    ? TEAM_BUTTON_PALETTE[button.team]
                    : { bg: palette.ui.buttonAltBg, text: palette.ui.text, outline: palette.ui.buttonOutline }

                return (
                    <Button
                        key={button.setting}
                        onClick={() => setSetting(button.setting)}
                        sx={{
                            bgcolor: colors.bg,
                            color: colors.text,
                            borderColor: colors.outline,
                            outline: setting === button.setting ? `2px solid ${palette.ui.text}` : "none",
                            outlineOffset: "2px",
                        }}
                    >
                        {t(button.label)}
                    </Button>
                )
            })}
        </Box>
    )
}
