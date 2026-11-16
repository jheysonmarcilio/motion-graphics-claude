// SFX do 25 (Quatro maridos morreram à mesa, true crime). Tempos = sets.js. Uso: SFX_OUT=arquivo.wav node demos/25-quatro-maridos-morreram-a-mesa/sfx.cjs
'use strict';
const X = require('../../tools/sfx-lib.js');
const DUR = 62.9, fx = new X.Bus(DUR);
let seed = 2500; const S = () => ++seed;
const F = (t, b, o) => fx.add(t, b, o);
const whoosh = (t, g = .07, d = 1) => F(t - .08, X.whoosh({ dur: .45, f0: 300, f1: 2400, peak: .5, seed: S() }), { gain: g, pan: -.5 * d, panEnd: .5 * d });
const dip = t => F(t - .2, X.whoosh({ dur: .6, f0: 1400, f1: 200, peak: .6, seed: S() }), { gain: .05 });
const stamp = (t, g = .15) => F(t, X.stamp({ seed: S() }), { gain: g, rev: .35 });
const boom = (t, g = .11) => F(t, X.impact({ dur: 1.4, f0: 70, f1: 30, noise: .3, seed: S() }), { gain: g, rev: .4 });
const paper = (t, g = .04, p = 0) => F(t, X.paper({ dur: .2, seed: S(), dens: 120 }), { gain: g, pan: p });
const key = (t, g = .05) => F(t, X.woodClick({ seed: S(), f: 2100 }), { gain: g });
const clink = (t, g = .03, f = 2600) => F(t, X.metal({ f, dur: .5, decay: 14, seed: S() }), { gain: g });

// 1–3 mesa / cozinha / xícara
F(0, X.hum({ dur: 3.6, f: 98, seed: S(), flick: .1 }), { gain: .025, fi: .2, fo: .4 }); boom(.35, .07); clink(.6, .02);
whoosh(1.18, .06); dip(2.21); F(2.4, X.wind({ dur: 1, seed: S(), lo: 400, hi: 1200 }), { gain: .025, fi: .2, fo: .3 }); clink(3.3, .03, 3000);
// 4 casa na chuva
whoosh(3.61, .06, -1); F(3.6, X.wind({ dur: 2.6, seed: S(), lo: 300, hi: 1500 }), { gain: .05, fi: .3, fo: .4 }); stamp(3.66, .06); stamp(4.45, .08);
// 5 Samuel passa mal (lâmpada falha)
dip(6.23); F(6.9, X.hum({ dur: 1.9, f: 120, seed: S(), flick: .6 }), { gain: .035, fi: .1, fo: .3 }); clink(7.2, .025, 1800);
// 6–7 hospital, alta
whoosh(8.78, .07); for (let i = 0; i < 6; i++) F(9.0 + i * .45, X.beep({ f: 1000, dur: .06 }), { gain: .012 }); stamp(11.34, .13);
// 8–9 café e morre
whoosh(11.99, .05); clink(13.3, .035, 2800); F(14.31, X.whoosh({ dur: .3, f0: 2000, f1: 200, peak: .2, seed: S() }), { gain: .05 }); boom(14.31, .12);
// 10 médico / autópsia
dip(15.18); paper(15.6, .04); stamp(16.68, .15);
// 11 arsênico / veneno de rato
whoosh(17.49, .06, -1); F(18.28, X.shimmer({ dur: 1.2, f: 330, seed: S() }), { gain: .03 }); F(19.15, X.zip({ dur: .4, f0: 400, f1: 1200, seed: S(), peak: .5 }), { gain: .03 }); clink(19.6, .03, 1500);
// 12 máquina de escrever
whoosh(20.43, .05); for (let i = 0; i < 11; i++) key(21.35 + i * .055, .04); F(22.0, X.metal({ f: 1800, dur: .6, decay: 10, seed: S() }), { gain: .03 });
// 13–14 avó, família
dip(22.38); F(23.18, X.shimmer({ dur: 1.2, f: 523, seed: S() }), { gain: .025 }); whoosh(24.2, .06); clink(24.6, .02); clink(25.0, .02, 3200);
// 15 arquivo
whoosh(25.71, .05, -1); F(25.85, X.zip({ dur: .4, f0: 300, f1: 900, seed: S(), peak: .5 }), { gain: .04 }); [26.27, 26.6, 26.99].forEach(t => paper(t, .05));
// 16–17 três cadeiras apagam
dip(27.61); [28.73, 29.04, 29.7].forEach(t => boom(t, .06)); whoosh(30.48, .05); whoosh(31.63, .05, -1);
// 18–19 atestados NATURAL
dip(32.98); [34.41, 34.62, 34.83].forEach(t => stamp(t, .12)); whoosh(35.17, .05); [35.2, 36.13, 37.08].forEach(t => paper(t, .04));
// 20 rua
whoosh(37.99, .05); F(38, X.wind({ dur: 2.6, seed: S(), lo: 300, hi: 1000 }), { gain: .03, fi: .3, fo: .4 });
// 21 interrogatório
dip(40.65); F(40.7, X.hum({ dur: 1.9, f: 110, seed: S(), flick: .05 }), { gain: .025, fi: .2, fo: .3 });
// 22 jornal / flashes
whoosh(42.53, .08); boom(42.75, .08); [42.75, 43.3, 43.9].forEach(t => F(t, X.blip({ f: 2400, dur: .2, decay: 20 }), { gain: .03 }));
// 23 confessou (gravador)
dip(45.03); F(45.2, X.hum({ dur: 1.1, f: 60, seed: S(), flick: 0 }), { gain: .03, fi: .1, fo: .3 }); key(45.1, .05);
// 24 comida / café / bebida
whoosh(46.26, .06); clink(46.4, .03, 1600); whoosh(47.61, .05, -1); clink(47.8, .03, 2800); whoosh(48.52, .05); clink(48.7, .03, 3400);
// 25 alianças
whoosh(49.46, .05); [49.5, 49.95, 50.42, 50.87].forEach((t, i) => clink(t, .03, 3000 + i * 300));
// 26 condenada
dip(51.67); stamp(51.9, .17); boom(51.9, .12); stamp(53.72, .07); F(54.0, X.metal({ f: 220, dur: 1.2, decay: 4, seed: S() }), { gain: .04 });
// 27 três reacendem
whoosh(54.96, .05); [55.22, 55.76, 56.11].forEach((t, i) => F(t, X.shimmer({ dur: .8, f: 392 + i * 98, seed: S() }), { gain: .025 }));
// 28–30 café, sorriso, CTA
dip(56.82); F(57.0, X.zip({ dur: .4, f0: 300, f1: 1000, seed: S(), peak: .5 }), { gain: .03 }); dip(58.37); F(58.6, X.shimmer({ dur: 1.4, f: 294, seed: S() }), { gain: .035 });
dip(60.35); F(60.4, X.blip({ f: 523, dur: .8, decay: 4 }), { gain: .03, rev: .5 }); paper(61.2, .04);

const SR = X.SR, n = fx.n, M = [new Float32Array(n), new Float32Array(n)];
let pk = 0; for (let i = 0; i < n; i++) { const f = Math.min(1, (n - i) / (.15 * SR)); M[0][i] = fx.L[i] * f; M[1][i] = fx.R[i] * f; pk = Math.max(pk, Math.abs(M[0][i]), Math.abs(M[1][i])); }
const gain = .89 / pk; for (const b of M) for (let i = 0; i < n; i++) b[i] *= gain;
X.writeWav(process.env.SFX_OUT || require('path').join(require('os').tmpdir(), '25-sfx.wav'), M[0], M[1]);
console.log(`pronto · pico ${pk.toFixed(3)} → ganho ${gain.toFixed(3)}`);
