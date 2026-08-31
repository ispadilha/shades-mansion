import React from "react"
import { useNavigate } from "react-router-dom"
import { Box, Button, Typography } from "@mui/material"
import { useLanguage } from "../hooks/useLanguage"
import { UI_PALETTE } from "../constants/palette"

interface HomeScreenProps {}

export const HomeScreen: React.FC<HomeScreenProps> = ({}) => {
    const navigate = useNavigate()
    const { t } = useLanguage()

    return (
        <Box
            sx={{
                width: "100vw",
                height: "100vh",
                bgcolor: UI_PALETTE.screenBg,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
            }}
        >
            <Typography sx={{ color: UI_PALETTE.text, fontSize: 44 }}>Shades Mansion</Typography>
            <Button variant="contained" onClick={() => navigate("/choose-side")} sx={{ bgcolor: UI_PALETTE.buttonBg, color: UI_PALETTE.text, px: 4, py: 1.5 }}>
                {t("startGame")}
            </Button>
            <Button variant="contained" onClick={() => navigate("/library")} sx={{ bgcolor: UI_PALETTE.buttonBg, color: UI_PALETTE.text, px: 4, py: 1.5 }}>
                {t("library")}
            </Button>
            <Button variant="contained" onClick={() => navigate("/options")} sx={{ bgcolor: UI_PALETTE.buttonBg, color: UI_PALETTE.text, px: 4, py: 1.5 }}>
                {t("options")}
            </Button>
        </Box>
    )
}
