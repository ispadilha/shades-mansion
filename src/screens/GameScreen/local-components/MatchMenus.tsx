import React from "react"
import { BarrierInfoModal } from "./BarrierInfoModal"
import { BoardContextMenu } from "./BoardContextMenu"
import { InventoryModal } from "./InventoryModal"
import { ItemInfoModal } from "./ItemInfoModal"
import { CharacterInfoModal } from "./CharacterInfoModal"
import { SkillsModal } from "./SkillsModal"
import { RollModal } from "../../../components/rolls"
import { hasSkillLeft } from "../../../logic/turn"
import { useMatch } from "../../../hooks/useMatch"

interface MatchMenusProps {}

// Tudo o que abre por cima do tabuleiro: o menu do clique direito, as fichas de personagem e
// de item, a lista de habilidades, o inventário e a rolagem em cena.
export const MatchMenus: React.FC<MatchMenusProps> = ({}) => {
    const { board, turn, skill, inventory, menu, rolls } = useMatch()

    // A lista abre sempre, mas só deixa usar quando a personagem da vez ainda tem habilidade
    const skillsDisabled = !turn.isPlayerTurn || turn.busy || turn.activeCharacter === null || !hasSkillLeft(turn.activeCharacter)

    return (
        <>
            <BoardContextMenu
                menu={menu.state}
                onClose={menu.close}
                onShowCharacterInfo={menu.showCharacterInfo}
                onShowItemInfo={menu.showItemInfo}
                onShowBarrierInfo={menu.showBarrierInfo}
                onWalk={menu.walk}
                onAttack={menu.attack}
                onDispel={menu.dispel}
                onSkill={menu.useSkill}
            />

            <CharacterInfoModal character={menu.infoCharacter} onClose={menu.closeInfoCharacter} />

            <BarrierInfoModal barrier={menu.infoBarrier} onClose={menu.closeInfoBarrier} />

            <SkillsModal
                open={skill.listOpen}
                onClose={skill.closeList}
                character={turn.activeCharacter}
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
                    characters={board.characters}
                    playerColor={inventory.color}
                    canUse={turn.isPlayerTurn && !turn.busy}
                    onUseOwnItem={inventory.useOwn}
                    onUseManipulationItem={inventory.useOnOther}
                />
            )}

            <RollModal roll={rolls.current} onDone={rolls.finish} />
        </>
    )
}
