import React from "react"
import { Button } from "@mui/material"
import { RollBoard } from "../../../components/rolls"
import type { RollView } from "../../../logic/rolls"
import { useLanguage } from "../../../hooks/useLanguage"
import { UI_PALETTE } from "../../../constants/palette"

interface InitiativeRollProps {
    roll: RollView
    // Uma rolagem terminou de ser encenada: a próxima da fila entra
    onDone: () => void
    // Adianta a fila inteira até o fim
    onSkip: () => void
}

export const InitiativeRoll: React.FC<InitiativeRollProps> = ({ roll, onDone, onSkip }) => {
    const { t } = useLanguage()

    return (
        <RollBoard
            roll={roll}
            onDone={onDone}
            footer={
                <Button size="small" onClick={onSkip} sx={{ color: UI_PALETTE.accentMuted }}>
                    {t("skipRolls")}
                </Button>
            }
        />
    )
}
