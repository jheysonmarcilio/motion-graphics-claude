// Narração sintética (edge-tts) frase a frase, com pausas controladas e tempos exatos de cada palavra.
// Só para canais/vídeos em que o autor autorizou voz sintética (canais dark do painel, ou pedido explícito).
// Uso: node tools/tts.cjs roteiros/NN-nome.md audio/NN-nome.mp3 demos/NN-nome [--voz pt-BR-AntonioNeural] [--vel +22%] [--pausa 0.28]
//   entrada .md → usa só a seção "## Texto narrado" (ou .txt inteiro)
//   saída: mp3 + demos/NN-nome/words.json [{w,a,d,s}] + demos/NN-nome/fala.json [[ini,fim,"frase"]]
// Precisa de: python -m pip install edge-tts. Temporários no TEMP, apagados no fim.
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');

const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args.splice(i, 2)[1] : d; };
const voz = opt('voz', 'pt-BR-AntonioNeural'), vel = opt('vel', '+22%'), pausa = +opt('pausa', 0.28);
const [entrada, saida, pasta] = args;
if (!entrada || !saida || !pasta) { console.error('uso: node tools/tts.cjs roteiro.md saida.mp3 demos/NN-nome [--voz] [--vel] [--pausa]'); process.exit(2); }

let texto = fs.readFileSync(entrada, 'utf8');
if (entrada.endsWith('.md')) {
	const m = texto.match(/(?:^|\n)#{2,}\s*Texto narrado[^\n]*\n([\s\S]*?)(?=\n#{1,6}\s|\n---|(?![\s\S]))/i);
	if (!m) { console.error('Não achei a seção "## Texto narrado" em ' + entrada); process.exit(1); }
	texto = m[1];
}
texto = texto.split('\n').filter(l => !/^\s*(\||>|\[|\(|<!--)/.test(l)).join(' ')   // tira tabelas, notas, marcações de cena
	.replace(/\*\*?|__|`|#+/g, '').replace(/\s+/g, ' ').trim();
const frases = texto.match(/[^.!?…]+(?:[.!?…]+["”»)]?|$)/g).map(s => s.trim()).filter(s => /\w/.test(s));
if (!frases.length) { console.error('Texto narrado vazio.'); process.exit(1); }

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mg-tts-'));
try {
	fs.writeFileSync(path.join(tmp, 'f.json'), JSON.stringify(frases));
	fs.writeFileSync(path.join(tmp, 't.py'), `
import asyncio, json, sys, edge_tts
d = sys.argv[1]; frases = json.load(open(d + '/f.json', encoding='utf-8'))
async def um(i, s):
    c = edge_tts.Communicate(s, ${JSON.stringify(voz)}, rate=${JSON.stringify(vel)}, boundary='WordBoundary')
    ws = []
    with open(f'{d}/{i}.mp3', 'wb') as f:
        async for ch in c.stream():
            if ch['type'] == 'audio': f.write(ch['data'])
            elif ch['type'] == 'WordBoundary': ws.append([ch['text'], ch['offset'] / 1e7, ch['duration'] / 1e7])
    json.dump(ws, open(f'{d}/{i}.json', 'w', encoding='utf-8'), ensure_ascii=False)
async def main():
    for i, s in enumerate(frases): await um(i, s)
asyncio.run(main())
`);
	execFileSync('python', [path.join(tmp, 't.py'), tmp], { stdio: ['ignore', 'ignore', 'inherit'] });

	const SR = 48000, pcm = [], words = [], fala = [];
	let t = 0;
	frases.forEach((s, i) => {
		const ws = JSON.parse(fs.readFileSync(path.join(tmp, i + '.json'), 'utf8'));
		if (!ws.length) return;
		const ini = Math.max(0, ws[0][1] - 0.03), fim = ws.at(-1)[1] + ws.at(-1)[2] + 0.06;
		const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', path.join(tmp, i + '.mp3'), '-ss', String(ini), '-to', String(fim), '-ac', '1', '-ar', String(SR), '-f', 's16le', '-'], { maxBuffer: 1 << 28 });
		const t0 = t;
		for (const [w, a, d] of ws) words.push({ w, a: +(t + a - ini).toFixed(3), d: +d.toFixed(3), s: i });
		pcm.push(raw); t += raw.length / 2 / SR;
		fala.push([+t0.toFixed(2), +t.toFixed(2), s]);
		const gap = i === frases.length - 1 ? 0.6 : i === frases.length - 2 ? Math.max(pausa, 0.45) : pausa; // respiro antes da frase final
		pcm.push(Buffer.alloc(Math.round(gap * SR) * 2)); t += gap;
	});
	fs.writeFileSync(path.join(tmp, 'v.raw'), Buffer.concat(pcm));
	fs.mkdirSync(path.dirname(saida), { recursive: true }); fs.mkdirSync(pasta, { recursive: true });
	execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 's16le', '-ar', String(SR), '-ac', '1', '-i', path.join(tmp, 'v.raw'), '-b:a', '192k', saida]);
	fs.writeFileSync(path.join(pasta, 'words.json'), JSON.stringify(words));
	fs.writeFileSync(path.join(pasta, 'fala.json'), JSON.stringify(fala));
	console.log(`pronto: ${saida} — ${t.toFixed(1)} s, ${frases.length} frases, ${words.length} palavras`);
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }
