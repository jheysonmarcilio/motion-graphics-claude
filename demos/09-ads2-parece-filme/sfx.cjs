// SFX do 09 (anúncio ADS2, trailer de cinema): projetor rodando, íris (whoosh), bipes de contagem, claquete,
// "uau" da plateia, carimbo do ingresso, letreiro. Tempos vêm de cues.json. Uso: SFX_OUT=arquivo.wav node demos/09-ads2-parece-filme/sfx.cjs
'use strict';
const X = require('../../tools/sfx-lib.js');
const { CAPS, INSERTS, DUR, STAMP, SPLIT, COUNT } = require('./cues.json');
const fx = new X.Bus(DUR);
let seed = 900; const S = () => ++seed;
const F = (t, b, o) => fx.add(t, b, o);
// rodar de película: rajada curta de cliques a 24 q/s
const reel = (t, d = .22, g = .03, p = 0) => { for (let k = 0; k < d * 24; k++) F(t + k / 24, X.tick({ f: 2400 + (k % 3) * 300, seed: S(), decay: 220 }), { gain: g, pan: p }); };
const thump = (t, g = .1) => F(t, X.impact({ dur: .8, f0: 140, f1: 45, noise: .35, seed: S() }), { gain: g, rev: .3 });
const spark = (t, g = .035) => F(t, X.sparkle({ dur: .7, seed: S(), dens: 30 }), { gain: g });
const chime = (t, f, g = .04) => F(t, X.blip({ f, dur: .9, decay: 5 }), { gain: g, rev: .5 });
const pop = (t, f = 600, g = .07, p = 0) => F(t, X.pop({ f, seed: S() }), { gain: g, pan: p, rev: .2 });
const swoosh = (t, g = .1, d = 1) => F(t, X.whoosh({ dur: .55, f0: 250, f1: 3000, peak: .45, seed: S(), body: .35 }), { gain: g, pan: .6 * d, panEnd: -.5 * d });

// legendas: tira de filme passando + batida na palavra de impacto
for (const c of CAPS) {
	const k = c.a < SPLIT ? .6 : 1; // na tela dividida, mais discreto (áudio da hipnose)
	reel(c.a, .2, .028 * k, -.2);
	if (c.boom) { thump(c.a + .3, .08 * k); F(c.a + .28, X.whoosh({ dur: .3, f0: 2500, f1: 500, peak: .2, seed: S() }), { gain: .05 * k }); }
	if (c.strike) F(c.a + 1.0, X.scribble({ dur: .25, seed: S(), rate: 10 }), { gain: .04 * k });
}
F(1.4, X.whoosh({ dur: .35, f0: 1800, f1: 600, peak: .3, seed: S() }), { gain: .03 }); // seta "aqui embaixo"
// 100% técnica: contador subindo
for (let k = 0; k < 10; k++) F(COUNT.a + .05 + k * .05, X.tick({ f: 1800 + k * 150, seed: S() }), { gain: .035 });
thump(COUNT.a + .55, .07); chime(COUNT.a + .58, 1318, .03);

// inserts: whoosh na abertura da íris + clique de projetor; whoosh invertido no fechamento
for (const i of INSERTS) {
	swoosh(i.a - .08, .11, 1); F(i.a + .02, X.click({ seed: S(), f: 1300 }), { gain: .07 });
	F(i.a, X.crackle({ dur: i.b - i.a, seed: S(), dens: 18, bed: .25 }), { gain: .035 }); // chiado de película
	F(i.b - .4, X.whoosh({ dur: .45, f0: 2800, f1: 300, peak: .55, seed: S() }), { gain: .08, pan: -.5, panEnd: .5 });
}
const I = Object.fromEntries(INSERTS.map(i => [i.id, i]));
// contagem de película: bipe a cada número
{ const a = I.leader.a; for (let n = 0; n < 10; n++) F(a + .12 + n * .068, X.beep({ f: 1000, dur: .05 }), { gain: n === 9 ? .05 : .022 });
	thump(a + .8, .1); chime(a + .82, 988, .035); reel(a + .3, .2, .03); reel(a + 1.0, .2, .03); reel(a + 1.9, .2, .03); }
// pôster: claquete + holofotes + brilho
{ const a = I.poster.a, c = I.poster.clap; pop(a + .1, 420, .06);
	F(c, X.knock({ f: 260, seed: S() }), { gain: .2 }); F(c, X.woodClick({ seed: S(), f: 2200 }), { gain: .14 });
	F(c + .75, X.whoosh({ dur: .4, f0: 400, f1: 2200, peak: .5, seed: S() }), { gain: .06 });
	thump(c + 1.1, .12); F(c + 1.1, X.shimmer({ dur: 1.6, f: 880, peak: .3, seed: S() }), { gain: .04 }); spark(c + 1.4, .04);
	reel(28.05, .2, .03); for (let k = 0; k < 5; k++) chime(28.5 + k * .07, [1046, 1175, 1318, 1568, 1760][k], .022); }
// plateia: pops das pessoas + murmúrio "uau"
{ const a = I.plateia.a; for (let k = 0; k < 12; k++) pop(a + .3 + k * .07, 380 + (k % 5) * 80, .045, -.6 + (k % 4) * .4);
	F(a + .6, X.murmur({ dur: 2.2, seed: S(), voices: 5 }), { gain: .05 }); pop(a + 1.4, 900, .05, .5);
	reel(31.85, .2, .03); thump(31.95, .07); reel(32.55, .2, .03); }
// ingresso: cai, carimbo, moedinhas/brilho
{ const a = I.ingresso.a, ps = I.ingresso.stamp; F(a + .05, X.paper({ dur: .4, seed: S(), dens: 180 }), { gain: .06 });
	F(ps, X.stamp({ seed: S() }), { gain: .26, rev: .3 }); F(ps, X.impact({ dur: 1.2, f0: 85, f1: 34, noise: .3, seed: S() }), { gain: .16, rev: .4 });
	for (let k = 0; k < 8; k++) F(ps + .2 + k * .08, X.metal({ f: 2300 + k * 170, dur: .35, decay: 14, seed: S() }), { gain: .02, pan: (k % 5 - 2) * .3, rev: .3 });
	spark(ps + .25); reel(ps + .9, .2, .03); }
// overlays sobre o autor
for (let k = 0; k < 5; k++) pop(18.4 + k * .09, 500 + k * 60, .05, -.5 + k * .25);
pop(20.9, 640, .06, .5); F(21.1, X.scribble({ dur: .3, seed: S(), rate: 8 }), { gain: .04 }); chime(21.4, 1318, .025);
for (let k = 0; k < 3; k++) { pop(23.9 + k * .22, 560 + k * 120, .06); }
pop(34.0, 520, .06); F(34.2, X.scribble({ dur: .3, seed: S(), rate: 8 }), { gain: .04 });
spark(35.1, .045); chime(35.12, 1175, .03);
for (let k = 0; k < 3; k++) F(42.1 + k * .1, X.whoosh({ dur: .3, f0: 2000, f1: 500, peak: .3, seed: S() }), { gain: .025 });
// letreiro final
F(STAMP, X.stamp({ seed: S() }), { gain: .26, rev: .3 }); F(STAMP, X.impact({ dur: 1.2, f0: 80, f1: 34, noise: .3, seed: S() }), { gain: .17, rev: .4 });
F(STAMP + .05, X.hum({ dur: 1.3, f: 120, seed: S(), buzz: .3, flick: .1 }), { gain: .03 }); spark(STAMP + .1, .04);

const SR = X.SR, n = fx.n, M = [new Float32Array(n), new Float32Array(n)];
let pk = 0; for (let i = 0; i < n; i++) { const f = Math.min(1, (n - i) / (.15 * SR)); M[0][i] = fx.L[i] * f; M[1][i] = fx.R[i] * f; pk = Math.max(pk, Math.abs(M[0][i]), Math.abs(M[1][i])); }
const gain = .89 / pk; for (const b of M) for (let i = 0; i < n; i++) b[i] *= gain;
X.writeWav(process.env.SFX_OUT || require('path').join(require('os').tmpdir(), '09-sfx.wav'), M[0], M[1]);
console.log(`pronto · pico ${pk.toFixed(3)} → ganho ${gain.toFixed(3)}`);
