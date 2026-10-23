import React from "react"
import { HudBanner } from "./HudBanner"
import { skillExitIsFinish, skillRollOf, skillStaysActive, type ActiveSkill } from "../../../logic/skills"
import type { CharacterDefinition } from "../../../logic/types"
import { useLanguage } from "../../../hooks/useLanguage"
import { usePalette } from "../../../hooks/usePalette"

interface SkillBannerProps {
    // Habilidade em uso, ou null quando nenhuma
    active: ActiveSkill | null
    // A personagem da vez, dona da habilidade: os dados dela dependem do nível
    character: CharacterDefinition | null
    usesLeft: number
    onCancel: () => void
}

export const SkillBanner: React.FC<SkillBannerProps> = ({ active, character, usesLeft, onCancel }) => {
    const palette = usePalette()
    const { t, tCharacterName } = useLanguage()

    // A faixa diz o que a habilidade em uso ainda tem a oferecer: a que rolou dados anuncia
    // o que saiu, o alcance e, se for o caso, o dano. A que cria coisas, quantas ainda restam.
    const rolled = active !== null && character !== null && skillRollOf(active.skill, character) !== null
    const damage = active?.damage !== undefined ? `, ${active.damage} ${t("damagePoints")}` : ""
    const detail = rolled
        ? ` — ${active.range} ${t("cells")}${damage}`
        : active && skillStaysActive(active.skill)
          ? ` — ${usesLeft} ${t("barriersLeft")}`
          : ""
    // Habilidade usada por meio de outra (a imitação) diz as duas: a da personagem, e a que ela imita
    const name = active?.via ? `${t(active.via.name)} › ${t(active.skill.name)}` : active ? t(active.skill.name) : ""
    const message = active ? `${t("usingSkill")}: ${name} (${tCharacterName(active.characterId)})${detail}` : ""

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
