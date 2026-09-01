import React from "react"
import { useNavigate } from "react-router-dom"
import { Box, Typography } from "@mui/material"
import { TeamButton } from "../../../components/ui"
import type { PieceColor } from "../../../logic/types"
import { characterKeys } from "../../../constants/texts_characters"
import { useLanguage } from "../../../hooks/useLanguage"
import { UI_PALETTE } from "../../../constants/palette"

interface TeamCharacterSectionProps {
    color: PieceColor
}

export const TeamCharacterSection: React.FC<TeamCharacterSectionProps> = ({ color }) => {
    const navigate = useNavigate()
    const { tTeam, tCharacter } = useLanguage()

    const keys = characterKeys.filter((key) => key.startsWith(color[0]))

    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
            <Typography sx={{ color: UI_PALETTE.textMuted, fontSize: 16 }}>{tTeam(color)}</Typography>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
                {keys.map((key) => (
                    <TeamButton
                        key={key}
                        color={color}
                        onClick={() => navigate(`/library/characters/${key}`)}
                        sx={{ textTransform: "none" }}
                    >
                        {tCharacter(key, "name")}
                    </TeamButton>
                ))}
            </Box>
        </Box>
    )
}
