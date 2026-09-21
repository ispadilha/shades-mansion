import { useState, type Dispatch, type SetStateAction } from "react"
import type { PieceColor, PieceDefinition } from "../logic/types"
import { nextTurnIndex } from "../logic/initiative"

interface TurnFlowOptions {
    // Peças como a partida começou, e a ordem de iniciativa sorteada para ela
    initialPieces: PieceDefinition[]
    turnOrder: string[]
    // Times sob comando do jogador: um só, os três, ou nenhum (assistindo)
    controlledColors: PieceColor[]
}

export interface TurnFlow {
    pieces: PieceDefinition[]
    setPieces: Dispatch<SetStateAction<PieceDefinition[]>>
    round: number
    // Peça da vez (null só enquanto a partida está terminando)
    activePiece: PieceDefinition | null
    // A vez é de um time que o jogador comanda?
    isPlayerTurn: boolean
    // Cor de quem age agora, ou null quando quem age é a IA (ou o jogador só assiste)
    activeColor: PieceColor | null
    // Peças ainda em jogo, na ordem de iniciativa, para a faixa de turnos do HUD
    orderedPieces: PieceDefinition[]
    // Peça que o jogador selecionou com o clique esquerdo
    selectedId: string | null
    setSelectedId: (id: string | null) => void
    // Passa a vez. Quem chama é que limpa o que estava em curso, daí o nome ser "avanço":
    // encerrar um turno de verdade é "endTurn", lá no contexto da partida.
    advanceTurn: () => void
    // A vez da peça acabou de passar para quem? Útil para efeitos que dependem da ordem.
    turnIndex: number
}

// O estado que anda em círculos: as peças, de quem é a vez e em que rodada a partida está.
export const useTurnFlow = ({ initialPieces, turnOrder, controlledColors }: TurnFlowOptions): TurnFlow => {
    const [pieces, setPieces] = useState<PieceDefinition[]>(initialPieces)
    const [turnIndex, setTurnIndex] = useState(0)
    const [round, setRound] = useState(1)
    const [selectedId, setSelectedId] = useState<string | null>(null)

    const activePiece = pieces.find((p) => p.id === turnOrder[turnIndex]) ?? null
    const isPlayerTurn = activePiece !== null && controlledColors.includes(activePiece.color)
    const activeColor = isPlayerTurn ? activePiece!.color : null
    const orderedPieces = turnOrder
        .map((id) => pieces.find((p) => p.id === id))
        .filter((p): p is PieceDefinition => !!p)

    // Passa a vez para a próxima peça em jogo da ordem. Quando a ordem dá a volta,
    // começa uma nova rodada e todas as peças voltam a ter as duas ações.
    const advanceTurn = () => {
        const endingId = turnOrder[turnIndex]
        const inPlay = new Set(pieces.map((p) => p.id))
        const next = nextTurnIndex(turnOrder, (id) => inPlay.has(id), turnIndex)
        if (!next) return

        setPieces((prev) =>
            next.newRound
                ? // Rodada nova: todas recomeçam com a ação comum e a habilidade
                  prev.map((p) => ({ ...p, movedThisTurn: false, usedSkillThisTurn: false }))
                : // Encerrar fecha a vez da peça: se tinha habilidade e não usou, perdeu
                  prev.map((p) => (p.id === endingId ? { ...p, movedThisTurn: true, usedSkillThisTurn: true } : p)),
        )
        if (next.newRound) setRound((prev) => prev + 1)
        setTurnIndex(next.index)
    }

    return {
        pieces,
        setPieces,
        round,
        activePiece,
        isPlayerTurn,
        activeColor,
        orderedPieces,
        selectedId,
        setSelectedId,
        advanceTurn,
        turnIndex,
    }
}
