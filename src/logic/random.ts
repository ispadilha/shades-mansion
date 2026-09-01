// Os sorteios do jogo. Tudo o que depende da sorte passa por aqui — os dados e as moedas
// em `rolls.ts`, o traçado do labirinto, a distribuição dos itens, as chamas do incêndio.

export const randomInt = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1))

export const pickRandom = <T>(list: T[]): T => list[Math.floor(Math.random() * list.length)]

// Embaralha a própria lista (Fisher-Yates) e a devolve, para encadear com quem a criou
export const shuffle = <T>(list: T[]): T[] => {
    for (let i = list.length - 1; i > 0; i--) {
        const j = randomInt(0, i)
        ;[list[i], list[j]] = [list[j], list[i]]
    }
    return list
}
