import { useEffect, useState } from "react"
import type { PieceDefinition, PiecePosition } from "../logic/types"
import type { Maze } from "../logic/maze"
import { lineOfFire, meleeAttackCells, reachableCells } from "../logic/movement"
import { statsFor } from "../constants/rules"

export interface HighlightedCells {
    // Casas em que a peça selecionada pode terminar o movimento
    move: PiecePosition[]
    // Casas que ela consegue atingir
    attack: PiecePosition[]
}

// Recalcula as casas destacadas sempre que a seleção (ou o tabuleiro) muda.
// O alcance depende de como a peça vai agir: por padrão é ataque corpo a corpo,
// vira linha de tiro quando uma habilidade de alcance está em uso.
interface HighlightOptions {
    // Habilidade de alcance em uso: o que vale é a linha de tiro,
    // não está sendo mostrado para onde pode se mover
    rangedSkill: boolean
    // A peça ainda tem a ação comum (movimento e/ou ataque básico) disponível
    basicAvailable: boolean
}

export const useHighlightedCells = (
    selectedId: string | null,
    pieces: PieceDefinition[],
    maze: Maze,
    { rangedSkill, basicAvailable }: HighlightOptions,
): HighlightedCells => {
    const [move, setMove] = useState<PiecePosition[]>([])
    const [attack, setAttack] = useState<PiecePosition[]>([])

    useEffect(() => {
        if (!selectedId) {
            setMove([])
            setAttack([])
            return
        }
        const piece = pieces.find((p) => p.id === selectedId)
        if (!piece) return

        const stats = statsFor(piece.type, piece.level)

        // Habilidade de alcance em uso: destaca tudo o que estiver na mira,
        // as casas até onde a linha de tiro chega livre
        if (rangedSkill) {
            setMove([])
            setAttack(lineOfFire(piece, pieces, maze, stats.attackRange).cells)
            return
        }

        if (!basicAvailable) {
            setMove([])
            setAttack([])
            return
        }

        setMove(reachableCells(piece, pieces, maze, stats.moveRange))

        // Corpo-a-corpo: casas dentro do alcance, contornando as paredes
        setAttack(meleeAttackCells(piece, pieces, maze, stats.attackRange))
    }, [selectedId, pieces, maze, rangedSkill, basicAvailable])

    return { move, attack }
}
