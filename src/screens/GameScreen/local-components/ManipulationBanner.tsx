import React from "react"
import { Box, Button, Typography } from "@mui/material"
import type { MotivationItemKey } from "../../../logic/types"
import { useLanguage } from "../../../hooks/useLanguage"
import { MANIPULATION_PALETTE } from "../../../constants/palette"

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
                bgcolor: MANIPULATION_PALETTE.bandBg,
                borderBottom: `1px solid ${MANIPULATION_PALETTE.bandOutline}`,
            }}
        >
            <Typography sx={{ color: MANIPULATION_PALETTE.bandText, fontSize: 13 }}>
                {t("manipulatingPiece")}: {itemKey}
            </Typography>
            <Button
                size="small"
                variant="outlined"
                onClick={onCancel}
                sx={{ color: MANIPULATION_PALETTE.bandText, borderColor: MANIPULATION_PALETTE.bandOutline, py: 0.25 }}
            >
                {t("cancelManipulation")}
            </Button>
        </Box>
    )
}
