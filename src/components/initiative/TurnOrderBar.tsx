import React from "react"
import { Box, Typography } from "@mui/material"
import { PieceToken } from "../pieces"
import type { PieceAuras, PieceDefinition } from "../../logic/types"
import { useLanguage } from "../../hooks/useLanguage"
import { usePalette } from "../../hooks/usePalette"
import { AURA_PALETTE } from "../../constants/palette"

interface TurnOrderBarProps {
    // Peças ainda em jogo, já na ordem de iniciativa
    order: PieceDefinition[]
    auras: PieceAuras
    round: number
}

export const TurnOrderBar: React.FC<TurnOrderBarProps> = ({ order, auras, round }) => {
    const palette = usePalette()
    const { t } = useLanguage()

    return (
        <Box sx={{ height: "100%", minWidth: 0, display: "flex", alignItems: "center", gap: 1, px: 2 }}>
            <Typography sx={{ color: palette.initiative.rank, fontSize: 12, whiteSpace: "nowrap", flexShrink: 0 }}>
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
                    const aura = auras[piece.id] ?? null

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
                            <Typography sx={{ color: aura ? AURA_PALETTE[aura].color : palette.initiative.idleId, fontSize: 10 }}>
                                {piece.id}
                            </Typography>
                        </Box>
                    )
                })}
            </Box>
        </Box>
    )
}
