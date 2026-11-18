import React from "react"
import { Box } from "@mui/material"
import { ImportantLogModal } from "./ImportantLogModal"
import type { ImportantNotice } from "../../../hooks/useGameLog"
import { IMPORTANT_LOG_TOP } from "../../../constants/rules"

interface ImportantLogStackProps {
    // Do mais recente para o mais antigo
    notices: ImportantNotice[]
    onDismiss: (id: string) => void
}

// O aviso mais recente fica em cima e empurra os outros para baixo.
// A pilha não pega clique nenhum, então o tabuleiro e o HUD continuam à mão por baixo dela.
// O papel de "status" faz o eventual leitor de tela anunciar cada aviso novo
// sem interromper o que está lendo.
export const ImportantLogStack: React.FC<ImportantLogStackProps> = ({ notices, onDismiss }) => {
    return (
        <Box
            role="status"
            sx={{
                position: "fixed",
                top: IMPORTANT_LOG_TOP,
                left: 0,
                right: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                pointerEvents: "none",
                // Por cima até de um modal aberto, como os avisos do MUI
                zIndex: (theme) => theme.zIndex.snackbar,
            }}
        >
            {notices.map((notice) => (
                <ImportantLogModal key={notice.id} text={notice.text} onDone={() => onDismiss(notice.id)} />
            ))}
        </Box>
    )
}
