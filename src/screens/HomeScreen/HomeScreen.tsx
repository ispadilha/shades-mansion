import React from "react"
import { useNavigate } from "react-router-dom"
import { MenuButton, ScreenLayout, ScreenTitle } from "../../components/ui"
import { useLanguage } from "../../hooks/useLanguage"

interface HomeScreenProps {}

export const HomeScreen: React.FC<HomeScreenProps> = ({}) => {
    const navigate = useNavigate()
    const { t } = useLanguage()

    return (
        <ScreenLayout gap={4}>
            <ScreenTitle size={44}>Shades Mansion</ScreenTitle>

            <MenuButton onClick={() => navigate("/choose-side")}>{t("startGame")}</MenuButton>
            <MenuButton onClick={() => navigate("/library")}>{t("library")}</MenuButton>
            <MenuButton onClick={() => navigate("/options")}>{t("options")}</MenuButton>
        </ScreenLayout>
    )
}
