// Estilo Sticker — desenhos extras em Canvas2D (API Pen de toon.js): cachorro, bocejo, linhas de velocidade, pão,
// pássaro, "!", "?", "Z", coração, nuvem. Todos com o contorno ameixa do elenco (INK) e cores chapadas.
import { INK, mix, shade } from './toon.js';

const rad = (d) => d * Math.PI / 180;
const WHITE = '#ffffff';

/** cachorro sentado, de frente, canvas 600×600 (patas em y≈575). o: { expr: 'neutral'|'yawn'|'happy'|'sleepy', blink, tail (-1..1), look } */
export function dogFront(p, o = {}) {
	const { expr = 'neutral', blink = 0, tail = 0, look = 0, col = '#d99a5b', ear = '#8a5432' } = o;
	const ol = 9;
	// rabo atrás
	const ta = rad(-40 + 40 * tail);
	p.stroke([[360, 520], [360 + 60 * Math.cos(ta), 520 + 60 * Math.sin(ta) - 20], [360 + 120 * Math.cos(ta), 520 + 120 * Math.sin(ta) - 50]], 30, INK);
	p.stroke([[360, 520], [360 + 60 * Math.cos(ta), 520 + 60 * Math.sin(ta) - 20], [360 + 120 * Math.cos(ta), 520 + 120 * Math.sin(ta) - 50]], 16, col);
	// corpo (feijão) + peito branco + patas
	p.ell(300, 470, 115, 120, col, ol);
	p.ell(300, 470, 60, 85, '#fbf1e2', 0);
	p.ell(250, 570, 40, 22, col, ol); p.ell(350, 570, 40, 22, col, ol);
	for (const x of [236, 252, 336, 352]) p.stroke([[x, 560], [x, 578]], 5);
	// cabeça
	p.ell(300, 280, 125, 110, col, ol);
	// orelhas caídas
	for (const s of [-1, 1]) p.poly([[300 + s * 95, 205], [300 + s * 160, 230], [300 + s * 150, 340], [300 + s * 112, 320]], ear, ol);
	// focinho
	p.ell(300, 325, 62, 46, '#fbf1e2', 7);
	p.ell(300, 300, 24, 16, INK, 0);
	const yawn = expr === 'yawn';
	// olhos
	for (const s of [-1, 1]) {
		const x = 300 + s * 48 + look * 10, y = 255;
		if (yawn || blink > .6 || expr === 'sleepy') p.arc(x, y + 2, 16, 8, yawn ? 200 : 20, yawn ? 340 : 160, 7);
		else if (expr === 'happy') p.arc(x, y + 6, 16, 12, 200, 340, 7);
		else p.ell(x, y, 11, blink > .2 ? 6 : 14, INK, 0);
	}
	if (yawn) { p.ell(300, 362, 34, 44, '#5a1e28', 6); p.ell(300, 388, 20, 14, '#e86e78', 0); }
	else if (expr === 'happy') { p.arc(300, 330, 30, 22, 20, 160, 6); p.ell(300, 362, 14, 16, '#e86e78', 5); }
	else p.arc(300, 330, 22, 12, 20, 160, 6);
}

/** sopro do bocejo: 3 espirais de ar que crescem e somem; canvas 400×300, t 0..1 */
export function fxYawn(p, t) {
	const a = t < .15 ? t / .15 : 1 - Math.max(0, t - .6) / .4;
	if (a <= 0) return;
	const g = p.g; g.save(); g.globalAlpha = a; g.lineCap = 'round';
	for (let i = 0; i < 3; i++) {
		const y0 = 90 + i * 60, len = 200 + 120 * t, pts = [];
		for (let k = 0; k <= 30; k++) { const u = k / 30; pts.push([40 + u * len, y0 + Math.sin(u * 7 + i + t * 6) * 18 * u]); }
		g.strokeStyle = INK; g.lineWidth = 16; g.beginPath(); pts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
		g.strokeStyle = '#eef6ff'; g.lineWidth = 8; g.stroke();
		const [ex, ey] = pts[30]; g.beginPath(); g.arc(ex - 8, ey - 14, 14, 0, Math.PI * 1.6); g.strokeStyle = INK; g.lineWidth = 14; g.stroke(); g.strokeStyle = '#eef6ff'; g.lineWidth = 6; g.stroke();
	}
	g.restore();
}
/** linhas de velocidade (canvas 600×300) */
export function fxSpeed(p, seed = 1) {
	for (let i = 0; i < 7; i++) { const y = 30 + i * 40 + ((seed * 31 + i * 17) % 20), x0 = 40 + ((i * 53 + seed * 11) % 120); p.stroke([[x0, y], [x0 + 260 + (i % 3) * 60, y]], 10 - (i % 3) * 2); }
}
/** baguete (canvas 320×110) */
export function fxBread(p) {
	p.poly([[24, 60], [60, 30], [270, 26], [300, 50], [276, 82], [60, 86]], '#d9913f', 9);
	for (const x of [90, 150, 210]) p.stroke([[x, 44], [x + 30, 62]], 7, '#f5d6a0');
}
/** pássaro voando (canvas 200×120), flap 0..1 */
export function fxBird(p, flap) {
	const w = -50 + 100 * flap;
	p.stroke([[20, 60 + w * .6], [70, 55], [100, 64], [130, 55], [180, 60 + w * .6]], 12, INK);
}
export function fxBang(p, ch = '!', col = '#ffd23f') {
	if (ch === '!') { p.poly([[110, 20], [190, 20], [170, 170], [130, 170]], col, 12); p.ell(150, 220, 26, 26, col, 12); }
	else if (ch === '?') { p.arc(150, 90, 60, 60, 180, 405, 34, INK); p.arc(150, 90, 60, 60, 180, 405, 18, col); p.stroke([[170, 140], [150, 175]], 30, INK); p.stroke([[170, 140], [150, 175]], 16, col); p.ell(150, 225, 22, 22, col, 10); }
}
export function fxZ(p, col = '#eef6ff') { p.poly([[30, 30], [170, 30], [170, 60], [80, 150], [170, 150], [170, 180], [30, 180], [30, 150], [120, 60], [30, 60]], col, 10); }
export function fxHeart(p, col = '#ff5c7a') {
	const pts = []; for (let k = 0; k <= 40; k++) { const a = k / 40 * Math.PI * 2; pts.push([150 + 120 * Math.pow(Math.sin(a), 3), 140 - (100 * Math.cos(a) - 40 * Math.cos(2 * a) - 18 * Math.cos(3 * a) - 6 * Math.cos(4 * a))]); }
	p.poly(pts, col, 12); p.ell(110, 90, 18, 12, '#ffd0da', 0, 0, 360, -30);
}
/** anel no chão ("onda de bocejo") visto de cima, canvas 600×600, t 0..1 */
export function fxWave(p, t) {
	const g = p.g;
	for (let k = 0; k < 2; k++) { const u = t - k * .25; if (u <= 0 || u >= 1) continue; g.beginPath(); g.ellipse(300, 300, 40 + 250 * u, 40 + 250 * u, 0, 0, 7); g.strokeStyle = `rgba(255,236,170,${(1 - u) * .85})`; g.lineWidth = 22 * (1 - u) + 4; g.stroke(); }
}
/** nuvem chapada (ctx direto, 600×300) */
export function cloudCanvas(g, seed) {
	const blobs = [[150, 190, 80], [250, 150, 105], [360, 160, 95], [450, 195, 70], [300, 210, 90]];
	g.fillStyle = '#ffffff';
	for (const [x, y, r] of blobs) { g.beginPath(); g.ellipse(x + ((seed * 37) % 20) - 10, y, r, r * .8, 0, 0, 7); g.fill(); }
	g.beginPath(); g.ellipse(300, 235, 230, 40, 0, 0, 7); g.fill();
	g.globalCompositeOperation = 'source-atop'; const gr = g.createLinearGradient(0, 120, 0, 280); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(160,170,215,.45)'); g.fillStyle = gr; g.fillRect(0, 0, 600, 300);
	g.globalCompositeOperation = 'source-over';
}
export { mix, shade };

// ── adicionados no vídeo 12 ──
/** lágrimas em jato dos dois lados (canvas 400×200), t = fase 0..1 (loop) */
export function fxTears(p, t) {
	for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
		const u = (t + k / 3) % 1, x = 200 + s * (40 + 140 * u), y = 40 + 150 * u * u;
		p.ell(x, y, 13 - 4 * u, 17 - 5 * u, '#9fd4ff', 6);
	}
}
/** gotas de suor (canvas 300×300) */
export function fxSweat(p, t) {
	for (let k = 0; k < 3; k++) { const u = (t + k * .37) % 1, x = 60 + k * 90, y = 40 + 200 * u; p.poly([[x, y - 26], [x + 14, y], [x, y + 12], [x - 14, y]], '#bfe8ff', 6); }
}
/** espiral de "fluido" lilás (canvas 500×500), t 0..1 gira */
export function fxSwirl(p, t, col = '#c9a0ff') {
	const g = p.g; g.save(); g.lineCap = 'round';
	for (let arm = 0; arm < 3; arm++) {
		const pts = []; for (let k = 0; k <= 40; k++) { const u = k / 40, a = arm * 2.094 + t * 6.283 + u * 5, r = 30 + 200 * u; pts.push([250 + Math.cos(a) * r, 250 + Math.sin(a) * r]); }
		g.beginPath(); pts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.strokeStyle = '#241726'; g.lineWidth = 18; g.stroke(); g.strokeStyle = col; g.lineWidth = 9; g.stroke();
	}
	g.restore();
	for (let k = 0; k < 6; k++) { const a = k * 1.05 + t * 4, r = 120 + 90 * ((k * .37 + t) % 1); p.ell(250 + Math.cos(a) * r, 250 + Math.sin(a) * r, 8, 8, '#ffffff', 4); }
}
/** varinha de ferro com ponta dourada (canvas 80×500, ponta em cima) */
export function fxWand(p) { p.poly([[34, 70], [46, 70], [44, 490], [36, 490]], '#3a3d47', 7); p.ell(40, 60, 22, 22, '#f2c541', 7); }
/** seta grossa apontando para baixo (canvas 260×320) */
export function fxArrow(p, col = '#c9a0ff') { p.poly([[90, 20], [170, 20], [170, 170], [235, 170], [130, 300], [25, 170], [90, 170]], col, 12); }
/** brilho de estrela de 4 pontas (canvas 200×200) */
export function fxGlint(p, k = 1) { const r = 90 * k, c = 100; p.poly([[c, c - r], [c + r * .18, c - r * .18], [c + r, c], [c + r * .18, c + r * .18], [c, c + r], [c - r * .18, c + r * .18], [c - r, c], [c - r * .18, c - r * .18]], '#fffbe6', 5); }
/** tosse: nuvenzinha com riscos (canvas 300×200) */
export function fxCough(p, t) { const s = .7 + .5 * t; for (const [x, y, r] of [[120, 110, 40], [170, 90, 46], [215, 115, 34]]) p.ell(x * s + 40 * (1 - s), y, r * s, r * s * .8, '#f4efe4', 6); for (let k = 0; k < 3; k++) p.stroke([[40, 70 + k * 30], [80, 70 + k * 30]], 7); }
