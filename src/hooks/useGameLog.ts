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
    reinvigorated: (color: PieceColor, piece: string) => void
    promoted: (color: PieceColor, piece: string, level: number) => void
    // Item que saiu de uma manipulação falha e caiu de volta no labirinto
    returned: (itemKey: string) => void
    // Golpe que passou inteiro pela defesa
    attackHit: (attackerId: string, targetId: string, damage: number) => void
    // Golpe aparado: o defensor levou metade
    attackGuarded: (attackerId: string, targetId: string, damage: number) => void
    // Golpe desviado
    attackDodged: (attackerId: string, targetId: string) => void
    // Resultado da moeda de manipulação
    manipulationRoll: (itemKey: string, success: boolean) => void
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

    const reinvigorated = (color: PieceColor, piece: string) => {
        add(`${tTeam(color)} ${t("verbReinvigorated")} ${piece}`)
    }

    // Quanto a peça perdeu de vigor, no fim da frase: "xX acertou yY (−7)"
    const vigorLoss = (damage: number) => ` (−${damage})`

    const promoted = (color: PieceColor, piece: string, level: number) => {
        add(`${tTeam(color)} ${t("verbPromoted")} ${piece} ${t("toLevel")} ${level}`)
    }

    const returned = (itemKey: string) => {
        add(`${itemKey} ${t("itemFellBack")}`)
    }

    const attackHit = (attackerId: string, targetId: string, damage: number) => {
        add(`${attackerId} ${t("verbHit")} ${targetId}${vigorLoss(damage)}`)
    }

    const attackGuarded = (attackerId: string, targetId: string, damage: number) => {
        add(`${targetId} ${t("verbGuarded")} ${attackerId}${vigorLoss(damage)}`)
    }

    const attackDodged = (attackerId: string, targetId: string) => {
        add(`${targetId} ${t("verbDodged")} ${attackerId}`)
    }

    const manipulationRoll = (itemKey: string, success: boolean) => {
        add(`${itemKey} ${t(success ? "verbFellUnderManipulation" : "verbResistedManipulation")}`)
    }

    const eliminated = (pieceId: string) => {
        add(`${pieceId} ${t("wasEliminated")}!`)
    }

    const defeated = (color: PieceColor) => {
        add(`${tTeam(color)} ${t("wasDefeated")}!`)
    }

    return {
        entries,
        add,
        usedTo,
        manipulatedTo,
        reinvigorated,
        promoted,
        returned,
        attackHit,
        attackGuarded,
        attackDodged,
        manipulationRoll,
        eliminated,
        defeated,
    }
}
