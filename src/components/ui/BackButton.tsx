import React from "react"
import { Button, type SxProps, type Theme } from "@mui/material"
import { withSx } from "./withSx"
import { useLanguage } from "../../hooks/useLanguage"
import { usePalette } from "../../hooks/usePalette"

interface BackButtonProps {
    onClick: () => void
    sx?: SxProps<Theme>
}

// O "voltar" que fecha toda tela interna. O texto vem do idioma, então quem usa só diz
// para onde a tela volta.
export const BackButton: React.FC<BackButtonProps> = ({ onClick, sx }) => {
    const palette = usePalette()
    const { t } = useLanguage()

    return (
        <Button onClick={onClick} sx={withSx({ mt: 3, color: palette.ui.text }, sx)}>
            {t("goBack")}
        </Button>
    )
}
