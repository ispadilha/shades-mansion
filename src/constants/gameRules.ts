import type { PieceType } from "../logic/types"

export const MAX_HP = 3

export const PIECE_STATS: Record<PieceType, { moveRange: number; attackRange: number; attackDamage: number; ranged?: boolean }> = {
    A: { moveRange: 9, attackRange: 7, attackDamage: 1 },
    B: { moveRange: 7, attackRange: 5, attackDamage: 2 },
    C: { moveRange: 5, attackRange: 3, attackDamage: 3 },
    D: { moveRange: 5, attackRange: 7, attackDamage: 1, ranged: true },
}

export const isRanged = (type: PieceType) => PIECE_STATS[type].ranged === true
