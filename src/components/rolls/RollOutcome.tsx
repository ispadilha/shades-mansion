import React from "react"
import { Typography } from "@mui/material"
import { keyframes } from "@emotion/react"
import type { RollTone } from "../../logic/rolls"
import { useLanguage } from "../../hooks/useLanguage"
import { usePalette } from "../../hooks/usePalette"
import { ROLL_READING_LINE, ROLL_RESULT_LINE } from "../../constants/rules"

const pulse = keyframes`
    0% { opacity: 0.45 }
    50% { opacity: 1 }
    100% { opacity: 0.45 }
`

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
    const palette = usePalette()
    const { t } = useLanguage()

    return (
        <>
            <Typography sx={{ ...ROLL_RESULT_LINE, color: palette.roll.result, fontWeight: 700 }}>{result}</Typography>

            {waiting ? (
                <Typography sx={{ ...ROLL_READING_LINE, color: palette.roll.title, animation: `${pulse} 1.4s ease-in-out infinite` }}>
                    {t("clickToRoll")}
                </Typography>
            ) : (
                <Typography
                    sx={{
                        ...ROLL_READING_LINE,
                        // Os tons da rolagem têm o nome das cores que os pintam:
                        // se um deles mudar de nome, o compilador cobra a paleta junto
                        color: palette.roll[tone],
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
