---
name: direcao-de-arte
description: Define a bíblia visual de um vídeo (linguagem, paleta, personagens, herói visual, mapa de literalidade, anti-repetição) antes do storyboard e da animação. Use sempre que for começar o storyboard ou a animação de um vídeo novo, inclusive quando o autor manda uma narração pronta, e quando ele reclamar que os vídeos estão parecidos, abstratos ou "institucionais".
---

# Direção de arte (bíblia visual do vídeo)

Objetivo: cada vídeo com **cara própria e consistente**, linguagem de **animação de internet** (concreta, com personagens e elementos gráficos), nunca institucional. Etapa: texto aprovado/narração pronta → **aqui** → storyboard → animação.

## 1. Ler (só isto)
- Texto/transcrição da narração.
- `brand/historico-visual.md` — só as **3 últimas linhas da tabela + notas finais**. Não repetir linguagem principal nem herói dos 2 anteriores. Conferir `ls demos/` (outra sessão pode ter feito vídeo em paralelo).
- `brand/linguagens.md` — só a seção da linguagem candidata (grep pelo título) + "conceitos abstratos".
- `brand/identidade.md` só se for mexer em legenda/carimbo (o resto é livre).

## 2. Mapa de literalidade (antes do estilo)
Tabela curta `tempo | cita | aparece na tela`, uma linha por coisa concreta da fala.
- Pessoa → personagem + cartão de nome · lugar → cenário/mapa · número → coisas contáveis · objeto → o objeto · ação → personagem fazendo · grupo → personagens que se separam e reagem.
- Conceito abstrato → metáfora concreta rápida. Partículas/brilho = último recurso.

## 3. Linguagem
Pelo tema/tom (caso real → colagem; mecanismo → explainer flat; experimento → diorama; mistério → cinematográfico; cérebro → neural, só secundária). Sticker só se o autor pedir.
Se houver dois caminhos bons e o autor não pediu para seguir direto: 2 opções em 1 linha cada, recomendando uma. Senão escolher e seguir.

## 4. Bíblia visual (no topo do storyboard `roteiros/NN-*.md`, ≤ 12 linhas)
```
## Bíblia visual
- Linguagem: principal … | secundária … (regra de troca)
- Herói visual: …   - Paleta: 2–3 dominantes + destaque das legendas (hex)
- Personagens: …    - Cenários (3–6): …
- Recursos recorrentes (3–5): …   - Transições (2–3): …
- Humor: onde       - Kit/código reaproveitável: (ver tabela em animar-cena) + addons three.js
```

## 5. Variedade (checar no storyboard)
Nada domina > ~25% do tempo (Short 45 s: nenhum plano principal > ~10 s) · troca de ambiente a cada 2–3 planos (Short) / capítulo (longo) · ≥ 3 tipos de plano · ≥ 1 personagem com expressão/gesto · se dá pra resumir como "um X girando com coisas acendendo", refazer.

## Reaproveitar × repetir
Repetir o **mesmo visual** é o erro (03 e 04 eram o mesmo busto pontilhado); reaproveitar **peças** é o certo.
- Partir dos kits prontos (tabela em `animar-cena`): bonecos, props, cenários, transições, motor. Na bíblia, listar o que vem de kit e o que é novo.
- Variar pela combinação: kit/linguagem diferente do vídeo anterior, paleta nova, figurinos e cenários recombinados, herói novo, câmera e transições diferentes.
- Prop/cenário de kit pode voltar repintado e em outro papel; herói e linguagem principal, não (2 vídeos anteriores).
- Só desenhar do zero o que falta — e já como peça reaproveitável.
