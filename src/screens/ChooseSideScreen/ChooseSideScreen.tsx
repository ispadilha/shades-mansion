import React from "react"
import { useNavigate } from "react-router-dom"
import { Box, Button } from "@mui/material"
import { BackButton, ScreenLayout, ScreenTitle, TeamButton } from "../../components/ui"
import type { PlayerSelection } from "../../logic/types"
import { useLanguage } from "../../hooks/useLanguage"
import { useGame } from "../../hooks/useGame"
import { LINEUP_COLORS } from "../../constants/rules"
import { UI_PALETTE } from "../../constants/palette"

interface ChooseSideScreenProps {}

export const ChooseSideScreen: React.FC<ChooseSideScreenProps> = ({}) => {
    const navigate = useNavigate()
    const { t, tTeam } = useLanguage()
    const { setSelection, setMatch } = useGame()

    const handleChooseSide = (selection: PlayerSelection) => {
        setSelection(selection)
        setMatch(null)
        navigate("/initiative")
    }

    return (
        <ScreenLayout gap={4}>
            <ScreenTitle size={28}>{t("chooseTeams")}</ScreenTitle>

            {/* Escolhas para comandar um dos times (claro, cinza ou escuro) */}
            <Box sx={{ display: "flex", gap: 2 }}>
                {LINEUP_COLORS.map((color) => (
                    <TeamButton key={color} color={color} onClick={() => handleChooseSide(color)}>
                        {tTeam(color)}
                    </TeamButton>
                ))}
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

            <BackButton onClick={() => navigate("/")} />
        </ScreenLayout>
    )
}
