import React, { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { EnterMansionActions } from "./local-components/EnterMansionActions"
import { InitiativeHeader } from "./local-components/InitiativeHeader"
import { InitiativePanel } from "./local-components/InitiativePanel"
import { InitiativeRoll } from "./local-components/InitiativeRoll"
import { ScreenLayout } from "../../components/ui"
import type { RollView } from "../../logic/rolls"
import { rollInitiative } from "../../logic/initiative"
import { ALL_PIECE_SLOTS, createGameSetup, type GameSetup, type PieceSlot } from "../../logic/setup"
import { controlledColorsFor } from "../../logic/types"
import { useGame } from "../../hooks/useGame"
import { useLanguage } from "../../hooks/useLanguage"
import { useSettings } from "../../hooks/useSettings"
import { INITIATIVE_FADE_MS, INITIATIVE_ROLL_TIMING } from "../../constants/rules"

interface InitiativeScreenProps {}

export const InitiativeScreen: React.FC<InitiativeScreenProps> = ({}) => {
    const navigate = useNavigate()
    const { t } = useLanguage()
    const { selection, setMatch } = useGame()
    const { boardSize, minRoomSize, maxRoomSize } = useSettings()

    // As peças dos times que o jogador comanda esperam o clique dele para rolar. Só
    // assistindo, nenhuma espera. Comandando todos, todas esperam.
    const controlledColors = useMemo(() => controlledColorsFor(selection), [selection])

    // A iniciativa é rolada de uma vez só. A tela apenas encena o histórico de jogadas.
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
    const timing = shown.accepted ? INITIATIVE_ROLL_TIMING.accepted : INITIATIVE_ROLL_TIMING.rejected

    const roll: RollView = {
        id: `initiative-${shownIndex}`,
        kind: "d20",
        value: shown.dice,
        title: t("initiativeRoll"),
        subtitle: shown.pieceId,
        outcome: shown.accepted ? undefined : { label: t("repeatedRoll"), tone: "bad" },
        manual: !!shownSlot && controlledColors.includes(shownSlot.color),
        spinMs: timing.spinMs,
        holdMs: timing.holdMs,
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

    const handleEnter = () => {
        if (!setup) return
        setMatch({ ...setup, turnOrder: result.order })
        navigate("/game")
    }

    if (!selection) return null

    return (
        <ScreenLayout sx={{ justifyContent: "flex-start", alignItems: "stretch", overflow: "hidden" }}>
            <InitiativeHeader
                slots={showOrder ? orderedSlots : ALL_PIECE_SLOTS}
                activeId={showOrder ? null : shown.pieceId}
                values={showOrder ? result.values : lockedValues}
                showOrder={showOrder}
                faded={faded}
            />

            <InitiativePanel measuring={!finished} faded={faded}>
                {showOrder ? (
                    <EnterMansionActions
                        ready={setup !== null}
                        onEnter={handleEnter}
                        onBack={() => navigate("/choose-side")}
                    />
                ) : (
                    <InitiativeRoll
                        roll={roll}
                        onDone={() => setStepIndex((index) => index + 1)}
                        onSkip={() => setStepIndex(attempts.length)}
                    />
                )}
            </InitiativePanel>
        </ScreenLayout>
    )
}
