import React from "react"
import { useNavigate } from "react-router-dom"
import { Box, Button, Typography } from "@mui/material"
import { useLanguage } from "../hooks/useLanguage"

interface HomeScreenProps {}

export const HomeScreen: React.FC<HomeScreenProps> = ({}) => {
    const navigate = useNavigate()
    const { t } = useLanguage()

    return (
        <Box
            sx={{
                width: "100vw",
                height: "100vh",
                bgcolor: "#000",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
            }}
        >
            <Typography sx={{ color: "#fff", fontSize: 44 }}>Shades Mansion</Typography>
            <Button variant="contained" onClick={() => navigate("/choose-side")} sx={{ bgcolor: "#222", color: "#fff", px: 4, py: 1.5 }}>
                {t("startGame")}
            </Button>
            <Button variant="contained" onClick={() => navigate("/options")} sx={{ bgcolor: "#222", color: "#fff", px: 4, py: 1.5 }}>
                {t("options")}
            </Button>
        </Box>
    )
}
