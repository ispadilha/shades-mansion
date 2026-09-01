import React from "react"
import { Box, Button, Typography } from "@mui/material"
import { ItemBadge } from "../../../components/pieces"
import type { SpecialItemKey } from "../../../logic/types"
import { useLanguage } from "../../../hooks/useLanguage"

interface InventoryItemRowProps {
    itemKey: SpecialItemKey
    // Quantas unidades do item o time tem
    count: number
    // Se o item rende alguma ação agora
    usable: boolean
    onUse: () => void
    // O menu de contexto da linha só oferece examinar o item
    onExamine: (event: React.MouseEvent) => void
}

export const InventoryItemRow: React.FC<InventoryItemRowProps> = ({ itemKey, count, usable, onUse, onExamine }) => {
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
            {usable && (
                <Button size="small" variant="contained" onClick={onUse}>
                    {t("use")}
                </Button>
            )}
        </Box>
    )
}
