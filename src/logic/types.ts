import type { texts } from "../constants/texts"

export type PieceColor = "light" | "dark"

export interface Position {
    x: number
    y: number
}

export interface Piece {
    id: string
    color: PieceColor
    position: Position
    movedThisTurn: boolean
}

export type Language = "enus" | "ptbr"
export type TextKey = keyof typeof texts
