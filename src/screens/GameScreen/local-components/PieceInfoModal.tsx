import React from "react"
import { Typography } from "@mui/material"
import { ModalCard } from "../../../components/ui"
import type { PieceDefinition } from "../../../logic/types"
import { diceLabel } from "../../../logic/rolls"
import { useLanguage } from "../../../hooks/useLanguage"
import { DEFENSE_DIE, FIRE_AREA_SIDE, canDodge, isAreaAttack, isRanged, statsFor } from "../../../constants/rules"

// O número que o d20 da defesa precisa alcançar
const defenseTarget = (target: number) => `d${DEFENSE_DIE} ≥ ${target}`

// A ficha da peça, com os atributos para o nível em que ela está
const PieceSheet: React.FC<{ piece: PieceDefinition }> = ({ piece }) => {
    const { t, tTeam } = useLanguage()
    const stats = statsFor(piece.type, piece.level)

    return (
        <>
            <Typography>{t("team")}: {tTeam(piece.color)}</Typography>
            <Typography>{t("type")}: {piece.type}</Typography>
            <Typography>{t("level")}: {piece.level}</Typography>
            <Typography>{t("hp")}: {piece.hp} / {piece.maxHp}</Typography>
            <Typography>{t("moveRange")}: {stats.moveRange}</Typography>
            <Typography>{t("attackRange")}: {stats.attackRange}</Typography>
            <Typography>{t("damage")}: {diceLabel(stats.damage)}</Typography>
            {/* Peça pesada demais para desviar de corpo inteiro só conta com o aparo */}
            <Typography>
                {t("dodge")}: {canDodge(piece.type) ? defenseTarget(stats.dodge) : t("dodgeNever")}
            </Typography>
            <Typography>{t("guard")}: {defenseTarget(stats.guard)}</Typography>
            <Typography>
                {t("attackStyle")}: {t(isRanged(piece.type) ? "attackStyleRanged" : "attackStyleMelee")}
            </Typography>
            {isAreaAttack(piece.type) && (
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
