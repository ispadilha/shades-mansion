import React from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { BackButton, LibraryEntry, ScreenLayout, ScreenTitle } from "../../components/ui"
import { characterKeys } from "../../constants/texts_characters"
import { CHARACTER_TYPE_NAMES, keyCharacterType } from "../../logic/types"
import { skillFor } from "../../logic/skills"
import { rivalOf } from "../../logic/rivalry"
import { useLanguage } from "../../hooks/useLanguage"

interface CharacterScreenProps {}

export const CharacterScreen: React.FC<CharacterScreenProps> = ({}) => {
    const navigate = useNavigate()
    const { t, tCharacter, tCharacterName } = useLanguage()
    const { characterKey } = useParams()

    // Chave desconhecida na URL (link velho, digitação errada) volta para a lista
    const key = characterKeys.find((k) => k === characterKey)
    if (!key) return <Navigate to="/library/characters" replace />

    const type = keyCharacterType(key)
    const skill = skillFor(type)
    const rival = rivalOf(key)
    const sections = [
        { title: t("type"), text: `${t(CHARACTER_TYPE_NAMES[type])}: ${tCharacter(key, "type")}` },
        { title: t("item"), text: tCharacter(key, "item") },
        { title: t("description"), text: tCharacter(key, "description") },
        { title: t("skill"), text: `${t(skill.name)}: ${tCharacter(key, "skill")}` },
        { title: t("affinity"), text: tCharacter(key, "affinity") },
        ...(rival ? [{ title: t("rivalry"), text: tCharacterName(rival) }] : []),
    ]

    return (
        <ScreenLayout gap={3} padded>
            <ScreenTitle sx={{ textAlign: "center" }}>{tCharacter(key, "name")}</ScreenTitle>

            <LibraryEntry sections={sections} />

            <BackButton onClick={() => navigate("/library/characters")} sx={{ mt: 2 }} />
        </ScreenLayout>
    )
}
