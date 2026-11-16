// SFX do 23 (Ele escapou por 40 anos, true crime). Tempos = sets.js. Uso: SFX_OUT=arquivo.wav node demos/23-ele-escapou-por-40-anos/sfx.cjs
'use strict';
const X = require('../../tools/sfx-lib.js');
const DUR = 55.7, fx = new X.Bus(DUR);
let seed = 2300; const S = () => ++seed;
const F = (t, b, o) => fx.add(t, b, o);
const whoosh = (t, g = .07, d = 1) => F(t - .08, X.whoosh({ dur: .45, f0: 300, f1: 2400, peak: .5, seed: S() }), { gain: g, pan: -.5 * d, panEnd: .5 * d });
const dip = t => F(t - .2, X.whoosh({ dur: .6, f0: 1400, f1: 200, peak: .6, seed: S() }), { gain: .05 });
const stamp = (t, g = .15) => F(t, X.stamp({ seed: S() }), { gain: g, rev: .35 });
const boom = (t, g = .11) => F(t, X.impact({ dur: 1.4, f0: 70, f1: 30, noise: .3, seed: S() }), { gain: g, rev: .4 });
const paper = (t, g = .04, p = 0) => F(t, X.paper({ dur: .2, seed: S(), dens: 120 }), { gain: g, pan: p });
const key = (t, g = .05) => F(t, X.woodClick({ seed: S(), f: 2100 }), { gain: g });
const tick = (t, g = .025, f = 2600) => F(t, X.tick({ f, seed: S() }), { gain: g });

// 1 porta / chuva
F(0, X.wind({ dur: 2.3, seed: S(), lo: 300, hi: 1400 }), { gain: .05, fi: .3, fo: .4 });
F(.2, X.creak({ dur: 1.2, seed: S(), f: 500 }), { gain: .03, rev: .5 }); stamp(1.04, .14); boom(1.04, .07);
// 2 hélice + cartão
dip(2.19); F(2.3, X.shimmer({ dur: 1.4, f: 440, seed: S() }), { gain: .03 }); paper(3.65, .05); F(3.8, X.zip({ dur: .5, f0: 500, f1: 1600, seed: S(), peak: .5 }), { gain: .02 });
// 3–4 bairro
whoosh(4.72, .06); F(4.9, X.hum({ dur: 3.4, f: 110, seed: S(), flick: .2 }), { gain: .025, fi: .3, fo: .4 }); key(4.8); key(4.95);
for (let i = 0; i < 10; i++) tick(6.75 + i * .14, .02, 1800 + i * 90);
// 5 treze
whoosh(8.52, .07, -1); for (let i = 0; i < 13; i++) paper(8.8 + i * .085, .045, (i % 3 - 1) * .3);
// 6 vazio
dip(9.93); F(10.4, X.shimmer({ dur: 1.2, f: 330, seed: S() }), { gain: .025 }); stamp(11.21, .13);
// 7 mesa
whoosh(12.22, .05); F(12.5, X.metal({ f: 2400, dur: .5, decay: 14, seed: S() }), { gain: .025 }); F(14.04, X.blip({ f: 330, f1: 660, dur: .5, decay: 5 }), { gain: .04, rev: .4 }); whoosh(14.9, .04, -1);
// 8 banco de dados
whoosh(16.56, .07); F(16.7, X.scanner({ dur: 1.4, seed: S() }), { gain: .03 }); for (let i = 0; i < 12; i++) F(16.75 + i * .11, X.beep({ f: 1800, dur: .04 }), { gain: .008 });
F(18.13, X.beep({ f: 220, dur: .35 }), { gain: .05 }); boom(18.13, .06);
// 9 fantasma
dip(19.63); F(19.8, X.whisper({ dur: 1.6, seed: S() }), { gain: .02, rev: .6 }); F(20.4, X.shimmer({ dur: 1.5, f: 294, seed: S() }), { gain: .03 });
// 10 2018
whoosh(22.43, .06); stamp(22.92, .15); boom(22.92, .07); for (let i = 0; i < 6; i++) key(23.6 + i * .17, .035);
// 11–12 site
whoosh(25.68, .06, -1); F(25.9, X.blip({ f: 440, f1: 880, dur: 1.4, decay: 2 }), { gain: .02 }); F(27.4, X.blip({ f: 1046, dur: .3, decay: 9 }), { gain: .03 });
for (let i = 0; i < 12; i++) F(28.45 + i * .07, X.pop({ f: 500 + i * 30, seed: S() }), { gain: .025, pan: (i % 3 - 1) * .3 });
F(30.26, X.beep({ f: 200, dur: .3 }), { gain: .05 });
// 13–16 árvore
whoosh(31.48, .06); [31.72, 33.0, 33.35].forEach(t => { paper(t, .05); F(t + .05, X.blip({ f: 880, dur: .5, decay: 7 }), { gain: .02 }); });
for (let i = 0; i < 16; i++) paper(33.65 + i * .1, .03, (i % 5 - 2) * .2);
for (let i = 0; i < 6; i++) F(33.9 + i * .3, X.zip({ dur: .3, f0: 600, f1: 1400, seed: S(), peak: .5 }), { gain: .012 });
[37.43, 37.82, 38.45].forEach(t => { F(t, X.whoosh({ dur: .6, f0: 1200, f1: 200, peak: .3, seed: S() }), { gain: .05 }); F(t + .5, X.paper({ dur: .4, seed: S(), dens: 160 }), { gain: .04 }); });
F(38.89, X.blip({ f: 660, dur: .7, decay: 5 }), { gain: .04, rev: .4 }); key(39.29, .05); key(39.76, .05);
// 16 nome à máquina
for (let i = 0; i < 12; i++) key(41.0 + i * .045 * 1, .04); for (let i = 0; i < 8; i++) key(41.78 + i * .06, .04); F(42.3, X.metal({ f: 1800, dur: .6, decay: 10, seed: S() }), { gain: .03 });
// 17–18 carro / maçaneta
whoosh(42.55, .07, -1); F(42.6, X.wind({ dur: 5, seed: S(), lo: 300, hi: 1200 }), { gain: .03, fi: .4, fo: .5 }); stamp(42.6, .06); stamp(43.72, .06);
F(45.3, X.paper({ dur: .5, seed: S(), dens: 60, hp: 3000 }), { gain: .03 }); F(45.9, X.scribble({ dur: .8, seed: S(), rate: 5 }), { gain: .025 }); F(46.2, X.shimmer({ dur: 1.2, f: 523, seed: S() }), { gain: .02 });
// 19 bateu
F(47.5, X.whoosh({ dur: .3, f0: 300, f1: 4000, peak: .9, seed: S() }), { gain: .07 }); boom(47.7, .13); stamp(47.78, .18);
// 20 fantasma na árvore
dip(48.44); F(48.7, X.shimmer({ dur: 1.4, f: 392, seed: S() }), { gain: .03 }); stamp(49.45, .1);
// 21–22 pergunta / fim
whoosh(50.64, .05); F(50.8, X.hum({ dur: 2.6, f: 98, seed: S(), flick: .05 }), { gain: .02, fi: .4, fo: .6 });
dip(53.53); paper(53.7, .05); F(54.35, X.blip({ f: 523, dur: .8, decay: 4 }), { gain: .03, rev: .5 });

const SR = X.SR, n = fx.n, M = [new Float32Array(n), new Float32Array(n)];
let pk = 0; for (let i = 0; i < n; i++) { const f = Math.min(1, (n - i) / (.15 * SR)); M[0][i] = fx.L[i] * f; M[1][i] = fx.R[i] * f; pk = Math.max(pk, Math.abs(M[0][i]), Math.abs(M[1][i])); }
const gain = .89 / pk; for (const b of M) for (let i = 0; i < n; i++) b[i] *= gain;
X.writeWav(process.env.SFX_OUT || require('path').join(require('os').tmpdir(), '23-sfx.wav'), M[0], M[1]);
console.log(`pronto · pico ${pk.toFixed(3)} → ganho ${gain.toFixed(3)}`);
