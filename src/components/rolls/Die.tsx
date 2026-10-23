import React from "react"
import { Box } from "@mui/material"
import { keyframes } from "@emotion/react"
import type { DieSides } from "../../logic/rolls"
import { usePalette } from "../../hooks/usePalette"
import { PixelImage } from "../ui"
import { ROLL_ART_SIZE } from "../../assets"
import { borderOf, emptyGrid, numberGrid, paint, paintGlow, polygonMask, stamp } from "../../assets/pixels"
import { DIE_GLOW, GLOW_BANDS } from "../../constants/rules"

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

// Os sólidos são desenhados num quadrado de 64, e viram pixels na grade das artes de rolagem
const UNITS = 64

// O brilho do d4: forte no meio, sumindo para fora
const D4_GLOW_FADE = [
    [0, 0.85],
    [0.4, 0.6],
    [0.75, 0.25],
    [1, 0],
] as const

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
    4: { outer: "32,5 59,52 5,52", inner: null, textY: 37 },
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

interface DieProps {
    sides: DieSides
    value: number
    // Quantos pixels da tela cada pixel do dado ocupa
    scale: number
    spinning?: boolean
    // Defasagem do giro: com vários dados na mesa, eles caem juntos mas não em sincronia
    // perfeita, o que fica mais natural do que dois desenhos idênticos girando.
    spinOffsetMs?: number
}

export const Die: React.FC<DieProps> = ({ sides, value, scale, spinning = false, spinOffsetMs = 0 }) => {
    const palette = usePalette()
    const shape = SHAPES[sides]
    const size = ROLL_ART_SIZE * scale

    // O sólido em pixels: o corpo com a borda e, por cima, a face que se lê com a borda dela
    const grid = emptyGrid(ROLL_ART_SIZE)
    const outer = polygonMask(shape.outer, ROLL_ART_SIZE, UNITS)
    const outerEdge = borderOf(outer)
    paint(grid, outer, palette.die.face)
    paint(grid, outerEdge, palette.die.faceEdge)
    if (shape.inner) {
        const inner = polygonMask(shape.inner, ROLL_ART_SIZE, UNITS)
        paint(grid, inner, palette.die.inner)
        paint(grid, borderOf(inner), palette.die.innerEdge)
    } else {
        // O d4 não tem face para cima, e sim um vértice bem no meio do triângulo.
        // No lugar de uma face fica um brilho, por trás do número,
        // que não passa da borda do sólido.
        const body = outer.map((row, y) => row.map((on, x) => on && !outerEdge[y][x]))
        paintGlow(grid, body, DIE_GLOW, UNITS, palette.die.inner, D4_GLOW_FADE, GLOW_BANDS)
    }

    // O número, centrado na altura de leitura de cada sólido
    const number = numberGrid(value, palette.die.value, palette.die.valueStroke)
    const top = Math.round((shape.textY / UNITS) * ROLL_ART_SIZE - number.length / 2)
    stamp(grid, number, Math.round((ROLL_ART_SIZE - number[0].length) / 2), top)

    return (
        <Box
            sx={{
                width: size,
                height: size,
                animation: `${spinning ? tumble : land} ${spinning ? "420ms" : "280ms"} ${spinning ? "linear infinite" : "ease-out"}`,
                animationDelay: `${-spinOffsetMs}ms`,
            }}
        >
            <PixelImage grid={grid} pixel={scale} />
        </Box>
    )
}
