import React, { useState } from "react"
import { Box, Button, Menu, MenuItem, Modal, Stack, Typography } from "@mui/material"
import type { PieceColor, PieceDefinition, SpecialItemKey, TeamInventory } from "../logic/types"
import { itemKeyColor } from "../logic/types"
import { useLanguage } from "../hooks/useLanguage"
import { ItemBadge, ItemInfoModal } from "./ItemInfoModal"

interface InventoryModalProps {
    open: boolean
    onClose: () => void
    inventory: TeamInventory
    pieces: PieceDefinition[]
    playerColor: PieceColor
    onUseHealItem: (key: SpecialItemKey) => void
    onUseManipulationItem: (key: SpecialItemKey) => void
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
    open,
    onClose,
    inventory,
    pieces,
    playerColor,
    onUseHealItem,
    onUseManipulationItem,
}) => {
    const { t } = useLanguage()
    const [itemMenu, setItemMenu] = useState<{ mouseX: number; mouseY: number; key: SpecialItemKey } | null>(null)
    const [examineKey, setExamineKey] = useState<SpecialItemKey | null>(null)

    // Agrupa por key para mostrar contagem (×N) ao invés de uma linha por unidade
    const aggregated = inventory.reduce<Array<{ key: SpecialItemKey; count: number }>>((acc, key) => {
        const entry = acc.find((e) => e.key === key)
        if (entry) entry.count++
        else acc.push({ key, count: 1 })
        return acc
    }, [])

    const isOwn = (key: SpecialItemKey) => itemKeyColor(key) === playerColor

    // Item próprio é usado para curar a peça correspondente (se ferida);
    // item de outra cor é usado para manipular a peça correspondente (se viva)
    const canHeal = (key: SpecialItemKey) => {
        if (!isOwn(key)) return false
        const target = pieces.find((p) => p.id === key)
        return !!target && target.hp < target.maxHp
    }

    const canManipulate = (key: SpecialItemKey) => {
        if (isOwn(key)) return false
        return pieces.some((p) => p.id === key)
    }

    const handleUse = (key: SpecialItemKey) => {
        if (canHeal(key)) onUseHealItem(key)
        else if (canManipulate(key)) onUseManipulationItem(key)
    }

    const closeItemMenu = () => setItemMenu(null)

    const handleExamine = () => {
        if (!itemMenu) return
        setExamineKey(itemMenu.key)
        closeItemMenu()
    }

    return (
        <>
            <Modal open={open} onClose={onClose}>
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 340,
                        bgcolor: "background.paper",
                        p: 3,
                        outline: "none",
                        borderRadius: 1,
                    }}
                >
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        {t("inventory")}
                    </Typography>

                    {aggregated.length === 0 && <Typography sx={{ color: "#666" }}>{t("noItems")}</Typography>}

                    <Stack gap={1}>
                        {aggregated.map(({ key, count }) => {
                            const usable = canHeal(key) || canManipulate(key)
                            return (
                                <Box
                                    key={key}
                                    onContextMenu={(e) => {
                                        e.preventDefault()
                                        setItemMenu({ mouseX: e.clientX, mouseY: e.clientY, key })
                                    }}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1.5,
                                        p: 1,
                                        borderRadius: 1,
                                        "&:hover": { bgcolor: "action.hover" },
                                        cursor: "context-menu",
                                    }}
                                >
                                    <ItemBadge k={key} />
                                    <Typography sx={{ flex: 1, fontSize: 14 }}>
                                        {key}
                                        {count > 1 ? ` × ${count}` : ""}
                                    </Typography>
                                    {usable && (
                                        <Button size="small" variant="contained" onClick={() => handleUse(key)}>
                                            {t("use")}
                                        </Button>
                                    )}
                                </Box>
                            )
                        })}
                    </Stack>

                    <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                        <Button onClick={onClose}>{t("close")}</Button>
                    </Box>
                </Box>
            </Modal>

            <Menu
                open={itemMenu !== null}
                onClose={closeItemMenu}
                anchorReference="anchorPosition"
                anchorPosition={itemMenu ? { top: itemMenu.mouseY, left: itemMenu.mouseX } : undefined}
            >
                <MenuItem onClick={handleExamine}>{t("examine")}</MenuItem>
            </Menu>

            <ItemInfoModal
                open={examineKey !== null}
                onClose={() => setExamineKey(null)}
                itemKey={examineKey}
                playerColor={playerColor}
            />
        </>
    )
}
