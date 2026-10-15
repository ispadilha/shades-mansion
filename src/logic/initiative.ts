import { rollDice, sumDice } from "./rolls"
import { DISTINCT_INITIATIVE_TOTALS, INITIATIVE_DICE, INITIATIVE_DIE } from "../constants/rules"

// Uma jogada dos dados. As recusadas (accepted: false) ficam no histórico porque a tela
// de iniciativa mostra a re-rolagem acontecendo.
export interface InitiativeAttempt {
    characterId: string
    dice: number[]
    total: number
    accepted: boolean
}

export interface InitiativeResult {
    // Todas as jogadas, na ordem em que aconteceram (inclui as recusadas)
    attempts: InitiativeAttempt[]
    // Valor final de cada personagem
    values: Record<string, number>
    // Ids das personagens, do maior valor para o menor: a ordem dos turnos
    order: string[]
}

export function rollInitiative(characterIds: string[]): InitiativeResult {
    const attempts: InitiativeAttempt[] = []
    const values: Record<string, number> = {}
    const taken = new Set<number>()

    const roll = () => {
        const dice = rollDice(INITIATIVE_DICE, INITIATIVE_DIE)
        return { dice, total: sumDice(dice) }
    }

    for (const characterId of characterIds) {
        let attempt = roll()
        // Com mais personagens do que somas possíveis não sobraria número livre:
        // aí o valor repetido seria aceito,
        // e o desempate seria a ordem em que as personagens rolaram.
        while (taken.has(attempt.total) && taken.size < DISTINCT_INITIATIVE_TOTALS) {
            attempts.push({ characterId, ...attempt, accepted: false })
            attempt = roll()
        }

        attempts.push({ characterId, ...attempt, accepted: true })
        taken.add(attempt.total)
        values[characterId] = attempt.total
    }

    // Ordenação estável: em um empate (só possível no caso acima) quem rolou antes age antes
    const order = [...characterIds].sort((a, b) => values[b] - values[a])

    return { attempts, values, order }
}

export interface NextTurn {
    index: number
    // true quando a ordem deu a volta: começou uma nova rodada
    newRound: boolean
}

// Próxima posição da ordem ocupada por uma personagem ainda em jogo. As eliminadas são puladas
// (a ordem em si nunca muda). Retorna null se não sobrou ninguém.
export function nextTurnIndex(order: string[], inInPlay: (characterId: string) => boolean, from: number): NextTurn | null {
    for (let step = 1; step <= order.length; step++) {
        const raw = from + step
        const index = raw % order.length
        if (inInPlay(order[index])) return { index, newRound: raw >= order.length }
    }
    return null
}
