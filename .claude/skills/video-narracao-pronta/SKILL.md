---
name: video-narracao-pronta
description: Caminho curto de ponta a ponta quando o autor manda uma narração já gravada (mp3/wav/vídeo) e pede o vídeo/animação "com SFX e tudo". Encadeia transcrição → bíblia visual → storyboard compacto → animação → check → MP4 final, gastando o mínimo de tokens. Use sempre que chegar um áudio pronto junto com pedido de vídeo, Short, anúncio ou motion.
---

# Vídeo a partir de narração pronta (caminho curto)

Pula `roteiro-retencao` (o texto já existe). Regras do CLAUDE.md continuam valendo.

1. **Número e áudio:** `ls demos/` → próximo NN livre (outra sessão pode estar usando o anterior). `cp "<origem>" audio/NN-nome.mp3`.
2. **Transcrever:** `node tools/transcrever.cjs audio/NN-nome.mp3 demos/NN-nome/fala.json` (rodar em background se > 2 min de áudio). Conferir nomes próprios e a marca **HipnoEMDR®** (whisper ouve "WIP no MDR"); dúvida real → perguntar ao autor numa linha, sem parar o resto.
3. **Bíblia visual** (`direcao-de-arte`, só o histórico recente) → escrever direto no topo de `roteiros/NN-nome.md`. Não pedir aprovação se o autor disse para seguir; senão 2 opções em 1 linha cada.
4. **Storyboard compacto** (`roteiro-short` / `roteiro-longo`, formato de tabela) no mesmo arquivo, com tempos tirados de `fala.json`.
5. **Animar** (`animar-cena`): copiar motor + kit com `cp`, escrever o mundo novo, `trilha.json` com cues de clima pelos blocos da fala, `sfx.cjs` copiado e com os tempos novos.
6. **Conferir:** `node tools/check.js demos/NN-nome` → uma folha `node tools/frames.js demos/NN-nome - …12 tempos` → corrigir só o que apareceu.
7. **MP4:** `node tools/final.cjs demos/NN-nome --voz audio/NN-nome.mp3` em background. `ffprobe` de uma linha. Linha nova em `brand/historico-visual.md`.
8. **Responder em 2–3 linhas:** caminho do MP4, duração, o que precisa da confirmação do autor (palavras duvidosas). Sem relatório.

Não fazer: renders de teste completos, screenshots soltos em série, cópias de WAV/mix/folha no projeto, reler arquivos que acabou de escrever, ler kits inteiros.
