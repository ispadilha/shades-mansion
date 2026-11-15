import type { MotivationItemKey } from "./types"
import type { PendingAttack } from "./combat"

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

// A chave da rival de uma personagem, pela chave dela.
export const rivalOf = (key: MotivationItemKey): MotivationItemKey => {
    const [one, two] = RIVALRIES.find((pair) => pair.includes(key))!
    return one === key ? two : one
}

export const areRivals = (characterId: string, otherId: string) => rivalOf(characterId as MotivationItemKey) === otherId

// Só o golpe corpo a corpo de uma rival na outra desperta a rivalidade. A distância, não.
export const awakensRivalry = (attack: PendingAttack, defenderId: string) =>
    attack.melee && areRivals(attack.attackerId, defenderId)
