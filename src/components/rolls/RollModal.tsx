import React, { useEffect, useRef, useState } from "react"
import { Box, Modal, Typography } from "@mui/material"
import { keyframes } from "@emotion/react"
import { Coin } from "./Coin"
import { Die } from "./Die"
import { COIN_FACES, rollDice, sumDice, type CoinFace, type DieSides, type RollKind } from "../../logic/rolls"
import { useLanguage } from "../../hooks/useLanguage"

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
    good: "#7fd18a",
    bad: "#e07a7a",
    neutral: "#e8d9a8",
}

// Uma rolagem para exibir. O resultado já foi sorteado por quem chamou (logic/rolls):
// o modal só encena o giro e revela o valor.
export interface RollView {
    // Muda a cada rolagem — é o que faz a animação recomeçar em uma sequência de rolagens
    id: string
    kind: RollKind
    // Moeda: a face que saiu. Dados: o valor de cada um deles, na ordem em que aparecem —
    // uma rolagem só, com todos os dados caindo juntos, e o resultado é a soma.
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

interface RollModalProps {
    roll: RollView | null
    // Chamado quando a rolagem termina de ser exibida (ou quando o jogador clica para adiantar)
    onDone: () => void
    // Controle extra dentro do modal (ex.: "pular rolagens")
    footer?: React.ReactNode
}

const sidesOf = (kind: RollKind): DieSides => (kind === "d20" ? 20 : 12)

// Com mais de um dado na mesa, cada um encolhe um pouco para os dois caberem lado a lado
const dieSizeFor = (count: number) => (count > 1 ? 96 : 120)
// Defasagem entre os giros de dados vizinhos: eles caem juntos, mas não idênticos
const DIE_SPIN_OFFSET_MS = 140

export const RollModal: React.FC<RollModalProps> = ({ roll, onDone, footer }) => {
    const { t } = useLanguage()
    const [phase, setPhase] = useState<"waiting" | "spinning" | "revealed">("spinning")
    const [preview, setPreview] = useState<CoinFace | number[]>([1])

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

    // Rolagem nova: a do jogador nasce parada esperando o clique; as outras já saem girando
    useEffect(() => {
        if (!roll) return
        setPreview(randomFaces())
        setPhase(roll.manual ? "waiting" : "spinning")
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rollId])

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
        <Modal
            open={roll !== null}
            disableEscapeKeyDown
            slotProps={{ backdrop: { sx: { bgcolor: "rgba(0,0,0,0.6)" } } }}
        >
            <Box
                onClick={handleClick}
                sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    minWidth: 260,
                    px: 4,
                    py: 3,
                    bgcolor: "#17131f",
                    border: "1px solid #4a3f5e",
                    borderRadius: 2,
                    outline: "none",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                    cursor: "pointer",
                    userSelect: "none",
                }}
            >
                <Typography sx={{ color: "#cfc2ec", fontSize: 15, letterSpacing: 1, textTransform: "uppercase" }}>
                    {roll?.title}
                </Typography>
                {roll?.subtitle && <Typography sx={{ color: "#8f85a8", fontSize: 13 }}>{roll.subtitle}</Typography>}

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

                <Typography sx={{ color: "#ffe9a8", fontSize: 22, fontWeight: 700, minHeight: 30 }}>
                    {phase !== "revealed"
                        ? ""
                        : kind === "coin"
                          ? t(roll?.value === "heads" ? "coinHeads" : "coinTails")
                          : String(sumDice(shownDice))}
                </Typography>

                {phase === "waiting" ? (
                    <Typography sx={{ color: "#cfc2ec", fontSize: 16, minHeight: 24, animation: `${pulse} 1.4s ease-in-out infinite` }}>
                        {t("clickToRoll")}
                    </Typography>
                ) : (
                    <Typography
                        sx={{
                            color: TONE_COLOR[roll?.outcome?.tone ?? "neutral"],
                            fontSize: 16,
                            minHeight: 24,
                            opacity: spinning ? 0 : 1,
                            transition: "opacity 150ms",
                        }}
                    >
                        {roll?.outcome?.label ?? ""}
                    </Typography>
                )}

                {footer && (
                    <Box onClick={(event) => event.stopPropagation()} sx={{ mt: 1, cursor: "default" }}>
                        {footer}
                    </Box>
                )}
            </Box>
        </Modal>
    )
}
