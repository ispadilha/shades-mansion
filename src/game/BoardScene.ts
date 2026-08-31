import Phaser from "phaser"
import type { PieceColor, PiecePosition, PieceDefinition, SpecialItem } from "../logic/types"
import { itemKeyColor } from "../logic/types"
import type { Maze } from "../logic/maze"
import type { FireBurst } from "../logic/combat"
import { findPath } from "../logic/movement"
import { AURA_PALETTE, PIECE_PALETTE, hex, rgba, type AuraKind } from "../constants/palette"

export const STEP_MS = 280

const FIRE_BURST_MS = 900
const FLAMES_PER_CELL = 2
const FIRE_COLORS = [0xfff0a5, 0xffc043, 0xff8c1a, 0xe63b1e]

type ItemPalette = { bg: number; outline: number; text: string; stroke: string }

// Quem está em destaque no tabuleiro agora: a peça (por id) e o tipo de aura dela
export type PieceAuras = Record<string, AuraKind>

// Lado da textura do brilho, em pixels. É desenhada uma vez por tipo de aura e depois
// esticada para o tamanho pedido na paleta.
const AURA_TEXTURE_SIZE = 128

const ITEM_PALETTE: Record<PieceColor, ItemPalette> = {
    dark: { bg: 0x2a2a2a, outline: 0xeeeeee, text: "#ffffff", stroke: "#000000" },
    light: { bg: 0xeeeeee, outline: 0x222222, text: "#1a1a1a", stroke: "#ffffff" },
    gray: { bg: 0x888888, outline: 0x222222, text: "#ffffff", stroke: "#000000" },
}

export class BoardScene extends Phaser.Scene {
    private cellSize: number
    private maze: Maze
    private sprites: Map<string, Phaser.GameObjects.Container> = new Map()
    private itemSprites: Map<string, Phaser.GameObjects.Container> = new Map()
    private lastCells: Map<string, PiecePosition> = new Map()
    // Auras em cena, por peça. O desenho fica dentro do container da peça, então acompanha
    // a caminhada dela sem precisar de sincronia nenhuma.
    private auras: Map<string, { kind: AuraKind; sprite: Phaser.GameObjects.Image }> = new Map()
    // Buffer de syncs que chegam antes do Phaser terminar de inicializar a cena
    private pendingPieces: PieceDefinition[] | null = null
    private pendingItems: SpecialItem[] | null = null
    private pendingBursts: FireBurst[] = []
    private pendingAuras: PieceAuras | null = null
    private isReady = false

    constructor(cellSize: number, maze: Maze) {
        super({ key: "BoardScene" })
        this.cellSize = cellSize
        this.maze = maze
    }

    create() {
        this.isReady = true
        if (this.pendingItems) {
            this.applyItems(this.pendingItems)
            this.pendingItems = null
        }
        if (this.pendingPieces) {
            this.applyPieces(this.pendingPieces)
            this.pendingPieces = null
        }
        // Depois das peças: a aura é desenhada dentro do container de cada uma
        if (this.pendingAuras) {
            this.applyAuras(this.pendingAuras)
            this.pendingAuras = null
        }
        for (const burst of this.pendingBursts) this.spawnFireBurst(burst)
        this.pendingBursts = []
    }

    syncPieces(pieces: PieceDefinition[]) {
        if (!this.isReady) {
            this.pendingPieces = pieces
            return
        }
        this.applyPieces(pieces)
    }

    syncItems(items: SpecialItem[]) {
        if (!this.isReady) {
            this.pendingItems = items
            return
        }
        this.applyItems(items)
    }

    // Clarão de fogo do ataque em área.
    // Cada explosão é tocada uma vez só.
    // Quem chama é que controla isso (a cena só desenha).
    playFireBurst(burst: FireBurst) {
        if (!this.isReady) {
            this.pendingBursts.push(burst)
            return
        }
        this.spawnFireBurst(burst)
    }

    syncAuras(auras: PieceAuras) {
        if (!this.isReady) {
            this.pendingAuras = auras
            return
        }
        this.applyAuras(auras)
    }

    private applyItems(items: SpecialItem[]) {
        const seen = new Set<string>()

        for (const item of items) {
            seen.add(item.id)
            const { x, y } = this.cellToPixel(item.position)
            const sprite = this.itemSprites.get(item.id) ?? this.buildItem(item)
            sprite.setPosition(x, y)
            this.itemSprites.set(item.id, sprite)
        }

        // Itens que sumiram da lista (coletados) somem com fade
        for (const [id, sprite] of this.itemSprites) {
            if (seen.has(id)) continue
            this.itemSprites.delete(id)
            this.tweens.killTweensOf(sprite)
            this.tweens.add({
                targets: sprite,
                alpha: 0,
                scale: 0.4,
                duration: 220,
                onComplete: () => sprite.destroy(),
            })
        }
    }

    private applyPieces(pieces: PieceDefinition[]) {
        const seen = new Set<string>()

        for (const piece of pieces) {
            seen.add(piece.id)
            const targetPx = this.cellToPixel(piece.position)
            // Peças que já se moveram no turno ficam translúcidas para indicar isso
            const targetAlpha = piece.movedThisTurn ? 0.55 : 1

            let sprite = this.sprites.get(piece.id)
            if (!sprite) {
                sprite = this.buildPiece(piece)
                sprite.setPosition(targetPx.x, targetPx.y)
                sprite.setAlpha(targetAlpha)
                this.sprites.set(piece.id, sprite)
                this.lastCells.set(piece.id, { ...piece.position })
                continue
            }

            const last = this.lastCells.get(piece.id)
            const cellChanged = !last || last.x !== piece.position.x || last.y !== piece.position.y
            if (cellChanged) {
                // Anima passo-a-passo (uma célula por vez, contornando as paredes) para criar o efeito de caminhada
                this.tweens.killTweensOf(sprite)
                const path = findPath(last ?? piece.position, piece.position, this.maze)
                if (path.length === 0) {
                    sprite.setPosition(targetPx.x, targetPx.y)
                } else {
                    const steps = path.map((cell) => {
                        const px = this.cellToPixel(cell)
                        return { x: px.x, y: px.y, duration: STEP_MS, ease: "Linear" }
                    })
                    this.tweens.chain({ targets: sprite, tweens: steps })
                }
                this.lastCells.set(piece.id, { ...piece.position })
            }

            if (Math.abs(sprite.alpha - targetAlpha) > 0.01) {
                this.tweens.add({ targets: sprite, alpha: targetAlpha, duration: 200 })
            }
        }

        // Peças removidas (eliminadas) somem com fade
        for (const [id, sprite] of this.sprites) {
            if (seen.has(id)) continue
            this.sprites.delete(id)
            this.lastCells.delete(id)
            // O brilho é filho do container: some junto com a peça, sem tween próprio
            this.auras.delete(id)
            this.tweens.killTweensOf(sprite)
            this.tweens.add({
                targets: sprite,
                alpha: 0,
                scale: 0.4,
                duration: 280,
                onComplete: () => sprite.destroy(),
            })
        }
    }

    // Desenha o fogo do ataque em área: a brasa marcando o quadrado que queimou e, por
    // cima, chamas que sobem tremulando e apagam. É tudo tween sobre formas
    // simples — nenhuma textura para carregar, por enquanto.
    private spawnFireBurst(burst: FireBurst) {
        const cs = this.cellSize
        const center = this.cellToPixel(burst.center)
        const container = this.add.container(center.x, center.y).setDepth(10)

        let reach = 1
        for (const cell of burst.cells) {
            const ox = (cell.x - burst.center.x) * cs
            const oy = (cell.y - burst.center.y) * cs
            reach = Math.max(reach, Math.abs(cell.x - burst.center.x), Math.abs(cell.y - burst.center.y))

            const ember = this.add.rectangle(ox, oy, cs, cs, 0xff7a18, 0.34).setStrokeStyle(1, 0xffd166, 0.55)
            container.add(ember)
            this.tweens.add({ targets: ember, alpha: 0, duration: FIRE_BURST_MS, ease: "Quad.easeIn" })
        }

        // Estouro inicial: um clarão claro que abre e some depressa
        const flash = this.add.circle(0, 0, cs * 0.3, 0xfff3c4, 0.9)
        container.add(flash)
        this.tweens.add({
            targets: flash,
            scale: (2 * reach + 1) * 1.1,
            alpha: 0,
            duration: 260,
            ease: "Cubic.easeOut",
        })

        // Chamas sorteadas dentro de cada casa que queimou
        for (const cell of burst.cells) {
            const ox = (cell.x - burst.center.x) * cs
            const oy = (cell.y - burst.center.y) * cs

            for (let i = 0; i < FLAMES_PER_CELL; i++) {
                const x = ox + (Math.random() - 0.5) * cs * 0.8
                const y = oy + (Math.random() - 0.5) * cs * 0.8
                const height = cs * (0.45 + Math.random() * 0.5)
                const width = height * (0.45 + Math.random() * 0.2)
                const color = FIRE_COLORS[Math.floor(Math.random() * FIRE_COLORS.length)]

                // Chama: base larga embaixo e ponta para cima. Os pontos do triângulo
                // do Phaser são medidos a partir do canto do próprio desenho, não do centro.
                const flame = this.add.triangle(x, y, 0, height, width / 2, 0, width, height, color).setAlpha(0)
                container.add(flame)

                const delay = Math.random() * (FIRE_BURST_MS * 0.35)
                // Sobe encolhendo até apagar
                this.tweens.add({
                    targets: flame,
                    y: y - cs * 0.55,
                    scaleY: { from: 0.35, to: 1.15 },
                    alpha: { from: 0.95, to: 0 },
                    delay,
                    duration: FIRE_BURST_MS - delay,
                    ease: "Sine.easeOut",
                })
                // Tremulação: a largura vai e volta enquanto a chama vive
                this.tweens.add({
                    targets: flame,
                    scaleX: 0.6,
                    delay,
                    duration: 120 + Math.random() * 90,
                    yoyo: true,
                    repeat: -1,
                    ease: "Sine.easeInOut",
                })
            }
        }

        // As chamas tremulam em loop até aqui: matar os tweens antes de destruir evita
        // que eles continuem mexendo em objetos que já saíram da cena.
        this.time.delayedCall(FIRE_BURST_MS + 120, () => {
            this.tweens.killTweensOf(container.list)
            container.destroy()
        })
    }

    private applyAuras(auras: PieceAuras) {
        // Sai quem perdeu o destaque (ou trocou de tipo de aura)
        for (const [pieceId, current] of this.auras) {
            if (auras[pieceId] === current.kind) continue
            this.auras.delete(pieceId)
            this.tweens.killTweensOf(current.sprite)
            this.tweens.add({
                targets: current.sprite,
                alpha: 0,
                duration: 200,
                onComplete: () => current.sprite.destroy(),
            })
        }

        // Entra quem ganhou
        for (const [pieceId, kind] of Object.entries(auras)) {
            if (this.auras.get(pieceId)?.kind === kind) continue
            const container = this.sprites.get(pieceId)
            if (!container) continue

            const sprite = this.buildAura(kind)
            // Na primeira posição do container: o brilho fica atrás do desenho da peça
            container.addAt(sprite, 0)
            this.auras.set(pieceId, { kind, sprite })
        }
    }

    // O brilho em si: um disco que se dissolve até a borda, pulsando devagar
    private buildAura(kind: AuraKind): Phaser.GameObjects.Image {
        const { strength, radius, pulseMs } = AURA_PALETTE[kind]
        const scale = (radius * 2 * this.cellSize) / AURA_TEXTURE_SIZE

        const sprite = this.add.image(0, 0, this.auraTexture(kind)).setScale(scale).setAlpha(strength * 0.5)
        this.tweens.add({
            targets: sprite,
            alpha: strength,
            scale: scale * 1.08,
            duration: pulseMs / 2,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        })

        return sprite
    }

    // Textura do brilho, uma por tipo de aura (a cor já vai pintada nela, o que dispensa
    // tingir o sprite e sai igual em qualquer renderizador)
    private auraTexture(kind: AuraKind): string {
        const { color } = AURA_PALETTE[kind]
        // A cor entra na chave: mexer na paleta gera uma textura nova em vez de reaproveitar
        // a antiga, que já está pintada
        const key = `aura-${kind}-${color}`
        if (this.textures.exists(key)) return key

        const texture = this.textures.createCanvas(key, AURA_TEXTURE_SIZE, AURA_TEXTURE_SIZE)
        if (!texture) return key

        const half = AURA_TEXTURE_SIZE / 2
        const context = texture.getContext()
        const gradient = context.createRadialGradient(half, half, 0, half, half, half)
        // Mais forte na altura da peça e sumindo para fora: vira um halo, não um disco chapado
        gradient.addColorStop(0, rgba(color, 0.45))
        gradient.addColorStop(0.45, rgba(color, 0.75))
        gradient.addColorStop(0.75, rgba(color, 0.3))
        gradient.addColorStop(1, rgba(color, 0))
        context.fillStyle = gradient
        context.fillRect(0, 0, AURA_TEXTURE_SIZE, AURA_TEXTURE_SIZE)
        texture.refresh()

        return key
    }

    private cellToPixel(cell: PiecePosition): PiecePosition {
        return {
            x: cell.x * this.cellSize + this.cellSize / 2,
            y: cell.y * this.cellSize + this.cellSize / 2,
        }
    }

    private buildPiece(piece: PieceDefinition): Phaser.GameObjects.Container {
        const cs = this.cellSize
        const palette = PIECE_PALETTE[piece.color]
        const clothing = hex(palette.clothing)
        const outline = hex(palette.outline)
        const skin = hex(palette.skin)

        const container = this.add.container(0, 0)
        const shadow = this.add.ellipse(0, cs * 0.3, cs * 0.42, cs * 0.1, 0x000000, 0.45)

        const legY = cs * 0.2
        const leftLeg = this.add.rectangle(-cs * 0.07, legY, cs * 0.09, cs * 0.14, clothing).setStrokeStyle(1, outline)
        const rightLeg = this.add.rectangle(cs * 0.07, legY, cs * 0.09, cs * 0.14, clothing).setStrokeStyle(1, outline)

        const armY = cs * 0.03
        const leftArm = this.add.rectangle(-cs * 0.2, armY, cs * 0.08, cs * 0.22, clothing).setStrokeStyle(1, outline)
        const rightArm = this.add.rectangle(cs * 0.2, armY, cs * 0.08, cs * 0.22, clothing).setStrokeStyle(1, outline)

        const body = this.add.rectangle(0, 0, cs * 0.3, cs * 0.3, clothing).setStrokeStyle(1.5, outline)

        const headY = -cs * 0.22
        const head = this.add.circle(0, headY, cs * 0.13, skin).setStrokeStyle(1.5, outline)

        const eyeR = Math.max(1, cs * 0.014)
        const eyeY = headY - cs * 0.01
        const leftEye = this.add.circle(-cs * 0.04, eyeY, eyeR, 0x111111)
        const rightEye = this.add.circle(cs * 0.04, eyeY, eyeR, 0x111111)

        const letter = this.add
            .text(0, 0, piece.type, {
                fontFamily: "Arial Black",
                fontSize: `${Math.max(10, Math.floor(cs * 0.18))}px`,
                color: palette.letter,
                stroke: palette.letterStroke,
                strokeThickness: 2,
            })
            .setOrigin(0.5, 0.5)

        container.add([shadow, leftLeg, rightLeg, leftArm, rightArm, body, head, leftEye, rightEye, letter])
        return container
    }

    private buildItem(item: SpecialItem): Phaser.GameObjects.Container {
        const cs = this.cellSize
        const colors = ITEM_PALETTE[itemKeyColor(item.key)]

        const container = this.add.container(0, 0)
        const ring = this.add.circle(0, 0, cs * 0.22, 0x000000, 0.25)
        const circle = this.add.circle(0, 0, cs * 0.18, colors.bg).setStrokeStyle(2, colors.outline)
        const letter = this.add
            .text(0, 0, item.key[1], {
                fontFamily: "Arial Black",
                fontSize: `${Math.max(10, Math.floor(cs * 0.18))}px`,
                color: colors.text,
                stroke: colors.stroke,
                strokeThickness: 2,
            })
            .setOrigin(0.5, 0.5)

        container.add([ring, circle, letter])
        return container
    }
}
