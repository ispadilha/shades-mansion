import React from "react"
import { Box } from "@mui/material"
import type { SpecialItemKey } from "../../logic/types"
import { itemKeyColor } from "../../logic/types"
import { ITEM_PALETTE } from "../../constants/palette"

interface ItemBadgeProps {
    itemKey: SpecialItemKey
    size?: number
}

export const ItemBadge: React.FC<ItemBadgeProps> = ({ itemKey, size = 28 }) => {
    const colors = ITEM_PALETTE[itemKeyColor(itemKey)]

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
            {itemKey[1]}
        </Box>
    )
}
