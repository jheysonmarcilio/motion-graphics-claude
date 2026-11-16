# Estúdio — painel de canais automáticos (multiusuário)

Cada pessoa tem login próprio, vê só os próprios canais e liga o **próprio agente** (o Claude Code no PC dela).
O painel fica num servidor; o trabalho pesado (Claude, three.js, ffmpeg, voz, upload) roda no PC de cada usuário.

```
 navegador ──► painel (servidor, HTTPS) ◄── agente do PC do Jheyson   (só conexões de saída)
                                       ◄── agente do PC da outra pessoa
```

## 0. No ar agora (hospedagem PHP, via FTP)
O painel está em **https://comunidademarcilio.com.br/motion-graphics/painel/** — versão PHP (`painel/php/api.php`, mesma API). Dados em `/motion-graphics/painel/dados/` (bloqueado para a web). Para atualizar o código depois de mudar algo: `node painel/publicar-ftp.cjs` (usa o FTP do `.env`; nunca envia dados/).
Sem servidor Node: a agenda roda a cada requisição (o agente consulta a cada 4 s), então o piloto e as publicações andam enquanto algum agente estiver ligado.

## 1. Alternativa: VPS com Docker (versão Node)
1. Aponte o domínio (registro **A**) para o IP do servidor, ex.: `painel.seudominio.com`.
2. Copie a pasta `painel/` para o servidor e, dentro dela, crie `.env` com `DOMINIO=painel.seudominio.com`.
3. `docker compose up -d` — sobe o painel + HTTPS automático (Caddy).
4. Abra `https://painel.seudominio.com`: o 1º acesso cria a conta de **administrador**.
5. **Usuários → Adicionar pessoa**: crie o login da outra pessoa (ela troca a senha em Conta).

Sem Docker: Node 20+, `cd painel && SEM_AGENTE=1 PAINEL_URL=https://painel.seudominio.com PAINEL_DADOS=/var/lib/estudio node servidor.cjs` (com pm2/systemd) e um proxy HTTPS (Caddy/Nginx) para a porta 5180.
Dados (usuários, canais, vídeos, config) ficam em `/dados` (volume) — faça backup dessa pasta.

Para continuar usando os vídeos/canais que você já tem no PC: copie `painel/dados/db.json` para o volume antes do 1º acesso (o 1º administrador herda os canais).

## 2. Ligar o agente em cada PC
**Jeito fácil (Windows):** depois do login, o painel mostra a tela "Vamos conectar seu computador" → botão **Baixar conector** → dois cliques no `Conectar-Estudio.cmd`. Ele acha a pasta do projeto (ou pergunta), baixa o three.js r187 do GitHub se faltar, instala o que faltar (Node, ffmpeg, Python + edge-tts/yt-dlp, Claude Code), pede o login do Claude se precisar, desliga qualquer conector antigo, liga o agente com ícone na bandeja (ícones ocultos → botão direito → Fechar conector; `painel/bandeja.ps1`) e coloca na inicialização do Windows (`%APPDATA%…StartupEstudio-Agente.vbs`; log em `%LOCALAPPDATA%Estudioagente.log`). A tela do painel continua sozinha quando o computador conecta.

**Jeito manual:**
Cada usuário, no PC dele:
1. Tem o projeto inteiro (esta pasta, com `three.js-master/`, `tools/`, `.claude/skills` e `.claude/agents`) — ex.: clonar o repositório privado.
2. Instala: Node 20+, ffmpeg, Python + `py -m pip install edge-tts yt-dlp`, `npm install` na raiz, e o **Claude Code logado na conta dele** (`claude` no terminal).
3. Copia o comando de **Conta → Agente** e roda na raiz do projeto:
   `node painel/agente.cjs --painel https://painel.seudominio.com --token <token>`
   O topo do painel mostra 🟢 quando ligar. O PC precisa ficar ligado para produzir (dica: `pm2 start painel/agente.cjs -- --painel … --token …`).

## 3. Conectar o YouTube (uma vez por canal)
1. **Google Cloud Console** → criar projeto → *APIs e serviços* → ativar **YouTube Data API v3**.
2. *Tela de consentimento OAuth*: tipo **Externo**, preencha nome/e-mail, adicione os escopos `youtube.upload` e `youtube.readonly` e **publique o app (Em produção)** — em "Teste" o acesso expira em 7 dias. O aviso "app não verificado" pode ser ignorado para uso próprio (Avançado → continuar).
3. *Credenciais* → **ID do cliente OAuth** → tipo **Aplicativo da Web** → URI de redirecionamento: `https://painel.seudominio.com/api/youtube/callback` (o painel mostra o URI exato em Conta).
4. No painel: **Conta → YouTube** (ou, como admin, o cliente padrão para todos) → cole Client ID e Client secret.
5. **Canais → (canal) → YouTube → Conectar YouTube**, entre com a conta dona e escolha o canal. Pronto: no horário, o agente envia o vídeo com título, descrição e tags.

## 4. Pilotos automáticos (vários por canal)
Cada canal tem quantos pilotos quiser (Canais → canal → **+ Adicionar piloto automático**). Cada piloto tem: nome, formato (Short ou longo), temas por **pesquisa com palavra-chave** ou **escritos por você**, dias, horários (1 vídeo por horário), estilos e quantos vídeos manter adiantados. Ex.: seg–qua Shorts de um tema, sáb vídeo longo de outro. Temas usados e pesquisas (com os vídeos analisados) ficam guardados; a página do canal mostra a evolução: pesquisas → vídeos analisados → temas criados → vídeos feitos → publicados.
> A versão Node (`servidor.cjs`) ainda usa o piloto único antigo; a versão de referência é a PHP (`php/api.php`).

### (texto antigo)
Canais → Piloto automático:
- **Pesquisa automática:** roda a skill `pesquisa-roteiro` (5 vídeos de sucesso → 10 temas inéditos) e põe os temas na fila. Quando "restam" (temas na fila + vídeos não publicados) cair até o limite, faz nova pesquisa — o fluxo nunca seca.
- **Temas manuais:** você escreve os temas na fila; quando restar o limite, chega um aviso pedindo mais.
- **Estoque alvo:** quantos vídeos manter em produção + prontos. **Horários de publicação:** 1 vídeo por horário (ex.: `18:00` = 1 por dia).

## 5. Avisos
Sino no topo + (opcional) **Telegram** (crie um bot no @BotFather, pegue seu chat id no @userinfobot) ou **webhook** (n8n/Make/Zapier/WhatsApp) em Conta → Avisos. Avisa: aprovação pendente, erro, publicado, fila acabando, pesquisa concluída, horário sem vídeo.

## Fluxo de cada vídeo
tema → roteiro → revisão (nota) → narração (voz sintética do canal) → storyboard (estilo escolhido) → animação → MP4 → publicar. Qualquer etapa pode parar para aprovação, ser editada ou refeita com um pedido.

## Arquivos
`servidor.cjs` · `agente.cjs` · `etapas.cjs` (etapas, instruções, estilos iniciais) · `web/index.html` · `Dockerfile` · `docker-compose.yml`.
No PC, sem servidor: `npm run painel` → http://localhost:5180 (o agente do 1º admin sobe junto).

## 7. Teste A/B de thumbnails (só vídeo longo, só versão PHP)
- Todo vídeo longo passa pela etapa **Thumbnails** (depois da Animação): o Claude faz 3 conceitos diferentes em `renders/NN-x-thumb-1..3.jpg` (`tools/thumb.cjs`) e o agente envia ao painel.
- Ao publicar, o painel cria o teste sozinho: thumb 1 no ar 7 dias → thumb 2 → thumb 3. Depois espera 3 dias (atraso do YouTube Analytics), dá a nota e deixa a vencedora.
- Nota (0–100, relativa entre as 3): CTR 35% · % assistido 35% · fica após 30% do vídeo 20% · inscritos por mil views 10%. **Views não contam** (a 1ª semana sempre ganha em views). Fase com menos de 20 views = "poucos dados".
- Aba **🖼️ Thumbnails**: thumbs, métricas por semana, "Ficar com esta", "Encerrar esta semana agora", cancelar.
- Requer: canal conectado pelo painel (não `token.json`), **reconectar** o YouTube uma vez (novo escopo `yt-analytics.readonly`) e canal verificado (thumbnail personalizada).

## 8. Vídeo único (testes, só versão PHP)
Canais → canal → **🧪 Vídeo único**: pesquisa própria (palavra-chave + formato) ou temas escritos por você, com um estilo escolhido para cada tema e botão **Gerar** (ou Gerar todos). Os temas ficam com `pilotoId = "avulso"`: não entram na agenda nem na fila dos pilotos. Serve para testar estilos antes de ligar o piloto.
