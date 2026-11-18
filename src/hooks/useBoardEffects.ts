import { useState } from "react"
import type { Aim, ChargeRun, DamagePopup, FireBurst, ReinvigorationPopup } from "../logic/boardEffects"
import {
    MAX_AIMS,
    MAX_CHARGE_RUNS,
    MAX_DAMAGE_POPUPS,
    MAX_FIRE_BURSTS,
    MAX_REINVIGORATION_POPUPS,
} from "../constants/rules"

export interface BoardEffects {
    fireBursts: FireBurst[]
    damagePopups: DamagePopup[]
    reinvigorationPopups: ReinvigorationPopup[]
    chargeRuns: ChargeRun[]
    aims: Aim[]
    addFireBurst: (burst: FireBurst) => void
    addDamagePopups: (popups: DamagePopup[]) => void
    addReinvigorationPopups: (popups: ReinvigorationPopup[]) => void
    addChargeRun: (run: ChargeRun) => void
    addAim: (aim: Aim) => void
}

// As últimas entradas de uma lista, com as novas no fim. Uma lista de efeitos só existe para a
// cena não tocar de novo o que já tocou, então não precisa guardar mais do que isso.
const keepLast = <T>(max: number, previous: T[], entries: T[]) => [...previous.slice(-max + entries.length), ...entries]

// As listas de efeitos que a cena do tabuleiro anima: as explosões de fogo, os números de dano
// e de vigor recuperado, as investidas e as viradas para o alvo. Quem resolve a jogada acrescenta.
// A cena toca cada entrada uma vez só, pelo id.
export const useBoardEffects = (): BoardEffects => {
    const [fireBursts, setFireBursts] = useState<FireBurst[]>([])
    const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([])
    const [reinvigorationPopups, setReinvigorationPopups] = useState<ReinvigorationPopup[]>([])
    const [chargeRuns, setChargeRuns] = useState<ChargeRun[]>([])
    const [aims, setAims] = useState<Aim[]>([])

    return {
        fireBursts,
        damagePopups,
        reinvigorationPopups,
        chargeRuns,
        aims,
        addFireBurst: (burst) => setFireBursts((prev) => keepLast(MAX_FIRE_BURSTS, prev, [burst])),
        addDamagePopups: (popups) => setDamagePopups((prev) => keepLast(MAX_DAMAGE_POPUPS, prev, popups)),
        addReinvigorationPopups: (popups) =>
            setReinvigorationPopups((prev) => keepLast(MAX_REINVIGORATION_POPUPS, prev, popups)),
        addChargeRun: (run) => setChargeRuns((prev) => keepLast(MAX_CHARGE_RUNS, prev, [run])),
        addAim: (aim) => setAims((prev) => keepLast(MAX_AIMS, prev, [aim])),
    }
}
