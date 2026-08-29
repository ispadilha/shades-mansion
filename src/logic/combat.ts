import type { PieceColor, SpecialItemKey } from "./types"
import { flipCoin, type CoinFace } from "./rolls"

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

// Um ataque já decidido (alvo escolhido, atacante a caminho) esperando a moeda.
// `delayMs` é o tempo que o atacante leva para chegar até o alvo — a moeda só é jogada
// depois disso, para que o desenho na tela acompanhe a rolagem.
export interface PendingAttack {
    attackerId: string
    targetId: string
    damage: number
    delayMs: number
    // Preenchidos quando o ataque vem de um item de manipulação (o item já foi gasto na
    // tentativa de manipulação): identificam quem forçou o golpe, para o log.
    consumedItemKey?: SpecialItemKey
    consumerColor?: PieceColor
}
