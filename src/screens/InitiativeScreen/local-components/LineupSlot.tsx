import React from "react"
import { Box, Typography } from "@mui/material"
import { PieceToken } from "../../../components/pieces"
import type { PieceSlot } from "../../../logic/setup"
import { usePalette } from "../../../hooks/usePalette"
import { LINEUP_RANK_LINE } from "../../../constants/rules"

interface LineupSlotProps {
    slot: PieceSlot
    // Posição da peça na ordem sorteada (vazio enquanto a ordem não foi revelada)
    rank?: string
    // Valor já travado da peça (undefined enquanto ela não rolou)
    value?: number
    // Peça que está rolando o dado agora
    active: boolean
}

// Uma peça na fila da iniciativa: a colocação, o boneco, o id e o número que ela tirou
export const LineupSlot: React.FC<LineupSlotProps> = ({ slot, rank = "", value, active }) => {
    const palette = usePalette()
    const rolled = value !== undefined

    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5, width: 62 }}>
            {/* O número entra e sai pelo texto, e não escondendo o elemento:
            `visibility` invalida só a pintura, e pintura pendente dentro da
            camada que acabou de ser animada pode não acontecer.
            Trocar o texto invalida o layout, que o navegador é obrigado a refazer. */}
            <Typography sx={{ ...LINEUP_RANK_LINE, color: palette.initiative.rank }}>{rank}</Typography>

            <PieceToken color={slot.color} type={slot.type} aura={active ? "active" : null} dimmed={!rolled && !active} />

            <Typography sx={{ color: palette.initiative.pieceId, fontSize: 12 }}>{slot.id}</Typography>

            <Typography
                sx={{
                    color: rolled ? palette.initiative.value : palette.initiative.valuePending,
                    fontSize: 18,
                    fontWeight: 700,
                    lineHeight: 1.1,
                }}
            >
                {rolled ? value : "—"}
            </Typography>
        </Box>
    )
}
