import React from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@mui/material"
import { ScreenLayout, ScreenTitle } from "../../components/ui"
import { useLanguage } from "../../hooks/useLanguage"
import { useGame } from "../../hooks/useGame"
import { usePalette } from "../../hooks/usePalette"

interface EndScreenProps {}

export const EndScreen: React.FC<EndScreenProps> = ({}) => {
    const palette = usePalette()
    const navigate = useNavigate()
    const { t } = useLanguage()
    const { winner, setWinner } = useGame()

    const handleRestart = () => {
        setWinner(null)
        navigate("/choose-side")
    }

    return (
        <ScreenLayout>
            <ScreenTitle size={36} sx={{ mb: 2 }}>
                {winner === "light" ? t("lightWon") : winner === "dark" ? t("darkWon") : t("grayWon")}
            </ScreenTitle>

            <Button onClick={handleRestart} sx={{ bgcolor: palette.ui.buttonBg, color: palette.ui.text }}>
                {t("playAgain")}
            </Button>
        </ScreenLayout>
    )
}
