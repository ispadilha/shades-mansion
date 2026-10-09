import type { PieceDefinition, PieceType, TextKey } from "./types"
import type { DiceSpec } from "./rolls"
import { touching } from "./grid"
import { AFFINITY_DICE } from "../constants/rules"

// As duplas de afinidade: em cada time, duas peças que confiam uma na outra e se revigoram
// juntas quando uma delas começa o turno ao lado da outra
export interface AffinityDuo {
    name: TextKey
    types: [PieceType, PieceType]
}

export const AFFINITY_DUOS: AffinityDuo[] = [
    { name: "scoutDuo", types: ["A", "B"] },
    { name: "combatDuo", types: ["C", "D"] },
    { name: "tacticalDuo", types: ["E", "F"] },
]

// A dupla de que a peça faz parte, e a parceira dela no mesmo time. Null quando a parceira já
// saiu da mansão.
export const affinityOf = (piece: PieceDefinition, pieces: PieceDefinition[]) => {
    const duo = AFFINITY_DUOS.find((candidate) => candidate.types.includes(piece.type))
    const partnerType = duo?.types.find((type) => type !== piece.type)
    const partner = pieces.find((p) => p.color === piece.color && p.type === partnerType)
    return duo && partner ? { duo, partner } : null
}

// A dupla se revigora no começo do turno de uma das duas,
// se estiverem encostadas e se alguma delas tiver perdido vigor.
// Null quando não é o caso.
export const affinityAtTurnStart = (piece: PieceDefinition, pieces: PieceDefinition[]) => {
    const affinity = affinityOf(piece, pieces)
    if (!affinity || !touching(piece.position, affinity.partner.position)) return null
    const { partner } = affinity
    return piece.vigor < piece.maxVigor || partner.vigor < partner.maxVigor ? affinity : null
}

// Os dados da rolagem: os do nível mais alto entre as duas peças
export const affinityDiceOf = (piece: PieceDefinition, partner: PieceDefinition): DiceSpec =>
    AFFINITY_DICE[Math.min(Math.max(piece.level, partner.level), AFFINITY_DICE.length) - 1]

// A peça revigorada pela afinidade, sem passar do vigor máximo
export const reinvigoratedBy = (piece: PieceDefinition, amount: number): PieceDefinition => ({
    ...piece,
    vigor: Math.min(piece.maxVigor, piece.vigor + amount),
})
