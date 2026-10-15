import React from "react"
import { Box } from "@mui/material"
import { InitiativeLineup } from "./InitiativeLineup"
import { ScreenSubtitle, ScreenTitle } from "../../../components/ui"
import type { CharacterSlot } from "../../../logic/setup"
import { useLanguage } from "../../../hooks/useLanguage"

interface InitiativeHeaderProps {
    // Personagens na ordem em que devem aparecer na fila
    slots: CharacterSlot[]
    // Personagem que está rolando o dado agora
    activeId: string | null
    values: Record<string, number>
    // As rolagens acabaram: a fila passa a mostrar a ordem sorteada
    showOrder: boolean
    faded: boolean
}

export const InitiativeHeader: React.FC<InitiativeHeaderProps> = ({ slots, activeId, values, showOrder, faded }) => {
    const { t } = useLanguage()

    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, pt: 6, flexShrink: 0 }}>
            <ScreenTitle size={30}>{t("initiativeTitle")}</ScreenTitle>
            <ScreenSubtitle>{showOrder ? t("turnOrderReady") : t("initiativeSubtitle")}</ScreenSubtitle>

            <InitiativeLineup
                slots={slots}
                activeId={activeId}
                values={values}
                showRank={showOrder}
                faded={faded}
            />
        </Box>
    )
}
