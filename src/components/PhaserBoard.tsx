import React, { useEffect, useRef } from "react"
import Phaser from "phaser"
import type { PieceDefinition, SpecialItem } from "../logic/types"
import type { FireBurst } from "../logic/combat"
import type { Maze } from "../logic/maze"
import { BoardScene } from "../game/BoardScene"

interface PhaserBoardProps {
    cellSize: number
    maze: Maze
    pieces: PieceDefinition[]
    items: SpecialItem[]
    fireBursts: FireBurst[]
}

export const PhaserBoard: React.FC<PhaserBoardProps> = ({ cellSize, maze, pieces, items, fireBursts }) => {
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

    useEffect(() => {
        sceneRef.current?.syncPieces(pieces)
    }, [pieces])

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
