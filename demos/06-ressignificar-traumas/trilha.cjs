// Trilha procedural do Short 06: pad suave + pluck em arpejo + batida leve, 100 BPM, determinística.
// Uso: node demos/06-ressignificar-traumas/trilha.cjs → renders/06-ressignificar-traumas-trilha.wav
'use strict';
const path = require('path');
const { SR, writeWav, mulberry32 } = require('../../tools/sfx-lib.js');
const DUR = 60.09, n = Math.round(DUR * SR), L = new Float32Array(n), R = new Float32Array(n), TAU = Math.PI * 2;
const beat = 60 / 100, bar = beat * 4, hz = m => 440 * Math.pow(2, (m - 69) / 12), rng = mulberry32(66);
// progressão (tensão → alívio): Am F C G | ... e termina em C
const CH = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
const add = (t0, buf, g, pan = 0) => { const s = Math.round(t0 * SR), a = (pan + 1) * Math.PI / 4; for (let i = 0; i < buf.length; i++) { const j = s + i; if (j >= n) break; L[j] += buf[i] * g * Math.cos(a); R[j] += buf[i] * g * Math.sin(a); } };
const env = (t, a, d) => Math.min(1, t / a) * Math.exp(-t / d);
function pad(f, dur) { const b = new Float32Array(Math.round(dur * SR)); for (let i = 0; i < b.length; i++) { const t = i / SR, e = Math.min(1, t / .8, (dur - t) / .8); b[i] = e * (Math.sin(TAU * f * t) + .5 * Math.sin(TAU * f * 1.003 * t) + .25 * Math.sin(TAU * f * 2 * t)) / 1.75; } return b; }
function pluck(f, dur = .6) { const b = new Float32Array(Math.round(dur * SR)); for (let i = 0; i < b.length; i++) { const t = i / SR; b[i] = env(t, .004, .18) * (Math.sin(TAU * f * t) + .3 * Math.sin(TAU * f * 2 * t) + .1 * Math.sin(TAU * f * 3 * t)); } return b; }
function kick() { const b = new Float32Array(Math.round(.35 * SR)); let ph = 0; for (let i = 0; i < b.length; i++) { const t = i / SR; ph += TAU * (45 + 90 * Math.exp(-t * 30)) / SR; b[i] = Math.sin(ph) * Math.exp(-t * 11); } return b; }
function hat() { const b = new Float32Array(Math.round(.05 * SR)); let p = 0; for (let i = 0; i < b.length; i++) { const x = rng() * 2 - 1; b[i] = (x - p) * Math.exp(-i / SR * 90); p = x; } return b; }
const K = kick(), HT = hat();
for (let k = 0, t = 0; t < DUR; k++, t += bar) {
	const c = t > DUR - bar * 1.5 ? [48, 52, 55] : CH[k % 4];
	c.forEach((m, i) => add(t, pad(hz(m), bar + .6), .07, (i - 1) * .4));
	add(t, pad(hz(c[0] - 12), bar + .4), .06);
	const on = t > 1.5 && t < DUR - 1;
	for (let s = 0; s < 8 && on; s++) add(t + s * beat / 2, pluck(hz(c[[0, 1, 2, 1, 0, 2, 1, 2][s]] + 12)), .05, s % 2 ? .35 : -.35);
	for (let b = 0; b < 4 && on && t > bar; b++) { add(t + b * beat, K, b % 2 ? .12 : .18); add(t + b * beat + beat / 2, HT, .05, .2); }
}
const fo = i => Math.min(1, i / (.5 * SR), (n - i) / (1.5 * SR));
let pk = 0; for (let i = 0; i < n; i++) { L[i] *= fo(i); R[i] *= fo(i); pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i])); }
for (let i = 0; i < n; i++) { L[i] *= .89 / pk; R[i] *= .89 / pk; }
writeWav(path.resolve(__dirname, '../../renders/06-ressignificar-traumas-trilha.wav'), L, R);
console.log('trilha ok');
