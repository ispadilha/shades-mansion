import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react"
import type { CharacterColor, CharacterDefinition } from "../logic/types"
import {
    cancelCostsSkill,
    imitableSkillOf,
    reachOf,
    skillRangeOf,
    type ActiveSkill,
    type Skill,
    type SkillReach,
} from "../logic/skills"
import { useSkillRoll } from "./useSkillRoll"
import type { RollQueue } from "./useRolls"
import { SKILL_MODAL_DELAY_MS } from "../constants/rules"

interface SkillFlowOptions {
    activeCharacter: CharacterDefinition | null
    activeColor: CharacterColor | null
    setCharacters: Dispatch<SetStateAction<CharacterDefinition[]>>
    setSelectedId: (id: string | null) => void
    rolls: RollQueue
    isManualRoll: (color: CharacterColor) => boolean
    // Traz a vista até a personagem da vez e a seleciona, depois abre a lista de habilidades
    focusActiveCharacter: () => boolean
    // Há manipulação em curso? Por enquanto, a personagem manipulada não usa habilidades.
    manipulating: boolean
}

export interface SkillFlow {
    // A lista de habilidades está aberta?
    listOpen: boolean
    // A lista não abre agora: habilidade ou manipulação em curso
    listLocked: boolean
    openList: () => void
    closeList: () => void
    // Habilidade em uso:
    // A personagem fica travada e o menu mostra a habilidade em vez do movimento comum.
    active: ActiveSkill | null
    // Até onde ela chega. Memorizado porque vira dependência de efeito.
    reach: SkillReach | null
    use: (skill: Skill) => void
    // Imitação: a personagem passa a usar a habilidade de outra personagem escolhida
    imitate: (model: CharacterDefinition) => void
    cancel: () => void
    // Encerra o uso sem gasto de habilidade
    clear: () => void
    // Marca a habilidade da personagem como gasta no turno
    spend: (characterId: string) => void
    // Passa o ponto sem volta sem fechar a vez:
    // por exemplo, uma habilidade foi usada parcialmente, e o jogador quer encerrá-la
    commit: () => void
}

// O caminho de uma habilidade: abrir a lista, escolher, entrar em uso e sair de uso.
export const useSkillFlow = ({
    activeCharacter,
    activeColor,
    setCharacters,
    setSelectedId,
    rolls,
    isManualRoll,
    focusActiveCharacter,
    manipulating,
}: SkillFlowOptions): SkillFlow => {
    const [listOpen, setListOpen] = useState(false)
    const [active, setActive] = useState<ActiveSkill | null>(null)
    const roll = useSkillRoll({ rolls, isManualRoll })

    // A espera entre o clique em "habilidades" e a lista abrir
    const timerRef = useRef<number | null>(null)
    useEffect(() => {
        return () => {
            if (timerRef.current !== null) clearTimeout(timerRef.current)
        }
    }, [])

    const reach = useMemo(
        () => (active && activeCharacter ? reachOf(active.skill, activeCharacter, active.range) : null),
        [active, activeCharacter],
    )

    const listLocked = active !== null || manipulating

    // Marca a habilidade da personagem como gasta no turno
    const spend = (characterId: string) => {
        setCharacters((prev) => prev.map((p) => (p.id === characterId ? { ...p, usedSkillThisTurn: true } : p)))
    }

    // Botão "habilidades": traz a vista para a personagem, espera um instante e abre a lista
    const openList = () => {
        if (listLocked) return
        if (!focusActiveCharacter()) return

        if (timerRef.current !== null) clearTimeout(timerRef.current)
        timerRef.current = window.setTimeout(() => {
            timerRef.current = null
            setListOpen(true)
        }, SKILL_MODAL_DELAY_MS)
    }

    // Põe a habilidade em uso.
    // `via` é a habilidade por meio da qual a personagem a usa, quando não é a dela. (Imitação)
    const enter = (skill: Skill, via?: Skill) => {
        if (!activeCharacter || !activeColor) return
        const characterId = activeCharacter.id
        const origin = via ? { via } : {}

        // Habilidade de alcance fixo entra em uso na hora, e desistir dela ainda sai de graça
        const fixedRange = skillRangeOf(skill, activeCharacter)
        if (fixedRange !== null) {
            setActive({ skill, characterId, range: fixedRange, committed: false, ...origin })
            return
        }

        // Com dado, o resultado é o alcance e a partir dele não há volta:
        // é o que impede "trapaça" de cancelar e rolar de novo até vir um número melhor.
        // A que rola o próprio dano já entra em uso com ele.
        roll.roll(skill, activeCharacter, activeColor, (range, damage) => {
            const rolledDamage = damage !== undefined ? { damage } : {}
            setActive({ skill, characterId, range, ...rolledDamage, committed: true, ...origin })
            setSelectedId(characterId)
        })
    }

    const use = (skill: Skill) => {
        setListOpen(false)
        enter(skill)
    }

    // A imitação ativa a habilidade da personagem escolhida,
    // que entra em uso como entraria pela lista:
    // rolando os dados se for o caso, e com o mesmo ponto sem volta.
    // Passado esse ponto, quem fica gasta no turno é a imitação.
    const imitate = (model: CharacterDefinition) => {
        const copied = imitableSkillOf(model)
        if (!active || active.skill.effect !== "mimic" || !copied) return
        enter(copied, active.skill)
    }

    // Desistir: antes do ponto sem volta não custa nada.
    // Depois dele, custa a habilidade do turno.
    const commit = () => {
        setActive((prev) => (prev && !prev.committed ? { ...prev, committed: true } : prev))
    }

    const cancel = () => {
        if (cancelCostsSkill(active)) spend(active!.characterId)
        setActive(null)
        setSelectedId(null)
    }

    return {
        listOpen,
        listLocked,
        openList,
        closeList: () => setListOpen(false),
        active,
        reach,
        use,
        imitate,
        cancel,
        clear: () => setActive(null),
        spend,
        commit,
    }
}
