// Trilha de EFEITOS SONOROS (sem música, sem voz) do Short 04, sincronizada com os tempos das cenas (= narração gravada).
// Uso: node demos/04-hipnose-existe/sfx.cjs  → renders/04-hipnose-existe-sfx.wav (+ stems -efeitos / -ambiencia)
'use strict';
const path = require('path');
const X = require('../../tools/sfx-lib.js');
const { Bus, writeWav, mulberry32, reverse } = X;

const DUR = 88.35;
const fx = new Bus(DUR), amb = new Bus(DUR);
const rng = mulberry32(404);
let seed = 100; const S = () => ++seed;
const F = (t, b, o) => fx.add(t, b, o), A = (t, b, o) => amb.add(t, b, o);

// ── utilitários de cue ──
const ui = (t, g = .07, pan = 0) => F(t, X.tick({ f: 4200, dur: .04, seed: S(), decay: 220 }), { gain: g, pan, rev: .25 });
const cut = (t, g = .07) => F(t - .3, X.whoosh({ dur: .6, f0: 600, f1: 2600, peak: .55, seed: S(), body: .2 }), { gain: g, pan: rng() - .5, panEnd: rng() - .5 });
const hit = (t, g = .2) => { F(t, X.impact({ dur: 1.4, f0: 85, f1: 40, noise: .2, seed: S() }), { gain: g, rev: .4 }); F(t, X.shimmer({ dur: 1.6, f: 660 + rng() * 220, peak: .08, seed: S(), ca: .5, cr: 2 }), { gain: g * .45, rev: .5 }); };
const rise = (t, d, g = .15) => F(t - d, X.whoosh({ dur: d + .1, f0: 200, f1: 2200, peak: .92, seed: S(), ca: 2.5, cr: 6 }), { gain: g, rev: .3 });
const pop = (t, f, g = .1, pan = 0) => F(t, X.pop({ f, seed: S() }), { gain: g, pan, rev: .3 });
const chime = (t, f, g = .07, pan = 0) => F(t, X.blip({ f, dur: .9, decay: 5 }), { gain: g, pan, rev: .6 });

// ═══ AMBIÊNCIA ═══
A(0, X.airBed(DUR, 1, 110, 2.5), { gain: .035, fi: 1, fo: 1.5 });
A(0, X.swirl({ dur: 7.5, seed: 2, rate: .45 }), { gain: .05, fi: .3, fo: 1.5 });
A(14.6, X.digitalBed(26, 3), { gain: .025, fi: 1, fo: 1.5 });
A(32.6, X.swirl({ dur: 7.5, seed: 4, rate: .45 }), { gain: .06, fi: 1.2, fo: 1.5 });
A(40, X.digitalBed(37, 5), { gain: .018, fi: 1.5, fo: 2 });
A(76.5, X.airBed(12, 6, 220, 1.5), { gain: .03, fi: 1.5, fo: 1 });
A(83.0, X.swirl({ dur: 5.35, seed: 7, rate: .5 }), { gain: .07, fi: 1.5, fo: .5 });

// cortes de câmera (whoosh curto)
[2.3, 3.15, 6.6, 16.75, 19.0, 22.43, 26.8, 29.7, 32.7, 37.6, 40.07, 41.7, 47.6, 49.6, 51.6, 53.6, 58.3, 60.3, 63.5, 65.5, 68.5, 76.57, 79.3, 80.3, 83.3, 84.9].forEach(t => cut(t));

// ═══ 0 · PERGUNTA ═══
F(0, X.impact({ dur: 2.5, f0: 60, f1: 30, noise: .05, seed: S() }), { gain: .22, rev: .5 });
F(0, X.shimmer({ dur: 2.4, f: 523, peak: .3, seed: S() }), { gain: .06, rev: .6 });
F(2.35, X.knock({ f: 160, seed: S() }), { gain: .22, rev: .3 }); ui(2.35);                                // palpável
F(3.15, X.zip({ dur: 1.05, f0: 1800, f1: 500, seed: S(), peak: .5 }), { gain: .08 }); ui(3.15);           // mensurável: varredura
F(3.15, X.scanner({ dur: 1.1, seed: S() }), { gain: .05 });
rise(4.35, .5, .12); pop(4.45, 520, .12, -.7); pop(4.6, 620, .12, .7); ui(4.35);                         // replicável
F(4.35, X.whoosh({ dur: 1.4, f0: 1200, f1: 200, peak: .2, seed: S() }), { gain: .14, rev: .4 });

// ═══ 1 · SPIEGEL ═══
F(7.25, X.sparkle({ dur: 1.2, seed: S(), dens: 60, peak: .2 }), { gain: .12, rev: .3 });                // cabeça se desfaz
F(7.3, X.whoosh({ dur: 1.6, f0: 300, f1: 1800, peak: .4, seed: S() }), { gain: .16, pan: -.3, panEnd: .3, rev: .3 });
ui(7.75, .09); ui(9.0, .06); ui(11.0, .06);                                                              // cartão
F(7.6, X.whoosh({ dur: 3.6, f0: 150, f1: 500, peak: .5, seed: S(), ca: 1, cr: 1, body: .6 }), { gain: .1 });   // globo girando
rise(11.1, .35, .1); F(11.1, X.drop({ seed: S() }), { gain: .2, rev: .5 }); F(11.15, X.impact({ dur: .7, f0: 140, f1: 70, noise: .3, seed: S() }), { gain: .2 });   // pino
F(11.2, X.shimmer({ dur: 2, f: 784, peak: .1, seed: S(), ca: .5, cr: 2 }), { gain: .06, rev: .6 });
rise(13.6, .9, .15); hit(13.6, .26);                                                                    // 2016

// ═══ 2 · ESTUDO ═══
for (let o = 0; o <= 14; o++) pop(15.15 + o / 14 * 2.4 + .05, 480 + o * 22, .055, (o / 14 - .5) * 1.2);   // 60 pessoas surgem
F(15.2, X.ratchet({ dur: 2.4, n: 30, f: 3200, accel: 1, seed: S() }), { gain: .035 });                   // contador
for (let t = 19.2; t < 22.3; t += .5) F(t, X.beep({ f: 1320, dur: .06 }), { gain: .025, pan: .3 });      // monitor EEG
F(19.0, X.pen({ dur: 3.3, seed: S() }), { gain: .03, fi: .3, fo: .5 });
F(20.85, X.impact({ dur: 1.2, f0: 70, f1: 40, noise: .1, seed: S() }), { gain: .16 });                  // ressonância
F(20.85, X.scanner({ dur: 1.6, seed: S() }), { gain: .07, fo: .3 }); F(20.85, X.hum({ dur: 1.6, f: 100, seed: S(), buzz: .3 }), { gain: .03, fi: .1, fo: .4 });

// ═══ 3 · GRUPOS ═══
F(22.45, X.whoosh({ dur: .8, f0: 2000, f1: 400, peak: .3, seed: S() }), { gain: .08 });
F(23.9, X.whoosh({ dur: 1.6, f0: 300, f1: 1400, peak: .5, seed: S() }), { gain: .12, pan: -.4, panEnd: .4 });   // divisão
for (let i = 0; i < 24; i++) F(24.2 + rng() * 1.4, X.woodClick({ seed: S() }), { gain: .05 * (.6 + .4 * rng()), pan: rng() * 1.4 - .7, rev: .2 });
F(26.8, X.shimmer({ dur: 2.6, f: 880, peak: .3, seed: S() }), { gain: .09, pan: -.4, rev: .6 });         // alta: acende
F(26.8, X.sparkle({ dur: 2.4, seed: S(), dens: 25, peak: .3 }), { gain: .07, pan: -.4 });
F(29.7, X.blip({ f: 330, f1: 220, dur: .6, decay: 5 }), { gain: .09, pan: .4 });                          // baixa: apaga
F(29.7, X.knock({ f: 120, seed: S() }), { gain: .14, pan: .4 });

// ═══ 4 · HIPNOTIZAR ═══
F(33.0, reverse(X.whoosh({ dur: 1.8, f0: 400, f1: 2500, peak: .6, seed: S() })), { gain: .14, rev: .4 });   // pessoas voam para a cabeça
F(33.6, X.sparkle({ dur: 1.8, seed: S(), dens: 50, peak: .6 }), { gain: .1, rev: .4 });
hit(35.0, .16);
F(35.7, X.scanner({ dur: 2.4, seed: S() }), { gain: .09, fi: .2, fo: .4 });                               // anel do scanner
F(35.7, X.whoosh({ dur: 2.4, f0: 300, f1: 900, q: 2, peak: .5, seed: S(), ca: 1, cr: 1 }), { gain: .1 });
for (let t = 35.8; t < 38.4; t += .5) F(t, X.beep({ f: 1320, dur: .06 }), { gain: .02, pan: .3 });
F(37.3, reverse(X.whoosh({ dur: 1.4, f0: 300, f1: 3000, peak: .7, seed: S() })), { gain: .12 });         // cérebro se monta
[38.6, 38.8, 39.0].forEach((t, i) => { pop(t, 600 + i * 120, .1, (i - 1) * .5); chime(t, [659, 784, 988][i], .04, (i - 1) * .5); });   // 3 descobertas
F(38.6, X.impact({ dur: 1.4, f0: 80, f1: 40, noise: .1, seed: S() }), { gain: .14, rev: .4 });

// ═══ 5 · ATENÇÃO FOCADA ═══
ui(40.1, .08);
F(41.9, X.shimmer({ dur: 3, f: 880, peak: .25, seed: S() }), { gain: .09, rev: .6 });                    // cingulado anterior acende
F(41.9, X.blip({ f: 1320, dur: .5, decay: 8 }), { gain: .05, rev: .5 });
rise(44.6, .6, .12); hit(44.6, .14);
for (let t = 44.6 + 1.33 / 4; t < 49.1; t += 1.33 / 4) F(t, X.whoosh({ dur: .5, f0: 1500, f1: 4000, q: 3, peak: .8, seed: S(), body: 0 }), { gain: .025, rev: .4 });   // anéis convergindo
F(44.6, X.tone({ f: 220, dur: 4.8, att: .8 }), { gain: .022, fo: 1.5 });

// ═══ 6 · SISTEMA CRÍTICO ═══
ui(49.6, .08);
F(49.65, X.zip({ dur: .8, f0: 400, f1: 2400, seed: S(), peak: .6 }), { gain: .1 });                        // ponte nasce
F(49.7, X.pen({ dur: 2.2, seed: S() }), { gain: .05, fi: .2, fo: .5 });
F(50.6, X.blip({ f: 660, f1: 260, dur: 1.6, decay: 1.6 }), { gain: .07 });                                // conexão enfraquece
F(50.6, X.whoosh({ dur: 1.6, f0: 1500, f1: 250, peak: .3, seed: S() }), { gain: .08 });
pop(51.75, 520, .1, .4); chime(51.75, 523, .035, .4);                                                     // pré-frontal
pop(53.75, 440, .1, -.4); chime(53.75, 440, .035, -.4);                                                   // cingulado posterior
hit(56.4, .16); F(56.4, X.blip({ f: 220, dur: .8, decay: 4 }), { gain: .06 });                            // sistema crítico
ui(57.05, .07);
F(60.3, X.tear({ dur: 1.4, seed: S() }), { gain: .1, pan: -.2, panEnd: .2 });                             // ponte se rompe
F(60.3, X.blip({ f: 880, f1: 180, dur: 1.9, decay: 1.4 }), { gain: .08 });
F(60.4, X.ratchet({ dur: 1.8, n: 14, f: 2000, accel: -1, seed: S() }), { gain: .05, pan: .3 });          // medidor caindo
F(62.2, X.knock({ f: 110, seed: S() }), { gain: .14 });

// ═══ 7 · SINCRONIA ═══
ui(63.6, .08);
F(64.0, X.pen({ dur: 7.3, seed: S() }), { gain: .025, fi: .5, fo: 1 });
F(65.55, X.shimmer({ dur: 2.4, f: 659, peak: .3, seed: S() }), { gain: .07, pan: -.4, rev: .5 });        // sensoriais
F(66.95, X.shimmer({ dur: 2.4, f: 784, peak: .3, seed: S() }), { gain: .07, pan: .4, rev: .5 });         // emocionais
F(65.6, X.tone({ f: 220, dur: 1.6, att: .3, beat: 9 }), { gain: .04, fo: .4 });                            // fora de fase (batimento) → em fase
F(66.8, X.tone({ f: 220, dur: 1.6, att: .4, beat: 4 }), { gain: .04, fi: .4, fo: .4 });
F(67.9, X.tone({ f: 220, dur: 3.6, att: .4, beat: 0 }), { gain: .05, fi: .4, fo: 1.2 });
F(68.2, X.blip({ f: 880, dur: .9, decay: 4 }), { gain: .05, rev: .6 });
F(68.5, X.whoosh({ dur: 3, f0: 200, f1: 1600, peak: .95, seed: S(), ca: 2, cr: 6 }), { gain: .12, rev: .4 });   // fica vívido
hit(71.45, .3); F(71.45, X.sparkle({ dur: 2.2, seed: S(), dens: 60, peak: .2 }), { gain: .1, rev: .4 });       // muito mais real
F(72.8, X.whoosh({ dur: 1.3, f0: 500, f1: 2200, peak: .5, seed: S() }), { gain: .13, pan: .5, panEnd: -.2 });  // comparação
ui(73.45, .07, -.4); ui(73.6, .07, .4);
F(73.6, X.blip({ f: 196, dur: .7, decay: 4 }), { gain: .05, pan: .5 });

// ═══ 8 · CONCLUSÃO ═══
F(76.55, reverse(X.whoosh({ dur: 1.2, f0: 300, f1: 2400, peak: .6, seed: S() })), { gain: .12 });
F(77.5, X.impact({ dur: 1.5, f0: 70, f1: 38, noise: .1, seed: S() }), { gain: .14, rev: .4 });
[[79.3, 659], [80.3, 784], [81.3, 988]].forEach(([t, f], i) => { pop(t + .1, f * .8, .12, (i - 1) * .3); chime(t + .12, f, .06, (i - 1) * .3); F(t, X.whoosh({ dur: .7, f0: 800, f1: 3000, q: 2, peak: .4, seed: S(), body: 0 }), { gain: .04 }); });   // ✓ ✓ ✓
pop(81.45, 520, .09, -.7); pop(81.6, 620, .09, .7);                                                       // cópias (replicável)
F(81.3, X.whoosh({ dur: 1.4, f0: 1200, f1: 200, peak: .2, seed: S() }), { gain: .12, rev: .4 });
ui(82.0, .07);

// ═══ 9 · A HIPNOSE EXISTE ═══
rise(86.4, 1.4, .2);
F(86.4, X.stamp({ seed: S() }), { gain: .35, rev: .3 });
F(86.4, X.impact({ dur: 2, f0: 70, f1: 32, noise: .3, seed: S() }), { gain: .38, rev: .5 });
[[-.5, 392], [0, 523], [.5, 659]].forEach(([p, f], i) => F(86.42, X.shimmer({ dur: 2, f, peak: .15, seed: S(), ca: .5, cr: 1.5 }), { gain: .05, pan: p, rev: .6 }));
F(86.5, X.sparkle({ dur: 1.8, seed: S(), dens: 40, peak: .2 }), { gain: .08 });
F(87.0, X.whoosh({ dur: 1.35, f0: 300, f1: 1200, peak: .5, seed: S() }), { gain: .09 });                // mergulho de volta ao olhar (loop)

// ── master ──
const SR = X.SR, n = fx.n, M = [new Float32Array(n), new Float32Array(n)];
const fadeOut = i => Math.min(1, (n - i) / (.25 * SR));
let pk = 0; for (let i = 0; i < n; i++) { const f = fadeOut(i); for (const [c, k] of [[0, 'L'], [1, 'R']]) { fx[k][i] *= f; amb[k][i] *= f; M[c][i] = fx[k][i] + amb[k][i]; pk = Math.max(pk, Math.abs(M[c][i])); } }
const gain = .89 / pk; // pico −1 dBFS
for (const b of [fx.L, fx.R, amb.L, amb.R, M[0], M[1]]) for (let i = 0; i < n; i++) b[i] *= gain;
const out = path.resolve(__dirname, '../../renders');
writeWav(path.join(out, '04-hipnose-existe-sfx.wav'), M[0], M[1]);
writeWav(path.join(out, '04-hipnose-existe-sfx-efeitos.wav'), fx.L, fx.R);
writeWav(path.join(out, '04-hipnose-existe-sfx-ambiencia.wav'), amb.L, amb.R);
console.log(`pronto · pico original ${pk.toFixed(3)} → ganho ${gain.toFixed(3)} · ${DUR}s 48kHz 24-bit estéreo`);
