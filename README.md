# Crônicas das Eras ⚔️

Jogo de estratégia em tempo real (RTS) isométrico para navegador desktop e celular. **Versão experimental v6.39** — ainda em desenvolvimento; a qualidade gráfica e a compatibilidade com Safari físico não estão validadas.

## Jogar
Acesse o [jogo no GitHub Pages](https://weberjoao7-hub.github.io/Cronicas-das-Erass/). A publicação exige que o GitHub Pages esteja ativado para a branch `main`, diretório `/(root)`.

## Atualização v6.39 — Pontes históricas em oito eras
- As pontes existentes evoluem visualmente conforme a era: tabuleiro e pilares de madeira nas eras iniciais, arcos e guarda-corpos de pedra a partir da Clássica, longarinas e rebites metálicos na Industrial, e pavimento com marcações na Contemporânea.
- A construção progressiva continua visível, com os elementos mais avançados aparecendo apenas quando o estágio da obra permite; orientação nos dois eixos isométricos preservada.
- Renderização simplificada no zoom distante, sem novos recursos externos, sem mudanças na navegação, nos custos ou no salvamento `cronicas-v04`. Testes em `tests/bridge-era-visual.test.cjs`; inspeção em Safari iPhone físico ainda pendente.

## Atualização v6.38 — Margens vivas dos lagos
- `riparianMask` pré-calculada em 25.600 células identifica pradarias e campos adjacentes aos lagos, sem repetir buscas por vizinhos em cada quadro.
- Juncos nas arestas isométricas e salgueiros isolados com tronco, copa em camadas e galhos pendentes animados, todos ancorados ao terreno.
- LOD: nenhum detalhe abaixo de 28 px; juncos simplificados no zoom intermediário; salgueiros apenas acima de 65 px. Sem vegetação decorativa sobre construções, estradas ou ruínas.
- Regressões em `tests/riparian-visual.test.cjs`. Sem mudanças em economia, IA, rotas ou salvamento `cronicas-v04`. Safari iPhone físico e FPS reais ainda pendentes.

## Atualização v6.37 — Guardas rivais históricos e isolamento do atlas
- Guardas inimigos agora utilizam o atlas animado de guerreiros já existente, com armaduras e equipamentos correspondentes às oito eras, poses de marcha e ataque, orientação e pés ancorados ao terreno.
- Uma faixa carmesim com broche e anel discreto no solo identificam o time rival sem duplicar a textura. O renderizador Canvas anterior continua disponível durante impactos, zoom distante ou falha no carregamento.
- Cada um dos 32 quadros do atlas de tropas possui uma área de recorte SVG independente, evitando vazamento visual entre quadros adjacentes.
- Testes de regressão em `tests/enemy-atlas.test.cjs` e `tests/troop-svg-atlas.test.cjs`. Nenhuma alteração na economia, combate, rotas ou chave de salvamento `cronicas-v04`. Safari iPhone físico e FPS continuam pendentes.

## Atualização v6.36 — Cavalaria histórica
- Integrado atlas de 16 quadros para cavaleiros, com quatro períodos históricos, poses de repouso, galope e ataque, espelhamento e ancoragem dos cascos.
- O renderizador procedural permanece como alternativa em zoom distante, impactos ou falha de carregamento. Testes em `tests/cavalry-svg-atlas.test.cjs`.

## Atualização v6.35 — Atlas de guerreiros e arqueiros por era
- Criado `assets/cronicas_tropas_atlas.svg` (256 × 896 px): **32 quadros transparentes** de 64 × 112, distribuídos por quatro períodos visuais (Primordial/Tribal, Antiga/Clássica, Medieval/Renascentista, Industrial/Moderna), duas classes e quatro poses por classe.
- Guerreiros exibem espada, escudo, armadura e capacete específicos de cada período; arqueiros exibem arco, aljava, flechas e equipamentos históricos. As poses incluem repouso, dois passos e ataque.
- O Canvas seleciona a linha conforme a era e a classe, orienta o personagem na direção da marcha, e mantém os pés ancorados ao terreno. O atlas é usado apenas em zoom ≥ 0,72×; em carregamento incompleto, zoom distante ou impacto recente, permanece o desenho Canvas anterior. A cavalaria e os inimigos não foram modificados.
- Regressões em `tests/troop-svg-atlas.test.cjs` verificam 32 quadros, seleção por oito eras, poses, direção, ancoragem e fallback. Nenhuma alteração na IA, economia, combate ou chave `cronicas-v04`. A arte ainda é SVG vetorial; faltam sprites profissionais e inspeção visual em Safari iPhone físico.

## Atualização v6.34 — Atlas de tarefas dos aldeões
- Integrado `assets/cronicas_aldeoes_trabalho.svg` com 16 quadros para madeira, mineração, agricultura e construção nas duas primeiras eras, com objetos de trabalho ancorados ao chão e fallback procedural.
- Regressões em `tests/villager-work-atlas.test.cjs`. O trabalho e o salvamento existentes foram preservados.

## Atualização v6.33 — Primeiro atlas SVG real de aldeões
- Adicionado `assets/cronicas_aldeoes_atlas.svg`, com seis quadros transparentes (336 × 104 px, quadros de 56 × 104) e detalhes desenhados em camadas: chapéu, rosto, túnica, cinto, bolsa, machado, braços e pernas.
- Nas eras Primordial e Tribal, aldeões parados usam dois quadros de repouso e aldeões caminhando usam quatro quadros de marcha. O desenho é ancorado aos pés no terreno, sem retângulo de fundo.
- O atlas é carregado como imagem local pelo Canvas; se indisponível, em zoom distante ou em eras posteriores, o jogo mantém o renderizador anterior. As ações de trabalho ainda utilizam as animações existentes.
- Regressões em `tests/villager-svg-atlas.test.cjs` verificam seis quadros, seleção de poses, fallback, sintaxe e preservação do salvamento `cronicas-v04`. O resultado ainda é arte vetorial estilizada; sprites profissionais renderizados no Blender e teste visual no Safari físico continuam pendentes.

## Atualização v6.31 — Redes de pesca e limite de memória Retina
- Barcos pescando exibem rede trapezoidal ancorada no casco, malha com fios cruzados, boias, pequenos peixes e ondulações; o material da rede acompanha as eras, com oscilação calculada a partir do relógio do quadro.
- LOD omite completamente a rede abaixo de 24 px de largura projetada, simplifica abaixo de 38 px e reserva boias e peixes para zoom próximo (55 px ou mais). Não altera rotas, produção, IA ou dados persistidos.
- O canvas usa um orçamento de pixels: 2,6 milhões em dispositivos de toque/viewport estreito e 6 milhões em desktop, com DPR máximo de 2. Um iPhone de 390 × 634 mantém DPR 2; tablets Retina reduzem a escala de backing store para limitar uso de memória.
- Regressões em `tests/fishing-net-retina.test.cjs` cobrem sintaxe, malha, LOD, animação e dimensões de canvas. Testes reais de Safari e FPS em hardware permanecem pendentes.

## Atualização v6.30 — Fauna isométrica por bioma
- Raposas raras nas pradarias, javalis nas florestas e lobos nas colinas; cervos, coelhos e peixes continuam presentes. Silhuetas individuais com patas, caudas, orelhas, focinhos e movimento procedural leve, ancoradas no terreno.
- Javalis podem ser caçados por aldeões e rendem 20 alimentos. Raposas e lobos são fauna ambiental, sem comando de caça; nenhuma nova IA hostil foi introduzida.
- Desenho omitido no zoom distante (LOD); sem novos campos de salvamento, preservando `cronicas-v04`. Testes de regressão em `tests/wildlife-diversity.test.cjs`. Safari iPhone físico e desempenho real ainda não validados.

## Atualização v6.16 — Quartéis evolutivos isométricos
- Primordial e Tribal: paliçada, barraca de madeira/couro, pátio, manequim de treino, escudo, lança e estandarte animado; a era Tribal acrescenta um pórtico reforçado.
- Era Antiga: quartel de pedra existente; eras Medieval e seguintes: coberturas volumétricas, brasão e bandeira; era Industrial: telhados metálicos e lanternas.
- Níveis de detalhe e relógio de quadro unificado, sem modificar recrutamento, economia, colisões, mapa ou salvamento `cronicas-v04`. Regressões em `tests/barracks-era.test.cjs`. Safari físico e FPS real ainda não medidos.

## Atualização v6.15 — Florestas vivas e sub-bosque isométrico
- Pinheiros, carvalhos e bétulas agora possuem copas com oscilação procedural ao vento, mantendo os troncos e as sombras de contato imóveis. O movimento depende do tempo e de uma semente local, sem introduzir estados persistentes.
- Bosques em zoom próximo recebem serapilheira e cogumelos sob as árvores; os detalhes são omitidos no zoom distante e a oscilação é desativada abaixo de 0,72× para reduzir o custo de renderização no Safari móvel.
- Nenhuma alteração de terreno, colisão, IA, economia ou chave de salvamento `cronicas-v04`. Testes em `tests/forest-motion.test.cjs`; compatibilidade visual e FPS em Safari físico ainda não medidos.

## Atualização v6.14 — Seleção por toque e profundidade das tropas
- No iPhone, em **Tropas → Selecionar área (arrastar)**, desenhe um retângulo sobre unidades militares vivas e visíveis. Fora desse modo, o arrasto continua movendo o mapa; a pinça continua controlando o zoom.
- Aliados e inimigos no mesmo ladrilho agora são desenhados pela profundidade isométrica; inimigos ocultos pela névoa não são desenhados.
- Unidades em marcha levantam poeira discreta no solo, omitida no zoom distante e em água/montanhas para reduzir custo gráfico.
- A economia, IA, colisões e chave de salvamento `cronicas-v04` foram preservadas. Testes em `tests/mobile-rts-visual.test.cjs`. Safari físico e FPS real ainda não foram medidos.

## Atualização v6.13 — Rotas táticas e névoa de guerra
- O mapa agora desenha rotas tracejadas animadas para **até oito unidades selecionadas**, com cores por classe e marcador pulsante no destino. Funciona também na seleção múltipla feita pelo menu do iPhone.
- Cada nó do caminho é verificado contra a visão atual **antes** da simplificação por zoom: o traçado para ao entrar na névoa. Bandeiras de ordens de tropas não selecionadas também ficam ocultas em destinos invisíveis.
- Zoom distante omite trajetórias para preservar legibilidade e desempenho. Não há alteração de economia, movimentação, IA ou chave de salvamento `cronicas-v04`.
- Regressões em `tests/order-overlay.test.cjs`. Ainda faltam inspeção visual e medição de FPS no Safari iPhone físico.

## Atualização v6.12 — Seleção múltipla e formações RTS
- No desktop, **Shift + arrastar** desenha um retângulo de seleção sobre as tropas visíveis; **Ctrl + Shift + arrastar** acrescenta unidades à seleção. Trabalhadores, unidades derrotadas e inimigos não são incluídos.
- O clique direito move as tropas selecionadas em formação, distribuindo os destinos por terrenos transitáveis; **Shift + clique direito** continua movimentando todo o exército. A tecla **M** permite escolher um destino para o grupo.
- No iPhone e desktop, o menu **Tropas → Selecionar tropas visíveis** permite formar um grupo sem arrastar; **Mover seleção** aguarda um toque no destino. A seleção apresenta anéis turquesa e, no desktop, um retângulo translúcido.
- A seleção é transitória e não modifica o salvamento `cronicas-v04`. Testes de regressão em `tests/group-selection.test.cjs`. Interação real no Safari iPhone e FPS continuam pendentes de validação.

## Atualização v6.11 — Cobertura do terreno e flechas animadas
- Arqueiros e torres não podem disparar através de montanhas: a linha de tiro amostra o trajeto no mapa e bloqueia ataques quando há relevo intransponível. Arqueiros tentam se reposicionar para encontrar um ângulo de disparo válido.
- Flechas agora giram acompanhando a direção de voo, com haste, ponta metálica, penas e trilha discreta; ao chegar ao alvo, exibem anel de impacto e pequenas partículas, reduzidas em zoom distante.
- Novos testes de obstrução, reposicionamento, projéteis e névoa de guerra em `tests/line-of-sight-projectiles.test.cjs`. Preservado o salvamento `cronicas-v04`.
- A compatibilidade real com Safari físico e a taxa de quadros em iPhone ainda precisam de validação.

## Atualização v6.10 — Equipamento militar por era e combate direcional
- Guerreiros, arqueiros e cavalaria recebem detalhes de equipamento por era: bronze a partir da Antiga, armaduras e heráldica na Medieval e acabamentos metálicos adicionais na Industrial. Os elementos são desenhados sobre os sprites existentes em Canvas isométrico.
- Golpes corpo a corpo recebem arcos de ataque temporários; tropas que atacam guardam a orientação para o alvo, mesmo quando param de caminhar. Arqueiros mantêm seus projéteis existentes.
- O detalhe adicional é omitido no zoom distante para limitar operações de desenho em dispositivos móveis. Não há alterações de atributos, economia, colisões ou chave de salvamento `cronicas-v04`.
- Testes em `tests/troop-era-visual.test.cjs` verificam progressão visual, LOD, golpes, orientação e sintaxe. Safari físico e FPS real permanecem sem validação.

## Atualização v6.8 — Cavalaria
- Cavaleiros desbloqueados na **Era Antiga** e treinados em quartéis por 30 madeira, 45 alimentos e 15 minério. Movem-se a 3,1 terrenos/s, atacam com 26 de dano e alcance 1,8; usam formações e pontos de reunião existentes.
- Montaria desenhada em Canvas isométrico: patas com galope, corpo e cabeça em camadas, sela, cavaleiro, lança, bandeirola e sombras de contato. Detalhes reduzidos em zoom distante.
- Novos comandos de recrutamento no menu Tropas e no quartel, com bloqueio de era; preserva o salvamento `cronicas-v04`.

## Recursos atuais
- Mapa procedural de 160 × 160 terrenos com água, campos, pradarias, florestas, colinas e montanhas. Encostas têm rochas facetadas, cascalho e vegetação alpina com LOD. Lagos com reflexos animados, juncos, vitórias-régias e peixes decorativos, com níveis de detalhe para o zoom móvel.
- Câmera isométrica com zoom, minimapa, exploração e névoa de guerra persistente. Ruínas antigas isométricas (obeliscos e colunatas), marcadas no minimapa somente quando visíveis e exploráveis uma única vez.
- Estradas isométricas conectando construções concluídas ao centro da aldeia: trilhas de terra com pedras e marcas de desgaste, substituídas por calçamento na era Clássica. Uma praça pavimentada destaca o centro da aldeia. Detalhes finos são omitidos em zoom distante para reduzir o custo de renderização.
- Aldeões com coleta, construção e caça; guerreiros corpo a corpo, **arqueiros com arco, aljava e flechas animadas**, inimigos e combate. Arqueiros agora procuram posições de disparo a 2,5–4,4 terrenos do alvo, evitando avançar desnecessariamente até o combate corpo a corpo. **Pontos de reunião** configuráveis na Aldeia e nos Quartéis: unidades recém-recrutadas seguem automaticamente até o destino por caminhos válidos, com bandeiras isométricas animadas no mapa (sem revelar áreas cobertas pela névoa). Arqueiros são treinados no quartel por 25 madeira, 25 alimento e 5 minério, atacam à distância e integram a formação de tropas.
- Cabanas, fazendas, **moinhos isométricos com velas animadas e produção de alimentos**, minas, quartéis, pesqueiros, **pontes de madeira sobre lagos** e **torres de vigia**. Torres concluídas atacam automaticamente guardas inimigos a até aproximadamente cinco terrenos, com flechas animadas.
- Pontes construídas sobre água dominada e conectada a uma margem ou a outra ponte concluída. As pontes permitem travessia real de aldeões e tropas pelo algoritmo A*, com tábuas e guarda-corpos em perspectiva isométrica.
- Sombras projetadas conforme o horário do dia em edifícios isométricos, com simplificação no zoom distante, e fogueiras animadas junto à Aldeia e aos Quartéis, com brasas visíveis em zoom próximo.
- **Evolução visual da sede por era:** suprimentos e banca no pátio inicial, contrafortes e brasão a partir da Era Antiga, torres de pedra e bandeiras na Era Medieval e torre de relógio na Era Industrial. Os detalhes são simplificados conforme o zoom.
- Construção progressiva, evolução de edifícios, ciclo de iluminação e **chuvas com vento, gotas animadas e ondulações na água** em dias determinados pelo calendário do jogo; efeitos meteorológicos puramente visuais, sem alterar os dados salvos. Controles por toque e mouse.
- Salvamento local no navegador usando a chave legada `cronicas-v04`, preservada por compatibilidade.

## Controles
- **Celular:** arraste o mapa com um dedo; use dois dedos para ampliar ou reduzir; toque em terrenos ou unidades para abrir ações. Em **Tropas → Selecionar tropas visíveis → Mover seleção**, toque no destino para mover o grupo; **Mover todos os guerreiros** continua disponível (corrigido na v6.3). Toque na Aldeia ou em um Quartel concluído e escolha **Definir ponto de reunião**; toque no destino explorado para enviar automaticamente os próximos recrutas.
- **Desktop:** arraste o mapa; roda do mouse para zoom; clique direito para ordenar movimentação; Shift + arrastar para selecionar tropas; Ctrl + Shift + arrastar para somar à seleção; clique direito para mover a seleção; Shift + clique direito para mover todo o exército; teclas WASD/setas para câmera, B para construir, G para comandar todo o exército e M para mover a seleção.

## Testes
Execute `node --test tests/*.test.cjs` para validar sintaxe, aldeões, pontes, florestas, lagos, arqueiros, clima, moinhos, pontos de reunião e caminhos isométricos; `node --test tests/watchtower.test.js` para as torres; `node tests/smoke.mjs` para o teste de inicialização simulado. Os testes automatizados **não substituem** testes de interação e desempenho no Safari iPhone ou em navegadores reais. As chuvas surgem nos dias 3, 4 e 7 de cada ciclo de oito dias, com transições graduais. Para visualizar o efeito imediatamente, abra **Ajuda → Testar chuva no mapa**; a prévia não modifica o salvamento.

## Publicação
Em **Settings → Pages → Build and deployment**, selecione **Deploy from a branch**, branch **main**, pasta **/(root)**. O arquivo de entrada é `index.html` e não exige build.

## Atualização v6.7 — Relevo rochoso e otimização da névoa
Colinas e sopés de montanhas agora recebem afloramentos de pedra com faces iluminadas e sombreadas, sombras de contato, seixos e vegetação seca. Nas montanhas, o cascalho e manchas de neve complementam os picos existentes. A quantidade de rochas e os microdetalhes diminuem com o zoom; elementos não são desenhados sobre estradas, construções ou ruínas. Terrenos ainda não explorados desenham apenas a base antes da névoa, evitando processar árvores, animais e construções invisíveis e reduzindo vazamento visual. Os detalhes usam coordenadas e ruído determinístico, sem novos campos de salvamento; a chave `cronicas-v04` foi preservada. Testes em `tests/highlands-visual.test.cjs` cobrem sintaxe, determinismo, LOD, ocupação e integração. Testes de FPS e Safari iPhone físico ainda são necessários.

## Atualização v6.6 — Arquitetura progressiva da sede
O centro da aldeia ganhou uma camada arquitetônica em perspectiva isométrica que muda com o avanço das eras: carga e toldo desde a Era Primordial, alvenaria e brasão a partir da Era Antiga (índice 2), torres com ameias e estandartes animados a partir da Era Medieval (índice 4), e torre central de relógio com ponteiros animados a partir da Era Industrial (índice 6). A decoração da base inimiga não é modificada. Há LOD: a camada é omitida quando a largura projetada do terreno fica abaixo de 24 pixels e os detalhes finos são reduzidos em zoom médio. O salvamento segue em `cronicas-v04`. Os testes em `tests/townhall-era.test.cjs` verificam sintaxe, progressão, LOD e animação determinística. Ainda faltam testes visuais e de desempenho no Safari iPhone físico.

## Atualização v6.5 — Sombras direcionais e fogueiras
As construções concluídas, incluindo o centro rival, recebem sombra de contato e projeção que acompanha a posição simulada do sol. À noite, a projeção longa desaparece; em zoom distante, é omitida para reduzir o custo no Safari. Aldeia e Quartéis agora têm fogueiras com toras cruzadas, duas camadas de chamas e brasas animadas, também com níveis de detalhe. O efeito é somente visual e não modifica a chave de salvamento `cronicas-v04`. Os testes em `tests/lighting-visual.test.cjs` verificam sintaxe, geometria, LOD, alternância dia/noite, determinismo e integração. Não há validação visual em dispositivo físico.

## Atualização v6.4 — Ruínas antigas e expedições
O mapa contém ruínas de pedra com pilares, inscrições, destroços e iluminação sutil. A primeira fica em **82,81**, próxima à aldeia; outras aparecem deterministicamente em pradarias e colinas. Após dominar o terreno, a investigação custa 15 alimentos e recompensa 30 pedra + 18 minério (obelisco) ou 35 pedra + 25 madeira (colunata). Uma ruína intacta bloqueia a construção no seu terreno. O minimapa revela monumentos apenas sob visão atual; o zoom distante omite detalhes. O salvamento continua em `cronicas-v04`, inicializando `ruinsExplored` em partidas antigas.

## Atualização v6.3 — Comandos de tropas e movimentação
O comando **Mover todos os guerreiros** no celular agora aceita o toque no mapa e despacha a formação. Arqueiros procuram posições de tiro fora do alcance corpo a corpo, mantendo o combate à distância; quando não existe rota, a ordem não cria caminhos inválidos. Passos de unidades em movimento levantam poeira discreta em zoom próximo (LOD desativa o efeito no zoom distante ou sobre a água). Indicadores de destino da formação agora incluem arqueiros. Testes novos em `tests/archer-orders.test.cjs` verificam aproximação, combate à distância e toque no destino.

## Atualização v6.2 — Moinhos
Moinhos custam 60 de madeira e 30 de pedra, são construídos em campinas ou pradarias dominadas e produzem 12 alimentos/dia por nível (até nível 3). A construção tem alicerce, faces em perspectiva, telhado, quatro velas animadas e sacos de farinha, com menos detalhes em zoom distante. O sistema de salvamento `cronicas-v04` foi mantido.


## Atualização v6.9 — Fazendas isométricas detalhadas
As fazendas receberam solo em terraços com faces em perspectiva, sulcos e culturas em linhas, irrigação, cercas, celeiro com telhado em duas águas e depósitos. Culturas balançam discretamente ao vento; fazendas de nível 2 têm espigas e as de nível 3, uma carroça de colheita. O nível de detalhe depende do zoom, preservando a chave de salvamento `cronicas-v04`. A atualização é exclusivamente gráfica; não altera custos, produção ou colisões. Os testes estão em `tests/farm-visual.test.cjs`. Testes de FPS e Safari iPhone físico continuam pendentes.
