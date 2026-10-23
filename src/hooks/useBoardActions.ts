import type { Dispatch, SetStateAction } from "react"
import type { CharacterColor, CharacterDefinition, CharacterPosition, TextKey } from "../logic/types"
import type { Barrier, MotivationItem } from "../logic/types"
import type { Maze } from "../logic/maze"
import type { BoardMenuState } from "../logic/boardMenu"
import { attackArea } from "../logic/combat"
import { chargeDurationMs, chargeVictims } from "../logic/charge"
import { findApproachCell, pathLength, strikeWalkRange } from "../logic/movement"
import { blockedCellsFor } from "../logic/grid"
import { damageOf } from "../logic/skills"
import type { SkillFlow } from "./useSkillFlow"
import type { CombatResolution } from "./useCombatResolution"
import type { GameLog } from "./useGameLog"
import { ACTION_SETTLE_MS, STEP_MS } from "../constants/rules"

interface BoardActionsOptions {
    characters: CharacterDefinition[]
    setCharacters: Dispatch<SetStateAction<CharacterDefinition[]>>
    maze: Maze
    // Cor de quem comanda a jogada. Null quando não é a vez do jogador.
    activeColor: CharacterColor | null
    selectedId: string | null
    setSelectedId: (id: string | null) => void
    skill: SkillFlow
    // A casa em que o jogador clicou com o botão direito
    menu: BoardMenuState | null
    closeMenu: () => void
    // Há manipulação em curso? A ação então é anormal e não gasta a vez da personagem.
    manipulating: boolean
    endManipulation: () => void
    // Segura a câmera na personagem manipulada enquanto ela ainda caminha até o destino
    holdFocus: (delayMs: number) => void
    schedulePickup: (color: CharacterColor, position: CharacterPosition, delayMs: number) => void
    // Andar para uma casa com item é coletar: o histórico diz uma coisa ou outra
    moveActionFor: (position: CharacterPosition) => { actionKey: TextKey; target?: string }
    combat: CombatResolution
    log: GameLog
    // Barreiras acesas: elas fecham caminho para os times rivais
    barriers: Barrier[]
    // Itens no chão: a casa de um não serve para parar e golpear a partir dela
    items: MotivationItem[]

    // O que a habilidade em uso faz quando cria algo numa casa
    placeSkill: (position: CharacterPosition) => void
}

export interface BoardActions {
    // Andar até a casa escolhida. Se houver item nela, a personagem o coleta ao chegar.
    walk: () => void
    // Atacar a casa escolhida com o ataque comum
    attack: () => void
    // Tentar dissipar a barreira da casa escolhida, de uma casa ao lado dela
    dispel: () => void
    // Acionar a habilidade em uso na casa escolhida
    useSkill: () => void
}

// O que o menu de contexto executa: os caminhos pelos quais uma personagem age no tabuleiro.
// Terminam da mesma forma: a personagem sai de seleção, a habilidade sai de uso,
// o menu fecha, e o histórico registra quem fez o quê.
export const useBoardActions = ({
    characters,
    setCharacters,
    maze,
    activeColor,
    selectedId,
    setSelectedId,
    skill,
    menu,
    closeMenu,
    manipulating,
    endManipulation,
    holdFocus,
    schedulePickup,
    moveActionFor,
    combat,
    log,
    barriers,
    items,
    placeSkill,
}: BoardActionsOptions): BoardActions => {
    // Quanto a personagem demora para chegar lá,
    // andando casa a casa e contornando o que estiver fechado para o time dela
    const travelTime = (character: CharacterDefinition, to: CharacterPosition) =>
        pathLength(character.position, to, maze, blockedCellsFor(character.color, barriers, characters)) * STEP_MS + ACTION_SETTLE_MS

    const finishAction = () => {
        setSelectedId(null)
        skill.clear()
        closeMenu()
    }

    // Ação forçada por uma manipulação sai no histórico em nome de quem manipulou,
    // e encerra a manipulação
    const record = (color: CharacterColor, characterId: string, actionKey: TextKey, target?: string) => {
        if (!manipulating) {
            log.usedTo(color, characterId, actionKey, target)
            return
        }
        log.manipulatedTo(color, characterId, actionKey, target)
        endManipulation()
    }

    const walk = () => {
        const destination = menu?.position
        if (!destination || !selectedId || !activeColor) return
        const character = characters.find((p) => p.id === selectedId)
        if (!character) return

        // Com uma habilidade de movimento extra em uso, o passo sai da habilidade
        const viaSkill = skill.reach !== null && skill.reach.move > 0
        const delayMs = travelTime(character, destination)
        const { actionKey, target } = moveActionFor(destination)

        // Ação forçada por manipulação não gasta a ação que a personagem tem no próprio turno
        const spendsAction = !manipulating && !viaSkill
        setCharacters((prev) =>
            prev.map((p) =>
                p.id === selectedId
                    ? {
                          ...p,
                          position: destination,
                          movedThisTurn: p.movedThisTurn || spendsAction,
                          usedSkillThisTurn: p.usedSkillThisTurn || viaSkill,
                      }
                    : p,
            ),
        )
        schedulePickup(character.color, destination, delayMs)
        finishAction()
        record(activeColor, character.id, actionKey, target)
        // A personagem manipulada ainda vai caminhar até o destino: a câmera vai com ela
        if (manipulating) holdFocus(delayMs)
    }

    const strike = (viaSkill: boolean) => {
        if (!selectedId || !menu || !activeColor) return
        const attacker = characters.find((p) => p.id === selectedId)
        if (!attacker) return

        const active = viaSkill ? skill.active : null
        const reach = viaSkill ? skill.reach : null

        // O ataque cai em uma casa, que pode ou não ter uma personagem em cima.
        // Mirar o chão é só para habilidade que atinge área.
        const target = menu.targetCharacter
        const area = active ? attackArea(attacker, active.skill, target?.position ?? menu.position) : undefined
        if (!target && !area) return

        // Habilidade de alcance acerta de onde a personagem está. Para golpe comum, se aproxima antes.
        const ranged = reach?.ranged === true
        const walkRange = reach ? reach.attack : strikeWalkRange(attacker)
        const newPos =
            ranged || !target
                ? attacker.position
                : (findApproachCell(
                      attacker,
                      target,
                      characters,
                      items,
                      maze,
                      walkRange,
                      blockedCellsFor(attacker.color, barriers, characters),
                  ) ?? attacker.position)
        const delayMs = travelTime(attacker, newPos)

        const forcedBy = manipulating ? activeColor : null
        setCharacters((prev) =>
            prev.map((p) =>
                p.id === attacker.id
                    ? {
                          ...p,
                          position: newPos,
                          movedThisTurn: p.movedThisTurn || (forcedBy === null && active === null),
                          usedSkillThisTurn: p.usedSkillThisTurn || active !== null,
                      }
                    : p,
            ),
        )
        if (!ranged) schedulePickup(attacker.color, newPos, delayMs)
        finishAction()

        // Sem personagem mirada não há alvo para nomear no histórico
        record(activeColor, attacker.id, target ? "toAttack" : "toBurnArea", target?.id)

        // Os dados são jogados quando o atacante termina de se aproximar
        combat.resolveAttack({
            attackerId: attacker.id,
            // Pela habilidade, o golpe sai com os dados de dano dela, quando ela os tem
            damageDice: damageOf(attacker, active?.skill ?? null),
            delayMs,
            ...(target ? { targetId: target.id } : {}),
            ...(area ? { area } : {}),
            ...(forcedBy ? { manipulatedBy: forcedBy } : {}),
        })
    }

    // Dissipar é golpear a barreira corpo a corpo: a personagem anda até a casa ao lado dela, e
    // o dado é jogado quando ela chega. Gasta a ação comum, a não ser sob manipulação.
    // Pelo movimento extra, anda o alcance sorteado e gasta a habilidade no lugar da ação.
    const dispel = () => {
        const barrier = menu?.barrierAtPos
        if (!barrier || !selectedId || !activeColor) return
        const character = characters.find((p) => p.id === selectedId)
        if (!character) return

        const viaSkill = skill.reach !== null && skill.reach.move > 0
        const walkRange = viaSkill ? skill.reach!.attack : strikeWalkRange(character)
        const blocked = blockedCellsFor(character.color, barriers, characters)
        const approach = findApproachCell(character, barrier, characters, items, maze, walkRange, blocked) ?? character.position
        const delayMs = travelTime(character, approach)

        const forcedBy = manipulating ? activeColor : null
        setCharacters((prev) =>
            prev.map((p) =>
                p.id === character.id
                    ? {
                          ...p,
                          position: approach,
                          movedThisTurn: p.movedThisTurn || (forcedBy === null && !viaSkill),
                          usedSkillThisTurn: p.usedSkillThisTurn || viaSkill,
                      }
                    : p,
            ),
        )
        finishAction()
        record(activeColor, character.id, "toDispelBarrierOf", barrier.ownerId)

        combat.resolveDispel({
            characterId: character.id,
            barrier,
            delayMs,
            ...(forcedBy ? { manipulatedBy: forcedBy } : {}),
        })
    }

    // Investida: a personagem corre em linha reta até a casa escolhida, por cima de quem estiver no
    // caminho, e cada personagem atravessada leva o dano já sorteado, no instante em que ela passa
    // por cima. Gasta a habilidade, e não a ação comum.
    const charge = (destination: CharacterPosition) => {
        const active = skill.active
        if (!active || active.damage === undefined || !activeColor) return
        const runner = characters.find((p) => p.id === active.characterId)
        if (!runner) return

        const victims = chargeVictims(runner, destination, characters, maze, barriers)
        const durationMs = chargeDurationMs(runner.position, destination)

        setCharacters((prev) =>
            prev.map((p) => (p.id === runner.id ? { ...p, position: destination, usedSkillThisTurn: true } : p)),
        )
        finishAction()
        record(activeColor, runner.id, "toCharge")

        combat.resolveCharge({
            characterId: runner.id,
            from: runner.position,
            to: destination,
            damage: active.damage,
            durationMs,
            hits: victims.map(({ character, at }) => ({ characterId: character.id, atMs: Math.round(at * durationMs) })),
        })
    }

    // Imitação: a personagem passa a usar a habilidade de outra personagem escolhida.
    // Ela continua selecionada e com uma habilidade em uso, agora a imitada.
    // Só o menu se fecha.
    const imitate = () => {
        const model = menu?.targetCharacter
        const active = skill.active
        if (!model || !active || !activeColor) return
        combat.aimAt(active.characterId, model.position)
        log.usedTo(activeColor, active.characterId, "toMimic", model.id)
        skill.imitate(model)
        closeMenu()
    }

    const useSkill = () => {
        if (!menu || !skill.active) return
        if (skill.active.skill.effect === "place") {
            combat.aimAt(skill.active.characterId, menu.position)
            placeSkill(menu.position)
            // Ao usar habilidade em uma casa, a habilidade continua em uso
            // e a personagem, selecionada: só o menu se fecha, e pode
            // voltar a abrir num próximo clique direito em outra casa.
            closeMenu()
            return
        }
        if (skill.active.skill.effect === "charge") {
            charge(menu.position)
            return
        }
        if (skill.active.skill.effect === "mimic") {
            imitate()
            return
        }
        strike(true)
    }

    return { walk, attack: () => strike(false), dispel, useSkill }
}
