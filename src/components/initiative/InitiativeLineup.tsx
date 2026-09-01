import React from "react"
import { Box, Typography } from "@mui/material"
import { PieceToken } from "./PieceToken"
import type { PieceSlot } from "../../logic/setup"
import { INITIATIVE_PALETTE } from "../../constants/palette"

export const INITIATIVE_FADE_MS = 1000

// A linha do número da ordem reserva a própria altura desde o começo, mesmo enquanto não há
// número, para os bonecos não descerem quando a ordem é revelada. A altura de linha vai
// declarada junto da reservada para as duas baterem (12px × 1.5 é o padrão do tema).
const RANK_LINE = { fontSize: 12, lineHeight: "18px", minHeight: "18px" }

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
                {slots.map((slot, index) => {
                    const value = values[slot.id]
                    const rolled = value !== undefined

                    return (
                        <Box
                            key={slot.id}
                            sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5, width: 62 }}
                        >
                            {/* O número entra e sai pelo texto, e não escondendo o elemento:
                            `visibility` invalida só a pintura, e pintura pendente dentro da
                            camada que acabou de ser animada pode não acontecer.
                            Trocar o texto invalida o layout, que o navegador é obrigado a refazer. */}
                            <Typography sx={{ ...RANK_LINE, color: INITIATIVE_PALETTE.rank }}>
                                {showRank ? `#${index + 1}` : ""}
                            </Typography>
                            <PieceToken
                                color={slot.color}
                                type={slot.type}
                                aura={slot.id === activeId ? "active" : null}
                                dimmed={!rolled && slot.id !== activeId}
                            />
                            <Typography sx={{ color: INITIATIVE_PALETTE.pieceId, fontSize: 12 }}>{slot.id}</Typography>
                            <Typography
                                sx={{
                                    color: rolled ? INITIATIVE_PALETTE.value : INITIATIVE_PALETTE.valuePending,
                                    fontSize: 18,
                                    fontWeight: 700,
                                    lineHeight: 1.1,
                                }}
                            >
                                {rolled ? value : "—"}
                            </Typography>
                        </Box>
                    )
                })}
            </Box>
        </Box>
    )
}
