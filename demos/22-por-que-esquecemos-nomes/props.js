// Peças novas do kit flat criadas no Short 22 (reaproveitáveis): gancho que se desenha, etiqueta pendurada,
// ícones de padaria (pão, forno, lua, café), nuvem/balão genérico, calendário, balança, lanterna, halter,
// casa-cabeça com cômodos, acessórios de boneco (bigode, gorro, avental, cabelo comprido).
// Todas recebem cor/tamanho; usam o mesmo desenho em ordem de pintor de flat.js.
import * as THREE from 'three';
import { P, mat, mesh, box, disc, poly, limb, stroke, plate, text } from './flat.js';

const CIRC = new THREE.CircleGeometry(1, 40);

// gancho/anzol grosso: g.draw(k 0..1) desenha do topo até a ponta; g.tip = ponto onde as coisas penduram
export function hook(s = 1, { c = P.forno, w = .3 } = {}) {
	const g = new THREE.Group();
	const ringO = mesh(new THREE.RingGeometry(.1 * s, .38 * s, 32), P.tinta); ringO.position.y = 2.42 * s;
	const ringF = mesh(new THREE.RingGeometry(.17 * s, .31 * s, 32), c); ringF.position.y = 2.42 * s;
	const st = stroke(26, w * s, { c, line: .08 });
	g.add(ringO, ringF, st);
	const f = u => {
		if (u < .525) { const k = u / .525; return [0, (2.15 - 2.15 * k) * s]; }
		const k = (u - .525) / .475, a = Math.PI + k * Math.PI * 1.15;
		return [(.55 + .55 * Math.cos(a)) * s, .55 * Math.sin(a) * s];
	};
	g.draw = k => { st.set(f, Math.max(.001, k)); st.visible = k > .002; ringO.visible = ringF.visible = k > .02; const r = Math.min(1, k * 5); ringO.scale.setScalar(Math.max(r, 1e-3)); ringF.scale.setScalar(Math.max(r, 1e-3)); };
	g.tip = [.55 * s, -.58 * s];
	g.draw(1);
	return g;
}
// contorno fantasma do gancho (onde ele deveria estar)
export function ghostHook(s = 1, c = P.tinta, op = .25) {
	const g = new THREE.Group(), st = stroke(26, .26 * s, { line: 0, fillMat: mat(c, op) });
	const f = u => { if (u < .525) { const k = u / .525; return [0, (2.15 - 2.15 * k) * s]; } const k = (u - .525) / .475, a = Math.PI + k * Math.PI * 1.15; return [(.55 + .55 * Math.cos(a)) * s, .55 * Math.sin(a) * s]; };
	st.set(f, 1); g.add(st); g.userData.mat = st.userData.mat; return g;
}
// etiqueta pendurada por um fio (origem = ponto de pendurar)
export function tag(label, { c = P.creme, w = 2.2, h = .85, fg = P.tinta, str = .35 } = {}) {
	const g = new THREE.Group();
	const s = limb(.06, { c: P.tinta, line: 0 }); s.set(0, 0, 0, -str - .2); g.add(s);
	const p = plate([label], { w, h, bg: c, fg, shadow: .1 }); p.position.y = -str - h / 2 - .09; g.add(p);
	const hole = disc(.08, { c: P.creme, line: .04 }); hole.position.y = -str - .17; g.add(hole);
	g.userData.plate = p; return g;
}
// nuvem/balão: lista de círculos [x,y,r]; contornos primeiro, preenchimentos depois
export function blob(circles, { c = P.branco, line = .09, ink = P.tinta, fillMat = null } = {}) {
	const g = new THREE.Group(), fm = fillMat || mat(c);
	circles.forEach(([x, y, r]) => { const o = mesh(CIRC, ink); o.scale.setScalar(r + line); o.position.set(x, y, 0); g.add(o); });
	circles.forEach(([x, y, r]) => { const f = mesh(CIRC, fm); f.scale.setScalar(r); f.position.set(x, y, 0); g.add(f); });
	g.userData.mat = fm; return g;
}
// ── ícones de padaria (~1,2 u) ──
export function bread(s = 1, c = '#D98E3A') {
	const g = new THREE.Group(), pts = [];
	for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2; pts.push([Math.cos(a) * .72 * s, Math.sin(a) * .4 * s * (Math.sin(a) > 0 ? 1.1 : .8)]); }
	g.add(poly(pts, { c, line: .06 }));
	for (let i = -1; i <= 1; i++) { const l = limb(.08 * s, { c: '#FFE3B0', line: 0 }); l.set((i * .36 - .1) * s, -.05 * s, (i * .36 + .12) * s, .22 * s); g.add(l); }
	return g;
}
export function oven(s = 1, c = P.coral) {
	const g = new THREE.Group();
	g.add(box(1.3 * s, 1.2 * s, { r: .12 * s, c, line: .07 }));
	const d = box(.9 * s, .55 * s, { r: .08 * s, c: '#5A3E5E', line: .05 }); d.position.y = -.15 * s; g.add(d);
	const fl = poly([[-.18, -.3], [0, .02], [.18, -.3]].map(([x, y]) => [x * s, y * s]), { c: P.forno, line: 0 }); g.add(fl);
	[-.35, 0, .35].forEach(x => { const k = disc(.07 * s, { c: P.creme, line: .03 }); k.position.set(x * s, .38 * s, 0); g.add(k); });
	g.userData.flame = fl; return g;
}
export function moon(s = 1, c = '#FFE9A8') {
	const pts = [];
	for (let i = 0; i <= 16; i++) { const a = Math.PI * (.35 + 1.3 * i / 16); pts.push([.6 * Math.cos(a) * s, .6 * Math.sin(a) * s]); }
	for (let i = 0; i <= 12; i++) { const a = Math.PI * (1.42 - .84 * i / 12); pts.push([(.3 + .48 * Math.cos(a)) * s, .48 * Math.sin(a) * s]); }
	const g = new THREE.Group(); g.add(poly(pts, { c, line: .05 }));
	const st = disc(.07 * s, { c: P.branco, line: 0 }); st.position.set(.45 * s, .45 * s, 0); g.add(st); return g;
}
export function cup(s = 1, c = P.branco) {
	const g = new THREE.Group();
	const h = mesh(new THREE.RingGeometry(.14 * s, .28 * s, 20, 1, -Math.PI / 2, Math.PI), P.tinta); h.position.set(.4 * s, .02 * s, 0); g.add(h);
	g.add(box(.8 * s, .8 * s, { r: .14 * s, c, line: .07 }));
	const cf = box(.62 * s, .1 * s, { r: .05 * s, c: '#6B3F2A', line: 0 }); cf.position.y = .3 * s; g.add(cf);
	const steam = [-.15, .15].map(x => { const l = limb(.07 * s, { c: P.creme, line: .03 }); g.add(l); return { l, x }; });
	g.tick = T => steam.forEach(({ l, x }, i) => { const u = (T * .8 + i * .5) % 1; l.set((x + Math.sin(u * 6) * .06) * s, (.55 + u * .3) * s, (x + Math.sin(u * 6 + 1.5) * .06) * s, (.75 + u * .3) * s); });
	return g;
}
// xícara de chá pequena (pires + xícara)
export function teacup(s = 1) {
	const g = new THREE.Group();
	const p = box(.7 * s, .1 * s, { r: .05 * s, c: P.branco, line: .04 }); p.position.y = -.22 * s; g.add(p);
	const h = mesh(new THREE.RingGeometry(.08 * s, .15 * s, 16, 1, -Math.PI / 2, Math.PI), P.tinta); h.position.set(.24 * s, 0, 0); g.add(h);
	g.add(box(.42 * s, .38 * s, { r: .1 * s, c: P.branco, line: .04 })); return g;
}
// calendário: g.setNum(i) troca a folha visível
export function calendar(nums, { w = 4, h = 4.4, head = 'SEMANA QUE VEM', hc = P.coral } = {}) {
	const g = new THREE.Group();
	g.add(box(w, h, { r: .2, c: P.branco, shadow: .16 }));
	const hp = plate([head], { w: w - .1, h: .85, bg: hc, fg: P.creme, shadow: 0, radius: .18 }); hp.position.y = h / 2 - .48; g.add(hp);
	[-1, 1].forEach(sx => { const r = box(.18, .55, { r: .09, c: P.tinta, line: 0 }); r.position.set(sx * w * .28, h / 2 + .05, 0); g.add(r); });
	const pages = nums.map(n => { const t = text(String(n), { w: w * .7, h: h * .62, fg: P.tinta }); t.position.y = -.4; g.add(t); return t; });
	g.setNum = (i, flip = 1) => pages.forEach((p, k) => { p.visible = k === i; p.scale.y = Math.max(.02, flip); });
	g.setNum(0); return g;
}
// balança de dois pratos: g.tilt(a) (a > 0 = lado direito desce)
export function balance(labels, { arm = 1.7, colors = [P.lilas, P.mostarda], word = 'PADEIRO' } = {}) {
	const g = new THREE.Group();
	const base = box(2.2, .38, { r: .15, c: P.tinta, line: 0 }); base.position.y = .2; g.add(base);
	const post = limb(.24, { c: P.cinza }); post.set(0, .3, 0, 4.7); g.add(post);
	const beam = limb(.22, { c: P.cinza }); g.add(beam);
	const piv = disc(.2, { c: P.forno, line: .06 }); piv.position.y = 4.7; g.add(piv);
	const pans = [-1, 1].map((sx, i) => {
		const pg = new THREE.Group(), s1 = limb(.05, { c: P.tinta, line: 0 }), s2 = limb(.05, { c: P.tinta, line: 0 });
		pg.add(s1, s2);
		const bowl = poly(Array.from({ length: 13 }, (_, k) => { const a = Math.PI + k / 12 * Math.PI; return [Math.cos(a) * .85, -1.3 + Math.sin(a) * .35]; }), { c: P.creme, line: .06 }); pg.add(bowl);
		const pl = plate([word], { w: 1.6, h: .55, bg: colors[i], fg: P.tinta, shadow: .08 }); pl.position.y = -.85; pg.add(pl);
		const lb = text(labels[i], { w: 1.8, h: .45, fg: P.tinta }); lb.position.y = -1.95; pg.add(lb);
		s1.set(0, 0, -.8, -1.3); s2.set(0, 0, .8, -1.3); g.add(pg); return pg;
	});
	g.tilt = a => { const ax = Math.cos(a) * arm, ay = -Math.sin(a) * arm; beam.set(-ax, 4.7 - ay, ax, 4.7 + ay); pans[0].position.set(-ax, 4.7 - ay, 0); pans[1].position.set(ax, 4.7 + ay, 0); };
	g.tilt(0); return g;
}
export function flashlight(s = 1, beamC = P.mostarda) {
	const g = new THREE.Group();
	const beam = poly([[.9, .32], [.9, -.32], [3.3, -1.15], [3.3, 1.15]].map(([x, y]) => [x * s, y * s]), { line: 0, fillMat: mat(beamC, .55) }); g.add(beam);
	g.add(box(1.3 * s, .5 * s, { r: .1 * s, c: P.cinza, line: .06 }));
	const hd = box(.4 * s, .78 * s, { r: .08 * s, c: P.tinta, line: 0 }); hd.position.x = .75 * s; g.add(hd);
	const bt = box(.22 * s, .14 * s, { r: .05 * s, c: P.coral, line: 0 }); bt.position.set(-.1 * s, .3 * s, 0); g.add(bt);
	g.userData.beam = beam; return g;
}
export function dumbbell(label, { w = 4.2 } = {}) {
	const g = new THREE.Group(), bar = limb(.3, { c: P.cinza }); bar.set(-w / 2, 0, w / 2, 0); g.add(bar);
	[-1, 1].forEach(sx => { const a = box(.55, 1.9, { r: .14, c: P.tinta, line: 0 }); a.position.x = sx * (w / 2 - .15); const b = box(.4, 1.35, { r: .12, c: P.coral, line: .06 }); b.position.x = sx * (w / 2 + .32); g.add(a, b); });
	const p = plate([label], { w: 2.6, h: .72, bg: P.creme, fg: P.tinta, shadow: .08 }); g.add(p); return g;
}
// casa com cara (telhado-cabelo, janelas-olhos) e cômodos vazios em corte
export function houseHead({ w = 8.4, h = 4.6, roof = P.cabelo, wall = P.coral, room = '#F6E3C4', rooms = 3 } = {}) {
	const g = new THREE.Group();
	g.add(poly([[-w / 2 - .3, h], [w / 2 + .3, h], [0, h + 2.4]], { c: roof, line: .08 }));
	const wl = box(w, h, { r: .1, c: wall, shadow: .16 }); wl.position.y = h / 2; g.add(wl);
	const eyes = [-1, 1].map(sx => { const e = new THREE.Group(); e.position.set(sx * .9, h + .85, 0); e.add(disc(.42, { c: P.branco, line: .07 })); const p = disc(.18, { c: P.tinta, line: 0 }); e.add(p); g.add(e); return { e, p }; });
	const rw = (w - .5 - (rooms - 1) * .25) / rooms, R = [];
	for (let i = 0; i < rooms; i++) {
		const r = box(rw, h - .7, { r: .08, c: room, line: .07 }); const x = -w / 2 + .25 + rw / 2 + i * (rw + .25); r.position.set(x, h / 2 - .05, 0); g.add(r);
		const cord = limb(.04, { c: P.tinta, line: 0 }); cord.set(x, h - .4, x, h - 1.0); g.add(cord);
		const bulb = disc(.16, { c: P.cinza, line: .05 }); bulb.position.set(x, h - 1.1, 0); g.add(bulb);
		R.push(x);
	}
	g.userData.rooms = R; g.userData.eyes = eyes; return g;
}
// ── acessórios de boneco (adicionar ao U de person()) ──
export function mustache(U, c = P.cabelo) { const m = poly([[-.55, -.28], [-.1, -.18], [0, -.24], [.1, -.18], [.55, -.28], [.4, -.45], [0, -.36], [-.4, -.45]], { c, line: .04 }); U.head.add(m); return m; }
export function bakerHat(U) {
	const g = new THREE.Group(); g.position.y = .78; U.head.add(g);
	[[-.45, .45, .42], [0, .7, .5], [.45, .45, .42]].forEach(([x, y, r]) => { const d = disc(r, { c: P.branco, line: .07 }); d.position.set(x, y, 0); g.add(d); });
	g.add(box(1.5, .42, { r: .1, c: P.branco, line: .07 })); return g;
}
export function apron(U, c = P.coral) {
	const g = new THREE.Group(); g.position.y = .95; U.body.add(g);
	const st = limb(.1, { c, line: .04 }); st.set(-.35, 1.45, .35, 1.45); g.add(st);
	g.add(box(1.25, 1.7, { r: .2, c, line: .06 }));
	const pk = box(.6, .35, { r: .08, c: P.creme, line: .04 }); pk.position.y = -.3; g.add(pk); return g;
}
export function longHair(U, c) { [-1, 1].forEach(sx => { const b = box(.42, 1.5, { r: .2, c, line: .05 }); b.position.set(sx * .9, -.55, 0); U.head.add(b); }); }
