import { useEffect, useRef } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { PieceColor, PieceDefinition, PiecePosition, SpecialItemKey, TextKey } from "../logic/types"
import type { Maze } from "../logic/maze"
import {
    areaCells,
    piecesInBlast,
    rollDamage,
    rollDefense,
    rollManipulation,
    type AttackArea,
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
    ATTACK_ROLL_TIMING,
    DEFENSE_DIE,
    DODGE_ROLL_TIMING,
    ITEM_DROP_HOLD_MS,
    MAX_FIRE_BURSTS,
} from "../constants/rules"

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
    onManipulationFailed: (itemKey: SpecialItemKey) => void
}

export interface CombatResolution {
    // Toda tentativa de ataque (do jogador, da IA ou vinda de uma manipulação) passa por aqui
    resolveAttack: (attack: PendingAttack) => void
    // Tentativa de manipulação: o item já saiu do inventário de quem usou, e a moeda decide
    // se a peça obedece. Falhando, o item cai de volta no tabuleiro. Devolve o resultado a
    // quem chamou depois de encenar a rolagem.
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
    onManipulationFailed,
}: CombatResolutionOptions): CombatResolution => {
    const { t } = useLanguage()
    // Os dados do golpe só são jogados quando o atacante termina de se aproximar: o timer
    // fica guardado para ser cancelado quando a tela sair.
    const damageTimerRef = useRef<number | null>(null)
    // A queda do item devolvido segura a partida enquanto a câmera a acompanha
    const dropTimerRef = useRef<number | null>(null)

    useEffect(() => {
        return () => {
            if (damageTimerRef.current !== null) clearTimeout(damageTimerRef.current)
            if (dropTimerRef.current !== null) clearTimeout(dropTimerRef.current)
        }
    }, [])

    // O atacante rola o dano e, em cima dele, cada peça atingida rola sua defesa
    const resolveAttack = (attack: PendingAttack) => {
        // Quem joga os dados do golpe: o time da peça, ou quem a está manipulando
        const attackerColor = attack.consumerColor ?? pieces.find((p) => p.id === attack.attackerId)?.color ?? null
        rolls.setResolving(true)

        damageTimerRef.current = window.setTimeout(() => {
            damageTimerRef.current = null

            // O tiro caiu: trazendo uma área, ela pega fogo antes de qualquer conta
            const burning = attack.area ? igniteArea(attack.area, attack.attackerId) : []
            const defenders = defendersOf(attack, burning)

            // Fogo em casa vazia, ou alvo que já saiu do tabuleiro: nada para rolar
            if (defenders.length === 0) {
                rolls.setResolving(false)
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
                () => resolveDefenders(attack, damage, defenders, 0),
            )
        }, attack.delayMs)
    }

    // O incêndio acontece com ou sem peça(s) para queimar
    const igniteArea = (area: AttackArea, attackerId: string): PiecePosition[] => {
        const burning = areaCells(maze, area.center, area.side)
        setFireBursts((prev) => [
            ...prev.slice(-MAX_FIRE_BURSTS + 1),
            { id: `fire-${attackerId}-${Date.now()}`, center: area.center, cells: burning },
        ])
        return burning
    }

    // Quem se defende: a peça mirada, ou todas as da área quando o golpe incendeia
    const defendersOf = (attack: PendingAttack, burning: PiecePosition[]): PieceDefinition[] => {
        if (attack.area) return piecesInBlast(pieces, burning, attack.area.center)
        const target = pieces.find((p) => p.id === attack.targetId)
        return target ? [target] : []
    }

    // Uma defesa de cada vez, rolada por quem comanda a peça atingida
    const resolveDefenders = (
        attack: PendingAttack,
        damage: DamageRoll,
        defenders: PieceDefinition[],
        index: number,
    ) => {
        const defender = defenders[index]
        if (!defender) {
            rolls.setResolving(false)
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
                if (defense.damage > 0) applyDamage(defender.id, defense.damage)

                if (defense.outcome === "dodged") log.attackDodged(attack.attackerId, defender.id)
                else if (defense.outcome === "guarded") log.attackGuarded(attack.attackerId, defender.id, defense.damage)
                else log.attackHit(attack.attackerId, defender.id, defense.damage)

                resolveDefenders(attack, damage, defenders, index + 1)
            },
        )
    }

    // Quem chega a zero sai do tabuleiro
    const applyDamage = (pieceId: string, damage: number) => {
        setPieces((prev) => prev.map((p) => (p.id === pieceId ? { ...p, hp: p.hp - damage } : p)).filter((p) => p.hp > 0))
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
