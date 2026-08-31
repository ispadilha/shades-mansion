import React from "react"
import { useNavigate } from "react-router-dom"
import { Box, Button, Typography } from "@mui/material"
import { useLanguage } from "../hooks/useLanguage"
import { UI_PALETTE } from "../constants/palette"
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
                bgcolor: UI_PALETTE.screenBg,
                color: UI_PALETTE.text,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
            }}
        >
            <Typography sx={{ fontSize: 36, mb: 2 }}>
                {winner === "light" ? t("lightWon") : winner === "dark" ? t("darkWon") : t("grayWon")}
            </Typography>
            <Button onClick={handleRestart} sx={{ bgcolor: UI_PALETTE.buttonBg, color: UI_PALETTE.text }}>
                {t("playAgain")}
            </Button>
        </Box>
    )
}
