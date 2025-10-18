import type { texts } from "../constants/texts"

export type PieceColor = "light" | "dark"

export interface PiecePosition {
    x: number
    y: number
}

export interface PieceType {
    id: string
    color: PieceColor
    position: PiecePosition
    movedThisTurn: boolean
}

export type Language = "enUS" | "ptBR"
export type TextKey = keyof typeof texts
