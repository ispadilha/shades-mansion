import type { MotivationItem, PieceColor, PieceDefinition, PiecePosition, TextKey } from "./types"
import type { Maze } from "./maze"
import type { ActiveSkill, SkillReach } from "./skills"
import { atPosition, includesPosition } from "./grid"
import { canHitTarget, strikeWalkRange } from "./movement"

// As ações que uma casa oferece quando o jogador clica nela com o botão direito.
export type BoardAction = "info" | "itemInfo" | "move" | "collect" | "attack" | "skill"

// O menu aberto: onde o jogador clicou, o que havia lá e o que aquilo permite fazer
export interface BoardMenuState {
    mouseX: number
    mouseY: number
    position: PiecePosition
    targetPiece?: PieceDefinition
    itemAtPos?: MotivationItem
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
    maze: Maze
    selectedId: string | null
    activePieceId: string | null
    // Null fora dos turnos que o jogador comanda: o menu ainda abre, mas só pra informações.
    activeColor: PieceColor | null
    // Peça sob manipulação, quando há uma. Ela age fora da vez dela, comandada por outro time.
    manipulatedPieceId: string | null
    activeSkill: ActiveSkill | null
    skillReach: SkillReach | null
    // As casas que o tabuleiro já está destacando para a peça selecionada
    moveCells: PiecePosition[]
    attackCells: PiecePosition[]
}

// O que a casa clicada oferece. Vazio quer dizer que o menu nem abre.
export function boardActionsFor(context: BoardMenuContext): BoardAction[] {
    const {
        position,
        pieces,
        items,
        maze,
        selectedId,
        activePieceId,
        activeColor,
        manipulatedPieceId,
        activeSkill,
        skillReach,
        moveCells,
        attackCells,
    } = context

    const targetPiece = atPosition(pieces, position)
    const itemHere = atPosition(items, position)
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

    const actions: BoardAction[] = []

    if (targetPiece && (!selectedId || usingSkill) && !manipulating) actions.push("info")
    if (!selectedId && !targetPiece && itemHere && !manipulating) actions.push("itemInfo")
    if (canWalk && !targetPiece && inMoveRange) actions.push(itemHere ? "collect" : "move")

    if (!usingSkill && hasBasicAction && hitsPiece) {
        const reach = { ranged: false, range: strikeWalkRange(selectedPiece!) }
        if (canHitTarget(selectedPiece!, targetPiece!, pieces, maze, reach)) actions.push("attack")
    }

    if (usingSkill && ownSelection) {
        const reach = { ranged: skillReach!.ranged, range: skillReach!.attack }
        const reachesPiece = hitsPiece && canHitTarget(selectedPiece!, targetPiece!, pieces, maze, reach)
        // Sem peça mirada, só habilidade de área tem o que fazer
        const burnsGround = !targetPiece && activeSkill.skill.area && includesPosition(attackCells, position)
        if (reachesPiece || burnsGround) actions.push("skill")
    }

    return actions
}
