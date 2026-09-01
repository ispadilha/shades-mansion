import React from "react"
import { Box, Typography } from "@mui/material"
import type { PieceDefinition } from "../../../logic/types"
import { useLanguage } from "../../../hooks/useLanguage"
import { HUD_PALETTE } from "../../../constants/palette"

interface TurnStatusProps {
    // Peça da vez (null só enquanto a partida está terminando)
    activePiece: PieceDefinition | null
    isPlayerTurn: boolean
    spectating: boolean
}

// De quem é a vez e o que o jogador pode fazer agora
export const TurnStatus: React.FC<TurnStatusProps> = ({ activePiece, isPlayerTurn, spectating }) => {
    const { t, tTeam } = useLanguage()

    const turnLabel = activePiece ? `${activePiece.id} (${tTeam(activePiece.color)})` : "—"
    const acted = isPlayerTurn && activePiece?.movedThisTurn

    return (
        <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: HUD_PALETTE.text, whiteSpace: "nowrap" }}>
                {t("turn")}: {turnLabel}
            </Typography>
            <Typography
                sx={{
                    color:
                        spectating || acted
                            ? HUD_PALETTE.statusIdle
                            : isPlayerTurn
                              ? HUD_PALETTE.statusReady
                              : HUD_PALETTE.statusWaiting,
                    fontSize: 14,
                    whiteSpace: "nowrap",
                }}
            >
                {isPlayerTurn ? (acted ? t("alreadyActed") : t("yourTurn")) : spectating ? t("spectating") : t("wait")}
            </Typography>
        </Box>
    )
}
