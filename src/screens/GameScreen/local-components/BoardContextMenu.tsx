import React from "react"
import { Menu, MenuItem } from "@mui/material"
import type { PieceDefinition, PiecePosition, SpecialItem } from "../../../logic/types"
import { useLanguage } from "../../../hooks/useLanguage"

// As ações que uma casa oferece. Quais valem é decidido na hora de abrir o menu.
export type BoardAction = "info" | "itemInfo" | "move" | "collect" | "attack"

// A casa em que o jogador clicou com o botão direito, e o que havia nela
export interface BoardMenuState {
    mouseX: number
    mouseY: number
    position: PiecePosition
    targetPiece?: PieceDefinition
    itemAtPos?: SpecialItem
    actions: BoardAction[]
}

interface BoardContextMenuProps {
    menu: BoardMenuState | null
    onClose: () => void
    onShowPieceInfo: () => void
    onShowItemInfo: () => void
    onMove: () => void
    onCollect: () => void
    onAttack: () => void
}

export const BoardContextMenu: React.FC<BoardContextMenuProps> = ({
    menu,
    onClose,
    onShowPieceInfo,
    onShowItemInfo,
    onMove,
    onCollect,
    onAttack,
}) => {
    const { t } = useLanguage()

    const has = (action: BoardAction) => menu?.actions.includes(action) === true

    return (
        <Menu
            open={menu !== null}
            onClose={onClose}
            anchorReference="anchorPosition"
            anchorPosition={menu ? { top: menu.mouseY, left: menu.mouseX } : undefined}
        >
            {has("info") && <MenuItem onClick={onShowPieceInfo}>{t("info")}</MenuItem>}
            {has("itemInfo") && <MenuItem onClick={onShowItemInfo}>{t("info")}</MenuItem>}
            {has("move") && <MenuItem onClick={onMove}>{t("move")}</MenuItem>}
            {has("collect") && <MenuItem onClick={onCollect}>{t("collect")}</MenuItem>}
            {has("attack") && <MenuItem onClick={onAttack}>{t("attack")}</MenuItem>}
        </Menu>
    )
}
