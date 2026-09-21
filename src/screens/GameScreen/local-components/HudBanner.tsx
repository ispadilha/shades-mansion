import React, { useEffect, useRef, useState } from "react"
import { Box, Button, Typography } from "@mui/material"
import { keyframes } from "@emotion/react"
import { HUD_BANNER_HEIGHT, HUD_BANNER_SLIDE_MS } from "../../../constants/rules"

const unroll = keyframes`
    from { height: 0 }
    to { height: ${HUD_BANNER_HEIGHT}px }
`

const rollBack = keyframes`
    from { height: ${HUD_BANNER_HEIGHT}px }
    to { height: 0 }
`

interface HudBannerContent {
    bg: string
    outline: string
    textColor: string
    message: string
    actionLabel: string
    onAction: () => void
}

interface HudBannerProps extends HudBannerContent {
    open: boolean
}

export const HudBanner: React.FC<HudBannerProps> = ({ open, ...content }) => {
    // A faixa continua montada enquanto desliza de volta, senão ela sumiria de um quadro
    // para o outro em vez de sair andando.
    const [mounted, setMounted] = useState(open)

    // E continua mostrando o que mostrava: quem fecha a faixa costuma zerar junto o dado
    // que ela exibia (a peça manipulada, a habilidade), e a saída ficaria sem texto.
    const shown = useRef(content)
    if (open) shown.current = content

    useEffect(() => {
        if (open) {
            setMounted(true)
            return
        }
        const timer = window.setTimeout(() => setMounted(false), HUD_BANNER_SLIDE_MS)
        return () => clearTimeout(timer)
    }, [open])

    if (!mounted) return null

    const { bg, outline, textColor, message, actionLabel, onAction } = shown.current

    return (
        <Box
            sx={{
                overflow: "hidden",
                flexShrink: 0,
                display: "flex",
                alignItems: "flex-end",
                // O `forwards` segura a altura em zero até o desmonte: sem ele a faixa
                // voltaria à altura cheia no último quadro.
                animation: `${open ? unroll : rollBack} ${HUD_BANNER_SLIDE_MS}ms ${open ? "ease-out" : "ease-in"} forwards`,
                pointerEvents: open ? "auto" : "none",
            }}
        >
            <Box
                sx={{
                    width: "100%",
                    height: HUD_BANNER_HEIGHT,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    px: 3,
                    bgcolor: bg,
                    borderBottom: `1px solid ${outline}`,
                }}
            >
                <Typography
                    sx={{
                        color: textColor,
                        fontSize: 13,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                >
                    {message}
                </Typography>
                <Button
                    size="small"
                    variant="outlined"
                    onClick={onAction}
                    sx={{ color: textColor, borderColor: outline, py: 0.25, flexShrink: 0 }}
                >
                    {actionLabel}
                </Button>
            </Box>
        </Box>
    )
}
