// Etapas do fluxo, instruções padrão de cada uma e estilos iniciais.
// Instruções e estilos são editáveis no painel (Configurações → Instruções; aba Estilos).
// Variáveis: {{base}} {{tema}} {{formato}} {{skillStoryboard}} {{canal}} {{estilo}} {{historico}} {{palavras}} {{duracao}}
//            {{instrucoes}} {{feedback}} {{audio}} {{erro}} {{nota}}
'use strict';

const ETAPAS = [
	{ id: 'tema', nome: 'Tema', tipo: 'claude', desc: 'Sugere um tema novo para o canal (pula se o lote já trouxe o tema).' },
	{ id: 'roteiro', nome: 'Roteiro', tipo: 'claude', desc: 'Estrutura de retenção + texto narrado no tamanho certo + título/descrição.' },
	{ id: 'revisao', nome: 'Revisão', tipo: 'claude', desc: 'Revisor independente: confere o checklist, corrige e dá nota. Abaixo da nota mínima, para para você.' },
	{ id: 'narracao', nome: 'Narração', tipo: 'narracao', desc: 'Voz sintética do canal (tools/tts.cjs, tempos exatos) ou upload da sua gravação.' },
	{ id: 'storyboard', nome: 'Storyboard', tipo: 'claude', desc: 'Bíblia curta + storyboard, presos ao estilo escolhido.' },
	{ id: 'animacao', nome: 'Animação', tipo: 'claude', desc: 'animar-cena no estilo escolhido + trilha.json + sfx.cjs + check.' },
	{ id: 'thumbs', nome: 'Thumbnails', tipo: 'claude', desc: 'Só vídeo longo: 3 thumbnails bem diferentes para o teste A/B (o painel troca a cada 7 dias e fica com a vencedora).' },
	{ id: 'exportar', nome: 'MP4 final', tipo: 'exportar', desc: 'check.js + final.cjs (voz + SFX + trilha). Sem Claude.' },
	{ id: 'publicar', nome: 'Publicar', tipo: 'publicar', desc: 'Envia ao canal do YouTube no horário (ou fica no estoque).' },
];

const COMUM = 'Trabalho autônomo pelo painel de automação: NÃO faça perguntas, decida e siga (regras do CLAUDE.md valem, exceto onde o bloco CANAL abaixo diz outra coisa). ' +
	'Economize tokens. Termine com no máximo 3 linhas.\n\n{{canal}}\n\n';

const PROMPTS = {
	tema: '{{canal}}\n\nVocê é o produtor deste canal. Sugira UM tema novo e forte para um {{formato}}, dentro do nicho do canal, que gere curiosidade imediata e caiba em {{duracao}}. ' +
		'Não repita nem fique parecido com estes já feitos no canal:\n{{historico}}\n{{instrucoes}}\n' +
		'Responda SOMENTE com JSON numa linha: {"tema":"...","slug":"kebab-case-curto-sem-acento"}',

	roteiro: COMUM + 'Vídeo {{base}} — {{formato}}. Tema: {{tema}}.\n' +
		'Use a skill roteiro-retencao, mas escreva direto, sem relatório longo. Salve em roteiros/{{base}}.md nesta ordem:\n' +
		'1. "## Estratégia" (5–8 linhas): crença errada, pergunta central, promessa, gancho dos 3 primeiros segundos, virada, payoff.\n' +
		'2. "## Texto narrado": SÓ o texto falado, frases curtas, sem marcação de cena, sem emoji, números por extenso quando soam melhor. ' +
		'Alvo: {{palavras}} palavras (≈ {{duracao}}). Gancho na 1ª frase; uma ideia por frase; fecha com payoff + CTA do canal.\n' +
		'3. "## Fontes": de onde vêm as afirmações (consenso; dado ilustrativo marcado como tal).\n' +
		'Crie também roteiros/{{base}}.meta.json = {"titulo":"…","descricao":"…","tags":["…"]} (título ≤ 70 caracteres, curiosidade sem mentira).\n{{instrucoes}}\n{{feedback}}',

	revisao: COMUM + 'Você é o REVISOR (não foi você que escreveu). Leia roteiros/{{base}}.md e roteiros/{{base}}.meta.json. Vídeo: {{formato}}, alvo {{palavras}} palavras.\n' +
		'Checklist: (1) a 1ª frase prende sozinha; (2) uma pergunta central do começo ao fim, sem desvio; (3) cada frase leva à próxima, sem enrolação; ' +
		'(4) payoff responde à pergunta; (5) tamanho dentro de ±15% do alvo; (6) nada de afirmação falsa, exagero médico ou promessa enganosa; ' +
		'(7) fala natural para voz sintética (sem siglas difíceis, sem parênteses, sem listas); (8) tom e regras do canal; (9) título e descrição coerentes com o texto.\n' +
		'CORRIJA você mesmo no arquivo o que for ajuste (mantenha a estrutura de seções). Se o problema for de base (tema fraco, sem pergunta central), não reescreva tudo: dê nota baixa.\n' +
		'Responda SOMENTE com JSON numa linha: {"nota":0-10,"corrigido":true|false,"problemas":["…"]}',

	storyboard: COMUM + 'Vídeo {{base}} — {{formato}}. Tema: {{tema}}.\n{{estilo}}\n\n' +
		'Leia roteiros/{{base}}.md e os tempos de demos/{{base}}/fala.json (frases) — words.json tem cada palavra. ' +
		'Escreva no mesmo arquivo "## Bíblia visual" (máx. 12 linhas: paleta, herói visual, personagens e figurinos, cenários, câmera, o que NÃO fazer) ' +
		'e "## Storyboard" (skill {{skillStoryboard}}, formato de tabela compacto, tempos tirados da fala, plano novo a cada 1,5–3 s no Short / 4–8 s no longo). ' +
		'Siga o ESTILO acima à risca — ele foi escolhido pelo autor. Varie dentro dele (cenário, herói, câmera) sem repetir o histórico do canal:\n{{historico}}\n{{instrucoes}}\n{{feedback}}',

	animacao: COMUM + 'Vídeo {{base}} — {{formato}}.\n{{estilo}}\n\n' +
		'Use a skill animar-cena para criar demos/{{base}}/ a partir da bíblia e do storyboard de roteiros/{{base}}.md, com os tempos de demos/{{base}}/fala.json e words.json (legendas palavra a palavra) e a narração {{audio}}. ' +
		'Reaproveite o kit do estilo (copie com cp, não reescreva). Inclua demos/{{base}}/trilha.json (cues de clima) e demos/{{base}}/sfx.cjs.\n' +
		'O servidor local já está em http://localhost:5173. Rode node tools/check.js demos/{{base}} até "✓ nenhum erro" e confira UMA folha de contato (tools/frames.js). NÃO exporte o MP4.\n{{instrucoes}}\n{{feedback}}',

	pesquisa: COMUM + 'Use a skill pesquisa-roteiro em MODO AUTOMÁTICO do painel (ninguém vai responder perguntas). Entrada do Passo 0 já definida: ' +
		'tema = {{pesquisaTema}}; formato = {{formatoCurto}}; período = 12 meses; canal = o bloco CANAL acima (canal dark, se for o caso). ' +
		'Rode a Parte 1 e a Parte 2 normalmente. No Passo 3, em vez de perguntar ao autor, NÃO marque nada como usado e termine respondendo SOMENTE com um JSON numa linha:\n' +
		'{"relatorio":"roteiros/pesquisas/<slug>.md","videos":[{"titulo":"…","canal":"…","url":"https://www.youtube.com/watch?v=…","views":123456}],"temas":[{"titulo":"…","tema":"assunto em 1 frase","gancho":"…","desenvolvimento":"…","final":"…"}]}\n' +
		'("videos" = os 5 vídeos de sucesso que você analisou) ' +
		'com as 10 sugestões, sem repetir estes temas já usados ou na fila do canal:\n{{historico}}',

	thumbs: COMUM + 'Vídeo {{base}} — vídeo longo 16:9. Título: {{titulo}}. Tema: {{tema}}.\n{{estilo}}\n\n' +
		'Crie 3 thumbnails para um TESTE A/B (o painel publica uma por semana e fica com a de melhor CTR/retenção), então as 3 precisam ser CONCEITOS DIFERENTES, não variações de cor:\n' +
		'1) personagem/rosto do vídeo com emoção forte + no máx. 3 palavras; 2) o objeto/cena-mistério do vídeo, contraste ou antes→depois, sem rosto; 3) pergunta ou afirmação provocadora em 2–4 palavras gigantes + um elemento visual do vídeo.\n' +
		'Regras: mesma linguagem visual do vídeo (reaproveite kit/cenas de demos/{{base}}, copie com cp), texto ≠ título (complementa), legível em miniatura de 160 px, alto contraste, nada essencial no canto inferior direito (selo de duração), texto sempre cabe na caixa.\n' +
		'Faça demos/{{base}}/thumb.html (1280×720, parâmetro ?v=1|2|3, estático, marca window.__thumbPronto = true quando desenhou) e gere com: ' +
		'node tools/thumb.cjs "http://localhost:5173/demos/{{base}}/thumb.html?v=N" renders/{{base}}-thumb-N.jpg  (N = 1, 2, 3). ' +
		'Confira as 3 numa olhada só (abra as imagens) e corrija se algo estiver ilegível. Ordem: a que você acha mais forte é a 1.\n{{instrucoes}}\n{{feedback}}',

	corrigir: COMUM + 'A verificação da animação demos/{{base}} falhou:\n{{erro}}\nCorrija em demos/{{base}}/ e rode node tools/check.js demos/{{base}} de novo até "✓ nenhum erro". Não exporte.',
};

// Bloco de contexto do canal, montado a partir da ficha do canal.
function blocoCanal(c) {
	if (!c) return '';
	if (c.principal) return `CANAL: ${c.nome} — é o canal principal do autor: siga brand/dominio-e-voz.md e o histórico em brand/historico-visual.md (adicione a linha do vídeo lá).` +
		(c.nicho ? `\nBriefing extra: ${c.nicho}` : '');
	return [`CANAL: ${c.nome} (canal dark — sem rosto e sem a voz do autor).`,
		'Este NÃO é o canal do autor: ignore brand/dominio-e-voz.md, a marca HipnoEMDR® e brand/historico-visual.md (não escreva nele). ' +
		(c.narracao === 'tts' ? 'Narração por voz sintética AUTORIZADA pelo autor para este canal.' : 'Narração gravada e enviada pelo autor.'),
		c.nicho && `Nicho / briefing: ${c.nicho}`, c.publico && `Público: ${c.publico}`, c.tom && `Tom e jeito de falar: ${c.tom}`,
		c.regras && `Regras do canal: ${c.regras}`, c.cta && `CTA de fechamento: ${c.cta}`, `Idioma: ${c.idioma || 'pt-BR'}`].filter(Boolean).join('\n');
}

function blocoEstilo(e) {
	if (!e) return 'ESTILO: livre — escolha uma linguagem de brand/linguagens.md que combine com o tema.';
	return `ESTILO VISUAL ESCOLHIDO: ${e.nome}\n${e.guia}` + (e.referencia ? `\nReferência pronta no projeto (copie o motor/kit daqui, não o roteiro): ${e.referencia}` : '');
}

const ESTILOS_INICIAIS = [
	{ id: 'flat', nome: 'Explainer flat', cor: '#2E5BFF', ativo: true, referencia: 'demos/06-ressignificar-traumas', desc: 'Formas chapadas, cores vivas, bonecos geométricos. Didático e rápido.',
		guia: 'Linguagem 1 de brand/linguagens.md (Explainer flat colorido). Câmera ortográfica, contorno de tinta, sombra dura, folhas de cor lado a lado com whip pan, ícones grossos que se desenham. Kit: demos/05-hipnotizar-online/flat.js (person, hand, textPlane com fitFont). Paleta nova a cada vídeo.' },
	{ id: 'colagem', nome: 'Colagem de papel', cor: '#E63946', ativo: true, referencia: 'demos/15-estilos-true-crime', desc: 'Recortes, fita, retícula, rabiscos. Ótimo para histórias reais e curiosidades.',
		guia: 'Linguagem 2 de brand/linguagens.md (Colagem / mixed media). Planos de papel em camadas Z com parallax, borda branca, textura de papel, stop-motion a 12 fps nos recortes, rabiscos e setas à mão, carimbos, marca-texto. Silhuetas recortadas em vez de rostos reais.' },
	{ id: 'sombrio', nome: 'Cinematográfico sombrio', cor: '#F2A541', ativo: true, referencia: 'demos/15-estilos-true-crime', desc: 'Luz dura, neblina, grão, evidências. Mistério, crime, lado escuro.',
		guia: 'Linguagem 4 de brand/linguagens.md (Cinematográfico sombrio / true crime). SpotLight volumétrico, neblina, FilmPass, vinheta, cores dessaturadas com um acento âmbar ou vermelho, cartões-arquivo, fita de evidência, câmera de segurança. Personagens em silhueta, sem rosto.' },
	{ id: 'sticker', nome: 'Sticker', cor: '#B05CFF', ativo: true, referencia: 'demos/14-estrada-hipnotica', desc: 'Figurinhas 2D num mundo 3D pintado à mão. Desenho animado de causa e efeito.',
		guia: 'Use a skill estilo-sticker (o autor escolheu este estilo para o lote): figurinhas 2D com contorno ameixa e cabeça de feijão num mundo 3D pintado com contorno de tinta, céu saturado, profundidade de campo, câmera deslizando. Lib: demos/_sticker.' },
	{ id: 'pixel', nome: 'Pixel art / RPG', cor: '#3FBF7F', ativo: true, referencia: 'demos/17-primeira-sessao-rpg', desc: 'Jogo 8/16-bit: mapa, diálogos em caixa, barra de status.',
		guia: 'Pixel art estilo RPG 8/16-bit: render em baixa resolução ampliado sem suavização, paleta limitada, tiles, sprites com animação de 2–4 quadros, caixas de diálogo, barras de XP/status, efeitos de level-up. Referência: demos/17-primeira-sessao-rpg e demos/16-pixel-art.' },
	{ id: 'brinquedo', nome: '3D de brinquedo', cor: '#FFB38A', ativo: false, referencia: 'demos/21-teste-do-painel-a-estrada', desc: 'Bonecos de plástico brilhante, dioramas. (Desativado: o autor não curtiu.)',
		guia: 'Linguagem 3 de brand/linguagens.md (3D de brinquedo / diorama): mundos em miniatura, RoundedBox, luz de estúdio, tilt-shift, bonecos cápsula com figurino trocável.' },
	{ id: 'neural', nome: 'Neural luminoso (apoio)', cor: '#29D3FF', ativo: false, referencia: '', desc: 'Partículas e bloom. Só como trecho de apoio, nunca o vídeo todo.',
		guia: 'Linguagem 5 de brand/linguagens.md, SÓ como apoio "dentro do cérebro" (no máx. 20% do vídeo); a linguagem principal deve ser outra concreta (flat ou colagem). Brilho base baixo (0.3–0.5).' },
];

module.exports = { ETAPAS, PROMPTS, ESTILOS_INICIAIS, blocoCanal, blocoEstilo };
