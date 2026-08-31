import React, { useEffect, useRef } from "react"
import { Box, Button, Typography } from "@mui/material"
import type { PieceDefinition, SpecialItemKey } from "../logic/types"
import { TurnOrderBar } from "./initiative"
import { useLanguage } from "../hooks/useLanguage"
import { HUD_PALETTE } from "../constants/palette"

// O HUD é feito de faixas horizontais de mesma altura e mesma cor.
const BAND_HEIGHT = 76
const BAND_BG = HUD_PALETTE.bandBg

const TURN_ORDER_WIDTH = "75%"

interface HUDProps {
    // Peça da vez na ordem de iniciativa (null só enquanto a partida está terminando)
    activePiece: PieceDefinition | null
    // Peças vivas na ordem de iniciativa, para a faixa de turnos
    turnOrder: PieceDefinition[]
    round: number
    isPlayerTurn: boolean
    // Uma rolagem em andamento trava os controles até o resultado sair
    busy: boolean
    spectating: boolean
    onEndTurn: () => void
    onQuit: () => void
    onOpenInventory: () => void
    inventoryCount: number
    log: string[]
    // Peça sob manipulação
    manipulatedId: string | null
    manipulationKey: SpecialItemKey | null
    onCancelManipulation: () => void
}

export const HUD: React.FC<HUDProps> = ({
    activePiece,
    turnOrder,
    round,
    isPlayerTurn,
    busy,
    spectating,
    onEndTurn,
    onQuit,
    onOpenInventory,
    inventoryCount,
    log,
    manipulatedId,
    manipulationKey,
    onCancelManipulation,
}) => {
    const { t } = useLanguage()
    const logRef = useRef<HTMLDivElement>(null)

    const turnLabel = activePiece
        ? `${activePiece.id} (${activePiece.color === "light" ? t("light") : activePiece.color === "dark" ? t("dark") : t("gray")})`
        : "—"

    // Mantém o log sempre rolado até a entrada mais recente (no rodapé da caixa)
    useEffect(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
    }, [log])

    return (
        <Box sx={{ width: "100%", bgcolor: BAND_BG, flexShrink: 0, display: "flex", flexDirection: "column" }}>
            {/* Aviso de manipulação em curso: aparece acima das faixas normais só enquanto dura */}
            {manipulationKey && (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                        px: 3,
                        py: 0.75,
                        bgcolor: HUD_PALETTE.manipulationBg,
                        borderBottom: `1px solid ${HUD_PALETTE.outline}`,
                    }}
                >
                    <Typography sx={{ color: HUD_PALETTE.manipulationText, fontSize: 13 }}>
                        {t("manipulatingPiece")}: {manipulationKey}
                    </Typography>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={onCancelManipulation}
                        sx={{ color: HUD_PALETTE.text, borderColor: HUD_PALETTE.manipulationOutline, py: 0.25 }}
                    >
                        {t("cancelManipulation")}
                    </Button>
                </Box>
            )}

            {/* Faixa de cima: ordem dos turnos à esquerda, log de jogadas à direita */}
            <Box sx={{ display: "flex", height: BAND_HEIGHT, borderBottom: `1px solid ${HUD_PALETTE.bandBorder}` }}>
                <Box sx={{ width: TURN_ORDER_WIDTH, flexShrink: 0, overflow: "hidden" }}>
                    <TurnOrderBar
                        order={turnOrder}
                        activeId={activePiece?.id ?? null}
                        manipulatedId={manipulatedId}
                        round={round}
                    />
                </Box>

                <Box
                    ref={logRef}
                    sx={{
                        flex: 1,
                        minWidth: 0,
                        borderLeft: `1px solid ${HUD_PALETTE.bandBorder}`,
                        overflowY: "auto",
                        overflowWrap: "anywhere",
                        px: 2,
                        py: 0.5,
                    }}
                >
                    {log.map((entry, i) => (
                        <Typography key={i} sx={{ color: HUD_PALETTE.logText, fontSize: 13, lineHeight: 1.4 }}>
                            {entry}
                        </Typography>
                    ))}
                </Box>
            </Box>

            {/* Faixa de baixo: peça da vez e botões */}
            <Box
                sx={{
                    display: "flex",
                    height: BAND_HEIGHT,
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    px: 3,
                    overflowX: "auto",
                }}
            >
                <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ color: HUD_PALETTE.text, whiteSpace: "nowrap" }}>
                        {t("turn")}: {turnLabel}
                    </Typography>
                    <Typography
                        sx={{
                            color:
                                spectating || (isPlayerTurn && activePiece?.movedThisTurn)
                                    ? HUD_PALETTE.statusIdle
                                    : isPlayerTurn
                                      ? HUD_PALETTE.statusReady
                                      : HUD_PALETTE.statusWaiting,
                            fontSize: 14,
                            whiteSpace: "nowrap",
                        }}
                    >
                        {isPlayerTurn
                            ? activePiece?.movedThisTurn
                                ? t("alreadyActed")
                                : t("yourTurn")
                            : spectating
                              ? t("spectating")
                              : t("wait")}
                    </Typography>
                </Box>
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
            </Box>
        </Box>
    )
}
