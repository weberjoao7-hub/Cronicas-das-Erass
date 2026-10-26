# Referências visuais para o Work — Crônicas das Eras

Esta pasta é o ponto central das **referências para produção de sprites profissionais**. Os arquivos de referência ilustrados produzidos no ChatGPT devem ser adicionados aqui como PNG/JPG; não são sprites prontos para o jogo.

## Direção de arte
RTS isométrico medieval com personagens e construções estilizados, mas ricos em detalhes, coerentes em escala, luz e perspectiva. Não utilizar fotografias recortadas, fundos retangulares ou personagens que pareçam flutuar.

## Entregas solicitadas ao Work
1. **Aldeão**: idle, caminhada (8 direções quando possível), corte de madeira, mineração, agricultura, construção, carregamento e pesca.
2. **Tropas**: guerreiro, arqueiro e cavalaria; idle, deslocamento, ataque, dano e morte.
3. **Fauna**: pássaros com ciclo de asas e peixes com nado e curvas, discretos e proporcionais ao cenário.
4. **Ambiente**: árvores de diferentes espécies, troncos, rochas, campos cultivados, margens de lago, vegetação aquática e efeitos.
5. **Construções**: aldeia, cabana, fazenda, moinho, mina, quartel, torre, pesqueiro e ponte, com variações por era.

## Padrões técnicos
- Exportar PNG com canal alfa real (sem fundo), sem halos, com pivô documentado na base/pés.
- Manter direção de luz superior esquerda, projeção isométrica consistente, escala uniforme e sombras de contato separadas.
- Spritesheets com dimensões e metadados JSON: largura, altura, duração, direção, evento e ponto de ancoragem de cada quadro.
- Validar no Safari iPhone e desktop; otimizar atlas, evitar excesso de memória de textura.
- Integrar primeiro um aldeão completo e testar no mapa, atrás e à frente de árvores/edifícios.
- **Preservar a chave de salvamento `cronicas-v04`** e os comportamentos existentes.
- Não substituir a arte do jogo por uma prancha de conceitos recortada sem limpeza, rigging e consistência entre quadros.

## Referências visuais anteriores
As pranchas conceituais foram geradas na conversa do ChatGPT, mas **não estão incluídas automaticamente neste repositório**. Inserir aqui os PNGs originais antes de iniciar a produção e referenciá-los neste documento.

## Organização
- `conceitos/`: imagens de referência e moodboards.
- `personagens/`: fichas de personagem, vistas e poses.
- `fauna/`: peixes, aves e animais terrestres.
- `cenario/`: árvores, lagos, terrenos e objetos.
- `construcoes/`: edifícios por era.
- `especificacoes/`: documentação de escala, animação e exportação.

O diretório `assets/` do projeto deve receber somente **arquivos finais de runtime**, não imagens conceituais.
