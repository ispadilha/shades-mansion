import React from "react"
import { Box } from "@mui/material"
import { keyframes } from "@emotion/react"
import type { DieSides } from "../../logic/rolls"
import { DIE_PALETTE } from "../../constants/palette"

const tumble = keyframes`
    0% { transform: rotate(0deg) scale(1) }
    50% { transform: rotate(180deg) scale(0.86) }
    100% { transform: rotate(360deg) scale(1) }
`

const land = keyframes`
    0% { transform: rotate(-14deg) scale(1.2) }
    60% { transform: rotate(4deg) scale(0.95) }
    100% { transform: rotate(0deg) scale(1) }
`

const SHAPES: Record<DieSides, { outer: string; inner: string }> = {
    12: {
        outer: "32,4 58.6,23.4 48.5,54.7 15.5,54.7 5.4,23.4",
        inner: "32,12 51,25.8 43.8,48 20.2,48 13,25.8",
    },
    20: {
        outer: "32,2 58,47 6,47",
        inner: "32,11 50.2,42.5 13.8,42.5",
    },
}

interface DieProps {
    sides: DieSides
    value: number
    size?: number
    spinning?: boolean
    // Defasagem do giro: com vários dados na mesa, eles caem juntos mas não em sincronia
    // perfeita, o que fica mais natural do que dois desenhos idênticos girando.
    spinOffsetMs?: number
}

export const Die: React.FC<DieProps> = ({ sides, value, size = 120, spinning = false, spinOffsetMs = 0 }) => {
    const shape = SHAPES[sides]

    return (
        <Box
            sx={{
                width: size,
                height: size,
                animation: `${spinning ? tumble : land} ${spinning ? "420ms" : "280ms"} ${spinning ? "linear infinite" : "ease-out"}`,
                animationDelay: `${-spinOffsetMs}ms`,
            }}
        >
            <svg viewBox="0 0 64 64" width={size} height={size}>
                <polygon
                    points={shape.outer}
                    fill={DIE_PALETTE.face}
                    stroke={DIE_PALETTE.faceEdge}
                    strokeWidth="2"
                    strokeLinejoin="round"
                />
                <polygon
                    points={shape.inner}
                    fill={DIE_PALETTE.inner}
                    stroke={DIE_PALETTE.innerEdge}
                    strokeWidth="1"
                    strokeLinejoin="round"
                />
                <text
                    x="32"
                    y={sides === 20 ? 38 : 36}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontFamily="Arial Black"
                    fontSize="20"
                    fill={DIE_PALETTE.value}
                    stroke={DIE_PALETTE.valueStroke}
                    strokeWidth="0.8"
                >
                    {value}
                </text>
            </svg>
        </Box>
    )
}
