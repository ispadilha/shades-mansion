import React from "react"
import { HudBanner } from "./HudBanner"
import { skillExitIsFinish, skillRollOf, skillStaysActive, type ActiveSkill } from "../../../logic/skills"
import type { PieceDefinition } from "../../../logic/types"
import { useLanguage } from "../../../hooks/useLanguage"
import { usePalette } from "../../../hooks/usePalette"

interface SkillBannerProps {
    // Habilidade em uso, ou null quando nenhuma
    active: ActiveSkill | null
    // A peça da vez, dona da habilidade: os dados dela dependem do nível
    piece: PieceDefinition | null
    chargesLeft: number
    onCancel: () => void
}

export const SkillBanner: React.FC<SkillBannerProps> = ({ active, piece, chargesLeft, onCancel }) => {
    const palette = usePalette()
    const { t } = useLanguage()

    // A faixa diz o que a habilidade em uso ainda tem a oferecer: a que rolou dados anuncia
    // o que saiu, o alcance e, se for o caso, o dano. A que cria coisas, quantas ainda restam.
    const rolled = active !== null && piece !== null && skillRollOf(active.skill, piece) !== null
    const damage = active?.damage !== undefined ? `, ${active.damage} ${t("damagePoints")}` : ""
    const detail = rolled
        ? ` — ${active.range} ${t("cells")}${damage}`
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
