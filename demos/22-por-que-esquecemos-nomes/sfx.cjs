// SFX do 22 (Por que esquecemos nomes, explainer flat). Tempos = sets.js. Uso: SFX_OUT=arquivo.wav node demos/22-por-que-esquecemos-nomes/sfx.cjs
'use strict';
const X = require('../../tools/sfx-lib.js');
const DUR = 50.92, fx = new X.Bus(DUR);
let seed = 2200; const S = () => ++seed;
const F = (t, b, o) => fx.add(t, b, o);
const pop = (t, f = 600, g = .08, p = 0) => F(t, X.pop({ f, seed: S() }), { gain: g, pan: p, rev: .15 });
const whip = (t, d = 1, g = .11) => F(t - .05, X.whoosh({ dur: .4, f0: 400, f1: 3000, peak: .45, seed: S() }), { gain: g, pan: -.6 * d, panEnd: .6 * d });
const chime = (t, f, g = .04) => F(t, X.blip({ f, dur: .9, decay: 5 }), { gain: g, rev: .5 });
const ding = (t, f = 1318, g = .05) => { chime(t, f, g); chime(t + .14, f * 1.26, g * .8); };
const click = (t, g = .07) => F(t, X.click({ seed: S(), f: 1800 }), { gain: g, rev: .1 });
const scrib = (t, d = .4, g = .05) => F(t, X.scribble({ dur: d, seed: S(), rate: 9 }), { gain: g });
const stamp = (t, g = .16) => F(t, X.stamp({ seed: S() }), { gain: g, rev: .3 });
const tick = (t, g = .03, f = 2400) => F(t, X.tick({ f, seed: S() }), { gain: g });

// 1–2 rosto + crachá evaporando
scrib(.05, .9, .04); pop(.5, 700, .06); pop(.6, 820, .05);
F(1.5, X.whoosh({ dur: .3, f0: 1600, f1: 500, peak: .3, seed: S() }), { gain: .05 });
for (let i = 0; i < 7; i++) F(1.6 + i * .06, X.paper({ dur: .12, seed: S(), dens: 200, hp: 2500 }), { gain: .03, pan: (i - 3) * .12 });
pop(2.05, 420, .07);
// 3 você + cérebro
whip(2.62, 1); pop(3.1, 640, .07); F(3.35, X.blip({ f: 220, f1: 660, dur: .35, decay: 7 }), { gain: .06 });
// 4 prancheta
whip(4.45, 1, .07); [4.1, 4.22, 4.34].forEach(t => scrib(t, .15, .03)); stamp(4.6);
// 5–6 split
whip(5.6, -1); click(5.75, .08); F(8.2, X.whoosh({ dur: .5, f0: 300, f1: 2000, peak: .5, seed: S() }), { gain: .07, pan: .6, panEnd: -.2 }); ding(8.8, 1568, .04);
// 7 calendário
F(10.75, X.whoosh({ dur: .5, f0: 300, f1: 1800, peak: .7, seed: S() }), { gain: .06 });
[11.0, 11.35, 11.7, 12.05].forEach(t => F(t, X.tear({ dur: .2, seed: S(), dens: 380 }), { gain: .04, pan: .2 }));
pop(12.0, 900, .05); pop(12.15, 980, .05); pop(12.45, 560, .07);
// 8 o padeiro vence
F(13.25, X.whoosh({ dur: .4, f0: 300, f1: 4000, peak: .9, seed: S() }), { gain: .09 }); stamp(13.4, .22);
F(13.4, X.impact({ dur: 1.0, f0: 85, f1: 35, noise: .3, seed: S() }), { gain: .1 }); ding(13.65, 1318, .05); ding(14.0, 1568, .04);
// 9 lab
whip(15.35, 1); pop(15.5, 600, .06); pop(16.6, 700, .06);
[[15.9, 2600], [17.3, 2900], [18.4, 2700]].forEach(([t, f]) => F(t, X.metal({ f, dur: .35, decay: 18, seed: S() }), { gain: .03 }));
// 10 balança
F(19.0, X.whoosh({ dur: .45, f0: 500, f1: 2200, peak: .4, seed: S() }), { gain: .06 });
F(20.3, X.knock({ f: 140, seed: S() }), { gain: .12 }); F(20.65, X.knock({ f: 120, seed: S() }), { gain: .1 }); F(20.3, X.creak({ dur: .6, seed: S(), f: 600 }), { gain: .03 });
// 11 "?"
F(21.7, X.whoosh({ dur: .3, f0: 600, f1: 3000, peak: .4, seed: S() }), { gain: .08 }); scrib(21.76, .35, .04); pop(22.1, 500, .07);
// 12–13 gancho + ícones
whip(22.45, -1); scrib(22.6, .7, .04); F(23.2, X.metal({ f: 900, dur: .6, decay: 9, seed: S() }), { gain: .06 });
[24.94, 25.59, 26.4, 27.39].forEach((t, i) => { pop(t, 560 + i * 110, .08); chime(t + .05, [1046, 1175, 1318, 1568][i], .025); });
// 14–15 etiqueta solta
F(28.5, X.whoosh({ dur: .5, f0: 300, f1: 1800, peak: .7, seed: S() }), { gain: .05 });
[28.8, 28.95, 29.35, 29.5].forEach(t => F(t, X.beep({ f: 4200, dur: .05 }), { gain: .012 }));   // grilo
F(30.3, X.whoosh({ dur: .9, f0: 1400, f1: 300, peak: .7, seed: S() }), { gain: .06 }); F(31.25, X.knock({ f: 220, seed: S() }), { gain: .1 }); F(31.27, X.paper({ dur: .2, seed: S(), dens: 90 }), { gain: .04 });
// 16–17 piora / apresentação
whip(32.28, 1); F(32.3, X.impact({ dur: 1.1, f0: 60, f1: 30, noise: .3, seed: S() }), { gain: .1 });
F(33.15, X.whoosh({ dur: .4, f0: 400, f1: 1500, peak: .5, seed: S() }), { gain: .04, pan: -.6, panEnd: 0 });
[33.9, 34.5, 35.2, 35.9].forEach((t, i) => pop(t, 650 + i * 70, .06, .3));
for (let t = 34.0; t < 37.0; t += .5) tick(t, .025, 2600);
F(35.3, X.knock({ f: 300, seed: S() }), { gain: .06 });
// 18 casa vazia
F(37.15, X.whoosh({ dur: .4, f0: 300, f1: 4000, peak: .9, seed: S() }), { gain: .07 });
F(37.35, X.knock({ f: 180, seed: S() }), { gain: .08, rev: .6 }); F(37.55, X.knock({ f: 180, seed: S() }), { gain: .07, rev: .6 });
[37.7, 38.5, 39.3].forEach((t, i) => pop(t, 400 + i * 40, .04, -.3 + i * .3));
// 19–20 resumo
whip(40.05, -1); pop(40.1, 520, .07); scrib(41.0, .35, .06);
F(42.05, X.whoosh({ dur: .45, f0: 500, f1: 2200, peak: .4, seed: S() }), { gain: .05 }); pop(42.3, 600, .06); scrib(42.5, .4, .04);
click(43.1, .08); pop(43.4, 760, .06);
// 21–23 truque
F(44.5, X.whoosh({ dur: .5, f0: 300, f1: 1800, peak: .7, seed: S() }), { gain: .06 }); scrib(44.7, .9, .06);
click(46.05, .08); ding(46.3, 1318, .05); F(46.05, X.sparkle({ dur: 1.0, seed: S(), dens: 20 }), { gain: .04 });
ding(47.35, 1568, .035);
// 24 fim
whip(48.6, 1); F(49.4, X.shimmer({ dur: 1.4, f: 660, seed: S() }), { gain: .03, fi: .2, fo: .4 }); pop(49.4, 700, .06); pop(49.6, 880, .05);

const SR = X.SR, n = fx.n, M = [new Float32Array(n), new Float32Array(n)];
let pk = 0; for (let i = 0; i < n; i++) { const f = Math.min(1, (n - i) / (.15 * SR)); M[0][i] = fx.L[i] * f; M[1][i] = fx.R[i] * f; pk = Math.max(pk, Math.abs(M[0][i]), Math.abs(M[1][i])); }
const gain = .89 / pk; for (const b of M) for (let i = 0; i < n; i++) b[i] *= gain;
X.writeWav(process.env.SFX_OUT || require('path').join(require('os').tmpdir(), '22-sfx.wav'), M[0], M[1]);
console.log(`pronto · pico ${pk.toFixed(3)} → ganho ${gain.toFixed(3)}`);
