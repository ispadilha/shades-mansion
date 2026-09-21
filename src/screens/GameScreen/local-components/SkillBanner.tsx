import React from "react"
import { HudBanner } from "./HudBanner"
import type { ActiveSkill } from "../../../logic/skills"
import { useLanguage } from "../../../hooks/useLanguage"
import { usePalette } from "../../../hooks/usePalette"

interface SkillBannerProps {
    // Habilidade em uso, ou null quando nenhuma
    active: ActiveSkill | null
    onCancel: () => void
}

export const SkillBanner: React.FC<SkillBannerProps> = ({ active, onCancel }) => {
    const palette = usePalette()
    const { t } = useLanguage()

    // Habilidade que rola dado anuncia o resultado
    const message = active
        ? `${t("usingSkill")}: ${t(active.skill.name)} (${active.pieceId})` +
          (active.skill.roll ? ` — ${active.range} ${t("cells")}` : "")
        : ""

    return (
        <HudBanner
            open={active !== null}
            bg={palette.skill.bandBg}
            outline={palette.skill.bandOutline}
            textColor={palette.skill.bandText}
            message={message}
            actionLabel={t("cancelSkill")}
            onAction={onCancel}
        />
    )
}
