import { useState } from "react"
import type { CharacterColor, CharacterDefinition } from "../logic/types"
import { DEFENSE_READING, rollRivalry, type Hit } from "../logic/combat"
import { useLanguage } from "./useLanguage"
import type { GameLog } from "./useGameLog"
import type { RollQueue } from "./useRolls"
import { DODGE_ROLL_TIMING, SUCCESS_FACE } from "../constants/rules"

interface RivalryOptions {
    rolls: RollQueue
    // Rolagem de time comandado por jogador espera o clique
    isManualRoll: (color: CharacterColor) => boolean
    log: GameLog
}

export interface Rivalry {
    // As duas rivais enquanto os dados do duelo rolam (vazio fora disso)
    rivals: string[]
    // O golpe chegou à rival: as duas brilham juntas até os dados acabarem
    begin: (attackerId: string, targetId: string) => void
    end: () => void
    // A rolagem de rivalidade, no lugar da defesa: decide se a rival leva o golpe inteiro
    // ou revida, e aí parte do dano volta para quem atacou. Devolve o que cada uma levou.
    resolve: (
        attackerId: string,
        defender: CharacterDefinition,
        damage: number,
        onSettled: (hits: Hit[]) => void,
    ) => void
}

// A rivalidade em jogo: quem está em duelo agora, e a rolagem que decide o duelo.
export const useRivalry = ({ rolls, isManualRoll, log }: RivalryOptions): Rivalry => {
    const { t, tCharacterName } = useLanguage()
    const [rivals, setRivals] = useState<string[]>([])

    const resolve: Rivalry["resolve"] = (attackerId, defender, damage, onSettled) => {
        const rivalry = rollRivalry(damage)
        const clean = DEFENSE_READING.clean

        rolls.show(
            {
                id: `rivalry-${defender.id}-${Date.now()}`,
                kind: "coin",
                value: rivalry.face,
                title: t("rivalryRoll"),
                subtitle: tCharacterName(defender.id),
                targets: [{ value: t(SUCCESS_FACE === "heads" ? "coinHeads" : "coinTails"), label: t("toFightBack") }],
                outcome: rivalry.foughtBack
                    ? { label: t("foughtBack"), tone: "good" }
                    : { label: t(clean.label), tone: clean.tone },
                manual: isManualRoll(defender.color),
                ...DODGE_ROLL_TIMING,
            },
            () => {
                if (rivalry.foughtBack) log.foughtBack(attackerId, defender.id, rivalry.damage, rivalry.returned)
                else log.attackHit(attackerId, defender.id, rivalry.damage)

                onSettled([
                    { characterId: defender.id, damage: rivalry.damage },
                    ...(rivalry.returned > 0 ? [{ characterId: attackerId, damage: rivalry.returned }] : []),
                ])
            },
        )
    }

    return {
        rivals,
        begin: (attackerId, targetId) => setRivals([attackerId, targetId]),
        end: () => setRivals((prev) => (prev.length > 0 ? [] : prev)),
        resolve,
    }
}
