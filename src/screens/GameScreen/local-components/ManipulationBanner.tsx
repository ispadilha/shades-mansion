import React from "react"
import { Box, Button, Typography } from "@mui/material"
import type { MotivationItemKey } from "../../../logic/types"
import { useLanguage } from "../../../hooks/useLanguage"
import { usePalette } from "../../../hooks/usePalette"

interface ManipulationBannerProps {
    // Peça que está sob manipulação
    itemKey: MotivationItemKey
    onCancel: () => void
}

// Aviso de manipulação em curso: aparece acima das faixas normais só enquanto dura
export const ManipulationBanner: React.FC<ManipulationBannerProps> = ({ itemKey, onCancel }) => {
    const palette = usePalette()
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
                bgcolor: palette.manipulation.bandBg,
                borderBottom: `1px solid ${palette.manipulation.bandOutline}`,
            }}
        >
            <Typography sx={{ color: palette.manipulation.bandText, fontSize: 13 }}>
                {t("manipulatingPiece")}: {itemKey}
            </Typography>
            <Button
                size="small"
                variant="outlined"
                onClick={onCancel}
                sx={{ color: palette.manipulation.bandText, borderColor: palette.manipulation.bandOutline, py: 0.25 }}
            >
                {t("cancelManipulation")}
            </Button>
        </Box>
    )
}
