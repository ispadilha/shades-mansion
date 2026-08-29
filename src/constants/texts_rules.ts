export const texts_rules = {
    overview: {
        name: {
            enUS: "Overview",
            ptBR: "Visão geral",
        },
        description: {
            enUS:
                "Three teams are shut inside the mansion and only one of them leaves. Light, Gray and Dark each field four pieces, and the match ends when a single team still has pieces on the board.\n\n" +
                "Play is turn-based piece by piece, not team by team: the twelve characters roll for initiative before the match and act in that order for the whole game. On its turn a piece may act once — move (collecting whatever it steps on) or attack. Nothing is hidden: the whole maze, every piece and every item on the floor are visible from the start.",
            ptBR:
                "Três times estão trancados na mansão e só um deles sai. Claro, cinza e escuro têm quatro peças cada, e a partida acaba quando um único time ainda tem peças no tabuleiro.\n\n" +
                "O jogo é por turnos de peça, não de time: os doze personagens rolam iniciativa antes da partida e agem nessa ordem o jogo inteiro. No seu turno, a peça pode agir uma vez — mover (coletando o que houver na casa de destino) ou atacar. Nada fica escondido: o labirinto inteiro, todas as peças e todos os itens no chão são visíveis desde o começo.",
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
                "Rooms are square and always separated by at least one wall, connected by one-cell corridors — with a few extra corridors beyond the strict minimum, so there is usually more than one way around. Walls block movement and also block lines of fire. The size of the board and the smallest and largest room sides are set in Options.",
            ptBR:
                "A mansão nunca é a mesma duas vezes: um novo labirinto de salas e corredores é gerado no começo de cada partida, e duas partidas não repetem a mesma planta.\n\n" +
                "As salas são quadradas e sempre separadas por pelo menos uma parede, ligadas por corredores de uma casa — com alguns corredores extras além do mínimo, então quase sempre há mais de um caminho. As paredes bloqueiam o movimento e também as linhas de tiro. O tamanho do tabuleiro e os lados da menor e da maior sala são definidos nas opções.",
        },
    },

    teams: {
        name: {
            enUS: "The three teams",
            ptBR: "Os três times",
        },
        description: {
            enUS:
                "Light, Gray and Dark each start with four pieces, one of each type: Agile (A), Balanced (B), Champion (C) and Distance shooter (D). Every piece holds 3 HP.\n\n" +
                "Dark starts spread along the top row of the board, Gray along the middle row and Light along the bottom row; a piece whose starting cell fell inside a wall slides to the nearest free cell. Teams do not take turns as a block: the order of play is decided piece by piece, on the initiative roll.",
            ptBR:
                "Claro, cinza e escuro começam com quatro peças cada, uma de cada tipo: Ágil (A), Balanceada (B), Campeão (C) e uma que atira à Distância (D). Toda peça tem 3 pontos de vida.\n\n" +
                "As escuras começam espalhadas na linha de cima do tabuleiro, as cinzas na linha do meio e as claras na linha de baixo; a peça cuja casa inicial caiu dentro de uma parede escorrega para a casa livre mais próxima. Os times não jogam em bloco: a ordem das vezes é decidida peça a peça, na rolagem de iniciativa.",
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
                "Between choosing your side and entering the mansion, the twelve characters line up — Light, Gray then Dark — and roll a d20 each, one at a time. A number already taken is refused and the character rolls again, so the twelve values are always different.\n\n" +
                "The rolls are sorted from the highest to the lowest and that becomes the order of play for the whole match — teams are interleaved, and a team may well act twice in a row. The order never changes: eliminated pieces are simply skipped.",
            ptBR:
                "Entre a escolha de time e a entrada na mansão, os doze personagens se enfileiram — claras, cinzas e escuras — e rolam um d20 cada, um de cada vez. Um número que já saiu é recusado e o personagem rola de novo, então os doze valores são sempre diferentes.\n\n" +
                "As rolagens são ordenadas do maior para o menor e isso vira a ordem das vezes na partida inteira — os times ficam intercalados, e pode ocorrer de um time agir duas vezes seguidas. A ordem nunca muda: as peças eliminadas são apenas puladas.",
        },
    },

    turns: {
        name: {
            enUS: "Turns and actions",
            ptBR: "Turnos e ações",
        },
        description: {
            enUS:
                "A turn belongs to a single piece — the next one in the initiative order — and in it that piece may act once: move or attack, not both. A melee attack already includes walking up to the target, so it counts as that piece's action. When the order reaches its end a new round starts and every piece has its action back.\n\n" +
                "Click the piece of the turn to select it and see its ranges highlighted; right-click a cell for the available action. End Turn passes play to the next piece in the order. The bar above the log shows the whole order, with the piece of the turn highlighted and the ones that already acted faded.",
            ptBR:
                "O turno é de uma peça só — a próxima da ordem de iniciativa — e nele ela pode agir uma vez: mover ou atacar, nunca os dois. O ataque corpo a corpo já inclui a caminhada até o alvo, então ele conta como a ação daquela peça. Quando a ordem chega ao fim, começa uma nova rodada e todas as peças recuperam sua ação.\n\n" +
                "Clique na peça da vez para selecioná-la e ver os alcances destacados; clique com o botão direito em uma casa para a ação disponível. \"Terminar turno\" passa a vez para a próxima peça da ordem. A faixa acima do log mostra a ordem inteira, com a peça da vez destacada e as que já agiram apagadas.",
        },
    },

    movement: {
        name: {
            enUS: "Movement",
            ptBR: "Movimento",
        },
        description: {
            enUS:
                "Pieces walk one cell at a time, up, down, left or right — never diagonally — and the range counts steps around the walls, not straight-line distance. A room two cells away through a wall may be a dozen steps away in practice.\n\n" +
                "Other pieces do not block a corridor: a piece walks through the cells they occupy, but cannot finish its move on top of one. Move ranges are 9 cells for the agile character, 7 for the balanced one, and 5 for the champion and the distance shooter.",
            ptBR:
                "As peças andam uma casa por vez, para cima, para baixo, para a esquerda ou para a direita — nunca na diagonal — e o alcance conta passos contornando as paredes, não a distância em linha reta. Uma sala a duas casas do outro lado de uma parede pode estar a uma dúzia de passos na prática.\n\n" +
                "Outras peças não bloqueiam o corredor: a peça atravessa as casas ocupadas por elas, mas não pode terminar o movimento em cima de nenhuma. Os alcances de movimento são 9 casas para o personagem ágil, 7 para o balanceado, e 5 para o campeão e o atirador à distância.",
        },
    },

    combat: {
        name: {
            enUS: "Combat",
            ptBR: "Combate",
        },
        description: {
            enUS:
                "Melee pieces (agile, balanced and champion) attack by walking to a free cell next to the target — the eight neighbours count, diagonals included — and striking on arrival. The walk has to fit inside the piece's attack range.\n\n" +
                "The distance shooter shoots from where it stands, up to 7 cells along its row, column and diagonals. The first piece in each direction is the target of that line and blocks everything behind it, so anyone standing in front of a shot is cover. No attack is certain: whoever attacks flips a coin and only lands the blow on heads. A piece that drops to 0 HP is removed from the board.",
            ptBR:
                "As peças corpo a corpo (ágil, balanceada e campeã) atacam caminhando até uma casa livre ao lado do alvo — as oito vizinhas valem, inclusive as diagonais — e golpeando ao chegar. A caminhada precisa caber no alcance de ataque da peça.\n\n" +
                "O atirador à distância acerta de onde está, a até 7 casas pela linha, pela coluna e pelas diagonais. A primeira peça de cada direção é o alvo daquela linha e bloqueia tudo o que está atrás dela, então quem estiver na frente de um tiro serve de cobertura. Nenhum ataque é garantido: quem ataca joga uma moeda e só acerta o golpe se der cara. A peça que chega a 0 ponto de vida sai do tabuleiro.",
        },
    },

    items: {
        name: {
            enUS: "Special items",
            ptBR: "Itens especiais",
        },
        description: {
            enUS:
                "The mansion keeps one item for each of the twelve pieces, and a couple of copies of each are scattered over free cells when the match begins (fewer, if the maze is too tight to hold them all).\n\n" +
                "An item is picked up simply by moving onto its cell, and goes to the inventory of the team that collected it — never to the individual piece. What an item does depends on whether its colour is yours: your own colour heals, another team's colour manipulates.",
            ptBR:
                "A mansão guarda um item para cada uma das doze peças, e algumas cópias de cada um ficam espalhadas por casas livres no começo da partida (menos, se o labirinto for apertado demais para todas caberem).\n\n" +
                "O item é coletado simplesmente movendo uma peça até a casa dele, e vai para o inventário do time que coletou — nunca para a peça em si. O que o item faz depende da cor: a sua própria cor cura, a cor de outro time manipula.",
        },
    },

    healing: {
        name: {
            enUS: "Healing",
            ptBR: "Cura",
        },
        description: {
            enUS:
                "An item of your own colour belongs to one specific piece of your team — the one that shares its letter — and using it restores that piece to full HP. The item is consumed.\n\n" +
                "It heals nothing if the piece is already at full health or has been eliminated, so an item held too long can be lost with its owner. An AI team spends whatever heals it is holding at the start of each of its pieces' turns.",
            ptBR:
                "Um item da sua própria cor pertence a uma peça específica do seu time — a que compartilha a letra dele — e usá-lo devolve a vida cheia àquela peça. O item é consumido.\n\n" +
                "Ele não cura nada se a peça já estiver com a vida cheia ou tiver sido eliminada, então um item guardado tempo demais pode se perder junto com o dono. Um time de IA gasta as curas que tiver no inventário no começo do turno de cada peça dele.",
        },
    },

    manipulation: {
        name: {
            enUS: "Manipulation",
            ptBR: "Manipulação",
        },
        description: {
            enUS:
                "An item of another team's colour is a hold over the piece that shares its letter. Using it on your turn flips a coin: on heads that enemy piece falls under your command for a single action — one move or one attack — and on tails it resists. Either way the item is spent.\n\n" +
                "A manipulated piece obeys its own ranges and its own attack style, but not its loyalties: it can be turned against its own team. Being manipulated is an abnormal action and costs the piece nothing: it still has its own action when its turn comes, and a piece that has already acted can be manipulated all the same. If the piece is eliminated mid-manipulation, the hold simply ends.",
            ptBR:
                "Um item da cor de outro time é um domínio sobre a peça que compartilha a letra dele. Usá-lo no seu turno joga uma moeda: dando cara, aquela peça inimiga cai sob o seu comando por uma única ação — um movimento ou um ataque — e dando coroa, ela resiste. Nos dois casos o item é gasto.\n\n" +
                "A peça manipulada obedece aos próprios alcances e ao próprio estilo de ataque, mas não às próprias lealdades: ela pode ser virada contra o time dela. Ser manipulada é uma ação anormal e não custa nada à peça: ela continua com a ação dela quando chegar a sua vez, e uma peça que já agiu pode ser manipulada do mesmo jeito. Se a peça for eliminada durante a manipulação, o domínio simplesmente acaba.",
        },
    },

    victory: {
        name: {
            enUS: "Victory",
            ptBR: "Vitória",
        },
        description: {
            enUS:
                "The mansion lets go of one team only. When two of the three sides have lost every piece, the last one still standing wins, however few pieces it has left.\n\n" +
                "There is no surrender and no draw: pieces are never restored once eliminated, so every match narrows down to that single survivor. The log above the board records every move, attack, heal and elimination along the way.",
            ptBR:
                "A mansão solta um time só. Quando dois dos três lados perdem todas as peças, o último de pé vence, por menos peças que ainda tenha.\n\n" +
                "Não há rendição nem empate: peças eliminadas nunca voltam, então toda partida se estreita até esse único sobrevivente. O log acima do tabuleiro registra cada movimento, ataque, cura e eliminação no caminho.",
        },
    },
}

export const ruleKeys = Object.keys(texts_rules) as Array<keyof typeof texts_rules>
