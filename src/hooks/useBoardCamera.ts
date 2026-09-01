import { useEffect } from "react"
import type { RefObject } from "react"
import type { PieceColor, PieceDefinition } from "../logic/types"
import type { Maze } from "../logic/maze"
import { CELL_SIZE } from "../constants/rules"

interface BoardCameraOptions {
    maze: Maze
    // Time do jogador: a câmera começa perto da base dele. Null para quem comanda todos
    // os times ou só assiste. Esses não têm base própria e começam no meio do tabuleiro.
    homeColor: PieceColor | null
    // Peça que a câmera acompanha (a da vez, ou a que está sob manipulação)
    focusPiece?: PieceDefinition
    // Acompanha também as mudanças de casa da peça, e não só a troca de peça em foco
    trackPosition: boolean
}

// A câmera do tabuleiro: com os turnos indo peça a peça, a ação pode acontecer em qualquer
// canto do labirinto, então a viewport vai atrás de quem está agindo.
export const useBoardCamera = (
    scrollRef: RefObject<HTMLDivElement | null>,
    { maze, homeColor, focusPiece, trackPosition }: BoardCameraOptions,
) => {
    // Posição inicial: perto da base do jogador
    useEffect(() => {
        const container = scrollRef.current
        if (!container) return
        const mid = Math.floor(maze.size / 2)
        const boardPx = maze.size * CELL_SIZE
        const offsetX = (container.scrollWidth - boardPx) / 2
        const focusX = mid * CELL_SIZE + CELL_SIZE / 2
        const focusY =
            homeColor === "light" ? boardPx :
            homeColor === "dark" ? 0 :
            mid * CELL_SIZE - CELL_SIZE * 4
        container.scrollLeft = offsetX + focusX - container.clientWidth / 2
        container.scrollTop = focusY
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [homeColor, maze])

    // O que faz a câmera se mexer. Em um turno comum é só a troca da peça da vez. Seguir
    // cada jogada brigaria com a rolagem manual do jogador. Durante uma manipulação a
    // casa entra na conta e a câmera vai junto.
    const focusKey = trackPosition
        ? `${focusPiece?.id}:${focusPiece?.position.x},${focusPiece?.position.y}`
        : (focusPiece?.id ?? null)

    useEffect(() => {
        const container = scrollRef.current
        if (!container || !focusPiece) return

        const offsetX = (container.scrollWidth - maze.size * CELL_SIZE) / 2
        container.scrollTo({
            left: offsetX + focusPiece.position.x * CELL_SIZE + CELL_SIZE / 2 - container.clientWidth / 2,
            top: focusPiece.position.y * CELL_SIZE + CELL_SIZE / 2 - container.clientHeight / 2,
            behavior: "smooth",
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focusKey, maze])
}
