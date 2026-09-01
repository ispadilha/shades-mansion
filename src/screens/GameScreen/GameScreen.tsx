import React, { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { MatchDisplay } from "./local-components/MatchDisplay"
import { useGame } from "../../hooks/useGame"

interface GameScreenProps {}

// A partida é montada na tela de iniciativa (labirinto, peças, itens e ordem dos turnos).
// Sem isso não há o que jogar e volta para a escolha de times.
export const GameScreen: React.FC<GameScreenProps> = ({}) => {
    const navigate = useNavigate()
    const { match } = useGame()

    useEffect(() => {
        if (!match) navigate("/choose-side", { replace: true })
    }, [match, navigate])

    if (!match) return null
    return <MatchDisplay match={match} />
}
