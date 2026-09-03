import React from "react"
import { Box, Button, Typography } from "@mui/material"
import { ModalCard } from "../../../components/ui"
import { ItemBadge } from "../../../components/pieces"
import type { PieceColor, MotivationItemKey, TextKey } from "../../../logic/types"
import { itemKeyColor } from "../../../logic/types"
import { useLanguage } from "../../../hooks/useLanguage"
import { SURFACE_PALETTE } from "../../../constants/palette"

// O verbete de um item depende de quem olha:
// o do próprio time revigora ou promove a peça correspondente,
// o de outro time serve para manipulá-la.
const HEAL_HEAD: Record<PieceColor, TextKey> = {
    light: "itemDescReinvigorateLight",
    dark: "itemDescReinvigorateDark",
    gray: "itemDescReinvigorateGray",
}

const MANIPULATE_HEAD: Record<PieceColor, TextKey> = {
    light: "itemDescManipulateLight",
    dark: "itemDescManipulateDark",
    gray: "itemDescManipulateGray",
}

interface ItemInfoModalProps {
    open: boolean
    onClose: () => void
    itemKey: MotivationItemKey | null
    // Time de quem está olhando (null quando o jogador só assiste)
    playerColor?: PieceColor | null
}

export const ItemInfoModal: React.FC<ItemInfoModalProps> = ({ open, onClose, itemKey, playerColor }) => {
    const { t } = useLanguage()

    const describe = (key: MotivationItemKey) => {
        const itemColor = itemKeyColor(key)
        const isOwn = itemColor === playerColor
        const head = isOwn ? HEAL_HEAD[itemColor] : MANIPULATE_HEAD[itemColor]
        const suffix = isOwn ? t("itemDescOwnSuffix") : t("itemDescManipulateSuffix")
        return `${t(head)} ${key[1]} ${suffix}.`
    }

    return (
        <ModalCard open={open} onClose={onClose} width={300} sx={{ textAlign: "center" }}>
            {itemKey && (
                <>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        {itemKey}
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                        <ItemBadge itemKey={itemKey} size={72} />
                    </Box>
                    <Typography sx={{ fontSize: 14, color: SURFACE_PALETTE.textMuted }}>{describe(itemKey)}</Typography>
                    <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                        <Button onClick={onClose}>{t("close")}</Button>
                    </Box>
                </>
            )}
        </ModalCard>
    )
}
