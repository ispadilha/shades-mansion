import type { texts } from "../constants/texts"

export type PieceColor = "light" | "dark" | "gray"

export type PieceType = "A" | "B" | "C"

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
    | "gA"
    | "gB"
    | "gC"
    | "lA"
    | "lB"
    | "lC"

export interface SpecialItem {
    id: string
    key: SpecialItemKey
    position: PiecePosition
}

export type TeamInventory = SpecialItemKey[]
export type Inventories = Record<PieceColor, TeamInventory>

export const ALL_ITEM_KEYS: SpecialItemKey[] = ["dA", "dB", "dC", "gA", "gB", "gC", "lA", "lB", "lC"]

export const itemKeyColor = (key: SpecialItemKey): PieceColor =>
    key[0] === "l" ? "light" : key[0] === "d" ? "dark" : "gray"

export type Language = "enUS" | "ptBR"
export type TextKey = keyof typeof texts
