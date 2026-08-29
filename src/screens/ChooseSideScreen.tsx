import React from "react"
import { useNavigate } from "react-router-dom"
import { Box, Button, Typography } from "@mui/material"
import type { PlayerSelection } from "../logic/types"
import { useLanguage } from "../hooks/useLanguage"
import { useGame } from "../hooks/useGame"

interface ChooseSideScreenProps {}

export const ChooseSideScreen: React.FC<ChooseSideScreenProps> = ({}) => {
    const navigate = useNavigate()
    const { t } = useLanguage()
    const { setSelection, setMatch } = useGame()

    const handleChooseSide = (selection: PlayerSelection) => {
        setSelection(selection)
        setMatch(null)
        navigate("/initiative")
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
            <Typography sx={{ color: "#fff", fontSize: 28 }}>{t("chooseTeams")}</Typography>
            
            {/* Escolhas para comandar um dos times (claro, cinza ou escuro) */}
            <Box sx={{ display: "flex", gap: 2 }}>
                <Button onClick={() => handleChooseSide("light")} sx={{ bgcolor: "#ddd", color: "#000" }}>
                    {t("light")}
                </Button>
                <Button onClick={() => handleChooseSide("gray")} sx={{ bgcolor: "#888", color: "#fff" }}>
                    {t("gray")}
                </Button>
                <Button onClick={() => handleChooseSide("dark")} sx={{ bgcolor: "#111", color: "#fff" }}>
                    {t("dark")}
                </Button>
            </Box>

            {/* Escolhas para comandar os três times (multi-jogador local)
            ou não comandar nenhum (assistir a uma partida de IA) */}
            <Box sx={{ display: "flex", gap: 2 }}>
                <Button onClick={() => handleChooseSide("all")} sx={{ bgcolor: "#2a2a3a", color: "#fff" }}>
                    {t("allTeams")}
                </Button>
                <Button onClick={() => handleChooseSide("none")} sx={{ bgcolor: "#2a2a3a", color: "#fff" }}>
                    {t("noTeam")}
                </Button>
            </Box>
            <Button onClick={() => navigate("/")} sx={{ mt: 3, color: "#fff" }}>
                {t("goBack")}
            </Button>
        </Box>
    )
}
