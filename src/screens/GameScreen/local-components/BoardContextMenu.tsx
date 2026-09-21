import React from "react"
import { Menu, MenuItem } from "@mui/material"
import type { BoardAction, BoardMenuState } from "../../../logic/boardMenu"
import { useLanguage } from "../../../hooks/useLanguage"

interface BoardContextMenuProps {
    menu: BoardMenuState | null
    onClose: () => void
    onShowPieceInfo: () => void
    onShowItemInfo: () => void
    // Andar até a casa, coletando o item que estiver nela
    onWalk: () => void
    onAttack: () => void
    onSkill: () => void
}

export const BoardContextMenu: React.FC<BoardContextMenuProps> = ({
    menu,
    onClose,
    onShowPieceInfo,
    onShowItemInfo,
    onWalk,
    onAttack,
    onSkill,
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
            {has("move") && <MenuItem onClick={onWalk}>{t("move")}</MenuItem>}
            {has("collect") && <MenuItem onClick={onWalk}>{t("collect")}</MenuItem>}
            {has("attack") && <MenuItem onClick={onAttack}>{t("attack")}</MenuItem>}
            {has("skill") && menu?.skillAction && <MenuItem onClick={onSkill}>{t(menu.skillAction)}</MenuItem>}
        </Menu>
    )
}
