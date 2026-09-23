import React from "react"
import { Typography } from "@mui/material"
import { ModalCard } from "../../../components/ui"
import type { PieceDefinition } from "../../../logic/types"
import { diceLabel } from "../../../logic/rolls"
import { useLanguage } from "../../../hooks/useLanguage"
import { skillChargesOf, skillFor, skillRangeOf } from "../../../logic/skills"
import { DEFENSE_DIE, FIRE_AREA_SIDE, canDodge, statsFor } from "../../../constants/rules"

// O número que o d20 da defesa precisa alcançar
const defenseTarget = (target: number) => `d${DEFENSE_DIE} ≥ ${target}`

// A ficha da peça, com os atributos para o nível em que ela está
const PieceSheet: React.FC<{ piece: PieceDefinition }> = ({ piece }) => {
    const { t, tTeam } = useLanguage()
    const stats = statsFor(piece.type, piece.level)
    const skill = skillFor(piece.type)
    const charges = skill ? skillChargesOf(skill, piece) : null

    return (
        <>
            <Typography>{t("team")}: {tTeam(piece.color)}</Typography>
            <Typography>{t("type")}: {piece.type}</Typography>
            <Typography>{t("level")}: {piece.level}</Typography>
            <Typography>{t("vigor")}: {piece.vigor} / {piece.maxVigor}</Typography>
            <Typography>{t("moveRange")}: {stats.moveRange}</Typography>
            <Typography>{t("attackRange")}: {stats.attackRange}</Typography>
            <Typography>{t("damage")}: {diceLabel(stats.damage)}</Typography>
            {/* Peça pesada demais para desviar de corpo inteiro só conta com o aparo */}
            <Typography>
                {t("dodge")}: {canDodge(piece.type) ? defenseTarget(stats.dodge) : t("cannotDodge")}
            </Typography>
            <Typography>{t("guard")}: {defenseTarget(stats.guard)}</Typography>
            <Typography>
                {t("skill")}: {skill ? t(skill.name) : t("skillNone")}
            </Typography>
            {skill && !skill.roll && (
                <Typography>
                    {t("skillRange")}: {skillRangeOf(skill, piece)}
                </Typography>
            )}
            {skill && charges !== null && (
                <Typography>
                    {t("skillCharges")}: {charges}
                </Typography>
            )}
            {skill?.area && (
                <Typography>
                    {t("attackArea")}: {FIRE_AREA_SIDE} × {FIRE_AREA_SIDE}
                </Typography>
            )}
        </>
    )
}

interface PieceInfoModalProps {
    piece: PieceDefinition | null
    onClose: () => void
}

export const PieceInfoModal: React.FC<PieceInfoModalProps> = ({ piece, onClose }) => {
    return (
        <ModalCard open={piece !== null} onClose={onClose} width={220} sx={{ p: 2 }}>
            {piece && <PieceSheet piece={piece} />}
        </ModalCard>
    )
}
