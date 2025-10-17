import React from "react"
import { Box, Button, Typography } from "@mui/material"
import { useLanguage } from "../hooks/useLanguage"

export const HomeScreen: React.FC<{ onStart: () => void }> = ({ onStart }) => {
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
            }}
        >
            <Typography sx={{ color: "#fff", fontSize: 44, mb: 4 }}>Shades Mansion</Typography>
            <Button variant="contained" onClick={onStart} sx={{ bgcolor: "#222", color: "#fff", px: 4, py: 1.5 }}>
                {t("startGame")}
            </Button>
        </Box>
    )
}
