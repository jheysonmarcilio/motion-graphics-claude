# Motion Graphics com Claude — Mente & Psicologia

Vídeos para YouTube (longo 16:9 e Short 9:16) feitos em código (HTML + three.js), produzidos com o **Claude Code** usando as skills deste repositório, mais o **Estúdio** (`painel/`), um painel para vários canais com pesquisa, roteiro, revisão, narração, animação, MP4 e envio ao YouTube.

## O que tem aqui
| Pasta | Conteúdo |
|---|---|
| `.claude/skills/` | Skills do Claude Code: pesquisa de pautas, roteiro de retenção, direção de arte, storyboard longo/short, animação, exportação, atalho para narração pronta, estilo Sticker |
| `.claude/agents/` | Subagentes da pesquisa no YouTube (`pesquisador-yt`, `sugestor-roteiro`) |
| `CLAUDE.md` | Regras do projeto que o Claude lê sozinho (fluxo, direção visual, áudio, exportação) |
| `brand/` | Identidade fixa, cardápio de linguagens visuais, catálogo three.js, histórico visual, domínio e voz do autor |
| `docs/guidelines/` | Manuais de animação 16:9, Shorts 9:16 e roteiro de alta retenção |
| `demos/` | Animações prontas e kits reaproveitáveis (bonecos, props, cenários, transições, motor) |
| `tools/` | Servidor local, checagem, export quadro a quadro, trilha procedural, SFX, mix final, transcrição, TTS, thumbnail, pesquisa e upload no YouTube |
| `painel/` | Estúdio multicanal (Node `servidor.cjs`, versão PHP `php/api.php`, agente local `agente.cjs`, Docker). Detalhes em `painel/LEIAME.md` |

Não vão para o repositório: vídeos, áudios, renders, roteiros já escritos, material dos cursos (`midia/`), credenciais e dados do painel.

## Pré-requisitos
- **Node.js 20+**
- **ffmpeg** no PATH (versão com filtro `whisper`, ex.: build recente do gyan.dev no Windows) — export, mix, transcrição
- **Google Chrome** ou **Microsoft Edge** instalado (o export usa via puppeteer)
- **Python 3** + `pip install edge-tts yt-dlp` — voz sintética dos canais dark e pesquisa no YouTube
- **Claude Code** instalado e logado (`npm i -g @anthropic-ai/claude-code`, depois `claude`)

## Instalação
```bash
git clone https://github.com/jheysonmarcilio/motion-graphics-claude.git
```
```bash
cd motion-graphics-claude
```
```bash
npm install
```
O `npm install` já baixa o **three.js r187** para `three.js-master/`. Para transcrever narrações, baixe também o modelo do whisper (466 MB):
```bash
npm run setup
```

## Uso
- **Ver animações:** `npm run serve` → http://localhost:5173/demos/ (ex.: `/demos/22-por-que-esquecemos-nomes/`). `?t=5.2` pula para um tempo, `?nohud` esconde controles.
- **Produzir um vídeo com o Claude:** abra `claude` na pasta e mande um tema ("quero um Short sobre por que esquecemos nomes"). O fluxo segue as skills: `roteiro-retencao` → `direcao-de-arte` → `roteiro-short`/`roteiro-longo` → `animar-cena` → `exportar-video`.
- **Pesquisar pautas:** peça "pesquisa de tema sobre X" (skill `pesquisa-roteiro`).
- **Conferir e exportar:** `node tools/check.js demos/NN-nome` e depois `node tools/final.cjs demos/NN-nome --voz audio/NN-nome.mp3`.
- **Estúdio (painel):** `npm run painel` → http://localhost:5180. Hospedagem, agente, YouTube e pilotos automáticos: `painel/LEIAME.md`.

## Credenciais (cada um usa as suas)
- `.env` (modelo em `.env.example`): FTP, só para publicar o painel.
- YouTube: `client_secret.json` / `token.json` na raiz (`node tools/youtube-auth.cjs`) ou pelo painel (Conta → YouTube).

## Créditos
three.js (MIT). Cabeça "Lee Perry-Smith / triplegangers.com" (CC BY 3.0). Estilo Sticker adaptado de github.com/mromidev/claude-animated-shorts (MIT).
