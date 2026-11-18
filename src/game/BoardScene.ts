import Phaser from "phaser"
import type { Barrier, CharacterAuras, CharacterDefinition, CharacterPosition, MotivationItem } from "../logic/types"
import type { Maze } from "../logic/maze"
import { isWalkable } from "../logic/maze"
import type { Aim, ChargeRun, DamagePopup, FireBurst, ReinvigorationPopup } from "../logic/boardEffects"
import { findPath } from "../logic/movement"
import { atPosition, blockedCellsFor, facingToward, neighbors, positionKey, samePosition } from "../logic/grid"
import { isSpent } from "../logic/turn"
import { pickRandom } from "../logic/random"
import { DAMAGE_PALETTE, REINVIGORATION_PALETTE } from "../constants/palette"
import {
    BOARD_ART_SCALE,
    BOARD_DEPTHS,
    CHARACTER_DEFEAT_MS,
    DAMAGE_POPUP_MS,
    DAMAGE_POPUP_RISE,
    REINVIGORATION_POPUP_MS,
    REINVIGORATION_POPUP_RISE,
    ITEM_DROP_HEIGHT,
    ITEM_DROP_MS,
    ITEM_FADE_MS,
    MOVED_CHARACTER_ALPHA,
} from "../constants/rules"
import { CHARACTER_ART_SIZE, CHARACTER_SHEETS, ITEM_ARTS } from "../assets"
import { CharacterSprite, WHOLE_PIXELS } from "./CharacterSprite"
import { buildBarrier, fadeOutBarrier } from "./barrierSprite"
import { spawnFireBurst } from "./fireBurst"
import { characterTexture, itemTexture, numberTexture } from "./pixelTextures"

// As listas que a cena sincroniza, na ordem em que precisam entrar quando ela monta: as barreiras
// antes das personagens porque aliadas caminham por cima do chão aceso, e as auras depois delas
// porque são desenhadas dentro de cada personagem
const SYNC_ORDER = ["items", "barriers", "characters", "auras"] as const
type SyncKind = (typeof SYNC_ORDER)[number]

// A cena do tabuleiro: desenha as personagens, os itens, as barreiras e os efeitos por cima das
// casas em React, e anima cada mudança que a partida lhe entrega (uma caminhada, uma investida,
// um incêndio). Ela não decide nada: só reage ao estado que recebe.
export class BoardScene extends Phaser.Scene {
    private cellSize: number
    private maze: Maze
    private characters: Map<string, CharacterSprite> = new Map()
    // Quem perdeu todo o vigor e está um instante parada antes de "fugir"
    private defeated: Map<string, CharacterSprite> = new Map()
    // A última lista de personagens recebida, para quem vai "fugir" preferir uma casa vaga
    private lastCharacters: CharacterDefinition[] = []
    private itemSprites: Map<string, Phaser.GameObjects.Container> = new Map()
    private barrierSprites: Map<string, Phaser.GameObjects.Container> = new Map()
    // A última lista recebida: o caminho de uma personagem contorna as barreiras dos oponentes,
    // e é aqui que o passo-a-passo da caminhada consulta quais são.
    private barriers: Barrier[] = []
    // Investidas anunciadas, por personagem: na próxima troca de casa dela, ela corre em linha reta
    // até lá, em vez de caminhar pelo labirinto
    private charges: Map<string, ChargeRun> = new Map()
    // O que chegou antes de o Phaser terminar de montar a cena: a última sincronia de cada lista,
    // e os efeitos na ordem em que vieram
    private pendingSyncs: Map<SyncKind, () => void> = new Map()
    private pendingPlays: Array<() => void> = []
    private isReady = false
    // A personagem que a câmera acompanha, quem a cena avisa quando ela se mexe,
    // e onde ela estava no quadro anterior
    private followed: {
        id: string
        onMove: (position: CharacterPosition) => void
        last: { x: number; y: number } | null
    } | null = null

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
        for (const kind of SYNC_ORDER) this.pendingSyncs.get(kind)?.()
        this.pendingSyncs.clear()
        for (const play of this.pendingPlays) play()
        this.pendingPlays = []
    }

    // A cada quadro, a ordem de desenho das personagens acompanha a altura da posição
    // de cada uma no tabuleiro (quem desce passa a ficar na frente), e a câmera
    // fica sabendo se a personagem que ela acompanha se mexeu
    update() {
        const boardHeight = this.maze.size * this.cellSize
        for (const sprite of this.characters.values()) sprite.updateDepth(boardHeight)
        this.reportFollowed()
    }

    // A câmera é do React (ela rola a página), mas é a cena que sabe
    // onde a personagem está no meio de um passo. A personagem acompanhada
    // passa a ser esta, e a primeira posição dela só é guardada.
    follow(characterId: string | null, onMove: (position: CharacterPosition) => void) {
        this.followed = characterId ? { id: characterId, onMove, last: null } : null
    }

    // Só o movimento conta: a cada quadro em que a personagem acompanhada mudou de lugar,
    // a cena avisa em que casa ela está
    private reportFollowed() {
        const followed = this.followed
        const sprite = followed && this.characters.get(followed.id)
        if (!followed || !sprite) return
        const { x, y } = sprite.container
        const last = followed.last
        followed.last = { x, y }
        if (!last || (last.x === x && last.y === y)) return
        followed.onMove({ x: x / this.cellSize - 0.5, y: y / this.cellSize - 0.5 })
    }

    // Uma sincronia antes de a cena montar espera por ela, e só a última de cada lista vale
    private sync(kind: SyncKind, apply: () => void) {
        if (this.isReady) apply()
        else this.pendingSyncs.set(kind, apply)
    }

    // Um efeito antes de a cena montar espera por ela, e todos valem, na ordem em que vieram
    private play(spawn: () => void) {
        if (this.isReady) spawn()
        else this.pendingPlays.push(spawn)
    }

    syncItems(items: MotivationItem[]) {
        this.sync("items", () => this.applyItems(items))
    }

    syncBarriers(barriers: Barrier[]) {
        this.barriers = barriers
        this.sync("barriers", () => this.applyBarriers(barriers))
    }

    syncCharacters(characters: CharacterDefinition[]) {
        this.sync("characters", () => this.applyCharacters(characters))
    }

    syncAuras(auras: CharacterAuras) {
        this.sync("auras", () => this.applyAuras(auras))
    }

    // Clarão de fogo do ataque em área. Cada explosão é tocada uma vez só, e quem chama é que
    // controla isso (a cena só desenha).
    playFireBurst(burst: FireBurst) {
        this.play(() => spawnFireBurst(this, this.cellSize, this.cellToPixel(burst.center), burst))
    }

    // O número de dano sobe acima da personagem atingida, que pisca no tom de dano.
    // Como cada explosão, isso é tocado uma vez só, e é quem chama que controla isso.
    // Quem foi eliminada também pisca, parada por um instante, antes de "fugir da mansão".
    playDamage(popup: DamagePopup) {
        this.play(() => {
            this.spawnNumber(popup.position, popup.amount, DAMAGE_PALETTE.popup, DAMAGE_POPUP_MS, DAMAGE_POPUP_RISE)
            const sprite = this.characters.get(popup.characterId) ?? this.defeated.get(popup.characterId)
            sprite?.flashDamage()
        })
    }

    // O vigor recuperado sobe acima da personagem revigorada, como o número do dano,
    // mas na cor da aura do quê a revigorou (afinidade ou item). Também é tocado uma vez só.
    playReinvigoration(popup: ReinvigorationPopup) {
        const colors = REINVIGORATION_PALETTE.popup[popup.source]
        this.play(() =>
            this.spawnNumber(popup.position, popup.amount, colors, REINVIGORATION_POPUP_MS, REINVIGORATION_POPUP_RISE),
        )
    }

    // A queda de um item que voltou ao tabuleiro.
    // O item já está na lista: aqui ele só é jogado para cair na casa dele.
    playItemDrop(itemId: string) {
        this.play(() => this.dropItem(itemId))
    }

    // A investida que vem na próxima troca de casa da personagem
    playCharge(run: ChargeRun) {
        this.charges.set(run.characterId, run)
    }

    // A personagem se vira para o alvo, a partir da casa em que está, ou da casa a que está indo:
    // se ainda estiver andando até lá, ela se vira ao chegar. Alvo que é outra personagem conta
    // pela casa em que ela está (ou para a qual está indo).
    playAim(aim: Aim) {
        const sprite = this.characters.get(aim.characterId)
        const target = typeof aim.target === "string" ? this.characters.get(aim.target)?.cell : aim.target
        if (!sprite || !target || samePosition(sprite.cell, target)) return
        sprite.aim(facingToward(sprite.cell, target))
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
        this.lastCharacters = characters
        const seen = new Set<string>()

        for (const character of characters) {
            seen.add(character.id)
            const target = this.cellToPixel(character.position)
            // Quem esgotou o turno inteiro (movimento e/ou ataque básico e habilidade)
            // fica translúcida para indicar isso
            const alpha = isSpent(character) ? MOVED_CHARACTER_ALPHA : 1

            let sprite = this.characters.get(character.id)
            if (!sprite) {
                sprite = new CharacterSprite(this, this.cellSize, character, character.position)
                sprite.setPosition(target.x, target.y)
                sprite.setAlpha(alpha)
                this.characters.set(character.id, sprite)
                continue
            }

            if (!samePosition(sprite.cell, character.position)) {
                this.moveSprite(sprite, character, characters)
                sprite.cell = { ...character.position }
            }
            sprite.fadeTo(alpha)
            sprite.sync(character)
        }

        // Quem saiu da lista foi eliminada / "foge da mansão".
        // Primeiro a barra de vigor fica toda preta, para mostrar que esvaziou,
        // e só depois de `CHARACTER_DEFEAT_MS` ela foge.
        for (const [id, sprite] of this.characters) {
            if (seen.has(id)) continue
            this.characters.delete(id)
            this.defeated.set(id, sprite)
            sprite.defeat()
            this.time.delayedCall(CHARACTER_DEFEAT_MS, () => {
                this.defeated.delete(id)
                this.flee(sprite, this.lastCharacters)
            })
        }
    }

    // A personagem eliminada corre para uma das quatro casas vizinhas, sorteada,
    // de preferência uma livre (sem ninguém, sem parede e sem barreira de outro time)
    private flee(sprite: CharacterSprite, characters: CharacterDefinition[]) {
        // As casas fechadas para o time dela: as barreiras dos outros times. As do próprio time ela atravessa.
        const closed = blockedCellsFor(sprite.color, this.barriers, characters)
        const isFree = (cell: CharacterPosition) =>
            isWalkable(this.maze, cell.x, cell.y) && !closed.has(positionKey(cell)) && !atPosition(characters, cell)
        const around = neighbors(sprite.cell)
        const free = around.filter(isFree)
        const to = pickRandom(free.length > 0 ? free : around)
        sprite.flee(this.cellToPixel(to), facingToward(sprite.cell, to))
    }

    // A personagem trocou de casa: corre, se uma investida foi anunciada para ela, ou caminha
    // casa a casa contornando as paredes e o que está fechado para o time dela
    private moveSprite(sprite: CharacterSprite, character: CharacterDefinition, characters: CharacterDefinition[]) {
        const from = sprite.cell
        const target = this.cellToPixel(character.position)
        const charge = this.charges.get(character.id)
        this.charges.delete(character.id)

        if (charge && samePosition(charge.to, character.position)) {
            sprite.run(target, facingToward(from, character.position), charge.durationMs)
            return
        }

        const blocked = blockedCellsFor(character.color, this.barriers, characters)
        const path = findPath(from, character.position, this.maze, blocked)
        if (path.length === 0) {
            sprite.place(target.x, target.y)
            return
        }
        // A cada passo, a personagem se vira para a casa seguinte
        sprite.walk(
            path.map((cell, index) => ({
                ...this.cellToPixel(cell),
                facing: facingToward(index === 0 ? from : path[index - 1], cell),
            })),
        )
    }

    // Acende e apaga as barreiras conforme a lista muda
    private applyBarriers(barriers: Barrier[]) {
        const seen = new Set<string>()

        for (const barrier of barriers) {
            seen.add(barrier.id)
            if (this.barrierSprites.has(barrier.id)) continue
            const sprite = buildBarrier(this, this.cellSize, this.cellToPixel(barrier.position), barrier)
            this.barrierSprites.set(barrier.id, sprite)
        }

        for (const [id, sprite] of this.barrierSprites) {
            if (seen.has(id)) continue
            this.barrierSprites.delete(id)
            fadeOutBarrier(this, sprite)
        }
    }

    // Cada personagem fica com a aura que a lista lhe dá, ou sem nenhuma
    private applyAuras(auras: CharacterAuras) {
        for (const [id, sprite] of this.characters) sprite.setAura(auras[id] ?? null)
    }

    // O número que sobe da casa e desaparece, em algarismos de pixel do tamanho dos da arte:
    // o dano em branco, o vigor recuperado na cor do quê revigorou
    private spawnNumber(
        position: CharacterPosition,
        amount: number,
        { fill, stroke }: { fill: string; stroke: string },
        durationMs: number,
        rise: number,
    ) {
        const cs = this.cellSize
        const { x, y } = this.cellToPixel(position)
        const label = this.add
            .image(x, y - cs * 0.12, numberTexture(this, amount, fill, stroke))
            .setOrigin(0.5, 1)
            .setScale(BOARD_ART_SCALE.character)
            .setVertexRoundMode(WHOLE_PIXELS)
            .setDepth(BOARD_DEPTHS.damage)

        this.tweens.add({
            targets: label,
            y: label.y - cs * rise,
            alpha: { from: 1, to: 0 },
            duration: durationMs,
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

    private buildItem(item: MotivationItem): Phaser.GameObjects.Container {
        const art = this.add
            .image(0, 0, itemTexture(item.key))
            .setScale(BOARD_ART_SCALE.item)
            .setVertexRoundMode(WHOLE_PIXELS)
        return this.add.container(0, 0, [art]).setDepth(BOARD_DEPTHS.item)
    }

    private cellToPixel(cell: CharacterPosition): CharacterPosition {
        return {
            x: cell.x * this.cellSize + this.cellSize / 2,
            y: cell.y * this.cellSize + this.cellSize / 2,
        }
    }
}
