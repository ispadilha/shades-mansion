import React, { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { BoardArea } from "./BoardArea"
import { BoardContextMenu, type BoardAction, type BoardMenuState } from "./BoardContextMenu"
import { HUD } from "./HUD"
import { InventoryModal } from "./InventoryModal"
import { ItemInfoModal } from "./ItemInfoModal"
import { PieceInfoModal } from "./PieceInfoModal"
import { RollModal } from "../../../components/rolls"
import { ScreenLayout } from "../../../components/ui"
import type {
    PieceAuras,
    PieceColor,
    PieceDefinition,
    PiecePosition,
    MotivationItem,
    MotivationItemKey,
    TextKey,
} from "../../../logic/types"
import { controlledColorsFor, itemKeyColor } from "../../../logic/types"
import { reinvigorated, itemUseFor, promoted } from "../../../logic/items"
import { atPosition, includesPosition } from "../../../logic/grid"
import { findApproachCell, lineOfFire, pathLength } from "../../../logic/movement"
import { nextTurnIndex } from "../../../logic/initiative"
import { attackArea, type FireBurst } from "../../../logic/combat"
import type { MatchSetup } from "../../../logic/setup"
import { useAiTurn } from "../../../hooks/useAiTurn"
import { useBoardCamera, type CameraFocus } from "../../../hooks/useBoardCamera"
import { useCombatResolution } from "../../../hooks/useCombatResolution"
import { useEdgeScroll } from "../../../hooks/useEdgeScroll"
import { useEliminations } from "../../../hooks/useEliminations"
import { useGame } from "../../../hooks/useGame"
import { useGameLog } from "../../../hooks/useGameLog"
import { useHighlightedCells } from "../../../hooks/useHighlightedCells"
import { useMatchItems } from "../../../hooks/useMatchItems"
import { useRolls } from "../../../hooks/useRolls"
import { ACTION_SETTLE_MS, ITEM_DROP_HOLD_MS, STEP_MS, isAreaAttack, isRanged, statsFor } from "../../../constants/rules"

interface MatchDisplayProps {
    match: MatchSetup
}

// A partida em si: guarda o estado do tabuleiro e costura as peças da tela: o tabuleiro,
// o HUD, os modais e o menu de contexto. Cada pedaço de comportamento (a câmera, o log,
// as rolagens, o turno da IA) mora em um hook próprio.
export const MatchDisplay: React.FC<MatchDisplayProps> = ({ match }) => {
    const navigate = useNavigate()
    const { selection, setWinner } = useGame()

    const { maze, turnOrder } = match

    // Times sob comando do jogador: um só, os três (multi-jogador local) ou nenhum (assistindo)
    const controlledColors = useMemo(() => controlledColorsFor(selection), [selection])
    const spectating = controlledColors.length === 0

    const [pieces, setPieces] = useState<PieceDefinition[]>(match.pieces)
    const { items, inventories, setInventories, itemAt, schedulePickup, removeFromInventory, dropOnBoard } =
        useMatchItems(match.items)
    const [turnIndex, setTurnIndex] = useState(0)
    const [round, setRound] = useState(1)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    // Explosões de fogo já resolvidas, para a cena animar (o tabuleiro ignora as repetidas)
    const [fireBursts, setFireBursts] = useState<FireBurst[]>([])
    const [infoPiece, setInfoPiece] = useState<PieceDefinition | null>(null)
    const [itemInfoKey, setItemInfoKey] = useState<MotivationItemKey | null>(null)
    const [inventoryOpen, setInventoryOpen] = useState(false)
    const [manipulation, setManipulation] = useState<{ itemKey: MotivationItemKey } | null>(null)
    // Peça sob manipulação, do lançamento da moeda até a ação forçada acabar:
    // é ela que a câmera segue e quem ganha a aura de manipulação
    const [manipulatedId, setManipulatedId] = useState<string | null>(null)
    // Instante até o qual a câmera fica presa nela mesmo sem rolagem em andamento:
    // é o caso do mover forçado, que só tem a caminhada para mostrar
    const [focusHeldUntil, setFocusHeldUntil] = useState(0)
    const [contextMenu, setContextMenu] = useState<BoardMenuState | null>(null)
    // Item que acabou de cair de volta no tabuleiro: a câmera para em cima dele
    const [droppedItem, setDroppedItem] = useState<MotivationItem | null>(null)

    const log = useGameLog()
    const rolls = useRolls()

    // Peça da vez e o que ela permite ao jogador.
    // `activeColor` é null quando quem age é a IA (ou quando o jogador só assiste).
    const activePiece = pieces.find((p) => p.id === turnOrder[turnIndex]) ?? null
    const isPlayerTurn = activePiece !== null && controlledColors.includes(activePiece.color)
    const activeColor = isPlayerTurn ? activePiece!.color : null
    // Inventário exibido no HUD: quem comanda um único time consulta o seu a qualquer momento
    // (inclusive para revigorar ou promover durante o turno da IA).
    // No multi-jogador local, é sempre o do time da vez.
    const inventoryColor = controlledColors.length === 1 ? controlledColors[0] : activeColor
    // Peças ainda em jogo, na ordem de iniciativa, para a faixa de turnos do HUD
    const orderedPieces = turnOrder.map((id) => pieces.find((p) => p.id === id)).filter((p): p is PieceDefinition => !!p)

    // Rolagem de time comandado por jogador espera o clique no dado;
    // as de times comandados por IA rolam automaticamente.
    const isManualRoll = (color: PieceColor) => controlledColors.includes(color)

    const scrollRef = useRef<HTMLDivElement>(null)
    useEdgeScroll(scrollRef, {
        enabled: contextMenu === null && !infoPiece && !inventoryOpen && rolls.current === null,
    })

    // Câmera: começa perto da base do jogador (quem comanda todos os times ou só assiste
    // não tem base própria, e começa no meio do tabuleiro) e depois acompanha a peça da vez.
    // Uma manipulação rouba esse foco (quem age é a peça manipulada),
    // e um item caindo de volta no labirinto rouba de todos, por um instante.
    // Seguir a casa, e não só a peça, brigaria com a rolagem manual do jogador: por isso a
    // posição só entra na chave durante uma manipulação.
    const focusPiece = pieces.find((p) => p.id === (manipulatedId ?? activePiece?.id))
    const cameraFocus: CameraFocus | undefined = droppedItem
        ? { key: droppedItem.id, position: droppedItem.position }
        : focusPiece && {
              key: manipulatedId ? `${focusPiece.id}:${focusPiece.position.x},${focusPiece.position.y}` : focusPiece.id,
              position: focusPiece.position,
          }
    useBoardCamera(scrollRef, {
        maze,
        homeColor: controlledColors.length === 1 ? controlledColors[0] : null,
        focus: cameraFocus,
    })

    // Devolve o foco à peça da vez quando a manipulação se encerra: a peça manipulada saiu
    // do comando (resistiu a manipulação, ou já fez a ação forçada) e não há mais rolagem
    // para acompanhar. Enquanto houver rolagem em jogo, `rolls.resolving` segura a
    // câmera onde a ação está acontecendo.
    useEffect(() => {
        if (!manipulatedId || manipulation || rolls.resolving) return

        const remaining = focusHeldUntil - Date.now()
        if (remaining <= 0) {
            setManipulatedId(null)
            return
        }

        const timer = window.setTimeout(() => setManipulatedId(null), remaining)
        return () => clearTimeout(timer)
    }, [manipulatedId, manipulation, rolls.resolving, focusHeldUntil])

    // Casas destacadas pela seleção: até onde a peça anda e o que ela alcança
    const highlighted = useHighlightedCells(selectedId, pieces, maze)

    // Retorna a chave de ação adequada (mover vs coletar) consultando se há item no destino.
    // O log da coleta é registrado no ato da decisão (no callsite), não na coleta em si.
    const moveActionFor = (newPos: PiecePosition): { actionKey: TextKey; target?: string } => {
        const item = itemAt(newPos)
        return item ? { actionKey: "toCollectItem", target: item.key } : { actionKey: "toMove" }
    }

    // Passa a vez para a próxima peça em jogo da ordem de iniciativa. Quando a ordem dá a
    // volta, começa uma nova rodada e todas as peças voltam a ter sua ação disponível.
    const endTurn = () => {
        setSelectedId(null)
        setManipulation(null)

        const inPlay = new Set(pieces.map((p) => p.id))
        const next = nextTurnIndex(turnOrder, (id) => inPlay.has(id), turnIndex)
        if (!next) return

        if (next.newRound) {
            setPieces((prev) => prev.map((p) => ({ ...p, movedThisTurn: false })))
            setRound((prev) => prev + 1)
        }
        setTurnIndex(next.index)
    }

    // Manipulação fracassada: o item cai de volta no tabuleiro em uma casa livre sorteada
    const returnItemToBoard = (key: MotivationItemKey) => {
        const item = dropOnBoard(key, maze, pieces)
        if (!item) return
        log.returned(key)
        setDroppedItem(item)
        window.setTimeout(() => setDroppedItem(null), ITEM_DROP_HOLD_MS)
    }

    const combat = useCombatResolution({
        pieces,
        maze,
        setPieces,
        setFireBursts,
        setManipulatedId,
        rolls,
        log,
        isManualRoll,
        onManipulationFailed: returnItemToBoard,
    })

    useAiTurn({
        activePiece,
        isPlayerTurn,
        round,
        turnIndex,
        pieces,
        setPieces,
        items,
        inventories,
        setInventories,
        maze,
        resolving: rolls.resolving,
        endTurn,
        schedulePickup,
        moveActionFor,
        removeFromInventory,
        combat,
        log,
    })

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
        if (pieces.length === 0 || rolls.resolving) return
        if (!pieces.some((p) => p.id === turnOrder[turnIndex])) endTurn()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pieces, turnIndex, rolls.resolving])

    useEliminations(pieces, { onPieceEliminated: log.eliminated, onTeamDefeated: log.defeated })

    // Vitória: último time com peças no tabuleiro
    useEffect(() => {
        const inPlay = new Set(pieces.map((p) => p.color))
        if (inPlay.size !== 1) return
        const [winner] = inPlay
        setWinner(winner)
        navigate("/end")
    }, [pieces, navigate, setWinner])

    const onCellClick = (pos: PiecePosition) => {
        if (!activeColor || manipulation) return
        const clickedPiece = atPosition(pieces, pos)
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
    // (paredes e outras peças cobrem o alvo).
    // As demais precisam de uma casa livre adjacente ao alvo.
    const canHitTarget = (attacker: PieceDefinition, target: PieceDefinition) => {
        const { attackRange } = statsFor(attacker.type, attacker.level)
        if (isRanged(attacker.type)) {
            return lineOfFire(attacker, pieces, maze, attackRange).targets.some((t) => t.id === target.id)
        }
        return findApproachCell(attacker, target, pieces, maze, attackRange) !== null
    }

    const onCellContextMenu = (event: React.MouseEvent, pos: PiecePosition) => {
        // Fora de turnos que o jogador comanda, o menu ainda abre,
        // mas só com as opções de informação: nada que altere o estado do jogo.
        const readOnly = activeColor === null

        const targetPiece = atPosition(pieces, pos)
        const itemAtPos = atPosition(items, pos)
        const selectedPiece = pieces.find((p) => p.id === selectedId)

        // Quem age é a peça da vez. Durante a manipulação, a peça-alvo é tratada
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
        const inMoveRange = includesPosition(highlighted.move, pos)

        const canInfo = !selectedId && !!targetPiece && !isManipulating
        const canItemInfo = !selectedId && !targetPiece && !!itemAtPos && !isManipulating
        const canMove = isOwnSelection && !targetPiece && !itemAtPos && inMoveRange
        const canCollect = isOwnSelection && !targetPiece && !!itemAtPos && inMoveRange
        // Ataque em uma peça: durante manipulação, o alvo pode ser de qualquer cor.
        // Ataque no chão: só a peça incendiária, e só em casa dentro da linha de tiro dela.
        const canAttack =
            isOwnSelection &&
            (targetPiece
                ? targetPiece.id !== selectedPiece!.id &&
                  (isManipulating || targetPiece.color !== selectedPiece!.color) &&
                  canHitTarget(selectedPiece!, targetPiece)
                : isAreaAttack(selectedPiece!.type) && includesPosition(highlighted.attack, pos))

        const actions: BoardAction[] = []
        if (canInfo) actions.push("info")
        if (canItemInfo) actions.push("itemInfo")
        if (canMove) actions.push("move")
        if (canCollect) actions.push("collect")
        if (canAttack) actions.push("attack")
        if (actions.length === 0) return

        setContextMenu({ mouseX: event.clientX, mouseY: event.clientY, position: pos, targetPiece, itemAtPos, actions })
    }

    const closeContextMenu = () => setContextMenu(null)

    // Sai do modo manipulação depois da ação forçada. O item saiu do inventário lá na
    // tentativa, então aqui não há nada a fazer com ele.
    const endManipulation = () => setManipulation(null)

    const moveSelectedTo = (newPos: PiecePosition) => {
        if (!selectedId || !activeColor) return
        const piece = pieces.find((p) => p.id === selectedId)
        if (!piece) return
        const delayMs = pathLength(piece.position, newPos, maze) * STEP_MS + ACTION_SETTLE_MS
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
            log.manipulatedTo(activeColor, piece.id, actionKey, target)
            endManipulation()
            // A peça manipulada ainda vai caminhar até o destino: a câmera vai com ela
            setFocusHeldUntil(Date.now() + delayMs)
        } else {
            log.usedTo(activeColor, piece.id, actionKey, target)
        }
    }

    const handleMove = () => contextMenu?.position && moveSelectedTo(contextMenu.position)
    const handleCollect = () => contextMenu?.position && moveSelectedTo(contextMenu.position)

    const handleAttack = () => {
        if (!selectedId || !contextMenu || !activeColor) return
        const attacker = pieces.find((p) => p.id === selectedId)
        if (!attacker) return

        // O golpe cai em uma casa, que pode ou não ter uma peça em cima
        const target = contextMenu.targetPiece
        const area = attackArea(attacker, target?.position ?? contextMenu.position)
        if (!target && !area) return

        // Ataque à distância acerta de onde a peça está. Os outros tipos se aproximam do alvo antes.
        const ranged = isRanged(attacker.type)
        const newPos =
            ranged || !target
                ? attacker.position
                : (findApproachCell(attacker, target, pieces, maze, statsFor(attacker.type, attacker.level).attackRange) ??
                  attacker.position)
        const delayMs = pathLength(attacker.position, newPos, maze) * STEP_MS + ACTION_SETTLE_MS

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

        // Sem peça mirada não há alvo para nomear no histórico
        const actionKey: TextKey = target ? "toAttack" : "toBurnArea"
        if (forcedBy) {
            log.manipulatedTo(activeColor, attacker.id, actionKey, target?.id)
            endManipulation()
        } else {
            log.usedTo(activeColor, attacker.id, actionKey, target?.id)
        }

        // Os dados são jogados quando o atacante termina de se aproximar
        combat.resolveAttack({
            attackerId: attacker.id,
            damageDice: statsFor(attacker.type, attacker.level).damage,
            delayMs,
            ...(target ? { targetId: target.id } : {}),
            ...(area ? { area } : {}),
            ...(forcedBy ? { consumedItemKey: attacker.id as MotivationItemKey, consumerColor: forcedBy } : {}),
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

    // Item do próprio time revigora a peça atingida, ou promove a que está inteira
    const handleUseOwnItem = (key: MotivationItemKey) => {
        if (!inventoryColor || !inventories[inventoryColor].includes(key)) return
        const target = pieces.find((p) => p.id === key)
        const use = itemUseFor(key, target, inventoryColor)
        if (!target || (use !== "reinvigorate" && use !== "promote")) return

        const after = use === "reinvigorate" ? reinvigorated(target) : promoted(target)
        setPieces((prev) => prev.map((p) => (p.id === key ? after : p)))
        removeFromInventory(inventoryColor, key)
        if (use === "reinvigorate") log.reinvigorated(inventoryColor, key)
        else log.promoted(inventoryColor, key, after.level)
    }

    // Item de outro time: serve para tentar manipular a peça
    const handleUseManipulationItem = (key: MotivationItemKey) => {
        if (!activeColor || rolls.resolving) return
        if (itemKeyColor(key) === activeColor) return
        if (!inventories[activeColor].includes(key)) return
        if (!pieces.some((p) => p.id === key)) return

        // O item sai do inventário na tentativa. A moeda decide se a peça obedece: dando
        // certo, ela fica selecionada e o próximo mover/atacar é a ação forçada.
        // Falhando, o item cai de volta no tabuleiro.
        const color = activeColor
        setInventoryOpen(false)
        removeFromInventory(color, key)
        log.usedTo(color, key, "toManipulate")
        combat.resolveManipulation(color, key, (success) => {
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

    const playerInventory = inventoryColor ? inventories[inventoryColor] : []

    return (
        <ScreenLayout sx={{ justifyContent: "flex-start", alignItems: "stretch", overflow: "hidden" }}>
            <BoardArea
                scrollRef={scrollRef}
                maze={maze}
                pieces={pieces}
                items={items}
                highlighted={highlighted.move}
                attackHighlighted={highlighted.attack}
                fireBursts={fireBursts}
                auras={auras}
                selectedPieceId={selectedId}
                droppedItemId={droppedItem?.id ?? null}
                onCellClick={onCellClick}
                onCellContextMenu={onCellContextMenu}
            />

            <HUD
                activePiece={activePiece}
                turnOrder={orderedPieces}
                round={round}
                onEndTurn={() => isPlayerTurn && !rolls.resolving && endTurn()}
                onQuit={() => navigate("/")}
                isPlayerTurn={isPlayerTurn}
                busy={rolls.resolving}
                spectating={spectating}
                onOpenInventory={() => setInventoryOpen(true)}
                inventoryCount={playerInventory.length}
                log={log.entries}
                manipulatedId={manipulatedId}
                manipulationKey={manipulation?.itemKey ?? null}
                onCancelManipulation={cancelManipulation}
            />

            <BoardContextMenu
                menu={contextMenu}
                onClose={closeContextMenu}
                onShowPieceInfo={handleShowInfo}
                onShowItemInfo={handleShowItemInfo}
                onMove={handleMove}
                onCollect={handleCollect}
                onAttack={handleAttack}
            />

            <PieceInfoModal piece={infoPiece} onClose={() => setInfoPiece(null)} />

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
                    onUseOwnItem={handleUseOwnItem}
                    onUseManipulationItem={handleUseManipulationItem}
                />
            )}

            <RollModal roll={rolls.current} onDone={rolls.finish} />
        </ScreenLayout>
    )
}
