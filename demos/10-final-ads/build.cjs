// Gera renders/10-final-ads.mp4: FinalADS.mp4 com a intro em motion graphic por cima (overlay), sem congelar o vídeo.
// Uso (servidor rodando na 5173): node demos/10-final-ads/build.cjs
// Temporários no TEMP do sistema, apagados no fim.
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const X = require('../../tools/sfx-lib.js');
const ROOT = path.resolve(__dirname, '../..'), SRC = path.join(ROOT, 'FinalADS.mp4'), OUT = path.join(ROOT, 'renders/10-final-ads.mp4');
const DUR = 4.57;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mg10-')), T = f => path.join(tmp, f);
try {
	// SFX leves (a voz já está tocando desde o início)
	const fx = new X.Bus(DUR); let sd = 1000; const S = () => ++sd;
	fx.add(0, X.sparkle({ dur: 1.0, seed: S(), dens: 30, peak: .2 }), { gain: .03 });
	fx.add(.02, X.pop({ f: 600, seed: S() }), { gain: .07, rev: .2 });
	[.55, 1.0].forEach((t, i) => fx.add(t, X.blip({ f: 880 * (1 + i * .25), dur: .5, decay: 7 }), { gain: .018, rev: .4 }));
	fx.add(1.3, X.whoosh({ dur: 1.5, f0: 250, f1: 2400, peak: .6, seed: S(), body: .3 }), { gain: .05, pan: -.3, panEnd: .3 });
	X.writeWav(T('sfx.wav'), fx.L, fx.R);
	execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', SRC, '-i', T('sfx.wav'), '-filter_complex',
		'[0:a]aresample=48000[v];[1:a]aresample=48000[s];[v][s]amix=inputs=2:normalize=0:duration=first,volume=6dB,alimiter=limit=0.89[o]', '-map', '[o]', T('mix.wav')]);
	execFileSync('node', [path.join(ROOT, 'tools/export.js'), 'demos/10-final-ads', OUT, '--bg', SRC, '--audio', T('mix.wav')], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] });
	console.log('pronto: ' + OUT);
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }
