import Phaser from "phaser"
import type { Barrier } from "../logic/types"
import { BARRIER_PALETTE, hex } from "../constants/palette"
import {
    BARRIER_EDGE_WIDTH,
    BOARD_DEPTHS,
    BARRIER_FLOOR_ALPHA,
    BARRIER_GLOW,
    BARRIER_GLOW_ALPHA,
    BARRIER_PULSE_MS,
} from "../constants/rules"

// A barreira paranormal acesa numa casa: o chão aceso pulsando, e a luz que ele projeta para cima.
// `at` é o centro da casa em pixels.
export const buildBarrier = (
    scene: Phaser.Scene,
    cellSize: number,
    at: { x: number; y: number },
    barrier: Barrier,
): Phaser.GameObjects.Container => {
    const cs = cellSize
    const colors = BARRIER_PALETTE[barrier.color]
    // Chão aceso: abaixo das personagens, dos itens, e de outros efeitos
    const container = scene.add.container(at.x, at.y).setDepth(BOARD_DEPTHS.barrier)

    // A casa acesa: o brilho por dentro, pulsando, e a borda marcando onde ela começa
    const floor = scene.add
        .rectangle(0, 0, cs, cs, hex(colors.floor), BARRIER_FLOOR_ALPHA.dim)
        .setStrokeStyle(BARRIER_EDGE_WIDTH, hex(colors.edge), 1)
    container.add(floor)
    scene.tweens.add({
        targets: floor,
        alpha: { from: BARRIER_FLOOR_ALPHA.dim, to: BARRIER_FLOOR_ALPHA.bright },
        duration: BARRIER_PULSE_MS,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
    })

    // A luz que a casa projeta para cima.
    // Elas ficam em um container próprio porque a opacidade dele multiplica a das fatias,
    // e assim um tween só faz tudo pulsar junto sem desfazer o degradê.
    const glow = scene.add.container(0, 0)
    const slice = (cs * BARRIER_GLOW.height) / BARRIER_GLOW.slices
    for (let i = 0; i < BARRIER_GLOW.slices; i++) {
        // A primeira fatia começa na beirada de cima da casa
        const centerY = -cs / 2 - slice * (i + 0.5)
        const fade = 1 - i / BARRIER_GLOW.slices
        // Mistura aditiva: a fatia soma luz ao que está embaixo em vez de cobrir
        glow.add(scene.add.rectangle(0, centerY, cs, slice, hex(colors.glow), fade).setBlendMode(Phaser.BlendModes.ADD))
    }
    container.add(glow)
    scene.tweens.add({
        targets: glow,
        alpha: { from: BARRIER_GLOW_ALPHA.dim, to: BARRIER_GLOW_ALPHA.bright },
        duration: BARRIER_PULSE_MS,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
    })

    return container
}

// A barreira que se apagou some com fade. Os laços do pulso param antes de o container sair de cena.
export const fadeOutBarrier = (scene: Phaser.Scene, container: Phaser.GameObjects.Container) => {
    scene.tweens.killTweensOf(container.list)
    scene.tweens.killTweensOf(container)
    scene.tweens.add({
        targets: container,
        alpha: 0,
        duration: BARRIER_PULSE_MS / 3,
        onComplete: () => container.destroy(),
    })
}
