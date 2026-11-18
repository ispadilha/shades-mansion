import React, { useRef } from "react"
import { Box, Fade, Modal, type SxProps, type Theme } from "@mui/material"
import { withSx } from "./withSx"
import { usePalette } from "../../hooks/usePalette"
import { MODAL_FADE_MS } from "../../constants/rules"

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

    // Saindo, a caixa continua mostrando o que mostrava: quem fecha costuma zerar junto o dado
    // que ela exibia (a personagem, a barreira, o item), e o fade-out ficaria com a caixa vazia
    const shown = useRef(children)
    if (open) shown.current = children

    return (
        <Modal
            open={open}
            onClose={onClose}
            closeAfterTransition
            slotProps={{ backdrop: { transitionDuration: MODAL_FADE_MS } }}
        >
            <Fade in={open} timeout={MODAL_FADE_MS}>
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
                        sx={withSx(
                            {
                                width,
                                bgcolor: palette.surface.bg,
                                color: palette.surface.text,
                                border: `1px solid ${palette.surface.border}`,
                                // Saindo, os botões da caixa já não valem
                                pointerEvents: open ? "auto" : "none",
                                p: 3,
                            },
                            sx,
                        )}
                    >
                        {shown.current}
                    </Box>
                </Box>
            </Fade>
        </Modal>
    )
}
