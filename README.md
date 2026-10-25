# Crônicas das Eras ⚔️

Jogo de estratégia em tempo real (RTS) isométrico para navegador desktop e celular. **Versão experimental v5.3** — ainda em desenvolvimento; a qualidade gráfica e a compatibilidade com Safari físico não estão validadas.

## Jogar
Acesse o [jogo no GitHub Pages](https://weberjoao7-hub.github.io/Cronicas-das-Erass/). A publicação exige que o GitHub Pages esteja ativado para a branch `main`, diretório `/(root)`.

## Recursos atuais
- Mapa procedural de 160 × 160 terrenos com água, campos, pradarias, florestas, colinas e montanhas.
- Câmera isométrica com zoom, minimapa, exploração e névoa de guerra persistente.
- Aldeões com coleta, construção e caça; guerreiros, inimigos e combate.
- Cabanas, fazendas, minas, quartéis, pesqueiros e **torres de vigia**. Torres concluídas atacam automaticamente guardas inimigos a até aproximadamente cinco terrenos, com flechas animadas.
- Construção progressiva, evolução de edifícios, ciclo de iluminação, controles por toque e mouse.
- Salvamento local no navegador usando a chave legada `cronicas-v04`, preservada por compatibilidade.

## Controles
- **Celular:** arraste o mapa com um dedo; use dois dedos para ampliar ou reduzir; toque em terrenos ou unidades para abrir ações.
- **Desktop:** arraste o mapa; roda do mouse para zoom; clique direito para ordenar movimentação; Shift + clique direito para mover o exército; teclas WASD/setas para câmera, B para construir e G para comandar o exército.

## Testes
Execute `node --test tests/watchtower.test.js` para validar o alcance, o dano e a renderização simulada das torres. Os testes automatizados **não substituem** testes de interação e desempenho no Safari iPhone ou em navegadores reais.

## Publicação
Em **Settings → Pages → Build and deployment**, selecione **Deploy from a branch**, branch **main**, pasta **/(root)**. O arquivo de entrada é `index.html` e não exige build.
