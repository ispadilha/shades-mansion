import { useEffect, useState } from "react"
import type { Barrier, MotivationItem, PieceColor, PieceDefinition, PiecePosition } from "../logic/types"
import type { Maze } from "../logic/maze"
import { lineOfFire, meleeAttackCells, reachableCells } from "../logic/movement"
import { barrierCells } from "../logic/barriers"
import { chargeCells } from "../logic/charge"
import { mayAttack } from "../logic/combat"
import { atPosition, blockedCellsFor } from "../logic/grid"
import type { SkillReach } from "../logic/skills"
import { statsFor } from "../constants/rules"

export interface HighlightedCells {
    // Casas em que a peça selecionada pode terminar o movimento
    move: PiecePosition[]
    // Casas que ela consegue atingir
    attack: PiecePosition[]
    // Casas em que a habilidade em uso pode ser usada
    skill: PiecePosition[]
}

const NOTHING: HighlightedCells = { move: [], attack: [], skill: [] }

// Recalcula as casas destacadas sempre que a seleção (ou o tabuleiro) muda.
interface HighlightOptions {
    // Habilidade em uso e até onde ela chega, ou null quando nenhuma
    skill: SkillReach | null
    // A peça ainda tem a ação comum (movimento e/ou ataque básico) disponível
    basicAvailable: boolean
    // Barreiras acesas: fecham caminho para os times rivais,
    // e a casa de uma existente não pode receber outra.
    barriers: Barrier[]
    // Itens no chão: a casa de um não serve para parar e golpear a partir dela
    items: MotivationItem[]
    // Quem manipula a peça selecionada, quando é o caso: o golpe dela não vai para esse time
    manipulatedBy: PieceColor | null
}

export const useHighlightedCells = (
    selectedId: string | null,
    pieces: PieceDefinition[],
    maze: Maze,
    { skill, basicAvailable, barriers, items, manipulatedBy }: HighlightOptions,
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
        const blocked = blockedCellsFor(piece.color, barriers, pieces)
        // Casa ocupada só fica vermelha se o que está nela pode ser golpeado: a peça que a
        // selecionada pode atacar, ou a barreira de outro time que ela pode tentar dissipar,
        // o que só se faz com o golpe corpo a corpo (o da ação comum, ou o do movimento extra).
        // A peça em cima dessa barreira está protegida por ela, então quem decide a casa é a barreira.
        const commander = manipulatedBy ?? piece.color
        const strikable = (cells: PiecePosition[], dispels: boolean) =>
            cells.filter((cell) => {
                const barrier = atPosition(barriers, cell)
                if (barrier && barrier.color !== piece.color) return dispels && mayAttack(piece, barrier, commander)
                const occupant = atPosition(pieces, cell)
                return !occupant || mayAttack(piece, occupant, commander)
            })

        // Habilidade em uso: as casas destacadas são as dela
        if (skill) {
            if (skill.effect === "place") {
                const sight = { barriers, blockedBy: skill.blockedBy }
                setCells({ move: [], attack: [], skill: barrierCells(piece, pieces, maze, skill.attack, sight) })
                return
            }
            if (skill.effect === "charge") {
                setCells({ move: [], attack: [], skill: chargeCells(piece, pieces, items, maze, skill.attack, barriers) })
                return
            }
            setCells({
                move: skill.move > 0 ? reachableCells(piece, pieces, maze, skill.move, blocked) : [],
                attack: strikable(
                    skill.ranged
                        ? lineOfFire(piece, pieces, maze, skill.attack, { barriers, blockedBy: skill.blockedBy }).cells
                        : meleeAttackCells(piece, pieces, items, maze, skill.attack, blocked),
                    // Só a habilidade que devolve o movimento devolve junto a tentativa de dissipar
                    skill.move > 0,
                ),
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
            attack: strikable(meleeAttackCells(piece, pieces, items, maze, stats.moveRange, blocked), true),
            skill: [],
        })
        // As dependências são os números do alcance, e não o objeto: ele é remontado a
        // cada render de quem chama, e o efeito rodaria sem parar.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        selectedId,
        pieces,
        maze,
        barriers,
        items,
        manipulatedBy,
        skill?.move,
        skill?.attack,
        skill?.ranged,
        skill?.effect,
        skill?.blockedBy.pieces,
        skill?.blockedBy.barriers,
        basicAvailable,
    ])

    return cells
}
