export type PieceColor = "light" | "dark"

export interface Position { x: number; y: number; }

export interface Piece {
    id: string
    color: PieceColor
    position: Position
    movedThisTurn: boolean
}
