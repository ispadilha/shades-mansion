import React from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { Box, Button, Typography } from "@mui/material"
import { ruleKeys } from "../constants/texts_rules"
import { useLanguage } from "../hooks/useLanguage"

interface RuleScreenProps {}

export const RuleScreen: React.FC<RuleScreenProps> = ({}) => {
    const navigate = useNavigate()
    const { t, tRule } = useLanguage()
    const { ruleKey } = useParams()

    // Chave desconhecida na URL (link velho, digitação errada) volta para a lista
    const key = ruleKeys.find((k) => k === ruleKey)
    if (!key) return <Navigate to="/library/rules" replace />

    return (
        <Box
            sx={{
                width: "100vw",
                height: "100vh",
                bgcolor: "#000",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                p: 4,
                boxSizing: "border-box",
            }}
        >
            <Typography sx={{ color: "#fff", fontSize: 32, textAlign: "center" }}>{tRule(key, "name")}</Typography>

            <Box sx={{ width: 720, maxWidth: "90vw", maxHeight: "60vh", overflowY: "auto" }}>
                <Typography sx={{ color: "#ccc", fontSize: 17, lineHeight: 1.7, whiteSpace: "pre-line" }}>
                    {tRule(key, "description")}
                </Typography>
            </Box>

            <Button onClick={() => navigate("/library/rules")} sx={{ mt: 2, color: "#fff" }}>
                {t("goBack")}
            </Button>
        </Box>
    )
}
