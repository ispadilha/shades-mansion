import React, { useEffect, useState } from "react"
import { Box, Typography } from "@mui/material"
import { keyframes } from "@emotion/react"
import { usePalette } from "../../../hooks/usePalette"
import { IMPORTANT_LOG_GAP, IMPORTANT_LOG_HEIGHT, IMPORTANT_LOG_MS, MODAL_FADE_MS } from "../../../constants/rules"

const fadeIn = keyframes`
    from { opacity: 0 }
    to { opacity: 1 }
`

const fadeOut = keyframes`
    from { opacity: 1 }
    to { opacity: 0 }
`

interface ImportantLogModalProps {
    text: string
    // Chamado quando o aviso termina de sair, para quem guarda a lista tirá-lo dela
    onDone: () => void
}

// Ao contrário dos outros modais, não escurece o tabuleiro nem segura nada:
// aparece, fica `IMPORTANT_LOG_MS` contando o próprio tempo e sai sozinho.
export const ImportantLogModal: React.FC<ImportantLogModalProps> = ({ text, onDone }) => {
    const palette = usePalette()
    const [leaving, setLeaving] = useState(false)

    useEffect(() => {
        const timer = window.setTimeout(() => setLeaving(true), IMPORTANT_LOG_MS)
        return () => clearTimeout(timer)
    }, [])

    return (
        <Box
            onAnimationEnd={() => {
                if (leaving) onDone()
            }}
            sx={{
                flexShrink: 0,
                // A folga para o aviso de baixo
                pb: `${IMPORTANT_LOG_GAP}px`,
                // O `forwards` segura o fim da animação: visível depois da entrada, transparente depois da saída
                animation: `${leaving ? fadeOut : fadeIn} ${MODAL_FADE_MS}ms linear forwards`,
            }}
        >
            <Box
                sx={{
                    height: IMPORTANT_LOG_HEIGHT,
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    px: 2,
                    maxWidth: "90vw",
                    bgcolor: palette.surface.bg,
                    color: palette.surface.text,
                    border: `1px solid ${palette.surface.border}`,
                }}
            >
                <Typography sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {text}
                </Typography>
            </Box>
        </Box>
    )
}
