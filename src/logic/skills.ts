import type { PieceType, TextKey } from "./types"

export type SkillId = "longShot" | "fire"

export interface Skill {
    id: SkillId
    name: TextKey
    action: TextKey
    ranged: boolean
    area: boolean
}

export const SKILLS: Record<SkillId, Skill> = {
    longShot: { id: "longShot", name: "skillLongShot", action: "skillShoot", ranged: true, area: false },
    fire: { id: "fire", name: "skillFire", action: "skillBurn", ranged: true, area: true },
}

const SKILL_BY_TYPE: Partial<Record<PieceType, SkillId>> = {
    D: "longShot",
    F: "fire",
}

export const skillFor = (type: PieceType): Skill | null => {
    const id = SKILL_BY_TYPE[type]
    return id ? SKILLS[id] : null
}

export const hasRangedSkill = (type: PieceType) => skillFor(type)?.ranged === true
export const hasAreaSkill = (type: PieceType) => skillFor(type)?.area === true
