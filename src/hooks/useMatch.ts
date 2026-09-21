import { useContext } from "react"
import MatchContext from "../contexts/MatchContext"

// A partida em curso, para quem a desenha.
// Cada pedaço é um assunto do jogo, e cabe a quem lê traduzir o assunto
// nas props do componente que vai mostrá-lo.
export const useMatch = () => {
    const context = useContext(MatchContext)

    const board = context.board
    const turn = context.turn
    const skill = context.skill
    const manipulation = context.manipulation
    const inventory = context.inventory
    const menu = context.menu
    const log = context.log
    const rolls = context.rolls
    const hint = context.hint

    return { board, turn, skill, manipulation, inventory, menu, log, rolls, hint }
}
