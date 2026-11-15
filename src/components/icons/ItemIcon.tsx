import React from "react"
import { Box } from "@mui/material"
import type { MotivationItemKey } from "../../logic/types"
import { ITEM_ART_SIZE, ITEM_ARTS } from "../../assets"

interface ItemIconProps {
    itemKey: MotivationItemKey
    // Quantas vezes a arte cresce sobre o tamanho em que foi desenhada
    scale: number
}

export const ItemIcon: React.FC<ItemIconProps> = ({ itemKey, scale }) => {
    const size = ITEM_ART_SIZE * scale

    return (
        <Box
            component="img"
            src={ITEM_ARTS[itemKey]}
            alt=""
            sx={{ width: size, height: size, flexShrink: 0, imageRendering: "pixelated" }}
        />
    )
}
