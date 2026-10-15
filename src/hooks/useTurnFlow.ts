import { useState, type Dispatch, type SetStateAction } from "react"
import type { CharacterColor, CharacterDefinition } from "../logic/types"
import { nextTurnIndex } from "../logic/initiative"

interface TurnFlowOptions {
    // Personagens como a partida começou, e a ordem de iniciativa sorteada para ela
    initialCharacters: CharacterDefinition[]
    turnOrder: string[]
    // Times sob comando do jogador: um só, os três, ou nenhum (assistindo)
    controlledColors: CharacterColor[]
}

export interface TurnFlow {
    characters: CharacterDefinition[]
    setCharacters: Dispatch<SetStateAction<CharacterDefinition[]>>
    round: number
    // Personagem da vez (null só enquanto a partida está terminando)
    activeCharacter: CharacterDefinition | null
    // A vez é de um time que o jogador comanda?
    isPlayerTurn: boolean
    // Cor de quem age agora, ou null quando quem age é a IA (ou o jogador só assiste)
    activeColor: CharacterColor | null
    // Personagens ainda em jogo, na ordem de iniciativa, para a faixa de turnos do HUD
    orderedCharacters: CharacterDefinition[]
    // Personagem que o jogador selecionou com o clique esquerdo
    selectedId: string | null
    setSelectedId: (id: string | null) => void
    // Passa a vez. Quem chama é que limpa o que estava em curso, daí o nome ser "avanço":
    // encerrar um turno de verdade é "endTurn", lá no contexto da partida.
    advanceTurn: () => void
    // A vez da personagem acabou de passar para quem? Útil para efeitos que dependem da ordem.
    turnIndex: number
}

// O estado que anda em círculos: as personagens, de quem é a vez e em que rodada a partida está.
export const useTurnFlow = ({ initialCharacters, turnOrder, controlledColors }: TurnFlowOptions): TurnFlow => {
    const [characters, setCharacters] = useState<CharacterDefinition[]>(initialCharacters)
    const [turnIndex, setTurnIndex] = useState(0)
    const [round, setRound] = useState(1)
    const [selectedId, setSelectedId] = useState<string | null>(null)

    const activeCharacter = characters.find((p) => p.id === turnOrder[turnIndex]) ?? null
    const isPlayerTurn = activeCharacter !== null && controlledColors.includes(activeCharacter.color)
    const activeColor = isPlayerTurn ? activeCharacter!.color : null
    const orderedCharacters = turnOrder
        .map((id) => characters.find((p) => p.id === id))
        .filter((p): p is CharacterDefinition => !!p)

    // Passa a vez para a próxima personagem em jogo da ordem. Quando a ordem dá a volta,
    // começa uma nova rodada e todas as personagens voltam a ter as duas ações.
    const advanceTurn = () => {
        const endingId = turnOrder[turnIndex]
        const inPlay = new Set(characters.map((p) => p.id))
        const next = nextTurnIndex(turnOrder, (id) => inPlay.has(id), turnIndex)
        if (!next) return

        setCharacters((prev) =>
            next.newRound
                ? // Rodada nova: todas recomeçam com a ação comum e a habilidade
                  prev.map((p) => ({ ...p, movedThisTurn: false, usedSkillThisTurn: false }))
                : // Encerrar fecha a vez da personagem: se tinha habilidade e não usou, perdeu
                  prev.map((p) => (p.id === endingId ? { ...p, movedThisTurn: true, usedSkillThisTurn: true } : p)),
        )
        if (next.newRound) setRound((prev) => prev + 1)
        setTurnIndex(next.index)
    }

    return {
        characters,
        setCharacters,
        round,
        activeCharacter,
        isPlayerTurn,
        activeColor,
        orderedCharacters,
        selectedId,
        setSelectedId,
        advanceTurn,
        turnIndex,
    }
}
