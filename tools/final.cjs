// Gera o MP4 final com voz + SFX + trilha, sem deixar nenhum arquivo de áudio intermediário.
// Uso: node tools/final.cjs demos/NN-nome --voz audio/NN-nome.mp3 [saida.mp4] [--sfx-db -13.4] [--trilha-db -8] [--fps 30] [--from s --to s] [--bg video.mp4] [--ganho dB]
// Precisa de: demos/NN-nome/trilha.json  → { "bpm": 96, "seed": 1, "cues": [[0, "misterio"], [11, "investigacao"], ...] }
//             demos/NN-nome/sfx.cjs (opcional) que escreve em process.env.SFX_OUT
// Servidor rodando (porta 5173). Temporários vão para o TEMP do sistema e são apagados no fim.
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const { writeWav } = require('./sfx-lib.js'), { trilha } = require('./trilha.cjs');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args.splice(i, 2)[1] : d; };
const voz = opt('voz'), sfxDb = +opt('sfx-db', -13.4), musDb = +opt('trilha-db', -8), ganho = +opt('ganho', 0), pass = [];
for (const k of ['fps', 'from', 'to', 'port', 'bg']) { const v = opt(k); if (v != null) pass.push('--' + k, v); }
const demo = (args[0] || '').replace(/\\/g, '/').replace(/\/$/, ''), out = args[1] || `renders/${path.basename(demo)}.mp4`;
if (!demo || !voz) { console.error('uso: node tools/final.cjs demos/NN-nome --voz audio/NN.mp3 [saida.mp4]'); process.exit(2); }

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mg-')), T = f => path.join(tmp, f);
try {
	const dur = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', voz]).toString().trim();
	const cfg = JSON.parse(fs.readFileSync(path.join(demo, 'trilha.json'), 'utf8'));
	const [L, R] = trilha(dur, cfg.cues, cfg); writeWav(T('mus.wav'), L, R);
	const hasSfx = fs.existsSync(path.join(demo, 'sfx.cjs'));
	if (hasSfx) execFileSync('node', [path.join(demo, 'sfx.cjs')], { env: { ...process.env, SFX_OUT: T('sfx.wav') }, stdio: 'ignore' });
	const ins = ['-i', voz, '-i', T('mus.wav'), ...(hasSfx ? ['-i', T('sfx.wav')] : [])];
	const fc = `[0:a]aresample=48000,pan=stereo|c0=c0|c1=c0,asplit=3[v][sc1][sc2];` +
		`[1:a]volume=${musDb}dB[m];[m][sc1]sidechaincompress=threshold=0.03:ratio=4:attack=40:release=600[md];` +
		(hasSfx ? `[2:a]volume=${sfxDb}dB[s];[s][sc2]sidechaincompress=threshold=0.04:ratio=5:attack=15:release=250[sd];[v][md][sd]amix=inputs=3` : `[sc2]anullsink;[v][md]amix=inputs=2`) +
		`:normalize=0:duration=first,volume=${ganho}dB,alimiter=limit=0.95[o]`;
	execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...ins, '-filter_complex', fc, '-map', '[o]', T('mix.wav')]);
	execFileSync('node', [path.join(__dirname, 'export.js'), demo, out, '--audio', T('mix.wav'), ...pass], { stdio: ['ignore', 'ignore', 'inherit'] });
	console.log('pronto: ' + out);
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }
