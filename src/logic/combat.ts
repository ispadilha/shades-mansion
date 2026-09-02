import type { PieceColor, PieceDefinition, PiecePosition, PieceType, SpecialItemKey } from "./types"
import type { Maze } from "./maze"
import { isWalkable } from "./maze"
import { manhattan, neighbors, positionKey } from "./grid"
import { flipCoin, rollDie, rollSpec, sumDice, type CoinFace } from "./rolls"
import { DEFENSE_DIE, FIRE_AREA_SIDE, PIECE_STATS, SUCCESS_FACE, isAreaAttack } from "../constants/rules"

export interface CoinCheck {
    face: CoinFace
    success: boolean
}

export const rollManipulation = (): CoinCheck => {
    const face = flipCoin()
    return { face, success: face === SUCCESS_FACE }
}

// Cada tipo de peça rola seus dados de dano.
export interface DamageRoll {
    dice: number[]
    total: number
}

export function rollDamage(type: PieceType): DamageRoll {
    const dice = rollSpec(PIECE_STATS[type].damage)
    return { dice, total: sumDice(dice) }
}

// Como a peça atacada se saiu: desviou do golpe, aparou parte dele, ou levou tudo
export type DefenseOutcome = "dodged" | "guarded" | "clean"

export interface DefenseRoll {
    die: number
    outcome: DefenseOutcome
    // O que sobrou do dano depois da defesa
    damage: number
}

// A defesa é um d20 contra os dois números da peça.
// Alcançando a esquiva, o golpe é desviado.
// Alcançando só o aparo, a peça segura o que pode e leva metade do dano.
export function rollDefense(type: PieceType, damage: number): DefenseRoll {
    const { dodge, guard } = PIECE_STATS[type]
    const die = rollDie(DEFENSE_DIE)

    if (die >= dodge) return { die, outcome: "dodged", damage: 0 }
    if (die >= guard) return { die, outcome: "guarded", damage: Math.ceil(damage / 2) }
    return { die, outcome: "clean", damage }
}

// As casas que o fogo alcança. Ele nasce na casa do alvo e se espalha de casa em casa.
// Peças não seguram o fogo — só as paredes.
// O lado é ímpar para o alvo ficar bem no centro. Um lado par é arredondado para cima.
export function areaCells(maze: Maze, center: PiecePosition, side: number): PiecePosition[] {
    if (!isWalkable(maze, center.x, center.y)) return []

    const radius = Math.floor(side / 2)
    const inSquare = (cell: PiecePosition) =>
        Math.abs(cell.x - center.x) <= radius && Math.abs(cell.y - center.y) <= radius

    const burning: PiecePosition[] = []
    const seen = new Set<string>([positionKey(center)])
    const queue: PiecePosition[] = [center]

    while (queue.length > 0) {
        const cell = queue.shift()!
        burning.push(cell)

        for (const next of neighbors(cell)) {
            if (!inSquare(next) || !isWalkable(maze, next.x, next.y)) continue
            const key = positionKey(next)
            if (seen.has(key)) continue
            seen.add(key)
            queue.push(next)
        }
    }

    return burning
}

// Quem está em cima das casas em chamas. Aliados do atacante entram na lista.
// É isso que torna o ataque em área arriscado.
export function piecesInCells(pieces: PieceDefinition[], cells: PiecePosition[]): PieceDefinition[] {
    const burning = new Set(cells.map(positionKey))
    return pieces.filter((p) => burning.has(positionKey(p.position)))
}

// Peças do centro do estouro para fora: é a ordem em que se defendem
export function piecesInBlast(
    pieces: PieceDefinition[],
    cells: PiecePosition[],
    center: PiecePosition,
): PieceDefinition[] {
    return piecesInCells(pieces, cells).sort(
        (a, b) =>
            manhattan(a.position, center) - manhattan(b.position, center) ||
            a.position.y - b.position.y ||
            a.position.x - b.position.x,
    )
}

export interface AttackArea {
    center: PiecePosition
    side: number
}

export const attackArea = (attacker: PieceDefinition, target: PiecePosition): AttackArea | undefined =>
    isAreaAttack(attacker.type) ? { center: { ...target }, side: FIRE_AREA_SIDE } : undefined

// Um ataque já decidido (alvo escolhido, atacante a caminho) esperando os dados.
// `delayMs` é o tempo que o atacante leva para chegar até o alvo — os dados só são
// jogados depois disso, para que o desenho na tela acompanhe as rolagens.
export interface PendingAttack {
    attackerId: string
    // De onde saem os dados de dano. Os dados só são rolados quando o golpe acontece,
    // depois da caminhada do atacante.
    attackerType: PieceType
    // A peça mirada, quando há uma. No incêndio serve só para o histórico: lá quem se
    // defende são as peças da área, e a mira pode ter sido uma casa vazia.
    targetId?: string
    delayMs: number
    // Ataque em área (incendiário): o quadrado que pega fogo. Todas as peças dentro dele
    // se defendem, do time que forem.
    area?: AttackArea
    // Preenchidos quando o ataque vem de um item de manipulação (o item já foi gasto na
    // tentativa de manipulação): identificam quem forçou o golpe, para o log.
    consumedItemKey?: SpecialItemKey
    consumerColor?: PieceColor
}

// Um clarão de fogo para a cena desenhar. O id garante que cada explosão seja animada
// uma vez só, mesmo que a lista seja reenviada em outro render. As casas vêm prontas
// para o desenho bater com o que queimou de verdade, paredes recortadas incluídas.
export interface FireBurst {
    id: string
    center: PiecePosition
    cells: PiecePosition[]
}

// Peças que a incendiária pegaria de tabela ao mirar em "target": todas as do time
// indicado que estão na área, tirando o próprio alvo. A IA usa isso para não se queimar.
export function alliesInBlast(
    attacker: PieceDefinition,
    target: PieceDefinition,
    pieces: PieceDefinition[],
    maze: Maze,
    color: PieceColor,
): PieceDefinition[] {
    const area = attackArea(attacker, target.position)
    if (!area) return []
    const burning = areaCells(maze, area.center, area.side)
    return piecesInCells(pieces, burning).filter((p) => p.color === color && p.id !== target.id)
}
