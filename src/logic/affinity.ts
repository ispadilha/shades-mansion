import type { PieceDefinition, PieceType } from "./types"
import type { DiceSpec } from "./rolls"
import { touching } from "./grid"
import { AFFINITY_DICE } from "../constants/rules"

// As duplas de afinidade: em cada time, duas peças que confiam uma na outra e se revigoram
// juntas quando uma delas começa o turno ao lado da outra
const AFFINITY_DUOS: Array<[PieceType, PieceType]> = [
    ["A", "B"],
    ["C", "D"],
    ["E", "F"],
]

// A parceira de dupla da peça, no mesmo time. Null quando ela já saiu da mansão.
export const affinityPartnerOf = (piece: PieceDefinition, pieces: PieceDefinition[]): PieceDefinition | null => {
    const duo = AFFINITY_DUOS.find((types) => types.includes(piece.type))
    const partnerType = duo?.find((type) => type !== piece.type)
    return pieces.find((p) => p.color === piece.color && p.type === partnerType) ?? null
}

// A dupla se revigora no começo do turno de uma das duas,
// se estiverem encostadas e se alguma delas tiver perdido vigor.
// Devolve a parceira, ou null quando não é o caso.
export const affinityAtTurnStart = (piece: PieceDefinition, pieces: PieceDefinition[]): PieceDefinition | null => {
    const partner = affinityPartnerOf(piece, pieces)
    if (!partner || !touching(piece.position, partner.position)) return null
    return piece.vigor < piece.maxVigor || partner.vigor < partner.maxVigor ? partner : null
}

// Os dados da rolagem: os do nível mais alto entre as duas peças
export const affinityDiceOf = (piece: PieceDefinition, partner: PieceDefinition): DiceSpec =>
    AFFINITY_DICE[Math.min(Math.max(piece.level, partner.level), AFFINITY_DICE.length) - 1]

// A peça revigorada pela afinidade, sem passar do vigor máximo
export const reinvigoratedBy = (piece: PieceDefinition, amount: number): PieceDefinition => ({
    ...piece,
    vigor: Math.min(piece.maxVigor, piece.vigor + amount),
})
