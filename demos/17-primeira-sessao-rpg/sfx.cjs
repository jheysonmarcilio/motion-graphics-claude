// SFX do 17 (A primeira sessão, RPG pixel art). Tempos vêm de words.json. Uso: SFX_OUT=arquivo.wav node demos/17-primeira-sessao-rpg/sfx.cjs
'use strict';
const X = require('../../tools/sfx-lib.js'), WORDS = require('./words.json');
const DUR = 47, fx = new X.Bus(DUR);
const SS = []; WORDS.forEach((w) => { (SS[w.s] ||= []).push(w.a); });
const wt = (s, k) => SS[s][Math.min(k, SS[s].length - 1)];
let seed = 1700; const S = () => ++seed;
const F = (t, b, o) => fx.add(t, b, o);
const pop = (t, f = 600, g = .08, p = 0) => F(t, X.pop({ f, seed: S() }), { gain: g, pan: p, rev: .15 });
const whip = (t, d = 1, g = .1) => F(t, X.whoosh({ dur: .4, f0: 400, f1: 3000, peak: .45, seed: S() }), { gain: g, pan: -.6 * d, panEnd: .6 * d });
const chime = (t, f, g = .04) => F(t, X.blip({ f, dur: .7, decay: 6 }), { gain: g, rev: .3 });
const sparkle = (t, g = .05, d = 1) => F(t, X.sparkle({ dur: d, seed: S(), dens: 22 }), { gain: g });
const tick = (t, g = .03) => F(t, X.tick({ f: 2400, seed: S() }), { gain: g });
const levelUp = (t) => { [523, 659, 784, 1047].forEach((f, i) => chime(t + i * .09, f, .045)); };
const SA = (s) => SS[s][0];

// gancho
pop(wt(0, 4) + .05, 500, .06); chime(wt(0, 6), 330, .03); whip(wt(0, 6) + .1, 1, .08); tick(2.5, .05); chime(2.6, 880, .04);
for (const t of [3.3, 3.7]) tick(t, .03);
// transições entre fases (varredura de blocos) + "level up"
for (const s of [2, 5, 8, 10, 12, 14]) { whip(SA(s) - .4, s % 4 ? 1 : -1, .1); levelUp(SA(s)); }
whip(SA(16) - .4, 1, .1);
// fase 1
pop(wt(3, 0), 700, .05); pop(wt(3, 2) + .02, 520, .05); pop(wt(3, 6), 800, .06); for (let i = 0; i < 3; i++) chime(wt(3, 7) + .2 + i * .22, 880 + i * 220, .035);
for (let t = wt(4, 2); t < wt(4, 5); t += .16) tick(t, .03);
F(wt(4, 5), X.stamp({ seed: S() }), { gain: .1, rev: .3 }); sparkle(wt(4, 5), .05, 1); pop(wt(4, 6), 900, .05);
// fase 2
pop(SA(6), 700, .06); F(wt(6, 3) - .1, X.whoosh({ dur: .22, f0: 1800, f1: 300, peak: .4, seed: S() }), { gain: .08 }); F(wt(6, 3), X.knock({ f: 220, seed: S() }), { gain: .12 });
for (let i = 0; i < 5; i++) F(wt(7, 2) + .1 + i * .42, X.drop({ seed: S() }), { gain: .035 });
chime(wt(7, 4), 1175, .05); chime(wt(7, 4) + .1, 1568, .04); pop(wt(7, 7), 600, .06); sparkle(wt(7, 7), .05, 1);
// fase 3
for (const t of [wt(9, 3), wt(9, 6)]) { chime(t, 1318, .06); chime(t + .02, 1976, .03); chime(t + .03, 659, .04); }
F(wt(9, 8), X.swirl({ dur: 1.8, seed: S(), rate: .7 }), { gain: .05, fi: .2, fo: .5 }); pop(wt(9, 9), 480, .05);
// fase 4
sparkle(SA(10) + 1, .05, 1.2); F(SA(11), X.swirl({ dur: 2.4, seed: S(), rate: .5 }), { gain: .04, fi: .3, fo: .6 }); pop(wt(11, 4) - .05, 700, .06); chime(wt(11, 4), 1568, .04);
// fase 5
pop(wt(13, 6) - .05, 800, .05); for (let t = wt(13, 8); t < wt(13, 10) + .9; t += .22) tick(t, .03); sparkle(wt(13, 10), .05, 1);
// fase 6
chime(wt(15, 1), 784, .05); chime(wt(15, 1) + .1, 1047, .05); F(wt(15, 1) + .05, X.stamp({ seed: S() }), { gain: .05 }); sparkle(wt(15, 5), .06, 1.2);
// final
F(wt(16, 6), X.impact({ dur: .8, f0: 120, f1: 50, noise: .3, seed: S() }), { gain: .12 }); levelUp(wt(16, 6) + .1); sparkle(wt(16, 6) + .1, .06, 1.2);
F(wt(18, 0) - .05, X.stamp({ seed: S() }), { gain: .3, rev: .3 }); F(wt(18, 0) - .05, X.impact({ dur: 1.2, f0: 85, f1: 32, noise: .3, seed: S() }), { gain: .14 });
for (let k = 0; k < 5; k++) pop(wt(18, 0) + .35 + k * .12, 800 + (k % 3) * 140, .04, k % 2 ? .4 : -.4);

const SR = X.SR, n = fx.n, M = [new Float32Array(n), new Float32Array(n)];
let pk = 0; for (let i = 0; i < n; i++) { const f = Math.min(1, (n - i) / (.15 * SR)); M[0][i] = fx.L[i] * f; M[1][i] = fx.R[i] * f; pk = Math.max(pk, Math.abs(M[0][i]), Math.abs(M[1][i])); }
const gain = .89 / pk; for (const b of M) for (let i = 0; i < n; i++) b[i] *= gain;
X.writeWav(process.env.SFX_OUT || require('path').join(require('os').tmpdir(), '17-sfx.wav'), M[0], M[1]);
console.log(`pronto · pico ${pk.toFixed(3)} → ganho ${gain.toFixed(3)}`);
