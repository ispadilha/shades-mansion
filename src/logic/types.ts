import type { texts_ui } from "../constants/texts_ui"
import type { texts_characters } from "../constants/texts_characters"
import type { texts_rules } from "../constants/texts_rules"

export type CharacterColor = "light" | "dark" | "gray"

export type CharacterType = "A" | "B" | "C" | "D" | "E" | "F"
export const ALL_CHARACTER_TYPES: CharacterType[] = ["A", "B", "C", "D", "E", "F"]

// O nome de cada tipo, nos textos do jogo
export const CHARACTER_TYPE_NAMES: Record<CharacterType, TextKey> = {
    A: "typeAgile",
    B: "typeBarrier",
    C: "typeChampion",
    D: "typeShooter",
    E: "typeExotic",
    F: "typeFirestarter",
}

export interface CharacterPosition {
    x: number
    y: number
}

export interface CharacterDefinition {
    id: string
    color: CharacterColor
    type: CharacterType
    position: CharacterPosition
    movedThisTurn: boolean
    usedSkillThisTurn: boolean
    vigor: number
    maxVigor: number
    level: number
}

// Quem está em destaque no tabuleiro agora: a personagem (por id) e o tipo de aura dela
export type CharacterAuras = Record<string, AuraKind>

// Aura vale ao mesmo tempo para o tabuleiro e para o HUD.
// `palette.ts` diz de que cor cada uma é desenhada.
export type AuraKind = "active" | "manipulated" | "skill" | "affinity"

// Para que lado a personagem está virada no tabuleiro: a direção em que andou por último
export type Facing = "down" | "left" | "right" | "up"

// Os alcances que o tabuleiro destaca em volta da personagem selecionada.
// `palette.ts` diz de que cor cada um é pintado.
export type RangeKind = "move" | "attack" | "skill" | "skillMax"

// As habilidades que existem. O id mora aqui, e não em `logic/skills.ts`, para a tabela de
// níveis em `constants/rules.ts` poder falar dele sem que as regras dependam da lógica.
export type SkillId = "extraMove" | "barrier" | "charge" | "longShot" | "mimic" | "fire"

// O que interrompe a linha de uma habilidade que vai à distância
export interface LineBlockers {
    characters: boolean
    barriers: boolean
}

export interface Barrier {
    id: string
    // Time que passa pela barreira paranormal
    color: CharacterColor
    // Personagem que a acendeu: é uma nova vez dela que marca a expiração da barreira
    ownerId: string
    position: CharacterPosition
}

export type TeamInventory = MotivationItemKey[]
export type Inventories = Record<CharacterColor, TeamInventory>

export interface MotivationItem {
    id: string
    key: MotivationItemKey
    position: CharacterPosition
}

// A chave do item é o id da personagem a que ele pertence: inicial do time + tipo ("lA", "dF"...),
// então cada personagem nova traz o seu item junto, sem lista para manter à parte.
export type ItemPrefix = "d" | "g" | "l"
const ITEM_PREFIXES: ItemPrefix[] = ["d", "g", "l"]
const COLOR_PREFIXES: Record<CharacterColor, ItemPrefix> = { dark: "d", gray: "g", light: "l" }

export type MotivationItemKey = `${ItemPrefix}${CharacterType}`
export const ALL_ITEM_KEYS: MotivationItemKey[] = ITEM_PREFIXES.flatMap((prefix) =>
    ALL_CHARACTER_TYPES.map((type): MotivationItemKey => `${prefix}${type}`),
)

export const itemKeyColor = (key: MotivationItemKey): CharacterColor =>
    key[0] === "l" ? "light" : key[0] === "d" ? "dark" : "gray"

export const keyCharacterType = (key: MotivationItemKey): CharacterType => key[1] as CharacterType

// A chave de uma personagem pelo time e pelo tipo, a mesma do item que a motiva ("dA")
export const characterKey = (color: CharacterColor, type: CharacterType): MotivationItemKey =>
    `${COLOR_PREFIXES[color]}${type}`

export const ALL_TEAM_COLORS: CharacterColor[] = ["light", "dark", "gray"]

// O que o jogador escolhe na tela de seleção: comandar um time, todos eles
// (multi-jogador local) ou nenhum (assistir a uma partida de IA).
export type PlayerSelection = CharacterColor | "all" | "none"

// Times que o jogador comanda de fato. Vazio quando ele está apenas assistindo.
export const controlledColorsFor = (selection: PlayerSelection | null): CharacterColor[] => {
    if (selection === null || selection === "none") return []
    if (selection === "all") return [...ALL_TEAM_COLORS]
    return [selection]
}

export type Language = "enUS" | "ptBR"

// Modo de cores da interface.
// O cinza é uma variação do escuro, com a mansão e a interface em névoa
export type ColorMode = "light" | "gray" | "dark"

// O que o jogador escolheu nas opções: um modo fixo, ou acompanhar o sistema
export type ColorModeSetting = ColorMode | "system"

export type TextKey = keyof typeof texts_ui

// Verbetes da biblioteca (personagens e regras).
// Cada um tem um nome curto e uma descrição longa.
// O de personagem é uma ficha: o tipo de personagem, a história, a habilidade e a afinidade.
export type CharacterKey = keyof typeof texts_characters
export type RuleKey = keyof typeof texts_rules
export type LoreField = "name" | "description"
export type CharacterField = LoreField | "item" | "type" | "skill" | "affinity"
