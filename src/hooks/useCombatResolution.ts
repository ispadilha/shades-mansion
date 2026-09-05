import { useEffect, useRef } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { PieceColor, PieceDefinition, PiecePosition, MotivationItemKey, TextKey } from "../logic/types"
import type { Maze } from "../logic/maze"
import {
    areaCells,
    piecesInBlast,
    rollDamage,
    rollDefense,
    rollManipulation,
    type DamageRoll,
    type DefenseOutcome,
    type FireBurst,
    type PendingAttack,
} from "../logic/combat"
import { dieKind, type RollTone } from "../logic/rolls"
import { useLanguage } from "./useLanguage"
import type { GameLog } from "./useGameLog"
import type { RollQueue } from "./useRolls"
import {
    ATTACK_EFFECT_HOLD_MS,
    ATTACK_ROLL_TIMING,
    DEFENSE_DIE,
    DODGE_ROLL_TIMING,
    ITEM_DROP_HOLD_MS,
    MAX_FIRE_BURSTS,
} from "../constants/rules"

// Uma peça atingida e quanto ela levou. As defesas são roladas uma a uma, mas o dano
// fica guardado aqui até o fim: ninguém sai do tabuleiro no meio das rolagens.
interface Hit {
    pieceId: string
    damage: number
}

const DEFENSE_READING: Record<DefenseOutcome, { label: TextKey; tone: RollTone }> = {
    dodged: { label: "dodgeTotal", tone: "good" },
    guarded: { label: "dodgeGuard", tone: "neutral" },
    clean: { label: "dodgeNone", tone: "bad" },
}

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
    // Uma manipulação falha derruba o item de volta no tabuleiro
    onManipulationFailed: (itemKey: MotivationItemKey) => void
}

export interface CombatResolution {
    // Toda tentativa de ataque (do jogador, da IA ou vinda de uma manipulação) passa por aqui
    resolveAttack: (attack: PendingAttack) => void
    // Tentativa de manipulação: o item já saiu do inventário de quem usou, e a moeda decide
    // se a peça obedece. Falhando, o item cai de volta no tabuleiro. Devolve o resultado a
    // quem chamou depois de encenar a rolagem.
    resolveManipulation: (color: PieceColor, itemKey: MotivationItemKey, onSettled: (success: boolean) => void) => void
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
    onManipulationFailed,
}: CombatResolutionOptions): CombatResolution => {
    const { t } = useLanguage()
    // Os dados do golpe só são jogados quando o atacante termina de se aproximar: o timer
    // fica guardado para ser cancelado quando a tela sair.
    const damageTimerRef = useRef<number | null>(null)
    // A queda do item devolvido segura a partida enquanto a câmera a acompanha
    const dropTimerRef = useRef<number | null>(null)
    // A animação do golpe segura a partida enquanto acontece
    const effectTimerRef = useRef<number | null>(null)

    useEffect(() => {
        return () => {
            if (damageTimerRef.current !== null) clearTimeout(damageTimerRef.current)
            if (dropTimerRef.current !== null) clearTimeout(dropTimerRef.current)
            if (effectTimerRef.current !== null) clearTimeout(effectTimerRef.current)
        }
    }, [])

    // O atacante rola o dano e, em cima dele, cada peça atingida rola sua defesa.
    // Só quando não sobra rolagem é que o golpe aparece no tabuleiro.
    const resolveAttack = (attack: PendingAttack) => {
        // Quem joga os dados do golpe: o time da peça, ou quem a está manipulando
        const attackerColor = attack.consumerColor ?? pieces.find((p) => p.id === attack.attackerId)?.color ?? null
        rolls.setResolving(true)

        damageTimerRef.current = window.setTimeout(() => {
            damageTimerRef.current = null

            // As casas que o golpe alcança saem antes das rolagens, porque é delas que vem
            // quem se defende. Nada é animado ainda: o tabuleiro só reage depois dos dados.
            const reached = attack.area ? areaCells(maze, attack.area.center, attack.area.side) : []
            const defenders = defendersOf(attack, reached)

            // Golpe no vazio (área sem ninguém, ou alvo que já saiu do tabuleiro): não há o
            // que rolar, mas a animação acontece do mesmo jeito
            if (defenders.length === 0) {
                settleAttack(attack, reached, [])
                return
            }

            const damage = rollDamage(attack.damageDice)

            rolls.show(
                {
                    id: `damage-${attack.attackerId}-${Date.now()}`,
                    kind: dieKind(attack.damageDice.sides),
                    value: damage.dice,
                    title: t("damageRoll"),
                    subtitle: attack.targetId ? `${attack.attackerId} → ${attack.targetId}` : attack.attackerId,
                    outcome: { label: t("damagePoints"), tone: "neutral" },
                    manual: attackerColor !== null && isManualRoll(attackerColor),
                    ...ATTACK_ROLL_TIMING,
                },
                () => resolveDefenders(attack, reached, damage, defenders, 0, []),
            )
        }, attack.delayMs)
    }

    // Quem se defende: a peça mirada, ou todas as da área quando o golpe incendeia
    const defendersOf = (attack: PendingAttack, reached: PiecePosition[]): PieceDefinition[] => {
        if (attack.area) return piecesInBlast(pieces, reached, attack.area.center)
        const target = pieces.find((p) => p.id === attack.targetId)
        return target ? [target] : []
    }

    // Uma defesa de cada vez, rolada por quem comanda a peça atingida. O que cada uma leva
    // vai se somando em `hits` e só é aplicado no fim.
    const resolveDefenders = (
        attack: PendingAttack,
        reached: PiecePosition[],
        damage: DamageRoll,
        defenders: PieceDefinition[],
        index: number,
        hits: Hit[],
    ) => {
        const defender = defenders[index]
        if (!defender) {
            settleAttack(attack, reached, hits)
            return
        }

        const defense = rollDefense(defender, damage.total)
        const reading = DEFENSE_READING[defense.outcome]

        rolls.show(
            {
                id: `defense-${defender.id}-${Date.now()}`,
                kind: dieKind(DEFENSE_DIE),
                value: [defense.die],
                title: t("dodgeRoll"),
                subtitle: defender.id,
                outcome: { label: t(reading.label), tone: reading.tone },
                manual: isManualRoll(defender.color),
                ...DODGE_ROLL_TIMING,
            },
            () => {
                if (defense.outcome === "dodged") log.attackDodged(attack.attackerId, defender.id)
                else if (defense.outcome === "guarded") log.attackGuarded(attack.attackerId, defender.id, defense.damage)
                else log.attackHit(attack.attackerId, defender.id, defense.damage)

                const next = defense.damage > 0 ? [...hits, { pieceId: defender.id, damage: defense.damage }] : hits
                resolveDefenders(attack, reached, damage, defenders, index + 1, next)
            },
        )
    }

    // Fim das rolagens: agora sim o golpe aparece no tabuleiro, e o dano de todas as peças
    // atingidas entra junto com ele. Nenhuma peça sai do tabuleiro antes de a animação
    // mostrar o que a tirou de lá.
    const settleAttack = (attack: PendingAttack, reached: PiecePosition[], hits: Hit[]) => {
        const animated = playAttackEffect(attack, reached)
        if (hits.length > 0) applyDamage(hits)

        if (!animated) {
            rolls.setResolving(false)
            return
        }

        effectTimerRef.current = window.setTimeout(() => {
            effectTimerRef.current = null
            rolls.setResolving(false)
        }, ATTACK_EFFECT_HOLD_MS)
    }

    // A animação do golpe, e se houve alguma para a partida esperar.
    // É por aqui que cada tipo de ataque mostra o que fez.
    const playAttackEffect = (attack: PendingAttack, reached: PiecePosition[]): boolean => {
        const { area } = attack
        if (!area) return false

        setFireBursts((prev) => [
            ...prev.slice(-MAX_FIRE_BURSTS + 1),
            { id: `fire-${attack.attackerId}-${Date.now()}`, center: area.center, cells: reached },
        ])
        return true
    }

    // Quem chega a zero sai do tabuleiro
    const applyDamage = (hits: Hit[]) => {
        setPieces((prev) =>
            prev
                .map((piece) => {
                    const hit = hits.find((h) => h.pieceId === piece.id)
                    return hit ? { ...piece, vigor: piece.vigor - hit.damage } : piece
                })
                .filter((piece) => piece.vigor > 0),
        )
    }

    const resolveManipulation = (
        color: PieceColor,
        itemKey: MotivationItemKey,
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

                // Manipulação falhou: o item cai de volta no tabuleiro.
                // A partida espera a queda, para a câmera mostrar onde ele foi parar.
                if (!success) {
                    onManipulationFailed(itemKey)
                    dropTimerRef.current = window.setTimeout(() => {
                        dropTimerRef.current = null
                        rolls.setResolving(false)
                        onSettled(false)
                    }, ITEM_DROP_HOLD_MS)
                    return
                }

                rolls.setResolving(false)
                onSettled(true)
            },
        )
    }

    return { resolveAttack, resolveManipulation }
}
