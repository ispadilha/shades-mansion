import type { Dispatch, SetStateAction } from "react"
import type { PieceColor, PieceDefinition, PiecePosition, TextKey } from "../logic/types"
import type { Barrier, MotivationItem } from "../logic/types"
import type { Maze } from "../logic/maze"
import type { BoardMenuState } from "../logic/boardMenu"
import { attackArea } from "../logic/combat"
import { findApproachCell, pathLength, strikeWalkRange } from "../logic/movement"
import { blockedCellsFor } from "../logic/grid"
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
    // Barreiras acesas: elas fecham caminho para os times rivais
    barriers: Barrier[]
    // Itens no chão: a casa de um não serve para parar e golpear a partir dela
    items: MotivationItem[]

    // O que a habilidade em uso faz quando cria algo numa casa
    placeSkill: (position: PiecePosition) => void
}

export interface BoardActions {
    // Andar até a casa escolhida. Se houver item nela, a peça o coleta ao chegar.
    walk: () => void
    // Atacar a casa escolhida com o ataque comum
    attack: () => void
    // Tentar dissipar a barreira da casa escolhida, de uma casa ao lado dela
    dispel: () => void
    // Acionar a habilidade em uso na casa escolhida
    useSkill: () => void
}

// O que o menu de contexto executa: os caminhos pelos quais uma peça age no tabuleiro.
// Terminam da mesma forma: a peça sai de seleção, a habilidade sai de uso,
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
    barriers,
    items,
    placeSkill,
}: BoardActionsOptions): BoardActions => {
    // Quanto a peça demora para chegar lá,
    // andando casa a casa e contornando o que estiver fechado para o time dela
    const travelTime = (piece: PieceDefinition, to: PiecePosition) =>
        pathLength(piece.position, to, maze, blockedCellsFor(piece.color, barriers, pieces)) * STEP_MS + ACTION_SETTLE_MS

    const finishAction = () => {
        setSelectedId(null)
        skill.clear()
        closeMenu()
    }

    // Ação forçada por uma manipulação sai no histórico em nome de quem manipulou,
    // e encerra a manipulação
    const record = (color: PieceColor, pieceId: string, actionKey: TextKey, target?: string) => {
        if (!manipulating) {
            log.usedTo(color, pieceId, actionKey, target)
            return
        }
        log.manipulatedTo(color, pieceId, actionKey, target)
        endManipulation()
    }

    const walk = () => {
        const destination = menu?.position
        if (!destination || !selectedId || !activeColor) return
        const piece = pieces.find((p) => p.id === selectedId)
        if (!piece) return

        // Com uma habilidade de movimento extra em uso, o passo sai da habilidade
        const viaSkill = skill.reach !== null && skill.reach.move > 0
        const delayMs = travelTime(piece, destination)
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
        record(activeColor, piece.id, actionKey, target)
        // A peça manipulada ainda vai caminhar até o destino: a câmera vai com ela
        if (manipulating) holdFocus(delayMs)
    }

    const strike = (viaSkill: boolean) => {
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
                : (findApproachCell(
                      attacker,
                      target,
                      pieces,
                      items,
                      maze,
                      walkRange,
                      blockedCellsFor(attacker.color, barriers, pieces),
                  ) ?? attacker.position)
        const delayMs = travelTime(attacker, newPos)

        const forcedBy = manipulating ? activeColor : null
        setPieces((prev) =>
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

        // Sem peça mirada não há alvo para nomear no histórico
        record(activeColor, attacker.id, target ? "toAttack" : "toBurnArea", target?.id)

        // Os dados são jogados quando o atacante termina de se aproximar
        combat.resolveAttack({
            attackerId: attacker.id,
            // Habilidade tem mais força que o golpe comum da mesma peça
            damageDice: damageOf(attacker, active?.skill ?? null),
            delayMs,
            ...(target ? { targetId: target.id } : {}),
            ...(area ? { area } : {}),
            ...(forcedBy ? { manipulatedBy: forcedBy } : {}),
        })
    }

    // Dissipar é golpear a barreira corpo a corpo: a peça anda até a casa ao lado dela, e
    // o dado é jogado quando ela chega. Gasta a ação comum, a não ser sob manipulação.
    // Pelo movimento extra, anda o alcance sorteado e gasta a habilidade no lugar da ação.
    const dispel = () => {
        const barrier = menu?.barrierAtPos
        if (!barrier || !selectedId || !activeColor) return
        const piece = pieces.find((p) => p.id === selectedId)
        if (!piece) return

        const viaSkill = skill.reach !== null && skill.reach.move > 0
        const walkRange = viaSkill ? skill.reach!.attack : strikeWalkRange(piece)
        const blocked = blockedCellsFor(piece.color, barriers, pieces)
        const approach = findApproachCell(piece, barrier, pieces, items, maze, walkRange, blocked) ?? piece.position
        const delayMs = travelTime(piece, approach)

        const forcedBy = manipulating ? activeColor : null
        setPieces((prev) =>
            prev.map((p) =>
                p.id === piece.id
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
        record(activeColor, piece.id, "toDispelBarrierOf", barrier.ownerId)

        combat.resolveDispel({
            pieceId: piece.id,
            barrier,
            delayMs,
            ...(forcedBy ? { manipulatedBy: forcedBy } : {}),
        })
    }

    const useSkill = () => {
        if (!menu || !skill.active) return
        if (skill.active.skill.effect === "place") {
            placeSkill(menu.position)
            // Ao usar habilidade em uma casa, a habilidade continua em uso
            // e a peça, selecionada: só o menu se fecha, e pode
            // voltar a abrir num próximo clique direito em outra casa.
            closeMenu()
            return
        }
        strike(true)
    }

    return { walk, attack: () => strike(false), dispel, useSkill }
}
