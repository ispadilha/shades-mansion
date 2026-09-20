import React from "react"
import { Box, Button, Typography } from "@mui/material"
import type { Skill } from "../../../logic/skills"
import { useLanguage } from "../../../hooks/useLanguage"
import { usePalette } from "../../../hooks/usePalette"

interface SkillRowProps {
    // A habilidade, ou null para a linha "nenhuma" de peça que ainda não tem
    skill: Skill | null
    disabled: boolean
    onUse: () => void
}

export const SkillRow: React.FC<SkillRowProps> = ({ skill, disabled, onUse }) => {
    const palette = usePalette()
    const { t } = useLanguage()

    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 0.5 }}>
            <Typography sx={{ flex: 1, fontSize: 14, color: skill ? palette.surface.text : palette.surface.textMuted }}>
                {skill ? t(skill.name) : t("skillNone")}
            </Typography>
            <Button size="small" variant="contained" disabled={!skill || disabled} onClick={onUse}>
                {t("use")}
            </Button>
        </Box>
    )
}
