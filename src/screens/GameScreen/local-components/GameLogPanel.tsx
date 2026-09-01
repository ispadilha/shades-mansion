import React, { useEffect, useRef } from "react"
import { Box, Typography } from "@mui/material"
import { HUD_PALETTE } from "../../../constants/palette"

interface GameLogPanelProps {
    entries: string[]
}

// O histórico de jogadas, na faixa de cima do HUD
export const GameLogPanel: React.FC<GameLogPanelProps> = ({ entries }) => {
    const logRef = useRef<HTMLDivElement>(null)

    // Mantém o log sempre rolado até a entrada mais recente (no rodapé da caixa)
    useEffect(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
    }, [entries])

    return (
        <Box
            ref={logRef}
            sx={{
                flex: 1,
                minWidth: 0,
                borderLeft: `1px solid ${HUD_PALETTE.bandBorder}`,
                overflowY: "auto",
                overflowWrap: "anywhere",
                px: 2,
                py: 0.5,
            }}
        >
            {entries.map((entry, i) => (
                <Typography key={i} sx={{ color: HUD_PALETTE.logText, fontSize: 13, lineHeight: 1.4 }}>
                    {entry}
                </Typography>
            ))}
        </Box>
    )
}
