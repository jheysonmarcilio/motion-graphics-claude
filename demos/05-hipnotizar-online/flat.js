// Kit "explainer flat" do Short 05: formas chapadas, sombra dura, traços grossos, bonecos vetoriais.
// Tudo em MeshBasicMaterial transparente, sem depthWrite: a ordem de pintura é o renderOrder (= ordem de criação),
// então nunca há z-fighting. Unidade de cena = 1 px no zoom 1 (palco 1080×1920).
import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

export const P = {
	noite: '#16213E', noite2: '#22305A', tinta: '#0E1428', creme: '#FFF4E0', branco: '#FFFFFF',
	amarelo: '#FFC93C', rosa: '#FF5D8F', menta: '#36D6A0', azul: '#4D7CFE', laranja: '#FF8A3D', cinza: '#8C95B5',
	vermelho: '#F2464B', pele1: '#F2C29B', pele2: '#D79A6E', cabelo: '#5A3A2A', grisalho: '#D5D8E2', terno: '#2B3A67',
	tela: '#101833', tile1: '#2A3B6E', tile2: '#43306A',
};
let RO = 0;
export const nextOrder = () => ++RO;
export function mat(color, opacity = 1) {
	const m = new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide, opacity });
	m.userData.base = opacity; return m;
}
export function mesh(geo, color, opacity = 1) { const m = new THREE.Mesh(geo, mat(color, opacity)); m.renderOrder = ++RO; return m; }
export function at(o, x = 0, y = 0, parent = null) { o.position.set(x, y, 0); if (parent) parent.add(o); return o; }

export function rrShape(w, h, r) {
	r = Math.min(r, w / 2, h / 2); const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
	s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
	s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
	s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}
export const rrect = (w, h, r, color, op) => mesh(new THREE.ShapeGeometry(rrShape(w, h, r), 6), color, op);
export const circle = (r, color, op) => mesh(new THREE.CircleGeometry(r, 48), color, op);
export const ring = (r0, r1, color, op, a0 = 0, a1 = Math.PI * 2) => mesh(new THREE.RingGeometry(r0, r1, 64, 1, a0, a1), color, op);
export function poly(pts, color, op) { const s = new THREE.Shape(); pts.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); return mesh(new THREE.ShapeGeometry(s), color, op); }
// cartão com sombra dura deslocada (assinatura flat)
export function card(w, h, r, color, { shadow = P.tinta, off = 14, border = null, bw = 8 } = {}) {
	const g = new THREE.Group();
	if (shadow) g.add(at(rrect(w, h, r, shadow), off, -off));
	if (border) g.add(rrect(w + bw * 2, h + bw * 2, r + bw, border));
	const f = rrect(w, h, r, color); g.add(f); g.userData.face = f;
	return g;
}

// opacidade de um grupo inteiro (multiplica a opacidade-base de cada material)
export function setOpacity(o, a) {
	o.visible = a > .003;
	o.traverse(m => { if (m.material) m.material.opacity = (m.material.userData.base ?? 1) * a; });
}

// ── texto em canvas (sempre medido para caber) ──
export function fitFont(g, text, maxW, maxH, weight = 900, family = 'Inter', start = 1200) {
	let s = Math.min(start, maxH);
	for (; s > 6; s -= 2) { g.font = `${weight} ${s}px ${family}`; const m = g.measureText(text); if (m.width <= maxW && (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) <= maxH) break; }
	return s;
}
export function texOf(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
function drawText(c, lines, { color = P.creme, bg = null, radius = 24, weight = 900, family = 'Inter', pad = .1, align = 'center', res = 2, sizes = null, colors = null }) {
	const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height);
	if (bg) { g.fillStyle = bg; g.beginPath(); g.roundRect(0, 0, c.width, c.height, radius * res); g.fill(); }
	lines = [].concat(lines);
	const px = c.width * pad, py = c.height * pad;
	const rel = sizes || lines.map(() => 1), tot = rel.reduce((a, b) => a + b, 0);
	const hs = rel.map(r => (c.height - py * 2) * r / tot);
	const fam = i => [].concat(family)[Math.min(i, [].concat(family).length - 1)], wt = i => [].concat(weight)[Math.min(i, [].concat(weight).length - 1)];
	const fs = lines.map((t, i) => fitFont(g, t, (c.width - px * 2) * .94, hs[i] * .8, wt(i), fam(i)));
	// linhas do mesmo "nível" (mesmo peso relativo) usam a mesma fonte (a menor)
	const same = sizes ? fs : fs.map(() => Math.min(...fs));
	let y = py; g.textBaseline = 'middle'; g.textAlign = align;
	const x = align === 'left' ? px : align === 'right' ? c.width - px : c.width / 2;
	lines.forEach((t, i) => { g.font = `${wt(i)} ${same[i]}px ${fam(i)}`; g.fillStyle = colors ? colors[i] : color; g.fillText(t, x, y + hs[i] / 2); y += hs[i]; });
}
export function textPlane(lines, w, h, o = {}) {
	const res = o.res ?? 2, c = document.createElement('canvas'); c.width = Math.round(w * res); c.height = Math.round(h * res);
	const opt = { ...o, res }; drawText(c, lines, opt);
	const tex = texOf(c), m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false, opacity: o.opacity ?? 1 }));
	m.material.userData.base = o.opacity ?? 1; m.renderOrder = ++RO; m.userData.canvas = c;
	let last = JSON.stringify(lines);
	m.userData.set = l => { const k = JSON.stringify(l); if (k === last) return; last = k; drawText(c, l, opt); tex.needsUpdate = true; };
	return m;
}

// ── traço grosso que se desenha (Line2) ──
export function stroke(pts, color, width = 10, { dashed = true, opacity = 1 } = {}) {
	const flat = []; for (const p of pts) flat.push(p[0], p[1], 0);
	const geo = new LineGeometry(); geo.setPositions(flat);
	let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
	const m = new LineMaterial({ color, linewidth: width, worldUnits: true, dashed, dashSize: len + 1, gapSize: len + 1, transparent: true, depthWrite: false, depthTest: false, opacity });
	m.userData.base = opacity; m.resolution.set(1080, 1920);
	const l = new Line2(geo, m); if (dashed) l.computeLineDistances(); l.renderOrder = ++RO; l.frustumCulled = false;
	l.userData.len = len;
	l.userData.draw = k => { k = Math.min(1, Math.max(0, k)); m.dashSize = Math.max(1e-3, len * k); m.gapSize = len * 2 + 10; l.visible = k > .002; };
	return l;
}
export const arc = (cx, cy, r, a0, a1, n = 24) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
export const quad = (p0, p1, p2, n = 24) => Array.from({ length: n + 1 }, (_, i) => { const u = i / n, v = 1 - u; return [v * v * p0[0] + 2 * v * u * p1[0] + u * u * p2[0], v * v * p0[1] + 2 * v * u * p1[1] + u * u * p2[1]]; });
// seta: corpo que se desenha + ponta que aparece no fim
export function arrow(pts, color, width = 12) {
	const g = new THREE.Group(), body = stroke(pts, color, width); g.add(body);
	const n = pts.length, a = pts[n - 1], b = pts[n - 2], ang = Math.atan2(a[1] - b[1], a[0] - b[0]);
	const head = poly([[0, 0], [-width * 3, width * 1.8], [-width * 3, -width * 1.8]], color); head.position.set(a[0], a[1], 0); head.rotation.z = ang; g.add(head);
	g.userData.draw = k => { body.userData.draw(k); head.visible = k > .97; };
	return g;
}

// ── mão (ícone grande ou mão do boneco em close) ──
// origem = centro da palma; dedos para cima; curl(0..1) fecha o punho
export function hand({ skin = P.pele1, sleeve = P.amarelo, cuff = P.branco, outline = P.tinta } = {}) {
	const g = new THREE.Group();
	const sl = at(rrect(190, 420, 40, sleeve), 0, -290, g);
	at(rrect(200, 50, 24, cuff), 0, -105, g);
	const fingers = [];
	const xs = [-54, -18, 18, 54], ls = [96, 118, 112, 90];
	const palm = rrect(160, 180, 60, skin);
	for (let i = 0; i < 4; i++) {
		const p = at(new THREE.Group(), xs[i], 60, g);
		const f = at(rrect(34, ls[i], 17, skin), 0, ls[i] / 2, p);
		fingers.push({ p, f, l: ls[i] });
	}
	g.add(palm);
	const knuckles = []; for (let i = 0; i < 3; i++) { const k = at(rrect(5, 30, 2.5, outline, .5), -36 + i * 36, 72, g); knuckles.push(k); }
	const thumbP = at(new THREE.Group(), -72, -10, g);
	const thumb = at(rrect(38, 92, 19, skin), 0, 40, thumbP); thumbP.rotation.z = .55;
	g.userData.curl = k => {
		fingers.forEach(F => { const s = 1 - .7 * k; F.f.scale.y = s; F.f.position.y = F.l * s / 2 - k * 6; F.p.position.y = 60 + 12 * k; });
		knuckles.forEach(n => { n.visible = k > .6; n.position.y = 72 + 8 * k; });
		thumbP.rotation.z = .55 - 1.6 * k; thumbP.position.set(-72 + 30 * k, -10 + 18 * k, 0);
	};
	g.userData.curl(0); g.userData.sleeve = sl;
	return g;
}

// ── boneco vetorial ──
export function person({ skin = P.pele1, shirt = P.azul, hair = P.tinta, hairStyle = 'short', glasses = false, tie = null, legs = true, pants = P.tinta } = {}) {
	const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
	if (legs) for (const sx of [-1, 1]) { at(rrect(78, 240, 36, pants), sx * 52, -100, body); at(rrect(110, 46, 23, P.tinta), sx * 64, -222, body); }
	const torso = at(rrect(230, 300, 110, shirt), 0, 150, body);
	if (tie) { at(poly([[-34, 300], [34, 300], [0, 250]], P.branco), 0, 0, body); at(rrect(30, 140, 10, tie), 0, 225, body); }
	at(rrect(56, 60, 20, skin), 0, 300, body);
	const head = at(new THREE.Group(), 0, 400, body);
	if (hairStyle === 'long') at(rrect(236, 250, 100, hair), 0, -40, head);
	at(circle(22, skin), -104, -6, head); at(circle(22, skin), 104, -6, head);
	at(circle(105, skin), 0, 0, head);
	if (hairStyle === 'short' || hairStyle === 'long') { const t = at(mesh(new THREE.CircleGeometry(110, 48, 0, Math.PI), hair), 0, 22, head); t.scale.y = .78; }
	if (hairStyle === 'long') { at(rrect(40, 150, 20, hair), -96, -20, head); at(rrect(40, 150, 20, hair), 96, -20, head); }
	if (hairStyle === 'slick') { const t = at(mesh(new THREE.CircleGeometry(112, 48, 0, Math.PI), hair), 0, 26, head); t.scale.y = .72; at(rrect(8, 54, 4, P.cinza), -34, 82, head).rotation.z = .3; }
	const eyes = [];
	for (const sx of [-1, 1]) {
		const e = at(new THREE.Group(), sx * 40, 12, head);
		e.add(circle(22, P.branco));
		const pupil = circle(11, P.tinta); e.add(pupil);
		const lid = circle(24, skin); e.add(lid);
		const shut = at(stroke(arc(0, 6, 18, -2.6, -.54, 10), P.tinta, 7, { dashed: false }), 0, 0, e);
		eyes.push({ e, pupil, lid, shut, sx });
	}
	if (glasses) { for (const sx of [-1, 1]) at(ring(28, 35, P.tinta), sx * 40, 12, head); at(rrect(22, 6, 3, P.tinta), 0, 14, head); }
	const brows = [-1, 1].map(sx => ({ m: at(rrect(46, 10, 5, hair === P.grisalho ? P.cinza : P.tinta), sx * 40, 50, head), sx }));
	const blush = [-1, 1].map(sx => at(circle(16, P.rosa, .35), sx * 66, -24, head));
	const mouths = {};
	const mPts = k => { const p = []; for (let i = 0; i <= 12; i++) { const u = i / 12 * 2 - 1; p.push([u * 32, -48 - k * 16 * (1 - u * u)]); } return p; };
	for (const k of [-.5, 0, .4, .8, 1.2]) { mouths[k] = at(stroke(mPts(k), P.tinta, 9, { dashed: false }), 0, 0, head); }
	const mouthO = at(circle(17, P.tinta), 0, -54, head); mouthO.scale.y = 1.2;
	const arms = [];
	for (const sx of [-1, 1]) {
		const sh = at(new THREE.Group(), sx * 96, 262, body);
		at(rrect(46, 140, 23, shirt), 0, -58, sh);
		const el = at(new THREE.Group(), 0, -118, sh);
		at(rrect(42, 128, 21, shirt), 0, -52, el);
		const hnd = at(circle(28, skin), 0, -118, el);
		arms.push({ sh, el, hnd, sx });
	}
	const keys = Object.keys(mouths).map(Number);
	g.userData.pose = ({ blink = 0, lids = 0, look = [0, 0], brow = 0, smile = .4, talk = 0, shock = 0, arm = [], lean = 0, bob = 0, tilt = 0, blushA = 0 } = {}) => {
		const c = Math.min(1, Math.max(lids, blink));
		for (const E of eyes) {
			E.lid.scale.y = Math.max(.001, c); E.lid.position.y = 24 * (1 - c); E.lid.visible = c > .02;
			E.shut.visible = c > .9; E.pupil.position.set(look[0] * 8, look[1] * 8, 0);
		}
		brows.forEach(B => { B.m.position.y = 50 + brow * 14 - c * 4; B.m.rotation.z = -B.sx * brow * .22; });
		blush.forEach(b => setOpacity(b, blushA));
		let k = smile; if (talk > 0) k = smile * .5 + .7 * Math.abs(Math.sin(talk * 10.7) * Math.sin(talk * 4.1));
		const near = keys.reduce((a, b) => Math.abs(b - k) < Math.abs(a - k) ? b : a);
		for (const kk of keys) mouths[kk].visible = shock < .5 && kk === near;
		mouthO.visible = shock >= .5;
		arms.forEach((A, i) => { const a = arm[i] || [.08, -.1]; A.sh.rotation.z = A.sx * a[0]; A.el.rotation.z = A.sx * a[1]; });
		body.rotation.z = lean; body.position.y = bob; head.rotation.z = tilt;
	};
	g.userData.parts = { body, head, eyes, arms, torso };
	g.userData.pose({});
	return g;
}
// piscada natural determinística
export function blinkAt(t, seed = 0) {
	const period = 2.7 + (seed % 5) * .41, ph = ((t + seed * .71) % period + period) % period;
	return ph < .16 ? Math.sin(ph / .16 * Math.PI) : 0;
}

// ── ícones ──
export function wifi(size = 200, color = P.creme) {
	const g = new THREE.Group(), arcs = [];
	for (let i = 0; i < 3; i++) { const r = size * (.28 + i * .24); const a = ring(r, r + size * .13, color, 1, Math.PI / 4, Math.PI / 2); g.add(a); arcs.push(a); }
	const dot = at(circle(size * .1, color), 0, size * .02, g);
	g.position.y = 0; g.userData.parts = [dot, ...arcs];
	return g;
}
// confete/poeira determinística
export function bits(n, colors, rng, { w = 18, h = 30 } = {}) {
	const g = new THREE.Group(), list = [];
	for (let i = 0; i < n; i++) { const m = rrect(w * (.6 + rng() * .8), h * (.6 + rng() * .8), 4, colors[i % colors.length]); g.add(m); list.push({ m, vx: (rng() - .5) * 900, vy: 300 + rng() * 700, vr: (rng() - .5) * 14, d: rng() * .15 }); }
	g.userData.list = list; return g;
}
export function burst(g, lt, gravity = 1500) {
	for (const b of g.userData.list) { const t = Math.max(0, lt - b.d); b.m.position.set(b.vx * t, b.vy * t - gravity * t * t / 2, 0); b.m.rotation.z = b.vr * t; b.m.visible = lt > b.d && t < 1.6; }
}
