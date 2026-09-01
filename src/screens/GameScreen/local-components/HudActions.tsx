import React from "react"
import { Box, Button } from "@mui/material"
import { useLanguage } from "../../../hooks/useLanguage"
import { HUD_PALETTE } from "../../../constants/palette"

interface HudActionsProps {
    isPlayerTurn: boolean
    // Uma rolagem em andamento trava os controles até o resultado sair
    busy: boolean
    spectating: boolean
    inventoryCount: number
    onOpenInventory: () => void
    onEndTurn: () => void
    onQuit: () => void
}

// Os botões do HUD: inventário, encerrar o turno e sair da partida
export const HudActions: React.FC<HudActionsProps> = ({
    isPlayerTurn,
    busy,
    spectating,
    inventoryCount,
    onOpenInventory,
    onEndTurn,
    onQuit,
}) => {
    const { t } = useLanguage()

    return (
        <Box sx={{ display: "flex", gap: 2, flexShrink: 0 }}>
            {/* Quem só assiste não tem inventário nem turno para encerrar */}
            {!spectating && (
                <>
                    <Button
                        onClick={onOpenInventory}
                        variant="outlined"
                        sx={{ color: HUD_PALETTE.text, borderColor: HUD_PALETTE.outline }}
                    >
                        {t("inventory")} ({inventoryCount})
                    </Button>
                    <Button
                        onClick={onEndTurn}
                        variant="contained"
                        disabled={!isPlayerTurn || busy}
                        sx={{
                            bgcolor: isPlayerTurn && !busy ? HUD_PALETTE.endTurnBg : HUD_PALETTE.endTurnBusyBg,
                            color: HUD_PALETTE.text,
                            "&:disabled": { color: HUD_PALETTE.endTurnDisabledText },
                        }}
                    >
                        {t("endTurn")}
                    </Button>
                </>
            )}
            <Button onClick={onQuit} variant="outlined" sx={{ color: HUD_PALETTE.text, borderColor: HUD_PALETTE.outline }}>
                {t("quit")}
            </Button>
        </Box>
    )
}
