import React from "react"
import { Box } from "@mui/material"
import type { PieceColor, PieceType } from "../../logic/types"
import { AURA_PALETTE, PIECE_DETAIL_PALETTE, PIECE_PALETTE, rgba, type AuraKind } from "../../constants/palette"

interface PieceTokenProps {
    color: PieceColor
    type: PieceType
    size?: number
    // Destaque da peça: o mesmo brilho que ela recebe no tabuleiro (null = sem destaque)
    aura?: AuraKind | null
    // Peça que já agiu na rodada: fica apagada
    dimmed?: boolean
}

export const PieceToken: React.FC<PieceTokenProps> = ({ color, type, size = 56, aura = null, dimmed = false }) => {
    const palette = PIECE_PALETTE[color]
    const highlight = aura ? AURA_PALETTE[aura] : null

    return (
        <Box
            sx={{
                width: size,
                height: size,
                borderRadius: "50%",
                boxSizing: "border-box",
                border: highlight ? `2px solid ${highlight.color}` : "2px solid transparent",
                boxShadow: highlight
                    ? `inset 0 0 ${size * 0.3}px ${size * 0.06}px ${rgba(highlight.color, highlight.strength)}`
                    : "none",
                opacity: dimmed ? 0.35 : 1,
                transition: "opacity 200ms, box-shadow 200ms, border-color 200ms",
                flexShrink: 0,
            }}
        >
            <svg viewBox="0 0 64 64" width="100%" height="100%">
                <ellipse cx="32" cy="51.2" rx="13.4" ry="3.2" fill={PIECE_DETAIL_PALETTE.shadow} opacity="0.45" />

                {/* Pernas */}
                <rect x="26.2" y="40.3" width="5.8" height="9" fill={palette.clothing} stroke={palette.outline} strokeWidth="1" />
                <rect x="32" y="40.3" width="5.8" height="9" fill={palette.clothing} stroke={palette.outline} strokeWidth="1" />

                {/* Braços */}
                <rect x="16.6" y="26.9" width="5.1" height="14.1" fill={palette.clothing} stroke={palette.outline} strokeWidth="1" />
                <rect x="42.2" y="26.9" width="5.1" height="14.1" fill={palette.clothing} stroke={palette.outline} strokeWidth="1" />

                {/* Tronco */}
                <rect x="22.4" y="22.4" width="19.2" height="19.2" fill={palette.clothing} stroke={palette.outline} strokeWidth="1.5" />

                {/* Cabeça e olhos */}
                <circle cx="32" cy="17.9" r="8.3" fill={palette.skin} stroke={palette.outline} strokeWidth="1.5" />
                <circle cx="29.4" cy="17.3" r="0.9" fill={PIECE_DETAIL_PALETTE.eyes} />
                <circle cx="34.6" cy="17.3" r="0.9" fill={PIECE_DETAIL_PALETTE.eyes} />

                <text
                    x="32"
                    y="33"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily="Arial Black"
                    fontSize="11.5"
                    fill={palette.letter}
                    stroke={palette.letterStroke}
                    strokeWidth="0.6"
                >
                    {type}
                </text>
            </svg>
        </Box>
    )
}
