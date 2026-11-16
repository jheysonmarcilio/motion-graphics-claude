// 17 — "Como é a primeira sessão" · RPG de fases em PIXEL ART · Short 9:16 · 47 s
// Canvas lógico 216×384 (×5 = 1080×1920). Tempos = audio/17-primeira-sessao-rpg.mp3 (words.json). Tudo é função de t.
const W = 216, H = 384, FPS = 30, DUR = 47;
const Q = new URLSearchParams(location.search);
const WORDS = await (await fetch('./words.json')).json();
await Promise.all(['800 40px Inter', '900 40px Inter'].map((f) => document.fonts.load(f)));

// ───── tempos da narração ─────
const SS = [];
WORDS.forEach((w, i) => { const s = (SS[w.s] ||= { a: w.a, e: 0, ws: [] }); s.ws.push(i); s.e = Math.max(s.e, w.a + w.d); });
const wt = (s, k) => WORDS[SS[s].ws[Math.min(k, SS[s].ws.length - 1)]].a;
const SA = (s) => SS[s].a, SE = (s) => SS[s].e;
const STARTS = [0, SA(2), SA(5), SA(8), SA(10), SA(12), SA(14), SA(16)]; // 0 gancho · 1–6 fases · 7 final
const SW = STARTS.map((s, i) => (i ? s - .15 : 0));                    // instante em que a cena troca (tela coberta)
const PNAME = ['', 'A CONVERSA', 'O TESTE', 'A INDUÇÃO', 'LUGAR SEGURO', 'O TRABALHO', 'A VOLTA', 'COMPLETA'];

// ───── utilidades ─────
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = (u) => { u = clamp(u); return u * u * (3 - 2 * u); };
const backOut = (u) => { u = clamp(u); if (u <= 0) return 0; if (u >= 1) return 1; const c = 1.70158; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
const expoIn = (u) => (u <= 0 ? 0 : Math.pow(2, 10 * u - 10));
const lerp = (a, b, u) => a + (b - a) * u;
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hx = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
const BY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + .5) / 16);

const cv = document.getElementById('c'); cv.width = W; cv.height = H;
const g = cv.getContext('2d', { willReadFrequently: false });
const img = g.createImageData(W, H);
let T = 0;

// paleta
const INK = '#1a1c2c', PLUM = '#5d275d', WINE = '#b13e53', ORG = '#ef7d57', YEL = '#ffcd75', LIME = '#a7f070', GRN = '#38b764',
	TEAL = '#257179', NAVY = '#29366f', BLUE = '#3b5dc9', SKY = '#41a6f6', CYAN = '#73eff7', WHT = '#f4f4f4', SIL = '#94b0c2', SLT = '#566c86', DRK = '#333c57', PINK = '#ff77a8';

const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const PX = (x, y, c) => R(x, y, 1, 1, c);
function ell(cx, cy, rx, ry, c) { g.fillStyle = c; cx = Math.round(cx); cy = Math.round(cy); for (let y = -ry; y <= ry; y++) { const w = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))) + .5); g.fillRect(cx - w, cy + y, w * 2 + 1, 1); } }
const disc = (cx, cy, r, c) => ell(cx, cy, r, r, c);
function ring(cx, cy, r, c, th = 1) { g.fillStyle = c; for (let a = 0; a < 360; a += 3) { const x = Math.round(cx + Math.cos(a * Math.PI / 180) * r), y = Math.round(cy + Math.sin(a * Math.PI / 180) * r); g.fillRect(x, y, th, th); } }
function halo(cx, cy, r0, r1, c, s) { g.fillStyle = c; cx = Math.round(cx); cy = Math.round(cy); for (let y = -r1; y <= r1; y++) for (let x = -r1; x <= r1; x++) { const d = Math.hypot(x, y); if (d < r0 || d > r1) continue; if ((1 - (d - r0) / (r1 - r0)) * s > BY[((cy + y) & 3) * 4 + ((cx + x) & 3)]) g.fillRect(cx + x, cy + y, 1, 1); } }
function spr(rows, pal, x, y, k = 1) { x = Math.round(x); y = Math.round(y); rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const c = pal[r[i]]; if (c) { g.fillStyle = c; g.fillRect(x + i * k, y + j * k, k, k); } } }); }
function line(x0, y0, x1, y1, c, th = 1) { g.fillStyle = c; const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) g.fillRect(Math.round(lerp(x0, x1, i / n)), Math.round(lerp(y0, y1, i / n)), th, th); }

// imagem de fundo (ImageData) — gradiente com dither Bayer
const FILL = (x0, y0, x1, y1, fn) => { const d = img.data; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const c = fn(x, y), o = (y * W + x) * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255; } };
const GRAD = (y0, y1, cols) => { const P = cols.map(hx); FILL(0, y0, W, y1, (x, y) => { const f = clamp((y - y0) / (y1 - y0 - 1)) * (P.length - 1), i = Math.min(Math.floor(f), P.length - 2), fr = f - i; return fr > BY[(y & 3) * 4 + (x & 3)] ? P[i + 1] : P[i]; }); };
const FLUSH = () => g.putImageData(img, 0, 0);

// ───── fonte 3×5 (+ acentos) ─────
const F = {
	A: '.#.|#.#|###|#.#|#.#', B: '##.|#.#|##.|#.#|##.', C: '.##|#..|#..|#..|.##', D: '##.|#.#|#.#|#.#|##.', E: '###|#..|##.|#..|###', F: '###|#..|##.|#..|#..',
	G: '.##|#..|#.#|#.#|.##', H: '#.#|#.#|###|#.#|#.#', I: '###|.#.|.#.|.#.|###', J: '..#|..#|..#|#.#|.#.', K: '#.#|#.#|##.|#.#|#.#', L: '#..|#..|#..|#..|###',
	M: '#.#|###|###|#.#|#.#', N: '###|#.#|#.#|#.#|#.#', O: '.#.|#.#|#.#|#.#|.#.', P: '##.|#.#|##.|#..|#..', Q: '.#.|#.#|#.#|##.|.##', R: '##.|#.#|##.|#.#|#.#',
	S: '.##|#..|.#.|..#|##.', T: '###|.#.|.#.|.#.|.#.', U: '#.#|#.#|#.#|#.#|###', V: '#.#|#.#|#.#|#.#|.#.', W: '#.#|#.#|###|###|#.#', X: '#.#|#.#|.#.|#.#|#.#',
	Y: '#.#|#.#|.#.|.#.|.#.', Z: '###|..#|.#.|#..|###', 0: '###|#.#|#.#|#.#|###', 1: '.#.|##.|.#.|.#.|###', 2: '##.|..#|.#.|#..|###', 3: '##.|..#|.#.|..#|##.',
	4: '#.#|#.#|###|..#|..#', 5: '###|#..|##.|..#|##.', 6: '.##|#..|###|#.#|###', 7: '###|..#|.#.|.#.|.#.', 8: '###|#.#|###|#.#|###', 9: '###|#.#|###|..#|##.',
	'%': '#.#|..#|.#.|#..|#.#', '/': '..#|..#|.#.|#..|#..', '!': '.#.|.#.|.#.|...|.#.', '?': '##.|..#|.#.|...|.#.', ':': '...|.#.|...|.#.|...', '.': '...|...|...|...|.#.',
	'-': '...|...|###|...|...', '+': '...|.#.|###|.#.|...', '*': '#.#|.#.|###|.#.|#.#', ' ': '...|...|...|...|...'
};
const ACC = { Ã: ['A', 't'], Õ: ['O', 't'], Ç: ['C', 'c'], É: ['E', 'a'], Ê: ['E', 'a'], Á: ['A', 'a'], Í: ['I', 'a'], Ó: ['O', 'a'], Ú: ['U', 'a'], Ô: ['O', 'a'] };
const ptw = (s, k) => s.length * 4 * k - k;
function ptext(s, x, y, k, c, o = {}) {
	s = String(s).toUpperCase(); if (o.center) x = Math.round(x - ptw(s, k) / 2);
	const draw = (dx, dy, col) => { let px = x + dx; for (const ch of s) { const [b, ac] = ACC[ch] || [ch, null]; (F[b] || F[' ']).split('|').forEach((r, j) => { for (let i = 0; i < 3; i++) if (r[i] === '#') R(px + i * k, y + dy + j * k, k, k, col); });
		if (ac === 'a') R(px + 2 * k, y + dy - 2 * k, k, k, col); if (ac === 't') { R(px, y + dy - 2 * k, k, k, col); R(px + 2 * k, y + dy - 2 * k, k, k, col); } if (ac === 'c') R(px + k, y + dy + 5 * k, k, k, col); px += 4 * k; } };
	if (o.shadow) draw(0, k, o.shadow); if (o.out) { for (const [a, b] of [[-k, 0], [k, 0], [0, -k], [0, k]]) draw(a, b, o.out); }
	draw(0, 0, c);
}

// ───── dados com seed ─────
const rnd = mulberry32(17);
const STARS = Array.from({ length: 90 }, () => ({ x: Math.floor(rnd() * W), y: Math.floor(rnd() * 250), ph: rnd() * 6.28, big: rnd() < .12 }));
const CONF = Array.from({ length: 80 }, () => ({ x: rnd() * W, y0: rnd() * 400, v: 14 + rnd() * 26, ph: rnd() * 6.28, c: [YEL, PINK, CYAN, LIME, ORG, WHT][Math.floor(rnd() * 6)], s: rnd() < .3 ? 2 : 1 }));
const DUST = Array.from({ length: 26 }, () => ({ x: rnd() * W, y: rnd() * 300, v: 2 + rnd() * 4, ph: rnd() * 6.28 }));
const WIPE = Array.from({ length: 18 * 32 }, () => rnd());

// ───── sprites e ícones ─────
const PAD = ['.kkkkkkk.', 'kgggggggk', 'kgwgggrgk', 'kwwwggrrk', 'kgwgggrgk', '.kkkkkkk.'];
const PADP = { k: INK, g: SLT, w: WHT, r: WINE };
const pad = (x, y, k = 1) => spr(PAD, PADP, x, y, k);
const HEART = ['.rr.rr.', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'];
const heart = (x, y, k = 1, c = WINE) => spr(HEART, { r: c }, x, y, k);
function spark(x, y, c = YEL, r = 2) { x = Math.round(x); y = Math.round(y); R(x - r, y, r * 2 + 1, 1, c); R(x, y - r, 1, r * 2 + 1, c); PX(x, y, WHT); }
function lemon(cx, cy, k = 1) { ell(cx, cy, 7 * k, 5 * k, INK); R(cx + 7 * k, cy - k, 2 * k, 2 * k, INK); R(cx - 9 * k, cy - k, 2 * k, 2 * k, INK); ell(cx, cy, 6 * k, 4 * k, YEL); ell(cx - k, cy - k, 3 * k, 2 * k, '#fff3a0'); R(cx + 6 * k, cy - k, k, k, YEL); R(cx - 7 * k, cy - k, k, k, YEL); R(cx + 1 * k, cy - 6 * k, 4 * k, 2 * k, GRN); }
function lemonHalf(cx, cy, k = 1, rot = 0) { disc(cx, cy, 5 * k, INK); disc(cx, cy, 4 * k, YEL); disc(cx, cy, 3 * k, '#fff3a0'); for (let a = 0; a < 6; a++) { const an = a * Math.PI / 3 + rot; line(cx, cy, cx + Math.cos(an) * 3 * k, cy + Math.sin(an) * 3 * k, YEL, 1); } PX(cx, cy, YEL); }
function bell(x, y, sw, k = 1) { const dx = Math.round(sw * 3); R(x - 1, y - 14, 2, 14, SLT);
	const bx = x + dx; ell(bx, y + 6 * k, 9 * k, 9 * k, INK); ell(bx, y + 6 * k, 8 * k, 8 * k, YEL); R(bx - 9 * k, y + 6 * k, 18 * k, 5 * k, INK); R(bx - 8 * k, y + 6 * k, 16 * k, 4 * k, YEL); R(bx - 6 * k, y + 2 * k, 2 * k, 4 * k, '#fff3a0'); R(bx - 9 * k, y + 11 * k, 18 * k, 2, ORG); disc(bx - sw * 2, y + 14 * k, 2 * k, INK); }
function ear(cx, cy, k = 1) { ell(cx, cy, 8 * k + 1, 11 * k + 1, INK); ell(cx, cy, 8 * k, 11 * k, '#f4b48a'); ell(cx - k, cy + k, 4 * k, 7 * k, '#e0956a'); ell(cx - 2 * k, cy + 2 * k, 2 * k, 4 * k, '#a8603a'); R(cx - 8 * k, cy + 4 * k, 4 * k, 7 * k, '#f4b48a'); }
function brain(cx, cy, pulse, k = 1) { const c = pulse > .01 ? lerpC('#ff77a8', '#ffe0ee', pulse) : '#ff77a8';
	ell(cx - 5 * k, cy, 8 * k + 1, 8 * k + 1, INK); ell(cx + 5 * k, cy, 8 * k + 1, 8 * k + 1, INK); R(cx - 4 * k, cy + 6 * k, 8 * k, 4 * k, INK);
	ell(cx - 5 * k, cy, 8 * k, 8 * k, c); ell(cx + 5 * k, cy, 8 * k, 8 * k, c); R(cx - 3 * k, cy + 6 * k, 6 * k, 3 * k, '#e0558a');
	R(cx, cy - 7 * k, 1, 12 * k, '#b13e7a'); for (let i = -2; i <= 2; i++) { R(cx - 8 * k, cy + i * 3 * k, 4 * k, 1, '#e0558a'); R(cx + 4 * k, cy + i * 3 * k + 1, 4 * k, 1, '#e0558a'); } }
const lerpC = (a, b, u) => { const A = hx(a), B = hx(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], u))).join(',')})`; };
function eye(cx, cy, open, k = 1) { ell(cx, cy, 10 * k + 1, 6 * k + 1, INK); ell(cx, cy, 10 * k, 6 * k * Math.max(.12, open), WHT); if (open > .2) { disc(cx, cy, 4 * k, BLUE); disc(cx, cy, 2 * k, INK); PX(cx - k, cy - k, WHT); } }

// balão de fala/pensamento
function bubble(cx, cy, w, h, dir, u = 1) {
	if (u <= 0) return; const pw = Math.round(w * u), ph = Math.round(h * u), x = Math.round(cx - pw / 2), y = Math.round(cy - ph / 2);
	R(x + 1, y - 1, pw - 2, ph + 2, INK); R(x - 1, y + 1, pw + 2, ph - 2, INK); R(x + 1, y, pw - 2, ph, WHT); R(x, y + 1, pw, ph - 2, WHT);
	if (dir === 'l') { R(x + 4, y + ph, 5, 3, INK); R(x + 5, y + ph, 3, 2, WHT); R(x + 3, y + ph + 3, 3, 2, INK); }
	if (dir === 'r') { R(x + pw - 9, y + ph, 5, 3, INK); R(x + pw - 8, y + ph, 3, 2, WHT); R(x + pw - 6, y + ph + 3, 3, 2, INK); }
	if (dir === 'c') { R(cx - 3, y + ph, 5, 3, INK); R(cx - 2, y + ph, 3, 2, WHT); R(cx - 1, y + ph + 3, 3, 2, INK); }
}
function cloudBubble(cx, cy, rx, ry, tx, ty, u = 1) {
	if (u <= 0) return; const r1 = Math.round(rx * u), r2 = Math.round(ry * u);
	for (const [e, c] of [[1, INK], [0, WHT]]) { ell(cx, cy, r1 + e, r2 + e, c); ell(cx - r1 * .6, cy + r2 * .5, r1 * .45 + e, r2 * .45 + e, c); ell(cx + r1 * .6, cy + r2 * .5, r1 * .45 + e, r2 * .45 + e, c); ell(cx, cy - r2 * .6, r1 * .5 + e, r2 * .35 + e, c); }
	for (let i = 1; i <= 3; i++) { const x = lerp(cx, tx, i / 4 + .1), y = lerp(cy + r2, ty, i / 4 + .05), r = 4 - i; disc(x, y, r + 1, INK); disc(x, y, r, WHT); }
}

// ───── PERSONAGEM (chibi, unidades × k) ─────
function person(cx, fy, k, o = {}) {
	const P = { skin: '#f4b48a', hair: '#5d3a1a', shirt: BLUE, pants: DRK, eyes: 'open', mouth: 'smile', arm: 'down', pad: false, glasses: false, bun: false, beard: false, notebook: false, brows: null, ph: 0, ...o };
	const b = (T * 2 + P.ph) % 2 < .12 ? 0 : (Math.sin(T * 2.6 + P.ph) > .5 ? -1 : 0);       // respiração
	const blink = (T + P.ph * 1.7) % 3.7 < .13 && P.eyes === 'open';
	const parts = [];
	const add = (x, y, w, h, c) => parts.push([x, y, w, h, c]);
	add(-4, -5, 3, 5, P.pants); add(1, -5, 3, 5, P.pants); add(-5, -2, 4, 2, INK); add(1, -2, 4, 2, INK);       // pernas + sapatos
	add(-6, -16, 12, 11, P.shirt);                                                                              // corpo
	const armL = [-8, -16, 2, 7], armR = P.arm === 'up' ? [6, -27, 2, 12] : P.arm === 'wave' ? [6, -26, 2, 11 + (Math.sin(T * 9) > 0 ? 0 : 1)] : [6, -16, 2, 7];
	add(...armL, P.shirt); add(...armR, P.shirt);
	add(-8, -31 + b, 16, 15, P.skin);                                                                           // cabeça
	if (P.beard) add(-7, -21 + b, 14, 5, P.hair);
	add(-9, -33 + b, 18, 6, P.hair); add(-9, -30 + b, 2, 7, P.hair); add(7, -30 + b, 2, 7, P.hair);
	if (P.bun) add(-3, -37 + b, 6, 5, P.hair);
	if (P.glasses) { add(-6, -26 + b, 5, 4, WHT); add(1, -26 + b, 5, 4, WHT); add(-1, -25 + b, 2, 1, INK); }
	// contornos primeiro
	for (const [x, y, w, h] of parts) R(cx + (x - 1) * k, fy + (y - 1) * k, (w + 2) * k, (h + 2) * k, INK);
	for (const [x, y, w, h, c] of parts) R(cx + x * k, fy + y * k, w * k, h * k, c);
	const u = (x, y, w, h, c) => R(cx + x * k, fy + (y + b) * k, w * k, h * k, c);
	// cabelo: brilho
	u(-6, -32, 5, 1, lerpC(P.hair, '#ffffff', .25));
	// olhos
	const ey = -24;
	if (P.eyes === 'open' && !blink) { u(-5, ey, 3, 4, WHT); u(2, ey, 3, 4, WHT); u(-4, ey + 1, 2, 3, INK); u(3, ey + 1, 2, 3, INK); u(-4, ey + 1, 1, 1, WHT); u(3, ey + 1, 1, 1, WHT); }
	else if (P.eyes === 'wide' && !blink) { u(-6, ey - 1, 4, 5, WHT); u(2, ey - 1, 4, 5, WHT); u(-5, ey + 1, 2, 2, INK); u(3, ey + 1, 2, 2, INK); }
	else if (P.eyes === 'half') { u(-5, ey + 1, 3, 2, WHT); u(2, ey + 1, 3, 2, WHT); u(-4, ey + 2, 2, 1, INK); u(3, ey + 2, 2, 1, INK); u(-5, ey, 3, 1, P.skin); u(2, ey, 3, 1, P.skin); u(-5, ey + 1, 3, 1, INK); u(2, ey + 1, 3, 1, INK); }
	else if (P.eyes === 'happy') { u(-5, ey + 2, 1, 1, INK); u(-4, ey + 1, 2, 1, INK); u(-2, ey + 2, 1, 1, INK); u(1, ey + 2, 1, 1, INK); u(2, ey + 1, 2, 1, INK); u(4, ey + 2, 1, 1, INK); }
	else { u(-5, ey + 2, 3, 1, INK); u(2, ey + 2, 3, 1, INK); }                                           // fechados
	if (P.brows === 'worry') { u(-5, ey - 2, 2, 1, INK); u(-3, ey - 3, 2, 1, INK); u(1, ey - 3, 2, 1, INK); u(3, ey - 2, 2, 1, INK); }
	u(-7, -20, 2, 1, '#ef7d57'); u(5, -20, 2, 1, '#ef7d57');                                                // bochechas
	let m = P.mouth; if (m === 'talk') m = Math.floor(T * 9 + P.ph) % 2 ? 'o' : 'smile';
	if (m === 'smile') { u(-2, -18, 4, 1, INK); u(-3, -19, 1, 1, INK); u(2, -19, 1, 1, INK); }
	else if (m === 'big') { u(-3, -19, 6, 3, INK); u(-2, -18, 4, 1, WINE); }
	else if (m === 'o') { u(-1, -19, 3, 3, INK); u(0, -18, 1, 1, WINE); }
	else if (m === 'worry') { u(-3, -17, 1, 1, INK); u(-2, -18, 2, 1, INK); u(0, -18, 2, 1, INK); u(2, -17, 1, 1, INK); }
	else u(-2, -18, 4, 1, INK);
	// mãos / objetos
	if (P.arm === 'down' || P.arm === 'wave') u(-8, -10, 2, 2, P.skin);
	if (P.pad) { if (P.arm === 'up') { u(5, -29, 2, 2, P.skin); pad(cx + 3 * k, fy + (-37 + b) * k, k); } else { u(-7, -12, 2, 2, P.skin); u(5, -12, 2, 2, P.skin); pad(cx - 4 * k, fy + (-13 + b) * k, k); } }
	else if (P.notebook) { u(-5, -14, 8, 7, INK); u(-4, -13, 6, 5, WHT); for (let i = 0; i < 3; i++) u(-3, -12 + i * 2, 4, 1, SIL); u(-7, -12, 2, 2, P.skin); u(3, -12, 2, 2, P.skin); const wr = Math.sin(T * 8) > 0 ? 0 : 1; u(3, -16 + wr, 1, 4, ORG); }
	else if (P.arm === 'up') u(6, -29, 2, 2, P.skin);
	else if (P.arm === 'wave') u(6, -28, 2, 2, P.skin);
	if (P.arm === 'down' && !P.pad && !P.notebook) u(6, -10, 2, 2, P.skin);
}
function chair(cx, fy, k, col, dark, front) {
	if (!front) { R(cx - 15 * k, fy - 47 * k, 30 * k, 42 * k, INK); R(cx - 14 * k, fy - 46 * k, 28 * k, 40 * k, col); R(cx - 12 * k, fy - 44 * k, 24 * k, 10 * k, dark); return; }
	R(cx - 17 * k, fy - 24 * k, 6 * k, 20 * k, INK); R(cx + 11 * k, fy - 24 * k, 6 * k, 20 * k, INK);
	R(cx - 16 * k, fy - 23 * k, 4 * k, 18 * k, col); R(cx + 12 * k, fy - 23 * k, 4 * k, 18 * k, col);
	R(cx - 15 * k, fy - 11 * k, 30 * k, 10 * k, INK); R(cx - 14 * k, fy - 10 * k, 28 * k, 8 * k, dark); R(cx - 14 * k, fy - 10 * k, 28 * k, 2 * k, col);
	R(cx - 13 * k, fy - 1 * k, 3 * k, 3 * k, INK); R(cx + 10 * k, fy - 1 * k, 3 * k, 3 * k, INK);
}
const SHADOW = (cx, fy, w) => { g.globalAlpha = .3; ell(cx, fy + 1, w, 3, '#000'); g.globalAlpha = 1; };
const LOOK = {
	pat: (o) => ({ skin: '#f4b48a', hair: '#8a4a2a', shirt: BLUE, pants: '#29366f', pad: true, ph: 0, ...o }),
	ter: (o) => ({ skin: '#e0956a', hair: '#b0b0c8', skin: '#e0a070', shirt: TEAL, pants: DRK, glasses: true, ph: 1.3, ...o }),
};

// ───── cenários ─────
function clinic(cam, morning) {
	GRAD(0, 206, morning ? ['#ffe0a8', '#f2c99b'] : ['#f2c99b', '#e0b080']);
	GRAD(206, H, ['#a8704a', '#7a4a2c']); FLUSH();
	for (let x = 4; x < W; x += 12) R(x + (cam >> 1) % 12, 0, 1, 206, 'rgba(255,255,255,.12)');
	for (let y = 214; y < H; y += 14) { R(0, y, W, 1, 'rgba(0,0,0,.18)'); for (let x = ((y / 14) % 2) * 20; x < W; x += 40) R(x, y, 1, 14, 'rgba(0,0,0,.14)'); }
	R(0, 200, W, 8, '#5d3a1a'); R(0, 200, W, 2, '#8a5a30');
	const wx = 20 + (cam >> 1), wy = 66;                                                                       // janela
	R(wx - 3, wy - 3, 62, 66, '#5d3a1a'); GRAD2(wx, wy, 56, 60, morning ? [CYAN, '#d6fbff', '#fff3b0'] : ['#41a6f6', '#73eff7', '#ffd27a']);
	if (morning) { halo(wx + 40, wy + 14, 5, 34, '#fff3a0', .8); disc(wx + 40, wy + 14, 8, '#fffbd0'); }
	const cl = ((T * 3) % 90) - 20; R(wx + cl % 60 - 10 < wx ? wx : wx + cl % 60, wy + 30, 14, 4, WHT); R(wx + 2 + (cl % 60), wy + 33, 18, 3, WHT);
	R(wx + 27, wy, 2, 60, '#5d3a1a'); R(wx, wy + 29, 56, 2, '#5d3a1a');
	R(wx - 6, wy - 6, 8, 70, WINE); R(wx + 54, wy - 6, 8, 70, WINE); R(wx - 6, wy - 6, 68, 4, '#8a2a3e');
	R(wx - 3, wy + 62, 62, 3, '#8a5a30');
	const fx = 150 + (cam >> 1), fy = 72;                                                                      // quadro
	R(fx - 2, fy - 2, 46, 36, INK); R(fx, fy, 42, 32, '#f4e8c8'); GRAD2(fx + 3, fy + 3, 36, 18, ['#41a6f6', '#73eff7']); R(fx + 3, fy + 21, 36, 8, GRN); disc(fx + 28, fy + 11, 3, YEL); R(fx + 6, fy + 14, 12, 8, '#3b8a55');
	// planta
	const px = 12 + (cam >> 1); R(px - 6, 186, 14, 16, INK); R(px - 5, 187, 12, 14, ORG); R(px - 5, 187, 12, 3, '#ffb080');
	for (let i = 0; i < 5; i++) { const a = -1.2 + i * .6, sw = Math.sin(T * 1.2 + i) * 1.5; line(px + 1, 186, px + 1 + Math.cos(a) * 16 + sw, 186 + Math.sin(a) * 18 - 8, GRN, 3); }
	// tapete
	ell(108, 246, 92, 16, INK); ell(108, 245, 90, 14, BLUE); ell(108, 245, 78, 11, '#4a74e0'); ell(108, 245, 60, 7, BLUE);
	for (const d of DUST) { const y = (d.y + T * d.v) % 300, x = d.x + Math.sin(T * .6 + d.ph) * 6; if ((x | 0) % 3 === 0) PX(x, y, 'rgba(255,255,255,.55)'); }
}
function GRAD2(x, y, w, h, cols) { const P = cols.map(hx); for (let j = 0; j < h; j++) { const f = j / (h - 1) * (P.length - 1), i = Math.min(Math.floor(f), P.length - 2), fr = f - i; for (let i2 = 0; i2 < w; i2++) { const c = fr > BY[((y + j) & 3) * 4 + ((x + i2) & 3)] ? P[i + 1] : P[i]; R(x + i2, y + j, 1, 1, `rgb(${c})`); } } }
function stars(maxY, tw = 1) { for (const s of STARS) { if (s.y > maxY) continue; const on = Math.sin(T * 2.6 * tw + s.ph) > -.2; if (on) PX(s.x, s.y, '#9fb4ff'); if (s.big) { R(s.x - 1, s.y, 3, 1, '#6a7fcf'); R(s.x, s.y - 1, 1, 3, '#6a7fcf'); PX(s.x, s.y, WHT); } } }

// ───── cenas ─────
function sceneHook(lt) {
	GRAD(0, 262, ['#0b1236', '#29366f', '#5d275d']); GRAD(262, H, ['#1a1c2c', '#101226']); FLUSH();
	stars(250); for (let x = 0; x < W; x += 24) for (let y = 270; y < H; y += 16) R(x + ((y / 16) % 2) * 12, y, 12, 1, '#222642');
	halo(108, 262, 6, 90, '#5d275d', .5);
	// título
	const col = [YEL, ORG, PINK, CYAN], sh = Math.floor(T * 5), u = ease(seg(T, .1, .7));
	const L1 = 'A PRIMEIRA', L2 = 'SESSÃO', y0 = Math.round(52 - (1 - u) * 30);
	for (const [s, y] of [[L1, y0], [L2, y0 + 26]]) { const x0 = Math.round((W - ptw(s, 4)) / 2); for (let i = 0; i < s.length; i++) { const c = col[(i + sh) % 4], yy = y + Math.round(Math.sin(T * 3.4 + i * .7) * 1.5); ptext(s[i], x0 + i * 16, yy, 4, c, { shadow: INK }); } }
	ptext('UM RPG DA HIPNOSE', 108, 112, 2, WHT, { center: true, shadow: INK });
	if (T > 2.4 && Math.floor(T * 2.2) % 2 === 0) ptext('PRESS START', 108, 132, 2, YEL, { center: true, shadow: INK });
	// paciente preocupado
	const px = 108, fy = 276; SHADOW(px, fy, 22);
	person(px, fy, 3, LOOK.pat({ eyes: 'wide', mouth: 'worry', brows: 'worry', arm: 'down' }));
	const sw = Math.floor(T * 3) % 3; for (const [dx, dy] of [[-30, -78], [30, -80]]) { const y = (T * 14 + dx) % 18; ell(px + dx, fy + dy + y, 2, 3, CYAN); PX(px + dx - 1, fy + dy + y - 1, WHT); }
	// balão: "perder o controle"
	const bu = backOut(seg(T, wt(0, 4) - .1, wt(0, 4) + .25));
	if (bu > 0) { cloudBubble(158, 188, 38, 20, 124, 226, bu); const fl = Math.sin(T * 12) * 2, fx = 158 + Math.min(1, seg(T, wt(0, 6), wt(0, 6) + 1.4)) * 20, fyy = 188 - seg(T, wt(0, 6), wt(0, 6) + 1.4) * 14;
		for (const s of [-1, 1]) { for (let i = 0; i < 5; i++) R(fx + s * (7 + i * 2) - (s > 0 ? 0 : 1), fyy - 5 - i + (s * fl) * (i / 5), 2, 2, WHT); R(fx + s * 7 - (s > 0 ? 0 : 1), fyy - 3, 2, 2, SIL); }
		if (bu > .9) { pad(fx - 9, fyy - 3, 2); ptext('?', fx + 14, fyy - 18, 2, WINE); } }
	// alerta no HUD (shake)
	return { shake: seg(T, wt(0, 4), wt(0, 6) + 1) * (1 - seg(T, wt(0, 6) + 1, wt(0, 6) + 1.5)) };
}
function sceneClinic(lt, phase) {
	const morning = phase === 6, cam = Math.round(Math.sin(T * .5) * 3);
	clinic(cam, morning);
	const tx = 58 + cam, ptx = 158 + cam, fy = 238;
	chair(tx, fy, 2, '#d9784a', '#b4552e'); chair(ptx, fy, 2, WINE, '#8a2a3e');
	SHADOW(tx, fy, 24); SHADOW(ptx, fy, 24);
	const pp = LOOK.pat({}), tp = LOOK.ter({ notebook: true });
	if (phase === 1) {
		const a3 = wt(3, 0), a4 = wt(3, 2), a5 = wt(3, 5), a6 = wt(3, 7), s4 = SA(4);
		const patTalk = T > a3 && T < a4 + .1, terTalk = T > a4 + .8 && T < a5 + .4 && false;
		person(tx, fy, 2, { ...tp, mouth: (T > a5 && T < SE(3) + .1) ? 'talk' : 'smile', eyes: 'open' });
		person(ptx, fy, 2, { ...pp, mouth: patTalk ? 'talk' : (T > SA(4) ? 'smile' : 'smile'), eyes: 'open' });
		chair(tx, fy, 2, '#d9784a', '#b4552e', true); chair(ptx, fy, 2, WINE, '#8a2a3e', true);
		// balões
		const b1 = backOut(seg(T, a3 - .05, a3 + .25)) * (1 - seg(T, a4 + .05, a4 + .2));
		if (b1 > 0) { bubble(ptx + 2, 150, 44, 24, 'l', b1); if (b1 > .9) for (let i = 0; i < 3; i++) disc(ptx - 10 + i * 12, 150 + Math.round(Math.sin(T * 8 + i) * 2), 2, (Math.floor(T * 6) % 3) === i ? INK : SIL); }
		const b2 = backOut(seg(T, a4 - .05, a4 + .25)) * (1 - seg(T, a6 - .05, a6 + .1));
		if (b2 > 0) { bubble(tx, 152, 36, 32, 'r', b2); if (b2 > .9) { ear(tx - 2, 152, 1); for (let i = 0; i < 2; i++) ring(tx + 12 + i * 3, 152, 4 + i * 3 + ((T * 6) % 3), SIL); } }
		const b3 = backOut(seg(T, a6 - .05, a6 + .3)) * (1 - seg(T, s4 + .1, s4 + .3));
		if (b3 > 0) { const cx = 108, cy = 120; R(cx - 18, cy - 24, 36, 48, INK); R(cx - 17, cy - 23, 34, 46, '#8a5a30'); R(cx - 14, cy - 18, 28, 38, WHT); R(cx - 7, cy - 26, 14, 6, SLT);
			for (let i = 0; i < 3; i++) { R(cx - 5, cy - 11 + i * 12, 14, 2, SIL); if (T > a6 + .2 + i * .22) { R(cx - 12, cy - 12 + i * 12, 2, 2, GRN); R(cx - 11, cy - 11 + i * 12, 2, 2, GRN); R(cx - 10, cy - 12 + i * 12, 3, 2, GRN); } } }
		// EXPECTATIVA
		const fillv = T < SA(4) ? 0.45 * seg(T, SA(3), SE(3)) : lerp(.45, 1, ease(seg(T, wt(4, 2), wt(4, 5) + .2)));
		if (T > SA(3) - .2) { const u = ease(seg(T, SA(3) - .2, SA(3) + .2)); ptext('EXPECTATIVA', 108, 56 - (1 - u) * 20, 2, WHT, { center: true, shadow: INK }); R(34, 70 - (1 - u) * 20, 148, 10, INK); R(36, 72 - (1 - u) * 20, 144, 6, DRK);
			const fw = Math.round(144 * fillv); R(36, 72 - (1 - u) * 20, fw, 6, ORG); R(36, 72 - (1 - u) * 20, fw, 2, YEL); for (let x = 36; x < 36 + fw; x += 6) R(x, 72 - (1 - u) * 20, 1, 6, 'rgba(0,0,0,.25)'); }
		const fl = seg(T, wt(4, 5), wt(4, 5) + .35); if (fl > 0 && fl < 1) { g.globalAlpha = (1 - fl) * .7; R(0, 0, W, H, WHT); g.globalAlpha = 1; }
		if (T > wt(4, 5) - .05) { const u = backOut(seg(T, wt(4, 5), wt(4, 5) + .3)); spark(108, 96, YEL, Math.round(5 * u)); ptext('HIPNOSE', 108, 104, 2, YEL, { center: true, shadow: INK }); }
		if (T > wt(4, 6)) { const bb = Math.round(Math.abs(Math.sin(T * 7)) * 4); ptext('AQUI', 108, 134 - bb, 2, WHT, { center: true, shadow: INK }); const ax = 108; R(ax - 2, 148 - bb, 5, 6, YEL); R(ax - 5, 154 - bb, 11, 2, YEL); R(ax - 3, 156 - bb, 7, 2, YEL); R(ax - 1, 158 - bb, 3, 2, YEL); }
	} else {                                                                                                  // fase 6 — a volta
		const open = T > wt(15, 1) + .1, up = T > wt(15, 4);
		const tpose = { ...tp, mouth: 'smile', eyes: 'happy' };
		person(tx, fy, 2, tpose);
		person(ptx, fy, 2, { ...pp, eyes: open ? 'open' : 'closed', mouth: open ? 'big' : 'smile', arm: up ? 'up' : 'down' });
		chair(tx, fy, 2, '#d9784a', '#b4552e', true); chair(ptx, fy, 2, WINE, '#8a2a3e', true);
		// interruptor "OLHOS"
		const u = ease(seg(T, SA(15) - .25, SA(15) + .15)), on = T > wt(15, 1) + .05, kx = lerp(0, 22, ease(seg(T, wt(15, 1), wt(15, 1) + .2)));
		if (u > 0) { const y = 56 - (1 - u) * 18; g.globalAlpha = .75; R(48, y - 5, 108, 26, INK); g.globalAlpha = 1; ptext('OLHOS', 54, y + 3, 2, WHT, { shadow: INK }); R(96, y - 1, 56, 18, INK); R(98, y + 1, 52, 14, on ? GRN : SLT); R(100 + kx * 1.4, y + 3, 16, 10, WHT); R(100 + kx * 1.4, y + 3, 16, 2, SIL);
			ptext(on ? 'ON' : 'OFF', on ? 106 : 128, y + 5, 1, INK); }
		if (open) for (let i = 0; i < 5; i++) { const a = T * 2 + i * 1.26, r = 10 + 4 * Math.sin(T * 4 + i); spark(ptx + Math.cos(a) * 36, 150 + Math.sin(a) * 18, YEL, 1 + (i % 2)); }
		if (up) for (let i = 0; i < 3; i++) heart(ptx - 32 + i * 28 + Math.sin(T * 3 + i) * 3, 150 - ((T * 18 + i * 20) % 60) + 40 - 40, 1, i % 2 ? PINK : WINE);
	}
	return {};
}
function sceneLemon(lt) {
	FILL(0, 0, W, H, (x, y) => { const s = Math.floor((x + y * .7 + T * 14) / 14) & 1, th = BY[(y & 3) * 4 + (x & 3)]; return hx(s ? (th > .5 ? '#2fae60' : '#38b764') : (th > .5 ? '#38b764' : '#2fae60')); }); FLUSH();
	R(0, 236, W, 148, '#2f7a4a'); for (let x = 0; x < W; x += 7) R(x + (T * 8 | 0) % 7, 236 + ((x / 7) % 3) * 3, 4, 1, '#43a05f'); R(0, 236, W, 2, '#a7f070');
	ell(70, 270, 44, 9, '#1f5a34');
	const px = 70, fy = 268; SHADOW(px, fy, 22);
	const eatU = seg(T, wt(6, 3) + .15, wt(6, 3) + .5), sal = T > wt(7, 2);
	person(px, fy, 3, LOOK.pat({ eyes: 'open', mouth: sal ? 'o' : (T > SA(6) ? 'smile' : 'smile'), arm: 'down', pad: true }));
	// balão com limão
	const bu = backOut(seg(T, SA(6) - .05, SA(6) + .3)) * (1 - seg(T, wt(7, 4) + .3, wt(7, 4) + .5));
	if (bu > 0) { cloudBubble(112, 112, 40, 28, 78, 168, bu);
		if (bu > .85) { const cut = seg(T, wt(6, 3) - .05, wt(6, 3) + .1), sp = ease(seg(T, wt(6, 3) + .1, wt(6, 3) + .7));
			if (cut < .5 || T < wt(6, 3) + .05) { lemon(112, 112 + Math.round(Math.sin(T * 3) * 2), 2); } else { lemonHalf(112 - sp * 14, 112 + Math.round(sp * 3), 2, 0); lemonHalf(112 + sp * 14, 112 - Math.round(sp * 2), 2, 1); }
			if (T > wt(6, 3) - .12 && T < wt(6, 3) + .18) { const kk = seg(T, wt(6, 3) - .12, wt(6, 3) + .18); line(112 - 24 + kk * 48, 112 - 20 + kk * 36, 112 - 24 + kk * 48 + 6, 112 - 20 + kk * 36 + 6, WHT, 3); spark(112, 112, WHT, 7); }
			if (T > wt(6, 3) + .1) for (let i = 0; i < 6; i++) { const ph = ((T - wt(6, 3) - .1) * 1.3 + i / 6) % 1; PX(112 + (i - 2.5) * 8, 124 + ph * 22, CYAN); PX(112 + (i - 2.5) * 8, 125 + ph * 22, WHT); } } }
	// saliva
	if (sal) { const t0 = wt(7, 2); for (let i = 0; i < 3; i++) { const ph = ((T - t0) * 1.3 + i / 3) % 1, y = fy - 3 * 17 + ph * 38, x = px + 5 + i * 3 - 3; const sz = ph < .3 ? 1 : 2; ell(x, y, 1, sz + 1, CYAN); PX(x - 1, y - 1, WHT); if (ph > .85) { R(x - 3, fy - 3, 7, 1, CYAN); } }
		for (let i = 0; i < 3; i++) R(px - 18 - i * 3, fy - 62 + i * 4 - (Math.sin(T * 8) > 0 ? 1 : 0), 3, 1, WHT); for (let i = 0; i < 3; i++) R(px + 16 + i * 3, fy - 62 + i * 4, 3, 1, WHT); }
	// cérebro responde
	const bru = backOut(seg(T, wt(7, 7) - .1, wt(7, 7) + .3)), vu = backOut(seg(T, wt(7, 4), wt(7, 4) + .35));
	if (vu > 0) { ptext('VIU?', 164, 90 - (1 - vu) * 10, 3, YEL, { out: INK, center: true }); if (vu > .9) spark(150, 84, WHT, 2); }
	if (T > wt(7, 5) - .05) { const cx = 164, cy = 160; const pulse = (Math.sin(T * 9) + 1) / 2; halo(cx, cy, 6, 30, '#ffe0ee', .5 * bru * pulse); g.save(); brain(cx, cy, pulse * bru, Math.max(1, Math.round(bru * 1))); g.restore();
		const pts = [[cx - 8, cy + 14], [cx - 30, cy + 22], [cx - 50, cy + 34], [px + 8, fy - 52]]; for (let i = 0; i < pts.length - 1; i++) line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], '#ffe0ee', 1);
		for (let i = 0; i < 3; i++) { const ph = ((T * .9 + i / 3) % 1) * (pts.length - 1), s = Math.min(pts.length - 2, Math.floor(ph)), f = ph - s; spark(lerp(pts[s][0], pts[s + 1][0], f), lerp(pts[s][1], pts[s + 1][1], f), YEL, 1); }
		ptext('MENTE', cx, cy - 26, 2, WHT, { center: true, shadow: INK }); }
	return {};
}
function sceneInduction(lt) {
	FILL(0, 0, W, H, (x, y) => { const d = Math.hypot(x - 108, (y - 170) * 1.1); const s = Math.floor((d - T * 12) / 11) & 1, th = BY[(y & 3) * 4 + (x & 3)], v = clamp(d / 220); const A = hx(v > th ? '#3a1d58' : '#5d275d'), B = hx(v > th ? '#26164a' : '#41245a'); return s ? A : B; }); FLUSH();
	stars(300, .7); R(0, 292, W, 92, '#1a1c2c'); R(0, 292, W, 2, PLUM);
	const px = 132, fy = 270, tx = 40; SHADOW(px, fy, 22); SHADOW(tx, fy, 14);
	const ding1 = wt(9, 3), ding2 = wt(9, 6), eh = T > ding1 + .2;
	person(px, fy, 3, LOOK.pat({ eyes: T > ding2 + .1 ? 'half' : 'open', mouth: 'smile' }));
	person(tx, fy, 2, LOOK.ter({ mouth: (T > SA(9) && T < SE(9)) ? 'talk' : 'smile', notebook: false, arm: 'down' }));
	// sino
	const dec = (t0) => Math.exp(-(T - t0) * 3.2) * (T > t0 ? 1 : 0), sw = Math.sin((T - ding1) * 22) * dec(ding1) + Math.sin((T - ding2) * 22) * dec(ding2) * 1.3;
	const bu = ease(seg(T, SA(9) - .1, SA(9) + .2)); if (bu > 0) { R(108, 54, 1, 24, SLT); bell(108, 78 + Math.round((1 - bu) * -30), sw * (T > ding1 ? 1 : 0), 2); }
	for (const t0 of [ding1, ding2]) { const u = seg(T, t0, t0 + .8); if (u > 0 && u < 1) for (let i = 0; i < 3; i++) { const r = 14 + u * 40 + i * 9; for (const s of [-1, 1]) for (let a = -.7; a <= .7; a += .08) PX(108 + s * (Math.cos(a) * r), 100 + Math.sin(a) * r * .9, i === 0 ? YEL : '#fff3a0'); } }
	const dg = backOut(seg(T, ding2, ding2 + .2)) * (1 - seg(T, ding2 + .8, ding2 + 1)); if (dg > 0) ptext('DING!', 108, 58, 4, YEL, { out: INK, center: true });
	// o terapeuta fala: ondas
	if (T > SA(9) - .2) for (let i = 0; i < 4; i++) { const ph = ((T * 1.4 + i / 4) % 1), x = 56 + ph * 56; if (T < SE(9) + .2) for (let a = -.9; a <= .9; a += .15) PX(x + Math.cos(a) * 3, 232 + Math.sin(a) * (4 + ph * 8), lerpC(WHT, PLUM, ph)); }
	// você ouve tudo
	const eu = backOut(seg(T, wt(9, 9) - .1, wt(9, 9) + .3)); if (eu > 0) { halo(160, 134, 4, 32, '#ffffff', .35 * eu); ear(Math.round(160), 134, Math.max(1, Math.round(eu * 2))); for (let i = 0; i < 3; i++) { const ph = ((T * 1.3 + i / 3) % 1); for (let a = 2.4; a <= 3.9; a += .12) PX(160 - 14 + Math.cos(a) * (6 + ph * 26), 134 + Math.sin(a) * (6 + ph * 26), lerpC(WHT, PLUM, ph)); } }
	return {};
}
function sceneBeach(lt) {
	GRAD(0, 150, ['#2b1b4a', '#5b2a7a', '#a23e8c', '#e0556a', '#ff8a4c', '#ffd27a']); GRAD(150, 232, ['#ffb35c', '#e0556a', '#a23e8c', '#5b2a7a']); GRAD(232, H, ['#f2d09a', '#d9a877', '#c08a5a']); FLUSH();
	stars(60, 1); halo(148, 148, 14, 60, '#ffb35c', .7); disc(148, 148, 14, '#ffcd75'); disc(148, 148, 10, '#fff1c0'); R(0, 150, W, 1, '#ffd27a');
	for (let yy = 154; yy < 228; yy += 3) { const w = Math.round((14 + (yy - 150) * .35) * (.5 + .5 * Math.sin(T * 2.1 + yy * .9))); R(148 + Math.round(Math.sin(T * 1.4 + yy * .5) * 3) - w / 2, yy, w, 1, '#ffcd75'); }
	for (let i = 0; i < 40; i++) { const y = 160 + (i * 29) % 70, x = (i * 53 + Math.sin(T * .8 + i) * 4) % W; if (Math.sin(T * 1.7 + i * 2) > .4) R(x, y, 3 + (y - 160) / 12, 1, 'rgba(255,255,255,.35)'); }
	// ondas na areia
	const wv = Math.round(Math.sin(T * 1.1) * 3); R(0, 226 + wv, W, 4, '#fff0d0'); R(0, 230 + wv, W, 2, '#ffd0a0'); for (let x = 0; x < W; x += 9) PX(x + (T * 4 | 0) % 9, 224 + wv, WHT);
	// palmeira
	const sw = Math.sin(T * .9) * 2; for (let i = 0; i < 18; i++) { const x = 28 + i * .6 + Math.sin(i * .2) * 3 + sw * (i / 18), y = 250 - i * 8; R(x - 3, y, 7, 9, INK); R(x - 2, y, 5, 9, i % 2 ? '#8a5a30' : '#a8703c'); }
	const tx = 38 + sw, ty = 108; for (let i = 0; i < 7; i++) { const a = -Math.PI + i * (Math.PI / 6) - .1, L = 34 + (i % 2) * 6; for (let j = 0; j < L; j += 2) { const dx = Math.cos(a) * j, dy = Math.sin(a) * j * .5 + (j * j) / 70; R(tx + dx - 1, ty + dy - 1, 4, 4, INK); } for (let j = 0; j < L; j += 2) { const dx = Math.cos(a) * j, dy = Math.sin(a) * j * .5 + (j * j) / 70; R(tx + dx, ty + dy, 3, 3, j % 4 ? GRN : '#2f9d58'); } }
	disc(tx, ty + 4, 4, '#8a5a30'); disc(tx + 6, ty + 6, 3, '#8a5a30');
	// toalha + paciente
	const px = 112, fy = 276; R(px - 46, fy - 6, 92, 22, INK); for (let i = 0; i < 8; i++) R(px - 44 + i * 11, fy - 5, 11, 20, i % 2 ? WHT : WINE); R(px - 44, fy - 5, 88, 2, 'rgba(0,0,0,.15)');
	SHADOW(px, fy, 20);
	person(px, fy - 8, 3, LOOK.pat({ eyes: 'closed', mouth: 'smile', arm: 'down' }));
	// corações flutuando
	for (let i = 0; i < 5; i++) { const ph = ((T * .35 + i / 5) % 1), x = px - 36 + i * 18 + Math.sin(T * 1.5 + i) * 5, y = 190 - ph * 70; if (ph < .9) heart(x, y, 1, i % 2 ? PINK : WINE); }
	// placa SÓ SEU
	const su = backOut(seg(T, wt(11, 4) - .15, wt(11, 4) + .3)); if (su > 0) { const sx = 176, sy = 190; R(sx - 1, sy + 14, 4, 40, INK); R(sx, sy + 14, 2, 40, '#8a5a30'); const w = Math.round(46 * su); R(sx + 1 - w / 2, sy - 2, w, 18, INK); R(sx + 2 - w / 2, sy - 1, w - 2, 16, '#c08a5a'); if (su > .9) { ptext('SÓ SEU', sx + 1, sy + 3, 2, '#3a1d58', { center: true }); } }
	// caranguejo
	const cx = ((T * 6) % 260) - 20, cy = 330; R(cx - 3, cy, 7, 4, INK); R(cx - 2, cy + 1, 5, 2, ORG); R(cx - 5, cy - 2 + (Math.floor(T * 5) % 2), 2, 2, ORG); R(cx + 4, cy - 2 + (Math.floor(T * 5 + 1) % 2), 2, 2, ORG); PX(cx - 1, cy - 1, INK); PX(cx + 2, cy - 1, INK);
	// gaivotas
	for (let k = 0; k < 3; k++) { const x = ((T * 14 + k * 80) % (W + 40)) - 20, y = 40 + k * 14 + Math.sin(T * 2 + k) * 3; if (Math.floor(T * 5 + k) % 2) { PX(x - 2, y - 1, INK); PX(x - 1, y, INK); PX(x, y + 1, INK); PX(x + 1, y, INK); PX(x + 2, y - 1, INK); } else { PX(x - 2, y + 1, INK); PX(x - 1, y, INK); PX(x, y, INK); PX(x + 1, y, INK); PX(x + 2, y + 1, INK); } }
	return {};
}
function sceneWork(lt) {
	GRAD(0, 210, ['#257179', '#1f5f66']); GRAD(210, H, ['#7a4a2c', '#5d3a1a']); FLUSH();
	for (let x = 0; x < W; x += 18) R(x + 2, 0, 1, 210, 'rgba(255,255,255,.08)'); for (let y = 224; y < H; y += 14) R(0, y, W, 1, 'rgba(0,0,0,.2)');
	// prateleira + livros
	R(10, 100, 70, 4, '#8a5a30'); for (let i = 0; i < 7; i++) { const h = 14 + (i * 5) % 8; R(12 + i * 9, 100 - h, 8, h, INK); R(13 + i * 9, 100 - h + 1, 6, h - 1, [WINE, YEL, BLUE, GRN, ORG, PLUM, SKY][i]); }
	R(160, 70, 44, 34, INK); R(162, 72, 40, 30, '#f4e8c8'); ptext('SEU', 182, 78, 2, '#5d3a1a', { center: true }); ptext('RITMO', 182, 90, 1, '#5d3a1a', { center: true });
	const cam = Math.round(Math.sin(T * .5) * 2), tx = 50 + cam, ptx = 166 + cam, fy = 208;
	person(tx, fy, 2, LOOK.ter({ notebook: false, mouth: 'smile', arm: 'down', eyes: 'open' })); person(ptx, fy, 2, LOOK.pat({ mouth: T > wt(13, 8) ? 'big' : 'smile', eyes: 'open' }));
	// mesa
	R(0, 192, W, 12, INK); R(0, 194, W, 8, '#c08a5a'); R(0, 194, W, 2, '#e0a870'); R(0, 204, W, 26, INK); R(0, 206, W, 22, '#8a5a30'); R(20, 230, 10, 40, INK); R(180, 230, 10, 40, INK);
	// slider "SEU RITMO"
	const su = ease(seg(T, wt(13, 8) - .3, wt(13, 8) + .1)), L = clamp(.08 + .78 * ease(seg(T, wt(13, 5), wt(13, 10) + .9)));
	if (su > 0) { const y = 58 - (1 - su) * 20; ptext('SEU RITMO', 108, y - 12, 2, WHT, { center: true, shadow: INK }); R(36, y, 144, 10, INK); R(38, y + 2, 140, 6, DRK); R(38, y + 2, Math.round(140 * L), 6, CYAN); R(38, y + 2, Math.round(140 * L), 2, '#d6fbff'); const kx = 38 + 140 * L; R(kx - 5, y - 4, 10, 18, INK); R(kx - 4, y - 3, 8, 16, WHT); R(kx - 4, y - 3, 8, 3, SIL); }
	// nó de linha
	const kL = T < wt(13, 2) ? 0 : (T > wt(13, 5) ? L : 0), cx = 108, cy = 168, rot = T * .35; const col = [ORG, YEL, WINE];
	for (let pass = 0; pass < 2; pass++) for (let i = 0; i <= 150; i++) { const u = i / 150 * Math.PI * 2;
		const tx1 = Math.sin(3 * u + rot) * 24 + Math.sin(5 * u) * 8, ty1 = Math.sin(4 * u) * 15 + Math.cos(2 * u + rot) * 8, lx = Math.cos(u + rot * .5) * 32, ly = Math.sin(u + rot * .5) * 14;
		const x = cx + lerp(tx1, lx, kL), y = cy + lerp(ty1, ly, kL); const c = col[(i >> 4) % 3]; if (pass === 0) R(x - 1, y - 1, 4, 4, INK); else R(x, y, 2, 2, c); }
	if (kL > .35) for (let i = 0; i < 4; i++) spark(cx + Math.cos(T * 2 + i * 1.6) * 40, cy + Math.sin(T * 2 + i * 1.6) * 20, YEL, 1);
	if (T > wt(13, 6) - .1 && T < wt(13, 8)) { const q = backOut(seg(T, wt(13, 6) - .1, wt(13, 6) + .2)); ptext('?', 108, 120 - (1 - q) * 6, 3, YEL, { out: INK, center: true }); }
	return {};
}
function sceneFinal(lt) {
	GRAD(0, 262, ['#1a1c2c', '#29366f', '#5d275d']); GRAD(262, H, ['#333c57', '#1a1c2c']); FLUSH();
	stars(250, 1.3); for (let x = 0; x < W; x += 18) for (let y = 266; y < H; y += 18) if (((x + y) / 18) % 2 === 0) R(x, y, 18, 18, 'rgba(255,255,255,.05)');
	halo(108, 230, 4, 100, '#ff77a8', .35);
	// barra CONTROLE gigante
	const pulse = Math.max(0, 1 - Math.abs(T - wt(16, 6)) * 2.2), bu = ease(seg(T, SA(16) - .1, SA(16) + .3));
	if (bu > 0) { const y = 72 - (1 - bu) * 20; ptext('CONTROLE', 108, y - 10, 3, WHT, { center: true, out: INK }); R(22, y + 6, 172, 18, INK); R(24, y + 8, 168, 14, DRK); const fw = 168; R(24, y + 8, fw, 14, GRN); R(24, y + 8, fw, 4, LIME); for (let x = 24; x < 24 + fw; x += 8) R(x, y + 8, 1, 14, 'rgba(0,0,0,.25)');
		if (pulse > 0) { g.globalAlpha = pulse * .8; R(24, y + 8, fw, 14, WHT); g.globalAlpha = 1; }
		if (Math.floor(T * 3) % 2 === 0 || pulse > 0) ptext('100%', 108, y + 28, 3, YEL, { center: true, out: INK }); }
	const tx = 62, px = 156, fy = 258; SHADOW(tx, fy, 18); SHADOW(px, fy, 18);
	const finale = T > SA(18); if (T > wt(16, 3)) halo(px + 24, fy - 106, 3, 28, YEL, .5 + .2 * Math.sin(T * 9));
	person(tx, fy, 3, LOOK.ter({ arm: 'wave', mouth: 'big', eyes: finale ? 'happy' : 'open' }));
	person(px, fy, 3, LOOK.pat({ arm: 'up', eyes: 'open', mouth: 'big' }));
	for (const c of CONF) { const y = ((c.y0 + T * c.v) % 420) - 20, x = c.x + Math.sin(T * 1.5 + c.ph) * 6; if (T > .0) R(x, y, c.s, c.s + 1, c.c); }
	if (T > wt(17, 3)) for (let i = 0; i < 6; i++) spark(30 + i * 30 + Math.sin(T * 4 + i) * 4, 150 + Math.sin(T * 3 + i * 2) * 20, i % 2 ? YEL : CYAN, 2);
	return {};
}

// ───── HUD (RPG) ─────
function hud(sc, shake) {
	const k = Math.floor(sc); const sx = shake > .01 ? Math.round(Math.sin(T * 70) * 2 * shake) : 0;
	g.globalAlpha = .88; R(0, 14, W, 32, INK); g.globalAlpha = 1; R(0, 46, W, 1, SLT);
	const label = sc === 0 ? 'NOVO JOGO' : sc === 7 ? 'FASE 6/6' : `FASE ${sc}/6`;
	ptext(label, 6, 18, 1, YEL); if (sc > 0) ptext(PNAME[sc], 66, 18, 1, WHT);
	ptext('CONTROLE', 6 + sx, 31, 1, WHT); R(40 + sx, 30, 142, 9, INK); R(41 + sx, 31, 140, 7, DRK); R(41 + sx, 31, 140, 7, GRN); R(41 + sx, 31, 140, 2, LIME); for (let x = 41; x < 181; x += 7) R(x + sx, 31, 1, 7, 'rgba(0,0,0,.28)');
	const sh = (Math.sin(T * 4) + 1) / 2; if (sh > .8) R(41 + sx + Math.round((T * 60) % 140), 31, 3, 7, 'rgba(255,255,255,.5)');
	heart(184 + sx, 30, 1, WINE); if (Math.floor(T * 2) % 2) heart(184 + sx, 30, 1, PINK);
}
function banner(i) {
	if (i < 1 || i > 6) return; const a = SA(i === 1 ? 2 : [0, 0, 5, 8, 10, 12, 14][i]) - .08, u = seg(T, a, a + .25) * (1 - seg(T, a + 1.35, a + 1.6));
	if (u <= 0) return; const o = ease(u), y = 100;
	g.globalAlpha = .9 * o; R(0, y - 4, W, 56, INK); g.globalAlpha = o; R(0, y - 4, W, 2, YEL); R(0, y + 50, W, 2, YEL);
	ptext(`FASE ${i}`, 108, y + 4, 6, YEL, { center: true, shadow: PLUM }); ptext(PNAME[i], 108, y + 40, 1, WHT, { center: true }); g.globalAlpha = 1;
}
function wipe(t) {
	let c = 0; for (let i = 1; i < SW.length; i++) { const a = SW[i]; c = Math.max(c, ease(seg(t, a - .3, a)) * (1 - ease(seg(t, a, a + .3)))); }
	if (c <= 0.001) return; g.fillStyle = INK;
	for (let cy = 0; cy < 32; cy++) for (let cx = 0; cx < 18; cx++) { const d = Math.hypot(cx - 8.5, cy - 15.5) / 18, o = d * .55 + WIPE[cy * 18 + cx] * .45; if (o < c * 1.001) g.fillRect(cx * 12, cy * 12, 12, 12); }
}

// ───── legendas (identidade): até 5 palavras, palavra-chave em destaque, entrada palavra a palavra ─────
const ui = document.getElementById('ui').getContext('2d');
const ACCENT = '#FFCD75', PLUMC = '#1A1C2C';
const KEY = { 0: 6, 1: 6, 2: 3, 3: 3, 4: 5, 5: 3, 6: 2, 7: 3, 8: 3, 9: 3, 10: 4, 11: 5, 12: 3, 13: 10, 14: 3, 15: 5, 16: 6, 17: 3 };
const SPLIT = { 0: [4, 5], 1: [4, 3], 3: [4, 5], 4: [2, 5], 7: [4, 5], 9: [4, 3, 4], 11: [4, 4], 13: [4, 4, 3], 15: [3, 3], 16: [3, 4] };
const GROUPS = [];
SS.forEach((s, si) => { if (si === 18) return; const n = s.ws.length, sizes = SPLIT[si] || [n]; let k = 0; sizes.forEach((z, gi) => { GROUPS.push({ s: si, ks: Array.from({ length: z }, (_, j) => k + j), key: KEY[si] }); k += z; }); });
GROUPS.forEach((gp) => { gp.a = WORDS[SS[gp.s].ws[gp.ks[0]]].a - .05; });
GROUPS.forEach((gp, i) => { const nx = GROUPS[i + 1]; gp.b = nx && nx.s === gp.s ? nx.a - .07 : Math.min(SE(gp.s) + .42, nx ? nx.a - .05 : 99); });
const wordTxt = (i) => WORDS[i].w.replace(/[".,:…!?]/g, '').toUpperCase();
function fitSize(txt, maxW, size, weight = 900) { let s = size; ui.font = `${weight} ${s}px Inter, "Arial Black", sans-serif`; while (ui.measureText(txt).width > maxW && s > 20) { s -= 2; ui.font = `${weight} ${s}px Inter, "Arial Black", sans-serif`; } return s; }
function drawUI(t) {
	ui.clearRect(0, 0, 1080, 1920);
	for (const gp of GROUPS) {
		if (t < gp.a || t > gp.b) continue; const out = expoIn(seg(t, gp.b - .15, gp.b)), line = gp.ks.map((k) => wordTxt(SS[gp.s].ws[k]));
		const s0 = fitSize(line.join(' '), 820, 100); ui.font = `900 ${s0}px Inter, "Arial Black", sans-serif`; const sp = ui.measureText(' ').width, wid = line.map((w) => ui.measureText(w).width), tot = wid.reduce((a, b) => a + b, 0) + sp * (line.length - 1);
		let x = 470 - tot / 2; const y = 1290;
		gp.ks.forEach((k, j) => { const wi = SS[gp.s].ws[k], u = seg(t, WORDS[wi].a - .04, WORDS[wi].a + .16);
			if (u > 0) { const sc = (.85 + .15 * backOut(u)) * (1 - .1 * out); ui.save(); ui.globalAlpha = clamp(u * 3) * (1 - out); ui.translate(x + wid[j] / 2, y); ui.scale(sc, sc); ui.font = `900 ${s0}px Inter, "Arial Black", sans-serif`; ui.textAlign = 'center'; ui.textBaseline = 'middle'; ui.lineJoin = 'round'; ui.lineWidth = s0 * .22; ui.strokeStyle = PLUMC; ui.strokeText(line[j], 0, 0); ui.fillStyle = k === gp.key ? ACCENT : '#FFFFFF'; ui.fillText(line[j], 0, 0); ui.restore(); }
			x += wid[j] + sp; });
	}
	const sa = SA(18) - .05; if (t >= sa) {                                                                      // carimbo final
		const u = seg(t, sa, sa + .2), s = lerp(1.4, 1, 1 - Math.pow(1 - u, 3)), L = ['É VOCÊ,', 'COM UM GUIA'];
		ui.save(); ui.translate(470, 1280); ui.rotate(-3 * Math.PI / 180); ui.scale(s, s); ui.globalAlpha = clamp(u * 4);
		const fs = Math.min(fitSize(L[0], 700, 150), fitSize(L[1], 700, 130), 124); ui.font = `900 ${fs}px Inter, "Arial Black", sans-serif`; const w1 = ui.measureText(L[1]).width, bw = Math.max(w1 + 110, 560), bh = fs * 2.5;
		ui.fillStyle = '#FFFFFF'; ui.beginPath(); ui.roundRect(-bw / 2 - 12, -bh / 2 - 12, bw + 24, bh + 24, 22); ui.fill(); ui.fillStyle = PLUMC; ui.beginPath(); ui.roundRect(-bw / 2, -bh / 2, bw, bh, 14); ui.fill();
		ui.textAlign = 'center'; ui.textBaseline = 'middle'; ui.font = `900 ${fs}px Inter, "Arial Black", sans-serif`; ui.fillStyle = ACCENT; ui.fillText(L[0], 0, -fs * .55); ui.fillStyle = '#FFFFFF'; ui.fillText(L[1], 0, fs * .6); ui.restore();
		const fl = 1 - seg(t, sa, sa + .3); if (fl > 0) { ui.fillStyle = `rgba(255,255,255,${.5 * fl})`; ui.fillRect(0, 0, 1080, 1920); }
	}
	if (t < .5) { ui.fillStyle = `rgba(0,0,0,${1 - t / .5})`; ui.fillRect(0, 0, 1080, 1920); }
	if (t > DUR - .5) { ui.fillStyle = `rgba(0,0,0,${(t - (DUR - .5)) / .5})`; ui.fillRect(0, 0, 1080, 1920); }
}

// ───── renderAt ─────
function sceneIndex(t) { let s = 0; for (let i = 1; i < SW.length; i++) if (t >= SW[i]) s = i; return s; }
function renderAt(t) {
	T = t; const sc = sceneIndex(t), lt = t - SW[sc]; let info = {};
	if (sc === 0) info = sceneHook(lt); else if (sc === 1 || sc === 6) info = sceneClinic(lt, sc); else if (sc === 2) info = sceneLemon(lt); else if (sc === 3) info = sceneInduction(lt); else if (sc === 4) info = sceneBeach(lt); else if (sc === 5) info = sceneWork(lt); else info = sceneFinal(lt);
	hud(sc, info.shake || 0); banner(sc); wipe(t); drawUI(t);
}
window.__mg = { duration: DUR, fps: FPS, width: 1080, height: 1920, renderAt, loaded: false };
const stage = document.getElementById('stage');
function fit() { const s = Math.min(innerWidth / 1080, innerHeight / 1920); stage.style.transform = `scale(${s}) translate(-50%,-50%)`; stage.style.transformOrigin = '0 0'; stage.style.left = '50%'; stage.style.top = '50%'; }
// (translate depois do scale: o deslocamento em % usa o tamanho do próprio elemento)
function fit2() { const s = Math.min(innerWidth / 1080, innerHeight / 1920); stage.style.transformOrigin = 'center center'; stage.style.transform = `translate(-50%,-50%) scale(${s})`; }
addEventListener('resize', fit2); fit2();
if (Q.has('nohud') || Q.has('export')) document.getElementById('hud').style.display = 'none';
let tt = Q.has('t') ? +Q.get('t') : 0, paused = Q.has('t'), last = null;
if (Q.has('export')) { renderAt(tt); __mg.loaded = true; }
else {
	addEventListener('keydown', (e) => { if (e.code === 'Space') { paused = !paused; e.preventDefault(); } if (e.code === 'ArrowRight') tt = (tt + 1) % DUR; if (e.code === 'ArrowLeft') tt = (tt - 1 + DUR) % DUR; });
	(function loop(now) { if (last != null && !paused) tt = (tt + (now - last) / 1000) % DUR; last = now; renderAt(tt); requestAnimationFrame(loop); })(performance.now());
}
