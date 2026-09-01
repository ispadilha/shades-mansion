import React from "react"
import { Button, type SxProps, type Theme } from "@mui/material"
import { UI_PALETTE } from "../../constants/palette"

interface MenuButtonProps {
    children: React.ReactNode
    onClick: () => void
    disabled?: boolean
    sx?: SxProps<Theme>
}

export const MenuButton: React.FC<MenuButtonProps> = ({ children, onClick, disabled = false, sx }) => {
    return (
        <Button
            variant="contained"
            onClick={onClick}
            disabled={disabled}
            sx={[
                { bgcolor: UI_PALETTE.buttonBg, color: UI_PALETTE.text, px: 4, py: 1.5 },
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
        >
            {children}
        </Button>
    )
}
