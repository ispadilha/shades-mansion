import type { Dispatch, SetStateAction } from "react"
import type { Inventories, MotivationItemKey, PieceColor, PieceDefinition } from "../logic/types"
import { itemKeyColor } from "../logic/types"
import { itemUseFor, promoted, reinvigorated } from "../logic/items"
import type { CombatResolution } from "./useCombatResolution"
import type { RollQueue } from "./useRolls"
import type { GameLog } from "./useGameLog"

// A tentativa de manipular uma peça de outro time, enquanto ela dura
export interface Manipulation {
    // O item gasto na tentativa. A chave dele é o id da peça que ele comanda.
    itemKey: MotivationItemKey
    // Quem está comandando
    color: PieceColor
}

interface ItemActionsOptions {
    pieces: PieceDefinition[]
    setPieces: Dispatch<SetStateAction<PieceDefinition[]>>
    // Cor de quem age agora. Null quando a vez não é do jogador.
    activeColor: PieceColor | null
    // Time cujo inventário o HUD mostra: nem sempre é o da vez
    inventoryColor: PieceColor | null
    inventories: Inventories
    removeFromInventory: (color: PieceColor, key: MotivationItemKey) => void
    returnToInventory: (color: PieceColor, key: MotivationItemKey) => void
    setSelectedId: (id: string | null) => void
    closeInventory: () => void
    setManipulation: (manipulation: Manipulation | null) => void
    rolls: RollQueue
    combat: CombatResolution
    log: GameLog
}

export interface ItemActions {
    // Item do próprio time: revigora a peça atingida, ou promove a que está inteira
    useOwnItem: (key: MotivationItemKey) => void
    // Item de outro time: serve para tentar manipular a peça
    useManipulationItem: (key: MotivationItemKey) => void
    // Desistir da manipulação. O item volta para o inventário.
    cancelManipulation: (manipulation: Manipulation | null) => void
}

// O que o jogador faz com os itens no inventário.
export const useItemActions = ({
    pieces,
    setPieces,
    activeColor,
    inventoryColor,
    inventories,
    removeFromInventory,
    returnToInventory,
    setSelectedId,
    closeInventory,
    setManipulation,
    rolls,
    combat,
    log,
}: ItemActionsOptions): ItemActions => {
    const useOwnItem = (key: MotivationItemKey) => {
        // Gastar item é jogada: só na vez de quem comanda, e não no meio de uma rolagem.
        // O botão do HUD já fica desabilitado fora disso. Aqui é a regra em si.
        if (!activeColor || rolls.resolving) return
        if (!inventoryColor || !inventories[inventoryColor].includes(key)) return
        const target = pieces.find((p) => p.id === key)
        const use = itemUseFor(key, target, inventoryColor)
        if (!target || (use !== "reinvigorate" && use !== "promote")) return

        const after = use === "reinvigorate" ? reinvigorated(target) : promoted(target)
        setPieces((prev) => prev.map((p) => (p.id === key ? after : p)))
        removeFromInventory(inventoryColor, key)
        if (use === "reinvigorate") log.reinvigorated(inventoryColor, key)
        else log.promoted(inventoryColor, key, after.level)
    }

    const useManipulationItem = (key: MotivationItemKey) => {
        if (!activeColor || rolls.resolving) return
        if (itemKeyColor(key) === activeColor) return
        if (!inventories[activeColor].includes(key)) return
        if (!pieces.some((p) => p.id === key)) return

        // O item sai do inventário na tentativa. A moeda decide se a peça obedece:
        // dando certo, ela fica selecionada e o próximo mover/atacar é a ação forçada.
        // Falhando, o item cai de volta no tabuleiro.
        const color = activeColor
        closeInventory()
        removeFromInventory(color, key)
        log.usedTo(color, key, "toManipulate")
        combat.resolveManipulation(color, key, (success) => {
            if (!success) return
            setManipulation({ itemKey: key, color })
            setSelectedId(key)
        })
    }

    const cancelManipulation = (manipulation: Manipulation | null) => {
        if (manipulation) returnToInventory(manipulation.color, manipulation.itemKey)
        setManipulation(null)
        setSelectedId(null)
    }

    return { useOwnItem, useManipulationItem, cancelManipulation }
}
