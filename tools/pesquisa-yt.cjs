// Pesquisa de vídeos de sucesso no YouTube (yt-dlp, sem API key).
// Uso:
//   node tools/pesquisa-yt.cjs buscar --formato short|longo --meses 12 [--max 40] "consulta 1" "consulta 2" ...
//     → lista ranqueada (views/dia) só com vídeos publicados no período e no formato pedido.
//   node tools/pesquisa-yt.cjs detalhar [--chars 7000] ID1 ID2 ...
//     → para cada vídeo: metadados, transcrição limpa (gancho = primeiros ~40 s separado) e 10 comentários mais populares.
// Saída compacta em stdout + JSON completo em %TEMP%/pesquisa-yt/. Requer: py -m pip install -U yt-dlp
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');

const TMP = path.join(os.tmpdir(), 'pesquisa-yt'); fs.mkdirSync(TMP, { recursive: true });
const args = process.argv.slice(2); const cmd = args.shift();
const opt = (k, d) => { const i = args.indexOf('--' + k); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };

function ytdlp(a, timeout = 600000) {
  try { return execFileSync('py', ['-m', 'yt_dlp', '--no-warnings', '--ignore-errors', '--js-runtimes', 'node', ...a], { encoding: 'utf8', maxBuffer: 1 << 29, timeout, stdio: ['ignore', 'pipe', 'ignore'] }); }
  catch (e) { return e.stdout || ''; }
}
const linhas = (s) => s.split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
const dias = (ud) => { if (!ud) return null; const d = new Date(`${ud.slice(0, 4)}-${ud.slice(4, 6)}-${ud.slice(6, 8)}`); return Math.max(1, (Date.now() - d) / 864e5); };
const k = (n) => n == null ? '?' : n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'k' : String(n);

if (cmd === 'buscar') {
  const formato = opt('formato', 'longo'), meses = +opt('meses', 12), max = +opt('max', 40);
  const consultas = args; if (!consultas.length) { console.error('faltou consulta'); process.exit(1); }
  // 1) busca rápida (flat): filtro do YouTube = último ano, ordenado por views
  const ids = new Map();
  for (const q of consultas) {
    const termo = formato === 'short' ? `${q} #shorts` : q;
    for (const v of linhas(ytdlp(['--flat-playlist', '-j', '--playlist-end', String(max), `https://www.youtube.com/results?search_query=${encodeURIComponent(termo)}&sp=CAMSAggF`], 180000))) {
      const dur = v.duration || 0, isShort = /\/shorts\//.test(v.url || '') || (dur && dur <= 180);
      if (formato === 'short' ? !isShort : (isShort || (dur && dur < 240))) continue;
      if (!ids.has(v.id)) ids.set(v.id, q);
    }
  }
  // 2) metadados completos (data, likes, comentários) dos candidatos
  const urls = [...ids.keys()].map((id) => `https://www.youtube.com/watch?v=${id}`);
  const out = [];
  for (let i = 0; i < urls.length; i += 15) {
    for (const v of linhas(ytdlp(['-j', '--skip-download', ...urls.slice(i, i + 15)]))) {
      const d = dias(v.upload_date); if (!d || d > meses * 30.5) continue;
      out.push({ id: v.id, titulo: v.title, canal: v.channel, inscritos: v.channel_follower_count, data: v.upload_date, dur: v.duration,
        views: v.view_count, likes: v.like_count, coments: v.comment_count, viewsDia: Math.round((v.view_count || 0) / d),
        // views acima do tamanho do canal = vídeo que "estourou"
        outlier: v.channel_follower_count ? +((v.view_count || 0) / v.channel_follower_count).toFixed(2) : null,
        consulta: ids.get(v.id), tags: (v.tags || []).slice(0, 8), desc: (v.description || '').slice(0, 220).replace(/\s+/g, ' ') });
    }
  }
  out.sort((a, b) => b.viewsDia - a.viewsDia);
  const f = path.join(TMP, `busca-${Date.now()}.json`); fs.writeFileSync(f, JSON.stringify(out, null, 1));
  console.log(`${out.length} vídeos (${formato}, últimos ${meses} meses) — JSON: ${f}`);
  out.forEach((v, i) => console.log(`${i + 1}. [${v.id}] ${v.titulo} | ${v.canal} (${k(v.inscritos)} insc) | ${k(v.views)} views, ${k(v.viewsDia)}/dia, x${v.outlier ?? '?'} canal, ${k(v.likes)} likes, ${k(v.coments)} com | ${v.data} ${Math.round((v.dur || 0) / 60 * 10) / 10}min\n   ${v.desc}`));
} else if (cmd === 'detalhar') {
  const chars = +opt('chars', 7000);
  for (const id of args) {
    const dir = path.join(TMP, id); fs.mkdirSync(dir, { recursive: true });
    const raw = ytdlp(['-j', '--skip-download', '--write-comments', '--extractor-args', 'youtube:comment_sort=top;max_comments=40,40,0,0',
      '--write-auto-subs', '--write-subs', '--sub-langs', 'pt.*,pt,en.*,en', '--sub-format', 'vtt', '-o', path.join(dir, '%(id)s.%(ext)s'),
      `https://www.youtube.com/watch?v=${id}`]);
    // -j não baixa legenda; baixar à parte
    ytdlp(['--skip-download', '--write-auto-subs', '--write-subs', '--sub-langs', 'pt-orig,pt,pt-BR,en-orig,en', '--sub-format', 'vtt', '-o', path.join(dir, '%(id)s.%(ext)s'), `https://www.youtube.com/watch?v=${id}`]);
    const v = linhas(raw)[0]; if (!v) { console.log(`\n### ${id} — falhou`); continue; }
    const vtts = fs.readdirSync(dir).filter((f) => f.endsWith('.vtt')).sort((a, b) => (/\.pt/.test(b) - /\.pt/.test(a)) || (/orig/.test(b) - /orig/.test(a)));
    let gancho = '', texto = '';
    if (vtts.length) {
      const seen = new Set(); const partes = [];
      for (const bloco of fs.readFileSync(path.join(dir, vtts[0]), 'utf8').split(/\n\n+/)) {
        const m = bloco.match(/(\d+):(\d+):(\d+)\.\d+ -->/); if (!m) continue;
        const t = +m[1] * 3600 + +m[2] * 60 + +m[3];
        for (const l of bloco.split('\n').slice(1)) {
          const s = l.replace(/<[^>]+>/g, '').trim(); if (!s || /-->/.test(s) || seen.has(s)) continue; seen.add(s); partes.push([t, s]);
        }
      }
      gancho = partes.filter(([t]) => t < 40).map((p) => p[1]).join(' ');
      texto = partes.map((p) => p[1]).join(' ');
    }
    const com = (v.comments || []).filter((c) => c.parent === 'root').sort((a, b) => (b.like_count || 0) - (a.like_count || 0)).slice(0, 10)
      .map((c) => ({ likes: c.like_count, respostas: null, texto: (c.text || '').replace(/\s+/g, ' ').slice(0, 300) }));
    const reply = {}; (v.comments || []).forEach((c) => { if (c.parent !== 'root') reply[c.parent] = (reply[c.parent] || 0) + 1; });
    const capitulos = (v.chapters || []).map((c) => `${Math.round(c.start_time)}s ${c.title}`);
    const res = { id, titulo: v.title, canal: v.channel, views: v.view_count, likes: v.like_count, data: v.upload_date, dur: v.duration, capitulos, gancho, transcricao: texto, comentarios: com };
    fs.writeFileSync(path.join(TMP, `${id}.json`), JSON.stringify(res, null, 1));
    console.log(`\n### [${id}] ${v.title} — ${v.channel} | ${k(v.view_count)} views, ${k(v.like_count)} likes | ${Math.round(v.duration / 6) / 10} min | legenda: ${vtts[0] || 'NENHUMA'}`);
    if (capitulos.length) console.log('CAPÍTULOS: ' + capitulos.join(' · '));
    console.log('GANCHO (0–40 s): ' + (gancho || '—'));
    console.log(`TRANSCRIÇÃO (${texto.length} chars${texto.length > chars ? `, cortada; completa em ${path.join(TMP, id + '.json')}` : ''}): ` + (texto.slice(0, chars) || '—'));
    console.log('TOP 10 COMENTÁRIOS:'); com.forEach((c, i) => console.log(`  ${i + 1}. (${k(c.likes)}👍) ${c.texto}`));
  }
} else {
  console.log('uso: node tools/pesquisa-yt.cjs buscar|detalhar ... (ver cabeçalho do arquivo)');
}
