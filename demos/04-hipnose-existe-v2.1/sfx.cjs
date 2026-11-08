// Efeitos sonoros do Short 04 v2 (papel recortado): papel, marcador, fita, alfinete, martelo, metrônomo…
// Sem voz e sem música. Tempos = cenas (= narração gravada).
// Uso: node demos/04-hipnose-existe-v2/sfx.cjs → renders/04-hipnose-existe-v2-sfx.wav
'use strict';
const path = require('path');
const X = require('../../tools/sfx-lib.js');
const { Bus, writeWav, mulberry32, reverse } = X;

const DUR = 88.35;
const fx = new Bus(DUR), amb = new Bus(DUR);
const rng = mulberry32(2404);
let seed = 500; const S = () => ++seed;
const F = (t, b, o) => fx.add(t, b, o), A = (t, b, o) => amb.add(t, b, o);
const pan = () => rng() * 1.2 - .6;

const whip = (t, d = .45, g = .1) => F(t - d - .05, X.whoosh({ dur: d + .2, f0: 400, f1: 2600, peak: .55, seed: S(), body: .25 }), { gain: g, pan: -.5, panEnd: .5 });
const pop = (t, f = 600, g = .09, p = 0) => F(t, X.pop({ f, seed: S() }), { gain: g, pan: p, rev: .2 });
const paperS = (t, d = .3, g = .08, p = 0) => F(t, X.paper({ dur: d, seed: S(), dens: 90 }), { gain: g, pan: p, rev: .15 });
const scrib = (t, d, g = .08, p = 0) => F(t, X.scribble({ dur: d, seed: S(), rate: 8 }), { gain: g, pan: p });
const tapeR = (t, g = .07, p = 0) => { F(t - .12, X.tear({ dur: .25, seed: S(), f0: 1800, f1: 3500 }), { gain: g, pan: p }); F(t, X.stamp({ seed: S() }), { gain: g * .8, pan: p, rev: .2 }); };
const slap = (t, g = .12, p = 0) => { F(t, X.stamp({ seed: S() }), { gain: g, pan: p, rev: .25 }); paperS(t, .12, g * .6, p); };
const tick = (t, g = .05, p = 0, f = 3200) => F(t, X.tick({ f, dur: .04, seed: S(), decay: 220 }), { gain: g, pan: p, rev: .2 });
const chime = (t, f, g = .05, p = 0) => F(t, X.blip({ f, dur: .9, decay: 5 }), { gain: g, pan: p, rev: .6 });

// ═══ ambiência: sala silenciosa + "papel" leve ═══
A(0, X.roomTone(DUR, 3), { gain: .05, fi: .5, fo: 1 });
A(44.6, X.hum({ dur: 4.9, f: 60, seed: 4, buzz: .2 }), { gain: .03, fi: .3, fo: .5 });   // sala escura da lanterna
A(32.7, X.swirl({ dur: 5.6, seed: 5, rate: .45 }), { gain: .04, fi: .8, fo: 1 });          // espiral

// ═══ whip pans (chegada, duração) ═══
[[6.35, .45], [9.3, .45], [12.75, .5], [15.3, .45], [19.25, .45], [21.15, .4], [22.8, .45], [27.35, .55], [30.15, .55], [33.1, .45], [44.95, .45], [49.95, .45],
	[52.0, .45], [54.0, .45], [56.75, .45], [63.9, .45], [65.8, .45], [66.25, .4], [67.25, .4], [68.25, .45], [68.9, .5], [73.3, .55], [76.95, .45], [83.75, .5], [88.35, 1.0]].forEach(([t, d]) => whip(t, d, d > .7 ? .14 : .09));

// ═══ 0 · a pergunta ═══
F(0, X.impact({ dur: 1.6, f0: 80, f1: 40, noise: .1, seed: S() }), { gain: .15, rev: .4 });
F(.1, X.whoosh({ dur: 1.2, f0: 1800, f1: 300, peak: .25, seed: S() }), { gain: .1 });               // zoom-out
for (let t = .2; t < 2.1; t += .455) tick(t, .06, .2, 2600 + (Math.round(t / .455) % 2) * 600);   // tique-taque do relógio
scrib(1.15, .7, .1, -.3); pop(1.9, 520, .1, -.3);                                                  // "?" vermelho
F(2.15, X.whoosh({ dur: .4, f0: 300, f1: 1200, peak: .4, seed: S() }), { gain: .07 }); paperS(2.45, .2, .1); // bloco sobe
scrib(2.35, .35, .07, -.2); scrib(3.15, .45, .07, -.2); scrib(4.35, .45, .07, -.2);                  // palavras escritas
F(2.3, X.whoosh({ dur: .3, f0: 800, f1: 2500, peak: .4, seed: S() }), { gain: .07, pan: .6 });
F(2.52, X.knock({ f: 300, seed: S() }), { gain: .14, pan: .4 }); F(2.53, X.blip({ f: 900, f1: 500, dur: .35, decay: 9 }), { gain: .05, pan: .4 });  // cutucão
F(3.08, X.zip({ dur: .4, f0: 600, f1: 2000, seed: S(), peak: .5 }), { gain: .06, pan: -.4 }); F(3.45, X.woodClick({ seed: S() }), { gain: .08, pan: -.4 });  // régua
F(4.0, X.zip({ dur: .3, f0: 1800, f1: 500, seed: S(), peak: .4 }), { gain: .04, pan: -.4 });
F(4.25, X.hum({ dur: .45, f: 110, seed: S(), buzz: .5 }), { gain: .05 }); F(4.35, X.shimmer({ dur: 1, f: 1320, peak: .1, seed: S() }), { gain: .05, rev: .4 });   // fotocopiadora
F(4.38, X.click({ seed: S() }), { gain: .08 }); pop(4.6, 560, .08, -.6); pop(4.7, 640, .08, .6);

// ═══ 1 · Spiegel, Stanford, 2016 ═══
pop(6.2, 700, .06, .3); pop(6.3, 800, .06, .3); pop(6.45, 600, .09, .4);                            // balão "?"
tapeR(7.75, .1); pop(7.95, 820, .06, .2);                                                           // etiqueta de nome
F(10.75, X.whoosh({ dur: .4, f0: 2500, f1: 600, peak: .7, seed: S() }), { gain: .07, pan: -.4 });   // alfinete caindo
F(11.1, X.knock({ f: 220, seed: S() }), { gain: .16, pan: -.4, rev: .2 }); F(11.1, X.woodClick({ seed: S() }), { gain: .08, pan: -.4 });
scrib(11.15, .35, .06, -.4); scrib(11.3, .3, .05, -.3);
pop(11.35, 480, .09, -.4); tapeR(11.55, .08, -.2); pop(11.7, 760, .06, -.2);
for (let i = 0; i < 6; i++) F(12.55 + i * .15, X.paper({ dur: .18, seed: S(), dens: 160, shape: u => Math.exp(-u * 4) }), { gain: .1, pan: .3 });  // folhas do calendário
F(13.55, X.impact({ dur: 1.0, f0: 110, f1: 50, noise: .25, seed: S() }), { gain: .14 }); chime(13.58, 880, .04, .3);

// ═══ 2 · 60 pessoas, EEG, ressonância ═══
for (let k = 0; k < 60; k++) pop(15.15 + k / 59 * 2.35 + (rng() - .5) * .03, 520 + rng() * 420, .035, pan());   // adesivos colando
F(19.05, X.whoosh({ dur: .4, f0: 2000, f1: 500, peak: .7, seed: S() }), { gain: .06 }); F(19.4, X.knock({ f: 180, seed: S() }), { gain: .1 }); F(19.42, X.blip({ f: 700, f1: 1100, dur: .2, decay: 14 }), { gain: .04 });  // touca
F(19.45, X.zip({ dur: .5, f0: 500, f1: 1800, seed: S(), peak: .5 }), { gain: .05, pan: .3 });      // fios
for (let t = 19.7; t < 22.3; t += .5) F(t, X.beep({ f: 1320, dur: .06 }), { gain: .022, pan: .4 });
F(19.7, X.scribble({ dur: 2.6, seed: S(), rate: 14, f: 2600 }), { gain: .035, pan: .4, fi: .2, fo: .3 });   // plotter do EEG
F(20.9, X.drawer({ dur: 1.0, seed: S() }), { gain: .1 });                                           // maca entrando
F(21.8, X.scanner({ dur: .7, seed: S() }), { gain: .06 }); F(21.85, X.beep({ f: 990, dur: .12 }), { gain: .05 }); F(22.0, X.beep({ f: 990, dur: .12 }), { gain: .05 });

// ═══ 3 · dois grupos ═══
scrib(23.95, .55, .1);                                                                               // marcador divide
for (let i = 0; i < 26; i++) F(24.05 + rng() * 1.2, X.woodClick({ seed: S() }), { gain: .035 * (.6 + .4 * rng()), pan: pan() });   // grupos se afastam
F(24.1, X.whoosh({ dur: 1.0, f0: 300, f1: 1100, peak: .5, seed: S() }), { gain: .07, pan: -.4, panEnd: .4 });
F(26.85, X.swirl({ dur: 2.6, seed: S(), rate: .6 }), { gain: .05, pan: -.4, fi: .3, fo: .6 }); F(26.9, X.sparkle({ dur: 1.2, seed: S(), dens: 30, peak: .3 }), { gain: .05, pan: -.4 });
scrib(27.0, .7, .06, -.4); tapeR(27.1, .08, -.4);                                                    // marca-texto + ALTA
F(29.75, X.blip({ f: 300, f1: 200, dur: .5, decay: 6 }), { gain: .06, pan: .4 }); for (let i = 0; i < 8; i++) F(29.75 + rng() * .4, X.woodClick({ seed: S(), f: 1300 }), { gain: .03, pan: .4 });
tapeR(29.85, .08, .4);

// ═══ 4 · hipnotizar ═══
for (let t = 33.0; t < 37.6; t += .714) tick(t, .045, -.3, 2800);                                  // relógio do Spiegel
[35.75, 35.87, 35.99].forEach((t, i) => pop(t, 640 + i * 90, .08, (i - 1) * .4));                   // toucas
F(36.8, X.whoosh({ dur: 1.5, f0: 200, f1: 2400, peak: .92, seed: S(), ca: 2.5, cr: 6 }), { gain: .13 });   // zoom through
F(38.26, X.impact({ dur: 1.2, f0: 90, f1: 40, noise: .2, seed: S() }), { gain: .14, rev: .4 }); F(38.26, reverse(X.whoosh({ dur: .5, f0: 500, f1: 3000, peak: .7, seed: S() })), { gain: .06 });
[38.6, 38.8, 39.0].forEach((t, i) => { slap(t, .11, (i - 1) * .5); chime(t + .02, [659, 784, 988][i], .03, (i - 1) * .5); });   // post-its

// ═══ 5 · atenção focada ═══
pop(41.8, 600, .08, -.2); chime(41.85, 880, .04, -.2); tapeR(42.0, .08, -.2);
F(44.9, X.click({ seed: S(), f: 1500 }), { gain: .1 }); F(44.95, X.hum({ dur: 4.4, f: 120, seed: S(), buzz: .15 }), { gain: .02, fi: .1, fo: .6 });   // lâmpada
for (let t = 45.0; t < 45.55; t += .14) F(t, X.hum({ dur: .1, f: 180, seed: S(), buzz: .6 }), { gain: .04, pan: -.5 });   // celular vibrando
F(45.05, X.ratchet({ dur: .9, n: 18, f: 3400, accel: 1, seed: S() }), { gain: .04, pan: .5 });      // despertador
F(45.2, X.murmur({ dur: 1.3, seed: S(), voices: 2 }), { gain: .03, pan: .5 });                      // megafone "blá"
[[45.55, -.5], [46.0, .5], [46.45, -.5], [46.9, .5]].forEach(([t, p]) => F(t, X.whoosh({ dur: .5, f0: 1500, f1: 300, peak: .2, seed: S() }), { gain: .05, pan: p }));   // distrações caem
F(46.4, X.whoosh({ dur: 1.6, f0: 2400, f1: 500, q: 2, peak: .6, seed: S() }), { gain: .05 });      // feixe estreita
F(47.6, X.shimmer({ dur: 1.6, f: 1046, peak: .1, seed: S() }), { gain: .06, rev: .5 });

// ═══ 6 · telefone de lata + juiz ═══
pop(49.8, 500, .08, -.4); pop(49.85, 560, .08, .4); F(49.85, X.zip({ dur: .3, f0: 900, f1: 2500, seed: S() }), { gain: .04 });
for (let t = 49.95; t < 50.6; t += .2) F(t, X.blip({ f: 1200, dur: .08, decay: 30 }), { gain: .025, pan: (t - 50.3) * 2 });
F(50.6, X.blip({ f: 700, f1: 200, dur: 1.0, decay: 2.5 }), { gain: .05 });                          // fio afrouxa
pop(51.75, 520, .07, -.4); tapeR(51.85, .07, -.4); pop(53.75, 460, .07, .4); tapeR(53.85, .07, .4);
[[56.5], [58.2]].forEach(([t]) => F(t, X.whoosh({ dur: .7, f0: 600, f1: 1800, peak: .3, seed: S() }), { gain: .06, pan: -.6, panEnd: -.1 }));   // bilhetes chegam
[57.3, 59.0].forEach(t => { F(t, X.knock({ f: 140, seed: S() }), { gain: .22, rev: .25 }); F(t, X.impact({ dur: .5, f0: 160, f1: 70, noise: .4, seed: S() }), { gain: .12 }); scrib(t + .02, .2, .07, -.2); F(t + .12, X.crackle({ dur: .5, seed: S(), dens: 160, bed: .1 }), { gain: .06, pan: -.3 }); });
F(60.3, X.breath({ dur: .8, seed: S() }), { gain: .08 }); F(60.45, X.blip({ f: 300, f1: 180, dur: .5, decay: 4 }), { gain: .03 });   // bocejo
F(61.15, X.blip({ f: 520, f1: 260, dur: .5, decay: 6 }), { gain: .04, rev: .4 }); F(61.6, X.blip({ f: 440, f1: 220, dur: .5, decay: 6 }), { gain: .03, rev: .4 });   // Zzz
[60.95, 61.75].forEach(t => F(t, X.whoosh({ dur: 1.4, f0: 500, f1: 1500, peak: .5, seed: S(), ca: 1, cr: 1 }), { gain: .06, pan: -.6, panEnd: .6 }));   // bilhetes passam

// ═══ 7 · sincronia ═══
pop(63.95, 600, .07, .3); pop(64.25, 520, .07, -.2); tapeR(64.0, .06, .3); tapeR(64.3, .06, -.2);
for (let t = 63.9; t < 65.4; t += .8) chime(t, 784, .025, .3); for (let t = 64.1; t < 65.4; t += .6) chime(t, 659, .025, -.3);
// metrônomos: tique em cada extremo do pêndulo (mesma fórmula do visual)
{
	const w = 2 * Math.PI * .8, ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2, seg = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
	const angA = T => .42 * Math.sin(w * (T - 63)), angB = T => { const ph = Math.PI * .95 * (1 - ease(seg(T, 66.6, 68.2))); return .42 * Math.sin(w * (T - 63) * (1 + .25 * (ph / Math.PI)) + ph); };
	for (const [fn, p, f] of [[angA, -.5, 2400], [angB, .5, 2000]]) { let prev = fn(65.3) - fn(65.29); for (let T = 65.3; T < 68.7; T += .005) { const d = fn(T + .005) - fn(T); if (Math.sign(d) !== Math.sign(prev)) F(T, X.woodClick({ seed: S(), f }), { gain: .09, pan: p }); prev = d; } }
}
pop(65.55, 620, .07, -.5); tapeR(65.6, .07, -.5); pop(66.95, 560, .07, .5); tapeR(67.0, .07, .5);
F(68.15, X.sparkle({ dur: 1.0, seed: S(), dens: 40, peak: .3 }), { gain: .07 }); chime(68.2, 1046, .04); chime(68.3, 1318, .03);
// nuvens
pop(68.55, 420, .1, -.3); F(68.6, X.paper({ dur: .4, seed: S(), dens: 60 }), { gain: .05, pan: -.3 });
[69.0, 69.3, 69.6, 69.9, 70.2].forEach((t, i) => { pop(t, 520 + i * 90, .07, -.3); chime(t + .02, [523, 659, 784, 880, 1046][i], .025, -.3); });
F(71.4, X.impact({ dur: 1.2, f0: 100, f1: 45, noise: .2, seed: S() }), { gain: .16, rev: .4 }); F(71.42, X.sparkle({ dur: 1.4, seed: S(), dens: 50, peak: .2 }), { gain: .07 });
pop(73.1, 380, .08, .4); tapeR(73.35, .07, -.4); tapeR(73.55, .07, .4);

// ═══ 8 · conclusão ═══
F(78.95, X.whoosh({ dur: .4, f0: 300, f1: 1200, peak: .4, seed: S() }), { gain: .07 }); paperS(79.25, .2, .09);
[[79.3, 659], [80.3, 784], [81.3, 988]].forEach(([t, f]) => { scrib(t, .28, .1, -.2); chime(t + .2, f, .05, -.2); });   // ✓ ✓ ✓
pop(81.35, 700, .1, -.4); F(81.4, X.sparkle({ dur: .8, seed: S(), dens: 30, peak: .3 }), { gain: .05, pan: -.4 });   // joinha

// ═══ 9 · carimbo + loop ═══
F(85.6, X.whoosh({ dur: .8, f0: 200, f1: 2000, peak: .95, seed: S(), ca: 2.5, cr: 6 }), { gain: .14 });
F(86.4, X.stamp({ seed: S() }), { gain: .4, rev: .3 }); F(86.4, X.impact({ dur: 1.8, f0: 70, f1: 32, noise: .3, seed: S() }), { gain: .32, rev: .5 });
[[-.5, 392], [0, 523], [.5, 659]].forEach(([p, f]) => F(86.42, X.shimmer({ dur: 1.8, f, peak: .15, seed: S(), ca: .5, cr: 1.5 }), { gain: .04, pan: p, rev: .6 }));
for (let t = 88.0; t < 88.35; t += .455) tick(t, .05, .2, 2600);

// ── master ──
const SR = X.SR, n = fx.n, M = [new Float32Array(n), new Float32Array(n)];
const fadeOut = i => Math.min(1, (n - i) / (.15 * SR));
let pk = 0; for (let i = 0; i < n; i++) { const f = fadeOut(i); for (const [c, k] of [[0, 'L'], [1, 'R']]) { fx[k][i] *= f; amb[k][i] *= f; M[c][i] = fx[k][i] + amb[k][i]; pk = Math.max(pk, Math.abs(M[c][i])); } }
const gain = .89 / pk;
for (const b of [M[0], M[1]]) for (let i = 0; i < n; i++) b[i] *= gain;
const out = path.resolve(__dirname, '../../renders');
writeWav(process.env.SFX_OUT || path.join(out, '04-hipnose-existe-v2-sfx.wav'), M[0], M[1]);
console.log(`pronto · pico ${pk.toFixed(3)} → ganho ${gain.toFixed(3)} · ${DUR}s`);
