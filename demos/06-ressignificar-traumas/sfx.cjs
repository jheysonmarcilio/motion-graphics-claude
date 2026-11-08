// Efeitos sonoros do Short 06 (explainer flat): bolinha bilateral (whoosh L↔R), pops, relógio, gaveta, sino,
// plugues, blocos caindo, folhas, dings, carimbo. Sem voz e sem música (a narração já traz trilha).
// Uso: node demos/06-ressignificar-traumas/sfx.cjs → renders/06-ressignificar-traumas-sfx.wav
'use strict';
const path = require('path');
const X = require('../../tools/sfx-lib.js');
const { Bus, writeWav } = X;

const DUR = 60.09;
const fx = new Bus(DUR);
let seed = 600; const S = () => ++seed;
const F = (t, b, o) => fx.add(t, b, o);
const pop = (t, f = 600, g = .08, p = 0) => F(t, X.pop({ f, seed: S() }), { gain: g, pan: p, rev: .2 });
const click = (t, g = .07, p = 0) => F(t, X.click({ seed: S(), f: 1800 }), { gain: g, pan: p, rev: .1 });
const knock = (t, g = .1, p = 0, f = 200) => F(t, X.knock({ f, seed: S() }), { gain: g, pan: p, rev: .2 });
const chime = (t, f, g = .05, p = 0) => F(t, X.blip({ f, dur: .9, decay: 5 }), { gain: g, pan: p, rev: .5 });
const ding = (t, f = 1318, g = .06) => { chime(t, f, g); chime(t + .14, f * 1.26, g * .8); };
const tick = (t, g = .05, p = 0, f = 3000) => F(t, X.tick({ f, dur: .04, seed: S(), decay: 220 }), { gain: g, pan: p, rev: .15 });
// whoosh que acompanha a bolinha: pan segue o sentido
const swoosh = (t, d, dir, g = .06) => F(t, X.whoosh({ dur: d, f0: 500, f1: 2400, peak: .5, seed: S(), body: .2 }), { gain: g, pan: -.8 * dir, panEnd: .8 * dir });
// transições
const wipe = t => swoosh(t - .05, .55, 1, .09);
const iris = t => { F(t - .05, X.whoosh({ dur: .5, f0: 300, f1: 1800, peak: .7, seed: S() }), { gain: .07 }); pop(t + .3, 520, .05); };

// ═══ bolinha do close (0–3 e 58,55–60): período 1/0,62 s, passa pelo centro a cada meio período ═══
for (const [a, b] of [[0, 2.98], [58.6, 60.0]]) for (let k = 0; ; k++) { const t = k / (2 * .62); if (t > b) break; if (t >= a - .3) swoosh(t, 1 / (2 * .62), k % 2 ? -1 : 1, .05); }
F(.2, X.impact({ dur: 1.2, f0: 70, f1: 35, noise: .4, seed: S() }), { gain: .05, rev: .4 });     // trovão baixinho
pop(.06, 700, .07); F(.95, X.whoosh({ dur: .4, f0: 1600, f1: 400, peak: .3, seed: S() }), { gain: .06 });  // zoom-punch

// ═══ transições ═══
iris(2.98); iris(6.0); wipe(7.65); wipe(17.9); wipe(19.0); iris(23.8); iris(34.6); wipe(38.7); iris(44.7); iris(47.6); wipe(52.8); iris(55.2); wipe(58.55);
[9.0, 11.85, 13.3, 20.8, 25.8, 27.8, 40.2, 50.6, 51.5].forEach(t => F(t - .2, X.whoosh({ dur: .5, f0: 400, f1: 2000, peak: .5, seed: S(), body: .2 }), { gain: .045 }));

// ═══ consultório / polaroid ═══
pop(3.7, 640, .08, .2); F(3.75, X.paper({ dur: .25, seed: S(), dens: 90 }), { gain: .05 });
F(4.0, X.impact({ dur: 1.0, f0: 80, f1: 40, noise: .3, seed: S() }), { gain: .04, rev: .3 });
// cronômetro: 3 passos
F(6.2, X.click({ seed: S(), f: 2400 }), { gain: .07 });
[6.3, 6.7, 7.1].forEach((t, i) => tick(t, .08, 0, 2600 + i * 200)); ding(7.15, 1568, .055);
// bancada
pop(7.75, 520, .08); [9.15, 10.55, 12.05].forEach(t => pop(t, 620, .07));
for (let t = 9.4; t < 13.4; t += 1 / 1.5) tick(t, .03, -.5, 2200);                                // pêndulo
for (let k = 0; k < 3; k++) chime(11.95 + k * .53, 880, .025, k % 2 ? .6 : -.6);                    // bip L/R da barra
pop(13.3, 480, .07); F(13.45, X.whoosh({ dur: .5, f0: 700, f1: 1600, peak: .5, seed: S() }), { gain: .05 });
for (let k = 0; k < 10; k++) F(13.95 + k * .1, X.paper({ dur: .08, seed: S(), dens: 220, hp: 3000 }), { gain: .05, pan: k % 2 ? .3 : -.3 });   // chacoalhar
F(15.05, X.impact({ dur: 1.1, f0: 120, f1: 50, noise: .4, seed: S() }), { gain: .09, rev: .3 });
F(15.1, X.sparkle({ dur: 1.2, seed: S(), dens: 25, peak: .3 }), { gain: .04 });
[15.9, 16.25, 16.6].forEach((t, i) => pop(t, 700 + i * 90, .05));
// "o quê?"
F(17.95, X.blip({ f: 300, f1: 620, dur: .3, decay: 9 }), { gain: .06 });
// ═══ arquivo ═══
F(19.2, X.drawer({ dur: .7, seed: S(), clunk: true }), { gain: .08 }); pop(19.6, 600, .08);
for (let t = 20.85; t < 23.7; t += .45) F(t, X.beep({ f: 1180, dur: .1 }), { gain: .018, pan: .3 });   // alarme baixinho
// ═══ rede ═══
for (let i = 0; i < 7; i++) click(24.45 + i * .3, .05, -.6 + i * .2);
for (let t = 26.6; t < 30.5; t += .16) F(t, X.metal({ f: 2100, dur: .12, decay: 30, seed: S() }), { gain: .012 * (t < 29.8 ? 1 : 1 - (t - 29.8) / .8), pan: .3 });   // sino
for (let k = 0; k < 6; k++) swoosh(29.75 + k * .8, .8, k % 2 ? -1 : 1, .07);                          // passadas da bolinha
F(34.35, X.shimmer({ dur: 1.0, f: 660, peak: .2, seed: S() }), { gain: .04, rev: .4 });
// ═══ mesa telefônica ═══
[[35.2, 36.35], [36.95, 37.55], [37.55, 38.15]].forEach(([a, b], i) => { F(a - .05, X.zip({ dur: .2, f0: 800, f1: 300, seed: S(), peak: .5 }), { gain: .04 }); click(b, .08, (i - 1) * .4); pop(b + .03, 560 + i * 80, .05); });
// ═══ torre ═══
for (let t = 38.9; t < 41.8; t += .48) F(t, X.creak({ dur: .4, seed: S(), f: 700 }), { gain: .02, pan: -.2 });
for (let i = 0; i < 7; i++) knock(42.3 + i * .07 + (i % 3) * .03, .07, -.6 + i * .2, 170 + i * 15);
F(42.4, X.paper({ dur: .5, seed: S(), dens: 60 }), { gain: .04 });
// ═══ alívio ═══
F(45.0, X.whoosh({ dur: .6, f0: 1200, f1: 300, peak: .3, seed: S() }), { gain: .05 }); pop(45.5, 420, .08);
F(45.6, X.sparkle({ dur: 1.4, seed: S(), dens: 18, peak: .3 }), { gain: .035 });
// ═══ calendário ═══
for (let i = 0; i < 13; i++) F(48.3 + i * .3, X.tear({ dur: .25, seed: S(), dens: 380 }), { gain: .035, pan: .2 });
F(51.55, X.whoosh({ dur: .25, f0: 900, f1: 2600, peak: .3, seed: S() }), { gain: .05 }); F(51.75, X.whoosh({ dur: .25, f0: 900, f1: 2600, peak: .3, seed: S() }), { gain: .05 });
// ═══ sessões + alta ═══
[52.85, 53.07, 53.29].forEach(t => pop(t, 560, .06));
[53.55, 54.0, 54.45].forEach((t, i) => { F(t - .05, X.scribble({ dur: .25, seed: S(), rate: 9 }), { gain: .05 }); ding(t + .2, [1046, 1175, 1318][i], .045); });
F(55.45, X.sparkle({ dur: 2, seed: S(), dens: 30, peak: .4 }), { gain: .04 });
F(56.5, X.stamp({ seed: S() }), { gain: .3, rev: .3 }); F(56.5, X.impact({ dur: 1.4, f0: 70, f1: 32, noise: .3, seed: S() }), { gain: .2, rev: .4 });

// ── master ──
const SR = X.SR, n = fx.n, M = [new Float32Array(n), new Float32Array(n)];
const fadeOut = i => Math.min(1, (n - i) / (.15 * SR));
let pk = 0; for (let i = 0; i < n; i++) { const f = fadeOut(i); M[0][i] = fx.L[i] * f; M[1][i] = fx.R[i] * f; pk = Math.max(pk, Math.abs(M[0][i]), Math.abs(M[1][i])); }
const gain = .89 / pk;
for (const b of M) for (let i = 0; i < n; i++) b[i] *= gain;
writeWav(path.resolve(__dirname, '../../renders/06-ressignificar-traumas-sfx.wav'), M[0], M[1]);
console.log(`pronto · pico ${pk.toFixed(3)} → ganho ${gain.toFixed(3)} · ${DUR}s`);
