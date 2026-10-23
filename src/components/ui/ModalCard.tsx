import React from "react"
import { Box, Modal, type SxProps, type Theme } from "@mui/material"
import { usePalette } from "../../hooks/usePalette"

interface ModalCardProps {
    open: boolean
    onClose: () => void
    children: React.ReactNode
    width?: number
    sx?: SxProps<Theme>
}

// A caixa flutuante de todo modal do jogo: centralizada na tela e pintada com as cores
// das superfícies. Quem usa só decide a largura e o conteúdo.
//
// A centralização é do layout, e não de um `transform`: deslocada pela metade do próprio
// tamanho, uma caixa de lado ímpar cairia em meio pixel e borraria o texto e as bordas. A
// camada em volta deixa os cliques passarem, para o fundo do modal continuar fechando ele.
export const ModalCard: React.FC<ModalCardProps> = ({ open, onClose, children, width = 320, sx }) => {
    const palette = usePalette()

    return (
        <Modal open={open} onClose={onClose}>
            <Box
                sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                    outline: "none",
                }}
            >
                <Box
                    sx={[
                        {
                            width,
                            bgcolor: palette.surface.bg,
                            color: palette.surface.text,
                            border: `1px solid ${palette.surface.border}`,
                            pointerEvents: "auto",
                            p: 3,
                        },
                        ...(Array.isArray(sx) ? sx : [sx]),
                    ]}
                >
                    {children}
                </Box>
            </Box>
        </Modal>
    )
}
