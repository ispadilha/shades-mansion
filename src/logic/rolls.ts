import { pickRandom, randomInt } from "./random"

export type CoinFace = "heads" | "tails"

export type DieSides = 12 | 20

export type RollKind = "coin" | "d12" | "d20"

// Face que aparece em uma moeda "parada": usada pelas animações antes do resultado sair
export const COIN_FACES: CoinFace[] = ["heads", "tails"]

export const flipCoin = (): CoinFace => pickRandom(COIN_FACES)

export const rollDie = (sides: DieSides): number => randomInt(1, sides)

export const sidesOf = (kind: RollKind): DieSides => (kind === "d20" ? 20 : 12)

export const rollD12 = (): number => rollDie(12)

export const rollD20 = (): number => rollDie(20)

// Uma rolagem com vários dados: todos caem juntos e o resultado é a soma. Devolve o
// valor de cada dado, na ordem em que devem aparecer na tela.
export const rollDice = (count: number, sides: DieSides): number[] =>
    Array.from({ length: count }, () => rollDie(sides))

export const sumDice = (dice: number[]): number => dice.reduce((total, value) => total + value, 0)

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
