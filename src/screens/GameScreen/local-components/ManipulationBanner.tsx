import React from "react"
import { Box, Button, Typography } from "@mui/material"
import type { MotivationItemKey } from "../../../logic/types"
import { useLanguage } from "../../../hooks/useLanguage"
import { HUD_PALETTE } from "../../../constants/palette"

interface ManipulationBannerProps {
    // Peça que está sob manipulação
    itemKey: MotivationItemKey
    onCancel: () => void
}

// Aviso de manipulação em curso: aparece acima das faixas normais só enquanto dura
export const ManipulationBanner: React.FC<ManipulationBannerProps> = ({ itemKey, onCancel }) => {
    const { t } = useLanguage()

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                px: 3,
                py: 0.75,
                bgcolor: HUD_PALETTE.manipulationBg,
                borderBottom: `1px solid ${HUD_PALETTE.outline}`,
            }}
        >
            <Typography sx={{ color: HUD_PALETTE.manipulationText, fontSize: 13 }}>
                {t("manipulatingPiece")}: {itemKey}
            </Typography>
            <Button
                size="small"
                variant="outlined"
                onClick={onCancel}
                sx={{ color: HUD_PALETTE.text, borderColor: HUD_PALETTE.manipulationOutline, py: 0.25 }}
            >
                {t("cancelManipulation")}
            </Button>
        </Box>
    )
}
