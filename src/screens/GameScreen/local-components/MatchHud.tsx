import React from "react"
import { HUD } from "./HUD"
import { useMatch } from "../../../hooks/useMatch"

interface MatchHudProps {}

// A barra de comando da partida em curso: junta o que o HUD mostra (de quem é a vez, o
// que está em curso, o que o jogador guardou) e entrega tudo já no formato dele.
export const MatchHud: React.FC<MatchHudProps> = ({}) => {
    const { board, turn, skill, manipulation, inventory, log, hint } = useMatch()

    return (
        <HUD
            activePiece={turn.activePiece}
            turnOrder={turn.order}
            auras={board.auras}
            round={turn.round}
            isPlayerTurn={turn.isPlayerTurn}
            busy={turn.busy}
            spectating={turn.spectating}
            onEndTurn={turn.end}
            onQuit={turn.quit}
            onFocusActivePiece={turn.focusActivePiece}
            onOpenSkills={skill.openList}
            activeSkill={skill.active}
            onCancelSkill={skill.cancel}
            manipulationKey={manipulation.current?.itemKey ?? null}
            onCancelManipulation={manipulation.cancel}
            onOpenInventory={() => inventory.setOpen(true)}
            inventoryCount={inventory.items.length}
            log={log}
            hintVisible={hint.visible}
            onDismissHint={hint.dismiss}
        />
    )
}
