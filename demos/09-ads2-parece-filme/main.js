// 09 · ADS2 "Parece filme" — overlay 9:16 (canvas 2D transparente) por cima do vídeo gravado pelo autor.
// Linguagem: trailer de cinema (tira de filme com perfurações, contagem de película, claquete, pôster com holofotes,
// plateia, ingresso, letreiro de lâmpadas, granulação e vazamento de luz).
// 0–14,9 s (tela dividida autor + hipnose): SÓ palavras sobre o vídeo. Depois: overlays + inserts de tela cheia (íris).
// Export: node tools/final.cjs demos/09-ads2-parece-filme --voz "ADS2 - Parece filme.mp4" --bg "ADS2 - Parece filme.mp4"
const { CAPS, INSERTS, DUR, STAMP, SPLIT, COUNT } = await (await fetch('./cues.json')).json();

const W = 1080, H = 1920, CX = 500, MAXW = 800;
const C = { ink: '#0B0B0D', film: '#141418', amber: '#FFB400', gold: '#FFD66B', red: '#E8283C', cream: '#F3E9D2', white: '#FFFFFF', velvet: '#7A0E1C', skin: '#F2C79B' };
const $ = s => document.querySelector(s);
const params = new URLSearchParams(location.search), EXPORT = params.has('export');
const cv = $('#c'), g = cv.getContext('2d'), vid = $('#bg');
await Promise.all(['900 100px Inter', '800 40px "JetBrains Mono"', 'italic 900 100px "Playfair Display"', '700 100px Oswald', '100px "Bebas Neue"'].map(f => document.fonts.load(f)));

// ---------- utilidades ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const E = {
	expoOut: x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x),
	expoIn: x => x <= 0 ? 0 : Math.pow(2, 10 * x - 10),
	backOut: x => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
	cubicInOut: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
	elastic: x => x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - .75) * (2 * Math.PI / 3)) + 1,
};
const pop = (t, a, d = .3) => E.backOut(seg(t, a, a + d));
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rnd = (s, i = 0) => mulberry32(s * 7919 + i * 104729 + 13)();
const wob = (s, t) => { const i = Math.floor(t), f = t - i, u = f * f * (3 - 2 * f); return (rnd(s, i) * 2 - 1) * (1 - u) + (rnd(s, i + 1) * 2 - 1) * u; };
const deg = d => d * Math.PI / 180;
const FONT = { inter: [900, 'Inter', ''], title: [900, '"Playfair Display"', 'italic '], osw: [700, 'Oswald', ''], mono: [800, '"JetBrains Mono"', ''] };
const fs = (k, s) => { const [w, f, it] = FONT[k]; return `${it}${w} ${s}px ${f}`; };
function fit(text, maxW, maxH, k = 'inter', start = 200) { let s = start; for (; s > 8; s -= 2) { g.font = fs(k, s); if (g.measureText(text).width <= maxW && s * .74 <= maxH) break; } return s; }
function text(s, x, y, size, color, k = 'inter', align = 'center') { g.font = fs(k, size); g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(s, x, y); }
function boxText(s, x, y, w, h, color, k = 'inter', start = 200) { text(s, x, y, fit(s, w, h, k, start), color, k); }
function place(x, y, sc, rot, fn) { if (sc <= .001) return; g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc, sc); fn(); g.restore(); }
const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
function inkLine(pts, p, color, lw) {
	if (p <= 0) return; let L = 0; const d = [0]; for (let i = 1; i < pts.length; i++) { L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); d.push(L); }
	const goal = L * clamp(p); g.save(); g.strokeStyle = color; g.lineWidth = lw; g.lineCap = g.lineJoin = 'round'; g.beginPath(); g.moveTo(...pts[0]);
	for (let i = 1; i < pts.length; i++) { if (d[i] <= goal) g.lineTo(...pts[i]); else { const k = (goal - d[i - 1]) / (d[i] - d[i - 1]); g.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k); break; } }
	g.stroke(); g.restore();
}
function arrowDown(x, y0, y1, p, lw = 16, color = C.amber) { inkLine([[x, y0], [x, y1]], p * 1.4, color, lw); inkLine([[x - 44, y1 - 46], [x, y1], [x + 44, y1 - 46]], clamp(p * 1.4 - 1) / .4, color, lw); }
function star(r1, r2, n = 5) { g.beginPath(); for (let i = 0; i <= n * 2; i++) { const a = i / (n * 2) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? r2 : r1; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); }
function glint(x, y, s, t, a) { const k = pop(t, a, .25) * (1 - seg(t, a + .45, a + .75)); if (k <= 0) return; place(x, y, k * s, t * 1.5, () => { g.beginPath(); for (let i = 0; i < 8; i++) { const ang = i * Math.PI / 4, r = i % 2 ? 14 : 62; g.lineTo(Math.cos(ang) * r, Math.sin(ang) * r); } g.closePath(); g.fillStyle = C.gold; g.shadowColor = C.amber; g.shadowBlur = 30; g.fill(); }); }

// ---------- tira de filme (assinatura das legendas deste vídeo) ----------
function filmBand(w, h, t, seed) {
	g.save(); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowOffsetY = 12; g.shadowBlur = 24;
	rr(-w / 2, -h / 2, w, h, 8); g.fillStyle = C.film; g.fill(); g.restore();
	const off = (t * 150 + seed * 9) % 40;
	g.fillStyle = 'rgba(243,233,210,.9)';
	for (const sy of [-h / 2 + 9, h / 2 - 23]) { g.save(); g.beginPath(); g.rect(-w / 2 + 6, sy - 2, w - 12, 18); g.clip(); for (let x = -w / 2 - 40 + off; x < w / 2 + 40; x += 40) { rr(x, sy, 22, 14, 4); g.fill(); } g.restore(); }
	g.fillStyle = 'rgba(255,180,0,.55)'; g.fillRect(-w / 2 + 10, -h / 2 + 30, w - 20, 2); g.fillRect(-w / 2 + 10, h / 2 - 32, w - 20, 2);
}

const layoutCache = new Map();
function capLayout(c) {
	if (layoutCache.has(c)) return layoutCache.get(c);
	const max = c.size || 108, lines = c.text.split('|').map(s => s.trim().split(/\s+/)), kw = new Set((c.kw || '').split(/\s+/).filter(Boolean));
	const fk = w => c.title && kw.has(w) ? 'title' : 'inter';
	const meas = (ln, s) => { let wd = 0; g.font = fs('inter', s); const sp = g.measureText(' ').width; ln.forEach((w, i) => { g.font = fs(fk(w), s); wd += g.measureText(w).width + (i ? sp : 0); }); return wd; };
	let size = max; for (const ln of lines) while (size > 20 && meas(ln, size) > MAXW - 80) size -= 2;
	g.font = fs('inter', size); const sp = g.measureText(' ').width;
	const L = lines.map(ln => { const ws = ln.map(w => { g.font = fs(fk(w), size); return { w, k: fk(w), wd: g.measureText(w).width, kw: kw.has(w) }; }); return { ws, width: meas(ln, size) }; });
	const out = { size, sp, L, n: L.reduce((a, l) => a + l.ws.length, 0) }; layoutCache.set(c, out); return out;
}
function caption(c, t) {
	if (t < c.a || t > c.b) return;
	const lay = capLayout(c), { size, sp } = lay, lh = size * 1.05 + 70, gap = 4, total = lay.L.length * lh + (lay.L.length - 1) * gap;
	const out = 1 - E.expoIn(seg(t, c.b - .15, c.b)), step = Math.min(.12, (c.b - c.a) * .35 / Math.max(1, lay.n));
	let wi = 0; const y0 = (c.y || 1270) - total / 2 + lh / 2 + wob(c.a * 10, t * .7) * 4;
	g.save(); g.globalAlpha = out;
	lay.L.forEach((ln, k) => {
		const la = c.a + k * .07, sx = E.expoOut(seg(t, la, la + .22)), rot = deg((rnd(c.a * 100, k) - .5) * 3 + wob(c.a * 13 + k, t * .6) * .5);
		const y = y0 + k * (lh + gap), w = ln.width + 90;
		g.save(); g.translate(CX + (k % 2 ? 16 : -16) * (lay.L.length > 1) - (1 - sx) * 120, y); g.rotate(rot);
		g.save(); g.scale(Math.max(.001, sx), 1); filmBand(w, lh, t, k + c.a * 10); g.restore();
		let x = -ln.width / 2;
		for (const wd of ln.ws) {
			const wa = c.a + .14 + wi * step, p = seg(t, wa, wa + .25);
			if (p > 0) {
				const bang = c.boom && wd.kw ? 1 + .15 * (1 - E.expoOut(seg(t, wa + .12, wa + .3))) : 1;
				const sh = c.boom && wd.kw && t > wa + .12 && t < wa + .19 ? (rnd(wi, Math.floor(t * 30)) - .5) * 14 : 0;
				g.save(); g.translate(x + wd.wd / 2 + sh, 0); const s = (.85 + .15 * E.backOut(p)) * bang; g.scale(s, s); g.globalAlpha = out * clamp(p * 2.5);
				if (wd.kw) { g.shadowColor = 'rgba(255,180,0,.8)'; g.shadowBlur = 26; }
				text(wd.w, 0, size * (wd.k === 'title' ? .0 : .04), size, wd.kw ? C.amber : C.white, wd.k); g.restore();
				if (wd.kw && c.strike) inkLine([[x - 12, size * .06], [x + wd.wd + 12, -size * .04]], seg(t, wa + .45, wa + .7), C.red, size * .13);
			}
			x += wd.wd + sp; wi++;
		}
		g.restore();
	});
	g.restore();
}

// "100% TÉCNICA" — contador gigante (só palavra, ainda na tela dividida)
function bigCount(t) {
	const { a, b } = COUNT; if (t < a || t > b) return;
	const out = 1 - E.expoIn(seg(t, b - .15, b)), n = Math.round(100 * E.expoOut(seg(t, a + .05, a + .55)));
	g.save(); g.globalAlpha = out;
	const s = .85 + .15 * pop(t, a, .3) + .12 * (1 - E.expoOut(seg(t, a + .55, a + .75))) * (t > a + .55);
	place(CX, 880, s, deg(-3), () => { g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 30; boxText(n + '%', 0, 0, 760, 240, C.amber, 'inter', 260); });
	const k = E.expoOut(seg(t, a + .25, a + .45)); g.save(); g.translate(CX - (1 - k) * 120, 1080); g.scale(Math.max(.001, k), 1); filmBand(560, 150, t, 3); g.restore();
	g.globalAlpha = out * clamp((t - a - .35) * 5); g.save(); g.translate(CX, 1080); boxText('TÉCNICA', 0, 4, 470, 84, C.white, 'inter', 110); g.restore();
	g.restore();
}
function splitMarks(t) { if (t > 1.35 && t < 2.0) { g.globalAlpha = 1 - seg(t, 1.85, 2.0); arrowDown(CX, 1060, 1230, seg(t, 1.4, 1.75), 16); g.globalAlpha = 1; } }

// ---------- textura de película (só depois do split) ----------
function filmLook(t, strong = 0) {
	if (t < SPLIT) return;
	const k = seg(t, SPLIT, SPLIT + .5);
		const v = g.createRadialGradient(W / 2, H * .45, H * .3, W / 2, H * .45, H * .78); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${.35 * k})`); g.fillStyle = v; g.fillRect(0, 0, W, H);
}
function scratches(t, seed, alpha = .25) { const r = mulberry32(seed * 31 + Math.floor(t * 12)); g.save(); g.strokeStyle = `rgba(255,255,255,${alpha})`; for (let i = 0; i < 3; i++) if (r() < .55) { const x = r() * W; g.lineWidth = 1 + r() * 2; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (r() - .5) * 30, H); g.stroke(); } for (let i = 0; i < 5; i++) { g.fillStyle = `rgba(255,255,255,${alpha * .7})`; g.beginPath(); g.arc(r() * W, r() * H, 1 + r() * 3, 0, 7); g.fill(); } g.restore(); }
function leak(t, at, dir = 1) { const k = seg(t, at - .25, at + .45); if (t < SPLIT || k <= 0 || k >= 1) return; const a = Math.sin(k * Math.PI); g.save(); g.globalCompositeOperation = 'lighter'; const x = W * (dir > 0 ? -.2 + k * 1.4 : 1.2 - k * 1.4);
	for (const [dx, dy, r, c] of [[0, 500, 900, '255,120,20'], [180, 1300, 700, '255,40,60'], [-120, 900, 600, '255,210,120']]) { const gr = g.createRadialGradient(x + dx, dy, 0, x + dx, dy, r); gr.addColorStop(0, `rgba(${c},${.55 * a})`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(0, 0, W, H); } g.restore(); }

// ---------- inserts de tela cheia (abrem e fecham em íris) ----------
function insert(ins, t, draw) {
	const { a, b } = ins; if (t < a || t > b) return;
	// entrada: o insert cresce num círculo por cima do autor.
	// saída: abre-se um buraco no insert, centrado no rosto, e o autor (vídeo AO VIVO, já falando) aparece pequeno e cresce até ocupar tudo.
	const R = 1250 * E.expoOut(seg(t, a, a + .42)) + .1, cx = CX, cy = 900;
	const hx = 540, hy = 640, Rh = 1500 * E.cubicInOut(seg(t, b - .6, b));
	g.save(); g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.clip();
	if (Rh > 0) { g.beginPath(); g.rect(-10, -10, W + 20, H + 20); g.moveTo(hx + Rh, hy); g.arc(hx, hy, Rh, 0, Math.PI * 2, true); g.clip('evenodd'); }
	const z = 1.04 + (t - a) * .014; g.save(); g.translate(cx, cy); g.scale(z, z); g.translate(-cx, -cy);
	draw(t - a, t); g.restore();
	scratches(t, ins.seed, .18);
	// tarjas de cinema (letterbox)
	g.fillStyle = '#000'; g.fillRect(0, 0, W, 120); g.fillRect(0, H - 120, W, 120);
	g.restore();
	const ring = (x, y, r) => { g.save(); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.lineWidth = 14; g.strokeStyle = C.amber; g.shadowColor = C.amber; g.shadowBlur = 40; g.stroke(); g.restore(); };
	if (R < 1240) ring(cx, cy, R);
	if (Rh > 0 && Rh < 1450) ring(hx, hy, Rh);
}
function strip(s, x, y, w, h, rot, t, a, color = C.white, k = 'inter') {
	const p = E.expoOut(seg(t, a, a + .25)); if (p <= 0) return;
	g.save(); g.translate(x - (1 - p) * 120, y); g.rotate(deg(rot)); g.save(); g.scale(p, 1); filmBand(w, h, t, a * 7); g.restore();
	g.globalAlpha = clamp((t - a - .17) * 6); if (t > a + .17) boxText(s, 0, 4, w - 70, h - 74, color, k); g.restore();
}
function bgFill(top, bot) { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(-100, -100, W + 200, H + 200); }
function beam(x, y, ang, len, wid, alpha, col = '255,214,107') { g.save(); g.translate(x, y); g.rotate(ang); const gr = g.createLinearGradient(0, 0, 0, -len); gr.addColorStop(0, `rgba(${col},${alpha})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.beginPath(); g.moveTo(-18, 0); g.lineTo(-wid, -len); g.lineTo(wid, -len); g.lineTo(18, 0); g.closePath(); g.globalCompositeOperation = 'lighter'; g.fill(); g.restore(); }

const CURTAIN = (() => { const c = document.createElement('canvas'); c.width = 1300; c.height = 2200; const h = c.getContext('2d'); for (let x = 0; x < c.width; x += 2) { const v = .5 + .5 * Math.sin(x / 95 * Math.PI * 2) * (.8 + .2 * Math.sin(x / 37)); h.fillStyle = `rgb(${60 + v * 110 | 0},${6 + v * 12 | 0},${16 + v * 18 | 0})`; h.fillRect(x, 0, 2, c.height); } const gr = h.createLinearGradient(0, 0, 0, c.height); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(.35, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.6)'); h.fillStyle = gr; h.fillRect(0, 0, c.width, c.height); return c; })();

function clapper(open, label) {
	g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowOffsetY = 16; g.shadowBlur = 30; rr(-260, -40, 520, 260, 14); g.fillStyle = '#17171B'; g.fill(); g.restore();
	g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-240, 80); g.lineTo(240, 80); g.moveTo(0, 80); g.lineTo(0, 205); g.stroke();
	boxText(label, 0, 22, 470, 70, C.white, 'osw', 70);
	text('CENA 1', -120, 146, 34, C.amber, 'mono'); text('TAKE 1', 120, 146, 34, C.amber, 'mono');
	const stripes = (y0) => { g.save(); g.beginPath(); g.rect(-260, y0, 520, 62); g.clip(); g.fillStyle = C.white; g.fillRect(-260, y0, 520, 62); g.fillStyle = '#17171B'; for (let x = -320; x < 300; x += 90) { g.beginPath(); g.moveTo(x, y0 + 62); g.lineTo(x + 45, y0 + 62); g.lineTo(x + 90, y0); g.lineTo(x + 45, y0); g.closePath(); g.fill(); } g.restore(); };
	g.save(); g.translate(0, -40); stripes(-62); g.restore();
	g.save(); g.translate(-255, -104); g.rotate(-open * deg(32)); g.translate(255, 0); stripes(-62); g.restore();
	g.beginPath(); g.arc(-245, -102, 12, 0, 7); g.fillStyle = '#888'; g.fill();
}
function viewer(fill, spin, sway, mouth) {
	g.save(); g.rotate(sway);
	g.beginPath(); g.moveTo(-120, 200); g.quadraticCurveTo(-120, 60, 0, 60); g.quadraticCurveTo(120, 60, 120, 200); g.closePath(); g.fillStyle = fill; g.fill();
	g.beginPath(); g.arc(0, -40, 82, 0, 7); g.fillStyle = C.skin; g.fill();
	g.beginPath(); g.arc(0, -66, 84, Math.PI * 1.05, Math.PI * 1.95); g.lineWidth = 34; g.strokeStyle = '#3A2418'; g.stroke();
	for (const ex of [-30, 30]) { g.save(); g.translate(ex, -40); g.rotate(spin); g.beginPath(); g.arc(0, 0, 22, 0, 7); g.fillStyle = C.white; g.fill(); g.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 4.5, r = i / 40 * 19; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.strokeStyle = C.ink; g.lineWidth = 4.5; g.stroke(); g.restore(); }
	g.beginPath(); g.ellipse(0, 4, 12, 9 + mouth * 8, 0, 0, 7); g.fillStyle = '#5A1E1E'; g.fill();
	g.restore();
}
function popcorn(t) {
	g.save(); g.beginPath(); g.moveTo(-70, -60); g.lineTo(70, -60); g.lineTo(50, 90); g.lineTo(-50, 90); g.closePath(); g.save(); g.clip(); for (let i = -4; i < 4; i++) { g.fillStyle = i % 2 ? C.red : C.white; g.fillRect(i * 22, -70, 22, 170); } g.restore();
	for (let i = 0; i < 9; i++) { const x = -56 + i * 14, y = -66 - Math.abs(Math.sin(i * 1.7)) * 26; g.beginPath(); g.arc(x, y, 17, 0, 7); g.fillStyle = '#FFF4D0'; g.fill(); }
	g.restore();
	for (let i = 0; i < 4; i++) { const p = ((t * .9 + i * .25) % 1), x = -40 + i * 26 + Math.sin(p * 6 + i) * 10, y = -90 - p * 160; g.globalAlpha = 1 - p; g.beginPath(); g.arc(x, y, 13, 0, 7); g.fillStyle = '#FFF4D0'; g.fill(); g.globalAlpha = 1; }
}
function ticket(t) {
	const w = 820, h = 430, sx = 230;
	g.save(); g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowOffsetY = 22; g.shadowBlur = 40;
	g.beginPath(); g.moveTo(-w / 2, -h / 2); g.lineTo(w / 2, -h / 2); g.lineTo(w / 2, -40); g.arc(w / 2, 0, 40, -Math.PI / 2, Math.PI / 2, true); g.lineTo(w / 2, h / 2); g.lineTo(-w / 2, h / 2); g.lineTo(-w / 2, 40); g.arc(-w / 2, 0, 40, Math.PI / 2, -Math.PI / 2, true); g.closePath();
	g.fillStyle = C.cream; g.fill(); g.restore();
	rr(-w / 2 + 22, -h / 2 + 22, w - 44, h - 44, 10); g.lineWidth = 4; g.strokeStyle = C.velvet; g.stroke();
	g.setLineDash([12, 12]); g.beginPath(); g.moveTo(sx, -h / 2 + 22); g.lineTo(sx, h / 2 - 22); g.strokeStyle = 'rgba(122,14,28,.6)'; g.lineWidth = 4; g.stroke(); g.setLineDash([]);
	boxText('INGRESSO', -120, -150, 380, 44, C.velvet, 'mono', 44);
	boxText('APRENDA HIPNOSE', -120, -88, 520, 64, C.ink, 'osw', 80);
	boxText('DO ZERO', -120, -22, 380, 56, C.ink, 'osw', 76);
	g.save(); g.translate(sx + 92, 0); g.rotate(-Math.PI / 2); boxText('Nº 097', 0, 0, 210, 40, C.velvet, 'mono', 40); g.restore();
}
function marquee(t, w, h) { // letreiro de lâmpadas
	g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowOffsetY = 16; g.shadowBlur = 30; rr(-w / 2, -h / 2, w, h, 26); g.fillStyle = '#1A0A0E'; g.fill(); g.restore();
	rr(-w / 2 + 30, -h / 2 + 30, w - 60, h - 60, 14); g.fillStyle = C.amber; g.fill();
	const per = 2 * (w + h) - 160, n = Math.floor(per / 46), ph = Math.floor(t * 8);
	for (let i = 0; i < n; i++) { let d = i / n * per, x, y; const iw = w - 30, ih = h - 30;
		if (d < iw) { x = -iw / 2 + d; y = -ih / 2; } else if ((d -= iw) < ih) { x = iw / 2; y = -ih / 2 + d; } else if ((d -= ih) < iw) { x = iw / 2 - d; y = ih / 2; } else { d -= iw; x = -iw / 2; y = ih / 2 - d; }
		const on = (i + ph) % 3 !== 0; g.beginPath(); g.arc(x, y, 8, 0, 7); g.fillStyle = on ? '#FFF6C8' : '#6B4A10'; if (on) { g.shadowColor = '#FFD66B'; g.shadowBlur = 18; } g.fill(); g.shadowBlur = 0; }
}

const INS = Object.fromEntries(INSERTS.map(i => [i.id, i]));
const DRAW = {
	// "ao longo dos meus mais de 10 anos como professor de hipnose" — contagem de película
	leader(u, t) {
		bgFill('#2A2A2E', '#101013');
		const cy = 860, n = Math.min(10, 1 + Math.floor(seg(u, .12, .8) * 10)), sw = (u * 1.4) % 1;
		g.save(); g.translate(CX, cy);
		g.fillStyle = 'rgba(255,255,255,.07)'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 560, -Math.PI / 2, -Math.PI / 2 + sw * Math.PI * 2); g.closePath(); g.fill();
		g.strokeStyle = 'rgba(243,233,210,.8)'; g.lineWidth = 8; for (const r of [300, 250]) { g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke(); }
		g.lineWidth = 4; g.beginPath(); g.moveTo(-560, 0); g.lineTo(560, 0); g.moveTo(0, -560); g.lineTo(0, 560); g.stroke();
		const bump = 1 + .1 * (1 - E.expoOut(seg(u % 1e9, .8, 1.0))) * (u > .8);
		g.save(); g.scale(bump, bump); g.shadowColor = 'rgba(255,180,0,.7)'; g.shadowBlur = n === 10 ? 50 : 0; boxText(String(n), 0, 12, 380, 300, n === 10 ? C.amber : C.cream, 'osw', 360); g.restore();
		g.restore();
		strip('MAIS DE', CX, 420, 380, 140, -2, t, INS.leader.a + .3, C.amber, 'mono');
		strip('ANOS COMO PROFESSOR', CX, 1245, 800, 140, 1.5, t, INS.leader.a + 1.0, C.white);
		strip('DE HIPNOSE', CX, 1405, 560, 140, -1.5, t, INS.leader.a + 1.9, C.amber);
	},
	// "foi por isso que eu criei o curso Aprenda Hipnose do Zero" — pôster com holofotes
	poster(u, t) {
		const I = INS.poster; bgFill('#0E1230', '#05050A');
		for (const [x, s] of [[120, 1], [880, -1]]) beam(x, 1800, deg(s * (18 + wob(s + 5, t * .7) * 10)), 1900, 260, .28);
		const close = E.expoIn(seg(t, I.clap - .2, I.clap)), bounce = t > I.clap ? .06 * Math.sin((t - I.clap) * 30) * Math.exp(-(t - I.clap) * 8) : 0;
		const cs = pop(t, I.a + .1, .4) * (1 - .3 * E.cubicInOut(seg(t, I.clap + .5, I.clap + .9)));
		const cy = 560 - 160 * E.cubicInOut(seg(t, I.clap + .5, I.clap + .9));
		place(CX, cy, cs, deg(-4 + wob(30, t * .6) * 2), () => clapper(1 - close + bounce, 'CRIEI O CURSO'));
		const tA = I.clap + .75;
		{ const k = pop(t, tA, .35); place(CX, 800, k, 0, () => { g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 20; boxText('A P R E N D A', 0, 0, 640, 90, C.white, 'osw', 100); g.restore(); }); }
		{ const k = pop(t, tA + .35, .45), s = 1 + .2 * (1 - E.expoOut(seg(t, tA + .35, tA + .7)));
			place(CX, 990, k * s, deg(-3), () => { const f = fit('Hipnose', 820, 260, 'title', 300); g.font = fs('title', f); g.textAlign = 'center'; g.textBaseline = 'middle';
				const gr = g.createLinearGradient(0, -f / 2, 0, f / 2); gr.addColorStop(0, '#FFF1B8'); gr.addColorStop(.5, C.amber); gr.addColorStop(1, '#B86A00');
				g.shadowColor = 'rgba(255,180,0,.6)'; g.shadowBlur = 50; g.fillStyle = gr; g.fillText('Hipnose', 0, 0); g.shadowBlur = 0;
				const sh = seg(t, tA + .8, tA + 1.4); if (sh > 0 && sh < 1) { g.save(); g.globalCompositeOperation = 'source-atop'; const x = -500 + sh * 1000, gl = g.createLinearGradient(x - 80, 0, x + 80, 0); gl.addColorStop(0, 'rgba(255,255,255,0)'); gl.addColorStop(.5, 'rgba(255,255,255,.85)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.fillText('Hipnose', 0, 0); g.restore(); } }); }
		strip('DO ZERO', CX, 1185, 460, 150, 2, t, 28.05, C.amber, 'osw');
		for (let i = 0; i < 5; i++) place(CX - 200 + i * 100, 1330, pop(t, 28.5 + i * .07, .3), deg(wob(40 + i, t) * 8), () => { star(40, 17); g.fillStyle = C.gold; g.shadowColor = C.amber; g.shadowBlur = 20; g.fill(); });
		glint(830, 900, 1, t, tA + .6); glint(190, 1100, .8, t, tA + .9);
	},
	// "hipnotizar qualquer pessoa" — plateia de cinema hipnotizada
	plateia(u, t) {
		const I = INS.plateia; bgFill('#1B0E22', '#07040A');
		{ const gr = g.createRadialGradient(CX, 200, 50, CX, 200, 1100); gr.addColorStop(0, 'rgba(180,200,255,.35)'); gr.addColorStop(1, 'rgba(180,200,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
		const cols = ['#2F6BFF', '#E8283C', '#3BB273', '#FFB400', '#9B5DE5', '#F15BB5'], sway = Math.sin(u * 2.4) * .1;
		const rows = [[640, 5, .58], [860, 4, .74], [1110, 3, .92]];
		rows.forEach(([y, n, sc], r) => {
			const span = 760 * (.75 + r * .1);
			for (let i = 0; i < n; i++) { const x = CX - span / 2 + span * i / (n - 1), k = pop(t, I.a + .3 + (r * 5 + i) * .07, .35);
				place(x, y, k * sc, 0, () => { rr(-150, -10, 300, 260, 30); g.fillStyle = '#4A0D18'; g.fill(); viewer(cols[(r * 5 + i) % 6], u * 5 + i + r, sway * (i % 2 ? 1 : -1.1), .5 + .5 * Math.sin(u * 3 + i)); });
			}
			g.fillStyle = '#2A060E'; g.fillRect(0, y + 150 * sc, W, 400);
		});
		place(CX + 250, 1190, pop(t, I.a + 1.4, .35) * .9, deg(8), () => popcorn(u));
		strip('HIPNOTIZAR', CX, 400, 640, 160, -2, t, 31.85, C.amber);
		strip('QUALQUER PESSOA', CX, 1390, 800, 150, 2, t, 32.55, C.white);
	},
	// "o valor cabe no seu bolso: 97 reais" — ingresso carimbado
	ingresso(u, t) {
		const I = INS.ingresso, ps = I.stamp; g.drawImage(CURTAIN, -110 + wob(24, t * .3) * 20, -140);
		beam(CX, 1900, 0, 2000, 520, .22);
		const land = E.expoOut(seg(t, I.a + .05, I.a + .5));
		place(CX + wob(25, t) * 6, 860 - (1 - land) * 1100, 1, deg(-4 + (1 - land) * 30 + wob(26, t * .5) * 1.2), () => ticket(t));
		if (t >= ps) { const s = 1 + .45 * (1 - E.expoOut(seg(t, ps, ps + .2)));
			place(CX - 110, 985, s * .8, deg(-7), () => { g.globalAlpha = .93; rr(-250, -120, 500, 240, 26); g.lineWidth = 16; g.strokeStyle = C.red; g.stroke(); rr(-222, -92, 444, 184, 14); g.lineWidth = 5; g.stroke(); boxText('R$ 97', 0, 8, 400, 160, C.red, 'inter', 170); g.globalAlpha = 1; }); }
		for (let i = 0; i < 4; i++) glint([190, 840, 230, 800][i], [620, 600, 1200, 1230][i], .9, t, ps + .2 + i * .1);
		strip('CABE NO SEU BOLSO', CX, 1330, 760, 150, 2, t, ps + .9, C.amber);
	},
};

// ---------- elementos sobre o autor (depois do split) ----------
function overlays(t) {
	// "qualquer pessoa comum": fileira de silhuetas
	{ const a = 18.4, b = 20.0; if (t > a && t < b) { const out = 1 - E.expoIn(seg(t, b - .2, b)); for (let i = 0; i < 5; i++) place(240 + i * 130, 1030 + wob(60 + i, t) * 6, pop(t, a + i * .09, .35) * out * .42, sway(t, i), () => viewer(['#2F6BFF', '#E8283C', '#3BB273', '#FFB400', '#9B5DE5'][i], t * 4 + i, 0, .4)); } }
	// "consegue fazer": check dourado
	{ const a = 20.9, b = 22.9; if (t > a && t < b) { g.globalAlpha = 1 - seg(t, b - .2, b); place(840, 1000, pop(t, a, .3) * .9, deg(-6), () => { g.beginPath(); g.arc(0, 0, 80, 0, 7); g.fillStyle = C.ink; g.fill(); g.lineWidth = 8; g.strokeStyle = C.amber; g.stroke(); inkLine([[-36, 2], [-8, 30], [40, -30]], seg(t, a + .2, a + .5), C.amber, 18); }); g.globalAlpha = 1; } }
	// "passo a passo": quadros de filme
	{ const a = 23.9, b = 25.25; if (t > a && t < b) { const out = 1 - E.expoIn(seg(t, b - .2, b)); g.save(); g.globalAlpha = out; g.translate(CX - (t - a) * 60, 990);
		for (let i = 0; i < 3; i++) place(-260 + i * 260, 0, pop(t, a + i * .22, .3), deg(-2 + i * 2), () => { rr(-115, -95, 230, 190, 10); g.fillStyle = C.film; g.fill(); g.fillStyle = 'rgba(243,233,210,.9)'; for (let k = -3; k <= 3; k++) { rr(k * 30 - 8, -88, 16, 12, 3); g.fill(); rr(k * 30 - 8, 76, 16, 12, 3); g.fill(); } rr(-95, -66, 190, 132, 6); g.fillStyle = i === 2 ? C.amber : C.cream; g.fill(); boxText('PASSO ' + (i + 1), 0, 4, 160, 70, C.ink, 'osw', 60); });
		g.restore(); } }
	// "total segurança": escudo
	{ const a = 34.0, b = 34.95; if (t > a && t < b) { g.globalAlpha = 1 - seg(t, b - .15, b); place(CX, 990, pop(t, a, .35) * .8, deg(wob(70, t) * 4), () => { g.beginPath(); g.moveTo(0, -130); g.lineTo(110, -90); g.lineTo(100, 30); g.quadraticCurveTo(70, 110, 0, 140); g.quadraticCurveTo(-70, 110, -100, 30); g.lineTo(-110, -90); g.closePath(); g.fillStyle = C.ink; g.fill(); g.lineWidth = 12; g.strokeStyle = C.amber; g.stroke(); inkLine([[-44, 4], [-10, 38], [48, -36]], seg(t, a + .2, a + .5), C.amber, 20); }); g.globalAlpha = 1; } }
	// "o melhor de tudo"
	[[230, 1010], [800, 990], [860, 1480]].forEach(([x, y], i) => glint(x, y, .9, t, 35.1 + i * .14));
	// CTA: setas
	{ const a = 42.1; if (t > a) for (let i = 0; i < 3; i++) { const x = CX - 230 + i * 230, b = ((t - a - i * .12) * 2.2) % 1, dy = Math.sin(Math.max(0, b) * Math.PI) * 26; arrowDown(x, 1380 + dy, 1520 + dy, seg(t, a + i * .1, a + i * .1 + .35), 18); } }
	// carimbo final: letreiro de cinema
	{ const a = STAMP; if (t > a) { const s = 1 + .4 * (1 - E.expoOut(seg(t, a, a + .2)));
		place(CX, 1150, s, deg(-3), () => { marquee(t, 820, 300); boxText('CONHEÇA O', 0, -50, 600, 70, C.ink, 'mono', 64); boxText('TREINAMENTO', 0, 40, 700, 110, C.ink, 'inter', 120); }); } }
}
const sway = (t, i) => deg(Math.sin(t * 2.4 + i) * 6);

function flash(t) { for (const a of [INS.ingresso.stamp, INS.poster.clap, STAMP]) { const k = 1 - seg(t, a, a + .18); if (t >= a && k > 0) { g.fillStyle = `rgba(255,248,230,${.5 * k})`; g.fillRect(0, 0, W, H); } } }

function renderAt(t) {
	t = clamp(t, 0, DUR);
	g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
	filmLook(t);
	splitMarks(t); bigCount(t);
	overlays(t);
	for (const c of CAPS) caption(c, t);
	for (const ins of INSERTS) { leak(t, ins.a, 1); insert(ins, t, DRAW[ins.id]); leak(t, ins.b, -1); }
	leak(t, STAMP, 1);
	flash(t);
	g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 1, 1); // 1 px transparente: o PNG do export continua RGBA nos inserts opacos (senão o ffmpeg reinicia o filtro e quebra os tempos)
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
