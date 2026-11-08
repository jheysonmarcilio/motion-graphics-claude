// Efeitos sonoros do Short 05 (explainer flat): whips, pops, toque de chamada, toc no vidro, papel, cesta, medidor, carimbo.
// Sem voz e sem música. Tempos = narração gravada (= cenas.js).
// Uso: node demos/05-hipnotizar-online/sfx.cjs → renders/05-hipnotizar-online-sfx.wav
'use strict';
const path = require('path');
const X = require('../../tools/sfx-lib.js');
const { Bus, writeWav } = X;

const DUR = 107.6;
const fx = new Bus(DUR), amb = new Bus(DUR);
let seed = 500; const S = () => ++seed;
const F = (t, b, o) => fx.add(t, b, o), A = (t, b, o) => amb.add(t, b, o);
const whip = (t, d = .45, g = .08) => F(t - d / 2 - .05, X.whoosh({ dur: d + .2, f0: 400, f1: 2600, peak: .55, seed: S(), body: .25 }), { gain: g, pan: -.4, panEnd: .4 });
const pop = (t, f = 600, g = .07, p = 0) => F(t, X.pop({ f, seed: S() }), { gain: g, pan: p, rev: .15 });
const click = (t, g = .06, p = 0) => F(t, X.click({ seed: S(), f: 1800 }), { gain: g, pan: p, rev: .1 });
const knock = (t, g = .1, p = 0, f = 200) => F(t, X.knock({ f, seed: S() }), { gain: g, pan: p, rev: .2 });
const chime = (t, f, g = .05, p = 0) => F(t, X.blip({ f, dur: .9, decay: 5 }), { gain: g, pan: p, rev: .5 });
const ding = (t, g = .06) => { chime(t, 1318, g); chime(t + .16, 1760, g * .8); };
const tick = (t, g = .05, p = 0, f = 3000) => F(t, X.tick({ f, dur: .04, seed: S(), decay: 220 }), { gain: g, pan: p, rev: .15 });

A(0, X.roomTone(DUR, 5), { gain: .045, fi: .5, fo: 1 });

// whip pans: toda troca de folha
const SHOTS = [5.95, 11.9, 14.9, 17.9, 20.85, 23.85, 26.85, 29.8, 37.7, 41.7, 47.7, 49.2, 53.6, 56.6, 59.5, 65.5, 68.5, 71.5, 74.45, 77.4, 84.5, 86.4, 89.3, 95.3, 101.2];
SHOTS.forEach(t => whip(t));

// 0 · notebook + chamada
click(.1, .08); F(.15, X.whoosh({ dur: .7, f0: 300, f1: 1200, peak: .4, seed: S() }), { gain: .05 });
pop(.9, 700, .06);
F(2.95, X.whoosh({ dur: .6, f0: 2000, f1: 500, peak: .4, seed: S() }), { gain: .07 });          // zoom through
[[1.7, 880], [1.85, 1175], [2.35, 880], [2.5, 1175]].forEach(([t, f]) => F(t, X.beep({ f, dur: .12 }), { gain: .025, rev: .3 }));   // tocando
chime(3.2, 988, .05); chime(3.32, 1318, .05);                                                     // conectou
pop(3.15, 520, .06, -.3); pop(3.25, 620, .06, .3);
// 1 · Elman
knock(6.6, .08, -.2, 140); F(6.5, X.whoosh({ dur: .5, f0: 600, f1: 1800, peak: .4, seed: S() }), { gain: .05, pan: .4 });
pop(9.05, 640, .06, .3); F(9.3, X.ratchet({ dur: 2.0, n: 20, f: 2600, accel: 1, seed: S() }), { gain: .04, pan: .3 });
[9.7, 10.2, 10.7, 11.2].forEach((t, i) => chime(t, 660 + i * 110, .035, .3));
F(11.3, X.sparkle({ dur: .8, seed: S(), dens: 30, peak: .3 }), { gain: .04 });
// 2 · cinco cartões
for (let i = 0; i < 5; i++) pop(12.0 + i * .38, 480 + i * 90, .07, (i - 2) * .2);
// passos
F(15.4, X.liquid({ dur: .5, seed: S() }), { gain: .06 }); pop(15.85, 380, .05); F(16.5, X.hum({ dur: 1.1, f: 180, seed: S(), buzz: .3 }), { gain: .015 });
pop(18.0, 560, .06, .3); F(18.5, X.drop({ seed: S() }), { gain: .06 }); F(19.0, X.drop({ seed: S() }), { gain: .04 }); knock(19.85, .12, .2, 120); F(19.86, X.liquid({ dur: .4, seed: S() }), { gain: .05 });
F(21.0, X.breath({ dur: 1.0, seed: S() }), { gain: .06 }); F(21.75, X.breath({ dur: 1.2, seed: S() }), { gain: .08 }); F(23.25, X.breath({ dur: 1.0, seed: S() }), { gain: .07 });
[24.2, 25.0, 25.8, 26.4].forEach((t, i) => { click(t + .05, .06, .3); if (i < 3) tick(t + .2, .05, .3, 2600 - i * 300); });
[27.0, 27.9, 28.75].forEach((t, i) => { pop(t, 600 - i * 40, .06, .2); F(t + .5, X.scribble({ dur: .35, seed: S(), rate: 9 }), { gain: .05, pan: .2 }); });
pop(29.4, 760, .06);
// 3 · checks + destaque
for (let i = 0; i < 5; i++) { tick(30.25 + i * .55, .05, 0, 3400); pop(30.2 + i * .55, 700 + i * 60, .04); }
knock(33.85, .08, 0, 110); pop(34.4, 520, .07, .3);
// 4 · mão bate no vidro
F(38.1, X.whoosh({ dur: .9, f0: 300, f1: 1400, peak: .8, seed: S() }), { gain: .06 });
knock(38.95, .18, .1, 420); F(38.96, X.glass({ seed: S() }), { gain: .07, pan: .2 }); pop(39.1, 900, .05, .3);
F(40.9, X.whoosh({ dur: .5, f0: 1200, f1: 400, peak: .4, seed: S() }), { gain: .04 });
// 5 · barra
for (let i = 0; i < 5; i++) pop(41.95 + i * .42, i === 1 ? 300 : 600 + i * 70, .06);
F(42.5, X.beep({ f: 330, dur: .18 }), { gain: .02 });
F(44.65, X.whoosh({ dur: .6, f0: 900, f1: 300, peak: .3, seed: S() }), { gain: .05 });
F(44.9, X.zip({ dur: .45, f0: 500, f1: 1800, seed: S(), peak: .8 }), { gain: .04 }); ding(45.3, .07); F(45.3, X.sparkle({ dur: 1.2, seed: S(), dens: 40, peak: .3 }), { gain: .05 });
// 6 · amassa, cesta
F(47.9, X.paper({ dur: .6, seed: S(), dens: 160 }), { gain: .09 }); F(48.55, X.whoosh({ dur: .6, f0: 500, f1: 2200, peak: .4, seed: S() }), { gain: .05, pan: .5 });
F(49.3, X.whoosh({ dur: 1.0, f0: 400, f1: 1600, peak: .6, seed: S() }), { gain: .05, pan: -.5, panEnd: 0 });
F(50.2, X.paper({ dur: .3, seed: S(), dens: 90 }), { gain: .06 }); knock(50.55, .14, 0, 150); pop(50.65, 700, .06, -.3);
F(51.0, X.paper({ dur: .2, seed: S(), dens: 60 }), { gain: .05 }); [51.6, 51.85].forEach(t => F(t, X.scribble({ dur: .25, seed: S(), rate: 10 }), { gain: .07 }));
// 7 · setas + hipnotizado + troca
[53.9, 54.5, 55.1].forEach(t => F(t, X.scribble({ dur: .45, seed: S(), rate: 6 }), { gain: .05, pan: -.3 }));
F(57.9, X.stamp({ seed: S() }), { gain: .12, rev: .2 }); chime(58.0, 784, .04);
F(61.85, X.whoosh({ dur: .4, f0: 800, f1: 2400, peak: .5, seed: S() }), { gain: .05 }); pop(62.2, 700, .07); F(62.2, X.sparkle({ dur: .7, seed: S(), dens: 30, peak: .3 }), { gain: .04 });
pop(65.9, 540, .05, .2); pop(66.0, 640, .05, -.3);
// 8 · punho e medidor
F(69.6, X.paper({ dur: .35, seed: S(), dens: 50, hp: 600 }), { gain: .07 }); knock(70.1, .08, 0, 160);
F(70.0, X.zip({ dur: .6, f0: 300, f1: 700, seed: S(), peak: .8 }), { gain: .03, pan: .3 });
[71.8, 72.1].forEach(t => F(t, X.scribble({ dur: .35, seed: S(), rate: 8 }), { gain: .08 })); pop(72.6, 500, .05, .3);
pop(74.7, 620, .06, -.3); pop(75.6, 520, .05, .3);
F(77.6, X.zip({ dur: 1.7, f0: 300, f1: 1100, seed: S(), peak: .9 }), { gain: .03, pan: .3 });
F(79.6, X.hum({ dur: 3.8, f: 110, seed: S(), buzz: .4, flick: .05 }), { gain: .02, fi: .3, fo: .2 });
F(80.2, X.zip({ dur: 1.1, f0: 800, f1: 2200, seed: S(), peak: .9 }), { gain: .03, pan: .3 });
pop(81.35, 900, .08, .4); F(81.35, X.sparkle({ dur: .7, seed: S(), dens: 30, peak: .3 }), { gain: .04, pan: .4 });
[82.5, 82.85, 83.2].forEach((t, i) => { knock(t, .1, 0, 240 - i * 30); tick(t, .05, 0, 2400); });
F(83.45, X.breath({ dur: 1.4, seed: S() }), { gain: .09 }); F(83.5, X.shimmer({ dur: 1.4, f: 523, peak: .2, seed: S() }), { gain: .04, rev: .5 });
// 9 · afundando
[84.3, 89.9, 91.2, 92.9].forEach((t, i) => F(t, X.whoosh({ dur: 1.0, f0: 900 - i * 120, f1: 250, peak: .3, seed: S() }), { gain: .045 }));
pop(86.6, 640, .05, .3); for (let t = 86.9; t < 89.2; t += 1.25) { F(t, X.paper({ dur: .2, seed: S(), dens: 40, hp: 600 }), { gain: .04, pan: .3 }); }
pop(89.7, 560, .07, -.3); pop(91.0, 600, .07, -.3);
// 10 · balança
F(95.5, X.creak({ dur: 1.8, seed: S(), f: 700 }), { gain: .04 }); ding(97.6, .06);
F(98.6, X.whoosh({ dur: .9, f0: 600, f1: 1800, peak: .5, seed: S() }), { gain: .05, pan: .4, panEnd: -.4 }); pop(99.2, 640, .05);
// 11 · final
pop(101.35, 560, .07, -.3); pop(102.1, 660, .07, .3);
F(104.3, X.stamp({ seed: S() }), { gain: .35, rev: .3 }); F(104.3, X.impact({ dur: 1.6, f0: 70, f1: 32, noise: .3, seed: S() }), { gain: .25, rev: .5 });
F(106.85, X.whoosh({ dur: .6, f0: 1400, f1: 400, peak: .5, seed: S() }), { gain: .04 }); click(107.45, .09);

// ── master ──
const SR = X.SR, n = fx.n, M = [new Float32Array(n), new Float32Array(n)];
const fadeOut = i => Math.min(1, (n - i) / (.1 * SR));
let pk = 0; for (let i = 0; i < n; i++) { const f = fadeOut(i); for (const [c, k] of [[0, 'L'], [1, 'R']]) { M[c][i] = (fx[k][i] + amb[k][i]) * f; pk = Math.max(pk, Math.abs(M[c][i])); } }
const gain = .89 / pk;
for (const b of M) for (let i = 0; i < n; i++) b[i] *= gain;
writeWav(path.resolve(__dirname, '../../renders/05-hipnotizar-online-sfx.wav'), M[0], M[1]);
console.log(`pronto · pico ${pk.toFixed(3)} → ganho ${gain.toFixed(3)} · ${DUR}s`);
