import React from "react"
import { useNavigate } from "react-router-dom"
import { Box, Button } from "@mui/material"
import { BackButton, ScreenLayout, ScreenTitle, TeamButton } from "../../components/ui"
import type { PlayerSelection, TextKey } from "../../logic/types"
import { useLanguage } from "../../hooks/useLanguage"
import { useGame } from "../../hooks/useGame"
import { LINEUP_COLORS } from "../../constants/rules"
import { usePalette } from "../../hooks/usePalette"

const OTHER_CHOICES: Array<{ selection: PlayerSelection; label: TextKey }> = [
    { selection: "all", label: "allTeams" },
    { selection: "none", label: "noTeam" },
]

interface ChooseSideScreenProps {}

export const ChooseSideScreen: React.FC<ChooseSideScreenProps> = ({}) => {
    const palette = usePalette()
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

            <Box sx={{ display: "flex", gap: 2 }}>
                {OTHER_CHOICES.map(({ selection, label }) => (
                    <Button
                        key={selection}
                        onClick={() => handleChooseSide(selection)}
                        sx={{ bgcolor: palette.ui.buttonAltBg, color: palette.ui.text }}
                    >
                        {t(label)}
                    </Button>
                ))}
            </Box>

            <BackButton onClick={() => navigate("/")} />
        </ScreenLayout>
    )
}
