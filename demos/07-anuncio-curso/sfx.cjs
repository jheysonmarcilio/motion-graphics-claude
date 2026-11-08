// SFX do Short 07 (anúncio, 3D pop): whoosh + pêndulo nos whips, pops, puf, livros, ding, confete, botão, moedas, carimbo.
// Uso: SFX_OUT=arquivo.wav node demos/07-anuncio-curso/sfx.cjs   (chamado por tools/final.cjs)
'use strict';
const X = require('../../tools/sfx-lib.js');
const { Bus, writeWav } = X;
const DUR = 35.65, fx = new Bus(DUR);
let seed = 700; const S = () => ++seed;
const F = (t, b, o) => fx.add(t, b, o);
const pop = (t, f = 600, g = .08, p = 0) => F(t, X.pop({ f, seed: S() }), { gain: g, pan: p, rev: .2 });
const chime = (t, f, g = .05, p = 0) => F(t, X.blip({ f, dur: .9, decay: 5 }), { gain: g, pan: p, rev: .5 });
const ding = (t, f = 1318, g = .06) => { chime(t, f, g); chime(t + .12, f * 1.26, g * .8); };
const knock = (t, g = .1, p = 0, f = 200) => F(t, X.knock({ f, seed: S() }), { gain: g, pan: p, rev: .2 });
const coin = (t, g = .04, p = 0) => F(t, X.metal({ f: 2400 + (seed % 7) * 180, dur: .35, decay: 14, seed: S() }), { gain: g, pan: p, rev: .3 });
const boing = (t, g = .06) => F(t, X.blip({ f: 220, f1: 520, dur: .28, decay: 9 }), { gain: g, rev: .15 });

// whips: whoosh com pan + tilintar do pêndulo dourado
const WH = [6.5, 9.42, 10.28, 11.28, 12.4, 15.25, 18.68, 21.45, 28.88, 31.3, 33.08];
WH.forEach((t, i) => { const d = i % 2 ? -1 : 1; F(t - .08, X.whoosh({ dur: .55, f0: 400, f1: 2600, peak: .5, seed: S(), body: .25 }), { gain: .09, pan: -.7 * d, panEnd: .7 * d }); });
[6.5, 15.25, 21.45, 28.88, 31.3, 33.08].forEach(t => coin(t + .18, .03));
// abertura: pêndulo balançando
for (let k = 0; k < 4; k++) F(.05 + k * .75, X.whoosh({ dur: .6, f0: 600, f1: 1400, peak: .5, seed: S(), body: .1 }), { gain: .035, pan: k % 2 ? .5 : -.5 });
F(.3, X.whoosh({ dur: .9, f0: 2200, f1: 300, peak: .2, seed: S() }), { gain: .06 });
// balão PSIU + acerto + POOF
pop(1.32, 700, .09); F(1.95, X.whoosh({ dur: .5, f0: 800, f1: 2000, peak: .5, seed: S() }), { gain: .05, pan: -.4, panEnd: .4 });
F(2.45, X.impact({ dur: .6, f0: 160, f1: 70, noise: .4, seed: S() }), { gain: .08 }); pop(2.46, 420, .07);
F(2.7, X.whoosh({ dur: .45, f0: 300, f1: 1200, peak: .2, seed: S(), body: .6 }), { gain: .08 }); F(2.75, X.sparkle({ dur: .8, seed: S(), dens: 25 }), { gain: .04 });
pop(4.45, 900, .07); F(4.5, X.shimmer({ dur: 1.2, f: 880, peak: .3, seed: S() }), { gain: .03 });
[5.15, 5.4, 5.65].forEach((t, i) => pop(t, 800 + i * 150, .05, .3));
// pedestais + 4 processos
[7.45, 7.65, 7.85, 8.05].forEach((t, i) => knock(t + .3, .06, -.5 + i * .33, 160 + i * 20));
F(9.05, X.click({ seed: S(), f: 1400 }), { gain: .08 }); F(9.55, X.impact({ dur: .5, f0: 120, f1: 60, noise: .3, seed: S() }), { gain: .05 }); pop(9.57, 650, .07);
pop(10.4, 520, .08); F(10.55, X.sparkle({ dur: .9, seed: S(), dens: 30 }), { gain: .04 });
for (let k = 0; k < 9; k++) F(11.4 + k * .08, X.knock({ f: 260, seed: S() }), { gain: .025, pan: k % 2 ? .2 : -.2 }); pop(12.12, 900, .08);
F(12.6, X.blip({ f: 300, f1: 900, dur: 1.2, decay: 2.5 }), { gain: .03 });
[14.0, 14.14, 14.28, 14.42].forEach((t, i) => chime(t, 1046 + i * 130, .035));
// cartas + estudar
for (let i = 0; i < 5; i++) F(15.75 + i * .12, X.paper({ dur: .14, seed: S(), dens: 200, hp: 2500 }), { gain: .06, pan: -.6 + i * .3 });
[18.85, 19.12, 19.4, 19.62].forEach((t, i) => knock(t, .09, -.3, 150 + i * 15));
F(19.95, X.click({ seed: S(), f: 2200 }), { gain: .07 }); ding(20.02, 1318, .06); boing(20.15, .05); pop(20.3, 980, .06);
// curso: notebook abre, aluno, mergulho
F(21.95, X.whoosh({ dur: .5, f0: 500, f1: 1500, peak: .6, seed: S() }), { gain: .05 }); knock(22.55, .05, 0, 300); F(22.6, X.shimmer({ dur: 1.1, f: 1046, peak: .3, seed: S() }), { gain: .035 });
boing(22.75, .05); pop(23.0, 760, .06);
F(24.25, X.whoosh({ dur: 1.15, f0: 200, f1: 3200, peak: .9, seed: S(), body: .3 }), { gain: .1 });
// módulos
[25.52, 26.56, 28.1].forEach((t, i) => { F(t, X.whoosh({ dur: .3, f0: 2400, f1: 600, peak: .4, seed: S() }), { gain: .06, pan: .6, panEnd: 0 }); knock(t + .22, .07, 0, 240); chime(t + .55, [988, 1175, 1397][i], .04); });
// escada
[29.25, 29.62, 29.95, 30.35, 30.72].forEach((t, i) => { boing(t - .3, .035); knock(t, .06, 0, 220 + i * 30); });
F(30.8, X.sparkle({ dur: 1.0, seed: S(), dens: 30 }), { gain: .04 });
// confete + botão
F(31.62, X.impact({ dur: .5, f0: 200, f1: 90, noise: .7, seed: S() }), { gain: .08 }); F(31.65, X.sparkle({ dur: 1.4, seed: S(), dens: 40, peak: .3 }), { gain: .05 });
pop(31.5, 500, .07); boing(32.25, .06);
F(32.92, X.click({ seed: S(), f: 900 }), { gain: .12 }); F(32.92, X.impact({ dur: .7, f0: 140, f1: 50, noise: .4, seed: S() }), { gain: .1 }); F(32.95, X.sparkle({ dur: 1.0, seed: S(), dens: 40 }), { gain: .05 });
// moeda R$ 97
F(33.15, X.whoosh({ dur: .6, f0: 2000, f1: 400, peak: .4, seed: S() }), { gain: .06 });
for (let k = 0; k < 7; k++) coin(33.45 + k * .11 * (1 + k * .08), .025);
F(34.24, X.stamp({ seed: S() }), { gain: .28, rev: .3 }); F(34.24, X.impact({ dur: 1.3, f0: 80, f1: 34, noise: .3, seed: S() }), { gain: .18, rev: .4 });
coin(34.26, .06);
for (let k = 0; k < 22; k++) coin(34.5 + k * .05 + (k % 3) * .02, .018, (k % 5 - 2) * .3);

const SR = X.SR, n = fx.n, M = [new Float32Array(n), new Float32Array(n)];
let pk = 0; for (let i = 0; i < n; i++) { const f = Math.min(1, (n - i) / (.15 * SR)); M[0][i] = fx.L[i] * f; M[1][i] = fx.R[i] * f; pk = Math.max(pk, Math.abs(M[0][i]), Math.abs(M[1][i])); }
const gain = .89 / pk; for (const b of M) for (let i = 0; i < n; i++) b[i] *= gain;
writeWav(process.env.SFX_OUT || require('path').join(require('os').tmpdir(), '07-sfx.wav'), M[0], M[1]);
console.log(`pronto · pico ${pk.toFixed(3)} → ganho ${gain.toFixed(3)}`);
