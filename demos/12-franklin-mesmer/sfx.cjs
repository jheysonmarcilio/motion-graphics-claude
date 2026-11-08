// SFX do 12 (Franklin × Mesmer, estilo Sticker). Tempos = main.js / words.json. Uso: SFX_OUT=arquivo.wav node demos/12-franklin-mesmer/sfx.cjs
'use strict';
const X = require('../../tools/sfx-lib.js');
const DUR = 60.4, fx = new X.Bus(DUR);
let seed = 1200; const S = () => ++seed;
const F = (t, b, o) => fx.add(t, b, o);
const pop = (t, f = 600, g = .08, p = 0) => F(t, X.pop({ f, seed: S() }), { gain: g, pan: p, rev: .15 });
const whip = (t, d = 1, g = .12) => F(t, X.whoosh({ dur: .4, f0: 400, f1: 3000, peak: .45, seed: S() }), { gain: g, pan: -.6 * d, panEnd: .6 * d });
const thud = (t, g = .2) => { F(t, X.knock({ f: 140, seed: S() }), { gain: g }); F(t, X.impact({ dur: .8, f0: 110, f1: 40, noise: .4, seed: S() }), { gain: g * .7 }); };
const chime = (t, f, g = .04) => F(t, X.blip({ f, dur: .9, decay: 5 }), { gain: g, rev: .5 });
const sparkle = (t, g = .05, d = 1.4) => F(t, X.sparkle({ dur: d, seed: S(), dens: 22 }), { gain: g });
const swirl = (t, d = 2, g = .06) => F(t, X.swirl({ dur: d, seed: S(), rate: .7 }), { gain: g, fi: .2, fo: .4 });
const step = (t, g = .035, p = 0) => F(t, X.woodClick({ seed: S(), f: 900 }), { gain: g, pan: p });
const glassNote = (t, f, d = .8, g = .06) => { F(t, X.tone({ f, dur: d, att: .12, vib: .004 }), { gain: g, rev: .6, fo: .3 }); F(t, X.tone({ f: f * 2, dur: d * .8, att: .1 }), { gain: g * .25, rev: .6, fo: .3 }); };

// Versalhes
F(0, X.whoosh({ dur: .5, f0: 2000, f1: 400, peak: .3, seed: S() }), { gain: .06 });
pop(1.95, 700, .06); F(1.9, X.curtain({ dur: 1.2, seed: S() }), { gain: .03 });
F(3.5, X.whoosh({ dur: .3, f0: 2200, f1: 600, peak: .3, seed: S() }), { gain: .07 }); F(3.55, X.impact({ dur: .6, f0: 160, f1: 60, noise: .4, seed: S() }), { gain: .08 });
// salão: murmúrio e velas
F(3.55, X.murmur({ dur: 4.7, seed: S(), voices: 4 }), { gain: .025, fi: .3, fo: .5 });
F(10.45, X.murmur({ dur: 17.8, seed: S(), voices: 5 }), { gain: .022, fi: .5, fo: .8 });
F(5.85, X.shimmer({ dur: .6, f: 1200, peak: .2, seed: S() }), { gain: .06 }); sparkle(5.9, .06, .6);
thud(6.15, .22); sparkle(6.45, .04, 1);
for (let k = 0; k < 3; k++) chime(7.45 + k * .2, [1318, 1568, 1760][k], .025);
// rua
whip(8.15, 1); F(8.3, X.cityBed ? X.murmur({ dur: 2.2, seed: S(), voices: 7 }) : X.murmur({ dur: 2.2, seed: S() }), { gain: .04, fi: .2, fo: .3 });
for (let k = 0; k < 4; k++) pop(8.6 + k * .35, 500 + k * 60, .03, -.5 + k * .3);
// Mesmer entra
for (let t = 10.6; t < 12.8; t += .42) step(t, .04);
F(12.2, X.shimmer({ dur: .8, f: 1568, peak: .2, seed: S() }), { gain: .05 }); chime(12.25, 2093, .03);
// banheira: zumbido magnético + varetas
F(12.85, X.hum({ dur: 3.4, f: 110, seed: S(), buzz: .15 }), { gain: .03, fi: .4, fo: .5 });
F(15.45, X.shimmer({ dur: .9, f: 988, peak: .3, seed: S() }), { gain: .06 }); sparkle(15.5, .05, .8);
// harmônica de vidro (inventada pelo Franklin)
[[16.45, 523], [16.95, 659], [17.45, 784], [17.95, 880], [18.45, 784], [18.95, 659]].forEach(([t, f]) => glassNote(t, f, .9, .055));
// Franklin: "?" e o soco de zoom
whip(19.27, -1); pop(19.92, 900, .06); F(20.55, X.whoosh({ dur: .25, f0: 600, f1: 2400, peak: .6, seed: S() }), { gain: .06 }); F(20.6, X.knock({ f: 220, seed: S() }), { gain: .1 });
// o show
F(22.62, X.blip({ f: 520, f1: 330, dur: .9, decay: 1.8, harm: .3, att: .05 }), { gain: .05, pan: -.3 }); // choro
for (let k = 0; k < 6; k++) pop(23.62 + k * .09, 700 + (k % 3) * 140, .045); // risada
thud(24.4, .2); F(24.5, X.ratchet({ dur: .5, n: 10, f: 1800, seed: S() }), { gain: .03 }); sparkle(24.6, .03, .7);
// fluido invisível
swirl(25.6, 2.2, .06); F(25.7, X.shimmer({ dur: 1.8, f: 659, peak: .4, seed: S() }), { gain: .05, rev: .4 });
F(27.5, X.whoosh({ dur: .6, f0: 2500, f1: 300, peak: .3, seed: S() }), { gain: .05 });
// jardim
whip(28.1, 1); F(28.95, X.click({ seed: S(), f: 2600 }), { gain: .04 });
F(28.25, X.birds({ dur: 20.4, seed: S(), dens: 1.2 }), { gain: .05, fi: .6, fo: 1 });
F(29.55, X.wind({ dur: 19, seed: S() }), { gain: .02, fi: 1, fo: 1 });
F(31.0, X.paper({ dur: .35, seed: S(), dens: 160 }), { gain: .05 }); // venda
F(33.85, X.shimmer({ dur: 1.1, f: 784, peak: .3, seed: S() }), { gain: .05, rev: .4 }); sparkle(33.95, .04, 1);
// abraços nas árvores
for (const t of [34.95, 36.05, 37.1, 38.0]) F(t, X.knock({ f: 160, seed: S() }), { gain: .07 });
for (const [a, b] of [[35.5, 36.0], [36.6, 37.05], [37.65, 37.95]]) for (let t = a; t < b; t += .15) step(t, .045);
F(36.87, X.drop({ seed: S() }), { gain: .05 }); F(37.15, X.drop({ seed: S() }), { gain: .04 });
F(37.42, X.breath({ dur: .22, seed: S() }), { gain: .08 }); F(37.68, X.breath({ dur: .2, seed: S() }), { gain: .07 });
F(38.3, X.whoosh({ dur: .3, f0: 1500, f1: 300, peak: .5, seed: S() }), { gain: .05 }); thud(38.45, .24); sparkle(38.75, .05, 1.2);
// a magnetizada era outra
whip(39.75, 1); pop(40.42, 820, .07); chime(40.48, 1318, .04);
F(43.2, X.whoosh({ dur: .4, f0: 3000, f1: 800, peak: .2, seed: S() }), { gain: .05 }); pop(43.22, 380, .08);
swirl(45.1, 1.1, .05); chime(45.2, 988, .03);
// relatório + carimbo
F(46.2, X.paper({ dur: .7, seed: S(), dens: 90 }), { gain: .05 });
F(47.6, X.whoosh({ dur: .27, f0: 500, f1: 1600, peak: .7, seed: S() }), { gain: .05 });
F(47.87, X.stamp({ seed: S() }), { gain: .3, rev: .3 }); F(47.87, X.impact({ dur: 1, f0: 90, f1: 34, noise: .3, seed: S() }), { gain: .14 });
// 1841: relógio do consultório + objeto brilhante
F(48.7, X.shimmer({ dur: 1.2, f: 523, peak: .3, seed: S() }), { gain: .04, rev: .4 });
for (let t = 49.0; t < 54.4; t += 1) F(t, X.tick({ f: 2400, seed: S() }), { gain: .03 });
for (let k = 0; k < 3; k++) chime(49.7 + k * .9, 2093, .02);
swirl(51.0, 2.4, .045);
F(53.5, X.impact({ dur: 1.3, f0: 80, f1: 32, noise: .3, seed: S() }), { gain: .16 }); F(53.55, X.shimmer({ dur: 2.2, f: 880, peak: .2, seed: S() }), { gain: .06, rev: .5 }); sparkle(53.6, .05, 1.6);
// final
pop(55.72, 640, .05); F(57.25, X.drop({ seed: S() }), { gain: .04 }); swirl(58.0, .7, .05);
F(58.66, X.stamp({ seed: S() }), { gain: .3, rev: .3 }); F(58.66, X.impact({ dur: 1.2, f0: 85, f1: 32, noise: .3, seed: S() }), { gain: .15 });
for (let k = 0; k < 5; k++) pop(59.3 + k * .1, 800 + (k % 3) * 130, .045, (k % 2 ? .4 : -.4));

const SR = X.SR, n = fx.n, M = [new Float32Array(n), new Float32Array(n)];
let pk = 0; for (let i = 0; i < n; i++) { const f = Math.min(1, (n - i) / (.15 * SR)); M[0][i] = fx.L[i] * f; M[1][i] = fx.R[i] * f; pk = Math.max(pk, Math.abs(M[0][i]), Math.abs(M[1][i])); }
const gain = .89 / pk; for (const b of M) for (let i = 0; i < n; i++) b[i] *= gain;
X.writeWav(process.env.SFX_OUT || require('path').join(require('os').tmpdir(), '12-sfx.wav'), M[0], M[1]);
console.log(`pronto · pico ${pk.toFixed(3)} → ganho ${gain.toFixed(3)}`);
