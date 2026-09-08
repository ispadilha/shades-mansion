import type { AuraKind, ColorMode, PieceColor } from "../logic/types"

// Todas as cores do jogo ficam neste arquivo.
// Nenhum código de cor é escrito solto pelo resto do projeto.
//
// Elas se dividem em duas famílias:
//
// - Cores de identidade (a primeira metade): os times, o fogo, os itens, o vigor. Elas
//   são o jogo em si e valem igual nos três modos de cor — inclusive porque quem desenha
//   a maioria delas é o Phaser, que pinta em textura e não acompanha o React. São
//   constantes de módulo: quem precisa, importa direto.
//
// - Cores de superfície (a segunda metade): fundo, texto, borda, botão, o chão do
//   labirinto. Existem três versões de cada uma, uma por modo, e quem as consome pede
//   pelo hook `usePalette()`, que devolve a paleta do modo em vigor.
//
// A única cor fora daqui é o fundo da página em `src/index.css`, que o CSS precisa
// conhecer antes de o React montar. Lá os três fundos aparecem de novo, em variáveis CSS.

// ---------------------------------------------------------------------------
// Identidade: as cores que não mudam de modo
// ---------------------------------------------------------------------------

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

// O contorno acompanha o do desenho da peça: é a mesma linha que separa o time do fundo
export const TEAM_BUTTON_PALETTE: Record<PieceColor, { bg: string; text: string; outline: string }> = {
    light: { bg: "#dddddd", text: "#000000", outline: "#2a2a2a" },
    gray: { bg: "#888888", text: "#000000", outline: "#2a2a2a" },
    dark: { bg: "#111111", text: "#ffffff", outline: "#dedede" },
}

// A cor da manipulação é a mesma nos três modos: é estado de jogo, e o brilho sobre a
// peça manipulada é desenhado pelo Phaser. A faixa do HUD acompanha o modo (mais abaixo),
// mas nasce deste mesmo rosa.
const MANIPULATION_GLOW = "#c2185b"

export interface AuraPalette {
    color: string
    strength: number
    radius: number
    pulseMs: number
}

export const AURA_PALETTE: Record<AuraKind, AuraPalette> = {
    active: { color: "#ffd700", strength: 0.55, radius: 0.62, pulseMs: 1200 },
    manipulated: { color: MANIPULATION_GLOW, strength: 0.7, radius: 0.68, pulseMs: 700 },
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

// ---------------------------------------------------------------------------
// Superfície: as cores que mudam com o modo
// ---------------------------------------------------------------------------

// O modo escuro é a paleta de referência: o tipo `Palette` sai dele, então os outros dois
// modos são obrigados pelo compilador a trazer exatamente os mesmos nomes. Trocar de modo
// troca valores, nunca a lista de cores — é isso que faz um tema ser dado, e não código.
const dark = {
    // O fundo das telas, os textos soltos e os botões de menu
    ui: {
        screenBg: "#000000",
        text: "#ffffff",
        textBody: "#cccccc",
        textMuted: "#777777",
        textDim: "#888888",
        textFaint: "#666666",
        // Subtítulos e legendas
        accentMuted: "#8f85a8",
        buttonBg: "#222222",
        // O contorno de todo botão que não seja de um time.
        // Sai do tema do MUI, então vale para os botões do jogo inteiro.
        buttonOutline: "#77778a",
        // Botões de escolha que não são de um time
        buttonAltBg: "#2a2a3a",
        buttonDisabledText: "#555555",
        languageEn: { bg: "#000011", text: "#ffaaaa" },
        languagePt: { bg: "#001100", text: "#ffffaa" },
    },

    // Superfícies que o MUI desenha por conta própria: papel dos modais e dos menus de
    // contexto. O tema em `Providers.tsx` nasce daqui, então qualquer componente que não
    // traga cor própria acompanha o resto do jogo.
    surface: {
        bg: "#17131f",
        border: "#4a3f5e",
        text: "#e6dff5",
        textMuted: "#8f85a8",
        // Realce da linha sob o cursor
        hover: "rgba(255, 255, 255, 0.08)",
        // Botões e ações dentro dessas superfícies
        accent: "#cfc2ec",
    },

    hud: {
        bandBg: "#222222",
        bandBorder: "#333333",
        outline: "#555555",
        text: "#ffffff",
        logText: "#bbbbbb",
        statusReady: "#4caf50",
        statusWaiting: "#f44336",
        statusIdle: "#aaaaaa",
        endTurnBg: "#444444",
        endTurnBusyBg: "#666666",
        endTurnDisabledText: "#999999",
    },

    // O chão do labirinto, desenhado em React casa a casa (o Phaser só entra por cima)
    board: {
        floorLight: "#4b2f26",
        floorDark: "#3b241c",
        wall: "#000000",
        cellBorder: "rgba(0,0,0,0.2)",
        selected: "#ffd700",
    },

    // As casas destacadas quando uma peça está selecionada. Os três precisam se distinguir
    // entre si em cima do chão do modo, senão o destaque deixa de informar.
    range: {
        move: "#d6b52b",
        attack: "#b3352c",
        both: "#dd7a1c",
    },

    manipulation: {
        glow: MANIPULATION_GLOW,
        bandBg: "#2e0f1d",
        bandText: "#f06292",
        bandOutline: "#8c2751",
    },

    roll: {
        backdrop: "rgba(0,0,0,0.6)",
        bg: "#17131f",
        border: "#4a3f5e",
        title: "#cfc2ec",
        subtitle: "#8f85a8",
        target: "#c6bbe0",
        result: "#ffe9a8",
        good: "#7fd18a",
        bad: "#e07a7a",
        neutral: "#e8d9a8",
    },

    die: {
        face: "#2f2438",
        faceEdge: "#c9b06a",
        inner: "#453758",
        innerEdge: "#8d7ab0",
        value: "#ffe9a8",
        valueStroke: "#2a1f36",
    },

    coin: {
        rim: "#8a6a1e",
        heads: "#e8c265",
        tails: "#c9a44c",
        edge: "#5c460f",
        face: "#5c460f",
        eyes: "#e8c265",
        crown: "#4a3a12",
    },

    initiative: {
        rank: "#8f85a8",
        pieceId: "#bbbbbb",
        value: "#ffe9a8",
        valuePending: "#544c66",
        idleId: "#777777",
    },
}

export type Palette = typeof dark

// Modo claro: "A mansão de dia"
const light: Palette = {
    ui: {
        screenBg: "#a89a7e",
        text: "#0c0907",
        textBody: "#19130e",
        textMuted: "#281f15",
        textDim: "#2f2419",
        textFaint: "#3e2f21",
        accentMuted: "#36251b",
        buttonBg: "#948567",
        buttonOutline: "#402b1f",
        buttonAltBg: "#a58673",
        buttonDisabledText: "#5f5747",
        languageEn: { bg: "#94a2b8", text: "#4e1212" },
        languagePt: { bg: "#a3ab8a", text: "#322408" },
    },

    surface: {
        bg: "#b8a69c",
        border: "#7a5844",
        text: "#271a13",
        textMuted: "#3a281d",
        hover: "rgba(0, 0, 0, 0.1)",
        accent: "#483123",
    },

    hud: {
        bandBg: "#b3a68a",
        bandBorder: "#8a7b60",
        outline: "#74664e",
        text: "#1c160f",
        logText: "#36291d",
        statusReady: "#16451a",
        statusWaiting: "#7d1616",
        statusIdle: "#3b2e20",
        endTurnBg: "#948567",
        endTurnBusyBg: "#82734f",
        endTurnDisabledText: "#544c3c",
    },

    board: {
        floorLight: "#9a8058",
        floorDark: "#866c47",
        wall: "#2e2016",
        cellBorder: "rgba(0,0,0,0.25)",
        selected: "#6d4404",
    },

    range: {
        move: "#cba32a",
        attack: "#9c3129",
        both: "#b86c18",
    },

    manipulation: {
        glow: MANIPULATION_GLOW,
        bandBg: "#c19aa8",
        bandText: "#4a1028",
        bandOutline: "#8f4265",
    },

    roll: {
        backdrop: "rgba(0,0,0,0.55)",
        bg: "#b8a69c",
        border: "#7a5844",
        title: "#483123",
        subtitle: "#513728",
        target: "#1f150f",
        result: "#4d3608",
        good: "#16451a",
        bad: "#761313",
        neutral: "#3a2f16",
    },

    die: {
        face: "#ab9c94",
        faceEdge: "#5e4a12",
        inner: "#958378",
        innerEdge: "#573b2b",
        value: "#241803",
        valueStroke: "#cbbeb7",
    },

    coin: {
        rim: "#6f5819",
        heads: "#c0a45a",
        tails: "#a8853c",
        edge: "#4c3a0d",
        face: "#4c3a0d",
        eyes: "#d0bb84",
        crown: "#3d2f0f",
    },

    initiative: {
        rank: "#34231a",
        pieceId: "#281f15",
        value: "#4d3608",
        valuePending: "#5f534c",
        idleId: "#473626",
    },
}

// Modo cinza: "A mansão com névoa"
const gray: Palette = {
    ui: {
        screenBg: "#232832",
        text: "#eff1f5",
        textBody: "#cad1dd",
        textMuted: "#93a0b6",
        textDim: "#a2afc4",
        textFaint: "#8795ac",
        accentMuted: "#9bb0d4",
        buttonBg: "#363f4d",
        buttonOutline: "#859dc6",
        buttonAltBg: "#334a71",
        buttonDisabledText: "#687386",
        languageEn: { bg: "#202943", text: "#ffb3b3" },
        languagePt: { bg: "#2c3329", text: "#d8e8a4" },
    },

    surface: {
        bg: "#233045",
        border: "#3f5884",
        text: "#e5ebf4",
        textMuted: "#8ea4ca",
        hover: "rgba(255, 255, 255, 0.08)",
        accent: "#bfcce3",
    },

    hud: {
        bandBg: "#2a3341",
        bandBorder: "#3e495d",
        outline: "#67748a",
        text: "#eff1f5",
        logText: "#b2bcce",
        statusReady: "#4caf50",
        statusWaiting: "#f44336",
        statusIdle: "#99a7be",
        endTurnBg: "#434e62",
        endTurnBusyBg: "#5f6c82",
        endTurnDisabledText: "#8d99ae",
    },

    board: {
        floorLight: "#4a4a4e",
        floorDark: "#3b3b3f",
        wall: "#101012",
        cellBorder: "rgba(0,0,0,0.25)",
        selected: "#ffd700",
    },

    range: {
        move: "#d6b52b",
        attack: "#b3352c",
        both: "#dd7a1c",
    },

    manipulation: {
        glow: MANIPULATION_GLOW,
        bandBg: "#33202a",
        bandText: "#f06292",
        bandOutline: "#8c2751",
    },

    roll: {
        backdrop: "rgba(0,0,0,0.6)",
        bg: "#233045",
        border: "#3f5884",
        title: "#bfcce3",
        subtitle: "#8ea4ca",
        target: "#d0daeb",
        result: "#ffe9a8",
        good: "#7fd18a",
        bad: "#e48585",
        neutral: "#e8d9a8",
    },

    die: {
        face: "#243450",
        faceEdge: "#c9b06a",
        inner: "#31486f",
        innerEdge: "#87a0cc",
        value: "#ffe9a8",
        valueStroke: "#1c273b",
    },

    coin: {
        rim: "#8a6a1e",
        heads: "#e8c265",
        tails: "#c9a44c",
        edge: "#5c460f",
        face: "#5c460f",
        eyes: "#e8c265",
        crown: "#4a3a12",
    },

    initiative: {
        rank: "#8ea4ca",
        pieceId: "#bcc5d4",
        value: "#ffe9a8",
        valuePending: "#4b5e7f",
        idleId: "#8795ac",
    },
}

export const PALETTES: Record<ColorMode, Palette> = { light, gray, dark }

// Phaser trabalha com cores numéricas (0xrrggbb)
export const hex = (css: string): number => parseInt(css.slice(1), 16)

export const rgba = (css: string, alpha: number): string => {
    const value = hex(css)
    return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`
}
