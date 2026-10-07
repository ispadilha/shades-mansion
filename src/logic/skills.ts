import type { LineBlockers, PieceDefinition, PieceType, SkillId, TextKey } from "./types"
import { diceMax, type DiceSpec } from "./rolls"
import { SKILL_LEVELS, statsFor } from "../constants/rules"

// O que a habilidade faz quando o jogador a aciona:
// - "strike": vira um ataque, de perto ou de longe
// - "place": cria algo em uma casa livre, à distância
// - "charge": investida em linha reta até uma casa vazia, por cima de quem estiver no caminho
// - "mimic": copia a habilidade de outra peça, e passa a usá-la como se fosse proṕria
export type SkillEffect = "strike" | "place" | "charge" | "mimic"

export interface Skill {
    id: SkillId
    name: TextKey
    // Como a ação se chama no menu do clique direito
    action: TextKey
    effect: SkillEffect
    moves: boolean
    ranged: boolean
    blockedBy: LineBlockers
}

// O que cada habilidade faz.
// Os números (alcance, dano, usos, área) estão em `SKILL_LEVELS`, no arquivo `rules.ts`.
export const SKILLS: Record<SkillId, Skill> = {
    extraMove: {
        id: "extraMove",
        name: "skillExtraMove",
        action: "attack",
        effect: "strike",
        moves: true,
        ranged: false,
        blockedBy: { pieces: true, barriers: true },
    },
    barrier: {
        id: "barrier",
        name: "skillBarrier",
        action: "skillCreateBarrier",
        effect: "place",
        moves: false,
        ranged: true,
        blockedBy: { pieces: false, barriers: true },
    },
    charge: {
        id: "charge",
        name: "skillCharge",
        action: "skillCharge",
        effect: "charge",
        moves: false,
        ranged: false,
        blockedBy: { pieces: false, barriers: true },
    },
    longShot: {
        id: "longShot",
        name: "skillLongShot",
        action: "skillShoot",
        effect: "strike",
        moves: false,
        ranged: true,
        blockedBy: { pieces: true, barriers: true },
    },
    mimic: {
        id: "mimic",
        name: "skillMimic",
        action: "skillImitate",
        effect: "mimic",
        moves: false,
        ranged: true,
        blockedBy: { pieces: false, barriers: true },
    },
    fire: {
        id: "fire",
        name: "skillFire",
        action: "skillBurn",
        effect: "strike",
        moves: false,
        ranged: true,
        blockedBy: { pieces: false, barriers: true },
    },
}

const SKILL_BY_TYPE: Record<PieceType, SkillId> = {
    A: "extraMove",
    B: "barrier",
    C: "charge",
    D: "longShot",
    E: "mimic",
    F: "fire",
}

export const skillFor = (type: PieceType): Skill => SKILLS[SKILL_BY_TYPE[type]]

// A habilidade que a imitação copia de uma peça: só não pode ser outra imitação
export const imitableSkillOf = (model: PieceDefinition): Skill | null => {
    const skill = skillFor(model.type)
    return skill.effect !== "mimic" ? skill : null
}

export const hasRangedAttackSkill = (type: PieceType) => {
    const skill = skillFor(type)
    return skill.ranged && skill.effect === "strike"
}

// O valor de uma grandeza da habilidade no nível em que a peça está
const levelValue = <T>(values: readonly T[] | undefined, level: number): T | null => {
    if (!values || values.length === 0) return null
    return values[Math.min(Math.max(level, 1), values.length) - 1]
}

// Os dados que sorteiam o alcance da habilidade, quando ela o sorteia
export const skillRollOf = (skill: Skill, piece: PieceDefinition): DiceSpec | null =>
    levelValue(SKILL_LEVELS[skill.id].rangeDice, piece.level)

// O alcance fixo da habilidade, quando ela não o sorteia
export const skillRangeOf = (skill: Skill, piece: PieceDefinition): number | null =>
    levelValue(SKILL_LEVELS[skill.id].fixedRange, piece.level)

// O maior alcance que a habilidade pode ter: o fixo, ou o maior número que os dados dela tiram
export const skillMaxRangeOf = (skill: Skill, piece: PieceDefinition): number => {
    const dice = skillRollOf(skill, piece)
    return dice ? diceMax(dice) : (skillRangeOf(skill, piece) ?? 0)
}

// Os dados de dano da habilidade, quando ela tem os seus
export const skillDamageOf = (skill: Skill, piece: PieceDefinition): DiceSpec | null =>
    levelValue(SKILL_LEVELS[skill.id].damageDice, piece.level)

export const skillChargesOf = (skill: Skill, piece: PieceDefinition): number | null =>
    levelValue(SKILL_LEVELS[skill.id].charges, piece.level)

// O lado do quadrado que a habilidade incendeia. Null quando ela não atinge uma área.
export const skillAreaSideOf = (skill: Skill, piece: PieceDefinition): number | null =>
    levelValue(SKILL_LEVELS[skill.id].areaSide, piece.level)

export interface ActiveSkill {
    skill: Skill
    pieceId: string
    // Alcance: sorteado no dado, ou o fixo, que `skillRangeOf` diz
    range: number
    // O dano já sorteado, para a habilidade que rola o próprio dano antes de agir
    damage?: number
    // Casos em que não pode voltar atrás
    committed: boolean
    // A habilidade por meio da qual a peça usa esta, quando não é a dela: a imitação
    via?: Skill
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
    blockedBy: LineBlockers
    // O que a habilidade faz. A que não golpeia diretamente ("place", "charge", "mimic")
    // é usada numa casa escolhida entre as destacadas para ela.
    effect: SkillEffect
    // O lado do quadrado que ela incendeia, para a que atinge uma área
    area: number | null
}

// Até onde a habilidade chega partindo desta peça, com este alcance:
// o sorteado ou fixo, quando ela está em uso,
// ou o maior que ela pode ter, quando a peça está só sendo consultada
export const reachOf = (skill: Skill, piece: PieceDefinition, range: number): SkillReach => {
    const { effect, blockedBy } = skill
    const area = skillAreaSideOf(skill, piece)
    if (effect === "place" || effect === "mimic") {
        return { move: 0, attack: range, ranged: true, blockedBy, effect, area }
    }
    if (effect === "charge") return { move: 0, attack: range, ranged: false, blockedBy, effect, area }
    return skill.moves
        ? { move: range, attack: range, ranged: false, blockedBy, effect, area }
        : { move: 0, attack: range, ranged: skill.ranged, blockedBy, effect, area }
}

// O dano no ataque: os dados da habilidade, quando ela tem, ou o golpe comum da peça
export const damageOf = (piece: PieceDefinition, skill: Skill | null): DiceSpec =>
    (skill ? skillDamageOf(skill, piece) : null) ?? statsFor(piece.type, piece.level).damage
