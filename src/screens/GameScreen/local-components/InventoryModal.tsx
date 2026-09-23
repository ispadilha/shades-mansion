import React, { useState } from "react"
import { Box, Button, Menu, MenuItem, Stack, Typography } from "@mui/material"
import { InventoryItemRow } from "./InventoryItemRow"
import { ItemInfoModal } from "./ItemInfoModal"
import { ModalCard } from "../../../components/ui"
import type { PieceColor, PieceDefinition, MotivationItemKey, TeamInventory } from "../../../logic/types"
import { itemUseFor } from "../../../logic/items"
import { useLanguage } from "../../../hooks/useLanguage"
import { usePalette } from "../../../hooks/usePalette"

interface InventoryModalProps {
    open: boolean
    onClose: () => void
    inventory: TeamInventory
    pieces: PieceDefinition[]
    playerColor: PieceColor
    // Gastar item é jogada: só na vez de quem comanda, e não no meio de uma rolagem.
    // Fora disso o modal abre igual, mas só para consulta, com os botões desabilitados.
    canUse: boolean
    onUseOwnItem: (key: MotivationItemKey) => void
    onUseManipulationItem: (key: MotivationItemKey) => void
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
    open,
    onClose,
    inventory,
    pieces,
    playerColor,
    canUse,
    onUseOwnItem,
    onUseManipulationItem,
}) => {
    const palette = usePalette()
    const { t } = useLanguage()
    const [itemMenu, setItemMenu] = useState<{ mouseX: number; mouseY: number; key: MotivationItemKey } | null>(null)
    const [examineKey, setExamineKey] = useState<MotivationItemKey | null>(null)

    // Agrupa por key para mostrar contagem (×N) ao invés de uma linha por unidade
    const aggregated = inventory.reduce<Array<{ key: MotivationItemKey; count: number }>>((acc, key) => {
        const entry = acc.find((e) => e.key === key)
        if (entry) entry.count++
        else acc.push({ key, count: 1 })
        return acc
    }, [])

    // Item do próprio time revigora a peça atingida ou promove a que está inteira.
    // Item de outro time serve para tentar manipular a peça.
    const actionFor = (key: MotivationItemKey) => itemUseFor(key, pieces.find((p) => p.id === key), playerColor)

    const handleUse = (key: MotivationItemKey) => {
        if (!canUse) return
        const use = actionFor(key)
        if (use === "manipulate") onUseManipulationItem(key)
        else if (use) onUseOwnItem(key)
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

                {aggregated.length === 0 && <Typography sx={{ color: palette.surface.textMuted }}>{t("noItems")}</Typography>}

                <Stack gap={1} sx={{ maxHeight: "55vh", overflowY: "auto" }}>
                    {aggregated.map(({ key, count }) => (
                        <InventoryItemRow
                            key={key}
                            itemKey={key}
                            count={count}
                            use={actionFor(key)}
                            disabled={!canUse}
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
