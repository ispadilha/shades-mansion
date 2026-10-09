import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react"
import type { PieceColor, PieceDefinition } from "../logic/types"
import { affinityAtTurnStart, affinityDiceOf, reinvigoratedBy } from "../logic/affinity"
import { dieKind, rollSpec, sumDice } from "../logic/rolls"
import type { RollQueue } from "./useRolls"
import type { GameLog } from "./useGameLog"
import { useLanguage } from "./useLanguage"

interface AffinityOptions {
    pieces: PieceDefinition[]
    setPieces: Dispatch<SetStateAction<PieceDefinition[]>>
    // A peça da vez, e qual vez é esta: a afinidade é conferida uma vez, quando a vez começa
    activePiece: PieceDefinition | null
    turnKey: string
    rolls: RollQueue
    // Rolagem de time comandado por jogador espera o clique
    isManualRoll: (color: PieceColor) => boolean
    log: GameLog
}

// A afinidade: quando a vez de uma peça começa com a parceira de dupla encostada nela, e alguma
// das duas perdeu vigor, a dupla rola os dados de afinidade e as duas revigoram o que sair.
// Devolve as peças da dupla enquanto a rolagem acontece: são elas que ganham a aura.
export const useAffinity = ({
    pieces,
    setPieces,
    activePiece,
    turnKey,
    rolls,
    isManualRoll,
    log,
}: AffinityOptions): string[] => {
    const { t } = useLanguage()
    const [rolling, setRolling] = useState<string[]>([])

    // A vez cuja afinidade já foi conferida.
    // O efeito pode rodar de novo na mesma vez, mas a rolagem é uma só.
    const checkedRef = useRef<string | null>(null)

    // As peças mais recentes, para a conta do que cada uma ganhou quando a rolagem termina
    const piecesRef = useRef(pieces)
    useEffect(() => {
        piecesRef.current = pieces
    }, [pieces])

    useEffect(() => {
        if (!activePiece || checkedRef.current === turnKey) return
        checkedRef.current = turnKey

        const affinity = affinityAtTurnStart(activePiece, pieces)
        if (!affinity) return
        const { duo, partner } = affinity
        const dice = affinityDiceOf(activePiece, partner)
        const values = rollSpec(dice)
        const amount = sumDice(values)
        const both = [activePiece.id, partner.id]

        // A rolagem trava a partida até sair o resultado, inclusive a IA da peça da vez
        setRolling(both)
        rolls.setResolving(true)
        rolls.show(
            {
                id: `affinity-${turnKey}`,
                kind: dieKind(dice.sides),
                value: values,
                title: t("affinityRoll"),
                subtitle: `${t(duo.name)}: ${activePiece.id} ${t("and")} ${partner.id}`,
                outcome: { label: t("affinityReading"), tone: "good" },
                manual: isManualRoll(activePiece.color),
            },
            () => {
                // O que cada uma ganhou de fato: quem estava perto do máximo ganha menos
                const [gain, partnerGain] = both.map((id) => {
                    const piece = piecesRef.current.find((p) => p.id === id)
                    return piece ? reinvigoratedBy(piece, amount).vigor - piece.vigor : 0
                })
                setPieces((prev) => prev.map((p) => (both.includes(p.id) ? reinvigoratedBy(p, amount) : p)))
                log.affinity(activePiece.id, gain, partner.id, partnerGain)
                setRolling([])
                rolls.setResolving(false)
            },
        )
        // A afinidade é conferida quando a vez muda, e não a cada mudança das peças
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [turnKey, activePiece?.id])

    return rolling
}
