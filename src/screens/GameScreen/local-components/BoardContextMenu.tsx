import React from "react"
import { Menu, MenuItem } from "@mui/material"
import type { PieceDefinition, PiecePosition, SpecialItem } from "../../../logic/types"
import { useLanguage } from "../../../hooks/useLanguage"

// A casa em que o jogador clicou com o botão direito, e o que havia nela
export interface BoardMenuState {
    mouseX: number
    mouseY: number
    position?: PiecePosition
    targetPiece?: PieceDefinition
    itemAtPos?: SpecialItem
}

interface BoardContextMenuProps {
    menu: BoardMenuState | null
    selectedId: string | null
    selectedPiece?: PieceDefinition
    // Durante uma manipulação o alvo pode ser de qualquer cor
    manipulating: boolean
    onClose: () => void
    onShowPieceInfo: () => void
    onShowItemInfo: () => void
    onMove: () => void
    onCollect: () => void
    onAttack: () => void
}

// O menu que abre com o botão direito sobre uma casa. Quais ações aparecem já foi decidido
// na hora de abrir, aqui só ficam as combinações de "o que há na casa" x "há seleção".
export const BoardContextMenu: React.FC<BoardContextMenuProps> = ({
    menu,
    selectedId,
    selectedPiece,
    manipulating,
    onClose,
    onShowPieceInfo,
    onShowItemInfo,
    onMove,
    onCollect,
    onAttack,
}) => {
    const { t } = useLanguage()

    return (
        <Menu
            open={menu !== null}
            onClose={onClose}
            anchorReference="anchorPosition"
            anchorPosition={menu ? { top: menu.mouseY, left: menu.mouseX } : undefined}
        >
            {!selectedId && menu?.targetPiece && <MenuItem onClick={onShowPieceInfo}>{t("info")}</MenuItem>}

            {!selectedId && !menu?.targetPiece && menu?.itemAtPos && (
                <MenuItem onClick={onShowItemInfo}>{t("info")}</MenuItem>
            )}

            {selectedId && !menu?.targetPiece && !menu?.itemAtPos && <MenuItem onClick={onMove}>{t("move")}</MenuItem>}

            {selectedId && !menu?.targetPiece && menu?.itemAtPos && (
                <MenuItem onClick={onCollect}>{t("collect")}</MenuItem>
            )}

            {selectedId &&
                menu?.targetPiece &&
                menu.targetPiece.id !== selectedId &&
                (manipulating || menu.targetPiece.color !== selectedPiece?.color) && (
                    <MenuItem onClick={onAttack}>{t("attack")}</MenuItem>
                )}
        </Menu>
    )
}
