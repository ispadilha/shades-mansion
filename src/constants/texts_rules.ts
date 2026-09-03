export const texts_rules = {
    overview: {
        name: {
            enUS: "Overview",
            ptBR: "Visão geral",
        },
        description: {
            enUS:
                "Three teams compete for the mansion and only one of them will conquer it. Light, Gray and Dark each field six pieces, and the match ends when a single team still has pieces on the board.\n\n" +
                "Play is turn-based piece by piece.",
            ptBR:
                "Três times competem pela mansão e só um deles a conquistará. Os times Claro, Cinza e Escuro têm seis peças cada, e a partida acaba quando um único time ainda tem peças no tabuleiro.\n\n" +
                "O jogo é por turnos, peça a peça.",
        },
    },

    mansion: {
        name: {
            enUS: "The mansion",
            ptBR: "A mansão",
        },
        description: {
            enUS:
                "The mansion is never the same twice: a new maze of rooms and corridors is generated at the start of every match, and no two matches share a floor plan.\n\n" +
                "Rooms are square and always separated by at least one wall. They are connected by one-cell corridors, with a few extra corridors beyond the strict minimum, so there is usually more than one way around. Walls block movement and lines of fire, and hold back flames.",
            ptBR:
                "A mansão nunca é a mesma duas vezes: um novo labirinto de salas e corredores é gerado no começo de cada partida, e duas partidas não repetem a mesma planta.\n\n" +
                "As salas são quadradas e sempre separadas por pelo menos uma parede. Elas são ligadas por corredores de uma casa, com alguns corredores extras além do mínimo, então quase sempre há mais de um caminho. As paredes bloqueiam o movimento, as linhas de tiro e o avanço das chamas.",
        },
    },

    teams: {
        name: {
            enUS: "The three teams",
            ptBR: "Os três times",
        },
        description: {
            enUS:
                "Light, Gray and Dark each start with six pieces, one of each type: Agile (A), Balanced (B), Champion (C), Distance shooter (D), Exotic (E) and Firestarter (F).\n\n" +
                "The six types are the same for the three teams, and no two of them are alike: they differ in how far they walk, how far they reach, how much health they carry, the dice their blow rolls and how well they defend themselves.\n\n" +
                "Dark starts spread along the top row of the board, Gray along the middle row and Light along the bottom row.",
            ptBR:
                "Claro, Cinza e Escuro começam com seis peças cada, uma de cada tipo: Ágil (A), Balanceada (B), Campeão (C), a que atira à Distância (D), a Exótica (E), e a perigosa incendiária com seu Fogo (F).\n\n" +
                "Os seis tipos são os mesmos para os três times, e não há dois iguais: eles se diferenciam em quanto andam, quanto alcançam, quanta vida carregam, os dados que o golpe deles rola e o quanto conseguem se defender.\n\n" +
                "As peças escuras começam espalhadas na linha de cima do tabuleiro, as cinzas na linha do meio e as claras na linha de baixo.",
        },
    },

    pieceTypes: {
        name: {
            enUS: "The six pieces",
            ptBR: "As seis peças",
        },
        description: {
            enUS:
                "The Agile (A) runs the farthest and hits the softest: 9 health and a 1d4 blow. In exchange it is the only piece that slips out of a blow completely almost half of the time.\n\n" +
                "The Balanced (B) is the middle of the table: 12 health and a 1d6 blow.\n\n" +
                "The Champion (C) is the heaviest of all: 16 health and two d8 in a single blow, but has the most limited movement.\n\n" +
                "The Distance shooter (D) rolls a 1d6 from where it stands, with 10 health, and still ducks a blow now and then.\n\n" +
                "The Exotic (E) sits between the middle and the top: 13 health and a 1d8 blow.\n\n" +
                "The Firestarter (F) rolls 1d6, with 11 health, and its shot burns a whole area.\n\n" +
                "Right-click a piece and ask for its information to see all of it, including how much health it has left.",
            ptBR:
                "A Ágil (A) é a que corre mais longe e a que bate mais fraco: 9 de vida e um golpe de 1d4. Em troca, é a única peça que desvia de ataques em quase metade das vezes.\n\n" +
                "A Balanceada (B) é o meio da tabela: 12 de vida e golpe de 1d6.\n\n" +
                "O Campeão (C) é o mais pesado de todos: 16 de vida e dois d8 em um golpe só, mas tem o movimento mais limitado.\n\n" +
                "A que atira à Distância (D) rola um 1d6 de onde está, com 10 de vida, e ainda desvia de um golpe de vez em quando.\n\n" +
                "A Exótica (E) fica entre o meio e o topo: 13 de vida e golpe de 1d8\n\n" +
                "A incendiária com seu Fogo (F) rola 1d6, com 11 de vida, e o tiro dela queima uma área inteira.\n\n" +
                "Clique com o botão direito em uma peça e peça a informação dela para ver tudo isso, inclusive quanta vida ainda lhe resta.",
        },
    },

    gameModes: {
        name: {
            enUS: "Commanding a team",
            ptBR: "Comandar um time",
        },
        description: {
            enUS:
                "Before the match you choose what to command. Taking a single team leaves the other two to the AI. Taking all of them turns the match into local multiplayer.\n\n" +
                "You may also command none of them and simply watch three AI teams fight over the mansion. While spectating, the right-click menu still opens, but only with the information entries. Nothing that changes the game.",
            ptBR:
                "Antes da partida você escolhe o que vai comandar. Pegar um único time deixa os outros dois para a IA. Pegar todos transforma a partida em multi-jogador local.\n\n" +
                "Você também pode não comandar nenhum e apenas assistir a três times de IA disputando a mansão. Assistindo, o menu do botão direito ainda abre, mas só com as opções de informação. Nada que altere o jogo.",
        },
    },

    initiative: {
        name: {
            enUS: "Initiative",
            ptBR: "Iniciativa",
        },
        description: {
            enUS:
                "Between choosing your side and entering the mansion, all the characters line up — Light, Gray then Dark — and roll their initiative one at a time: two d20 thrown together, counted as their sum. A total already taken is refused and the character rolls again, so the values are always different.\n\n" +
                "The rolls are sorted from the highest to the lowest and that becomes the order of play for the whole match. The order never changes: eliminated pieces are simply skipped.",
            ptBR:
                "Entre a escolha de time e a entrada na mansão, todos os personagens se enfileiram — Claros, Cinzas e Escuros — e rolam a iniciativa um de cada vez: dois d20 jogados juntos, valendo a soma. Um total que já saiu é recusado e o personagem rola de novo, então os valores são sempre diferentes.\n\n" +
                "As rolagens são ordenadas do maior para o menor e isso vira a ordem das vezes na partida inteira. A ordem nunca muda: as peças eliminadas são apenas puladas.",
        },
    },

    turns: {
        name: {
            enUS: "Turns and actions",
            ptBR: "Turnos e ações",
        },
        description: {
            enUS:
                "A turn belongs to a single piece. When the order of turns reaches its end, a new round starts.\n\n" +
                "Click the piece of the turn to select it and see its ranges highlighted; right-click a cell for the available action. End Turn passes play to the next piece in the order.",
            ptBR:
                "O turno é de uma peça só. Quando a ordem de turnos chega ao fim, começa uma nova rodada.\n\n" +
                "Clique na peça da vez para selecioná-la e ver os alcances destacados; clique com o botão direito em uma casa para a ação disponível. \"Terminar turno\" passa a vez para a próxima peça da ordem.",
        },
    },

    movement: {
        name: {
            enUS: "Movement",
            ptBR: "Movimento",
        },
        description: {
            enUS:
                "Pieces walk one cell at a time, up, down, left or right.\n\n" +
                "Other pieces do not block a corridor: a piece walks through the cells they occupy, but cannot finish its move on top of one.",
            ptBR:
                "As peças andam uma casa por vez, para cima, para baixo, para a esquerda ou para a direita.\n\n" +
                "Outras peças não bloqueiam o corredor: a peça atravessa as casas ocupadas por elas, mas não pode terminar o movimento em cima de nenhuma.",
        },
    },

    combat: {
        name: {
            enUS: "Combat",
            ptBR: "Combate",
        },
        description: {
            enUS:
                "Melee pieces attack by walking to a free cell next to the target and striking on arrival. The walk has to fit inside the piece's attack range.\n\n" +
                "The shooter and the firestarter attack from where they stand, at anything with a clear line of fire. The firestarter may also aim at an empty cell.\n\n" +
                "Every blow is settled by two rolls, one after the other. First the attacker rolls the dice of its own blow. Then the piece being attacked answers with a defense roll, which decides how much of that damage actually lands.\n\n" +
                "A piece that drops to 0 health is removed from the board.",
            ptBR:
                "As peças corpo a corpo atacam caminhando até uma casa livre ao lado do alvo e golpeando ao chegar. A caminhada precisa caber no alcance de ataque da peça.\n\n" +
                "A peça atiradora e a incendiária atacam de onde estão, qualquer alvo com a linha de tiro livre. A incendiária pode mirar também uma casa vazia.\n\n" +
                "Todo ataque é resolvido em duas rolagens, uma depois da outra. Primeiro a peça atacante rola os dados de seu golpe. Depois a peça atacada responde com a rolagem de defesa, que decide quanto desse dano chega de fato.\n\n" +
                "A peça que chega a 0 ponto de vida sai do tabuleiro.",
        },
    },

    defense: {
        name: {
            enUS: "Dodge and guard",
            ptBR: "Esquiva e aparo",
        },
        description: {
            enUS:
                "An attacked piece may defend itself by rolling a d20 against two numbers of its own: the dodge and the guard.\n\n" +
                "Reaching the dodge, the piece gets out of the way entirely and takes nothing. Reaching only the guard, it holds what it can and takes half the damage, rounded up. Below both, the blow lands whole.\n\n" +
                "The guard is within reach of every piece, so any of them can soften a blow. The dodge is not: heavy pieces are too slow to leave the ground.\n\n" +
                "A fire reaches several pieces at once, and each of them rolls its own defense.\n\n",
            ptBR:
                "Uma peça atacada pode se defender rolando um d20 contra dois números próprios: a esquiva e o aparo.\n\n" +
                "Alcançando a esquiva, a peça sai inteira da frente e não leva nada. Alcançando só o aparo, ela segura o que pode e leva metade do dano, arredondada para cima. Abaixo dos dois, o golpe entra inteiro.\n\n" +
                "O aparo está ao alcance de qualquer peça, então todas conseguem amortecer um golpe. A esquiva não: as peças pesadas são lentas demais para sair do chão.\n\n" +
                "Um incêndio alcança várias peças de uma vez, e cada uma rola a defesa dela.\n\n",
        },
    },

    areaDamage: {
        name: {
            enUS: "Fire and area damage",
            ptBR: "Fogo e dano em área",
        },
        description: {
            enUS:
                "The firestarter shoots from a distance, and where the shot lands an area catches fire. It is the only piece that can aim at the ground.\n\n" +
                "The fire does not tell friend from foe: every piece standing on a burning cell takes damage, including the firestarter's own team and the firestarter itself when it fires at something too close. Each of them rolls its own defense.\n\n" +
                "Strategy often involves caution.",
            ptBR:
                "A peça incendiária atira a alguma distância, e onde o tiro cai uma área pega fogo. Esta é a única peça que pode mirar o chão.\n\n" +
                "O fogo não distingue amigo de inimigo: toda peça em uma casa em chamas leva dano, inclusive as do próprio time da incendiária e até ela mesma, quando atira em algo perto demais. Cada uma delas rola a própria defesa.\n\n" +
                "A estratégia muitas vezes envolve cautela.",
        },
    },

    highlights: {
        name: {
            enUS: "Highlighted cells",
            ptBR: "Casas destacadas",
        },
        description: {
            enUS:
                "Selecting a piece paints the cells around it in three colors: yellow for the ones it can walk to, red for the ones its attack reaches, and orange for the ones that are both: where it can end its move and also strike.\n\n" +
                "Yellow is ground the piece can take but not threaten. Red is a target it can hit without standing there: an occupied cell, or a spot further than its legs but still within its reach. Orange is where the two overlap.\n\n",
            ptBR:
                "Selecionar uma peça pinta as casas em volta dela em três cores: amarelo nas que ela consegue alcançar andando, vermelho nas que o ataque dela alcança, e laranja nas que são as duas coisas: onde ela pode terminar o movimento e também atacar.\n\n" +
                "O amarelo é terreno que a peça toma, mas não ameaça. O vermelho é alvo que ela atinge sem pisar ali: uma casa ocupada, ou um ponto além das pernas dela mas ainda ao alcance. O laranja é onde os dois se sobrepõem.\n\n",
        },
    },

    items: {
        name: {
            enUS: "Special items",
            ptBR: "Itens especiais",
        },
        description: {
            enUS:
                "The mansion contains valuable items for the different pieces.\n\n" +
                "An item valuable to one of your own pieces heals it when it is damaged, and promotes it when it is not. An item valuable to another team's piece may manipulate that piece.\n\n",
            ptBR:
                "A mansão contém itens valiosos para as diferentes peças.\n\n" +
                "Um item valioso para uma peça sua a cura quando ela está atingida, e a promove quando não está. Um item valioso para a peça de outro time pode manipular essa peça.\n\n",
        },
    },

    healing: {
        name: {
            enUS: "Healing",
            ptBR: "Cura",
        },
        description: {
            enUS:
                "Using an item which is valuable to your own piece heals it.\n\n" +
                "Healing is what the item does while the piece is damaged. Undamaged, the same item promotes it instead.\n\n" +
                "It can't be used on a piece that has been eliminated, so an item held too long can be lost with its owner.",
            ptBR:
                "Usar um item valioso para a sua própria peça a cura.\n\n" +
                "Curar é o que o item faz enquanto a peça está atingida. Inteira, o mesmo item a promove.\n\n" +
                "Ele não pode ser usado em uma peça eliminada, então um item guardado tempo demais pode se perder junto com o dono.",
        },
    },

    promotions: {
        name: {
            enUS: "Promotions",
            ptBR: "Promoções",
        },
        description: {
            enUS:
                "A piece at full health does not need its item to heal. Instead, the item promotes the piece: it goes up a level.\n\n" +
                "Every level adds 3 health, a step of reach, an easier guard, and one step up the ladder of the damage die: a d4 becomes a d6, a d6 becomes a d8, a d8 becomes a d10.\n\n" +
                "The dodge is the one thing a promotion doesn't change: a heavy piece will still be slow.\n\n" +
                "Right-click a piece and ask for its information to see the level it is on.",
            ptBR:
                "Uma peça com a vida cheia não precisa de seu item para cura. Em vez disso, o item a promove: ela sobe um nível.\n\n" +
                "Cada nível acrescenta 3 de vida, um passo de alcance, um aparo mais fácil, e um degrau na escada do dado de dano: um d4 vira d6, um d6 vira d8, um d8 vira d10.\n\n" +
                "A esquiva é a única coisa em que a promoção não mexe: uma peça pesada ainda será lenta.\n\n" +
                "Clique com o botão direito em uma peça e peça a informação dela para ver em que nível ela está.",
        },
    },

    manipulation: {
        name: {
            enUS: "Manipulation",
            ptBR: "Manipulação",
        },
        description: {
            enUS:
                "An item which is valuable to an opponent is a temptation over them. Using it on your turn flips a coin: on heads that enemy piece falls under your command for a single action, and on tails it resists.\n\n" +
                "Being manipulated is an abnormal action and the piece still has its own action when its turn comes, and a piece that has already acted can be manipulated all the same.\n\n" +
                "On tails, the item slips out of the manipulator's hands and falls back on the floor, on a random free cell, for whoever reaches it first.",
            ptBR:
                "Um item valioso para um oponente é uma tentação sobre o mesmo. Usá-lo no seu turno joga uma moeda: dando cara, aquela peça inimiga cai sob o seu comando por uma única ação.\n\n" +
                "Ser manipulada é uma ação anormal e a peça continua com sua ação quando chegar a vez dela, e uma peça que já agiu pode ser manipulada do mesmo jeito.\n\n" +
                "Dando coroa, o item escapa das mãos de quem tentou e cai de volta no chão, em uma casa livre sorteada, para quem chegar primeiro.",
        },
    },

    victory: {
        name: {
            enUS: "Victory",
            ptBR: "Vitória",
        },
        description: {
            enUS:
                "The mansion will be conquered by one team only. When two of the three sides have lost every piece, the last one still standing wins, however few pieces it has left.\n\n",
            ptBR:
                "A mansão será conquistada por um time só. Quando dois dos três lados perdem todas as peças, o último de pé vence, por menos peças que ainda tenha.\n\n",
        },
    },
}

export const ruleKeys = Object.keys(texts_rules) as Array<keyof typeof texts_rules>
