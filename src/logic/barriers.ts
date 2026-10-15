import type { Barrier, CharacterDefinition, CharacterPosition } from "./types"
import type { Maze } from "./maze"
import { atPosition, positionKey, samePosition } from "./grid"
import { lineOfFire, type LineSight } from "./movement"

// As barreiras que uma personagem mantém acesas
export const barriersOf = (barriers: Barrier[], characterId: string) =>
    barriers.filter((barrier) => barrier.ownerId === characterId)

// Personagem em cima de uma barreira do próprio time está protegida: nenhuma personagem adversária
// consegue atacá-la ali. Para isso, antes é preciso dissipar a barreira.
export const isProtected = (character: CharacterDefinition, barriers: Barrier[]) =>
    barriers.some((barrier) => barrier.color === character.color && samePosition(barrier.position, character.position))

// Onde a personagem consegue acender uma barreira: dentro do alcance da habilidade e pela linha
// de tiro, sendo interrompida por paredes e outras barreiras, mas não por personagens.
//
// A casa vale se não contiver outra barreira existente, nem personagem adversária
export const barrierCells = (
    character: CharacterDefinition,
    characters: CharacterDefinition[],
    maze: Maze,
    range: number,
    sight: LineSight,
): CharacterPosition[] => {
    const lit = new Set(sight.barriers.map((barrier) => positionKey(barrier.position)))
    // A própria casa não sai na linha de tiro, mas é válida para acender uma barreira
    const candidates = [character.position, ...lineOfFire(character, characters, maze, range, sight).cells]

    return candidates.filter((cell) => {
        if (lit.has(positionKey(cell))) return false
        const occupant = atPosition(characters, cell)
        return !occupant || occupant.color === character.color
    })
}

// Barreiras que continuam ativas: as de personagens que ainda estão em jogo. Personagem eliminada
// leva as suas embora, e esse cuidado é necessário. A barreira se apaga quando a vez de
// quem a acendeu volta, e a vez de uma personagem que saiu da mansão nunca volta, então sem isso
// elas ficariam acesas até o fim da partida.
//
// Devolve a mesma lista quando não há nada a apagar, para quem guarda o estado não
// precisar de um render novo à toa.
export const barriersStillStanding = (barriers: Barrier[], characters: CharacterDefinition[]): Barrier[] => {
    const inPlay = new Set(characters.map((character) => character.id))
    return barriers.every((barrier) => inPlay.has(barrier.ownerId))
        ? barriers
        : barriers.filter((barrier) => inPlay.has(barrier.ownerId))
}

// A barreira acesa por uma personagem em uma casa. O id carrega a casa para o desenho da cena
// conseguir distinguir uma barreira nova de uma que só mudou de lugar na lista.
export const litBarrier = (owner: CharacterDefinition, position: CharacterPosition): Barrier => ({
    id: `${owner.id}@${positionKey(position)}`,
    color: owner.color,
    ownerId: owner.id,
    position,
})
