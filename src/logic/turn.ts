import type { CharacterDefinition } from "./types"

export type TurnStage =
    // Ainda tem a ação comum
    | "idle"
    // Já se moveu e/ou golpeou, mas ainda tem habilidade
    | "moved"
    // Não sobrou nada: só encerrar o turno
    | "spent"

export const hasSkillLeft = (character: CharacterDefinition) => !character.usedSkillThisTurn

export const turnStageOf = (character: CharacterDefinition): TurnStage => {
    if (!character.movedThisTurn) return "idle"
    return hasSkillLeft(character) ? "moved" : "spent"
}

export const isSpent = (character: CharacterDefinition) => turnStageOf(character) === "spent"
