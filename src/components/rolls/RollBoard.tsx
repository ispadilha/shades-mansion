import React, { useEffect, useRef, useState } from "react"
import { Box, Typography, type SxProps, type Theme } from "@mui/material"
import { keyframes } from "@emotion/react"
import { Coin } from "./Coin"
import { Die } from "./Die"
import { COIN_FACES, rollDice, sumDice, type CoinFace, type DieSides, type RollKind } from "../../logic/rolls"
import { useLanguage } from "../../hooks/useLanguage"
import { ROLL_PALETTE } from "../../constants/palette"

export const ROLL_SPIN_MS = 550
export const ROLL_HOLD_MS = 800
// Tempo entre as "faces falsas" mostradas enquanto o dado ainda está girando
const SHUFFLE_MS = 90

const pulse = keyframes`
    0% { opacity: 0.45 }
    50% { opacity: 1 }
    100% { opacity: 0.45 }
`

export type RollTone = "good" | "bad" | "neutral"

const TONE_COLOR: Record<RollTone, string> = {
    good: ROLL_PALETTE.good,
    bad: ROLL_PALETTE.bad,
    neutral: ROLL_PALETTE.neutral,
}

// Uma rolagem para exibir. O resultado já foi sorteado por quem chamou (logic/rolls):
// a tela só encena o giro e revela o valor.
export interface RollView {
    // Muda a cada rolagem. É o que faz a animação recomeçar em uma sequência de rolagens.
    id: string
    kind: RollKind
    // Moeda: a face que saiu. Dados: o valor de cada um deles, na ordem em que aparecem.
    // Uma rolagem só, com todos os dados caindo juntos, e o resultado é a soma.
    value: CoinFace | number[]
    title: string
    subtitle?: string
    // Leitura do resultado
    outcome?: { label: string; tone?: RollTone }
    // Rolagem do jogador: o dado fica parado esperando um clique em cima dele.
    // As dos times que ele não comanda rolam sozinhas.
    manual?: boolean
    spinMs?: number
    holdMs?: number
}

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

const sidesOf = (kind: RollKind): DieSides => (kind === "d20" ? 20 : 12)

// Com mais de um dado na mesa, cada um encolhe um pouco para os dois caberem lado a lado
const dieSizeFor = (count: number) => (count > 1 ? 96 : 120)
// Defasagem entre os giros de dados vizinhos: eles caem juntos, mas não idênticos
const DIE_SPIN_OFFSET_MS = 140

// As duas linhas de texto embaixo dos dados alternam entre vazias e preenchidas conforme a
// fase da rolagem. A altura de linha vai declarada junto da reservada, e as duas batem: sem
// isso a medida ficaria por conta do padrão do tema (1.5 × o tamanho da fonte) e a caixa
// cresceria alguns pixels sempre que o texto entrasse. A rolagem inteira tremeria a cada
// troca de fase. Reservar por baixo (`minHeight`) mantém a saída graciosa se um texto longo
// quebrar em duas linhas.
const RESULT_LINE = { fontSize: 22, lineHeight: "32px", minHeight: "32px" }
const READING_LINE = { fontSize: 16, lineHeight: "24px", minHeight: "24px" }

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
        kind === "coin"
            ? COIN_FACES[Math.floor(Math.random() * COIN_FACES.length)]
            : rollDice(Math.max(1, diceCount), sidesOf(kind ?? "d12"))

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

        const shuffle = window.setInterval(() => setPreview(randomFaces()), SHUFFLE_MS)
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

    const spinning = phase === "spinning"
    const shown = phase === "revealed" ? (roll?.value ?? preview) : preview
    const shownDice = Array.isArray(shown) ? shown : []
    const dieSize = dieSizeFor(shownDice.length)

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

            <Box sx={{ my: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                {kind === "coin" ? (
                    <Coin face={shown as CoinFace} spinning={spinning} />
                ) : (
                    shownDice.map((die, index) => (
                        <Die
                            key={index}
                            sides={sidesOf(kind ?? "d12")}
                            value={die}
                            size={dieSize}
                            spinning={spinning}
                            spinOffsetMs={index * DIE_SPIN_OFFSET_MS}
                        />
                    ))
                )}
            </Box>

            <Typography sx={{ ...RESULT_LINE, color: ROLL_PALETTE.result, fontWeight: 700 }}>
                {phase !== "revealed"
                    ? ""
                    : kind === "coin"
                      ? t(roll?.value === "heads" ? "coinHeads" : "coinTails")
                      : String(sumDice(shownDice))}
            </Typography>

            {phase === "waiting" ? (
                <Typography sx={{ ...READING_LINE, color: ROLL_PALETTE.title, animation: `${pulse} 1.4s ease-in-out infinite` }}>
                    {t("clickToRoll")}
                </Typography>
            ) : (
                <Typography
                    sx={{
                        ...READING_LINE,
                        color: TONE_COLOR[roll?.outcome?.tone ?? "neutral"],
                        opacity: phase === "revealed" ? 1 : 0,
                        transition: "opacity 150ms",
                    }}
                >
                    {/* Só o resultado já revelado entra aqui. Deixar o texto montado e
                    apenas transparente entregaria a leitura da rolagem seguinte: ela troca
                    de texto no ato, e a opacidade leva 150ms para apagar. */}
                    {phase === "revealed" ? (roll?.outcome?.label ?? "") : ""}
                </Typography>
            )}

            {footer && (
                <Box onClick={(event) => event.stopPropagation()} sx={{ mt: 1, cursor: "default" }}>
                    {footer}
                </Box>
            )}
        </Box>
    )
}
