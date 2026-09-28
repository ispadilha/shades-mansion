import React from "react"
import { Box } from "@mui/material"
import type { AuraKind, PieceColor, PieceType } from "../../logic/types"
import { AURA_PALETTE, PIECE_DETAIL_PALETTE, PIECE_PALETTE, levelStarColors, rgba } from "../../constants/palette"
import { LEVEL_STAR, TOKEN_LEVEL_STAR } from "../../constants/rules"

// O desenho vive num `viewBox` de 64, o mesmo espaço da casa do tabuleiro: as medidas em
// frações da casa valem aqui multiplicadas por 64, com o centro em 32.
const VIEW = 64
const CENTER = VIEW / 2

// Os pontos de uma estrela de N pontas, na mesma forma da que o tabuleiro desenha
const starPoints = (cx: number, cy: number, outer: number, inner: number, points: number) =>
    Array.from({ length: points * 2 }, (_, i) => {
        const radius = i % 2 === 0 ? outer : inner
        const angle = -Math.PI / 2 + (i * Math.PI) / points
        return `${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`
    }).join(" ")

interface PieceTokenProps {
    color: PieceColor
    type: PieceType
    // Do nível 2 em diante a peça ganha a estrela de promoção no canto
    level?: number
    size?: number
    aura?: AuraKind | null
    // Peça que já agiu na rodada: fica apagada
    dimmed?: boolean
}

export const PieceToken: React.FC<PieceTokenProps> = ({
    color,
    type,
    level = 1,
    size = 56,
    aura = null,
    dimmed = false,
}) => {
    const palette = PIECE_PALETTE[color]
    const highlight = aura ? AURA_PALETTE[aura] : null
    const star = level >= 2 ? levelStarColors(level) : null

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

                {/* A estrela de promoção, no canto de cima à direita */}
                {star && (
                    <polygon
                        points={starPoints(
                            CENTER + TOKEN_LEVEL_STAR.x * VIEW,
                            CENTER - TOKEN_LEVEL_STAR.y * VIEW,
                            LEVEL_STAR.outer * VIEW,
                            LEVEL_STAR.inner * VIEW,
                            LEVEL_STAR.points,
                        )}
                        fill={star.fill}
                        stroke={star.outline}
                        strokeWidth="1"
                    />
                )}
            </svg>
        </Box>
    )
}
