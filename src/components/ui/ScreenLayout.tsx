import React from "react"
import { Box, type SxProps, type Theme } from "@mui/material"
import { UI_PALETTE } from "../../constants/palette"

interface ScreenLayoutProps {
    children: React.ReactNode
    // Espaço entre os blocos empilhados da tela
    gap?: number
    // Margem interna, para telas em que o conteúdo chega perto das bordas
    padded?: boolean
    // Ajustes da tela que hospeda o layout (a de jogo, por exemplo, empilha do topo
    // para baixo em vez de centralizar)
    sx?: SxProps<Theme>
}

// A moldura que toda tela usa: ocupa a janela inteira, pinta o fundo do jogo e empilha
// o conteúdo no centro. Fica em um componente só para nenhuma tela repetir a medida.
export const ScreenLayout: React.FC<ScreenLayoutProps> = ({ children, gap = 0, padded = false, sx }) => {
    return (
        <Box
            sx={[
                {
                    width: "100vw",
                    height: "100vh",
                    bgcolor: UI_PALETTE.screenBg,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    boxSizing: "border-box",
                    overflow: "auto",
                    gap,
                    p: padded ? 4 : 0,
                },
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
        >
            {children}
        </Box>
    )
}
