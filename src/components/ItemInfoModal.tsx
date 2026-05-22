import React from "react"
import { Box, Button, Modal, Typography } from "@mui/material"
import type { PieceColor, SpecialItemKey } from "../logic/types"
import { itemKeyColor } from "../logic/types"
import { useLanguage } from "../hooks/useLanguage"

const PALETTE: Record<PieceColor, { bg: string; outline: string; text: string }> = {
    dark: { bg: "#2a2a2a", outline: "#222", text: "#ffffff" },
    light: { bg: "#eeeeee", outline: "#222", text: "#111111" },
    gray: { bg: "#888888", outline: "#222", text: "#ffffff" },
}

const HEAL_HEAD: Record<PieceColor, "itemDescHealLight" | "itemDescHealDark" | "itemDescHealGray"> = {
    light: "itemDescHealLight",
    dark: "itemDescHealDark",
    gray: "itemDescHealGray",
}

const MANIPULATE_HEAD: Record<PieceColor, "itemDescManipulateLight" | "itemDescManipulateDark" | "itemDescManipulateGray"> = {
    light: "itemDescManipulateLight",
    dark: "itemDescManipulateDark",
    gray: "itemDescManipulateGray",
}

export const ItemBadge: React.FC<{ k: SpecialItemKey; size?: number }> = ({ k, size = 28 }) => {
    const colors = PALETTE[itemKeyColor(k)]
    return (
        <Box
            sx={{
                width: size,
                height: size,
                borderRadius: "50%",
                bgcolor: colors.bg,
                color: colors.text,
                border: `2px solid ${colors.outline}`,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Arial Black",
                fontSize: Math.max(10, Math.floor(size * 0.5)),
                flexShrink: 0,
            }}
        >
            {k[1]}
        </Box>
    )
}

interface ItemInfoModalProps {
    open: boolean
    onClose: () => void
    itemKey: SpecialItemKey | null
    playerColor?: PieceColor | null
}

export const ItemInfoModal: React.FC<ItemInfoModalProps> = ({ open, onClose, itemKey, playerColor }) => {
    const { t } = useLanguage()

    const describe = (key: SpecialItemKey) => {
        const itemColor = itemKeyColor(key)
        const isOwn = itemColor === playerColor
        const head = isOwn ? HEAL_HEAD[itemColor] : MANIPULATE_HEAD[itemColor]
        const suffix = isOwn ? t("itemDescOwnSuffix") : t("itemDescManipulateSuffix")
        return `${t(head)} ${key[1]} ${suffix}.`
    }

    return (
        <Modal open={open} onClose={onClose}>
            <Box
                sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 300,
                    bgcolor: "background.paper",
                    p: 3,
                    outline: "none",
                    borderRadius: 1,
                    textAlign: "center",
                }}
            >
                {itemKey && (
                    <>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            {itemKey}
                        </Typography>
                        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                            <ItemBadge k={itemKey} size={72} />
                        </Box>
                        <Typography sx={{ fontSize: 14, color: "#444" }}>{describe(itemKey)}</Typography>
                        <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                            <Button onClick={onClose}>{t("close")}</Button>
                        </Box>
                    </>
                )}
            </Box>
        </Modal>
    )
}
