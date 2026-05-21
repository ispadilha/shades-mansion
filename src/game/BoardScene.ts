import Phaser from "phaser"
import type { PiecePosition, PieceDefinition, SpecialItem } from "../logic/types"

export const STEP_MS = 280

export class BoardScene extends Phaser.Scene {
    private cellSize: number
    private sprites: Map<string, Phaser.GameObjects.Container> = new Map()
    private itemSprites: Map<string, Phaser.GameObjects.Container> = new Map()
    private lastCells: Map<string, PiecePosition> = new Map()
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
            const targetPx = this.cellToPixel(item.position)
            let sprite = this.itemSprites.get(item.id)
            if (!sprite) {
                sprite = this.buildItem(item)
                sprite.setPosition(targetPx.x, targetPx.y)
                this.itemSprites.set(item.id, sprite)
            } else {
                sprite.setPosition(targetPx.x, targetPx.y)
            }
        }

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
            const target = piece.position
            const targetPx = this.cellToPixel(target)
            const targetAlpha = piece.movedThisTurn ? 0.55 : 1

            let sprite = this.sprites.get(piece.id)
            if (!sprite) {
                sprite = this.buildPiece(piece)
                sprite.setPosition(targetPx.x, targetPx.y)
                sprite.setAlpha(targetAlpha)
                this.sprites.set(piece.id, sprite)
                this.lastCells.set(piece.id, { x: target.x, y: target.y })
                continue
            }

            const expectedColor = sprite.getData("color")
            if (expectedColor !== piece.color) {
                sprite.destroy()
                sprite = this.buildPiece(piece)
                sprite.setPosition(targetPx.x, targetPx.y)
                sprite.setAlpha(targetAlpha)
                this.sprites.set(piece.id, sprite)
                this.lastCells.set(piece.id, { x: target.x, y: target.y })
                continue
            }

            const last = this.lastCells.get(piece.id)
            const cellChanged = !last || last.x !== target.x || last.y !== target.y
            if (cellChanged) {
                this.tweens.killTweensOf(sprite)
                const path = this.buildPath(last ?? target, target)
                if (path.length === 0) {
                    sprite.setPosition(targetPx.x, targetPx.y)
                } else {
                    const steps = path.map((cell) => {
                        const px = this.cellToPixel(cell)
                        return { x: px.x, y: px.y, duration: STEP_MS, ease: "Linear" }
                    })
                    this.tweens.chain({ targets: sprite, tweens: steps })
                }
                this.lastCells.set(piece.id, { x: target.x, y: target.y })
            }

            if (Math.abs(sprite.alpha - targetAlpha) > 0.01) {
                this.tweens.add({
                    targets: sprite,
                    alpha: targetAlpha,
                    duration: 200,
                })
            }
        }

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
        const isGray = piece.color === "gray"
        const isLight = piece.color === "light"
        const wasRecruited = piece.recruitedFrom === "gray"

        const clothing = isGray ? 0x7a7a7a : isLight ? 0xf2f2f2 : 0x1a1a1a
        const outline = isGray ? 0x2a2a2a : isLight ? 0x2a2a2a : 0xdedede
        const skin = wasRecruited ? 0x9a9a9a : isGray ? 0xb8a890 : 0xf0c8a0

        const container = this.add.container(0, 0)
        container.setData("color", piece.color)
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

        const letterColor = isLight ? "#1a1a1a" : "#ffffff"
        const letterStroke = isLight ? "#ffffff" : "#000000"
        const letter = this.add
            .text(0, 0, piece.type, {
                fontFamily: "Arial Black",
                fontSize: `${Math.max(10, Math.floor(cs * 0.18))}px`,
                color: letterColor,
                stroke: letterStroke,
                strokeThickness: 2,
            })
            .setOrigin(0.5, 0.5)

        container.add([shadow, leftLeg, rightLeg, leftArm, rightArm, body, head, leftEye, rightEye, letter])
        return container
    }

    private buildItem(item: SpecialItem): Phaser.GameObjects.Container {
        const cs = this.cellSize
        const team = item.key[0] as "d" | "g" | "l"
        const type = item.key[1]

        const palette: Record<"d" | "g" | "l", { bg: number; outline: number; text: string; stroke: string }> = {
            d: { bg: 0x2a2a2a, outline: 0xeeeeee, text: "#ffffff", stroke: "#000000" },
            l: { bg: 0xeeeeee, outline: 0x222222, text: "#1a1a1a", stroke: "#ffffff" },
            g: { bg: 0x888888, outline: 0x222222, text: "#ffffff", stroke: "#000000" },
        }
        const colors = palette[team]

        const container = this.add.container(0, 0)
        const ring = this.add.circle(0, 0, cs * 0.22, 0x000000, 0.25)
        const circle = this.add.circle(0, 0, cs * 0.18, colors.bg).setStrokeStyle(2, colors.outline)
        const letter = this.add
            .text(0, 0, type, {
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
