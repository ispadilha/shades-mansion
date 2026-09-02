import React from "react"
import { Typography } from "@mui/material"
import { ModalCard } from "../../../components/ui"
import type { PieceDefinition } from "../../../logic/types"
import { diceLabel } from "../../../logic/rolls"
import { useLanguage } from "../../../hooks/useLanguage"
import { DEFENSE_DIE, FIRE_AREA_SIDE, PIECE_STATS, canDodge, isAreaAttack, isRanged } from "../../../constants/rules"

interface PieceInfoModalProps {
    piece: PieceDefinition | null
    onClose: () => void
}

// O número que o d20 da defesa precisa alcançar
const defenseTarget = (target: number) => `d${DEFENSE_DIE} ≥ ${target}`

export const PieceInfoModal: React.FC<PieceInfoModalProps> = ({ piece, onClose }) => {
    const { t, tTeam } = useLanguage()

    return (
        <ModalCard open={piece !== null} onClose={onClose} width={220} sx={{ p: 2 }}>
            {piece && (
                <>
                    <Typography>{t("team")}: {tTeam(piece.color)}</Typography>
                    <Typography>{t("type")}: {piece.type}</Typography>
                    <Typography>{t("hp")}: {piece.hp} / {piece.maxHp}</Typography>
                    <Typography>{t("moveRange")}: {PIECE_STATS[piece.type].moveRange}</Typography>
                    <Typography>{t("attackRange")}: {PIECE_STATS[piece.type].attackRange}</Typography>
                    <Typography>{t("damage")}: {diceLabel(PIECE_STATS[piece.type].damage)}</Typography>
                    <Typography>
                        {t("dodge")}:{" "}
                        {canDodge(piece.type) ? defenseTarget(PIECE_STATS[piece.type].dodge) : t("dodgeNever")}
                    </Typography>
                    <Typography>{t("guard")}: {defenseTarget(PIECE_STATS[piece.type].guard)}</Typography>
                    <Typography>
                        {t("attackStyle")}: {t(isRanged(piece.type) ? "attackStyleRanged" : "attackStyleMelee")}
                    </Typography>
                    {isAreaAttack(piece.type) && (
                        <Typography>
                            {t("attackArea")}: {FIRE_AREA_SIDE} × {FIRE_AREA_SIDE}
                        </Typography>
                    )}
                </>
            )}
        </ModalCard>
    )
}
