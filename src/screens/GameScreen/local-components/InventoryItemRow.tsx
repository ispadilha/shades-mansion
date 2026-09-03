import React from "react"
import { Box, Button, Typography } from "@mui/material"
import { ItemBadge } from "../../../components/pieces"
import type { SpecialItemKey, TextKey } from "../../../logic/types"
import type { ItemUse } from "../../../logic/items"
import { useLanguage } from "../../../hooks/useLanguage"

interface InventoryItemRowProps {
    itemKey: SpecialItemKey
    // Quantas unidades do item o time tem
    count: number
    // O que o item faz agora, ou null quando não serve para nada
    use: ItemUse | null
    onUse: () => void
    // O menu de contexto da linha só oferece examinar o item
    onExamine: (event: React.MouseEvent) => void
}

const USE_LABEL: Record<ItemUse, TextKey> = { heal: "heal", promote: "promote", manipulate: "use" }

export const InventoryItemRow: React.FC<InventoryItemRowProps> = ({ itemKey, count, use, onUse, onExamine }) => {
    const { t } = useLanguage()

    return (
        <Box
            onContextMenu={(event) => {
                event.preventDefault()
                onExamine(event)
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
            <ItemBadge itemKey={itemKey} />
            <Typography sx={{ flex: 1, fontSize: 14 }}>
                {itemKey}
                {count > 1 ? ` × ${count}` : ""}
            </Typography>
            {use && (
                <Button size="small" variant="contained" onClick={onUse}>
                    {t(USE_LABEL[use])}
                </Button>
            )}
        </Box>
    )
}
