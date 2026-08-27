import { useContext } from "react"
import SettingsContext from "../contexts/SettingsContext"

export const useSettings = () => {
    const context = useContext(SettingsContext)

    return {
        boardSize: context.boardSize,
        minRoomSize: context.minRoomSize,
        maxRoomSize: context.maxRoomSize,
        setBoardSize: context.setBoardSize,
        setMinRoomSize: context.setMinRoomSize,
        setMaxRoomSize: context.setMaxRoomSize,
    }
}
