import type { PieceDefinition } from "./types"
import { skillFor } from "./skills"

export type TurnStage =
    // Ainda tem a ação comum
    | "idle"
    // Já se moveu e/ou golpeou, mas ainda tem habilidade
    | "moved"
    // Não sobrou nada: só encerrar o turno
    | "spent"

export const hasSkillLeft = (piece: PieceDefinition) =>
    skillFor(piece.type) !== null && !piece.usedSkillThisTurn

export const turnStageOf = (piece: PieceDefinition): TurnStage => {
    if (!piece.movedThisTurn) return "idle"
    return hasSkillLeft(piece) ? "moved" : "spent"
}

export const isSpent = (piece: PieceDefinition) => turnStageOf(piece) === "spent"
