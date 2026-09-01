import React from "react"
import { Button, type SxProps, type Theme } from "@mui/material"
import { useLanguage } from "../../hooks/useLanguage"
import { UI_PALETTE } from "../../constants/palette"

interface BackButtonProps {
    onClick: () => void
    sx?: SxProps<Theme>
}

// O "voltar" que fecha toda tela interna. O texto vem do idioma, então quem usa só diz
// para onde a tela volta.
export const BackButton: React.FC<BackButtonProps> = ({ onClick, sx }) => {
    const { t } = useLanguage()

    return (
        <Button onClick={onClick} sx={[{ mt: 3, color: UI_PALETTE.text }, ...(Array.isArray(sx) ? sx : [sx])]}>
            {t("goBack")}
        </Button>
    )
}
