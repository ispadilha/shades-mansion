import type { MotivationItemKey } from "./types"

// As rivalidades: cada personagem tem uma rival, sempre de outro time,
// e as duplas são "irregulares": não seguem tipos de personagem, e sim lore.
// Um golpe corpo a corpo de uma na outra troca a defesa pela rolagem de rivalidade
// (`rollRivalry` em `combat.ts`).
const RIVALRIES: Array<[MotivationItemKey, MotivationItemKey]> = [
    ["lA", "gA"], // Drone e Gato Selvagem
    ["lB", "dA"], // Investigador Paranormal e Fantasma
    ["lC", "gB"], // Paladino Moderno e Bruxa
    ["lD", "dD"], // Policial e Renegado
    ["lE", "gF"], // Robô e Alien
    ["lF", "dF"], // Inventor e Doutor Louco
    ["gC", "dC"], // Lobisomem e Vampiro
    ["gD", "dB"], // Xamã Guerreiro e Cultista
    ["gE", "dE"], // Criptídeo e Monstro
]

export const rivalOf = (characterId: string): string | null => {
    const pair = RIVALRIES.find(([one, two]) => one === characterId || two === characterId)
    if (!pair) return null
    return pair[0] === characterId ? pair[1] : pair[0]
}

export const areRivals = (characterId: string, otherId: string) => rivalOf(characterId) === otherId
