export type CoinFace = "heads" | "tails"

export type DieSides = 12 | 20

export type RollKind = "coin" | "d12" | "d20"

// Face que aparece em uma moeda "parada": usada pelas animações antes do resultado sair
export const COIN_FACES: CoinFace[] = ["heads", "tails"]

export const flipCoin = (): CoinFace => (Math.random() < 0.5 ? "heads" : "tails")

export const rollDie = (sides: DieSides): number => 1 + Math.floor(Math.random() * sides)

export const rollD12 = (): number => rollDie(12)

export const rollD20 = (): number => rollDie(20)

// Uma rolagem com vários dados: todos caem juntos e o resultado é a soma. Devolve o
// valor de cada dado, na ordem em que devem aparecer na tela.
export const rollDice = (count: number, sides: DieSides): number[] =>
    Array.from({ length: count }, () => rollDie(sides))

export const sumDice = (dice: number[]): number => dice.reduce((total, value) => total + value, 0)
