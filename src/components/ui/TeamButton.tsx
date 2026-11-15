import React from "react"
import { Button, type SxProps, type Theme } from "@mui/material"
import { withSx } from "./withSx"
import type { CharacterColor } from "../../logic/types"
import { TEAM_BUTTON_PALETTE } from "../../constants/palette"

interface TeamButtonProps {
    children: React.ReactNode
    // O time do botão: é dele que saem as cores
    color: CharacterColor
    onClick: () => void
    sx?: SxProps<Theme>
}

// Botão com as cores de um time (escolha de lado, lista de personagens)
export const TeamButton: React.FC<TeamButtonProps> = ({ children, color, onClick, sx }) => {
    const palette = TEAM_BUTTON_PALETTE[color]

    return (
        <Button
            onClick={onClick}
            sx={withSx({ bgcolor: palette.bg, color: palette.text, borderColor: palette.outline }, sx)}
        >
            {children}
        </Button>
    )
}
