import React from "react"
import { HudBanner } from "./HudBanner"
import { skillExitIsFinish, skillStaysActive, type ActiveSkill } from "../../../logic/skills"
import { useLanguage } from "../../../hooks/useLanguage"
import { usePalette } from "../../../hooks/usePalette"

interface SkillBannerProps {
    // Habilidade em uso, ou null quando nenhuma
    active: ActiveSkill | null
    chargesLeft: number
    onCancel: () => void
}

export const SkillBanner: React.FC<SkillBannerProps> = ({ active, chargesLeft, onCancel }) => {
    const palette = usePalette()
    const { t } = useLanguage()

    // A faixa diz o que a habilidade em uso ainda tem a oferecer: a que rolou dado anuncia
    // o alcance que saiu. A que cria coisas, quantas ainda restam.
    const detail = active?.skill.roll
        ? ` — ${active.range} ${t("cells")}`
        : active && skillStaysActive(active.skill)
          ? ` — ${chargesLeft} ${t("barriersLeft")}`
          : ""
    const message = active ? `${t("usingSkill")}: ${t(active.skill.name)} (${active.pieceId})${detail}` : ""

    return (
        <HudBanner
            open={active !== null}
            bg={palette.skill.bandBg}
            outline={palette.skill.bandOutline}
            textColor={palette.skill.bandText}
            message={message}
            actionLabel={skillExitIsFinish(active) ? t("finishSkill") : t("cancelSkill")}
            onAction={onCancel}
        />
    )
}
