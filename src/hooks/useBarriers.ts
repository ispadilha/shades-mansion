import { useEffect, useState } from "react"
import type { Barrier, CharacterColor, CharacterDefinition, CharacterPosition } from "../logic/types"
import { barriersOf, barriersStillStanding, litBarrier } from "../logic/barriers"
import { skillUsesOf } from "../logic/skills"
import type { SkillFlow } from "./useSkillFlow"
import type { GameLog } from "./useGameLog"

interface BarriersOptions {
    characters: CharacterDefinition[]
    // Personagem da vez: quando a vez volta para quem acendeu, as barreiras dela se apagam
    activeCharacterId: string | null
    // Cor de quem comanda a jogada: a habilidade em uso só acende barreira na vez do jogador
    activeColor: CharacterColor | null
    skill: SkillFlow
    log: GameLog
}

export interface BarrierState {
    // Todas as barreiras acesas no tabuleiro, de todos os times
    all: Barrier[]
    // Quantas a personagem que está usando a habilidade ainda pode acender neste turno.
    usesLeft: number
    // Acende uma barreira na casa escolhida.
    // A primeira gasta a habilidade do turno, e a última encerra o uso sozinha.
    lightAt: (position: CharacterPosition) => void
    // Acende uma barreira da personagem na casa, sem passar pela habilidade em uso: é assim que a IA acende as dela
    raise: (owner: CharacterDefinition, position: CharacterPosition) => void
    // Apaga a barreira que uma personagem adversária conseguiu dissipar, e só ela
    dispel: (barrierId: string) => void
}

// As barreiras paranormais em jogo:
// quem as acende, quanto tempo elas duram e quando se apagam.
export const useBarriers = ({ characters, activeCharacterId, activeColor, skill, log }: BarriersOptions): BarrierState => {
    const [all, setAll] = useState<Barrier[]>([])

    // A personagem que está acendendo agora, se for isso que a habilidade em uso faz
    const active = skill.active
    const owner =
        active && active.skill.effect === "place" ? (characters.find((p) => p.id === active.characterId) ?? null) : null
    const usesLeft =
        owner && active ? Math.max(0, (skillUsesOf(active.skill, owner) ?? 0) - barriersOf(all, owner.id).length) : 0

    // A barreira dura até a vez de quem a acendeu voltar
    useEffect(() => {
        if (!activeCharacterId) return
        if (!all.some((barrier) => barrier.ownerId === activeCharacterId)) return

        log.barriersWoreOff(activeCharacterId)
        setAll((prev) => prev.filter((barrier) => barrier.ownerId !== activeCharacterId))
        // Só a troca de vez apaga barreira:
        // incluir a lista faria o efeito apagar as que acabaram de ser acesas.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeCharacterId])

    // Personagem que saiu da mansão leva as barreiras dela embora
    useEffect(() => {
        setAll((prev) => barriersStillStanding(prev, characters))
    }, [characters])

    const raise = (character: CharacterDefinition, position: CharacterPosition) => {
        setAll((prev) => [...prev, litBarrier(character, position)])
        log.usedTo(character.color, character.id, "toCreateBarrier")
    }

    const lightAt = (position: CharacterPosition) => {
        if (!owner || !activeColor || usesLeft <= 0) return
        raise(owner, position)

        // A primeira barreira passa o ponto sem volta: encerrar daqui em diante custa a
        // habilidade do turno. Se entrar e sair sem acender nenhuma, não.
        skill.commit()

        // A última fecha a sessão sozinha, ou seja, a habilidade é dada por gasta
        if (usesLeft <= 1) {
            skill.spend(owner.id)
            skill.clear()
        }
    }

    const dispel = (barrierId: string) => setAll((prev) => prev.filter((barrier) => barrier.id !== barrierId))

    return { all, usesLeft, lightAt, raise, dispel }
}
