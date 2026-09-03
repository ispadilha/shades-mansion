import React, { useEffect, useRef } from "react"
import Phaser from "phaser"
import type { PieceAuras, PieceDefinition, SpecialItem } from "../../logic/types"
import type { FireBurst } from "../../logic/combat"
import type { Maze } from "../../logic/maze"
import { BoardScene } from "../../game/BoardScene"

interface PhaserBoardProps {
    cellSize: number
    maze: Maze
    pieces: PieceDefinition[]
    items: SpecialItem[]
    fireBursts: FireBurst[]
    auras: PieceAuras
    droppedItemId: string | null
}

export const PhaserBoard: React.FC<PhaserBoardProps> = ({
    cellSize,
    maze,
    pieces,
    items,
    fireBursts,
    auras,
    droppedItemId,
}) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<BoardScene | null>(null)
    const playedBurstsRef = useRef(new Set<string>())

    useEffect(() => {
        if (!containerRef.current) return
        const scene = new BoardScene(cellSize, maze)
        sceneRef.current = scene
        const game = new Phaser.Game({
            type: Phaser.AUTO,
            parent: containerRef.current,
            width: maze.size * cellSize,
            height: maze.size * cellSize,
            transparent: true,
            banner: false,
            scene,
        })
        return () => {
            sceneRef.current = null
            game.destroy(true)
        }
    }, [cellSize, maze])

    useEffect(() => {
        sceneRef.current?.syncItems(items)
    }, [items])

    // O item já precisa estar em cena para poder cair nela
    useEffect(() => {
        if (droppedItemId) sceneRef.current?.playItemDrop(droppedItemId)
    }, [droppedItemId])

    useEffect(() => {
        sceneRef.current?.syncPieces(pieces)
    }, [pieces])

    // Depois das peças (a ordem dos efeitos é a de declaração): a aura entra no container
    // da peça, que já precisa existir.
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

    return (
        <div
            ref={containerRef}
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: maze.size * cellSize,
                height: maze.size * cellSize,
                pointerEvents: "none",
            }}
        />
    )
}
