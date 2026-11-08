// Trilha procedural do Short 05: pop leve de explainer, 100 BPM, C–G–Am–F, pluck + pad + kick/hat suaves.
// Uso: node demos/05-hipnotizar-online/music.cjs → renders/05-hipnotizar-online-music.wav
'use strict';
const path = require('path');
const X = require('../../tools/sfx-lib.js');
const DUR = 107.6, B = 60 / 100, bus = new X.Bus(DUR);
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
const CH = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]];   // C G Am F
const pad = {}, pl = {};
const padOf = m => pad[m] || (pad[m] = X.tone({ f: hz(m), dur: B * 4, att: .5, vib: .003 }));
const plOf = m => pl[m] || (pl[m] = X.blip({ f: hz(m), dur: .5, decay: 9, harm: .3 }));
const kick = X.impact({ dur: .35, f0: 120, f1: 45, noise: .1, decay: 9, seed: 1 }), hat = X.tick({ f: 7000, dur: .04, seed: 2, decay: 300 });
// intensidade por trecho (respira com o vídeo; cai no carimbo e no fim)
const lvl = t => t > 104.2 ? Math.max(0, 1 - (t - 104.2) / 3.2) : t < 1.5 ? t / 1.5 : 1;
for (let bar = 0; bar * B * 4 < DUR; bar++) {
	const t0 = bar * B * 4, c = CH[bar % 4], L = lvl(t0);
	if (L <= 0) continue;
	c.forEach((m, i) => bus.add(t0, padOf(m), { gain: .035 * L, pan: (i - 1) * .4, fi: .3, fo: .4 }));
	bus.add(t0, padOf(c[0] - 24), { gain: .05 * L, fi: .1, fo: .4 });                       // baixo
	const arp = [c[0], c[1], c[2], c[1] + 12, c[2], c[1], c[0] + 12, c[2]];
	arp.forEach((m, i) => { const t = t0 + i * B / 2; bus.add(t, plOf(m + 12), { gain: .045 * lvl(t), pan: i % 2 ? .3 : -.3, rev: .25 }); });
	if (t0 > 3) for (let k = 0; k < 4; k++) { const t = t0 + k * B; bus.add(t, kick, { gain: (k % 2 ? .05 : .08) * lvl(t) }); bus.add(t + B / 2, hat, { gain: .02 * lvl(t), pan: .2 }); }
}
const n = bus.n, SR = X.SR; let pk = 0;
for (let i = 0; i < n; i++) { const f = Math.min(1, (n - i) / (.3 * SR)); bus.L[i] *= f; bus.R[i] *= f; pk = Math.max(pk, Math.abs(bus.L[i]), Math.abs(bus.R[i])); }
for (const b of [bus.L, bus.R]) for (let i = 0; i < n; i++) b[i] *= .89 / pk;
X.writeWav(path.resolve(__dirname, '../../renders/05-hipnotizar-online-music.wav'), bus.L, bus.R);
console.log('trilha pronta');
