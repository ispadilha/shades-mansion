import React from "react"
import { BoardContextMenu } from "./BoardContextMenu"
import { InventoryModal } from "./InventoryModal"
import { ItemInfoModal } from "./ItemInfoModal"
import { PieceInfoModal } from "./PieceInfoModal"
import { SkillsModal } from "./SkillsModal"
import { RollModal } from "../../../components/rolls"
import { hasSkillLeft } from "../../../logic/turn"
import { useMatch } from "../../../hooks/useMatch"

interface MatchMenusProps {}

// Tudo o que abre por cima do tabuleiro: o menu do clique direito, as fichas de peça e
// de item, a lista de habilidades, o inventário e a rolagem em cena.
export const MatchMenus: React.FC<MatchMenusProps> = ({}) => {
    const { board, turn, skill, inventory, menu, rolls } = useMatch()

    // A lista abre sempre, mas só deixa usar quando a peça da vez ainda tem habilidade
    const skillsDisabled = !turn.isPlayerTurn || turn.busy || !turn.activePiece || !hasSkillLeft(turn.activePiece)

    return (
        <>
            <BoardContextMenu
                menu={menu.state}
                onClose={menu.close}
                onShowPieceInfo={menu.showPieceInfo}
                onShowItemInfo={menu.showItemInfo}
                onWalk={menu.walk}
                onAttack={menu.attack}
                onSkill={menu.useSkill}
            />

            <PieceInfoModal piece={menu.infoPiece} onClose={menu.closeInfoPiece} />

            <SkillsModal
                open={skill.listOpen}
                onClose={skill.closeList}
                piece={turn.activePiece}
                disabled={skillsDisabled}
                onUse={skill.use}
            />

            <ItemInfoModal
                open={menu.infoItemKey !== null}
                onClose={menu.closeInfoItem}
                itemKey={menu.infoItemKey}
                playerColor={inventory.color}
            />

            {/* Sem time para consultar não há inventário que faça sentido abrir */}
            {inventory.color && (
                <InventoryModal
                    open={inventory.open}
                    onClose={() => inventory.setOpen(false)}
                    inventory={inventory.items}
                    pieces={board.pieces}
                    playerColor={inventory.color}
                    onUseOwnItem={inventory.useOwn}
                    onUseManipulationItem={inventory.useOnOther}
                />
            )}

            <RollModal roll={rolls.current} onDone={rolls.finish} />
        </>
    )
}
