import { useState } from "react"
import type { CharacterColor, TextKey } from "../logic/types"
import { useLanguage } from "./useLanguage"
import { MAX_LOG_ENTRIES } from "../constants/rules"

// O histórico de jogadas do HUD. Cada método monta uma frase no idioma da vez, então
// nenhuma tela precisa saber como uma jogada é escrita.
export interface GameLog {
    // As entradas já escritas, da mais antiga para a mais recente
    entries: string[]
    add: (entry: string) => void
    // "{time} usou {personagem} para {ação} [{alvo}]"
    usedTo: (color: CharacterColor, character: string, actionKey: TextKey, target?: string) => void
    // "{time} manipulou {personagem} para {ação} [{alvo}]"
    manipulatedTo: (color: CharacterColor, character: string, actionKey: TextKey, target?: string) => void
    reinvigorated: (color: CharacterColor, character: string) => void
    // "{personagem} (+x) e {parceira} (+y) revigoraram pela afinidade"
    affinity: (characterId: string, gain: number, partnerId: string, partnerGain: number) => void
    promoted: (color: CharacterColor, character: string, level: number) => void
    // Item que saiu de uma manipulação falha e caiu de volta no labirinto
    returned: (itemKey: string) => void
    attackHit: (attackerId: string, targetId: string, damage: number) => void
    attackGuarded: (attackerId: string, targetId: string, damage: number) => void
    attackDodged: (attackerId: string, targetId: string) => void
    manipulationRoll: (itemKey: string, success: boolean) => void
    // "{personagem} dissipou a barreira de {dona}", ou não conseguiu
    dispelRoll: (characterId: string, ownerId: string, success: boolean) => void
    barriersWoreOff: (characterId: string) => void
    eliminated: (characterId: string) => void
    defeated: (color: CharacterColor) => void
}

export const useGameLog = (): GameLog => {
    const { t, tTeam } = useLanguage()
    const [entries, setEntries] = useState<string[]>([])

    // Aceita novas entradas e descarta as mais antigas além de MAX_LOG_ENTRIES
    const add = (entry: string) => {
        setEntries((prev) => [...prev.slice(-(MAX_LOG_ENTRIES - 1)), entry])
    }

    // Movimento simples é a exceção do formato: "{time} moveu {personagem}".
    const usedTo = (color: CharacterColor, character: string, actionKey: TextKey, target?: string) => {
        if (actionKey === "toMove") {
            add(`${tTeam(color)} ${t("verbMoved")} ${character}`)
            return
        }
        const base = `${tTeam(color)} ${t("verbUsed")} ${character} ${t(actionKey)}`
        add(target ? `${base} ${target}` : base)
    }

    const manipulatedTo = (color: CharacterColor, character: string, actionKey: TextKey, target?: string) => {
        const base = `${tTeam(color)} ${t("verbManipulated")} ${character} ${t(actionKey)}`
        add(target ? `${base} ${target}` : base)
    }

    const reinvigorated = (color: CharacterColor, character: string) => {
        add(`${tTeam(color)} ${t("verbReinvigorated")} ${character}`)
    }

    // Quanto a personagem perdeu de vigor, no fim da frase: "xX acertou yY (−7)"
    const vigorLoss = (damage: number) => ` (−${damage})`

    // E quanto ganhou, logo depois do nome: "xA (+3) e xB (+5) revigoraram pela afinidade"
    const vigorGain = (amount: number) => ` (+${amount})`

    const affinity = (characterId: string, gain: number, partnerId: string, partnerGain: number) => {
        add(`${characterId}${vigorGain(gain)} ${t("and")} ${partnerId}${vigorGain(partnerGain)} ${t("verbReinvigoratedByAffinity")}`)
    }

    const promoted = (color: CharacterColor, character: string, level: number) => {
        add(`${tTeam(color)} ${t("verbPromoted")} ${character} ${t("toLevel")} ${level}`)
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

    const dispelRoll = (characterId: string, ownerId: string, success: boolean) => {
        add(`${characterId} ${t(success ? "verbDispelledBarrierOf" : "verbFailedToDispelBarrierOf")} ${ownerId}`)
    }

    const barriersWoreOff = (characterId: string) => {
        add(`${characterId} ${t("barriersWoreOff")}`)
    }

    const eliminated = (characterId: string) => {
        add(`${characterId} ${t("wasEliminated")}!`)
    }

    const defeated = (color: CharacterColor) => {
        add(`${tTeam(color)} ${t("wasDefeated")}!`)
    }

    return {
        entries,
        add,
        usedTo,
        manipulatedTo,
        reinvigorated,
        affinity,
        promoted,
        returned,
        attackHit,
        attackGuarded,
        attackDodged,
        manipulationRoll,
        dispelRoll,
        barriersWoreOff,
        eliminated,
        defeated,
    }
}
