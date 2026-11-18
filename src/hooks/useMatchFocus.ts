import { useEffect, useRef, useState } from "react"
import type { MotivationItem, CharacterColor, CharacterDefinition, CharacterPosition } from "../logic/types"
import type { Maze } from "../logic/maze"
import { useBoardCamera, type CameraFocus, type CameraHold } from "./useBoardCamera"
import { ITEM_DROP_HOLD_MS } from "../constants/rules"

interface MatchFocusOptions {
    maze: Maze
    characters: CharacterDefinition[]
    // Personagem da vez: é nela que a câmera descansa quando nada mais rouba o foco
    activeCharacterId: string | null
    // Time do jogador, para a câmera começar perto da base dele
    homeColor: CharacterColor | null
    // Há manipulação em curso? Enquanto houver, o foco é da personagem manipulada
    manipulating: boolean
    // Rolagem em andamento segura a câmera onde a ação está acontecendo
    resolving: boolean
}

export interface MatchFocus {
    // A viewport rolável do tabuleiro
    scrollRef: React.RefObject<HTMLDivElement | null>
    // Personagem sob manipulação, do lançamento da moeda até a ação forçada acabar
    manipulatedId: string | null
    setManipulatedId: (id: string | null) => void
    // Segura a câmera na personagem manipulada enquanto ela ainda caminha até o destino
    holdFocus: (delayMs: number) => void
    // Item que acabou de cair de volta no tabuleiro, para a cena animar a queda
    droppedItem: MotivationItem | null
    // Um item caiu de volta no tabuleiro: a cena o mostra caindo, e a câmera fica nele um tempo
    showDroppedItem: (item: MotivationItem) => void
    // Algo importante aconteceu nesta casa: a câmera fica nela um tempo
    spotlight: (position: CharacterPosition, hold?: CameraHold) => void
    // A câmera está mostrando algo importante: a IA espera ela voltar para jogar
    spotlighting: boolean
    // A personagem em foco, que a câmera está acompanhando (a da vez, ou a manipulada),
    // e o aviso da cena a cada quadro em que ela se mexe
    followedId: string | null
    followMove: (position: CharacterPosition) => void
    // Traz a câmera de volta mesmo que o foco já fosse esse
    nudge: () => void
}

// A câmera da partida e quem manda nela. Ela descansa na personagem da vez,
// mas uma manipulação rouba esse foco (quem age é a personagem manipulada),
// e um acontecimento importante rouba de todos, por alguns segundos.
export const useMatchFocus = ({
    maze,
    characters,
    activeCharacterId,
    homeColor,
    manipulating,
    resolving,
}: MatchFocusOptions): MatchFocus => {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [manipulatedId, setManipulatedId] = useState<string | null>(null)
    const [droppedItem, setDroppedItem] = useState<MotivationItem | null>(null)
    // Instante até o qual a câmera trava na personagem manipulada mesmo sem rolagem em andamento:
    // é o caso do movimento forçado, que só tem a caminhada para mostrar.
    const [heldUntil, setHeldUntil] = useState(0)
    // A câmera só vai até a personagem quando a chave do foco muda.
    // Este contador entra na chave para o HUD conseguir trazê-la de volta à personagem da vez,
    // mesmo que ela já fosse o foco e o jogador tenha passeado com a tela.
    const [nudges, setNudges] = useState(0)

    // A casa não entra na chave: andando, quem leva a câmera junto é a própria cena (`followMove`), e só
    // quando a personagem chega perto da borda. Ir até cada casa nova brigaria com a rolagem do jogador.
    const focusCharacter = characters.find((p) => p.id === (manipulatedId ?? activeCharacterId))
    const focus: CameraFocus | undefined = focusCharacter && {
        key: `${focusCharacter.id}#${nudges}`,
        position: focusCharacter.position,
    }

    const camera = useBoardCamera(scrollRef, { maze, homeColor, focus })

    // Devolve o foco à personagem da vez quando a manipulação se encerra:
    // a personagem manipulada saiu do comando (resistiu, ou terminou)
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
        camera.spotlight(item.position)
        window.setTimeout(() => setDroppedItem(null), ITEM_DROP_HOLD_MS)
    }

    return {
        scrollRef,
        manipulatedId,
        setManipulatedId,
        holdFocus: (delayMs: number) => setHeldUntil(Date.now() + delayMs),
        droppedItem,
        showDroppedItem,
        spotlight: camera.spotlight,
        spotlighting: camera.spotlighting,
        followedId: focusCharacter?.id ?? null,
        followMove: camera.follow,
        nudge: () => {
            camera.release()
            setNudges((n) => n + 1)
        },
    }
}
