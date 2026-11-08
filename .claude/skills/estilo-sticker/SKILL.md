---
name: estilo-sticker
description: Estilo de animação "Sticker" — personagens 2D chapados (cartões/figurinhas com contorno de tinta ameixa, cabeça de feijão) num mundo 3D colorido e pintado à mão, com contorno preto de tinta na geometria, céu saturado, profundidade de campo e câmera deslizando. Use SOMENTE quando o autor pedir "estilo Sticker", "linguagem Sticker" ou "no estilo das figurinhas no 3D". Adaptado de github.com/mromidev/claude-animated-shorts (MIT).
---

# Estilo Sticker (2D figurinha num mundo 3D pintado)

Origem: skill `cartoon-3d-short` de mromidev (MIT, `LICENSE-original.txt`), provada no short "The Bridge That Fell for a Song". Lá roda em Remotion + React Three Fiber; **aqui roda no padrão do projeto** (HTML + three.js puro, `renderAt(t)`, `__mg`, `tools/export.js`, `tools/final.cjs`). Só usar quando o autor pedir.

## Arquivos (economia de tokens)
- **Não ler** `referencia/reports/*.md` (10–15 mil tokens cada) nem `templates-ts/` por rotina: os valores abaixo e a lib `demos/_sticker/` já os aplicam. Só em problema específico: `grep -n` pelo número/termo no relatório do tópico (`outlines`, `characters`, `lighting`, `grade`, `depth`, `motion`, `textures`). `templates-ts/` só para portar um recurso que ainda não existe na lib.
- `referencia/frames/*.jpg`: abrir no máximo 1–2 para comparar quando o visual estiver duvidoso. Material privado: nunca publicar nem copiar história/personagem/plano.
- APIs da lib: `grep -n "^export" demos/_sticker/<arquivo>.js` em vez de ler o arquivo (toon.js tem 58 KB).

## Biblioteca pronta: `demos/_sticker/` (porte feito no demo 11 — importar daqui, não portar de novo)
| módulo | uso |
|---|---|
| `toon.js` | original sem tipos + expressões `yawn`, `yawn_half`, `sleepy`. `bodyFront(p, outfit, {expr, mode:'stand'/'stroll'/'march'/'sit'/'fall', phase, blink, look, facing:-1/0/1, wave})`, `bodySide` (andar de perfil, `stride`, `phase`). Chapéus: `cap`, `tophat`, `bonnet`, `shako`; `dress`, `moustache`, `build:'kid'/'stout'`. Efeitos: `fxBurst`, `fxStars`, `fxPuff`, `fxSplash`, `fxRing`, `fxNote` |
| `fx.js` | `dogFront` (cachorro sentado com bocejo/feliz/rabo), `fxYawn` (sopro), `fxSpeed`, `fxBread`, `fxBird`, `fxBang` (! ?), `fxZ`, `fxHeart`, `fxWave` (onda no chão), `cloudCanvas` |
| `cast.js` | `new Cast(root)`; por quadro `begin(camera, W.sunDir, k)` → `person(who, [x,y,z], opts, {lean, mirror, blob})` / `card(key, cw, ch, draw, at, size, {flat, soft, rot})` / `blob()` → `end()`. Pool de canvas por chave, resolução pela distância, sombra de contato + cauda longe do sol |
| `world.js` | `createWorld()`, `applyLight(W, k 0 dia→1 dourado, fwdDaCamera, foco, elOpcional)`, `addClouds`, `house` (fachada pintada, `shop`), `signBoard`, `clockTower` (`setTime(min)`), `tree`, `lamp` (acende no dourado → bloom), `bench`, `fountain`, `cafeTable`, `flowerPot`, `mat/solid/mesh`, texturas `cobbleTex/grassTex/...` |
| `ink.js` | `InkPass` (camadas: 0 mundo com tinta, `NOINK`=3 cartões, `SOFT`=4 céu/nuvem/sombra/fumaça) |
| `post.js` | `createPost(...)` → `lens(focoM, cInfPx)`, `grade({warm, sat})`, `capture()` + `render({flash, xfade, whip})` |
| `anim.js` | `smoother`, `seg`, `backOut`, `kick` (tremor 7 q), `lidAt` (piscadas), `exprAt`/`swapsOf` (trilha de expressões) |

Modelo de vídeo: `demos/11-sticker-demo/main.js` (tabela `SHOTS` com câmera por plano, `XFADE`, `FLASH`, `KICKS`, `WHIP`, `populate(t, shot)`, legendas + carimbo em canvas 2D por cima).

### Lições do demo 11 (aplicar sempre)
- **9:16 é estreito:** a 4 m e fov 40 cabe só ~1,6 m de largura. Dupla/gag com objeto → câmera a 5–6 m (ou fila em diagonal, não de lado).
- **Sol dourado baixo (el 7°) fica atrás das casas** e a cena inteira vira sombra violeta: no plano do pôr do sol use `el` ~15–17 e `fwd` com o sol vindo de um lado aberto da praça.
- Vaso/arbusto a menos de ~1,5 m do assunto vira borrão gigante no close; tirar do eixo da câmera.
- Sombras de contato precisam de altura própria (já resolvido no `cast.js`), senão o `check.js` acusa z-fighting.
- Sem narração, o mix sai baixo (−23 LUFS): subir com ganho fixo + limiter até ~−13 LUFS.

### Lições do vídeo 12 (Franklin × Mesmer, interiores + época)
- Figurinos novos em `toon.js`: `hat: 'wig'` (peruca com cachos), `'bald'` (careca com cabelo nas laterais), `crown: true`, `glasses: true`, `blindfold: '#cor'`. Efeitos novos em `fx.js`: `fxTears`, `fxSweat`, `fxSwirl` (fluido/hipnose), `fxWand`, `fxArrow`, `fxGlint`, `fxCough`.
- **Interiores:** sala sem teto com paredes de ~12 m (senão o céu aparece em câmera baixa) e sol alto **atrás da câmera** (`fwd` apontando para a câmera, `el` ~60), senão a parede do fundo fica toda na sombra violeta.
- Roda de personagens em volta de um objeto: câmera no mesmo ângulo de cada um, por fora, olhando para o centro; personagem que cai precisa cair para dentro do quadro (incline pouco ou afaste a câmera).
- Árvores enfileiradas bloqueiam umas às outras: para "a outra árvore", corte/whip direto para ela em vez de rack focus através da fileira.
- Legendas: grupo longo quebra em 2 linhas (ver `drawUI` do 12); em close, olhar a câmera ~0,25 m abaixo do rosto para o rosto ficar acima da legenda.

## Como encaixa no fluxo do projeto
Fluxo continua o do CLAUDE.md (roteiro-retencao → direcao-de-arte → storyboard → narração do autor → animar-cena → final.cjs). O Sticker entra na **direcao-de-arte** como linguagem principal. Regras do projeto vencem as do original:
- Português do Brasil; narração gravada pelo autor (sem TTS); legendas no estilo fixo de `brand/identidade.md` (o original não usa legenda — aqui usa).
- Trilha procedural `tools/trilha.cjs` + SFX `sfx.cjs`, mix com SFX bem abaixo da voz (não usar o mix "música +3 dB" do original).
- Determinístico, `?t=`, `?export`, `?nohud`, `node tools/check.js` antes de exportar, entrega só o MP4.
- Short 1080×1920 (planos 1,5–3 s, área segura) ou longo 1920×1080 — o estilo serve aos dois; a referência é vertical.

## Fórmula de roteiro que combina com o estilo (adaptar ao `roteiro-retencao`)
Gancho = paradoxo dito como fato na 1ª frase → cenário em 1–2 linhas (ano, lugar, personagem comum com nome) → escalada em 3–6 batidas (outros riem/duvidam, falas curtas) → batida de mistério ("Mas espera…") → virada **"Acontece que…"** com analogia do dia a dia → consequência → final irônico curto que fecha o vídeo. ~3,7 palavras/s. Toda frase ilustrada literalmente; os objetos carregam a piada.

## Valores do visual (finais do original, após 4 rodadas de verificação)
- **Tinta do mundo** (`ink.ts`): `#030303`, 5,1 px perto (6 m) → 3,3 px longe (90 m) a 1080×1920; vincos ×0,8 a partir de 35°; saltos de profundidade a partir de 1 %. Só silhuetas, saltos de profundidade e vincos — nada de linha em junção parede/chão nem no horizonte. Personagens na camada `NOINK` (têm tinta própria).
- **Personagens** (`toon.ts`): cabeça de feijão h/l ≈ 0,94 (topo mais pontudo, queixo mais estreito), contorno ameixa `#241726` mais grosso do lado da sombra, olhos a 0,26 da largura, sem blush e sem brilho no olho, adulto 3,5 cabeças (pernas 1,4), membros ≈ 0,055 da largura da cabeça com mão em ponto de tinta. Andar: balanço 5 %, inclinação 1–7°, pé plantado, passo 0,8 m. Piscar a cada 0,5–2,3 s (4 quadros). Sombra de contato ≈ 0,5 sob os pés. Rosto com brilho ≈ 0,93. Contraluz dourado só como borda **interna** (cópia deslocada vira moldura).
- **Luz** (`lights.ts`, sol relativo à câmera e congelado por plano):
  - dia: az 75 / el 48, luz `[1.58,1.5,1.33]`, sombra `[.30,.29,.36]`, tom frio **só** na sombra; céu `#3e7fd2` → horizonte `#b8d0ec`; névoa = cor do horizonte, 25→300 m.
  - dourado: sol baixo de contraluz (az 6 / el 7), luz `#FFB36B` ×1,5, sombras violeta-azuladas (nunca marrom), céu `#ffc47c` → `#8a6f8a`, disco de sol + bloom.
  - a luz muda com a história (meio-dia → pôr do sol → azul-noite na explicação).
- **Cor**: dia luma mediana ~0,57, sem pretos esmagados (p5 ~0,23 fora da tinta), croma alto (C* p90 ~55). Casas tijolo/creme/ocre/terracota de saturação contida; nunca limão, nunca rosto lavanda.
- **Profundidade** (`lensblur.ts` + `dofAt`): desfoque em ~1/3 do tempo — close 12–16 px, plano médio 10–12, abertos/aéreos 0; foco nos olhos da fileira da frente. Bloom só em emissivo HDR (limiar 1,0).
- **Pós** — ordem: tinta → lente (pré) → lente → bloom (int 0,5, raio 0,6) → tone map NEUTRAL → grade; MSAA 4; parâmetros em pixel escalam com altura/1920. Sem grão de filme.
- **Câmera** (`story.ts`): ~80 % do tempo segurando com push-in rastejante 0,15–0,35 %/quadro (0,6 % em palavra de impacto) — nunca parada ≥ 4 quadros; movimentos = deslize smootherstep de 18–40 quadros ou rajada ease-out; corte seco só em salto grande; crossfade 6–8 quadros ao trocar de lugar; flash branco depois do gancho; tremor de impacto que inverte o sinal a cada quadro e some em 7 quadros; roll 4–5°; câmera baixa; objeto de primeiro plano em ~1/3 dos planos. Toda reação visual cai 0–3 quadros **antes** da palavra.
- **Efeitos**: cartões 2D chapados no espaço 3D — clarão, faíscas, respingo, linhas de velocidade, poeira, notas musicais, estrelas, raios de luz.

## Armadilhas de leitura (checar em todo objeto/plano novo)
- Balanço com uma corda só que some atrás da criança parece **enforcamento**: sempre duas cordas, assento largo.
- Objeto a menos de ~2 m da lente vira borrão gigante cortado na borda; arbusto cortado vira "bola verde" — primeiro plano reconhecível ou nada.
- Bandeiras e símbolos: conferir que não lembram outro país/coisa.
- Placa pintada iluminada de lado fica cinza e ilegível: material sem luz na face da placa.
- Corrimão na altura do peito atravessa o personagem: lente ~2,5 m acima.
- Câmera dentro de casa: remover o que bloqueia a linha de visão de cada câmera.
- Segurar plano sem push-in = quadro congelado.
- Tinta no mesmo passe do DOF é apagada: tinta é passe próprio, antes do desfoque.

## Conferir o visual
`node tools/frames.js demos/NN - t1 t2 t3` (TEMP) e comparar com 1 quadro de `referencia/frames/` usando os valores acima. Corrigir pelo arquivo dono do problema. Sem renders extras.
