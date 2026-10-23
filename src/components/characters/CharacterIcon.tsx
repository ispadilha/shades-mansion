import React from "react"
import { Box } from "@mui/material"
import { PixelImage } from "../ui"
import type { AuraKind, CharacterColor, CharacterType } from "../../logic/types"
import { characterKey } from "../../logic/types"
import { AURA_PALETTE, levelStarColors, rgba } from "../../constants/palette"
import { ICON_LEVEL_STAR } from "../../constants/rules"
import { CHARACTER_ICONS, ICON_ART_SIZE } from "../../assets"
import { starGrid } from "../../assets/pixels"

// A moldura do retrato: a borda, que acende com a aura, e a folga entre ela e a arte
const FRAME = { border: 2, gap: 2 }

interface CharacterIconProps {
    color: CharacterColor
    type: CharacterType
    // Quantas vezes o retrato cresce sobre o tamanho em que foi desenhado
    scale: number
    // Do nível 2 em diante a personagem ganha a estrela de promoção no canto
    level?: number
    aura?: AuraKind | null
    // Personagem que já agiu na rodada: fica apagada
    dimmed?: boolean
}

// O retrato da personagem, numa moldura que acende com a aura dela
export const CharacterIcon: React.FC<CharacterIconProps> = ({
    color,
    type,
    scale,
    level = 1,
    aura = null,
    dimmed = false,
}) => {
    const highlight = aura ? AURA_PALETTE[aura] : null
    const art = ICON_ART_SIZE * scale
    const size = art + 2 * (FRAME.border + FRAME.gap)

    // A estrela de promoção, com pixels menores que os do retrato, posta pelo centro dela
    // (medido de dentro da borda) no canto de cima à direita
    const starColors = level >= 2 ? levelStarColors(level) : null
    const star = starColors ? starGrid(starColors.fill, starColors.outline) : null
    const starPixel = Math.max(1, Math.round(scale * ICON_LEVEL_STAR.pixel))
    const starAt = (fraction: number) =>
        Math.round((size - 2 * FRAME.border) * fraction - ((star?.length ?? 0) * starPixel) / 2)

    return (
        <Box
            sx={{
                position: "relative",
                width: size,
                height: size,
                boxSizing: "border-box",
                // A aura é a borda e, por dentro dela, uma faixa translúcida na folga: sem desfoque
                border: `${FRAME.border}px solid ${highlight ? highlight.color : "transparent"}`,
                boxShadow: highlight
                    ? `inset 0 0 0 ${FRAME.gap}px ${rgba(highlight.color, highlight.strength)}`
                    : "none",
                opacity: dimmed ? 0.35 : 1,
                transition: "opacity 200ms, box-shadow 200ms, border-color 200ms",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <Box
                component="img"
                src={CHARACTER_ICONS[characterKey(color, type)]}
                alt=""
                sx={{ width: art, height: art, imageRendering: "pixelated" }}
            />

            {star && (
                <Box
                    sx={{
                        position: "absolute",
                        left: starAt(0.5 + ICON_LEVEL_STAR.x),
                        top: starAt(0.5 - ICON_LEVEL_STAR.y),
                    }}
                >
                    <PixelImage grid={star} pixel={starPixel} />
                </Box>
            )}
        </Box>
    )
}
