import React, { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Box, Menu, MenuItem, Modal, Typography } from "@mui/material"
import { Board } from "../components/Board"
import { HUD } from "../components/HUD"
import { InventoryModal } from "../components/InventoryModal"
import { ItemInfoModal } from "../components/ItemInfoModal"
import { RollModal, type RollView } from "../components/rolls"
import type { PieceDefinition, PieceColor, PiecePosition, SpecialItem, SpecialItemKey, Inventories, TextKey } from "../logic/types"
import { itemKeyColor, controlledColorsFor } from "../logic/types"
import { reachableCells, pathLength, findApproachCell, lineOfFire, meleeAttackCells } from "../logic/movement"
import { nextTurnIndex } from "../logic/initiative"
import {
    areaCells,
    attackArea,
    piecesInCells,
    rollAttack,
    rollManipulation,
    type FireBurst,
    type PendingAttack,
} from "../logic/combat"
import type { MatchSetup } from "../logic/setup"
import { SimpleAI } from "../logic/ai"
import { useGame } from "../hooks/useGame"
import { useLanguage } from "../hooks/useLanguage"
import { useEdgeScroll } from "../hooks/useEdgeScroll"
import { CELL_SIZE, FIRE_AREA_SIDE, PIECE_STATS, isAreaAttack, isRanged } from "../constants/gameRules"
import { UI_PALETTE } from "../constants/palette"
import { STEP_MS, type PieceAuras } from "../game/BoardScene"

const COLOR_LABEL: Record<PieceColor, TextKey> = { light: "light", dark: "dark", gray: "gray" }
const MAX_LOG_ENTRIES = 100
// Intervalo entre as decisões da IA
const AI_STEP_MS = 1000
// Espera antes de a IA passar a vez depois de já ter agido
const AI_END_TURN_MS = 600
// Explosões de fogo guardadas no estado (só para a cena não reanimar as antigas)
const MAX_FIRE_BURSTS = 8

interface GameScreenProps {}

// A partida é montada na tela de iniciativa (labirinto, peças, itens e ordem dos turnos).
// Sem isso não há o que jogar e volta para a escolha de times.
export const GameScreen: React.FC<GameScreenProps> = ({}) => {
    const navigate = useNavigate()
    const { match } = useGame()

    useEffect(() => {
        if (!match) navigate("/choose-side", { replace: true })
    }, [match, navigate])

    if (!match) return null
    return <MatchScreen match={match} />
}

interface MatchScreenProps {
    match: MatchSetup
}

const MatchScreen: React.FC<MatchScreenProps> = ({ match }) => {
    const navigate = useNavigate()
    const { t } = useLanguage()
    const { selection, setWinner } = useGame()

    const { maze, turnOrder } = match

    // Times sob comando do jogador: um só, os três (multi-jogador local) ou nenhum (assistindo)
    const controlledColors = useMemo(() => controlledColorsFor(selection), [selection])
    const spectating = controlledColors.length === 0

    const [pieces, setPieces] = useState<PieceDefinition[]>(match.pieces)
    const [items, setItems] = useState<SpecialItem[]>(match.items)
    const [inventories, setInventories] = useState<Inventories>({ light: [], dark: [], gray: [] })
    const [turnIndex, setTurnIndex] = useState(0)
    const [round, setRound] = useState(1)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [highlighted, setHighlighted] = useState<PiecePosition[]>([])
    const [attackHighlighted, setAttackHighlighted] = useState<PiecePosition[]>([])
    // Explosões de fogo já resolvidas, para a cena animar (o tabuleiro ignora as repetidas)
    const [fireBursts, setFireBursts] = useState<FireBurst[]>([])
    const [infoPiece, setInfoPiece] = useState<PieceDefinition | null>(null)
    const [itemInfoKey, setItemInfoKey] = useState<SpecialItemKey | null>(null)
    const [inventoryOpen, setInventoryOpen] = useState(false)
    const [manipulation, setManipulation] = useState<{ itemKey: SpecialItemKey } | null>(null)
    // Peça sob manipulação, do lançamento da moeda até a ação forçada acabar: é ela que a
    // câmera segue e quem ganha a aura de manipulação
    const [manipulatedId, setManipulatedId] = useState<string | null>(null)
    // Instante até o qual a câmera fica presa nela mesmo sem rolagem em andamento: é o caso
    // do mover forçado, que só tem a caminhada para mostrar
    const [focusHeldUntil, setFocusHeldUntil] = useState(0)
    const [gameLog, setGameLog] = useState<string[]>([])
    // Rolagem em andamento
    const [roll, setRoll] = useState<RollView | null>(null)
    // Uma rolagem em resolução trava a IA e os controles até terminar
    const [resolvingRoll, setResolvingRoll] = useState(false)
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number
        mouseY: number
        position?: PiecePosition
        targetPiece?: PieceDefinition
        itemAtPos?: SpecialItem
    } | null>(null)

    // Peça da vez e o que ela permite ao jogador. `activeColor` é null quando quem age
    // é a IA (ou quando o jogador só assiste).
    const activePiece = pieces.find((p) => p.id === turnOrder[turnIndex]) ?? null
    const isPlayerTurn = activePiece !== null && controlledColors.includes(activePiece.color)
    const activeColor = isPlayerTurn ? activePiece!.color : null
    // Inventário exibido no HUD: quem comanda um único time consulta o seu a qualquer momento
    // (inclusive para curar durante o turno da IA); no multi-jogador local é sempre o do time da vez.
    const inventoryColor = controlledColors.length === 1 ? controlledColors[0] : activeColor
    // Peças vivas na ordem de iniciativa, para a faixa de turnos do HUD
    const orderedPieces = turnOrder.map((id) => pieces.find((p) => p.id === id)).filter((p): p is PieceDefinition => !!p)

    // Rolagem de time comandado por jogador espera o clique no dado;
    // as de times comandados por IA rolam automaticamente.
    const isManualRoll = (color: PieceColor) => controlledColors.includes(color)

    const scrollRef = useRef<HTMLDivElement>(null)
    useEdgeScroll(scrollRef, {
        edgeSize: 80,
        maxSpeed: 20,
        enabled: contextMenu === null && !infoPiece && !inventoryOpen && roll === null,
    })

    // Refs para sincronizar com tweens assíncronos (Phaser) e timeouts pendentes
    const damageTimerRef = useRef<number | null>(null)
    const healPhaseDoneRef = useRef<string | null>(null)
    const rollDoneRef = useRef<(() => void) | null>(null)
    const itemsRef = useRef(items)
    useEffect(() => {
        itemsRef.current = items
    }, [items])

    useEffect(() => {
        return () => {
            if (damageTimerRef.current !== null) clearTimeout(damageTimerRef.current)
        }
    }, [])

    // Câmera: começa perto da base do jogador (quem comanda todos os times ou só assiste
    // não tem base própria e começa no meio do tabuleiro) e depois acompanha a peça da vez.
    const focusColor = controlledColors.length === 1 ? controlledColors[0] : null
    useEffect(() => {
        const container = scrollRef.current
        if (!container) return
        const mid = Math.floor(maze.size / 2)
        const boardPx = maze.size * CELL_SIZE
        const offsetX = (container.scrollWidth - boardPx) / 2
        const focusX = mid * CELL_SIZE + CELL_SIZE / 2
        const focusY =
            focusColor === "light" ? boardPx :
            focusColor === "dark" ? 0 :
            mid * CELL_SIZE - CELL_SIZE * 4
        container.scrollLeft = offsetX + focusX - container.clientWidth / 2
        container.scrollTop = focusY
    }, [focusColor, maze])

    // Com os turnos indo peça a peça, a ação pode acontecer em qualquer canto do labirinto:
    // a viewport segue quem está agindo.
    // Uma manipulação rouba esse foco: quem age é a peça manipulada.
    const focusPieceId = manipulatedId ?? activePiece?.id ?? null
    const focusPiece = pieces.find((p) => p.id === focusPieceId)
    // O que faz a câmera se mexer. Em um turno comum é só a troca da peça da vez. Seguir
    // cada jogada brigaria com a rolagem manual do jogador. Durante uma manipulação a
    // casa entra na conta e a câmera vai junto.
    const focusKey = manipulatedId
        ? `${focusPieceId}:${focusPiece?.position.x},${focusPiece?.position.y}`
        : focusPieceId

    useEffect(() => {
        const container = scrollRef.current
        if (!container || !focusPiece) return

        const offsetX = (container.scrollWidth - maze.size * CELL_SIZE) / 2
        container.scrollTo({
            left: offsetX + focusPiece.position.x * CELL_SIZE + CELL_SIZE / 2 - container.clientWidth / 2,
            top: focusPiece.position.y * CELL_SIZE + CELL_SIZE / 2 - container.clientHeight / 2,
            behavior: "smooth",
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focusKey, maze])

    // Devolve o foco à peça da vez quando a manipulação se encerra: a peça manipulada saiu
    // do comando (resistiu a manipulação, ou já fez a ação forçada) e não há mais rolagem
    // para acompanhar. Enquanto a moeda de manipulação ou a de ataque estiver em jogo,
    // `resolvingRoll` segura a câmera onde a ação está acontecendo.
    useEffect(() => {
        if (!manipulatedId || manipulation || resolvingRoll) return

        const remaining = focusHeldUntil - Date.now()
        if (remaining <= 0) {
            setManipulatedId(null)
            return
        }

        const timer = window.setTimeout(() => setManipulatedId(null), remaining)
        return () => clearTimeout(timer)
    }, [manipulatedId, manipulation, resolvingRoll, focusHeldUntil])

    // Histórico de jogadas: aceita novas entradas e descarta as mais antigas além de MAX_LOG_ENTRIES
    const addLog = (entry: string) => {
        setGameLog((prev) => [...prev.slice(-(MAX_LOG_ENTRIES - 1)), entry])
    }
    const teamLabel = (color: PieceColor) => t(COLOR_LABEL[color])
    // Formato: "{time} usou {peça} para {ação} [{alvo}]".
    // Movimento simples é a exceção: "{time} moveu {peça}".
    const logUsedTo = (color: PieceColor, piece: string, actionKey: TextKey, target?: string) => {
        if (actionKey === "toMove") {
            addLog(`${teamLabel(color)} ${t("verbMoved")} ${piece}`)
            return
        }
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
    // Resultado da moeda de ataque
    const logAttackRoll = (attackerId: string, targetId: string, hit: boolean) => {
        addLog(`${attackerId} ${t(hit ? "verbHit" : "verbMissed")} ${targetId}`)
    }
    // Peças pegas de tabela pelo fogo do ataque em área (o alvo principal já entrou no
    // log pela moeda de ataque)
    const logBurned = (pieceIds: string[]) => {
        for (const id of pieceIds) addLog(`${id} ${t("wasBurned")}`)
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

    const removeFromInventory = (color: PieceColor, key: SpecialItemKey) => {
        setInventories((prev) => {
            const inv = [...prev[color]]
            const idx = inv.indexOf(key)
            if (idx >= 0) inv.splice(idx, 1)
            return { ...prev, [color]: inv }
        })
    }

    // Mostra uma rolagem no modal e devolve o controle a quem pediu quando ela termina
    const showRoll = (view: RollView, onDone: () => void) => {
        rollDoneRef.current = onDone
        setRoll(view)
    }

    const finishRoll = () => {
        const done = rollDoneRef.current
        rollDoneRef.current = null
        setRoll(null)
        done?.()
    }

    // Toda tentativa de ataque (do jogador, da IA ou vinda de uma manipulação) passa por aqui:
    const resolveAttack = (attack: PendingAttack) => {
        const rollerColor = attack.consumerColor ?? pieces.find((p) => p.id === attack.attackerId)?.color ?? null
        setResolvingRoll(true)
        damageTimerRef.current = window.setTimeout(() => {
            damageTimerRef.current = null
            const { face, success } = rollAttack()

            showRoll(
                {
                    id: `attack-${attack.attackerId}-${attack.targetId}-${Date.now()}`,
                    kind: "coin",
                    value: face,
                    title: t("attackRoll"),
                    subtitle: `${attack.attackerId} → ${attack.targetId}`,
                    outcome: { label: success ? t("attackHit") : t("attackMiss"), tone: success ? "good" : "bad" },
                    manual: rollerColor !== null && isManualRoll(rollerColor),
                },
                () => {
                    if (success) {
                        // O fogo pega todo mundo que estiver nas casas em chamas.
                        // As casas e quem está nelas são decididas
                        // agora, com as posições atuais.
                        const burning = attack.area ? areaCells(maze, attack.area.center, attack.area.side) : []
                        const burned = piecesInCells(pieces, burning)
                            .filter((p) => p.id !== attack.targetId)
                            .map((p) => p.id)
                        const hit = new Set([attack.targetId, ...burned])

                        setPieces((prev) =>
                            prev
                                .map((p) => (hit.has(p.id) ? { ...p, hp: p.hp - attack.damage } : p))
                                .filter((p) => p.hp > 0),
                        )
                        if (attack.area) {
                            const { center } = attack.area
                            setFireBursts((prev) => [
                                ...prev.slice(-MAX_FIRE_BURSTS + 1),
                                { id: `fire-${attack.attackerId}-${Date.now()}`, center, cells: burning },
                            ])
                        }
                        logAttackRoll(attack.attackerId, attack.targetId, success)
                        logBurned(burned)
                        setResolvingRoll(false)
                        return
                    }
                    logAttackRoll(attack.attackerId, attack.targetId, success)
                    setResolvingRoll(false)
                },
            )
        }, attack.delayMs)
    }

    // Tentativa de manipulação: o item já foi gasto por quem usou, e a moeda decide se a
    // peça obedece. Devolve o resultado a quem chamou depois de encenar a rolagem.
    const resolveManipulation = (color: PieceColor, itemKey: SpecialItemKey, onSettled: (success: boolean) => void) => {
        const { face, success } = rollManipulation()
        setResolvingRoll(true)
        setManipulatedId(itemKey)
        showRoll(
            {
                id: `manipulation-${itemKey}-${Date.now()}`,
                kind: "coin",
                value: face,
                title: t("manipulationRoll"),
                subtitle: itemKey,
                outcome: {
                    label: success ? t("manipulationWorked") : t("manipulationFailed"),
                    tone: success ? "good" : "bad",
                },
                manual: isManualRoll(color),
            },
            () => {
                addLog(`${itemKey} ${t(success ? "verbFellUnderManipulation" : "verbResistedManipulation")}`)
                setResolvingRoll(false)
                onSettled(success)
            },
        )
    }

    // Turno de IA: roda para a peça da vez sempre que ela for de um time que o jogador não
    // comanda. Executa uma ação por tick; a mudança de state reentra o efeito até a peça
    // encerrar o turno. No multi-jogador local, nunca roda. Assistindo, roda para todas.
    useEffect(() => {
        if (!activePiece) return
        if (isPlayerTurn) {
            healPhaseDoneRef.current = null
            return
        }
        if (resolvingRoll) return

        const turnKey = `${round}-${turnIndex}`
        const color = activePiece.color

        // Fase de cura: no começo do turno, o time da peça da vez gasta os itens que tem
        // para curar suas peças (uma vez por turno)
        if (healPhaseDoneRef.current !== turnKey) {
            const heal = SimpleAI.applyHeals(pieces, color, inventories)
            healPhaseDoneRef.current = turnKey
            if (heal.healed) {
                for (const p of pieces) {
                    const after = heal.pieces.find((q) => q.id === p.id)
                    if (after && after.hp > p.hp) logHealed(color, p.id)
                }
                setPieces(heal.pieces)
                setInventories(heal.inventories)
                return
            }
        }

        // A peça já agiu (movimento/ataque resolvido): só falta encerrar o turno dela
        if (activePiece.movedThisTurn) {
            const endTimer = setTimeout(endTurn, AI_END_TURN_MS)
            return () => clearTimeout(endTimer)
        }

        const timer = setTimeout(() => {
            const previousPieces = pieces
            const { updatedPieces, pendingAttack } = SimpleAI.makeMove(pieces, activePiece, maze, items, inventories)

            // Aplica a decisão da IA: posiciona as peças e agenda a coleta do item "pisado".
            // Devolve a peça que mudou de casa (no máximo uma por chamada de makeMove).
            const applyMove = () => {
                setPieces(updatedPieces)
                const movedPiece = updatedPieces.find((p) => {
                    const old = previousPieces.find((q) => q.id === p.id)
                    return old && (old.position.x !== p.position.x || old.position.y !== p.position.y)
                })
                if (movedPiece) {
                    const old = previousPieces.find((q) => q.id === movedPiece.id)!
                    const delayMs = pathLength(old.position, movedPiece.position, maze) * STEP_MS + 50
                    schedulePickup(movedPiece.color, movedPiece.position, delayMs)
                }
                return movedPiece
            }

            if (pendingAttack) {
                const forced =
                    pendingAttack.consumedItemKey && pendingAttack.consumerColor
                        ? { itemKey: pendingAttack.consumedItemKey, color: pendingAttack.consumerColor }
                        : null

                // Ataque forçado por item: primeiro a moeda decide se a peça obedece. O item
                // é gasto na tentativa e a peça só sai do lugar se a manipulação pegar.
                if (forced) {
                    removeFromInventory(forced.color, forced.itemKey)
                    logUsedTo(forced.color, forced.itemKey, "toManipulate")
                    resolveManipulation(forced.color, forced.itemKey, (success) => {
                        if (!success) return
                        applyMove()
                        logManipulatedTo(forced.color, pendingAttack.attackerId, "toAttack", pendingAttack.targetId)
                        resolveAttack(pendingAttack)
                    })
                    return
                }

                applyMove()
                logUsedTo(color, pendingAttack.attackerId, "toAttack", pendingAttack.targetId)
                resolveAttack(pendingAttack)
                return
            }

            // Movimento puro (sem ataque pendente): loga mover ou coletar baseado no destino
            const movedPiece = applyMove()
            if (movedPiece) {
                const { actionKey, target } = moveActionFor(movedPiece.position)
                logUsedTo(movedPiece.color, movedPiece.id, actionKey, target)
            }
        }, AI_STEP_MS)

        return () => clearTimeout(timer)
        // endTurn fecha sobre `turnIndex`/`pieces` (ambos nas deps), então a closure está sempre atualizada
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [turnIndex, round, pieces, isPlayerTurn, inventories, items, resolvingRoll])

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
        setHighlighted(reachableCells(p, pieces, maze, stats.moveRange))

        // Peças de ataque à distância destacam tudo o que estiver na mira: as casas até onde
        // a linha de tiro chega livre
        if (isRanged(p.type)) {
            setAttackHighlighted(lineOfFire(p, pieces, maze, stats.attackRange).cells)
            return
        }

        // Corpo-a-corpo: casas dentro do alcance, contornando as paredes
        const attackCells = meleeAttackCells(p, pieces, maze, stats.attackRange)
        setAttackHighlighted(attackCells)
    }, [selectedId, pieces, maze])

    // Se a peça manipulada for eliminada durante a manipulação, cancela e libera o jogador
    useEffect(() => {
        if (!manipulation) return
        if (!pieces.some((p) => p.id === manipulation.itemKey)) {
            setManipulation(null)
            setSelectedId(null)
        }
    }, [pieces, manipulation])

    // A peça da vez pode ser eliminada antes de agir (uma manipulação pode virar o alvo
    // contra ela): nesse caso o turno passa para a próxima da ordem.
    useEffect(() => {
        if (pieces.length === 0 || resolvingRoll) return
        if (!pieces.some((p) => p.id === turnOrder[turnIndex])) endTurn()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pieces, turnIndex, resolvingRoll])

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

    // Passa a vez para a próxima peça viva da ordem de iniciativa. Quando a ordem dá a
    // volta, começa uma nova rodada e todas as peças voltam a ter sua ação disponível.
    const endTurn = () => {
        setSelectedId(null)
        setManipulation(null)

        const alive = new Set(pieces.map((p) => p.id))
        const next = nextTurnIndex(turnOrder, (id) => alive.has(id), turnIndex)
        if (!next) return

        if (next.newRound) {
            setPieces((prev) => prev.map((p) => ({ ...p, movedThisTurn: false })))
            setRound((prev) => prev + 1)
        }
        setTurnIndex(next.index)
    }

    const onCellClick = (pos: PiecePosition) => {
        if (!activeColor || manipulation) return
        const clickedPiece = pieces.find((p) => p.position.x === pos.x && p.position.y === pos.y)
        if (!clickedPiece) {
            setSelectedId(null)
            return
        }
        // A peça da vez que já agiu não pode ser re-selecionada (só lhe resta encerrar o turno)
        if (clickedPiece.id === activePiece?.id && clickedPiece.movedThisTurn) {
            setSelectedId(null)
            return
        }
        setSelectedId((prev) => (prev === clickedPiece.id ? null : clickedPiece.id))
    }

    // Peças de ataque à distância atingem quem estiver na mira, com a linha de tiro livre
    // (paredes e outras peças cobrem o alvo); as demais precisam de uma casa livre adjacente ao alvo.
    const canHitTarget = (attacker: PieceDefinition, target: PieceDefinition) => {
        const { attackRange } = PIECE_STATS[attacker.type]
        if (isRanged(attacker.type)) {
            return lineOfFire(attacker, pieces, maze, attackRange).targets.some((t) => t.id === target.id)
        }
        return findApproachCell(attacker, target, pieces, maze, attackRange) !== null
    }

    const onCellContextMenu = (event: React.MouseEvent, pos: PiecePosition) => {
        // Fora do turno que o jogador comanda — inclusive assistindo à IA — o menu ainda abre,
        // mas só com as opções de informação: nada que altere o estado do jogo.
        const readOnly = activeColor === null

        const targetPiece = pieces.find((p) => p.position.x === pos.x && p.position.y === pos.y)
        const itemAtPos = items.find((i) => i.position.x === pos.x && i.position.y === pos.y)
        const selectedPiece = pieces.find((p) => p.id === selectedId)

        // Quem age é a peça da vez; durante a manipulação, a peça-alvo é tratada
        // como "própria" para efeitos da ação forçada.
        // A peça da vez precisa ainda ter sua ação, a manipulada não. Ser manipulada é
        // uma ação anormal, fora do turno dela.
        const isManipulating = manipulation !== null
        const isOwnSelection =
            !readOnly &&
            !!selectedPiece &&
            (isManipulating
                ? selectedPiece.id === manipulation.itemKey
                : selectedPiece.id === activePiece?.id && !selectedPiece.movedThisTurn)
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
            canHitTarget(selectedPiece!, targetPiece)

        if (!canInfo && !canItemInfo && !canMove && !canCollect && !canAttack) return

        setContextMenu({ mouseX: event.clientX, mouseY: event.clientY, position: pos, targetPiece, itemAtPos })
    }

    const closeContextMenu = () => setContextMenu(null)

    // Sai do modo manipulação depois da ação forçada. O item já foi gasto na tentativa
    // (a moeda podia ter falhado), então aqui não há nada para consumir.
    const endManipulation = () => setManipulation(null)

    const moveSelectedTo = (newPos: PiecePosition) => {
        if (!selectedId || !activeColor) return
        const piece = pieces.find((p) => p.id === selectedId)
        if (!piece) return
        const delayMs = pathLength(piece.position, newPos, maze) * STEP_MS + 50
        const { actionKey, target } = moveActionFor(newPos)

        // Ação forçada por manipulação não gasta a ação que a peça tem no próprio turno
        const spendsAction = !manipulation
        setPieces((prev) =>
            prev.map((p) =>
                p.id === selectedId ? { ...p, position: newPos, movedThisTurn: p.movedThisTurn || spendsAction } : p,
            ),
        )
        schedulePickup(piece.color, newPos, delayMs)
        setSelectedId(null)
        closeContextMenu()

        if (manipulation) {
            logManipulatedTo(activeColor, piece.id, actionKey, target)
            endManipulation()
            // A peça manipulada ainda vai caminhar até o destino: a câmera vai com ela
            setFocusHeldUntil(Date.now() + delayMs)
        } else {
            logUsedTo(activeColor, piece.id, actionKey, target)
        }
    }

    const handleMove = () => contextMenu?.position && moveSelectedTo(contextMenu.position)
    const handleCollect = () => contextMenu?.position && moveSelectedTo(contextMenu.position)

    const handleAttack = () => {
        if (!selectedId || !contextMenu?.targetPiece || !activeColor) return
        const attacker = pieces.find((p) => p.id === selectedId)
        if (!attacker) return

        const target = contextMenu.targetPiece
        const damage = PIECE_STATS[attacker.type].attackDamage
        const targetId = target.id
        const area = attackArea(attacker, target.position)
        // Ataque à distância acerta de onde a peça está; os outros tipos se aproximam do alvo antes
        const ranged = isRanged(attacker.type)
        const newPos = ranged
            ? attacker.position
            : (findApproachCell(attacker, target, pieces, maze, PIECE_STATS[attacker.type].attackRange) ?? attacker.position)
        const delayMs = pathLength(attacker.position, newPos, maze) * STEP_MS + 50

        // Ataque forçado por manipulação não gasta a ação que a peça tem no próprio turno
        const forcedBy = manipulation ? activeColor : null
        setPieces((prev) =>
            prev.map((p) =>
                p.id === attacker.id ? { ...p, position: newPos, movedThisTurn: p.movedThisTurn || !forcedBy } : p,
            ),
        )
        if (!ranged) schedulePickup(attacker.color, newPos, delayMs)
        setSelectedId(null)
        closeContextMenu()

        if (forcedBy) {
            logManipulatedTo(activeColor, attacker.id, "toAttack", targetId)
            endManipulation()
        } else {
            logUsedTo(activeColor, attacker.id, "toAttack", targetId)
        }

        // A moeda é jogada quando o atacante termina de se aproximar
        resolveAttack({
            attackerId: attacker.id,
            targetId,
            damage,
            delayMs,
            ...(area ? { area } : {}),
            ...(forcedBy ? { consumedItemKey: attacker.id as SpecialItemKey, consumerColor: forcedBy } : {}),
        })
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
        if (!inventoryColor || itemKeyColor(key) !== inventoryColor) return
        if (!inventories[inventoryColor].includes(key)) return
        const target = pieces.find((p) => p.id === key)
        if (!target || target.hp >= target.maxHp) return

        setPieces((prev) => prev.map((p) => (p.id === key ? { ...p, hp: p.maxHp } : p)))
        removeFromInventory(inventoryColor, key)
        logHealed(inventoryColor, key)
    }

    const handleUseManipulationItem = (key: SpecialItemKey) => {
        if (!activeColor || resolvingRoll) return
        if (itemKeyColor(key) === activeColor) return
        if (!inventories[activeColor].includes(key)) return
        if (!pieces.some((p) => p.id === key)) return

        // O item é gasto na tentativa; a moeda decide se a peça obedece. Dando certo, ela
        // fica selecionada e o próximo mover/atacar é a ação forçada.
        const color = activeColor
        setInventoryOpen(false)
        removeFromInventory(color, key)
        logUsedTo(color, key, "toManipulate")
        resolveManipulation(color, key, (success) => {
            if (!success) return
            setManipulation({ itemKey: key })
            setSelectedId(key)
        })
    }

    const cancelManipulation = () => {
        setManipulation(null)
        setSelectedId(null)
    }

    // Destaques do tabuleiro: a peça da vez e, por cima dela, a que está sob manipulação
    const activePieceId = activePiece?.id ?? null
    const auras = useMemo<PieceAuras>(() => {
        const result: PieceAuras = {}
        if (activePieceId) result[activePieceId] = "active"
        if (manipulatedId) result[manipulatedId] = "manipulated"
        return result
    }, [activePieceId, manipulatedId])

    const labelForColor = (color: PieceColor) => t(COLOR_LABEL[color])
    const playerInventory = inventoryColor ? inventories[inventoryColor] : []
    const selectedPiece = selectedId ? pieces.find((p) => p.id === selectedId) : undefined

    return (
        <Box sx={{ width: "100vw", height: "100vh", bgcolor: UI_PALETTE.screenBg, display: "flex", flexDirection: "column", overflow: "hidden" }}>
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
                        cellSize={CELL_SIZE}
                        maze={maze}
                        pieces={pieces}
                        items={items}
                        highlighted={highlighted}
                        attackHighlighted={attackHighlighted}
                        fireBursts={fireBursts}
                        auras={auras}
                        onCellClick={onCellClick}
                        selectedPieceId={selectedId}
                        onCellContextMenu={onCellContextMenu}
                    />
                </Box>
            </Box>

            <HUD
                activePiece={activePiece}
                turnOrder={orderedPieces}
                round={round}
                onEndTurn={() => isPlayerTurn && !resolvingRoll && endTurn()}
                onQuit={() => navigate("/")}
                isPlayerTurn={isPlayerTurn}
                busy={resolvingRoll}
                spectating={spectating}
                onOpenInventory={() => setInventoryOpen(true)}
                inventoryCount={playerInventory.length}
                log={gameLog}
                manipulatedId={manipulatedId}
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
                            <Typography>
                                {t("attackStyle")}: {t(isRanged(infoPiece.type) ? "attackStyleRanged" : "attackStyleMelee")}
                            </Typography>
                            {isAreaAttack(infoPiece.type) && (
                                <Typography>
                                    {t("attackArea")}: {FIRE_AREA_SIDE} × {FIRE_AREA_SIDE}
                                </Typography>
                            )}
                        </>
                    )}
                </Box>
            </Modal>

            <ItemInfoModal
                open={itemInfoKey !== null}
                onClose={() => setItemInfoKey(null)}
                itemKey={itemInfoKey}
                playerColor={inventoryColor}
            />

            {inventoryColor && (
                <InventoryModal
                    open={inventoryOpen}
                    onClose={() => setInventoryOpen(false)}
                    inventory={playerInventory}
                    pieces={pieces}
                    playerColor={inventoryColor}
                    onUseHealItem={handleUseHealItem}
                    onUseManipulationItem={handleUseManipulationItem}
                />
            )}

            <RollModal roll={roll} onDone={finishRoll} />
        </Box>
    )
}
