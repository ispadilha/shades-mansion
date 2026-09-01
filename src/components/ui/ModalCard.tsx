import React from "react"
import { Box, Modal, type SxProps, type Theme } from "@mui/material"
import { SURFACE_PALETTE } from "../../constants/palette"

interface ModalCardProps {
    open: boolean
    onClose: () => void
    children: React.ReactNode
    width?: number
    sx?: SxProps<Theme>
}

// A caixa flutuante de todo modal do jogo: centralizada na tela e pintada com as cores
// das superfícies. Quem usa só decide a largura e o conteúdo.
export const ModalCard: React.FC<ModalCardProps> = ({ open, onClose, children, width = 320, sx }) => {
    return (
        <Modal open={open} onClose={onClose}>
            <Box
                sx={[
                    {
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width,
                        bgcolor: SURFACE_PALETTE.bg,
                        color: SURFACE_PALETTE.text,
                        border: `1px solid ${SURFACE_PALETTE.border}`,
                        borderRadius: 1,
                        outline: "none",
                        p: 3,
                    },
                    ...(Array.isArray(sx) ? sx : [sx]),
                ]}
            >
                {children}
            </Box>
        </Modal>
    )
}
