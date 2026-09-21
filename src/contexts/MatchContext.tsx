import React, { createContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import type { MatchSetup } from "../logic/setup"
import type { Maze } from "../logic/maze"
import type {
    PieceAuras,
    PieceColor,
    PieceDefinition,
    PiecePosition,
    MotivationItem,
    MotivationItemKey,
    TextKey,
} from "../logic/types"
import { controlledColorsFor } from "../logic/types"
import type { FireBurst } from "../logic/combat"
import type { BoardMenuState } from "../logic/boardMenu"
import { turnStageOf } from "../logic/turn"
import { useAiTurn } from "../hooks/useAiTurn"
import { useBoardActions } from "../hooks/useBoardActions"
import { useCombatResolution } from "../hooks/useCombatResolution"
import { useEdgeScroll } from "../hooks/useEdgeScroll"
import { useEliminations } from "../hooks/useEliminations"
import { useGame } from "../hooks/useGame"
import { useGameLog } from "../hooks/useGameLog"
import { useHighlightedCells } from "../hooks/useHighlightedCells"
import { useBoardInput } from "../hooks/useBoardInput"
import { useIdleHint, type IdleHint } from "../hooks/useIdleHint"
import { useItemActions, type Manipulation } from "../hooks/useItemActions"
import { useMatchFocus } from "../hooks/useMatchFocus"
import { useMatchItems } from "../hooks/useMatchItems"
import { useRolls, type RollQueue } from "../hooks/useRolls"
import { useSkillFlow, type SkillFlow } from "../hooks/useSkillFlow"
import { useTurnFlow } from "../hooks/useTurnFlow"

// A partida em curso, do jeito que a tela precisa vê-la.
// Os nomes aqui são os do jogo: o tabuleiro, a vez, a habilidade, os itens;
// e não os das props de cada componente:
// traduzir uma coisa na outra é o trabalho de quem desenha, logo ali na tela.
export interface MatchContextValue {
    // O tabuleiro e tudo o que está em cima dele
    board: {
        scrollRef: React.RefObject<HTMLDivElement | null>
        maze: Maze
        pieces: PieceDefinition[]
        items: MotivationItem[]
        moveCells: PiecePosition[]
        attackCells: PiecePosition[]
        fireBursts: FireBurst[]
        auras: PieceAuras
        selectedId: string | null
        droppedItemId: string | null
        onCellClick: (position: PiecePosition) => void
        onCellContextMenu: (event: React.MouseEvent, position: PiecePosition) => void
    }

    // De quem é a vez, e o que se pode fazer com ela
    turn: {
        activePiece: PieceDefinition | null
        // Peças ainda em jogo, na ordem de iniciativa
        order: PieceDefinition[]
        round: number
        isPlayerTurn: boolean
        spectating: boolean
        // Rolagem em andamento trava os controles até o resultado sair
        busy: boolean
        end: () => void
        quit: () => void
        // Traz a câmera até a peça da vez e, se ela ainda tiver ação, a seleciona
        focusActivePiece: () => void
    }

    skill: SkillFlow

    // A tentativa de comandar uma peça de outro time
    manipulation: {
        current: Manipulation | null
        cancel: () => void
    }

    // Os itens de motivação guardados, e o que fazer com eles
    inventory: {
        // Time cujo inventário o HUD mostra. Null quando não há nenhum para mostrar.
        color: PieceColor | null
        items: MotivationItemKey[]
        open: boolean
        setOpen: (open: boolean) => void
        useOwn: (key: MotivationItemKey) => void
        useOnOther: (key: MotivationItemKey) => void
    }

    // O menu do clique direito e as fichas que ele abre
    menu: {
        state: BoardMenuState | null
        close: () => void
        walk: () => void
        attack: () => void
        useSkill: () => void
        showPieceInfo: () => void
        showItemInfo: () => void
        infoPiece: PieceDefinition | null
        closeInfoPiece: () => void
        infoItemKey: MotivationItemKey | null
        closeInfoItem: () => void
    }

    log: string[]
    rolls: RollQueue
    hint: IdleHint
}

const MatchContext = createContext<MatchContextValue>({} as MatchContextValue)
export default MatchContext

interface MatchProviderProps {
    match: MatchSetup
    children: ReactNode
}

// Onde a partida acontece: guarda o estado do tabuleiro e costura os hooks que cuidam de
// cada parte dela (o turno, a câmera, o log, as rolagens, as habilidades, a IA).
// Nada aqui desenha, desenhar é com quem lê o contexto.
export const MatchProvider: React.FC<MatchProviderProps> = ({ match, children }) => {
    const navigate = useNavigate()
    const { selection, setWinner } = useGame()
    const { maze, turnOrder } = match

    // Times sob comando do jogador: um só, os três (multi-jogador local) ou nenhum (assistindo)
    const controlledColors = useMemo(() => controlledColorsFor(selection), [selection])
    const spectating = controlledColors.length === 0
    // Rolagem de time comandado por jogador espera o clique no dado;
    // as de times comandados por IA rolam automaticamente.
    const isManualRoll = (color: PieceColor) => controlledColors.includes(color)

    const turn = useTurnFlow({ initialPieces: match.pieces, turnOrder, controlledColors })
    const { pieces, setPieces, activePiece, isPlayerTurn, activeColor, selectedId, setSelectedId } = turn
    const items = useMatchItems(match.items)
    const log = useGameLog()
    const rolls = useRolls()

    // Inventário exibido no HUD: quem comanda um único time consulta o seu a qualquer
    // momento (inclusive para revigorar ou promover durante o turno da IA).
    // No multi-jogador local, é sempre o do time da vez.
    const inventoryColor = controlledColors.length === 1 ? controlledColors[0] : activeColor
    const playerInventory = inventoryColor ? items.inventories[inventoryColor] : []

    const [manipulation, setManipulation] = useState<Manipulation | null>(null)
    const endManipulation = () => setManipulation(null)

    const focus = useMatchFocus({
        maze,
        pieces,
        activePieceId: activePiece?.id ?? null,
        homeColor: controlledColors.length === 1 ? controlledColors[0] : null,
        manipulating: manipulation !== null,
        resolving: rolls.resolving,
    })

    // Explosões de fogo já resolvidas, para a cena animar (o tabuleiro ignora as repetidas)
    const [fireBursts, setFireBursts] = useState<FireBurst[]>([])
    const [infoPiece, setInfoPiece] = useState<PieceDefinition | null>(null)
    const [itemInfoKey, setItemInfoKey] = useState<MotivationItemKey | null>(null)
    const [inventoryOpen, setInventoryOpen] = useState(false)

    // Traz a câmera até a peça da vez e, se ela ainda tiver ação, a seleciona. É o que o
    // token dela no HUD faz ao ser clicado, e o primeiro passo do botão de habilidades.
    // Peça que já gastou tudo só é mostrada, não selecionada.
    const focusActivePiece = () => {
        if (!activePiece || !isPlayerTurn || rolls.resolving || manipulation) return false
        if (turnStageOf(activePiece) !== "spent") setSelectedId(activePiece.id)
        focus.nudge()
        return true
    }

    const skill = useSkillFlow({
        activePiece,
        activeColor,
        setPieces,
        setSelectedId,
        rolls,
        isManualRoll,
        focusActivePiece,
    })

    // Casas destacadas pela seleção: até onde a peça anda e o que ela alcança.
    // Ter ou não a ação comum é o que decide se há destaque nenhum.
    const selectedPiece = pieces.find((p) => p.id === selectedId) ?? null
    const highlighted = useHighlightedCells(selectedId, pieces, maze, {
        skill: skill.reach,
        basicAvailable: selectedPiece !== null && (!selectedPiece.movedThisTurn || manipulation !== null),
    })

    const input = useBoardInput({
        pieces,
        items: items.items,
        maze,
        selectedId,
        setSelectedId,
        activePiece,
        activeColor,
        manipulatedPieceId: manipulation?.itemKey ?? null,
        skill,
        moveCells: highlighted.move,
        attackCells: highlighted.attack,
        // Só dispensa a dica se o jogador de fato pôde agir: um menu só de informação
        // não conta, ali ele ainda não fez nada.
        onActionOffered: () => hint.dismiss(),
    })

    // Retorna a chave de ação adequada (mover vs coletar) consultando se há item no destino
    const moveActionFor = (position: PiecePosition): { actionKey: TextKey; target?: string } => {
        const item = items.itemAt(position)
        return item ? { actionKey: "toCollectItem", target: item.key } : { actionKey: "toMove" }
    }

    // Tentativa de manipulação falha:
    // o item cai de volta no tabuleiro em uma casa livre sorteada
    const returnItemToBoard = (key: MotivationItemKey) => {
        const item = items.dropOnBoard(key, maze, pieces)
        if (!item) return
        log.returned(key)
        focus.showDroppedItem(item)
    }

    const combat = useCombatResolution({
        pieces,
        maze,
        setPieces,
        setFireBursts,
        setManipulatedId: focus.setManipulatedId,
        rolls,
        log,
        isManualRoll,
        onManipulationFailed: returnItemToBoard,
    })

    const actions = useBoardActions({
        pieces,
        setPieces,
        maze,
        activeColor,
        selectedId,
        setSelectedId,
        skill,
        menu: input.menu,
        closeMenu: input.closeMenu,
        manipulating: manipulation !== null,
        endManipulation,
        holdFocus: focus.holdFocus,
        schedulePickup: items.schedulePickup,
        moveActionFor,
        combat,
        log,
    })

    const itemActions = useItemActions({
        pieces,
        setPieces,
        activeColor,
        inventoryColor,
        inventories: items.inventories,
        removeFromInventory: items.removeFromInventory,
        returnToInventory: items.returnToInventory,
        setSelectedId,
        closeInventory: () => setInventoryOpen(false),
        setManipulation,
        rolls,
        combat,
        log,
    })

    // Encerrar o turno fecha o que estava em curso antes de passar a vez
    const endTurn = () => {
        setSelectedId(null)
        setManipulation(null)
        skill.clear()
        turn.advanceTurn()
    }

    useAiTurn({
        activePiece,
        isPlayerTurn,
        round: turn.round,
        turnIndex: turn.turnIndex,
        pieces,
        setPieces,
        items: items.items,
        inventories: items.inventories,
        setInventories: items.setInventories,
        maze,
        resolving: rolls.resolving,
        endTurn,
        schedulePickup: items.schedulePickup,
        moveActionFor,
        removeFromInventory: items.removeFromInventory,
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pieces, manipulation])

    // A peça da vez pode ser eliminada antes de agir (uma manipulação pode virar o alvo
    // contra ela): nesse caso o turno passa para a próxima da ordem.
    useEffect(() => {
        if (pieces.length === 0 || rolls.resolving) return
        if (!pieces.some((p) => p.id === turnOrder[turn.turnIndex])) endTurn()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pieces, turn.turnIndex, rolls.resolving])

    useEliminations(pieces, { onPieceEliminated: log.eliminated, onTeamDefeated: log.defeated })

    // Vitória: último time com peças no tabuleiro
    useEffect(() => {
        const inPlay = new Set(pieces.map((p) => p.color))
        if (inPlay.size !== 1) return
        const [winner] = inPlay
        setWinner(winner)
        navigate("/end")
    }, [pieces, navigate, setWinner])

    // Dica de como jogar, após tempo sem ação.
    // A "fase" é o que o jogador já fez: seleção de peça ou abertura de menu.
    const hint = useIdleHint({
        enabled:
            isPlayerTurn &&
            // Quem já agiu não tem o que selecionar nem que ação escolher: só encerrar
            activePiece?.movedThisTurn !== true &&
            !rolls.resolving &&
            !manipulation &&
            !skill.active &&
            !inventoryOpen &&
            !skill.listOpen &&
            infoPiece === null &&
            itemInfoKey === null &&
            // Menu aberto é o jogador ocupado: a contagem para, e recomeça quando ele fecha
            input.menu === null,
        phase: `${turn.turnIndex}:${selectedId ?? ""}`,
    })

    useEdgeScroll(focus.scrollRef, {
        enabled: input.menu === null && !infoPiece && !inventoryOpen && !skill.listOpen && rolls.current === null,
    })

    // Destaques das peças ("auras"), desenhados tanto pelo tabuleiro quanto pelo HUD
    const activePieceId = activePiece?.id ?? null
    const skillPieceId = skill.active?.pieceId ?? null
    const manipulatedId = focus.manipulatedId
    const auras = useMemo<PieceAuras>(() => {
        const result: PieceAuras = {}
        if (activePieceId) result[activePieceId] = "active"
        if (skillPieceId) result[skillPieceId] = "skill"
        if (manipulatedId) result[manipulatedId] = "manipulated"
        return result
    }, [activePieceId, skillPieceId, manipulatedId])

    // O valor nasce de novo a cada render de propósito: quem o lê depende do estado da
    // partida de qualquer jeito, e memorizar não pouparia render nenhum.
    const value: MatchContextValue = {
        board: {
            scrollRef: focus.scrollRef,
            maze,
            pieces,
            items: items.items,
            moveCells: highlighted.move,
            attackCells: highlighted.attack,
            fireBursts,
            auras,
            selectedId,
            droppedItemId: focus.droppedItem?.id ?? null,
            onCellClick: input.onCellClick,
            onCellContextMenu: input.onCellContextMenu,
        },
        turn: {
            activePiece,
            order: turn.orderedPieces,
            round: turn.round,
            isPlayerTurn,
            spectating,
            busy: rolls.resolving,
            end: () => isPlayerTurn && !rolls.resolving && endTurn(),
            quit: () => navigate("/"),
            focusActivePiece,
        },
        skill,
        manipulation: {
            current: manipulation,
            cancel: () => itemActions.cancelManipulation(manipulation),
        },
        inventory: {
            color: inventoryColor,
            items: playerInventory,
            open: inventoryOpen,
            setOpen: setInventoryOpen,
            useOwn: itemActions.useOwnItem,
            useOnOther: itemActions.useManipulationItem,
        },
        menu: {
            state: input.menu,
            close: input.closeMenu,
            walk: actions.walk,
            attack: () => actions.attack(false),
            useSkill: () => actions.attack(true),
            showPieceInfo: () => {
                setInfoPiece(input.menu?.targetPiece ?? null)
                input.closeMenu()
            },
            showItemInfo: () => {
                if (!input.menu?.itemAtPos) return
                setItemInfoKey(input.menu.itemAtPos.key)
                input.closeMenu()
            },
            infoPiece,
            closeInfoPiece: () => setInfoPiece(null),
            infoItemKey: itemInfoKey,
            closeInfoItem: () => setItemInfoKey(null),
        },
        log: log.entries,
        rolls,
        hint,
    }

    return <MatchContext.Provider value={value}>{children}</MatchContext.Provider>
}
