import type { CharacterColor, CharacterDefinition, MotivationItemKey } from "./types"
import { itemKeyColor } from "./types"
import { MAX_LEVEL, statsFor } from "../constants/rules"

export type ItemUse = "reinvigorate" | "promote" | "manipulate"

export const canPromote = (character: CharacterDefinition) => character.level < MAX_LEVEL && character.vigor >= character.maxVigor

// Para o que este item serve agora. Null quando não serve para nada: a personagem já saiu do
// tabuleiro, ou está inteira e no último nível.
export const itemUseFor = (
    key: MotivationItemKey,
    character: CharacterDefinition | undefined,
    holder: CharacterColor,
): ItemUse | null => {
    if (!character) return null
    if (itemKeyColor(key) !== holder) return "manipulate"
    if (character.vigor < character.maxVigor) return "reinvigorate"
    return canPromote(character) ? "promote" : null
}

// A personagem promovida entra no nível novo com o vigor cheio
export const promoted = (character: CharacterDefinition): CharacterDefinition => {
    const level = character.level + 1
    const { maxVigor } = statsFor(character.type, level)
    return { ...character, level, vigor: maxVigor, maxVigor }
}

// A personagem revigorada volta ao vigor cheio do nível em que está
export const reinvigorated = (character: CharacterDefinition): CharacterDefinition => ({ ...character, vigor: character.maxVigor })
