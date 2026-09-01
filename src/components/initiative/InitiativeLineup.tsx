import React from "react"
import { Box } from "@mui/material"
import { LineupSlot } from "./LineupSlot"
import type { PieceSlot } from "../../logic/setup"
import { INITIATIVE_FADE_MS } from "../../constants/rules"

interface InitiativeLineupProps {
    // Todas as peças, na ordem em que devem aparecer na fila
    slots: PieceSlot[]
    // Peça que está rolando o dado agora
    activeId: string | null
    // Valor já travado de cada peça (as que ainda não rolaram estão sem número)
    values: Record<string, number>
    // Numera as peças da primeira à última — usado quando a ordem final já está definida
    showRank?: boolean
    // Fila apagada: é durante esse intervalo que a troca de ordem acontece, fora da vista
    faded?: boolean
}

export const InitiativeLineup: React.FC<InitiativeLineupProps> = ({
    slots,
    activeId,
    values,
    showRank = false,
    faded = false,
}) => {
    return (
        <Box
            sx={{
                width: "100%",
                overflowX: "auto",
                py: 1,
                opacity: faded ? 0 : 1,
                transition: `opacity ${INITIATIVE_FADE_MS}ms ease-in-out`,
            }}
        >
            {/* A fila é refeita do zero ao mudar de arranjo, em vez de ter as mesmas casas
            reordenadas e repintadas. A troca acontece com a fila invisível, então não custa
            nada, e não depende de o navegador repintar o interior de uma camada recém-animada. */}
            <Box
                key={showRank ? "sorteio" : "times"}
                sx={{ display: "flex", gap: 1.5, width: "max-content", mx: "auto", px: 2 }}
            >
                {slots.map((slot, index) => (
                    <LineupSlot
                        key={slot.id}
                        slot={slot}
                        rank={showRank ? `#${index + 1}` : ""}
                        value={values[slot.id]}
                        active={slot.id === activeId}
                    />
                ))}
            </Box>
        </Box>
    )
}
