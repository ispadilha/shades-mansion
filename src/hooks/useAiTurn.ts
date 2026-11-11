import { useEffect, useRef, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import type {
    Barrier,
    CharacterColor,
    CharacterDefinition,
    CharacterPosition,
    Inventories,
    MotivationItem,
    MotivationItemKey,
    TextKey,
} from "../logic/types"
import type { Maze } from "../logic/maze"
import { chargeDurationMs, chargeVictims } from "../logic/charge"
import { walkDurationMs } from "../logic/movement"
import { damageOf, imitableSkillOf, skillFor, skillMaxRangeOf, skillRangeOf, type Skill } from "../logic/skills"
import {
    ownItemUses,
    planAction,
    planManipulation,
    rollMood,
    type AiAction,
    type AiBoard,
    type AiManipulation,
    type AiMemory,
    type AiMood,
} from "../logic/ai"
import { planSkill, type SkillContext } from "../logic/aiSkills"
import { useSkillRoll } from "./useSkillRoll"
import type { CombatResolution } from "./useCombatResolution"
import type { GameLog } from "./useGameLog"
import type { RollQueue } from "./useRolls"
import { AI_BARRIER_STEP_MS, AI_END_TURN_MS, AI_STEP_MS } from "../constants/rules"

interface AiTurnOptions {
    activeCharacter: CharacterDefinition | null
    isPlayerTurn: boolean
    round: number
    turnIndex: number
    characters: CharacterDefinition[]
    setCharacters: Dispatch<SetStateAction<CharacterDefinition[]>>
    items: MotivationItem[]
    inventories: Inventories
    maze: Maze
    // Barreiras acesas: fecham caminho para personagens adversárias
    barriers: Barrier[]
    // Acende uma barreira da personagem em uma casa
    raiseBarrier: (owner: CharacterDefinition, position: CharacterPosition) => void
    // Uma rolagem em andamento trava a IA até o resultado sair
    rolls: RollQueue
    isManualRoll: (color: CharacterColor) => boolean
    endTurn: () => void
    // Agenda a coleta do item pisado, para acontecer quando a personagem chegar na casa
    schedulePickup: (color: CharacterColor, position: CharacterPosition, delayMs: number) => void
    // Diz se o destino tem item: é o que separa "mover" de "coletar" no log
    moveActionFor: (position: CharacterPosition) => { actionKey: TextKey; target?: string }
    removeFromInventory: (color: CharacterColor, key: MotivationItemKey) => void
    // Segura a câmera na personagem manipulada enquanto ela ainda caminha até o destino
    holdFocus: (delayMs: number) => void
    combat: CombatResolution
    log: GameLog
}

// As etapas da vez, na ordem em que a IA as joga
const STAGES = ["items", "skillBeforeMovement", "manipulation", "action", "skillAfterMovement", "done"] as const
type AiStage = (typeof STAGES)[number]

// A vez em curso: a etapa em que ela está, o ânimo sorteado para ela, e o que já aconteceu nela
interface AiTurn extends AiMemory {
    key: string
    stage: AiStage
    mood: AiMood
    // A habilidade que a imitação copiou: ela entra em uso na decisão seguinte
    copied: Skill | null
}

// Por onde a ação sai, e o que ela gasta:
// a ação comum;
// a habilidade, com o dano que já saiu nos dados dela quando é o caso;
// ou uma manipulação, que não gasta nada da personagem manipulada
type AiSource =
    | { kind: "basic" }
    | { kind: "skill"; skill: Skill; damage?: number }
    | { kind: "manipulation"; by: CharacterColor }

// Turno de IA: roda para a personagem da vez,
// sempre que for de um time que o jogador não comanda.
// A vez passa  pelas etapas de `STAGES` uma decisão por vez,
// e cada decisão espera o que a anterior fez acabar na tela.
// No multi-jogador local, nunca roda. Assistindo, roda para todas.
// Devolve a personagem da IA que está usando a habilidade,
// para ela ganhar a aura de quem usa uma.
export const useAiTurn = ({
    activeCharacter,
    isPlayerTurn,
    round,
    turnIndex,
    characters,
    setCharacters,
    items,
    inventories,
    maze,
    barriers,
    raiseBarrier,
    rolls,
    isManualRoll,
    endTurn,
    schedulePickup,
    moveActionFor,
    removeFromInventory,
    holdFocus,
    combat,
    log,
}: AiTurnOptions): string | null => {
    const board: AiBoard = { characters, items, barriers, maze }
    const turnRef = useRef<AiTurn | null>(null)
    // Até quando o que a IA acabou de fazer ainda acontece na tela: uma caminhada, as barreiras acendendo uma a uma
    const busyUntilRef = useRef(0)
    // As barreiras ainda por acender, para não sobrarem depois que a partida sai da tela
    const timersRef = useRef<number[]>([])
    // O tabuleiro de agora, para a jogada que só sai depois de uma rolagem
    const boardRef = useRef(board)
    // Conta as decisões: uma etapa que passa sem mudar nada na partida ainda precisa levar à seguinte
    const [decisions, setDecisions] = useState(0)
    const [skillUserId, setSkillUserId] = useState<string | null>(null)
    const skillRoll = useSkillRoll({ rolls, isManualRoll })

    useEffect(() => {
        boardRef.current = board
    })

    useEffect(() => {
        return () => {
            for (const timer of timersRef.current) clearTimeout(timer)
        }
    }, [])

    const later = (delayMs: number, run: () => void) => {
        const timer = window.setTimeout(() => {
            timersRef.current = timersRef.current.filter((pending) => pending !== timer)
            run()
        }, delayMs)
        timersRef.current.push(timer)
    }

    // A próxima decisão espera a caminhada acabar, e a câmera vai junto com a personagem manipulada
    const waitWalk = (delayMs: number, source: AiSource) => {
        busyUntilRef.current = Date.now() + delayMs
        if (source.kind === "manipulation") holdFocus(delayMs)
    }

    // A personagem gasta o que a fonte da ação gasta, e vai para a casa, quando a ação a leva
    const spend = (characterId: string, source: AiSource, position?: CharacterPosition) =>
        setCharacters((prev) =>
            prev.map((p) =>
                p.id === characterId
                    ? {
                          ...p,
                          ...(position ? { position } : {}),
                          movedThisTurn: p.movedThisTurn || source.kind === "basic",
                          usedSkillThisTurn: p.usedSkillThisTurn || source.kind === "skill",
                      }
                    : p,
            ),
        )

    // Ação forçada por uma manipulação sai no histórico em nome de quem manipulou
    const record = (source: AiSource, actor: CharacterDefinition, actionKey: TextKey, target?: string) => {
        if (source.kind === "manipulation") log.manipulatedTo(source.by, actor.id, actionKey, target)
        else log.usedTo(actor.color, actor.id, actionKey, target)
    }

    // Executa a jogada, gastando o que a fonte dela gasta.
    // O tabuleiro é o de agora: a jogada pode vir depois de uma rolagem.
    const perform = (action: AiAction, source: AiSource) => {
        const now = boardRef.current
        const actor = now.characters.find((p) => p.id === action.characterId)
        if (!actor) return
        const walkMs = (to: CharacterPosition) => walkDurationMs(actor, to, now.maze, now.barriers, now.characters)
        const forcedBy = source.kind === "manipulation" ? { manipulatedBy: source.by } : {}

        switch (action.kind) {
            case "walk": {
                const delayMs = walkMs(action.to)
                const { actionKey, target } = moveActionFor(action.to)
                spend(actor.id, source, action.to)
                schedulePickup(actor.color, action.to, delayMs)
                record(source, actor, actionKey, target)
                waitWalk(delayMs, source)
                return
            }
            case "strike": {
                const skill = source.kind === "skill" ? source.skill : null
                const delayMs = walkMs(action.from)
                spend(actor.id, source, action.from)
                record(source, actor, action.targetId ? "toAttack" : "toBurnArea", action.targetId)
                if (action.targetId && source.kind !== "manipulation") turnRef.current?.struck.push(action.targetId)
                combat.resolveAttack({
                    attackerId: actor.id,
                    // Pela habilidade, o golpe sai com os dados de dano dela, quando ela os tem
                    damageDice: damageOf(actor, skill),
                    delayMs,
                    melee: skill?.ranged !== true,
                    ...(action.targetId ? { targetId: action.targetId } : {}),
                    ...(action.area ? { area: action.area } : {}),
                    ...forcedBy,
                })
                waitWalk(delayMs, source)
                return
            }
            case "dispel": {
                const delayMs = walkMs(action.from)
                spend(actor.id, source, action.from)
                record(source, actor, "toDispelBarrierOf", action.barrier.ownerId)
                combat.resolveDispel({ characterId: actor.id, barrier: action.barrier, delayMs, ...forcedBy })
                waitWalk(delayMs, source)
                return
            }
            case "charge": {
                const durationMs = chargeDurationMs(actor.position, action.to)
                const hits = chargeVictims(actor, action.to, now.characters, now.maze, now.barriers).map(
                    ({ character, at }) => ({ characterId: character.id, atMs: Math.round(at * durationMs) }),
                )
                spend(actor.id, source, action.to)
                record(source, actor, "toCharge")
                combat.resolveCharge({
                    characterId: actor.id,
                    from: actor.position,
                    to: action.to,
                    damage: source.kind === "skill" ? (source.damage ?? 0) : 0,
                    durationMs,
                    hits,
                })
                return
            }
            case "barriers": {
                // Uma de cada vez, com a personagem se virando para cada casa
                spend(actor.id, source)
                action.cells.forEach((cell, index) =>
                    later(index * AI_BARRIER_STEP_MS, () => {
                        combat.aimAt(actor.id, cell)
                        raiseBarrier(actor, cell)
                    }),
                )
                busyUntilRef.current = Date.now() + action.cells.length * AI_BARRIER_STEP_MS
                return
            }
            case "mimic": {
                const model = now.characters.find((p) => p.id === action.modelId)
                const copied = model ? imitableSkillOf(model) : null
                if (!model || !copied || !turnRef.current) return
                combat.aimAt(actor.id, model.position)
                log.usedTo(actor.color, actor.id, "toMimic", model.id)
                // A habilidade copiada entra em uso na decisão seguinte, como entraria pela lista
                turnRef.current.copied = copied
                return
            }
        }
    }

    // Usa a habilidade, se ela valer a pena agora.
    // A de alcance fixo já sabe aonde chega. A de dado só sabe depois da rolagem:
    // a IA arrisca quando o maior alcance que os dados tiram já valeria a pena,
    // e se o que sair não der para nada, perde a habilidade.
    // (Assim como acontece com um jogador que desiste do uso.)
    const trySkill = (skill: Skill, character: CharacterDefinition, turn: AiTurn): boolean => {
        const context = (range: number): SkillContext => ({ range, mood: turn.mood, memory: turn })
        const fixedRange = skillRangeOf(skill, character)
        const plan = planSkill(skill, character, board, context(fixedRange ?? skillMaxRangeOf(skill, character)))
        if (!plan) return false

        setSkillUserId(character.id)
        if (fixedRange !== null) {
            perform(plan, { kind: "skill", skill })
            return true
        }
        skillRoll.roll(skill, character, character.color, (range, damage) => {
            const rolledOn = boardRef.current
            const rolled = rolledOn.characters.find((p) => p.id === character.id)
            const action = rolled ? planSkill(skill, rolled, rolledOn, context(range)) : null
            if (action) perform(action, { kind: "skill", skill, damage })
            else spend(character.id, { kind: "skill", skill })
        })
        return true
    }

    // A moeda decide se a personagem obedece.
    // O item sai do inventário na tentativa (falhando, cai de volta no tabuleiro),
    // e a personagem só age se a manipulação pegar.
    const manipulate = (plan: AiManipulation, color: CharacterColor, turn: AiTurn) => {
        removeFromInventory(color, plan.itemKey)
        log.usedToManipulate(color, plan.itemKey)
        combat.resolveManipulation(color, plan.itemKey, (success) => {
            if (!success) return
            if (plan.lures) turn.lured = plan.itemKey
            perform(plan.action, { kind: "manipulation", by: color })
        })
    }

    // Cada etapa joga sobre o estado deste render e diz se fez alguma coisa
    const stages: Record<Exclude<AiStage, "done">, (turn: AiTurn, character: CharacterDefinition) => boolean> = {
        // Os itens do time nas próprias personagens:
        // promover, ou revigorar de acordo com a constante específica pra isso
        items: (turn, character) => {
            const { color } = character
            const spent = ownItemUses(characters, color, inventories[color], turn.mood)
            if (spent.length === 0) return false
            for (const { key, use, character: after } of spent) {
                removeFromInventory(color, key)
                if (use === "reinvigorate") log.reinvigorated(color, key)
                else log.promoted(color, key, after.level)
            }
            // Cada personagem fica como saiu do último item gasto nela
            const updated = new Map<string, CharacterDefinition>(spent.map((item) => [item.key, item.character]))
            setCharacters((prev) => prev.map((p) => updated.get(p.id) ?? p))
            return true
        },
        skillBeforeMovement: (turn, character) =>
            turn.mood.shouldUseSkillBeforeMovement && trySkill(skillFor(character.type), character, turn),
        manipulation: (turn, character) => {
            const inventory = inventories[character.color]
            const plan = planManipulation(character, board, inventory, turn.mood.shouldAssessManipulation)
            if (!plan) return false
            manipulate(plan, character.color, turn)
            return true
        },
        // Sem nada melhor a fazer, a personagem fica onde está, e a ação comum se vai
        action: (turn, character) => {
            const action = planAction(character, board, turn.mood, turn)
            if (action) perform(action, { kind: "basic" })
            else spend(character.id, { kind: "basic" })
            return true
        },
        // O sorteio de depois só existe para quem ainda não usou a habilidade antes
        skillAfterMovement: (turn, character) =>
            !character.usedSkillThisTurn &&
            turn.mood.shouldUseSkillAfterMovement &&
            trySkill(skillFor(character.type), character, turn),
    }

    // Joga as etapas até uma delas fazer alguma coisa: a seguinte espera o que ela fez acabar
    const play = (turn: AiTurn, character: CharacterDefinition) => {
        setSkillUserId(null)
        if (turn.copied) {
            const copied = turn.copied
            turn.copied = null
            trySkill(copied, character, turn)
        } else {
            while (turn.stage !== "done") {
                const stage = turn.stage
                turn.stage = STAGES[STAGES.indexOf(stage) + 1]
                if (stages[stage](turn, character)) break
            }
        }
        setDecisions((count) => count + 1)
    }

    const finish = () => {
        setSkillUserId(null)
        endTurn()
    }

    useEffect(() => {
        if (!activeCharacter || isPlayerTurn || rolls.resolving) return
        const key = `${round}-${turnIndex}`
        if (turnRef.current?.key !== key) {
            turnRef.current = { key, stage: STAGES[0], mood: rollMood(), struck: [], lured: null, copied: null }
        }
        const turn = turnRef.current
        // A imitação da última etapa ainda tem a habilidade copiada para usar
        const done = turn.stage === "done" && !turn.copied
        const wait = Math.max(done ? AI_END_TURN_MS : AI_STEP_MS, busyUntilRef.current - Date.now())
        const timer = window.setTimeout(() => (done ? finish() : play(turn, activeCharacter)), wait)
        return () => clearTimeout(timer)
        // As funções da vez fecham sobre o estado deste render, que está todo nas dependências
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [turnIndex, round, characters, isPlayerTurn, inventories, items, rolls.resolving, barriers, decisions])

    return skillUserId
}
