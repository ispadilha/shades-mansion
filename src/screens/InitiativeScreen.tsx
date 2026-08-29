import React, { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Box, Button, Typography } from "@mui/material"
import { InitiativeLineup } from "../components/initiative"
import { RollModal, type RollView } from "../components/rolls"
import { rollInitiative } from "../logic/initiative"
import { ALL_PIECE_SLOTS, createGameSetup, type GameSetup, type PieceSlot } from "../logic/setup"
import { controlledColorsFor } from "../logic/types"
import { useGame } from "../hooks/useGame"
import { useLanguage } from "../hooks/useLanguage"
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
    const current = finished ? null : attempts[stepIndex]

    // Números que já saíram: aparecem embaixo da peça assim que a rolagem dela termina
    const lockedValues = useMemo(() => {
        const values: Record<string, number> = {}
        for (const attempt of attempts.slice(0, stepIndex)) {
            if (attempt.accepted) values[attempt.pieceId] = attempt.value
        }
        return values
    }, [attempts, stepIndex])

    const orderedSlots = useMemo<PieceSlot[]>(
        () => result.order.map((id) => ALL_PIECE_SLOTS.find((slot) => slot.id === id)!),
        [result],
    )

    const currentSlot = current ? ALL_PIECE_SLOTS.find((slot) => slot.id === current.pieceId) : undefined

    const roll: RollView | null = current && {
        id: `initiative-${stepIndex}`,
        kind: "d20",
        value: current.value,
        title: t("initiativeRoll"),
        subtitle: current.pieceId,
        outcome: current.accepted ? undefined : { label: t("repeatedRoll"), tone: "bad" },
        manual: !!currentSlot && controlledColors.includes(currentSlot.color),
        spinMs: current.accepted ? ACCEPTED_SPIN_MS : REJECTED_SPIN_MS,
        holdMs: current.accepted ? ACCEPTED_HOLD_MS : REJECTED_HOLD_MS,
    }

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
                bgcolor: "#000",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 2,
                pt: 6,
                boxSizing: "border-box",
            }}
        >
            <Typography sx={{ color: "#fff", fontSize: 30 }}>{t("initiativeTitle")}</Typography>
            <Typography sx={{ color: "#8f85a8", fontSize: 15 }}>
                {finished ? t("turnOrderReady") : t("initiativeSubtitle")}
            </Typography>

            <InitiativeLineup
                slots={finished ? orderedSlots : ALL_PIECE_SLOTS}
                activeId={current?.pieceId ?? null}
                values={finished ? result.values : lockedValues}
                showRank={finished}
            />

            {/* Enquanto as rolagens acontecem, quem manda na tela é o modal (o botão de
            pular fica dentro dele); terminadas, a tela oferece a entrada na partida. */}
            {finished && (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, mt: 2 }}>
                    <Button
                        variant="contained"
                        disabled={!setup}
                        onClick={handleEnter}
                        sx={{ bgcolor: "#2a2a3a", color: "#fff", px: 4, py: 1.5, "&:disabled": { color: "#777" } }}
                    >
                        {setup ? t("enterMansion") : t("preparingMansion")}
                    </Button>
                    <Button onClick={() => navigate("/choose-side")} sx={{ color: "#888" }}>
                        {t("goBack")}
                    </Button>
                </Box>
            )}

            <RollModal
                roll={roll}
                onDone={() => setStepIndex((index) => index + 1)}
                footer={
                    <Button size="small" onClick={() => setStepIndex(attempts.length)} sx={{ color: "#8f85a8" }}>
                        {t("skipRolls")}
                    </Button>
                }
            />
        </Box>
    )
}
