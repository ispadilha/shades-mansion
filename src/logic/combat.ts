import type { PieceColor, PieceDefinition, PiecePosition, SpecialItemKey } from "./types"
import type { Maze } from "./maze"
import { isWalkable } from "./maze"
import { positionKey } from "./movement"
import { flipCoin, type CoinFace } from "./rolls"
import { FIRE_AREA_SIDE, isAreaAttack } from "../constants/gameRules"

export const SUCCESS_FACE: CoinFace = "heads"

export interface CoinCheck {
    face: CoinFace
    success: boolean
}

const flipCheck = (): CoinCheck => {
    const face = flipCoin()
    return { face, success: face === SUCCESS_FACE }
}

export const rollAttack = (): CoinCheck => flipCheck()

// Item de manipulação: 50% de chance de a peça cair sob o controle de quem usou.
// O item é gasto de qualquer jeito.
export const rollManipulation = (): CoinCheck => flipCheck()

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

        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const next = { x: cell.x + dx, y: cell.y + dy }
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

export interface AttackArea {
    center: PiecePosition
    side: number
}

export const attackArea = (attacker: PieceDefinition, target: PiecePosition): AttackArea | undefined =>
    isAreaAttack(attacker.type) ? { center: { ...target }, side: FIRE_AREA_SIDE } : undefined

// Um ataque já decidido (alvo escolhido, atacante a caminho) esperando a moeda.
// `delayMs` é o tempo que o atacante leva para chegar até o alvo — a moeda só é jogada
// depois disso, para que o desenho na tela acompanhe a rolagem.
export interface PendingAttack {
    attackerId: string
    targetId: string
    damage: number
    delayMs: number
    // Ataque em área (incendiário): o dano vale para todas as peças dentro do quadrado,
    // do time que forem. Quem está na área é decidido na hora do dano, não aqui.
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
