// Trilha de EFEITOS SONOROS (sem música, sem voz) de 02-memorias-falsas, sincronizada com os tempos das cenas.
// Os tempos seguem timemap.js (narração gravada). Uso: node demos/02-memorias-falsas/sfx.cjs  → renders/02-memorias-falsas-sfx.wav (+ stems -efeitos / -ambiencia)
'use strict';
const path = require('path'), fs = require('fs');
const RAW = require('../../tools/sfx-lib.js');
// mapa de tempo [vídeo, animação] (mesmo arquivo usado por main.js) — os cues abaixo estão em tempo da ANIMAÇÃO
const TM = JSON.parse(fs.readFileSync(path.join(__dirname, 'timemap.js'), 'utf8').replace(/^[\s\S]*?export default/, '').replace(/;\s*$/, ''));
const W = t => { for (let k = 1; k < TM.length; k++) if (t <= TM[k][1] || k === TM.length - 1) { const [a0, b0] = TM[k - 1], [a1, b1] = TM[k]; return a0 + (a1 - a0) * Math.min(1, Math.max(0, (t - b0) / (b1 - b0))); } return t; };
// geradores "preguiçosos": a duração dos sons longos (≥ 0,5 s) acompanha o esticamento local do tempo
const EAGER = new Set(['mix', 'reverse', 'silence', 'norm', 'fades', 'mulberry32', 'Bus', 'writeWav', 'SR']);
const X = {}; for (const k in RAW) X[k] = typeof RAW[k] === 'function' && !EAGER.has(k) ? (...a) => ({ __lazy: k, a }) : RAW[k];
const nomDur = v => !v || !v.__lazy ? 0 : typeof v.a[0] === 'number' ? v.a[0] : v.a[0] && v.a[0].dur || 0;
const res = (v, r = 1) => { if (!v || !v.__lazy) return v; const a = v.a.slice(); if (r !== 1) { if (typeof a[0] === 'number') a[0] *= r; else if (a[0] && a[0].dur >= .5) a[0] = { ...a[0], dur: a[0].dur * r }; } return RAW[v.__lazy](...a); };
X.mix = (...parts) => RAW.mix(...parts.map(([b, g, o]) => [res(b), g, o]));
X.reverse = b => RAW.reverse(res(b));
const { Bus, writeWav, mulberry32, reverse, mix } = X;

const DUR = TM[TM.length - 1][0];
const fx = new Bus(DUR), amb = new Bus(DUR);
const rng = mulberry32(2024);
let seed = 100; const S = () => ++seed;
const put = (bus, t, b, o = {}) => { const T = W(t), d = nomDur(b), r = d >= .5 ? (W(t + d) - T) / d : 1; bus.add(T, res(b, r), o); };
const F = (t, b, o) => put(fx, t, b, o), A = (t, b, o) => put(amb, t, b, o);

// ── utilitários de cue ──
const ui = (t, g = .08, pan = 0) => F(t, X.tick({ f: 4200, dur: .04, seed: S(), decay: 220 }), { gain: g, pan, rev: .25 });
const cut = t => F(t - .32, X.whoosh({ dur: .6, f0: 600, f1: 2600, peak: .55, seed: S(), body: .2 }), { gain: .07, pan: -.2, panEnd: .2 });
const trans = (t, g = .26) => { F(t - 1.1, X.whoosh({ dur: 1.7, f0: 180, f1: 1600, peak: .65, seed: S() }), { gain: g, pan: -.3, panEnd: .3, rev: .35 }); F(t + .02, X.impact({ dur: 1.2, f0: 70, f1: 34, noise: .15, seed: S() }), { gain: g * .55 }); };
const hit = (t, g = .18) => { F(t, X.impact({ dur: 1.4, f0: 85, f1: 40, noise: .2, seed: S() }), { gain: g, rev: .4 }); F(t, X.shimmer({ dur: 1.6, f: 660 + rng() * 220, peak: .08, seed: S(), ca: .5, cr: 2 }), { gain: g * .45, rev: .5 }); };
const bed = (bus, t0, t1, buf, g, fi = 1.2, fo = 1.2) => put(bus, t0, buf, { gain: g, fi, fo });
const clock = (t0, t1, g = .035, pan = .5) => { const tk = res(X.click({ seed: 7, f: 2300 })), tc = res(X.click({ seed: 8, f: 1900 })); for (let T = Math.ceil(W(t0)), k = 0; T < W(t1); T++, k++) amb.add(T, k % 2 ? tc : tk, { gain: g, pan, rev: .35 }); };  // relógio em segundos reais
const lampHum = (t0, t1, g) => bed(amb, t0, t1, X.hum({ dur: t1 - t0, f: 120, seed: S(), buzz: .2 }), g, 2.5, 1.5);
const snaps = (t0, t1, n, g = .1, dist = u => u) => { for (let k = 0; k < n; k++) F(t0 + (t1 - t0) * dist(rng()), X.woodClick({ seed: S() }), { gain: g * (.6 + .4 * rng()), pan: rng() * 1.4 - .7, rev: .2 }); };
const cuts = list => list.forEach(cut);

// ═══ ABERTURA (0–45) ═══
bed(amb, 0, 45.5, X.roomTone(45.5, 1), .05, 1.5, .6);
lampHum(.4, 45.5, .035); clock(1, 45, .03, .55);
F(.32, X.click({ seed: 1, f: 1600 }), { gain: .3, rev: .2 });                                   // abajur liga
F(8.5, X.creak({ dur: 2.9, seed: 2, f: 700 }), { gain: .14, rev: .25 });                       // couro do álbum
F(8.6, X.whoosh({ dur: 2.8, f0: 200, f1: 900, peak: .7, seed: 3, body: .8 }), { gain: .2, pan: -.4, panEnd: .2 });
F(11.3, X.impact({ dur: .7, f0: 95, f1: 48, noise: .5, seed: 4 }), { gain: .3 }); F(11.3, X.paper({ dur: .25, seed: 5, dens: 200 }), { gain: .12 });
F(17.2, X.shimmer({ dur: 2.2, f: 523, peak: .6, seed: 6 }), { gain: .13, rev: .6 });             // pergunta projetada
F(22.2, X.shimmer({ dur: .9, f: 523, peak: .05, seed: 6, ca: 1, cr: 1 }), { gain: .07, rev: .5 });
F(24.2, X.scribble({ dur: 2.2, seed: 7, rate: 6 }), { gain: .22, pan: .1 });                   // legenda à mão
F(27.4, X.liquid({ dur: 4, seed: 8 }), { gain: .07 });                                           // tinta escorrendo
[27.6, 28.5, 29.3, 30.2, 31].forEach((t, i) => F(t, X.drop({ seed: i }), { gain: .14, pan: .1 + i * .05, rev: .5 }));
[27.9, 29.8].forEach(t => F(t, reverse(X.drop({ seed: 3 })), { gain: .09, rev: .6 }));
F(31.3, X.paper({ dur: 1.8, seed: 9, dens: 90 }), { gain: .22, pan: -.2, panEnd: .3 });        // folha vira
F(31.4, X.whoosh({ dur: 2.4, f0: 300, f1: 1700, peak: .5, seed: 10 }), { gain: .22, pan: -.3, panEnd: .3 });
F(33.75, X.impact({ dur: .5, f0: 100, f1: 55, noise: .5, seed: 11 }), { gain: .18 });
F(33.6, X.crackle({ dur: 3.4, seed: 12, dens: 18, bed: .15 }), { gain: .05, pan: -.3 });         // polaroids revelando
F(34.4, X.crackle({ dur: 3.2, seed: 13, dens: 18, bed: .15 }), { gain: .05, pan: .3 });
F(37.5, X.impact({ dur: 3, f0: 58, f1: 28, noise: .1, seed: 14 }), { gain: .22, rev: .6 });     // corredor surge
F(38.6, X.drop({ seed: 9 }), { gain: .24, pan: .25, rev: .7 });                                  // lágrima
F(38.8, X.liquid({ dur: 4.2, seed: 15 }), { gain: .04, pan: .25 });
F(38.3, X.whoosh({ dur: 6.8, f0: 110, f1: 850, peak: .78, seed: 16, body: .6 }), { gain: .28, rev: .7 });
[[40.2, -.6], [41.6, .5], [43.1, -.3]].forEach(([t, p], i) => F(t, X.drawer({ dur: .6, seed: 20 + i }), { gain: .06, pan: p, rev: .9 }));
trans(45);

// ═══ PERGUNTA (45–68) ═══
bed(amb, 45, 68.4, X.airBed(23.4, 50, 220, 3.5), .035, .8, .6);
F(47.4, X.pop({ f: 700 }), { gain: .12, pan: -.4, rev: .4 }); F(47.7, X.pop({ f: 740 }), { gain: .12, pan: .4, rev: .4 });
F(48, X.crackle({ dur: 5, seed: 51, dens: 8, bed: .05 }), { gain: .03 });
F(53, X.shimmer({ dur: 2, f: 440, peak: .6, seed: 52 }), { gain: .12, rev: .5 }); F(53, X.sparkle({ dur: 2, seed: 53, dens: 20 }), { gain: .07 });
F(53.8, X.whoosh({ dur: 2.4, f0: 400, f1: 2600, peak: .75, seed: 54 }), { gain: .28, pan: .7, panEnd: 0 });  // foto voa
F(55.4, X.sparkle({ dur: 2.6, seed: 55, dens: 70, peak: .2 }), { gain: .18, rev: .4 });          // dissolve em partículas
F(57.6, X.sparkle({ dur: 2.2, seed: 56, dens: 10 }), { gain: .05 });
F(59.6, X.whoosh({ dur: 3.25, f0: 350, f1: 5000, peak: .97, seed: 57, ca: 2.5 }), { gain: .22 }); // partículas formam o título
F(59.6, X.shimmer({ dur: 3.25, f: 330, peak: .97, seed: 58, ca: 2.5 }), { gain: .1 });
F(62.8, X.impact({ dur: 3, f0: 80, f1: 38, noise: .2, seed: 59 }), { gain: .42, rev: .6 });
F(62.8, X.bell({ f: 330, dur: 5, seed: 60 }), { gain: .14, rev: .7 }); F(62.8, X.sparkle({ dur: 1.5, seed: 61, dens: 40, peak: .05 }), { gain: .1 });
F(66.2, X.whoosh({ dur: 1.9, f0: 3000, f1: 300, peak: .25, seed: 62 }), { gain: .22 }); F(66.3, X.sparkle({ dur: 1.6, seed: 63, dens: 40, peak: .1 }), { gain: .08 });
trans(68);

// ═══ I · LABORATÓRIO (68–158) ═══
bed(amb, 68, 158.4, X.digitalBed(90.4, 70), .03, .8, .6);
cuts([75, 80, 98, 106, 117, 123, 130, 138, 146, 152]);
[[68.2, 0], [68.6, .4], [69, -.3]].forEach(([t, p], i) => F(t, X.zip({ dur: .8, f0: 200, f1: 1200, seed: 71 + i }), { gain: .1, pan: p }));
hit(69, .16); ui(70.6); ui(71.2);
F(70.6, X.scribble({ dur: 1.6, seed: 74, rate: 8 }), { gain: .08, pan: .2 });
F(75, X.whoosh({ dur: 3.6, f0: 140, f1: 650, peak: .92, seed: 75 }), { gain: .18, pan: -.75, panEnd: -.15 });   // carros se aproximam
F(75, X.whoosh({ dur: 3.6, f0: 150, f1: 700, peak: .92, seed: 76 }), { gain: .18, pan: .75, panEnd: .15 });
F(77.4, X.impact({ dur: .35, f0: 220, f1: 90, noise: .4, seed: 77 }), { gain: .2 });             // "esmagaram"
{ const m = X.mix([X.metal({ f: 310, dur: .9, seed: 78 }), .7], [X.impact({ dur: .9, f0: 120, f1: 50, noise: .8, seed: 79 }), 1]); const rv = reverse(m); F(78.6 - rv.length / X.SR, rv, { gain: .2, rev: .3 }); }
F(78.6, X.impact({ dur: .6, f0: 90, f1: 45, noise: .3, seed: 80 }), { gain: .26 });
F(80.4, X.ratchet({ dur: 1.2, n: 14, accel: .7, seed: 81 }), { gain: .1 }); F(81.6, X.beep({ f: 880 }), { gain: .06 });
F(82.5, X.ratchet({ dur: .9, n: 10, accel: .7, seed: 82 }), { gain: .12 }); F(83.4, X.beep({ f: 1100 }), { gain: .07 });
ui(80.8); ui(82.6);
F(85.4, X.whoosh({ dur: 1.6, f0: 2500, f1: 280, peak: .8, seed: 83 }), { gain: .2 }); F(87, X.blip({ f: 1400, dur: .4 }), { gain: .07 });
F(87.6, X.zip({ dur: 1.6, f0: 300, f1: 1500, seed: 84 }), { gain: .1 });
F(92.4, X.scribble({ dur: 2.2, seed: 85, rate: 7 }), { gain: .14 });
F(94.4, X.flutter({ dur: 3.4, seed: 86 }), { gain: .13, pan: .2, panEnd: .8 });                  // envelope
F(98.4, X.flutter({ dur: 3.2, seed: 87 }), { gain: .13, pan: -.7, panEnd: .3 });
F(98, X.murmur({ dur: 8, seed: 88, voices: 3 }), { gain: .1, rev: .3, fi: .8, fo: .8 });           // o parente conta
[101.6, 102.2, 102.8].forEach((t, i) => F(t, X.zip({ dur: 1.2, f0: 400, f1: 1000, seed: 89 + i }), { gain: .06, pan: .2 + i * .15 }));
[102.6, 103.2, 103.8].forEach((t, i) => F(t, X.pop({ f: 560 + i * 40 }), { gain: .08, pan: .2 + i * .2 }));
[0, 1, 2, 3].forEach(i => F(106.4 + i * .35, X.paper({ dur: .3, seed: 95 + i, dens: 150 }), { gain: .12, pan: -.45 + i * .3 }));
[108.6, 109.3, 110].forEach((t, i) => { F(t, X.tick({ f: 3000, dur: .05, seed: 99 + i }), { gain: .16, pan: -.45 + i * .3 }); F(t, X.scribble({ dur: .45, seed: 102 + i, rate: 9 }), { gain: .1, pan: -.45 + i * .3 }); });
F(113.2, X.impact({ dur: 1.5, f0: 75, f1: 38, noise: .15, seed: 105 }), { gain: .2, rev: .5 }); F(113.2, X.shimmer({ dur: 1.4, f: 587, peak: .1, seed: 106 }), { gain: .07 });
F(113.6, X.whoosh({ dur: 3.45, f0: 200, f1: 3200, peak: .95, seed: 107, ca: 3 }), { gain: .26 }); // mergulho no cartão
A(117, X.mallBed(6.3, 110), { gain: .1, fi: .6, fo: .6 });                                       // shopping abafado
ui(118.4);
F(123.6, X.paper({ dur: .8, seed: 111, dens: 110 }), { gain: .17 });                               // página do calendário
F(124, X.scribble({ dur: 4.3, seed: 112, rate: 7 }), { gain: .17, pan: -.2, panEnd: .2 });       // escreva o que lembra
[126.4, 127.8].forEach((t, i) => F(t, X.scribble({ dur: .8, seed: 113 + i, rate: 13 }), { gain: .16, pan: i ? .2 : -.3 }));
F(130.6, X.scribble({ dur: 1.8, seed: 115, rate: 11 }), { gain: .18 });                           // assinatura
F(133.2, X.stamp({ seed: 116 }), { gain: .5, rev: .25 });                                          // selo da família
ui(134);
[0, 1, 2, 3, 4, 5].forEach(k => F(139.4 + k * .55, X.bell({ f: 1175 * (1 + (rng() - .5) * .01), dur: 1.6, bright: .4, seed: 117 + k }), { gain: .1, pan: -.6 + k * .24, rev: .4 }));
ui(140.6); ui(143.4);
A(146, X.mallBed(12.4, 130), { gain: .09, fi: .6, fo: .5 });
[0, 1, 2, 3, 4].forEach(i => F(147.2 + i * .55, X.scribble({ dur: .5, seed: 124 + i, rate: 10 }), { gain: .12 }));
[150.5, 151.5, 152.5, 153.5, 154.6, 155.6, 156.6, 157.5].forEach((t, i) => F(t, X.breath({ dur: .65, seed: 131 + i }), { gain: .035, rev: .4 }));
[153.2, 155.7].forEach((t, i) => F(t, X.drop({ seed: 140 + i }), { gain: .07, rev: .5 }));
trans(158);

// ═══ II · CONSULTÓRIO (158–236) ═══
bed(amb, 158, 236.3, X.roomTone(78.3, 150), .055, 1, .3);
lampHum(158.3, 236.2, .03); clock(159, 235.8, .035, -.5);
cuts([165, 170, 175, 185, 191, 201, 208, 218, 225, 231]);
F(157.95, X.whoosh({ dur: 1.7, f0: 2600, f1: 200, peak: .3, seed: 151 }), { gain: .2 }); F(158, X.sparkle({ dur: 1.5, seed: 152, dens: 60, peak: .1 }), { gain: .06 });
F(158.3, X.click({ seed: 153, f: 1500 }), { gain: .28, rev: .3 });
hit(159.4, .13);
F(165, X.murmur({ dur: 9.5, seed: 154, voices: 1, lp: 1100 }), { gain: .07, rev: .8, fi: .8, fo: 1 });  // voz do profissional (ininteligível)
F(169.8, X.metal({ f: 1250, dur: .3, decay: 25, seed: 155 }), { gain: .15, pan: .3, rev: .3 });         // trinco
F(171.6, X.shimmer({ dur: 1.6, f: 494, peak: .5, seed: 156 }), { gain: .09, rev: .5 });
[[176, 196], [177.4, 185], [178.8, 175]].forEach(([t, f], i) => F(t, X.bell({ f, dur: 4, seed: 157 + i }), { gain: .17, pan: -.4 + i * .4, rev: .6 }));
F(182.3, X.whoosh({ dur: 1.6, f0: 200, f1: 2600, peak: .92, seed: 160 }), { gain: .2 }); F(182.3, X.shimmer({ dur: 1.6, f: 392, peak: .92, seed: 161 }), { gain: .1 });
F(183.8, X.impact({ dur: 1.2, f0: 80, f1: 40, noise: .15, seed: 162 }), { gain: .16, rev: .4 });
F(186, X.drawer({ dur: 2.6, seed: 163, clunk: false }), { gain: .32, rev: .3 });                   // a gaveta abre
F(186.4, X.hum({ dur: 4.6, f: 180, seed: 164, buzz: .1 }), { gain: .035, fi: 2, fo: .5 });
ui(188.4);
for (let k = 0; k < 5; k++) F(191.5 + k * 2, X.paper({ dur: .35, seed: 165 + k, dens: 140 }), { gain: .09, pan: -.5, panEnd: .5 });  // cartas passando
for (let k = 0; k < 7; k++) F(192.5 + k, X.click({ seed: 171 + k, f: k % 2 ? 1800 : 2200 }), { gain: .1, pan: .6 });            // dia 1…7
ui(191.6);
F(202.3, X.whoosh({ dur: 2.3, f0: 300, f1: 1200, peak: .5, seed: 180 }), { gain: .12 });
F(204, X.swirl({ dur: 4, seed: 181, rate: .45 }), { gain: .08 });
for (let i = 0; i < 6; i++) { F(208.6 + i * .35, X.paper({ dur: .18, seed: 182 + i, dens: 220 }), { gain: .07, pan: -.5 }); F(208.6 + i * .35, X.paper({ dur: .18, seed: 190 + i, dens: 220 }), { gain: .07, pan: .5 }); }
const bad = [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 1];
for (let i = 6; i < 14; i++) { const t = 208.6 + i * .35 + 2.6; F(t, X.paper({ dur: .22, seed: 200 + i, dens: 220 }), { gain: .09, pan: .5 }); if (bad[i]) F(t + .02, X.bell({ f: 740 * (1 + (rng() - .5) * .06), dur: 1.2, bright: .3, seed: 215 + i }), { gain: .06, pan: .5, rev: .4 }); }
ui(212.4);
for (let i = 0; i < 14; i++) F(218.6 + i * .2, X.zip({ dur: .9, f0: 300, f1: 900 + i * 30, seed: 230 + i }), { gain: .035, pan: i < 6 ? -.5 : .5 });
F(225.2, X.paper({ dur: 1.3, seed: 245, dens: 50, body: .8 }), { gain: .2, pan: -.5, panEnd: 0 });   // documento desliza
F(227.6, X.stamp({ seed: 246 }), { gain: .5, rev: .25 });
ui(228.2);
F(231.3, X.tone({ f: 1046, dur: 4.65, att: 1.4 }), { gain: .05 });                                // tom limpo, inquietante (corta seco em 235.95)
trans(236, .2);

// ═══ III · O BALÃO (236–308) ═══
bed(amb, 236, 259.3, X.digitalBed(23.3, 250), .03, .6, .3);
A(243.2, X.mallBed(7.8, 251), { gain: .075, fi: 1, fo: .8 }); A(243.55, X.mallBed(7.45, 252), { gain: .06, fi: 1, fo: .8 });  // duplicado e defasado
bed(amb, 259, 282.3, X.roomTone(23.3, 253), .05, .3, .3);
bed(amb, 282, 308.3, X.digitalBed(26.3, 254), .028, .3, .6);
cuts([243, 251, 259, 264, 269, 274, 282, 289, 296, 301]);
[236, 236.6, 237.2].forEach((t, i) => F(t, X.zip({ dur: .9, f0: 220, f1: 1100, seed: 255 + i }), { gain: .08, pan: -.4 + i * .4 }));
hit(237, .15); F(243.2, X.shimmer({ dur: 1.4, f: 415, peak: .7, seed: 258 }), { gain: .07, rev: .5 }); ui(244); ui(244.6);
F(251.2, X.zip({ dur: 1.4, f0: 250, f1: 1300, seed: 259 }), { gain: .1 });
F(253, X.ratchet({ dur: 3, n: 14, accel: 1.4, f: 3100, seed: 260 }), { gain: .08, pan: -.5, panEnd: .5 });   // régua da linha do tempo
F(252.6, X.pop({ f: 480 }), { gain: .08, pan: -.4 }); F(255.8, X.pop({ f: 640 }), { gain: .14, pan: .3 }); F(255.8, X.impact({ dur: .8, f0: 90, f1: 45, noise: .1, seed: 261 }), { gain: .1 });
for (let t = 259.8; t < 263.7; t += .38 + rng() * .06) F(t, X.snip({ seed: S() }), { gain: .22, pan: .1 });   // tesoura
F(259.8, X.paper({ dur: 3.9, seed: 262, dens: 30, body: .3 }), { gain: .05 });
F(264.2, X.whoosh({ dur: 3.2, f0: 300, f1: 1000, peak: .5, seed: 263 }), { gain: .1 }); F(267.6, X.paper({ dur: .12, seed: 264, dens: 300 }), { gain: .14 });
F(268, X.tear({ dur: .5, seed: 265, f0: 2500, f1: 4800, dens: 700 }), { gain: .2 }); F(268.5, X.woodClick({ seed: 266, f: 1300 }), { gain: .1 });  // fita adesiva
F(271.6, X.shimmer({ dur: 2.1, f: 523, peak: .6, seed: 267 }), { gain: .08, rev: .4 });
A(274.8, X.wind({ dur: 7.5, seed: 268 }), { gain: .07, fi: 2, fo: 1 });                          // vento alto, distante
[[275, 1.2, .14], [277.4, 1.4, .2], [279.8, 1.7, .28]].forEach(([t, d, g], i) => F(t, X.burner({ dur: d, seed: 269 + i }), { gain: g, pan: .15, rev: .3 }));  // maçarico
const lit = { 1: 1, 3: .5, 6: 1, 8: 1, 9: .5, 12: 1, 13: .5, 15: 1, 17: .5, 19: 1 };
Object.keys(lit).forEach((k, o) => F(283 + o * .4, X.blip({ f: 1320, dur: .35, decay: 10 }), { gain: .05 * (.5 + lit[k]), pan: ((+k % 5) - 2) * .3 - .2, rev: .3 }));
ui(285.4, .1); F(285.4, X.impact({ dur: .7, f0: 100, f1: 50, noise: .1, seed: 272 }), { gain: .1 });
F(290.5, X.whoosh({ dur: .7, f0: 200, f1: 900, peak: .3, seed: 273, body: 1 }), { gain: .14 });          // ignição
F(290.6, X.crackle({ dur: 5, seed: 274, dens: 45, bed: .3 }), { gain: .2 });                       // papel queimando
ui(291);
F(296.6, X.zip({ dur: 1.4, f0: 200, f1: 700, seed: 275 }), { gain: .1, pan: -.25 }); F(297.6, X.zip({ dur: 1.6, f0: 200, f1: 1150, seed: 276 }), { gain: .13, pan: .25 });
F(299.2, X.blip({ f: 1760, dur: .35, decay: 14 }), { gain: .13, pan: .25 }); F(299.2, X.tick({ f: 5000, seed: 277 }), { gain: .1, pan: .25 });   // surpresa
[301.8, 302.6, 303.5, 304.4, 305.3].forEach((t, i) => F(t, X.whoosh({ dur: .6, f0: 900, f1: 2400, q: 1.8, peak: .4, seed: 278 + i, body: .2 }), { gain: .07, pan: -.5 + i * .25 }));  // pinceladas
A(301.6, X.birds({ dur: 6.8, seed: 284 }), { gain: .06, pan: .3, fi: 1, fo: .5 }); A(301.6, X.wind({ dur: 6.8, seed: 285, lo: 300, hi: 1200 }), { gain: .05, fi: 1.5, fo: .5 });
trans(308, .2);

// ═══ PONTE (308–322) ═══
bed(amb, 308, 321.1, X.airBed(13.1, 300, 196, 2), .03, .6, .3);
F(308.2, X.whoosh({ dur: 5.3, f0: 200, f1: 1500, peak: .92, seed: 301 }), { gain: .17, pan: -.8, panEnd: -.1 });
F(308.2, X.whoosh({ dur: 5.3, f0: 210, f1: 1450, peak: .92, seed: 302 }), { gain: .17, pan: .8, panEnd: .1 });
F(313.5, X.impact({ dur: 2.2, f0: 75, f1: 36, noise: .15, seed: 303 }), { gain: .28, rev: .6 }); F(313.5, X.shimmer({ dur: 2, f: 392, peak: .05, seed: 304, ca: 1, cr: 2 }), { gain: .08, rev: .6 });
[309, 311.2, 313.4].forEach((t, i) => F(t, X.whoosh({ dur: 1.6, f0: 800, f1: 2200, q: 1.6, peak: .35, seed: 305 + i, body: .2 }), { gain: .09 }));
F(313, X.sparkle({ dur: 2.5, seed: 309, dens: 40, peak: .4 }), { gain: .06 });
F(314, X.impact({ dur: 2, f0: 55, f1: 30, noise: .05, seed: 310 }), { gain: .12, rev: .5 });
F(315.6, X.drawer({ dur: 1.4, seed: 311, clunk: false }), { gain: .25, rev: .3 });
F(316.2, X.paper({ dur: 1.2, seed: 312, dens: 120 }), { gain: .2 });                                // pintura dobra
F(317.2, X.whoosh({ dur: 2.6, f0: 400, f1: 1300, peak: .6, seed: 313 }), { gain: .17, pan: 0, panEnd: -.3 });
F(320.2, X.drawer({ dur: .8, seed: 314 }), { gain: .4, rev: .35 });                                // fecha com clique metálico
trans(322, .14);

// ═══ IV · O ARQUIVO (322–384) ═══
bed(amb, 322, 383.2, X.roomTone(61.2, 320), .045, .8, 1.5); bed(amb, 322, 383.2, X.digitalBed(61.2, 321), .02, 1, 1.5);
cuts([328, 336, 342, 350, 358, 363, 371, 378]);
F(322.3, X.hum({ dur: 2.9, f: 60, seed: 322, buzz: .4 }), { gain: .05, fi: .5, fo: .05 }); hit(322.4, .14);
F(325, X.click({ seed: 323, f: 1700 }), { gain: .3 });
F(325.2, X.glass({ seed: 324 }), { gain: .35, rev: .5 }); F(325.2, X.whoosh({ dur: .8, f0: 3000, f1: 800, peak: .05, seed: 325 }), { gain: .15 });
F(325.3, X.sparkle({ dur: 2.2, seed: 326, dens: 40, fmin: 3000, fmax: 9000, peak: .1 }), { gain: .12 });
[[329, -.8, .6], [331.2, .8, -.6], [333.4, -.6, .8]].forEach(([t, a, b], i) => F(t, X.whisper({ dur: 2.3, seed: 327 + i }), { gain: .12, pan: a, panEnd: b, rev: .5 }));  // Bartlett
ui(328.6);
F(336.4, reverse(X.sparkle({ dur: 3, seed: 330, dens: 40, fmin: 3000, fmax: 9000, peak: .1 })), { gain: .1 });
snaps(337, 339.5, 26, .13, u => Math.sqrt(u)); F(339.55, X.woodClick({ seed: 331, f: 1500 }), { gain: .25 });
ui(338.2);
[[345.6, -.3], [346.2, .3]].forEach(([t, p], i) => { F(t, X.tear({ dur: .9, seed: 332 + i, f0: 2000, f1: 3800, dens: 500 }), { gain: .17, pan: p }); F(t + .8, X.whoosh({ dur: 1.2, f0: 1200, f1: 300, peak: .3, seed: 334 + i }), { gain: .06, pan: p }); });
F(350.8, X.scanner({ dur: 3.9, seed: 336 }), { gain: .12, pan: -.4, panEnd: .4 });
[880, 988, 1109, 1319].forEach((f, i) => F(351.4 + i * .5, X.beep({ f }), { gain: .06, pan: .4 }));
F(355.8, X.stamp({ seed: 337 }), { gain: .48, rev: .3 });
F(358.3, X.bell({ f: 392, dur: 4, seed: 338 }), { gain: .07, rev: .7 }); F(358.3, X.bell({ f: 587, dur: 4, seed: 339 }), { gain: .05, rev: .7 }); F(358.3, X.shimmer({ dur: 3.5, f: 784, peak: .4, seed: 340 }), { gain: .05, rev: .6 });
ui(358.8); ui(363.6);
[364, 366.13, 368.27].forEach((t, i) => F(t, X.scanner({ dur: 2.1, seed: 341 + i }), { gain: .09, pan: -.4, panEnd: .4 }));
[[366, 740], [368.1, 988], [370.2, 1397]].forEach(([t, f]) => F(t, X.beep({ f, dur: .16 }), { gain: .08 }));
F(371.4, X.pen({ dur: 6.4, seed: 345 }), { gain: .07, fi: .2, fo: .4 }); F(371.4, X.scribble({ dur: 6.2, seed: 346, rate: 8 }), { gain: .1, pan: -.4, panEnd: .5 });
for (let t = 371.6; t < 377.8; t += .42) F(t, X.drawer({ dur: .18, seed: S(), slideGain: .2 }), { gain: .035, pan: rng() * 1.6 - .8, rev: .4 });  // gavelas em ritmo
F(372, X.swirl({ dur: 5.8, seed: 347, rate: .4 }), { gain: .05 });
F(380.4, X.stamp({ seed: 348 }), { gain: .48, rev: .3, pan: -.15 }); F(381, X.stamp({ seed: 348 }), { gain: .48, rev: .3, pan: .15 });   // dois carimbos idênticos
trans(384, .2);

// ═══ V · FORA DO LABORATÓRIO (384–434) ═══
A(386.8, X.cityBed(8.4, 380), { gain: .09, fi: 1.5, fo: .8 });
bed(amb, 395, 434.2, X.roomTone(39.2, 381), .04, .5, 1);
cuts([395, 400, 408, 416, 421, 426]);
F(385, X.whoosh({ dur: 2.6, f0: 180, f1: 800, peak: .95, seed: 382, ca: 3 }), { gain: .26 });       // paredes caem
F(387.6, X.impact({ dur: 3, f0: 70, f1: 30, noise: .3, seed: 383 }), { gain: .5, rev: .5 }); F(387.65, X.crackle({ dur: 1.8, seed: 384, dens: 60, bed: .4 }), { gain: .08 });
hit(386.2, .12); ui(386.8);
F(390, X.whoosh({ dur: 5, f0: 140, f1: 3500, peak: .97, seed: 385, ca: 3.5 }), { gain: .3 });         // dolly para a janela
for (let t = 395.6; t < 407.8; t += .55) F(t, X.drawer({ dur: .2, seed: S(), slideGain: .2 }), { gain: .025, pan: rng() * 1.6 - .8, rev: .4 });
F(396, X.pen({ dur: 6.6, seed: 386 }), { gain: .07, fi: .2, fo: .5 }); F(396, X.scribble({ dur: 6.2, seed: 387, rate: 7 }), { gain: .1 });
F(396, X.murmur({ dur: 6.5, seed: 388, voices: 1, lp: 1000 }), { gain: .06, rev: .8, fi: .6, fo: .8 });
F(403.2, X.paper({ dur: 1, seed: 389, dens: 60, body: .8 }), { gain: .2, pan: -.5, panEnd: 0 });   // REGISTRO
F(404.8, X.scribble({ dur: .55, seed: 390, rate: 3, f: 2600 }), { gain: .2 }); F(404.8, X.zip({ dur: .5, f0: 500, f1: 1400, seed: 391 }), { gain: .06 });
ui(405.2);
F(409, X.tear({ dur: 2.6, seed: 392 }), { gain: .34 });                                            // foto rasga
F(414.8, X.knock({ f: 170, seed: 393 }), { gain: .45, rev: .7 });                                 // martelo abafado
ui(412.6);
F(416.2, X.click({ seed: 394, f: 1400 }), { gain: .28 }); F(416.2, X.hum({ dur: 9.8, f: 100, seed: 395, buzz: .1 }), { gain: .03, fi: .5, fo: 1 });   // lanterna
F(421.4, X.pen({ dur: 4.2, seed: 396 }), { gain: .07, fi: .2, fo: .4 }); F(421.6, X.scribble({ dur: 3.8, seed: 397, rate: 7 }), { gain: .1 });
F(426.2, X.swirl({ dur: 7.6, seed: 398, rate: .7, slow: .85 }), { gain: .08, fi: 1, fo: 2 });       // espiral desacelera
F(427.2, X.bell({ f: 262, dur: 6, seed: 399 }), { gain: .2, rev: .8 });                          // um sino
trans(434, .14);

// ═══ VI · O CUIDADO (434–474) ═══
bed(amb, 434, 474.3, X.roomTone(40.3, 430), .045, .6, .5); lampHum(434, 444.3, .025); clock(435, 444, .03, -.4);
A(436, X.birds({ dur: 8.2, seed: 431, dens: 1 }), { gain: .035, pan: -.7, fi: 1.5, fo: .4 });
cuts([444, 450, 460, 467, 471]);
F(434.8, X.curtain({ dur: 2.8, seed: 432 }), { gain: .28, pan: -.6 });                            // cortinas abrem
F(435.4, X.shimmer({ dur: 2, f: 523, peak: .5, seed: 433 }), { gain: .1, rev: .5 });
[439.4, 439.9, 440.4].forEach((t, i) => F(t, X.pop({ f: 600 + i * 50 }), { gain: .1, pan: -.4 + i * .4, rev: .3 }));
ui(439.6);
F(444.2, X.paper({ dur: 1.2, seed: 434, dens: 50, body: .8 }), { gain: .2, pan: -.5, panEnd: 0 }); F(445.4, X.paper({ dur: 1.4, seed: 435, dens: 40 }), { gain: .07 });
ui(445); ui(445.6);
F(450, X.pen({ dur: 8.6, seed: 436 }), { gain: .045, pan: .4, fi: .5, fo: .05 });
[451.2, 453.4, 455.6].forEach((t, i) => { F(t, X.knock({ f: 260, seed: 437 + i }), { gain: .12, pan: -.3 }); F(t, X.blip({ f: 520, dur: .3 }), { gain: .04 }); });   // três toques
F(458.55, X.click({ seed: 440, f: 2600 }), { gain: .3, pan: .4 }); F(458.6, X.metal({ f: 1900, dur: .2, decay: 40, seed: 441 }), { gain: .08, pan: .4 });   // tampa
F(460.4, X.click({ seed: 442, f: 1400 }), { gain: .26, pan: -.4 }); F(460.4, X.hum({ dur: 13.6, f: 100, seed: 443, buzz: .1 }), { gain: .025, fi: .5, fo: 1 });
ui(461, .07, -.5);
F(467, X.pen({ dur: 4.2, seed: 444 }), { gain: .07, pan: .4, fi: .3, fo: .1 }); F(467.6, X.scribble({ dur: 3.3, seed: 445, rate: 8 }), { gain: .12, pan: .4 });
ui(467.6, .07, .5); ui(471.2, .07, -.4); ui(471.5, .07, .4);
trans(474, .18);

// ═══ CLÍMAX (474–518) ═══
bed(amb, 474, 518.3, X.digitalBed(44.3, 470), .03, .6, .6);
cuts([480, 486, 496, 504, 512]);
hit(474.6, .14);
[481, 481.4].forEach((t, i) => F(t, X.zip({ dur: 2, f0: 400, f1: 800, seed: 471 + i, peak: .5 }), { gain: .05, pan: i ? .4 : -.4 }));
F(483.4, X.blip({ f: 660, f1: 440, dur: .4, decay: 7 }), { gain: .1 }); F(483.4, X.tick({ f: 3000, seed: 473 }), { gain: .08 });   // nitidez ✕
F(486.4, X.zip({ dur: 1.2, f0: 250, f1: 1000, seed: 474 }), { gain: .08 });
F(487.6, X.scribble({ dur: 6.4, seed: 475, rate: 4, f: 3000 }), { gain: .08, pan: -.5, panEnd: .5 });
ui(488); ui(489); ui(492);
F(493.6, X.blip({ f: 660, f1: 440, dur: .4, decay: 7 }), { gain: .1 }); F(493.6, X.tick({ f: 3000, seed: 476 }), { gain: .08 });   // certeza ✕
F(497.3, X.sparkle({ dur: 2.4, seed: 477, dens: 70, peak: .3 }), { gain: .15, rev: .4 }); F(497.3, X.whoosh({ dur: 2.2, f0: 2500, f1: 400, peak: .3, seed: 478 }), { gain: .1 });
F(497.8, X.impact({ dur: 2.5, f0: 65, f1: 35, noise: .05, seed: 479 }), { gain: .18, rev: .5 });
snaps(497.8, 500.6, 40, .1, u => -Math.log2(1 - (.3 + .69 * u)) / 10 / .7);                   // peças do cérebro chegando (expoOut)
F(500.4, X.shimmer({ dur: 3.4, f: 262, peak: .4, seed: 480 }), { gain: .1, rev: .6 });             // o núcleo fica
F(504, X.whoosh({ dur: 8, f0: 500, f1: 900, q: 2, peak: .5, seed: 481, body: .1, ca: 1, cr: 1 }), { gain: .05 });
snaps(504.2, 511.8, 30, .085);                                                                       // bordas deslizam e encaixam
ui(505.4);
for (let i = 0; i < 6; i++) { const a = Math.PI / 2 + i / 6 * Math.PI * 2; F(512.4 + i * .3, X.pop({ f: 560 + (i % 3) * 60 }), { gain: .1, pan: Math.cos(a) * .7, rev: .3 }); }
[515, 515.63, 516.26].forEach((t, i) => { F(t, X.impact({ dur: .7, f0: 75, f1: 50, noise: .05, seed: 482 + i }), { gain: .26 }); F(t, X.blip({ f: 440, dur: .4, decay: 8 }), { gain: .05 }); });   // três ingredientes
F(512, X.whoosh({ dur: 6, f0: 150, f1: 600, peak: .5, seed: 486, ca: 1, cr: 1.2 }), { gain: .1 });
trans(518, .18);

// ═══ CONCLUSÃO + TELA FINAL (518–568) ═══
bed(amb, 518, 568, X.roomTone(50, 510), .055, .6, 5); lampHum(518, 568, .035); clock(519, 566, .03, .55);
A(518, X.digitalBed(50, 511), { gain: .012, fi: 2, fo: 6 });
cuts([524, 532]);
{ const r2 = mulberry32(99); for (let k = 0; k < 12; k++) { const dl = r2() * .6; F(524.6 + dl * .5, X.woodClick({ seed: S(), f: 1500 }), { gain: .07, pan: r2() - .5 }); } }   // peças levantam
F(524.8, X.whoosh({ dur: 2.6, f0: 300, f1: 900, peak: .5, seed: 512 }), { gain: .07 });
F(528, X.shimmer({ dur: 2.6, f: 659, peak: .7, seed: 513 }), { gain: .06, rev: .5 });
{ const r2 = mulberry32(98); for (let k = 0; k < 12; k++) F(530.6 + r2() * .9, X.woodClick({ seed: S(), f: 1700 }), { gain: .1, pan: r2() - .5, rev: .2 }); }   // encaixes suaves
F(531.3, X.woodClick({ seed: 514, f: 1400 }), { gain: .18 });
[[-.6, 440], [0, 554], [.6, 659]].forEach(([p, f], i) => F(532.6, X.shimmer({ dur: 7.9, f, peak: .4, seed: 515 + i, ca: 1.5, cr: 1.2 }), { gain: .045, pan: p, rev: .5 }));   // três fluxos de luz
F(532.6, X.sparkle({ dur: 7.9, seed: 518, dens: 14, peak: .4 }), { gain: .05 });
[533, 534.4, 535.8].forEach((t, i) => F(t, X.blip({ f: 1320, dur: .35, decay: 10 }), { gain: .05, pan: -.6 + i * .6, rev: .4 }));
F(540.9, X.creak({ dur: 4.4, seed: 519, f: 650 }), { gain: .12, rev: .25 });                       // capa fechando
F(541, X.whoosh({ dur: 4.6, f0: 200, f1: 700, peak: .93, seed: 520, body: .8 }), { gain: .17, pan: .3, panEnd: -.1 });
F(545.55, X.impact({ dur: 1, f0: 95, f1: 45, noise: .6, seed: 521 }), { gain: .42, rev: .35 }); F(545.55, X.paper({ dur: .3, seed: 522, dens: 250 }), { gain: .13 });
F(545.6, X.crackle({ dur: 1.4, seed: 523, dens: 25, bed: .5 }), { gain: .04 });                     // poeira
F(540, X.whoosh({ dur: 8, f0: 120, f1: 450, peak: .5, seed: 524, ca: 1, cr: 1 }), { gain: .06 });

// ── master ──
const SR = X.SR, n = fx.n, M = [new Float32Array(n), new Float32Array(n)];
const fadeOut = i => Math.min(1, (n - i) / (1.5 * SR));
let pk = 0; for (let i = 0; i < n; i++) { const f = fadeOut(i); for (const [c, k] of [[0, 'L'], [1, 'R']]) { fx[k][i] *= f; amb[k][i] *= f; M[c][i] = fx[k][i] + amb[k][i]; pk = Math.max(pk, Math.abs(M[c][i])); } }
const gain = .89 / pk; // pico −1 dBFS
for (const b of [fx.L, fx.R, amb.L, amb.R, M[0], M[1]]) for (let i = 0; i < n; i++) b[i] *= gain;
const out = path.resolve(__dirname, '../../renders');
writeWav(path.join(out, '02-memorias-falsas-sfx.wav'), M[0], M[1]);
writeWav(path.join(out, '02-memorias-falsas-sfx-efeitos.wav'), fx.L, fx.R);
writeWav(path.join(out, '02-memorias-falsas-sfx-ambiencia.wav'), amb.L, amb.R);
console.log(`pronto · pico original ${pk.toFixed(3)} → ganho ${gain.toFixed(3)} · ${DUR}s 48kHz 24-bit estéreo`);
