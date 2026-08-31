import React from "react"
import { Box, Typography } from "@mui/material"
import { PieceToken } from "./PieceToken"
import type { PieceDefinition } from "../../logic/types"
import { useLanguage } from "../../hooks/useLanguage"
import { AURA_PALETTE, type AuraKind } from "../../constants/palette"

interface TurnOrderBarProps {
    // Peças vivas, já na ordem de iniciativa
    order: PieceDefinition[]
    activeId: string | null
    // Peça sob manipulação
    manipulatedId: string | null
    round: number
}

export const TurnOrderBar: React.FC<TurnOrderBarProps> = ({ order, activeId, manipulatedId, round }) => {
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
                {order.map((piece) => {
                    const aura: AuraKind | null =
                        piece.id === manipulatedId ? "manipulated" : piece.id === activeId ? "active" : null

                    return (
                        <Box
                            key={piece.id}
                            sx={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}
                        >
                            <PieceToken
                                color={piece.color}
                                type={piece.type}
                                size={34}
                                aura={aura}
                                dimmed={piece.movedThisTurn && !aura}
                            />
                            <Typography sx={{ color: aura ? AURA_PALETTE[aura].color : "#777", fontSize: 10 }}>
                                {piece.id}
                            </Typography>
                        </Box>
                    )
                })}
            </Box>
        </Box>
    )
}
