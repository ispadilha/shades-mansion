import React, { useEffect, useRef, useState } from "react"
import { Box, Typography, type SxProps, type Theme } from "@mui/material"
import { RollFaces } from "./RollFaces"
import { RollOutcome } from "./RollOutcome"
import { COIN_FACES, rollDice, sidesOf, sumDice, type CoinFace, type RollView } from "../../logic/rolls"
import { pickRandom } from "../../logic/random"
import { useLanguage } from "../../hooks/useLanguage"
import { ROLL_PALETTE } from "../../constants/palette"
import { ROLL_HOLD_MS, ROLL_SHUFFLE_MS, ROLL_SPIN_MS } from "../../constants/rules"

interface RollBoardProps {
    roll: RollView | null
    // Chamado quando a rolagem termina de ser exibida (ou quando o jogador clica para adiantar)
    onDone: () => void
    // Controle extra junto da rolagem (ex.: "pular rolagens")
    footer?: React.ReactNode
    // Moldura de quem hospeda a rolagem: o modal desenha uma caixa flutuante,
    // a tela de iniciativa desenha um compartimento no rodapé
    sx?: SxProps<Theme>
}

type Phase = "waiting" | "spinning" | "revealed"

// O conteúdo de uma rolagem: título, dados girando, resultado e leitura. Serve tanto ao
// modal quanto a uma área fixa da tela. Quem usa decide a moldura pelo `sx`.
export const RollBoard: React.FC<RollBoardProps> = ({ roll, onDone, footer, sx }) => {
    const { t } = useLanguage()
    const [phase, setPhase] = useState<Phase>("spinning")
    const [preview, setPreview] = useState<CoinFace | number[]>([1])
    // Rolagem que está em cena; é o que denuncia a chegada de uma nova
    const [shownId, setShownId] = useState<string | null>(null)

    // onDone muda de identidade a cada render do pai; guardá-lo em ref evita reiniciar os timers
    const onDoneRef = useRef(onDone)
    useEffect(() => {
        onDoneRef.current = onDone
    })

    const rollId = roll?.id ?? null
    const kind = roll?.kind

    // Quantos dados esta rolagem tem (a moeda não tem nenhum)
    const diceCount = Array.isArray(roll?.value) ? roll.value.length : 0

    // Faces falsas do giro: todos os dados embaralham juntos, como caem juntos
    const randomFaces = (): CoinFace | number[] =>
        kind === "coin" ? pickRandom(COIN_FACES) : rollDice(Math.max(1, diceCount), sidesOf(kind ?? "d12"))

    // Rolagem nova: a do jogador nasce parada esperando o clique; as outras já saem girando.
    // A virada acontece durante o render, e não em um efeito: efeito só roda depois da
    // pintura, e o quadro pintado no meio mostraria o valor da rolagem nova ainda na fase
    // "revelada" da anterior, aparecendo antes da hora.
    if (rollId !== shownId) {
        setShownId(rollId)
        if (roll) {
            setPhase(roll.manual ? "waiting" : "spinning")
            setPreview(randomFaces())
        }
    }

    // Giro: embaralha as faces até o tempo acabar
    useEffect(() => {
        if (!roll || phase !== "spinning") return

        const shuffle = window.setInterval(() => setPreview(randomFaces()), ROLL_SHUFFLE_MS)
        const timer = window.setTimeout(() => setPhase("revealed"), roll.spinMs ?? ROLL_SPIN_MS)

        return () => {
            clearInterval(shuffle)
            clearTimeout(timer)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rollId, phase])

    // Resultado: segura o valor na tela e devolve o controle a quem pediu a rolagem
    useEffect(() => {
        if (!roll || phase !== "revealed") return
        const timer = window.setTimeout(() => onDoneRef.current(), roll.holdMs ?? ROLL_HOLD_MS)
        return () => clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rollId, phase])

    // Clicar no dado: lança (rolagem do jogador), adianta o giro e depois encerra
    const handleClick = () => {
        if (phase === "waiting") setPhase("spinning")
        else if (phase === "spinning") setPhase("revealed")
        else onDoneRef.current()
    }

    const revealed = phase === "revealed"
    const shown = revealed ? (roll?.value ?? preview) : preview

    // O valor que saiu, em texto: a face da moeda ou a soma dos dados
    const result = !revealed
        ? ""
        : kind === "coin"
          ? t(roll?.value === "heads" ? "coinHeads" : "coinTails")
          : String(sumDice(Array.isArray(shown) ? shown : []))

    return (
        <Box
            onClick={handleClick}
            sx={[
                {
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                    cursor: "pointer",
                    userSelect: "none",
                },
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
        >
            <Typography sx={{ color: ROLL_PALETTE.title, fontSize: 15, letterSpacing: 1, textTransform: "uppercase" }}>
                {roll?.title}
            </Typography>
            {roll?.subtitle && <Typography sx={{ color: ROLL_PALETTE.subtitle, fontSize: 13 }}>{roll.subtitle}</Typography>}

            <RollFaces kind={kind ?? "d12"} shown={shown} spinning={phase === "spinning"} />

            <RollOutcome
                result={result}
                reading={roll?.outcome?.label ?? ""}
                tone={roll?.outcome?.tone ?? "neutral"}
                waiting={phase === "waiting"}
                revealed={revealed}
            />

            {footer && (
                <Box onClick={(event) => event.stopPropagation()} sx={{ mt: 1, cursor: "default" }}>
                    {footer}
                </Box>
            )}
        </Box>
    )
}
