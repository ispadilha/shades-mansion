import React from "react"
import { useNavigate } from "react-router-dom"
import { Box, Button, Typography } from "@mui/material"
import type { TextKey } from "../logic/types"
import { characterKeys } from "../constants/texts_characters"
import { useLanguage } from "../hooks/useLanguage"

interface TeamSection {
    // Título da seção (reaproveita os rótulos dos times já existentes)
    label: TextKey
    // Primeira letra do id das peças do time ("lA", "gB", "dC"...)
    prefix: string
    bg: string
    fg: string
}

const TEAM_SECTIONS: TeamSection[] = [
    { label: "dark", prefix: "d", bg: "#111", fg: "#fff" },
    { label: "gray", prefix: "g", bg: "#888", fg: "#fff" },
    { label: "light", prefix: "l", bg: "#ddd", fg: "#000" },
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
            <Typography sx={{ color: "#fff", fontSize: 32 }}>{t("characters")}</Typography>

            {TEAM_SECTIONS.map((section) => (
                <Box key={section.prefix} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                    <Typography sx={{ color: "#777", fontSize: 16 }}>{t(section.label)}</Typography>
                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
                        {characterKeys
                            .filter((key) => key.startsWith(section.prefix))
                            .map((key) => (
                                <Button
                                    key={key}
                                    onClick={() => navigate(`/library/characters/${key}`)}
                                    sx={{ bgcolor: section.bg, color: section.fg, textTransform: "none" }}
                                >
                                    {tCharacter(key, "name")}
                                </Button>
                            ))}
                    </Box>
                </Box>
            ))}

            <Button onClick={() => navigate("/library")} sx={{ mt: 3, color: "#fff" }}>
                {t("goBack")}
            </Button>
        </Box>
    )
}
