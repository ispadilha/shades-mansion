import Phaser from "phaser"
import type {
    AuraKind,
    Barrier,
    CharacterAuras,
    CharacterDefinition,
    CharacterPosition,
    Facing,
    MotivationItem,
} from "../logic/types"
import { characterKey } from "../logic/types"
import type { Maze } from "../logic/maze"
import type { Aim, ChargeRun, DamagePopup, FireBurst } from "../logic/combat"
import { findPath } from "../logic/movement"
import { blockedCellsFor, facingToward, samePosition } from "../logic/grid"
import { isSpent } from "../logic/turn"
import { pickRandom, randomInt } from "../logic/random"
import {
    AURA_PALETTE,
    BARRIER_PALETTE,
    DAMAGE_POPUP_PALETTE,
    FIRE_COLORS,
    FIRE_PALETTE,
    VIGOR_PALETTE,
    levelStarColors,
    hex,
} from "../constants/palette"
import {
    ALPHA_TWEEN_MS,
    BARRIER_EDGE_WIDTH,
    BARRIER_GLOW,
    BARRIER_GLOW_ALPHA,
    BARRIER_FLOOR_ALPHA,
    BARRIER_PULSE_MS,
    BOARD_ART_SCALE,
    CHARACTER_FLOOR,
    DAMAGE_POPUP_MS,
    DAMAGE_POPUP_RISE,
    LEVEL_STAR,
    ITEM_DROP_HEIGHT,
    ITEM_DROP_MS,
    FIRE_BURST_MS,
    GLOW_BANDS,
    FLAMES_PER_CELL,
    ITEM_FADE_MS,
    MOVED_CHARACTER_ALPHA,
    CHARACTER_FADE_MS,
    STEP_MS,
    VIGOR_BAR,
} from "../constants/rules"
import { CHARACTER_ART_SIZE, CHARACTER_SHEETS, FACING_FRAMES, ITEM_ARTS } from "../assets"
import { glowGrid, numberGrid, starGrid, type PixelGrid } from "../assets/pixels"

// As texturas das artes na cena, pela chave da personagem
const characterTexture = (key: string) => `character-${key}`
const itemTexture = (key: string) => `item-${key}`

// As artes sempre caem em pixels inteiros da tela, paradas ou no meio da caminhada:
// ampliadas, numa posição quebrada os pixels delas mudariam de largura a cada passo
const WHOLE_PIXELS = "full"

// O halo da aura: mais forte na altura da personagem e sumindo para fora, um anel e não um disco chapado
const AURA_FADE = [
    [0, 0.45],
    [0.45, 0.75],
    [0.75, 0.3],
    [1, 0],
] as const

// Onde os pés da personagem pisam, a partir do centro da casa: no chão dela
const feetY = (cellSize: number) => cellSize * (0.5 - CHARACTER_FLOOR)

const vigorColor = (ratio: number) =>
    ratio > 0.5 ? VIGOR_PALETTE.high : ratio > 0.25 ? VIGOR_PALETTE.medium : VIGOR_PALETTE.low

interface VigorBar {
    // A barra inteira
    root: Phaser.GameObjects.Container
    // A parte pintada
    fill: Phaser.GameObjects.Rectangle
    // Largura da barra cheia, já descontada a moldura
    width: number
}

export class BoardScene extends Phaser.Scene {
    private cellSize: number
    private maze: Maze
    private sprites: Map<string, Phaser.GameObjects.Container> = new Map()
    // A arte de cada personagem, dentro do container dela: é o quadro dela que muda com a direção
    private arts: Map<string, Phaser.GameObjects.Sprite> = new Map()
    private itemSprites: Map<string, Phaser.GameObjects.Container> = new Map()
    private lastCells: Map<string, CharacterPosition> = new Map()
    // Auras em cena, por personagem. O desenho fica dentro do container da personagem, então acompanha
    // a caminhada dela sem precisar de sincronia nenhuma.
    private auras: Map<string, { kind: AuraKind; sprite: Phaser.GameObjects.Image }> = new Map()
    private vigorBars: Map<string, VigorBar> = new Map()
    // A estrela de promoção de cada personagem. Ela mora dentro do container da personagem, então
    // acompanha a caminhada sozinha. O que muda com o nível é a cor e se ela aparece.
    private levelStars: Map<string, Phaser.GameObjects.Image> = new Map()
    private barrierSprites: Map<string, Phaser.GameObjects.Container> = new Map()
    // A última lista recebida: o caminho de uma personagem contorna as barreiras dos oponentes,
    // e é aqui que o passo-a-passo da caminhada consulta quais são.
    private barriers: Barrier[] = []
    // Investidas anunciadas, por personagem: na próxima troca de casa dela, ela corre em linha reta
    // até lá, em vez de caminhar pelo labirinto
    private charges: Map<string, ChargeRun> = new Map()
    // Quem está caminhando agora. Durante a caminhada são os passos que decidem para onde a personagem
    // olha: a virada para o alvo de uma ação fica guardada e só acontece quando ela chega.
    private walking: Set<string> = new Set()
    private arrivalFacings: Map<string, Facing> = new Map()
    // Buffer de syncs que chegam antes do Phaser terminar de inicializar a cena
    private pendingCharacters: CharacterDefinition[] | null = null
    private pendingItems: MotivationItem[] | null = null
    private pendingBarriers: Barrier[] | null = null
    private pendingBursts: FireBurst[] = []
    private pendingDamage: DamagePopup[] = []
    private pendingDrops: string[] = []
    private pendingAuras: CharacterAuras | null = null
    private isReady = false

    // Quanto a cena passa da borda do tabuleiro, em pixels:
    // a câmera recua isso, e o tabuleiro começa um pouco para dentro dela
    private overflow: number

    constructor(cellSize: number, maze: Maze, overflow: number) {
        super({ key: "BoardScene" })
        this.cellSize = cellSize
        this.maze = maze
        this.overflow = overflow
    }

    // As artes chegam antes de a cena montar: o spritesheet de cada personagem e o item de cada uma
    preload() {
        for (const [key, url] of Object.entries(CHARACTER_SHEETS)) {
            this.load.spritesheet(characterTexture(key), url, {
                frameWidth: CHARACTER_ART_SIZE,
                frameHeight: CHARACTER_ART_SIZE,
            })
        }
        for (const [key, url] of Object.entries(ITEM_ARTS)) this.load.image(itemTexture(key), url)
    }

    create() {
        this.cameras.main.setScroll(-this.overflow, -this.overflow)
        this.isReady = true
        if (this.pendingItems) {
            this.applyItems(this.pendingItems)
            this.pendingItems = null
        }
        // Barreiras antes das personagens porque aliadas caminham por cima do chão aceso
        if (this.pendingBarriers) {
            this.applyBarriers(this.pendingBarriers)
            this.pendingBarriers = null
        }
        if (this.pendingCharacters) {
            this.applyCharacters(this.pendingCharacters)
            this.pendingCharacters = null
        }
        // Depois das personagens: a aura é desenhada dentro do container de cada uma
        if (this.pendingAuras) {
            this.applyAuras(this.pendingAuras)
            this.pendingAuras = null
        }
        for (const burst of this.pendingBursts) this.spawnFireBurst(burst)
        this.pendingBursts = []
        for (const popup of this.pendingDamage) this.spawnDamage(popup)
        this.pendingDamage = []
        for (const itemId of this.pendingDrops) this.dropItem(itemId)
        this.pendingDrops = []
    }

    syncCharacters(characters: CharacterDefinition[]) {
        if (!this.isReady) {
            this.pendingCharacters = characters
            return
        }
        this.applyCharacters(characters)
    }

    syncBarriers(barriers: Barrier[]) {
        this.barriers = barriers
        if (!this.isReady) {
            this.pendingBarriers = barriers
            return
        }
        this.applyBarriers(barriers)
    }

    syncItems(items: MotivationItem[]) {
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

    // O número de dano que sobe acima da personagem atingida. Como cada explosão, ele é tocado
    // uma vez só, e é quem chama que controla isso.
    playDamage(popup: DamagePopup) {
        if (!this.isReady) {
            this.pendingDamage.push(popup)
            return
        }
        this.spawnDamage(popup)
    }

    // A investida que vem na próxima troca de casa da personagem
    playCharge(run: ChargeRun) {
        this.charges.set(run.characterId, run)
    }

    // A personagem se vira para o alvo, a partir da casa em que está, ou da casa a que está indo:
    // se ainda estiver andando até lá, ela se vira ao chegar. Alvo que é outra personagem conta
    // pela casa em que ela está (ou para a qual está indo).
    playAim(aim: Aim) {
        const cell = this.lastCells.get(aim.characterId)
        const target = typeof aim.target === "string" ? this.lastCells.get(aim.target) : aim.target
        if (!cell || !target || samePosition(cell, target)) return
        const facing = facingToward(cell, target)
        if (this.walking.has(aim.characterId)) this.arrivalFacings.set(aim.characterId, facing)
        else this.face(aim.characterId, facing)
    }

    // A queda de um item que voltou ao tabuleiro.
    // O item já está na lista: aqui ele só é jogado para cair na casa dele.
    playItemDrop(itemId: string) {
        if (!this.isReady) {
            this.pendingDrops.push(itemId)
            return
        }
        this.dropItem(itemId)
    }

    syncAuras(auras: CharacterAuras) {
        if (!this.isReady) {
            this.pendingAuras = auras
            return
        }
        this.applyAuras(auras)
    }

    private applyItems(items: MotivationItem[]) {
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
                duration: ITEM_FADE_MS,
                onComplete: () => sprite.destroy(),
            })
        }
    }

    private applyCharacters(characters: CharacterDefinition[]) {
        const seen = new Set<string>()

        for (const character of characters) {
            seen.add(character.id)
            const targetPx = this.cellToPixel(character.position)
            // Quem esgotou o turno inteiro (movimento e/ou ataque básico e habilidade)
            // fica translúcido para indicar isso
            const targetAlpha = isSpent(character) ? MOVED_CHARACTER_ALPHA : 1

            let sprite = this.sprites.get(character.id)
            if (!sprite) {
                sprite = this.buildCharacter(character)
                sprite.setPosition(targetPx.x, targetPx.y)
                sprite.setAlpha(targetAlpha)
                this.sprites.set(character.id, sprite)
                this.lastCells.set(character.id, { ...character.position })
                this.syncVigorBar(character)
                this.syncLevelStar(character)
                continue
            }

            const last = this.lastCells.get(character.id)
            const cellChanged = !last || last.x !== character.position.x || last.y !== character.position.y
            if (cellChanged) {
                this.tweens.killTweensOf(sprite)
                this.walking.delete(character.id)
                this.arrivalFacings.delete(character.id)
                const charge = this.charges.get(character.id)
                this.charges.delete(character.id)
                if (charge && samePosition(charge.to, character.position)) {
                    // Investida: corre em linha reta, por cima das outras personagens e abaixo do
                    // fogo e dos números de dano, virada para onde corre
                    this.face(character.id, facingToward(last ?? character.position, character.position))
                    const runner = sprite.setDepth(5)
                    this.tweens.add({
                        targets: runner,
                        x: targetPx.x,
                        y: targetPx.y,
                        duration: charge.durationMs,
                        ease: "Linear",
                        onComplete: () => runner.setDepth(0),
                    })
                } else {
                    // Anima passo-a-passo (uma célula por vez, contornando as paredes) para criar o efeito de caminhada
                    const blocked = blockedCellsFor(character.color, this.barriers, characters)
                    const start = last ?? character.position
                    const path = findPath(start, character.position, this.maze, blocked)
                    if (path.length === 0) {
                        sprite.setPosition(targetPx.x, targetPx.y)
                    } else {
                        // A cada passo, a personagem se vira para a casa seguinte, e fica virada
                        // para a última direção em que andou
                        const steps = path.map((cell, index) => {
                            const px = this.cellToPixel(cell)
                            const facing = facingToward(index === 0 ? start : path[index - 1], cell)
                            const onStart = () => this.face(character.id, facing)
                            return { x: px.x, y: px.y, duration: STEP_MS, ease: "Linear", onStart }
                        })
                        this.walking.add(character.id)
                        this.tweens.chain({
                            targets: sprite,
                            tweens: steps,
                            onComplete: () => this.arrive(character.id),
                        })
                    }
                }
                this.lastCells.set(character.id, { ...character.position })
            }

            if (Math.abs(sprite.alpha - targetAlpha) > 0.01) {
                this.tweens.add({ targets: sprite, alpha: targetAlpha, duration: ALPHA_TWEEN_MS })
            }

            this.syncVigorBar(character)
            this.syncLevelStar(character)
        }

        // Personagens removidas (eliminadas) somem com fade
        for (const [id, sprite] of this.sprites) {
            if (seen.has(id)) continue
            this.sprites.delete(id)
            this.arts.delete(id)
            this.lastCells.delete(id)
            this.walking.delete(id)
            this.arrivalFacings.delete(id)
            // O brilho e a barra de vigor são filhos do container: somem junto com a personagem,
            // sem tween próprio
            this.auras.delete(id)
            this.vigorBars.delete(id)
            this.levelStars.delete(id)
            this.tweens.killTweensOf(sprite)
            this.tweens.add({
                targets: sprite,
                alpha: 0,
                scale: 0.4,
                duration: CHARACTER_FADE_MS,
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

            const ember = this.add
                .rectangle(ox, oy, cs, cs, hex(FIRE_PALETTE.ember), 0.34)
                .setStrokeStyle(1, hex(FIRE_PALETTE.emberEdge), 0.55)
            container.add(ember)
            this.tweens.add({ targets: ember, alpha: 0, duration: FIRE_BURST_MS, ease: "Quad.easeIn" })
        }

        // Estouro inicial: um clarão claro que abre e some depressa
        const flash = this.add.circle(0, 0, cs * 0.3, hex(FIRE_PALETTE.flash), 0.9)
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
                const color = pickRandom(FIRE_COLORS)

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
                // Tremulação: a largura vai e volta enquanto a chama dura
                this.tweens.add({
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
        this.time.delayedCall(FIRE_BURST_MS + 120, () => {
            this.tweens.killTweensOf(container.list)
            container.destroy()
        })
    }

    // Acende e apaga as barreiras conforme a lista muda
    private applyBarriers(barriers: Barrier[]) {
        const seen = new Set<string>()

        for (const barrier of barriers) {
            seen.add(barrier.id)
            if (this.barrierSprites.has(barrier.id)) continue
            this.barrierSprites.set(barrier.id, this.buildBarrier(barrier))
        }

        for (const [id, container] of this.barrierSprites) {
            if (seen.has(id)) continue
            this.barrierSprites.delete(id)
            // Os laços do pulso precisam parar antes de o container sair de cena
            this.tweens.killTweensOf(container.list)
            this.tweens.killTweensOf(container)
            this.tweens.add({
                targets: container,
                alpha: 0,
                duration: BARRIER_PULSE_MS / 3,
                onComplete: () => container.destroy(),
            })
        }
    }

    private buildBarrier(barrier: Barrier): Phaser.GameObjects.Container {
        const cs = this.cellSize
        const colors = BARRIER_PALETTE[barrier.color]
        const { x, y } = this.cellToPixel(barrier.position)
        // Chão aceso: abaixo das personagens, dos itens, e de outros efeitos
        const container = this.add.container(x, y).setDepth(-1)

        // A casa acesa: o brilho por dentro, pulsando, e a borda marcando onde ela começa
        const floor = this.add
            .rectangle(0, 0, cs, cs, hex(colors.floor), BARRIER_FLOOR_ALPHA.dim)
            .setStrokeStyle(BARRIER_EDGE_WIDTH, hex(colors.edge), 1)
        container.add(floor)
        this.tweens.add({
            targets: floor,
            alpha: { from: BARRIER_FLOOR_ALPHA.dim, to: BARRIER_FLOOR_ALPHA.bright },
            duration: BARRIER_PULSE_MS,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        })

        // A luz que a casa projeta para cima: poucas fatias finas, somando brilho e
        // apagando conforme sobem. Elas ficam em um container próprio porque a opacidade
        // dele multiplica a das fatias, e assim um tween só faz tudo pulsar junto sem
        // desfazer o degradê.
        const glow = this.add.container(0, 0)
        const slice = (cs * BARRIER_GLOW.height) / BARRIER_GLOW.slices
        for (let i = 0; i < BARRIER_GLOW.slices; i++) {
            // A primeira fatia começa na beirada de cima da casa
            const centerY = -cs / 2 - slice * (i + 0.5)
            const fade = 1 - i / BARRIER_GLOW.slices
            glow.add(
                // Mistura aditiva: a fatia soma luz ao que está embaixo em vez de cobrir
                this.add
                    .rectangle(0, centerY, cs, slice, hex(colors.glow), fade)
                    .setBlendMode(Phaser.BlendModes.ADD),
            )
        }
        container.add(glow)
        this.tweens.add({
            targets: glow,
            alpha: { from: BARRIER_GLOW_ALPHA.dim, to: BARRIER_GLOW_ALPHA.bright },
            duration: BARRIER_PULSE_MS,
            yoyo: true,
            repeat: -1,
            ease: "Sine.easeInOut",
        })

        return container
    }

    // O número branco que sobe da casa e desaparece.
    private spawnDamage(popup: DamagePopup) {
        const cs = this.cellSize
        const { x, y } = this.cellToPixel(popup.position)

        // Algarismos em pixel, com pixels do tamanho dos da arte
        const { fill, stroke } = DAMAGE_POPUP_PALETTE
        const digits = this.pixelTexture(`damage-${popup.amount}-${fill}-${stroke}`, () =>
            numberGrid(popup.amount, fill, stroke),
        )
        const label = this.add
            .image(x, y - cs * 0.12, digits)
            .setOrigin(0.5, 1)
            .setScale(BOARD_ART_SCALE.character)
            .setVertexRoundMode(WHOLE_PIXELS)
            .setDepth(20)

        this.tweens.add({
            targets: label,
            y: label.y - cs * DAMAGE_POPUP_RISE,
            alpha: { from: 1, to: 0 },
            duration: DAMAGE_POPUP_MS,
            ease: "Quad.easeOut",
            onComplete: () => label.destroy(),
        })
    }

    private dropItem(itemId: string) {
        const sprite = this.itemSprites.get(itemId)
        if (!sprite) return

        const { y } = sprite
        sprite.setY(y - this.cellSize * ITEM_DROP_HEIGHT)
        sprite.setAlpha(0)
        this.tweens.killTweensOf(sprite)
        // Cai acelerando, como queda livre, no centro da casa
        this.tweens.add({ targets: sprite, y, alpha: 1, duration: ITEM_DROP_MS, ease: "Cubic.easeIn" })
    }

    private applyAuras(auras: CharacterAuras) {
        // Sai quem perdeu o destaque (ou trocou de tipo de aura)
        for (const [characterId, current] of this.auras) {
            if (auras[characterId] === current.kind) continue
            this.auras.delete(characterId)
            this.tweens.killTweensOf(current.sprite)
            this.tweens.add({
                targets: current.sprite,
                alpha: 0,
                duration: ALPHA_TWEEN_MS,
                onComplete: () => current.sprite.destroy(),
            })
        }

        // Entra quem ganhou
        for (const [characterId, kind] of Object.entries(auras)) {
            if (this.auras.get(characterId)?.kind === kind) continue
            const container = this.sprites.get(characterId)
            if (!container) continue

            const sprite = this.buildAura(kind)
            // Na primeira posição do container: o brilho fica atrás do desenho da personagem
            container.addAt(sprite, 0)
            this.auras.set(characterId, { kind, sprite })
        }
    }

    // O brilho em si: um halo que se apaga em faixas até a borda, pulsando devagar
    private buildAura(kind: AuraKind): Phaser.GameObjects.Image {
        const { strength, pulseMs } = AURA_PALETTE[kind]
        const scale = BOARD_ART_SCALE.character

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
    // tingir o sprite e sai igual em qualquer renderizador). O halo tem pixels do tamanho dos da
    // arte, então a textura tem um pixel para cada um deles.
    private auraTexture(kind: AuraKind): string {
        const { color, radius } = AURA_PALETTE[kind]
        const side = Math.round((radius * 2 * this.cellSize) / BOARD_ART_SCALE.character)
        return this.pixelTexture(`aura-${kind}-${color}-${side}`, () => glowGrid(side, color, AURA_FADE, GLOW_BANDS))
    }

    private starTexture(level: number): string {
        const { fill, outline } = levelStarColors(level)
        return this.pixelTexture(`star-${fill}-${outline}`, () => starGrid(fill, outline))
    }

    // Uma imagem em pixels vira textura uma vez só, com um pixel da textura para cada pixel dela.
    // A cor entra na chave de quem chama: mexer na paleta gera uma textura nova em vez de
    // reaproveitar a antiga, que já está pintada.
    private pixelTexture(key: string, draw: () => PixelGrid): string {
        if (this.textures.exists(key)) return key
        const grid = draw()
        const texture = this.textures.createCanvas(key, grid[0].length, grid.length)
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

    private cellToPixel(cell: CharacterPosition): CharacterPosition {
        return {
            x: cell.x * this.cellSize + this.cellSize / 2,
            y: cell.y * this.cellSize + this.cellSize / 2,
        }
    }

    // A personagem é a arte dela, virada para baixo no começo da partida, com a barra de vigor
    // e a estrela de promoção por cima. Os pés pisam no chão da casa.
    private buildCharacter(character: CharacterDefinition): Phaser.GameObjects.Container {
        const texture = characterTexture(characterKey(character.color, character.type))
        const art = this.add
            .sprite(0, feetY(this.cellSize), texture, FACING_FRAMES.down)
            .setOrigin(0.5, 1)
            .setScale(BOARD_ART_SCALE.character)
            .setVertexRoundMode(WHOLE_PIXELS)
        this.arts.set(character.id, art)

        const container = this.add.container(0, 0, [art])
        container.add(this.buildVigorBar(character.id))
        container.add(this.buildLevelStar(character))
        return container
    }

    private face(characterId: string, facing: Facing) {
        this.arts.get(characterId)?.setFrame(FACING_FRAMES[facing])
    }

    // Fim da caminhada: a personagem se vira para o alvo do que foi fazer, se houver um
    private arrive(characterId: string) {
        this.walking.delete(characterId)
        const facing = this.arrivalFacings.get(characterId)
        if (!facing) return
        this.arrivalFacings.delete(characterId)
        this.face(characterId, facing)
    }

    // A barra nasce apagada: o tabuleiro só marca quem já foi atingido, e é `syncVigorBar`
    // que a acende quando a personagem perde vigor.
    private buildVigorBar(characterId: string): Phaser.GameObjects.Container {
        const cs = this.cellSize
        const width = cs * VIGOR_BAR.width
        const height = cs * VIGOR_BAR.height

        const track = this.add
            .rectangle(0, 0, width, height, hex(VIGOR_PALETTE.track), 0.85)
            .setStrokeStyle(1, hex(VIGOR_PALETTE.outline), 0.9)
        // O vigor esvazia da direita para a esquerda, então a origem fica na ponta esquerda
        const fill = this.add
            .rectangle(-width / 2 + VIGOR_BAR.inset, 0, width - VIGOR_BAR.inset * 2, height - VIGOR_BAR.inset * 2, hex(VIGOR_PALETTE.high))
            .setOrigin(0, 0.5)

        // Acima da personagem: do alto da arte, que pode passar da casa, sobe a folga e a barra
        const artTop = feetY(cs) - CHARACTER_ART_SIZE * BOARD_ART_SCALE.character
        const y = Math.round(artTop - cs * VIGOR_BAR.gap - height / 2)
        const root = this.add.container(0, y, [track, fill]).setAlpha(0)
        this.vigorBars.set(characterId, { root, fill, width: width - VIGOR_BAR.inset * 2 })
        return root
    }

    // A estrela nasce invisível: no nível 1 não há promoção para marcar, e é
    // `syncLevelStar` que a acende, e troca a cor, quando a personagem sobe. Os pixels dela
    // são do tamanho dos da arte.
    private buildLevelStar(character: CharacterDefinition): Phaser.GameObjects.Image {
        const cs = this.cellSize
        const star = this.add
            .image(cs * LEVEL_STAR.x, -cs * LEVEL_STAR.y, this.starTexture(character.level))
            .setScale(BOARD_ART_SCALE.character)
            .setVertexRoundMode(WHOLE_PIXELS)
            .setVisible(false)
        this.levelStars.set(character.id, star)
        return star
    }

    // Prata no nível 2, dourada no 3, nenhuma no 1. A personagem pode ser promovida no meio da
    // partida, então isto roda a cada sincronia, e não só na criação.
    private syncLevelStar(character: CharacterDefinition) {
        const star = this.levelStars.get(character.id)
        if (!star) return

        if (character.level < 2) {
            star.setVisible(false)
            return
        }
        star.setTexture(this.starTexture(character.level))
        star.setVisible(true)
    }

    // Comprimento e cor acompanham o vigor que restou.
    // A barra some quando a personagem está inteira.
    private syncVigorBar(character: CharacterDefinition) {
        const bar = this.vigorBars.get(character.id)
        if (!bar) return

        const ratio = Math.max(0, Math.min(1, character.vigor / character.maxVigor))
        bar.fill.setSize(Math.max(1, bar.width * ratio), bar.fill.height)
        bar.fill.setFillStyle(hex(vigorColor(ratio)))

        const targetAlpha = ratio < 1 ? 1 : 0
        if (Math.abs(bar.root.alpha - targetAlpha) < 0.01) return
        this.tweens.killTweensOf(bar.root)
        this.tweens.add({ targets: bar.root, alpha: targetAlpha, duration: ALPHA_TWEEN_MS })
    }

    private buildItem(item: MotivationItem): Phaser.GameObjects.Container {
        const art = this.add
            .image(0, 0, itemTexture(item.key))
            .setScale(BOARD_ART_SCALE.item)
            .setVertexRoundMode(WHOLE_PIXELS)
        return this.add.container(0, 0, [art])
    }
}
