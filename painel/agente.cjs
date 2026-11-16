// Agente local: pega tarefas do painel e executa NESTE computador (Claude Code, three.js, ffmpeg, YouTube).
// Conexão só de saída (HTTP), então funciona com o painel num servidor na internet, sem abrir portas aqui.
// Uso:  node painel/agente.cjs --painel https://meu-painel.com --token <seu token (Conta → Agente)>
//       (com o painel local isso é automático: o servidor já liga o agente)
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), http = require('http'), https = require('https');
const { spawn } = require('child_process');

const PROJETO = path.resolve(__dirname, '..');
const NODE = process.execPath;
const EXT_TEXTO = ['.md', '.json', '.txt'];

// Servidor só deste computador (127.0.0.1) para o painel tocar os MP4 de renders/ sem enviá-los à hospedagem.
const PORTA_VIDEO = 5199;
function servirVideos() {
	const RENDERS = path.join(PROJETO, 'renders');
	const srv = http.createServer((q, r) => {
		r.setHeader('Access-Control-Allow-Origin', '*'); r.setHeader('Access-Control-Allow-Private-Network', 'true');
		if (q.method === 'OPTIONS') { r.writeHead(204, { 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, HEAD' }); return r.end(); }
		const m1 = q.url.split('?')[0].match(/^\/(video|audio)\/([^/]+\.(mp4|mp3|wav|m4a))$/i) || [];
		const nomeArq = m1[2] ? path.basename(decodeURIComponent(m1[2])) : '';
		const f = nomeArq && path.join(m1[1] === 'audio' ? path.join(PROJETO, 'audio') : RENDERS, nomeArq);
		if (!f || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
		const tipo = { mp4: 'video/mp4', mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4' }[m1[3].toLowerCase()], tam = fs.statSync(f).size, m = /bytes=(\d*)-(\d*)/.exec(q.headers.range || '');
		if (m) {
			const ini = m[1] ? +m[1] : tam - +m[2], fim = m[1] && m[2] ? Math.min(+m[2], tam - 1) : tam - 1;
			r.writeHead(206, { 'Content-Type': tipo, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${ini}-${fim}/${tam}`, 'Content-Length': fim - ini + 1 });
			return q.method === 'HEAD' ? r.end() : fs.createReadStream(f, { start: ini, end: fim }).pipe(r);
		}
		r.writeHead(200, { 'Content-Type': tipo, 'Accept-Ranges': 'bytes', 'Content-Length': tam });
		q.method === 'HEAD' ? r.end() : fs.createReadStream(f).pipe(r);
	});
	srv.on('error', e => console.log('[agente] vídeos locais indisponíveis (porta ' + PORTA_VIDEO + '):', e.code));
	srv.listen(PORTA_VIDEO, '127.0.0.1');
}

function iniciar({ painel, token, nome = os.hostname() }) {
	servirVideos();
	painel = painel.replace(/\/$/, '');
	const local = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(painel);
	let ocupado = null, filho = null, cancelado = false, buffer = [];

	const req = (metodo, rota, dados, { raw = false, stream = null } = {}) => new Promise((ok, erro) => {
		const u = new URL(painel + rota), lib = u.protocol === 'https:' ? https : http;
		// Content-Length sempre definido: hospedagens com ModSecurity recusam corpo "chunked" (HTTP 406).
		const corpoJson = !stream && dados ? Buffer.from(JSON.stringify(dados)) : null;
		const r = lib.request(u, { method: metodo, headers: { 'x-agente': (typeof token === 'function' ? token() : token) || '', 'User-Agent': 'EstudioAgente/1.0', 'Accept': 'application/json',
			...(stream ? { 'Content-Type': 'application/octet-stream', 'Content-Length': stream.size } : { 'Content-Type': 'application/json', 'Content-Length': corpoJson ? corpoJson.length : 0 }) }, timeout: 0 }, res => {
			if (raw) { if (res.statusCode !== 200) return erro(new Error('HTTP ' + res.statusCode)); return ok(res); }
			let b = ''; res.on('data', c => b += c); res.on('end', () => { if (res.statusCode >= 400) return erro(new Error(`${rota}: HTTP ${res.statusCode} ${b.slice(0, 200)}`)); try { ok(JSON.parse(b || '{}')); } catch (e) { erro(e); } });
		});
		r.on('error', erro);
		if (stream) fs.createReadStream(stream.file, stream.start != null ? { start: stream.start, end: stream.start + stream.size - 1 } : {}).pipe(r); else { if (corpoJson) r.write(corpoJson); r.end(); }
	});

	// ── Log em lotes ──
	const log = (...l) => { const s = l.join(' '); buffer.push(s.length > 400 ? s.slice(0, 400) + '…' : s); };
	setInterval(() => { if (!ocupado || !buffer.length) return; const linhas = buffer.splice(0); req('POST', '/api/agente/log', { jobId: ocupado.jobId, etapa: ocupado.etapa, pesquisaId: ocupado.pesquisaId, linhas }).catch(() => { }); }, 1500);

	// ── Pulso / cancelamento ──
	setInterval(async () => {
		try {
			const r = await req('POST', '/api/agente/pulso', { nome, ocupado: ocupado && { jobId: ocupado.jobId, etapa: ocupado.etapa, pesquisaId: ocupado.pesquisaId }, local, versao: 1 });
			if (ocupado && (r.cancelar.includes(ocupado.jobId) || r.cancelar.includes(ocupado.pesquisaId))) { cancelado = true; matar(); }
			for (const d of r.docs || []) enviarDocsPesquisa(d.id, d.relatorio);
		} catch { }
	}, 5000);

	const matar = () => { if (!filho) return; if (process.platform === 'win32') spawn('taskkill', ['/pid', String(filho.pid), '/T', '/F']); else filho.kill('SIGTERM'); };

	// ── Executar processo com log ao vivo ──
	function rodar(cmd, argv, { entrada, shell = false, aoLinha, timeoutMin = 120, envExtra = {} } = {}) {
		return new Promise((ok, erro) => {
			if (cancelado) return erro(new Error('cancelado'));
			const env = { ...process.env, ...envExtra }; delete env.CLAUDECODE; delete env.CLAUDE_CODE_ENTRYPOINT;
			const p = filho = spawn(cmd, argv, { cwd: PROJETO, shell, env, windowsHide: true });
			let saida = '', resto = '';
			const linha = l => { if (!l.trim()) return; saida += l + '\n'; if (saida.length > 2e6) saida = saida.slice(-1e6); aoLinha ? aoLinha(l) : log(l); };
			const ler = c => { resto += c; const ls = resto.split(/\r?\n/); resto = ls.pop(); ls.forEach(linha); };
			p.stdout.setEncoding('utf8').on('data', ler); p.stderr.setEncoding('utf8').on('data', ler);
			const t = setTimeout(() => { log('⏱ tempo esgotado'); matar(); }, timeoutMin * 60000);
			if (entrada != null) { p.stdin.write(entrada); } p.stdin.end();
			p.on('error', e => { clearTimeout(t); filho = null; erro(e); });
			p.on('close', code => { clearTimeout(t); filho = null; if (resto) linha(resto); if (cancelado) return erro(new Error('cancelado')); code === 0 ? ok(saida) : erro(Object.assign(new Error(`saiu com código ${code}`), { saida })); });
		});
	}

	// ── Claude Code em modo headless ──
	async function claude(prompt, t) {
		const q = s => process.platform === 'win32' ? `"${String(s).replace(/"/g, '\\"')}"` : `'${String(s).replace(/'/g, `'\\''`)}'`;
		const c = t.claude || {};
		const argv = ['-p', '--output-format', 'stream-json', '--verbose', '--permission-mode', c.permissao || 'acceptEdits'];
		if (c.ferramentas) argv.push('--allowedTools', c.ferramentas);
		if (c.modelo) argv.push('--model', c.modelo);
		if (c.esforco) argv.push('--effort', c.esforco);
		let resultado = '', custo = 0, falhou = false;
		log('▶ Claude:', prompt.split('\n')[0].slice(0, 160));
		await rodar('claude', argv.map(q), {
			entrada: prompt, shell: true, timeoutMin: 150, aoLinha: l => {
				let m; try { m = JSON.parse(l); } catch { return log(l); }
				if (m.type === 'assistant') for (const c of m.message?.content || []) {
					if (c.type === 'text' && c.text.trim()) log('💬', c.text.trim().replace(/\s+/g, ' '));
					if (c.type === 'tool_use') { const i = c.input || {}; log('▸', c.name + ':', String(i.command || i.file_path || i.pattern || i.skill || i.description || '').replace(/\s+/g, ' ').slice(0, 180)); }
				}
				if (m.type === 'result') { resultado = m.result || ''; custo = m.total_cost_usd || 0; falhou = !!m.is_error; log(`■ fim (${Math.round((m.duration_ms || 0) / 1000)} s${custo ? `, US$ ${custo.toFixed(2)}` : ''})`); }
			},
		});
		if (falhou) throw new Error('Claude terminou com erro: ' + resultado.slice(0, 300));
		return { resultado, custo };
	}

	// ── Utilidades do projeto ──
	function proximoNN(reservados) {
		let max = 0;
		for (const d of ['demos', 'roteiros', 'audio', 'renders']) for (const f of fs.existsSync(path.join(PROJETO, d)) ? fs.readdirSync(path.join(PROJETO, d)) : []) { const m = /^(\d+)-/.exec(f); if (m) max = Math.max(max, +m[1]); }
		return Math.max(max, ...reservados, 0) + 1;
	}
	function coletar(base) {
		const out = {}, add = rel => { const f = path.join(PROJETO, rel); if (fs.existsSync(f) && fs.statSync(f).size < 800000) out[rel] = fs.readFileSync(f, 'utf8'); };
		const rd = path.join(PROJETO, 'roteiros');
		if (fs.existsSync(rd)) for (const f of fs.readdirSync(rd)) if (f.startsWith(base) && EXT_TEXTO.includes(path.extname(f))) add('roteiros/' + f);
		add(`demos/${base}/trilha.json`);
		return out;
	}
	function servidorLocal() {
		return new Promise(ok => {
			http.get('http://127.0.0.1:5173/', r => { r.resume(); ok(true); }).on('error', () => {
				log('Ligando o servidor local (tools/serve.js 5173)…');
				spawn(NODE, [path.join(PROJETO, 'tools/serve.js'), '5173'], { cwd: PROJETO, detached: true, stdio: 'ignore', windowsHide: true }).unref();
				setTimeout(() => ok(true), 1500);
			});
		});
	}
	const baixar = (rota, destino) => req('GET', rota, null, { raw: true }).then(res => new Promise((ok, erro) => { const w = fs.createWriteStream(destino); res.pipe(w); w.on('finish', ok); w.on('error', erro); }));

	// ── Executar uma tarefa ──
	async function executar(t) {
		const fim = { jobId: t.jobId, etapa: t.etapa, ok: true, arquivos: {}, info: {}, custo: 0 };
		try {
			if (t.etapa === 'tema') {
				const r = await claude(t.prompt, t); fim.custo = r.custo;
				const m = r.resultado.match(/\{[^{}]*"tema"[^{}]*\}/);
				if (!m) throw new Error('Não veio JSON de tema: ' + r.resultado.slice(0, 200));
				const j = JSON.parse(m[0]); fim.tema = j.tema; fim.slug = (j.slug || '').replace(/[^a-z0-9-]/g, '').slice(0, 40);
				log('Tema:', j.tema); return fim;
			}
			// Número do vídeo (NN) decidido aqui, olhando as pastas desta máquina.
			const nn = t.nn || proximoNN(t.reservados); const slug = t.slug;
			fim.nn = nn; fim.slug = slug;
			const base = `${String(nn).padStart(2, '0')}-${slug}`;
			for (const [rel, conteudo] of Object.entries(t.arquivos || {})) { const f = path.join(PROJETO, rel); if (!f.startsWith(PROJETO)) continue; fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, conteudo); log('✎ sua edição gravada em', rel); }
			const pr = await req('POST', '/api/agente/prompt', { jobId: t.jobId, etapa: t.etapa, nn, slug });
			fs.mkdirSync(path.join(PROJETO, 'demos', base), { recursive: true });

			if (t.etapa === 'narracao') {
				let audio = `audio/${base}.mp3`;
				if (t.modo === 'tts') { log('Gerando voz sintética (' + t.voz + ' ' + t.velocidade + ')…'); await rodar(NODE, ['tools/tts.cjs', `roteiros/${base}.md`, audio, `demos/${base}`, '--voz', t.voz || 'pt-BR-AntonioNeural', '--vel', t.velocidade || '+22%']); }
				else {
					if (!t.audioUpload) throw new Error('Falta o arquivo da narração.');
					const ext = t.audioUpload, tmp = path.join(os.tmpdir(), `mg-voz-${t.jobId}${ext}`);
					log('Baixando a narração…'); await baixar('/api/agente/audio/' + t.jobId, tmp);
					if (['.mp3', '.wav'].includes(ext)) { audio = `audio/${base}${ext}`; fs.copyFileSync(tmp, path.join(PROJETO, audio)); }
					else await rodar('ffmpeg', ['-v', 'error', '-y', '-i', tmp, '-vn', '-ac', '1', '-b:a', '192k', path.join(PROJETO, audio)]);
					fs.rmSync(tmp, { force: true });
				}
				if (!fs.existsSync(path.join(PROJETO, audio))) throw new Error('Não achei ' + audio);
				fim.info.audioLocal = audio;
				if (!local && t.modo === 'tts') { const f = path.join(PROJETO, audio); log('Enviando a narração ao painel…'); try { await req('PUT', '/api/agente/voz/' + t.jobId, null, { stream: { file: f, size: fs.statSync(f).size } }); } catch (e) { log('Aviso: não enviei a narração:', e.message); } }
				if (t.modo !== 'tts') { log('Transcrevendo…'); await rodar(NODE, ['tools/transcrever.cjs', audio, `demos/${base}/fala.json`]); }
				const medir = async () => { try { fim.info.duracao = +(await rodar('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(PROJETO, audio)], { aoLinha: () => { } })).trim(); log('Duração:', fim.info.duracao.toFixed(1), 's'); } catch { } };
				await medir();
				// Regra do autor: até 70 s está aprovado; passou disso, encurta o texto e refaz a voz sozinho.
				const LIMITE = 70;
				for (let i = 1; t.modo === 'tts' && t.formato !== 'longo' && fim.info.duracao > LIMITE && i <= 3 && !cancelado; i++) {
					const alvoPal = Math.round(60 * 2.8);
					log(`Passou de ${LIMITE} s — encurtando o texto (tentativa ${i}/3)…`);
					const r = await claude(`Edite o arquivo roteiros/${base}.md: o texto narrado ficou com ${fim.info.duracao.toFixed(1)} s de voz e o limite é ${LIMITE} s. ` +
						`Encurte SÓ o texto narrado para no máximo ~${alvoPal} palavras (≈ 60 s), cortando repetições e frases menos fortes. Mantenha o gancho da 1ª frase, a virada, o payoff e o CTA, o mesmo formato/seções do arquivo e o tom. Não mexa em mais nada.`, t);
					fim.custo += r.custo || 0;
					log('Refazendo a voz…');
					await rodar(NODE, ['tools/tts.cjs', `roteiros/${base}.md`, audio, `demos/${base}`, '--voz', t.voz || 'pt-BR-AntonioNeural', '--vel', t.velocidade || '+22%']);
					if (!local) { const f = path.join(PROJETO, audio); try { await req('PUT', '/api/agente/voz/' + t.jobId, null, { stream: { file: f, size: fs.statSync(f).size } }); } catch (e) { log('Aviso: não enviei a narração:', e.message); } }
					await medir();
				}
			}
			else if (t.tipo === 'claude') {
				const r = await claude(pr.prompt, t); fim.custo += r.custo;
				if (t.etapa === 'animacao') fim.info.demo = `demos/${base}`;
				if (t.etapa === 'thumbs') {
					const prontas = [1, 2, 3].map(n => `renders/${base}-thumb-${n}.jpg`).filter(f => fs.existsSync(path.join(PROJETO, f)));
					if (prontas.length < 2) throw new Error('Esperava 3 thumbnails em renders/' + base + '-thumb-N.jpg; achei ' + prontas.length + '.');
					if (!local) for (const [k, f] of prontas.entries()) { const arq = path.join(PROJETO, f); log('Enviando', f, '…'); await req('PUT', `/api/agente/thumb/${t.jobId}/${k + 1}`, null, { stream: { file: arq, size: fs.statSync(arq).size } }); }
				}
				if (t.etapa === 'revisao') { const m = r.resultado.match(/\{[^{}]*"nota"[^{}]*\}/); if (!m) throw new Error('Revisão sem JSON de nota: ' + r.resultado.slice(0, 200)); fim.revisao = JSON.parse(m[0]); log('Nota:', fim.revisao.nota, (fim.revisao.problemas || []).join(' | ')); }
			}
			else if (t.etapa === 'exportar') {
				await servidorLocal();
				const voz = t.audio || ['mp3', 'wav'].map(e => `audio/${base}.${e}`).find(f => fs.existsSync(path.join(PROJETO, f)));
				if (!voz) throw new Error('Narração não encontrada em audio/.');
				for (let tentativa = 0; ; tentativa++) {
					try { log('Conferindo (check.js)…'); await rodar(NODE, ['tools/check.js', `demos/${base}`]); break; }
					catch (e) {
						if (cancelado || tentativa >= 2) throw new Error('check.js com erro: ' + (e.saida || e.message).slice(-600));
						log('Check falhou — pedindo correção ao Claude…');
						const p2 = await req('POST', '/api/agente/prompt', { jobId: t.jobId, etapa: t.etapa, promptId: 'corrigir', erro: (e.saida || '').slice(-3000) });
						fim.custo += (await claude(p2.prompt, t)).custo;
					}
				}
				const mp4 = `renders/${base}.mp4`;
				log('Gerando MP4 (voz + SFX + trilha)…'); await rodar(NODE, ['tools/final.cjs', `demos/${base}`, '--voz', voz, mp4], { timeoutMin: 240 });
				fim.info.mp4Local = mp4; fim.info.demo = `demos/${base}`;
				log('MP4 salvo neste computador: ' + mp4 + ' (o painel toca direto daqui enquanto o conector estiver aberto).');
			}
			else if (t.etapa === 'publicar') {
				const y = t.youtube || {}, mp4 = y.mp4 || `renders/${base}.mp4`;
				if (!fs.existsSync(path.join(PROJETO, mp4))) throw new Error('MP4 não está nesta máquina: ' + mp4);
				let titulo = (y.titulo || t.tema).slice(0, 100), desc = y.descricao || '';
				if (t.formato === 'short' && !/#shorts/i.test(titulo + desc)) desc += '\n\n#shorts';
				if (y.tags?.length) desc += '\n' + y.tags.map(x => '#' + x.replace(/\s+/g, '')).slice(0, 8).join(' ');
				const out = await rodar(NODE, ['tools/youtube-upload.cjs', mp4, titulo, desc, y.privacidade || 'private'], { envExtra: { YT_TOKEN: y.token || 'token.json', YT_TAGS: (y.tags || []).join(','), ...(y.credenciais ? { YT_CLIENT_ID: y.credenciais.client_id, YT_CLIENT_SECRET: y.credenciais.client_secret, YT_REFRESH: y.credenciais.refresh_token } : {}) } });
				const u = out.match(/https:\/\/youtu\.be\/[\w-]+/); if (u) fim.youtubeUrl = u[0];
			}
			fim.arquivos = coletar(base);
		} catch (e) { fim.ok = false; fim.erro = cancelado ? 'Parado pelo autor.' : e.message; log('✖', fim.erro); }
		return fim;
	}

	// Manda ao painel o dossiê (vídeos, comentários, análise) e o relatório de sugestões de uma pesquisa (aba Pesquisas)
	async function enviarDocsPesquisa(id, rel) {
		const ler = f => { try { const a = path.resolve(PROJETO, f); return a.startsWith(path.join(PROJETO, 'roteiros')) ? fs.readFileSync(a, 'utf8') : ''; } catch { return ''; } };
		const relatorio = ler(rel), dossie = ler(rel.replace(/\.md$/, '-dossie.md'));
		await req('POST', '/api/agente/pesquisa-docs', { pesquisaId: id, relatorio: relatorio || '(arquivo do relatório não encontrado neste computador)', dossie }).catch(() => { });
	}

	// Pesquisa de temas (skill pesquisa-roteiro) → 10 sugestões em JSON
	async function pesquisar(t) {
		const fim = { pesquisaId: t.pesquisaId, ok: true, temas: [], custo: 0 };
		try {
			const r = await claude(t.prompt, t); fim.custo = r.custo;
			const txt = r.resultado, i = txt.lastIndexOf('{"relatorio"') >= 0 ? txt.lastIndexOf('{"relatorio"') : txt.indexOf('{"temas"');
			let j = null;
			for (let k = txt.lastIndexOf('}'); i >= 0 && k > i && !j; k = txt.lastIndexOf('}', k - 1)) { try { j = JSON.parse(txt.slice(i, k + 1)); } catch { } }
			if (!j || !Array.isArray(j.temas) || !j.temas.length) throw new Error('A pesquisa não devolveu o JSON de temas: ' + txt.slice(-300));
			fim.temas = j.temas; fim.relatorio = j.relatorio || ''; fim.videos = Array.isArray(j.videos) ? j.videos : []; log('Temas:', j.temas.map(x => x.titulo || x.tema).join(' | '));
		} catch (e) { fim.ok = false; fim.erro = cancelado ? 'Parada pelo autor.' : e.message; log('✖', fim.erro); }
		return fim;
	}

	async function ciclo() {
		if (!ocupado) {
			try {
				const { tarefa } = await req('POST', '/api/agente/pegar', {});
				if (tarefa) {
					ocupado = tarefa; cancelado = false; buffer = [];
					log(`— ${tarefa.etapa} —`);
					const fim = tarefa.tipo === 'pesquisa' ? await pesquisar(tarefa) : await executar(tarefa);
					await new Promise(r => setTimeout(r, 1600)); // descarrega o último lote de log
					await req('POST', tarefa.tipo === 'pesquisa' ? '/api/agente/fim-pesquisa' : '/api/agente/fim', fim).catch(e => console.error('[agente]', e.message));
					ocupado = null;
					return setTimeout(ciclo, 500);
				}
			} catch (e) { if (!/ECONNREFUSED|HTTP 401/.test(e.message)) console.error('[agente]', e.message); ocupado = null; }
		}
		setTimeout(ciclo, 4000);
	}
	console.log(`[agente] ${nome} conectado a ${painel}`);
	ciclo();
}

module.exports = { iniciar };

if (require.main === module) {
	const a = process.argv.slice(2), opt = k => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : undefined; };
	let painel = opt('painel') || process.env.PAINEL_URL, token = opt('token') || process.env.PAINEL_TOKEN;
	const cfgF = [path.join(__dirname, 'dados', 'config.json'), path.join(__dirname, 'config.json')].find(f => fs.existsSync(f)) || '';
	if (!painel && cfgF) { const c = JSON.parse(fs.readFileSync(cfgF, 'utf8')); painel = `http://127.0.0.1:${c.porta || 5180}`; }
	if (!painel || !token) { console.error('uso: node painel/agente.cjs --painel https://… --token …'); process.exit(2); }
	iniciar({ painel, token });
}
