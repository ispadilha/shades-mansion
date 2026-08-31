import React from "react"
import { Box, Typography } from "@mui/material"
import { PieceToken } from "./PieceToken"
import type { PieceSlot } from "../../logic/setup"

interface InitiativeLineupProps {
    // Todas as peças, na ordem em que devem aparecer na fila
    slots: PieceSlot[]
    // Peça que está rolando o dado agora
    activeId: string | null
    // Valor já travado de cada peça (as que ainda não rolaram estão sem número)
    values: Record<string, number>
    // Numera as peças da primeira à última — usado quando a ordem final já está definida
    showRank?: boolean
}

export const InitiativeLineup: React.FC<InitiativeLineupProps> = ({ slots, activeId, values, showRank = false }) => {
    return (
        <Box sx={{ width: "100%", overflowX: "auto", py: 1 }}>
            <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", minWidth: "min-content", px: 2 }}>
                {slots.map((slot, index) => {
                    const value = values[slot.id]
                    const rolled = value !== undefined

                    return (
                        <Box
                            key={slot.id}
                            sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5, width: 62 }}
                        >
                            {showRank && <Typography sx={{ color: "#8f85a8", fontSize: 12 }}>#{index + 1}</Typography>}
                            <PieceToken
                                color={slot.color}
                                type={slot.type}
                                active={slot.id === activeId}
                                dimmed={!rolled && slot.id !== activeId}
                            />
                            <Typography sx={{ color: "#bbb", fontSize: 12 }}>{slot.id}</Typography>
                            <Typography
                                sx={{
                                    color: rolled ? "#ffe9a8" : "#544c66",
                                    fontSize: 18,
                                    fontWeight: 700,
                                    lineHeight: 1.1,
                                }}
                            >
                                {rolled ? value : "—"}
                            </Typography>
                        </Box>
                    )
                })}
            </Box>
        </Box>
    )
}
