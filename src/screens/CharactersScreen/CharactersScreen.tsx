import React from "react"
import { useNavigate } from "react-router-dom"
import { TeamCharacterSection } from "./local-components/TeamCharacterSection"
import { BackButton, ScreenLayout, ScreenTitle } from "../../components/ui"
import type { PieceColor } from "../../logic/types"
import { useLanguage } from "../../hooks/useLanguage"

// Ordem em que os times aparecem na biblioteca
const SECTION_COLORS: PieceColor[] = ["dark", "gray", "light"]

interface CharactersScreenProps {}

export const CharactersScreen: React.FC<CharactersScreenProps> = ({}) => {
    const navigate = useNavigate()
    const { t } = useLanguage()

    return (
        <ScreenLayout gap={4} padded>
            <ScreenTitle>{t("characters")}</ScreenTitle>

            {SECTION_COLORS.map((color) => (
                <TeamCharacterSection key={color} color={color} />
            ))}

            <BackButton onClick={() => navigate("/library")} />
        </ScreenLayout>
    )
}
