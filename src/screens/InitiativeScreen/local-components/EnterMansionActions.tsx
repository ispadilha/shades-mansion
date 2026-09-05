import React from "react"
import { Box, Button } from "@mui/material"
import { useLanguage } from "../../../hooks/useLanguage"
import { usePalette } from "../../../hooks/usePalette"

interface EnterMansionActionsProps {
    // A partida já está montada (labirinto, peças e itens prontos)
    ready: boolean
    onEnter: () => void
    onBack: () => void
}

// A entrada na partida, no lugar das rolagens quando a ordem está sorteada
export const EnterMansionActions: React.FC<EnterMansionActionsProps> = ({ ready, onEnter, onBack }) => {
    const palette = usePalette()
    const { t } = useLanguage()

    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <Button
                variant="contained"
                disabled={!ready}
                onClick={onEnter}
                sx={{ bgcolor: palette.ui.buttonAltBg, color: palette.ui.text, px: 4, py: 1.5, "&:disabled": { color: palette.ui.textMuted } }}
            >
                {ready ? t("enterMansion") : t("preparingMansion")}
            </Button>
            <Button onClick={onBack} sx={{ color: palette.ui.textDim }}>
                {t("goBack")}
            </Button>
        </Box>
    )
}
