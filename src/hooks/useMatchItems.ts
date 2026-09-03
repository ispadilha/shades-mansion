import { useEffect, useRef, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { Inventories, PieceColor, PieceDefinition, PiecePosition, MotivationItem, MotivationItemKey } from "../logic/types"
import type { Maze } from "../logic/maze"
import { atPosition } from "../logic/grid"
import { randomFreeCell } from "../logic/setup"

// Os itens espalhados pelo labirinto e os inventários dos três times. Um item sai do
// tabuleiro e entra no inventário quando a peça termina de caminhar até a casa dele.
export interface MatchItems {
    items: MotivationItem[]
    inventories: Inventories
    setInventories: Dispatch<SetStateAction<Inventories>>
    // O item que está em uma casa agora
    itemAt: (position: PiecePosition) => MotivationItem | undefined
    // Coleta agendada para quando a peça chegar na casa (delay = nº de passos × STEP_MS)
    schedulePickup: (color: PieceColor, position: PiecePosition, delayMs: number) => void
    removeFromInventory: (color: PieceColor, key: MotivationItemKey) => void
    // Devolve um item ao labirinto, em uma casa livre sorteada. Null se não sobrou casa.
    dropOnBoard: (key: MotivationItemKey, maze: Maze, pieces: PieceDefinition[]) => MotivationItem | null
}

export const useMatchItems = (initialItems: MotivationItem[]): MatchItems => {
    const [items, setItems] = useState<MotivationItem[]>(initialItems)
    const [inventories, setInventories] = useState<Inventories>({ light: [], dark: [], gray: [] })

    // A coleta é resolvida depois da caminhada, então ela consulta a lista em ref: o que
    // vale é o estado do momento da chegada, e não o do render que agendou.
    const itemsRef = useRef(items)
    useEffect(() => {
        itemsRef.current = items
    }, [items])

    const itemAt = (position: PiecePosition) => atPosition(itemsRef.current, position)

    const schedulePickup = (color: PieceColor, position: PiecePosition, delayMs: number) => {
        const item = itemAt(position)
        if (!item) return
        window.setTimeout(() => {
            setItems((prev) => prev.filter((i) => i.id !== item.id))
            setInventories((prev) => ({ ...prev, [color]: [...prev[color], item.key] }))
        }, delayMs)
    }

    const removeFromInventory = (color: PieceColor, key: MotivationItemKey) => {
        setInventories((prev) => {
            const inv = [...prev[color]]
            const idx = inv.indexOf(key)
            if (idx >= 0) inv.splice(idx, 1)
            return { ...prev, [color]: inv }
        })
    }

    const dropOnBoard = (key: MotivationItemKey, maze: Maze, pieces: PieceDefinition[]): MotivationItem | null => {
        const position = randomFreeCell(maze, pieces, itemsRef.current)
        if (!position) return null

        const item: MotivationItem = { id: `item-${key}-drop-${Date.now()}`, key, position }
        setItems((prev) => [...prev, item])
        return item
    }

    return { items, inventories, setInventories, itemAt, schedulePickup, removeFromInventory, dropOnBoard }
}
