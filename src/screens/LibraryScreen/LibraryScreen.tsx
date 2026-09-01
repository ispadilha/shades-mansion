import React from "react"
import { useNavigate } from "react-router-dom"
import { BackButton, MenuButton, ScreenLayout, ScreenTitle } from "../../components/ui"
import { useLanguage } from "../../hooks/useLanguage"

interface LibraryScreenProps {}

export const LibraryScreen: React.FC<LibraryScreenProps> = ({}) => {
    const navigate = useNavigate()
    const { t } = useLanguage()

    return (
        <ScreenLayout gap={4}>
            <ScreenTitle size={36}>{t("library")}</ScreenTitle>

            <MenuButton onClick={() => navigate("/library/characters")}>{t("characters")}</MenuButton>
            <MenuButton onClick={() => navigate("/library/rules")}>{t("rules")}</MenuButton>

            <BackButton onClick={() => navigate("/")} />
        </ScreenLayout>
    )
}
