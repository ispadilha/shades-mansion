import React from "react"
import { useNavigate } from "react-router-dom"
import { Box } from "@mui/material"
import { BackButton, MenuButton, ScreenLayout, ScreenTitle } from "../../components/ui"
import { ruleKeys } from "../../constants/texts_rules"
import { useLanguage } from "../../hooks/useLanguage"

interface RulesScreenProps {}

export const RulesScreen: React.FC<RulesScreenProps> = ({}) => {
    const navigate = useNavigate()
    const { t, tRule } = useLanguage()

    return (
        <ScreenLayout gap={4} padded>
            <ScreenTitle>{t("rules")}</ScreenTitle>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center", width: 720, maxWidth: "90vw" }}>
                {ruleKeys.map((key) => (
                    <MenuButton
                        key={key}
                        onClick={() => navigate(`/library/rules/${key}`)}
                        sx={{ px: 2, py: 0.75, textTransform: "none" }}
                    >
                        {tRule(key, "name")}
                    </MenuButton>
                ))}
            </Box>

            <BackButton onClick={() => navigate("/library")} />
        </ScreenLayout>
    )
}
