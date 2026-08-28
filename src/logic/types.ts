import type { texts_ui } from "../constants/texts_ui"
import type { texts_characters } from "../constants/texts_characters"
import type { texts_rules } from "../constants/texts_rules"

export type PieceColor = "light" | "dark" | "gray"

export type PieceType = "A" | "B" | "C" | "D"

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
    hp: number
    maxHp: number
}

export type SpecialItemKey =
    | "dA"
    | "dB"
    | "dC"
    | "dD"
    | "gA"
    | "gB"
    | "gC"
    | "gD"
    | "lA"
    | "lB"
    | "lC"
    | "lD"

export interface SpecialItem {
    id: string
    key: SpecialItemKey
    position: PiecePosition
}

export type TeamInventory = SpecialItemKey[]
export type Inventories = Record<PieceColor, TeamInventory>

export const ALL_ITEM_KEYS: SpecialItemKey[] = ["dA", "dB", "dC", "dD", "gA", "gB", "gC", "gD", "lA", "lB", "lC", "lD"]

export const itemKeyColor = (key: SpecialItemKey): PieceColor =>
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
