import type { PiecePosition } from "./types"

export interface MazeRoom {
    // Canto superior esquerdo da sala
    x: number
    y: number
    
    size: number
}

export interface Maze {
    size: number
    // walls[y][x] — true significa parede
    walls: boolean[][]
    rooms: MazeRoom[]
}

// Tentativas de encaixar salas novas, por casa do tabuleiro. Como cada tentativa sorteia
// uma posição/tamanho e descarta os que colidem, o número só regula quão denso fica o
// preenchimento — e escala com a área para que tabuleiros grandes não saiam vazios.
const ROOM_PLACEMENT_ATTEMPTS_PER_CELL = 1

// Uma primeira sala mal posicionada pode bloquear todas as outras em tabuleiros
// apertados, então a geração desenha alguns traçados independentes e fica com o melhor.
const LAYOUT_CANDIDATES = 4

// Fração de corredores extras (além dos da árvore geradora mínima) para criar
// caminhos alternativos e evitar um labirinto puramente em árvore.
const EXTRA_CORRIDOR_RATIO = 0.3

export const inside = (maze: Maze, x: number, y: number) => x >= 0 && y >= 0 && x < maze.size && y < maze.size

export const isWall = (maze: Maze, x: number, y: number) => !inside(maze, x, y) || maze.walls[y][x]

export const isWalkable = (maze: Maze, x: number, y: number) => inside(maze, x, y) && !maze.walls[y][x]

export const roomCenter = (room: MazeRoom): PiecePosition => ({
    x: room.x + Math.floor(room.size / 2),
    y: room.y + Math.floor(room.size / 2),
})

const randomInt = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1))

const manhattan = (a: PiecePosition, b: PiecePosition) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y)

// Salas precisam de pelo menos uma casa de parede entre si, senão viram uma sala só.
const collides = (a: MazeRoom, b: MazeRoom) =>
    a.x - 1 < b.x + b.size && b.x - 1 < a.x + a.size && a.y - 1 < b.y + b.size && b.y - 1 < a.y + a.size

const carveRoom = (walls: boolean[][], room: MazeRoom) => {
    for (let y = room.y; y < room.y + room.size; y++) {
        for (let x = room.x; x < room.x + room.size; x++) {
            walls[y][x] = false
        }
    }
}

// Corredor de largura 1 em "L" entre dois pontos; o cotovelo cai no eixo X ou no Y
// (sorteado) para variar o traçado.
const carveCorridor = (walls: boolean[][], from: PiecePosition, to: PiecePosition) => {
    const horizontalFirst = Math.random() < 0.5
    let { x, y } = from
    walls[y][x] = false

    const stepX = () => {
        while (x !== to.x) {
            x += x < to.x ? 1 : -1
            walls[y][x] = false
        }
    }
    const stepY = () => {
        while (y !== to.y) {
            y += y < to.y ? 1 : -1
            walls[y][x] = false
        }
    }

    if (horizontalFirst) {
        stepX()
        stepY()
    } else {
        stepY()
        stepX()
    }
}

// Um traçado de salas quadradas que não se tocam, sorteando posição e lado a cada tentativa.
const sketchRooms = (size: number, minSide: number, maxSide: number): MazeRoom[] => {
    const rooms: MazeRoom[] = []

    const attempts = size * size * ROOM_PLACEMENT_ATTEMPTS_PER_CELL
    for (let attempt = 0; attempt < attempts; attempt++) {
        const side = randomInt(minSide, maxSide)
        const room: MazeRoom = { x: randomInt(0, size - side), y: randomInt(0, size - side), size: side }
        if (rooms.some((existing) => collides(existing, room))) continue
        rooms.push(room)
    }

    return rooms
}

// Escolhe, entre alguns traçados sorteados, o que melhor aproveita o tabuleiro. Sem isso,
// uma sala grande caindo no centro de um tabuleiro pequeno impediria qualquer outra e o
// mapa sairia com uma única sala.
const placeRooms = (walls: boolean[][], size: number, minRoom: number, maxRoom: number): MazeRoom[] => {
    const maxSide = Math.min(maxRoom, size)
    const minSide = Math.min(minRoom, maxSide)

    let best: MazeRoom[] = []
    let bestArea = -1
    for (let candidate = 0; candidate < LAYOUT_CANDIDATES; candidate++) {
        const rooms = sketchRooms(size, minSide, maxSide)
        const area = rooms.reduce((total, room) => total + room.size * room.size, 0)
        if (area > bestArea) {
            bestArea = area
            best = rooms
        }
    }

    for (const room of best) carveRoom(walls, room)
    return best
}

// Liga todas as salas por uma árvore geradora mínima (Prim) sobre os centros:
// cada sala entra na rede pelo corredor mais curto até uma sala já conectada,
// o que garante que nenhuma delas fique isolada.
const connectRooms = (walls: boolean[][], rooms: MazeRoom[]) => {
    if (rooms.length < 2) return

    const centers = rooms.map(roomCenter)
    const connected = [0]
    const pending = rooms.map((_, index) => index).slice(1)

    while (pending.length > 0) {
        let bestPendingIndex = 0
        let bestConnected = connected[0]
        let bestDistance = Infinity

        pending.forEach((candidate, index) => {
            for (const done of connected) {
                const distance = manhattan(centers[candidate], centers[done])
                if (distance < bestDistance) {
                    bestDistance = distance
                    bestPendingIndex = index
                    bestConnected = done
                }
            }
        })

        const [chosen] = pending.splice(bestPendingIndex, 1)
        carveCorridor(walls, centers[chosen], centers[bestConnected])
        connected.push(chosen)
    }

    // Corredores extras entre salas próximas: dão rotas alternativas ao labirinto
    const extras = Math.floor(rooms.length * EXTRA_CORRIDOR_RATIO)
    for (let i = 0; i < extras; i++) {
        const a = randomInt(0, rooms.length - 1)
        const b = randomInt(0, rooms.length - 1)
        if (a === b) continue
        carveCorridor(walls, centers[a], centers[b])
    }
}

// Agrupa as casas livres em componentes conexos (vizinhança ortogonal)
const findComponents = (walls: boolean[][], size: number): PiecePosition[][] => {
    const seen = walls.map((row) => row.map(() => false))
    const components: PiecePosition[][] = []

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (walls[y][x] || seen[y][x]) continue

            const component: PiecePosition[] = []
            const queue: PiecePosition[] = [{ x, y }]
            seen[y][x] = true

            while (queue.length > 0) {
                const cell = queue.shift()!
                component.push(cell)
                for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
                    const nx = cell.x + dx
                    const ny = cell.y + dy
                    if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue
                    if (walls[ny][nx] || seen[ny][nx]) continue
                    seen[ny][nx] = true
                    queue.push({ x: nx, y: ny })
                }
            }

            components.push(component)
        }
    }

    return components
}

// Rede de segurança: mesmo com a árvore geradora, um corredor pode não encostar
// no que deveria. Enquanto sobrar mais de um componente, o menor é ligado ao maior
// pelo par de casas mais próximo — assim toda casa livre continua acessível.
const ensureConnectivity = (walls: boolean[][], size: number) => {
    for (let guard = 0; guard < size * size; guard++) {
        const components = findComponents(walls, size)
        if (components.length <= 1) return

        components.sort((a, b) => b.length - a.length)
        const [main, other] = components

        let best: { from: PiecePosition; to: PiecePosition; distance: number } | null = null
        for (const from of other) {
            for (const to of main) {
                const distance = manhattan(from, to)
                if (!best || distance < best.distance) best = { from, to, distance }
            }
        }
        if (!best) return

        carveCorridor(walls, best.from, best.to)
    }
}

// Gera um labirinto de salas quadradas ligadas por corredores.
// Todas as casas livres ficam em um único componente conexo.
export function generateMaze(size: number, minRoom: number, maxRoom: number): Maze {
    const walls: boolean[][] = Array.from({ length: size }, () => Array<boolean>(size).fill(true))
    const rooms = placeRooms(walls, size, minRoom, maxRoom)

    // Tabuleiro pequeno demais para qualquer sala: abre tudo em vez de entregar um mapa sólido
    if (rooms.length === 0) {
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) walls[y][x] = false
        }
        return { size, walls, rooms: [{ x: 0, y: 0, size }] }
    }

    connectRooms(walls, rooms)
    ensureConnectivity(walls, size)

    return { size, walls, rooms }
}
