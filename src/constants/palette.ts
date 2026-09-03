import type { AuraKind, PieceColor } from "../logic/types"

// Todas as cores do jogo ficam neste arquivo.
// Nenhum código de cor é escrito solto pelo resto do projeto.
// A única exceção é o fundo da página em `src/index.css`, que o CSS carrega antes do React
// e acompanha `UI_PALETTE.screenBg`.

export interface PiecePalette {
    clothing: string
    outline: string
    skin: string
    letter: string
    letterStroke: string
}

export const PIECE_PALETTE: Record<PieceColor, PiecePalette> = {
    light: { clothing: "#f2f2f2", outline: "#2a2a2a", skin: "#f0c8a0", letter: "#1a1a1a", letterStroke: "#ffffff" },
    dark: { clothing: "#1a1a1a", outline: "#dedede", skin: "#f0c8a0", letter: "#ffffff", letterStroke: "#000000" },
    gray: { clothing: "#7a7a7a", outline: "#2a2a2a", skin: "#b8a890", letter: "#ffffff", letterStroke: "#000000" },
}

export const PIECE_DETAIL_PALETTE = {
    shadow: "#000000",
    eyes: "#111111",
}

export const TEAM_BUTTON_PALETTE: Record<PieceColor, { bg: string; text: string }> = {
    light: { bg: "#dddddd", text: "#000000" },
    gray: { bg: "#888888", text: "#000000" },
    dark: { bg: "#111111", text: "#ffffff" },
}

export interface AuraPalette {
    color: string
    strength: number
    radius: number
    pulseMs: number
}

export const AURA_PALETTE: Record<AuraKind, AuraPalette> = {
    active: { color: "#ffd700", strength: 0.55, radius: 0.62, pulseMs: 1200 },
    manipulated: { color: "#e53935", strength: 0.7, radius: 0.68, pulseMs: 700 },
}

// As casas destacadas quando uma peça está selecionada.
export interface RangePalette {
    move: string
    attack: string
    both: string
}

export const RANGE_PALETTE: RangePalette = {
    move: "#d6b52b",
    attack: "#b3352c",
    both: "#dd7a1c",
}

export const BOARD_PALETTE = {
    floorLight: "#4b2f26",
    floorDark: "#3b241c",
    wall: "#000000",
    cellBorder: "rgba(0,0,0,0.2)",
    selected: "#ffd700",
}

export const VIGOR_PALETTE = {
    track: "#141014",
    outline: "#000000",
    high: "#4caf50",
    medium: "#d9a13a",
    low: "#e04a3c",
}

// O incêndio do dano em área: as chamas sorteiam uma das cores da lista.
export const FIRE_PALETTE = {
    flames: ["#fff0a5", "#ffc043", "#ff8c1a", "#e63b1e"],
    ember: "#ff7a18",
    emberEdge: "#ffd166",
    flash: "#fff3c4",
}

export const ITEM_PALETTE: Record<PieceColor, { bg: string; outline: string; text: string; textStroke: string }> = {
    dark: { bg: "#2a2a2a", outline: "#eeeeee", text: "#ffffff", textStroke: "#000000" },
    light: { bg: "#eeeeee", outline: "#222222", text: "#1a1a1a", textStroke: "#ffffff" },
    gray: { bg: "#888888", outline: "#222222", text: "#ffffff", textStroke: "#000000" },
}

// Superfícies que o MUI desenha por conta própria: papel dos modais e dos menus de
// contexto. O tema escuro em `Providers.tsx` nasce daqui, então qualquer componente que
// não traga cor própria acompanha o resto do jogo em vez de cair no tema claro padrão.
export const SURFACE_PALETTE = {
    bg: "#17131f",
    border: "#4a3f5e",
    text: "#e6dff5",
    textMuted: "#8f85a8",
    // Realce da linha sob o cursor
    hover: "rgba(255, 255, 255, 0.08)",
    // Botões e ações dentro dessas superfícies
    accent: "#cfc2ec",
}

export const UI_PALETTE = {
    screenBg: "#000000",
    text: "#ffffff",
    textBody: "#cccccc",
    textMuted: "#777777",
    textDim: "#888888",
    textFaint: "#666666",
    // Subtítulos e legendas
    accentMuted: "#8f85a8",
    buttonBg: "#222222",
    // Botões de escolha que não são de um time (todos os times, assistir, entrar na mansão)
    buttonAltBg: "#2a2a3a",
    buttonDisabledText: "#555555",
    languageEn: { bg: "#000011", text: "#ffaaaa" },
    languagePt: { bg: "#001100", text: "#ffffaa" },
}

export const HUD_PALETTE = {
    bandBg: "#222222",
    bandBorder: "#333333",
    outline: "#555555",
    text: "#ffffff",
    logText: "#bbbbbb",
    manipulationBg: "#3a2a10",
    manipulationText: "#ffd27a",
    manipulationOutline: "#777777",
    statusReady: "#4caf50",
    statusWaiting: "#f44336",
    statusIdle: "#aaaaaa",
    endTurnBg: "#444444",
    endTurnBusyBg: "#666666",
    endTurnDisabledText: "#999999",
}

export const ROLL_PALETTE = {
    backdrop: "rgba(0,0,0,0.6)",
    bg: "#17131f",
    border: "#4a3f5e",
    title: "#cfc2ec",
    subtitle: "#8f85a8",
    result: "#ffe9a8",
    good: "#7fd18a",
    bad: "#e07a7a",
    neutral: "#e8d9a8",
}

export const DIE_PALETTE = {
    face: "#2f2438",
    faceEdge: "#c9b06a",
    inner: "#453758",
    innerEdge: "#8d7ab0",
    value: "#ffe9a8",
    valueStroke: "#2a1f36",
}

export const COIN_PALETTE = {
    rim: "#8a6a1e",
    heads: "#e8c265",
    tails: "#c9a44c",
    edge: "#5c460f",
    face: "#5c460f",
    eyes: "#e8c265",
    crown: "#4a3a12",
}

export const INITIATIVE_PALETTE = {
    rank: "#8f85a8",
    pieceId: "#bbbbbb",
    value: "#ffe9a8",
    valuePending: "#544c66",
    idleId: "#777777",
}

// Phaser trabalha com cores numéricas (0xrrggbb)
export const hex = (css: string): number => parseInt(css.slice(1), 16)

export const rgba = (css: string, alpha: number): string => {
    const value = hex(css)
    return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`
}
