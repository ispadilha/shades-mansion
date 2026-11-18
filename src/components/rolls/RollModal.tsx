import React, { useRef } from "react"
import { Box, Fade, Modal } from "@mui/material"
import { RollBoard } from "./RollBoard"
import type { RollView } from "../../logic/rolls"
import { usePalette } from "../../hooks/usePalette"
import { MODAL_FADE_MS } from "../../constants/rules"

interface RollModalProps {
    roll: RollView | null
    // Chamado quando a rolagem termina de ser exibida (ou quando o jogador clica para adiantar)
    onDone: () => void
    // Controle extra dentro do modal (ex.: "pular rolagens")
    footer?: React.ReactNode
}

export const RollModal: React.FC<RollModalProps> = ({ roll, onDone, footer }) => {
    const palette = usePalette()

    // Saindo, a mesa continua mostrando a última rolagem: sem ela, o fade-out mostraria a mesa vazia
    const shown = useRef(roll)
    if (roll) shown.current = roll

    return (
        <Modal
            open={roll !== null}
            disableEscapeKeyDown
            closeAfterTransition
            slotProps={{ backdrop: { sx: { bgcolor: palette.roll.backdrop }, transitionDuration: MODAL_FADE_MS } }}
        >
            <Fade in={roll !== null} timeout={MODAL_FADE_MS}>
                {/* Centrado pelo layout, como o `ModalCard`: com `transform`, meio pixel borraria tudo */}
                <Box
                    sx={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        outline: "none",
                        // Saindo, a rolagem já acabou
                        pointerEvents: roll ? "auto" : "none",
                    }}
                >
                    <RollBoard
                        roll={shown.current}
                        onDone={onDone}
                        footer={footer}
                        sx={{
                            minWidth: 260,
                            px: 4,
                            py: 3,
                            bgcolor: palette.roll.bg,
                            border: `1px solid ${palette.roll.border}`,
                        }}
                    />
                </Box>
            </Fade>
        </Modal>
    )
}
