import type { PieceColor, PieceType } from "../logic/types"
import type { CoinFace, DieSides } from "../logic/rolls"

// Todas as regras e todos os tempos do jogo ficam neste arquivo.
// Nenhum número de regra (alcance, dano, tamanho, ritmo) é escrito solto pelo resto do
// projeto. É o mesmo que `palette.ts` faz com as cores.
// A medida que não entra aqui é a de layout — a largura de um modal, a altura de uma
// faixa do HUD: ela pertence ao componente que a desenha, e não ao jogo.

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

export const MAX_HP = 3

export interface PieceStats {
    moveRange: number
    attackRange: number
    attackDamage: number
    ranged?: boolean
    areaAttack?: boolean
}

export const PIECE_STATS: Record<PieceType, PieceStats> = {
    A: { moveRange: 9, attackRange: 7, attackDamage: 1 },
    B: { moveRange: 7, attackRange: 5, attackDamage: 2 },
    C: { moveRange: 5, attackRange: 3, attackDamage: 3 },
    D: { moveRange: 5, attackRange: 7, attackDamage: 2, ranged: true },
    E: { moveRange: 7, attackRange: 5, attackDamage: 2 },
    F: { moveRange: 5, attackRange: 5, attackDamage: 2, ranged: true, areaAttack: true },
}

export const isRanged = (type: PieceType) => PIECE_STATS[type].ranged === true

export const isAreaAttack = (type: PieceType) => PIECE_STATS[type].areaAttack === true

// ---------------------------------------------------------------------------
// Combate
// ---------------------------------------------------------------------------

// Lado do quadrado que o ataque em área incendeia. Ímpar para o alvo ficar no centro.
export const FIRE_AREA_SIDE = 3

// A face que faz uma moeda dar certo
export const SUCCESS_FACE: CoinFace = "heads"

// ---------------------------------------------------------------------------
// Iniciativa
// ---------------------------------------------------------------------------

export const INITIATIVE_DIE: DieSides = 20
export const INITIATIVE_DICE = 2

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

// Folga somada à caminhada antes de resolver o que vem depois dela (a moeda do ataque,
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

// ---------------------------------------------------------------------------
// Animações do tabuleiro (Phaser)
// ---------------------------------------------------------------------------

export const FIRE_BURST_MS = 900
export const FLAMES_PER_CELL = 2

// Lado da textura do brilho da aura, em pixels. É desenhada uma vez por tipo de aura e
// depois esticada para o tamanho pedido na paleta.
export const AURA_TEXTURE_SIZE = 128

// Peça que já agiu na rodada fica translúcida
export const MOVED_PIECE_ALPHA = 0.55

// Saídas de cena: peça eliminada, item coletado, e a troca de transparência das peças
export const PIECE_FADE_MS = 280
export const ITEM_FADE_MS = 220
export const ALPHA_TWEEN_MS = 200
