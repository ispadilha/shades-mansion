import React, { useState } from "react"
import { Box, Button, Menu, MenuItem, Modal, Stack, Typography } from "@mui/material"
import type { MainColor, PieceDefinition, SpecialItemKey, TeamInventory } from "../logic/types"
import { useLanguage } from "../hooks/useLanguage"
import { ItemBadge, ItemInfoModal } from "./ItemInfoModal"

interface InventoryModalProps {
    open: boolean
    onClose: () => void
    inventory: TeamInventory
    pieces: PieceDefinition[]
    playerColor: MainColor
    onUseHealItem: (key: SpecialItemKey) => void
}

export const InventoryModal: React.FC<InventoryModalProps> = ({ open, onClose, inventory, pieces, playerColor, onUseHealItem }) => {
    const { t } = useLanguage()
    const [itemMenu, setItemMenu] = useState<{ mouseX: number; mouseY: number; key: SpecialItemKey } | null>(null)
    const [examineKey, setExamineKey] = useState<SpecialItemKey | null>(null)

    const aggregated: Array<{ key: SpecialItemKey; count: number }> = []
    for (const key of inventory) {
        const entry = aggregated.find((e) => e.key === key)
        if (entry) entry.count++
        else aggregated.push({ key, count: 1 })
    }

    const canUseHeal = (key: SpecialItemKey) => {
        const target = pieces.find((p) => p.id === key)
        return !!target && target.color === playerColor && target.hp < target.maxHp
    }

    const handleItemContextMenu = (e: React.MouseEvent, key: SpecialItemKey) => {
        e.preventDefault()
        setItemMenu({ mouseX: e.clientX, mouseY: e.clientY, key })
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
                        {aggregated.map(({ key, count }) => (
                            <Box
                                key={key}
                                onContextMenu={(e) => handleItemContextMenu(e, key)}
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
                                {canUseHeal(key) && (
                                    <Button size="small" variant="contained" onClick={() => onUseHealItem(key)}>
                                        {t("use")}
                                    </Button>
                                )}
                            </Box>
                        ))}
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

            <ItemInfoModal open={examineKey !== null} onClose={() => setExamineKey(null)} itemKey={examineKey} />
        </>
    )
}
