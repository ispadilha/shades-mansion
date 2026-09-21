import React, { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { MatchBoard } from "./local-components/MatchBoard"
import { MatchHud } from "./local-components/MatchHud"
import { MatchMenus } from "./local-components/MatchMenus"
import { ScreenLayout } from "../../components/ui"
import { MatchProvider } from "../../contexts/MatchContext"
import { useGame } from "../../hooks/useGame"

interface GameScreenProps {}

// A tela de jogo: o tabuleiro ocupa o que sobra, o HUD fica embaixo e os menus
// abrem por cima dos dois. O estado da partida mora no provedor, e cada peça da tela
// pega dele exatamente o que precisa. Por isso aqui só há a árvore.
//
// A partida é montada na tela de iniciativa (labirinto, peças, itens e ordem dos turnos).
// Sem isso não há o que jogar e volta para a escolha de times.
export const GameScreen: React.FC<GameScreenProps> = ({}) => {
    const navigate = useNavigate()
    const { match } = useGame()

    useEffect(() => {
        if (!match) navigate("/choose-side", { replace: true })
    }, [match, navigate])

    if (!match) return null

    return (
        <MatchProvider match={match}>
            <ScreenLayout sx={{ justifyContent: "flex-start", alignItems: "stretch", overflow: "hidden" }}>
                <MatchBoard />
                <MatchHud />
                <MatchMenus />
            </ScreenLayout>
        </MatchProvider>
    )
}
