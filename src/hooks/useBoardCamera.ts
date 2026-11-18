import { useEffect, useRef, useState } from "react"
import type { RefObject } from "react"
import type { CharacterColor, CharacterPosition } from "../logic/types"
import type { Maze } from "../logic/maze"
import { useStableCallback } from "./useStableCallback"
import {
    CAMERA_FOLLOW_LEAD,
    CAMERA_FOLLOW_MARGIN,
    CAMERA_GLIDE_MS,
    CAMERA_HOLD_MS,
    CAMERA_MANUAL_PAUSE_MS,
    CAMERA_START_ROWS_ABOVE_MIDDLE,
    CELL_SIZE,
} from "../constants/rules"

interface BoardCameraOptions {
    maze: Maze
    // Time do jogador: a câmera começa perto da base dele. Null para quem comanda todos
    // os times ou só assiste. Esses não têm base própria e começam no meio do tabuleiro.
    homeColor: CharacterColor | null
    // A personagem que a câmera está acompanhando.
    // A chave é o que faz ir até ela: enquanto a chave não muda,
    // a câmera só se mexe para acompanhar a personagem andando ou para mostrar algo importante.
    focus?: CameraFocus
}

export interface CameraFocus {
    key: string
    position: CharacterPosition
}

// Por quanto tempo um acontecimento segura a câmera: pouco (os golpes, que são muitos) ou mais (o resto)
export type CameraHold = keyof typeof CAMERA_HOLD_MS

export interface BoardCamera {
    // Algo importante aconteceu nesta casa: a câmera vai até lá, se a casa não estiver bem à vista,
    // e fica o tempo de `CAMERA_HOLD_MS[hold]` antes de voltar para a personagem em foco.
    // Enquanto isso, a personagem em foco que andar só leva a câmera junto se as duas couberem na janela.
    spotlight: (position: CharacterPosition, hold?: CameraHold) => void
    // Solta a câmera do acontecimento que a estiver prendendo, para ela poder ir até a personagem agora
    release: () => void
    // A cena avisa a cada quadro em que a personagem em foco se mexe, com a casa em que ela está
    // (quebrada, no meio de um passo)
    follow: (position: CharacterPosition) => void
    // A câmera está presa num acontecimento importante
    spotlighting: boolean
}

// Onde a janela está sobre o tabuleiro: a rolagem da viewport, em pixels
interface View {
    left: number
    top: number
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

const currentView = (container: HTMLDivElement): View => ({ left: container.scrollLeft, top: container.scrollTop })

// Duas janelas no mesmo lugar, a menos do arredondamento do navegador
const sameView = (a: View, b: View) => Math.abs(a.left - b.left) < 2 && Math.abs(a.top - b.top) < 2

// A janela, sem passar do que dá para rolar
const withinScroll = (container: HTMLDivElement, view: View): View => ({
    left: Math.min(Math.max(view.left, 0), container.scrollWidth - container.clientWidth),
    top: Math.min(Math.max(view.top, 0), container.scrollHeight - container.clientHeight),
})

// Onde o centro da casa cai dentro da janela `view`, em pixels a partir do canto dela
const inView = (container: HTMLDivElement, maze: Maze, position: CharacterPosition, view: View) => {
    const origin = boardOrigin(container, maze)
    return {
        x: origin.x + (position.x + 0.5) * CELL_SIZE - view.left,
        y: origin.y + (position.y + 0.5) * CELL_SIZE - view.top,
    }
}

// A janela com a casa no centro
const centeredOn = (container: HTMLDivElement, maze: Maze, position: CharacterPosition): View => {
    const at = inView(container, maze, position, { left: 0, top: 0 })
    return withinScroll(container, {
        left: at.x - container.clientWidth / 2,
        top: at.y - container.clientHeight / 2,
    })
}

// A folga entre o que a câmera mostra e a borda da janela, em cada eixo.
// Não passa de um quarto da janela, para sobrar onde ficar numa tela pequena.
const marginsOf = (container: HTMLDivElement) => ({
    x: Math.min(CAMERA_FOLLOW_MARGIN * CELL_SIZE, container.clientWidth / 4),
    y: Math.min(CAMERA_FOLLOW_MARGIN * CELL_SIZE, container.clientHeight / 4),
})

// Para que lado a casa saiu da folga na janela `view`, em cada eixo:
// -1 para cima ou esquerda, 1 para baixo ou direita, 0 se está bem à vista
const crowding = (container: HTMLDivElement, maze: Maze, position: CharacterPosition, view: View) => {
    const at = inView(container, maze, position, view)
    const margin = marginsOf(container)
    const side = (offset: number, size: number, edge: number) => (offset < edge ? -1 : offset > size - edge ? 1 : 0)
    return { x: side(at.x, container.clientWidth, margin.x), y: side(at.y, container.clientHeight, margin.y) }
}

// A janela que deixa a casa bem à vista mexendo a partir de `from`: só no eixo em que
// ela ficou perto demais da borda (ou fora da janela) a câmera a centraliza.
// Com `lead`, ela passa do centro esse tanto de casas, para o lado de que a casa se aproximou:
// quem anda tem mais caminho à vista pela frente.
// Mas não a ponto de a casa ficar perto demais da borda de trás.
const keeping = (container: HTMLDivElement, maze: Maze, position: CharacterPosition, from: View, lead = 0): View => {
    const side = crowding(container, maze, position, from)
    const centered = centeredOn(container, maze, position)
    const margin = marginsOf(container)
    const ahead = (half: number, edge: number) => Math.max(0, Math.min(lead * CELL_SIZE, half - edge))
    return {
        left: side.x === 0 ? from.left : centered.left + side.x * ahead(container.clientWidth / 2, margin.x),
        top: side.y === 0 ? from.top : centered.top + side.y * ahead(container.clientHeight / 2, margin.y),
    }
}

// Com um acontecimento prendendo a câmera, a personagem que anda só a leva junto
// se as duas casas couberem em vista: em cada eixo em que ela saiu da folga,
// a câmera centraliza o meio do caminho entre as duas, se assim as
// duas ficam bem à vista. Se não couberem, a câmera fica no acontecimento.
const keepingBoth = (
    container: HTMLDivElement,
    maze: Maze,
    held: CharacterPosition,
    position: CharacterPosition,
    from: View,
): View => {
    const side = crowding(container, maze, position, from)
    const middle = centeredOn(container, maze, { x: (held.x + position.x) / 2, y: (held.y + position.y) / 2 })
    const heldThere = crowding(container, maze, held, middle)
    const positionThere = crowding(container, maze, position, middle)
    return {
        left: side.x !== 0 && heldThere.x === 0 && positionThere.x === 0 ? middle.left : from.left,
        top: side.y !== 0 && heldThere.y === 0 && positionThere.y === 0 ? middle.top : from.top,
    }
}

// Sai devagar, acelera e chega devagar
const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)

// A câmera do tabuleiro: com os turnos indo personagem a personagem, a ação pode acontecer em qualquer
// canto do labirinto, então a viewport vai atrás de quem está agindo. Ela vai até a personagem em foco
// quando o foco muda, acompanha essa personagem quando ela chega perto da borda andando, e se prende um
// tempo no que for importante. O jogador pode assumir o controle e rolar o tabuleiro: o deslizar
// automático pára na hora. Enquanto o jogador rola (e um pouco depois) a câmera não se mexe sozinha.
export const useBoardCamera = (
    scrollRef: RefObject<HTMLDivElement | null>,
    { maze, homeColor, focus }: BoardCameraOptions,
): BoardCamera => {
    // O deslizar em curso: o quadro pedido e a janela a que ele vai
    const glideRef = useRef<{ frame: number; to: View } | null>(null)
    // A janela que a câmera pôs por último. Rolagem que não bate com ela foi o jogador.
    const placedRef = useRef<View | null>(null)
    // Quando o jogador rolou o tabuleiro pela última vez
    const manualAtRef = useRef(-Infinity)
    // O acontecimento que prende a câmera: onde ele foi, até quando ela fica,
    // o relógio que a solta, e se o foco mudou enquanto isso
    const spotlightRef = useRef<{
        position: CharacterPosition
        until: number
        timer: number
        focusChanged: boolean
    } | null>(null)
    // O foco de agora, para quando a câmera for solta
    const focusRef = useRef(focus)
    // A ida até a personagem em foco, que ficou para depois porque o jogador estava rolando o tabuleiro:
    // centralizar (a vez passou) ou só deixar à vista. E o relógio que a cobra quando a pausa acaba.
    const owedRef = useRef<"center" | "keep" | null>(null)
    const resumeTimerRef = useRef<number | null>(null)
    const [spotlighting, setSpotlighting] = useState(false)

    useEffect(() => {
        focusRef.current = focus
    })

    const place = (container: HTMLDivElement, view: View) => {
        container.scrollLeft = view.left
        container.scrollTop = view.top
        placedRef.current = currentView(container)
    }

    const stopGlide = () => {
        if (glideRef.current) cancelAnimationFrame(glideRef.current.frame)
        glideRef.current = null
    }

    // O jogador rolou o tabuleiro: o deslizar automático pára, e espera antes de voltar.
    // O relógio da volta recomeça a cada rolagem.
    const yieldToPlayer = () => {
        stopGlide()
        placedRef.current = null
        manualAtRef.current = performance.now()
        if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
        resumeTimerRef.current = window.setTimeout(resume, CAMERA_MANUAL_PAUSE_MS)
    }

    // O jogador está rolando o tabuleiro, ou acabou de rolar: a câmera não se mexe sozinha.
    // Ela volta a reagir depois disso (a personagem andar, a vez passar, um acontecimento).
    const playerScrolling = () => performance.now() - manualAtRef.current < CAMERA_MANUAL_PAUSE_MS

    // Para onde a câmera está olhando, ou já indo
    const heading = (container: HTMLDivElement) => glideRef.current?.to ?? currentView(container)

    // Desliza até a janela `to` em `CAMERA_GLIDE_MS`, sem passar do que dá para rolar.
    // Se já estiver indo para lá, segue como está.
    const glide = (to: View) => {
        const container = scrollRef.current
        if (!container) return
        const target = withinScroll(container, to)
        if (sameView(heading(container), target)) return
        stopGlide()
        const from = currentView(container)
        placedRef.current = from
        const startedAt = performance.now()
        const step = (now: number) => {
            // A janela mudou desde o último quadro sem ter sido a câmera: o jogador tomou o controle
            if (!placedRef.current || !sameView(placedRef.current, currentView(container))) {
                yieldToPlayer()
                return
            }
            const t = Math.min(1, Math.max(0, (now - startedAt) / CAMERA_GLIDE_MS))
            const k = easeInOut(t)
            place(container, {
                left: from.left + (target.left - from.left) * k,
                top: from.top + (target.top - from.top) * k,
            })
            glideRef.current = t < 1 ? { frame: requestAnimationFrame(step), to: target } : null
        }
        glideRef.current = { frame: requestAnimationFrame(step), to: target }
    }

    // Desliza até a personagem em foco: centralizando (a vez passou), ou só se ela não estiver bem à vista
    const moveToFocus = (move: "center" | "keep") => {
        const container = scrollRef.current
        const current = focusRef.current
        if (!container || !current) return
        glide(
            move === "center"
                ? centeredOn(container, maze, current.position)
                : keeping(container, maze, current.position, heading(container)),
        )
    }

    // Com o jogador rolando o tabuleiro, a ida até a personagem fica para quando a pausa acabar.
    const goToFocus = (move: "center" | "keep") => {
        if (!playerScrolling()) moveToFocus(move)
        else if (owedRef.current !== "center") owedRef.current = move
    }

    // Fim da pausa da rolagem manual: a câmera vai até a personagem em foco, se ficou devendo isso
    // (a vez passou enquanto o jogador rolava, por exemplo). Com um acontecimento prendendo a câmera,
    // ela vai quando ele terminar.
    const resume = () => {
        resumeTimerRef.current = null
        const owed = owedRef.current
        owedRef.current = null
        if (!owed) return
        if (spotlightRef.current) {
            if (owed === "center") spotlightRef.current.focusChanged = true
            return
        }
        moveToFocus(owed)
    }

    // Fim do tempo do acontecimento: a câmera volta para a personagem em foco.
    // Se o foco mudou enquanto isso (a vez passou), ela vai até a nova personagem
    // como iria na troca de vez. Senão, só se mexe se a personagem não estiver bem à vista.
    const endSpotlight = () => {
        const held = spotlightRef.current
        spotlightRef.current = null
        setSpotlighting(false)
        if (held) goToFocus(held.focusChanged ? "center" : "keep")
    }

    // Posição inicial: perto da base do jogador, com o tabuleiro centrado na largura
    useEffect(() => {
        const container = scrollRef.current
        if (!container) return
        const middle = (Math.floor(maze.size / 2) + 0.5) * CELL_SIZE
        place(container, {
            left: boardOrigin(container, maze).x + middle - container.clientWidth / 2,
            top: startRow(homeColor, maze.size) * CELL_SIZE,
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [homeColor, maze])

    // O foco mudou (a vez passou, uma manipulação começou, o jogador pediu): a câmera desliza
    // até a personagem e a deixa no centro. Com um acontecimento prendendo a câmera,
    // ela vai depois, quando ele terminar.
    useEffect(() => {
        if (!focus) return
        if (spotlightRef.current) {
            spotlightRef.current.focusChanged = true
            return
        }
        goToFocus("center")
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [focus?.key, maze])

    // Rolagem que a câmera não fez automaticamente foi do jogador:
    // roda do mouse, borda da tela, barra de rolagem
    useEffect(() => {
        const container = scrollRef.current
        if (!container) return
        const onScroll = () => {
            const placed = placedRef.current
            if (!placed || !sameView(placed, currentView(container))) yieldToPlayer()
        }
        container.addEventListener("scroll", onScroll, { passive: true })
        return () => container.removeEventListener("scroll", onScroll)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scrollRef])

    const spotlight = useStableCallback((position: CharacterPosition, hold: CameraHold = "long") => {
        const container = scrollRef.current
        if (!container || playerScrolling()) return
        glide(keeping(container, maze, position, heading(container)))
        // A câmera fica o tempo inteiro depois do último acontecimento,
        // mas um tempo curto não corta o que sobrava de um tempo longo:
        // em um golpe que acerta e causa eliminação, fica o tempo da eliminação
        const held = spotlightRef.current
        const now = performance.now()
        const until = Math.max(held?.until ?? 0, now + CAMERA_HOLD_MS[hold])
        if (held) clearTimeout(held.timer)
        const timer = window.setTimeout(endSpotlight, until - now)
        spotlightRef.current = { position, until, timer, focusChanged: held?.focusChanged ?? false }
        setSpotlighting(true)
    })

    // O pedido do jogador (o ícone da vez no HUD) vale mais que o acontecimento
    // que estiver prendendo a câmera, e que a pausa depois de ele rolar o tabuleiro
    const release = useStableCallback(() => {
        if (spotlightRef.current) clearTimeout(spotlightRef.current.timer)
        spotlightRef.current = null
        setSpotlighting(false)
        manualAtRef.current = -Infinity
        if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
        resumeTimerRef.current = null
        owedRef.current = null
    })

    // Só movimento chama a câmera: parada, a personagem deixa o jogador passear com ela à vontade
    const follow = useStableCallback((position: CharacterPosition) => {
        const container = scrollRef.current
        if (!container || playerScrolling()) return
        const held = spotlightRef.current
        glide(
            held
                ? keepingBoth(container, maze, held.position, position, heading(container))
                : keeping(container, maze, position, heading(container), CAMERA_FOLLOW_LEAD),
        )
    })

    // Saindo da partida, nada fica esperando: nem o deslizar, nem o relógio do acontecimento
    useEffect(
        () => () => {
            stopGlide()
            release()
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    )

    return { spotlight, release, follow, spotlighting }
}
