import React, { useEffect, useRef } from "react"
import Phaser from "phaser"
import type { Barrier, CharacterAuras, CharacterDefinition, MotivationItem } from "../../logic/types"
import type { Aim, ChargeRun, DamagePopup, FireBurst } from "../../logic/boardEffects"
import type { Maze } from "../../logic/maze"
import { BoardScene } from "../../game/BoardScene"
import { usePlayOnce } from "../../hooks/usePlayOnce"
import { BOARD_OVERFLOW } from "../../constants/rules"

// Tudo o que a cena desenha por cima das casas
export interface PhaserBoardProps {
    cellSize: number
    maze: Maze
    characters: CharacterDefinition[]
    items: MotivationItem[]
    barriers: Barrier[]
    fireBursts: FireBurst[]
    damagePopups: DamagePopup[]
    chargeRuns: ChargeRun[]
    aims: Aim[]
    auras: CharacterAuras
    // Item que caiu de volta no tabuleiro
    droppedItemId: string | null
}

// A cena do Phaser dentro do React: o jogo nasce uma vez, e cada mudança de estado é
// repassada a ela pelos efeitos abaixo. A ordem deles é a ordem em que a cena precisa saber
// das coisas: as personagens depois das investidas (uma troca de casa que chega junto com uma
// investida é corrida, não caminhada), e as viradas e as auras depois das personagens.
export const PhaserBoard: React.FC<PhaserBoardProps> = ({
    cellSize,
    maze,
    characters,
    items,
    barriers,
    fireBursts,
    damagePopups,
    chargeRuns,
    aims,
    auras,
    droppedItemId,
}) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<BoardScene | null>(null)
    // A cena passa da borda do tabuleiro, para não cortar o que sobe das casas da beirada
    const overflow = Math.round(cellSize * BOARD_OVERFLOW)
    const side = maze.size * cellSize + 2 * overflow

    useEffect(() => {
        if (!containerRef.current) return
        const scene = new BoardScene(cellSize, maze, overflow)
        sceneRef.current = scene
        const game = new Phaser.Game({
            type: Phaser.AUTO,
            parent: containerRef.current,
            width: side,
            height: side,
            transparent: true,
            banner: false,
            // Tudo em pixel, nada suavizado: nem as texturas ao mudar de tamanho, nem as bordas das
            // formas desenhadas (o fogo, as barreiras, as barras), nem o tabuleiro inteiro quando o
            // navegador o amplia (tela com escala ou zoom na página)
            pixelArt: true,
            scene,
        })
        return () => {
            sceneRef.current = null
            game.destroy(true)
        }
    }, [cellSize, maze, overflow, side])

    useEffect(() => {
        sceneRef.current?.syncItems(items)
    }, [items])

    // O item já precisa estar em cena para poder cair nela
    useEffect(() => {
        if (droppedItemId) sceneRef.current?.playItemDrop(droppedItemId)
    }, [droppedItemId])

    useEffect(() => {
        sceneRef.current?.syncBarriers(barriers)
    }, [barriers])

    usePlayOnce(chargeRuns, (run) => sceneRef.current?.playCharge(run))

    useEffect(() => {
        sceneRef.current?.syncCharacters(characters)
    }, [characters])

    usePlayOnce(aims, (aim) => sceneRef.current?.playAim(aim))

    // A aura entra no container da personagem, que já precisa existir
    useEffect(() => {
        sceneRef.current?.syncAuras(auras)
    }, [auras])

    usePlayOnce(fireBursts, (burst) => sceneRef.current?.playFireBurst(burst))
    usePlayOnce(damagePopups, (popup) => sceneRef.current?.playDamage(popup))

    return (
        <div
            ref={containerRef}
            style={{
                position: "absolute",
                top: -overflow,
                left: -overflow,
                width: side,
                height: side,
                pointerEvents: "none",
            }}
        />
    )
}
