import type { Barrier, MotivationItem, PieceColor, PieceDefinition, PiecePosition, TextKey } from "./types"
import type { Maze } from "./maze"
import type { ActiveSkill, SkillReach } from "./skills"
import { NO_BLOCKED_CELLS, atPosition, blockedCellsFor, includesPosition, positionKey } from "./grid"
import { canHitTarget, strikeWalkRange, type Strike } from "./movement"

// As ações que uma casa oferece quando o jogador clica nela com o botão direito.
export type BoardAction = "pieceInfo" | "itemInfo" | "barrierInfo" | "move" | "collect" | "attack" | "skill"

const INFO_ACTIONS: Record<BoardAction, boolean> = {
    pieceInfo: true,
    itemInfo: true,
    barrierInfo: true,
    move: false,
    collect: false,
    attack: false,
    skill: false,
}

export const isInfoAction = (action: BoardAction) => INFO_ACTIONS[action]

// O menu aberto: onde o jogador clicou, o que havia lá e o que aquilo permite fazer
export interface BoardMenuState {
    mouseX: number
    mouseY: number
    position: PiecePosition
    targetPiece?: PieceDefinition
    itemAtPos?: MotivationItem
    barrierAtPos?: Barrier
    actions: BoardAction[]
    // Como a ação da habilidade se chama nesta casa ("atirar", "incendiar"):
    // cada habilidade traz o próprio rótulo
    skillAction?: TextKey
}

// Tudo o que decide o menu, no instante do clique. Só leitura: quem monta a lista não
// mexe na partida, e por isso esta decisão pode ser conferida sozinha, sem tela.
export interface BoardMenuContext {
    position: PiecePosition
    pieces: PieceDefinition[]
    items: MotivationItem[]
    barriers: Barrier[]
    maze: Maze
    selectedId: string | null
    activePieceId: string | null
    // Null fora dos turnos que o jogador comanda: o menu ainda abre, mas só pra informações.
    activeColor: PieceColor | null
    // Peça sob manipulação, quando há uma. Ela age fora da vez dela, comandada por outro time.
    manipulatedPieceId: string | null
    activeSkill: ActiveSkill | null
    skillReach: SkillReach | null
    // As casas que o tabuleiro está destacando para a peça selecionada
    moveCells: PiecePosition[]
    attackCells: PiecePosition[]
    skillCells: PiecePosition[]
}

// O que a casa clicada oferece. Vazio quer dizer que o menu nem abre.
export function boardActionsFor(context: BoardMenuContext): BoardAction[] {
    const {
        position,
        pieces,
        items,
        barriers,
        maze,
        selectedId,
        activePieceId,
        activeColor,
        manipulatedPieceId,
        activeSkill,
        skillReach,
        moveCells,
        attackCells,
        skillCells,
    } = context

    const targetPiece = atPosition(pieces, position)
    const itemHere = atPosition(items, position)
    const barrierHere = atPosition(barriers, position)
    const selectedPiece = pieces.find((p) => p.id === selectedId) ?? null

    // Quem age é a peça da vez.
    // Durante a manipulação, a peça-alvo é tratada como "própria".
    const manipulating = manipulatedPieceId !== null
    const ownSelection =
        activeColor !== null &&
        selectedPiece !== null &&
        (manipulating ? selectedPiece.id === manipulatedPieceId : selectedPiece.id === activePieceId)

    // A ação comum é uma só por turno.
    // Ser manipulada é anormal, fora do turno da peça, e não consulta o que ela já gastou.
    const hasBasicAction = ownSelection && (manipulating || !selectedPiece!.movedThisTurn)

    // Com habilidade em uso a peça só pode mirar e olhar: andar ou golpear por fora
    // gastaria a ação comum e jogaria a habilidade fora.
    const usingSkill = activeSkill !== null

    // Habilidade que dá movimento devolve à peça as opções de sempre:
    // andar, coletar e golpear. Só que com o alcance sorteado no lugar do comum.
    const canWalk = usingSkill ? ownSelection && skillReach!.move > 0 : hasBasicAction
    const inMoveRange = includesPosition(moveCells, position)

    // Alvo legítimo: peça inimiga, ou qualquer uma durante manipulação
    const hitsPiece =
        targetPiece !== undefined &&
        selectedPiece !== null &&
        targetPiece.id !== selectedPiece.id &&
        (manipulating || targetPiece.color !== selectedPiece.color)

    const blocked =
        selectedPiece === null ? NO_BLOCKED_CELLS : blockedCellsFor(selectedPiece.color, barriers, pieces)

    const actions: BoardAction[] = []

    if (targetPiece && (selectedId === null || usingSkill) && !manipulating) actions.push("pieceInfo")
    if (selectedId === null && !targetPiece && itemHere && !manipulating) actions.push("itemInfo")
    if ((selectedId === null || usingSkill) && barrierHere && !manipulating) actions.push("barrierInfo")
    if (canWalk && !targetPiece && inMoveRange) actions.push(itemHere ? "collect" : "move")

    if (!usingSkill && hasBasicAction && hitsPiece) {
        const strike: Strike = { ranged: false, range: strikeWalkRange(selectedPiece!), blocked }
        if (canHitTarget(selectedPiece!, targetPiece!, pieces, maze, strike)) actions.push("attack")
    }

    if (usingSkill && ownSelection) {
        if (skillReach!.places) {
            // Habilidade que cria algo: vale onde ela alcança, e lá já é casa livre
            if (includesPosition(skillCells, position)) actions.push("skill")
        } else {
            const strike: Strike = skillReach!.ranged
                ? { ranged: true, range: skillReach!.attack, sight: { barriers, blockedBy: skillReach!.blockedBy } }
                : { ranged: false, range: skillReach!.attack, blocked }
            const reachesPiece = hitsPiece && canHitTarget(selectedPiece!, targetPiece!, pieces, maze, strike)
            // Só habilidade de área pode mirar no chão (mas não em barreira adversária)
            const burnsGround =
                !targetPiece &&
                activeSkill.skill.area &&
                includesPosition(attackCells, position) &&
                !blocked.has(positionKey(position))
            if (reachesPiece || burnsGround) actions.push("skill")
        }
    }

    return actions
}
