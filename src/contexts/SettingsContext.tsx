import React, { createContext, useState, type ReactNode } from "react"
import {
    BOARD_SIZE_RANGE,
    DEFAULT_BOARD_SIZE,
    DEFAULT_MAX_ROOM_SIZE,
    DEFAULT_MIN_ROOM_SIZE,
    ROOM_SIZE_RANGE,
} from "../constants/gameRules"

interface SettingsContextValue {
    boardSize: number
    minRoomSize: number
    maxRoomSize: number
    setBoardSize: (value: number) => void
    setMinRoomSize: (value: number) => void
    setMaxRoomSize: (value: number) => void
}

interface SettingsProviderProps {
    children: ReactNode
}

const SettingsContext = createContext<SettingsContextValue>({} as SettingsContextValue)
export default SettingsContext

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

// Estes setters se ajustam entre si para que a combinação nunca fique inválida:
// o lado das salas cabe no tabuleiro e a sala mínima nunca passa da máxima.
export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
    const [boardSize, setBoardSizeState] = useState(DEFAULT_BOARD_SIZE)
    const [minRoomSize, setMinRoomSizeState] = useState(DEFAULT_MIN_ROOM_SIZE)
    const [maxRoomSize, setMaxRoomSizeState] = useState(DEFAULT_MAX_ROOM_SIZE)

    const setBoardSize = (value: number) => {
        const size = clamp(value, BOARD_SIZE_RANGE.min, BOARD_SIZE_RANGE.max)
        setBoardSizeState(size)
        setMaxRoomSizeState((max) => Math.min(max, size))
        setMinRoomSizeState((min) => Math.min(min, size))
    }

    const setMinRoomSize = (value: number) => {
        const size = clamp(value, ROOM_SIZE_RANGE.min, Math.min(ROOM_SIZE_RANGE.max, maxRoomSize, boardSize))
        setMinRoomSizeState(size)
    }

    const setMaxRoomSize = (value: number) => {
        const size = clamp(value, Math.max(ROOM_SIZE_RANGE.min, minRoomSize), Math.min(ROOM_SIZE_RANGE.max, boardSize))
        setMaxRoomSizeState(size)
    }

    return (
        <SettingsContext.Provider
            value={{ boardSize, minRoomSize, maxRoomSize, setBoardSize, setMinRoomSize, setMaxRoomSize }}
        >
            {children}
        </SettingsContext.Provider>
    )
}
