# Identidade do canal — v1

**Princípio:** o canal é reconhecido pela **voz do autor, pela tipografia e pelo jeito de animar as palavras**. Todo o resto (cores, cenários, estilo, técnica) **muda a cada vídeo** conforme o tema, escolhido na direção de arte (`brand/linguagens.md` + skill `direcao-de-arte`).

> A v0 impunha partículas, rede neural, cabeça de partículas e paleta violeta/ciano em tudo. Isso fez os vídeos 02–04 ficarem iguais. **Essa estética virou só uma opção** ("Neural luminoso", em `linguagens.md`), com restrições de uso.

## O que é FIXO em todo vídeo

### Tipografia
- **Legendas-chave e títulos:** Inter 800, caixa alta, tracking leve (0.02–0.05em). Alto contraste com o fundo (contorno ou sombra quando o fundo for claro ou movimentado).
- **Apoio / etiquetas / dados:** JetBrains Mono 400–700, caixa alta, tracking largo (0.15–0.2em), tamanho pequeno.
- **Números de impacto:** Inter 200–300 gigante ou 800 gigante. Escolher uma das duas formas e mantê-la no vídeo.

### Estilo de legenda (a "assinatura" do canal)
- Até 5 palavras por legenda; **uma palavra-chave em destaque** na cor de destaque do vídeo e o resto em branco/creme (ou preto, em vídeo de fundo claro).
- **Entrada palavra por palavra**, sincronizada com a voz: escala 0.85 → 1 com `backOut` leve + opacidade, 0,12 s entre palavras. **Saída** rápida (0,15 s, `expoIn`), sempre antes da próxima legenda.
- Posição: Short no centro, em y ≈ 1150–1450 (fora do rodapé de 25% e da faixa direita de 15%). Longo no terço inferior ou integrada ao cenário, nunca cobrindo rostos.
- Uma palavra de impacto pode "bater" na tela: escala 1.15 → 1 + tremor de 2 frames + SFX.

### Carimbo final
- A última frase-tese entra como **carimbo**: escala 1.4 → 1 em 0,2 s, leve rotação (−3°), flash e SFX de impacto. Em Shorts, depois dele vem o retorno ao 1º quadro (loop).

### Movimento (regras gerais)
- Nada surge do nada: entra com escala, máscara, desenho de traço ou corte motivado.
- Easing de referência: `expoOut` nas entradas, `expoInOut` nas transições, `backOut` em elementos "pop" (ícones, personagens, adesivos).
- Câmera nunca 100% parada (ver regras de formato no CLAUDE.md).

## O que MUDA a cada vídeo (decidido na bíblia visual)
Linguagem visual, paleta (2–3 dominantes + 1 cor de destaque das legendas), estilo de personagem, cenários, texturas, transições, efeitos e o "herói visual" do vídeo.

## Paleta de referência (opcional)
Útil para a linguagem "Neural luminoso" ou quando o tema pedir clima noturno. **Não é obrigatória.**
`abismo #06060C` · `nevoa #12122A` · `sinapse #3EE6FF` · `consciente #8B6CFF` · `emocao #FF5C7A` · `luz #EEEAFF` · `eco #8A88A8`.
