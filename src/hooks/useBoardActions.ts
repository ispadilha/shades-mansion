import type { Dispatch, SetStateAction } from "react"
import type { MotivationItemKey, PieceColor, PieceDefinition, PiecePosition, TextKey } from "../logic/types"
import type { Maze } from "../logic/maze"
import type { BoardMenuState } from "../logic/boardMenu"
import { attackArea } from "../logic/combat"
import { findApproachCell, pathLength, strikeWalkRange } from "../logic/movement"
import { damageOf } from "../logic/skills"
import type { SkillFlow } from "./useSkillFlow"
import type { CombatResolution } from "./useCombatResolution"
import type { GameLog } from "./useGameLog"
import { ACTION_SETTLE_MS, STEP_MS } from "../constants/rules"

interface BoardActionsOptions {
    pieces: PieceDefinition[]
    setPieces: Dispatch<SetStateAction<PieceDefinition[]>>
    maze: Maze
    // Cor de quem comanda a jogada. Null quando não é a vez do jogador.
    activeColor: PieceColor | null
    selectedId: string | null
    setSelectedId: (id: string | null) => void
    skill: SkillFlow
    // A casa em que o jogador clicou com o botão direito
    menu: BoardMenuState | null
    closeMenu: () => void
    // Há manipulação em curso? A ação então é anormal e não gasta a vez da peça.
    manipulating: boolean
    endManipulation: () => void
    // Segura a câmera na peça manipulada enquanto ela ainda caminha até o destino
    holdFocus: (delayMs: number) => void
    schedulePickup: (color: PieceColor, position: PiecePosition, delayMs: number) => void
    // Andar para uma casa com item é coletar: o histórico diz uma coisa ou outra
    moveActionFor: (position: PiecePosition) => { actionKey: TextKey; target?: string }
    combat: CombatResolution
    log: GameLog
}

export interface BoardActions {
    // Andar até a casa escolhida. Se houver item nela, a peça o coleta ao chegar.
    walk: () => void
    // Atacar a casa escolhida, com a habilidade em uso ou com o ataque comum
    attack: (viaSkill: boolean) => void
}

// O que o menu de contexto executa: os dois caminhos pelos quais uma peça age no tabuleiro.
// Os dois terminam igual: a peça sai de seleção, a habilidade sai de uso,
// o menu fecha, e o histórico registra quem fez o quê.
export const useBoardActions = ({
    pieces,
    setPieces,
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
}: BoardActionsOptions): BoardActions => {
    // Quanto a peça demora para chegar lá, andando casa a casa
    const travelTime = (from: PiecePosition, to: PiecePosition) =>
        pathLength(from, to, maze) * STEP_MS + ACTION_SETTLE_MS

    const finishAction = () => {
        setSelectedId(null)
        skill.clear()
        closeMenu()
    }

    const walk = () => {
        const destination = menu?.position
        if (!destination || !selectedId || !activeColor) return
        const piece = pieces.find((p) => p.id === selectedId)
        if (!piece) return

        // Com uma habilidade de movimento extra em uso, o passo sai da habilidade
        const viaSkill = skill.reach !== null && skill.reach.move > 0
        const delayMs = travelTime(piece.position, destination)
        const { actionKey, target } = moveActionFor(destination)

        // Ação forçada por manipulação não gasta a ação que a peça tem no próprio turno
        const spendsAction = !manipulating && !viaSkill
        setPieces((prev) =>
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
        schedulePickup(piece.color, destination, delayMs)
        finishAction()

        if (manipulating) {
            log.manipulatedTo(activeColor, piece.id, actionKey, target)
            endManipulation()
            // A peça manipulada ainda vai caminhar até o destino: a câmera vai com ela
            holdFocus(delayMs)
        } else {
            log.usedTo(activeColor, piece.id, actionKey, target)
        }
    }

    const attack = (viaSkill: boolean) => {
        if (!selectedId || !menu || !activeColor) return
        const attacker = pieces.find((p) => p.id === selectedId)
        if (!attacker) return

        const active = viaSkill ? skill.active : null
        const reach = viaSkill ? skill.reach : null

        // O ataque cai em uma casa, que pode ou não ter uma peça em cima.
        // Mirar o chão é só para habilidade que atinge área.
        const target = menu.targetPiece
        const area = active?.skill.area ? attackArea(attacker, target?.position ?? menu.position) : undefined
        if (!target && !area) return

        // Habilidade de alcance acerta de onde a peça está. Para golpe comum, se aproxima antes.
        const ranged = reach?.ranged === true
        const walkRange = reach ? reach.attack : strikeWalkRange(attacker)
        const newPos =
            ranged || !target
                ? attacker.position
                : (findApproachCell(attacker, target, pieces, maze, walkRange) ?? attacker.position)
        const delayMs = travelTime(attacker.position, newPos)

        const forcedBy = manipulating ? activeColor : null
        setPieces((prev) =>
            prev.map((p) =>
                p.id === attacker.id
                    ? {
                          ...p,
                          position: newPos,
                          movedThisTurn: p.movedThisTurn || (!forcedBy && !active),
                          usedSkillThisTurn: p.usedSkillThisTurn || active !== null,
                      }
                    : p,
            ),
        )
        if (!ranged) schedulePickup(attacker.color, newPos, delayMs)
        finishAction()

        // Sem peça mirada não há alvo para nomear no histórico
        const actionKey: TextKey = target ? "toAttack" : "toBurnArea"
        if (forcedBy) {
            log.manipulatedTo(activeColor, attacker.id, actionKey, target?.id)
            endManipulation()
        } else {
            log.usedTo(activeColor, attacker.id, actionKey, target?.id)
        }

        // Os dados são jogados quando o atacante termina de se aproximar
        combat.resolveAttack({
            attackerId: attacker.id,
            // Habilidade tem mais força que o golpe comum da mesma peça
            damageDice: damageOf(attacker, active?.skill ?? null),
            delayMs,
            ...(target ? { targetId: target.id } : {}),
            ...(area ? { area } : {}),
            ...(forcedBy ? { consumedItemKey: attacker.id as MotivationItemKey, consumerColor: forcedBy } : {}),
        })
    }

    return { walk, attack }
}
