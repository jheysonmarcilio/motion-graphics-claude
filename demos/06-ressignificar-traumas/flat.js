// Kit "explainer flat" do Short 06: formas chapadas com contorno de tinta, sombra dura, placas de texto
// que cabem, bonecos vetoriais. Tudo desenhado em ordem de pintor (renderOrder único por mesh, sem depthTest),
// então nunca há z-fighting entre formas no mesmo plano.
import * as THREE from 'three';
import { fitFont, canvasTex, clamp, ease } from './lib.js';

export const P = {
	cobalto: '#3049FF', creme: '#FFF3DE', coral: '#FF5E5B', amarelo: '#FFC93C', tinta: '#1A1A3A',
	noite: '#1B1F5E', calmo: '#8FA8FF', chao: '#F6D7A7', pele: '#F2B58A', pele2: '#C98A5E', cabelo: '#3B2A22', castanho: '#7A4A2A',
	cinza: '#B9C0DA', branco: '#FFFFFF', menta: '#7BE0B5', madeira: '#C68B59',
};
export const LINE = .09;            // espessura padrão do contorno (unidades de cena; 1 u = 100 px no plano padrão)

let ORDER = 0;
const nextOrder = () => ++ORDER;
export function mat(color, opacity = 1) {
	return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthTest: false, depthWrite: false });
}
const MC = new Map();
const smat = c => { if (!MC.has(c)) MC.set(c, mat(c)); return MC.get(c); };
export function mesh(geo, material) { const m = new THREE.Mesh(geo, typeof material === 'string' ? smat(material) : material); m.renderOrder = nextOrder(); m.frustumCulled = false; return m; }
// eleva a ordem de pintura de uma subárvore (para itens criados antes mas que devem ficar por cima)
export function raise(obj) { obj.traverse(o => { if (o.isMesh) o.renderOrder = nextOrder(); }); return obj; }

// ── geometrias ──
export function rrShape(w, h, r) {
	r = Math.min(r, w / 2, h / 2); const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
	s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0); s.lineTo(x + w, y + h - r);
	s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2); s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
	s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5); return s;
}
const GC = new Map();
export function rrGeo(w, h, r) { const k = `${w.toFixed(3)}|${h.toFixed(3)}|${r.toFixed(3)}`; if (!GC.has(k)) GC.set(k, new THREE.ShapeGeometry(rrShape(w, h, r), 10)); return GC.get(k); }
const CIRC = new THREE.CircleGeometry(1, 56);

// caixa arredondada com contorno e sombra dura opcional
export function box(w, h, { r = .2, c = P.creme, line = LINE, shadow = 0, ink = P.tinta, fillMat = null } = {}) {
	const g = new THREE.Group();
	if (shadow) { const s = mesh(rrGeo(w + line * 2, h + line * 2, r + line), mat(ink, .22)); s.position.set(shadow, -shadow, 0); g.add(s); g.userData.shadow = s; }
	if (line) g.add(g.userData.out = mesh(rrGeo(w + line * 2, h + line * 2, r + line), ink));
	g.add(g.userData.fill = mesh(rrGeo(w, h, r), fillMat || c));
	return g;
}
export function disc(rad, { c = P.creme, line = LINE, shadow = 0, ink = P.tinta, fillMat = null } = {}) {
	const g = new THREE.Group();
	if (shadow) { const s = mesh(CIRC, mat(ink, .22)); s.scale.setScalar(rad + line); s.position.set(shadow, -shadow, 0); g.add(s); }
	if (line) { const o = mesh(CIRC, ink); o.scale.setScalar(rad + line); g.add(g.userData.out = o); }
	const f = mesh(CIRC, fillMat || c); f.scale.setScalar(rad); g.add(g.userData.fill = f);
	return g;
}
// polígono (contorno aproximado: mesmo polígono inflado a partir do centróide)
export function poly(pts, { c = P.amarelo, line = LINE, ink = P.tinta, fillMat = null } = {}) {
	const g = new THREE.Group(), cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
	const mk = k => { const s = new THREE.Shape(); pts.forEach(([x, y], i) => { const dx = x - cx, dy = y - cy, L = Math.hypot(dx, dy) || 1, X = x + dx / L * k, Y = y + dy / L * k; i ? s.lineTo(X, Y) : s.moveTo(X, Y); }); return new THREE.ShapeGeometry(s); };
	if (line) g.add(mesh(mk(line * 1.5), ink));
	g.add(g.userData.fill = mesh(mk(0), fillMat || c));
	return g;
}
// arco (boca, sorriso): anel parcial
export function arc(r, w, a0, a1, c = P.tinta) { return mesh(new THREE.RingGeometry(r - w / 2, r + w / 2, 28, 1, a0, a1 - a0), c); }

// traço grosso com pontas redondas entre dois pontos, atualizável (braços, cabos, setas, ✓)
export function limb(width, { c = P.cobalto, line = LINE, ink = P.tinta, fillMat = null } = {}) {
	const g = new THREE.Group(), layers = [];
	const mkLayer = (w, m) => { const r = mesh(new THREE.PlaneGeometry(1, 1), m), a = mesh(CIRC, m), b = mesh(CIRC, m); a.scale.setScalar(w / 2); b.scale.setScalar(w / 2); g.add(r, a, b); return { r, a, b, w }; };
	if (line) layers.push(mkLayer(width + line * 2, typeof ink === 'string' ? smat(ink) : ink));
	const fm = fillMat || smat(c); layers.push(mkLayer(width, fm));
	g.userData.mat = fm;
	g.set = (ax, ay, bx, by, k = 1) => {
		const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
		for (const l of layers) {
			l.r.position.set((ax + bx) / 2, (ay + by) / 2, 0); l.r.rotation.z = ang; l.r.scale.set(Math.max(L, 1e-4), l.w * k, 1);
			l.a.position.set(ax, ay, 0); l.b.position.set(bx, by, 0); l.a.scale.setScalar(l.w / 2 * k); l.b.scale.setScalar(l.w / 2 * k);
		}
		return g;
	};
	return g;
}
// traço feito de N segmentos ao longo de uma curva f(u) → [x,y]; desenha até a fração `upTo`
export function stroke(n, width, opts = {}) {
	const g = new THREE.Group(), segs = Array.from({ length: n }, () => limb(width, opts));
	// contornos primeiro, depois preenchimentos (o traço fica contínuo)
	segs.forEach(s => g.add(s));
	const outs = [], fills = [];
	segs.forEach(s => s.children.forEach((m, i) => (opts.line === 0 ? fills : (i < 3 ? outs : fills)).push(m)));
	[...outs, ...fills].forEach(m => m.renderOrder = nextOrder());
	g.userData.mat = segs[0].userData.mat;
	g.set = (f, upTo = 1, k = 1) => {
		const m = Math.max(1, Math.ceil(n * upTo));
		segs.forEach((s, i) => {
			s.visible = i < m && upTo > .001; if (!s.visible) return;
			const u0 = i / n * 1, u1 = Math.min((i + 1) / n, upTo); const [ax, ay] = f(u0), [bx, by] = f(Math.max(u1, u0 + 1e-4)); s.set(ax, ay, bx, by, k);
		});
		return g;
	};
	return g;
}

// ── texto ──
const PXU = 150; // pixels de canvas por unidade
// placa: caixa arredondada + 1–3 linhas medidas para caber (o check.js vê o roundRect e o fillText)
export function plate(lines, { w = 4, h = 1.2, bg = P.cobalto, fg = P.creme, border = P.tinta, radius = .22, weight = 900, family = 'Inter', pad = .16, track = .02, shadow = .14 } = {}) {
	lines = [].concat(lines);
	const bw = .09, cw = Math.round((w + bw * 2 + shadow) * PXU), ch = Math.round((h + bw * 2 + shadow) * PXU);
	const tex = canvasTex(cw, ch, (g) => {
		const b = bw * PXU, s = shadow * PXU, W = w * PXU, H = h * PXU, R = radius * PXU;
		if (shadow) { g.fillStyle = 'rgba(26,26,58,.22)'; g.beginPath(); g.roundRect(s, s, W + b * 2, H + b * 2, R + b); g.fill(); }
		if (border) { g.fillStyle = border; g.beginPath(); g.roundRect(0, 0, W + b * 2, H + b * 2, R + b); g.fill(); }
		g.fillStyle = bg; g.beginPath(); g.roundRect(b, b, W, H, R); g.fill();
		const px = W * pad, py = H * pad * .9, lh = (H - py * 2) / lines.length;
		const size = Math.min(...lines.map(t => fitFont(g, t, W - px * 2 - t.length * track * 60, lh * .74, weight, family)));
		g.font = `${weight} ${size}px ${family}`; g.letterSpacing = `${track * size}px`; g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
		lines.forEach((t, i) => g.fillText(t, b + W / 2, b + py + lh * (i + .5) + size * .04));
	});
	const m = mesh(new THREE.PlaneGeometry(cw / PXU, ch / PXU), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
	m.position.set(shadow / 2, -shadow / 2, 0);
	const grp = new THREE.Group(); grp.add(m); grp.userData.mesh = m; return grp;
}
// texto solto (sem caixa), cabendo em w×h
export function text(t, { w = 3, h = 1, fg = P.tinta, weight = 900, family = 'Inter', stroke: st = 0, strokeColor = P.tinta, align = 'center' } = {}) {
	const cw = Math.round(w * PXU), ch = Math.round(h * PXU);
	const tex = canvasTex(cw, ch, g => {
		const pad = st * PXU + 4, size = fitFont(g, t, cw - pad * 2, ch * .8 - pad * 2, weight, family);
		g.font = `${weight} ${size}px ${family}`; g.textAlign = align; g.textBaseline = 'middle';
		const x = align === 'center' ? cw / 2 : pad;
		if (st) { g.lineJoin = 'round'; g.lineWidth = st * PXU * 2; g.strokeStyle = strokeColor; g.strokeText(t, x, ch / 2); }
		g.fillStyle = fg; g.fillText(t, x, ch / 2);
	});
	return mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
}

// ── objetos recorrentes ──
export function star(r = .35, c = P.amarelo) { const pts = []; for (let i = 0; i < 8; i++) { const a = Math.PI / 2 + i * Math.PI / 4, k = i % 2 ? r * .38 : r; pts.push([Math.cos(a) * k, Math.sin(a) * k]); } return poly(pts, { c, line: .05 }); }
export function bolt(s = 1, c = P.amarelo) { return poly([[-.15, .9], [.45, .9], [.12, .25], [.42, .25], [-.32, -.95], [-.02, -.1], [-.36, -.1]].map(([x, y]) => [x * s, y * s]), { c, line: .06 }); }

// nuvem de tempestade (coral): contornos de todos os lóbulos primeiro, depois os preenchimentos
export function cloud(s = 1, { c = P.coral } = {}) {
	const g = new THREE.Group(), L = [[-1.1, -.1, .75], [-.35, .35, .95], [.55, .25, .85], [1.2, -.15, .65], [0, -.35, .7]];
	const fm = mat(c);
	L.forEach(([x, y, r]) => { const o = mesh(CIRC, P.tinta); o.scale.setScalar((r + LINE) * s); o.position.set(x * s, y * s, 0); g.add(o); });
	const base = mesh(rrGeo(2.6 * s, .9 * s, .45 * s), P.tinta); base.scale.set(1 + LINE * 2 / (2.6 * s), 1 + LINE * 2 / (.9 * s), 1); base.position.y = -.45 * s; g.add(base);
	const base2 = mesh(rrGeo(2.6 * s, .9 * s, .45 * s), fm); base2.position.y = -.45 * s; g.add(base2);
	L.forEach(([x, y, r]) => { const f = mesh(CIRC, fm); f.scale.setScalar(r * s); f.position.set(x * s, y * s, 0); g.add(f); });
	const b = bolt(.7 * s); b.position.set(.15 * s, -1.25 * s, 0); g.add(b); g.userData.bolt = b; g.userData.mat = fm;
	// gotas
	const drops = [];
	for (let i = 0; i < 5; i++) { const d = mesh(rrGeo(.09 * s, .32 * s, .045 * s), P.calmo); g.add(d); drops.push(d); }
	g.userData.drops = drops;
	g.tick = (T, k = 1) => {
		drops.forEach((d, i) => { const u = (T * 1.6 + i * .37) % 1, x = (-1 + i * .5) * s; d.position.set(x, (-.9 - u * 1.4) * s, 0); d.visible = k > .05 && i !== 3; d.scale.y = 1 - u * .5; });
		// raio em descargas (aparece com pop e fica ~0,45 s), em vez de piscar a cada poucos quadros
		const u = (T * .62 + .1) % 1, on = u < .42 && k > .05; b.visible = on; if (on) b.scale.setScalar(Math.max(1e-3, ease.backOut(Math.min(1, u / .08)))); b.rotation.z = 0;
	};
	return g;
}

// polaroid da memória: moldura creme + cena (céu coral, nuvem, bonequinho). `k` 1 = trauma vivo, 0 = sem carga (cinza)
export function polaroid(s = 1) {
	const g = new THREE.Group();
	g.add(box(2.4 * s, 2.8 * s, { r: .08 * s, c: P.branco, shadow: .12 * s }));
	const sky = mat(P.coral), sky2 = mat(P.tinta), grd = mat(P.castanho), cl = mat(P.tinta);
	const pic = mesh(rrGeo(2.0 * s, 2.0 * s, .04 * s), sky); pic.position.y = .25 * s; g.add(pic);
	const sun = mesh(CIRC, sky2); sun.scale.setScalar(.0001); g.add(sun);
	const ground = mesh(rrGeo(2.0 * s, .5 * s, .02 * s), grd); ground.position.y = -.5 * s; g.add(ground);
	const c1 = [[-.35, .75, .3], [.0, .9, .36], [.35, .75, .28]].map(([x, y, r]) => { const m = mesh(CIRC, cl); m.scale.setScalar(r * s); m.position.set(x * s, y * s, 0); g.add(m); return m; });
	const fig = new THREE.Group();
	const hd = mesh(CIRC, cl); hd.scale.setScalar(.13 * s); hd.position.y = .05 * s;
	const bd = mesh(rrGeo(.22 * s, .42 * s, .11 * s), cl); bd.position.y = -.27 * s; fig.add(hd, bd); fig.position.set(-.1 * s, -.0 * s, 0); g.add(fig);
	const zz = bolt(.32 * s, P.amarelo); zz.position.set(.45 * s, .35 * s, 0); g.add(zz);
	const cap = mesh(rrGeo(1.2 * s, .14 * s, .07 * s), mat(P.cinza)); cap.position.y = -1.12 * s; g.add(cap);
	const cA = new THREE.Color(P.coral), cB = new THREE.Color('#D9DCEA'), gA = new THREE.Color(P.castanho), gB = new THREE.Color('#C3C7D8'), kA = new THREE.Color(P.tinta), kB = new THREE.Color('#9CA2BE');
	g.charge = k => { sky.color.copy(cB).lerp(cA, k); grd.color.copy(gB).lerp(gA, k); cl.color.copy(kB).lerp(kA, k); zz.visible = k > .35; zz.scale.setScalar(Math.max(.001, k)); };
	g.charge(1);
	return g;
}

// ── boneco vetorial ──
// partes em coordenadas locais: base do tronco em y=0, cabeça em y≈3.25. Ângulos dos braços a partir de "para baixo".
export function person({ shirt = P.calmo, hair = P.cabelo, skin = P.pele, coat = false, glasses = false, beard = false, hairStyle = 'short' } = {}) {
	const g = new THREE.Group(), body = new THREE.Group(), head = new THREE.Group(); g.add(body);
	const U = { g, body, head };
	// pernas
	const legs = [-1, 1].map(s => { const l = limb(.42, { c: P.tinta, line: 0 }); body.add(l); return l; });
	const shoes = [-1, 1].map(s => { const b = box(.62, .32, { r: .16, c: P.tinta, line: 0 }); body.add(b); return b; });
	// braço de trás desenhado antes do tronco? (vista frontal: ambos depois do tronco)
	const torso = box(1.75, 2.45, { r: .8, c: coat ? P.creme : shirt }); torso.position.y = 1.22; body.add(torso);
	if (coat) {
		const v = poly([[-.38, 2.4], [.38, 2.4], [0, 1.55]], { c: shirt, line: .04 }); body.add(v);
		const pk = box(.42, .34, { r: .06, c: P.creme, line: .05 }); pk.position.set(.45, 1.35, 0); body.add(pk);
		const pen = box(.08, .38, { r: .04, c: P.coral, line: 0 }); pen.position.set(.38, 1.55, 0); body.add(pen);
	}
	body.add(head); head.position.y = 3.2;
	// cabelo de trás
	if (hairStyle !== 'bald') { const hb = disc(1.0, { c: hair }); hb.position.y = .18; head.add(hb); }
	const face = disc(.95, { c: skin }); head.add(face);
	const ears = [-1, 1].map(s => { const e = disc(.2, { c: skin, line: .06 }); e.position.set(s * .93, -.05, 0); head.add(e); return e; });
	raise(face); // rosto por cima das orelhas
	if (hairStyle !== 'bald') {
		// calota única (topo do rosto cortado numa linha de franja + mecha): uma só forma, sem frestas finas
		// entre peças sobrepostas, que cintilavam com o movimento da cabeça
		const R = .965, yF = .3, a0 = Math.asin(yF / R), cap = new THREE.Shape();
		cap.moveTo(R * Math.cos(a0), yF); cap.absarc(0, 0, R, a0, Math.PI - a0, false);
		cap.lineTo(-.15, yF); cap.quadraticCurveTo(.12, yF - .02, .3, yF - .2); cap.quadraticCurveTo(.4, yF - .02, .62, yF - .02); cap.closePath();
		const fr = mesh(new THREE.ShapeGeometry(cap, 24), hair); head.add(fr);
	}
	// barba (cresce na gag dos meses)
	const bd = new THREE.Group(); bd.position.y = -.62; head.add(bd);
	const bm = poly([[-.9, .2], [.9, .2], [.75, -.55], [.35, -1.1], [0, -1.25], [-.35, -1.1], [-.75, -.55]], { c: P.castanho, line: .06 }); bd.add(bm);
	bd.scale.set(1, .0001, 1); bd.visible = false; U.beard = bd;
	// olhos
	const eyes = [-1, 1].map(s => {
		const e = new THREE.Group(); e.position.set(s * .34, .02, 0);
		const w = disc(.22, { c: P.branco, line: .05 }), p = mesh(CIRC, P.tinta); p.scale.setScalar(.12);
		const hl = mesh(CIRC, P.branco); hl.scale.setScalar(.04); hl.position.set(.04, .05, 0);
		const pg = new THREE.Group(); pg.add(p, hl); e.add(w, pg); head.add(e); return { e, pg };
	});
	if (glasses) [-1, 1].forEach(s => { const r = mesh(new THREE.RingGeometry(.29, .36, 32), P.tinta); r.position.set(s * .34, .02, 0); head.add(r); });
	if (glasses) { const br = mesh(new THREE.PlaneGeometry(.12, .06), P.tinta); br.position.set(0, .06, 0); head.add(br); }
	const brows = [-1, 1].map(s => { const b = mesh(rrGeo(.38, .1, .05), hair === P.cabelo ? P.tinta : P.tinta); b.position.set(s * .34, .38, 0); head.add(b); return b; });
	const cheeks = [-1, 1].map(s => { const c = mesh(CIRC, mat(P.coral, .35)); c.scale.setScalar(.14); c.position.set(s * .55, -.28, 0); head.add(c); return c; });
	const mouths = {
		smile: arc(.28, .1, Math.PI * 1.15, Math.PI * 1.85), big: (() => { const m = mesh(new THREE.CircleGeometry(.3, 24, Math.PI, Math.PI), P.tinta); return m; })(),
		flat: mesh(rrGeo(.36, .09, .045), P.tinta), frown: arc(.26, .1, Math.PI * .2, Math.PI * .8), o: mesh(CIRC, P.tinta),
	};
	mouths.smile.position.y = -.12; mouths.big.position.y = -.33; mouths.flat.position.y = -.42; mouths.frown.position.y = -.68; mouths.o.position.y = -.45; mouths.o.scale.setScalar(.13);
	Object.values(mouths).forEach(m => head.add(m));
	raise(bd);
	// braços (depois do tronco)
	const arms = [-1, 1].map(s => { const up = limb(.42, { c: coat ? P.creme : shirt }), lo = limb(.42, { c: coat ? P.creme : shirt }), hand = disc(.24, { c: skin, line: .07 }); body.add(up, lo, hand); return { up, lo, hand, s }; });
	U.arms = arms;
	U.pose = {};
	// pose: { la:[ombro, cotovelo], ra:[…], look:[x,y], brow:-1..1 (bravo..preocupado), mouth, blink 0..1, sit, lean, tilt, shrug, legs }
	g.setPose = (q = {}) => {
		const { la = [.22, .12], ra = [.22, .12], look = [0, 0], brow = 0, mouth = 'smile', blink = 0, lean = 0, tilt = 0, shrug = 0, sit = false, step = 0 } = q;
		body.rotation.z = lean; head.rotation.z = tilt; head.position.y = 3.2 + shrug * -.18;
		arms.forEach(({ up, lo, hand, s }) => {
			const [a1, a2] = s < 0 ? la : ra, sx = s * .72, sy = 2.05 + shrug * .3;
			const ex = sx + s * Math.sin(a1) * .95, ey = sy - Math.cos(a1) * .95;
			const hx = ex + s * Math.sin(a1 + a2) * .9, hy = ey - Math.cos(a1 + a2) * .9;
			up.set(sx, sy, ex, ey); lo.set(ex, ey, hx, hy); hand.position.set(hx, hy, 0);
			U[s < 0 ? 'lh' : 'rh'] = [hx, hy];
		});
		legs.forEach((l, i) => { const s = i ? 1 : -1, sw = Math.sin(step) * .35 * s; if (sit) { l.set(s * .42, .25, s * .52, -.85); shoes[i].position.set(s * .58, -1.05, 0); } else { l.set(s * .42, .25, s * .45 + sw * .5, -1.35); shoes[i].position.set(s * .52 + sw * .5, -1.55, 0); } });
		eyes.forEach(({ e, pg }) => { pg.position.set(clamp(look[0], -1, 1) * .09, clamp(look[1], -1, 1) * .08, 0); e.scale.y = Math.max(.08, 1 - blink); });
		brows.forEach((b, i) => { const s = i ? 1 : -1; b.rotation.z = s * brow * .35; b.position.y = .38 + Math.abs(brow) * .06 * (brow > 0 ? 1 : -.4); });
		for (const [k, m] of Object.entries(mouths)) m.visible = k === mouth;
		cheeks.forEach(c => c.visible = mouth === 'smile' || mouth === 'big');
	};
	g.setPose();
	return U;
}
// piscar determinístico: devolve 0..1
export function blinkAt(T, seed = 0) { const p = 3.1 + (seed % 3) * .7, u = ((T + seed * 1.37) % p) / p; return u > .965 ? Math.sin((u - .965) / .035 * Math.PI) : 0; }
