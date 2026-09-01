import React from "react"
import { Typography, type SxProps, type Theme } from "@mui/material"
import { UI_PALETTE } from "../../constants/palette"

interface ScreenTitleProps {
    children: React.ReactNode
    size?: number
    sx?: SxProps<Theme>
}

export const ScreenTitle: React.FC<ScreenTitleProps> = ({ children, size = 32, sx }) => {
    return (
        <Typography sx={[{ color: UI_PALETTE.text, fontSize: size }, ...(Array.isArray(sx) ? sx : [sx])]}>
            {children}
        </Typography>
    )
}
