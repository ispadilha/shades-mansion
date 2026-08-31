import type { PieceColor } from "../logic/types"

export interface PiecePalette {
    clothing: string
    outline: string
    skin: string
    letter: string
    letterStroke: string
}

// Cores das peças em um lugar só: o tabuleiro (Phaser) e os desenhos em SVG das telas
// de iniciativa/HUD leem daqui, para que a mesma peça tenha sempre a mesma aparência.
export const PIECE_PALETTE: Record<PieceColor, PiecePalette> = {
    light: { clothing: "#f2f2f2", outline: "#2a2a2a", skin: "#f0c8a0", letter: "#1a1a1a", letterStroke: "#ffffff" },
    dark: { clothing: "#1a1a1a", outline: "#dedede", skin: "#f0c8a0", letter: "#ffffff", letterStroke: "#000000" },
    gray: { clothing: "#7a7a7a", outline: "#2a2a2a", skin: "#b8a890", letter: "#ffffff", letterStroke: "#000000" },
}

// Aura vale ao mesmo tempo para o tabuleiro e para o HUD.
export type AuraKind = "active" | "manipulated"

export interface AuraPalette {
    color: string
    strength: number
    radius: number
    pulseMs: number
}

export const AURA_PALETTE: Record<AuraKind, AuraPalette> = {
    // Peça da vez
    active: { color: "#ffd700", strength: 0.55, radius: 0.62, pulseMs: 1200 },
    // Peça sob manipulação
    manipulated: { color: "#e53935", strength: 0.7, radius: 0.68, pulseMs: 700 },
}

// Phaser trabalha com cores numéricas (0xrrggbb)
export const hex = (css: string): number => parseInt(css.slice(1), 16)

export const rgba = (css: string, alpha: number): string => {
    const value = hex(css)
    return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`
}
