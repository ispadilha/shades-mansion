import React from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { BackButton, LoreText, ScreenLayout, ScreenTitle } from "../../components/ui"
import { ruleKeys } from "../../constants/texts_rules"
import { useLanguage } from "../../hooks/useLanguage"

interface RuleScreenProps {}

export const RuleScreen: React.FC<RuleScreenProps> = ({}) => {
    const navigate = useNavigate()
    const { tRule } = useLanguage()
    const { ruleKey } = useParams()

    // Chave desconhecida na URL (link velho, digitação errada) volta para a lista
    const key = ruleKeys.find((k) => k === ruleKey)
    if (!key) return <Navigate to="/library/rules" replace />

    return (
        <ScreenLayout gap={3} padded>
            <ScreenTitle sx={{ textAlign: "center" }}>{tRule(key, "name")}</ScreenTitle>

            <LoreText>{tRule(key, "description")}</LoreText>

            <BackButton onClick={() => navigate("/library/rules")} sx={{ mt: 2 }} />
        </ScreenLayout>
    )
}
