// Estúdio — painel multicanal e multiusuário (UI + API + fila + agenda + piloto automático). Sem dependências.
// No PC:       node painel/servidor.cjs              → http://localhost:5180 (liga o agente do 1º admin junto)
// No servidor: SEM_AGENTE=1 PAINEL_URL=https://painel.seudominio.com node painel/servidor.cjs
//              (cada usuário roda o agente no próprio PC: node painel/agente.cjs --painel <url> --token <token dele>)
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const { ETAPAS, PROMPTS, ESTILOS_INICIAIS, blocoCanal, blocoEstilo } = require('./etapas.cjs');

const args = process.argv.slice(2), flag = k => args.includes('--' + k), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const DIR = __dirname, DADOS = path.resolve(opt('dados', process.env.PAINEL_DADOS || path.join(DIR, 'dados'))), UP = path.join(DADOS, 'uploads');
const PROJETO = path.resolve(DIR, '..');
fs.mkdirSync(UP, { recursive: true });
const SEM_AGENTE = flag('sem-agente') || !!process.env.SEM_AGENTE;

// ── Configuração global (dados/config.json) ──
const CFG_FILE = path.join(DADOS, 'config.json'), CFG_ANTIGA = path.join(DIR, 'config.json');
if (!fs.existsSync(CFG_FILE) && fs.existsSync(CFG_ANTIGA)) fs.renameSync(CFG_ANTIGA, CFG_FILE);
const FERRAMENTAS = 'Read Write Edit Glob Grep Skill Agent Bash(node:*) Bash(cp:*) Bash(ls:*) Bash(mkdir:*) Bash(ffmpeg:*) Bash(ffprobe:*) Bash(grep:*) Bash(cat:*) Bash(head:*) Bash(tail:*) Bash(sed:*) Bash(wc:*) Bash(python:*) Bash(py:*) Bash(pip:*) Bash(cd:*) Bash(rm:*)';
let cfg = { porta: 5180, host: '', segredo: crypto.randomBytes(24).toString('hex'), fuso: 'America/Sao_Paulo', urlPublica: '', prompts: {}, google: { clientId: '', clientSecret: '' },
	...(fs.existsSync(CFG_FILE) ? JSON.parse(fs.readFileSync(CFG_FILE, 'utf8')) : {}) };
if (!cfg.google?.clientId) { // cliente OAuth do projeto (client_secret.json), se existir nesta máquina
	try { const c = JSON.parse(fs.readFileSync(path.join(PROJETO, 'client_secret.json'), 'utf8')); const x = c.web || c.installed; cfg.google = { clientId: x.client_id, clientSecret: x.client_secret }; } catch { }
}
const salvarCfg = () => fs.writeFileSync(CFG_FILE, JSON.stringify(cfg, null, 2));
const PORTA = +opt('porta', process.env.PORT || cfg.porta || 5180);
const HOST = opt('host', process.env.HOST || cfg.host || (SEM_AGENTE ? '0.0.0.0' : '127.0.0.1'));
if (process.env.PAINEL_URL) cfg.urlPublica = process.env.PAINEL_URL.replace(/\/$/, '');

// ── Banco (JSON) ──
const DB_FILE = path.join(DADOS, 'db.json');
let db = fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) : { jobs: [], regras: [], temas: [], seq: 1 };
let salvarT = null;
const gravarDb = () => { fs.writeFileSync(DB_FILE + '.tmp', JSON.stringify(db)); fs.renameSync(DB_FILE + '.tmp', DB_FILE); };
const salvar = () => { clearTimeout(salvarT); salvarT = setTimeout(gravarDb, 300); };
const novoId = p => p + (db.seq++).toString(36) + crypto.randomBytes(2).toString('hex');
const agora = () => new Date().toISOString();
const slugify = s => (s || 'video').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').split('-').slice(0, 5).join('-') || 'video';

// ── Usuários ──
db.usuarios ||= []; db.avisos ||= []; db.pesquisas ||= [];
// Motor por etapa: o mais barato que faz a tarefa bem. prefs.modeloFixo/esforcoFixo (vazio = automático) sobrepõem.
const MOTORES = { pesquisa: ['haiku', 'medium'], tema: ['haiku', 'medium'], roteiro: ['opus', 'medium'], revisao: ['sonnet', 'medium'], storyboard: ['sonnet', 'medium'], animacao: ['opus', 'medium'] };
const motor = (id, pr) => { const [m, e] = MOTORES[id] || ['sonnet', 'medium']; return { modelo: pr.modeloFixo || m, esforco: pr.esforcoFixo || e, permissao: pr.permissao, ferramentas: pr.ferramentas }; };
const PREFS = { modeloFixo: '', esforcoFixo: '', permissao: 'acceptEdits', ferramentas: FERRAMENTAS };
const hashSenha = (senha, salt = crypto.randomBytes(16).toString('hex')) => ({ salt, hash: crypto.scryptSync(String(senha), salt, 64).toString('hex') });
const confere = (u, senha) => { const h = crypto.scryptSync(String(senha), u.salt, 64); return crypto.timingSafeEqual(h, Buffer.from(u.hash, 'hex')); };
function novoUsuario({ login, senha, nome, admin }) {
	const u = { id: novoId('u'), login: String(login).trim().toLowerCase(), nome: nome || login, admin: !!admin, criado: agora(), ...hashSenha(senha),
		tokenAgente: crypto.randomBytes(24).toString('base64url'), prefs: { ...PREFS }, avisos: { telegramToken: '', telegramChat: '', webhook: '' }, google: { clientId: '', clientSecret: '' } };
	db.usuarios.push(u); return u;
}
const usuario = id => db.usuarios.find(u => u.id === id);
const pubUsuario = u => u && ({ id: u.id, login: u.login, nome: u.nome, admin: u.admin, criado: u.criado });

// ── Canais e estilos ──
const GATES = ['roteiro', 'revisao', 'storyboard', 'animacao'];
const PILOTO = { ativo: false, fonte: 'pesquisa', estoqueAlvo: 3, limite: 3, publicar: { ativo: false, horarios: ['18:00'], dias: [0, 1, 2, 3, 4, 5, 6] }, ultimas: {} };
const canalPadrao = (b = {}) => ({
	nome: 'Novo canal', cor: '#8b7cff', principal: false, ativo: true, nicho: '', pesquisaTema: '', publico: '', tom: '', regras: '', cta: '', idioma: 'pt-BR',
	narracao: 'tts', voz: 'pt-BR-AntonioNeural', velocidade: '+22%', formato: 'short', duracaoShort: 50, duracaoLongo: 420,
	estilos: (db.estilos || []).filter(e => e.ativo).map(e => e.id), notaMinima: 8,
	gates: { roteiro: false, revisao: false, storyboard: false, animacao: false },
	youtube: { ativo: false, token: '', privacidade: 'private', conexao: null }, piloto: structuredClone(PILOTO), ...b,
});
if (!db.estilos) db.estilos = ESTILOS_INICIAIS.map(e => ({ ...e }));
db.estilosSemeados ||= db.estilos.map(e => e.id); // estilos novos entram uma vez; apagados não voltam
for (const ei of ESTILOS_INICIAIS) { const ex = db.estilos.find(e => e.id === ei.id); if (ex) ex.img ||= ei.img; else if (!db.estilosSemeados.includes(ei.id)) db.estilos.push({ ...ei }); if (!db.estilosSemeados.includes(ei.id)) db.estilosSemeados.push(ei.id); }
if (!db.canais) db.canais = [{ id: 'principal', ...canalPadrao(), nome: 'Mente & Psicologia (principal)', principal: true, narracao: 'autor', cor: '#5ee0c0',
	gates: { roteiro: true, revisao: false, storyboard: false, animacao: true }, youtube: { ativo: false, token: 'token.json', privacidade: 'private', conexao: null } }];
for (const c of db.canais) { c.piloto = { ...structuredClone(PILOTO), ...(c.piloto || {}) }; c.youtube.conexao ??= null; c.pesquisaTema ??= ''; }
for (const j of db.jobs) { j.canalId ||= 'principal'; for (const e of ETAPAS) j.etapas[e.id] ||= { estado: 'pulado', log: [] }; }
for (const t of db.temas) t.canalId ||= 'principal';
for (const r of db.regras) r.canalId ||= 'principal';
const canal = id => db.canais.find(c => c.id === id);
const estilo = id => db.estilos.find(e => e.id === id);
const donoJob = j => canal(j.canalId)?.dono;
const meusCanais = u => db.canais.filter(c => c.dono === u.id);
const meuJob = (j, u) => j && donoJob(j) === u.id;

// ── Hora no fuso ──
function horaLocal(d = new Date()) {
	const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: cfg.fuso, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false })
		.formatToParts(d).map(x => [x.type, x.value]));
	return { data: `${p.year}-${p.month}-${p.day}`, hm: `${p.hour === '24' ? '00' : p.hour}:${p.minute}`, dia: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday) };
}

// ── Avisos (painel + Telegram + webhook) ──
function avisar(userId, texto, { chave, tipo = 'info', jobId = null, canalId = null } = {}) {
	const u = usuario(userId); if (!u) return;
	if (chave && db.avisos.some(a => a.userId === userId && a.chave === chave)) return;
	db.avisos.push({ id: novoId('a'), userId, em: agora(), texto, tipo, chave: chave || null, jobId, canalId, lido: false });
	const meus = db.avisos.filter(a => a.userId === userId); if (meus.length > 200) db.avisos.splice(db.avisos.indexOf(meus[0]), 1);
	const msg = `🎬 Estúdio — ${texto}`;
	if (u.avisos.telegramToken && u.avisos.telegramChat)
		fetch(`https://api.telegram.org/bot${u.avisos.telegramToken}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: u.avisos.telegramChat, text: msg }) }).catch(() => { });
	if (u.avisos.webhook) fetch(u.avisos.webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texto: msg, tipo, canal: canal(canalId)?.nome, em: agora() }) }).catch(() => { });
	salvar();
}

// ── Vídeos (jobs) ──
const base = j => j.nn ? `${String(j.nn).padStart(2, '0')}-${j.slug}` : null;

function criarJob(d) {
	const c = canal(d.canalId), formato = (d.formato || c.formato) === 'longo' ? 'longo' : 'short';
	const j = {
		id: novoId('v'), criado: agora(), status: 'ativo', regraId: d.regraId || null, loteId: d.loteId || null, canalId: c.id, estilo: d.estilo || null,
		tema: (d.tema || '').trim(), slug: d.tema ? slugify(d.tema) : '', nn: null, formato,
		origem: d.origem === 'audio' ? 'audio' : 'tema', narracao: d.origem === 'audio' ? 'autor' : c.narracao,
		gates: { ...c.gates, ...(d.gates || {}) }, instrucoes: [d.instrucoes, d.detalhe && 'Sugestão da pesquisa (siga este ângulo): ' + d.detalhe].filter(Boolean).join('\n'),
		youtube: { titulo: '', descricao: '', tags: [], privacidade: d.privacidade || c.youtube.privacidade, editado: false, url: '' },
		publicarEm: d.publicarEm || null, audioUpload: null, mp4Upload: null, mp4Local: null, demo: null, custo: 0, duracao: null,
		etapas: Object.fromEntries(ETAPAS.map(e => [e.id, { estado: 'pendente', log: [] }])), arquivos: {},
	};
	if (j.tema) j.etapas.tema.estado = 'pulado';
	if (formato !== 'longo' && j.etapas.thumbs) j.etapas.thumbs.estado = 'pulado'; // teste A/B de thumbnails só existe na versão PHP
	if (j.origem === 'audio') for (const k of ['tema', 'roteiro', 'revisao']) j.etapas[k].estado = 'pulado';
	db.jobs.push(j); recalcular(j); return j;
}

// Lote: N vídeos de um canal; temas da lista, da fila do canal ou automáticos (se permitido); estilos distribuídos.
function criarLote(b) {
	const c = canal(b.canalId), n = Math.min(Math.max(+b.quantidade || 1, 1), 50), loteId = novoId('l'), formato = b.formato || c.formato;
	const estilos = (b.estilos?.length ? b.estilos : c.estilos).filter(id => estilo(id));
	const temas = (b.temas || []).map(s => s.trim()).filter(Boolean);
	const usados = db.jobs.filter(j => j.canalId === c.id && j.estilo).map(j => j.estilo);
	let k = estilos.length ? (estilos.indexOf(usados.at(-1)) + 1) % estilos.length : 0, ultimo = usados.at(-1);
	const ids = [];
	for (let i = 0; i < n; i++) {
		let tema = temas[i] || '', detalhe = '';
		if (!tema && b.origem !== 'audio') { const ti = db.temas.findIndex(t => t.canalId === c.id && (!t.formato || t.formato === formato)); if (ti >= 0) { const t = db.temas.splice(ti, 1)[0]; tema = t.tema; detalhe = t.detalhe || ''; } }
		if (!tema && b.soDaFila) break;
		let est = null;
		if (estilos.length) {
			if (b.distribuicao === 'aleatorio') { const pool = estilos.length > 1 ? estilos.filter(e => e !== ultimo) : estilos; est = pool[Math.floor(Math.random() * pool.length)]; }
			else { est = estilos[k % estilos.length]; k++; }
			ultimo = est;
		}
		ids.push(criarJob({ ...b, canalId: c.id, formato, tema, detalhe, estilo: est, loteId }).id);
	}
	salvar(); return ids;
}

const etapaAtual = j => ETAPAS.find(e => !['feito', 'pulado'].includes(j.etapas[e.id].estado));

function recalcular(j) {
	const e = etapaAtual(j);
	if (!e) { if (j.status === 'ativo') j.status = 'concluido'; return; }
	const s = j.etapas[e.id], c = canal(j.canalId);
	if (e.id === 'narracao' && j.narracao === 'autor' && !j.audioUpload && ['pendente', 'aguardando'].includes(s.estado)) { s.estado = 'aguardando'; s.motivo = 'Envie a narração gravada (mp3/wav)'; }
	else if (e.id === 'narracao' && s.estado === 'aguardando') { s.estado = 'pendente'; s.motivo = ''; }
	if (e.id === 'publicar' && ['pendente', 'aguardando'].includes(s.estado)) {
		const yt = c.youtube.ativo && (c.youtube.conexao || c.youtube.token);
		if (!j.publicarEm) { s.estado = 'aguardando'; s.motivo = 'Pronto, no estoque. Esperando o horário de publicação ou "Publicar agora".'; }
		else if (new Date(j.publicarEm) > new Date()) { s.estado = 'aguardando'; s.motivo = 'Agendado para ' + new Date(j.publicarEm).toLocaleString('pt-BR', { timeZone: cfg.fuso }); }
		else if (!yt) { s.estado = 'aguardando'; s.motivo = `Horário chegou. YouTube do canal "${c.nome}" desligado/desconectado: publique à mão e clique "Marcar publicado".`; avisar(c.dono, `"${j.youtube.titulo || j.tema}" está no horário, mas o YouTube do canal ${c.nome} não está conectado. Publique à mão.`, { chave: 'pubmanual:' + j.id, jobId: j.id, canalId: c.id, tipo: 'aviso' }); }
		else { s.estado = 'pendente'; s.motivo = ''; }
	}
}

const usadosCanal = (cid, excetoId) => [...db.jobs.filter(x => x.canalId === cid && x.id !== excetoId && x.tema).slice(-25).map(x => `- ${x.tema}${x.estilo ? ` [${estilo(x.estilo)?.nome || x.estilo}]` : ''}`),
	...db.temas.filter(t => t.canalId === cid).map(t => `- ${t.tema} (na fila)`)];
const historicoCanal = (cid, excetoId) => { const l = usadosCanal(cid, excetoId); return l.length ? l.join('\n') : '(canal novo, nada ainda)'; };

function renderPrompt(id, j, extra = {}) {
	const tpl = cfg.prompts[id] || PROMPTS[id];
	if (!tpl) return '';
	const c = canal(j.canalId), formato = j.formato || c.formato, seg = formato === 'longo' ? c.duracaoLongo : c.duracaoShort;
	const v = {
		base: base(j) || '', tema: j.tema || '', formato: formato === 'longo' ? 'vídeo longo 16:9' : 'Short 9:16', formatoCurto: formato,
		skillStoryboard: formato === 'longo' ? 'roteiro-longo' : 'roteiro-short', canal: blocoCanal(c), estilo: blocoEstilo(estilo(j.estilo)),
		historico: historicoCanal(c.id, j.id), duracao: seg >= 90 ? `${Math.round(seg / 60)} min` : `${seg} s`, palavras: Math.round(seg * (j.narracao === 'tts' || !j.narracao ? 2.8 : 2.5)),
		instrucoes: j.instrucoes ? 'Instruções do autor para este vídeo: ' + j.instrucoes : '',
		feedback: extra.feedback ? 'REFAÇÃO pedida pelo autor: ' + extra.feedback : '',
		audio: j.audioLocal || `audio/${base(j)}.mp3`, erro: extra.erro || '', nota: c.notaMinima, pesquisaTema: c.pesquisaTema || c.nicho || c.nome,
	};
	return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => v[k] ?? '').replace(/\n{3,}/g, '\n\n').trim();
}

// ── Agentes (um por usuário) ──
const agentes = {}; // userId → { visto, nome, ocupado }
const cancelar = {}; // userId → Set(jobId/pesquisaId)
const agenteDe = u => ({ ...(agentes[u.id] || { visto: 0 }), online: Date.now() - (agentes[u.id]?.visto || 0) < 20000 });
const cancelarJob = j => { const d = donoJob(j); if (d) (cancelar[d] ||= new Set()).add(j.id); };

function proximaTarefa(u) {
	const meus = new Set(meusCanais(u).filter(c => c.ativo !== false).map(c => c.id));
	const ativos = db.jobs.filter(j => j.status === 'ativo' && meus.has(j.canalId));
	ativos.forEach(recalcular);
	const prontos = ativos.map(j => ({ j, e: etapaAtual(j) })).filter(x => x.e && x.j.etapas[x.e.id].estado === 'pendente');
	const prio = x => (x.e.id === 'publicar' ? 0 : x.e.id === 'exportar' ? 1 : 3);
	prontos.sort((a, b) => prio(a) - prio(b) || a.j.criado.localeCompare(b.j.criado));
	const p = db.pesquisas.find(p => p.estado === 'pendente' && meus.has(p.canalId));
	if (p && (!prontos[0] || prio(prontos[0]) > 1)) return { p };
	return prontos[0];
}

function montarTarefa({ j, e }, u) {
	const s = j.etapas[e.id], c = canal(j.canalId), pr = { ...PREFS, ...u.prefs };
	s.estado = 'rodando'; s.inicio = agora(); s.fim = null; s.erro = ''; s.log = [];
	const t = { jobId: j.id, etapa: e.id, tipo: e.tipo, nn: j.nn, slug: j.slug || slugify(j.tema), formato: j.formato, tema: j.tema,
		reservados: db.jobs.filter(x => donoJob(x) === u.id).map(x => x.nn).filter(Boolean), arquivos: {}, feedback: s.feedback || '',
		claude: motor(e.id, pr) };
	for (const [p, f] of Object.entries(j.arquivos)) if (f.sujo) t.arquivos[p] = f.conteudo;
	if (e.id === 'tema') t.prompt = renderPrompt('tema', j);
	if (e.id === 'narracao') { t.modo = j.narracao; t.voz = c.voz; t.velocidade = c.velocidade; t.formato = j.formato || c.formato; t.audioUpload = j.audioUpload ? path.extname(j.audioUpload) : null; }
	if (e.id === 'exportar') t.audio = j.audioLocal;
	if (e.id === 'publicar') {
		const g = googleDe(u), cx = c.youtube.conexao;
		t.youtube = { ...j.youtube, mp4: j.mp4Local, token: c.youtube.token || 'token.json',
			credenciais: cx ? { client_id: g.clientId, client_secret: g.clientSecret, refresh_token: cx.refresh } : null };
	}
	return t;
}

function montarPesquisa(p, u) {
	const c = canal(p.canalId), pr = { ...PREFS, ...u.prefs };
	p.estado = 'rodando'; p.inicio = agora(); p.log = []; p.erro = '';
	return { pesquisaId: p.id, etapa: 'pesquisa', tipo: 'pesquisa', prompt: renderPrompt('pesquisa', { canalId: c.id, formato: p.formato || c.formato }),
		claude: motor('pesquisa', pr) };
}

// ── Piloto automático + agenda ──
function pedirPesquisa(c, motivo) {
	if (db.pesquisas.some(p => p.canalId === c.id && ['pendente', 'rodando'].includes(p.estado))) return null;
	const ult = db.pesquisas.filter(p => p.canalId === c.id).at(-1); // não repetir em loop se a última falhou ou veio vazia
	if (motivo !== 'pedida manualmente' && ult && (ult.estado === 'erro' || !ult.temas?.length) && Date.now() - new Date(ult.fim || ult.criado) < 6 * 3600e3) return null;
	const p = { id: novoId('p'), canalId: c.id, formato: c.formato, estado: 'pendente', criado: agora(), log: [], motivo };
	db.pesquisas.push(p); avisar(c.dono, `Pesquisa de novos temas iniciada para ${c.nome} (${motivo}).`, { canalId: c.id }); return p;
}

function rodarPiloto(c, h) {
	const pl = c.piloto; if (!pl.ativo || c.ativo === false) return;
	const doCanal = db.jobs.filter(j => j.canalId === c.id && j.status === 'ativo');
	const fila = db.temas.filter(t => t.canalId === c.id);
	// 1) produção: manter o estoque (vídeos produzindo + prontos) no alvo, usando só temas da fila
	const faltam = (+pl.estoqueAlvo || 1) - doCanal.length;
	if (faltam > 0 && fila.length) criarLote({ canalId: c.id, quantidade: Math.min(faltam, fila.length), soDaFila: true, distribuicao: 'alternar' });
	// 2) temas acabando → pesquisa (automático) ou aviso (manual)
	const restante = db.temas.filter(t => t.canalId === c.id).length + db.jobs.filter(j => j.canalId === c.id && j.status === 'ativo').length;
	if (restante <= (+pl.limite || 0)) {
		if (pl.fonte === 'pesquisa') pedirPesquisa(c, restante ? `restam ${restante} temas/vídeos` : 'fila vazia');
		else avisar(c.dono, restante ? `O fluxo do canal ${c.nome} está acabando: restam ${restante} temas/vídeos. Adicione novos temas na fila do canal.` : `O fluxo do canal ${c.nome} acabou: não há temas nem vídeos em produção. Adicione temas para continuar.`,
			{ chave: `fila:${c.id}:${h.data}:${restante ? 'baixa' : 'zero'}`, canalId: c.id, tipo: 'aviso' });
	}
	// 3) publicação nos horários do piloto
	const pub = pl.publicar;
	if (pub.ativo && pub.dias.includes(h.dia)) for (const hora of pub.horarios) {
		if (h.hm < hora || pl.ultimas[hora] === h.data) continue;
		pl.ultimas[hora] = h.data;
		const j = db.jobs.filter(j => j.canalId === c.id && j.status === 'ativo' && etapaAtual(j)?.id === 'publicar' && !j.publicarEm).sort((a, b) => a.criado.localeCompare(b.criado))[0];
		if (j) { j.publicarEm = agora(); recalcular(j); }
		else avisar(c.dono, `Horário de publicação ${hora} do canal ${c.nome} chegou sem vídeo pronto no estoque.`, { chave: `semestoque:${c.id}:${h.data}:${hora}`, canalId: c.id, tipo: 'aviso' });
	}
}

let ultimoMinuto = '';
function rodarAgenda() {
	const h = horaLocal(), chave = h.data + ' ' + h.hm;
	db.jobs.filter(j => j.status === 'ativo').forEach(recalcular);
	for (const c of db.canais) if (c.dono) rodarPiloto(c, h);
	if (chave !== ultimoMinuto) {
		ultimoMinuto = chave;
		for (const r of db.regras) {
			if (!r.ativo || !r.dias.includes(h.dia) || r.ultima === h.data || h.hm < r.hora || !canal(r.canalId)) continue;
			executarRegra(r); r.ultima = h.data;
		}
	}
	salvar();
}

function executarRegra(r) {
	const log = [];
	if (r.tipo === 'gerar') {
		const ids = criarLote({ canalId: r.canalId, quantidade: r.quantidade, formato: r.formato, estilos: r.estilos, distribuicao: r.distribuicao, gates: r.gates, instrucoes: r.instrucoes, regraId: r.id, privacidade: r.privacidade });
		for (const id of ids) { const j = db.jobs.find(x => x.id === id); log.push((j.tema || 'tema automático') + (j.estilo ? ` [${estilo(j.estilo)?.nome}]` : '')); }
	} else {
		const prontos = db.jobs.filter(j => j.status === 'ativo' && j.canalId === r.canalId && etapaAtual(j)?.id === 'publicar' && !j.publicarEm && (!r.formato || r.formato === 'todos' || j.formato === r.formato))
			.sort((a, b) => a.criado.localeCompare(b.criado)).slice(0, r.quantidade);
		for (const j of prontos) { j.publicarEm = agora(); if (r.privacidade) j.youtube.privacidade = r.privacidade; recalcular(j); log.push(j.youtube.titulo || j.tema); }
		if (!prontos.length) log.push('nenhum vídeo pronto no estoque');
	}
	r.historico = [{ em: agora(), log }, ...(r.historico || [])].slice(0, 15);
}

function proximasExecucoes(u) {
	const out = [], h = horaLocal(), ids = new Set(meusCanais(u).map(c => c.id)), DS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
	const proxima = (dias, hora, feita) => { for (let k = 0; k < 8; k++) { const dia = (h.dia + k) % 7; if (!dias.includes(dia)) continue; if (k === 0 && (feita || h.hm > hora)) continue; return { k, quando: k === 0 ? 'hoje ' + hora : k === 1 ? 'amanhã ' + hora : DS[dia] + ' ' + hora }; } };
	for (const r of db.regras.filter(r => r.ativo && ids.has(r.canalId))) { const x = proxima(r.dias, r.hora, r.ultima === h.data); if (x) out.push({ regra: r.nome, tipo: r.tipo, canalId: r.canalId, hora: r.hora, ...x }); }
	for (const c of meusCanais(u)) if (c.piloto.ativo && c.piloto.publicar.ativo) for (const hora of c.piloto.publicar.horarios) {
		const x = proxima(c.piloto.publicar.dias, hora, c.piloto.ultimas[hora] === h.data); if (x) out.push({ regra: 'Piloto automático', tipo: 'publicar', canalId: c.id, hora, ...x });
	}
	return out.sort((a, b) => a.k - b.k || a.hora.localeCompare(b.hora));
}
const naoRetroagir = r => { const h = horaLocal(); if (h.hm >= r.hora) r.ultima = h.data; };
const limparRegra = (b, u) => ({
	nome: (b.nome || '').trim() || (b.tipo === 'publicar' ? 'Publicar' : 'Produzir'), tipo: b.tipo === 'publicar' ? 'publicar' : 'gerar', canalId: (canal(b.canalId)?.dono === u.id ? b.canalId : meusCanais(u)[0]?.id),
	dias: (b.dias || [0, 1, 2, 3, 4, 5, 6]).map(Number), hora: /^\d\d:\d\d$/.test(b.hora) ? b.hora : '09:00', quantidade: Math.min(Math.max(+b.quantidade || 1, 1), 20),
	formato: b.formato || 'short', estilos: b.estilos || [], distribuicao: b.distribuicao === 'aleatorio' ? 'aleatorio' : 'alternar',
	gates: b.gates || null, instrucoes: b.instrucoes || '', privacidade: b.privacidade || '', ultima: b.ultima || null,
});

// ── YouTube (OAuth pelo painel) ──
const googleDe = u => (u.google?.clientId ? u.google : cfg.google) || {};
const urlBase = req => cfg.urlPublica || `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers['x-forwarded-host'] || req.headers.host}`;
const assinar = s => crypto.createHmac('sha256', cfg.segredo).update(s).digest('base64url');

// ── Sessão ──
const cookies = req => Object.fromEntries((req.headers.cookie || '').split(';').map(c => c.trim().split('=')).filter(x => x[0]));
function sessao(req) {
	const [uid, exp, sig] = (cookies(req).mg || '').split('.');
	if (!uid || !sig || +exp < Date.now() || assinar(uid + '.' + exp) !== sig) return null;
	return usuario(uid) || null;
}
function abrirSessao(req, res, u) {
	const exp = Date.now() + 30 * 864e5, v = `${u.id}.${exp}.${assinar(u.id + '.' + exp)}`;
	const seguro = req.headers['x-forwarded-proto'] === 'https' || /^https/.test(cfg.urlPublica) ? '; Secure' : '';
	res.writeHead(200, { 'Set-Cookie': `mg=${v}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${seguro}`, 'Content-Type': 'application/json' });
	res.end(JSON.stringify({ usuario: pubUsuario(u) }));
}
const tentativas = {};
const bloqueado = ip => { const t = (tentativas[ip] || []).filter(x => Date.now() - x < 600000); tentativas[ip] = t; return t.length >= 10; };

// ── HTTP util ──
const json = (res, obj, code = 200) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); };
const corpo = (req, max = 5e6) => new Promise((ok, err) => { let b = ''; req.setEncoding('utf8'); req.on('data', c => { b += c; if (b.length > max) req.destroy(); }); req.on('end', () => { try { ok(b ? JSON.parse(b) : {}); } catch (e) { err(e); } }); });
const gravarStream = (req, file) => new Promise((ok, err) => { const w = fs.createWriteStream(file); req.pipe(w); w.on('finish', ok); w.on('error', err); req.on('error', err); });
function enviarArquivo(req, res, file, tipo) {
	if (!file || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
	const tam = fs.statSync(file).size, m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
	const head = { 'Content-Type': tipo, 'Accept-Ranges': 'bytes' };
	if (m) { const a = m[1] ? +m[1] : tam - +m[2], b = m[1] && m[2] ? Math.min(+m[2], tam - 1) : tam - 1; res.writeHead(206, { ...head, 'Content-Range': `bytes ${a}-${b}/${tam}`, 'Content-Length': b - a + 1 }); return fs.createReadStream(file, { start: a, end: b }).pipe(res); }
	res.writeHead(200, { ...head, 'Content-Length': tam }); fs.createReadStream(file).pipe(res);
}
const redirecionar = (res, url) => { res.writeHead(302, { Location: url }); res.end(); };

const resumo = j => {
	const at = etapaAtual(j);
	return { id: j.id, base: base(j), tema: j.tema, formato: j.formato, status: j.status, narracao: j.narracao, origem: j.origem, criado: j.criado, publicarEm: j.publicarEm,
		canalId: j.canalId, estilo: j.estilo, loteId: j.loteId, nota: j.etapas.revisao?.nota ?? null, duracao: j.duracao,
		titulo: j.youtube.titulo, url: j.youtube.url, custo: j.custo, etapas: Object.fromEntries(ETAPAS.map(e => [e.id, j.etapas[e.id].estado])), atual: at?.id || null,
		motivo: (at && j.etapas[at.id].motivo) || '' };
};
const canalPub = c => ({ ...c, youtube: { ...c.youtube, conexao: c.youtube.conexao ? { canalYT: c.youtube.conexao.canalYT, em: c.youtube.conexao.em } : null } });
const contaPub = u => ({ ...pubUsuario(u), prefs: { ...PREFS, ...u.prefs }, avisos: u.avisos, tokenAgente: u.tokenAgente,
	google: { clientId: u.google?.clientId || '', temSecret: !!u.google?.clientSecret, usandoGlobal: !u.google?.clientId && !!cfg.google?.clientId } });

async function api(req, res, url) {
	const p = url.pathname, m = req.method, ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

	// ── Agente (token por usuário) ──
	if (p.startsWith('/api/agente/')) {
		const u = db.usuarios.find(x => req.headers['x-agente'] && x.tokenAgente === req.headers['x-agente']);
		if (!u) return json(res, { erro: 'token do agente inválido' }, 401);
		const job = id => { const j = db.jobs.find(x => x.id === id); return meuJob(j, u) ? j : null; };
		if (p === '/api/agente/pulso') {
			const b = await corpo(req); agentes[u.id] = { visto: Date.now(), nome: b.nome, ocupado: b.ocupado, local: b.local };
			const ocup = b.ocupado || {};
			for (const j of db.jobs) if (donoJob(j) === u.id) for (const [k, s] of Object.entries(j.etapas))
				if (s.estado === 'rodando' && !(ocup.jobId === j.id && ocup.etapa === k) && Date.now() - new Date(s.inicio) > 15000) { s.estado = 'erro'; s.erro = 'Interrompido (o agente parou ou reiniciou).'; s.fim = agora(); }
			for (const q of db.pesquisas) if (q.estado === 'rodando' && canal(q.canalId)?.dono === u.id && ocup.pesquisaId !== q.id && Date.now() - new Date(q.inicio) > 15000) { q.estado = 'erro'; q.erro = 'Interrompida (o agente parou).'; }
			const c = [...(cancelar[u.id] || [])]; cancelar[u.id] = new Set();
			const docs = db.pesquisas.filter(q => q.estado === 'feito' && q.relatorio && !q.docs && canal(q.canalId)?.dono === u.id).slice(-3).map(q => ({ id: q.id, relatorio: q.relatorio }));
			return json(res, { cancelar: c, docs });
		}
		if (p === '/api/agente/pegar') {
			(agentes[u.id] ||= {}).visto = Date.now();
			const x = proximaTarefa(u); if (!x) return json(res, { tarefa: null });
			const t = x.p ? montarPesquisa(x.p, u) : montarTarefa(x, u); salvar(); return json(res, { tarefa: t });
		}
		if (p === '/api/agente/prompt') {
			const b = await corpo(req), j = job(b.jobId); if (!j) return json(res, {}, 404);
			if (b.nn) { j.nn = b.nn; j.slug = b.slug; }
			for (const f of Object.values(j.arquivos)) f.sujo = false;
			salvar(); return json(res, { prompt: renderPrompt(b.promptId || b.etapa, j, { feedback: b.promptId ? '' : j.etapas[b.etapa]?.feedback, erro: b.erro }), base: base(j) });
		}
		if (p === '/api/agente/log') {
			const b = await corpo(req), alvo = b.pesquisaId ? db.pesquisas.find(q => q.id === b.pesquisaId && canal(q.canalId)?.dono === u.id) : job(b.jobId)?.etapas[b.etapa];
			if (!alvo) return json(res, {}, 404);
			alvo.log.push(...b.linhas); if (alvo.log.length > 500) alvo.log.splice(0, alvo.log.length - 500);
			salvar(); return json(res, { ok: 1 });
		}
		if (p === '/api/agente/pesquisa-docs') { // dossiê (vídeos, comentários, análise) + relatório de sugestões, lidos do computador
			const b = await corpo(req, 2e6), q = db.pesquisas.find(x => x.id === b.pesquisaId && canal(x.canalId)?.dono === u.id); if (!q) return json(res, {}, 404);
			q.docs = { dossie: String(b.dossie || '').slice(0, 80000), relatorio: String(b.relatorio || '').slice(0, 80000) }; salvar(); return json(res, { ok: 1 });
		}
		if (p === '/api/agente/fim-pesquisa') {
			const b = await corpo(req), q = db.pesquisas.find(x => x.id === b.pesquisaId && canal(x.canalId)?.dono === u.id); if (!q) return json(res, {}, 404);
			const c = canal(q.canalId); q.fim = agora(); q.custo = b.custo || 0; q.relatorio = b.relatorio || '';
			if (!b.ok) { q.estado = 'erro'; q.erro = b.erro; avisar(u.id, `A pesquisa de temas do canal ${c.nome} falhou: ${b.erro}`, { canalId: c.id, tipo: 'erro' }); }
			else {
				const novos = (b.temas || []).filter(t => t && (t.titulo || t.tema)).map(t => ({ canalId: c.id, formato: q.formato, origem: 'pesquisa', pesquisaId: q.id,
					tema: (t.titulo || t.tema).trim(), detalhe: [t.tema && `Assunto: ${t.tema}`, t.gancho && `Gancho: ${t.gancho}`, t.desenvolvimento && `Desenvolvimento: ${t.desenvolvimento}`, t.final && `Final: ${t.final}`].filter(Boolean).join(' | ') }));
				db.temas.push(...novos); q.estado = 'feito'; q.temas = novos.map(t => t.tema); q.sugestoes = (b.temas || []).slice(0, 12);
				q.videos = (b.videos || []).slice(0, 10).map(v => ({ titulo: String(v.titulo || '').slice(0, 200), canal: String(v.canal || '').slice(0, 100), url: /^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(v.url || '') ? v.url : '', views: v.views ?? null }));
				avisar(u.id, `Pesquisa concluída para ${c.nome}: ${novos.length} temas novos entraram na fila.`, { canalId: c.id });
			}
			salvar(); return json(res, { ok: 1 });
		}
		if (p === '/api/agente/fim') {
			const b = await corpo(req, 2e7), j = job(b.jobId); if (!j) return json(res, {}, 404);
			const s = j.etapas[b.etapa], c = canal(j.canalId); s.fim = agora();
			if (b.nn) { j.nn = b.nn; j.slug = b.slug; }
			if (b.tema) { j.tema = b.tema; j.slug = b.slug || slugify(b.tema); }
			for (const [k, v] of Object.entries(b.info || {})) j[k] = v;
			if (b.custo) { j.custo = +(j.custo + b.custo).toFixed(4); s.custo = +((s.custo || 0) + b.custo).toFixed(4); }
			for (const [rel, conteudo] of Object.entries(b.arquivos || {})) {
				if (j.arquivos[rel]?.sujo) continue;
				j.arquivos[rel] = { conteudo, em: agora(), sujo: false };
				if (rel.endsWith('.meta.json') && !j.youtube.editado) try { const mt = JSON.parse(conteudo); Object.assign(j.youtube, { titulo: mt.titulo || '', descricao: mt.descricao || '', tags: mt.tags || [] }); } catch { }
			}
			if (b.youtubeUrl) j.youtube.url = b.youtubeUrl;
			s.motivo = '';
			const nome = j.youtube.titulo || j.tema || 'vídeo';
			if (!b.ok) { s.estado = 'erro'; s.erro = b.erro || 'falhou'; avisar(u.id, `Erro em "${nome}" (${c.nome}), etapa ${b.etapa}: ${s.erro.slice(0, 200)}`, { jobId: j.id, canalId: c.id, tipo: 'erro' }); }
			else {
				s.estado = j.gates[b.etapa] ? 'aprovacao' : 'feito'; s.feedback = '';
				if (b.revisao) {
					s.nota = b.revisao.nota; s.problemas = b.revisao.problemas || [];
					if (!(s.nota >= c.notaMinima)) { s.estado = 'aprovacao'; s.motivo = `Nota ${s.nota} (mínimo ${c.notaMinima}): ${s.problemas.join('; ') || 'ver log'}`; }
					else if (s.problemas.length) s.motivo = `Nota ${s.nota}. Ajustes feitos: ${s.problemas.join('; ')}`;
				}
				if (b.etapa === 'narracao' && j.duracao) {
					const alvo = j.formato === 'longo' ? c.duracaoLongo : c.duracaoShort;
					s.motivo = `${j.duracao.toFixed(1)} s (alvo ${alvo} s)`;
					if (j.formato !== 'longo' && j.duracao > 70) s.motivo += ' — acima de 70 s mesmo após 3 encurtamentos automáticos';
				}
				if (s.estado === 'aprovacao') avisar(u.id, `"${nome}" (${c.nome}) está esperando sua aprovação na etapa ${ETAPAS.find(e => e.id === b.etapa).nome}.${s.motivo ? ' ' + s.motivo : ''}`, { jobId: j.id, canalId: c.id, tipo: 'aviso' });
				if (b.youtubeUrl) avisar(u.id, `Publicado em ${c.nome}: ${nome} — ${b.youtubeUrl}`, { jobId: j.id, canalId: c.id });
			}
			recalcular(j); salvar(); return json(res, { ok: 1 });
		}
		const mUp = p.match(/^\/api\/agente\/audio\/(\w+)$/);
		if (mUp) { const j = job(mUp[1]); return enviarArquivo(req, res, j?.audioUpload && path.join(UP, j.audioUpload), 'application/octet-stream'); }
		const mV = p.match(/^\/api\/agente\/video\/(\w+)$/);
		if (mV && m === 'PUT') { const j = job(mV[1]); if (!j) return json(res, {}, 404); const nome = j.id + '.mp4'; const qp = new URL(req.url, 'http://x').searchParams, pt = +(qp.get('parte') || 0), tot = +(qp.get('total') || 1), tmp = path.join(UP, j.id + '-envio.part');
			await gravarStream(req, tmp + '.p'); if (pt === 0) fs.renameSync(tmp + '.p', tmp); else { fs.appendFileSync(tmp, fs.readFileSync(tmp + '.p')); fs.unlinkSync(tmp + '.p'); }
			if (pt + 1 < tot) return json(res, { ok: 1 }); fs.renameSync(tmp, path.join(UP, nome)); j.mp4Upload = nome; salvar(); return json(res, { ok: 1 }); }
		return json(res, { erro: 'rota' }, 404);
	}

	// ── Sessão / login ──
	if (p === '/api/sessao') { const u = sessao(req); return json(res, { usuario: pubUsuario(u), precisaSetup: !db.usuarios.length }); }
	if (p === '/api/setup' && m === 'POST') {
		if (db.usuarios.length) return json(res, { erro: 'já configurado' }, 400);
		const b = await corpo(req); if (!b.login || String(b.senha || '').length < 8) return json(res, { erro: 'login e senha (mín. 8 caracteres)' }, 400);
		const u = novoUsuario({ ...b, admin: true });
		if (cfg.tokenAgente) { u.tokenAgente = cfg.tokenAgente; delete cfg.tokenAgente; }
		for (const k of Object.keys(PREFS)) if (cfg[k]) { u.prefs[k] = cfg[k]; delete cfg[k]; }
		delete cfg.senha; salvarCfg();
		for (const c of db.canais) c.dono ||= u.id; // canais antigos ficam com o 1º admin
		gravarDb(); return abrirSessao(req, res, u);
	}
	if (p === '/api/login' && m === 'POST') {
		if (bloqueado(ip)) return json(res, { erro: 'muitas tentativas; espere 10 minutos' }, 429);
		const b = await corpo(req), u = db.usuarios.find(x => x.login === String(b.login || '').trim().toLowerCase());
		if (!u || !confere(u, b.senha || '')) { (tentativas[ip] ||= []).push(Date.now()); return json(res, { erro: 'login ou senha errados' }, 401); }
		return abrirSessao(req, res, u);
	}
	if (p === '/api/logout') { res.writeHead(200, { 'Set-Cookie': 'mg=; Path=/; Max-Age=0', 'Content-Type': 'application/json' }); return res.end('{}'); }

	// Callback do Google (volta do navegador; valida pelo state assinado)
	if (p === '/api/youtube/callback') {
		const [cid, uid, sig] = (url.searchParams.get('state') || '').split('.'), u = usuario(uid), c = canal(cid);
		if (!u || !c || c.dono !== u.id || assinar(cid + '.' + uid) !== sig) return redirecionar(res, '/#erro-youtube');
		if (url.searchParams.get('error')) return redirecionar(res, '/#youtube-cancelado');
		const g = googleDe(u);
		try {
			const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({ code: url.searchParams.get('code'), client_id: g.clientId, client_secret: g.clientSecret, redirect_uri: urlBase(req) + '/api/youtube/callback', grant_type: 'authorization_code' }) }).then(r => r.json());
			if (!r.refresh_token) throw new Error(r.error_description || r.error || 'o Google não devolveu refresh_token');
			const ch = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', { headers: { Authorization: 'Bearer ' + r.access_token } }).then(r => r.json());
			const it = ch.items?.[0];
			c.youtube.conexao = { refresh: r.refresh_token, canalYT: it ? { id: it.id, titulo: it.snippet.title } : { id: '', titulo: '(canal não identificado)' }, em: agora() };
			c.youtube.ativo = true; salvar();
			avisar(u.id, `YouTube conectado ao canal ${c.nome}: ${c.youtube.conexao.canalYT.titulo}.`, { canalId: c.id });
			return redirecionar(res, '/#youtube-ok');
		} catch (e) { avisar(u.id, `Falha ao conectar o YouTube (${c.nome}): ${e.message}`, { tipo: 'erro', canalId: c.id }); return redirecionar(res, '/#erro-youtube'); }
	}

	const u = sessao(req);
	if (!u) return json(res, { erro: 'login', login: true }, 401);
	const meuCanal = id => { const c = canal(id); return c && c.dono === u.id ? c : null; };
	const job = id => { const j = db.jobs.find(x => x.id === id); return meuJob(j, u) ? j : null; };

	if (p === '/api/estado') {
		const ids = new Set(meusCanais(u).map(c => c.id)), meusJobs = db.jobs.filter(j => ids.has(j.canalId));
		const est = meusJobs.filter(j => j.status === 'ativo' && etapaAtual(j)?.id === 'publicar' && !j.publicarEm);
		const avisos = db.avisos.filter(a => a.userId === u.id).slice(-40).reverse();
		return json(res, { usuario: pubUsuario(u), agente: agenteDe(u), jobs: meusJobs.map(resumo).reverse(), regras: db.regras.filter(r => ids.has(r.canalId)), temas: db.temas.filter(t => ids.has(t.canalId)),
			pesquisas: db.pesquisas.filter(q => ids.has(q.canalId)).slice(-30).reverse().map(({ docs, ...q }) => ({ ...q, temDocs: !!docs, log: q.log.slice(-60) })),
			proximas: proximasExecucoes(u), canais: meusCanais(u).map(canalPub), estilos: db.estilos, agora: horaLocal(), avisos, naoLidos: avisos.filter(a => !a.lido).length,
			estoque: Object.fromEntries(meusCanais(u).map(c => [c.id, est.filter(j => j.canalId === c.id).length])) });
	}
	if (p === '/api/conector') { // instalador do agente (Windows) com o token desta pessoa
		const nome = String(u.nome || u.login).replace(/[^\p{L}\p{N} ._-]/gu, '') || u.login;
		const cmd = fs.readFileSync(path.join(DIR, 'conector.cmd.txt'), 'utf8').replace('{{PAINEL}}', urlBase(req)).replace('{{TOKEN}}', u.tokenAgente).replace('{{NOME}}', nome);
		res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Disposition': 'attachment; filename="Conectar-Estudio.cmd"', 'Cache-Control': 'no-store' });
		return res.end(cmd.replace(/\r?\n/g, '\r\n'));
	}
	if (p === '/api/avisos/lidos' && m === 'POST') { for (const a of db.avisos) if (a.userId === u.id) a.lido = true; salvar(); return json(res, { ok: 1 }); }
	if (p === '/api/avisos/teste' && m === 'POST') { avisar(u.id, 'Teste de aviso: se chegou no Telegram/webhook, está funcionando.'); return json(res, { ok: 1 }); }

	// Conta do usuário
	if (p === '/api/eu' && m === 'GET') return json(res, { ...contaPub(u), etapas: ETAPAS, gatesIds: GATES, promptsPadrao: PROMPTS, prompts: cfg.prompts, fuso: cfg.fuso, urlPublica: cfg.urlPublica, googleGlobal: !!cfg.google?.clientId, redirect: urlBase(req) + '/api/youtube/callback' });
	if (p === '/api/eu' && m === 'PATCH') {
		const b = await corpo(req);
		if (b.nome) u.nome = b.nome;
		if (b.novaSenha) { if (!confere(u, b.senhaAtual || '')) return json(res, { erro: 'senha atual errada' }, 400); if (b.novaSenha.length < 8) return json(res, { erro: 'senha nova: mínimo 8 caracteres' }, 400); Object.assign(u, hashSenha(b.novaSenha)); }
		if (b.prefs) for (const k of Object.keys(PREFS)) if (k in b.prefs) u.prefs[k] = b.prefs[k];
		if (b.avisos) Object.assign(u.avisos, b.avisos);
		if (b.google) { u.google.clientId = (b.google.clientId || '').trim(); if (b.google.clientSecret) u.google.clientSecret = b.google.clientSecret.trim(); if (!u.google.clientId) u.google.clientSecret = ''; }
		if (b.novoToken) u.tokenAgente = crypto.randomBytes(24).toString('base64url');
		gravarDb(); return json(res, contaPub(u));
	}
	// Admin: usuários e configuração global
	if (p.startsWith('/api/usuarios') || p === '/api/global') {
		if (!u.admin) return json(res, { erro: 'só administrador' }, 403);
		if (p === '/api/global' && m === 'PATCH') {
			const b = await corpo(req);
			for (const k of ['fuso', 'urlPublica', 'prompts']) if (k in b) cfg[k] = b[k];
			if (b.google) { cfg.google.clientId = (b.google.clientId || '').trim(); if (b.google.clientSecret) cfg.google.clientSecret = b.google.clientSecret.trim(); }
			salvarCfg(); return json(res, { ok: 1 });
		}
		if (p === '/api/usuarios' && m === 'GET') return json(res, db.usuarios.map(x => ({ ...pubUsuario(x), canais: meusCanais(x).length, agente: agenteDe(x).online })));
		if (p === '/api/usuarios' && m === 'POST') {
			const b = await corpo(req), login = String(b.login || '').trim().toLowerCase();
			if (!login || String(b.senha || '').length < 8) return json(res, { erro: 'login e senha (mín. 8 caracteres)' }, 400);
			if (db.usuarios.some(x => x.login === login)) return json(res, { erro: 'login já existe' }, 400);
			const n = novoUsuario({ login, senha: b.senha, nome: b.nome, admin: b.admin }); gravarDb(); return json(res, pubUsuario(n));
		}
		const mu = p.match(/^\/api\/usuarios\/(\w+)$/), alvo = mu && usuario(mu[1]); if (!alvo) return json(res, {}, 404);
		if (m === 'PATCH') { const b = await corpo(req); if (b.senha) { if (b.senha.length < 8) return json(res, { erro: 'mínimo 8 caracteres' }, 400); Object.assign(alvo, hashSenha(b.senha)); } if ('admin' in b && alvo.id !== u.id) alvo.admin = !!b.admin; if (b.nome) alvo.nome = b.nome; gravarDb(); return json(res, pubUsuario(alvo)); }
		if (m === 'DELETE') { if (alvo.id === u.id) return json(res, { erro: 'não dá para apagar a si mesmo' }, 400); if (meusCanais(alvo).length) return json(res, { erro: 'o usuário ainda tem canais' }, 400); db.usuarios = db.usuarios.filter(x => x !== alvo); gravarDb(); return json(res, { ok: 1 }); }
	}

	// YouTube: iniciar conexão / desconectar
	if (p === '/api/youtube/conectar') {
		const c = meuCanal(url.searchParams.get('canal')), g = googleDe(u);
		if (!c) return json(res, { erro: 'canal' }, 404);
		if (!g.clientId) return redirecionar(res, '/#youtube-sem-cliente');
		const q = new URLSearchParams({ client_id: g.clientId, redirect_uri: urlBase(req) + '/api/youtube/callback', response_type: 'code', access_type: 'offline', prompt: 'consent select_account',
			scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly', state: `${c.id}.${u.id}.${assinar(c.id + '.' + u.id)}` });
		return redirecionar(res, 'https://accounts.google.com/o/oauth2/v2/auth?' + q);
	}
	if (p === '/api/youtube/desconectar' && m === 'POST') { const b = await corpo(req), c = meuCanal(b.canalId); if (!c) return json(res, {}, 404); c.youtube.conexao = null; c.youtube.ativo = false; salvar(); return json(res, { ok: 1 }); }

	// Canais
	if (p === '/api/canais' && m === 'POST') {
		const b = await corpo(req); delete b.youtube; delete b.dono;
		const c = { id: slugify(b.nome).slice(0, 24) + '-' + crypto.randomBytes(2).toString('hex'), ...canalPadrao(), ...b, principal: false, dono: u.id };
		c.youtube.token = `tokens/${c.id}.json`; db.canais.push(c); salvar(); return json(res, canalPub(c));
	}
	const mc = p.match(/^\/api\/canais\/([\w-]+)(\/pesquisar)?$/);
	if (mc) {
		const c = meuCanal(mc[1]); if (!c) return json(res, {}, 404);
		if (mc[2]) { const q = pedirPesquisa(c, 'pedida manualmente'); salvar(); return q ? json(res, q) : json(res, { erro: 'já existe uma pesquisa na fila para este canal' }, 400); }
		if (m === 'PATCH') {
			const b = await corpo(req); delete b.id; delete b.principal; delete b.dono;
			if (b.youtube) { const cx = c.youtube.conexao; Object.assign(c.youtube, b.youtube); c.youtube.conexao = cx; delete b.youtube; }
			if (b.piloto) { Object.assign(c.piloto, b.piloto); delete b.piloto; }
			Object.assign(c, b); salvar(); return json(res, canalPub(c));
		}
		if (m === 'DELETE') {
			if (c.principal) return json(res, { erro: 'o canal principal não pode ser apagado' }, 400);
			if (db.jobs.some(j => j.canalId === c.id && j.status === 'ativo')) return json(res, { erro: 'o canal tem vídeos em produção' }, 400);
			db.canais = db.canais.filter(x => x !== c); db.regras = db.regras.filter(r => r.canalId !== c.id); db.temas = db.temas.filter(t => t.canalId !== c.id); salvar(); return json(res, { ok: 1 });
		}
	}
	const mq = p.match(/^\/api\/pesquisas\/(\w+)$/);
	if (mq && m === 'GET') { const q = db.pesquisas.find(x => x.id === mq[1] && meuCanal(x.canalId)); return q ? json(res, q) : json(res, {}, 404); }
	if (mq && m === 'DELETE') { const q = db.pesquisas.find(x => x.id === mq[1] && meuCanal(x.canalId)); if (!q) return json(res, {}, 404); if (q.estado === 'rodando') (cancelar[u.id] ||= new Set()).add(q.id); db.pesquisas = db.pesquisas.filter(x => x !== q); salvar(); return json(res, { ok: 1 }); }

	// Estilos (compartilhados entre usuários)
	if (p === '/api/estilos' && m === 'POST') { const b = await corpo(req); const e = { id: slugify(b.nome).slice(0, 20) + '-' + crypto.randomBytes(2).toString('hex'), cor: '#8b7cff', ativo: true, referencia: '', desc: '', guia: '', ...b }; db.estilos.push(e); salvar(); return json(res, e); }
	const me = p.match(/^\/api\/estilos\/([\w-]+)$/);
	if (me) {
		const e = estilo(me[1]); if (!e) return json(res, {}, 404);
		if (m === 'PATCH') { const b = await corpo(req); delete b.id; Object.assign(e, b); salvar(); return json(res, e); }
		if (m === 'DELETE') { db.estilos = db.estilos.filter(x => x !== e); for (const c of db.canais) c.estilos = c.estilos.filter(x => x !== e.id); salvar(); return json(res, { ok: 1 }); }
	}

	if ((p === '/api/lote' || p === '/api/jobs') && m === 'POST') { const b = await corpo(req); if (!meuCanal(b.canalId)) return json(res, { erro: 'canal' }, 400); return json(res, { ids: criarLote(b) }); }

	const mj = p.match(/^\/api\/jobs\/(\w+)(\/[\w-]+)?$/);
	if (mj) {
		const j = job(mj[1]), sub = mj[2]; if (!j) return json(res, { erro: 'não existe' }, 404);
		if (!sub && m === 'GET') return json(res, { ...j, base: base(j), atual: etapaAtual(j)?.id, temVideo: !!(j.mp4Upload || (j.mp4Local && fs.existsSync(path.join(PROJETO, j.mp4Local)))), temVoz: !!(j.audioUpload || (j.audioLocal && fs.existsSync(path.join(PROJETO, j.audioLocal)))) });
		if (!sub && m === 'DELETE') { db.jobs = db.jobs.filter(x => x !== j); cancelarJob(j); salvar(); return json(res, { ok: 1 }); }
		if (!sub && m === 'PATCH') {
			const b = await corpo(req);
			for (const k of ['instrucoes', 'gates', 'narracao', 'publicarEm', 'estilo']) if (k in b) j[k] = b[k];
			if ('tema' in b && !j.nn) { j.tema = b.tema; j.slug = slugify(b.tema); }
			if (b.youtube) { Object.assign(j.youtube, b.youtube); j.youtube.editado = true; }
			if (b.status && ['ativo', 'pausado', 'cancelado'].includes(b.status)) { j.status = b.status; if (b.status !== 'ativo') cancelarJob(j); }
			recalcular(j); salvar(); return json(res, { ok: 1 });
		}
		if (sub === '/acao') {
			const b = await corpo(req), s = j.etapas[b.etapa], idx = ETAPAS.findIndex(e => e.id === b.etapa);
			if (b.acao === 'aprovar' && s) { s.estado = 'feito'; s.motivo = ''; }
			if (b.acao === 'pular' && s) { if (s.estado === 'rodando') cancelarJob(j); s.estado = 'pulado'; }
			if (b.acao === 'refazer' && s) {
				if (j.status !== 'ativo') j.status = 'ativo';
				if (s.estado === 'rodando') cancelarJob(j);
				s.feedback = b.feedback || ''; s.estado = 'pendente'; s.erro = ''; s.motivo = '';
				if (b.etapa === 'tema') j.tema = '';
				for (const e of ETAPAS.slice(idx + 1)) if (j.etapas[e.id].estado !== 'pulado') { j.etapas[e.id].estado = 'pendente'; j.etapas[e.id].motivo = ''; }
				j.youtube.url = '';
			}
			if (b.acao === 'parar') { cancelarJob(j); if (s?.estado === 'rodando') { s.estado = 'erro'; s.erro = 'Parado pelo autor.'; } }
			if (b.acao === 'publicar-agora') j.publicarEm = agora();
			if (b.acao === 'marcar-publicado') { j.etapas.publicar.estado = 'feito'; if (b.url) j.youtube.url = b.url; }
			recalcular(j); salvar(); return json(res, { ok: 1 });
		}
		if (sub === '/arquivo' && m === 'PUT') { const b = await corpo(req); j.arquivos[b.caminho] = { conteudo: b.conteudo, em: agora(), sujo: true }; salvar(); return json(res, { ok: 1 }); }
		if (sub === '/audio' && m === 'POST') {
			const ext = (path.extname(url.searchParams.get('nome') || '.mp3') || '.mp3').toLowerCase();
			if (!['.mp3', '.wav', '.m4a', '.ogg', '.mp4', '.mov', '.webm'].includes(ext)) return json(res, { erro: 'formato' }, 400);
			const nome = j.id + '-voz' + ext; await gravarStream(req, path.join(UP, nome)); j.audioUpload = nome; j.narracao = 'autor';
			if (['aguardando', 'erro', 'feito', 'aprovacao'].includes(j.etapas.narracao.estado)) {
				j.etapas.narracao.estado = 'pendente'; const i = ETAPAS.findIndex(e => e.id === 'narracao');
				for (const e of ETAPAS.slice(i + 1)) j.etapas[e.id].estado = 'pendente';
			}
			if (j.status === 'cancelado') j.status = 'ativo'; recalcular(j); salvar(); return json(res, { ok: 1 });
		}
		if (sub === '/video') return enviarArquivo(req, res, j.mp4Upload ? path.join(UP, j.mp4Upload) : j.mp4Local && path.join(PROJETO, j.mp4Local), 'video/mp4');
		if (sub === '/voz') return enviarArquivo(req, res, j.audioUpload ? path.join(UP, j.audioUpload) : j.audioLocal && path.join(PROJETO, j.audioLocal), 'audio/mpeg');
	}

	if (p === '/api/regras' && m === 'POST') { const b = await corpo(req); const r = { id: novoId('r'), ativo: true, historico: [], ...limparRegra(b, u) }; if (!r.canalId) return json(res, { erro: 'canal' }, 400); naoRetroagir(r); db.regras.push(r); salvar(); return json(res, r); }
	const mr = p.match(/^\/api\/regras\/(\w+)(\/rodar)?$/);
	if (mr) {
		const r = db.regras.find(x => x.id === mr[1] && meuCanal(x.canalId)); if (!r) return json(res, {}, 404);
		if (mr[2]) { executarRegra(r); salvar(); return json(res, { ok: 1 }); }
		if (m === 'DELETE') { db.regras = db.regras.filter(x => x !== r); salvar(); return json(res, { ok: 1 }); }
		if (m === 'PATCH') { const b = await corpo(req); Object.assign(r, limparRegra({ ...r, ...b }, u)); if ('ativo' in b) r.ativo = !!b.ativo; if (b.hora) { r.ultima = null; naoRetroagir(r); } salvar(); return json(res, r); }
	}
	if (p === '/api/temas' && m === 'PUT') {
		const b = await corpo(req), c = meuCanal(b.canalId); if (!c) return json(res, {}, 404);
		const antigos = db.temas.filter(t => t.canalId === c.id);
		db.temas = [...db.temas.filter(t => t.canalId !== c.id), ...(b.temas || []).filter(t => t.tema && t.tema.trim()).map(t => ({ ...(antigos.find(a => a.tema === t.tema.trim()) || {}), ...t, tema: t.tema.trim(), canalId: c.id }))];
		salvar(); return json(res, { ok: 1 });
	}
	return json(res, { erro: 'rota' }, 404);
}

const WEB = path.join(DIR, 'web');
const servidor = http.createServer(async (req, res) => {
	const url = new URL(req.url, 'http://x');
	res.setHeader('X-Frame-Options', 'DENY'); res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'same-origin');
	try {
		if (url.pathname.startsWith('/api/')) return await api(req, res, url);
		const f = path.join(WEB, url.pathname === '/' ? 'index.html' : path.normalize(url.pathname));
		if (!f.startsWith(WEB) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
		res.writeHead(200, { 'Content-Type': { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' }[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
		fs.createReadStream(f).pipe(res);
	} catch (e) { console.error(e); if (!res.headersSent) json(res, { erro: e.message }, 500); else res.end(); }
});

servidor.listen(PORTA, HOST, () => {
	salvarCfg();
	console.log(`Painel: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORTA}${cfg.urlPublica ? ' (público: ' + cfg.urlPublica + ')' : ''}${db.usuarios.length ? '' : ' — abra no navegador para criar o administrador'}`);
	setInterval(rodarAgenda, 15000); rodarAgenda();
	if (!SEM_AGENTE) require('./agente.cjs').iniciar({ painel: `http://127.0.0.1:${PORTA}`, token: () => db.usuarios.find(x => x.admin)?.tokenAgente });
});
const sair = () => { gravarDb(); process.exit(0); };
process.on('SIGINT', sair); process.on('SIGTERM', sair);
