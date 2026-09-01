import React from "react"
import { Typography } from "@mui/material"
import { keyframes } from "@emotion/react"
import type { RollTone } from "../../logic/rolls"
import { useLanguage } from "../../hooks/useLanguage"
import { ROLL_PALETTE } from "../../constants/palette"

const pulse = keyframes`
    0% { opacity: 0.45 }
    50% { opacity: 1 }
    100% { opacity: 0.45 }
`

const TONE_COLOR: Record<RollTone, string> = {
    good: ROLL_PALETTE.good,
    bad: ROLL_PALETTE.bad,
    neutral: ROLL_PALETTE.neutral,
}

// As duas linhas de texto embaixo dos dados alternam entre vazias e preenchidas conforme a
// fase da rolagem. A altura de linha vai declarada junto da reservada, e as duas batem: sem
// isso a medida ficaria por conta do padrão do tema (1.5 × o tamanho da fonte) e a caixa
// cresceria alguns pixels sempre que o texto entrasse. A rolagem inteira tremeria a cada
// troca de fase. Reservar por baixo (`minHeight`) mantém a saída graciosa se um texto longo
// quebrar em duas linhas.
const RESULT_LINE = { fontSize: 22, lineHeight: "32px", minHeight: "32px" }
const READING_LINE = { fontSize: 16, lineHeight: "24px", minHeight: "24px" }

interface RollOutcomeProps {
    // O valor que saiu, já em texto (vazio enquanto a rolagem não foi revelada)
    result: string
    // A leitura do valor ("acertou", "repetido"...)
    reading: string
    tone: RollTone
    // Rolagem do jogador parada esperando o clique
    waiting: boolean
    revealed: boolean
}

export const RollOutcome: React.FC<RollOutcomeProps> = ({ result, reading, tone, waiting, revealed }) => {
    const { t } = useLanguage()

    return (
        <>
            <Typography sx={{ ...RESULT_LINE, color: ROLL_PALETTE.result, fontWeight: 700 }}>{result}</Typography>

            {waiting ? (
                <Typography sx={{ ...READING_LINE, color: ROLL_PALETTE.title, animation: `${pulse} 1.4s ease-in-out infinite` }}>
                    {t("clickToRoll")}
                </Typography>
            ) : (
                <Typography
                    sx={{
                        ...READING_LINE,
                        color: TONE_COLOR[tone],
                        opacity: revealed ? 1 : 0,
                        transition: "opacity 150ms",
                    }}
                >
                    {/* Só o resultado já revelado entra aqui. Deixar o texto montado e
                    apenas transparente entregaria a leitura da rolagem seguinte: ela troca
                    de texto no ato, e a opacidade leva 150ms para apagar. */}
                    {revealed ? reading : ""}
                </Typography>
            )}
        </>
    )
}
