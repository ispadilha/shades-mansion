import { useEffect, useRef, useState } from "react"
import type { MotivationItem, PieceColor, PieceDefinition } from "../logic/types"
import type { Maze } from "../logic/maze"
import { useBoardCamera, type CameraFocus } from "./useBoardCamera"
import { ITEM_DROP_HOLD_MS } from "../constants/rules"

interface MatchFocusOptions {
    maze: Maze
    pieces: PieceDefinition[]
    // Peça da vez: é nela que a câmera descansa quando nada mais rouba o foco
    activePieceId: string | null
    // Time do jogador, para a câmera começar perto da base dele
    homeColor: PieceColor | null
    // Há manipulação em curso? Enquanto houver, o foco é da peça manipulada
    manipulating: boolean
    // Rolagem em andamento segura a câmera onde a ação está acontecendo
    resolving: boolean
}

export interface MatchFocus {
    // A viewport rolável do tabuleiro
    scrollRef: React.RefObject<HTMLDivElement | null>
    // Peça sob manipulação, do lançamento da moeda até a ação forçada acabar
    manipulatedId: string | null
    setManipulatedId: (id: string | null) => void
    // Segura a câmera na peça manipulada enquanto ela ainda caminha até o destino
    holdFocus: (delayMs: number) => void
    // Item que acabou de cair de volta no tabuleiro: a câmera para em cima dele
    droppedItem: MotivationItem | null
    showDroppedItem: (item: MotivationItem) => void
    // Traz a câmera de volta mesmo que o foco já fosse esse
    nudge: () => void
}

// A câmera da partida e quem manda nela. Ela descansa na peça da vez,
// mas uma manipulação rouba esse foco (quem age é a peça manipulada),
// e um item caindo de volta no labirinto rouba de todos, por um instante.
export const useMatchFocus = ({
    maze,
    pieces,
    activePieceId,
    homeColor,
    manipulating,
    resolving,
}: MatchFocusOptions): MatchFocus => {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [manipulatedId, setManipulatedId] = useState<string | null>(null)
    const [droppedItem, setDroppedItem] = useState<MotivationItem | null>(null)
    // Instante até o qual a câmera trava na peça manipulada mesmo sem rolagem em andamento:
    // é o caso do movimento forçado, que só tem a caminhada para mostrar.
    const [heldUntil, setHeldUntil] = useState(0)
    // A câmera só se mexe quando a chave do foco muda.
    // Este contador entra na chave para o HUD conseguir trazê-la de volta à peça da vez,
    // mesmo que ela já fosse o foco e o jogador tenha passeado com a tela.
    const [nudges, setNudges] = useState(0)

    // Seguir a casa, e não só a peça, brigaria com a rolagem manual do jogador:
    // por isso a posição só entra na chave durante uma manipulação.
    const focusPiece = pieces.find((p) => p.id === (manipulatedId ?? activePieceId))
    const focus: CameraFocus | undefined = droppedItem
        ? { key: droppedItem.id, position: droppedItem.position }
        : focusPiece && {
              key: `${manipulatedId ? `${focusPiece.id}:${focusPiece.position.x},${focusPiece.position.y}` : focusPiece.id}#${nudges}`,
              position: focusPiece.position,
          }

    useBoardCamera(scrollRef, { maze, homeColor, focus })

    // Devolve o foco à peça da vez quando a manipulação se encerra:
    // a peça manipulada saiu do comando (resistiu, ou terminou)
    // e não há mais rolagem para acompanhar.
    // Enquanto houver rolagem em jogo, `resolving` segura a câmera onde está.
    useEffect(() => {
        if (!manipulatedId || manipulating || resolving) return

        const remaining = heldUntil - Date.now()
        if (remaining <= 0) {
            setManipulatedId(null)
            return
        }

        const timer = window.setTimeout(() => setManipulatedId(null), remaining)
        return () => clearTimeout(timer)
    }, [manipulatedId, manipulating, resolving, heldUntil])

    const showDroppedItem = (item: MotivationItem) => {
        setDroppedItem(item)
        window.setTimeout(() => setDroppedItem(null), ITEM_DROP_HOLD_MS)
    }

    return {
        scrollRef,
        manipulatedId,
        setManipulatedId,
        holdFocus: (delayMs: number) => setHeldUntil(Date.now() + delayMs),
        droppedItem,
        showDroppedItem,
        nudge: () => setNudges((n) => n + 1),
    }
}
