import React, { createContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import type { MatchSetup } from "../logic/setup"
import type { Maze } from "../logic/maze"
import type {
    Barrier,
    CharacterAuras,
    CharacterColor,
    CharacterDefinition,
    CharacterPosition,
    MotivationItem,
    MotivationItemKey,
    RangeKind,
    TextKey,
} from "../logic/types"
import { controlledColorsFor } from "../logic/types"
import type { ChargeRun, DamagePopup, FireBurst } from "../logic/combat"
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
import { useAffinity } from "../hooks/useAffinity"
import { useBarriers } from "../hooks/useBarriers"
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
        characters: CharacterDefinition[]
        items: MotivationItem[]
        // De que alcance é cada casa destacada, pela `positionKey` dela
        ranges: ReadonlyMap<string, RangeKind>
        barriers: Barrier[]
        fireBursts: FireBurst[]
        damagePopups: DamagePopup[]
        chargeRuns: ChargeRun[]
        auras: CharacterAuras
        selectedId: string | null
        droppedItemId: string | null
        onCellClick: (position: CharacterPosition) => void
        onCellContextMenu: (event: React.MouseEvent, position: CharacterPosition) => void
    }

    // De quem é a vez, e o que se pode fazer com ela
    turn: {
        activeCharacter: CharacterDefinition | null
        // Personagens ainda em jogo, na ordem de iniciativa
        order: CharacterDefinition[]
        round: number
        isPlayerTurn: boolean
        spectating: boolean
        // Rolagem em andamento trava os controles até o resultado sair
        busy: boolean
        end: () => void
        quit: () => void
        // Traz a câmera até a personagem da vez e, se ela ainda tiver ação, a seleciona
        focusActiveCharacter: () => void
    }

    skill: SkillFlow

    // As barreiras paranormais acesas, e quantas a personagem da vez ainda pode acender
    barriers: {
        all: Barrier[]
        usesLeft: number
    }

    // A tentativa de comandar uma personagem de outro time
    manipulation: {
        current: Manipulation | null
        cancel: () => void
    }

    // Os itens de motivação guardados, e o que fazer com eles
    inventory: {
        // Time cujo inventário o HUD mostra. Null quando não há nenhum para mostrar.
        color: CharacterColor | null
        items: MotivationItemKey[]
        // Com uma jogada em curso o inventário não abre
        locked: boolean
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
        dispel: () => void
        useSkill: () => void
        showCharacterInfo: () => void
        showItemInfo: () => void
        showBarrierInfo: () => void
        infoCharacter: CharacterDefinition | null
        closeInfoCharacter: () => void
        infoItemKey: MotivationItemKey | null
        closeInfoItem: () => void
        infoBarrier: Barrier | null
        closeInfoBarrier: () => void
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
    const isManualRoll = (color: CharacterColor) => controlledColors.includes(color)

    const turn = useTurnFlow({ initialCharacters: match.characters, turnOrder, controlledColors })
    const { characters, setCharacters, activeCharacter, isPlayerTurn, activeColor, selectedId, setSelectedId } = turn
    const items = useMatchItems(match.items)
    const log = useGameLog()
    const rolls = useRolls()

    const inventoryColor = controlledColors.length === 1 ? controlledColors[0] : activeColor
    const playerInventory = inventoryColor ? items.inventories[inventoryColor] : []

    const [manipulation, setManipulation] = useState<Manipulation | null>(null)
    const endManipulation = () => setManipulation(null)

    const focus = useMatchFocus({
        maze,
        characters,
        activeCharacterId: activeCharacter?.id ?? null,
        homeColor: controlledColors.length === 1 ? controlledColors[0] : null,
        manipulating: manipulation !== null,
        resolving: rolls.resolving,
    })

    // Explosões de fogo já resolvidas, para a cena animar (o tabuleiro ignora as repetidas)
    const [fireBursts, setFireBursts] = useState<FireBurst[]>([])
    // Números de dano já resolvidos, para a cena mostrá-los subindo (ela ignora os repetidos)
    const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([])
    // Investidas já decididas, para a cena fazer a personagem correr em linha reta (ela ignora as repetidas)
    const [chargeRuns, setChargeRuns] = useState<ChargeRun[]>([])
    const [infoCharacter, setInfoCharacter] = useState<CharacterDefinition | null>(null)
    const [itemInfoKey, setItemInfoKey] = useState<MotivationItemKey | null>(null)
    const [infoBarrier, setInfoBarrier] = useState<Barrier | null>(null)
    const [inventoryOpen, setInventoryOpen] = useState(false)

    // Traz a câmera até a personagem da vez e, se ela ainda tiver ação, a seleciona. É o que o
    // ícone dela no HUD faz ao ser clicado, e o primeiro passo do botão de habilidades.
    // Personagem que já gastou tudo só é mostrada, não selecionada.
    const focusActiveCharacter = () => {
        if (!activeCharacter || !isPlayerTurn || rolls.resolving || manipulation) return false
        if (turnStageOf(activeCharacter) !== "spent") setSelectedId(activeCharacter.id)
        focus.nudge()
        return true
    }

    const skill = useSkillFlow({
        activeCharacter,
        activeColor,
        setCharacters,
        setSelectedId,
        rolls,
        isManualRoll,
        focusActiveCharacter,
        manipulating: manipulation !== null,
    })

    const barriers = useBarriers({
        characters,
        activeCharacterId: activeCharacter?.id ?? null,
        activeColor,
        skill,
        log,
    })

    // A dupla de afinidade que se revigora no começo da vez, enquanto a rolagem dela acontece
    const affinityDuo = useAffinity({
        characters,
        setCharacters,
        activeCharacter,
        turnKey: `${turn.round}-${turn.turnIndex}`,
        rolls,
        isManualRoll,
        log,
    })

    // Casas destacadas pela seleção: até onde a personagem anda e o que ela alcança.
    // Para a personagem que age (a da vez, ou a manipulada), ter ou não a ação comum é o que decide
    // se há destaque nenhum. Qualquer outra personagem selecionada está só sendo consultada.
    const selectedCharacter = characters.find((p) => p.id === selectedId) ?? null
    const actingCharacterId = manipulation?.itemKey ?? activeCharacter?.id ?? null
    const highlighted = useHighlightedCells(selectedId, characters, maze, {
        skill: skill.reach,
        basicAvailable: selectedCharacter !== null && (!selectedCharacter.movedThisTurn || manipulation !== null),
        consulting: selectedCharacter !== null && selectedCharacter.id !== actingCharacterId,
        barriers: barriers.all,
        items: items.items,
        manipulatedBy: manipulation?.color ?? null,
    })

    const input = useBoardInput({
        characters,
        items: items.items,
        barriers: barriers.all,
        maze,
        selectedId,
        setSelectedId,
        activeCharacter,
        activeColor,
        manipulatedCharacterId: manipulation?.itemKey ?? null,
        skill,
        moveCells: highlighted.move,
        attackCells: highlighted.attack,
        skillCells: highlighted.skill,
        // Só dispensa a dica se o jogador de fato pôde agir: um menu só de informação
        // não conta, ali ele ainda não fez nada.
        onActionOffered: () => hint.dismiss(),
    })

    // Retorna a chave de ação adequada (mover vs coletar) consultando se há item no destino
    const moveActionFor = (position: CharacterPosition): { actionKey: TextKey; target?: string } => {
        const item = items.itemAt(position)
        return item ? { actionKey: "toCollectItem", target: item.key } : { actionKey: "toMove" }
    }

    // Tentativa de manipulação falha:
    // o item cai de volta no tabuleiro em uma casa livre sorteada
    const returnItemToBoard = (key: MotivationItemKey) => {
        const item = items.dropOnBoard(key, maze, characters)
        if (!item) return
        log.returned(key)
        focus.showDroppedItem(item)
    }

    const combat = useCombatResolution({
        characters,
        maze,
        barriers: barriers.all,
        setCharacters,
        setFireBursts,
        setDamagePopups,
        setChargeRuns,
        setManipulatedId: focus.setManipulatedId,
        rolls,
        log,
        isManualRoll,
        onManipulationFailed: returnItemToBoard,
        dispelBarrier: barriers.dispel,
    })

    const actions = useBoardActions({
        characters,
        setCharacters,
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
        barriers: barriers.all,
        items: items.items,
        placeSkill: barriers.lightAt,
    })

    // Um item usado no meio de uma manipulação ou de uma habilidade se misturaria com ela:
    // a personagem manipulada herdaria a habilidade em uso, e uma segunda manipulação tomaria o
    // lugar da primeira. Enquanto uma delas durar, o inventário fica fechado.
    const inventoryLocked = manipulation !== null || skill.active !== null

    const itemActions = useItemActions({
        characters,
        setCharacters,
        activeColor,
        inventoryColor,
        inventories: items.inventories,
        removeFromInventory: items.removeFromInventory,
        returnToInventory: items.returnToInventory,
        setSelectedId,
        closeInventory: () => setInventoryOpen(false),
        setManipulation,
        locked: inventoryLocked,
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
        activeCharacter,
        isPlayerTurn,
        round: turn.round,
        turnIndex: turn.turnIndex,
        characters,
        setCharacters,
        items: items.items,
        inventories: items.inventories,
        setInventories: items.setInventories,
        maze,
        barriers: barriers.all,
        resolving: rolls.resolving,
        endTurn,
        schedulePickup: items.schedulePickup,
        moveActionFor,
        removeFromInventory: items.removeFromInventory,
        holdFocus: focus.holdFocus,
        combat,
        log,
    })

    // Se a personagem manipulada for eliminada durante a manipulação, cancela e libera o jogador
    useEffect(() => {
        if (!manipulation) return
        if (!characters.some((p) => p.id === manipulation.itemKey)) {
            setManipulation(null)
            setSelectedId(null)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [characters, manipulation])

    // A personagem da vez pode ser eliminada antes de agir (uma manipulação pode virar o alvo
    // contra ela): nesse caso o turno passa para a próxima da ordem.
    useEffect(() => {
        if (characters.length === 0 || rolls.resolving) return
        if (!characters.some((p) => p.id === turnOrder[turn.turnIndex])) endTurn()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [characters, turn.turnIndex, rolls.resolving])

    useEliminations(characters, { onCharacterEliminated: log.eliminated, onTeamDefeated: log.defeated })

    // Vitória: último time com personagens no tabuleiro
    useEffect(() => {
        const inPlay = new Set(characters.map((p) => p.color))
        if (inPlay.size !== 1) return
        const [winner] = inPlay
        setWinner(winner)
        navigate("/end")
    }, [characters, navigate, setWinner])

    // Dica de como jogar, após tempo sem ação.
    // A "fase" é o que o jogador já fez: seleção de personagem ou abertura de menu.
    const hint = useIdleHint({
        enabled:
            isPlayerTurn &&
            // Quem já agiu não tem o que selecionar nem que ação escolher: só encerrar
            activeCharacter?.movedThisTurn !== true &&
            !rolls.resolving &&
            !inventoryOpen &&
            !skill.listOpen &&
            manipulation === null &&
            skill.active === null &&
            infoCharacter === null &&
            itemInfoKey === null &&
            infoBarrier === null &&
            // Menu aberto é o jogador ocupado: a contagem para, e recomeça quando ele fecha
            input.menu === null,
        phase: `${turn.turnIndex}:${selectedId ?? ""}`,
    })

    useEdgeScroll(focus.scrollRef, {
        // Nenhum modal aberto deixa o tabuleiro rolar por baixo dele
        enabled:
            input.menu === null &&
            infoCharacter === null &&
            itemInfoKey === null &&
            infoBarrier === null &&
            !inventoryOpen &&
            !skill.listOpen &&
            rolls.current === null,
    })

    // Destaques das personagens ("auras"), desenhados tanto pelo tabuleiro quanto pelo HUD
    const activeCharacterId = activeCharacter?.id ?? null
    const skillCharacterId = skill.active?.characterId ?? null
    const manipulatedId = focus.manipulatedId
    const auras = useMemo<CharacterAuras>(() => {
        const result: CharacterAuras = {}
        if (activeCharacterId) result[activeCharacterId] = "active"
        // A dupla que se revigora brilha junta, por cima da aura da vez
        for (const id of affinityDuo) result[id] = "affinity"
        if (skillCharacterId) result[skillCharacterId] = "skill"
        if (manipulatedId) result[manipulatedId] = "manipulated"
        return result
    }, [activeCharacterId, affinityDuo, skillCharacterId, manipulatedId])

    // O valor nasce de novo a cada render de propósito: quem o lê depende do estado da
    // partida de qualquer jeito, e memorizar não pouparia render nenhum.
    const value: MatchContextValue = {
        board: {
            scrollRef: focus.scrollRef,
            maze,
            characters,
            items: items.items,
            ranges: highlighted.ranges,
            barriers: barriers.all,
            fireBursts,
            damagePopups,
            chargeRuns,
            auras,
            selectedId,
            droppedItemId: focus.droppedItem?.id ?? null,
            onCellClick: input.onCellClick,
            onCellContextMenu: input.onCellContextMenu,
        },
        turn: {
            activeCharacter,
            order: turn.orderedCharacters,
            round: turn.round,
            isPlayerTurn,
            spectating,
            busy: rolls.resolving,
            end: () => isPlayerTurn && !rolls.resolving && endTurn(),
            quit: () => navigate("/"),
            focusActiveCharacter,
        },
        skill,
        barriers: { all: barriers.all, usesLeft: barriers.usesLeft },
        manipulation: {
            current: manipulation,
            cancel: () => itemActions.cancelManipulation(manipulation),
        },
        inventory: {
            color: inventoryColor,
            items: playerInventory,
            locked: inventoryLocked,
            open: inventoryOpen,
            setOpen: setInventoryOpen,
            useOwn: itemActions.useOwnItem,
            useOnOther: itemActions.useManipulationItem,
        },
        menu: {
            state: input.menu,
            close: input.closeMenu,
            walk: actions.walk,
            attack: actions.attack,
            dispel: actions.dispel,
            useSkill: actions.useSkill,
            showCharacterInfo: () => {
                setInfoCharacter(input.menu?.targetCharacter ?? null)
                input.closeMenu()
            },
            showItemInfo: () => {
                if (!input.menu?.itemAtPos) return
                setItemInfoKey(input.menu.itemAtPos.key)
                input.closeMenu()
            },
            showBarrierInfo: () => {
                if (!input.menu?.barrierAtPos) return
                setInfoBarrier(input.menu.barrierAtPos)
                input.closeMenu()
            },
            infoCharacter,
            closeInfoCharacter: () => setInfoCharacter(null),
            infoItemKey: itemInfoKey,
            closeInfoItem: () => setItemInfoKey(null),
            infoBarrier,
            closeInfoBarrier: () => setInfoBarrier(null),
        },
        log: log.entries,
        rolls,
        hint,
    }

    return <MatchContext.Provider value={value}>{children}</MatchContext.Provider>
}
