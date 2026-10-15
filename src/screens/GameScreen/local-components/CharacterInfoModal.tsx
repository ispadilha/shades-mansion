import React from "react"
import { Typography } from "@mui/material"
import { ModalCard } from "../../../components/ui"
import type { CharacterDefinition } from "../../../logic/types"
import { diceLabel } from "../../../logic/rolls"
import { useLanguage } from "../../../hooks/useLanguage"
import { skillAreaSideOf, skillUsesOf, skillDamageOf, skillFor, skillRangeOf, skillRollOf } from "../../../logic/skills"
import { DEFENSE_DIE, canDodge, statsFor } from "../../../constants/rules"

// O número que o d20 da defesa precisa alcançar
const defenseTarget = (target: number) => `d${DEFENSE_DIE} ≥ ${target}`

// A ficha da personagem, com os atributos para o nível em que ela está
const CharacterSheet: React.FC<{ character: CharacterDefinition }> = ({ character }) => {
    const { t, tTeam } = useLanguage()
    const stats = statsFor(character.type, character.level)
    const skill = skillFor(character.type)
    const uses = skillUsesOf(skill, character)
    const rangeDice = skillRollOf(skill, character)
    const damageDice = skillDamageOf(skill, character)
    const areaSide = skillAreaSideOf(skill, character)

    return (
        <>
            <Typography>{t("team")}: {tTeam(character.color)}</Typography>
            <Typography>{t("type")}: {character.type}</Typography>
            <Typography>{t("level")}: {character.level}</Typography>
            <Typography>{t("vigor")}: {character.vigor} / {character.maxVigor}</Typography>
            <Typography>{t("moveRange")}: {stats.moveRange}</Typography>
            <Typography>{t("attackRange")}: {stats.attackRange}</Typography>
            <Typography>{t("damage")}: {diceLabel(stats.damage)}</Typography>
            {/* Personagem pesada demais para desviar de corpo inteiro só conta com o aparo */}
            <Typography>
                {t("dodge")}: {canDodge(character.type) ? defenseTarget(stats.dodge) : t("cannotDodge")}
            </Typography>
            <Typography>{t("guard")}: {defenseTarget(stats.guard)}</Typography>
            <Typography>
                {t("skill")}: {t(skill.name)}
            </Typography>
            {/* Habilidade que sorteia o alcance mostra os dados dele. A de alcance fixo, o número */}
            <Typography>
                {t("skillRange")}: {rangeDice ? diceLabel(rangeDice) : skillRangeOf(skill, character)}
            </Typography>
            {damageDice && (
                <Typography>
                    {t("skillDamage")}: {diceLabel(damageDice)}
                </Typography>
            )}
            {uses !== null && (
                <Typography>
                    {t("skillUses")}: {uses}
                </Typography>
            )}
            {areaSide !== null && (
                <Typography>
                    {t("attackArea")}: {areaSide} × {areaSide}
                </Typography>
            )}
        </>
    )
}

interface CharacterInfoModalProps {
    character: CharacterDefinition | null
    onClose: () => void
}

export const CharacterInfoModal: React.FC<CharacterInfoModalProps> = ({ character, onClose }) => {
    return (
        <ModalCard open={character !== null} onClose={onClose} width={220} sx={{ p: 2 }}>
            {character && <CharacterSheet character={character} />}
        </ModalCard>
    )
}
