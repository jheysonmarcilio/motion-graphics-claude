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

// Estilos: `desc` é só o resumo do painel; o que vai para o Claude é `guia` + `referencia` (entram no storyboard e na animação).
// Regra de qualidade comum a todos (vai junto na guia): personagens com rosto, cabelo, roupa e pose; cenários com 8+ objetos de set
// dressing; luz e sombra coerentes; nada de tela vazia. Kit de estilos: demos/_estilos/estilos.js (quarto, personagem, filtros).
// `rev` sobe quando o texto muda: o painel atualiza nome/desc/guia/img dos estilos já existentes (o autor pode editar depois).
const QUALIDADE = ' PADRÃO DE DETALHE (obrigatório): personagens com rosto (olhos, sobrancelha, boca), cabelo, roupa com 2+ cores, mãos e pose expressiva (nunca só cápsula+esfera parada); cenários com chão, paredes/fundo e pelo menos 8 objetos de set dressing coerentes com a cena; luz principal + luz de preenchimento + um ponto de luz prática (abajur, tela, vela, poste); profundidade (primeiro plano, meio, fundo). Comece pelo kit demos/_estilos/estilos.js (personagem(), quarto(), FILTROS, montarEstilo()) e por painel/estilos-preview.html?v=<id> como referência de acabamento; troque paleta, cenário e figurino para cada vídeo.';
const KIT = 'demos/_estilos (kit: personagem, quarto e filtros; amostra em painel/estilos-preview.html?v=';
const ESTILOS_INICIAIS = [
	{ id: 'anime', rev: 2, nome: 'Anime aconchegante', cor: '#FF6F61', ativo: true, referencia: KIT + 'anime)', desc: 'Desenho animado 3D com sombra em 2 tons e contorno, cores quentes. Serve para psicologia, religião, histórias. O mais versátil.',
		guia: 'Cel shading (estilo anime/desenho de TV): MeshToonMaterial com gradientMap de 3 tons (gradienteToon), OutlineEffect com contorno fino, paleta quente e saturada (paletas.anime como base), céu/janela com estrelas, luzes práticas acesas. Personagens com cabeça grande, cabelo com franja e coque/mecha, olhos simples e expressivos, poses claras (mão no queixo, braços abertos, cabeça baixa). Câmera 3/4 com dolly lento e cortes para close no rosto. Emoção vem de cor de luz (quente = acolhimento, azul = solidão).' + QUALIDADE },
	{ id: 'flat', rev: 2, nome: 'Explainer flat', cor: '#2E5BFF', ativo: true, referencia: 'demos/06-ressignificar-traumas e ' + KIT + 'flat)', desc: 'Formas chapadas, cores vivas, câmera de frente. Didático, rápido, ótimo para listas e explicações.',
		guia: 'Linguagem 1 de brand/linguagens.md (Explainer flat colorido). Câmera ortográfica de frente, MeshBasicMaterial sem luz, contorno escuro fino (OutlineEffect), paleta de 4–5 cores fortes (paletas.flat como base, nova a cada vídeo), whip pan entre "folhas" de cor, ícones grossos que se desenham, números e setas animadas. Kit: demos/05-hipnotizar-online/flat.js (person, hand, textPlane com fitFont) + personagem()/quarto() do kit de estilos com fabricaMat("basic").' + QUALIDADE },
	{ id: 'papel', rev: 2, nome: 'Papel recortado', cor: '#F2A03D', ativo: true, referencia: KIT + 'papel)', desc: 'Cenário em camadas de papel com sombra macia, de frente, como teatro de recortes. Delicado; ótimo para religião, parábolas, histórias de vida.',
		guia: 'Papercut / teatro de papel: câmera ortográfica de frente, cada objeto numa camada Z própria (afastadas 0.04–0.2), MeshStandardMaterial fosco de cor chapada, luz direcional forte de cima-esquerda-frente com PCFSoftShadowMap para a sombra de cada camada cair na de trás, grão de papel (FILTROS.grao) e borda levemente irregular. Movimento: camadas deslizando com parallax, personagens articulados como fantoches (rotação nos ombros/joelhos), elementos entrando de baixo como cenário de teatro.' + QUALIDADE },
	{ id: 'aquarela', rev: 2, nome: 'Aquarela de livro infantil', cor: '#E88B7A', ativo: true, referencia: KIT + 'aquarela)', desc: 'Pintura suave com borda que sangra e papel granulado. Emocional e acolhedor: religião, autoajuda, histórias.',
		guia: 'Storybook em aquarela: renderizar a cena 3D com luz suave (paletas.aquarela, cores pastel) e passar FILTROS.aquarela (borda que sangra, pigmento nos contornos, papel com grão). Evitar preto puro; sombras em azul/lilás. Câmera lenta, travellings suaves, transições por "mancha de tinta" que se espalha. Texto em fonte manuscrita elegante. Ideal para narrativas, parábolas, memórias.' + QUALIDADE },
	{ id: 'colagem', rev: 2, nome: 'Colagem de papel', cor: '#E63946', ativo: true, referencia: 'demos/15-estilos-true-crime', desc: 'Recortes, fita, retícula, rabiscos. Ótimo para histórias reais, curiosidades e true crime leve.',
		guia: 'Linguagem 2 de brand/linguagens.md (Colagem / mixed media). Planos de papel em camadas Z com parallax, borda branca, textura de papel, stop-motion a 12 fps nos recortes, rabiscos e setas à mão, carimbos, marca-texto. Silhuetas recortadas em vez de rostos reais.' + QUALIDADE },
	{ id: 'hq', rev: 2, nome: 'HQ noir (quadrinho)', cor: '#C8141E', ativo: true, referencia: KIT + 'hq)', desc: 'Quadrinho preto e branco com retícula e um vermelho de destaque, caixas de narração. Forte para true crime e mistério.',
		guia: 'Graphic novel noir: cena 3D com luz dura lateral (sombras grandes), paleta cinza (paletas.noir) com UM elemento vermelho por cena (roupa, objeto-pista), FILTROS.noir (retícula de pontos, tinta preta nos contornos, vermelho preservado). Caixas de narração retangulares tipo HQ (fundo creme, borda preta grossa, fonte Courier/monoespaçada), onomatopeias quando couber, enquadramentos de quadrinho (close extremo, contra-plongée, split em painéis). Cortes secos, sem crossfade.' + QUALIDADE },
	{ id: 'sombrio', rev: 2, nome: 'Cinematográfico sombrio', cor: '#F2A541', ativo: true, referencia: 'demos/15-estilos-true-crime e ' + KIT + 'sombrio)', desc: 'Luz baixa, neblina, grão, uma lâmpada no escuro. Mistério, crime, lado escuro da mente.',
		guia: 'Linguagem 4 de brand/linguagens.md (Cinematográfico sombrio / true crime). Ambiente quase escuro (paletas.sombrio), uma luz prática quente forte (abajur, poste) + luz de lua azul fria, FogExp2, ACESFilmic, FILTROS.grao com vinheta forte. Cartões-arquivo, fita de evidência, câmera de segurança, fotos na parede com barbante. Personagens com rosto na penumbra, sem gore.' + QUALIDADE },
	{ id: 'vitral', rev: 2, nome: 'Vitral', cor: '#1AA6B7', ativo: true, referencia: KIT + 'vitral)', desc: 'Cena vira vitral de igreja: vidro colorido com chumbo preto e luz atravessando. Feito para religião e espiritualidade.',
		guia: 'Vitral: cena com cores de joia (paletas.vitral: azul cobalto, rubi, ouro, esmeralda) e FILTROS.vitral (células de vidro Voronoi + chumbo preto; células menores = mais detalhe, celulas 30–40). Usar em cenas simbólicas e com poucos elementos grandes e legíveis (pessoa orando, luz, mãos, cruz, pomba, árvore), raios de luz (UnrealBloomPass suave) atravessando. Alternar com planos normais em toon para cenas de diálogo; vitral nos momentos-chave. Respeitoso, sem caricatura de figuras sagradas.' + QUALIDADE },
	{ id: 'giz', rev: 2, nome: 'Lousa de giz', cor: '#2F6B4F', ativo: true, referencia: KIT + 'giz)', desc: 'Tudo desenhado a giz numa lousa verde, com cor leve. Aula, professor, explicação didática.',
		guia: 'Chalkboard: cena 3D com MeshBasicMaterial de cores distintas (paletas.contorno) passando por FILTROS.linhas({ fundo verde, tinta giz, preench 0.2 }) — vira contorno de giz com cor de giz leve. Títulos em fonte manuscrita grossa, setas e círculos "riscados" à mão, palavras que aparecem como se escritas. Pode-se "apagar" a lousa com apagador como transição.' + QUALIDADE },
	{ id: 'whiteboard', rev: 2, nome: 'Quadro branco (doodle)', cor: '#222222', ativo: true, referencia: KIT + 'whiteboard)', desc: 'Desenho a caneta no quadro branco com mão desenhando. Clássico de explicação, prende atenção.',
		guia: 'Whiteboard animation: a mesma técnica do giz com fundo branco e tinta preta (FILTROS.linhas({ fundo branco, tinta preta, preench 0.1 })), 1 cor de destaque (vermelho ou azul) só nas palavras-chave, mão com caneta (personagem/hand do kit flat) seguindo o traço; revelar o desenho progressivamente (máscara que avança ou objetos surgindo em ordem). Câmera ortográfica fazendo pan/zoom num quadro gigante.' + QUALIDADE },
	{ id: 'isometrico', rev: 2, nome: 'Mundo isométrico', cor: '#4C6EF5', ativo: true, referencia: KIT + 'isometrico)', desc: 'Cômodos e cidades em miniatura vistos em diagonal, como um infográfico vivo. Sistemas, rotinas, processos.',
		guia: 'Câmera ortográfica isométrica (posição (1,0.95,1)·d), cômodo em corte (2 paredes + chão) ou quarteirão, MeshStandardMaterial pastel (paletas.iso) + 1 acento, sombras suaves. Pessoinhas andando entre cômodos/prédios, setas e fluxos mostrando processos, ícones flutuando sobre objetos, a câmera desliza de um cômodo a outro. Ótimo para "um dia na vida", hábitos, mecanismos.' + QUALIDADE },
	{ id: 'silhueta', rev: 2, nome: 'Silhuetas no pôr do sol', cor: '#FF7340', ativo: true, referencia: KIT + 'silhueta)', desc: 'Silhuetas pretas contra céu em degradê. Emocional: relatos, relacionamentos, luto, fé, superação.',
		guia: 'Silhuetas: tudo em preto (fabricaMat("preto")), fundo em degradê (CanvasTexture) que muda de cor conforme o clima, sol/lua grande atrás do personagem, morros em 2–3 camadas com parallax, pássaros, uma luz prática acesa (abajur, vela) como único ponto colorido. Personagens de perfil com gestos claros e legíveis só pelo contorno (abraço, oração, queda, caminhar). Texto branco limpo.' + QUALIDADE },
	{ id: 'neon', rev: 2, nome: 'Neon noturno', cor: '#FF2A6D', ativo: true, referencia: KIT + 'neon)', desc: 'Contornos de neon brilhando no escuro. Chamativo: insônia, ansiedade, curiosidades, tecnologia e mente.',
		guia: 'Neon: cena com MeshBasicMaterial colorido (paletas.contorno) passando por FILTROS.linhas({ neon: 1 }) + UnrealBloomPass moderado (força 0.6–0.8): só os contornos acendem nas cores dos objetos sobre fundo quase preto. Relógio digital, letreiros, tela de celular. Não estourar o bloom (texto precisa ler). Cortes no beat, glitch curto nas viradas.' + QUALIDADE },
	{ id: 'sticker', rev: 2, nome: 'Sticker', cor: '#B05CFF', ativo: true, referencia: 'demos/14-estrada-hipnotica', desc: 'Figurinhas 2D num mundo 3D pintado à mão. Desenho animado de causa e efeito.',
		guia: 'Use a skill estilo-sticker (o autor escolheu este estilo para o lote): figurinhas 2D com contorno ameixa e cabeça de feijão num mundo 3D pintado com contorno de tinta, céu saturado, profundidade de campo, câmera deslizando. Lib: demos/_sticker.' + QUALIDADE },
	{ id: 'pixel', rev: 2, nome: 'Pixel art / RPG', cor: '#3FBF7F', ativo: true, referencia: 'demos/17-primeira-sessao-rpg e ' + KIT + 'pixel)', desc: 'Jogo 16-bit: cenário pixelado, caixas de diálogo, barras de status. Divertido para hábitos, desafios, "subir de nível".',
		guia: 'Pixel art estilo RPG 16-bit: renderizar a cena toon em baixa resolução (320×180 no longo, 180×320 no Short) e ampliar sem suavização (canvas 2D com imageSmoothingEnabled=false), paleta limitada, contorno grosso, caixas de diálogo pretas com borda branca, barras de XP/status, efeitos de level-up. Referência: demos/17-primeira-sessao-rpg e demos/16-pixel-art.' + QUALIDADE },
	{ id: 'tipografia', rev: 2, nome: 'Tipografia cinética', cor: '#FFD23F', ativo: true, referencia: '', desc: 'As palavras da narração viram o visual: entram, giram e batem no ritmo da voz. Bom como estilo de apoio ou Shorts rápidos.',
		guia: 'Kinetic typography: cada frase vira blocos de texto grandes (fitFont, nunca estoura a caixa) sincronizados com os tempos das palavras; fundo escuro chapado com 2–3 cores de acento; entradas com overshoot, cortes no beat, palavra-chave em cor de destaque e escala maior; câmera 3D girando entre "paredes" de texto. A cada 2–3 frases, um objeto/personagem detalhado do kit de estilos (personagem(), objetos do quarto()) entra em cena para não virar só texto.' },
	{ id: 'brinquedo', rev: 2, nome: '3D de brinquedo', cor: '#FFB38A', ativo: false, referencia: 'demos/21-teste-do-painel-a-estrada', desc: 'Bonecos de plástico brilhante, dioramas. (Desativado: o autor não curtiu.)',
		guia: 'Linguagem 3 de brand/linguagens.md (3D de brinquedo / diorama): mundos em miniatura, RoundedBox, luz de estúdio, tilt-shift, bonecos cápsula com figurino trocável.' + QUALIDADE },
	{ id: 'neural', rev: 2, nome: 'Neural luminoso (apoio)', cor: '#29D3FF', ativo: false, referencia: '', desc: 'Partículas e bloom. Só como trecho de apoio, nunca o vídeo todo.',
		guia: 'Linguagem 5 de brand/linguagens.md, SÓ como apoio "dentro do cérebro" (no máx. 20% do vídeo); a linguagem principal deve ser outra concreta. Brilho base baixo (0.3–0.5).' },
];
// estilos que saíram da lista: o painel desliga (ou apaga, se nenhum vídeo usou)
const ESTILOS_RETIRADOS = ['lowpoly', 'mapa', 'blueprint'];
for (const e of ESTILOS_INICIAIS) e.img = `estilos/${e.id}.jpg?v=${e.rev || 1}`;

module.exports = { ETAPAS, PROMPTS, ESTILOS_INICIAIS, ESTILOS_RETIRADOS, blocoCanal, blocoEstilo };
