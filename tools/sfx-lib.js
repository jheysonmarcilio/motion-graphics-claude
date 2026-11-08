// Sintetizador procedural de efeitos sonoros (determinístico, sem amostras externas, sem voz).
// Cada gerador devolve Float32Array mono normalizado (pico 1) ou [L, R] para ambiências.
'use strict';
const fs = require('fs');
const SR = 48000, TAU = Math.PI * 2;

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const N = s => Math.max(1, Math.round(s * SR));

// filtro de estado variável (TPT) — aceita corte variando por amostra
class SVF {
	constructor() { this.s1 = 0; this.s2 = 0; this.f = -1; this.q = -1; }
	set(f, q = .707) {
		if (f !== this.f || q !== this.q) {
			this.f = f; this.q = q; const g = Math.tan(Math.PI * clamp(f, 10, SR * .45) / SR); this.k = 1 / q;
			this.a1 = 1 / (1 + g * (g + this.k)); this.a2 = g * this.a1; this.a3 = g * this.a2;
		} return this;
	}
	run(x) { const v3 = x - this.s2, v1 = this.a1 * this.s1 + this.a2 * v3, v2 = this.s2 + this.a2 * this.s1 + this.a3 * v3; this.s1 = 2 * v1 - this.s1; this.s2 = 2 * v2 - this.s2; this.lp = v2; this.bp = v1; this.hp = x - this.k * v1 - v2; return v2; }
}
// ruído suave (LFO aleatório) em -1..1
function lfo(rng, hz) { const pts = []; return t => { const x = t * hz, i = Math.floor(x), f = x - i; while (pts.length <= i + 1) pts.push(rng() * 2 - 1); const u = (1 - Math.cos(f * Math.PI)) / 2; return pts[i] * (1 - u) + pts[i + 1] * u; }; }
function norm(b, peak = 1) { let m = 0; for (let i = 0; i < b.length; i++) { const a = Math.abs(b[i]); if (a > m) m = a; } if (m > 0) { const k = peak / m; for (let i = 0; i < b.length; i++) b[i] *= k; } return b; }
function fades(b, fi = .005, fo = .02) { const a = N(fi), c = N(fo), n = b.length; for (let i = 0; i < a && i < n; i++) b[i] *= i / a; for (let i = 0; i < c && i < n; i++) b[n - 1 - i] *= i / c; return b; }
const swell = (u, pk = .5, ca = 2, cr = 1.5) => u < pk ? Math.pow(u / pk, ca) : Math.pow(clamp(1 - (u - pk) / (1 - pk)), cr);
function mix(...parts) { // [buf, gain, offset_s]
	const n = Math.max(...parts.map(([b, , o = 0]) => b.length + N(o))); const out = new Float32Array(n);
	for (const [b, g = 1, o = 0] of parts) { const s = Math.round(o * SR); for (let i = 0; i < b.length; i++) out[s + i] += b[i] * g; } return out;
}
const reverse = b => Float32Array.from(b).reverse();
const silence = d => new Float32Array(N(d));

// ── geradores ─────────────────────────────────────────────
function whoosh({ dur = 1, f0 = 300, f1 = 3000, q = 1.1, peak = .6, seed = 1, body = .35, ca = 2, cr = 1.6 } = {}) {
	const r = mulberry32(seed), n = N(dur), b = new Float32Array(n), f = new SVF(), l = new SVF().set(Math.min(f0, f1) * 1.2, .6), wob = lfo(r, 3);
	for (let i = 0; i < n; i++) { const u = i / n, x = r() * 2 - 1; if (!(i & 15)) f.set(f0 * Math.pow(f1 / f0, u) * (1 + .08 * wob(i / SR)), q); f.run(x); l.run(x); b[i] = (f.bp + l.lp * body) * swell(u, peak, ca, cr); }
	return norm(fades(b));
}
function impact({ dur = 1.4, f0 = 110, f1 = 38, noise = .35, lp = 1200, seed = 2, decay = 5 } = {}) {
	const r = mulberry32(seed), n = N(dur), b = new Float32Array(n), l = new SVF().set(lp, .7); let ph = 0;
	for (let i = 0; i < n; i++) { const t = i / SR, fr = f1 + (f0 - f1) * Math.exp(-t * 14); ph += TAU * fr / SR; l.run(r() * 2 - 1); b[i] = Math.sin(ph) * Math.exp(-t * decay / dur) + l.lp * noise * 3 * Math.exp(-t * 35); }
	return norm(fades(b, .001, .05));
}
function tick({ f = 3500, dur = .05, q = 4, tone = .4, seed = 3, decay = 140 } = {}) {
	const r = mulberry32(seed), n = N(dur), b = new Float32Array(n), s = new SVF().set(f, q);
	for (let i = 0; i < n; i++) { const t = i / SR, e = Math.exp(-t * decay); s.run(r() * 2 - 1); b[i] = (s.bp * 2 + tone * Math.sin(TAU * f * .5 * t)) * e; }
	return norm(fades(b, .0005, .005));
}
function blip({ f = 880, f1 = null, dur = .25, decay = 12, harm = .15, att = .004 } = {}) {
	const n = N(dur), b = new Float32Array(n); let ph = 0; const fe = f1 ?? f;
	for (let i = 0; i < n; i++) { const t = i / SR, u = i / n, fr = f * Math.pow(fe / f, Math.min(1, u * 3)); ph += TAU * fr / SR; b[i] = (Math.sin(ph) + harm * Math.sin(3 * ph)) * Math.min(1, t / att) * Math.exp(-t * decay); }
	return norm(fades(b, .001, .02));
}
function tone({ f = 1046, dur = 4, att = 1.2, vib = .002, beat = 0 } = {}) {
	const n = N(dur), b = new Float32Array(n); let p1 = 0, p2 = 0;
	for (let i = 0; i < n; i++) { const t = i / SR; p1 += TAU * f * (1 + vib * Math.sin(TAU * 5 * t)) / SR; p2 += TAU * (f + beat) / SR; b[i] = (Math.sin(p1) + (beat ? Math.sin(p2) : 0) + .08 * Math.sin(2 * p1)) * Math.min(1, t / att); }
	return norm(fades(b, .01, .01));
}
function bell({ f = 220, dur = 4, bright = 1, seed = 4 } = {}) {
	const P = [[1, 1, 1], [2.01, .55, 1.6], [2.76, .5, 2.2], [4.07, .25 * bright, 3], [5.43, .18 * bright, 4], [6.8, .1 * bright, 5.5]];
	const n = N(dur), b = new Float32Array(n);
	for (let i = 0; i < n; i++) { const t = i / SR; let s = 0; for (const [m, a, d] of P) s += a * Math.sin(TAU * f * m * t) * Math.exp(-t * d * 2.2 / dur); b[i] = s * Math.min(1, t / .002); }
	return norm(fades(b, .001, .1));
}
function grains(n, r, dens, fn) { const cnt = Math.floor(n / SR * dens); for (let k = 0; k < cnt; k++) fn(Math.floor(r() * n)); }
function paper({ dur = 1, seed = 5, dens = 70, hp = 1400, body = .5, shape = null } = {}) {
	const r = mulberry32(seed), n = N(dur), b = new Float32Array(n), h = new SVF().set(hp, .7), am = lfo(r, 9);
	for (let i = 0; i < n; i++) { h.run(r() * 2 - 1); b[i] = h.hp * body * (.35 + .65 * Math.abs(am(i / SR))); }
	grains(n, r, dens, s => { const L = N(.004 + r() * .02), a = .4 + r(), bp = new SVF().set(1800 + r() * 4500, 1.2 + r() * 3); for (let i = 0; i < L && s + i < n; i++) { bp.run(r() * 2 - 1); b[s + i] += bp.bp * a * 3 * Math.exp(-i / L * 4); } });
	for (let i = 0; i < n; i++) b[i] *= shape ? shape(i / n) : swell(i / n, .3, 1, 1);
	return norm(fades(b));
}
function scribble({ dur = 1, seed = 6, rate = 7, f = 3600, q = .9 } = {}) {
	const r = mulberry32(seed), n = N(dur), b = new Float32Array(n), s = new SVF().set(f, q), rv = lfo(r, 1.3), gate = lfo(r, .9), jit = lfo(r, 40); let ph = 0;
	for (let i = 0; i < n; i++) { const t = i / SR; ph += TAU * rate * (.75 + .5 * (rv(t) * .5 + .5)) / SR; s.run(r() * 2 - 1); const g = clamp(gate(t) * 2 + 1.2); b[i] = s.bp * Math.pow(Math.abs(Math.sin(ph)), .7) * g * (.8 + .2 * jit(t)); }
	return norm(fades(b, .02, .05));
}
function metal({ f = 520, dur = .5, seed = 7, decay = 9 } = {}) {
	const ratios = [1, 2.51, 4.7, 6.13, 8.2], n = N(dur), b = new Float32Array(n), r = mulberry32(seed);
	const ps = ratios.map(m => [m * (1 + (r() - .5) * .02), r() * TAU]);
	for (let i = 0; i < n; i++) { const t = i / SR; let s = 0; ps.forEach(([m, p], k) => s += Math.sin(TAU * f * m * t + p) * Math.exp(-t * decay * (1 + k * .6)) / (1 + k * .5)); b[i] = s + (r() * 2 - 1) * Math.exp(-t * 300) * .6; }
	return norm(fades(b, .0005, .03));
}
function drawer({ dur = 1.2, seed = 8, clunk = true, slideGain = 1 } = {}) {
	const r = mulberry32(seed), n = N(dur), sl = new Float32Array(n), l = new SVF().set(900, .7), m = new SVF().set(320, 2), rum = lfo(r, 6);
	for (let i = 0; i < n; i++) { const t = i / SR, u = i / n, x = r() * 2 - 1; l.run(x); m.run(x); sl[i] = (l.lp * .6 + m.bp * 1.5) * (.65 + .35 * Math.sin(TAU * (30 + 6 * rum(t)) * t)) * swell(u, .25, 1.2, .8); }
	norm(fades(sl, .05, .05));
	if (!clunk) return sl;
	return norm(mix([sl, .7 * slideGain], [impact({ dur: .35, f0: 150, f1: 70, noise: .5, decay: 6, seed }), .8, dur - .05], [metal({ f: 480, dur: .35, seed }), .35, dur - .05]));
}
function stamp({ seed = 9 } = {}) {
	return norm(mix([impact({ dur: .4, f0: 150, f1: 55, noise: .7, lp: 1800, decay: 7, seed }), 1], [paper({ dur: .07, seed, dens: 300, body: 1, shape: u => Math.exp(-u * 5) }), .5], [tick({ f: 900, dur: .05, seed }), .3]));
}
function tear({ dur = 1.5, seed = 10, f0 = 1300, f1 = 3000, dens = 420 } = {}) {
	const r = mulberry32(seed), n = N(dur), b = new Float32Array(n), s = new SVF(), am = new Float32Array(n);
	grains(n, r, dens, p => { const L = N(.002 + r() * .004), a = r(); for (let i = 0; i < L && p + i < n; i++) am[p + i] += a * (1 - i / L); });
	for (let i = 0; i < n; i++) { const u = i / n; if (!(i & 15)) s.set(f0 * Math.pow(f1 / f0, u), 1.4); s.run(r() * 2 - 1); b[i] = s.bp * (.25 + am[i]) * swell(u, .2, 1, .6); }
	return norm(fades(b));
}
function snip({ seed = 11 } = {}) { return norm(mix([metal({ f: 2900, dur: .08, decay: 60, seed }), 1], [metal({ f: 3300, dur: .08, decay: 60, seed: seed + 1 }), .8, .014], [paper({ dur: .06, seed, dens: 200 }), .3])); }
function crackle({ dur = 3, seed = 12, dens = 30, bed = .35 } = {}) {
	const r = mulberry32(seed), n = N(dur), b = new Float32Array(n), l = new SVF().set(500, .7), fl = lfo(r, 4);
	for (let i = 0; i < n; i++) { l.run(r() * 2 - 1); b[i] = l.lp * bed * 2 * (.6 + .4 * fl(i / SR)); }
	grains(n, r, dens, p => { const L = N(.001 + r() * .006), a = .3 + r() * (r() < .1 ? 3 : 1); for (let i = 0; i < L && p + i < n; i++) b[p + i] += (r() * 2 - 1) * a * Math.exp(-i / L * 5); });
	for (let i = 0; i < n; i++) b[i] *= swell(i / n, .15, 1, .7);
	return norm(fades(b, .05, .1));
}
function burner({ dur = 1.2, seed = 13 } = {}) {
	const r = mulberry32(seed), n = N(dur), b = new Float32Array(n), l = new SVF().set(800, .6), m = new SVF().set(190, 2.5), fl = lfo(r, 14);
	for (let i = 0; i < n; i++) { const t = i / SR, x = r() * 2 - 1; l.run(x); m.run(x); b[i] = (l.lp + m.bp * 2) * (.75 + .25 * fl(t)) * Math.min(1, t / .12) * clamp((dur - t) / .45); }
	return norm(fades(b));
}
function wind({ dur = 6, seed = 14, lo = 220, hi = 900, gust = .12 } = {}) {
	const ch = [0, 1].map(c => { const r = mulberry32(seed + c * 101), n = N(dur), b = new Float32Array(n), s = new SVF(), fc = lfo(r, gust), am = lfo(r, gust * .8);
		for (let i = 0; i < n; i++) { const t = i / SR; if (!(i & 31)) s.set(lo + (hi - lo) * (fc(t) * .5 + .5), 1.6); s.run(r() * 2 - 1); b[i] = s.bp * (.55 + .45 * am(t)); } return b; });
	const m = Math.max(...ch.map(b => b.reduce((a, x) => Math.max(a, Math.abs(x)), 0))); ch.forEach(b => { for (let i = 0; i < b.length; i++) b[i] /= m; fades(b, .5, .5); }); return ch;
}
function birds({ dur = 6, seed = 15, dens = 1.4 } = {}) {
	const r = mulberry32(seed), n = N(dur), b = new Float32Array(n), cnt = Math.max(1, Math.floor(dur * dens));
	for (let c = 0; c < cnt; c++) {
		let p = Math.floor(r() * (n - SR * .6)); const syl = 2 + Math.floor(r() * 4), base = 2600 + r() * 1800, up = r() < .5;
		for (let s = 0; s < syl; s++) { const L = N(.04 + r() * .06); let ph = 0; for (let i = 0; i < L && p + i < n; i++) { const u = i / L, fr = base * (up ? 1 + .5 * u : 1.5 - .5 * u) * (1 + .03 * Math.sin(TAU * 60 * i / SR)); ph += TAU * fr / SR; b[p + i] += Math.sin(ph) * Math.sin(u * Math.PI) * (.5 + .5 * r()); } p += L + N(.02 + r() * .05); }
	}
	return norm(fades(b, .2, .2));
}
function murmur({ dur = 6, seed = 16, voices = 3, lp = 950 } = {}) {
	const r = mulberry32(seed), n = N(dur), b = new Float32Array(n);
	for (let v = 0; v < voices; v++) {
		const f1 = new SVF(), f2 = new SVF(), a = lfo(r, 4.5 + r() * 2), fa = lfo(r, 3), fb = lfo(r, 2.4), phr = lfo(r, .35 + r() * .2), pitch = 95 + r() * 110; let ph = 0;
		for (let i = 0; i < n; i++) { const t = i / SR; ph += TAU * pitch * (1 + .06 * fa(t)) / SR; const src = (((ph / TAU) % 1) * 2 - 1) * .6 + (r() * 2 - 1) * .4; if (!(i & 31)) { f1.set(520 + 260 * fa(t), 4); f2.set(1450 + 450 * fb(t), 5); } f1.run(src); f2.run(src); b[i] += (f1.bp + f2.bp * .6) * clamp(a(t) * 2 + .3) * clamp(phr(t) * 3 + .8); }
	}
	const l = new SVF().set(lp, .6); for (let i = 0; i < n; i++) b[i] = l.run(b[i]);
	return norm(fades(b, .4, .4));
}
function whisper({ dur = 2, seed = 17 } = {}) {
	const r = mulberry32(seed), n = N(dur), b = new Float32Array(n), h = new SVF().set(2200, .7), p = new SVF(), a = lfo(r, 6), fc = lfo(r, 3);
	for (let i = 0; i < n; i++) { const t = i / SR, x = r() * 2 - 1; h.run(x); if (!(i & 31)) p.set(4200 + 1500 * fc(t), 1.5); p.run(h.hp); b[i] = (p.bp * 1.5 + h.hp * .3) * Math.pow(clamp(a(t) * 1.6 + .5), 1.5) * swell(i / n, .4, 1, 1); }
	return norm(fades(b, .05, .1));
}
function hum({ dur = 4, f = 120, seed = 18, buzz = .25, flick = .08 } = {}) {
	const r = mulberry32(seed), n = N(dur), b = new Float32Array(n), fl = lfo(r, 2), l = new SVF().set(2500, .7);
	for (let i = 0; i < n; i++) { const t = i / SR, s = Math.sin(TAU * f * t), bz = Math.sign(s) * buzz; b[i] = (s + .45 * Math.sin(TAU * 2 * f * t) + .25 * Math.sin(TAU * 3 * f * t) + l.run(bz)) * (1 - flick + flick * fl(t)); }
	return norm(fades(b, .3, .3));
}
function sparkle({ dur = 2, seed = 19, dens = 30, fmin = 2600, fmax = 7500, peak = .5 } = {}) {
	const r = mulberry32(seed), n = N(dur), b = new Float32Array(n);
	grains(n, r, dens, p => { const L = N(.03 + r() * .09), f = fmin + r() * (fmax - fmin), a = .3 + r() * .7, env = swell(p / n, peak, 1, 1); for (let i = 0; i < L && p + i < n; i++) b[p + i] += Math.sin(TAU * f * i / SR) * a * env * Math.exp(-i / L * 5) * Math.min(1, i / 30); });
	return norm(fades(b));
}
function shimmer({ dur = 2, f = 880, peak = .5, seed = 20, ca = 2, cr = 1.5 } = {}) {
	const r = mulberry32(seed), n = N(dur), b = new Float32Array(n), parts = [1, 1.5, 2, 3, 4].map((m, k) => [f * m * (1 + (r() - .5) * .006), 1 / (1 + k), r() * 5 + 3]);
	for (let i = 0; i < n; i++) { const t = i / SR; let s = 0; for (const [fr, a, tr] of parts) s += Math.sin(TAU * fr * t) * a * (.7 + .3 * Math.sin(TAU * tr * t)); b[i] = s * swell(i / n, peak, ca, cr); }
	return norm(fades(b));
}
function glass({ seed = 21 } = {}) {
	const r = mulberry32(seed), n = N(1.4), b = new Float32Array(n);
	for (let c = 0; c < 7; c++) { const p = N(r() * .16), L = N(.004); for (let i = 0; i < L; i++) b[p + i] += (r() * 2 - 1) * (1 - i / L) * (1 - c * .1); }
	const ring = [2700, 4100, 5900, 7300, 9100]; for (let i = 0; i < n; i++) { const t = i / SR; let s = 0; ring.forEach((f, k) => s += Math.sin(TAU * f * t + k) * Math.exp(-t * (3 + k * 1.5))); b[i] += s * .12 * Math.min(1, t / .002); }
	return norm(fades(b, .0005, .1));
}
function click({ seed = 22, f = 2000 } = {}) { return norm(mix([tick({ f, dur: .03, q: 3, seed, decay: 260 }), 1], [tick({ f: f * .45, dur: .05, q: 2, seed: seed + 1, decay: 160 }), .6, .006])); }
function woodClick({ seed = 23, f = 1900 } = {}) { const r = mulberry32(seed); return norm(mix([tick({ f: f * (.85 + r() * .3), dur: .04, q: 5, seed, decay: 180, tone: .2 }), 1], [blip({ f: 650 + r() * 250, dur: .04, decay: 90 }), .4])); }
function beep({ f = 1000, dur = .12 } = {}) { const n = N(dur), b = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / SR; b[i] = Math.sin(TAU * f * t) + .12 * Math.sin(TAU * 3 * f * t); } return norm(fades(b, .004, .02)); }
function scanner({ dur = 3, seed = 24 } = {}) {
	const r = mulberry32(seed), n = N(dur), b = new Float32Array(n), s = new SVF(); let ph = 0;
	for (let i = 0; i < n; i++) { const t = i / SR, u = i / n; ph += 90 / SR; const saw = (ph % 1) * 2 - 1; if (!(i & 15)) s.set(700 + 2200 * Math.sin(u * Math.PI), 4); s.run(saw + (r() * 2 - 1) * .15); b[i] = (s.bp + .25 * Math.sin(TAU * 1800 * t) * (.5 + .5 * Math.sin(TAU * 11 * t))) * swell(u, .5, .6, .6); }
	return norm(fades(b));
}
function zip({ dur = .6, f0 = 300, f1 = 2000, seed = 25, peak = .8 } = {}) {
	const r = mulberry32(seed), n = N(dur), b = new Float32Array(n), s = new SVF(); let ph = 0;
	for (let i = 0; i < n; i++) { const u = i / n, fr = f0 * Math.pow(f1 / f0, u); ph += TAU * fr / SR; if (!(i & 15)) s.set(fr * 2, 3); s.run(r() * 2 - 1); b[i] = (Math.sin(ph) * .6 + s.bp * 1.2 + .15 * Math.sign(Math.sin(ph * .5))) * swell(u, peak, 1.4, .8); }
	const l = new SVF().set(5000, .7); for (let i = 0; i < n; i++) b[i] = l.run(b[i]);
	return norm(fades(b));
}
function pop({ f = 520, seed = 26 } = {}) { return norm(mix([blip({ f: f * .55, f1: f, dur: .14, decay: 28, harm: .05 }), 1], [tick({ f: f * 4, dur: .02, seed }), .15])); }
function knock({ f = 190, seed = 27 } = {}) { return norm(mix([impact({ dur: .45, f0: f * 1.4, f1: f, noise: .6, lp: 1400, decay: 8, seed }), 1], [woodClick({ seed, f: 1200 }), .4])); }
function creak({ dur = 2.5, seed = 28, f = 900 } = {}) {
	const r = mulberry32(seed), n = N(dur), b = new Float32Array(n), s = new SVF().set(f, 6), s2 = new SVF().set(f * 2.3, 8), rt = lfo(r, 1.7), am = lfo(r, 1.1); let ph = 0;
	for (let i = 0; i < n; i++) { const t = i / SR, u = i / n; ph += (38 + 30 * rt(t)) / SR; let x = 0; if (ph >= 1) { ph -= 1; x = 1 + r() * .5; } s.run(x); s2.run(x); b[i] = (s.bp + s2.bp * .5) * clamp(am(t) + .6) * swell(u, .4, 1, 1); }
	return norm(fades(b, .05, .1));
}
function curtain({ dur = 2.6, seed = 29 } = {}) {
	const r = mulberry32(seed), rings = new Float32Array(N(dur));
	grains(rings.length, r, 22, p => { const m = metal({ f: 1700 + r() * 900, dur: .09, decay: 45, seed: Math.floor(r() * 1e6) }); const a = (.2 + r() * .4) * swell(p / rings.length, .3, 1, 1); for (let i = 0; i < m.length && p + i < rings.length; i++) rings[p + i] += m[i] * a; });
	return norm(mix([whoosh({ dur, f0: 350, f1: 1100, q: .7, peak: .35, seed, body: .8 }), 1], [rings, .35]));
}
function breath({ dur = .8, seed = 30 } = {}) {
	const r = mulberry32(seed), n = N(dur), b = new Float32Array(n), s = new SVF();
	for (let i = 0; i < n; i++) { const u = i / n; if (!(i & 31)) s.set(900 + 500 * u, 1); s.run(r() * 2 - 1); b[i] = s.bp * Math.pow(Math.sin(u * Math.PI), 1.6); }
	return norm(fades(b));
}
function drop({ seed = 31 } = {}) {
	const n = N(.22), b = new Float32Array(n); let ph = 0;
	for (let i = 0; i < n; i++) { const t = i / SR, fr = 520 * Math.pow(3.2, Math.min(1, t / .045)); ph += TAU * fr / SR; b[i] = Math.sin(ph) * Math.exp(-t * 28) * Math.min(1, t / .001); }
	return norm(fades(b, .0005, .02));
}
function liquid({ dur = 3, seed = 32 } = {}) {
	const r = mulberry32(seed), n = N(dur), b = new Float32Array(n), s = new SVF(), fc = lfo(r, 2.5);
	for (let i = 0; i < n; i++) { const t = i / SR; if (!(i & 31)) s.set(380 + 250 * fc(t), 6); s.run(r() * 2 - 1); b[i] = s.bp * swell(i / n, .4, 1, 1); }
	return norm(fades(b, .2, .2));
}
function pen({ dur = 4, seed = 33 } = {}) { // caneta de luz: zumbido elétrico
	const r = mulberry32(seed), n = N(dur), b = new Float32Array(n), l = new SVF().set(3200, .8), fl = lfo(r, 7), wv = lfo(r, .8);
	for (let i = 0; i < n; i++) { const t = i / SR, f = 96 * (1 + .01 * wv(t)); let s = 0; for (let k = 1; k <= 8; k++) s += Math.sin(TAU * f * k * t) / k; s += .35 * Math.sin(TAU * 2860 * t + 3 * Math.sin(TAU * 6 * t)); b[i] = l.run(s) * (.8 + .2 * fl(t)) * Math.min(1, t / .15); }
	return norm(fades(b, .1, .2));
}
function swirl({ dur = 5, seed = 34, rate = .5, slow = 0 } = {}) {
	const r = mulberry32(seed), n = N(dur), b = new Float32Array(n), s = new SVF(); let ph = 0;
	for (let i = 0; i < n; i++) { const t = i / SR, u = i / n; ph += TAU * rate * (1 - slow * u) / SR; if (!(i & 31)) s.set(650 * Math.pow(2, 1.4 * Math.sin(ph)), 3.5); s.run(r() * 2 - 1); b[i] = s.bp * swell(u, .3, 1, 1.2); }
	return norm(fades(b, .3, .3));
}
function ratchet({ dur = 1, n = 12, f = 2600, accel = 1, seed = 35 } = {}) {
	const out = new Float32Array(N(dur + .1)); for (let k = 0; k < n; k++) { const u = Math.pow(k / n, accel), t = click({ seed: seed + k, f: f * (1 + k * .01) }), p = N(u * dur); for (let i = 0; i < t.length && p + i < out.length; i++) out[p + i] += t[i] * (.6 + .4 * k / n); }
	return norm(out);
}
function flutter({ dur = 3, seed = 36 } = {}) {
	const w = whoosh({ dur, f0: 700, f1: 1800, q: 1.5, peak: .5, seed, body: .5, ca: 1, cr: 1 }); for (let i = 0; i < w.length; i++) { const t = i / SR; w[i] *= .45 + .55 * Math.abs(Math.sin(TAU * 7 * t + 2 * Math.sin(TAU * .9 * t))); }
	return norm(w);
}
// ambiências estéreo
function bedStereo(dur, seed, fn) { const ch = [0, 1].map(c => fn(mulberry32(seed + c * 977), N(dur))); const m = Math.max(...ch.map(b => b.reduce((a, x) => Math.max(a, Math.abs(x)), 0))) || 1; ch.forEach(b => { for (let i = 0; i < b.length; i++) b[i] /= m; }); return ch; }
const roomTone = (dur, seed = 40) => bedStereo(dur, seed, (r, n) => { const b = new Float32Array(n), l = new SVF().set(320, .6), h = new SVF().set(40, .7); for (let i = 0; i < n; i++) { l.run(r() * 2 - 1); h.run(l.lp); b[i] = h.hp; } return b; });
const airBed = (dur, seed = 41, f = 220, beat = 3.5) => bedStereo(dur, seed, (r, n) => { const b = new Float32Array(n), h = new SVF().set(5500, .7), am = lfo(r, .15); for (let i = 0; i < n; i++) { const t = i / SR; h.run(r() * 2 - 1); b[i] = h.hp * .25 * (.6 + .4 * am(t)) + .5 * (Math.sin(TAU * f * t) + Math.sin(TAU * (f + beat) * t)) * .5 + .45 * Math.sin(TAU * 55 * t); } return b; });
const digitalBed = (dur, seed = 42) => bedStereo(dur, seed, (r, n) => { const b = new Float32Array(n), h = new SVF().set(7000, .7), am = lfo(r, .2); for (let i = 0; i < n; i++) { const t = i / SR; h.run(r() * 2 - 1); b[i] = h.hp * .18 + (Math.sin(TAU * 55 * t) * .8 + Math.sin(TAU * 110.4 * t) * .25) * (.75 + .25 * am(t)) + .06 * Math.sin(TAU * 3520 * t) * (.5 + .5 * am(t * 1.7)); } return b; });
const cityBed = (dur, seed = 43) => bedStereo(dur, seed, (r, n) => { const b = new Float32Array(n), l = new SVF().set(160, .7), m = new SVF().set(600, .7), am = lfo(r, .25); for (let i = 0; i < n; i++) { const x = r() * 2 - 1; l.run(x); m.run(x); b[i] = l.lp * 2 + m.lp * .4 * (.5 + .5 * am(i / SR)); } return b; });
function mallBed(dur, seed = 44) { // shopping abafado e distante: vozes + passos + reverb
	return [0, 1].map(c => { const m = murmur({ dur, seed: seed + c * 13, voices: 7, lp: 750 }); const r = mulberry32(seed + 5 + c), steps = new Float32Array(m.length);
		grains(steps.length, r, 6, p => { const k = knock({ f: 120 + r() * 60, seed: Math.floor(r() * 1e6) }); const a = .1 + r() * .15; for (let i = 0; i < k.length && p + i < steps.length; i++) steps[p + i] += k[i] * a; });
		for (let i = 0; i < m.length; i++) m[i] += steps[i]; return norm(m); });
}

// ── reverb (Freeverb) ──
function freeverb(src, { room = .84, damp = .25, tail = 2.5 } = {}) {
	const sc = SR / 44100, n = src.length + N(tail), combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], aps = [556, 441, 341, 225];
	return [0, 23].map(sp => {
		const cb = combs.map(d => ({ b: new Float32Array(Math.floor((d + sp) * sc)), i: 0, f: 0 })), ab = aps.map(d => ({ b: new Float32Array(Math.floor((d + sp) * sc)), i: 0 })), o = new Float32Array(n);
		for (let i = 0; i < n; i++) { const x = (i < src.length ? src[i] : 0) * .015; let y = 0;
			for (let k = 0; k < 8; k++) { const c = cb[k], v = c.b[c.i]; c.f = v * (1 - damp) + c.f * damp; c.b[c.i] = x + c.f * room; if (++c.i >= c.b.length) c.i = 0; y += v; }
			for (let k = 0; k < 4; k++) { const a = ab[k], v = a.b[a.i], w = v - y; a.b[a.i] = y + v * .5; if (++a.i >= a.b.length) a.i = 0; y = w; }
			o[i] = y * 3; }
		return o;
	});
}

class Bus {
	constructor(dur) { this.n = N(dur); this.L = new Float32Array(this.n); this.R = new Float32Array(this.n); }
	// buf: Float32Array mono ou [L,R]; o: gain, pan, panEnd, rev, room, fi, fo (fades em s)
	add(t0, buf, o = {}) {
		const g = o.gain ?? 1, p0 = o.pan ?? 0, p1 = o.panEnd ?? p0, s0 = Math.round(t0 * SR);
		const st = Array.isArray(buf), len = st ? buf[0].length : buf.length, fi = N(o.fi ?? 0), fo = N(o.fo ?? 0);
		for (let i = 0; i < len; i++) { const j = s0 + i; if (j < 0 || j >= this.n) continue;
			let e = g; if (fi > 1 && i < fi) e *= i / fi; if (fo > 1 && i > len - fo) e *= (len - i) / fo;
			if (st) { this.L[j] += buf[0][i] * e; this.R[j] += buf[1][i] * e; }
			else { const a = (p0 + (p1 - p0) * i / len + 1) * Math.PI / 4; this.L[j] += buf[i] * e * Math.cos(a) * Math.SQRT2; this.R[j] += buf[i] * e * Math.sin(a) * Math.SQRT2; } }
		if (o.rev && !st) { const [wl, wr] = freeverb(buf, { room: o.room ?? .84 }); for (let i = 0; i < wl.length; i++) { const j = s0 + i; if (j < 0 || j >= this.n) continue; this.L[j] += wl[i] * g * o.rev; this.R[j] += wr[i] * g * o.rev; } }
	}
}

function writeWav(file, L, R) {
	const n = L.length, data = Buffer.alloc(n * 6), h = Buffer.alloc(44);
	for (let i = 0; i < n; i++) for (const [c, A] of [[0, L], [1, R]]) { const v = Math.round(clamp(A[i], -1, 1) * 8388607), o = i * 6 + c * 3; data[o] = v & 255; data[o + 1] = (v >> 8) & 255; data[o + 2] = (v >> 16) & 255; }
	h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22);
	h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 6, 28); h.writeUInt16LE(6, 32); h.writeUInt16LE(24, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
	fs.writeFileSync(file, Buffer.concat([h, data]));
}

module.exports = { SR, SVF, freeverb, mulberry32, Bus, writeWav, mix, reverse, silence, norm, fades,
	whoosh, impact, tick, blip, tone, bell, paper, scribble, metal, drawer, stamp, tear, snip, crackle, burner, wind, birds, murmur, whisper, hum,
	sparkle, shimmer, glass, click, woodClick, beep, scanner, zip, pop, knock, creak, curtain, breath, drop, liquid, pen, swirl, ratchet, flutter,
	roomTone, airBed, digitalBed, cityBed, mallBed };
