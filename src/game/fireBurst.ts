import Phaser from "phaser"
import type { FireBurst } from "../logic/boardEffects"
import { pickRandom, randomInt } from "../logic/random"
import { FIRE_COLORS, FIRE_PALETTE, hex } from "../constants/palette"
import { BOARD_DEPTHS, FIRE_BURST_MS, FLAMES_PER_CELL } from "../constants/rules"

// Desenha o fogo do ataque em área: a brasa marcando o quadrado que queimou e, por
// cima, chamas que sobem tremulando e apagam. É tudo tween sobre formas
// simples: nenhuma textura para carregar, por enquanto. `center` é o centro do fogo em pixels.
export const spawnFireBurst = (
    scene: Phaser.Scene,
    cellSize: number,
    center: { x: number; y: number },
    burst: FireBurst,
) => {
    const cs = cellSize
    const container = scene.add.container(center.x, center.y).setDepth(BOARD_DEPTHS.fire)
    const offsetOf = (cell: { x: number; y: number }) => ({
        x: (cell.x - burst.center.x) * cs,
        y: (cell.y - burst.center.y) * cs,
    })

    let reach = 1
    for (const cell of burst.cells) {
        const { x, y } = offsetOf(cell)
        reach = Math.max(reach, Math.abs(cell.x - burst.center.x), Math.abs(cell.y - burst.center.y))

        const ember = scene.add
            .rectangle(x, y, cs, cs, hex(FIRE_PALETTE.ember), 0.34)
            .setStrokeStyle(1, hex(FIRE_PALETTE.emberEdge), 0.55)
        container.add(ember)
        scene.tweens.add({ targets: ember, alpha: 0, duration: FIRE_BURST_MS, ease: "Quad.easeIn" })
    }

    // Estouro inicial: um clarão claro que abre e some depressa
    const flash = scene.add.circle(0, 0, cs * 0.3, hex(FIRE_PALETTE.flash), 0.9)
    container.add(flash)
    scene.tweens.add({
        targets: flash,
        scale: (2 * reach + 1) * 1.1,
        alpha: 0,
        duration: 260,
        ease: "Cubic.easeOut",
    })

    // Chamas sorteadas dentro de cada casa que queimou
    for (const cell of burst.cells) {
        const offset = offsetOf(cell)

        for (let i = 0; i < FLAMES_PER_CELL; i++) {
            const x = offset.x + (Math.random() - 0.5) * cs * 0.8
            const y = offset.y + (Math.random() - 0.5) * cs * 0.8
            const height = cs * (0.45 + Math.random() * 0.5)
            const width = height * (0.45 + Math.random() * 0.2)
            const color = pickRandom(FIRE_COLORS)

            // Chama: base larga embaixo e ponta para cima. Os pontos do triângulo
            // do Phaser são medidos a partir do canto do próprio desenho, não do centro.
            const flame = scene.add.triangle(x, y, 0, height, width / 2, 0, width, height, color).setAlpha(0)
            container.add(flame)

            const delay = Math.random() * (FIRE_BURST_MS * 0.35)
            // Sobe encolhendo até apagar
            scene.tweens.add({
                targets: flame,
                y: y - cs * 0.55,
                scaleY: { from: 0.35, to: 1.15 },
                alpha: { from: 0.95, to: 0 },
                delay,
                duration: FIRE_BURST_MS - delay,
                ease: "Sine.easeOut",
            })
            // Tremulação: a largura vai e volta enquanto a chama dura
            scene.tweens.add({
                targets: flame,
                scaleX: 0.6,
                delay,
                duration: randomInt(120, 210),
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut",
            })
        }
    }

    // As chamas tremulam em loop até aqui: parar os tweens antes de descartar
    // evita que eles continuem mexendo em objetos que já saíram da cena.
    scene.time.delayedCall(FIRE_BURST_MS + 120, () => {
        scene.tweens.killTweensOf(container.list)
        container.destroy()
    })
}
