import type { texts } from "../constants/texts"

export type PieceColor = "light" | "dark"

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

export type Language = "enUS" | "ptBR"
export type TextKey = keyof typeof texts
