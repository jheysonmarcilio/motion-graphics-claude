// SFX do 15 (blocos de estilos + True Crime). Tempos vêm de words.json (mesma fonte da animação).
'use strict';
const X = require('../../tools/sfx-lib.js'), W = require('./words.json');
const DUR = 118, fx = new X.Bus(DUR);
let seed = 1500; const S = () => ++seed;
const F = (t, b, o) => fx.add(t, b, o);
const norm = s => s.toLowerCase().replace(/[.,:;!?…"“”]/g, '');
const flat = W.segs.flatMap(s => s.words), tw = (w, n = 0) => flat.filter(x => norm(x[0]) === w)[n][1];
const first = {}; W.segs.forEach(s => { if (!(s.block in first)) first[s.block] = s.t0 - .3; });
const pop = (t, f = 600, g = .07, p = 0) => F(t, X.pop({ f, seed: S() }), { gain: g, pan: p, rev: .12 });
const whip = (t, d = 1, g = .12) => F(t, X.whoosh({ dur: .5, f0: 400, f1: 3200, peak: .45, seed: S() }), { gain: g, pan: -.6 * d, panEnd: .6 * d });
const thud = (t, g = .2) => { F(t, X.knock({ f: 130, seed: S() }), { gain: g }); F(t, X.impact({ dur: .9, f0: 100, f1: 38, noise: .4, seed: S() }), { gain: g * .7 }); };
const chime = (t, f, g = .04) => F(t, X.blip({ f, dur: .9, decay: 5 }), { gain: g, rev: .5 });
const tick = (t, g = .03) => F(t, X.tick({ f: 2400, seed: S() }), { gain: g });

// transições entre estilos (cada bloco novo)
Object.entries(first).slice(1).forEach(([k, t], i) => { if (k === 'crime') { thud(t + .1, .26); F(t, X.whoosh({ dur: .8, f0: 3000, f1: 120, peak: .5, seed: S() }), { gain: .1 }); } else whip(t, i % 2 ? -1 : 1); });
// flat A / toy A / paper A / neural A
pop(.5, 800, .06); pop(tw('todo'), 700, .06); pop(tw('mas'), 400, .07); F(tw('reescrevendo'), X.sparkle({ dur: 1, seed: S(), dens: 20 }), { gain: .04 });
pop(tw('arquivo') - .3, 500, .07); F(tw('arquivo') + .3, X.drawer({ seed: S() }), { gain: .08 });
for (let i = 0; i < 9; i++) thud(tw('reconstrói') + .2 + .55 + i * .33, .06);
for (const w of ['detalhes', 'cheiro', 'cor', 'rosto']) F(tw(w), X.paper({ dur: .35, seed: S() }), { gain: .1 });
F(first.neural + .4, X.shimmer({ dur: 2, f: 660, seed: S() }), { gain: .06 }); chime(tw('acende'), 1175, .04); chime(tw('cada'), 1568, .04);
// flat B / toy B / paper B / neural B
pop(tw('elizabeth'), 600, .06); thud(tw('acidentes') + .5, .2); pop(tw('bateram'), 700, .06); pop(tw('esmagaram'), 500, .07); thud(tw('esmagaram') + .5, .1);
for (let i = 0; i < 6; i++) thud(first.toy2 + .4 + .75 + i * .12, .04); chime(tw('vidro'), 1900, .04); F(tw('vidro') + .2, X.glass({ seed: S() }), { gain: .06 }); F(tw('nenhum'), X.stamp({ seed: S() }), { gain: .1, rev: .3 });
F(tw('única', 0), X.scribble({ dur: .8, seed: S() }), { gain: .05 }); F(tw('editou'), X.tear({ dur: .5, seed: S() }), { gain: .07 }); F(tw('editou') + .4, X.stamp({ seed: S() }), { gain: .09, rev: .2 });
F(first.neural2 + .3, X.shimmer({ dur: 2, f: 520, seed: S() }), { gain: .06 }); chime(tw('futuro'), 1319, .05); F(tw('caro') - .2, X.drop({ seed: S() }), { gain: .05 }); F(tw('caro'), X.impact({ dur: 1.2, f0: 90, f1: 34, noise: .3, seed: S() }), { gain: .1 });
// TRUE CRIME: chuva + vento, sirene distante, passos, carimbos, DNA, máquina de escrever
const c0 = first.crime; F(c0 + .5, X.wind({ dur: 50, seed: S(), lo: 180, hi: 700, gust: .1 }), { gain: .035, fi: 1, fo: 3 });
F(c0 + .6, X.hum({ dur: 6, f: 90, seed: S(), buzz: .1 }), { gain: .02, fi: .6, fo: 1 });
thud(tw('jura') - .1, .12); F(tw('nunca', 1), X.whisper({ dur: 1.8, seed: S() }), { gain: .02 });
thud(tw('fila') - .1, .1); F(tw('aponta'), X.click({ seed: S() }), { gain: .1 }); F(tw('condenado') + .1, X.stamp({ seed: S() }), { gain: .28, rev: .3 }); thud(tw('condenado') + .1, .2);
F(tw('anos') - .2, X.whoosh({ dur: .9, f0: 200, f1: 1500, peak: .5, seed: S() }), { gain: .09 }); for (let k = 0; k < 5; k++) chime(tw('exame') + k * .18, 880 + k * 110, .025);
F(tw('inocente') - .3, X.stamp({ seed: S() }), { gain: .2, rev: .4 }); F(tw('inocente') - .3, X.sparkle({ dur: 1.5, seed: S(), dens: 18 }), { gain: .04 });
thud(tw('estados') - .3, .1); for (let i = 0; i < 7; i++) pop(tw('sete') + i * .12, 300 + i * 40, .05);
F(tw('jurava', 1) - .3, X.murmur({ dur: 3, seed: S(), voices: 2 }), { gain: .012 }); F(tw('reescrito'), X.glass({ seed: S() }), { gain: .05 });
for (let t = tw('condena') - .5; t < tw('condena') + 1.4; t += .055) tick(t, .035);
for (let t = tw('condena') + .55; t < tw('condena') + 1.3; t += .055) tick(t, .035);
F(tw('condena') + 1.5, X.impact({ dur: 2.2, f0: 70, f1: 30, noise: .25, seed: S() }), { gain: .2 });

const SR = X.SR, n = fx.n, M = [new Float32Array(n), new Float32Array(n)];
let pk = 0; for (let i = 0; i < n; i++) { const f = Math.min(1, (n - i) / (.15 * SR)); M[0][i] = fx.L[i] * f; M[1][i] = fx.R[i] * f; pk = Math.max(pk, Math.abs(M[0][i]), Math.abs(M[1][i])); }
const gain = .89 / pk; for (const b of M) for (let i = 0; i < n; i++) b[i] *= gain;
X.writeWav(process.env.SFX_OUT || require('path').join(require('os').tmpdir(), '15-sfx.wav'), M[0], M[1]);
console.log(`pronto · pico ${pk.toFixed(3)} → ganho ${gain.toFixed(3)}`);
