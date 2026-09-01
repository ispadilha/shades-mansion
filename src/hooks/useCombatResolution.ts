import { useEffect, useRef } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { PieceColor, PieceDefinition, SpecialItemKey } from "../logic/types"
import type { Maze } from "../logic/maze"
import {
    areaCells,
    piecesInCells,
    rollAttack,
    rollManipulation,
    type FireBurst,
    type PendingAttack,
} from "../logic/combat"
import { useLanguage } from "./useLanguage"
import type { GameLog } from "./useGameLog"
import type { RollQueue } from "./useRolls"
import { MAX_FIRE_BURSTS } from "../constants/rules"

interface CombatResolutionOptions {
    pieces: PieceDefinition[]
    maze: Maze
    setPieces: Dispatch<SetStateAction<PieceDefinition[]>>
    setFireBursts: Dispatch<SetStateAction<FireBurst[]>>
    // Peça sob manipulação: é ela que a câmera segue enquanto a moeda está no ar
    setManipulatedId: (pieceId: string | null) => void
    rolls: RollQueue
    log: GameLog
    // Rolagem de time comandado por jogador espera o clique no dado,
    // as de times comandados por IA rolam automaticamente.
    isManualRoll: (color: PieceColor) => boolean
}

export interface CombatResolution {
    // Toda tentativa de ataque (do jogador, da IA ou vinda de uma manipulação) passa por aqui
    resolveAttack: (attack: PendingAttack) => void
    // Tentativa de manipulação: o item já foi gasto por quem usou, e a moeda decide se a
    // peça obedece. Devolve o resultado a quem chamou depois de encenar a rolagem.
    resolveManipulation: (color: PieceColor, itemKey: SpecialItemKey, onSettled: (success: boolean) => void) => void
}

export const useCombatResolution = ({
    pieces,
    maze,
    setPieces,
    setFireBursts,
    setManipulatedId,
    rolls,
    log,
    isManualRoll,
}: CombatResolutionOptions): CombatResolution => {
    const { t } = useLanguage()
    // A moeda do ataque só é jogada quando o atacante termina de se aproximar: o timer
    // fica guardado para não sobreviver à saída da tela.
    const damageTimerRef = useRef<number | null>(null)

    useEffect(() => {
        return () => {
            if (damageTimerRef.current !== null) clearTimeout(damageTimerRef.current)
        }
    }, [])

    const resolveAttack = (attack: PendingAttack) => {
        const rollerColor = attack.consumerColor ?? pieces.find((p) => p.id === attack.attackerId)?.color ?? null
        rolls.setResolving(true)
        damageTimerRef.current = window.setTimeout(() => {
            damageTimerRef.current = null
            const { face, success } = rollAttack()

            rolls.show(
                {
                    id: `attack-${attack.attackerId}-${attack.targetId}-${Date.now()}`,
                    kind: "coin",
                    value: face,
                    title: t("attackRoll"),
                    subtitle: `${attack.attackerId} → ${attack.targetId}`,
                    outcome: { label: success ? t("attackHit") : t("attackMiss"), tone: success ? "good" : "bad" },
                    manual: rollerColor !== null && isManualRoll(rollerColor),
                },
                () => {
                    if (success) {
                        // O fogo pega todo mundo que estiver nas casas em chamas.
                        // As casas e quem está nelas são decididas
                        // agora, com as posições atuais.
                        const burning = attack.area ? areaCells(maze, attack.area.center, attack.area.side) : []
                        const burned = piecesInCells(pieces, burning)
                            .filter((p) => p.id !== attack.targetId)
                            .map((p) => p.id)
                        const hit = new Set([attack.targetId, ...burned])

                        setPieces((prev) =>
                            prev
                                .map((p) => (hit.has(p.id) ? { ...p, hp: p.hp - attack.damage } : p))
                                .filter((p) => p.hp > 0),
                        )
                        if (attack.area) {
                            const { center } = attack.area
                            setFireBursts((prev) => [
                                ...prev.slice(-MAX_FIRE_BURSTS + 1),
                                { id: `fire-${attack.attackerId}-${Date.now()}`, center, cells: burning },
                            ])
                        }
                        log.attackRoll(attack.attackerId, attack.targetId, success)
                        log.burned(burned)
                        rolls.setResolving(false)
                        return
                    }
                    log.attackRoll(attack.attackerId, attack.targetId, success)
                    rolls.setResolving(false)
                },
            )
        }, attack.delayMs)
    }

    const resolveManipulation = (
        color: PieceColor,
        itemKey: SpecialItemKey,
        onSettled: (success: boolean) => void,
    ) => {
        const { face, success } = rollManipulation()
        rolls.setResolving(true)
        setManipulatedId(itemKey)
        rolls.show(
            {
                id: `manipulation-${itemKey}-${Date.now()}`,
                kind: "coin",
                value: face,
                title: t("manipulationRoll"),
                subtitle: itemKey,
                outcome: {
                    label: success ? t("manipulationWorked") : t("manipulationFailed"),
                    tone: success ? "good" : "bad",
                },
                manual: isManualRoll(color),
            },
            () => {
                log.manipulationRoll(itemKey, success)
                rolls.setResolving(false)
                onSettled(success)
            },
        )
    }

    return { resolveAttack, resolveManipulation }
}
