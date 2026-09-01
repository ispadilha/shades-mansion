import React from "react"
import { Box, Modal } from "@mui/material"
import { RollBoard, type RollView } from "./RollBoard"
import { ROLL_PALETTE } from "../../constants/palette"

interface RollModalProps {
    roll: RollView | null
    // Chamado quando a rolagem termina de ser exibida (ou quando o jogador clica para adiantar)
    onDone: () => void
    // Controle extra dentro do modal (ex.: "pular rolagens")
    footer?: React.ReactNode
}

export const RollModal: React.FC<RollModalProps> = ({ roll, onDone, footer }) => {
    return (
        <Modal
            open={roll !== null}
            disableEscapeKeyDown
            slotProps={{ backdrop: { sx: { bgcolor: ROLL_PALETTE.backdrop } } }}
        >
            <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", outline: "none" }}>
                <RollBoard
                    roll={roll}
                    onDone={onDone}
                    footer={footer}
                    sx={{
                        minWidth: 260,
                        px: 4,
                        py: 3,
                        bgcolor: ROLL_PALETTE.bg,
                        border: `1px solid ${ROLL_PALETTE.border}`,
                        borderRadius: 2,
                    }}
                />
            </Box>
        </Modal>
    )
}
