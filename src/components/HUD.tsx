import React, { useEffect, useRef } from "react"
import { Box, Button, Typography } from "@mui/material"
import type { PieceColor, SpecialItemKey } from "../logic/types"
import { useLanguage } from "../hooks/useLanguage"

interface HUDProps {
    turn: PieceColor
    playerColor: PieceColor | null
    onEndTurn: () => void
    onQuit: () => void
    onOpenInventory: () => void
    inventoryCount: number
    log: string[]
    manipulationKey: SpecialItemKey | null
    onCancelManipulation: () => void
}

export const HUD: React.FC<HUDProps> = ({
    turn,
    playerColor,
    onEndTurn,
    onQuit,
    onOpenInventory,
    inventoryCount,
    log,
    manipulationKey,
    onCancelManipulation,
}) => {
    const { t } = useLanguage()
    const logRef = useRef<HTMLDivElement>(null)

    const isPlayerTurn = turn === playerColor
    const turnLabel = turn === "light" ? t("light") : turn === "dark" ? t("dark") : t("gray")

    // Mantém o log sempre rolado até a entrada mais recente (no rodapé da caixa)
    useEffect(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
    }, [log])

    return (
        <Box sx={{ width: "100%", bgcolor: "#222", flexShrink: 0, display: "flex", flexDirection: "column" }}>
            {/* Caixa de texto: log de jogadas (com banner de manipulação fixo no topo quando ativo) */}
            <Box sx={{ borderBottom: "1px solid #333", bgcolor: "#1a1a1a" }}>
                {manipulationKey && (
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 2,
                            px: 2,
                            py: 0.75,
                            bgcolor: "#3a2a10",
                            borderBottom: "1px solid #555",
                        }}
                    >
                        <Typography sx={{ color: "#ffd27a", fontSize: 13 }}>
                            {t("manipulatingPiece")}: {manipulationKey}
                        </Typography>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={onCancelManipulation}
                            sx={{ color: "#fff", borderColor: "#777", py: 0.25 }}
                        >
                            {t("cancelManipulation")}
                        </Button>
                    </Box>
                )}
                <Box ref={logRef} sx={{ height: 72, overflowY: "auto", px: 2, py: 0.5 }}>
                    {log.map((entry, i) => (
                        <Typography key={i} sx={{ color: "#bbb", fontSize: 13, lineHeight: 1.4 }}>
                            {entry}
                        </Typography>
                    ))}
                </Box>
            </Box>

            {/* Controles: turno + botões */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    px: 3,
                    py: 1,
                }}
            >
                <Box>
                    <Typography sx={{ color: "#fff" }}>
                        {t("turn")}: {turnLabel}
                    </Typography>
                    <Typography sx={{ color: isPlayerTurn ? "#4CAF50" : "#F44336", fontSize: 14 }}>
                        {isPlayerTurn ? t("yourTurn") : t("wait")}
                    </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 2 }}>
                    <Button onClick={onOpenInventory} variant="outlined" sx={{ color: "#fff", borderColor: "#555" }}>
                        {t("inventory")} ({inventoryCount})
                    </Button>
                    <Button
                        onClick={onEndTurn}
                        variant="contained"
                        disabled={!isPlayerTurn}
                        sx={{
                            bgcolor: isPlayerTurn ? "#444" : "#666",
                            color: "#fff",
                            "&:disabled": { color: "#999" },
                        }}
                    >
                        {t("endTurn")}
                    </Button>
                    <Button onClick={onQuit} variant="outlined" sx={{ color: "#fff", borderColor: "#555" }}>
                        {t("quit")}
                    </Button>
                </Box>
            </Box>
        </Box>
    )
}
