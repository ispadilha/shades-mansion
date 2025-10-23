import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Box, Menu, MenuItem, Modal, Typography } from "@mui/material"
import { Board } from "../components/Board"
import { HUD } from "../components/HUD"
import type { PieceType, PieceColor, PiecePosition } from "../logic/types"
import { reachableCells } from "../logic/movement"
import { SimpleAI } from "../logic/ai"
import { useGame } from "../hooks/useGame"
import { useLanguage } from "../hooks/useLanguage"

interface GameScreenProps {}

export const GameScreen: React.FC<GameScreenProps> = ({}) => {
    const navigate = useNavigate()
    const { t } = useLanguage()
    const { playerColor, setWinner } = useGame()

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
    const [infoModal, setInfoModal] = useState<{ open: boolean; piece?: PieceType }>({ open: false })
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number
        mouseY: number
        position?: PiecePosition
        targetPiece?: PieceType
    } | null>(null)

    const handleGameEnd = (winningColor: "light" | "dark") => {
        setWinner(winningColor)
        navigate("/end")
    }

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
        if (lights === 0) handleGameEnd("dark")
        if (darks === 0) handleGameEnd("light")
    }, [pieces, handleGameEnd])

    const endTurn = () => {
        const nextTurn = turn === "light" ? "dark" : "light"
        setPieces((prev) => prev.map((p) => ({ ...p, movedThisTurn: false })))
        setTurn(nextTurn)
        setSelectedId(null)
        setHighlighted([])
    }

    const onCellClick = (pos: PiecePosition, left: boolean) => {
        if (turn !== playerColor) return

        const clickedPiece = pieces.find((p) => p.position.x === pos.x && p.position.y === pos.y)

        if (left) {
            if (clickedPiece && clickedPiece.color === playerColor && !clickedPiece.movedThisTurn) {
                setSelectedId((prev) => (prev === clickedPiece.id ? null : clickedPiece.id))
            } else {
                setSelectedId(null)
            }
        }
    }

    const onCellContextMenu = (event: React.MouseEvent, pos: PiecePosition) => {
        event.preventDefault()
        if (turn !== playerColor) return

        const targetPiece = pieces.find((p) => p.position.x === pos.x && p.position.y === pos.y)

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

        setPieces((prev) =>
            prev.filter((p) => p.id !== contextMenu.targetPiece!.id).map((p) => (p.id === selectedId ? { ...p, movedThisTurn: true } : p))
        )
        setSelectedId(null)
        handleCloseContextMenu()
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
                    selectedPieceId={selectedId}
                    onCellContextMenu={onCellContextMenu}
                />
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
                    <Typography>{t("range")}: 5</Typography>
                </Box>
            </Modal>
        </Box>
    )
}
