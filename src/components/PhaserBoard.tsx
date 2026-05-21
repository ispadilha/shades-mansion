import React, { useEffect, useRef } from "react"
import Phaser from "phaser"
import type { PieceDefinition, SpecialItem } from "../logic/types"
import { BoardScene } from "../game/BoardScene"

interface PhaserBoardProps {
    boardSize: number
    cellSize: number
    pieces: PieceDefinition[]
    items: SpecialItem[]
}

export const PhaserBoard: React.FC<PhaserBoardProps> = ({ boardSize, cellSize, pieces, items }) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<BoardScene | null>(null)

    useEffect(() => {
        if (!containerRef.current) return
        const scene = new BoardScene(cellSize)
        sceneRef.current = scene
        const game = new Phaser.Game({
            type: Phaser.AUTO,
            parent: containerRef.current,
            width: boardSize * cellSize,
            height: boardSize * cellSize,
            transparent: true,
            banner: false,
            scene,
        })
        return () => {
            sceneRef.current = null
            game.destroy(true)
        }
    }, [boardSize, cellSize])

    useEffect(() => {
        sceneRef.current?.syncItems(items)
    }, [items])

    useEffect(() => {
        sceneRef.current?.syncPieces(pieces)
    }, [pieces])

    return (
        <div
            ref={containerRef}
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: boardSize * cellSize,
                height: boardSize * cellSize,
                pointerEvents: "none",
            }}
        />
    )
}
