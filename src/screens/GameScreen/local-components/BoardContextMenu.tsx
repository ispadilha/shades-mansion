import React from "react"
import { Menu, MenuItem } from "@mui/material"
import type { BoardAction, BoardMenuState } from "../../../logic/boardMenu"
import type { TextKey } from "../../../logic/types"
import { useLanguage } from "../../../hooks/useLanguage"

interface BoardContextMenuProps {
    menu: BoardMenuState | null
    onClose: () => void
    onShowPieceInfo: () => void
    onShowItemInfo: () => void
    onShowBarrierInfo: () => void
    // Andar até a casa, coletando o item que estiver nela
    onWalk: () => void
    onAttack: () => void
    // Tentar dissipar a barreira adversária da casa
    onDispel: () => void
    onSkill: () => void
}

export const BoardContextMenu: React.FC<BoardContextMenuProps> = ({
    menu,
    onClose,
    onShowPieceInfo,
    onShowItemInfo,
    onShowBarrierInfo,
    onWalk,
    onAttack,
    onDispel,
    onSkill,
}) => {
    const { t } = useLanguage()

    // O que cada opção faz e como se chama. A ordem é a da lista, que já chega pronta:
    // as ações primeiro, e as fichas de informação por último.
    const options: Record<BoardAction, { onClick: () => void; label?: TextKey }> = {
        move: { onClick: onWalk, label: "move" },
        collect: { onClick: onWalk, label: "collect" },
        attack: { onClick: onAttack, label: "attack" },
        dispel: { onClick: onDispel, label: "dispel" },
        // Cada habilidade traz o próprio rótulo ("atirar", "incendiar")
        skill: { onClick: onSkill, label: menu?.skillAction },
        pieceInfo: { onClick: onShowPieceInfo, label: "pieceInfo" },
        itemInfo: { onClick: onShowItemInfo, label: "itemInfo" },
        barrierInfo: { onClick: onShowBarrierInfo, label: "barrierInfo" },
    }

    return (
        <Menu
            open={menu !== null}
            onClose={onClose}
            anchorReference="anchorPosition"
            anchorPosition={menu ? { top: menu.mouseY, left: menu.mouseX } : undefined}
        >
            {menu?.actions.map((action) => {
                const { onClick, label } = options[action]
                return label ? (
                    <MenuItem key={action} onClick={onClick}>
                        {t(label)}
                    </MenuItem>
                ) : null
            })}
        </Menu>
    )
}
