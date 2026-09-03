import type { texts_ui } from "../constants/texts_ui"
import type { texts_characters } from "../constants/texts_characters"
import type { texts_rules } from "../constants/texts_rules"

export type PieceColor = "light" | "dark" | "gray"

export type PieceType = "A" | "B" | "C" | "D" | "E" | "F"

// Aura vale ao mesmo tempo para o tabuleiro e para o HUD.
// `palette.ts` diz de que cor cada uma é desenhada.
export type AuraKind = "active" | "manipulated"

// Quem está em destaque no tabuleiro agora: a peça (por id) e o tipo de aura dela
export type PieceAuras = Record<string, AuraKind>

export const ALL_PIECE_TYPES: PieceType[] = ["A", "B", "C", "D", "E", "F"]

export interface PiecePosition {
    x: number
    y: number
}

export interface PieceDefinition {
    id: string
    color: PieceColor
    type: PieceType
    position: PiecePosition
    movedThisTurn: boolean
    vigor: number
    maxVigor: number
    level: number
}

// A chave do item é o id da peça a que ele pertence: inicial do time + tipo ("lA", "dF"...),
// então cada peça nova traz o seu item junto, sem lista para manter à parte.
export type ItemPrefix = "d" | "g" | "l"

export type MotivationItemKey = `${ItemPrefix}${PieceType}`

const ITEM_PREFIXES: ItemPrefix[] = ["d", "g", "l"]

export interface MotivationItem {
    id: string
    key: MotivationItemKey
    position: PiecePosition
}

export type TeamInventory = MotivationItemKey[]
export type Inventories = Record<PieceColor, TeamInventory>

export const ALL_ITEM_KEYS: MotivationItemKey[] = ITEM_PREFIXES.flatMap((prefix) =>
    ALL_PIECE_TYPES.map((type): MotivationItemKey => `${prefix}${type}`),
)

export const itemKeyColor = (key: MotivationItemKey): PieceColor =>
    key[0] === "l" ? "light" : key[0] === "d" ? "dark" : "gray"

export const ALL_TEAM_COLORS: PieceColor[] = ["light", "dark", "gray"]

// O que o jogador escolhe na tela de seleção: comandar um time, todos eles
// (multi-jogador local) ou nenhum (assistir a uma partida de IA).
export type PlayerSelection = PieceColor | "all" | "none"

// Times que o jogador comanda de fato. Vazio quando ele está apenas assistindo.
export const controlledColorsFor = (selection: PlayerSelection | null): PieceColor[] => {
    if (selection === null || selection === "none") return []
    if (selection === "all") return [...ALL_TEAM_COLORS]
    return [selection]
}

export type Language = "enUS" | "ptBR"
export type TextKey = keyof typeof texts_ui

// Verbetes da biblioteca (personagens e regras).
// Cada um tem um nome curto e uma descrição longa.
export type CharacterKey = keyof typeof texts_characters
export type RuleKey = keyof typeof texts_rules
export type LoreField = "name" | "description"
