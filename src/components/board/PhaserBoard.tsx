import React, { useEffect, useRef } from "react"
import Phaser from "phaser"
import type { Barrier, CharacterAuras, CharacterDefinition, MotivationItem } from "../../logic/types"
import type { Aim, ChargeRun, DamagePopup, FireBurst } from "../../logic/combat"
import type { Maze } from "../../logic/maze"
import { BoardScene } from "../../game/BoardScene"
import { BOARD_OVERFLOW } from "../../constants/rules"

interface PhaserBoardProps {
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
    droppedItemId: string | null
}

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
    const playedBurstsRef = useRef(new Set<string>())
    const playedDamageRef = useRef(new Set<string>())
    const playedChargesRef = useRef(new Set<string>())
    const playedAimsRef = useRef(new Set<string>())
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

    // Antes das personagens (a ordem dos efeitos é a de declaração): a cena precisa saber que a
    // troca de casa que chega junto é uma investida, e não uma caminhada
    useEffect(() => {
        for (const run of chargeRuns) {
            if (playedChargesRef.current.has(run.id)) continue
            playedChargesRef.current.add(run.id)
            sceneRef.current?.playCharge(run)
        }
    }, [chargeRuns])

    useEffect(() => {
        sceneRef.current?.syncCharacters(characters)
    }, [characters])

    // Depois das personagens (a ordem dos efeitos é a de declaração): a virada parte da casa em
    // que a personagem está, ou da casa a que ela está indo
    useEffect(() => {
        for (const aim of aims) {
            if (playedAimsRef.current.has(aim.id)) continue
            playedAimsRef.current.add(aim.id)
            sceneRef.current?.playAim(aim)
        }
    }, [aims])

    // Depois das personagens (a ordem dos efeitos é a de declaração): a aura entra no container
    // da personagem, que já precisa existir.
    useEffect(() => {
        sceneRef.current?.syncAuras(auras)
    }, [auras])

    // Uma explosão fica na lista depois de animada (a lista é estado da partida), então
    // os ids já tocados ficam guardados para o efeito não repetir a animação a cada render.
    useEffect(() => {
        for (const burst of fireBursts) {
            if (playedBurstsRef.current.has(burst.id)) continue
            playedBurstsRef.current.add(burst.id)
            sceneRef.current?.playFireBurst(burst)
        }
    }, [fireBursts])

    // Mesmo cuidado das explosões: a lista é estado da partida e volta a cada render,
    // então os ids já mostrados ficam guardados.
    useEffect(() => {
        for (const popup of damagePopups) {
            if (playedDamageRef.current.has(popup.id)) continue
            playedDamageRef.current.add(popup.id)
            sceneRef.current?.playDamage(popup)
        }
    }, [damagePopups])

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
