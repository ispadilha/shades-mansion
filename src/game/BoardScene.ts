import Phaser from "phaser"
import type { PieceColor, PiecePosition, PieceDefinition, SpecialItem } from "../logic/types"
import { itemKeyColor } from "../logic/types"

export const STEP_MS = 280

type Palette = { clothing: number; outline: number; skin: number }

const PIECE_PALETTE: Record<PieceColor, Palette> = {
    light: { clothing: 0xf2f2f2, outline: 0x2a2a2a, skin: 0xf0c8a0 },
    dark: { clothing: 0x1a1a1a, outline: 0xdedede, skin: 0xf0c8a0 },
    gray: { clothing: 0x7a7a7a, outline: 0x2a2a2a, skin: 0xb8a890 },
}

type ItemPalette = { bg: number; outline: number; text: string; stroke: string }

const ITEM_PALETTE: Record<PieceColor, ItemPalette> = {
    dark: { bg: 0x2a2a2a, outline: 0xeeeeee, text: "#ffffff", stroke: "#000000" },
    light: { bg: 0xeeeeee, outline: 0x222222, text: "#1a1a1a", stroke: "#ffffff" },
    gray: { bg: 0x888888, outline: 0x222222, text: "#ffffff", stroke: "#000000" },
}

export class BoardScene extends Phaser.Scene {
    private cellSize: number
    private sprites: Map<string, Phaser.GameObjects.Container> = new Map()
    private itemSprites: Map<string, Phaser.GameObjects.Container> = new Map()
    private lastCells: Map<string, PiecePosition> = new Map()
    // Buffer de syncs que chegam antes do Phaser terminar de inicializar a cena
    private pendingPieces: PieceDefinition[] | null = null
    private pendingItems: SpecialItem[] | null = null
    private isReady = false

    constructor(cellSize: number) {
        super({ key: "BoardScene" })
        this.cellSize = cellSize
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
                // Anima passo-a-passo (uma célula por vez) para criar o efeito de caminhada
                this.tweens.killTweensOf(sprite)
                const path = this.buildPath(last ?? piece.position, piece.position)
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

        // Peças removidas (mortas) somem com fade
        for (const [id, sprite] of this.sprites) {
            if (seen.has(id)) continue
            this.sprites.delete(id)
            this.lastCells.delete(id)
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

    private cellToPixel(cell: PiecePosition): PiecePosition {
        return {
            x: cell.x * this.cellSize + this.cellSize / 2,
            y: cell.y * this.cellSize + this.cellSize / 2,
        }
    }

    // Caminho ortogonal célula-a-célula entre dois pontos (eixo X primeiro, depois Y)
    private buildPath(from: PiecePosition, to: PiecePosition): PiecePosition[] {
        const path: PiecePosition[] = []
        let cx = from.x
        let cy = from.y
        while (cx !== to.x) {
            cx += cx < to.x ? 1 : -1
            path.push({ x: cx, y: cy })
        }
        while (cy !== to.y) {
            cy += cy < to.y ? 1 : -1
            path.push({ x: cx, y: cy })
        }
        return path
    }

    private buildPiece(piece: PieceDefinition): Phaser.GameObjects.Container {
        const cs = this.cellSize
        const { clothing, outline, skin } = PIECE_PALETTE[piece.color]

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

        const isLight = piece.color === "light"
        const letter = this.add
            .text(0, 0, piece.type, {
                fontFamily: "Arial Black",
                fontSize: `${Math.max(10, Math.floor(cs * 0.18))}px`,
                color: isLight ? "#1a1a1a" : "#ffffff",
                stroke: isLight ? "#ffffff" : "#000000",
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
