import type { CharacterDefinition, CharacterType, MotivationItemKey } from "./types"
import { characterKey, itemKeyColor, keyCharacterType } from "./types"
import type { DiceSpec } from "./rolls"
import { touching } from "./grid"
import { AFFINITY_DICE } from "../constants/rules"

// As duplas de afinidade: em cada time, duas personagens que se revigoram
// juntas quando uma delas começa o turno ao lado da outra
const AFFINITY_DUOS: Array<[CharacterType, CharacterType]> = [
    ["A", "B"],
    ["C", "D"],
    ["E", "F"],
]

// O outro tipo da dupla.
const partnerTypeOf = (type: CharacterType): CharacterType => {
    const duo = AFFINITY_DUOS.find((types) => types.includes(type))!
    return duo[0] === type ? duo[1] : duo[0]
}

// A chave da parceira de dupla de uma personagem, pela chave dela.
export const affinityPartnerKey = (key: MotivationItemKey): MotivationItemKey =>
    characterKey(itemKeyColor(key), partnerTypeOf(keyCharacterType(key)))

// A parceira de dupla da personagem, no mesmo time. Null quando ela já saiu da mansão.
export const affinityPartnerOf = (character: CharacterDefinition, characters: CharacterDefinition[]): CharacterDefinition | null =>
    characters.find((p) => p.id === affinityPartnerKey(character.id as MotivationItemKey)) ?? null

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
