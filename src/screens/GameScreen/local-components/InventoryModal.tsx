import React, { useState } from "react"
import { Box, Button, Menu, MenuItem, Stack, Typography } from "@mui/material"
import { InventoryItemRow } from "./InventoryItemRow"
import { ItemInfoModal } from "./ItemInfoModal"
import { ModalCard } from "../../../components/ui"
import type { PieceColor, PieceDefinition, SpecialItemKey, TeamInventory } from "../../../logic/types"
import { itemKeyColor } from "../../../logic/types"
import { useLanguage } from "../../../hooks/useLanguage"
import { SURFACE_PALETTE } from "../../../constants/palette"

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

    // Item próprio é usado para curar a peça correspondente (se ferida)
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
            <ModalCard open={open} onClose={onClose} width={340}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    {t("inventory")}
                </Typography>

                {aggregated.length === 0 && <Typography sx={{ color: SURFACE_PALETTE.textMuted }}>{t("noItems")}</Typography>}

                <Stack gap={1} sx={{ maxHeight: "55vh", overflowY: "auto" }}>
                    {aggregated.map(({ key, count }) => (
                        <InventoryItemRow
                            key={key}
                            itemKey={key}
                            count={count}
                            usable={canHeal(key) || canManipulate(key)}
                            onUse={() => handleUse(key)}
                            onExamine={(event) => setItemMenu({ mouseX: event.clientX, mouseY: event.clientY, key })}
                        />
                    ))}
                </Stack>

                <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                    <Button onClick={onClose}>{t("close")}</Button>
                </Box>
            </ModalCard>

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
