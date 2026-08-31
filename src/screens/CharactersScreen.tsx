import React from "react"
import { useNavigate } from "react-router-dom"
import { Box, Button, Typography } from "@mui/material"
import type { PieceColor, TextKey } from "../logic/types"
import { characterKeys } from "../constants/texts_characters"
import { useLanguage } from "../hooks/useLanguage"
import { UI_PALETTE } from "../constants/palette"
import { TEAM_BUTTON_PALETTE } from "../constants/palette"

interface TeamSection {
    // Título da seção (reaproveita os rótulos dos times já existentes)
    label: TextKey
    // Primeira letra do id das peças do time ("lA", "gB", "dC"...)
    prefix: string
    // Time da seção: dá as cores do botão de cada personagem
    color: PieceColor
}

const TEAM_SECTIONS: TeamSection[] = [
    { label: "dark", prefix: "d", color: "dark" },
    { label: "gray", prefix: "g", color: "gray" },
    { label: "light", prefix: "l", color: "light" },
]

interface CharactersScreenProps {}

export const CharactersScreen: React.FC<CharactersScreenProps> = ({}) => {
    const navigate = useNavigate()
    const { t, tCharacter } = useLanguage()

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
                gap: 4,
                p: 4,
                boxSizing: "border-box",
                overflow: "auto",
            }}
        >
            <Typography sx={{ color: UI_PALETTE.text, fontSize: 32 }}>{t("characters")}</Typography>

            {TEAM_SECTIONS.map((section) => (
                <Box key={section.prefix} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                    <Typography sx={{ color: UI_PALETTE.textMuted, fontSize: 16 }}>{t(section.label)}</Typography>
                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
                        {characterKeys
                            .filter((key) => key.startsWith(section.prefix))
                            .map((key) => (
                                <Button
                                    key={key}
                                    onClick={() => navigate(`/library/characters/${key}`)}
                                    sx={{
                                        bgcolor: TEAM_BUTTON_PALETTE[section.color].bg,
                                        color: TEAM_BUTTON_PALETTE[section.color].text,
                                        textTransform: "none",
                                    }}
                                >
                                    {tCharacter(key, "name")}
                                </Button>
                            ))}
                    </Box>
                </Box>
            ))}

            <Button onClick={() => navigate("/library")} sx={{ mt: 3, color: UI_PALETTE.text }}>
                {t("goBack")}
            </Button>
        </Box>
    )
}
