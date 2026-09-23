import type { PieceColor, PieceType, SkillId } from "../logic/types"
import type { CoinFace, DiceSpec, DieSides } from "../logic/rolls"

// As definições de constantes do jogo ficam todas neste arquivo:
// Regras, tempos, medidas da interface, etc.

// ---------------------------------------------------------------------------
// Tabuleiro
// ---------------------------------------------------------------------------

// Lado de cada casa, em pixels. É a medida que o tabuleiro em React e a cena do Phaser
// compartilham para desenhar por cima da mesma grade.
export const CELL_SIZE = 64

export const DEFAULT_BOARD_SIZE = 30
export const BOARD_SIZE_RANGE = { min: 20, max: 40 }

// ---------------------------------------------------------------------------
// Labirinto
// ---------------------------------------------------------------------------

export const DEFAULT_MIN_ROOM_SIZE = 3
export const DEFAULT_MAX_ROOM_SIZE = 6
export const ROOM_SIZE_RANGE = { min: 2, max: 10 }

// Tentativas de encaixar salas novas, por casa do tabuleiro. Como cada tentativa sorteia
// uma posição/tamanho e descarta os que colidem, o número só regula quão denso fica o
// preenchimento — e escala com a área para que tabuleiros grandes não saiam vazios.
export const ROOM_PLACEMENT_ATTEMPTS_PER_CELL = 1

// Uma primeira sala mal posicionada pode bloquear todas as outras em tabuleiros
// apertados, então a geração desenha alguns traçados independentes e fica com o melhor.
export const LAYOUT_CANDIDATES = 4

// Fração de corredores extras (além dos da árvore geradora mínima) para criar
// caminhos alternativos e evitar um labirinto puramente em árvore.
export const EXTRA_CORRIDOR_RATIO = 0.3

// ---------------------------------------------------------------------------
// Times
// ---------------------------------------------------------------------------

// Ordem em que os times entram na fila da tela de iniciativa
export const LINEUP_COLORS: PieceColor[] = ["light", "gray", "dark"]

// Ordem em que os times ocupam suas linhas no tabuleiro. Importa em um caso só: quando
// duas peças disputam a mesma casa livre, quem vem antes fica com ela.
export const PLACEMENT_COLORS: PieceColor[] = ["dark", "gray", "light"]

// ---------------------------------------------------------------------------
// Peças
// ---------------------------------------------------------------------------

// d20 não alcança
export const NO_DODGE = 21

export interface PieceStats {
    moveRange: number
    attackRange: number
    maxVigor: number
    damage: DiceSpec
    // Esquiva total
    dodge: number
    // Aparo (dano parcial)
    guard: number
}

export const STRIKE_REACH_BONUS = 1

export const PIECE_STATS: Record<PieceType, Omit<PieceStats, "attackRange">> = {
    // "Ágil"
    A: { moveRange: 9, maxVigor: 9, damage: { count: 1, sides: 4 }, dodge: 12, guard: 7 },
    // "Barreira"
    B: { moveRange: 7, maxVigor: 12, damage: { count: 1, sides: 6 }, dodge: NO_DODGE, guard: 12 },
    // "Campeã"
    C: { moveRange: 5, maxVigor: 16, damage: { count: 2, sides: 8 }, dodge: NO_DODGE, guard: 14 },
    // "Distância"
    D: { moveRange: 5, maxVigor: 10, damage: { count: 1, sides: 6 }, dodge: 18, guard: 14 },
    // "Exótica"
    E: { moveRange: 7, maxVigor: 13, damage: { count: 1, sides: 8 }, dodge: 20, guard: 13 },
    // "Fogo"
    F: { moveRange: 5, maxVigor: 11, damage: { count: 1, sides: 6 }, dodge: NO_DODGE, guard: 13 },
}

export const canDodge = (type: PieceType) => PIECE_STATS[type].dodge <= 20

// ---------------------------------------------------------------------------
// Promoções
// ---------------------------------------------------------------------------

export const MAX_LEVEL = 3

// A escada dos dados de dano: cada promoção sobe um degrau
const DAMAGE_LADDER: DieSides[] = [4, 6, 8, 10, 12, 20]

// O que cada nível acima do primeiro acrescenta.
// A esquiva fica de fora:
// quem é pesado demais para desviar não aprende a desviar.
export const LEVEL_BONUS = { maxVigor: 3, moveRange: 1, guard: -1, damageSteps: 1 }

// Sobe o dado de dano alguns "degraus na escada".
// Uma escada só, para as duas coisas que fortalecem um ataque:
// Subir de nível, e usar uma habilidade.
// (Depende da habilidade. Aliás em geral, depende de quem chama.)
export const climbDamageLadder = (damage: DiceSpec, steps: number): DiceSpec => {
    if (steps <= 0) return damage
    const rung = Math.min(DAMAGE_LADDER.indexOf(damage.sides) + steps, DAMAGE_LADDER.length - 1)
    return { ...damage, sides: DAMAGE_LADDER[rung] }
}

// Os atributos de uma peça no nível em que ela está
export const statsFor = (type: PieceType, level: number): PieceStats => {
    const base = PIECE_STATS[type]
    const steps = Math.max(0, level - 1)
    const moveRange = base.moveRange + steps * LEVEL_BONUS.moveRange

    return {
        ...base,
        maxVigor: base.maxVigor + steps * LEVEL_BONUS.maxVigor,
        moveRange,
        attackRange: moveRange + STRIKE_REACH_BONUS,
        guard: base.guard + steps * LEVEL_BONUS.guard,
        damage: climbDamageLadder(base.damage, steps * LEVEL_BONUS.damageSteps),
    }
}

// ---------------------------------------------------------------------------
// Habilidades
// ---------------------------------------------------------------------------

export interface SkillLevelTable {
    // Ao não se declarar alcance, é usado o padrão de ataque comum mais `rangeBonus`
    range?: readonly number[]
    // Quantos usos a habilidade sustenta ao mesmo tempo, em um turno
    charges?: readonly number[]
}

export const SKILL_LEVELS: Partial<Record<SkillId, SkillLevelTable>> = {
    barrier: {
        range: [5, 8, 11],
        charges: [3, 5, 7],
    },
}

// ---------------------------------------------------------------------------
// Combate
// ---------------------------------------------------------------------------

// Lado do quadrado que o ataque em área incendeia. Ímpar para o alvo ficar no centro.
export const FIRE_AREA_SIDE = 3

export const SUCCESS_FACE: CoinFace = "heads"

export const DEFENSE_DIE: DieSides = 20

// ---------------------------------------------------------------------------
// Iniciativa
// ---------------------------------------------------------------------------

export const INITIATIVE_DIE: DieSides = 20
export const INITIATIVE_DICE = 2

// Quantas somas diferentes os dados da iniciativa conseguem produzir. É o teto de peças
// que cabem em uma ordem sem empate, e é por ele que o sorteio sabe quando desistir.
export const DISTINCT_INITIATIVE_TOTALS = INITIATIVE_DICE * INITIATIVE_DIE - INITIATIVE_DICE + 1

// ---------------------------------------------------------------------------
// Itens
// ---------------------------------------------------------------------------

// Cópias de cada item espalhadas pelo labirinto
export const ITEM_COPIES = 2

// ---------------------------------------------------------------------------
// Ritmo da partida
// ---------------------------------------------------------------------------

// Tempo que uma peça leva para andar uma casa
export const STEP_MS = 280

// Folga somada à caminhada antes de resolver o que vem depois dela (os dados do golpe,
// a coleta do item): a ação só acontece com a peça já parada no lugar.
export const ACTION_SETTLE_MS = 50

// Intervalo entre as decisões da IA
export const AI_STEP_MS = 1000

// Espera antes de a IA passar a vez depois de já ter agido
export const AI_END_TURN_MS = 600

// Entradas guardadas no histórico de jogadas
export const MAX_LOG_ENTRIES = 100

// Explosões de fogo guardadas no estado (só para a cena não reanimar as antigas)
export const MAX_FIRE_BURSTS = 8

// Quanto tempo a câmera fica presa no item que caiu de volta no tabuleiro
export const ITEM_DROP_HOLD_MS = 1000

// Tempo para a câmera ir até a peça que vai usar habilidade, antes de abrir o modal
export const SKILL_MODAL_DELAY_MS = 500

// Tempo para a barra de dica aparecer
export const IDLE_HINT_MS = 5000

// Tempo para a barra de dica deslizar
export const HUD_BANNER_SLIDE_MS = 500

// Quanto a partida espera a animação de um golpe antes de seguir
export const ATTACK_EFFECT_HOLD_MS = 1000

// Rolagem da câmera quando o cursor encosta na borda da viewport
export const EDGE_SCROLL = { edgeSize: 80, maxSpeed: 20 }

// ---------------------------------------------------------------------------
// Encenação das rolagens
// ---------------------------------------------------------------------------

// Quanto tempo os dados giram e quanto tempo o resultado fica na tela
export const ROLL_SPIN_MS = 550
export const ROLL_HOLD_MS = 800

// Tempo entre as "faces falsas" mostradas enquanto o dado ainda está girando
export const ROLL_SHUFFLE_MS = 90

// Defasagem entre os giros de dados vizinhos: eles caem juntos, mas não idênticos
export const DIE_SPIN_OFFSET_MS = 140

// A fila de iniciativa é longa: as rolagens dela correm mais depressa que as da partida,
// e as recusadas passam mais rápido ainda porque só existem para mostrar a repetição.
export const INITIATIVE_ROLL_TIMING = {
    accepted: { spinMs: 320, holdMs: 360 },
    rejected: { spinMs: 190, holdMs: 250 },
}

// Apagar e acender da tela de iniciativa quando ela troca as rolagens pela ordem sorteada
export const INITIATIVE_FADE_MS = 1000

// Um ataque tem a rolagem do dano e uma de defesa por peça atingida. Elas correm mais
// rápido que as da iniciativa porque acontecem o tempo todo.
export const ATTACK_ROLL_TIMING = { spinMs: 460, holdMs: 620 }
export const DODGE_ROLL_TIMING = { spinMs: 380, holdMs: 700 }

// ---------------------------------------------------------------------------
// Animações do tabuleiro (Phaser)
// ---------------------------------------------------------------------------

export const BARRIER_PULSE_MS = 2600
export const BARRIER_GLOW = { height: 0.22, slices: 4 }
export const BARRIER_GLOW_ALPHA = { dim: 0.3, bright: 0.52 }
export const BARRIER_FLOOR_ALPHA = { dim: 0.5, bright: 0.78 }
export const BARRIER_EDGE_WIDTH = 3

export const FIRE_BURST_MS = 900
export const FLAMES_PER_CELL = 2

// Lado da textura do brilho da aura, em pixels. É desenhada uma vez por tipo de aura e
// depois esticada para o tamanho pedido na paleta.
export const AURA_TEXTURE_SIZE = 128

// Peça que já agiu na rodada fica translúcida
export const MOVED_PIECE_ALPHA = 0.55

// A queda do item que volta ao tabuleiro: de onde ele cai, e em quanto tempo
export const ITEM_DROP_MS = 1000
export const ITEM_DROP_HEIGHT = 1.6

// Saídas de cena: peça eliminada, item coletado, e a troca de transparência das peças
export const PIECE_FADE_MS = 280
export const ITEM_FADE_MS = 220
export const ALPHA_TWEEN_MS = 200

// ---------------------------------------------------------------------------
// Medidas da interface
// ---------------------------------------------------------------------------

// O HUD é feito de faixas horizontais de mesma altura e mesma cor
export const HUD_BAND_HEIGHT = 76
export const HUD_TURN_ORDER_WIDTH = "75%"

// As faixas temporárias que deslizam por trás do HUD (manipulação, habilidade, dica)
export const HUD_BANNER_HEIGHT = 40

// Medidas que existem para a tela não pular. Texto que alterna entre vazio e preenchido
// (o número da ordem, o resultado de uma rolagem) reserva a própria altura desde o começo,
// com a altura de linha declarada junto da reservada para as duas baterem: sem isso a
// medida ficaria por conta do padrão do tema (1,5 × o tamanho da fonte) e a caixa cresceria
// alguns pixels sempre que o texto entrasse, sacudindo tudo em volta a cada fase.
export const INITIATIVE_PANEL_MIN_HEIGHT = 260
export const LINEUP_RANK_LINE = { fontSize: 12, lineHeight: "18px", minHeight: "18px" }
export const ROLL_RESULT_LINE = { fontSize: 22, lineHeight: "32px", minHeight: "32px" }
export const ROLL_READING_LINE = { fontSize: 16, lineHeight: "24px", minHeight: "24px" }

// O brilho difuso atrás do número do d4, no quadrado de 64 do desenho do dado
export const DIE_GLOW = { x: 32, y: 35, radius: 26 }

// A barra de vigor sob a peça, em frações da casa
export const VIGOR_BAR = { width: 0.56, height: 0.1, offsetY: 0.42, inset: 1 }
