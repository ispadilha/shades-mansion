import { useEffect, useRef } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { Barrier, PieceColor, PieceDefinition, PiecePosition, MotivationItemKey, TextKey } from "../logic/types"
import type { Maze } from "../logic/maze"
import {
    areaCells,
    piecesInBlast,
    rollDamage,
    rollDefense,
    rollDispel,
    rollManipulation,
    type ChargeRun,
    type DamageRoll,
    type DefenseOutcome,
    type DamagePopup,
    type FireBurst,
    type PendingAttack,
    type PendingCharge,
    type PendingDispel,
} from "../logic/combat"
import { dieKind, type RollTarget, type RollTone } from "../logic/rolls"
import { useLanguage } from "./useLanguage"
import type { GameLog } from "./useGameLog"
import type { RollQueue } from "./useRolls"
import {
    ACTION_SETTLE_MS,
    ATTACK_EFFECT_HOLD_MS,
    ATTACK_ROLL_TIMING,
    canDodge,
    DEFENSE_DIE,
    DISPEL_DIE,
    DISPEL_MIN_ROLL,
    DODGE_ROLL_TIMING,
    ITEM_DROP_HOLD_MS,
    MAX_CHARGE_RUNS,
    MAX_DAMAGE_POPUPS,
    MAX_FIRE_BURSTS,
    statsFor,
    SUCCESS_FACE,
} from "../constants/rules"

// Uma peça atingida e quanto ela levou. As defesas são roladas uma a uma, mas o dano
// fica guardado aqui até o fim: ninguém sai do tabuleiro no meio das rolagens.
interface Hit {
    pieceId: string
    damage: number
}

const DEFENSE_READING: Record<DefenseOutcome, { label: TextKey; tone: RollTone }> = {
    dodged: { label: "defenseDodge", tone: "good" },
    guarded: { label: "defenseGuard", tone: "neutral" },
    clean: { label: "defenseNone", tone: "bad" },
}

interface CombatResolutionOptions {
    pieces: PieceDefinition[]
    maze: Maze
    // Barreiras acesas: as adversárias de quem atira seguram o fogo do incêndio
    barriers: Barrier[]
    setPieces: Dispatch<SetStateAction<PieceDefinition[]>>
    setFireBursts: Dispatch<SetStateAction<FireBurst[]>>
    // Os números de dano que sobem acima das peças atingidas
    setDamagePopups: Dispatch<SetStateAction<DamagePopup[]>>
    // As investidas, para a cena fazer a peça correr em linha reta
    setChargeRuns: Dispatch<SetStateAction<ChargeRun[]>>
    // Peça sob manipulação: é ela que a câmera segue enquanto a moeda está no ar
    setManipulatedId: (pieceId: string | null) => void
    rolls: RollQueue
    log: GameLog
    // Rolagem de time comandado por jogador espera o clique no dado,
    // as de times comandados por IA rolam automaticamente.
    isManualRoll: (color: PieceColor) => boolean
    // Uma manipulação falha derruba o item de volta no tabuleiro
    onManipulationFailed: (itemKey: MotivationItemKey) => void
    // Tira do tabuleiro a barreira que uma peça conseguiu dissipar
    dispelBarrier: (barrierId: string) => void
}

export interface CombatResolution {
    // Toda tentativa de ataque (do jogador, da IA ou vinda de uma manipulação) passa por aqui
    resolveAttack: (attack: PendingAttack) => void
    // Tentativa de dissipar uma barreira: a peça chega ao lado dela e o dado decide
    resolveDispel: (dispel: PendingDispel) => void
    // Investida: a peça já está correndo, e cada atropelada leva o dano quando ela passa por cima
    resolveCharge: (charge: PendingCharge) => void
    // Tentativa de manipulação: o item já saiu do inventário de quem usou, e a moeda decide
    // se a peça obedece. Falhando, o item cai de volta no tabuleiro. Devolve o resultado a
    // quem chamou depois de encenar a rolagem.
    resolveManipulation: (color: PieceColor, itemKey: MotivationItemKey, onSettled: (success: boolean) => void) => void
}

export const useCombatResolution = ({
    pieces,
    maze,
    barriers,
    setPieces,
    setFireBursts,
    setDamagePopups,
    setChargeRuns,
    setManipulatedId,
    rolls,
    log,
    isManualRoll,
    onManipulationFailed,
    dispelBarrier,
}: CombatResolutionOptions): CombatResolution => {
    const { t } = useLanguage()
    // Quem está rolando, com o nível ao lado. O nível pertence à ficha da rolagem porque é
    // ele que decide o dado de dano do atacante e os números de defesa de quem se defende.
    const withLevel = (piece: PieceDefinition) => `${piece.id} (${t("level")} ${piece.level})`
    // Os dados só são jogados quando quem age termina de se aproximar:
    // o timer fica guardado para ser cancelado quando a tela sair.
    const approachTimerRef = useRef<number | null>(null)
    // A queda do item devolvido segura a partida enquanto a câmera a acompanha
    const dropTimerRef = useRef<number | null>(null)
    // A animação do golpe segura a partida enquanto acontece
    const effectTimerRef = useRef<number | null>(null)
    // Os golpes de uma investida em andamento, um por peça no caminho, e o fim da corrida
    const chargeTimersRef = useRef<number[]>([])

    useEffect(() => {
        return () => {
            if (approachTimerRef.current !== null) clearTimeout(approachTimerRef.current)
            if (dropTimerRef.current !== null) clearTimeout(dropTimerRef.current)
            if (effectTimerRef.current !== null) clearTimeout(effectTimerRef.current)
            for (const timer of chargeTimersRef.current) clearTimeout(timer)
        }
    }, [])

    // O atacante rola o dano e, em cima dele, cada peça atingida rola sua defesa.
    // Só quando não sobra rolagem é que o golpe aparece no tabuleiro.
    const resolveAttack = (attack: PendingAttack) => {
        // Quem joga os dados do golpe: o time da peça, ou quem a está manipulando
        const attackerColor = attack.manipulatedBy ?? pieces.find((p) => p.id === attack.attackerId)?.color ?? null
        rolls.setResolving(true)

        approachTimerRef.current = window.setTimeout(() => {
            approachTimerRef.current = null

            // Quem segura o fogo é barreira adversária de quem o acendeu,
            // e o fogo é da peça que atira, não do time que a manipulou, se foi o caso.
            const firedBy = pieces.find((p) => p.id === attack.attackerId)
            const fire = firedBy ? { color: firedBy.color, barriers } : undefined
            // As casas que o golpe alcança saem antes das rolagens, porque é delas que vem
            // quem se defende. Nada é animado ainda: o tabuleiro só reage depois dos dados.
            const reached = attack.area ? areaCells(maze, attack.area.center, attack.area.side, fire) : []
            const defenders = defendersOf(attack, reached)

            // Golpe no vazio (área sem ninguém, ou alvo que já saiu do tabuleiro): não há o
            // que rolar, mas a animação acontece do mesmo jeito
            if (defenders.length === 0) {
                settleAttack(attack, reached, [])
                return
            }

            const attackerLabel = firedBy ? withLevel(firedBy) : attack.attackerId
            const damage = rollDamage(attack.damageDice)

            rolls.show(
                {
                    id: `damage-${attack.attackerId}-${Date.now()}`,
                    kind: dieKind(attack.damageDice.sides),
                    value: damage.dice,
                    title: t("damageRoll"),
                    subtitle: attack.targetId
                    ? `${attackerLabel} → ${attack.targetId}`
                    : attackerLabel,
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

    // Os números que o d20 da defesa tenta alcançar
    const defenseTargets = (defender: PieceDefinition): RollTarget[] => {
        const { dodge, guard } = statsFor(defender.type, defender.level)

        return [
            canDodge(defender.type)
                ? { value: String(dodge), label: t("toDodge") }
                : { label: t("cannotDodge") },
            { value: String(guard), label: t("toGuard") },
        ]
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
                title: t("defenseRoll"),
                subtitle: withLevel(defender),
                targets: defenseTargets(defender),
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
        // O número sobe da casa em que a peça estava: ele precisa aparecer mesmo para
        // quem foi eliminada por este golpe.
        const popups = hits.flatMap((hit) => {
            const piece = pieces.find((p) => p.id === hit.pieceId)
            if (!piece) return []
            return [{ id: `dmg-${hit.pieceId}-${Date.now()}`, position: { ...piece.position }, amount: hit.damage }]
        })
        if (popups.length > 0) {
            setDamagePopups((prev) => [...prev.slice(-MAX_DAMAGE_POPUPS + popups.length), ...popups])
        }

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
                targets: [{ value: t(SUCCESS_FACE === "heads" ? "coinHeads" : "coinTails"), label: t("toManipulate") }],
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

    // O dado só é jogado quando a peça chega ao lado da barreira.
    // Dando certo, aquela barreira se apaga, e só ela.
    const resolveDispel = (dispel: PendingDispel) => {
        // Quem joga o dado: o time da peça, ou quem a está manipulando
        const rollerColor = dispel.manipulatedBy ?? pieces.find((p) => p.id === dispel.pieceId)?.color ?? null
        rolls.setResolving(true)

        approachTimerRef.current = window.setTimeout(() => {
            approachTimerRef.current = null
            const { die, success } = rollDispel()

            rolls.show(
                {
                    id: `dispel-${dispel.pieceId}-${Date.now()}`,
                    kind: dieKind(DISPEL_DIE),
                    value: [die],
                    title: t("dispelRoll"),
                    subtitle: `${dispel.pieceId} → ${t("barrierOf")} ${dispel.barrier.ownerId}`,
                    targets: [{ value: String(DISPEL_MIN_ROLL), label: t("toDispel") }],
                    outcome: {
                        label: success ? t("dispelWorked") : t("dispelFailed"),
                        tone: success ? "good" : "bad",
                    },
                    manual: rollerColor !== null && isManualRoll(rollerColor),
                },
                () => {
                    log.dispelRoll(dispel.pieceId, dispel.barrier.ownerId, success)
                    if (success) dispelBarrier(dispel.barrier.id)
                    rolls.setResolving(false)
                },
            )
        }, dispel.delayMs)
    }

    // A investida faz a peça correr em linha reta, e cada peça no caminho
    // leva o dano no instante em que ela passa por cima.
    // Não há defesa: o dano é o que saiu no dado.
    // A partida fica travada até a corrida acabar.
    const resolveCharge = (charge: PendingCharge) => {
        rolls.setResolving(true)
        setChargeRuns((prev) => [
            ...prev.slice(-MAX_CHARGE_RUNS + 1),
            {
                id: `charge-${charge.pieceId}-${Date.now()}`,
                pieceId: charge.pieceId,
                to: charge.to,
                durationMs: charge.durationMs,
            },
        ])

        const timers = charge.hits.map((hit) =>
            window.setTimeout(() => {
                log.attackHit(charge.pieceId, hit.pieceId, charge.damage)
                applyDamage([{ pieceId: hit.pieceId, damage: charge.damage }])
            }, hit.atMs),
        )
        const finish = window.setTimeout(() => {
            chargeTimersRef.current = []
            rolls.setResolving(false)
        }, charge.durationMs + ACTION_SETTLE_MS)
        chargeTimersRef.current = [...timers, finish]
    }

    return { resolveAttack, resolveManipulation, resolveDispel, resolveCharge }
}
