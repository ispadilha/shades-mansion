import React from "react"
import { Box } from "@mui/material"
import type { PieceType } from "../logic/types"

interface PieceProps { piece: PieceType }

export const Piece: React.FC<PieceProps> = ({ piece }) => {
    const color = piece.color === "light" ? "#fff" : "#000"
    const overlay = piece.movedThisTurn ? (piece.color === "light" ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)") : "transparent"

    return (
        <Box
            sx={{
                width: "70%",
                height: "70%",
                borderRadius: "8px",
                bgcolor: color,
                boxShadow: "0 2px 4px rgba(0,0,0,0.5)",
                position: "relative",
                overflow: "hidden",
            }}
        >
            <Box sx={{ position: "absolute", inset: 0, bgcolor: overlay }} />
        </Box>
    )
}
