---
name: roteiro-longo
description: Escreve roteiro/storyboard de vídeo longo horizontal 16:9 (video essay, documentário animado, explicação de psicologia) no formato obrigatório do canal. Use quando o autor pedir roteiro, storyboard, decupagem ou estrutura de um vídeo longo / horizontal / para o canal principal.
---

# Storyboard — vídeo longo 16:9

As falas do roteiro seguem a voz do autor (`brand/dominio-e-voz.md`): conversa de 1 para 1, "você"/"a gente", "Olha só", "Por quê? Porque…", exemplos de cliente, analogias do dia a dia, acolhedor, sem guru nem promessa de cura. Proibido vício de linguagem ("né?", "tá?", "tipo", "e tudo mais"). O autor é sempre Jheyson/Professor Marcilio, nunca "Dill".

Entrada: texto aprovado (`roteiro-retencao`) ou narração pronta (`tools/transcrever.cjs`); se houver áudio, a minutagem segue o áudio. Antes: bíblia visual (`direcao-de-arte`). Manual `docs/guidelines/longo-16x9.md` só em dúvida.
Cada bloco do texto vira capítulo; **A-plot e B-plot com tratamentos visuais distintos** (ex.: A = cenário/personagens, B = diagramas). Paleta por capítulo derivada da bíblia.

## Estrutura
| Bloco | Tempo | Regras |
|---|---|---|
| Gancho | 0–45 s | paradoxo dito como fato na 1ª frase (ver `roteiro-retencao` › Ganchos); responde "que enigma?" / "por que importa?"; cena rica, câmera fluida, sem cortes frenéticos; título integrado ao cenário |
| Capítulos | miolo | planos 4–8 s; câmera nunca parada (dolly, parallax, pan); divisor claro entre capítulos |
| Conclusão | fim | síntese visual: conceitos conectados num painel/cenário; última fala = final irônico curto que volta à crença inicial; se couber, o último plano ecoa o primeiro (loop) |
| Tela final | últimos 15–20 s | espaço livre para cards |
Recursos: recriação de experimentos, anatomia simplificada, analogias, diagramas que se constroem com a voz, personagens com expressão; terços + 3 camadas. Narração do autor; trilha/SFX são sugestão (trilha segue a tensão).

## Saída: `roteiros/NN-nome.md` — formato compacto
Cabeçalho (≤ 6 linhas): título · pergunta central · duração · paletas por capítulo · fontes. Depois a bíblia visual. Depois, por capítulo, um título `### Cap. N: Nome (mm:ss–mm:ss)` e uma tabela, uma linha por plano:

| Tempo | Câmera | Animação | Diagramas/Textos | Narração | SFX/Trilha |
|---|---|---|---|---|---|

Células curtas; anotar kit/técnica three.js quando não for óbvio (ou "precisa de .glb").

## Checklist (mental)
Gancho ≤ 45 s com paradoxo na 1ª frase · virada "Acontece que" (ou equivalente) antes do miolo · final irônico · planos 4–8 s · câmera em todo plano · divisor entre capítulos · síntese + 15–20 s livres · dados ilustrativos marcados, fontes citadas.
