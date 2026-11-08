// Transcreve a narração com whisper (filtro do ffmpeg) e imprime só o essencial: "seg  texto" por linha.
// Uso: node tools/transcrever.cjs audio/NN-nome.mp3 [saida.json] [--fino] [--de s --ate s]
//   saida.json (opcional) → [[ini, fim, "texto"], ...] em segundos (ex.: demos/NN-nome/fala.json)
//   --fino → queue=3 (tempos mais precisos, ~4x mais lento)
// Nada de log do ffmpeg na tela; temporário no TEMP, apagado no fim.
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const args = process.argv.slice(2);
const flag = k => { const i = args.indexOf('--' + k); return i >= 0 ? (args.splice(i, 1), true) : false; };
const opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args.splice(i, 2)[1] : null; };
const fino = flag('fino'), de = opt('de'), ate = opt('ate');
const [audio, saida] = args;
if (!audio) { console.error('uso: node tools/transcrever.cjs audio/NN.mp3 [saida.json] [--fino]'); process.exit(2); }

const rel = p => path.relative(process.cwd(), p).replace(/\\/g, '/'); // relativo: sem o ':' do drive no filtro
const model = rel(path.join(__dirname, 'models', 'ggml-small.bin'));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mg-tr-')), out = path.join(tmp, 'w.json'), dest = rel(out);
try {
	execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...(de ? ['-ss', de] : []), ...(ate ? ['-to', ate] : []), '-i', audio,
		'-af', `whisper=model=${model}:language=pt:queue=${fino ? 3 : 20}:destination=${dest}:format=json`, '-f', 'null', '-'], { stdio: ['ignore', 'ignore', 'inherit'] });
	const off = de ? +de : 0;
	const segs = fs.readFileSync(out, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l))
		.map(s => [+(s.start / 1000 + off).toFixed(2), +(s.end / 1000 + off).toFixed(2), s.text.trim()]).filter(s => s[2]);
	for (const [a, , t] of segs) console.log(a.toFixed(1).padStart(6) + '  ' + t);
	if (saida) { fs.writeFileSync(saida, JSON.stringify(segs)); console.log('salvo: ' + saida); }
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }
