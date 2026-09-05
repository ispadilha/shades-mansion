import React from "react"
import { Box, Button } from "@mui/material"
import { useLanguage } from "../../../hooks/useLanguage"
import { usePalette } from "../../../hooks/usePalette"

interface LanguageOptionsProps {}

export const LanguageOptions: React.FC<LanguageOptionsProps> = ({}) => {
    const palette = usePalette()
    const { setLanguage, t } = useLanguage()

    return (
        <Box sx={{ display: "flex", gap: 2 }}>
            <Button onClick={() => setLanguage("enUS")} sx={{ bgcolor: palette.ui.languageEn.bg, color: palette.ui.languageEn.text }}>
                {t("enUS")}
            </Button>
            <Button onClick={() => setLanguage("ptBR")} sx={{ bgcolor: palette.ui.languagePt.bg, color: palette.ui.languagePt.text }}>
                {t("ptBR")}
            </Button>
        </Box>
    )
}
