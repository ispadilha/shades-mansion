import Phaser from "phaser"
import type { PiecePosition, PieceType } from "../logic/types"

const STEP_MS = 280

export class BoardScene extends Phaser.Scene {
    private cellSize: number
    private sprites: Map<string, Phaser.GameObjects.Container> = new Map()
    private lastCells: Map<string, PiecePosition> = new Map()
    private pendingPieces: PieceType[] | null = null
    private isReady = false

    constructor(cellSize: number) {
        super({ key: "BoardScene" })
        this.cellSize = cellSize
    }

    create() {
        this.isReady = true
        if (this.pendingPieces) {
            this.applyPieces(this.pendingPieces)
            this.pendingPieces = null
        }
    }

    syncPieces(pieces: PieceType[]) {
        if (!this.isReady) {
            this.pendingPieces = pieces
            return
        }
        this.applyPieces(pieces)
    }

    private applyPieces(pieces: PieceType[]) {
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

    private buildPiece(piece: PieceType): Phaser.GameObjects.Container {
        const cs = this.cellSize
        const isLight = piece.color === "light"
        const clothing = isLight ? 0xf2f2f2 : 0x1a1a1a
        const outline = isLight ? 0x2a2a2a : 0xdedede
        const skin = 0xf0c8a0

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

        container.add([shadow, leftLeg, rightLeg, leftArm, rightArm, body, head, leftEye, rightEye])
        return container
    }
}
