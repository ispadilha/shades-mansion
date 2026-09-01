import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Box, Button, Typography } from "@mui/material"
import { InitiativeLineup, INITIATIVE_FADE_MS } from "../components/initiative"
import { RollBoard, type RollView } from "../components/rolls"
import { rollInitiative } from "../logic/initiative"
import { ALL_PIECE_SLOTS, createGameSetup, type GameSetup, type PieceSlot } from "../logic/setup"
import { controlledColorsFor } from "../logic/types"
import { useGame } from "../hooks/useGame"
import { useLanguage } from "../hooks/useLanguage"
import { ROLL_PALETTE, UI_PALETTE } from "../constants/palette"
import { useSettings } from "../hooks/useSettings"

const ACCEPTED_SPIN_MS = 320
const ACCEPTED_HOLD_MS = 360
const REJECTED_SPIN_MS = 190
const REJECTED_HOLD_MS = 210

interface InitiativeScreenProps {}

export const InitiativeScreen: React.FC<InitiativeScreenProps> = ({}) => {
    const navigate = useNavigate()
    const { t } = useLanguage()
    const { selection, setMatch } = useGame()
    const { boardSize, minRoomSize, maxRoomSize } = useSettings()

    // As peças dos times que o jogador comanda esperam o clique dele para rolar. Só
    // assistindo, nenhuma espera; comandando todos, todas esperam.
    const controlledColors = useMemo(() => controlledColorsFor(selection), [selection])

    // A iniciativa é rolada de uma vez só; a tela apenas encena o histórico de jogadas.
    // Os ids das peças não dependem do labirinto, então isso roda antes do mapa existir.
    const [result] = useState(() => rollInitiative(ALL_PIECE_SLOTS.map((slot) => slot.id)))
    const [stepIndex, setStepIndex] = useState(0)
    const [setup, setSetup] = useState<GameSetup | null>(null)

    const setupStartedRef = useRef(false)

    useEffect(() => {
        if (!selection) navigate("/choose-side", { replace: true })
    }, [selection, navigate])

    // O labirinto é gerado "por trás" das rolagens: o setTimeout deixa a fila de peças
    // ser exibida primeiro e o custo da geração cai enquanto o jogador olha os dados. Quando
    // ele entra no jogo, tabuleiro, peças e itens já estão prontos. Nada é montado à vista.
    useEffect(() => {
        if (setupStartedRef.current) return
        setupStartedRef.current = true
        window.setTimeout(() => setSetup(createGameSetup(boardSize, minRoomSize, maxRoomSize)), 0)
    }, [boardSize, minRoomSize, maxRoomSize])

    const attempts = result.attempts
    const finished = stepIndex >= attempts.length

    // Números que já saíram: aparecem embaixo da peça assim que a rolagem dela termina
    const lockedValues = useMemo(() => {
        const values: Record<string, number> = {}
        for (const attempt of attempts.slice(0, stepIndex)) {
            if (attempt.accepted) values[attempt.pieceId] = attempt.total
        }
        return values
    }, [attempts, stepIndex])

    const orderedSlots = useMemo<PieceSlot[]>(
        () => result.order.map((id) => ALL_PIECE_SLOTS.find((slot) => slot.id === id)!),
        [result],
    )

    // Rolagem em cena. Terminada a fila, ela fica parada na última que apareceu de fato, em
    // vez de sumir: o compartimento precisa continuar mostrando algo enquanto apaga. Como o
    // índice não muda junto com o fim, o RollBoard mantém o resultado já revelado, sem
    // reanimar nada, e pular as rolagens não faz a última saltar para a tela girando.
    // O ajuste é feito no render, e não em um efeito, para a troca de rolagem não atrasar
    // um quadro atrás do resto da tela.
    const [shownIndex, setShownIndex] = useState(0)
    if (!finished && shownIndex !== stepIndex) setShownIndex(stepIndex)
    const shown = attempts[shownIndex]
    const shownSlot = ALL_PIECE_SLOTS.find((slot) => slot.id === shown.pieceId)

    const roll: RollView = {
        id: `initiative-${shownIndex}`,
        kind: "d20",
        value: shown.dice,
        title: t("initiativeRoll"),
        subtitle: shown.pieceId,
        outcome: shown.accepted ? undefined : { label: t("repeatedRoll"), tone: "bad" },
        manual: !!shownSlot && controlledColors.includes(shownSlot.color),
        spinMs: shown.accepted ? ACCEPTED_SPIN_MS : REJECTED_SPIN_MS,
        holdMs: shown.accepted ? ACCEPTED_HOLD_MS : REJECTED_HOLD_MS,
    }

    // No fim das rolagens a tela troca de conteúdo em dois lugares: a fila passa da ordem
    // dos times para a do sorteio, e o compartimento de baixo passa dos dados aos botões de
    // entrada. As duas trocas correm juntas, no mesmo apagar e acender, para a tela mudar de
    // estado de uma vez só. E escondidas, para nada saltar à vista.
    const [showOrder, setShowOrder] = useState(false)
    const [faded, setFaded] = useState(false)
    useEffect(() => {
        if (!finished || showOrder) return
        setFaded(true)
        const timer = window.setTimeout(() => {
            setShowOrder(true)
            setFaded(false)
        }, INITIATIVE_FADE_MS)
        return () => clearTimeout(timer)
    }, [finished, showOrder])

    // O compartimento de baixo nasce com a altura das rolagens e a mantém quando elas dão
    // lugar aos botões de entrada, que ocupam bem menos espaço. Sem isso o rodapé encolheria
    // de uma vez no fim da fila. A altura sai de uma medida da própria tela, e não de um
    // número fixo, então acompanha fonte, idioma e tamanho dos dados sem ajustar nada.
    const panelRef = useRef<HTMLDivElement>(null)
    const [panelHeight, setPanelHeight] = useState<number>()
    useLayoutEffect(() => {
        if (finished || panelHeight !== undefined) return
        const measured = panelRef.current?.offsetHeight
        // Medida antes da pintura, e só uma vez: as rolagens têm todas a mesma altura
        if (measured) setPanelHeight(measured)
    }, [finished, panelHeight])

    const handleEnter = () => {
        if (!setup) return
        setMatch({ ...setup, turnOrder: result.order })
        navigate("/game")
    }

    if (!selection) return null

    return (
        <Box
            sx={{
                width: "100vw",
                height: "100vh",
                bgcolor: UI_PALETTE.screenBg,
                display: "flex",
                flexDirection: "column",
                boxSizing: "border-box",
                overflow: "hidden",
            }}
        >
            {/* Em cima: a fila de peças */}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, pt: 6, flexShrink: 0 }}>
                <Typography sx={{ color: UI_PALETTE.text, fontSize: 30 }}>{t("initiativeTitle")}</Typography>
                <Typography sx={{ color: UI_PALETTE.accentMuted, fontSize: 15 }}>
                    {showOrder ? t("turnOrderReady") : t("initiativeSubtitle")}
                </Typography>

                <InitiativeLineup
                    slots={showOrder ? orderedSlots : ALL_PIECE_SLOTS}
                    activeId={showOrder ? null : shown.pieceId}
                    values={showOrder ? result.values : lockedValues}
                    showRank={showOrder}
                    faded={faded}
                />
            </Box>

            {/* Embaixo: um compartimento para rolagem de iniciativas, e depois entrada na partida. */}
            <Box
                ref={panelRef}
                sx={{
                    mt: "auto",
                    flexShrink: 0,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: panelHeight ?? 260,
                    px: 2,
                    py: 2,
                    bgcolor: ROLL_PALETTE.bg,
                    borderTop: `1px solid ${ROLL_PALETTE.border}`,
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
                    {showOrder ? (
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                            <Button
                                variant="contained"
                                disabled={!setup}
                                onClick={handleEnter}
                                sx={{ bgcolor: UI_PALETTE.buttonAltBg, color: UI_PALETTE.text, px: 4, py: 1.5, "&:disabled": { color: UI_PALETTE.textMuted } }}
                            >
                                {setup ? t("enterMansion") : t("preparingMansion")}
                            </Button>
                            <Button onClick={() => navigate("/choose-side")} sx={{ color: UI_PALETTE.textDim }}>
                                {t("goBack")}
                            </Button>
                        </Box>
                    ) : (
                        <RollBoard
                            roll={roll}
                            onDone={() => setStepIndex((index) => index + 1)}
                            footer={
                                <Button size="small" onClick={() => setStepIndex(attempts.length)} sx={{ color: UI_PALETTE.accentMuted }}>
                                    {t("skipRolls")}
                                </Button>
                            }
                        />
                    )}
                </Box>
            </Box>
        </Box>
    )
}
