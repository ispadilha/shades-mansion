import type { Piece, PieceColor } from "./types"
import { reachableCells, manhattan } from "./movement"

export class SimpleAI {
    static makeMove(pieces: Piece[], color: PieceColor, boardSize: number): { updatedPieces: Piece[] } {
        const enemyColor = color === "light" ? "dark" : "light"
        const myPieces = pieces.filter(p => p.color === color && !p.movedThisTurn)
        const enemyPieces = pieces.filter(p => p.color === enemyColor)
        
        // Tentar atacar primeiro
        for (const myPiece of myPieces) {
            const attackTarget = this.findAttackTarget(myPiece, enemyPieces)
            if (attackTarget) {
                const updatedPieces = pieces.map(p => 
                    p.id === myPiece.id 
                        ? { ...p, movedThisTurn: true }
                        : p
                ).filter(p => p.id !== attackTarget.id)
                
                return { updatedPieces }
            }
        }
        
        // Se não pode atacar, mover aleatoriamente
        for (const myPiece of myPieces) {
            const possibleMoves = reachableCells(myPiece, pieces, boardSize, 5)
                .filter(pos => !pieces.some(p => p.position.x === pos.x && p.position.y === pos.y))
            
            if (possibleMoves.length > 0) {
                const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)]
                const updatedPieces = pieces.map(p => 
                    p.id === myPiece.id 
                        ? { ...p, position: randomMove, movedThisTurn: true }
                        : p
                )
                
                return { updatedPieces }
            }
        }
        
        return { updatedPieces: pieces }
    }
    
    private static findAttackTarget(myPiece: Piece, enemyPieces: Piece[]): Piece | null {
        for (const enemy of enemyPieces) {
            if (manhattan(myPiece.position, enemy.position) <= 5) {
                return enemy
            }
        }
        return null
    }
}