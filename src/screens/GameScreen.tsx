import React, { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Box, Menu, MenuItem, Modal, Typography } from "@mui/material"
import { Board } from "../components/Board"
import { HUD } from "../components/HUD"
import type { PieceDefinition, PieceColor, PiecePosition } from "../logic/types"
import { reachableCells, manhattan, findApproachCell } from "../logic/movement"
import { SimpleAI } from "../logic/ai"
import { useGame } from "../hooks/useGame"
import { useLanguage } from "../hooks/useLanguage"
import { useEdgeScroll } from "../hooks/useEdgeScroll"
import { MAX_HP, PIECE_STATS } from "../constants/gameRules"
import { STEP_MS } from "../game/BoardScene"

interface GameScreenProps {}

export const GameScreen: React.FC<GameScreenProps> = ({}) => {
    const navigate = useNavigate()
    const { t } = useLanguage()
    const { playerColor, setWinner } = useGame()

    const BOARD_SIZE = 20
    const CELL_SIZE = 64

    const initialPieces = useMemo<PieceDefinition[]>(() => {
        const mid = Math.floor(BOARD_SIZE / 2)
        const xs = [mid - 1, mid, mid + 1].map((x) => Math.max(0, Math.min(BOARD_SIZE - 1, x)))
        const topY = 0
        const bottomY = BOARD_SIZE - 1
        return [
            { id: "dA", color: "dark", type: "A", position: { x: xs[0], y: topY }, movedThisTurn: false, hp: MAX_HP, maxHp: MAX_HP },
            { id: "dB", color: "dark", type: "B", position: { x: xs[1], y: topY }, movedThisTurn: false, hp: MAX_HP, maxHp: MAX_HP },
            { id: "dC", color: "dark", type: "C", position: { x: xs[2], y: topY }, movedThisTurn: false, hp: MAX_HP, maxHp: MAX_HP },
            { id: "lA", color: "light", type: "A", position: { x: xs[0], y: bottomY }, movedThisTurn: false, hp: MAX_HP, maxHp: MAX_HP },
            { id: "lB", color: "light", type: "B", position: { x: xs[1], y: bottomY }, movedThisTurn: false, hp: MAX_HP, maxHp: MAX_HP },
            { id: "lC", color: "light", type: "C", position: { x: xs[2], y: bottomY }, movedThisTurn: false, hp: MAX_HP, maxHp: MAX_HP },
        ]
    }, [])

    const [pieces, setPieces] = useState<PieceDefinition[]>(initialPieces)
    const [turn, setTurn] = useState<PieceColor>("light")
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [highlighted, setHighlighted] = useState<PiecePosition[]>([])
    const [attackHighlighted, setAttackHighlighted] = useState<PiecePosition[]>([])
    const [infoModal, setInfoModal] = useState<{ open: boolean; piece?: PieceDefinition }>({ open: false })
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number
        mouseY: number
        position?: PiecePosition
        targetPiece?: PieceDefinition
    } | null>(null)

    const scrollRef = useRef<HTMLDivElement>(null)
    useEdgeScroll(scrollRef, { edgeSize: 80, maxSpeed: 20, enabled: contextMenu === null && !infoModal.open })

    const attackInProgressRef = useRef(false)
    const damageTimerRef = useRef<number | null>(null)
    useEffect(() => {
        return () => {
            if (damageTimerRef.current !== null) {
                clearTimeout(damageTimerRef.current)
                damageTimerRef.current = null
            }
        }
    }, [])

    // Centralizar visão nas peças no início do jogo
    useEffect(() => {
        const container = scrollRef.current
        if (!container) return

        const isLight = playerColor === "light"
        const mid = Math.floor(BOARD_SIZE / 2)
        const focusX = mid * CELL_SIZE + CELL_SIZE / 2
        const boardPx = BOARD_SIZE * CELL_SIZE
        const offsetX = (container.scrollWidth - boardPx) / 2

        container.scrollLeft = offsetX + focusX - container.clientWidth / 2
        container.scrollTop = isLight ? boardPx : 0
    }, [playerColor])

    const handleGameEnd = (winningColor: "light" | "dark") => {
        setWinner(winningColor)
        navigate("/end")
    }

    // IA move
    useEffect(() => {
        if (turn === playerColor || attackInProgressRef.current) return

        const timer = setTimeout(() => {
            const { updatedPieces, pendingDamage } = SimpleAI.makeMove(pieces, turn, BOARD_SIZE)
            setPieces(updatedPieces)

            if (pendingDamage) {
                attackInProgressRef.current = true
                damageTimerRef.current = window.setTimeout(() => {
                    setPieces((prev) =>
                        prev.map((p) => (p.id === pendingDamage.targetId ? { ...p, hp: p.hp - pendingDamage.damage } : p)).filter((p) => p.hp > 0),
                    )
                    attackInProgressRef.current = false
                    damageTimerRef.current = null
                }, pendingDamage.delayMs)
                return
            }

            // Verificar se todas as peças da IA se moveram
            const iaPieces = updatedPieces.filter((p) => p.color === turn)
            const allMoved = iaPieces.length > 0 && iaPieces.every((p) => p.movedThisTurn)

            if (allMoved) {
                endTurn()
            }
        }, 1000)

        return () => clearTimeout(timer)
    }, [turn, pieces, playerColor])

    // Atualizar células destacadas
    useEffect(() => {
        if (!selectedId) {
            setHighlighted([])
            setAttackHighlighted([])
            return
        }
        const p = pieces.find((x) => x.id === selectedId)
        if (!p) {
            setHighlighted([])
            setAttackHighlighted([])
            return
        }
        const stats = PIECE_STATS[p.type]
        setHighlighted(reachableCells(p, pieces, BOARD_SIZE, stats.moveRange))

        const attackCells: PiecePosition[] = []
        const r = stats.attackRange
        for (let dx = -r; dx <= r; dx++) {
            for (let dy = -r; dy <= r; dy++) {
                if ((dx === 0 && dy === 0) || Math.abs(dx) + Math.abs(dy) > r) continue
                const nx = p.position.x + dx
                const ny = p.position.y + dy
                if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) continue

                const pieceAtCell = pieces.find((pp) => pp.position.x === nx && pp.position.y === ny)
                if (pieceAtCell && !findApproachCell(p, pieceAtCell, pieces, BOARD_SIZE)) continue

                attackCells.push({ x: nx, y: ny })
            }
        }
        setAttackHighlighted(attackCells)
    }, [selectedId, pieces])

    // Detectar vitória
    useEffect(() => {
        const lights = pieces.filter((p) => p.color === "light").length
        const darks = pieces.filter((p) => p.color === "dark").length
        if (lights === 0) handleGameEnd("dark")
        if (darks === 0) handleGameEnd("light")
    }, [pieces, handleGameEnd])

    const endTurn = () => {
        const nextTurn = turn === "light" ? "dark" : "light"
        setPieces((prev) => prev.map((p) => ({ ...p, movedThisTurn: false })))
        setTurn(nextTurn)
        setSelectedId(null)
        setHighlighted([])
        setAttackHighlighted([])
    }

    const onCellClick = (pos: PiecePosition, left: boolean) => {
        if (turn !== playerColor) return

        const clickedPiece = pieces.find((p) => p.position.x === pos.x && p.position.y === pos.y)

        if (left) {
            if (!clickedPiece) {
                setSelectedId(null)
                return
            }
            const isOwnAndMoved = clickedPiece.color === playerColor && clickedPiece.movedThisTurn
            if (isOwnAndMoved) {
                setSelectedId(null)
                return
            }
            setSelectedId((prev) => (prev === clickedPiece.id ? null : clickedPiece.id))
        }
    }

    const onCellContextMenu = (event: React.MouseEvent, pos: PiecePosition) => {
        event.preventDefault()
        if (turn !== playerColor) return

        const targetPiece = pieces.find((p) => p.position.x === pos.x && p.position.y === pos.y)
        const selectedPiece = pieces.find((p) => p.id === selectedId)

        const isOwnSelection = !!selectedPiece && selectedPiece.color === playerColor
        const canInfo = !selectedId && targetPiece
        const canMove = isOwnSelection && !targetPiece && highlighted.some((h) => h.x === pos.x && h.y === pos.y)
        const canAttack =
            isOwnSelection &&
            targetPiece &&
            targetPiece.color !== selectedPiece!.color &&
            manhattan(selectedPiece!.position, targetPiece.position) <= PIECE_STATS[selectedPiece!.type].attackRange &&
            findApproachCell(selectedPiece!, targetPiece, pieces, BOARD_SIZE) !== null

        if (!canInfo && !canMove && !canAttack) return

        setContextMenu({
            mouseX: event.clientX,
            mouseY: event.clientY,
            position: pos,
            targetPiece,
        })
    }

    const handleCloseContextMenu = () => setContextMenu(null)

    const handleMove = () => {
        if (!selectedId || !contextMenu?.position) return

        setPieces((prev) => prev.map((p) => (p.id === selectedId ? { ...p, position: contextMenu.position!, movedThisTurn: true } : p)))
        setSelectedId(null)
        handleCloseContextMenu()
    }

    const handleAttack = () => {
        if (!selectedId || !contextMenu?.targetPiece) return

        const attacker = pieces.find((p) => p.id === selectedId)
        if (!attacker) return

        const target = contextMenu.targetPiece
        const damage = PIECE_STATS[attacker.type].attackDamage
        const approach = findApproachCell(attacker, target, pieces, BOARD_SIZE)
        const newPos = approach ?? attacker.position
        const moveSteps = manhattan(attacker.position, newPos)
        const delayMs = moveSteps * STEP_MS + 50
        const attackerId = attacker.id
        const targetId = target.id

        setPieces((prev) => prev.map((p) => (p.id === attackerId ? { ...p, position: newPos, movedThisTurn: true } : p)))
        setSelectedId(null)
        handleCloseContextMenu()

        window.setTimeout(() => {
            setPieces((prev) => prev.map((p) => (p.id === targetId ? { ...p, hp: p.hp - damage } : p)).filter((p) => p.hp > 0))
        }, delayMs)
    }

    const handleShowInfo = () => {
        setInfoModal({ open: true, piece: contextMenu?.targetPiece })
        handleCloseContextMenu()
    }

    const onEndTurn = () => {
        if (turn === playerColor) {
            endTurn()
        }
    }

    return (
        <Box
            sx={{
                width: "100vw",
                height: "100vh",
                bgcolor: "#000",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
            }}
        >
            <Box
                ref={scrollRef}
                sx={{
                    flex: 1,
                    overflow: "auto",
                    position: "relative",
                }}
            >
                <Box
                    sx={{
                        width: "fit-content",
                        minWidth: "100%",
                        minHeight: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        p: 2,
                        boxSizing: "border-box",
                    }}
                >
                    <Board
                        boardSize={BOARD_SIZE}
                        cellSize={CELL_SIZE}
                        pieces={pieces}
                        highlighted={highlighted}
                        attackHighlighted={attackHighlighted}
                        onCellClick={onCellClick}
                        selectedPieceId={selectedId}
                        onCellContextMenu={onCellContextMenu}
                    />
                </Box>
            </Box>
            <HUD turn={turn} onEndTurn={onEndTurn} onQuit={() => navigate("/")} playerColor={playerColor} />

            <Menu
                open={contextMenu !== null}
                onClose={handleCloseContextMenu}
                anchorReference="anchorPosition"
                anchorPosition={contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
            >
                {!selectedId && contextMenu?.targetPiece && <MenuItem onClick={handleShowInfo}>{t("info")}</MenuItem>}
                {selectedId && !contextMenu?.targetPiece && <MenuItem onClick={handleMove}>{t("move")}</MenuItem>}
                {selectedId && contextMenu?.targetPiece && contextMenu.targetPiece.color !== pieces.find((p) => p.id === selectedId)?.color && (
                    <MenuItem onClick={handleAttack}>{t("attack")}</MenuItem>
                )}
            </Menu>
            <Modal open={infoModal.open} onClose={() => setInfoModal({ open: false })}>
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 200,
                        bgcolor: "background.paper",
                        p: 2,
                    }}
                >
                    <Typography>
                        {t("team")}: {infoModal.piece?.color === "light" ? t("light") : t("dark")}
                    </Typography>
                    <Typography>
                        {t("type")}: {infoModal.piece?.type}
                    </Typography>
                    <Typography>
                        {t("hp")}: {infoModal.piece?.hp} / {infoModal.piece?.maxHp}
                    </Typography>
                    <Typography>
                        {t("moveRange")}: {infoModal.piece ? PIECE_STATS[infoModal.piece.type].moveRange : ""}
                    </Typography>
                    <Typography>
                        {t("attackRange")}: {infoModal.piece ? PIECE_STATS[infoModal.piece.type].attackRange : ""}
                    </Typography>
                    <Typography>
                        {t("attackPower")}: {infoModal.piece ? PIECE_STATS[infoModal.piece.type].attackDamage : ""}
                    </Typography>
                </Box>
            </Modal>
        </Box>
    )
}
