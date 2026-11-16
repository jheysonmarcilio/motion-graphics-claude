# Projeto Motion Graphics — Mente & Psicologia

Vídeos para YouTube sobre mente humana e psicologia, feitos em código (HTML + three.js). Dois formatos: **vídeo longo 16:9** (video essay / documentário animado) e **Short 9:16**.

## Estrutura
- `three.js-master/` — biblioteca three.js r187 (não editar). Importar via importmap:
  `"three": "/three.js-master/build/three.module.js"`, `"three/addons/": "/three.js-master/examples/jsm/"`.
- `demos/NN-nome/` — cada animação: `index.html` (+ `main.js`, `lib.js`, `scenes/*.js` quando tiver várias cenas; ver `demos/01-threejs-showcase` como modelo).
- `roteiros/NN-nome.md` — roteiro/storyboard no formato obrigatório (ver skills `roteiro-longo` / `roteiro-short`).
- `audio/NN-nome.(wav|mp3)` — narração gravada pelo autor (quando existir).
- `brand/dominio-e-voz.md` — assunto do autor (hipnose/hipnoterapia, cursos, posições) e **como ele fala**; ler antes de escrever qualquer texto narrado. Fonte bruta: `midia/` (base de conhecimento + transcrições de 484 aulas; não reler, grande). `brand/identidade.md` — o que é fixo (tipografia, legenda, carimbo). `brand/linguagens.md` — cardápio de linguagens visuais com receitas three.js. `brand/historico-visual.md` — o que cada vídeo já usou. `brand/catalogo-threejs.md` — o que dá pra fazer e como pedir.
- `docs/guidelines/` — manuais originais do autor: animação longo 16:9, Shorts 9:16 e roteiro de alta retenção. Fonte da verdade das regras abaixo.
- `painel/` — Estúdio: painel multicanal (canais dark + principal, lotes com estilos escolhidos, revisão com nota, agenda, YouTube por canal): no ar em https://comunidademarcilio.com.br/motion-graphics/painel/ (versão PHP `painel/php/api.php`, publicar com `node painel/publicar-ftp.cjs`; local: `npm run painel`). Etapas, instruções e estilos iniciais em `painel/etapas.cjs`; ver `painel/LEIAME.md`. **Canais dark do painel têm voz sintética autorizada pelo autor** (`tools/tts.cjs`); quando o prompt traz o bloco CANAL de um canal dark, ignore `brand/dominio-e-voz.md`, HipnoEMDR® e `brand/historico-visual.md`.
- `tools/serve.js` — servidor local (`node tools/serve.js` → http://localhost:5173). ES modules não rodam via file://.

## Fluxo de produção
**tema → texto narrado (`roteiro-retencao`) → autor aprova → bíblia visual (`direcao-de-arte`) → storyboard (`roteiro-longo` / `roteiro-short`) → autor grava a narração → animação (`animar-cena`) → MP4 (`exportar-video`)**.
Quando o autor mandar só um tema, começar pela análise estratégica do `roteiro-retencao` — nunca pular direto para animação. Com narração pronta, ainda assim passar por `direcao-de-arte` antes do storyboard.

## Direção visual — regra do autor
- **Animação de internet, não vídeo institucional:** concreta, dinâmica, com personagens e elementos gráficos. Pessoa citada → personagem (+ cartão de nome); lugar → cenário/mapa; número → coisas contáveis; grupos → personagens que se separam e reagem. Humor visual moderado quando o tema permitir.
- **Cada vídeo tem cara própria**, escolhida pelo tema em `brand/linguagens.md`, consistente do começo ao fim. Só tipografia, estilo de legenda e carimbo são fixos (`brand/identidade.md`).
- **Variar sem começar do zero (regra do autor, 2026-11-07):** o problema dos primeiros vídeos era usar sempre os *mesmos elementos* (busto pontilhado em tudo), não reaproveitar código. Então:
  - **Reaproveitar** modelos prontos dos kits (bonecos, props, cenários, transições, motor) — ver tabela em `animar-cena`. Variação vem da **combinação**: outra linguagem/kit, outra paleta, outros cenários, figurinos e props, outro herói, outra câmera.
  - **Não repetir** a linguagem principal nem o herói visual dos 2 vídeos anteriores (`brand/historico-visual.md`); nenhum elemento domina mais que ~25% do vídeo; um mesmo prop/cenário pode voltar, mas repintado e em outro papel.
  - **Escrever do zero só o que falta** e, quando for reaproveitável, deixar como peça de kit (função exportada com parâmetros de cor/tamanho) para os próximos vídeos. A biblioteca cresce a cada vídeo.
- Toda a biblioteca three.js (`examples/jsm/`) está liberada.

## Skills do projeto (`.claude/skills/`)
- `pesquisa-roteiro` — pesquisa vídeos de sucesso no YouTube (6–12 meses, transcrição + top 10 comentários) (5 vídeos) e sugere 2 pautas inéditas por vídeo (10 no total) com título, gancho e estrutura; histórico em `roteiros/pesquisas/_sugeridas.md`.
- `roteiro-retencao` — análise estratégica (crença errada, pergunta central, A/B-plot, títulos, thumbnails) + texto narrado com estrutura de investigação.
- `direcao-de-arte` — bíblia visual do vídeo: linguagem, paleta, personagens, mapa de literalidade, anti-repetição.
- `roteiro-longo` — storyboard cena a cena de vídeo longo 16:9.
- `roteiro-short` — storyboard cena a cena de Short 9:16.
- `animar-cena` — transformar o roteiro em animação three.js seguindo as regras de movimento de cada formato.
- `exportar-video` — MP4 final com `tools/final.cjs` (voz + SFX + trilha) e conferência mínima.
- `video-narracao-pronta` — atalho de ponta a ponta quando o áudio já vem gravado.
- `estilo-sticker` — só quando o autor pedir.

## Áudio — regra do autor
- **Toda narração é gravada pelo autor.** Nunca gerar voz sintética/TTS, a menos que ele peça explicitamente.
- No roteiro, a coluna "Áudio / Narração" é o texto que *ele* vai ler; trilha e SFX são **sugestões** (ele monta na edição).
- Quando houver arquivo de narração, os tempos da animação seguem a narração (não o contrário).

## Regras fixas de toda animação
- **Palco fixo:** longo 1920×1080; Short 1080×1920. Escalado para caber na janela.
- **Determinístico:** tudo é função do tempo — `renderAt(t)` sem `Date.now()`/`Math.random()` soltos (usar PRNG com seed, ex. `mulberry32`). Permite pausar, `?t=5.2`, e exportar quadro a quadro.
- **Expor** `window.__mg = { duration, fps, width, height, renderAt }` e, com `?export`, marcar `__mg.loaded = true` sem loop de animação.
- `?nohud` esconde os controles; HUD nunca entra no vídeo.
- **Nunca tela parada:** câmera sempre em movimento sutil + micro-animações (partículas, pulsos). Longo: plano de 4–8 s. Short: plano de 1,5–3 s, nada estático > 3 s.
- **Área de segurança:** Short — nada essencial no rodapé (~25% inferior) nem na faixa direita (~15%); texto central. Longo — últimos 15–20 s com espaço livre para cards/tela final.
- Textos em português do Brasil. Dados ilustrativos devem ser marcados como tal. Afirmações científicas: preferir consenso e citar a fonte no roteiro.
- InstancedMesh/Points que nascem com escala 0: `frustumCulled = false` (senão somem no export).
- **Texto sempre cabe na caixa** (etiqueta, pasta, cartão, bloco): medir e encolher a fonte, nunca tamanho fixo. **Planos sobrepostos nunca no mesmo plano** (fotos, recortes): altura própria + `renderOrder`, senão piscam.
- **Antes de todo export:** `node tools/check.js demos/NN-nome` → só exportar com "✓ nenhum erro".
- **Mix de áudio:** SFX bem abaixo da voz (no 02: −13,4 dB + ducking, ≈ 60% do nível que o autor achou alto); normalizar com ganho fixo + limiter, nunca `loudnorm` dinâmico no mix (sobe os SFX nas pausas da voz).

## Trilha + entrega final — regra do autor
- Todo vídeo leva **SFX + trilha de fundo procedural** (`tools/trilha.cjs`) que acompanha o clima de cada trecho (tensão, descoberta, humor, sonho, triunfo…). Cues em `demos/NN-nome/trilha.json`: `{ "bpm", "seed", "cues": [[t, "clima"], ...] }`. Nada de música pronta.
- **Entrega = só o MP4.** `node tools/final.cjs demos/NN-nome --voz audio/NN-nome.mp3` gera SFX, trilha e mix em pasta temporária, exporta e apaga tudo. Não deixar WAV/mix/folha de contato/log em `renders/` ou `audio/`. Conferências (quadros, contato) só no TEMP.
## Economia de tokens — regra do autor
- Áudio pronto + pedido de vídeo → skill `video-narracao-pronta` (caminho curto). Transcrição: `node tools/transcrever.cjs` (saída compacta), nunca o JSON bruto do whisper.
- Não ler `three.js-master/`, `node_modules/`, `renders/`, `docs/guidelines/` (as skills já resumem) nem kits inteiros: `grep -n "^export"` e ler só a função usada.
- Motor e kits: copiar com `cp` (tabela em `animar-cena`), não reescrever pela conversa. Arquivo novo com um Write; ajustes com Edit pequeno; não reler o que acabou de escrever.
- Imagens custam caro: conferir com **uma** folha de contato (`tools/frames.js demo - tempos…`, sai no TEMP), não screenshots em série.
- Comandos longos (export, whisper) em background; saída de ffmpeg sempre com `-v error`.
- Respostas curtas: caminho do MP4 + o que precisa de decisão. Sem relatórios, sem arquivos extras, sem renders de teste além do necessário.
- Versões antigas de demos (03, 04, 04-v2) só servem de histórico: não consultar.

## Assets disponíveis
- Cabeça humana escaneada: `three.js-master/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb` (CC BY 3.0 — creditar "Lee Perry-Smith / triplegangers.com").
- Busto: `.../models/gltf/tennyson-bust.glb`. Personagens animados: `Soldier.glb`, `Xbot.glb`, `Michelle.glb`; rosto com 52 expressões: `facecap.glb`. Ver `brand/catalogo-threejs.md`.
