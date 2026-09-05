import React from "react"
import { Box, Button } from "@mui/material"
import { useLanguage } from "../../../hooks/useLanguage"
import { usePalette } from "../../../hooks/usePalette"

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
    const palette = usePalette()
    const { t } = useLanguage()

    return (
        <Box sx={{ display: "flex", gap: 2, flexShrink: 0 }}>
            {/* Quem só assiste não tem inventário nem turno para encerrar */}
            {!spectating && (
                <>
                    <Button
                        onClick={onOpenInventory}
                        variant="outlined"
                        sx={{ color: palette.hud.text, borderColor: palette.hud.outline }}
                    >
                        {t("inventory")} ({inventoryCount})
                    </Button>
                    <Button
                        onClick={onEndTurn}
                        variant="contained"
                        disabled={!isPlayerTurn || busy}
                        sx={{
                            bgcolor: isPlayerTurn && !busy ? palette.hud.endTurnBg : palette.hud.endTurnBusyBg,
                            color: palette.hud.text,
                            "&:disabled": { color: palette.hud.endTurnDisabledText },
                        }}
                    >
                        {t("endTurn")}
                    </Button>
                </>
            )}
            <Button onClick={onQuit} variant="outlined" sx={{ color: palette.hud.text, borderColor: palette.hud.outline }}>
                {t("quit")}
            </Button>
        </Box>
    )
}
