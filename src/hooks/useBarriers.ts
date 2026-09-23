import { useEffect, useState } from "react"
import type { Barrier, PieceColor, PieceDefinition, PiecePosition } from "../logic/types"
import { barriersOf, barriersStillStanding, litBarrier } from "../logic/barriers"
import { skillChargesOf } from "../logic/skills"
import type { SkillFlow } from "./useSkillFlow"
import type { GameLog } from "./useGameLog"

interface BarriersOptions {
    pieces: PieceDefinition[]
    // Peça da vez: quando a vez volta para quem acendeu, as barreiras dela se apagam
    activePieceId: string | null
    // Cor de quem comanda a jogada, para o histórico
    activeColor: PieceColor | null
    skill: SkillFlow
    log: GameLog
}

export interface BarrierState {
    // Todas as barreiras acesas no tabuleiro, de todos os times
    all: Barrier[]
    // Quantas a peça que está usando a habilidade ainda pode acender neste turno.
    chargesLeft: number
    // Acende uma barreira na casa escolhida.
    // A primeira gasta a habilidade do turno, e a última encerra o uso sozinha.
    lightAt: (position: PiecePosition) => void
}

// As barreiras paranormais em jogo:
// quem as acende, quanto tempo elas duram e quando se apagam.
export const useBarriers = ({ pieces, activePieceId, activeColor, skill, log }: BarriersOptions): BarrierState => {
    const [all, setAll] = useState<Barrier[]>([])

    // A peça que está acendendo agora, se for isso que a habilidade em uso faz
    const active = skill.active
    const owner =
        active && active.skill.effect === "place" ? (pieces.find((p) => p.id === active.pieceId) ?? null) : null
    const chargesLeft =
        owner && active ? Math.max(0, (skillChargesOf(active.skill, owner) ?? 0) - barriersOf(all, owner.id).length) : 0

    // A barreira dura até a vez de quem a acendeu voltar
    useEffect(() => {
        if (!activePieceId) return
        if (!all.some((barrier) => barrier.ownerId === activePieceId)) return

        log.barriersWoreOff(activePieceId)
        setAll((prev) => prev.filter((barrier) => barrier.ownerId !== activePieceId))
        // Só a troca de vez apaga barreira:
        // incluir a lista faria o efeito apagar as que acabaram de ser acesas.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activePieceId])

    // Peça que saiu da mansão leva as barreiras dela embora
    useEffect(() => {
        setAll((prev) => barriersStillStanding(prev, pieces))
    }, [pieces])

    const lightAt = (position: PiecePosition) => {
        if (!owner || !activeColor || chargesLeft <= 0) return

        setAll((prev) => [...prev, litBarrier(owner, position)])
        log.usedTo(activeColor, owner.id, "toCreateBarrier")

        // A primeira barreira passa o ponto sem volta: encerrar daqui em diante custa a
        // habilidade do turno. Se entrar e sair sem acender nenhuma, não.
        skill.commit()

        // A última fecha a sessão sozinha, ou seja, a habilidade é dada por gasta
        if (chargesLeft <= 1) {
            skill.spend(owner.id)
            skill.clear()
        }
    }

    return { all, chargesLeft, lightAt }
}
