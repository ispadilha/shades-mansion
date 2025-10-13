import { useState } from "react"
import { CssBaseline } from "@mui/material"
import { HomeScreen } from "./screens/HomeScreen"
import { ChooseSideScreen } from "./screens/ChooseSideScreen"
import { GameScreen } from "./screens/GameScreen"
import { EndScreen } from "./screens/EndScreen"

export default function App() {
    const [route, setRoute] = useState<"home"|"choose"|"game"|"end">("home")
    const [playerColor, setPlayerColor] = useState<"light"|"dark" | null>(null)
    const [winner, setWinner] = useState<"light"|"dark" | null>(null)

    return (
        <>
        <CssBaseline />
        {route === "home" && <HomeScreen onStart={() => setRoute("choose")} />}
        {route === "choose" && (
            <ChooseSideScreen
                onChoose={(color) => { setPlayerColor(color); setRoute("game") }}
                onBack={() => setRoute("home")}
            />
        )}
        {route === "game" && (
            <GameScreen
                playerColor={playerColor!}
                onGameEnd={(winningColor) => { setWinner(winningColor); setRoute("end") }}
                onQuit={() => setRoute("home")}
            />
        )}
        {route === "end" && winner && (
            <EndScreen winner={winner} onRestart={() => { setRoute("choose"); setWinner(null) }} />
        )}
        </>
    )
}
