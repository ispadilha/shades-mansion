import React, { useId } from "react"
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

interface DieShape {
    // A silhueta do sólido, vista de cima
    outer: string
    // A face que se lê. O d4 não tem: um tetraedro deitado deixa um vértice para cima
    inner: string | null
    // Altura do número dentro da face: cada sólido tem o próprio centro
    textY: number
}

const SHAPES: Record<DieSides, DieShape> = {
    // Tetraedro: triângulo com um vértice apontando para cima
    4: { outer: "32,5 59,52 5,52", inner: null, textY: 41 },
    // Cubo: quadrado, e a face de cima é outro quadrado
    6: { outer: "9,9 55,9 55,55 9,55", inner: "18,18 46,18 46,46 18,46", textY: 32 },
    // Octaedro em pé: losango, e a face virada para quem lê é um triângulo
    8: { outer: "32,3 58,32 32,61 6,32", inner: "32,10 51,36 13,36", textY: 28 },
    // Trapezoedro: o perfil e a face de cima são pipas
    10: { outer: "32,2 57,26 32,62 7,26", inner: "32,14 46,27 32,50 18,27", textY: 30 },
    // Dodecaedro: a face de cima é um pentágono
    12: {
        outer: "32,4 58.6,23.4 48.5,54.7 15.5,54.7 5.4,23.4",
        inner: "32,12 51,25.8 43.8,48 20.2,48 13,25.8",
        textY: 36,
    },
    // Icosaedro: silhueta de hexágono e face de cima triangular
    20: {
        outer: "32,3 57,17.5 57,46.5 32,61 7,46.5 7,17.5",
        inner: "32,15 49,45 15,45",
        textY: 37,
    },
}

// O "vértice pra cima" do d4: um ponto com brilho que se dissolve a partir dele
const APEX = { x: 32, y: 19, dot: 2.8, glow: 23 }

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
    // Um id por dado em cena
    const uid = useId().replace(/:/g, "")

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
                {!shape.inner && (
                    <defs>
                        <clipPath id={`die-face-${uid}`}>
                            <polygon points={shape.outer} />
                        </clipPath>
                        <radialGradient id={`die-glow-${uid}`}>
                            <stop offset="0%" stopColor={DIE_PALETTE.innerEdge} stopOpacity="0.8" />
                            <stop offset="30%" stopColor={DIE_PALETTE.innerEdge} stopOpacity="0.45" />
                            <stop offset="65%" stopColor={DIE_PALETTE.inner} stopOpacity="0.22" />
                            <stop offset="100%" stopColor={DIE_PALETTE.inner} stopOpacity="0" />
                        </radialGradient>
                    </defs>
                )}

                <polygon
                    points={shape.outer}
                    fill={DIE_PALETTE.face}
                    stroke={DIE_PALETTE.faceEdge}
                    strokeWidth="2"
                    strokeLinejoin="round"
                />

                {shape.inner ? (
                    <polygon
                        points={shape.inner}
                        fill={DIE_PALETTE.inner}
                        stroke={DIE_PALETTE.innerEdge}
                        strokeWidth="1"
                        strokeLinejoin="round"
                    />
                ) : (
                    <g clipPath={`url(#die-face-${uid})`}>
                        <circle cx={APEX.x} cy={APEX.y} r={APEX.glow} fill={`url(#die-glow-${uid})`} />
                        <circle cx={APEX.x} cy={APEX.y} r={APEX.dot} fill={DIE_PALETTE.innerEdge} />
                    </g>
                )}

                <text
                    x="32"
                    y={shape.textY}
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
