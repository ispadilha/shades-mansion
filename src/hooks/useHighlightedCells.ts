import { useEffect, useState } from "react"
import type { Barrier, MotivationItem, PieceColor, PieceDefinition, PiecePosition, RangeKind } from "../logic/types"
import type { Maze } from "../logic/maze"
import { lineOfFire, meleeAttackCells, reachableCells } from "../logic/movement"
import { barrierCells } from "../logic/barriers"
import { chargeCells, chargeVictims } from "../logic/charge"
import { areaCells, mayAttack } from "../logic/combat"
import { atPosition, blockedCellsFor, positionKey } from "../logic/grid"
import { imitableSkillOf, reachOf, skillFor, skillMaxRangeOf, type SkillReach } from "../logic/skills"
import { statsFor } from "../constants/rules"

interface RangeCells {
    // Casas em que a peça selecionada pode terminar o movimento
    move: PiecePosition[]
    // Casas que ela consegue atingir/enxergar
    attack: PiecePosition[]
    // Casas em que uma habilidade que não golpeia diretamente pode ser usada:
    // onde ela cria algo, para onde corre, ou quem ela imita
    skill: PiecePosition[]
}

// Os alcances da peça que age são o que o menu confere. A peça só consultada não age:
// os alcances dela ficam vazios, e só são pintados.
export interface HighlightedCells extends RangeCells {
    // De que alcance é cada casa pintada, pela `positionKey` dela
    ranges: ReadonlyMap<string, RangeKind>
}

const NOTHING: HighlightedCells = { move: [], attack: [], skill: [], ranges: new Map() }

// Um alcance, e as casas que ele pinta
type RangeLayer = [RangeKind, PiecePosition[]]

// Os alcances irradiam da peça na ordem em que vêm:
// casa que cai em mais de um, fica com o primeiro deles
const paint = (layers: RangeLayer[]): ReadonlyMap<string, RangeKind> => {
    const ranges = new Map<string, RangeKind>()
    for (const [kind, cells] of layers) {
        for (const cell of cells) {
            const key = positionKey(cell)
            if (!ranges.has(key)) ranges.set(key, kind)
        }
    }
    return ranges
}

const allCells = ({ move, attack, skill }: RangeCells) => [...move, ...attack, ...skill]

// As cores da ação comum: laranja onde a peça anda, e vermelho onde só o golpe dela chega
const basicLayers = ({ move, attack }: RangeCells): RangeLayer[] => [
    ["move", move],
    ["attack", attack],
]

// Recalcula as casas destacadas sempre que a seleção (ou o tabuleiro) muda.
interface HighlightOptions {
    // Habilidade em uso e até onde ela chega, ou null quando nenhuma
    skill: SkillReach | null
    // A peça ainda tem a ação comum (movimento e/ou ataque básico) disponível
    basicAvailable: boolean
    // A peça selecionada não é a que age agora: o jogador só quer ver até onde ela chega
    consulting: boolean
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
    { skill, basicAvailable, consulting, barriers, items, manipulatedBy }: HighlightOptions,
): HighlightedCells => {
    const [cells, setCells] = useState<HighlightedCells>(NOTHING)

    useEffect(() => {
        if (!selectedId) {
            setCells(NOTHING)
            return
        }
        const piece = pieces.find((p) => p.id === selectedId)
        if (!piece) return

        const blocked = blockedCellsFor(piece.color, barriers, pieces)
        // Casa ocupada só fica destacada se o que está nela pode ser golpeado: a peça que a
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

        // Até onde a peça anda e golpeia com a ação comum.
        // Corpo-a-corpo: uma casa a mais que o movimento, contornando as paredes.
        const basicCells = (): RangeCells => {
            const { moveRange } = statsFor(piece.type, piece.level)
            return {
                move: reachableCells(piece, pieces, maze, moveRange, blocked),
                attack: strikable(meleeAttackCells(piece, pieces, items, maze, moveRange, blocked), true),
                skill: [],
            }
        }

        // Até onde a peça chega com a habilidade, no alcance de `reach`
        const skillCells = (reach: SkillReach): RangeCells => {
            if (reach.effect === "place") {
                const sight = { barriers, blockedBy: reach.blockedBy }
                return { move: [], attack: [], skill: barrierCells(piece, pieces, maze, reach.attack, sight) }
            }
            if (reach.effect === "charge") {
                return { move: [], attack: [], skill: chargeCells(piece, pieces, items, maze, reach.attack, barriers) }
            }
            if (reach.effect === "mimic") {
                // Tudo o que a peça enxerga, menos as casas das peças que não se imitam.
                // As peças que sobram são as que ela pode imitar.
                const sight = { barriers, blockedBy: reach.blockedBy }
                const seen = lineOfFire(piece, pieces, maze, reach.attack, sight).cells.filter((cell) => {
                    const occupant = atPosition(pieces, cell)
                    return !occupant || imitableSkillOf(occupant) !== null
                })
                return { move: [], attack: seen, skill: seen.filter((cell) => atPosition(pieces, cell) !== undefined) }
            }
            return {
                move: reach.move > 0 ? reachableCells(piece, pieces, maze, reach.move, blocked) : [],
                attack: strikable(
                    reach.ranged
                        ? lineOfFire(piece, pieces, maze, reach.attack, { barriers, blockedBy: reach.blockedBy }).cells
                        : meleeAttackCells(piece, pieces, items, maze, reach.attack, blocked),
                    // Só a habilidade que devolve o movimento devolve junto a tentativa de dissipar
                    reach.move > 0,
                ),
                skill: [],
            }
        }

        // Onde o fogo pode chegar mirando em qualquer uma das casas que a habilidade alcança:
        // o quadrado do incêndio em volta de cada uma, recortado como o fogo de verdade.
        // Vazio quando ela não atinge área.
        const burnable = (reach: SkillReach, reached: RangeCells) => {
            const side = reach.area
            if (side === null) return []
            return reached.attack.flatMap((target) => areaCells(maze, target, side, { color: piece.color, barriers }))
        }

        // Quem a investida atropela correndo até qualquer uma das casas em que ela pode terminar:
        // as peças no caminho, aliadas inclusive. Vazio quando a habilidade não é uma investida.
        const runOver = (reach: SkillReach, reached: RangeCells) =>
            reach.effect !== "charge"
                ? []
                : reached.skill.flatMap((to) =>
                      chargeVictims(piece, to, pieces, maze, barriers).map((victim) => victim.piece.position),
                  )

        // Peça só consultada: até onde ela chega quando for a vez dela, tenha ela agido ou não.
        // Da peça para fora: o movimento, o ataque, e o máximo que a habilidade dela alcança, com
        // o raio do incêndio em volta de onde ela pode mirar. Quem a investida pode atropelar no
        // caminho fica em vermelho.
        if (consulting) {
            const basic = basicCells()
            const pieceSkill = skillFor(piece.type)
            const maxReach = reachOf(pieceSkill, piece, skillMaxRangeOf(pieceSkill, piece))
            const reached = skillCells(maxReach)
            const fireRadius = burnable(maxReach, reached)
            const trampled = runOver(maxReach, reached)
            setCells({
                ...NOTHING,
                ranges: paint([
                    ...basicLayers(basic),
                    ["skillMax", [...allCells(reached), ...fireRadius]],
                    ["attack", trampled],
                ]),
            })
            return
        }

        // Habilidade em uso: onde ela pode ser usada ganha destaque azul, seja para golpear, criar
        // algo, correr ou imitar. A de área ganha também o vermelho em volta: casas em que não se pode
        // mirar, mas aonde o incêndio pode chegar. Na investida, o vermelho é de quem ela pode
        // atropelar no caminho. O movimento extra é a exceção: ele devolve o movimento e o golpe
        // da ação comum, e mostra as cores dela.
        if (skill) {
            const reached = skillCells(skill)
            const layers: RangeLayer[] =
                skill.move > 0
                    ? basicLayers(reached)
                    : [
                          ["skill", allCells(reached)],
                          ["attack", [...burnable(skill, reached), ...runOver(skill, reached)]],
                      ]
            setCells({ ...reached, ranges: paint(layers) })
            return
        }

        if (!basicAvailable) {
            setCells(NOTHING)
            return
        }

        const basic = basicCells()
        setCells({ ...basic, ranges: paint(basicLayers(basic)) })
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
        skill?.area,
        basicAvailable,
        consulting,
    ])

    return cells
}
