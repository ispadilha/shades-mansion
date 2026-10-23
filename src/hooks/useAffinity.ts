import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react"
import type { CharacterColor, CharacterDefinition } from "../logic/types"
import { affinityAtTurnStart, affinityDiceOf, reinvigoratedBy } from "../logic/affinity"
import { dieKind, rollSpec, sumDice } from "../logic/rolls"
import type { RollQueue } from "./useRolls"
import type { GameLog } from "./useGameLog"
import { useLanguage } from "./useLanguage"

interface AffinityOptions {
    characters: CharacterDefinition[]
    setCharacters: Dispatch<SetStateAction<CharacterDefinition[]>>
    // A personagem da vez, e qual vez é esta: a afinidade é conferida uma vez, quando a vez começa
    activeCharacter: CharacterDefinition | null
    turnKey: string
    rolls: RollQueue
    // Rolagem de time comandado por jogador espera o clique
    isManualRoll: (color: CharacterColor) => boolean
    log: GameLog
}

// A afinidade: quando a vez de uma personagem começa com a parceira de dupla encostada nela, e alguma
// das duas perdeu vigor, a dupla rola os dados de afinidade e as duas revigoram o que sair.
// Devolve as personagens da dupla enquanto a rolagem acontece: são elas que ganham a aura.
export const useAffinity = ({
    characters,
    setCharacters,
    activeCharacter,
    turnKey,
    rolls,
    isManualRoll,
    log,
}: AffinityOptions): string[] => {
    const { t, tCharacterName } = useLanguage()
    const [rolling, setRolling] = useState<string[]>([])

    // A vez cuja afinidade já foi conferida.
    // O efeito pode rodar de novo na mesma vez, mas a rolagem é uma só.
    const checkedRef = useRef<string | null>(null)

    // As personagens mais recentes, para a conta do que cada uma ganhou quando a rolagem termina
    const charactersRef = useRef(characters)
    useEffect(() => {
        charactersRef.current = characters
    }, [characters])

    useEffect(() => {
        if (!activeCharacter || checkedRef.current === turnKey) return
        checkedRef.current = turnKey

        const partner = affinityAtTurnStart(activeCharacter, characters)
        if (!partner) return
        const dice = affinityDiceOf(activeCharacter, partner)
        const values = rollSpec(dice)
        const amount = sumDice(values)
        const both = [activeCharacter.id, partner.id]

        // A rolagem trava a partida até sair o resultado, inclusive a IA da personagem da vez
        setRolling(both)
        rolls.setResolving(true)
        rolls.show(
            {
                id: `affinity-${turnKey}`,
                kind: dieKind(dice.sides),
                value: values,
                title: t("affinityRoll"),
                subtitle: `${tCharacterName(activeCharacter.id)} ${t("and")} ${tCharacterName(partner.id)}`,
                outcome: { label: t("affinityReading"), tone: "good" },
                manual: isManualRoll(activeCharacter.color),
            },
            () => {
                // O que cada uma ganhou de fato: quem estava perto do máximo ganha menos
                const [gain, partnerGain] = both.map((id) => {
                    const character = charactersRef.current.find((p) => p.id === id)
                    return character ? reinvigoratedBy(character, amount).vigor - character.vigor : 0
                })
                setCharacters((prev) => prev.map((p) => (both.includes(p.id) ? reinvigoratedBy(p, amount) : p)))
                log.affinity(activeCharacter.id, gain, partner.id, partnerGain)
                setRolling([])
                rolls.setResolving(false)
            },
        )
        // A afinidade é conferida quando a vez muda, e não a cada mudança das personagens
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [turnKey, activeCharacter?.id])

    return rolling
}
