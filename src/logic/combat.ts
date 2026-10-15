import type { Barrier, CharacterColor, CharacterDefinition, CharacterPosition } from "./types"
import type { Maze } from "./maze"
import { isWalkable } from "./maze"
import { NO_BLOCKED_CELLS, manhattan, neighbors, positionKey, type BlockedCells } from "./grid"
import { flipCoin, rollDie, rollSpec, sumDice, type CoinFace, type DiceSpec } from "./rolls"
import { skillAreaSideOf, skillFor, type Skill } from "./skills"
import { DEFENSE_DIE, DISPEL_DIE, DISPEL_MIN_ROLL, GUARDED_DAMAGE_SHARE, SUCCESS_FACE, statsFor } from "../constants/rules"

export interface CoinCheck {
    face: CoinFace
    success: boolean
}

export const rollManipulation = (): CoinCheck => {
    const face = flipCoin()
    return { face, success: face === SUCCESS_FACE }
}

// Nenhuma personagem ataca as aliadas, nem sob manipulação.
// `commander` é quem manda no golpe: o time da personagem, ou quem a manipula. A manipulada
// também não ataca esse time, então o golpe dela só pode ir para o terceiro.
// O alvo pode ser uma barreira: dissipá-la é atacá-la.
export const mayAttack = (attacker: CharacterDefinition, target: { color: CharacterColor }, commander: CharacterColor) =>
    target.color !== attacker.color && target.color !== commander

// Cada tipo de personagem rola seus dados de dano.
export interface DamageRoll {
    dice: number[]
    total: number
}

export function rollDamage(spec: DiceSpec): DamageRoll {
    const dice = rollSpec(spec)
    return { dice, total: sumDice(dice) }
}

// Como a personagem atacada se saiu: desviou do golpe, aparou parte dele, ou levou tudo
export type DefenseOutcome = "dodged" | "guarded" | "clean"

export interface DefenseRoll {
    die: number
    outcome: DefenseOutcome
    // O que sobrou do dano depois da defesa
    damage: number
}

// A defesa é um dado contra os dois números da personagem.
// Alcançando a esquiva, o golpe é desviado.
// Alcançando só o aparo, a personagem segura o que pode e leva só parte do dano.
export function rollDefense(character: CharacterDefinition, damage: number): DefenseRoll {
    const { dodge, guard } = statsFor(character.type, character.level)
    const die = rollDie(DEFENSE_DIE)

    if (die >= dodge) return { die, outcome: "dodged", damage: 0 }
    if (die >= guard) return { die, outcome: "guarded", damage: Math.ceil(damage * GUARDED_DAMAGE_SHARE) }
    return { die, outcome: "clean", damage }
}

export interface DispelRoll {
    die: number
    success: boolean
}

// A tentativa de dissipar uma barreira: o mesmo dado e o mesmo mínimo para qualquer personagem
export const rollDispel = (): DispelRoll => {
    const die = rollDie(DISPEL_DIE)
    return { die, success: die >= DISPEL_MIN_ROLL }
}

// As casas que o fogo alcança.
// Ele nasce na casa mirada e se espalha de casa em casa. Paredes seguram o fogo.
// O lado é ímpar para a casa mirada ficar bem no centro. Um lado par é arredondado para cima.
//
// `fire` diz de quem é o fogo e quais barreiras estão acesas:
// as dos outros times seguram o fogo, e a do próprio time ele atravessa.
// O que não segura fogo é personagem. É por isso que aqui entram as barreiras,
// e não o conjunto inteiro de casas fechadas pra quem anda.
export function areaCells(
    maze: Maze,
    center: CharacterPosition,
    side: number,
    fire?: { color: CharacterColor; barriers: Barrier[] },
): CharacterPosition[] {
    const blocked: BlockedCells = fire
        ? new Set(fire.barriers.filter((b) => b.color !== fire.color).map((b) => positionKey(b.position)))
        : NO_BLOCKED_CELLS

    if (!isWalkable(maze, center.x, center.y) || blocked.has(positionKey(center))) return []

    const radius = Math.floor(side / 2)
    const inSquare = (cell: CharacterPosition) =>
        Math.abs(cell.x - center.x) <= radius && Math.abs(cell.y - center.y) <= radius

    const burning: CharacterPosition[] = []
    const seen = new Set<string>([positionKey(center)])
    const queue: CharacterPosition[] = [center]

    while (queue.length > 0) {
        const cell = queue.shift()!
        burning.push(cell)

        for (const next of neighbors(cell)) {
            if (!inSquare(next) || !isWalkable(maze, next.x, next.y)) continue
            const key = positionKey(next)
            if (seen.has(key) || blocked.has(key)) continue
            seen.add(key)
            queue.push(next)
        }
    }

    return burning
}

// Quem está em cima das casas em chamas. Aliados do atacante entram na lista.
// É isso que torna o ataque em área arriscado.
export function charactersInCells(characters: CharacterDefinition[], cells: CharacterPosition[]): CharacterDefinition[] {
    const burning = new Set(cells.map(positionKey))
    return characters.filter((p) => burning.has(positionKey(p.position)))
}

// Personagens do centro do estouro para fora: é a ordem em que se defendem
export function charactersInBlast(
    characters: CharacterDefinition[],
    cells: CharacterPosition[],
    center: CharacterPosition,
): CharacterDefinition[] {
    return charactersInCells(characters, cells).sort(
        (a, b) =>
            manhattan(a.position, center) - manhattan(b.position, center) ||
            a.position.y - b.position.y ||
            a.position.x - b.position.x,
    )
}

export interface AttackArea {
    center: CharacterPosition
    side: number
}

// O quadrado que a habilidade de área incendeia em volta do alvo, no nível do atacante.
// Quem chama diz a habilidade: a personagem pode estar usando uma que não é a dela, pela imitação.
export const attackArea = (
    attacker: CharacterDefinition,
    skill: Skill | null,
    target: CharacterPosition,
): AttackArea | undefined => {
    const side = skill ? skillAreaSideOf(skill, attacker) : null
    return side === null ? undefined : { center: { ...target }, side }
}

// Um ataque já decidido (alvo ou casa escolhidos, atacante a caminho) esperando os dados.
// `delayMs` é o tempo que o atacante leva para chegar até o alvo — os dados só são
// jogados depois disso, para que o desenho na tela acompanhe as rolagens.
export interface PendingAttack {
    attackerId: string
    // Os dados de dano do atacante, no nível em que ele estava. Eles só são rolados
    // quando o golpe acontece, depois da caminhada.
    damageDice: DiceSpec
    // A personagem mirada, quando há uma. No incêndio serve só para o histórico: lá quem se
    // defende são as personagens da área, e a mira pode ter sido uma casa vazia.
    targetId?: string
    delayMs: number
    // Ataque em área (incendiário): o quadrado que pega fogo. Todas as personagens dentro dele
    // se defendem, do time que forem.
    area?: AttackArea
    // Time que manipulou o atacante, quando o ataque vem de uma manipulação:
    // é ele quem joga os dados do golpe.
    manipulatedBy?: CharacterColor
}

// Uma tentativa de dissipar barreira já decidida, com a personagem a caminho da casa ao lado dela.
// Como no golpe, o dado só é jogado depois de `delayMs`, quando a personagem chega.
export interface PendingDispel {
    characterId: string
    barrier: Barrier
    delayMs: number
    // Time que manipulou a personagem, quando é o caso: é ele quem joga o dado
    manipulatedBy?: CharacterColor
}

// Um clarão de fogo para a cena desenhar. O id garante que cada explosão seja animada
// uma vez só, mesmo que a lista seja reenviada em outro render. As casas vêm prontas
// para o desenho bater com o que queimou de verdade, paredes recortadas incluídas.
export interface FireBurst {
    id: string
    center: CharacterPosition
    cells: CharacterPosition[]
}

// Um número de dano para a cena mostrar subindo acima da personagem atingida. Ele carrega a
// casa, e não o id da personagem: quem chega a zero sai do tabuleiro no mesmo instante, e o
// número ainda tem que aparecer.
export interface DamagePopup {
    id: string
    position: CharacterPosition
    amount: number
}

// Uma investida para a cena desenhar: a personagem corre em linha reta até `to`, em `durationMs`,
// em vez de caminhar pelo labirinto. Como as explosões, cada uma é animada uma vez só.
export interface ChargeRun {
    id: string
    characterId: string
    to: CharacterPosition
    durationMs: number
}

// Uma investida já decidida: a personagem já está correndo, e cada atropelada leva o dano no
// instante em que ela passa por cima, `atMs` depois da largada
export interface PendingCharge {
    characterId: string
    to: CharacterPosition
    damage: number
    durationMs: number
    hits: Array<{ characterId: string; atMs: number }>
}

// Fogo amigo: quem a incendiária pegaria de tabela ao mirar em "target" sem poder atacar.
// São as aliadas dela, ela mesma inclusive, e, sob manipulação, as personagens de quem a manipula.
// A IA usa isso para não queimar quem não deve.
export function friendlyFire(
    attacker: CharacterDefinition,
    target: CharacterDefinition,
    characters: CharacterDefinition[],
    maze: Maze,
    commander: CharacterColor,
    barriers: Barrier[],
): CharacterDefinition[] {
    const area = attackArea(attacker, skillFor(attacker.type), target.position)
    if (!area) return []
    // A conta da IA precisa ver o mesmo fogo que vai acontecer, barreiras recortadas
    const burning = areaCells(maze, area.center, area.side, { color: attacker.color, barriers })
    return charactersInCells(characters, burning).filter((p) => !mayAttack(attacker, p, commander))
}
