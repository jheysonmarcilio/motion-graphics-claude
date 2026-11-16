---
name: pesquisa-roteiro
description: Pesquisa no YouTube os vídeos de sucesso dos últimos 6–12 meses sobre um tema (Short ou longo, de preferência motion graphics/animados), lê transcrição e os 10 comentários mais curtidos de cada um, analisa sempre 5 vídeos, entende por que funcionaram e entrega 2 sugestões inéditas por vídeo analisado, 10 no total (assunto, título, gancho, desenvolvimento, final), sem repetir sugestões já feitas. Use quando o autor pedir pesquisa de tema, ideias/pautas de vídeo, "o que está funcionando no YouTube", tendências ou sugestões baseadas em vídeos de sucesso.
---

# Pesquisa de roteiro (YouTube → sugestões) — em duas partes

Fluxo: **pesquisa-roteiro → autor escolhe uma sugestão → `roteiro-retencao` → …** (resto do CLAUDE.md).
A sessão principal só orquestra: **não pesquise nem escreva as sugestões aqui**.

| Parte | Agente (`.claude/agents/`) | Motor | Faz |
| --- | --- | --- | --- |
| 1 | `pesquisador-yt` | Sonnet · low | busca, escolhe 5 vídeos, coleta gancho/transcrição/top 10 comentários, analisa e grava o dossiê |
| 2 | `sugestor-roteiro` | Opus · low | lê dossiê + histórico, gera 2 sugestões inéditas por vídeo (10), salva relatório e registra |

## Passo 0 — entrada (perguntar só o que faltar)
Tema · formato (`short` | `longo`; padrão longo) · período (6 ou 12 meses; padrão 12) · canal (principal do autor ou canal dark do painel + bloco CANAL).
Definir `slug = AAAA-MM-DD-tema-formato` (data de hoje, tema em kebab-case).

## Passo 1 — Parte 1 (Agent, `subagent_type: "pesquisador-yt"`, foreground)
Prompt: tema, formato, período e `dossiê: roteiros/pesquisas/<slug>-dossie.md`.
Se o agente falhar ou trouxer menos de 5 vídeos, dizer ao autor e parar (não completar por conta própria).

## Passo 2 — Parte 2 (Agent, `subagent_type: "sugestor-roteiro"`, foreground)
Prompt: caminho do dossiê, tema, formato, canal (bloco CANAL inteiro se for dark) e `relatório: roteiros/pesquisas/<slug>.md`.

## Passo 3 — entregar
Na conversa: os 10 títulos (1.1 … 5.2) + link do relatório + "qual vira roteiro?". Quando o autor escolher, marcar a linha em `roteiros/pesquisas/_sugeridas.md` com `✔ usado` e seguir para `roteiro-retencao`.
