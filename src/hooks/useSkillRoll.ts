import type { PieceColor, PieceDefinition, TextKey } from "../logic/types"
import { skillDamageOf, skillRollOf, type Skill } from "../logic/skills"
import { dieKind, rollSpec, sumDice, type DiceSpec } from "../logic/rolls"
import { useLanguage } from "./useLanguage"
import type { RollQueue } from "./useRolls"

interface SkillRollOptions {
    rolls: RollQueue
    // Rolagem de time comandado por jogador e não IA
    isManualRoll: (color: PieceColor) => boolean
}

export interface SkillRoll {
    // Encena os dados da habilidade e devolve o que saiu: alcance, e dano quando é o caso.
    // Habilidade de alcance fixo não passa por aqui: quem chama resolve na hora.
    roll: (
        skill: Skill,
        piece: PieceDefinition,
        color: PieceColor,
        onSettled: (range: number, damage?: number) => void,
    ) => void
}

export const useSkillRoll = ({ rolls, isManualRoll }: SkillRollOptions): SkillRoll => {
    const { t } = useLanguage()

    // Uma rolagem na tela. O total segue para quem vem depois dela.
    // O nível fica ao lado da peça porque os dados de algumas habilidades mudam com ele.
    const show = (
        dice: DiceSpec,
        title: string,
        unit: string,
        piece: PieceDefinition,
        color: PieceColor,
        then: (total: number) => void,
    ) => {
        const values = rollSpec(dice)
        rolls.show(
            {
                id: `skill-${piece.id}-${Date.now()}`,
                kind: dieKind(dice.sides),
                value: values,
                title,
                subtitle: `${piece.id} (${t("level")} ${piece.level})`,
                outcome: { label: unit, tone: "neutral" },
                manual: isManualRoll(color),
            },
            () => then(sumDice(values)),
        )
    }

    const roll = (
        skill: Skill,
        piece: PieceDefinition,
        color: PieceColor,
        onSettled: (range: number, damage?: number) => void,
    ) => {
        const rangeDice = skillRollOf(skill, piece)
        if (!rangeDice) return
        const damageDice = skillDamageOf(skill, piece)
        // O título diz de que habilidade é a rolagem e o que ela sorteia
        const title = (roll: TextKey) => `${t(skill.name)}: ${t(roll)}`

        // Primeiro o alcance e depois o dano, quando é o caso
        rolls.setResolving(true)
        show(rangeDice, title("skillDistanceRoll"), t("cells"), piece, color, (range) => {
            if (!damageDice) {
                rolls.setResolving(false)
                onSettled(range)
                return
            }
            show(damageDice, title("skillDamageRoll"), t("damagePoints"), piece, color, (damage) => {
                rolls.setResolving(false)
                onSettled(range, damage)
            })
        })
    }

    return { roll }
}
