import React from "react"
import { Box, Button, Typography } from "@mui/material"

export const HomeScreen: React.FC<{ onStart: () => void }> = ({ onStart }) => {
    return (
        <Box
            sx={{
                width: "100vw", height: "100vh", bgcolor: "#000",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            }}
        >
            <Typography sx={{ color: "#fff", fontSize: 44, mb: 4 }}>Tri Shades Mansion</Typography>
            <Button
                variant="contained"
                onClick={onStart}
                sx={{ bgcolor: "#222", color: "#fff", px: 4, py: 1.5 }}
            >
                Start game
            </Button>
        </Box>
    )
}
