import type { CharacterDefinition, CharacterType } from "./types"
import type { DiceSpec } from "./rolls"
import { touching } from "./grid"
import { AFFINITY_DICE } from "../constants/rules"

// As duplas de afinidade: em cada time, duas personagens que confiam uma na outra e se revigoram
// juntas quando uma delas começa o turno ao lado da outra
const AFFINITY_DUOS: Array<[CharacterType, CharacterType]> = [
    ["A", "B"],
    ["C", "D"],
    ["E", "F"],
]

// A parceira de dupla da personagem, no mesmo time. Null quando ela já saiu da mansão.
export const affinityPartnerOf = (character: CharacterDefinition, characters: CharacterDefinition[]): CharacterDefinition | null => {
    const duo = AFFINITY_DUOS.find((types) => types.includes(character.type))
    const partnerType = duo?.find((type) => type !== character.type)
    return characters.find((p) => p.color === character.color && p.type === partnerType) ?? null
}

// A dupla se revigora no começo do turno de uma das duas,
// se estiverem encostadas e se alguma delas tiver perdido vigor.
// Devolve a parceira, ou null quando não é o caso.
export const affinityAtTurnStart = (character: CharacterDefinition, characters: CharacterDefinition[]): CharacterDefinition | null => {
    const partner = affinityPartnerOf(character, characters)
    if (!partner || !touching(character.position, partner.position)) return null
    return character.vigor < character.maxVigor || partner.vigor < partner.maxVigor ? partner : null
}

// Os dados da rolagem: os do nível mais alto entre as duas personagens
export const affinityDiceOf = (character: CharacterDefinition, partner: CharacterDefinition): DiceSpec =>
    AFFINITY_DICE[Math.min(Math.max(character.level, partner.level), AFFINITY_DICE.length) - 1]

// A personagem revigorada pela afinidade, sem passar do vigor máximo
export const reinvigoratedBy = (character: CharacterDefinition, amount: number): CharacterDefinition => ({
    ...character,
    vigor: Math.min(character.maxVigor, character.vigor + amount),
})
