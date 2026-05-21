import React from "react"
import { Box, Button, Modal, Typography } from "@mui/material"
import type { SpecialItemKey } from "../logic/types"
import { useLanguage } from "../hooks/useLanguage"

const itemTeamLetter = (key: SpecialItemKey) => key[0] as "d" | "g" | "l"
const itemTypeLetter = (key: SpecialItemKey) => key[1] as "A" | "B" | "C"

const PALETTE: Record<"d" | "g" | "l", { bg: string; outline: string; text: string }> = {
    d: { bg: "#2a2a2a", outline: "#222", text: "#ffffff" },
    l: { bg: "#eeeeee", outline: "#222", text: "#111111" },
    g: { bg: "#888888", outline: "#222", text: "#ffffff" },
}

export const ItemBadge: React.FC<{ k: SpecialItemKey; size?: number }> = ({ k, size = 28 }) => {
    const team = itemTeamLetter(k)
    const colors = PALETTE[team]
    const fontSize = Math.max(10, Math.floor(size * 0.5))
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
                fontSize,
                flexShrink: 0,
            }}
        >
            {itemTypeLetter(k)}
        </Box>
    )
}

interface ItemInfoModalProps {
    open: boolean
    onClose: () => void
    itemKey: SpecialItemKey | null
}

export const ItemInfoModal: React.FC<ItemInfoModalProps> = ({ open, onClose, itemKey }) => {
    const { t } = useLanguage()

    const describe = (key: SpecialItemKey) => {
        const team = itemTeamLetter(key)
        const type = itemTypeLetter(key)
        if (team === "l") return `${t("itemDescHealLight")} ${type}.`
        if (team === "d") return `${t("itemDescHealDark")} ${type}.`
        return `${t("itemDescHealGray")} ${type}.`
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
