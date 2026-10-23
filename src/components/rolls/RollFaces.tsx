import React from "react"
import { Box } from "@mui/material"
import { Coin } from "./Coin"
import { Die } from "./Die"
import type { CoinFace, RollKind } from "../../logic/rolls"
import { sidesOf } from "../../logic/rolls"
import { DIE_SPIN_OFFSET_MS, ROLL_ART_SCALE } from "../../constants/rules"

// Com mais de um dado na mesa, cada um encolhe um pouco para os dois caberem lado a lado
const dieScaleFor = (count: number) => (count > 1 ? ROLL_ART_SCALE.pair : ROLL_ART_SCALE.single)

interface RollFacesProps {
    kind: RollKind
    // O que está na mesa agora: as faces falsas do giro ou o resultado já revelado
    shown: CoinFace | number[]
    spinning: boolean
}

export const RollFaces: React.FC<RollFacesProps> = ({ kind, shown, spinning }) => {
    const dice = Array.isArray(shown) ? shown : []
    const dieScale = dieScaleFor(dice.length)

    return (
        <Box sx={{ my: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
            {kind === "coin" ? (
                <Coin face={shown as CoinFace} scale={ROLL_ART_SCALE.single} spinning={spinning} />
            ) : (
                dice.map((die, index) => (
                    <Die
                        key={index}
                        sides={sidesOf(kind)}
                        value={die}
                        scale={dieScale}
                        spinning={spinning}
                        spinOffsetMs={index * DIE_SPIN_OFFSET_MS}
                    />
                ))
            )}
        </Box>
    )
}
