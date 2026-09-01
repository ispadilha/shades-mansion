import { useState } from "react"
import type { PieceColor, TextKey } from "../logic/types"
import { useLanguage } from "./useLanguage"
import { MAX_LOG_ENTRIES } from "../constants/rules"

// O histórico de jogadas do HUD. Cada método monta uma frase no idioma da vez, então
// nenhuma tela precisa saber como uma jogada é escrita.
export interface GameLog {
    // As entradas já escritas, da mais antiga para a mais recente
    entries: string[]
    add: (entry: string) => void
    // "{time} usou {peça} para {ação} [{alvo}]"
    usedTo: (color: PieceColor, piece: string, actionKey: TextKey, target?: string) => void
    // "{time} manipulou {peça} para {ação} [{alvo}]"
    manipulatedTo: (color: PieceColor, piece: string, actionKey: TextKey, target?: string) => void
    healed: (color: PieceColor, piece: string) => void
    // Resultado da moeda de ataque
    attackRoll: (attackerId: string, targetId: string, hit: boolean) => void
    // Resultado da moeda de manipulação
    manipulationRoll: (itemKey: string, success: boolean) => void
    // Peças pegas de tabela pelo fogo do ataque em área
    burned: (pieceIds: string[]) => void
    eliminated: (pieceId: string) => void
    defeated: (color: PieceColor) => void
}

export const useGameLog = (): GameLog => {
    const { t, tTeam } = useLanguage()
    const [entries, setEntries] = useState<string[]>([])

    // Aceita novas entradas e descarta as mais antigas além de MAX_LOG_ENTRIES
    const add = (entry: string) => {
        setEntries((prev) => [...prev.slice(-(MAX_LOG_ENTRIES - 1)), entry])
    }

    // Movimento simples é a exceção do formato: "{time} moveu {peça}".
    const usedTo = (color: PieceColor, piece: string, actionKey: TextKey, target?: string) => {
        if (actionKey === "toMove") {
            add(`${tTeam(color)} ${t("verbMoved")} ${piece}`)
            return
        }
        const base = `${tTeam(color)} ${t("verbUsed")} ${piece} ${t(actionKey)}`
        add(target ? `${base} ${target}` : base)
    }

    const manipulatedTo = (color: PieceColor, piece: string, actionKey: TextKey, target?: string) => {
        const base = `${tTeam(color)} ${t("verbManipulated")} ${piece} ${t(actionKey)}`
        add(target ? `${base} ${target}` : base)
    }

    const healed = (color: PieceColor, piece: string) => {
        add(`${tTeam(color)} ${t("verbHealed")} ${piece}`)
    }

    const attackRoll = (attackerId: string, targetId: string, hit: boolean) => {
        add(`${attackerId} ${t(hit ? "verbHit" : "verbMissed")} ${targetId}`)
    }

    const manipulationRoll = (itemKey: string, success: boolean) => {
        add(`${itemKey} ${t(success ? "verbFellUnderManipulation" : "verbResistedManipulation")}`)
    }

    // O alvo principal já entrou no log pela moeda de ataque
    const burned = (pieceIds: string[]) => {
        for (const id of pieceIds) add(`${id} ${t("wasBurned")}`)
    }

    const eliminated = (pieceId: string) => {
        add(`${pieceId} ${t("wasEliminated")}!`)
    }

    const defeated = (color: PieceColor) => {
        add(`${tTeam(color)} ${t("wasDefeated")}!`)
    }

    return { entries, add, usedTo, manipulatedTo, healed, attackRoll, manipulationRoll, burned, eliminated, defeated }
}
