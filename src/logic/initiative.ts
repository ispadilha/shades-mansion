import { rollD20 } from "./rolls"

export const INITIATIVE_DIE = 20

// Uma jogada do dado. As recusadas (accepted: false) ficam no histórico porque a tela
// de iniciativa mostra a re-rolagem acontecendo.
export interface InitiativeAttempt {
    pieceId: string
    value: number
    accepted: boolean
}

export interface InitiativeResult {
    // Todas as jogadas, na ordem em que aconteceram (inclui as recusadas)
    attempts: InitiativeAttempt[]
    // Valor final de cada peça
    values: Record<string, number>
    // Ids das peças, do maior valor para o menor: a ordem dos turnos
    order: string[]
}

export function rollInitiative(pieceIds: string[]): InitiativeResult {
    const attempts: InitiativeAttempt[] = []
    const values: Record<string, number> = {}
    const taken = new Set<number>()

    for (const pieceId of pieceIds) {
        let value = rollD20()
        // Com mais peças do que faces não sobraria número livre:
        // aí o valor repetido seria aceito,
        // e o desempate seria a ordem em que as peças rolaram.
        while (taken.has(value) && taken.size < INITIATIVE_DIE) {
            attempts.push({ pieceId, value, accepted: false })
            value = rollD20()
        }

        attempts.push({ pieceId, value, accepted: true })
        taken.add(value)
        values[pieceId] = value
    }

    // Ordenação estável: em um empate (só possível no caso acima) quem rolou antes age antes
    const order = [...pieceIds].sort((a, b) => values[b] - values[a])

    return { attempts, values, order }
}

export interface NextTurn {
    index: number
    // true quando a ordem deu a volta: começou uma nova rodada
    newRound: boolean
}

// Próxima posição da ordem ocupada por uma peça ainda viva. As eliminadas são puladas
// (a ordem em si nunca muda). Retorna null se não sobrou ninguém.
export function nextTurnIndex(order: string[], isAlive: (pieceId: string) => boolean, from: number): NextTurn | null {
    for (let step = 1; step <= order.length; step++) {
        const raw = from + step
        const index = raw % order.length
        if (isAlive(order[index])) return { index, newRound: raw >= order.length }
    }
    return null
}
