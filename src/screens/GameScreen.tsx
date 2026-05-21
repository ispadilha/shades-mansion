import React, { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Box, Menu, MenuItem, Modal, Typography } from "@mui/material"
import { Board } from "../components/Board"
import { HUD } from "../components/HUD"
import { InventoryModal } from "../components/InventoryModal"
import { ItemInfoModal } from "../components/ItemInfoModal"
import type { PieceDefinition, PieceColor, PiecePosition, SpecialItem, SpecialItemKey, Inventories } from "../logic/types"
import { ALL_ITEM_KEYS } from "../logic/types"
import { reachableCells, manhattan, findApproachCell } from "../logic/movement"
import { SimpleAI } from "../logic/ai"
import { useGame } from "../hooks/useGame"
import { useLanguage } from "../hooks/useLanguage"
import { useEdgeScroll } from "../hooks/useEdgeScroll"
import { MAX_HP, PIECE_STATS } from "../constants/gameRules"
import { STEP_MS } from "../game/BoardScene"

interface GameScreenProps {}

const nextTurnColor = (turn: PieceColor): PieceColor => (turn === "light" ? "dark" : turn === "dark" ? "gray" : "light")

const placeItems = (boardSize: number, pieces: PieceDefinition[]): SpecialItem[] => {
    const occupied = new Set(pieces.map((p) => `${p.position.x},${p.position.y}`))
    const result: SpecialItem[] = []
    for (let copy = 0; copy < 2; copy++) {
        for (const key of ALL_ITEM_KEYS) {
            let attempts = 0
            let pos: PiecePosition = { x: 0, y: 0 }
            while (attempts < 400) {
                const x = Math.floor(Math.random() * boardSize)
                const y = Math.floor(Math.random() * boardSize)
                const k = `${x},${y}`
                if (!occupied.has(k)) {
                    pos = { x, y }
                    occupied.add(k)
                    break
                }
                attempts++
            }
            result.push({ id: `item-${key}-${copy}`, key, position: pos })
        }
    }
    return result
}

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
            { id: "gA", color: "gray", type: "A", position: { x: xs[0], y: mid }, movedThisTurn: false, hp: MAX_HP, maxHp: MAX_HP },
            { id: "gB", color: "gray", type: "B", position: { x: xs[1], y: mid }, movedThisTurn: false, hp: MAX_HP, maxHp: MAX_HP },
            { id: "gC", color: "gray", type: "C", position: { x: xs[2], y: mid }, movedThisTurn: false, hp: MAX_HP, maxHp: MAX_HP },
            { id: "lA", color: "light", type: "A", position: { x: xs[0], y: bottomY }, movedThisTurn: false, hp: MAX_HP, maxHp: MAX_HP },
            { id: "lB", color: "light", type: "B", position: { x: xs[1], y: bottomY }, movedThisTurn: false, hp: MAX_HP, maxHp: MAX_HP },
            { id: "lC", color: "light", type: "C", position: { x: xs[2], y: bottomY }, movedThisTurn: false, hp: MAX_HP, maxHp: MAX_HP },
        ]
    }, [])

    const initialItems = useMemo<SpecialItem[]>(() => placeItems(BOARD_SIZE, initialPieces), [initialPieces])

    const [pieces, setPieces] = useState<PieceDefinition[]>(initialPieces)
    const [items, setItems] = useState<SpecialItem[]>(initialItems)
    const [inventories, setInventories] = useState<Inventories>({ light: [], dark: [], gray: [] })
    const [turn, setTurn] = useState<PieceColor>("light")
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [highlighted, setHighlighted] = useState<PiecePosition[]>([])
    const [attackHighlighted, setAttackHighlighted] = useState<PiecePosition[]>([])
    const [infoModal, setInfoModal] = useState<{ open: boolean; piece?: PieceDefinition }>({ open: false })
    const [itemInfoKey, setItemInfoKey] = useState<SpecialItemKey | null>(null)
    const [inventoryOpen, setInventoryOpen] = useState(false)
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number
        mouseY: number
        position?: PiecePosition
        targetPiece?: PieceDefinition
        itemAtPos?: SpecialItem
    } | null>(null)

    const scrollRef = useRef<HTMLDivElement>(null)
    useEdgeScroll(scrollRef, { edgeSize: 80, maxSpeed: 20, enabled: contextMenu === null && !infoModal.open && !inventoryOpen })

    const attackInProgressRef = useRef(false)
    const damageTimerRef = useRef<number | null>(null)
    const healPhaseDoneRef = useRef<PieceColor | null>(null)

    const itemsRef = useRef(items)
    useEffect(() => {
        itemsRef.current = items
    }, [items])

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

    const handleGameEnd = (winningColor: PieceColor) => {
        setWinner(winningColor)
        navigate("/end")
    }

    // Agendar coleta para acontecer após a peça chegar na célula (casado com o tween)
    const schedulePickup = (color: PieceColor, position: PiecePosition, delayMs: number) => {
        const item = itemsRef.current.find((i) => i.position.x === position.x && i.position.y === position.y)
        if (!item) return
        window.setTimeout(() => {
            setItems((prev) => prev.filter((i) => i.id !== item.id))
            setInventories((prev) => ({ ...prev, [color]: [...prev[color], item.key] }))
        }, delayMs)
    }

    // IA move
    useEffect(() => {
        if (turn === playerColor) {
            healPhaseDoneRef.current = null
            return
        }
        if (attackInProgressRef.current) return

        // Fase de cura (uma vez por turno, qualquer time)
        if (healPhaseDoneRef.current !== turn) {
            const heal = SimpleAI.applyHeals(pieces, turn, inventories)
            healPhaseDoneRef.current = turn
            if (heal.healed) {
                setPieces(heal.pieces)
                setInventories(heal.inventories)
                return
            }
        }

        const timer = setTimeout(() => {
            const previousPieces = pieces
            const { updatedPieces, pendingDamage, pendingRecruit } = SimpleAI.makeMove(pieces, turn, BOARD_SIZE, items, inventories)
            setPieces(updatedPieces)

            // Detectar peça que se moveu e agendar coleta de item, se houver
            for (const newP of updatedPieces) {
                const oldP = previousPieces.find((p) => p.id === newP.id)
                if (!oldP) continue
                if (oldP.position.x === newP.position.x && oldP.position.y === newP.position.y) continue
                const moveSteps = manhattan(oldP.position, newP.position)
                const delayMs = moveSteps * STEP_MS + 50
                schedulePickup(newP.color, newP.position, delayMs)
            }

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

            if (pendingRecruit) {
                attackInProgressRef.current = true
                const recruitData = pendingRecruit
                damageTimerRef.current = window.setTimeout(() => {
                    setPieces((prev) =>
                        prev.map((p) =>
                            p.id === recruitData.targetId
                                ? { ...p, color: recruitData.recruiter, recruitedFrom: "gray", movedThisTurn: true }
                                : p,
                        ),
                    )
                    setInventories((prev) => {
                        const newTeamInv = [...prev[recruitData.recruiter]]
                        const idx = newTeamInv.indexOf(recruitData.consumedItemKey)
                        if (idx >= 0) newTeamInv.splice(idx, 1)
                        return { ...prev, [recruitData.recruiter]: newTeamInv }
                    })
                    attackInProgressRef.current = false
                    damageTimerRef.current = null
                }, recruitData.delayMs)
                return
            }

            const teamPieces = updatedPieces.filter((p) => p.color === turn)
            const allMoved = teamPieces.length > 0 && teamPieces.every((p) => p.movedThisTurn)
            const noMoves = teamPieces.length === 0

            if (allMoved || noMoves) {
                endTurn()
            }
        }, 1000)

        return () => clearTimeout(timer)
    }, [turn, pieces, playerColor, inventories, items])

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

    // Detectar vitória: último time vivo
    useEffect(() => {
        const lights = pieces.filter((p) => p.color === "light").length
        const darks = pieces.filter((p) => p.color === "dark").length
        const grays = pieces.filter((p) => p.color === "gray").length
        const alive = [lights, darks, grays].filter((c) => c > 0).length
        if (alive > 1) return
        if (lights > 0) handleGameEnd("light")
        else if (darks > 0) handleGameEnd("dark")
        else if (grays > 0) handleGameEnd("gray")
    }, [pieces, handleGameEnd])

    const endTurn = () => {
        const next = nextTurnColor(turn)
        setPieces((prev) => prev.map((p) => ({ ...p, movedThisTurn: false })))
        setTurn(next)
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

    const hasRecruitItemFor = (target: PieceDefinition) => {
        if (!playerColor) return false
        if (target.color !== "gray") return false
        return inventories[playerColor].includes(target.id as SpecialItemKey)
    }

    const onCellContextMenu = (event: React.MouseEvent, pos: PiecePosition) => {
        event.preventDefault()
        if (turn !== playerColor) return

        const targetPiece = pieces.find((p) => p.position.x === pos.x && p.position.y === pos.y)
        const itemAtPos = items.find((i) => i.position.x === pos.x && i.position.y === pos.y)
        const selectedPiece = pieces.find((p) => p.id === selectedId)

        const isOwnSelection = !!selectedPiece && selectedPiece.color === playerColor
        const inMoveRange = highlighted.some((h) => h.x === pos.x && h.y === pos.y)
        const canInfo = !selectedId && targetPiece
        const canItemInfo = !selectedId && !targetPiece && !!itemAtPos
        const canMove = isOwnSelection && !targetPiece && !itemAtPos && inMoveRange
        const canCollect = isOwnSelection && !targetPiece && !!itemAtPos && inMoveRange
        const inAttackRange =
            isOwnSelection &&
            targetPiece &&
            targetPiece.color !== selectedPiece!.color &&
            manhattan(selectedPiece!.position, targetPiece.position) <= PIECE_STATS[selectedPiece!.type].attackRange &&
            findApproachCell(selectedPiece!, targetPiece, pieces, BOARD_SIZE) !== null
        const canAttack = inAttackRange
        const canRecruit = inAttackRange && hasRecruitItemFor(targetPiece!)

        if (!canInfo && !canItemInfo && !canMove && !canCollect && !canAttack && !canRecruit) return

        setContextMenu({
            mouseX: event.clientX,
            mouseY: event.clientY,
            position: pos,
            targetPiece,
            itemAtPos,
        })
    }

    const handleCloseContextMenu = () => setContextMenu(null)

    const moveSelectedTo = (newPos: PiecePosition) => {
        if (!selectedId) return
        const piece = pieces.find((p) => p.id === selectedId)
        if (!piece) return
        const moveSteps = manhattan(piece.position, newPos)
        const delayMs = moveSteps * STEP_MS + 50

        setPieces((prev) => prev.map((p) => (p.id === selectedId ? { ...p, position: newPos, movedThisTurn: true } : p)))
        schedulePickup(piece.color, newPos, delayMs)
        setSelectedId(null)
        handleCloseContextMenu()
    }

    const handleMove = () => {
        if (!contextMenu?.position) return
        moveSelectedTo(contextMenu.position)
    }

    const handleCollect = () => {
        if (!contextMenu?.position) return
        moveSelectedTo(contextMenu.position)
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
        schedulePickup(attacker.color, newPos, delayMs)
        setSelectedId(null)
        handleCloseContextMenu()

        window.setTimeout(() => {
            setPieces((prev) => prev.map((p) => (p.id === targetId ? { ...p, hp: p.hp - damage } : p)).filter((p) => p.hp > 0))
        }, delayMs)
    }

    const handleRecruit = () => {
        if (!selectedId || !contextMenu?.targetPiece || !playerColor) return

        const recruiter = pieces.find((p) => p.id === selectedId)
        if (!recruiter) return

        const target = contextMenu.targetPiece
        if (target.color !== "gray") return

        const itemKey = target.id as SpecialItemKey
        if (!inventories[playerColor].includes(itemKey)) return

        const approach = findApproachCell(recruiter, target, pieces, BOARD_SIZE)
        const newPos = approach ?? recruiter.position
        const moveSteps = manhattan(recruiter.position, newPos)
        const delayMs = moveSteps * STEP_MS + 50
        const recruiterId = recruiter.id
        const targetId = target.id
        const newColor = playerColor

        setPieces((prev) => prev.map((p) => (p.id === recruiterId ? { ...p, position: newPos, movedThisTurn: true } : p)))
        schedulePickup(recruiter.color, newPos, delayMs)
        setSelectedId(null)
        handleCloseContextMenu()

        window.setTimeout(() => {
            setPieces((prev) =>
                prev.map((p) =>
                    p.id === targetId ? { ...p, color: newColor, recruitedFrom: "gray", movedThisTurn: true } : p,
                ),
            )
            setInventories((prev) => {
                const newTeamInv = [...prev[newColor]]
                const idx = newTeamInv.indexOf(itemKey)
                if (idx >= 0) newTeamInv.splice(idx, 1)
                return { ...prev, [newColor]: newTeamInv }
            })
        }, delayMs)
    }

    const handleShowInfo = () => {
        setInfoModal({ open: true, piece: contextMenu?.targetPiece })
        handleCloseContextMenu()
    }

    const handleShowItemInfo = () => {
        if (!contextMenu?.itemAtPos) return
        setItemInfoKey(contextMenu.itemAtPos.key)
        handleCloseContextMenu()
    }

    const handleUseHealItem = (key: SpecialItemKey) => {
        if (!playerColor) return
        if (!inventories[playerColor].includes(key)) return
        const target = pieces.find((p) => p.id === key)
        if (!target || target.color !== playerColor || target.hp >= target.maxHp) return

        setPieces((prev) => prev.map((p) => (p.id === key ? { ...p, hp: p.maxHp } : p)))
        setInventories((prev) => {
            const newTeamInv = [...prev[playerColor]]
            const idx = newTeamInv.indexOf(key)
            if (idx >= 0) newTeamInv.splice(idx, 1)
            return { ...prev, [playerColor]: newTeamInv }
        })
    }

    const onEndTurn = () => {
        if (turn === playerColor) {
            endTurn()
        }
    }

    const labelForColor = (color: PieceColor) => (color === "light" ? t("light") : color === "dark" ? t("dark") : t("gray"))

    const playerInventory = playerColor ? inventories[playerColor] : []

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
                        items={items}
                        highlighted={highlighted}
                        attackHighlighted={attackHighlighted}
                        onCellClick={onCellClick}
                        selectedPieceId={selectedId}
                        onCellContextMenu={onCellContextMenu}
                    />
                </Box>
            </Box>
            <HUD
                turn={turn}
                onEndTurn={onEndTurn}
                onQuit={() => navigate("/")}
                playerColor={playerColor}
                onOpenInventory={() => setInventoryOpen(true)}
                inventoryCount={playerInventory.length}
            />

            <Menu
                open={contextMenu !== null}
                onClose={handleCloseContextMenu}
                anchorReference="anchorPosition"
                anchorPosition={contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
            >
                {!selectedId && contextMenu?.targetPiece && <MenuItem onClick={handleShowInfo}>{t("info")}</MenuItem>}
                {!selectedId && !contextMenu?.targetPiece && contextMenu?.itemAtPos && (
                    <MenuItem onClick={handleShowItemInfo}>{t("info")}</MenuItem>
                )}
                {selectedId && !contextMenu?.targetPiece && !contextMenu?.itemAtPos && (
                    <MenuItem onClick={handleMove}>{t("move")}</MenuItem>
                )}
                {selectedId && !contextMenu?.targetPiece && contextMenu?.itemAtPos && (
                    <MenuItem onClick={handleCollect}>{t("collect")}</MenuItem>
                )}
                {selectedId && contextMenu?.targetPiece && contextMenu.targetPiece.color !== pieces.find((p) => p.id === selectedId)?.color && (
                    <MenuItem onClick={handleAttack}>{t("attack")}</MenuItem>
                )}
                {selectedId &&
                    contextMenu?.targetPiece &&
                    contextMenu.targetPiece.color === "gray" &&
                    hasRecruitItemFor(contextMenu.targetPiece) && <MenuItem onClick={handleRecruit}>{t("recruit")}</MenuItem>}
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
                        {t("team")}: {infoModal.piece ? labelForColor(infoModal.piece.color) : ""}
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
            <ItemInfoModal open={itemInfoKey !== null} onClose={() => setItemInfoKey(null)} itemKey={itemInfoKey} />
            {playerColor && (
                <InventoryModal
                    open={inventoryOpen}
                    onClose={() => setInventoryOpen(false)}
                    inventory={playerInventory}
                    pieces={pieces}
                    playerColor={playerColor}
                    onUseHealItem={handleUseHealItem}
                />
            )}
        </Box>
    )
}
