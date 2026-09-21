import React, { useLayoutEffect, useRef, useState } from "react"
import { Box } from "@mui/material"
import { INITIATIVE_FADE_MS } from "../../../constants/rules"
import { usePalette } from "../../../hooks/usePalette"
import { INITIATIVE_PANEL_MIN_HEIGHT } from "../../../constants/rules"

interface InitiativePanelProps {
    children: React.ReactNode
    // As rolagens ainda estão correndo: é enquanto isso que a altura é medida
    measuring: boolean
    // Conteúdo apagado: é durante esse intervalo que ele é trocado, fora da vista
    faded: boolean
}

// O compartimento de baixo da tela de iniciativa: primeiro as rolagens, depois a entrada
// na partida.
//
// Ele nasce com a altura das rolagens e a mantém quando elas dão lugar aos botões de
// entrada, que ocupam bem menos espaço. Sem isso o rodapé encolheria de uma vez no fim da
// fila. A altura sai de uma medida da própria tela, e não de um número fixo, então
// acompanha fonte, idioma e tamanho dos dados sem ajustar nada.
export const InitiativePanel: React.FC<InitiativePanelProps> = ({ children, measuring, faded }) => {
    const palette = usePalette()
    const panelRef = useRef<HTMLDivElement>(null)
    const [panelHeight, setPanelHeight] = useState<number>()

    useLayoutEffect(() => {
        if (!measuring || panelHeight !== undefined) return
        const measured = panelRef.current?.offsetHeight
        // Medida antes da pintura, e só uma vez: as rolagens têm todas a mesma altura
        if (measured) setPanelHeight(measured)
    }, [measuring, panelHeight])

    return (
        <Box
            ref={panelRef}
            sx={{
                mt: "auto",
                flexShrink: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: panelHeight ?? INITIATIVE_PANEL_MIN_HEIGHT,
                px: 2,
                py: 2,
                bgcolor: palette.roll.bg,
                borderTop: `1px solid ${palette.roll.border}`,
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    opacity: faded ? 0 : 1,
                    transition: `opacity ${INITIATIVE_FADE_MS}ms ease-in-out`,
                }}
            >
                {children}
            </Box>
        </Box>
    )
}
