import React from "react"
import { useNavigate } from "react-router-dom"
import { Box, Button, Typography } from "@mui/material"
import { useLanguage } from "../hooks/useLanguage"
import { useGame } from "../hooks/useGame"

interface EndScreenProps {}

export const EndScreen: React.FC<EndScreenProps> = ({}) => {
    const navigate = useNavigate()
    const { t } = useLanguage()
    const { winner, setWinner } = useGame()

    const handleRestart = () => {
        setWinner(null)
        navigate("/choose-side")
    }

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
            <Button onClick={handleRestart} sx={{ bgcolor: "#222", color: "#fff" }}>
                {t("playAgain")}
            </Button>
        </Box>
    )
}
