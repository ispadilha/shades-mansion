import type { PieceColor, PieceDefinition } from "../logic/types"
import type { Skill } from "../logic/skills"
import { dieKind, rollSpec, sumDice } from "../logic/rolls"
import { useLanguage } from "./useLanguage"
import type { RollQueue } from "./useRolls"

interface SkillRollOptions {
    rolls: RollQueue
    // Rolagem de time comandado por jogador e não IA
    isManualRoll: (color: PieceColor) => boolean
}

export interface SkillRoll {
    // Encena o dado da habilidade e devolve o alcance que saiu.
    // Habilidade sem dado não passa por aqui: quem chama resolve na hora.
    roll: (skill: Skill, piece: PieceDefinition, color: PieceColor, onSettled: (range: number) => void) => void
}

export const useSkillRoll = ({ rolls, isManualRoll }: SkillRollOptions): SkillRoll => {
    const { t } = useLanguage()

    const roll = (skill: Skill, piece: PieceDefinition, color: PieceColor, onSettled: (range: number) => void) => {
        if (!skill.roll) return

        const dice = rollSpec(skill.roll)
        const range = sumDice(dice)
        rolls.setResolving(true)
        rolls.show(
            {
                id: `skill-${piece.id}-${Date.now()}`,
                kind: dieKind(skill.roll.sides),
                value: dice,
                title: t(skill.name),
                subtitle: piece.id,
                outcome: { label: t("extraCells"), tone: "neutral" },
                manual: isManualRoll(color),
            },
            () => {
                rolls.setResolving(false)
                onSettled(range)
            },
        )
    }

    return { roll }
}
