import React from "react"
import { useNavigate } from "react-router-dom"
import { Box, Button, Typography } from "@mui/material"
import type { PlayerSelection } from "../logic/types"
import { useLanguage } from "../hooks/useLanguage"
import { UI_PALETTE } from "../constants/palette"
import { TEAM_BUTTON_PALETTE } from "../constants/palette"
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
                bgcolor: UI_PALETTE.screenBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                flexDirection: "column",
            }}
        >
            <Typography sx={{ color: UI_PALETTE.text, fontSize: 28 }}>{t("chooseTeams")}</Typography>
            
            {/* Escolhas para comandar um dos times (claro, cinza ou escuro) */}
            <Box sx={{ display: "flex", gap: 2 }}>
                <Button onClick={() => handleChooseSide("light")} sx={{ bgcolor: TEAM_BUTTON_PALETTE.light.bg, color: TEAM_BUTTON_PALETTE.light.text }}>
                    {t("light")}
                </Button>
                <Button onClick={() => handleChooseSide("gray")} sx={{ bgcolor: TEAM_BUTTON_PALETTE.gray.bg, color: TEAM_BUTTON_PALETTE.gray.text }}>
                    {t("gray")}
                </Button>
                <Button onClick={() => handleChooseSide("dark")} sx={{ bgcolor: TEAM_BUTTON_PALETTE.dark.bg, color: TEAM_BUTTON_PALETTE.dark.text }}>
                    {t("dark")}
                </Button>
            </Box>

            {/* Escolhas para comandar os três times (multi-jogador local)
            ou não comandar nenhum (assistir a uma partida de IA) */}
            <Box sx={{ display: "flex", gap: 2 }}>
                <Button onClick={() => handleChooseSide("all")} sx={{ bgcolor: UI_PALETTE.buttonAltBg, color: UI_PALETTE.text }}>
                    {t("allTeams")}
                </Button>
                <Button onClick={() => handleChooseSide("none")} sx={{ bgcolor: UI_PALETTE.buttonAltBg, color: UI_PALETTE.text }}>
                    {t("noTeam")}
                </Button>
            </Box>
            <Button onClick={() => navigate("/")} sx={{ mt: 3, color: UI_PALETTE.text }}>
                {t("goBack")}
            </Button>
        </Box>
    )
}
