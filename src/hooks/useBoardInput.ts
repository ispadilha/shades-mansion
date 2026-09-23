import React, { useState } from "react"
import type { MotivationItem, PieceColor, PieceDefinition, PiecePosition } from "../logic/types"
import type { Maze } from "../logic/maze"
import { boardActionsFor, type BoardMenuState } from "../logic/boardMenu"
import { atPosition } from "../logic/grid"
import { turnStageOf } from "../logic/turn"
import type { SkillFlow } from "./useSkillFlow"

interface BoardInputOptions {
    pieces: PieceDefinition[]
    items: MotivationItem[]
    maze: Maze
    selectedId: string | null
    setSelectedId: (id: string | null) => void
    activePiece: PieceDefinition | null
    // Null quando a vez não é do jogador: o menu ainda abre, mas só pra informações
    activeColor: PieceColor | null
    // Peça sob manipulação, quando há uma
    manipulatedPieceId: string | null
    skill: SkillFlow
    // As casas que o tabuleiro já está destacando
    moveCells: PiecePosition[]
    attackCells: PiecePosition[]
    skillCells: PiecePosition[]
    // Chamado quando o menu ofereceu uma ação de verdade, e não só informação:
    // é o sinal de que o jogador não está parado e não precisa mais da dica.
    onActionOffered: () => void
}

export interface BoardInput {
    // Clique esquerdo: escolhe a peça que vai agir
    onCellClick: (position: PiecePosition) => void
    // Clique direito: abre o menu com o que aquela casa permite
    onCellContextMenu: (event: React.MouseEvent, position: PiecePosition) => void
    menu: BoardMenuState | null
    closeMenu: () => void
}

// O que o clique no tabuleiro faz.
// Quais ações a casa oferece é decidido por `boardActionsFor`,
// que é lógica pura. Aqui só se abre e fecha o menu com a resposta.
export const useBoardInput = ({
    pieces,
    items,
    maze,
    selectedId,
    setSelectedId,
    activePiece,
    activeColor,
    manipulatedPieceId,
    skill,
    moveCells,
    attackCells,
    skillCells,
    onActionOffered,
}: BoardInputOptions): BoardInput => {
    const [menu, setMenu] = useState<BoardMenuState | null>(null)
    const closeMenu = () => setMenu(null)

    const onCellClick = (position: PiecePosition) => {
        // Com habilidade em uso, a peça fica travada: sair dela é só pelo botão de cancelar
        if (!activeColor || manipulatedPieceId || skill.active) return

        const clicked = atPosition(pieces, position)
        if (!clicked) {
            setSelectedId(null)
            return
        }
        // Só a peça que esgotou tudo é que não se seleciona mais:
        // quem gastou ação comum mas ainda tem habilidade continua disponível.
        if (clicked.id === activePiece?.id && turnStageOf(clicked) === "spent") {
            setSelectedId(null)
            return
        }
        setSelectedId(selectedId === clicked.id ? null : clicked.id)
    }

    const onCellContextMenu = (event: React.MouseEvent, position: PiecePosition) => {
        const actions = boardActionsFor({
            position,
            pieces,
            items,
            maze,
            selectedId,
            activePieceId: activePiece?.id ?? null,
            activeColor,
            manipulatedPieceId,
            activeSkill: skill.active,
            skillReach: skill.reach,
            moveCells,
            attackCells,
            skillCells,
        })
        if (actions.length === 0) return

        if (actions.some((action) => action !== "info" && action !== "itemInfo")) onActionOffered()

        setMenu({
            mouseX: event.clientX,
            mouseY: event.clientY,
            position,
            targetPiece: atPosition(pieces, position),
            itemAtPos: atPosition(items, position),
            actions,
            ...(skill.active ? { skillAction: skill.active.skill.action } : {}),
        })
    }

    return { onCellClick, onCellContextMenu, menu, closeMenu }
}
