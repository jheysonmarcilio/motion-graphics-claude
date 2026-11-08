// Efeitos sonoros do Short 03 v2 (diorama de brinquedo): elevador, botões, relógio, ronco, pops, praia, carimbo.
// Sem voz e sem música. Tempos = narração gravada (= cenas).
// Uso: node demos/03-hipnose-profundidade-v2/sfx.cjs → renders/03-hipnose-profundidade-v2-sfx.wav
'use strict';
const path = require('path');
const X = require('../../tools/sfx-lib.js');
const { Bus, writeWav, mulberry32 } = X;

const DUR = 112.4;
const fx = new Bus(DUR), amb = new Bus(DUR);
const rng = mulberry32(3203);
let seed = 900; const S = () => ++seed;
const F = (t, b, o) => fx.add(t, b, o), A = (t, b, o) => amb.add(t, b, o);

const whip = (t, d = .5, g = .08) => F(t - d / 2 - .05, X.whoosh({ dur: d + .2, f0: 400, f1: 2600, peak: .55, seed: S(), body: .25 }), { gain: g, pan: -.4, panEnd: .4 });
const pop = (t, f = 600, g = .08, p = 0) => F(t, X.pop({ f, seed: S() }), { gain: g, pan: p, rev: .2 });
const click = (t, g = .07, p = 0) => F(t, X.click({ seed: S(), f: 1700 }), { gain: g, pan: p, rev: .1 });
const knock = (t, g = .1, p = 0, f = 200) => F(t, X.knock({ f, seed: S() }), { gain: g, pan: p, rev: .2 });
const chime = (t, f, g = .05, p = 0) => F(t, X.blip({ f, dur: .9, decay: 5 }), { gain: g, pan: p, rev: .5 });
const ding = (t, g = .06) => { chime(t, 1318, g); chime(t + .18, 1046, g); };
const tick = (t, g = .045, p = -.3, f = 3000) => F(t, X.tick({ f, dur: .04, seed: S(), decay: 220 }), { gain: g, pan: p, rev: .15 });

// ═══ ambiência ═══
A(0, X.roomTone(DUR, 3), { gain: .05, fi: .5, fo: 1 });
A(63.2, X.wind({ dur: 44, seed: 41, lo: 180, hi: 700, gust: .25 }), { gain: .06, fi: 1.2, fo: 1.5 });     // mar
A(64.0, X.birds({ dur: 42, seed: 42, dens: .7 }), { gain: .025, fi: 1.5, fo: 1.5 });

// ═══ whip pans (deixas da câmera) ═══
[1.95, 5.6, 8.3, 10.0, 10.9, 11.75, 12.3, 15.1, 17.6, 21.4, 23.4, 25.4, 27.1, 29.2, 31.9, 34.4, 36.7, 39.5, 42.2, 44.9, 47.7, 49.6, 52.0, 54.2, 57.2, 60.0, 63.0, 66.0,
	68.6, 71.4, 74.4, 77.2, 79.5, 81.0, 83.6, 86.4, 89.3, 92.4, 95.3, 98.2, 99.9, 102.4, 104.6, 107.2, 110.0, 112.1].forEach(t => whip(t));
F(3.0, X.whoosh({ dur: 1.4, f0: 2400, f1: 300, peak: .3, seed: S() }), { gain: .1 });     // zoom-out no prédio

// ═══ 0 · pergunta ═══
for (let t = .5; t < 8.25; t += 1) tick(t, .04, -.4, t % 2 < 1 ? 2800 : 3300);
pop(.38, 640, .08, .3); pop(92.62, 640, .08, .3);                                          // "?"
for (let i = 0; i < 3; i++) F(6.0 + i * .7, X.hum({ dur: .25, f: 150, seed: S(), buzz: .4 }), { gain: .02, pan: .2 });   // mão hesitando

// ═══ 1 · relógio + bocejo + DESCER ═══
F(8.3, X.ratchet({ dur: 3.6, n: 40, f: 2800, accel: 2.5, seed: S() }), { gain: .05, pan: -.4 });
F(10.95, X.breath({ dur: .8, seed: S() }), { gain: .08 });
const presses = [];
for (const [a, b] of [[11.7, 19.75], [42.2, 45.0]]) for (let n = 0; ; n++) { const t = (Math.PI / 2 + n * Math.PI) / 6.5; if (t > b) break; if (t > a + .1) presses.push(t); }
presses.forEach(t => click(t, .055, .3));
// motor do elevador + "tum" a cada andar + plim na chegada
for (const [a, b] of [[12, 19], [19.75, 20.55], [42.4, 45]]) F(a, X.hum({ dur: b - a, f: 80, seed: S(), buzz: .15, flick: .02 }), { gain: .05, fi: .25, fo: .3 });
[13, 14, 15, 16, 17, 18, 19, 43.27, 44.13, 45].forEach(t => knock(t, .05, 0, 150));
ding(19.05); ding(20.6); ding(45.05, .07);

// ═══ 2 · ponto passado, ronco, raso ═══
pop(15.05, 520, .06, -.4);
F(16.0, X.whoosh({ dur: .5, f0: 900, f1: 500, peak: .5, seed: S() }), { gain: .05 });        // passou do ponto
for (let t = 17.75; t < 19.8; t += 1.1) { F(t, X.breath({ dur: .7, seed: S() }), { gain: .07 }); F(t + .1, X.hum({ dur: .45, f: 70, seed: S(), buzz: .6 }), { gain: .03 }); }   // ronco
F(19.75, X.whoosh({ dur: .8, f0: 300, f1: 1800, peak: .6, seed: S() }), { gain: .08 });       // sobe
for (let i = 0; i < 4; i++) { const t0 = 23.2 + i * .8; pop(t0, 700 + i * 60, .06, -.3); knock(t0 + 1.0, .09, .1, 260); pop(t0 + 1.05, 420, .07, .2); }   // balões batem
F(24.65, X.woodClick({ seed: S() }), { gain: .05 }); F(24.7, X.whoosh({ dur: .3, f0: 600, f1: 1200, peak: .4, seed: S() }), { gain: .04 });   // dar de ombros

// ═══ 3 · loja ═══
for (let i = 0; i < 6; i++) pop(26.95 + i * .1, 500 + i * 70, .06, (i % 2 ? .3 : -.3));
const XT = [30.6, 30.9, 31.2, 32.7, 33.0, 33.3];
XT.forEach((t, i) => { F(t, X.stamp({ seed: S() }), { gain: .11, pan: i % 2 ? .3 : -.3, rev: .2 }); F(t + .35, X.whoosh({ dur: .5, f0: 1600, f1: 400, peak: .3, seed: S() }), { gain: .04 }); knock(t + 1.0, .1, i % 2 ? .3 : -.3, 170); });

// ═══ 4 · bandeira + terapia ═══
F(39.35, X.whoosh({ dur: 1.7, f0: 500, f1: 1500, peak: .4, seed: S() }), { gain: .07, pan: -.3 });
knock(41.0, .12, -.2, 230); F(41.02, X.woodClick({ seed: S() }), { gain: .06 });
chime(44.95, 784, .05); chime(45.15, 1046, .05);
F(45.0, X.sparkle({ dur: 1.0, seed: S(), dens: 25, peak: .3 }), { gain: .04 });

// ═══ 5 · sugestão-teste ═══
pop(47.75, 560, .07); F(47.8, X.paper({ dur: .25, seed: S(), dens: 80 }), { gain: .06 });
pop(50.0, 700, .07); F(50.0, X.whoosh({ dur: 2.0, f0: 1200, f1: 400, peak: .5, seed: S() }), { gain: .05 });
F(52.0, X.shimmer({ dur: 1.2, f: 880, peak: .2, seed: S() }), { gain: .05, rev: .4 });         // absorve
F(52.3, X.whoosh({ dur: 1.8, f0: 400, f1: 1400, peak: .5, seed: S() }), { gain: .04 });         // braço flutua
[54.2, 89.3, 107.2].forEach(t => { chime(t, 659, .05); chime(t + .14, 988, .05); });             // lâmpada verde
for (let i = 0; i < 4; i++) pop(57.2 + i * .12, 600 + i * 80, .05, (i - 1.5) * .3);
F(60.9, X.paper({ dur: .35, seed: S(), dens: 120 }), { gain: .07 }); F(61.0, X.whoosh({ dur: .4, f0: 800, f1: 2000, peak: .4, seed: S() }), { gain: .04 });

// ═══ 6 · lugar seguro ═══
F(63.0, X.drawer({ dur: .8, seed: S(), clunk: false }), { gain: .07 });                         // portas abrem
F(63.1, X.shimmer({ dur: 2, f: 1046, peak: .15, seed: S() }), { gain: .05, rev: .5 });
for (let i = 0; i < 10; i++) pop(63.1 + i * .22, 480 + i * 45, .035, rng() * 1 - .5);
F(64.0, X.sparkle({ dur: .7, seed: S(), dens: 40, peak: .3 }), { gain: .05 }); pop(64.15, 520, .07);   // puf
F(66.0, X.shimmer({ dur: 1.6, f: 660, peak: .2, seed: S() }), { gain: .05, rev: .5 }); pop(66.05, 500, .06, -.3); pop(66.15, 560, .06, .3);
F(66.4, X.zip({ dur: 1.2, f0: 500, f1: 1500, seed: S(), peak: .5 }), { gain: .03 });              // ligação tracejada
pop(68.65, 700, .05, -.2); pop(68.75, 760, .05, .2);
pop(74.6, 520, .06, .3);                                                                           // pensamento
F(77.2, X.shimmer({ dur: 2, f: 523, peak: .25, seed: S() }), { gain: .04, rev: .6 });

// ═══ 7 · sentidos ═══
[[83.9, 660], [84.6, 740], [85.3, 830], [86.6, 990]].forEach(([t, f], i) => { pop(t, f, .07, (i - 1.5) * .3); chime(t + .03, f * 1.5, .025, (i - 1.5) * .3); });
F(89.5, X.sparkle({ dur: .8, seed: S(), dens: 30, peak: .3 }), { gain: .04 });

// ═══ 8 · teste ═══
F(95.3, X.paper({ dur: .3, seed: S(), dens: 90 }), { gain: .06 });
F(99.9, X.paper({ dur: .35, seed: S(), dens: 100 }), { gain: .06 });
[[100.6, 659], [102.6, 784], [104.8, 988]].forEach(([t, f]) => { F(t - .05, X.scribble({ dur: .3, seed: S(), rate: 8 }), { gain: .08 }); chime(t + .2, f, .05); });
[107.9, 108.25].forEach(t => F(t, X.creak({ dur: .9, seed: S(), f: 800 }), { gain: .04, pan: .3 }));
F(110.2, X.creak({ dur: 1.4, seed: S(), f: 600 }), { gain: .06, pan: .2 }); F(110.4, X.shimmer({ dur: 1.6, f: 392, peak: .2, seed: S() }), { gain: .04, rev: .6 });

// carimbo
F(107.2, X.stamp({ seed: S() }), { gain: .35, rev: .3 }); F(107.2, X.impact({ dur: 1.6, f0: 70, f1: 32, noise: .3, seed: S() }), { gain: .25, rev: .5 });

// ── master ──
const SR = X.SR, n = fx.n, M = [new Float32Array(n), new Float32Array(n)];
const fadeOut = i => Math.min(1, (n - i) / (.15 * SR));
let pk = 0; for (let i = 0; i < n; i++) { const f = fadeOut(i); for (const [c, k] of [[0, 'L'], [1, 'R']]) { M[c][i] = (fx[k][i] + amb[k][i]) * f; pk = Math.max(pk, Math.abs(M[c][i])); } }
const gain = .89 / pk;
for (const b of M) for (let i = 0; i < n; i++) b[i] *= gain;
writeWav(path.resolve(__dirname, '../../renders/03-hipnose-profundidade-v2-sfx.wav'), M[0], M[1]);
console.log(`pronto · pico ${pk.toFixed(3)} → ganho ${gain.toFixed(3)} · ${DUR}s`);
