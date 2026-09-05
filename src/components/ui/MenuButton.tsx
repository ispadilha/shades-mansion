import React from "react"
import { Button, type SxProps, type Theme } from "@mui/material"
import { usePalette } from "../../hooks/usePalette"

interface MenuButtonProps {
    children: React.ReactNode
    onClick: () => void
    disabled?: boolean
    sx?: SxProps<Theme>
}

export const MenuButton: React.FC<MenuButtonProps> = ({ children, onClick, disabled = false, sx }) => {
    const palette = usePalette()

    return (
        <Button
            variant="contained"
            onClick={onClick}
            disabled={disabled}
            sx={[
                { bgcolor: palette.ui.buttonBg, color: palette.ui.text, px: 4, py: 1.5 },
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
        >
            {children}
        </Button>
    )
}
