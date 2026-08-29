import React from "react"
import { Box } from "@mui/material"
import { keyframes } from "@emotion/react"
import type { CoinFace } from "../../logic/rolls"

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

interface CoinProps {
    face: CoinFace
    size?: number
    spinning?: boolean
}

export const Coin: React.FC<CoinProps> = ({ face, size = 120, spinning = false }) => {
    const heads = face === "heads"

    return (
        <Box
            sx={{
                width: size,
                height: size,
                animation: `${spinning ? flip : land} ${spinning ? "300ms" : "260ms"} ${spinning ? "linear infinite" : "ease-out"}`,
            }}
        >
            <svg viewBox="0 0 64 64" width={size} height={size}>
                <circle cx="32" cy="32" r="29" fill="#8a6a1e" />
                <circle cx="32" cy="32" r="26" fill={heads ? "#e8c265" : "#c9a44c"} stroke="#5c460f" strokeWidth="2" />
                <circle cx="32" cy="32" r="21" fill="none" stroke="#5c460f" strokeWidth="1" opacity="0.6" />

                {heads ? (
                    <>
                        {/* Cara: um círculo com dois olhos */}
                        <circle cx="32" cy="32" r="11.5" fill="#5c460f" />
                        <circle cx="27.6" cy="29.6" r="2.4" fill="#e8c265" />
                        <circle cx="36.4" cy="29.6" r="2.4" fill="#e8c265" />
                    </>
                ) : (
                    <>
                        {/* Coroa: base retangular com três pontas */}
                        <polygon
                            points="23,41 41,41 41,35 38,27 35,35 32,25.5 29,35 26,27 23,35"
                            fill="#4a3a12"
                        />
                    </>
                )}
            </svg>
        </Box>
    )
}
