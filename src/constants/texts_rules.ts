export const texts_rules = {
    overview: {
        name: {
            enUS: "Overview",
            ptBR: "Visão geral",
        },
        description: {
            enUS:
                "Three teams compete inside the mansion and only one of them will conquer it. Light, Gray and Dark each field four pieces, and the match ends when a single team still has pieces on the board.\n\n" +
                "Play is turn-based piece by piece.",
            ptBR:
                "Três times estão trancados na mansão e só um deles sai. Claro, cinza e escuro têm quatro peças cada, e a partida acaba quando um único time ainda tem peças no tabuleiro.\n\n" +
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
                "Rooms are square and always separated by at least one wall, connected by one-cell corridors — with a few extra corridors beyond the strict minimum, so there is usually more than one way around. Walls block movement and also block lines of fire.",
            ptBR:
                "A mansão nunca é a mesma duas vezes: um novo labirinto de salas e corredores é gerado no começo de cada partida, e duas partidas não repetem a mesma planta.\n\n" +
                "As salas são quadradas e sempre separadas por pelo menos uma parede, ligadas por corredores de uma casa — com alguns corredores extras além do mínimo, então quase sempre há mais de um caminho. As paredes bloqueiam o movimento e também as linhas de tiro.",
        },
    },

    teams: {
        name: {
            enUS: "The three teams",
            ptBR: "Os três times",
        },
        description: {
            enUS:
                "Light, Gray and Dark each start with four pieces, one of each type: Agile (A), Balanced (B), Champion (C) and Distance shooter (D).\n\n" +
                "Dark starts spread along the top row of the board, Gray along the middle row and Light along the bottom row.",
            ptBR:
                "Claro, cinza e escuro começam com quatro peças cada, uma de cada tipo: Ágil (A), Balanceada (B), Campeão (C) e uma que atira à Distância (D).\n\n" +
                "As escuras começam espalhadas na linha de cima do tabuleiro, as cinzas na linha do meio e as claras na linha de baixo.",
        },
    },

    gameModes: {
        name: {
            enUS: "Commanding a side",
            ptBR: "Comandar um lado",
        },
        description: {
            enUS:
                "Before the match you choose what to command. Taking a single team leaves the other two to the AI. Taking all of them turns the match into local multiplayer.\n\n" +
                "You may also command none of them and simply watch three AI teams fight over the mansion. While spectating, the right-click menu still opens, but only with the information entries — nothing that changes the game.",
            ptBR:
                "Antes da partida você escolhe o que vai comandar. Pegar um único time deixa os outros dois para a IA. Pegar todos transforma a partida em multi-jogador local.\n\n" +
                "Você também pode não comandar nenhum e apenas assistir a três times de IA disputando a mansão. Assistindo, o menu do botão direito ainda abre, mas só com as opções de informação — nada que altere o jogo.",
        },
    },

    initiative: {
        name: {
            enUS: "Initiative",
            ptBR: "Iniciativa",
        },
        description: {
            enUS:
                "Between choosing your side and entering the mansion, all the characters line up — Light, Gray then Dark — and roll a d20 each, one at a time. A number already taken is refused and the character rolls again, so the values are always different.\n\n" +
                "The rolls are sorted from the highest to the lowest and that becomes the order of play for the whole match. The order never changes: eliminated pieces are simply skipped.",
            ptBR:
                "Entre a escolha de time e a entrada na mansão, todos os personagens se enfileiram — Claros, Cinzas e Escuros — e rolam um d20 cada, um de cada vez. Um número que já saiu é recusado e o personagem rola de novo, então os valores são sempre diferentes.\n\n" +
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
                "Melee pieces (agile, balanced and champion) attack by walking to a free cell next to the target and striking on arrival. The walk has to fit inside the piece's attack range.\n\n" +
                "The distance shooter attacks from where it stands, at anything with a clear line of fire. A piece that drops to 0 HP is removed from the board.",
            ptBR:
                "As peças corpo a corpo (ágil, balanceada e campeã) atacam caminhando até uma casa livre ao lado do alvo e golpeando ao chegar. A caminhada precisa caber no alcance de ataque da peça.\n\n" +
                "O atirador à distância ataca de onde está, qualquer alvo com a linha de tiro livre. A peça que chega a 0 ponto de vida sai do tabuleiro.",
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
                "Using an item which is valuable to your own piece heals it, while using an item which is valuable to another team's piece may manipulate that piece.\n\n",
            ptBR:
                "A mansão contém itens valiosos para as diferentes peças.\n\n" +
                "Usar um item valioso para a sua própria peça a cura, enquanto usar um item valioso para a peça de outro time pode manipular essa peça.\n\n",
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
                "It can't be used if the piece is already at full health or has been eliminated, so an item held too long can be lost with its owner.",
            ptBR:
                "Usar um item valioso para a sua própria peça a cura.\n\n" +
                "Ele não pode ser usado se a peça já estiver com a vida cheia ou tiver sido eliminada, então um item guardado tempo demais pode se perder junto com o dono.",
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
                "Being manipulated is an abnormal action and the piece still has its own action when its turn comes, and a piece that has already acted can be manipulated all the same.",
            ptBR:
                "Um item valioso para um oponente é uma tentação sobre o mesmo. Usá-lo no seu turno joga uma moeda: dando cara, aquela peça inimiga cai sob o seu comando por uma única ação.\n\n" +
                "Ser manipulada é uma ação anormal e a peça continua com sua ação quando chegar a vez dela, e uma peça que já agiu pode ser manipulada do mesmo jeito.",
        },
    },

    victory: {
        name: {
            enUS: "Victory",
            ptBR: "Vitória",
        },
        description: {
            enUS:
                "The mansion will be conquered by one team only. When two of the three sides have lost every piece, the last one still standing wins, however few pieces it has left.\n\n" +
                "The log above the board records every move, attack, heal and elimination along the way.",
            ptBR:
                "A mansão será conquistada por um time só. Quando dois dos três lados perdem todas as peças, o último de pé vence, por menos peças que ainda tenha.\n\n" +
                "O log acima do tabuleiro registra cada movimento, ataque, cura e eliminação no caminho.",
        },
    },
}

export const ruleKeys = Object.keys(texts_rules) as Array<keyof typeof texts_rules>
