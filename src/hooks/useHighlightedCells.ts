import { useEffect, useState } from "react"
import type { PieceDefinition, PiecePosition } from "../logic/types"
import type { Maze } from "../logic/maze"
import { lineOfFire, meleeAttackCells, reachableCells } from "../logic/movement"
import type { SkillReach } from "../logic/skills"
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
    // Habilidade em uso e até onde ela chega, ou null quando nenhuma
    skill: SkillReach | null
    // A peça ainda tem a ação comum (movimento e/ou ataque básico) disponível
    basicAvailable: boolean
}

export const useHighlightedCells = (
    selectedId: string | null,
    pieces: PieceDefinition[],
    maze: Maze,
    { skill, basicAvailable }: HighlightOptions,
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

        // Habilidade em uso: os destaques são os dela, sejam movimentos ou ataques
        if (skill) {
            setMove(skill.move > 0 ? reachableCells(piece, pieces, maze, skill.move) : [])
            setAttack(
                skill.ranged
                    ? lineOfFire(piece, pieces, maze, skill.attack).cells
                    : meleeAttackCells(piece, pieces, maze, skill.attack),
            )
            return
        }

        if (!basicAvailable) {
            setMove([])
            setAttack([])
            return
        }

        setMove(reachableCells(piece, pieces, maze, stats.moveRange))

        // Corpo-a-corpo: uma casa a mais que o movimento, contornando as paredes.
        setAttack(meleeAttackCells(piece, pieces, maze, stats.moveRange))
        // As dependências são os números do alcance, e não o objeto: ele é remontado a
        // cada render de quem chama, e o efeito rodaria sem parar.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId, pieces, maze, skill?.move, skill?.attack, skill?.ranged, basicAvailable])

    return { move, attack }
}
