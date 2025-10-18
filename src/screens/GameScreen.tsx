import React, { useEffect, useMemo, useState } from "react"
import { Box } from "@mui/material"
import { Board } from "../components/Board"
import { HUD } from "../components/HUD"
import type { PieceType, PieceColor, PiecePosition } from "../logic/types"
import { reachableCells, manhattan } from "../logic/movement"
import { SimpleAI } from "../logic/ai"

interface GameScreenProps {
    playerColor: PieceColor
    onGameEnd: (winner: PieceColor) => void
    onQuit: () => void
}

export const GameScreen: React.FC<GameScreenProps> = ({ playerColor, onGameEnd, onQuit }) => {
    const BOARD_SIZE = 20
    const CELL_SIZE = 64

    const initialPieces = useMemo<PieceType[]>(() => {
        const mid = Math.floor(BOARD_SIZE / 2)
        const xs = [mid - 1, mid, mid + 1].map((x) => Math.max(0, Math.min(BOARD_SIZE - 1, x)))
        const topY = 0
        const bottomY = BOARD_SIZE - 1
        return [
            { id: "b1", color: "dark", position: { x: xs[0], y: topY }, movedThisTurn: false },
            { id: "b2", color: "dark", position: { x: xs[1], y: topY }, movedThisTurn: false },
            { id: "b3", color: "dark", position: { x: xs[2], y: topY }, movedThisTurn: false },
            { id: "w1", color: "light", position: { x: xs[0], y: bottomY }, movedThisTurn: false },
            { id: "w2", color: "light", position: { x: xs[1], y: bottomY }, movedThisTurn: false },
            { id: "w3", color: "light", position: { x: xs[2], y: bottomY }, movedThisTurn: false },
        ]
    }, [])

    const [pieces, setPieces] = useState<PieceType[]>(initialPieces)
    const [turn, setTurn] = useState<PieceColor>("light")
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [highlighted, setHighlighted] = useState<PiecePosition[]>([])

    // IA move
    useEffect(() => {
        if (turn !== playerColor) {
            const timer = setTimeout(() => {
                const { updatedPieces } = SimpleAI.makeMove(pieces, turn, BOARD_SIZE)
                setPieces(updatedPieces)

                // Verificar se todas as peças da IA se moveram
                const iaPieces = updatedPieces.filter((p) => p.color === turn)
                const allMoved = iaPieces.length > 0 && iaPieces.every((p) => p.movedThisTurn)

                if (allMoved) {
                    endTurn()
                }
            }, 1000)

            return () => clearTimeout(timer)
        }
    }, [turn, pieces, playerColor])

    // Atualizar células destacadas
    useEffect(() => {
        if (!selectedId) {
            setHighlighted([])
            return
        }
        const p = pieces.find((x) => x.id === selectedId)
        if (!p) {
            setHighlighted([])
            return
        }
        setHighlighted(reachableCells(p, pieces, BOARD_SIZE, 5))
    }, [selectedId, pieces])

    // Detectar vitória
    useEffect(() => {
        const lights = pieces.filter((p) => p.color === "light").length
        const darks = pieces.filter((p) => p.color === "dark").length
        if (lights === 0) onGameEnd("dark")
        if (darks === 0) onGameEnd("light")
    }, [pieces, onGameEnd])

    const endTurn = () => {
        const nextTurn = turn === "light" ? "dark" : "light"
        setPieces((prev) => prev.map((p) => ({ ...p, movedThisTurn: false })))
        setTurn(nextTurn)
        setSelectedId(null)
        setHighlighted([])
    }

    const onCellClick = (pos: PiecePosition, left: boolean) => {
        // Ignorar cliques durante turno da IA
        if (turn !== playerColor) return

        const clickedPiece = pieces.find((p) => p.position.x === pos.x && p.position.y === pos.y)

        if (left) {
            // Clique esquerdo - selecionar ou mover
            if (clickedPiece && clickedPiece.color === playerColor && !clickedPiece.movedThisTurn) {
                setSelectedId((prev) => (prev === clickedPiece.id ? null : clickedPiece.id))
                return
            }

            if (selectedId) {
                const selectedPiece = pieces.find((p) => p.id === selectedId)
                if (!selectedPiece || selectedPiece.movedThisTurn) {
                    setSelectedId(null)
                    return
                }

                const canMove = highlighted.some((h) => h.x === pos.x && h.y === pos.y)
                const isOccupied = pieces.some((p) => p.position.x === pos.x && p.position.y === pos.y)

                if (canMove && !isOccupied) {
                    setPieces((prev) => prev.map((p) => (p.id === selectedId ? { ...p, position: pos, movedThisTurn: true } : p)))
                    setSelectedId(null)
                }
            }
        }
    }

    const onPieceRightClick = (targetId: string) => {
        // Ignorar durante turno da IA
        if (turn !== playerColor) return

        const target = pieces.find((p) => p.id === targetId)
        const selected = selectedId ? pieces.find((p) => p.id === selectedId) : undefined

        if (!target || !selected || selected.movedThisTurn) return
        if (selected.color === target.color) return

        // Verificar alcance
        if (manhattan(selected.position, target.position) <= 5) {
            setPieces((prev) => prev.filter((p) => p.id !== targetId).map((p) => (p.id === selectedId ? { ...p, movedThisTurn: true } : p)))
            setSelectedId(null)
        }
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
                sx={{
                    // flex: 1,
                    // display: "flex",
                    // alignItems: "center",
                    // justifyContent: "center",
                    overflow: "auto",
                    p: 2,
                    m: "auto",
                }}
            >
                <Board
                    boardSize={BOARD_SIZE}
                    cellSize={CELL_SIZE}
                    pieces={pieces}
                    highlighted={highlighted}
                    onCellClick={onCellClick}
                    onPieceRightClick={onPieceRightClick}
                    selectedPieceId={selectedId}
                />
            </Box>

            <HUD turn={turn} onEndTurn={onEndTurn} onQuit={onQuit} playerColor={playerColor} />
        </Box>
    )
}