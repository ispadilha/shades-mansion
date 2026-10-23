export const texts_rules = {
    overview: {
        name: {
            enUS: "Overview",
            ptBR: "Visão geral",
        },
        description: {
            enUS:
                "Three teams compete for the mansion and only one of them will conquer it. Light, Gray and Dark each field six characters, and the match ends when a single team still has characters on the board.\n\n" +
                "Play is turn-based character by character.",
            ptBR:
                "Três times competem pela mansão e só um deles a conquistará. Os times Claro, Cinza e Escuro têm seis personagens cada, e a partida acaba quando um único time ainda tem personagens no tabuleiro.\n\n" +
                "O jogo é por turnos, personagem a personagem.",
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
                "Light, Gray and Dark each start with six characters, one of each type: A (Agile), B (Barrier), C (Champion), D (Distance), E (Exotic) and F (Firestarter).\n\n" +
                "The six types are the same for the three teams, and no two of them are alike: they differ in how far they walk, how far they reach, how much vigor they have, the dice their blow rolls and how well they defend themselves.\n\n" +
                "Dark starts spread along the top row of the board, Gray along the middle row and Light along the bottom row.",
            ptBR:
                "Claro, Cinza e Escuro começam com seis personagens cada, uma de cada tipo: A (Ágil), B (Barreira), C (Campeão), D (Distância), E (Exótico) e F (Fogo).\n\n" +
                "Os seis tipos são os mesmos para os três times, e não há dois iguais: eles se diferenciam em quanto andam, quanto alcançam, quanto vigor têm, os dados que o golpe deles rola e o quanto conseguem se defender.\n\n" +
                "As personagens escuras começam espalhadas na linha de cima do tabuleiro, as cinzas na linha do meio e as claras na linha de baixo.",
        },
    },

    characterTypes: {
        name: {
            enUS: "The six types",
            ptBR: "Os seis tipos",
        },
        description: {
            enUS:
                "The A (Agile) characters — the Drone, the Wildcat and the Ghost — move the farthest, but hit the softest and have the least vigor. In exchange, no other character slips out of a blow completely as often.\n\n" +
                "The B (Barrier) characters — the Paranormal Investigator, the Witch and the Cultist — are the middle of the table in a fight. They can close a corridor by lighting paranormal barriers, which let only their own team through.\n\n" +
                "The C (Champion) characters — the Modern Paladin, the Werewolf and the Vampire — are the heaviest of all, with the most vigor and the strongest blow, but have the most limited movement. Their charge makes up for it: they run berserk in a straight line.\n\n" +
                "The D (Distance) characters — the Police Officer, the Warrior Shaman and the Renegade — may shoot from where they stand, and still duck a blow now and then.\n\n" +
                "The E (Exotic) characters — the Robot, the Cryptid and the Monster — sit between the middle and the top, in vigor and strength. They can mimic the abilities of characters of other types.\n\n" +
                "The F (Firestarter) characters — the Inventor, the Alien and the Mad Doctor — may shoot a fireball from a moderate distance, and affect an area.\n\n" +
                "Right-click a character and ask for its information to see its numbers, including how much vigor it currently has.",
            ptBR:
                "Os personagens A (Ágeis) — o Drone, o Gato Selvagem e o Fantasma — são os que se movem mais longe, mas os que batem mais fraco e têm menos vigor. Em compensação, nenhuma outra personagem desvia de ataques com tanta frequência.\n\n" +
                "Os personagens B (Barreira) — o Investigador Paranormal, a Bruxa e o Cultista — são o meio da tabela em uma luta. Eles podem fechar um corredor acendendo barreiras paranormais, que deixam passar só o próprio time.\n\n" +
                "Os personagens C (Campeões) — o Paladino Moderno, o Lobisomem e o Vampiro — são os mais pesados de todos, com o maior vigor e o golpe mais forte, mas têm o movimento mais limitado. A investida compensa isso: eles correm enfurecidos em linha reta.\n\n" +
                "Os personagens D (Distância) — o Policial, o Xamã Guerreiro e o Renegado — podem atirar de onde estão, e ainda desviam de um golpe de vez em quando.\n\n" +
                "Os personagens E (Exóticos) — o Robô, o Criptídeo e o Monstro — ficam entre o meio e o topo, no vigor e na força. Eles podem imitar as habilidades de personagens de outros tipos.\n\n" +
                "Os personagens F (Fogo) — o Inventor, o Alien e o Doutor Louco — podem atirar uma bola de fogo a uma distância moderada, e afetar uma área.\n\n" +
                "Clique com o botão direito em uma personagem e peça a informação dela para ver seus números, inclusive quanto vigor possui no momento.",
        },
    },

    affinity: {
        name: {
            enUS: "Affinity",
            ptBR: "Afinidade",
        },
        description: {
            enUS:
                "Within each team, the six characters form three duos that motivate each other: the Agile with the Barrier, the Champion with the Distance shooter, and the Exotic with the Firestarter.\n\n" +
                "When a character starts its turn next to its partner, and either of them has lost vigor, both roll their affinity dice: each of them recovers the vigor rolled, up to its maximum.\n\n" +
                "A duo that stays side by side gets this roll twice per round, once at the start of each one's turn. The higher the level of either of them, the stronger the dice.",
            ptBR:
                "Dentro de cada time, as seis personagens formam três duplas que motivam-se entre si: o Ágil com o de Barreira, o Campeão com o de Distância, e o Exótico com o de Fogo.\n\n" +
                "Quando uma personagem começa o turno ao lado da parceira, e alguma das duas perdeu vigor, as duas rolam os dados de afinidade: cada uma revigora o que sair, até o seu vigor máximo.\n\n" +
                "Uma dupla que fica lado a lado ganha essa rolagem duas vezes por rodada, uma no começo do turno de cada uma. Quanto mais alto o nível de qualquer uma delas, mais forte o dado.",
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
                "Between choosing your side and entering the mansion, all the characters line up — Light, Gray then Dark — and roll their initiative one at a time: dice thrown together, counted as their sum. A total already taken is refused and the character rolls again, so the values are always different.\n\n" +
                "The rolls are sorted from the highest to the lowest and that becomes the order of play for the whole match. The order never changes: characters that have left the mansion are simply skipped.",
            ptBR:
                "Entre a escolha de time e a entrada na mansão, todos os personagens se enfileiram — Claros, Cinzas e Escuros — e rolam a iniciativa um de cada vez: dados jogados juntos, valendo a soma. Um total que já saiu é recusado e o personagem rola de novo, então os valores são sempre diferentes.\n\n" +
                "As rolagens são ordenadas do maior para o menor e isso vira a ordem das vezes na partida inteira. A ordem nunca muda: as personagens que já fugiram da mansão são apenas puladas.",
        },
    },

    turns: {
        name: {
            enUS: "Turns and actions",
            ptBR: "Turnos e ações",
        },
        description: {
            enUS:
                "A turn belongs to a single character. When the order of turns reaches its end, a new round starts.\n\n" +
                "Click the character of the turn to select it and see its ranges highlighted; right-click a cell for the available action. End Turn passes play to the next character in the order.",
            ptBR:
                "O turno é de uma personagem só. Quando a ordem de turnos chega ao fim, começa uma nova rodada.\n\n" +
                "Clique na personagem da vez para selecioná-la e ver os alcances destacados; clique com o botão direito em uma casa para a ação disponível. \"Terminar turno\" passa a vez para a próxima personagem da ordem.",
        },
    },

    movement: {
        name: {
            enUS: "Movement",
            ptBR: "Movimento",
        },
        description: {
            enUS:
                "Characters walk one cell at a time, up, down, left or right.\n\n" +
                "Allied characters do not block a corridor: a character walks through the cells they occupy, but cannot finish its move on top of one. Opponent characters close the way, and so do the paranormal barriers of other teams.\n\n" +
                "The Champion's charge is the exception: it runs in a straight line, in any direction, and goes over the characters in the way. Only walls and other teams' barriers stop it.",
            ptBR:
                "As personagens andam uma casa por vez, para cima, para baixo, para a esquerda ou para a direita.\n\n" +
                "Personagens aliadas não bloqueiam o corredor: a personagem atravessa as casas ocupadas por elas, mas não pode terminar o movimento em cima de nenhuma. Personagens adversárias fecham a passagem, assim como as barreiras paranormais de outros times.\n\n" +
                "A investida do Campeão é a exceção: ela corre em linha reta, em qualquer direção, e passa por cima das personagens no caminho. Só paredes e barreiras de outros times a param.",
        },
    },

    combat: {
        name: {
            enUS: "Combat",
            ptBR: "Combate",
        },
        description: {
            enUS:
                "Melee characters attack by walking to a free cell next to the target and striking on arrival. The walk has to fit inside the character's attack range.\n\n" +
                "The shooter and the firestarter attack from where they stand, at anything with a clear line of fire. The firestarter may also aim at an empty cell.\n\n" +
                "Every blow is settled by two rolls, one after the other. First the attacker rolls the dice of its own blow. Then the character being attacked answers with a defense roll, which decides how much of that damage actually lands.\n\n" +
                "A character that runs out of vigor gives up the dispute and leaves the mansion.",
            ptBR:
                "As personagens corpo a corpo atacam caminhando até uma casa livre ao lado do alvo e golpeando ao chegar. A caminhada precisa caber no alcance de ataque da personagem.\n\n" +
                "A personagem atiradora e a de fogo atacam de onde estão, qualquer alvo com a linha de tiro livre. A de fogo pode mirar também uma casa vazia.\n\n" +
                "Todo ataque é resolvido em duas rolagens, uma depois da outra. Primeiro a personagem atacante rola os dados de seu golpe. Depois a personagem atacada responde com a rolagem de defesa, que decide quanto desse dano chega de fato.\n\n" +
                "A personagem que fica sem vigor desiste da disputa e sai da mansão.",
        },
    },

    defense: {
        name: {
            enUS: "Dodge and guard",
            ptBR: "Esquiva e aparo",
        },
        description: {
            enUS:
                "An attacked character may defend itself by rolling a die against two numbers of its own: the dodge and the guard.\n\n" +
                "Reaching the dodge, the character gets out of the way entirely and takes nothing. Reaching only the guard, it holds what it can and takes only a part of the damage. Below both, the blow lands whole.\n\n" +
                "The guard is within reach of every character, so any of them can soften a blow. The dodge is not: heavy characters are too slow to leave the ground.\n\n" +
                "A fire reaches several characters at once, and each of them rolls its own defense.\n\n",
            ptBR:
                "Uma personagem atacada pode se defender rolando um dado contra dois números próprios: a esquiva e o aparo.\n\n" +
                "Alcançando a esquiva, a personagem sai inteira da frente e não leva nada. Alcançando só o aparo, ela segura o que pode e leva só uma parte do dano. Abaixo dos dois, o golpe entra inteiro.\n\n" +
                "O aparo está ao alcance de qualquer personagem, então todas conseguem amortecer um golpe. A esquiva não: as personagens pesadas são lentas demais para sair do chão.\n\n" +
                "Um incêndio alcança várias personagens de uma vez, e cada uma rola a defesa dela.\n\n",
        },
    },

    areaDamage: {
        name: {
            enUS: "Fire and area damage",
            ptBR: "Fogo e dano em área",
        },
        description: {
            enUS:
                "The firestarter shoots from a distance, and where the shot lands an area catches fire. It is the only character that can aim at the ground.\n\n" +
                "The fire does not tell friend from foe: every character standing on a burning cell takes damage, including the firestarter's own team and the firestarter itself when it fires at something too close. Each of them rolls its own defense.\n\n" +
                "Strategy often involves caution.",
            ptBR:
                "A personagem incendiária atira a alguma distância, e onde o tiro cai uma área pega fogo. Esta é a única personagem que pode mirar o chão.\n\n" +
                "O fogo não distingue amigo de inimigo: toda personagem em uma casa em chamas leva dano, inclusive as do próprio time da incendiária e até ela mesma, quando atira em algo perto demais. Cada uma delas rola a própria defesa.\n\n" +
                "A estratégia muitas vezes envolve cautela.",
        },
    },

    barriers: {
        name: {
            enUS: "Paranormal barriers",
            ptBR: "Barreiras paranormais",
        },
        description: {
            enUS:
                "The Barrier character lights paranormal barriers at a distance. A barrier closes its cell to the other teams: their characters cannot walk through it, and it stops their shots and their fire. Its own team walks through it as usual, and it goes out on its own when the turn of the character that lit it comes around again.\n\n" +
                "A character standing on a barrier of its own team is protected: no opponent can attack it there, up close or from afar. To attack it, the barrier has to be dispelled first.\n\n" +
                "An opponent can try to dispel a barrier the way it attacks in melee: it walks to a cell next to the barrier and rolls a die, which has to come out high, the same for any character. If it does, that barrier is dispelled, and only that one. The attempt spends the character's action whether it works or not.\n\n" +
                "Skills are no use for attacking the barriers, with one exception: the Agile character's extra move gives the character its usual options back, and a new attempt comes with them.",
            ptBR:
                "A personagem de Barreira acende barreiras paranormais à distância. Uma barreira fecha a casa para os outros times: as personagens deles não passam por ela, e ela segura os tiros e o fogo deles. O time dela passa normalmente, e ela se apaga sozinha quando a vez da personagem que a acendeu volta.\n\n" +
                "Uma personagem em cima de uma barreira do próprio time fica protegida: nenhuma personagem adversária consegue atacá-la ali, nem de perto nem à distância. Para atacá-la, é preciso antes dissipar a barreira.\n\n" +
                "Uma personagem adversária pode tentar dissipar uma barreira como quem ataca corpo a corpo: ela anda até uma casa ao lado da barreira e rola um dado, que precisa dar um resultado alto, o mesmo para qualquer personagem. Conseguindo, aquela barreira se dissipa, e só ela. A tentativa gasta a ação da personagem, dando certo ou não.\n\n" +
                "Habilidades não servem para atacar barreiras, com uma exceção: o movimento extra da personagem Ágil devolve à personagem as opções de sempre, e com elas vem uma nova tentativa.",
        },
    },

    highlights: {
        name: {
            enUS: "Highlighted cells",
            ptBR: "Casas destacadas",
        },
        description: {
            enUS:
                "The character that acts (the character of the turn, or a manipulated one) shows around it what it can do now: orange on the cells it can walk to, and red on the ones only its attack reaches.\n\n" +
                "Orange is ground the character can take, and strike from. Red is a target it can hit without standing there: an occupied cell, or a spot further than its legs but still within its attack reach.\n\n" +
                "An opponent's barrier turns red when the character can try to dispel it. On a cell where a character is protected by its own team's barrier, the red belongs to the barrier: the character cannot be attacked, but the barrier can be dispelled.\n\n" +
                "With a skill in use, the cells where it can be used turn blue: where the character shoots, sets fire, lights a barrier or ends a charge, or, for mimicry, what it can see and the characters it can mimic. Once a character is chosen, the highlights become those of the mimicked skill. Around the fire's blue, the red marks cells that cannot be aimed at, but that the flames may still reach. With a charge, the red marks the characters it could run over on the way. Extra move is the exception: it gives the character back the movement and the strike of its basic action, so it shows the usual orange and red, within the rolled range.\n\n" +
                "Selecting any other character shows how far it will be able to reach on its turn. From the character outward: the orange of its movement, the red of its attack, and a light blue with the maximum reach of its skill (for skills that roll dice, the highest number the dice can give). For the Firestarter, the light blue includes the radius of the flames around where it can aim; for the Champion, the characters its charge could run over on the way turn red. These highlights are only for looking: the menu offers no actions to a character outside its turn.\n\n",
            ptBR:
                "A personagem que age (a da vez, ou uma manipulada) mostra em volta dela o que pode fazer agora: laranja nas casas que ela alcança andando, e vermelho nas que só o ataque dela alcança.\n\n" +
                "O laranja é terreno que a personagem toma, e de onde também ataca. O vermelho é alvo que ela atinge sem pisar ali: uma casa ocupada, ou um ponto além das pernas dela mas ainda ao alcance de ataque.\n\n" +
                "A barreira de outro time fica vermelha quando a personagem pode tentar dissipá-la. Numa casa em que uma personagem está protegida pela barreira do próprio time, o vermelho é da barreira: a personagem não pode ser atacada, mas a barreira pode ser dissipada.\n\n" +
                "Com uma habilidade em uso, as casas em que ela pode ser usada ficam azuis: onde a personagem atira, incendeia, acende uma barreira, termina uma investida ou, na imitação, o que ela enxerga e as personagens que pode imitar. Escolhida a personagem, os destaques passam a ser os da habilidade imitada. Em volta do azul do incêndio, o vermelho marca casas em que não se pode mirar, mas aonde o fogo ainda pode chegar. Na investida, o vermelho marca as personagens que ela pode atropelar no caminho. O movimento extra é a exceção: ele devolve à personagem o movimento e o golpe da ação comum, e por isso mostra o laranja e o vermelho de sempre, no alcance sorteado.\n\n" +
                "Selecionar qualquer outra personagem mostra até onde ela poderá chegar quando for a vez dela. Da personagem para fora: o laranja do movimento, o vermelho do ataque, e um azul claro com o alcance máximo da habilidade dela (nas que rolam dados, o maior número que eles podem tirar). Na incendiária, o azul claro inclui o raio do fogo em volta de onde ela pode mirar; no Campeão, as personagens que a investida pode atropelar no caminho ficam em vermelho. Esses destaques são só para consulta: o menu não oferece ações a uma personagem fora da vez.\n\n",
        },
    },

    items: {
        name: {
            enUS: "Motivation items",
            ptBR: "Itens de motivação",
        },
        description: {
            enUS:
                "The mansion hides items that are valuable to the different characters. Each one is a motivation for the character it belongs to: a reason to recover, to grow, and to stay in the dispute.\n\n" +
                "An item that motivates one of your own characters reinvigorates it when it has lost vigor, and promotes it when it has not. An item that motivates another team's character is a temptation you can use to manipulate it.\n\n",
            ptBR:
                "A mansão esconde itens que são valiosos para as diferentes personagens. Cada um é uma motivação para a personagem a que pertence: um motivo para se recuperar, para evoluir, e para continuar na disputa.\n\n" +
                "Um item que motiva uma personagem sua a revigora, quando ela perdeu vigor, e a promove quando isso não aconteceu. Um item que motiva a personagem de outro time é uma tentação que você pode usar para manipulá-la.\n\n",
        },
    },

    reinvigorating: {
        name: {
            enUS: "Reinvigorating",
            ptBR: "Revigorar",
        },
        description: {
            enUS:
                "Using an item which motivates your own character gives it back the vigor it has lost.\n\n" +
                "Reinvigorating is what the item does while the character is short of vigor. At full vigor, the same item promotes it instead.\n\n" +
                "It can't be used on a character that has already left the mansion, so an item held too long can be lost with its owner.\n\n" +
                "Besides items, the characters of an affinity duo reinvigorate each other when one of them starts its turn next to the other.",
            ptBR:
                "Usar um item que motiva a sua própria personagem devolve a ela o vigor que perdeu.\n\n" +
                "Revigorar é o que o item faz quando a personagem foi atingida em disputas. Com o vigor cheio, o mesmo item a promove.\n\n" +
                "Ele não pode ser usado em uma personagem que já fugiu da mansão, então um item guardado tempo demais pode se perder junto com o dono.\n\n" +
                "Além dos itens, as personagens de uma dupla de afinidade se revigoram quando uma delas começa o turno ao lado da outra.",
        },
    },

    promotions: {
        name: {
            enUS: "Promotions",
            ptBR: "Promoções",
        },
        description: {
            enUS:
                "A character at full vigor has no vigor to get back, so the item promotes it instead: the character goes up a level.\n\n" +
                "Every level adds vigor and reach, makes the guard easier, and moves the damage die up the ladder, to a die with more faces.\n\n" +
                "The dodge is the one thing a promotion doesn't change: a heavy character will still be slow.\n\n" +
                "Right-click a character and ask for its information to see the level it is on.",
            ptBR:
                "Uma personagem com o vigor cheio não tem vigor a recuperar, então o item a promove: ela sobe um nível.\n\n" +
                "Cada nível acrescenta vigor e alcance, deixa o aparo mais fácil, e sobe o dado de dano na escada, para um dado de mais faces.\n\n" +
                "A esquiva é a única coisa em que a promoção não mexe: uma personagem pesada ainda será lenta.\n\n" +
                "Clique com o botão direito em uma personagem e peça a informação dela para ver em que nível ela está.",
        },
    },

    manipulation: {
        name: {
            enUS: "Manipulation",
            ptBR: "Manipulação",
        },
        description: {
            enUS:
                "An item that motivates an opponent's character is a temptation over it. Using it on your turn flips a coin: on heads that enemy character falls under your command for a single action. On tails, it resists.\n\n" +
                "A manipulated character does not attack its allies, but it may be led to attack the third team, or lured into a vulnerable position.\n\n" +
                "Being manipulated is an abnormal action and the character still has its own action when its turn comes, and a character that has already acted can be manipulated all the same.\n\n" +
                "On tails, the item slips out of the manipulator's hands and falls back on the floor, on a random free cell, for whoever reaches it first.",
            ptBR:
                "Um item que motiva a personagem de um oponente é uma tentação sobre ela. Usá-lo no seu turno joga uma moeda: dando cara, aquela personagem inimiga cai sob o seu comando por uma única ação. Se der coroa, ela resiste.\n\n" +
                "Uma personagem manipulada não ataca as próprias aliadas, mas pode ser levada a atacar o terceiro time, ou induzida a uma posição vulnerável.\n\n" +
                "Ser manipulada é uma ação anormal e a personagem continua com sua ação quando chegar a vez dela, e uma personagem que já agiu pode ser manipulada do mesmo jeito.\n\n" +
                "Dando coroa, o item escapa das mãos de quem tentou uma manipulação e cai de volta no chão, em uma casa livre sorteada, para quem chegar primeiro.",
        },
    },

    victory: {
        name: {
            enUS: "Victory",
            ptBR: "Vitória",
        },
        description: {
            enUS:
                "The mansion will be conquered by one team only. When two of the three sides have seen all their characters flee the mansion, the last one still around wins, however few characters it has left.\n\n",
            ptBR:
                "A mansão será conquistada por um time só. Quando dois dos três lados veem todas as suas personagens fugirem da mansão, o último presente vence, por menos personagens que ainda tenha.\n\n",
        },
    },
}

export const ruleKeys = Object.keys(texts_rules) as Array<keyof typeof texts_rules>
