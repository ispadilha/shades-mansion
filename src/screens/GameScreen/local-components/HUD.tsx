import React from "react"
import { Box } from "@mui/material"
import { GameLogPanel } from "./GameLogPanel"
import { HudActions } from "./HudActions"
import { ManipulationBanner } from "./ManipulationBanner"
import { TurnStatus } from "./TurnStatus"
import { TurnOrderBar } from "../../../components/initiative"
import type { PieceDefinition, MotivationItemKey } from "../../../logic/types"
import { HUD_PALETTE } from "../../../constants/palette"

// O HUD é feito de faixas horizontais de mesma altura e mesma cor.
const BAND_HEIGHT = 76
const TURN_ORDER_WIDTH = "75%"

interface HUDProps {
    // Peça da vez na ordem de iniciativa (null só enquanto a partida está terminando)
    activePiece: PieceDefinition | null
    // Peças ainda em jogo, na ordem de iniciativa, para a faixa de turnos
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
    manipulationKey: MotivationItemKey | null
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
    return (
        <Box sx={{ width: "100%", bgcolor: HUD_PALETTE.bandBg, flexShrink: 0, display: "flex", flexDirection: "column" }}>
            {manipulationKey && <ManipulationBanner itemKey={manipulationKey} onCancel={onCancelManipulation} />}

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

                <GameLogPanel entries={log} />
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
                <TurnStatus activePiece={activePiece} isPlayerTurn={isPlayerTurn} spectating={spectating} />
                <HudActions
                    isPlayerTurn={isPlayerTurn}
                    busy={busy}
                    spectating={spectating}
                    inventoryCount={inventoryCount}
                    onOpenInventory={onOpenInventory}
                    onEndTurn={onEndTurn}
                    onQuit={onQuit}
                />
            </Box>
        </Box>
    )
}
