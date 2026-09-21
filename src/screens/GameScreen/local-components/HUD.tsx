import React from "react"
import { Box } from "@mui/material"
import { GameLogPanel } from "./GameLogPanel"
import { HudActions } from "./HudActions"
import { HintBanner } from "./HintBanner"
import { ManipulationBanner } from "./ManipulationBanner"
import { SkillBanner } from "./SkillBanner"
import { TurnStatus } from "./TurnStatus"
import { TurnOrderBar } from "../../../components/initiative"
import type { PieceAuras, PieceDefinition, MotivationItemKey } from "../../../logic/types"
import type { ActiveSkill } from "../../../logic/skills"
import { usePalette } from "../../../hooks/usePalette"

// O HUD é feito de faixas horizontais de mesma altura e mesma cor.
const BAND_HEIGHT = 76
const TURN_ORDER_WIDTH = "75%"

interface HUDProps {
    // Peça da vez na ordem de iniciativa (null só enquanto a partida está terminando)
    activePiece: PieceDefinition | null
    // Peças ainda em jogo, na ordem de iniciativa, para a faixa de turnos
    turnOrder: PieceDefinition[]
    // Destaques das peças, os mesmos do tabuleiro
    auras: PieceAuras
    round: number
    isPlayerTurn: boolean
    // Uma rolagem em andamento trava os controles até o resultado sair
    busy: boolean
    spectating: boolean
    onEndTurn: () => void
    onQuit: () => void
    onOpenSkills: () => void
    onOpenInventory: () => void
    inventoryCount: number
    log: string[]
    manipulationKey: MotivationItemKey | null
    onCancelManipulation: () => void
    onFocusActivePiece: () => void
    hintVisible: boolean
    onDismissHint: () => void
    activeSkill: ActiveSkill | null
    onCancelSkill: () => void
}

export const HUD: React.FC<HUDProps> = ({
    activePiece,
    turnOrder,
    auras,
    round,
    isPlayerTurn,
    busy,
    spectating,
    onEndTurn,
    onQuit,
    onOpenSkills,
    onOpenInventory,
    inventoryCount,
    log,
    manipulationKey,
    onCancelManipulation,
    onFocusActivePiece,
    hintVisible,
    onDismissHint,
    activeSkill,
    onCancelSkill,
}) => {
    const palette = usePalette()

    return (
        <Box sx={{ width: "100%", bgcolor: palette.hud.bandBg, flexShrink: 0, display: "flex", flexDirection: "column" }}>
            {/* Banners sempre montados: cada um "decide sozinho" quando entrar e sair,
                e precisa continuar na árvore para conseguir deslizar de volta. */}
            <ManipulationBanner itemKey={manipulationKey} onCancel={onCancelManipulation} />
            <SkillBanner active={activeSkill} onCancel={onCancelSkill} />
            <HintBanner open={hintVisible} onDismiss={onDismissHint} />

            {/* Faixa de cima: ordem dos turnos à esquerda, log de jogadas à direita */}
            <Box sx={{ display: "flex", height: BAND_HEIGHT, borderBottom: `1px solid ${palette.hud.bandBorder}` }}>
                <Box sx={{ width: TURN_ORDER_WIDTH, flexShrink: 0, overflow: "hidden" }}>
                    <TurnOrderBar
                        order={turnOrder}
                        auras={auras}
                        activeId={activePiece?.id ?? null}
                        onActivate={isPlayerTurn ? onFocusActivePiece : undefined}
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
                    onOpenSkills={onOpenSkills}
                    onOpenInventory={onOpenInventory}
                    onEndTurn={onEndTurn}
                    onQuit={onQuit}
                />
            </Box>
        </Box>
    )
}
