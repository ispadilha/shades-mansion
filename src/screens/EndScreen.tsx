import React from "react"
import { Box, Button, Typography } from "@mui/material"

export const EndScreen:React.FC<{ winner: "light" | "dark"; onRestart: () => void }> = ({ winner, onRestart }) => {
    return (
        <Box sx={{
            width: "100vw", height: "100vh", bgcolor: "#000",
            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column"
        }}>
            <Typography sx={{ fontSize: 36, mb: 2 }}>{winner === "light" ? "Light" : "Dark"} side won!</Typography>
            <Button onClick={onRestart} sx={{ bgcolor: "#222", color: "#fff" }}>Play again</Button>
        </Box>
    )
}
