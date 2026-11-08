---
name: exportar-video
description: Exporta uma animação de demos/ para o MP4 final (voz do autor + SFX + trilha procedural) e confere o resultado. Use quando o autor pedir para exportar, renderizar, gerar o vídeo/MP4 ou juntar o áudio.
---

# Exportar vídeo (entrega = só o MP4)

Servidor rodando (preview `motion`, porta 5173; se ocupada, `motion-5174…5176` e passar `--port`).

## 1. Antes
- `node tools/check.js demos/NN-nome` → só seguir com "✓ nenhum erro".
- Marca: `grep -rn EMDR demos/NN-nome roteiros/NN-*` → todo hit é `HipnoEMDR®`.
- `demos/NN-nome/trilha.json` existe (`{ "bpm", "seed", "cues": [[t, "clima"], …] }`); `sfx.cjs` opcional.

## 2. Comando único (rodar em background; ~0,3 s/quadro → 1 min ≈ 9 min)
```
node tools/final.cjs demos/NN-nome --voz audio/NN-nome.mp3 [renders/saida.mp4] [--ganho dB] [--bg video.mp4] [--port 5174]
```
Gera trilha + SFX + mix no TEMP, exporta e apaga os temporários. Não usar `export.js --audio` à mão nem salvar WAV/mix em `audio/` ou `renders/`.
- Sem narração: voz = silêncio no TEMP (`ffmpeg -v error -f lavfi -i anullsrc=r=48000 -t DUR "$TEMP/sil.wav"`) e `--ganho` até ~−14 LUFS.
- Teste de trecho só se houver dúvida real: `--from X --to X+2`, saída no TEMP.
- **Nunca** TTS, salvo pedido explícito.

## 3. Conferir (barato)
- Uma linha: `ffprobe -v error -show_entries format=duration:stream=width,height -of csv=p=0 renders/NN.mp4` (duração vídeo ≈ voz; Short 1080×1920 ≤ 60 s).
- Loudness só se o autor reclamar ou for vídeo sem voz: `ffmpeg -i X -af ebur128 -f null - 2>&1 | grep -A2 Summary` (alvo −14 a −16 LUFS; corrigir com `--ganho`).
- Imagem: no máximo **uma** folha de contato no TEMP, e só se a animação mudou desde a última conferência:
  `ffmpeg -v error -i renders/NN.mp4 -vf "fps=1/4,scale=200:-1,tile=6x2" -frames:v 1 "$TEMP/contato.jpg"`. Apagar depois.

## 4. Entrega
Responder em 2–3 linhas: caminho, duração, resolução. Registrar a linha do vídeo em `brand/historico-visual.md`. Nada além do MP4 fica no projeto.
