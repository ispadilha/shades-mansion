import React from "react"
import { Box } from "@mui/material"
import { keyframes } from "@emotion/react"
import type { CoinFace } from "../../logic/rolls"
import { usePalette } from "../../hooks/usePalette"
import { PixelImage } from "../ui"
import { ROLL_ART_SIZE } from "../../assets"
import { borderOf, circleMask, emptyGrid, paint, polygonMask } from "../../assets/pixels"
import { mix } from "../../constants/palette"

const flip = keyframes`
    0% { transform: scaleY(1) }
    50% { transform: scaleY(0.08) }
    100% { transform: scaleY(1) }
`

const land = keyframes`
    0% { transform: scale(1.25) }
    60% { transform: scale(0.94) }
    100% { transform: scale(1) }
`

// A moeda é desenhada num quadrado de 64, e vira pixels na grade das artes de rolagem
const UNITS = 64
const CENTER = UNITS / 2

// O anel de dentro, mais apagado que a borda
const INNER_RING_ALPHA = 0.6

interface CoinProps {
    face: CoinFace
    // Quantos pixels da tela cada pixel da moeda ocupa
    scale: number
    spinning?: boolean
}

export const Coin: React.FC<CoinProps> = ({ face, scale, spinning = false }) => {
    const palette = usePalette()
    const heads = face === "heads"
    const size = ROLL_ART_SIZE * scale
    const circle = (cx: number, cy: number, radius: number) => circleMask(cx, cy, radius, ROLL_ART_SIZE, UNITS)

    // A moeda em pixels: a beirada, o disco com a borda, o anel de dentro e o desenho da face
    const grid = emptyGrid(ROLL_ART_SIZE)
    const surface = heads ? palette.coin.heads : palette.coin.tails
    const disc = circle(CENTER, CENTER, 26)
    paint(grid, circle(CENTER, CENTER, 29), palette.coin.rim)
    paint(grid, disc, surface)
    paint(grid, borderOf(disc), palette.coin.edge)
    paint(grid, borderOf(circle(CENTER, CENTER, 21)), mix(surface, palette.coin.edge, INNER_RING_ALPHA))
    if (heads) {
        // Cara: um círculo com dois olhos
        paint(grid, circle(CENTER, CENTER, 11.5), palette.coin.face)
        paint(grid, circle(27.6, 29.6, 2.4), palette.coin.eyes)
        paint(grid, circle(36.4, 29.6, 2.4), palette.coin.eyes)
    } else {
        // Coroa: base retangular com três pontas
        const crown = "23,41 41,41 41,35 38,27 35,35 32,25.5 29,35 26,27 23,35"
        paint(grid, polygonMask(crown, ROLL_ART_SIZE, UNITS), palette.coin.crown)
    }

    return (
        <Box
            sx={{
                width: size,
                height: size,
                animation: `${spinning ? flip : land} ${spinning ? "300ms" : "260ms"} ${spinning ? "linear infinite" : "ease-out"}`,
            }}
        >
            <PixelImage grid={grid} pixel={scale} />
        </Box>
    )
}
