import type { CharacterKey, Facing } from "../logic/types"

// As artes do jogo, achadas pelo nome do arquivo: cada uma começa com a chave da personagem
// ("gF_alien_48_sheet.png"), e é por essa chave que o código pede a arte certa.
const byKey = (files: Record<string, string>) =>
    Object.fromEntries(
        Object.entries(files).map(([path, url]) => [path.slice(path.lastIndexOf("/") + 1).split("_")[0], url]),
    ) as Record<CharacterKey, string>

// Cada personagem num spritesheet, com um quadro para cada direção
export const CHARACTER_SHEETS = byKey(
    import.meta.glob<string>("./characters/*_sheet.png", { eager: true, import: "default" }),
)

// O retrato pequeno, para o HUD e a iniciativa
export const CHARACTER_ICONS = byKey(import.meta.glob<string>("./icons/*_icon.png", { eager: true, import: "default" }))

// O item que motiva cada personagem
export const ITEM_ARTS = byKey(import.meta.glob<string>("./items/*_item.png", { eager: true, import: "default" }))

// O tamanho das artes, em pixels, como foram desenhadas
export const CHARACTER_ART_SIZE = 48
export const ICON_ART_SIZE = 16
export const ITEM_ART_SIZE = 24

// Os dados e a moeda não vêm em arquivo: são desenhados em pixels, em código, numa grade deste lado
export const ROLL_ART_SIZE = 32

// A ordem dos quadros no spritesheet
export const FACING_FRAMES: Record<Facing, number> = { down: 0, left: 1, right: 2, up: 3 }
