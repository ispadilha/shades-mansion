import React from "react"
import { Box, Button, Typography } from "@mui/material"
import { ItemBadge } from "../../../components/pieces"
import type { MotivationItemKey, TextKey } from "../../../logic/types"
import type { ItemUse } from "../../../logic/items"
import { useLanguage } from "../../../hooks/useLanguage"

interface InventoryItemRowProps {
    itemKey: MotivationItemKey
    // Quantas unidades do item o time tem
    count: number
    // O que o item faz agora, ou null quando não serve para nada
    use: ItemUse | null
    // Fora da vez de quem comanda, o botão continua dizendo o que o item faria, mas não
    // deixa fazer: é assim que o inventário serve de consulta sem virar jogada.
    disabled: boolean
    onUse: () => void
    // O menu de contexto da linha só oferece examinar o item
    onExamine: (event: React.MouseEvent) => void
}

const USE_LABEL: Record<ItemUse, TextKey> = { reinvigorate: "reinvigorate", promote: "promote", manipulate: "use" }

export const InventoryItemRow: React.FC<InventoryItemRowProps> = ({ itemKey, count, use, disabled, onUse, onExamine }) => {
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
                <Button size="small" variant="contained" disabled={disabled} onClick={onUse}>
                    {t(USE_LABEL[use])}
                </Button>
            )}
        </Box>
    )
}
