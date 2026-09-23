import type { PieceDefinition, PieceType, SkillId, TextKey } from "./types"
import type { DiceSpec } from "./rolls"
import { SKILL_LEVELS, statsFor, climbDamageLadder } from "../constants/rules"

// O que a habilidade faz quando o jogador a aciona:
// - "strike": vira um ataque, de perto ou de longe
// - "place": cria algo em uma casa livre, à distância
export type SkillEffect = "strike" | "place"

export interface Skill {
    id: SkillId
    name: TextKey
    // Como a ação se chama no menu do clique direito
    action: TextKey
    effect: SkillEffect
    roll: DiceSpec | null
    // O quanto a habilidade alcança além do ataque comum da própria peça.
    // É relativo, e não um número fixo, para o tiro longo continuar sendo longo
    // depois de a peça subir de nível.
    // Um alcance fixo acabaria alcançado pelo ataque comum dela.
    // Habilidade que declara `range` em `SKILL_LEVELS` não usa este bônus.
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
        effect: "strike",
        roll: { count: 1, sides: 10 },
        rangeBonus: 0,
        moves: true,
        ranged: false,
        area: false,
        damageSteps: 0,
    },
    barrier: {
        id: "barrier",
        name: "skillBarrier",
        action: "skillCreateBarrier",
        effect: "place",
        roll: null,
        // O alcance e o número de barreiras crescem com o nível: estão em `SKILL_LEVELS`
        rangeBonus: 0,
        moves: false,
        // Acende à distância, pela mesma geometria do tiro: em linha desimpedida
        ranged: true,
        area: false,
        damageSteps: 0,
    },
    longShot: {
        id: "longShot",
        name: "skillLongShot",
        action: "skillShoot",
        effect: "strike",
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
        effect: "strike",
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
    B: "barrier",
    D: "longShot",
    F: "fire",
}

export const skillFor = (type: PieceType): Skill | null => {
    const id = SKILL_BY_TYPE[type]
    return id ? SKILLS[id] : null
}

export const hasRangedAttackSkill = (type: PieceType) => {
    const skill = skillFor(type)
    return skill?.ranged === true && skill.effect === "strike"
}

export const hasAreaSkill = (type: PieceType) => skillFor(type)?.area === true

// O valor de uma grandeza da habilidade no nível em que a peça está
const levelValue = (values: readonly number[] | undefined, level: number): number | null => {
    if (!values || values.length === 0) return null
    return values[Math.min(Math.max(level, 1), values.length) - 1]
}

// Até onde a habilidade alcança para esta peça: o que a tabela de níveis diz, ou o
// alcance de ataque dela mais o bônus da habilidade.
export const skillRangeOf = (skill: Skill, piece: PieceDefinition): number =>
    levelValue(SKILL_LEVELS[skill.id]?.range, piece.level) ??
    statsFor(piece.type, piece.level).attackRange + skill.rangeBonus

export const skillChargesOf = (skill: Skill, piece: PieceDefinition): number | null =>
    levelValue(SKILL_LEVELS[skill.id]?.charges, piece.level)

export interface ActiveSkill {
    skill: Skill
    pieceId: string
    // Alcance: sorteado no dado, ou o que `skillRangeOf` diz quando não há dado
    range: number
    // Casos em que não pode voltar atrás
    committed: boolean
}

// Depois do ponto sem volta, desistir custa a habilidade do turno. É o que impede a
// trapaça de cancelar para rolar outro número melhor, e o que faz o botão "encerrar"
// não permitir acionar a habilidade de novo no mesmo turno.
export const cancelCostsSkill = (active: ActiveSkill | null) => active?.committed === true

export const skillStaysActive = (skill: Skill) => skill.effect === "place"

// Sair de uma habilidade é "encerrar" quando ela criou algo: dali em
// diante não há como desfazer, e o jogador está fechando o que começou.
// Antes disso ainda é "cancelar".
// Habilidade que não cria algo é sempre "cancelar":
// ali o jogador só está desistindo de mirar.
export const skillExitIsFinish = (active: ActiveSkill | null) =>
    active !== null && skillStaysActive(active.skill) && cancelCostsSkill(active)

export interface SkillReach {
    move: number
    attack: number
    ranged: boolean
    // Casas em que a habilidade cria algo, quando é desse tipo
    places: boolean
}

export const reachOf = (active: ActiveSkill): SkillReach => {
    const places = active.skill.effect === "place"
    if (places) return { move: 0, attack: active.range, ranged: true, places }
    return active.skill.moves
        ? { move: active.range, attack: active.range, ranged: false, places }
        : { move: 0, attack: active.range, ranged: active.skill.ranged, places }
}

// O alcance com que uma habilidade sem dado entra em uso.
// A que rola dado entra em zero: quem diz o alcance dela é a rolagem.
export const baseRangeOf = (skill: Skill, piece: PieceDefinition) =>
    skill.roll ? 0 : skillRangeOf(skill, piece)

export const damageOf = (piece: PieceDefinition, skill: Skill | null): DiceSpec => {
    const { damage } = statsFor(piece.type, piece.level)
    return skill ? climbDamageLadder(damage, skill.damageSteps) : damage
}
