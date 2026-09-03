import { pickRandom, randomInt } from "./random"

export type CoinFace = "heads" | "tails"

export type DieSides = 4 | 6 | 8 | 10 | 12 | 20

// Os dados, pelo nome que a regra usa
export type DiceKind = "d4" | "d6" | "d8" | "d10" | "d12" | "d20"

// Uma rolagem é ou de moeda, ou de dados
export type RollKind = "coin" | DiceKind

// Um punhado de dados: quantos, e de quantas faces. É assim que o dano de cada tipo de
// peça é descrito nas regras ("2d8" vira { count: 2, sides: 8 }).
export interface DiceSpec {
    count: number
    sides: DieSides
}

// Face que aparece em uma moeda "parada": usada pelas animações antes do resultado sair
export const COIN_FACES: CoinFace[] = ["heads", "tails"]

export const flipCoin = (): CoinFace => pickRandom(COIN_FACES)

export const rollDie = (sides: DieSides): number => randomInt(1, sides)

const KIND_SIDES: Record<DiceKind, DieSides> = { d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20 }

// Quantas faces o dado tem
export const sidesOf = (kind: DiceKind): DieSides => KIND_SIDES[kind]

// O contrário de acima: de quantas faces para a rolagem que desenha esse dado
export const dieKind = (sides: DieSides): DiceKind => `d${sides}`

// Uma rolagem com vários dados: todos caem juntos e o resultado é a soma. Devolve o
// valor de cada dado, na ordem em que devem aparecer na tela.
export const rollDice = (count: number, sides: DieSides): number[] =>
    Array.from({ length: count }, () => rollDie(sides))

export const sumDice = (dice: number[]): number => dice.reduce((total, value) => total + value, 0)

// Rola um punhado de dados descrito nas regras
export const rollSpec = (spec: DiceSpec): number[] => rollDice(spec.count, spec.sides)

// Como o punhado é escrito ("1d6", "2d8")
export const diceLabel = (spec: DiceSpec): string => `${spec.count}d${spec.sides}`

// Como o resultado é lido na tela: acertou, falhou, ou é só um número
export type RollTone = "good" | "bad" | "neutral"

// Uma rolagem para exibir. O resultado já foi sorteado por quem pediu a rolagem:
// a tela só encena o giro e revela o valor.
export interface RollView {
    // Muda a cada rolagem. É o que faz a animação recomeçar em uma sequência de rolagens.
    id: string
    kind: RollKind
    // Moeda: a face que saiu. Dados: o valor de cada um deles, na ordem em que aparecem.
    value: CoinFace | number[]
    title: string
    subtitle?: string
    outcome?: { label: string; tone?: RollTone }
    // Rolagem do jogador: o dado fica parado esperando um clique em cima dele.
    // As dos times que ele não comanda rolam sozinhas.
    manual?: boolean
    spinMs?: number
    holdMs?: number
}
