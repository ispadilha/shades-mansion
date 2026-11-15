import React from "react"
import { Typography, type SxProps, type Theme } from "@mui/material"
import { withSx } from "./withSx"
import { usePalette } from "../../hooks/usePalette"

interface ScreenTitleProps {
    children: React.ReactNode
    size?: number
    sx?: SxProps<Theme>
}

export const ScreenTitle: React.FC<ScreenTitleProps> = ({ children, size = 32, sx }) => {
    const palette = usePalette()

    return (
        <Typography sx={withSx({ color: palette.ui.text, fontSize: size }, sx)}>
            {children}
        </Typography>
    )
}
