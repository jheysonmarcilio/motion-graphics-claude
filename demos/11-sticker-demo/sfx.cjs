// SFX do 11 (demo estilo Sticker, sem narração): bocejos cartunescos (sopro + apito descendo), dominó de bocejos
// subindo de tom, passos, BONK no poste, pães caindo, estrelinhas, coração, ondas na praça, carimbo final.
// Tempos = main.js. Uso: SFX_OUT=arquivo.wav node demos/11-sticker-demo/sfx.cjs
'use strict';
const X = require('../../tools/sfx-lib.js');
const DUR = 30, fx = new X.Bus(DUR);
let seed = 1100; const S = () => ++seed;
const F = (t, b, o) => fx.add(t, b, o);
const yawn = (t, f = 620, g = .14, d = .9, p = 0) => { // sopro + apito descendo (bocejo de desenho)
	F(t, X.breath({ dur: d, seed: S() }), { gain: g * .8, pan: p, rev: .2 });
	F(t + .05, X.blip({ f, f1: f * .45, dur: d * .9, decay: 2.2, harm: .2, att: .08 }), { gain: g * .55, pan: p, rev: .25 });
};
const pop = (t, f = 600, g = .08, p = 0) => F(t, X.pop({ f, seed: S() }), { gain: g, pan: p, rev: .15 });
const swoosh = (t, g = .1, d = 1) => F(t, X.whoosh({ dur: .45, f0: 300, f1: 2800, peak: .45, seed: S() }), { gain: g, pan: .6 * d, panEnd: -.6 * d });
const step = (t, g = .035, p = 0) => F(t, X.woodClick({ seed: S(), f: 900 }), { gain: g, pan: p });

// ambiente: pássaros de dia, murmúrio leve na praça
F(0, X.birds({ dur: 16.8, seed: S(), dens: 1.1 }), { gain: .05, fi: .5, fo: 1 });
F(2.7, X.murmur({ dur: 3.5, seed: S(), voices: 4 }), { gain: .03, fi: .4, fo: .6 });
F(21.8, X.murmur({ dur: 4, seed: S(), voices: 6 }), { gain: .035, fi: .5, fo: .8 });
// 1 · Zé
yawn(.75, 560, .16, 1.2, -.1); pop(.3, 700, .04); pop(.5, 760, .04); pop(.75, 820, .05);
F(2.66, X.whoosh({ dur: .35, f0: 2000, f1: 500, peak: .3, seed: S() }), { gain: .06 });
F(2.7, X.impact({ dur: .6, f0: 160, f1: 60, noise: .4, seed: S() }), { gain: .07 });
// 2 · praça
swoosh(3.0, .06, -1);
// 3 · padeira: passos, "?", bocejo, "!"
for (let t = 6.25; t < 9.4; t += .6) step(t, .03, -.3 + (t - 6.2) * .2);
yawn(6.4, 520, .1, .9, -.4); pop(6.88, 900, .07, .2); yawn(7.6, 680, .14, 1.1, .1); pop(8.78, 1000, .08, .2);
// 4 · fila: dominó de bocejos subindo de tom
F(9.4, X.whoosh({ dur: .3, f0: 800, f1: 2000, peak: .5, seed: S() }), { gain: .04 });
for (let j = 0; j < 6; j++) yawn(9.75 + .42 * j, 480 + j * 70, .1, .75, -.5 + j * .2);
yawn(12.35, 1050, .12, .8, .5); pop(13.0, 1200, .05, .5);
// 5 · entregador → BONK
F(13.05, X.whoosh({ dur: .4, f0: 2500, f1: 400, peak: .4, seed: S() }), { gain: .12, pan: .7, panEnd: -.7 });
for (let t = 13.25; t < 14.6; t += .47) step(t, .04);
yawn(13.7, 600, .12, .85);
F(14.6, X.metal({ f: 380, dur: 1.4, decay: 3, seed: S() }), { gain: .22, rev: .3 });
F(14.6, X.knock({ f: 150, seed: S() }), { gain: .25 });
F(14.6, X.impact({ dur: .9, f0: 120, f1: 40, noise: .4, seed: S() }), { gain: .16 });
for (let i = 0; i < 3; i++) { pop(14.65 + i * .05, 500 + i * 120, .05, -.4 + .4 * i); F(15.05 + i * .17, X.knock({ f: 300 + i * 40, seed: S() }), { gain: .06, pan: -.4 + .4 * i }); }
F(14.95, X.sparkle({ dur: 1.8, seed: S(), dens: 14 }), { gain: .05 });
F(14.85, X.blip({ f: 900, f1: 1400, dur: .5, decay: 3 }), { gain: .03 }); F(15.25, X.blip({ f: 1400, f1: 900, dur: .5, decay: 3 }), { gain: .03 });
// 6 · café ao pôr do sol
F(16.75, X.shimmer({ dur: 1.4, f: 660, peak: .3, seed: S() }), { gain: .04 });
F(17.0, X.metal({ f: 2400, dur: .4, decay: 12, seed: S() }), { gain: .02, pan: .3 }); // xícara
yawn(17.6, 600, .12, 1.0, -.3); for (let i = 0; i < 6; i++) pop(17.9 + i * .08, 1300 + i * 90, .025, -.3 + i * .12);
yawn(18.45, 480, .12, 1.0, .3);
for (let i = 0; i < 6; i++) pop(19.7 + i * .09, 700 + (i % 3) * 120, .04, (i % 2 ? .3 : -.3)); // risadinhas
pop(19.78, 880, .07); F(19.82, X.blip({ f: 1318, dur: .9, decay: 5 }), { gain: .04, rev: .5 });
for (let i = 0; i < 3; i++) pop(19.0 + i * .26, 600 + i * 60, .03);
// 7 · onda na praça
for (const t of [22.0, 22.9, 23.8]) F(t, X.shimmer({ dur: 1.6, f: 523 + (t - 22) * 120, peak: .25, seed: S() }), { gain: .04, rev: .4 });
for (let i = 0; i < 10; i++) yawn(22.25 + (5.5 + (i % 3) * 3.2) * .11 + i * .01, 400 + (i % 5) * 90, .045, .7, -.7 + (i % 5) * .35);
F(25.6, X.whoosh({ dur: .4, f0: 400, f1: 2800, peak: .5, seed: S() }), { gain: .11, pan: -.6, panEnd: .6 });
// 8 · cachorro + carimbo
pop(26.0, 760, .04); yawn(26.75, 900, .16, 1.1);
F(27.55, X.stamp({ seed: S() }), { gain: .3, rev: .3 }); F(27.55, X.impact({ dur: 1.1, f0: 90, f1: 34, noise: .3, seed: S() }), { gain: .16, rev: .3 });
for (let i = 0; i < 4; i++) pop(28.2 + i * .14, 900 + i * 110, .05, (i % 2 ? .4 : -.4));
F(28.3, X.sparkle({ dur: 1.4, seed: S(), dens: 20 }), { gain: .04 });

const SR = X.SR, n = fx.n, M = [new Float32Array(n), new Float32Array(n)];
let pk = 0; for (let i = 0; i < n; i++) { const f = Math.min(1, (n - i) / (.15 * SR)); M[0][i] = fx.L[i] * f; M[1][i] = fx.R[i] * f; pk = Math.max(pk, Math.abs(M[0][i]), Math.abs(M[1][i])); }
const gain = .89 / pk; for (const b of M) for (let i = 0; i < n; i++) b[i] *= gain;
X.writeWav(process.env.SFX_OUT || require('path').join(require('os').tmpdir(), '11-sfx.wav'), M[0], M[1]);
console.log(`pronto · pico ${pk.toFixed(3)} → ganho ${gain.toFixed(3)}`);
