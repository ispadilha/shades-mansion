import Phaser from "phaser"
import type { AuraKind, CharacterColor, CharacterDefinition, CharacterPosition, Facing } from "../logic/types"
import { characterKey } from "../logic/types"
import { AURA_PALETTE, VIGOR_PALETTE, hex } from "../constants/palette"
import {
    ALPHA_TWEEN_MS,
    BOARD_ART_SCALE,
    BOARD_DEPTHS,
    CHARACTER_FLEE_MS,
    CHARACTER_FLOOR,
    LEVEL_STAR,
    STEP_MS,
    VIGOR_BAR,
} from "../constants/rules"
import { CHARACTER_ART_SIZE, FACING_FRAMES } from "../assets"
import { auraTexture, characterTexture, starTexture } from "./pixelTextures"

// As artes sempre caem em pixels inteiros da tela, paradas ou no meio da caminhada:
// ampliadas, numa posição quebrada os pixels delas mudariam de largura a cada passo
export const WHOLE_PIXELS = "full"

// Onde os pés da personagem pisam, a partir do centro da casa: no chão dela
export const feetY = (cellSize: number) => cellSize * (0.5 - CHARACTER_FLOOR)

const vigorColor = (ratio: number) =>
    ratio > 0.5 ? VIGOR_PALETTE.high : ratio > 0.25 ? VIGOR_PALETTE.medium : VIGOR_PALETTE.low

// Um passo da caminhada: a casa a que a personagem vai, em pixels, e para onde ela se vira ao dar o passo
export interface WalkStep {
    x: number
    y: number
    facing: Facing
}

// Uma personagem desenhada no tabuleiro: a arte dela e, no mesmo container, o que a acompanha
// (a aura atrás, a barra de vigor e a estrela de promoção por cima). Tudo o que anda junto com
// ela mora aqui, então a caminhada não precisa sincronizar nada.
export class CharacterSprite {
    private readonly scene: Phaser.Scene
    private readonly cellSize: number
    // O time da personagem: é ele que diz por onde ela passa, mesmo depois de ela sair da partida
    readonly color: CharacterColor
    readonly container: Phaser.GameObjects.Container
    // A arte, com um quadro para cada direção
    private readonly art: Phaser.GameObjects.Sprite
    private readonly vigorBar: Phaser.GameObjects.Container
    private readonly vigorFill: Phaser.GameObjects.Rectangle
    // Largura da barra cheia, já descontada a moldura
    private readonly vigorWidth: number
    private readonly star: Phaser.GameObjects.Image
    private aura: { kind: AuraKind; sprite: Phaser.GameObjects.Image } | null = null
    // A casa em que a personagem está, ou a que está indo
    cell: CharacterPosition
    // Durante a caminhada são os passos que decidem para onde a personagem olha: a virada para o
    // alvo de uma ação fica guardada e só acontece quando ela chega.
    private walking = false
    private arrivalFacing: Facing | null = null
    // Quem corre numa investida passa por cima das outras personagens
    private running = false

    constructor(scene: Phaser.Scene, cellSize: number, character: CharacterDefinition, at: CharacterPosition) {
        this.scene = scene
        this.cellSize = cellSize
        this.color = character.color
        const cs = cellSize
        // A arte, virada para baixo no começo da partida, com os pés no chão da casa
        this.art = scene.add
            .sprite(0, feetY(cs), characterTexture(characterKey(character.color, character.type)), FACING_FRAMES.down)
            .setOrigin(0.5, 1)
            .setScale(BOARD_ART_SCALE.character)
            .setVertexRoundMode(WHOLE_PIXELS)

        // A barra de vigor nasce apagada: o tabuleiro só marca quem já foi atingida, e é
        // `syncVigor` que a acende quando a personagem perde vigor.
        const width = cs * VIGOR_BAR.width
        const height = cs * VIGOR_BAR.height
        const track = scene.add
            .rectangle(0, 0, width, height, hex(VIGOR_PALETTE.track), 0.85)
            .setStrokeStyle(1, hex(VIGOR_PALETTE.outline), 0.9)
        // O vigor esvazia da direita para a esquerda, então a origem fica na ponta esquerda
        this.vigorWidth = width - VIGOR_BAR.inset * 2
        const fillHeight = height - VIGOR_BAR.inset * 2
        this.vigorFill = scene.add
            .rectangle(-width / 2 + VIGOR_BAR.inset, 0, this.vigorWidth, fillHeight, hex(VIGOR_PALETTE.high))
            .setOrigin(0, 0.5)
        // Acima da personagem: do alto da arte, que pode passar da casa, sobe a folga e a barra
        const artTop = feetY(cs) - CHARACTER_ART_SIZE * BOARD_ART_SCALE.character
        const barY = Math.round(artTop - cs * VIGOR_BAR.gap - height / 2)
        this.vigorBar = scene.add.container(0, barY, [track, this.vigorFill]).setAlpha(0)

        // A estrela nasce invisível: no nível 1 não há promoção para marcar, e é `syncLevel` que a
        // acende, e troca a cor, quando a personagem sobe. Os pixels dela são do tamanho dos da arte.
        this.star = scene.add
            .image(cs * LEVEL_STAR.x, -cs * LEVEL_STAR.y, starTexture(scene, character.level))
            .setScale(BOARD_ART_SCALE.character)
            .setVertexRoundMode(WHOLE_PIXELS)
            .setVisible(false)

        this.container = scene.add.container(0, 0, [this.art, this.vigorBar, this.star])
        this.cell = { ...at }
        this.sync(character)
    }

    // O que muda com o estado da personagem: o vigor, o nível
    sync(character: CharacterDefinition) {
        this.syncVigor(character)
        this.syncLevel(character)
    }

    setPosition(x: number, y: number) {
        this.container.setPosition(x, y)
    }

    // Aparece na casa de uma vez, sem andar: é o que sobra quando não há caminho até ela
    place(x: number, y: number) {
        this.stop()
        this.container.setPosition(x, y)
    }

    setAlpha(alpha: number) {
        this.container.setAlpha(alpha)
    }

    // A transparência de quem já agiu, com a troca suave
    fadeTo(alpha: number) {
        if (Math.abs(this.container.alpha - alpha) < 0.01) return
        this.scene.tweens.add({ targets: this.container, alpha, duration: ALPHA_TWEEN_MS })
    }

    face(facing: Facing) {
        this.art.setFrame(FACING_FRAMES[facing])
    }

    // A personagem se vira para o alvo do que vai fazer: agora, ou ao chegar, se ainda estiver andando
    aim(facing: Facing) {
        if (this.walking) this.arrivalFacing = facing
        else this.face(facing)
    }

    // Caminha casa a casa, virando-se para cada casa seguinte, e fica virada para a última direção
    // em que andou, a não ser que uma virada para o alvo esteja esperando a chegada
    walk(steps: WalkStep[]) {
        this.stop()
        this.walking = true
        this.scene.tweens.chain({
            targets: this.container,
            tweens: steps.map(({ x, y, facing }) => ({
                x,
                y,
                duration: STEP_MS,
                ease: "Linear",
                onStart: () => this.face(facing),
            })),
            onComplete: () => this.arrive(),
        })
    }

    // Investida: corre em linha reta, por cima das outras personagens e abaixo do fogo e dos
    // números de dano, virada para onde corre
    run(to: { x: number; y: number }, facing: Facing, durationMs: number) {
        this.stop()
        this.face(facing)
        this.running = true
        this.scene.tweens.add({
            targets: this.container,
            x: to.x,
            y: to.y,
            duration: durationMs,
            ease: "Linear",
            onComplete: () => (this.running = false),
        })
    }

    // A ordem de desenho entre as personagens: quem está mais abaixo no tabuleiro fica por cima, com tudo o
    // que a acompanha. A altura em que ela está, dividida pela do tabuleiro (`boardHeight`, em pixels), cai
    // dentro da faixa das personagens.
    updateDepth(boardHeight: number) {
        const depth = this.running ? BOARD_DEPTHS.charge : BOARD_DEPTHS.character + this.container.y / boardHeight
        if (depth !== this.container.depth) this.container.setDepth(depth)
    }

    // Interrompe a caminhada (ou a corrida), para a personagem partir de onde está para o destino novo
    private stop() {
        this.scene.tweens.killTweensOf(this.container)
        this.walking = false
        this.running = false
        this.arrivalFacing = null
    }

    // Fim da caminhada: a personagem se vira para o alvo do que foi fazer, se houver um
    private arrive() {
        this.walking = false
        if (this.arrivalFacing) this.face(this.arrivalFacing)
        this.arrivalFacing = null
    }

    // Aura: um halo que se apaga em faixas até a borda, pulsando devagar.
    // Null apaga o que houver.
    setAura(kind: AuraKind | null) {
        if (this.aura?.kind === kind) return
        if (this.aura) {
            const { sprite } = this.aura
            this.aura = null
            this.scene.tweens.killTweensOf(sprite)
            this.scene.tweens.add({
                targets: sprite,
                alpha: 0,
                duration: ALPHA_TWEEN_MS,
                onComplete: () => sprite.destroy(),
            })
        }
        if (!kind) return

        const { strength, pulseMs } = AURA_PALETTE[kind]
        const scale = BOARD_ART_SCALE.character
        const sprite = this.scene.add
            .image(0, 0, auraTexture(this.scene, kind, this.cellSize))
            .setScale(scale)
            .setAlpha(strength * 0.5)
        this.scene.tweens.add({
            targets: sprite,
            alpha: strength,
            scale: scale * 1.08,
            duration: pulseMs / 2,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        })
        // Na primeira posição do container: o brilho fica atrás do desenho da personagem
        this.container.addAt(sprite, 0)
        this.aura = { kind, sprite }
    }

    // Comprimento e cor acompanham o vigor que restou. A barra some quando a personagem está inteira.
    private syncVigor(character: CharacterDefinition) {
        const ratio = Math.max(0, Math.min(1, character.vigor / character.maxVigor))
        this.vigorFill.setSize(Math.max(1, this.vigorWidth * ratio), this.vigorFill.height)
        this.vigorFill.setFillStyle(hex(vigorColor(ratio)))

        const alpha = ratio < 1 ? 1 : 0
        if (Math.abs(this.vigorBar.alpha - alpha) < 0.01) return
        this.scene.tweens.killTweensOf(this.vigorBar)
        this.scene.tweens.add({ targets: this.vigorBar, alpha, duration: ALPHA_TWEEN_MS })
    }

    // Prata no nível 2, dourada no 3, nenhuma no 1. A personagem pode ser promovida no meio da
    // partida, então isto roda a cada sincronia, e não só na criação.
    private syncLevel(character: CharacterDefinition) {
        if (character.level < 2) {
            this.star.setVisible(false)
            return
        }
        this.star.setTexture(starTexture(this.scene, character.level))
        this.star.setVisible(true)
    }

    // Saída de cena de quem foi eliminada / "foge da mansão":
    // some enquanto corre até `to`, com tudo o que a acompanha.
    flee(to: { x: number; y: number }, facing: Facing) {
        this.stop()
        this.face(facing)
        this.scene.tweens.add({
            targets: this.container,
            x: to.x,
            y: to.y,
            alpha: 0,
            duration: CHARACTER_FLEE_MS,
            ease: "Quad.easeIn",
            // O pulso da aura e a troca da barra de vigor param antes de o container sair de cena
            onComplete: () => {
                this.scene.tweens.killTweensOf(this.container.list)
                this.container.destroy()
            },
        })
    }
}
