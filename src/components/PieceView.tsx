import React from "react"
import { Box } from "@mui/material"
import type { Piece } from "../logic/types"

export const PieceView: React.FC<{ piece: Piece }> = ({ piece }) => {
    const color = piece.color === "light" ? "#fff" : "#000"
    const overlay = piece.movedThisTurn ? (piece.color === "light" ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)") : "transparent"

    return (
        <Box sx={{
        width: "70%", height: "70%", borderRadius: "8px",
        bgcolor: color, boxShadow: "0 2px 4px rgba(0,0,0,0.5)", position: "relative", overflow: "hidden"
        }}>
            <Box sx={{ position: "absolute", inset: 0, bgcolor: overlay }} />
        </Box>
    )
}
