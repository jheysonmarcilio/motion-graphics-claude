// SFX do 08 (anúncio ADS1, colagem pop): papel deslizando, marcador, pops de adesivo, folha rasgando, carimbos, moedas.
// Tempos vêm de cues.json (mesmos da animação). Uso: SFX_OUT=arquivo.wav node demos/08-ads1-hipnotize-amigo/sfx.cjs
'use strict';
const X = require('../../tools/sfx-lib.js');
const { CAPS, INSERTS, DUR, STAMP } = require('./cues.json');
const fx = new X.Bus(DUR);
let seed = 800; const S = () => ++seed;
const F = (t, b, o) => fx.add(t, b, o);
const pop = (t, f = 600, g = .08, p = 0) => F(t, X.pop({ f, seed: S() }), { gain: g, pan: p, rev: .2 });
const slide = (t, g = .05, p = 0) => F(t, X.paper({ dur: .22, seed: S(), dens: 160, hp: 2200 }), { gain: g, pan: p });
const marker = (t, d = .28, g = .05) => F(t, X.scribble({ dur: d, seed: S(), rate: 9 }), { gain: g });
const spark = (t, g = .035) => F(t, X.sparkle({ dur: .7, seed: S(), dens: 30 }), { gain: g });
const thump = (t, g = .1) => F(t, X.impact({ dur: .6, f0: 150, f1: 60, noise: .4, seed: S() }), { gain: g });
const coin = (t, g = .03, p = 0) => F(t, X.metal({ f: 2300 + (seed % 7) * 190, dur: .35, decay: 14, seed: S() }), { gain: g, pan: p, rev: .3 });
const chime = (t, f, g = .04) => F(t, X.blip({ f, dur: .9, decay: 5 }), { gain: g, rev: .5 });

// legendas: tira de papel + marca-texto na palavra-chave + "batida" quando boom
for (const c of CAPS) {
	const split = c.a < 14.3, k = split ? .6 : 1; // na tela dividida, mais discreto (tem o áudio da hipnose)
	slide(c.a, .045 * k, -.2);
	if (c.kw) marker(c.a + .35, .25, .035 * k);
	if (c.boom) { thump(c.a + .3, .07 * k); pop(c.a + .32, 480, .06 * k); }
}
F(3.35, X.scribble({ dur: .4, seed: S(), rate: 7 }), { gain: .025 }); // seta AQUI

// inserts de tela cheia: whoosh de entrada (lado do movimento) + rasgo na saída
for (const i of INSERTS) {
	const d = i.dir || 1;
	F(i.a - .06, X.whoosh({ dur: .5, f0: 300, f1: 2800, peak: .45, seed: S(), body: .3 }), { gain: .11, pan: .7 * d, panEnd: -.5 * d });
	F(i.a + .05, X.paper({ dur: .3, seed: S(), dens: 220 }), { gain: .06 });
	F(i.b - .34, X.tear({ dur: .4, seed: S() }), { gain: .07, pan: -.4 * d, panEnd: .5 * d });
}
const I = Object.fromEntries(INSERTS.map(i => [i.id, i]));
// não precisa: calendário contando anos, NEM, etiqueta, dois X
{ const a = I.naoPrecisa.a; slide(a + .12, .05); pop(a + .75, 520, .09); for (let k = 0; k < 9; k++) F(a + .9 + k * .094, X.paper({ dur: .06, seed: S(), dens: 260, hp: 3000 }), { gain: .04, pan: -.3 });
	slide(a + 1.0, .04, -.3); marker(a + 1.95, .32, .07); thump(a + 2.05, .05); pop(a + 2.2, 900, .07); pop(a + 2.35, 600, .09, .3); slide(a + 2.55, .04, .3); marker(a + 3.25, .32, .07); thump(a + 3.35, .05); }
// curso: letras de recorte caindo uma a uma + círculo no ZERO
{ const a = I.curso.a; slide(a + .1, .05); F(a + .15, X.tear({ dur: .25, seed: S() }), { gain: .04 });
	[[1.02, 7, .045], [1.36, 7, .05], [1.95, 7, .045]].forEach(([o, n, e]) => { for (let k = 0; k < n; k++) F(a + o + k * e, X.woodClick({ seed: S(), f: 1500 + k * 90 }), { gain: .05, pan: -.5 + k / n }); });
	thump(a + 1.4, .06); marker(a + 2.45, .35, .06); spark(a + 1.5); spark(a + 2.2); chime(a + 2.6, 1318, .035); }
// pessoas hipnotizadas
{ const a = I.pessoas.a; slide(a + .1, .05); for (let k = 0; k < 6; k++) pop(a + .35 + k * .14, 420 + k * 70, .07, -.6 + (k % 3) * .6);
	F(a + 1.0, X.shimmer({ dur: 1.6, f: 660, peak: .4, seed: S() }), { gain: .03 }); slide(a + 1.4, .05); marker(a + 1.8, .3, .05); }
// preço: carimbo + moedas
{ const a = I.preco.a, ps = I.preco.stamp; slide(a + .1, .05);
	F(ps, X.stamp({ seed: S() }), { gain: .26, rev: .3 }); F(ps, X.impact({ dur: 1.2, f0: 85, f1: 34, noise: .3, seed: S() }), { gain: .16, rev: .4 });
	for (let k = 0; k < 12; k++) coin(ps + .2 + k * .07 + (k % 3) * .02, .02, (k % 5 - 2) * .3);
	marker(ps + .35, .45, .06); spark(ps + .3); slide(ps + 1.0, .05); }
// cadeado destravando
pop(18.1, 560, .08, .5); F(19.0, X.metal({ f: 1800, dur: .25, decay: 22, seed: S() }), { gain: .07, pan: .5 }); F(19.02, X.click({ seed: S(), f: 1500 }), { gain: .08, pan: .5 }); spark(19.1);
// selo +10 anos
pop(22.9, 460, .1); for (let k = 0; k < 10; k++) F(23.1 + k * .1 * (1 + k * .06), X.tick({ f: 2600 + k * 120, seed: S() }), { gain: .04 }); chime(24.3, 1046, .04); chime(24.42, 1318, .035); slide(24.9, .05);
// videoaulas
for (let k = 0; k < 4; k++) pop(30.9 + k * .18, 640 + k * 90, .075, [-.6, .6, -.5, .5][k]);
// alvo + dardo
pop(32.95, 520, .08, -.5); F(33.55, X.whoosh({ dur: .35, f0: 2600, f1: 900, peak: .6, seed: S() }), { gain: .07, pan: .6, panEnd: -.5 }); F(33.95, X.knock({ f: 210, seed: S() }), { gain: .12, pan: -.5 }); spark(34.0, .03);
// "e o melhor de tudo"
spark(40.6, .045); chime(40.62, 1175, .03);
// checklist + presente
pop(44.05, 500, .08); slide(44.08, .05); [44.3, 45.9, 46.55].forEach((t, i) => { marker(t + .1, .22, .06); chime(t + .3, [988, 1175, 1397][i], .03); });
pop(46.75, 700, .07, .5); F(47.1, X.blip({ f: 220, f1: 620, dur: .3, decay: 8 }), { gain: .06, pan: .5 }); spark(47.2, .04);
// CTA: setas + carimbo final
for (let k = 0; k < 3; k++) marker(49.2 + k * .1, .3, .03);
F(STAMP, X.stamp({ seed: S() }), { gain: .28, rev: .3 }); F(STAMP, X.impact({ dur: 1.2, f0: 80, f1: 34, noise: .3, seed: S() }), { gain: .17, rev: .4 }); spark(STAMP + .1, .04);

const SR = X.SR, n = fx.n, M = [new Float32Array(n), new Float32Array(n)];
let pk = 0; for (let i = 0; i < n; i++) { const f = Math.min(1, (n - i) / (.15 * SR)); M[0][i] = fx.L[i] * f; M[1][i] = fx.R[i] * f; pk = Math.max(pk, Math.abs(M[0][i]), Math.abs(M[1][i])); }
const gain = .89 / pk; for (const b of M) for (let i = 0; i < n; i++) b[i] *= gain;
X.writeWav(process.env.SFX_OUT || require('path').join(require('os').tmpdir(), '08-sfx.wav'), M[0], M[1]);
console.log(`pronto · pico ${pk.toFixed(3)} → ganho ${gain.toFixed(3)}`);
