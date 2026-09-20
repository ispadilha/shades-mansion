import React from "react"
import { Box, Typography } from "@mui/material"
import type { PieceDefinition, TextKey } from "../../../logic/types"
import { turnStageOf } from "../../../logic/turn"
import { useLanguage } from "../../../hooks/useLanguage"
import { usePalette } from "../../../hooks/usePalette"

interface TurnStatusProps {
    // Peça da vez (null só enquanto a partida está terminando)
    activePiece: PieceDefinition | null
    isPlayerTurn: boolean
    spectating: boolean
}

// De quem é a vez e o que o jogador pode fazer agora
export const TurnStatus: React.FC<TurnStatusProps> = ({ activePiece, isPlayerTurn, spectating }) => {
    const palette = usePalette()
    const { t, tTeam } = useLanguage()

    const turnLabel = activePiece ? `${activePiece.id} (${tTeam(activePiece.color)})` : "—"

    // Três estados na vez do jogador:
    // ainda tem tudo,
    // já gastou a ação comum mas ainda tem a habilidade,
    // ou não tem mais nada
    const stage = isPlayerTurn && activePiece ? turnStageOf(activePiece) : null
    const spent = stage === "spent"
    const statusKey: TextKey = stage === "spent" ? "alreadyActed" : stage === "moved" ? "alreadyMoved" : "yourTurn"

    return (
        <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: palette.hud.text, whiteSpace: "nowrap" }}>
                {t("turn")}: {turnLabel}
            </Typography>
            <Typography
                sx={{
                    color:
                        spectating || spent
                            ? palette.hud.statusIdle
                            : isPlayerTurn
                              ? palette.hud.statusReady
                              : palette.hud.statusWaiting,
                    fontSize: 14,
                    whiteSpace: "nowrap",
                }}
            >
                {isPlayerTurn ? t(statusKey) : spectating ? t("spectating") : t("wait")}
            </Typography>
        </Box>
    )
}
