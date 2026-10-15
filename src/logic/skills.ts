import type { LineBlockers, CharacterDefinition, CharacterType, SkillId, TextKey } from "./types"
import { diceMax, type DiceSpec } from "./rolls"
import { SKILL_LEVELS, statsFor } from "../constants/rules"

// O que a habilidade faz quando o jogador a aciona:
// - "strike": vira um ataque, de perto ou de longe
// - "place": cria algo em uma casa livre, à distância
// - "charge": investida em linha reta até uma casa vazia, por cima de quem estiver no caminho
// - "mimic": copia a habilidade de outra personagem, e passa a usá-la como se fosse proṕria
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
        blockedBy: { characters: true, barriers: true },
    },
    barrier: {
        id: "barrier",
        name: "skillBarrier",
        action: "skillCreateBarrier",
        effect: "place",
        moves: false,
        ranged: true,
        blockedBy: { characters: false, barriers: true },
    },
    charge: {
        id: "charge",
        name: "skillCharge",
        action: "skillCharge",
        effect: "charge",
        moves: false,
        ranged: false,
        blockedBy: { characters: false, barriers: true },
    },
    longShot: {
        id: "longShot",
        name: "skillLongShot",
        action: "skillShoot",
        effect: "strike",
        moves: false,
        ranged: true,
        blockedBy: { characters: true, barriers: true },
    },
    mimic: {
        id: "mimic",
        name: "skillMimic",
        action: "skillImitate",
        effect: "mimic",
        moves: false,
        ranged: true,
        blockedBy: { characters: false, barriers: true },
    },
    fire: {
        id: "fire",
        name: "skillFire",
        action: "skillBurn",
        effect: "strike",
        moves: false,
        ranged: true,
        blockedBy: { characters: false, barriers: true },
    },
}

const SKILL_BY_TYPE: Record<CharacterType, SkillId> = {
    A: "extraMove",
    B: "barrier",
    C: "charge",
    D: "longShot",
    E: "mimic",
    F: "fire",
}

export const skillFor = (type: CharacterType): Skill => SKILLS[SKILL_BY_TYPE[type]]

// A habilidade que a imitação copia de uma personagem: só não pode ser outra imitação
export const imitableSkillOf = (model: CharacterDefinition): Skill | null => {
    const skill = skillFor(model.type)
    return skill.effect !== "mimic" ? skill : null
}

export const hasRangedAttackSkill = (type: CharacterType) => {
    const skill = skillFor(type)
    return skill.ranged && skill.effect === "strike"
}

// O valor de uma grandeza da habilidade no nível em que a personagem está
const levelValue = <T>(values: readonly T[] | undefined, level: number): T | null => {
    if (!values || values.length === 0) return null
    return values[Math.min(Math.max(level, 1), values.length) - 1]
}

// Os dados que sorteiam o alcance da habilidade, quando ela o sorteia
export const skillRollOf = (skill: Skill, character: CharacterDefinition): DiceSpec | null =>
    levelValue(SKILL_LEVELS[skill.id].rangeDice, character.level)

// O alcance fixo da habilidade, quando ela não o sorteia
export const skillRangeOf = (skill: Skill, character: CharacterDefinition): number | null =>
    levelValue(SKILL_LEVELS[skill.id].fixedRange, character.level)

// O maior alcance que a habilidade pode ter: o fixo, ou o maior número que os dados dela tiram
export const skillMaxRangeOf = (skill: Skill, character: CharacterDefinition): number => {
    const dice = skillRollOf(skill, character)
    return dice ? diceMax(dice) : (skillRangeOf(skill, character) ?? 0)
}

// Os dados de dano da habilidade, quando ela tem os seus
export const skillDamageOf = (skill: Skill, character: CharacterDefinition): DiceSpec | null =>
    levelValue(SKILL_LEVELS[skill.id].damageDice, character.level)

export const skillUsesOf = (skill: Skill, character: CharacterDefinition): number | null =>
    levelValue(SKILL_LEVELS[skill.id].uses, character.level)

// O lado do quadrado que a habilidade incendeia. Null quando ela não atinge uma área.
export const skillAreaSideOf = (skill: Skill, character: CharacterDefinition): number | null =>
    levelValue(SKILL_LEVELS[skill.id].areaSide, character.level)

export interface ActiveSkill {
    skill: Skill
    characterId: string
    // Alcance: sorteado no dado, ou o fixo, que `skillRangeOf` diz
    range: number
    // O dano já sorteado, para a habilidade que rola o próprio dano antes de agir
    damage?: number
    // Casos em que não pode voltar atrás
    committed: boolean
    // A habilidade por meio da qual a personagem usa esta, quando não é a dela: a imitação
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

// Até onde a habilidade chega partindo desta personagem, com este alcance:
// o sorteado ou fixo, quando ela está em uso,
// ou o maior que ela pode ter, quando a personagem está só sendo consultada
export const reachOf = (skill: Skill, character: CharacterDefinition, range: number): SkillReach => {
    const { effect, blockedBy } = skill
    const area = skillAreaSideOf(skill, character)
    if (effect === "place" || effect === "mimic") {
        return { move: 0, attack: range, ranged: true, blockedBy, effect, area }
    }
    if (effect === "charge") return { move: 0, attack: range, ranged: false, blockedBy, effect, area }
    return skill.moves
        ? { move: range, attack: range, ranged: false, blockedBy, effect, area }
        : { move: 0, attack: range, ranged: skill.ranged, blockedBy, effect, area }
}

// O dano no ataque: os dados da habilidade, quando ela tem, ou o golpe comum da personagem
export const damageOf = (character: CharacterDefinition, skill: Skill | null): DiceSpec =>
    (skill ? skillDamageOf(skill, character) : null) ?? statsFor(character.type, character.level).damage
