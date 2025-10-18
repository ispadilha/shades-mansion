import React from "react"
import { useNavigate } from "react-router-dom"
import { Box, Button, Typography } from "@mui/material"
import type { PieceColor } from "../logic/types"
import { useLanguage } from "../hooks/useLanguage"
import { useGame } from "../hooks/useGame"

interface ChooseSideScreenProps {}

export const ChooseSideScreen: React.FC<ChooseSideScreenProps> = ({}) => {
    const navigate = useNavigate()
    const { t } = useLanguage()
    const { setPlayerColor } = useGame()

    const handleChooseSide = (color: PieceColor) => {
        setPlayerColor(color)
        navigate("/game")
    }

    return (
        <Box
            sx={{
                width: "100vw",
                height: "100vh",
                bgcolor: "#000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                flexDirection: "column",
            }}
        >
            <Typography sx={{ color: "#fff", fontSize: 28 }}>{t("chooseYourSide")}</Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
                <Button onClick={() => handleChooseSide("light")} sx={{ bgcolor: "#ddd", color: "#000" }}>
                    {t("light")}
                </Button>
                <Button onClick={() => handleChooseSide("dark")} sx={{ bgcolor: "#111", color: "#fff" }}>
                    {t("dark")}
                </Button>
            </Box>
            <Button onClick={() => navigate("/")} sx={{ mt: 3, color: "#fff" }}>
                {t("goBack")}
            </Button>
        </Box>
    )
}
