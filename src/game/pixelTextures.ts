import Phaser from "phaser"
import type { AuraKind } from "../logic/types"
import { AURA_PALETTE, levelStarColors } from "../constants/palette"
import { BOARD_ART_SCALE, GLOW_BANDS } from "../constants/rules"
import { glowGrid, starGrid, numberGrid, type PixelGrid } from "../assets/pixels"

// As texturas da cena que não vêm de arquivo: desenhadas em pixel, em código, e guardadas no
// gerenciador de texturas do Phaser pela chave. Cada uma nasce uma vez só.

// O halo da aura: mais forte na altura da personagem e sumindo para fora, um anel e não um disco chapado
const AURA_FADE = [
    [0, 0.45],
    [0.45, 0.75],
    [0.75, 0.3],
    [1, 0],
] as const

// As texturas das artes que vêm de arquivo, pela chave da personagem
export const characterTexture = (key: string) => `character-${key}`
export const itemTexture = (key: string) => `item-${key}`

// Uma imagem em pixels vira textura uma vez só, com um pixel da textura para cada pixel dela.
// A cor entra na chave de quem chama: mexer na paleta gera uma textura nova em vez de
// reaproveitar a antiga, que já está pintada.
export const pixelTexture = (scene: Phaser.Scene, key: string, draw: () => PixelGrid): string => {
    if (scene.textures.exists(key)) return key
    const grid = draw()
    const texture = scene.textures.createCanvas(key, grid[0].length, grid.length)
    if (!texture) return key

    const context = texture.getContext()
    grid.forEach((row, y) =>
        row.forEach((color, x) => {
            if (!color) return
            context.fillStyle = color
            context.fillRect(x, y, 1, 1)
        }),
    )
    texture.refresh()
    return key
}

// Textura do brilho, uma por tipo de aura (a cor já vai pintada nela, o que dispensa
// tingir o sprite e sai igual em qualquer renderizador). A aura tem pixels do tamanho dos da
// arte, então a textura tem um pixel para cada um deles.
export const auraTexture = (scene: Phaser.Scene, kind: AuraKind, cellSize: number): string => {
    const { color, radius } = AURA_PALETTE[kind]
    const side = Math.round((radius * 2 * cellSize) / BOARD_ART_SCALE.character)
    return pixelTexture(scene, `aura-${kind}-${color}-${side}`, () => glowGrid(side, color, AURA_FADE, GLOW_BANDS))
}

// A estrela de promoção, na cor do nível
export const starTexture = (scene: Phaser.Scene, level: number): string => {
    const { fill, outline } = levelStarColors(level)
    return pixelTexture(scene, `star-${fill}-${outline}`, () => starGrid(fill, outline))
}

// Um número em algarismos de pixel, nas cores dadas
export const numberTexture = (scene: Phaser.Scene, value: number, fill: string, stroke: string): string =>
    pixelTexture(scene, `number-${value}-${fill}-${stroke}`, () => numberGrid(value, fill, stroke))
