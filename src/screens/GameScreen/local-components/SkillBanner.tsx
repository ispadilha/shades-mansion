import React from "react"
import { Box, Button, Typography } from "@mui/material"
import type { Skill } from "../../../logic/skills"
import { useLanguage } from "../../../hooks/useLanguage"
import { usePalette } from "../../../hooks/usePalette"

interface SkillBannerProps {
    // Habilidade em uso
    skill: Skill
    // Peça que a está usando
    pieceId: string
    onCancel: () => void
}

// Aviso de habilidade em uso, sobre o HUD
export const SkillBanner: React.FC<SkillBannerProps> = ({ skill, pieceId, onCancel }) => {
    const palette = usePalette()
    const { t } = useLanguage()

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                px: 3,
                py: 0.75,
                bgcolor: palette.skill.bandBg,
                borderBottom: `1px solid ${palette.skill.bandOutline}`,
            }}
        >
            <Typography sx={{ color: palette.skill.bandText, fontSize: 13 }}>
                {t("usingSkill")}: {t(skill.name)} ({pieceId})
            </Typography>
            <Button
                size="small"
                variant="outlined"
                onClick={onCancel}
                sx={{ color: palette.skill.bandText, borderColor: palette.skill.bandOutline, py: 0.25 }}
            >
                {t("cancelSkill")}
            </Button>
        </Box>
    )
}
