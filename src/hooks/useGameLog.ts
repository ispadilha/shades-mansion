import { useState } from "react"
import type { CharacterColor, TextKey } from "../logic/types"
import { useLanguage } from "./useLanguage"
import { MAX_LOG_ENTRIES } from "../constants/rules"

// O histórico de jogadas do HUD. Cada método monta uma frase no idioma da vez, então
// nenhuma tela precisa saber como uma jogada é escrita.
// Os métodos recebem as chaves do código ("dA")
// e a frase sai com os nomes que o jogador conhece.
export interface GameLog {
    // As entradas já escritas, da mais antiga para a mais recente
    entries: string[]
    add: (entry: string) => void
    // "{time} usou {personagem} para {ação} [{alvo}]"
    usedTo: (color: CharacterColor, character: string, actionKey: TextKey, target?: string) => void
    // "{time} manipulou {personagem} para {ação} [{alvo}]"
    manipulatedTo: (color: CharacterColor, character: string, actionKey: TextKey, target?: string) => void
    // "{time} usou {item} para manipular {personagem}"
    usedToManipulate: (color: CharacterColor, itemKey: string) => void
    reinvigorated: (color: CharacterColor, character: string) => void
    // "{personagem} (+x) e {parceira} (+y) revigoraram pela afinidade"
    affinity: (characterId: string, gain: number, partnerId: string, partnerGain: number) => void
    promoted: (color: CharacterColor, character: string, level: number) => void
    // Item que saiu de uma manipulação falha e caiu de volta no labirinto
    returned: (itemKey: string) => void
    attackHit: (attackerId: string, targetId: string, damage: number) => void
    attackGuarded: (attackerId: string, targetId: string, damage: number) => void
    attackDodged: (attackerId: string, targetId: string) => void
    manipulationRoll: (characterId: string, success: boolean) => void
    // "{personagem} dissipou a barreira de {dona}", ou não conseguiu
    dispelRoll: (characterId: string, ownerId: string, success: boolean) => void
    barriersWoreOff: (characterId: string) => void
    eliminated: (characterId: string) => void
    defeated: (color: CharacterColor) => void
}

export const useGameLog = (): GameLog => {
    const { t, tTeam, tCharacterName, tItemName } = useLanguage()
    const [entries, setEntries] = useState<string[]>([])

    // Aceita novas entradas e descarta as mais antigas além de MAX_LOG_ENTRIES
    const add = (entry: string) => {
        setEntries((prev) => [...prev.slice(-(MAX_LOG_ENTRIES - 1)), entry])
    }

    // O alvo da ação, pelo nome:
    // o item que a personagem foi coletar, ou a personagem que ela atacou ou imitou
    const targetName = (actionKey: TextKey, target: string) =>
        actionKey === "toCollectItem" ? tItemName(target) : tCharacterName(target)

    // Movimento simples é a exceção do formato: "{time} moveu {personagem}".
    const usedTo = (color: CharacterColor, character: string, actionKey: TextKey, target?: string) => {
        if (actionKey === "toMove") {
            add(`${tTeam(color)} ${t("verbMoved")} ${tCharacterName(character)}`)
            return
        }
        const base = `${tTeam(color)} ${t("verbUsed")} ${tCharacterName(character)} ${t(actionKey)}`
        add(target ? `${base} ${targetName(actionKey, target)}` : base)
    }

    const manipulatedTo = (color: CharacterColor, character: string, actionKey: TextKey, target?: string) => {
        const base = `${tTeam(color)} ${t("verbManipulated")} ${tCharacterName(character)} ${t(actionKey)}`
        add(target ? `${base} ${targetName(actionKey, target)}` : base)
    }

    // O item é o da personagem manipulada: a chave dos dois é a mesma
    const usedToManipulate = (color: CharacterColor, itemKey: string) => {
        add(`${tTeam(color)} ${t("verbUsed")} ${tItemName(itemKey)} ${t("toManipulate")} ${tCharacterName(itemKey)}`)
    }

    const reinvigorated = (color: CharacterColor, character: string) => {
        add(`${tTeam(color)} ${t("verbReinvigorated")} ${tCharacterName(character)}`)
    }

    // Quanto a personagem perdeu de vigor, no fim da frase: "xX acertou yY (−7)"
    const vigorLoss = (damage: number) => ` (−${damage})`

    // E quanto ganhou, logo depois do nome: "xA (+3) e xB (+5) revigoraram pela afinidade"
    const vigorGain = (amount: number) => ` (+${amount})`

    const affinity = (characterId: string, gain: number, partnerId: string, partnerGain: number) => {
        const character = `${tCharacterName(characterId)}${vigorGain(gain)}`
        const partner = `${tCharacterName(partnerId)}${vigorGain(partnerGain)}`
        add(`${character} ${t("and")} ${partner} ${t("verbReinvigoratedByAffinity")}`)
    }

    const promoted = (color: CharacterColor, character: string, level: number) => {
        add(`${tTeam(color)} ${t("verbPromoted")} ${tCharacterName(character)} ${t("toLevel")} ${level}`)
    }

    const returned = (itemKey: string) => {
        add(`${tItemName(itemKey)} ${t("itemFellBack")}`)
    }

    const attackHit = (attackerId: string, targetId: string, damage: number) => {
        add(`${tCharacterName(attackerId)} ${t("verbHit")} ${tCharacterName(targetId)}${vigorLoss(damage)}`)
    }

    const attackGuarded = (attackerId: string, targetId: string, damage: number) => {
        add(`${tCharacterName(targetId)} ${t("verbGuarded")} ${tCharacterName(attackerId)}${vigorLoss(damage)}`)
    }

    const attackDodged = (attackerId: string, targetId: string) => {
        add(`${tCharacterName(targetId)} ${t("verbDodged")} ${tCharacterName(attackerId)}`)
    }

    const manipulationRoll = (characterId: string, success: boolean) => {
        add(`${tCharacterName(characterId)} ${t(success ? "verbFellUnderManipulation" : "verbResistedManipulation")}`)
    }

    const dispelRoll = (characterId: string, ownerId: string, success: boolean) => {
        const verb = t(success ? "verbDispelledBarrierOf" : "verbFailedToDispelBarrierOf")
        add(`${tCharacterName(characterId)} ${verb} ${tCharacterName(ownerId)}`)
    }

    const barriersWoreOff = (characterId: string) => {
        add(`${tCharacterName(characterId)} ${t("barriersWoreOff")}`)
    }

    const eliminated = (characterId: string) => {
        add(`${tCharacterName(characterId)} ${t("wasEliminated")}!`)
    }

    const defeated = (color: CharacterColor) => {
        add(`${tTeam(color)} ${t("wasDefeated")}!`)
    }

    return {
        entries,
        add,
        usedTo,
        manipulatedTo,
        usedToManipulate,
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
