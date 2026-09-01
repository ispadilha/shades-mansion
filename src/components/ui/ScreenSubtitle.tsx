import React from "react"
import { Typography, type SxProps, type Theme } from "@mui/material"
import { UI_PALETTE } from "../../constants/palette"

interface ScreenSubtitleProps {
    children: React.ReactNode
    size?: number
    sx?: SxProps<Theme>
}

export const ScreenSubtitle: React.FC<ScreenSubtitleProps> = ({ children, size = 15, sx }) => {
    return (
        <Typography sx={[{ color: UI_PALETTE.accentMuted, fontSize: size }, ...(Array.isArray(sx) ? sx : [sx])]}>
            {children}
        </Typography>
    )
}
