import React from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { BackButton, LibraryEntry, ScreenLayout, ScreenTitle } from "../../components/ui"
import { characterKeys } from "../../constants/texts_characters"
import { keyCharacterType } from "../../logic/types"
import { skillFor } from "../../logic/skills"
import { useLanguage } from "../../hooks/useLanguage"

interface CharacterScreenProps {}

export const CharacterScreen: React.FC<CharacterScreenProps> = ({}) => {
    const navigate = useNavigate()
    const { t, tCharacter } = useLanguage()
    const { characterKey } = useParams()

    // Chave desconhecida na URL (link velho, digitação errada) volta para a lista
    const key = characterKeys.find((k) => k === characterKey)
    if (!key) return <Navigate to="/library/characters" replace />

    const skill = skillFor(keyCharacterType(key))
    const sections = [
        { title: t("type"), text: tCharacter(key, "type") },
        { title: t("description"), text: tCharacter(key, "description") },
        { title: t("skill"), text: `${t(skill.name)}: ${tCharacter(key, "skill")}` },
        { title: t("affinity"), text: tCharacter(key, "affinity") },
    ]

    return (
        <ScreenLayout gap={3} padded>
            <ScreenTitle sx={{ textAlign: "center" }}>{tCharacter(key, "name")}</ScreenTitle>

            <LibraryEntry sections={sections} />

            <BackButton onClick={() => navigate("/library/characters")} sx={{ mt: 2 }} />
        </ScreenLayout>
    )
}
