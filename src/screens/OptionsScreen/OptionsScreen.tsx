import React from "react"
import { useNavigate } from "react-router-dom"
import { LanguageOptions } from "./local-components/LanguageOptions"
import { MazeOptions } from "./local-components/MazeOptions"
import { BackButton, ScreenLayout, ScreenTitle } from "../../components/ui"
import { useLanguage } from "../../hooks/useLanguage"

interface OptionsScreenProps {}

export const OptionsScreen: React.FC<OptionsScreenProps> = ({}) => {
    const navigate = useNavigate()
    const { t } = useLanguage()

    return (
        <ScreenLayout gap={4}>
            <ScreenTitle size={28}>{t("languageSettings")}</ScreenTitle>
            <LanguageOptions />

            <ScreenTitle size={28} sx={{ mt: 2 }}>
                {t("mazeSettings")}
            </ScreenTitle>
            <MazeOptions />

            <BackButton onClick={() => navigate(-1)} />
        </ScreenLayout>
    )
}
