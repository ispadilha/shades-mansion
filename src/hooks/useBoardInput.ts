import React, { useState } from "react"
import type { Barrier, MotivationItem, CharacterColor, CharacterDefinition, CharacterPosition } from "../logic/types"
import type { Maze } from "../logic/maze"
import { boardActionsFor, isInfoAction, type BoardMenuState } from "../logic/boardMenu"
import { atPosition } from "../logic/grid"
import { turnStageOf } from "../logic/turn"
import type { SkillFlow } from "./useSkillFlow"

interface BoardInputOptions {
    characters: CharacterDefinition[]
    items: MotivationItem[]
    barriers: Barrier[]
    maze: Maze
    selectedId: string | null
    setSelectedId: (id: string | null) => void
    activeCharacter: CharacterDefinition | null
    // Null quando a vez não é do jogador: o menu ainda abre, mas só pra informações
    activeColor: CharacterColor | null
    // Personagem sob manipulação, quando há uma
    manipulatedCharacterId: string | null
    skill: SkillFlow
    // As casas que o tabuleiro já está destacando
    moveCells: CharacterPosition[]
    attackCells: CharacterPosition[]
    skillCells: CharacterPosition[]
    // Chamado quando o menu ofereceu uma ação de verdade, e não só informação:
    // é o sinal de que o jogador não está parado e não precisa mais da dica.
    onActionOffered: () => void
}

export interface BoardInput {
    // Clique esquerdo: escolhe a personagem que vai agir
    onCellClick: (position: CharacterPosition) => void
    // Clique direito: abre o menu com o que aquela casa permite
    onCellContextMenu: (event: React.MouseEvent, position: CharacterPosition) => void
    menu: BoardMenuState | null
    closeMenu: () => void
}

// O que o clique no tabuleiro faz.
// Quais ações a casa oferece é decidido por `boardActionsFor`,
// que é lógica pura. Aqui só se abre e fecha o menu com a resposta.
export const useBoardInput = ({
    characters,
    items,
    barriers,
    maze,
    selectedId,
    setSelectedId,
    activeCharacter,
    activeColor,
    manipulatedCharacterId,
    skill,
    moveCells,
    attackCells,
    skillCells,
    onActionOffered,
}: BoardInputOptions): BoardInput => {
    const [menu, setMenu] = useState<BoardMenuState | null>(null)
    const closeMenu = () => setMenu(null)

    const onCellClick = (position: CharacterPosition) => {
        // Com habilidade em uso, a personagem fica travada: sair dela é só pelo botão de cancelar
        if (!activeColor || manipulatedCharacterId || skill.active) return

        const clicked = atPosition(characters, position)
        if (!clicked) {
            setSelectedId(null)
            return
        }
        // Só a personagem que esgotou tudo é que não se seleciona mais:
        // quem gastou ação comum mas ainda tem habilidade continua disponível.
        if (clicked.id === activeCharacter?.id && turnStageOf(clicked) === "spent") {
            setSelectedId(null)
            return
        }
        setSelectedId(selectedId === clicked.id ? null : clicked.id)
    }

    const onCellContextMenu = (event: React.MouseEvent, position: CharacterPosition) => {
        const actions = boardActionsFor({
            position,
            characters,
            items,
            barriers,
            maze,
            selectedId,
            activeCharacterId: activeCharacter?.id ?? null,
            activeColor,
            manipulatedCharacterId,
            activeSkill: skill.active,
            skillReach: skill.reach,
            moveCells,
            attackCells,
            skillCells,
        })
        if (actions.length === 0) return

        if (actions.some((action) => !isInfoAction(action))) onActionOffered()

        setMenu({
            mouseX: event.clientX,
            mouseY: event.clientY,
            position,
            targetCharacter: atPosition(characters, position),
            itemAtPos: atPosition(items, position),
            barrierAtPos: atPosition(barriers, position),
            actions,
            ...(skill.active ? { skillAction: skill.active.skill.action } : {}),
        })
    }

    return { onCellClick, onCellContextMenu, menu, closeMenu }
}
