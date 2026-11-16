// Kit "papel recortado": texturas desenhadas em canvas com borda branca de adesivo e grão de papel,
// planos recortados que projetam sombra, fitas de marcador reveladas aos poucos e folhas rasgadas.
// Convenção de desenho: unidades do mundo, origem no centro do canvas, y para BAIXO (como o canvas).
import * as THREE from 'three';
import { mulberry32 } from './lib.js';

export const PX = 200;   // pixels por unidade (padrão)
export const C = {
	papel: '#F1E9D8', creme: '#FBF6EC', kraft: '#C9A27A', tinta: '#1C1B22', verm: '#E63946', azul: '#2B59C3',
	amar: '#FFD23F', menta: '#7FD1AE', rosa: '#F7A1B5', cinza: '#9A9AA3', branco: '#FFFFFF', noite: '#1F2A44',
	pele1: '#F2C7A5', pele2: '#C98E62', pele3: '#8A5A3B', azulc: '#A9C6F0', lilas: '#C3B4F2', laranja: '#F28C38',
};
export const FONT = { marker: '"Permanent Marker", "Segoe Print", sans-serif', sans: 'Inter, sans-serif', mono: '"JetBrains Mono", monospace' };

const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(2, w); c.height = Math.max(2, h); return c; };
function tint(src, color) { const c = mk(src.width, src.height), g = c.getContext('2d'); g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height); return c; }
let GRAIN;
function grain() {
	if (GRAIN) return GRAIN;
	const c = mk(256, 256), g = c.getContext('2d'), r = mulberry32(77), id = g.createImageData(256, 256);
	for (let i = 0; i < id.data.length; i += 4) { const v = 205 + r() * 50; id.data[i] = v; id.data[i + 1] = v; id.data[i + 2] = v * .98; id.data[i + 3] = 255; }
	g.putImageData(id, 0, 0);
	// fibras
	g.strokeStyle = 'rgba(150,130,100,.10)'; g.lineWidth = 1;
	for (let k = 0; k < 160; k++) { const x = r() * 256, y = r() * 256, a = r() * Math.PI; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14); g.stroke(); }
	return GRAIN = c;
}

// Desenha `draw(g)` num canvas w×h (unidades) e aplica borda de adesivo + grão.
export function paint(w, h, draw, { px = PX, border = .06, borderColor = C.branco, grainK = 1 } = {}) {
	const W = Math.ceil(w * px), H = Math.ceil(h * px);
	const a = mk(W, H), g = a.getContext('2d');
	g.setTransform(px, 0, 0, px, W / 2, H / 2); g.lineJoin = 'round'; g.lineCap = 'round';
	draw(g, px);
	let out = a;
	if (border > 0) {
		const b = mk(W, H), gb = b.getContext('2d'), s = tint(a, borderColor), r = border * px;
		for (let k = 0; k < 20; k++) { const an = k / 20 * Math.PI * 2; gb.drawImage(s, Math.cos(an) * r, Math.sin(an) * r); }
		gb.drawImage(s, 0, 0); gb.drawImage(a, 0, 0); out = b;
	}
	if (grainK > 0) {
		const mask = tint(out, '#000'), go = out.getContext('2d'); go.setTransform(1, 0, 0, 1, 0, 0);
		go.globalCompositeOperation = 'multiply'; go.globalAlpha = .55 * grainK;
		go.fillStyle = go.createPattern(grain(), 'repeat'); go.fillRect(0, 0, W, H);
		go.globalAlpha = 1; go.globalCompositeOperation = 'destination-in'; go.drawImage(mask, 0, 0);
		go.globalCompositeOperation = 'source-over';
	}
	return out;
}

const TEX = new Map(); let uid = 0;
export function tex(key, w, h, draw, opts = {}) {
	key = key || 'u' + uid++;
	if (TEX.has(key)) return TEX.get(key);
	const t = new THREE.CanvasTexture(paint(w, h, draw, opts));
	t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
	TEX.set(key, t); return t;
}
export const mat = (map, o = {}) => new THREE.MeshLambertMaterial({ map, transparent: true, alphaTest: .12, ...o });

// Plano recortado. anchor = ponto (unidades, y para cima, relativo ao centro) que vira o pivô.
export function cut(key, w, h, draw, opts = {}) {
	const t = tex(key, w, h, draw, opts);
	const geo = new THREE.PlaneGeometry(w, h);
	if (opts.anchor) geo.translate(-opts.anchor[0], -opts.anchor[1], 0);
	const m = new THREE.Mesh(geo, mat(t));
	m.castShadow = opts.shadow !== false; m.receiveShadow = true;
	m.userData.w = w; m.userData.h = h;
	return m;
}

// Texto escrito à mão / etiqueta, medido automaticamente.
export function textCut(key, text, { font = FONT.marker, size = .5, color = C.tinta, weight = '', bg = null, pad = .18, border = .05, rot = 0, px = PX, tape = false, lineGap = 1.1, align = 'center' } = {}) {
	const lines = String(text).split('\n');
	const meas = mk(4, 4).getContext('2d'); meas.font = `${weight} ${size * px}px ${font}`;
	const tw = Math.max(...lines.map(l => meas.measureText(l).width)) / px;
	const th = size * lineGap * lines.length;
	const w = tw + pad * 2 + border * 2 + .1, h = th + pad * 2 + border * 2 + .1;
	return cut('txt:' + key, w, h, g => {
		if (bg) {
			g.fillStyle = bg; const x = -w / 2 + border + .02, y = -h / 2 + border + .02, ww = w - border * 2 - .04, hh = h - border * 2 - .04;
			if (tape) { // fita adesiva: pontas serrilhadas
				g.beginPath(); const n = 7; g.moveTo(x, y);
				g.lineTo(x + ww, y); for (let i = 1; i <= n; i++) g.lineTo(x + ww + (i % 2 ? -.05 : 0), y + hh * i / n);
				g.lineTo(x, y + hh); for (let i = n - 1; i >= 0; i--) g.lineTo(x + (i % 2 ? .05 : 0), y + hh * i / n);
				g.closePath(); g.fill();
			} else g.fillRect(x, y, ww, hh);
		}
		const x0 = align === 'left' ? -tw / 2 : 0;
		lines.forEach((l, i) => txt(g, l, x0, (i - (lines.length - 1) / 2) * size * lineGap + size * .04, size, { font, color, weight, align }));
	}, { border, px, grainK: bg ? 1 : .4 });
}

// Folha de papel colorida com bordas rasgadas.
export function sheet(key, w, h, color, { seed = 1, deco = null, px = 60 } = {}) {
	const m = cut(key, w, h, g => {
		const r = mulberry32(seed), j = .12;
		g.fillStyle = color; g.beginPath();
		const n = 40, x0 = -w / 2 + .2, y0 = -h / 2 + .2, x1 = w / 2 - .2, y1 = h / 2 - .2;
		for (let i = 0; i <= n; i++) g.lineTo(x0 + (x1 - x0) * i / n, y0 + (r() - .5) * j);
		for (let i = 0; i <= n; i++) g.lineTo(x1 + (r() - .5) * j, y0 + (y1 - y0) * i / n);
		for (let i = n; i >= 0; i--) g.lineTo(x0 + (x1 - x0) * i / n, y1 + (r() - .5) * j);
		for (let i = n; i >= 0; i--) g.lineTo(x0 + (r() - .5) * j, y0 + (y1 - y0) * i / n);
		g.fill();
		if (deco) { g.save(); g.clip(); deco(g, r); g.restore(); }
	}, { border: 0, px, grainK: 1.2, shadow: false });
	m.castShadow = true;
	return m;
}

// Fita de marcador: polilinha com espessura, revelada de 0 a 1.
export function ribbon(pts, width, color, { opacity = 1 } = {}) {
	const n = pts.length, pos = new Float32Array(n * 2 * 3), idx = [];
	const geo = new THREE.BufferGeometry();
	geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
	for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
	geo.setIndex(idx);
	const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide, transparent: opacity < 1, opacity }));
	m.castShadow = false; m.receiveShadow = true;
	m.setPoints = P => {
		for (let i = 0; i < n; i++) {
			const p = P[i], q = P[Math.min(n - 1, i + 1)], o = P[Math.max(0, i - 1)];
			let dx = q[0] - o[0], dy = q[1] - o[1]; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
			const wv = width / 2 * (P[i][2] ?? 1);
			pos.set([p[0] - dy * wv, p[1] + dx * wv, 0, p[0] + dy * wv, p[1] - dx * wv, 0], i * 6);
		}
		geo.attributes.position.needsUpdate = true; geo.computeBoundingSphere();
	};
	m.setPoints(pts);
	m.reveal = k => { k = Math.max(0, Math.min(1, k)); geo.setDrawRange(0, Math.floor(k * (n - 1)) * 6); m.visible = k > 0; };
	m.frustumCulled = false;
	return m;
}

// Reamostra um caminho [[x,y],...] em ~`step` unidades, com tremor de mão.
export function handPath(pts, { step = .05, jitter = .015, seed = 3 } = {}) {
	const r = mulberry32(seed), out = [];
	for (let i = 0; i < pts.length - 1; i++) {
		const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay), k = Math.max(1, Math.ceil(L / step));
		for (let j = 0; j < k; j++) { const u = j / k; out.push([ax + (bx - ax) * u + (r() - .5) * jitter, ay + (by - ay) * u + (r() - .5) * jitter]); }
	}
	out.push(pts[pts.length - 1]);
	return out;
}
export const arcPts = (cx, cy, rx, ry, a0, a1, n = 40) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });

// Helpers de canvas
export function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
export function circle(g, x, y, r, fill, stroke, lw) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); } }
export function spiral(g, x, y, R, turns, lw, color) { g.beginPath(); for (let i = 0; i <= 120; i++) { const u = i / 120, a = u * turns * Math.PI * 2, r = u * R; i ? g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : g.moveTo(x, y); } g.strokeStyle = color; g.lineWidth = lw; g.stroke(); }

// Texto em unidades (desenha em pixels para ficar nítido).
export function txt(g, text, x, y, size, { font = FONT.marker, color = C.tinta, weight = '', align = 'center', base = 'middle', stroke = null, lw = 0 } = {}) {
	const k = g.getTransform().a; g.save(); g.scale(1 / k, 1 / k);
	g.font = `${weight} ${size * k}px ${font}`; g.textAlign = align; g.textBaseline = base;
	if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw * k; g.lineJoin = 'round'; g.strokeText(text, x * k, y * k); }
	g.fillStyle = color; g.fillText(text, x * k, y * k); g.restore();
}
