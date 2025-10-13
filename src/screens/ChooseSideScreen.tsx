import React from "react"
import { Box, Button, Typography } from "@mui/material"
import type { PieceColor } from "../logic/types"

export const ChooseSideScreen: React.FC<{
    onChoose: (c: PieceColor) => void
    onBack: () => void
}> = ({ onChoose, onBack }) => {
    return (
        <Box sx={{
            width: "100vw", height: "100vh", bgcolor: "#000",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 4, flexDirection: "column"
        }}>
        <Typography sx={{ color: "#fff", fontSize: 28 }}>Choose your side</Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
            <Button onClick={() => onChoose("light")} sx={{ bgcolor: "#ddd", color: "#000" }}>Light</Button>
            <Button onClick={() => onChoose("dark")} sx={{ bgcolor: "#111", color: "#fff" }}>Dark</Button>
        </Box>
        <Button onClick={onBack} sx={{ mt: 3, color: "#fff" }}>Go back</Button>
        </Box>
    )
}
