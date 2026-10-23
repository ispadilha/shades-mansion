import React from "react"
import { Box, Button, Typography } from "@mui/material"
import { ModalCard } from "../../../components/ui"
import { ItemIcon } from "../../../components/characters"
import type { CharacterColor, MotivationItemKey } from "../../../logic/types"
import { itemKeyColor } from "../../../logic/types"
import { useLanguage } from "../../../hooks/useLanguage"
import { usePalette } from "../../../hooks/usePalette"
import { ITEM_ICON_SCALE } from "../../../constants/rules"

interface ItemInfoModalProps {
    open: boolean
    onClose: () => void
    itemKey: MotivationItemKey | null
    // Time de quem está olhando (null quando o jogador só assiste)
    playerColor?: CharacterColor | null
}

export const ItemInfoModal: React.FC<ItemInfoModalProps> = ({ open, onClose, itemKey, playerColor }) => {
    const palette = usePalette()
    const { t, tCharacterName, tItemName } = useLanguage()

    return (
        <ModalCard open={open} onClose={onClose} width={300} sx={{ textAlign: "center" }}>
            {itemKey && (
                <>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        {tItemName(itemKey)}
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                        <ItemIcon itemKey={itemKey} scale={ITEM_ICON_SCALE.info} />
                    </Box>
                    <Typography sx={{ fontSize: 14, mb: 1 }}>{`${t("itemMotivates")}: ${tCharacterName(itemKey)}`}</Typography>
                    {/* O verbete depende de quem olha: o item do próprio time revigora ou promove a
                        personagem que ele motiva, o de outro time serve para manipulá-la */}
                    <Typography sx={{ fontSize: 14, color: palette.surface.textMuted }}>
                        {t(itemKeyColor(itemKey) === playerColor ? "itemDescOwn" : "itemDescOther")}
                    </Typography>
                    <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                        <Button onClick={onClose}>{t("close")}</Button>
                    </Box>
                </>
            )}
        </ModalCard>
    )
}
