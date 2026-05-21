import React from "react"
import { Box, Button, Typography } from "@mui/material"
import type { MainColor, PieceColor } from "../logic/types"
import { useLanguage } from "../hooks/useLanguage"

interface HUDProps {
    turn: PieceColor
    playerColor: MainColor | null
    onEndTurn: () => void
    onQuit: () => void
    onOpenInventory: () => void
    inventoryCount: number
}

export const HUD: React.FC<HUDProps> = ({ turn, playerColor, onEndTurn, onQuit, onOpenInventory, inventoryCount }) => {
    const { t } = useLanguage()

    const isPlayerTurn = turn === playerColor
    const turnLabel = turn === "light" ? t("light") : turn === "dark" ? t("dark") : t("gray")

    return (
        <Box
            sx={{
                width: "100%",
                height: 80,
                bgcolor: "#222",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                px: 3,
                flexShrink: 0,
            }}
        >
            <Box>
                <Typography sx={{ color: "#fff" }}>
                    {t("turn")}: {turnLabel}
                </Typography>
                <Typography sx={{ color: isPlayerTurn ? "#4CAF50" : "#F44336", fontSize: 14 }}>{isPlayerTurn ? t("yourTurn") : t("wait")}</Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                    onClick={onOpenInventory}
                    variant="outlined"
                    sx={{ color: "#fff", borderColor: "#555" }}
                >
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
    )
}
