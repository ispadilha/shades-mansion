import React from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { BackButton, LoreText, ScreenLayout, ScreenTitle } from "../../components/ui"
import { characterKeys } from "../../constants/texts_characters"
import { useLanguage } from "../../hooks/useLanguage"

interface CharacterScreenProps {}

export const CharacterScreen: React.FC<CharacterScreenProps> = ({}) => {
    const navigate = useNavigate()
    const { tCharacter } = useLanguage()
    const { characterKey } = useParams()

    // Chave desconhecida na URL (link velho, digitação errada) volta para a lista
    const key = characterKeys.find((k) => k === characterKey)
    if (!key) return <Navigate to="/library/characters" replace />

    return (
        <ScreenLayout gap={3} padded>
            <ScreenTitle sx={{ textAlign: "center" }}>{tCharacter(key, "name")}</ScreenTitle>

            <LoreText>{tCharacter(key, "description")}</LoreText>

            <BackButton onClick={() => navigate("/library/characters")} sx={{ mt: 2 }} />
        </ScreenLayout>
    )
}
