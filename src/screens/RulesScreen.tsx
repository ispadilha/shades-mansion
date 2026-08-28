import React from "react"
import { useNavigate } from "react-router-dom"
import { Box, Button, Typography } from "@mui/material"
import { ruleKeys } from "../constants/texts_rules"
import { useLanguage } from "../hooks/useLanguage"

interface RulesScreenProps {}

export const RulesScreen: React.FC<RulesScreenProps> = ({}) => {
    const navigate = useNavigate()
    const { t, tRule } = useLanguage()

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
                gap: 4,
                p: 4,
                boxSizing: "border-box",
                overflow: "auto",
            }}
        >
            <Typography sx={{ color: "#fff", fontSize: 32 }}>{t("rules")}</Typography>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center", width: 720, maxWidth: "90vw" }}>
                {ruleKeys.map((key) => (
                    <Button
                        key={key}
                        variant="contained"
                        onClick={() => navigate(`/library/rules/${key}`)}
                        sx={{ bgcolor: "#222", color: "#fff", textTransform: "none" }}
                    >
                        {tRule(key, "name")}
                    </Button>
                ))}
            </Box>

            <Button onClick={() => navigate("/library")} sx={{ mt: 3, color: "#fff" }}>
                {t("goBack")}
            </Button>
        </Box>
    )
}
