import React from "react"
import { HudBanner } from "./HudBanner"
import type { Skill } from "../../../logic/skills"
import { useLanguage } from "../../../hooks/useLanguage"
import { usePalette } from "../../../hooks/usePalette"

interface SkillBannerProps {
    skill: Skill | null
    pieceId: string | null
    onCancel: () => void
}

export const SkillBanner: React.FC<SkillBannerProps> = ({ skill, pieceId, onCancel }) => {
    const palette = usePalette()
    const { t } = useLanguage()

    return (
        <HudBanner
            open={skill !== null && pieceId !== null}
            bg={palette.skill.bandBg}
            outline={palette.skill.bandOutline}
            textColor={palette.skill.bandText}
            message={skill ? `${t("usingSkill")}: ${t(skill.name)} (${pieceId})` : ""}
            actionLabel={t("cancelSkill")}
            onAction={onCancel}
        />
    )
}
