import type { CharacterPosition } from "./types"

// O que a cena do tabuleiro anima a pedido da partida. Cada efeito tem um id porque as listas
// são estado da partida e voltam inteiras a cada render: é pelo id que a cena toca cada um uma
// vez só. O que a partida decide (o ataque, a investida) fica em `combat.ts`. Aqui é só o desenho.

// Um clarão de fogo para a cena desenhar. O id garante que cada explosão seja animada
// uma vez só, mesmo que a lista seja reenviada em outro render.
export interface FireBurst {
    id: string
    center: CharacterPosition
    cells: CharacterPosition[]
}

// O dano faz a cena mostrar o número subindo acima da personagem atingida, que pisca.
// O número sobe da casa, e não da personagem:
// quem chega a zero sai do tabuleiro quase no mesmo instante, e o número ainda tem que aparecer.
export interface DamagePopup {
    id: string
    characterId: string
    position: CharacterPosition
    amount: number
}

// Uma investida para a cena desenhar: a personagem corre em linha reta até `to`, em `durationMs`,
// em vez de caminhar pelo labirinto. Como as explosões, cada uma é animada uma vez só.
export interface ChargeRun {
    id: string
    characterId: string
    to: CharacterPosition
    durationMs: number
}

// Um número de vigor recuperado para a cena mostrar subindo acima da personagem,
// como o do dano, mas na cor da aura do quê a revigorou: a afinidade ou o item
export interface ReinvigorationPopup {
    id: string
    position: CharacterPosition
    amount: number
    source: "affinity" | "item"
}

// A personagem se vira para o alvo do que vai fazer
// (quem ataca, barreira que vai dissipar, casa em que acende uma barreira, quem imita)
// ou para quem a ataca. Como as explosões, cada uma é tocada uma vez só.
export interface Aim {
    id: string
    characterId: string
    // Uma casa, ou o id de outra personagem: aí a virada é para a casa em que ela estiver
    target: CharacterPosition | string
}
