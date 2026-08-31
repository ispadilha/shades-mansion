import React from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { Box, Button, Typography } from "@mui/material"
import { characterKeys } from "../constants/texts_characters"
import { useLanguage } from "../hooks/useLanguage"
import { UI_PALETTE } from "../constants/palette"

interface CharacterScreenProps {}

export const CharacterScreen: React.FC<CharacterScreenProps> = ({}) => {
    const navigate = useNavigate()
    const { t, tCharacter } = useLanguage()
    const { characterKey } = useParams()

    // Chave desconhecida na URL (link velho, digitação errada) volta para a lista
    const key = characterKeys.find((k) => k === characterKey)
    if (!key) return <Navigate to="/library/characters" replace />

    return (
        <Box
            sx={{
                width: "100vw",
                height: "100vh",
                bgcolor: UI_PALETTE.screenBg,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                p: 4,
                boxSizing: "border-box",
            }}
        >
            <Typography sx={{ color: UI_PALETTE.text, fontSize: 32, textAlign: "center" }}>{tCharacter(key, "name")}</Typography>

            <Box sx={{ width: 720, maxWidth: "90vw", maxHeight: "60vh", overflowY: "auto" }}>
                <Typography sx={{ color: UI_PALETTE.textBody, fontSize: 17, lineHeight: 1.7, whiteSpace: "pre-line" }}>
                    {tCharacter(key, "description")}
                </Typography>
            </Box>

            <Button onClick={() => navigate("/library/characters")} sx={{ mt: 2, color: UI_PALETTE.text }}>
                {t("goBack")}
            </Button>
        </Box>
    )
}
