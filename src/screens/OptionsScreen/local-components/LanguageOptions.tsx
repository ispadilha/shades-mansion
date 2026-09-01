import React from "react"
import { Box, Button } from "@mui/material"
import { useLanguage } from "../../../hooks/useLanguage"
import { UI_PALETTE } from "../../../constants/palette"

interface LanguageOptionsProps {}

export const LanguageOptions: React.FC<LanguageOptionsProps> = ({}) => {
    const { setLanguage, t } = useLanguage()

    return (
        <Box sx={{ display: "flex", gap: 2 }}>
            <Button onClick={() => setLanguage("enUS")} sx={{ bgcolor: UI_PALETTE.languageEn.bg, color: UI_PALETTE.languageEn.text }}>
                {t("enUS")}
            </Button>
            <Button onClick={() => setLanguage("ptBR")} sx={{ bgcolor: UI_PALETTE.languagePt.bg, color: UI_PALETTE.languagePt.text }}>
                {t("ptBR")}
            </Button>
        </Box>
    )
}
