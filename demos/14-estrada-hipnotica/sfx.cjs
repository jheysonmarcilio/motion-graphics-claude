// SFX do 14 (A estrada hipnótica). Tempos = main.js / words.json. Uso: SFX_OUT=arquivo.wav node demos/14-estrada-hipnotica/sfx.cjs
'use strict';
const X = require('../../tools/sfx-lib.js');
const DUR = 39, fx = new X.Bus(DUR);
let seed = 1400; const S = () => ++seed;
const F = (t, b, o) => fx.add(t, b, o);
const pop = (t, f = 600, g = .08, p = 0) => F(t, X.pop({ f, seed: S() }), { gain: g, pan: p, rev: .15 });
const whip = (t, d = 1, g = .12) => F(t, X.whoosh({ dur: .4, f0: 400, f1: 3000, peak: .45, seed: S() }), { gain: g, pan: -.6 * d, panEnd: .6 * d });
const thud = (t, g = .2) => { F(t, X.knock({ f: 140, seed: S() }), { gain: g }); F(t, X.impact({ dur: .8, f0: 110, f1: 40, noise: .4, seed: S() }), { gain: g * .7 }); };
const chime = (t, f, g = .04) => F(t, X.blip({ f, dur: .9, decay: 5 }), { gain: g, rev: .5 });
const sparkle = (t, g = .05, d = 1.4) => F(t, X.sparkle({ dur: d, seed: S(), dens: 22 }), { gain: g });
const swirl = (t, d = 2, g = .06) => F(t, X.swirl({ dur: d, seed: S(), rate: .7 }), { gain: g, fi: .2, fo: .4 });
const tick = (t, g = .03) => F(t, X.tick({ f: 2400, seed: S() }), { gain: g });

pop(.55, 900, .06); pop(1.05, 300, .06);                       // ? e susto
whip(2.6, 1); pop(2.95, 700, .05); F(4.44, X.stamp({ seed: S() }), { gain: .14, rev: .3 }); // "não desmaiou" vira X
whip(7.45, -1); F(5.2, X.murmur({ dur: 2.4, seed: S(), voices: 2 }), { gain: .012 });
for (const t of [7.77, 8.37, 8.92, 9.5]) { thud(t, .12); tick(t + .05, .04); }
swirl(8.4, 2.3, .05);
whip(10.75, 1); F(11.7, X.whoosh({ dur: .45, f0: 1800, f1: 200, peak: .5, seed: S() }), { gain: .08 }); thud(12.05, .22); F(12.1, X.drop({ seed: S() }), { gain: .03 });
for (const [t, f] of [[12.29, 500], [12.92, 600], [13.45, 720]]) pop(t, f, .07);
whip(14.25, -1); pop(15.95, 500, .08); chime(16.0, 1318, .04); chime(16.15, 1760, .03); swirl(16.2, 1.2, .04);
whip(17.2, 1); pop(17.55, 700, .06); F(17.5, X.drop({ seed: S() }), { gain: .03 }); chime(18.73, 1568, .05); sparkle(18.75, .05, 1);
for (let k = 0; k < 3; k++) chime(19.4 + k * .25, 660 - k * 60, .02);
F(21.3, X.swirl({ dur: 1.1, seed: S(), rate: 1.2 }), { gain: .06, fi: .1, fo: .1 }); F(22.2, X.impact({ dur: .6, f0: 120, f1: 50, noise: .3, seed: S() }), { gain: .08 });
whip(23.25, -1); pop(23.6, 800, .05); F(24.74, X.stamp({ seed: S() }), { gain: .2, rev: .3 }); sparkle(24.8, .05, 1);
whip(25.5, 1); for (let t = 25.8; t < 28.0; t += .5) tick(t, .035);
swirl(26.94, 2.5, .06); chime(26.95, 1318, .03);
F(29.3, X.stamp({ seed: S() }), { gain: .14, rev: .3 }); pop(29.0, 400, .05);
pop(30.46, 700, .07); chime(30.5, 1568, .05); sparkle(30.55, .05, .8);
whip(31.15, -1); pop(32.0, 800, .06); chime(32.05, 1175, .04);
swirl(34.7, 2, .06); F(35.73, X.impact({ dur: 1.1, f0: 100, f1: 34, noise: .3, seed: S() }), { gain: .15 }); sparkle(35.75, .06, 1.2);
F(36.6, X.stamp({ seed: S() }), { gain: .3, rev: .3 }); F(36.6, X.impact({ dur: 1.2, f0: 85, f1: 32, noise: .3, seed: S() }), { gain: .14 });
for (let k = 0; k < 4; k++) pop(37.0 + k * .12, 800 + (k % 3) * 130, .04, k % 2 ? .4 : -.4);

const SR = X.SR, n = fx.n, M = [new Float32Array(n), new Float32Array(n)];
let pk = 0; for (let i = 0; i < n; i++) { const f = Math.min(1, (n - i) / (.15 * SR)); M[0][i] = fx.L[i] * f; M[1][i] = fx.R[i] * f; pk = Math.max(pk, Math.abs(M[0][i]), Math.abs(M[1][i])); }
const gain = .89 / pk; for (const b of M) for (let i = 0; i < n; i++) b[i] *= gain;
X.writeWav(process.env.SFX_OUT || require('path').join(require('os').tmpdir(), '14-sfx.wav'), M[0], M[1]);
console.log(`pronto · pico ${pk.toFixed(3)} → ganho ${gain.toFixed(3)}`);
