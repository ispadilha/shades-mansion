import React from "react"
import { Box, Button, Typography } from "@mui/material"
import { useLanguage } from "../hooks/useLanguage"

interface EndScreenProps {
    winner: "light" | "dark"
    onRestart: () => void
}

export const EndScreen: React.FC<EndScreenProps> = ({ winner, onRestart }) => {
    const { t } = useLanguage()

    return (
        <Box
            sx={{
                width: "100vw",
                height: "100vh",
                bgcolor: "#000",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
            }}
        >
            <Typography sx={{ fontSize: 36, mb: 2 }}>{winner === "light" ? t("lightWon") : t("darkWon")}</Typography>
            <Button onClick={onRestart} sx={{ bgcolor: "#222", color: "#fff" }}>
                {t("playAgain")}
            </Button>
        </Box>
    )
}
