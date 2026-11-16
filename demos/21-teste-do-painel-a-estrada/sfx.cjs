// SFX do 21 (A estrada hipnótica, diorama de brinquedo). Tempos = main.js. Uso: SFX_OUT=arquivo.wav node demos/21-teste-do-painel-a-estrada/sfx.cjs
'use strict';
const X = require('../../tools/sfx-lib.js');
const DUR = 39, fx = new X.Bus(DUR);
let seed = 2100; const S = () => ++seed;
const F = (t, b, o) => fx.add(t, b, o);
const pop = (t, f = 600, g = .08, p = 0) => F(t, X.pop({ f, seed: S() }), { gain: g, pan: p, rev: .15 });
const whip = (t, d = 1, g = .12) => F(t, X.whoosh({ dur: .4, f0: 400, f1: 3000, peak: .45, seed: S() }), { gain: g, pan: -.6 * d, panEnd: .6 * d });
const chime = (t, f, g = .04) => F(t, X.blip({ f, dur: .9, decay: 5 }), { gain: g, rev: .5 });
const sparkle = (t, g = .05, d = 1.2) => F(t, X.sparkle({ dur: d, seed: S(), dens: 22 }), { gain: g });
const tick = (t, g = .03, f = 2400) => F(t, X.tick({ f, seed: S() }), { gain: g });
const stamp = (t, g = .16) => F(t, X.stamp({ seed: S() }), { gain: g, rev: .3 });

F(0, X.whoosh({ dur: .6, f0: 300, f1: 1800, peak: .3, seed: S() }), { gain: .07 }); pop(.5, 900, .07);          // zoom + "?"
for (let j = 0; j < 8; j++) tick(1.6 + j * .16, .03, 3000 - j * 220);                                              // trajeto apagando
F(3.15, X.whoosh({ dur: .35, f0: 900, f1: 200, peak: .5, seed: S() }), { gain: .07 }); F(3.45, X.knock({ f: 160, seed: S() }), { gain: .12 });
stamp(3.75); F(4.05, X.blip({ f: 220, f1: 880, dur: .45, decay: 6 }), { gain: .06 });                            // X + volta de mola
whip(4.7, 1); F(4.8, X.whoosh({ dur: 1.0, f0: 200, f1: 700, peak: .4, seed: S() }), { gain: .05 }); F(5.3, X.click({ seed: S() }), { gain: .08 });
[7.5, 8.15, 8.95, 9.5].forEach((t, k) => pop(t, 500 + k * 120, .07 + k * .01));                                   // faixas 1-2-3-4
chime(9.95, 1568, .05); chime(10.1, 2093, .03);                                                                   // já chegou
F(12.0, X.hum({ dur: 1.8, f: 110, seed: S() }), { gain: .03, fi: .3, fo: .5 }); pop(12.4, 700, .06);
F(14.95, X.click({ seed: S() }), { gain: .1 }); F(15.0, X.hum({ dur: 2.0, f: 120, seed: S(), buzz: .35 }), { gain: .035, fi: .05, fo: .4 });
F(16.95, X.whoosh({ dur: .4, f0: 300, f1: 4000, peak: .9, seed: S() }), { gain: .12 });                          // zoom through
for (let j = 0; j < 3; j++) F(18.1 + j * .55, X.beep({ f: 880 + j * 220, dur: .09 }), { gain: .025 });            // bateria ECO
F(19.6, X.blip({ f: 1320, dur: .3, decay: 10 }), { gain: .04 });
whip(19.98, -1, .08); F(20.3, X.impact({ dur: 2.4, f0: 70, f1: 40, noise: .2, seed: S(), decay: 1.5 }), { gain: .07 }); // swell grave / foco estreita
sparkle(23.45, .05, 1.4); chime(23.5, 1318, .035);
F(25.35, X.whoosh({ dur: .5, f0: 600, f1: 200, peak: .5, seed: S() }), { gain: .07 }); chime(26.2, 1568, .04); pop(26.2, 800, .05);
stamp(28.85); F(28.1, X.swirl({ dur: .8, seed: S(), rate: .5 }), { gain: .02 });
F(29.75, X.whoosh({ dur: .3, f0: 1600, f1: 300, peak: .7, seed: S() }), { gain: .06 }); F(30.05, X.metal({ f: 520, dur: .5, seed: S() }), { gain: .08 });
F(30.3, X.click({ seed: S(), f: 1500 }), { gain: .08 }); stamp(30.65);
F(31.3, X.whoosh({ dur: .5, f0: 300, f1: 1400, peak: .5, seed: S() }), { gain: .05 });
for (let j = 0; j < 6; j++) pop(32.0 + j * .14, 700 + j * 80, .035);
chime(32.4, 1046, .04); chime(32.55, 1568, .04);
whip(33.66, -1); F(34.0, X.shimmer({ dur: 1.8, f: 660, seed: S() }), { gain: .03, fi: .3, fo: .4 }); pop(35.0, 900, .05);
stamp(36.5, .28); F(36.5, X.impact({ dur: 1.1, f0: 85, f1: 32, noise: .3, seed: S() }), { gain: .12 }); sparkle(36.6, .05, 1);

const SR = X.SR, n = fx.n, M = [new Float32Array(n), new Float32Array(n)];
let pk = 0; for (let i = 0; i < n; i++) { const f = Math.min(1, (n - i) / (.15 * SR)); M[0][i] = fx.L[i] * f; M[1][i] = fx.R[i] * f; pk = Math.max(pk, Math.abs(M[0][i]), Math.abs(M[1][i])); }
const gain = .89 / pk; for (const b of M) for (let i = 0; i < n; i++) b[i] *= gain;
X.writeWav(process.env.SFX_OUT || require('path').join(require('os').tmpdir(), '21-sfx.wav'), M[0], M[1]);
console.log(`pronto · pico ${pk.toFixed(3)} → ganho ${gain.toFixed(3)}`);
