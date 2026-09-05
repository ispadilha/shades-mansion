import React from "react"
import { Typography, type SxProps, type Theme } from "@mui/material"
import { usePalette } from "../../hooks/usePalette"

interface ScreenSubtitleProps {
    children: React.ReactNode
    size?: number
    sx?: SxProps<Theme>
}

export const ScreenSubtitle: React.FC<ScreenSubtitleProps> = ({ children, size = 15, sx }) => {
    const palette = usePalette()

    return (
        <Typography sx={[{ color: palette.ui.accentMuted, fontSize: size }, ...(Array.isArray(sx) ? sx : [sx])]}>
            {children}
        </Typography>
    )
}
