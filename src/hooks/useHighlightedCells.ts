import { useEffect, useState } from "react"
import type { Barrier, PieceDefinition, PiecePosition } from "../logic/types"
import type { Maze } from "../logic/maze"
import { lineOfFire, meleeAttackCells, reachableCells } from "../logic/movement"
import { barrierCells } from "../logic/barriers"
import { blockedCellsFor } from "../logic/grid"
import type { SkillReach } from "../logic/skills"
import { statsFor } from "../constants/rules"

export interface HighlightedCells {
    // Casas em que a peça selecionada pode terminar o movimento
    move: PiecePosition[]
    // Casas que ela consegue atingir
    attack: PiecePosition[]
    // Casas em que a habilidade em uso pode criar algo
    skill: PiecePosition[]
}

const NOTHING: HighlightedCells = { move: [], attack: [], skill: [] }

// Recalcula as casas destacadas sempre que a seleção (ou o tabuleiro) muda.
// O alcance depende de como a peça vai agir: por padrão é ataque corpo a corpo,
// vira linha de tiro quando uma habilidade de alcance está em uso, e vira a lista de
// casas livres quando a habilidade em uso pode criar coisas.
interface HighlightOptions {
    // Habilidade em uso e até onde ela chega, ou null quando nenhuma
    skill: SkillReach | null
    // A peça ainda tem a ação comum (movimento e/ou ataque básico) disponível
    basicAvailable: boolean
    // Barreiras acesas: fecham caminho para os times rivais,
    // e a casa de uma existente não pode receber outra.
    barriers: Barrier[]
}

export const useHighlightedCells = (
    selectedId: string | null,
    pieces: PieceDefinition[],
    maze: Maze,
    { skill, basicAvailable, barriers }: HighlightOptions,
): HighlightedCells => {
    const [cells, setCells] = useState<HighlightedCells>(NOTHING)

    useEffect(() => {
        if (!selectedId) {
            setCells(NOTHING)
            return
        }
        const piece = pieces.find((p) => p.id === selectedId)
        if (!piece) return

        const stats = statsFor(piece.type, piece.level)
        const blocked = blockedCellsFor(piece.color, barriers)

        // Habilidade em uso: as casas destacadas são as dela
        if (skill) {
            if (skill.places) {
                setCells({ move: [], attack: [], skill: barrierCells(piece, pieces, barriers, maze, skill.attack) })
                return
            }
            setCells({
                move: skill.move > 0 ? reachableCells(piece, pieces, maze, skill.move, blocked) : [],
                attack: skill.ranged
                    ? lineOfFire(piece, pieces, maze, skill.attack).cells
                    : meleeAttackCells(piece, pieces, maze, skill.attack, blocked),
                skill: [],
            })
            return
        }

        if (!basicAvailable) {
            setCells(NOTHING)
            return
        }

        setCells({
            move: reachableCells(piece, pieces, maze, stats.moveRange, blocked),
            // Corpo-a-corpo: uma casa a mais que o movimento, contornando as paredes.
            attack: meleeAttackCells(piece, pieces, maze, stats.moveRange, blocked),
            skill: [],
        })
        // As dependências são os números do alcance, e não o objeto: ele é remontado a
        // cada render de quem chama, e o efeito rodaria sem parar.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId, pieces, maze, barriers, skill?.move, skill?.attack, skill?.ranged, skill?.places, basicAvailable])

    return cells
}
