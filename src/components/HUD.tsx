import React, { useEffect, useRef } from "react"
import { Box, Button, Typography } from "@mui/material"
import type { PieceDefinition, SpecialItemKey } from "../logic/types"
import { TurnOrderBar } from "./initiative"
import { useLanguage } from "../hooks/useLanguage"

// O HUD é feito de faixas horizontais de mesma altura e mesma cor.
const BAND_HEIGHT = 76
const BAND_BG = "#222"

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
                        bgcolor: "#3a2a10",
                        borderBottom: "1px solid #555",
                    }}
                >
                    <Typography sx={{ color: "#ffd27a", fontSize: 13 }}>
                        {t("manipulatingPiece")}: {manipulationKey}
                    </Typography>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={onCancelManipulation}
                        sx={{ color: "#fff", borderColor: "#777", py: 0.25 }}
                    >
                        {t("cancelManipulation")}
                    </Button>
                </Box>
            )}

            {/* Faixa de cima: ordem dos turnos à esquerda, log de jogadas à direita */}
            <Box sx={{ display: "flex", height: BAND_HEIGHT, borderBottom: "1px solid #333" }}>
                <Box sx={{ width: TURN_ORDER_WIDTH, flexShrink: 0, overflow: "hidden" }}>
                    <TurnOrderBar order={turnOrder} activeId={activePiece?.id ?? null} round={round} />
                </Box>

                <Box
                    ref={logRef}
                    sx={{
                        flex: 1,
                        minWidth: 0,
                        borderLeft: "1px solid #333",
                        overflowY: "auto",
                        overflowWrap: "anywhere",
                        px: 2,
                        py: 0.5,
                    }}
                >
                    {log.map((entry, i) => (
                        <Typography key={i} sx={{ color: "#bbb", fontSize: 13, lineHeight: 1.4 }}>
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
                    <Typography sx={{ color: "#fff", whiteSpace: "nowrap" }}>
                        {t("turn")}: {turnLabel}
                    </Typography>
                    <Typography
                        sx={{
                            color: isPlayerTurn ? "#4CAF50" : spectating ? "#aaa" : "#F44336",
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
                            <Button onClick={onOpenInventory} variant="outlined" sx={{ color: "#fff", borderColor: "#555" }}>
                                {t("inventory")} ({inventoryCount})
                            </Button>
                            <Button
                                onClick={onEndTurn}
                                variant="contained"
                                disabled={!isPlayerTurn || busy}
                                sx={{
                                    bgcolor: isPlayerTurn && !busy ? "#444" : "#666",
                                    color: "#fff",
                                    "&:disabled": { color: "#999" },
                                }}
                            >
                                {t("endTurn")}
                            </Button>
                        </>
                    )}
                    <Button onClick={onQuit} variant="outlined" sx={{ color: "#fff", borderColor: "#555" }}>
                        {t("quit")}
                    </Button>
                </Box>
            </Box>
        </Box>
    )
}
