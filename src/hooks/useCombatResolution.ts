import { useEffect, useRef, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { Barrier, CharacterColor, CharacterDefinition, CharacterPosition, MotivationItemKey, TextKey } from "../logic/types"
import type { Maze } from "../logic/maze"
import {
    areaCells,
    charactersInBlast,
    rollDamage,
    rollDefense,
    rollDispel,
    rollManipulation,
    rollRivalry,
    type Aim,
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
import { areRivals } from "../logic/rivalry"
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
    MAX_AIMS,
    MAX_CHARGE_RUNS,
    MAX_DAMAGE_POPUPS,
    MAX_FIRE_BURSTS,
    statsFor,
    SUCCESS_FACE,
} from "../constants/rules"

// Uma personagem atingida e quanto ela levou. As defesas são roladas uma a uma, mas o dano
// fica guardado aqui até o fim: ninguém sai do tabuleiro no meio das rolagens.
interface Hit {
    characterId: string
    damage: number
}

const DEFENSE_READING: Record<DefenseOutcome, { label: TextKey; tone: RollTone }> = {
    dodged: { label: "defenseDodge", tone: "good" },
    guarded: { label: "defenseGuard", tone: "neutral" },
    clean: { label: "defenseNone", tone: "bad" },
}

interface CombatResolutionOptions {
    characters: CharacterDefinition[]
    maze: Maze
    // Barreiras acesas: as adversárias de quem atira seguram o fogo do incêndio
    barriers: Barrier[]
    setCharacters: Dispatch<SetStateAction<CharacterDefinition[]>>
    setFireBursts: Dispatch<SetStateAction<FireBurst[]>>
    // Os números de dano que sobem acima das personagens atingidas
    setDamagePopups: Dispatch<SetStateAction<DamagePopup[]>>
    // As investidas, para a cena fazer a personagem correr em linha reta
    setChargeRuns: Dispatch<SetStateAction<ChargeRun[]>>
    // As viradas para o alvo, para a cena virar a personagem antes de ela agir
    setAims: Dispatch<SetStateAction<Aim[]>>
    // Personagem sob manipulação: é ela que a câmera segue enquanto a moeda está no ar
    setManipulatedId: (characterId: string | null) => void
    rolls: RollQueue
    log: GameLog
    // Rolagem de time comandado por jogador espera o clique no dado,
    // as de times comandados por IA rolam automaticamente.
    isManualRoll: (color: CharacterColor) => boolean
    // Uma manipulação falha derruba o item de volta no tabuleiro
    onManipulationFailed: (itemKey: MotivationItemKey) => void
    // Tira do tabuleiro a barreira que uma personagem conseguiu dissipar
    dispelBarrier: (barrierId: string) => void
}

export interface CombatResolution {
    // Toda tentativa de ataque (do jogador, da IA ou vinda de uma manipulação) passa por aqui
    resolveAttack: (attack: PendingAttack) => void
    // Tentativa de dissipar uma barreira: a personagem chega ao lado dela e o dado decide
    resolveDispel: (dispel: PendingDispel) => void
    // Investida: a personagem já está correndo, e cada atropelada leva o dano quando ela passa por cima
    resolveCharge: (charge: PendingCharge) => void
    // Tentativa de manipulação: o item já saiu do inventário de quem usou, e a moeda decide
    // se a personagem obedece. Falhando, o item cai de volta no tabuleiro. Devolve o resultado a
    // quem chamou depois de encenar a rolagem.
    resolveManipulation: (color: CharacterColor, itemKey: MotivationItemKey, onSettled: (success: boolean) => void) => void
    // A personagem se vira para o alvo do que vai fazer (uma casa, ou outra personagem pelo id).
    // O ataque e a dissipação viram quem age sozinhos, quando ela chega, e o ataque vira também quem
    // é atingido. As outras ações com alvo chamam isto.
    aimAt: (characterId: string, target: CharacterPosition | string) => void
    // As duas rivais de um golpe corpo a corpo, enquanto os dados dele rolam (vazio fora disso)
    rivals: string[]
}

export const useCombatResolution = ({
    characters,
    maze,
    barriers,
    setCharacters,
    setFireBursts,
    setDamagePopups,
    setChargeRuns,
    setAims,
    setManipulatedId,
    rolls,
    log,
    isManualRoll,
    onManipulationFailed,
    dispelBarrier,
}: CombatResolutionOptions): CombatResolution => {
    const { t, tCharacterName } = useLanguage()
    // Quem está rolando, com o nível ao lado. O nível pertence à ficha da rolagem porque é
    // ele que decide o dado de dano do atacante e os números de defesa de quem se defende.
    const withLevel = (character: CharacterDefinition) =>
        `${tCharacterName(character.id)} (${t("level")} ${character.level})`
    // Os dados só são jogados quando quem age termina de se aproximar:
    // o timer fica guardado para ser cancelado quando a tela sair.
    const approachTimerRef = useRef<number | null>(null)
    // A queda do item devolvido segura a partida enquanto a câmera a acompanha
    const dropTimerRef = useRef<number | null>(null)
    // A animação do golpe segura a partida enquanto acontece
    const effectTimerRef = useRef<number | null>(null)
    // Os golpes de uma investida em andamento, um por personagem no caminho, e o fim da corrida
    const chargeTimersRef = useRef<number[]>([])
    // As personagens como estão agora. As rolagens terminam depois de quem ataca ter andado até o
    // alvo, e o número do dano que volta para ela tem que subir da casa a que ela chegou.
    const charactersRef = useRef(characters)
    const [rivals, setRivals] = useState<string[]>([])
    useEffect(() => {
        charactersRef.current = characters
    })

    useEffect(() => {
        return () => {
            if (approachTimerRef.current !== null) clearTimeout(approachTimerRef.current)
            if (dropTimerRef.current !== null) clearTimeout(dropTimerRef.current)
            if (effectTimerRef.current !== null) clearTimeout(effectTimerRef.current)
            for (const timer of chargeTimersRef.current) clearTimeout(timer)
        }
    }, [])

    // O atacante rola o dano e, em cima dele, cada personagem atingida rola sua defesa.
    // Só quando não sobra rolagem é que o golpe aparece no tabuleiro.
    const resolveAttack = (attack: PendingAttack) => {
        // Quem joga os dados do golpe: o time da personagem, ou quem a está manipulando
        const attackerColor = attack.manipulatedBy ?? characters.find((p) => p.id === attack.attackerId)?.color ?? null
        rolls.setResolving(true)

        approachTimerRef.current = window.setTimeout(() => {
            approachTimerRef.current = null
            // Já perto, quem ataca se vira para o alvo: a personagem mirada, ou o centro do fogo
            const aimed = attack.area?.center ?? attack.targetId
            if (aimed) aimAt(attack.attackerId, aimed)
            // Golpe corpo a corpo na rival: as duas brilham juntas até os dados acabarem
            if (attack.melee && attack.targetId && areRivals(attack.attackerId, attack.targetId)) {
                setRivals([attack.attackerId, attack.targetId])
            }

            // Quem segura o fogo é barreira adversária de quem o acendeu,
            // e o fogo é da personagem que atira, não do time que a manipulou, se foi o caso.
            const firedBy = characters.find((p) => p.id === attack.attackerId)
            const fire = firedBy ? { color: firedBy.color, barriers } : undefined
            // As casas que o golpe alcança saem antes das rolagens, porque é delas que vem
            // quem se defende. Nada é animado ainda: o tabuleiro só reage depois dos dados.
            const reached = attack.area ? areaCells(maze, attack.area.center, attack.area.side, fire) : []
            const defenders = defendersOf(attack, reached)
            // E quem é atingido se vira para encarar quem ataca
            for (const defender of defenders) {
                if (defender.id !== attack.attackerId) aimAt(defender.id, attack.attackerId)
            }

            // Golpe no vazio (área sem ninguém, ou alvo que já saiu do tabuleiro): não há o
            // que rolar, mas a animação acontece do mesmo jeito
            if (defenders.length === 0) {
                settleAttack(attack, reached, [])
                return
            }

            const attackerLabel = firedBy ? withLevel(firedBy) : tCharacterName(attack.attackerId)
            const damage = rollDamage(attack.damageDice)

            rolls.show(
                {
                    id: `damage-${attack.attackerId}-${Date.now()}`,
                    kind: dieKind(attack.damageDice.sides),
                    value: damage.dice,
                    title: t("damageRoll"),
                    subtitle: attack.targetId
                    ? `${attackerLabel} › ${tCharacterName(attack.targetId)}`
                    : attackerLabel,
                    outcome: { label: t("damagePoints"), tone: "neutral" },
                    manual: attackerColor !== null && isManualRoll(attackerColor),
                    ...ATTACK_ROLL_TIMING,
                },
                () => resolveDefenders(attack, reached, damage, defenders, 0, []),
            )
        }, attack.delayMs)
    }

    // Quem se defende: a personagem mirada, ou todas as da área quando o golpe incendeia
    const defendersOf = (attack: PendingAttack, reached: CharacterPosition[]): CharacterDefinition[] => {
        if (attack.area) return charactersInBlast(characters, reached, attack.area.center)
        const target = characters.find((p) => p.id === attack.targetId)
        return target ? [target] : []
    }

    // Os números que o d20 da defesa tenta alcançar
    const defenseTargets = (defender: CharacterDefinition): RollTarget[] => {
        const { dodge, guard } = statsFor(defender.type, defender.level)

        return [
            canDodge(defender.type)
                ? { value: String(dodge), label: t("toDodge") }
                : { label: t("cannotDodge") },
            { value: String(guard), label: t("toGuard") },
        ]
    }

    // Uma defesa de cada vez, rolada por quem comanda a personagem atingida. O que cada uma leva
    // vai se somando em `hits` e só é aplicado no fim.
    const resolveDefenders = (
        attack: PendingAttack,
        reached: CharacterPosition[],
        damage: DamageRoll,
        defenders: CharacterDefinition[],
        index: number,
        hits: Hit[],
    ) => {
        const defender = defenders[index]
        if (!defender) {
            settleAttack(attack, reached, hits)
            return
        }
        if (attack.melee && areRivals(attack.attackerId, defender.id)) {
            resolveRivalry(attack, reached, damage, defenders, index, hits)
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

                const next = defense.damage > 0 ? [...hits, { characterId: defender.id, damage: defense.damage }] : hits
                resolveDefenders(attack, reached, damage, defenders, index + 1, next)
            },
        )
    }

    // Golpe corpo a corpo na rival: a defesa vira a rolagem de rivalidade, na moeda.
    const resolveRivalry = (
        attack: PendingAttack,
        reached: CharacterPosition[],
        damage: DamageRoll,
        defenders: CharacterDefinition[],
        index: number,
        hits: Hit[],
    ) => {
        const defender = defenders[index]
        const rivalry = rollRivalry(damage.total)

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
                    : { label: t(DEFENSE_READING.clean.label), tone: DEFENSE_READING.clean.tone },
                manual: isManualRoll(defender.color),
                ...DODGE_ROLL_TIMING,
            },
            () => {
                if (rivalry.foughtBack) log.foughtBack(attack.attackerId, defender.id, rivalry.damage, rivalry.returned)
                else log.attackHit(attack.attackerId, defender.id, rivalry.damage)

                const next = [
                    ...hits,
                    { characterId: defender.id, damage: rivalry.damage },
                    ...(rivalry.returned > 0 ? [{ characterId: attack.attackerId, damage: rivalry.returned }] : []),
                ]
                resolveDefenders(attack, reached, damage, defenders, index + 1, next)
            },
        )
    }

    // Fim das rolagens: agora sim o golpe aparece no tabuleiro, e o dano de todas as personagens
    // atingidas entra junto com ele. Nenhuma personagem sai do tabuleiro antes de a animação
    // mostrar o que a tirou de lá.
    const settleAttack = (attack: PendingAttack, reached: CharacterPosition[], hits: Hit[]) => {
        setRivals((prev) => (prev.length > 0 ? [] : prev))
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
    const playAttackEffect = (attack: PendingAttack, reached: CharacterPosition[]): boolean => {
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
        // O número sobe da casa em que a personagem estava: ele precisa aparecer mesmo para
        // quem foi eliminada por este golpe.
        const popups = hits.flatMap((hit) => {
            const character = charactersRef.current.find((p) => p.id === hit.characterId)
            if (!character) return []
            return [{ id: `dmg-${hit.characterId}-${Date.now()}`, position: { ...character.position }, amount: hit.damage }]
        })
        if (popups.length > 0) {
            setDamagePopups((prev) => [...prev.slice(-MAX_DAMAGE_POPUPS + popups.length), ...popups])
        }

        setCharacters((prev) =>
            prev
                .map((character) => {
                    const hit = hits.find((h) => h.characterId === character.id)
                    return hit ? { ...character, vigor: character.vigor - hit.damage } : character
                })
                .filter((character) => character.vigor > 0),
        )
    }

    const resolveManipulation = (
        color: CharacterColor,
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
                subtitle: tCharacterName(itemKey),
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

    // O dado só é jogado quando a personagem chega ao lado da barreira.
    // Dando certo, aquela barreira se apaga, e só ela.
    const resolveDispel = (dispel: PendingDispel) => {
        // Quem joga o dado: o time da personagem, ou quem a está manipulando
        const rollerColor = dispel.manipulatedBy ?? characters.find((p) => p.id === dispel.characterId)?.color ?? null
        rolls.setResolving(true)

        approachTimerRef.current = window.setTimeout(() => {
            approachTimerRef.current = null
            // Ao lado da barreira, a personagem se vira para ela
            aimAt(dispel.characterId, dispel.barrier.position)
            const { die, success } = rollDispel()
            const barrierOwner = tCharacterName(dispel.barrier.ownerId)

            rolls.show(
                {
                    id: `dispel-${dispel.characterId}-${Date.now()}`,
                    kind: dieKind(DISPEL_DIE),
                    value: [die],
                    title: t("dispelRoll"),
                    subtitle: `${tCharacterName(dispel.characterId)} › ${t("barrierOf")} ${barrierOwner}`,
                    targets: [{ value: String(DISPEL_MIN_ROLL), label: t("toDispel") }],
                    outcome: {
                        label: success ? t("dispelWorked") : t("dispelFailed"),
                        tone: success ? "good" : "bad",
                    },
                    manual: rollerColor !== null && isManualRoll(rollerColor),
                },
                () => {
                    log.dispelRoll(dispel.characterId, dispel.barrier.ownerId, success)
                    if (success) dispelBarrier(dispel.barrier.id)
                    rolls.setResolving(false)
                },
            )
        }, dispel.delayMs)
    }

    // A investida faz a personagem correr em linha reta, e cada personagem no caminho
    // leva o dano no instante em que ela passa por cima.
    // Não há defesa: o dano é o que saiu no dado.
    // A partida fica travada até a corrida acabar.
    const resolveCharge = (charge: PendingCharge) => {
        rolls.setResolving(true)
        // Quem está no caminho se vira para encarar a investida que vem
        for (const hit of charge.hits) aimAt(hit.characterId, charge.from)
        setChargeRuns((prev) => [
            ...prev.slice(-MAX_CHARGE_RUNS + 1),
            {
                id: `charge-${charge.characterId}-${Date.now()}`,
                characterId: charge.characterId,
                to: charge.to,
                durationMs: charge.durationMs,
            },
        ])

        const timers = charge.hits.map((hit) =>
            window.setTimeout(() => {
                log.attackHit(charge.characterId, hit.characterId, charge.damage)
                applyDamage([{ characterId: hit.characterId, damage: charge.damage }])
            }, hit.atMs),
        )
        const finish = window.setTimeout(() => {
            chargeTimersRef.current = []
            rolls.setResolving(false)
        }, charge.durationMs + ACTION_SETTLE_MS)
        chargeTimersRef.current = [...timers, finish]
    }

    const aimAt = (characterId: string, target: CharacterPosition | string) => {
        const aim = { id: `aim-${characterId}-${Date.now()}`, characterId, target }
        setAims((prev) => [...prev.slice(-MAX_AIMS + 1), aim])
    }

    return { resolveAttack, resolveManipulation, resolveDispel, resolveCharge, aimAt, rivals }
}
