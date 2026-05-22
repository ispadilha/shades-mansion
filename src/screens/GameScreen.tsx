import React, { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Box, Menu, MenuItem, Modal, Typography } from "@mui/material"
import { Board } from "../components/Board"
import { HUD } from "../components/HUD"
import { InventoryModal } from "../components/InventoryModal"
import { ItemInfoModal } from "../components/ItemInfoModal"
import type { PieceDefinition, PieceColor, PiecePosition, SpecialItem, SpecialItemKey, Inventories, TextKey } from "../logic/types"
import { ALL_ITEM_KEYS, itemKeyColor } from "../logic/types"
import { reachableCells, manhattan, findApproachCell } from "../logic/movement"
import { SimpleAI } from "../logic/ai"
import { useGame } from "../hooks/useGame"
import { useLanguage } from "../hooks/useLanguage"
import { useEdgeScroll } from "../hooks/useEdgeScroll"
import { MAX_HP, PIECE_STATS } from "../constants/gameRules"
import { STEP_MS } from "../game/BoardScene"

const TURN_ORDER: PieceColor[] = ["light", "dark", "gray"]
const nextTurnColor = (turn: PieceColor): PieceColor => TURN_ORDER[(TURN_ORDER.indexOf(turn) + 1) % TURN_ORDER.length]

const COLOR_LABEL: Record<PieceColor, TextKey> = { light: "light", dark: "dark", gray: "gray" }
const MAX_LOG_ENTRIES = 100

// Espalha 2 cópias de cada item em casas aleatórias livres (sem peças e sem outros itens já colocados)
const placeItems = (boardSize: number, pieces: PieceDefinition[]): SpecialItem[] => {
    const occupied = new Set(pieces.map((p) => `${p.position.x},${p.position.y}`))
    const result: SpecialItem[] = []
    for (let copy = 0; copy < 2; copy++) {
        for (const key of ALL_ITEM_KEYS) {
            let pos: PiecePosition = { x: 0, y: 0 }
            for (let attempts = 0; attempts < 400; attempts++) {
                const x = Math.floor(Math.random() * boardSize)
                const y = Math.floor(Math.random() * boardSize)
                const k = `${x},${y}`
                if (!occupied.has(k)) {
                    pos = { x, y }
                    occupied.add(k)
                    break
                }
            }
            result.push({ id: `item-${key}-${copy}`, key, position: pos })
        }
    }
    return result
}

const BOARD_SIZE = 20
const CELL_SIZE = 64

interface GameScreenProps {}

export const GameScreen: React.FC<GameScreenProps> = ({}) => {
    const navigate = useNavigate()
    const { t } = useLanguage()
    const { playerColor, setWinner } = useGame()

    const initialPieces = useMemo<PieceDefinition[]>(() => {
        const mid = Math.floor(BOARD_SIZE / 2)
        const xs = [mid - 1, mid, mid + 1]
        const topY = 0
        const bottomY = BOARD_SIZE - 1
        const make = (id: string, color: PieceColor, type: "A" | "B" | "C", x: number, y: number): PieceDefinition => ({
            id, color, type, position: { x, y }, movedThisTurn: false, hp: MAX_HP, maxHp: MAX_HP,
        })
        return [
            make("dA", "dark", "A", xs[0], topY),
            make("dB", "dark", "B", xs[1], topY),
            make("dC", "dark", "C", xs[2], topY),
            make("gA", "gray", "A", xs[0], mid),
            make("gB", "gray", "B", xs[1], mid),
            make("gC", "gray", "C", xs[2], mid),
            make("lA", "light", "A", xs[0], bottomY),
            make("lB", "light", "B", xs[1], bottomY),
            make("lC", "light", "C", xs[2], bottomY),
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
    const [infoPiece, setInfoPiece] = useState<PieceDefinition | null>(null)
    const [itemInfoKey, setItemInfoKey] = useState<SpecialItemKey | null>(null)
    const [inventoryOpen, setInventoryOpen] = useState(false)
    const [manipulation, setManipulation] = useState<{ itemKey: SpecialItemKey } | null>(null)
    const [gameLog, setGameLog] = useState<string[]>([])
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number
        mouseY: number
        position?: PiecePosition
        targetPiece?: PieceDefinition
        itemAtPos?: SpecialItem
    } | null>(null)

    const scrollRef = useRef<HTMLDivElement>(null)
    useEdgeScroll(scrollRef, { edgeSize: 80, maxSpeed: 20, enabled: contextMenu === null && !infoPiece && !inventoryOpen })

    // Refs para sincronizar com tweens assíncronos (Phaser) e timeouts pendentes
    const attackInProgressRef = useRef(false)
    const damageTimerRef = useRef<number | null>(null)
    const healPhaseDoneRef = useRef<PieceColor | null>(null)
    const itemsRef = useRef(items)
    useEffect(() => {
        itemsRef.current = items
    }, [items])

    useEffect(() => {
        return () => {
            if (damageTimerRef.current !== null) clearTimeout(damageTimerRef.current)
        }
    }, [])

    // Ao entrar no jogo, posiciona a viewport perto da base do jogador
    useEffect(() => {
        const container = scrollRef.current
        if (!container) return
        const mid = Math.floor(BOARD_SIZE / 2)
        const boardPx = BOARD_SIZE * CELL_SIZE
        const offsetX = (container.scrollWidth - boardPx) / 2
        const focusX = mid * CELL_SIZE + CELL_SIZE / 2
        const focusY =
            playerColor === "light" ? boardPx :
            playerColor === "dark" ? 0 :
            mid * CELL_SIZE - CELL_SIZE * 4
        container.scrollLeft = offsetX + focusX - container.clientWidth / 2
        container.scrollTop = focusY
    }, [playerColor])

    // Histórico de jogadas: aceita novas entradas e descarta as mais antigas além de MAX_LOG_ENTRIES
    const addLog = (entry: string) => {
        setGameLog((prev) => [...prev.slice(-(MAX_LOG_ENTRIES - 1)), entry])
    }
    const teamLabel = (color: PieceColor) => t(COLOR_LABEL[color])
    // Formato: "{time} usaram {peça} para {ação} [{alvo}]"
    const logUsedTo = (color: PieceColor, piece: string, actionKey: TextKey, target?: string) => {
        const base = `${teamLabel(color)} ${t("verbUsed")} ${piece} ${t(actionKey)}`
        addLog(target ? `${base} ${target}` : base)
    }
    // Formato: "{time} manipularam {peça} para {ação} [{alvo}]"
    const logManipulatedTo = (color: PieceColor, piece: string, actionKey: TextKey, target?: string) => {
        const base = `${teamLabel(color)} ${t("verbManipulated")} ${piece} ${t(actionKey)}`
        addLog(target ? `${base} ${target}` : base)
    }
    const logHealed = (color: PieceColor, piece: string) => {
        addLog(`${teamLabel(color)} ${t("verbHealed")} ${piece}`)
    }
    // Eventos importantes:
    const logEliminated = (pieceId: string) => {
        addLog(`${pieceId} ${t("wasEliminated")}!`)
    }
    const logDefeated = (color: PieceColor) => {
        addLog(`${teamLabel(color)} ${t("wasDefeated")}!`)
    }

    // Retorna a chave de ação adequada (mover vs coletar) consultando se há item no destino
    const moveActionFor = (newPos: PiecePosition): { actionKey: TextKey; target?: string } => {
        const item = itemsRef.current.find((i) => i.position.x === newPos.x && i.position.y === newPos.y)
        return item ? { actionKey: "toCollectItem", target: item.key } : { actionKey: "toMove" }
    }

    // Coleta acontece após o tween da peça chegar na célula (delay = nº de passos × STEP_MS).
    // O log da coleta é registrado no ato da decisão (no callsite), não aqui.
    const schedulePickup = (color: PieceColor, position: PiecePosition, delayMs: number) => {
        const item = itemsRef.current.find((i) => i.position.x === position.x && i.position.y === position.y)
        if (!item) return
        window.setTimeout(() => {
            setItems((prev) => prev.filter((i) => i.id !== item.id))
            setInventories((prev) => ({ ...prev, [color]: [...prev[color], item.key] }))
        }, delayMs)
    }

    // Loop da IA: roda quando não é o turno do jogador. Executa uma ação por tick;
    // a mudança de state (pieces/inventories) reentra o efeito até o turno terminar.
    useEffect(() => {
        if (turn === playerColor) {
            healPhaseDoneRef.current = null
            return
        }
        if (attackInProgressRef.current) return

        // Fase de cura: cada time tenta curar suas peças feridas no início do turno (uma vez)
        if (healPhaseDoneRef.current !== turn) {
            const heal = SimpleAI.applyHeals(pieces, turn, inventories)
            healPhaseDoneRef.current = turn
            if (heal.healed) {
                for (const p of pieces) {
                    const after = heal.pieces.find((q) => q.id === p.id)
                    if (after && after.hp > p.hp) logHealed(turn, p.id)
                }
                setPieces(heal.pieces)
                setInventories(heal.inventories)
                return
            }
        }

        const timer = setTimeout(() => {
            const previousPieces = pieces
            const { updatedPieces, pendingDamage } = SimpleAI.makeMove(pieces, turn, BOARD_SIZE, items, inventories)
            setPieces(updatedPieces)

            // Identifica peça que mudou de posição neste tick (no máximo uma por chamada de makeMove)
            const movedPiece = updatedPieces.find((p) => {
                const old = previousPieces.find((q) => q.id === p.id)
                return old && (old.position.x !== p.position.x || old.position.y !== p.position.y)
            })

            if (movedPiece) {
                const old = previousPieces.find((q) => q.id === movedPiece.id)!
                const delayMs = manhattan(old.position, movedPiece.position) * STEP_MS + 50
                schedulePickup(movedPiece.color, movedPiece.position, delayMs)
            }

            if (pendingDamage) {
                // O dano só é aplicado depois que o tween de aproximação termina.
                // Manipulação (consumedItemKey presente) loga como "manipulou X para atacar Y"; ataque comum como "usou X para atacar Y".
                attackInProgressRef.current = true
                const dmg = pendingDamage
                if (dmg.consumedItemKey && dmg.consumerColor) {
                    logManipulatedTo(dmg.consumerColor, dmg.consumedItemKey, "toAttack", dmg.targetId)
                } else if (movedPiece) {
                    logUsedTo(turn, movedPiece.id, "toAttack", dmg.targetId)
                }
                damageTimerRef.current = window.setTimeout(() => {
                    setPieces((prev) =>
                        prev.map((p) => (p.id === dmg.targetId ? { ...p, hp: p.hp - dmg.damage } : p)).filter((p) => p.hp > 0),
                    )
                    if (dmg.consumedItemKey && dmg.consumerColor) {
                        const color = dmg.consumerColor
                        const key = dmg.consumedItemKey
                        setInventories((prev) => {
                            const inv = [...prev[color]]
                            const idx = inv.indexOf(key)
                            if (idx >= 0) inv.splice(idx, 1)
                            return { ...prev, [color]: inv }
                        })
                    }
                    attackInProgressRef.current = false
                    damageTimerRef.current = null
                }, dmg.delayMs)
                return
            }

            // Movimento puro (sem ataque pendente): loga mover ou coletar baseado no destino
            if (movedPiece) {
                const { actionKey, target } = moveActionFor(movedPiece.position)
                logUsedTo(turn, movedPiece.id, actionKey, target)
            }

            // Sem ações pendentes: se todas as peças da IA já se moveram, encerra o turno
            const teamPieces = updatedPieces.filter((p) => p.color === turn)
            if (teamPieces.length === 0 || teamPieces.every((p) => p.movedThisTurn)) endTurn()
        }, 1000)

        return () => clearTimeout(timer)
        // endTurn fecha sobre `turn` (que está nas deps), então closure sempre atualizada
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [turn, pieces, playerColor, inventories, items])

    // Recalcula células destacadas (movimento e ataque) sempre que a seleção muda
    useEffect(() => {
        if (!selectedId) {
            setHighlighted([])
            setAttackHighlighted([])
            return
        }
        const p = pieces.find((x) => x.id === selectedId)
        if (!p) return
        const stats = PIECE_STATS[p.type]
        setHighlighted(reachableCells(p, pieces, BOARD_SIZE, stats.moveRange))

        // Casas no alcance de ataque: vazias ou ocupadas com casa adjacente livre para aproximação
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

    // Se a peça manipulada morrer durante a manipulação, cancela e libera o jogador
    useEffect(() => {
        if (!manipulation) return
        if (!pieces.some((p) => p.id === manipulation.itemKey)) {
            setManipulation(null)
            setSelectedId(null)
        }
    }, [pieces, manipulation])

    // Detecta peças eliminadas (id desapareceu) e times derrotados (cor desapareceu) entre renders
    const prevPiecesRef = useRef(pieces)
    useEffect(() => {
        const prev = prevPiecesRef.current
        if (prev === pieces) return

        const currIds = new Set(pieces.map((p) => p.id))
        for (const p of prev) {
            if (!currIds.has(p.id)) logEliminated(p.id)
        }

        const prevColors = new Set(prev.map((p) => p.color))
        const currColors = new Set(pieces.map((p) => p.color))
        for (const c of prevColors) {
            if (!currColors.has(c)) logDefeated(c)
        }

        prevPiecesRef.current = pieces
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pieces])

    // Vitória: último time vivo no tabuleiro
    useEffect(() => {
        const alive = new Set(pieces.map((p) => p.color))
        if (alive.size !== 1) return
        const [winner] = alive
        setWinner(winner)
        navigate("/end")
    }, [pieces, navigate, setWinner])

    const endTurn = () => {
        setPieces((prev) => prev.map((p) => ({ ...p, movedThisTurn: false })))
        setTurn(nextTurnColor(turn))
        setSelectedId(null)
        setManipulation(null)
    }

    const onCellClick = (pos: PiecePosition) => {
        if (turn !== playerColor || manipulation) return
        const clickedPiece = pieces.find((p) => p.position.x === pos.x && p.position.y === pos.y)
        if (!clickedPiece) {
            setSelectedId(null)
            return
        }
        // Peças próprias já movidas neste turno não podem ser re-selecionadas
        if (clickedPiece.color === playerColor && clickedPiece.movedThisTurn) {
            setSelectedId(null)
            return
        }
        setSelectedId((prev) => (prev === clickedPiece.id ? null : clickedPiece.id))
    }

    const onCellContextMenu = (event: React.MouseEvent, pos: PiecePosition) => {
        if (turn !== playerColor) return

        const targetPiece = pieces.find((p) => p.position.x === pos.x && p.position.y === pos.y)
        const itemAtPos = items.find((i) => i.position.x === pos.x && i.position.y === pos.y)
        const selectedPiece = pieces.find((p) => p.id === selectedId)

        // Durante manipulação, a peça-alvo do item é tratada como "própria" para efeitos da ação
        const isManipulating = manipulation !== null
        const isOwnSelection =
            !!selectedPiece &&
            (selectedPiece.color === playerColor || (isManipulating && selectedPiece.id === manipulation.itemKey))
        const inMoveRange = highlighted.some((h) => h.x === pos.x && h.y === pos.y)

        const canInfo = !selectedId && !!targetPiece && !isManipulating
        const canItemInfo = !selectedId && !targetPiece && !!itemAtPos && !isManipulating
        const canMove = isOwnSelection && !targetPiece && !itemAtPos && inMoveRange
        const canCollect = isOwnSelection && !targetPiece && !!itemAtPos && inMoveRange
        // Ataque: durante manipulação, alvo pode ser de qualquer cor (exceto a própria peça manipulada)
        const canAttack =
            isOwnSelection &&
            !!targetPiece &&
            targetPiece.id !== selectedPiece!.id &&
            (isManipulating || targetPiece.color !== selectedPiece!.color) &&
            manhattan(selectedPiece!.position, targetPiece.position) <= PIECE_STATS[selectedPiece!.type].attackRange &&
            findApproachCell(selectedPiece!, targetPiece, pieces, BOARD_SIZE) !== null

        if (!canInfo && !canItemInfo && !canMove && !canCollect && !canAttack) return

        setContextMenu({ mouseX: event.clientX, mouseY: event.clientY, position: pos, targetPiece, itemAtPos })
    }

    const closeContextMenu = () => setContextMenu(null)

    // Remove o item do inventário e sai do modo manipulação (log já foi feito no callsite)
    const consumeManipulationItem = () => {
        if (!playerColor || !manipulation) return
        const key = manipulation.itemKey
        setInventories((prev) => {
            const inv = [...prev[playerColor]]
            const idx = inv.indexOf(key)
            if (idx >= 0) inv.splice(idx, 1)
            return { ...prev, [playerColor]: inv }
        })
        setManipulation(null)
    }

    const moveSelectedTo = (newPos: PiecePosition) => {
        if (!selectedId || !playerColor) return
        const piece = pieces.find((p) => p.id === selectedId)
        if (!piece) return
        const delayMs = manhattan(piece.position, newPos) * STEP_MS + 50
        const { actionKey, target } = moveActionFor(newPos)

        setPieces((prev) => prev.map((p) => (p.id === selectedId ? { ...p, position: newPos, movedThisTurn: true } : p)))
        schedulePickup(piece.color, newPos, delayMs)
        setSelectedId(null)
        closeContextMenu()

        if (manipulation) {
            logManipulatedTo(playerColor, piece.id, actionKey, target)
            consumeManipulationItem()
        } else {
            logUsedTo(playerColor, piece.id, actionKey, target)
        }
    }

    const handleMove = () => contextMenu?.position && moveSelectedTo(contextMenu.position)
    const handleCollect = () => contextMenu?.position && moveSelectedTo(contextMenu.position)

    const handleAttack = () => {
        if (!selectedId || !contextMenu?.targetPiece || !playerColor) return
        const attacker = pieces.find((p) => p.id === selectedId)
        if (!attacker) return

        const target = contextMenu.targetPiece
        const damage = PIECE_STATS[attacker.type].attackDamage
        const newPos = findApproachCell(attacker, target, pieces, BOARD_SIZE) ?? attacker.position
        const delayMs = manhattan(attacker.position, newPos) * STEP_MS + 50
        const targetId = target.id

        setPieces((prev) => prev.map((p) => (p.id === attacker.id ? { ...p, position: newPos, movedThisTurn: true } : p)))
        schedulePickup(attacker.color, newPos, delayMs)
        setSelectedId(null)
        closeContextMenu()

        if (manipulation) {
            logManipulatedTo(playerColor, attacker.id, "toAttack", targetId)
            consumeManipulationItem()
        } else {
            logUsedTo(playerColor, attacker.id, "toAttack", targetId)
        }

        // O dano só é aplicado quando o tween de aproximação termina (elimination/defeat são logados pelo efeito de pieces)
        window.setTimeout(() => {
            setPieces((prev) => prev.map((p) => (p.id === targetId ? { ...p, hp: p.hp - damage } : p)).filter((p) => p.hp > 0))
        }, delayMs)
    }

    const handleShowInfo = () => {
        setInfoPiece(contextMenu?.targetPiece ?? null)
        closeContextMenu()
    }

    const handleShowItemInfo = () => {
        if (!contextMenu?.itemAtPos) return
        setItemInfoKey(contextMenu.itemAtPos.key)
        closeContextMenu()
    }

    const handleUseHealItem = (key: SpecialItemKey) => {
        if (!playerColor || itemKeyColor(key) !== playerColor) return
        if (!inventories[playerColor].includes(key)) return
        const target = pieces.find((p) => p.id === key)
        if (!target || target.hp >= target.maxHp) return

        setPieces((prev) => prev.map((p) => (p.id === key ? { ...p, hp: p.maxHp } : p)))
        setInventories((prev) => {
            const inv = [...prev[playerColor]]
            const idx = inv.indexOf(key)
            if (idx >= 0) inv.splice(idx, 1)
            return { ...prev, [playerColor]: inv }
        })
        logHealed(playerColor, key)
    }

    const handleUseManipulationItem = (key: SpecialItemKey) => {
        if (!playerColor || turn !== playerColor) return
        if (itemKeyColor(key) === playerColor) return
        if (!inventories[playerColor].includes(key)) return
        if (!pieces.some((p) => p.id === key)) return

        // Entra no modo manipulação: a peça-alvo fica selecionada e o próximo move/attack consome o item
        setInventoryOpen(false)
        setManipulation({ itemKey: key })
        setSelectedId(key)
    }

    const cancelManipulation = () => {
        setManipulation(null)
        setSelectedId(null)
    }

    const labelForColor = (color: PieceColor) => t(COLOR_LABEL[color])
    const playerInventory = playerColor ? inventories[playerColor] : []
    const selectedPiece = selectedId ? pieces.find((p) => p.id === selectedId) : undefined

    return (
        <Box sx={{ width: "100vw", height: "100vh", bgcolor: "#000", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <Box ref={scrollRef} sx={{ flex: 1, overflow: "auto", position: "relative" }}>
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
                onEndTurn={() => turn === playerColor && endTurn()}
                onQuit={() => navigate("/")}
                playerColor={playerColor}
                onOpenInventory={() => setInventoryOpen(true)}
                inventoryCount={playerInventory.length}
                log={gameLog}
                manipulationKey={manipulation?.itemKey ?? null}
                onCancelManipulation={cancelManipulation}
            />

            <Menu
                open={contextMenu !== null}
                onClose={closeContextMenu}
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
                {selectedId &&
                    contextMenu?.targetPiece &&
                    contextMenu.targetPiece.id !== selectedId &&
                    (manipulation || contextMenu.targetPiece.color !== selectedPiece?.color) && (
                        <MenuItem onClick={handleAttack}>{t("attack")}</MenuItem>
                    )}
            </Menu>

            <Modal open={infoPiece !== null} onClose={() => setInfoPiece(null)}>
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
                    {infoPiece && (
                        <>
                            <Typography>{t("team")}: {labelForColor(infoPiece.color)}</Typography>
                            <Typography>{t("type")}: {infoPiece.type}</Typography>
                            <Typography>{t("hp")}: {infoPiece.hp} / {infoPiece.maxHp}</Typography>
                            <Typography>{t("moveRange")}: {PIECE_STATS[infoPiece.type].moveRange}</Typography>
                            <Typography>{t("attackRange")}: {PIECE_STATS[infoPiece.type].attackRange}</Typography>
                            <Typography>{t("attackPower")}: {PIECE_STATS[infoPiece.type].attackDamage}</Typography>
                        </>
                    )}
                </Box>
            </Modal>

            <ItemInfoModal
                open={itemInfoKey !== null}
                onClose={() => setItemInfoKey(null)}
                itemKey={itemInfoKey}
                playerColor={playerColor}
            />

            {playerColor && (
                <InventoryModal
                    open={inventoryOpen}
                    onClose={() => setInventoryOpen(false)}
                    inventory={playerInventory}
                    pieces={pieces}
                    playerColor={playerColor}
                    onUseHealItem={handleUseHealItem}
                    onUseManipulationItem={handleUseManipulationItem}
                />
            )}
        </Box>
    )
}
