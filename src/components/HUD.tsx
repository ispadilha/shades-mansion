import React from "react"
import { Box, Button, Typography } from "@mui/material"
import type { PieceColor } from "../logic/types"

export const HUD: React.FC<{
    turn: PieceColor
    playerColor: PieceColor
    onEndTurn: () => void
    onQuit: () => void
}> = ({ turn, playerColor, onEndTurn, onQuit }) => {
    const isPlayerTurn = turn === playerColor;
    
    return (
        <Box sx={{
            width: "100%", 
            height: 80, 
            bgcolor: "#222", 
            display: "flex",
            alignItems: "center", 
            justifyContent: "space-between", 
            gap: 2, 
            px: 3,
            flexShrink: 0
        }}>
            <Box>
                <Typography sx={{ color: "#fff" }}>
                    Turn: {turn === "light" ? "Light" : "Dark"}
                </Typography>
                <Typography sx={{ color: isPlayerTurn ? "#4CAF50" : "#F44336", fontSize: 14 }}>
                    {isPlayerTurn ? "Your turn!" : "Wait..."}
                </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
                <Button 
                    onClick={onEndTurn} 
                    variant="contained" 
                    disabled={!isPlayerTurn}
                    sx={{ 
                        bgcolor: isPlayerTurn ? "#444" : "#666", 
                        color: "#fff",
                        '&:disabled': { color: '#999' }
                    }}
                >
                    End Turn
                </Button>
                <Button onClick={onQuit} variant="outlined" sx={{ color: "#fff", borderColor: "#555" }}>
                    Quit
                </Button>
            </Box>
        </Box>
    )
}