import React from "react"
import { useNavigate } from "react-router-dom"
import { Box, Button, Typography } from "@mui/material"
import { useLanguage } from "../hooks/useLanguage"

interface LibraryScreenProps {}

export const LibraryScreen: React.FC<LibraryScreenProps> = ({}) => {
    const navigate = useNavigate()
    const { t } = useLanguage()

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
            }}
        >
            <Typography sx={{ color: "#fff", fontSize: 36 }}>{t("library")}</Typography>
            <Button
                variant="contained"
                onClick={() => navigate("/library/characters")}
                sx={{ bgcolor: "#222", color: "#fff", px: 4, py: 1.5 }}
            >
                {t("characters")}
            </Button>
            <Button
                variant="contained"
                onClick={() => navigate("/library/rules")}
                sx={{ bgcolor: "#222", color: "#fff", px: 4, py: 1.5 }}
            >
                {t("rules")}
            </Button>
            <Button onClick={() => navigate("/")} sx={{ mt: 3, color: "#fff" }}>
                {t("goBack")}
            </Button>
        </Box>
    )
}
