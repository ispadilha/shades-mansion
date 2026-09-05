import React from "react"
import { Button } from "@mui/material"
import { RollBoard } from "../../../components/rolls"
import type { RollView } from "../../../logic/rolls"
import { useLanguage } from "../../../hooks/useLanguage"
import { usePalette } from "../../../hooks/usePalette"

interface InitiativeRollProps {
    roll: RollView
    // Uma rolagem terminou de ser encenada: a próxima da fila entra
    onDone: () => void
    // Adianta a fila inteira até o fim
    onSkip: () => void
}

export const InitiativeRoll: React.FC<InitiativeRollProps> = ({ roll, onDone, onSkip }) => {
    const palette = usePalette()
    const { t } = useLanguage()

    return (
        <RollBoard
            roll={roll}
            onDone={onDone}
            footer={
                <Button size="small" onClick={onSkip} sx={{ color: palette.ui.accentMuted }}>
                    {t("skipRolls")}
                </Button>
            }
        />
    )
}
