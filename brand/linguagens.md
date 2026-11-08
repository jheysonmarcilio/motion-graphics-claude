# Cardápio de linguagens visuais

Cada vídeo escolhe **uma linguagem principal** (consistência do começo ao fim). Pode usar **uma linguagem secundária** para separar A-plot e B-plot ou para um momento especial (flashback, "dentro da cabeça"), desde que a troca siga sempre a mesma regra no vídeo inteiro.

Tudo abaixo é feito em three.js + HTML/Canvas/SVG no palco. A biblioteca inteira está liberada: `examples/jsm/` (loaders, controles, efeitos, geometrias, física pré-calculada, etc.).

---

## 1. Explainer flat colorido
**Quando usar:** conceitos, mecanismos, "como funciona", listas, comparações. Tom leve e didático.
- **Cara:** formas chapadas, cores vivas sobre fundo sólido ou de gradiente suave, sombras duras simples, ícones grossos, personagens de formas geométricas com olhos grandes.
- **Paleta exemplo:** creme `#F4EBDD` + azul `#2E5BFF` + coral `#FF6B4A` + preto `#141414`. Ou fundo azul-noite com amarelo e rosa.
- **Personagem:** boneco vetorial (círculo + corpo em pílula, braços em linha grossa, olhos de ponto, sobrancelhas que mudam a expressão). Gestos: apontar, encolher os ombros, susto com "linhas de ação".
- **three.js:** câmera `OrthographicCamera`; `ShapeGeometry`/`ExtrudeGeometry` a partir de `SVGLoader` (dá pra desenhar ícones em SVG e animar); `MeshBasicMaterial`/`MeshToonMaterial`; `Line2`/`LineMaterial` (traços grossos que se desenham com `dashOffset`); `TextGeometry` ou HTML para texto.
- **Transições:** wipe por forma (círculo crescendo da cor da próxima cena), objeto que vira o próximo (match cut de forma), zoom through um ícone.
- **Humor:** exagero de expressão, ícone de "!" ou "?" saltando, objeto que cai na cabeça do boneco.

## 2. Colagem / mixed media
**Quando usar:** histórias reais, casos históricos, pessoas citadas, cultura pop, "a internet acredita que…". Ritmo de vídeo-ensaio.
- **Cara:** recortes com borda branca (sticker), textura de papel e de fita adesiva, foto P&B com retícula, rabiscos e setas feitas à mão, círculo de marca-texto, recortes de jornal, carimbos.
- **Paleta exemplo:** papel `#EDE6D6` + preto + vermelho `#E63946` + uma cor de marca-texto (`#FFE14D`).
- **Personagem:** foto recortada de domínio público / licença livre (créditos no roteiro) **ou** silhueta recortada em papel com rosto desenhado. Nunca imagem que imite uma pessoa real sem fonte.
- **three.js:** planos (`PlaneGeometry`) com texturas de canvas (borda branca, sombra, papel) em camadas Z para parallax; leve rotação aleatória por PRNG; `stop-motion` de 12 fps (quantizar `t` só nesses elementos); rabiscos com `Line2` + jitter; `HalftonePass`/shader de retícula em fotos.
- **Transições:** página virando, recorte rasgando, mão/papel deslizando por cima, flash de fotocópia.
- **Humor:** carimbo "MITO", setinha "este cara →", balão de fala colado, zoom dramático em detalhe.

## 3. 3D de brinquedo / diorama
**Quando usar:** experimentos, situações do dia a dia, "imagine que…", cenas com várias pessoas, lugares (laboratório, sala de aula, consultório, cidade).
- **Cara:** mundos em miniatura low-poly, cores pastel ou saturadas, luz suave de estúdio, sombras macias, profundidade de campo de maquete (tilt-shift), objetos com bordas arredondadas.
- **Paleta exemplo:** menta `#9FE2BF` + pêssego `#FFB38A` + lilás `#B9A7FF` + madeira `#C68B59`.
- **Personagem:** boneco 3D de brinquedo (corpo cápsula + cabeça esfera, olhos e boca em decal, figurino trocável: jaleco, óculos, cabelo em blocos). Modelos prontos em `examples/models/gltf/`: `RobotExpressive` (emotes: Wave, Yes, No, ThumbsUp, Jump, Dance, Death), `Xbot`/`Soldier`/`Michelle` (andar, correr, dançar), `facecap` (52 expressões faciais), animais (`Flamingo`, `Parrot`, `Horse`, `Stork`).
- **three.js:** `RoundedBoxGeometry`, `MeshStandardMaterial` com roughness alto, `RoomEnvironment`, `PCFSoftShadowMap`, `BokehPass` (tilt-shift), `AnimationMixer.setTime(t)`, `SkeletonUtils.clone` para multidões, física pré-calculada (cair, empilhar, dominó).
- **Transições:** câmera voa de um diorama para outro, mesa gira e revela o próximo cenário, chão se abre.
- **Humor:** boneco tropeça, multidão vira a cabeça ao mesmo tempo, objeto gigante cai no diorama.

## 4. Cinematográfico sombrio
**Quando usar:** crime, casos perturbadores, mistério, manipulação, medo, "o lado escuro de…".
- **Cara:** luz dura e pontual (lanterna, poste, persiana), neblina, grão de filme, vinheta, cores dessaturadas com um acento (vermelho ou âmbar), câmera de segurança, fita de evidência.
- **Paleta exemplo:** carvão `#121417` + azul-frio `#5B7896` + âmbar `#F2A541` + vermelho `#C0392B`.
- **Personagem:** silhueta/manequim (`Xbot` escurecido, sem rosto), sombra na parede, figura em contraluz. Pessoas reais citadas: cartão-arquivo (nome, data, papel no caso) em vez de rosto.
- **three.js:** `SpotLight` com cone volumétrico, `Fog`/`FogExp2`, `FilmPass`, shader de CCTV, `SSAOPass`, cenário com caixas/planos e texturas de canvas, `CSS2DRenderer` para etiquetas de evidência.
- **Transições:** corte seco com flash, apagão, câmera de segurança trocando de canal, foco puxando.
- **Humor:** quase nenhum; no máximo ironia no texto.

## 5. Neural luminoso (a estética antiga, agora restrita)
**Quando usar:** só para "dentro do cérebro", neurônios, ondas cerebrais, transe. **Nunca como linguagem principal de um vídeo inteiro de novo, a menos que o autor peça.** Melhor como linguagem secundária ("o que acontece por dentro").
- **Cara:** partículas, bloom, redes de pontos e linhas, fundo escuro, ciano/violeta.
- **three.js:** `Points` + `MeshSurfaceSampler`, `UnrealBloomPass`, shaders aditivos (brilho base baixo, ~0.3–0.5, para não estourar).
- **Proibido repetir:** a mesma cabeça/busto de partículas por mais de 2 planos seguidos ou como herói de dois vídeos seguidos.

## 6. Sticker (só quando o autor pedir)
**Quando usar:** só quando o autor pedir "estilo Sticker". Histórias reais curiosas com causa e efeito físico, contadas como desenho animado.
- **Cara:** personagens 2D chapados (figurinhas com contorno ameixa, cabeça de feijão) dentro de um mundo 3D pintado à mão com contorno preto de tinta, céu saturado, luz quente + sombra azul-violeta, profundidade de campo, câmera deslizando com push-in constante.
- **Receita completa, valores medidos e código-fonte para portar:** skill `.claude/skills/estilo-sticker/`.

---

## Combinações que funcionam bem
| A-plot (história) | B-plot (explicação) | Exemplo |
|---|---|---|
| Colagem (o caso real, as pessoas) | Explainer flat (o mecanismo) | estudo de Stanford: Spiegel em colagem; o cérebro em diagrama flat |
| Diorama (a situação) | Neural luminoso (o que acontece dentro) | pessoa sendo hipnotizada no consultório → mergulho no cérebro |
| Cinematográfico (o crime) | Colagem (arquivos, depoimentos) | caso de falsa memória num tribunal |
| Explainer flat (o dia a dia) | Diorama (o experimento) | "por que você esquece onde pôs a chave" |

## Biblioteca de recursos (misturar à vontade dentro da linguagem)
- **Pessoas:** personagem da linguagem do vídeo + cartão de nome (nome, cargo, lugar, ano).
- **Lugares:** mapa (flat, de papel ou 3D), globo, prédio/fachada icônica, pino caindo.
- **Números:** objetos contáveis (60 bonequinhos, potes, moedas), barra que cresce, ponteiro, relógio, calendário arrancando folhas.
- **Comparações:** split-screen, balança, antes/depois com cortina, dois personagens lado a lado.
- **Tempo/história:** linha do tempo que a câmera percorre, calendário, foto envelhecendo.
- **Conceitos abstratos → objeto concreto:** foco = lanterna/lupa; crítica = porteiro/segurança na porta; sugestão = bilhete passado por baixo da porta; memória = arquivo/gaveta/fita VHS; atenção = holofote.
- **Ênfase:** zoom-punch, freeze-frame com contorno, carimbo, setas desenhadas, marca-texto, tremor.
