import React from "react"
import { Box, Typography } from "@mui/material"
import { usePalette } from "../../hooks/usePalette"

interface LoreTextProps {
    children: React.ReactNode
}

// O corpo de um verbete da biblioteca: uma coluna de leitura que rola sozinha quando o
// texto é comprido, preservando as quebras de linha escritas no verbete.
export const LoreText: React.FC<LoreTextProps> = ({ children }) => {
    const palette = usePalette()

    return (
        <Box sx={{ width: 720, maxWidth: "90vw", maxHeight: "60vh", overflowY: "auto" }}>
            <Typography sx={{ color: palette.ui.textBody, fontSize: 17, lineHeight: 1.7, whiteSpace: "pre-line" }}>
                {children}
            </Typography>
        </Box>
    )
}
