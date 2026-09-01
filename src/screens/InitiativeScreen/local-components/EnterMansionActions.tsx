import React from "react"
import { Box, Button } from "@mui/material"
import { useLanguage } from "../../../hooks/useLanguage"
import { UI_PALETTE } from "../../../constants/palette"

interface EnterMansionActionsProps {
    // A partida já está montada (labirinto, peças e itens prontos)
    ready: boolean
    onEnter: () => void
    onBack: () => void
}

// A entrada na partida, no lugar das rolagens quando a ordem está sorteada
export const EnterMansionActions: React.FC<EnterMansionActionsProps> = ({ ready, onEnter, onBack }) => {
    const { t } = useLanguage()

    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <Button
                variant="contained"
                disabled={!ready}
                onClick={onEnter}
                sx={{ bgcolor: UI_PALETTE.buttonAltBg, color: UI_PALETTE.text, px: 4, py: 1.5, "&:disabled": { color: UI_PALETTE.textMuted } }}
            >
                {ready ? t("enterMansion") : t("preparingMansion")}
            </Button>
            <Button onClick={onBack} sx={{ color: UI_PALETTE.textDim }}>
                {t("goBack")}
            </Button>
        </Box>
    )
}
