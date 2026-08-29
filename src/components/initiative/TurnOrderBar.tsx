import React from "react"
import { Box, Typography } from "@mui/material"
import { PieceToken } from "./PieceToken"
import type { PieceDefinition } from "../../logic/types"
import { useLanguage } from "../../hooks/useLanguage"

interface TurnOrderBarProps {
    // Peças vivas, já na ordem de iniciativa
    order: PieceDefinition[]
    activeId: string | null
    round: number
}

export const TurnOrderBar: React.FC<TurnOrderBarProps> = ({ order, activeId, round }) => {
    const { t } = useLanguage()

    return (
        <Box sx={{ height: "100%", minWidth: 0, display: "flex", alignItems: "center", gap: 1, px: 2 }}>
            <Typography sx={{ color: "#8f85a8", fontSize: 12, whiteSpace: "nowrap", flexShrink: 0 }}>
                {t("round")} {round}
            </Typography>

            <Box
                sx={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    overflowX: "auto",
                    overflowY: "hidden",
                }}
            >
                {order.map((piece) => (
                    <Box
                        key={piece.id}
                        sx={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}
                    >
                        <PieceToken
                            color={piece.color}
                            type={piece.type}
                            size={34}
                            active={piece.id === activeId}
                            dimmed={piece.movedThisTurn && piece.id !== activeId}
                        />
                        <Typography sx={{ color: piece.id === activeId ? "#ffd700" : "#777", fontSize: 10 }}>
                            {piece.id}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    )
}
