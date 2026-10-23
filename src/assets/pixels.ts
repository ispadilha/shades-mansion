import { mix, rgba } from "../constants/palette"

// Desenho em pixel feito em código, para o que não vem pronto em arte: os algarismos, a estrela
// de promoção, os brilhos e as formas dos dados e da moeda. Tudo sai numa grade com a cor de
// cada pixel, que o React e o Phaser desenham sem suavização nenhuma.

// A cor de cada pixel, linha por linha, e null onde não há nada
export type PixelGrid = (string | null)[][]

// Quais pixels de uma grade pertencem a uma área
export type PixelMask = boolean[][]

// Um degradê dado por pontos: a opacidade em cada distância do centro, de 0 a 1 (a borda)
export type FadeStops = ReadonlyArray<readonly [number, number]>

// Uma figura desenhada à mão: "#" é pixel aceso, "." é vazio
type Glyph = readonly string[]

// Os algarismos, de 5 por 7
const DIGITS: Record<string, Glyph> = {
    "0": [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
    "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
    "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
    "3": [".###.", "#...#", "....#", "..##.", "....#", "#...#", ".###."],
    "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
    "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
    "6": ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".###."],
    "7": ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
    "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
    "9": [".###.", "#...#", "#...#", ".####", "....#", "...#.", ".##.."],
}

// A estrela de promoção, de 5 por 5
const STAR: Glyph = ["..#..", "..#..", "#####", ".###.", ".#.#."]

export const emptyGrid = (side: number): PixelGrid =>
    Array.from({ length: side }, () => Array<string | null>(side).fill(null))

// A figura pintada com uma cor e contornada por outra: o contorno é um pixel em volta de tudo o
// que está aceso, também nas diagonais
const outlined = (glyph: Glyph, fill: string, outline: string): PixelGrid => {
    const lit = (x: number, y: number) => glyph[y - 1]?.[x - 1] === "#"
    return Array.from({ length: glyph.length + 2 }, (_, y) =>
        Array.from({ length: glyph[0].length + 2 }, (_, x) => {
            if (lit(x, y)) return fill
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) if (lit(x + dx, y + dy)) return outline
            }
            return null
        }),
    )
}

// Um número em pixels, com um pixel de espaço entre os algarismos
export const numberGrid = (value: number, fill: string, outline: string): PixelGrid => {
    const digits = [...String(value)].map((digit) => DIGITS[digit])
    const glyph = digits[0].map((_, row) => digits.map((digit) => digit[row]).join("."))
    return outlined(glyph, fill, outline)
}

export const starGrid = (fill: string, outline: string): PixelGrid => outlined(STAR, fill, outline)

// A opacidade que um degradê dá para a distância d, em degraus: arredondada para uma de `bands`
// faixas, como os brilhos da pixel art
export const steppedFade = (stops: FadeStops, bands: number) => {
    const step = Math.max(...stops.map(([, alpha]) => alpha)) / bands
    return (d: number) => {
        const next = stops.findIndex(([at]) => at >= d)
        if (next < 0) return 0
        const [toAt, toAlpha] = stops[next]
        const [fromAt, fromAlpha] = next > 0 ? stops[next - 1] : stops[next]
        const alpha = toAt > fromAt ? fromAlpha + ((toAlpha - fromAlpha) * (d - fromAt)) / (toAt - fromAt) : toAlpha
        return Math.round(alpha / step) * step
    }
}

// Um brilho redondo e translúcido, num quadrado de `side` pixels. Os do meio contam como se
// estivessem a um pixel do centro: mais perto, cairiam sozinhos numa faixa que não aparece em
// volta deles, e o brilho ficaria com um ponto no meio.
export const glowGrid = (side: number, color: string, stops: FadeStops, bands: number): PixelGrid => {
    const fade = steppedFade(stops, bands)
    const half = side / 2
    return Array.from({ length: side }, (_, y) =>
        Array.from({ length: side }, (_, x) => {
            const alpha = fade(Math.max(1, Math.hypot(x + 0.5 - half, y + 0.5 - half)) / half)
            return alpha > 0 ? rgba(color, alpha) : null
        }),
    )
}

// As formas vêm de desenhos feitos num quadrado de `units` lados (os pontos no formato do SVG,
// "x,y x,y ..."). Um pixel da grade pertence à forma quando o centro dele cai dentro dela.
const maskOf = (side: number, units: number, inside: (x: number, y: number) => boolean): PixelMask => {
    const unit = units / side
    return Array.from({ length: side }, (_, y) =>
        Array.from({ length: side }, (_, x) => inside((x + 0.5) * unit, (y + 0.5) * unit)),
    )
}

// Folga para comparar números quebrados, que nunca dão exatamente zero
const EPSILON = 1e-9

export const polygonMask = (points: string, side: number, units: number): PixelMask => {
    const corners = points.split(" ").map((point) => point.split(",").map(Number))
    const edges = corners.map((corner, i) => [corners.at(i - 1)!, corner])
    // Um centro bem em cima da borda conta como dentro. A conta do raio, logo abaixo, põe esse
    // pixel dentro de um lado da forma e fora do outro, e uma forma simétrica sairia torta.
    const onEdge = (x: number, y: number) =>
        edges.some(
            ([[ax, ay], [bx, by]]) =>
                Math.abs((bx - ax) * (y - ay) - (by - ay) * (x - ax)) < EPSILON &&
                x >= Math.min(ax, bx) &&
                x <= Math.max(ax, bx) &&
                y >= Math.min(ay, by) &&
                y <= Math.max(ay, by),
        )
    // Um raio para a direita cruza a borda do polígono um número ímpar de vezes quando sai de dentro
    const crosses = (x: number, y: number) => ([[ax, ay], [bx, by]]: number[][]) =>
        ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax
    return maskOf(side, units, (x, y) => onEdge(x, y) || edges.filter(crosses(x, y)).length % 2 === 1)
}

export const circleMask = (cx: number, cy: number, radius: number, side: number, units: number): PixelMask =>
    maskOf(side, units, (x, y) => Math.hypot(x - cx, y - cy) <= radius)

// A borda de uma área: os pixels dela que encostam, por um dos quatro lados, em algum de fora
export const borderOf = (mask: PixelMask): PixelMask =>
    mask.map((row, y) =>
        row.map((on, x) => on && [mask[y - 1]?.[x], mask[y + 1]?.[x], row[x - 1], row[x + 1]].some((next) => !next)),
    )

export const paint = (grid: PixelGrid, mask: PixelMask, color: string) => {
    mask.forEach((row, y) =>
        row.forEach((on, x) => {
            if (on) grid[y][x] = color
        }),
    )
}

// Um brilho redondo por cima do que a área já tem: cada pixel recebe a cor com a opacidade que
// o degradê dá para a distância até o centro, misturada à cor de baixo. Como no brilho
// translúcido, os pixels do meio contam como se estivessem a um pixel do centro.
export const paintGlow = (
    grid: PixelGrid,
    area: PixelMask,
    glow: { x: number; y: number; radius: number },
    units: number,
    color: string,
    stops: FadeStops,
    bands: number,
) => {
    const fade = steppedFade(stops, bands)
    const unit = units / grid.length
    grid.forEach((row, y) =>
        row.forEach((base, x) => {
            if (!area[y][x] || !base) return
            const distance = Math.max(unit, Math.hypot((x + 0.5) * unit - glow.x, (y + 0.5) * unit - glow.y))
            const alpha = fade(distance / glow.radius)
            if (alpha > 0) row[x] = mix(base, color, alpha)
        }),
    )
}

// Uma imagem por cima da outra, com o canto de cima à esquerda em (left, top)
export const stamp = (grid: PixelGrid, image: PixelGrid, left: number, top: number) => {
    image.forEach((row, y) =>
        row.forEach((color, x) => {
            if (color && grid[top + y]?.[left + x] !== undefined) grid[top + y][left + x] = color
        }),
    )
}
