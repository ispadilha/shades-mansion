import type { PieceDefinition, PieceType, TextKey } from "./types"
import type { DiceSpec } from "./rolls"
import { statsFor, climbDamageLadder } from "../constants/rules"

export type SkillId = "extraMove" | "longShot" | "fire"

export interface Skill {
    id: SkillId
    name: TextKey
    action: TextKey
    roll: DiceSpec | null
    // O quanto a habilidade alcança além do ataque comum da própria peça.
    // É relativo, e não um número fixo, para o tiro longo continuar sendo longo
    // depois de a peça subir de nível.
    // Um alcance fixo acabaria alcançado pelo ataque comum dela.
    rangeBonus: number
    moves: boolean
    ranged: boolean
    area: boolean
    // Degraus que o dado de dano sobe na escada das promoções
    damageSteps: number
}

export const SKILLS: Record<SkillId, Skill> = {
    extraMove: {
        id: "extraMove",
        name: "skillExtraMove",
        action: "attack",
        roll: { count: 1, sides: 10 },
        rangeBonus: 0,
        moves: true,
        ranged: false,
        area: false,
        damageSteps: 0,
    },
    longShot: {
        id: "longShot",
        name: "skillLongShot",
        action: "skillShoot",
        roll: null,
        rangeBonus: 3,
        moves: false,
        ranged: true,
        area: false,
        damageSteps: 2,
    },
    fire: {
        id: "fire",
        name: "skillFire",
        action: "skillBurn",
        roll: null,
        rangeBonus: 1,
        moves: false,
        ranged: true,
        area: true,
        damageSteps: 1,
    },
}

const SKILL_BY_TYPE: Partial<Record<PieceType, SkillId>> = {
    A: "extraMove",
    D: "longShot",
    F: "fire",
}

export const skillFor = (type: PieceType): Skill | null => {
    const id = SKILL_BY_TYPE[type]
    return id ? SKILLS[id] : null
}

export const hasRangedSkill = (type: PieceType) => skillFor(type)?.ranged === true
export const hasAreaSkill = (type: PieceType) => skillFor(type)?.area === true

export interface ActiveSkill {
    skill: Skill
    pieceId: string
    // Alcance: sorteado no dado, ou o alcance de ataque da peça quando não há dado
    range: number
    // Casos em que não pode voltar atrás
    committed: boolean
}

// "commited" evita trapaça de cancelar e tentar rolar outro número melhor no mesmo turno
export const cancelCostsSkill = (active: ActiveSkill | null) => active?.committed === true

export interface SkillReach {
    move: number
    attack: number
    ranged: boolean
}

export const reachOf = (active: ActiveSkill): SkillReach =>
    active.skill.moves
        ? { move: active.range, attack: active.range, ranged: false }
        : { move: 0, attack: active.range, ranged: active.skill.ranged }

// O alcance com que uma habilidade sem dado entra em uso.
// A que rola dado entra em zero: quem diz o alcance dela é a rolagem.
export const baseRangeOf = (skill: Skill, piece: PieceDefinition) =>
    skill.roll ? 0 : statsFor(piece.type, piece.level).attackRange + skill.rangeBonus

export const damageOf = (piece: PieceDefinition, skill: Skill | null): DiceSpec => {
    const { damage } = statsFor(piece.type, piece.level)
    return skill ? climbDamageLadder(damage, skill.damageSteps) : damage
}
