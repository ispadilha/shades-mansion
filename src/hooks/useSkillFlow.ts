import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react"
import type { PieceColor, PieceDefinition } from "../logic/types"
import {
    baseRangeOf,
    cancelCostsSkill,
    reachOf,
    type ActiveSkill,
    type Skill,
    type SkillReach,
} from "../logic/skills"
import { useSkillRoll } from "./useSkillRoll"
import type { RollQueue } from "./useRolls"
import { SKILL_MODAL_DELAY_MS } from "../constants/rules"

interface SkillFlowOptions {
    activePiece: PieceDefinition | null
    activeColor: PieceColor | null
    setPieces: Dispatch<SetStateAction<PieceDefinition[]>>
    setSelectedId: (id: string | null) => void
    rolls: RollQueue
    isManualRoll: (color: PieceColor) => boolean
    // Traz a vista até a peça da vez e a seleciona, depois abre a lista de habilidades
    focusActivePiece: () => boolean
}

export interface SkillFlow {
    // A lista de habilidades está aberta?
    listOpen: boolean
    openList: () => void
    closeList: () => void
    // Habilidade em uso:
    // A peça fica travada e o menu mostra a habilidade em vez do movimento comum.
    active: ActiveSkill | null
    // Até onde ela chega. Memorizado porque vira dependência de efeito.
    reach: SkillReach | null
    use: (skill: Skill) => void
    cancel: () => void
    // Encerra o uso sem gasto de habilidade
    clear: () => void
    // Marca a habilidade da peça como gasta no turno
    spend: (pieceId: string) => void
    // Passa o ponto sem volta sem fechar a vez:
    // por exemplo, uma habilidade foi usada parcialmente, e o jogador quer encerrá-la
    commit: () => void
}

// O caminho de uma habilidade: abrir a lista, escolher, entrar em uso e sair de uso.
export const useSkillFlow = ({
    activePiece,
    activeColor,
    setPieces,
    setSelectedId,
    rolls,
    isManualRoll,
    focusActivePiece,
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

    const reach = useMemo(() => (active ? reachOf(active) : null), [active])

    // Marca a habilidade da peça como gasta no turno
    const spend = (pieceId: string) => {
        setPieces((prev) => prev.map((p) => (p.id === pieceId ? { ...p, usedSkillThisTurn: true } : p)))
    }

    // Botão "habilidades": traz a vista para a peça, espera um instante e abre a lista
    const openList = () => {
        // Com uma habilidade já em uso, a lista não abre
        if (active) return
        if (!focusActivePiece()) return

        if (timerRef.current !== null) clearTimeout(timerRef.current)
        timerRef.current = window.setTimeout(() => {
            timerRef.current = null
            setListOpen(true)
        }, SKILL_MODAL_DELAY_MS)
    }

    const use = (skill: Skill) => {
        setListOpen(false)
        if (!activePiece || !activeColor) return
        const pieceId = activePiece.id

        // Habilidade sem dado entra em uso na hora, e desistir dela ainda sai de graça
        if (!skill.roll) {
            setActive({ skill, pieceId, range: baseRangeOf(skill, activePiece), committed: false })
            return
        }

        // Com dado, o resultado é o alcance e a partir dele não há volta:
        // é o que impede "trapaça" de cancelar e rolar de novo até vir um número melhor.
        roll.roll(skill, activePiece, activeColor, (range) => {
            setActive({ skill, pieceId, range, committed: true })
            setSelectedId(pieceId)
        })
    }

    // Desistir: antes do ponto sem volta não custa nada.
    // Depois dele, custa a habilidade do turno.
    const commit = () => {
        setActive((prev) => (prev && !prev.committed ? { ...prev, committed: true } : prev))
    }

    const cancel = () => {
        if (cancelCostsSkill(active)) spend(active!.pieceId)
        setActive(null)
        setSelectedId(null)
    }

    return {
        listOpen,
        openList,
        closeList: () => setListOpen(false),
        active,
        reach,
        use,
        cancel,
        clear: () => setActive(null),
        spend,
        commit,
    }
}
