import type { PieceColor, PieceDefinition, MotivationItemKey } from "./types"
import { itemKeyColor } from "./types"
import { MAX_LEVEL, statsFor } from "../constants/rules"

export type ItemUse = "reinvigorate" | "promote" | "manipulate"

export const canPromote = (piece: PieceDefinition) => piece.level < MAX_LEVEL && piece.vigor >= piece.maxVigor

// Para o que este item serve agora. Null quando não serve para nada: a peça já saiu do
// tabuleiro, ou está inteira e no último nível.
export const itemUseFor = (
    key: MotivationItemKey,
    piece: PieceDefinition | undefined,
    holder: PieceColor,
): ItemUse | null => {
    if (!piece) return null
    if (itemKeyColor(key) !== holder) return "manipulate"
    if (piece.vigor < piece.maxVigor) return "reinvigorate"
    return canPromote(piece) ? "promote" : null
}

// A peça promovida entra no nível novo com o vigor cheio
export const promoted = (piece: PieceDefinition): PieceDefinition => {
    const level = piece.level + 1
    const { maxVigor } = statsFor(piece.type, level)
    return { ...piece, level, vigor: maxVigor, maxVigor }
}

// A peça revigorada volta ao vigor cheio do nível em que está
export const reinvigorated = (piece: PieceDefinition): PieceDefinition => ({ ...piece, vigor: piece.maxVigor })
