import type { PieceColor, PieceDefinition, SpecialItemKey } from "./types"
import { itemKeyColor } from "./types"
import { MAX_LEVEL, statsFor } from "../constants/rules"

export type ItemUse = "heal" | "promote" | "manipulate"

export const canPromote = (piece: PieceDefinition) => piece.level < MAX_LEVEL && piece.hp >= piece.maxHp

// Para o que este item serve agora. Null quando não serve para nada: a peça já saiu do
// tabuleiro, ou está inteira e no último nível.
export const itemUseFor = (
    key: SpecialItemKey,
    piece: PieceDefinition | undefined,
    holder: PieceColor,
): ItemUse | null => {
    if (!piece) return null
    if (itemKeyColor(key) !== holder) return "manipulate"
    if (piece.hp < piece.maxHp) return "heal"
    return canPromote(piece) ? "promote" : null
}

// A peça promovida entra no nível novo com a vida cheia
export const promoted = (piece: PieceDefinition): PieceDefinition => {
    const level = piece.level + 1
    const { maxHp } = statsFor(piece.type, level)
    return { ...piece, level, hp: maxHp, maxHp }
}

// A peça curada volta à vida cheia do nível em que está
export const healed = (piece: PieceDefinition): PieceDefinition => ({ ...piece, hp: piece.maxHp })
