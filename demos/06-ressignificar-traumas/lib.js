// Utilidades do Short 06 (explainer flat). Motor genérico; o mundo visual está em flat.js / shots.js.
import * as THREE from 'three';

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const lerp = (a, b, k) => a + (b - a) * k;
export const ease = {
	expoOut: x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x),
	expoIn: x => x <= 0 ? 0 : Math.pow(2, 10 * x - 10),
	expoInOut: x => x <= 0 ? 0 : x >= 1 ? 1 : x < .5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2,
	cubicInOut: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
	cubicOut: x => 1 - Math.pow(1 - x, 3),
	sineInOut: x => -(Math.cos(Math.PI * x) - 1) / 2,
	backOut: x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
	elasticOut: x => x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - .75) * (2 * Math.PI / 3)) + 1,
};
export const pop = (T, t0, d = .35) => ease.backOut(seg(T, t0, t0 + d));
export const gone = (T, t1, d = .2) => 1 - ease.expoIn(seg(T, t1 - d, t1));
export const win = (T, a, b, di = .35, dout = .2) => (T < a || T > b) ? 0 : pop(T, a, di) * gone(T, b, dout);
export const smooth = (t, a, b) => ease.cubicInOut(seg(t, a, b));

export function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// ruído suave determinístico (1D)
export function wobble(seed) { const r = mulberry32(seed), p = Array.from({ length: 512 }, () => r() * 2 - 1); return t => { const x = Math.abs(t), i = Math.floor(x) % 511, f = x - Math.floor(x), u = f * f * (3 - 2 * f); return p[i] * (1 - u) + p[i + 1] * u; }; }

// fonte que cabe: largura E altura
export function fitFont(g, text, maxW, maxH, weight = 900, family = 'Inter', start = 220) {
	let s = Math.min(start, maxH * 1.4);
	for (; s > 6; s -= 1) { g.font = `${weight} ${s}px ${family}`; const m = g.measureText(text); if (m.width <= maxW && (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) <= maxH) break; }
	return s;
}
export function canvasTex(w, h, draw) {
	const c = document.createElement('canvas'); c.width = w; c.height = h;
	const g = c.getContext('2d'); draw(g, w, h);
	const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
	t.userData.canvas = c;
	return t;
}
