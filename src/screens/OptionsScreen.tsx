import React from "react"
import { Box, Button, Typography } from "@mui/material"
import { useLanguage } from "../hooks/useLanguage"

interface OptionsScreenProps {
    onBack: () => void
}

export const OptionsScreen: React.FC<OptionsScreenProps> = ({ onBack }) => {
    const { setLanguage, t } = useLanguage()

    return (
        <Box
            sx={{
                width: "100vw",
                height: "100vh",
                bgcolor: "#000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                flexDirection: "column",
            }}
        >
            <Typography sx={{ color: "#fff", fontSize: 28 }}>{t("chooseLanguage")}</Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
                <Button onClick={() => setLanguage("enUS")} sx={{ bgcolor: "#001", color: "#faa" }}>
                    {t("enUS")}
                </Button>
                <Button onClick={() => setLanguage("ptBR")} sx={{ bgcolor: "#010", color: "#ffa" }}>
                    {t("ptBR")}
                </Button>
            </Box>
            <Button onClick={onBack} sx={{ mt: 3, color: "#fff" }}>
                {t("goBack")}
            </Button>
        </Box>
    )
}
