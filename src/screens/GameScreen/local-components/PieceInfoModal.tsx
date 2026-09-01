import React from "react"
import { Typography } from "@mui/material"
import { ModalCard } from "../../../components/ui"
import type { PieceDefinition } from "../../../logic/types"
import { useLanguage } from "../../../hooks/useLanguage"
import { FIRE_AREA_SIDE, PIECE_STATS, isAreaAttack, isRanged } from "../../../constants/rules"

interface PieceInfoModalProps {
    piece: PieceDefinition | null
    onClose: () => void
}

export const PieceInfoModal: React.FC<PieceInfoModalProps> = ({ piece, onClose }) => {
    const { t, tTeam } = useLanguage()

    return (
        <ModalCard open={piece !== null} onClose={onClose} width={200} sx={{ p: 2 }}>
            {piece && (
                <>
                    <Typography>{t("team")}: {tTeam(piece.color)}</Typography>
                    <Typography>{t("type")}: {piece.type}</Typography>
                    <Typography>{t("hp")}: {piece.hp} / {piece.maxHp}</Typography>
                    <Typography>{t("moveRange")}: {PIECE_STATS[piece.type].moveRange}</Typography>
                    <Typography>{t("attackRange")}: {PIECE_STATS[piece.type].attackRange}</Typography>
                    <Typography>{t("attackPower")}: {PIECE_STATS[piece.type].attackDamage}</Typography>
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
