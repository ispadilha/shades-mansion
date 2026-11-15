import { useEffect } from "react"
import type { RefObject } from "react"
import type { CharacterColor, CharacterPosition } from "../logic/types"
import type { Maze } from "../logic/maze"
import { CAMERA_START_ROWS_ABOVE_MIDDLE, CELL_SIZE } from "../constants/rules"

interface BoardCameraOptions {
    maze: Maze
    // Time do jogador: a câmera começa perto da base dele. Null para quem comanda todos
    // os times ou só assiste. Esses não têm base própria e começam no meio do tabuleiro.
    homeColor: CharacterColor | null
    // O que a câmera acompanha agora. A chave é o que a faz se mexer: enquanto ela não
    // muda, a câmera fica parada e a rolagem manual do jogador não é atrapalhada.
    focus?: CameraFocus
}

export interface CameraFocus {
    key: string
    position: CharacterPosition
}

const boardOrigin = (container: HTMLDivElement, maze: Maze) => ({
    x: (container.scrollWidth - maze.size * CELL_SIZE) / 2,
    y: (container.scrollHeight - maze.size * CELL_SIZE) / 2,
})

const startRow = (homeColor: CharacterColor | null, size: number) => {
    if (homeColor === "light") return size
    if (homeColor === "dark") return 0
    return Math.floor(size / 2) - CAMERA_START_ROWS_ABOVE_MIDDLE
}

// A câmera do tabuleiro: com os turnos indo personagem a personagem, a ação pode acontecer em qualquer
// canto do labirinto, então a viewport vai atrás de quem está agindo.
export const useBoardCamera = (
    scrollRef: RefObject<HTMLDivElement | null>,
    { maze, homeColor, focus }: BoardCameraOptions,
) => {
    // Posição inicial: perto da base do jogador, com o tabuleiro centrado na largura
    useEffect(() => {
        const container = scrollRef.current
        if (!container) return
        const middle = (Math.floor(maze.size / 2) + 0.5) * CELL_SIZE
        container.scrollLeft = boardOrigin(container, maze).x + middle - container.clientWidth / 2
        container.scrollTop = startRow(homeColor, maze.size) * CELL_SIZE
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [homeColor, maze])

    // A casa em foco vai para o centro da janela
    useEffect(() => {
        const container = scrollRef.current
        if (!container || !focus) return
        const origin = boardOrigin(container, maze)
        container.scrollTo({
            left: origin.x + (focus.position.x + 0.5) * CELL_SIZE - container.clientWidth / 2,
            top: origin.y + (focus.position.y + 0.5) * CELL_SIZE - container.clientHeight / 2,
            behavior: "smooth",
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focus?.key, maze])
}
