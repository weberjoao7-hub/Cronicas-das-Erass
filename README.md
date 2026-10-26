# Crônicas das Eras ⚔️

Jogo de estratégia em tempo real (RTS) isométrico para navegador desktop e celular. **Versão experimental v5.9** — ainda em desenvolvimento; a qualidade gráfica e a compatibilidade com Safari físico não estão validadas.

## Jogar
Acesse o [jogo no GitHub Pages](https://weberjoao7-hub.github.io/Cronicas-das-Erass/). A publicação exige que o GitHub Pages esteja ativado para a branch `main`, diretório `/(root)`.

## Recursos atuais
- Mapa procedural de 160 × 160 terrenos com água, campos, pradarias, florestas, colinas e montanhas. Lagos com reflexos animados, juncos, vitórias-régias e peixes decorativos, com níveis de detalhe para o zoom móvel.
- Câmera isométrica com zoom, minimapa, exploração e névoa de guerra persistente.
- Aldeões com coleta, construção e caça; guerreiros corpo a corpo, **arqueiros com arco, aljava e flechas animadas**, inimigos e combate. Arqueiros são treinados no quartel por 25 madeira, 25 alimento e 5 minério, atacam à distância e integram a formação de tropas.
- Cabanas, fazendas, minas, quartéis, pesqueiros, **pontes de madeira sobre lagos** e **torres de vigia**. Torres concluídas atacam automaticamente guardas inimigos a até aproximadamente cinco terrenos, com flechas animadas.
- Pontes construídas sobre água dominada e conectada a uma margem ou a outra ponte concluída. As pontes permitem travessia real de aldeões e tropas pelo algoritmo A*, com tábuas e guarda-corpos em perspectiva isométrica.
- Construção progressiva, evolução de edifícios, ciclo de iluminação e **chuvas com vento, gotas animadas e ondulações na água** em dias determinados pelo calendário do jogo; efeitos meteorológicos puramente visuais, sem alterar os dados salvos. Controles por toque e mouse.
- Salvamento local no navegador usando a chave legada `cronicas-v04`, preservada por compatibilidade.

## Controles
- **Celular:** arraste o mapa com um dedo; use dois dedos para ampliar ou reduzir; toque em terrenos ou unidades para abrir ações.
- **Desktop:** arraste o mapa; roda do mouse para zoom; clique direito para ordenar movimentação; Shift + clique direito para mover o exército; teclas WASD/setas para câmera, B para construir e G para comandar o exército.

## Testes
Execute `node --test tests/*.test.cjs` para validar sintaxe, aldeões, pontes, florestas, lagos, arqueiros e clima; `node --test tests/watchtower.test.js` para as torres; `node tests/smoke.mjs` para o teste de inicialização simulado. Os testes automatizados **não substituem** testes de interação e desempenho no Safari iPhone ou em navegadores reais. As chuvas surgem nos dias 3, 4 e 7 de cada ciclo de oito dias, com transições graduais.

## Publicação
Em **Settings → Pages → Build and deployment**, selecione **Deploy from a branch**, branch **main**, pasta **/(root)**. O arquivo de entrada é `index.html` e não exige build.
