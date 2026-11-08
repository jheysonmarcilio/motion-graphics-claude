// Estilo Sticker — utilidades de tempo/câmera (determinísticas). Regras de motion.md:
// deslizes smootherstep 18–40 q, todo plano "rasteja" (push-in 0,15–0,35 %/q), tremor de impacto que inverte o sinal
// a cada quadro e some em 7 q, roll 4–5°.
export const FPS = 30;
export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
export const smoother = (x) => { x = clamp(x); return x * x * x * (x * (6 * x - 15) + 10); };
export const easeOut = (x, p = 3) => 1 - Math.pow(1 - clamp(x), p);
export const easeIn = (x, p = 3) => Math.pow(clamp(x), p);
export const backOut = (x, s = 1.7) => { x = clamp(x) - 1; return x * x * ((s + 1) * x + s) + 1; };
export const expoIn = (x) => (x <= 0 ? 0 : Math.pow(2, 10 * clamp(x) - 10));
export const pulse = (t, a, b) => (t >= a && t < b ? 1 : 0);
export const hash = (i, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
export function mulberry32(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const v3lerp = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/** tremor de impacto: soma de chutes [t0, amp]; inverte o sinal a cada quadro, decai em 7 quadros. Retorna -1..1 * amp */
export function kick(t, kicks) {
	const f = Math.round(t * FPS); let s = 0;
	for (const [t0, a] of kicks) { const k = f - Math.round(t0 * FPS); if (k >= 0 && k < 7) s += a * (k % 2 ? -1 : 1) * (1 - k / 7); }
	return s;
}
/** piscadas: 0 aberto .. 1 fechado; intervalos 0,5–2,3 s, 4 quadros (meio, fechado, fechado, meio) */
const LID = [0.5, 1, 1, 0.5];
export function lidAt(t, seed, swaps = []) {
	const f = Math.round(t * FPS);
	for (const ts of swaps) { const k = f - Math.round(ts * FPS) + 2; if (k >= 0 && k < 4) return LID[k]; }
	let s = Math.round(-60 * hash(seed, 9));
	for (let n = 0; s <= f && n < 400; n++) { const k = f - s; if (k >= 0 && k < 4) return LID[k]; s += Math.round(15 + 54 * hash(seed * 31 + n, 13)); }
	return 0;
}
/** expressão por trilha de tempo: [[t, expr], ...] (a reação já vem adiantada 2 q pelo autor da trilha) */
export const exprAt = (t, track) => { let e = track[0][1]; for (const [a, x] of track) if (t >= a) e = x; return e; };
/** instantes de troca de expressão (para piscar junto e esconder a troca) */
export const swapsOf = (track) => track.slice(1).map((k) => k[0]);
