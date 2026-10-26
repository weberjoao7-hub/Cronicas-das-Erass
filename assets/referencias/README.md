# Referências visuais — Crônicas das Eras

Esta pasta reúne o catálogo de referência para o pipeline de produção no Blender e no Work.

## Pranchas produzidas nesta conversa (a importar)
- `01-aldeoes-fauna-biomas.png` — aldeões, árvores, pássaros, peixes, água.
- `02-cena-isometrica-e-animacoes.png` — composição visual e ações dos aldeões.
- `03-unidades-animais-terrenos.png` — tropas, aldeões, fauna e tiles.
- `04-construcoes-tropas-cerco.png` — edifícios, quartéis, cavalaria, canhões, barcos.
- `05-eras-pesca-barcos.png` — oito eras, casa de pesca, barcos e redes.

## Pipeline recomendado
1. Importar as cinco pranchas para o Blender como **referências**, não como sprites finais.
2. Modelar personagens, barcos e edifícios com câmera isométrica, escala e iluminação fixas.
3. Renderizar cada ação em PNG RGBA com quadros de dimensões iguais e pivô dos pés.
4. Criar atlas por personagem e ação; para edifícios, renderizar uma imagem por era e nível.
5. Validar transparência, ausência de recortes, profundidade, sombra e legibilidade em zoom móvel.
6. Integrar ao renderizador e testar no Safari iPhone e desktop.

**Importante:** as imagens de referência não são atlases prontos para produção. Os PNGs originais estão no pacote ZIP entregue na conversa; o conector GitHub desta sessão aceita conteúdo textual/base64, mas não transferência direta dos arquivos locais para o repositório.
