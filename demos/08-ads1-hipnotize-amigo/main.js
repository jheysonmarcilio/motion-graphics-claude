// 08 · ADS1 "Hipnotize seu amigo" — overlay 9:16 (canvas 2D transparente) por cima do vídeo gravado pelo autor.
// Linguagem: colagem pop (tiras de papel rasgado, marca-texto, fita, adesivos com borda branca, letras de bilhete de resgate).
// 0–14,3 s: SÓ palavras sobre o vídeo (tela dividida autor + hipnose). Depois: overlays + inserts de tela cheia.
// Export: node tools/export.js demos/08-ads1-hipnotize-amigo --bg "ADS1 - Hipnotize Amigo.mp4"
const { CAPS, INSERTS, DUR, STAMP } = await (await fetch('./cues.json')).json();

const W = 1080, H = 1920, CX = 500, MAXW = 800;
const C = { paper: '#F4EEE2', ink: '#141414', red: '#FF2E4D', yel: '#FFE14D', blue: '#2F6BFF', pink: '#FF7AB6', white: '#FFFFFF' };
const $ = s => document.querySelector(s);
const params = new URLSearchParams(location.search), EXPORT = params.has('export');
const cv = $('#c'), g = cv.getContext('2d'), vid = $('#bg');
await Promise.all(['900 100px Inter', '800 100px Inter', '800 40px "JetBrains Mono"', '100px "Archivo Black"', '100px "Bebas Neue"'].map(f => document.fonts.load(f)));

// ---------- utilidades ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const E = {
	expoOut: x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x),
	expoIn: x => x <= 0 ? 0 : Math.pow(2, 10 * x - 10),
	backOut: x => { const c1 = 2.0, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
	cubicInOut: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
	elastic: x => x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - .75) * (2 * Math.PI / 3)) + 1,
};
const pop = (t, a, d = .3) => E.backOut(seg(t, a, a + d));
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rnd = (s, i = 0) => mulberry32(s * 7919 + i * 104729 + 13)();
// ruído suave (≤ 1 Hz → sem tremor/flicker)
const wob = (s, t) => { const x = t, i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return (rnd(s, i) * 2 - 1) * (1 - u) + (rnd(s, i + 1) * 2 - 1) * u; };
const deg = d => d * Math.PI / 180;
function fit(text, maxW, maxH, font = 'Inter', weight = 900, start = 200) {
	let s = start; for (; s > 8; s -= 2) { g.font = `${weight} ${s}px ${font}`; const m = g.measureText(text); if (m.width <= maxW && s * .74 <= maxH) break; } return s;
}

// papel rasgado (centrado na origem)
function torn(w, h, seed, amp = 9, step = 22) {
	const r = mulberry32(seed); g.beginPath();
	const n = Math.max(2, Math.round(w / step)), m = Math.max(2, Math.round(h / step));
	g.moveTo(-w / 2, -h / 2);
	for (let i = 1; i <= n; i++) g.lineTo(-w / 2 + w * i / n, -h / 2 + (r() - .5) * amp);
	for (let i = 1; i <= m; i++) g.lineTo(w / 2 + (r() - .5) * amp * .6, -h / 2 + h * i / m);
	for (let i = n - 1; i >= 0; i--) g.lineTo(-w / 2 + w * i / n, h / 2 + (r() - .5) * amp);
	for (let i = m - 1; i > 0; i--) g.lineTo(-w / 2 + (r() - .5) * amp * .6, -h / 2 + h * i / m);
	g.closePath();
}
function paper(w, h, seed, fill, sh = .3) {
	g.save(); g.translate(9, 12); torn(w, h, seed); g.fillStyle = `rgba(0,0,0,${sh})`; g.fill(); g.restore();
	torn(w, h, seed); g.fillStyle = fill; g.fill();
}
function tape(x, y, w, rot, seed) {
	g.save(); g.translate(x, y); g.rotate(rot); g.beginPath();
	const h = 46, r = mulberry32(seed); g.moveTo(-w / 2, -h / 2);
	g.lineTo(w / 2, -h / 2); for (let i = 1; i < 6; i++) g.lineTo(w / 2 + (i % 2 ? 7 : 0), -h / 2 + h * i / 6);
	g.lineTo(w / 2, h / 2); g.lineTo(-w / 2, h / 2); for (let i = 5; i > 0; i--) g.lineTo(-w / 2 - (i % 2 ? 7 : 0) * r(), -h / 2 + h * i / 6);
	g.closePath(); g.fillStyle = 'rgba(255,246,200,.72)'; g.fill(); g.restore();
}
// traço de marcador desenhado progressivamente
function ink(pts, p, color = C.red, lw = 14) {
	if (p <= 0 || pts.length < 2) return;
	let L = 0; const d = [0]; for (let i = 1; i < pts.length; i++) { L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); d.push(L); }
	const goal = L * clamp(p); g.save(); g.strokeStyle = color; g.lineWidth = lw; g.lineCap = g.lineJoin = 'round';
	g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
	for (let i = 1; i < pts.length; i++) { if (d[i] <= goal) g.lineTo(pts[i][0], pts[i][1]); else { const k = (goal - d[i - 1]) / (d[i] - d[i - 1]); g.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k); break; } }
	g.stroke(); g.restore();
}
const ring = (cx, cy, rx, ry, seed, turns = 1.15) => { const r = mulberry32(seed), out = [], a0 = r() * 6; for (let i = 0; i <= 70; i++) { const a = a0 + turns * Math.PI * 2 * i / 70, k = 1 + (r() - .5) * .05 + i / 70 * .08; out.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); } return out; };
const line = (x0, y0, x1, y1, seed, n = 12) => { const r = mulberry32(seed), out = []; for (let i = 0; i <= n; i++) { const k = i / n; out.push([x0 + (x1 - x0) * k + (r() - .5) * 4, y0 + (y1 - y0) * k + (r() - .5) * 4 + Math.sin(k * Math.PI) * 6]); } return out; };
function cross(cx, cy, s, t, a, seed) { ink(line(cx - s, cy - s, cx + s, cy + s, seed), seg(t, a, a + .16), C.red, 26); ink(line(cx + s, cy - s, cx - s, cy + s, seed + 1), seg(t, a + .14, a + .3), C.red, 26); }
function arrowDown(x, y0, y1, p, seed, lw = 16) { ink(line(x, y0, x + 6, y1, seed, 10), p * 1.4, C.red, lw); const q = clamp(p * 1.4 - 1) / .4; ink([[x - 44, y1 - 46], [x + 6, y1 + 4], [x + 52, y1 - 50]], q, C.red, lw); }

// adesivo: forma com borda branca grossa + sombra dura
function sticker(path, fill, border = 13) {
	g.save(); g.lineJoin = 'round';
	g.shadowColor = 'rgba(0,0,0,.32)'; g.shadowOffsetX = 8; g.shadowOffsetY = 11; g.shadowBlur = 0;
	path(); g.strokeStyle = C.white; g.lineWidth = border * 2; g.stroke(); g.fillStyle = C.white; g.fill();
	g.restore(); path(); g.fillStyle = fill; g.fill();
}
const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
function text(s, x, y, size, color, font = 'Inter', weight = 900, align = 'center') { g.font = `${weight} ${size}px ${font}`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(s, x, y); }
// sempre que um texto vai numa caixa: mede e encolhe
function boxText(s, x, y, w, h, color, font = 'Inter', weight = 900, start = 200) { const f = fit(s, w, h, font, weight, start); text(s, x, y, f, color, font, weight); }

function place(x, y, sc, rot, fn) { if (sc <= .001) return; g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc, sc); fn(); g.restore(); }

// ---------- ícones ----------
function playIcon() { sticker(() => rr(-80, -58, 160, 116, 30), C.red); g.beginPath(); g.moveTo(-22, -32); g.lineTo(38, 0); g.lineTo(-22, 32); g.closePath(); g.fillStyle = C.white; g.fill(); }
function lockIcon(open) {
	g.save(); g.translate(0, -open * 46); g.beginPath(); g.arc(0, -70, 62, Math.PI, 0); g.lineTo(62, -10); g.moveTo(-62, -70); g.lineTo(-62, -10);
	g.lineWidth = 50; g.strokeStyle = C.white; g.lineCap = 'round'; g.stroke(); g.lineWidth = 24; g.strokeStyle = C.ink; g.stroke(); g.restore();
	sticker(() => rr(-110, -40, 220, 170, 28), C.yel);
	g.beginPath(); g.arc(0, 30, 20, 0, Math.PI * 2); g.fillStyle = C.ink; g.fill(); g.fillRect(-8, 30, 16, 50);
}
function calendarIcon(label, num) {
	sticker(() => rr(-150, -150, 300, 300, 26), C.white);
	rr(-150, -150, 300, 84, [26, 26, 0, 0]); g.fillStyle = C.red; g.fill();
	for (const x of [-80, 80]) { rr(x - 12, -176, 24, 60, 12); g.fillStyle = C.ink; g.fill(); }
	boxText(label, 0, -108, 250, 54, C.white, 'JetBrains Mono', 800, 60);
	boxText(num, 0, 44, 250, 160, C.ink, 'Inter', 900, 190);
}
function tagIcon(s) {
	sticker(() => { g.beginPath(); g.moveTo(-170, -95); g.lineTo(110, -95); g.lineTo(175, 0); g.lineTo(110, 95); g.lineTo(-170, 95); g.closePath(); }, C.yel);
	g.beginPath(); g.arc(118, 0, 16, 0, Math.PI * 2); g.fillStyle = C.white; g.fill();
	rr(-150, -70, 240, 140, 10); g.fillStyle = 'rgba(0,0,0,0)'; g.fill();
	boxText(s, -30, 4, 230, 120, C.red, 'Inter', 900, 140);
}
function targetIcon() {
	sticker(() => { g.beginPath(); g.arc(0, 0, 150, 0, Math.PI * 2); }, C.white);
	[[130, C.red], [96, C.white], [62, C.red], [28, C.white]].forEach(([r, c]) => { g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fillStyle = c; g.fill(); });
}
function dart(p) { // p: 0 longe → 1 cravado
	const x = 520 * (1 - p), y = -260 * (1 - p);
	g.save(); g.translate(x, y); g.rotate(deg(-27)); g.lineCap = 'round';
	g.strokeStyle = C.white; g.lineWidth = 30; g.beginPath(); g.moveTo(0, 0); g.lineTo(190, 0); g.stroke();
	g.strokeStyle = C.ink; g.lineWidth = 14; g.stroke();
	g.fillStyle = C.blue; g.beginPath(); g.moveTo(150, 0); g.lineTo(215, -42); g.lineTo(200, 0); g.lineTo(215, 42); g.closePath(); g.fill();
	g.restore();
}
function personIcon(fill, spin, sway) {
	g.save(); g.rotate(sway);
	sticker(() => { g.beginPath(); g.moveTo(-120, 190); g.quadraticCurveTo(-120, 40, 0, 40); g.quadraticCurveTo(120, 40, 120, 190); g.closePath(); g.moveTo(80, -60); g.arc(0, -60, 80, 0, Math.PI * 2); }, fill);
	for (const ex of [-30, 30]) { // olhos em espiral
		g.save(); g.translate(ex, -62); g.rotate(spin); g.beginPath(); g.arc(0, 0, 22, 0, Math.PI * 2); g.fillStyle = C.white; g.fill();
		g.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 4.5, r = i / 40 * 19; i ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(0, 0); }
		g.strokeStyle = C.ink; g.lineWidth = 4.5; g.stroke(); g.restore();
	}
	g.beginPath(); g.arc(0, -22, 16, .15 * Math.PI, .85 * Math.PI); g.strokeStyle = C.ink; g.lineWidth = 6; g.lineCap = 'round'; g.stroke();
	g.restore();
}
function giftIcon(open) {
	g.save(); g.translate(0, -open * 70); g.rotate(-open * .35); sticker(() => rr(-120, -110, 240, 60, 10), C.red); g.fillStyle = C.yel; g.fillRect(-20, -110, 40, 60); g.restore();
	sticker(() => rr(-100, -46, 200, 150, 10), C.red); g.fillStyle = C.yel; g.fillRect(-20, -46, 40, 150);
	if (open > .2) { g.globalAlpha = clamp((open - .2) / .5); boxText('?', 0, -120 - open * 60, 120, 120, C.yel, 'Archivo Black', 400, 140); g.globalAlpha = 1; }
}
function star(r1, r2, n = 14) { g.beginPath(); for (let i = 0; i <= n * 2; i++) { const a = i / (n * 2) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? r2 : r1; i ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); }
function sparkle(x, y, s, t, a) { const k = pop(t, a, .3) * (1 - seg(t, a + .5, a + .8)); if (k <= 0) return; place(x, y, k * s, t * 1.2, () => { g.beginPath(); for (let i = 0; i < 8; i++) { const ang = i * Math.PI / 4, r = i % 2 ? 18 : 60; g.lineTo(Math.cos(ang) * r, Math.sin(ang) * r); } g.closePath(); g.fillStyle = C.yel; g.fill(); }); }

// ---------- fundo de retícula (pré-renderizado) ----------
function halftone(dot, bg) {
	const c = document.createElement('canvas'); c.width = 1400; c.height = 2300; const h = c.getContext('2d');
	h.fillStyle = bg; h.fillRect(0, 0, c.width, c.height); h.fillStyle = dot;
	for (let y = 0; y < c.height; y += 34) for (let x = (y / 34 % 2) * 17; x < c.width; x += 34) { const k = .25 + .75 * (Math.sin(x * .004 + y * .002) * .5 + .5); h.beginPath(); h.arc(x, y, 7.5 * k, 0, Math.PI * 2); h.fill(); }
	return c;
}
const BG = { yel: halftone('rgba(0,0,0,.09)', C.yel), ink: halftone('rgba(255,255,255,.07)', C.ink), blue: halftone('rgba(255,255,255,.12)', C.blue), red: halftone('rgba(0,0,0,.12)', C.red) };

// ---------- legendas (assinatura: até 5 palavras, palavra-chave no marca-texto) ----------
const layoutCache = new Map();
function capLayout(c) {
	if (layoutCache.has(c)) return layoutCache.get(c);
	const maxSize = c.size || 112, lines = c.text.split('|').map(s => s.trim().split(/\s+/));
	const kw = new Set((c.kw || '').split(/\s+/).filter(Boolean));
	let size = maxSize; for (const ln of lines) size = Math.min(size, fit(ln.join(' '), MAXW - 70, 999, 'Inter', 900, maxSize));
	g.font = `900 ${size}px Inter`; const sp = g.measureText(' ').width;
	const L = lines.map(ln => { const ws = ln.map(w => ({ w, wd: g.measureText(w).width, kw: kw.has(w.replace(/[.,!?…:]/g, '')) })); return { ws, width: ws.reduce((a, b) => a + b.wd, 0) + sp * (ws.length - 1) }; });
	const out = { size, sp, L, n: L.reduce((a, l) => a + l.ws.length, 0) }; layoutCache.set(c, out); return out;
}
function caption(c, t) {
	if (t < c.a || t > c.b) return;
	const lay = capLayout(c), { size, sp } = lay, lh = size * 1.06 + 34, gap = 10, total = lay.L.length * lh + (lay.L.length - 1) * gap;
	const out = 1 - E.expoIn(seg(t, c.b - .16, c.b));
	const step = Math.min(.12, (c.b - c.a) * .35 / Math.max(1, lay.n));
	let wi = 0; const y0 = (c.y || 1270) - total / 2 + lh / 2 + wob(c.a * 10, t * .7) * 5;
	g.save(); g.globalAlpha = out;
	lay.L.forEach((ln, k) => {
		const la = c.a + k * .08, sx = E.expoOut(seg(t, la, la + .22)), rot = deg((rnd(c.a * 100, k) - .5) * 4 + wob(c.a * 13 + k, t * .6) * .6);
		const y = y0 + k * (lh + gap), w = ln.width + 70, dark = c.dark && k === lay.L.length - 1;
		g.save(); g.translate(CX + (k % 2 ? 14 : -14) * (lay.L.length > 1), y); g.rotate(rot);
		g.save(); g.scale(Math.max(.001, sx), 1); paper(w, lh, (c.a * 100 | 0) + k, dark ? C.ink : C.paper); g.restore();
		let x = -ln.width / 2;
		for (const wd of ln.ws) {
			const wa = c.a + .14 + wi * step, p = seg(t, wa, wa + .25);
			if (p > 0) {
				const bang = c.boom && wd.kw ? 1 + .15 * (1 - E.expoOut(seg(t, wa + .12, wa + .3))) : 1;
				const sh = c.boom && wd.kw && t > wa + .12 && t < wa + .19 ? (rnd(wi, Math.floor(t * 30)) - .5) * 14 : 0;
				if (wd.kw) { const hp = E.expoOut(seg(t, wa + .08, wa + .36)); g.save(); g.rotate(deg(-1.5)); g.strokeStyle = dark ? C.red : C.yel; g.lineWidth = size * .68; g.beginPath(); g.moveTo(x - 10, size * .02); g.lineTo(x - 10 + (wd.wd + 20) * hp, size * .02); g.stroke(); g.restore(); }
				g.save(); g.translate(x + wd.wd / 2 + sh, 0); const s = (.85 + .15 * E.backOut(p)) * bang; g.scale(s, s); g.globalAlpha = out * clamp(p * 2.5);
				text(wd.w, 0, size * .04, size, dark ? C.white : C.ink); g.restore();
			}
			x += wd.wd + sp; wi++;
		}
		g.restore();
	});
	g.restore();
}

// ---------- inserts de tela cheia (folha rasgada que entra e sai) ----------
function sheet(ins, t, draw) {
	const { a, b, dir = 1 } = ins; if (t < a || t > b) return;
	const pin = E.expoOut(seg(t, a, a + .34)), pout = E.expoIn(seg(t, b - .3, b));
	const x = dir * ((1 - pin) * (W + 120) - pout * (W + 160)), rot = deg(dir * (3 * (1 - pin) - 4 * pout));
	g.save(); g.translate(W / 2 + x, H / 2); g.rotate(rot);
	// folha maior que a tela com borda rasgada nas laterais
	g.save(); g.translate(-dir * 26, 0); torn(W + 70, H + 200, ins.seed || 5, 34, 30); g.fillStyle = 'rgba(0,0,0,.35)'; g.fill(); g.restore();
	torn(W + 70, H + 200, ins.seed || 5, 34, 30); g.save(); g.clip();
	const bg = BG[ins.bg], dx = -700 + wob(ins.seed, t * .4) * 30 - (t - a) * 18, dy = -1150 + (t - a) * 10;
	g.drawImage(bg, dx, dy); g.restore();
	g.translate(-W / 2, -H / 2);
	// leve "respiro" de câmera dentro do insert
	const z = 1.08 + (t - a) * .012; g.translate(CX, 960); g.scale(z, z); g.translate(-CX, -960 + 120);
	draw(t - a, t);
	g.restore();
}
function strip(s, x, y, w, h, rot, t, a, fill = C.paper, color = C.ink, seed = 1) {
	const k = E.expoOut(seg(t, a, a + .25)); if (k <= 0) return;
	g.save(); g.translate(x, y); g.rotate(deg(rot)); g.save(); g.scale(k, 1); paper(w, h, seed, fill); g.restore();
	g.globalAlpha = clamp((t - a - .08) * 6); boxText(s, 0, 4, w - 60, h - 30, color); g.restore();
}
function ransom(word, cx, cy, size, t, a, seed, every = .045) {
	const r = mulberry32(seed), fonts = [['Inter', 900], ['Archivo Black', 400], ['Bebas Neue', 400], ['JetBrains Mono', 800]];
	const fills = [[C.paper, C.ink], [C.yel, C.ink], [C.red, C.white], [C.white, C.red], [C.blue, C.white]];
	const items = [...word].map((ch, i) => { const [f, wt] = fonts[Math.floor(r() * 4)], [bg, fg] = fills[Math.floor(r() * 5)], s = size * (.9 + r() * .2); g.font = `${wt} ${s}px "${f}"`; return { ch, f, wt, bg, fg, s, w: g.measureText(ch).width + size * .2, rot: (r() - .5) * 12, dy: (r() - .5) * size * .14 }; });
	const tw = items.reduce((q, o) => q + o.w + 8, -8), sc = Math.min(1, (MAXW + 40) / tw);
	g.save(); g.translate(cx, cy); g.scale(sc, sc); let x = -tw / 2;
	items.forEach((o, i) => {
		const k = pop(t, a + i * every, .28);
		if (o.ch !== ' ' && k > 0) place(x + o.w / 2, o.dy + wob(seed + i, t * .8) * 4, k, deg(o.rot + wob(seed * 3 + i, t * .5) * 2), () => {
			const h = size * 1.05; paper(o.w, h, seed + i, o.bg, .35);
			g.font = `${o.wt} ${o.s}px "${o.f}"`; g.fillStyle = o.fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.ch, 0, o.f === 'Bebas Neue' ? h * .05 : h * .03);
		});
		x += o.w + 8;
	});
	g.restore();
}
function swirl(cx, cy, R, t, color) { g.save(); g.translate(cx, cy); g.rotate(t * .9); g.strokeStyle = color; g.lineWidth = 46; g.lineCap = 'round'; for (const off of [0, Math.PI]) { g.beginPath(); for (let i = 0; i <= 120; i++) { const a = off + i / 120 * Math.PI * 6, r = i / 120 * R; i ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(0, 0); } g.stroke(); } g.restore(); }

const INS = Object.fromEntries(INSERTS.map(i => [i.id, i]));
const DRAW = {
	// "Você não precisa de anos estudando nem de cursos caríssimos"
	naoPrecisa(u, t) {
		const a = INS.naoPrecisa.a;
		strip('VOCÊ NÃO PRECISA DE', CX, 470, 820, 150, -2, t, a + .12, C.ink, C.white, 31);
		const k1 = pop(t, a + .75, .4), yrs = Math.min(10, 1 + Math.floor(seg(t, a + .9, a + 1.75) * 9));
		place(290, 930 + wob(41, t) * 6, k1, deg(-6 + wob(42, t * .6) * 2), () => calendarIcon(yrs === 1 ? 'ANO' : 'ANOS', String(yrs)));
		strip('ANOS', 290, 1200, 250, 110, 3, t, a + 1.0, C.paper, C.ink, 32); strip('ESTUDANDO', 290, 1305, 420, 110, -2, t, a + 1.1, C.paper, C.ink, 34);
		const k2 = pop(t, a + 2.35, .4);
		place(700, 940 + wob(43, t) * 6, k2, deg(7 + wob(44, t * .6) * 2), () => tagIcon('$$$$'));
		strip('CURSOS', 700, 1200, 330, 110, -3, t, a + 2.55, C.paper, C.ink, 33); strip('CARÍSSIMOS', 700, 1305, 420, 110, 2, t, a + 2.65, C.paper, C.ink, 35);
		cross(290, 970, 170, t, a + 1.95, 51); cross(700, 970, 170, t, a + 3.25, 52);
		const nk = pop(t, a + 2.2, .3); place(495, 760, nk, deg(-10), () => { sticker(() => { g.beginPath(); g.arc(0, 0, 62, 0, Math.PI * 2); }, C.red); boxText('NEM', 0, 4, 90, 60, C.white); });
	},
	// "criei o curso Aprenda Hipnose do Zero"
	curso(u, t) {
		const a = INS.curso.a;
		swirl(CX, 960, 1100, t, 'rgba(255,255,255,.06)');
		strip('CRIEI O CURSO', CX, 470, 560, 120, -3, t, a + .1, C.yel, C.ink, 61); tape(CX - 250, 420, 120, deg(-30), 62);
		ransom('APRENDA', CX, 760, 150, t, a + 1.02, 70);
		ransom('HIPNOSE', CX, 975, 190, t, a + 1.36, 80, .05);
		ransom('DO ZERO', CX, 1195, 150, t, a + 1.95, 90);
		ink(ring(CX + 130, 1195, 270, 120, 99), seg(t, a + 2.45, a + 2.8), C.yel, 16);
		sparkle(820, 640, 1, t, a + 1.5); sparkle(170, 1330, .8, t, a + 2.2);
	},
	// "dominar a hipnose e conseguir hipnotizar qualquer pessoa"
	pessoas(u, t) {
		const a = INS.pessoas.a, cols = [C.yel, C.pink, C.paper, C.red, C.white, C.yel];
		strip('HIPNOTIZAR', CX, 400, 620, 140, -2, t, a + .1, C.ink, C.yel, 71);
		const sway = Math.sin((t - a) * 2.6) * .12;
		for (let i = 0; i < 6; i++) {
			const r = i < 3 ? 0 : 1, c = i % 3, x = 205 + c * 295 - r * 0 + (r ? 0 : 0), y = 760 + r * 340;
			place(x, y, pop(t, a + .35 + i * .14, .4) * (r ? .92 : 1), 0, () => personIcon(cols[i], (t - a) * 5 + i, sway * (1 + (i % 2) * .2)));
		}
		strip('QUALQUER PESSOA', CX, 1330, 760, 140, 2, t, a + 1.4, C.paper, C.ink, 72);
		ink(line(CX - 310, 1395, CX + 320, 1392, 73), seg(t, a + 1.8, a + 2.1), C.red, 16);
	},
	// "você paga apenas R$ 97"
	preco(u, t) {
		const a = INS.preco.a, ps = INS.preco.stamp;
		strip('VOCÊ PAGA APENAS', CX, 460, 760, 140, -2, t, a + .1, C.ink, C.white, 81);
		const s = 1 + .45 * (1 - E.expoOut(seg(t, ps, ps + .22))), k = t >= ps ? 1 : 0;
		if (k) place(CX, 900 + wob(82, t) * 5, s, deg(-4 + wob(83, t * .5)), () => {
			paper(780, 500, 84, C.paper, .4);
			boxText('R$', -255, -70, 140, 110, C.red, 'Inter', 900, 120);
			boxText('97', 60, 30, 520, 420, C.ink, 'Inter', 900, 420);
			tape(-330, -230, 150, deg(-35), 85); tape(330, 230, 150, deg(-35), 86);
		});
		ink(ring(CX + 50, 920, 400, 280, 87), seg(t, ps + .35, ps + .8), C.yel, 20);
		for (let i = 0; i < 4; i++) sparkle([170, 850, 230, 820][i], [700, 640, 1180, 1200][i], .9, t, ps + .25 + i * .12);
		strip('ACESSO A TUDO', CX, 1340, 560, 120, 3, t, ps + 1.0, C.yel, C.ink, 88);
	},
};

// ---------- adesivos/rabiscos por cima do autor (pós 14,3 s) ----------
function overlays(t) {
	// cadeado destravando
	{ const a = 18.1, b = 20.0; if (t > a && t < b) { const k = pop(t, a, .4) * (1 - E.expoIn(seg(t, b - .2, b))); place(850, 1000 + wob(1, t) * 6, k * .72, deg(-5 + wob(2, t * .6) * 3), () => lockIcon(E.elastic(seg(t, 19.0, 19.6)))); sparkle(760, 850, .8, t, 19.1); sparkle(950, 900, .6, t, 19.2); } }
	// selo +10 ANOS
	{ const a = 22.9, b = 26.85; if (t > a && t < b) {
		const k = pop(t, a, .45) * (1 - E.expoIn(seg(t, b - .2, b))), n = Math.round(10 * E.expoOut(seg(t, a + .2, a + 1.3)));
		place(CX, 1170 + wob(3, t) * 6, k, deg(-6 + wob(4, t * .5) * 2) + t * .05, () => { sticker(() => star(235, 195, 18), C.yel); g.rotate(-t * .05); boxText('+' + n, 0, -20, 300, 200, C.red, 'Inter', 900, 230); boxText('ANOS', 0, 110, 230, 70, C.ink, 'JetBrains Mono', 800, 80); });
		strip('DE HIPNOSE CLÍNICA', CX, 1440, 620, 104, 2, t, 24.9, C.ink, C.white, 21);
	} }
	// videoaulas: botões de play
	{ const a = 30.9, b = 32.85; if (t > a && t < b) { const out = 1 - E.expoIn(seg(t, b - .2, b)); [[150, 520, -12], [930, 400, 10], [170, 860, 8], [915, 760, -8]].forEach(([x, y, r], i) => place(x, y + wob(10 + i, t) * 10, pop(t, a + i * .18, .35) * out * .95, deg(r + wob(20 + i, t * .6) * 4), playIcon)); } }
	// direto ao ponto: alvo + dardo
	{ const a = 32.95, b = 34.85; if (t > a && t < b) { const out = 1 - E.expoIn(seg(t, b - .2, b)), x = 195, y = 760 + wob(30, t) * 6; place(x, y, pop(t, a, .4) * out * .9, deg(wob(31, t * .5) * 3), () => { targetIcon(); dart(E.expoIn(seg(t, 33.7, 33.95))); }); } }
	// "E o melhor de tudo"
	{ [[230, 1030], [800, 1000], [870, 1500]].forEach(([x, y], i) => sparkle(x, y, .9, t, 40.6 + i * .15)); }
	// checklist
	{ const a = 44.05, b = 47.9; if (t > a && t < b) {
		const k = pop(t, a, .4) * (1 - E.expoIn(seg(t, b - .2, b)));
		place(CX, 1170 + wob(5, t) * 5, k, deg(-2 + wob(6, t * .5)), () => {
			paper(800, 560, 55, C.paper, .35); tape(0, -280, 180, deg(4), 56);
			boxText('VOCÊ LEVA', -200, -205, 320, 60, C.red, 'JetBrains Mono', 800, 52);
			[['TODAS AS VIDEOAULAS', 44.3], ['APOSTILA', 45.9], ['BÔNUS SURPRESA', 46.55]].forEach(([s, ta], i) => {
				const y = -100 + i * 140; g.globalAlpha = clamp((t - ta) * 5) * k;
				rr(-360, y - 42, 84, 84, 14); g.lineWidth = 8; g.strokeStyle = C.ink; g.stroke();
				ink([[-344, y], [-322, y + 24], [-286, y - 30]], seg(t, ta + .1, ta + .35), C.red, 14);
				g.font = `900 ${fit(s, 620, 80, 'Inter', 900, 72)}px Inter`; g.fillStyle = C.ink; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(s, -250, y + 4); g.globalAlpha = 1;
			});
		});
		place(850, 870, pop(t, 46.75, .4) * (1 - E.expoIn(seg(t, b - .2, b))) * .75, deg(12 + wob(7, t) * 4), () => giftIcon(E.elastic(seg(t, 47.1, 47.6))));
	} }
	// CTA: setas descendo
	{ const a = 49.2; if (t > a) { const k = 1 - E.expoIn(seg(t, DUR - .05, DUR)); for (let i = 0; i < 3; i++) { const x = CX - 230 + i * 230, b = ((t - a - i * .12) * 2.2) % 1, dy = Math.sin(Math.max(0, b) * Math.PI) * 26; g.globalAlpha = k; arrowDown(x, 1370 + dy, 1520 + dy, seg(t, a + i * .1, a + i * .1 + .35), 300 + i, 18); g.globalAlpha = 1; } } }
	// carimbo final
	{ const a = STAMP; if (t > a) {
		const s = 1 + .4 * (1 - E.expoOut(seg(t, a, a + .2)));
		place(CX, 1150, s, deg(-3), () => { sticker(() => rr(-380, -130, 760, 260, 30), C.red, 12); rr(-350, -102, 700, 204, 18); g.lineWidth = 8; g.strokeStyle = C.white; g.stroke(); boxText('CONHEÇA O CURSO', 0, 6, 640, 150, C.white, 'Inter', 900, 140); });
	} }
}

// marcadores só-de-palavra na tela dividida (sem tela cheia)
function splitMarks(t) {
	// "dessa maneira AQUI" → seta para o trecho da hipnose
	if (t > 3.3 && t < 4.05) { g.globalAlpha = 1 - seg(t, 3.9, 4.05); arrowDown(860, 1020, 1210, seg(t, 3.35, 3.75), 900, 14); g.globalAlpha = 1; }
}

function flash(t) { for (const a of [INS.preco.stamp, STAMP]) { const k = 1 - seg(t, a, a + .18); if (t >= a && k > 0) { g.fillStyle = `rgba(255,255,255,${.55 * k})`; g.fillRect(0, 0, W, H); } } }

function renderAt(t) {
	t = clamp(t, 0, DUR);
	g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
	splitMarks(t);
	overlays(t);
	for (const c of CAPS) caption(c, t);
	for (const ins of INSERTS) sheet(ins, t, DRAW[ins.id]);
	flash(t);
	g.clearRect(W - 1, H - 1, 1, 1); // 1 px transparente: PNG do export sempre RGBA (troca rgb24/rgba travava o ffmpeg)
	if (!EXPORT) $('#tc').textContent = t.toFixed(2);
}

// ---------- player / HUD ----------
function fitStage() { const s = EXPORT ? 1 : Math.min(innerWidth / W, (innerHeight - 44) / H); $('#stage').style.transform = `translate(-50%, -50%) translateY(${EXPORT ? 0 : -22}px) scale(${s})`; }
addEventListener('resize', fitStage); fitStage();
let T = +(params.get('t') || 0), playing = false;
const scrub = $('#scrub');
function seek(t) { T = clamp(t, 0, DUR); vid.currentTime = T; scrub.value = T; renderAt(T); }
function loop() { if (!playing) return; T = vid.currentTime; scrub.value = T; renderAt(T); if (vid.ended) { playing = false; $('#play').textContent = '▶'; } requestAnimationFrame(loop); }
function toggle() { playing = !playing; $('#play').textContent = playing ? '❚❚' : '▶'; if (playing) { vid.play(); loop(); } else vid.pause(); }
if (EXPORT) { document.documentElement.classList.add('export'); vid.remove(); $('#hud').remove(); }
else {
	$('#play').onclick = toggle; scrub.oninput = () => seek(+scrub.value);
	addEventListener('keydown', e => {
		if (e.code === 'Space') { e.preventDefault(); toggle(); }
		if (e.code === 'ArrowRight') seek(T + (e.shiftKey ? 1 : 1 / 30)); if (e.code === 'ArrowLeft') seek(T - (e.shiftKey ? 1 : 1 / 30));
		if (e.code === 'KeyH') $('#hud').style.display = $('#hud').style.display === 'none' ? '' : 'none';
		if (e.code === 'KeyV') vid.style.visibility = vid.style.visibility === 'hidden' ? '' : 'hidden';
	});
	if (params.has('nohud')) $('#hud').style.display = 'none';
	vid.addEventListener('loadeddata', () => seek(T), { once: true });
}
renderAt(T);
window.__mg = { duration: DUR, fps: 30, width: W, height: H, renderAt };
if (EXPORT) window.__mg.loaded = true;
