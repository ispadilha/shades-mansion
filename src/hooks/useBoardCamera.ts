import { useEffect } from "react"
import type { RefObject } from "react"
import type { PieceColor, PiecePosition } from "../logic/types"
import type { Maze } from "../logic/maze"
import { CELL_SIZE } from "../constants/rules"

interface BoardCameraOptions {
    maze: Maze
    // Time do jogador: a câmera começa perto da base dele. Null para quem comanda todos
    // os times ou só assiste. Esses não têm base própria e começam no meio do tabuleiro.
    homeColor: PieceColor | null
    // O que a câmera acompanha agora. A chave é o que a faz se mexer: enquanto ela não
    // muda, a câmera fica parada e a rolagem manual do jogador não é atrapalhada.
    focus?: CameraFocus
}

export interface CameraFocus {
    key: string
    position: PiecePosition
}

// A câmera do tabuleiro: com os turnos indo peça a peça, a ação pode acontecer em qualquer
// canto do labirinto, então a viewport vai atrás de quem está agindo.
export const useBoardCamera = (
    scrollRef: RefObject<HTMLDivElement | null>,
    { maze, homeColor, focus }: BoardCameraOptions,
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

    useEffect(() => {
        const container = scrollRef.current
        if (!container || !focus) return

        const offsetX = (container.scrollWidth - maze.size * CELL_SIZE) / 2
        container.scrollTo({
            left: offsetX + focus.position.x * CELL_SIZE + CELL_SIZE / 2 - container.clientWidth / 2,
            top: focus.position.y * CELL_SIZE + CELL_SIZE / 2 - container.clientHeight / 2,
            behavior: "smooth",
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focus?.key, maze])
}
