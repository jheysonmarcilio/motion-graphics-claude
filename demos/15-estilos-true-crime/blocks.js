// Os 8 blocos "alternados" do 15: flat × brinquedo 3D × colagem de papel × neural luminoso, duas vezes cada.
// Cada builder devolve { scene, camera, tick(T) } com T = tempo ABSOLUTO do vídeo. ctx = { tw(palavra, n), t0, t1 }.
import * as THREE from 'three';
import { clamp, seg, lerp, ease, pop, gone, smooth, mulberry32, wobble } from './lib.js';
import * as F from './flat.js';
import * as Y from './toy.js';
import * as Pa from './paper.js';

const show = (o, k) => { o.visible = k > .004; o.scale.setScalar(Math.max(k, 1e-4)); };
const ortho = () => { const c = new THREE.OrthographicCamera(-9.6, 9.6, 5.4, -5.4, .1, 200); c.position.z = 50; return c; };
const drift = (cam, T, t0, t1) => { cam.position.set(Math.sin(T * .35) * .3, Math.cos(T * .27) * .18, 50); cam.zoom = 1 + .07 * seg(T, t0, t1); cam.updateProjectionMatrix(); };
const bgPlane = (c) => F.mesh(new THREE.PlaneGeometry(60, 40), c);

// ───────────────────────── FLAT ─────────────────────────
export function flatA({ tw, t0, t1 }) {
	const scene = new THREE.Scene(), cam = ortho();
	scene.add(bgPlane(F.P.cobalto));
	const dots = Array.from({ length: 14 }, (_, i) => { const d = F.disc(.3 + (i % 4) * .2, { c: '#4A63FF', line: 0 }); d.userData.p = [((i * 5.3) % 19) - 9.5, ((i * 3.7) % 10) - 5]; scene.add(d); return d; });
	const p = F.person({ shirt: F.P.amarelo }); p.g.scale.setScalar(.85); scene.add(p.g);
	const pol = F.polaroid(1.5); scene.add(pol);
	const pl1 = F.plate(['100% CONFIÁVEL?'], { w: 5.6, h: 1.2, bg: F.P.amarelo, fg: F.P.tinta }); scene.add(pl1);
	const q = F.text('?', { w: 1.6, h: 1.6, fg: F.P.amarelo, stroke: .08 }); scene.add(q);
	const stars = [0, 1, 2, 3].map(i => { const s = F.star(.4 + (i % 2) * .15); scene.add(s); return s; });
	const A = tw('todo'), B = tw('mas'), C = tw('reescrevendo');
	return {
		scene, camera: cam,
		tick(T) {
			drift(cam, T, t0, t1);
			dots.forEach((d, i) => d.position.set(d.userData.p[0] + Math.sin(T * .4 + i) * .5, d.userData.p[1] + Math.cos(T * .33 + i * 2) * .4, 0));
			const k = pop(T, .2, .5); p.g.position.set(-4.7 + (1 - ease.expoOut(seg(T, 0, .7))) * -6, -.9 + Math.sin(T * 2.2) * .06, 0);
			p.g.setPose({ ra: T > A - .1 && T < B + .2 ? [1.7, .35 + Math.sin(T * 5) * .15] : [.22, .12], look: [1, 0], blink: 0, mouth: T < B ? 'smile' : 'o', brow: T < B ? 0 : 1 });
			pol.position.set(3.4, .5 + Math.sin(T * 1.3) * .15, 0); pol.rotation.z = Math.sin(T * 1.1) * .06; show(pol, pop(T, .5, .5));
			pol.charge(T < C - .5 ? 1 : .5 + .5 * Math.sin((T - C) * 5));
			pl1.position.set(3.4, 3.6, 0); show(pl1, pop(T, A, .4) * gone(T, B, .2));
			q.position.set(-2.9, 2.2 + Math.sin(T * 3) * .1, 0); show(q, pop(T, B + .1, .4)); q.rotation.z = Math.sin(T * 4) * .12;
			stars.forEach((s, i) => { const a = i * 1.57 + .6; s.position.set(3.4 + Math.cos(a + T) * 2.2, -.2 + Math.sin(a + T) * 2, 0); s.rotation.z = T * 2; show(s, pop(T, C + i * .12, .3)); });
		},
	};
}

function car(color) {
	const g = new THREE.Group(), body = F.box(3.8, 1.1, { r: .4, c: color }), cab = F.box(2.1, 1, { r: .35, c: F.P.creme }), w1 = F.disc(.5, { c: F.P.tinta }), w2 = F.disc(.5, { c: F.P.tinta });
	cab.position.set(-.1, .95, 0); body.position.y = .2; w1.position.set(-1.2, -.4, 0); w2.position.set(1.2, -.4, 0);
	const h1 = F.disc(.2, { c: F.P.cinza, line: .05 }), h2 = F.disc(.2, { c: F.P.cinza, line: .05 }); h1.position.copy(w1.position); h2.position.copy(w2.position);
	g.add(cab, body, w1, w2, h1, h2); g.userData.w = [w1, w2]; return g;
}
export function flatB({ tw, t0, t1 }) {
	const scene = new THREE.Scene(), cam = ortho();
	scene.add(bgPlane(F.P.creme));
	const road = F.box(30, 1.3, { r: 0, c: F.P.cinza, line: 0 }); road.position.y = -1.3; scene.add(road);
	const lp = F.person({ shirt: F.P.coral, coat: true, glasses: true }); lp.g.scale.setScalar(.8); lp.g.position.set(-7.2, -.9, 0); scene.add(lp.g);
	const name = F.plate(['ELIZABETH LOFTUS', 'psicóloga · 1974'], { w: 4.6, h: 1.4, bg: F.P.cobalto }); name.position.set(-7.2, 3.3, 0); scene.add(name);
	const c1 = car(F.P.coral), c2 = car(F.P.amarelo); c2.scale.x = -1; scene.add(c1, c2);
	const boom = F.star(1.1, F.P.amarelo); scene.add(boom);
	const hit = tw('acidentes') + .5, Q1 = tw('bateram'), Q2 = tw('esmagaram');
	const bars = [[F.P.calmo, 31.8, 'BATERAM'], [F.P.coral, 40.8, 'ESMAGARAM']].map(([c, v, l], i) => {
		const g = new THREE.Group(), b = F.box(2.2, 1, { r: .15, c }), lab = F.plate([l], { w: 2.9, h: .8, bg: F.P.tinta, fg: F.P.creme }), val = F.text(`${v.toFixed(0)} mph`, { w: 2.4, h: .9, fg: F.P.tinta });
		g.add(b, lab, val); g.userData = { b, lab, val, v }; g.position.set(3 + i * 3.6, -1.2, 0); scene.add(g); return g;
	});
	const note = F.text('média das estimativas · Loftus & Palmer, 1974', { w: 6.8, h: .6, fg: F.P.cinza, weight: 700 }); note.position.set(4.8, 3.5, 0); scene.add(note);
	const ques = F.plate(['A QUE VELOCIDADE?'], { w: 6, h: 1.2, bg: F.P.tinta, fg: F.P.amarelo }); ques.position.set(4.8, 4.5, 0); scene.add(ques);
	return {
		scene, camera: cam,
		tick(T) {
			drift(cam, T, t0, t1);
			lp.g.setPose({ ra: [.9, .5 + Math.sin(T * 3) * .1], look: [1, 0], blink: 0, mouth: 'smile' }); show(name, pop(T, tw('elizabeth'), .4));
			const run = clamp((T - (hit - 2.2)) / 2.2), cx = lerp(-3.2, .0, ease.expoOut(run)), crash = T > hit;
			const vis = T < Q1 - .3 ? 1 : 0;
			c1.visible = c2.visible = vis > 0;
			c1.position.set(lerp(-10, -1.9, ease.cubicOut(Math.min(1, run * 1.15))) - (crash ? Math.min(.5, (T - hit) * 1.5) : 0), 0 + (crash ? Math.sin((T - hit) * 30) * .06 * (1 - seg(T, hit, hit + .6)) : 0), 0);
			c2.position.set(lerp(10, 1.9, ease.cubicOut(Math.min(1, run * 1.15))) + (crash ? Math.min(.5, (T - hit) * 1.5) : 0), 0, 0);
			c1.userData.w.concat(c2.userData.w).forEach(w => w.rotation.z = -T * 8);
			show(boom, crash && vis ? pop(T, hit, .3) * gone(T, hit + 1.2, .3) : 0); boom.position.set(0, .6, 0); boom.rotation.z = T * 3;
			bars.forEach((g, i) => { const t = i ? Q2 : Q1, k = pop(T, t, .4), h = g.userData.v / 10 * .8 * ease.cubicOut(seg(T, t + .2, t + 1.1)) + .01;
				g.userData.b.scale.y = h; g.userData.b.position.y = h / 2 - .5; g.userData.lab.position.set(0, -.9, 0); g.userData.val.position.y = h + .1 - .5 + .7; show(g, k); });
			show(ques, pop(T, Q1 - .6, .4)); show(note, pop(T, Q2 + 1, .4));
		},
	};
}

// ───────────────────────── TOY (3D de brinquedo) ─────────────────────────
function toyWorld(bg, floorC) {
	const scene = new THREE.Scene(); scene.background = new THREE.Color(bg); scene.fog = new THREE.Fog(bg, 18, 40);
	scene.add(new THREE.HemisphereLight('#ffffff', '#C9B7FF', 1.5));
	const d = new THREE.DirectionalLight('#ffffff', 2.4); d.position.set(5, 9, 6); scene.add(d);
	const fl = new THREE.Mesh(new THREE.CircleGeometry(30, 48), new THREE.MeshStandardMaterial({ color: floorC, roughness: .9 })); fl.rotation.x = -Math.PI / 2; scene.add(fl);
	const cam = new THREE.PerspectiveCamera(36, 16 / 9, .1, 100);
	return { scene, cam };
}
const blob = (x, z, r = .6) => { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 24), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .16 })); m.rotation.x = -Math.PI / 2; m.position.set(x, .012, z); return m; };
const wobbleOrbit = (cam, T, t0, t1, r = 10, h = 3.2, look = [0, 1.1, 0], amp = .35) => { const a = Math.sin((T - t0) * .22) * amp; cam.position.set(Math.sin(a) * r, h + seg(T, t0, t1) * -.6, Math.cos(a) * r); cam.lookAt(...look); };

export function toyA({ tw, t0, t1 }) {
	const { scene, cam } = toyWorld('#FFB38A', '#FFE3CF');
	const hero = Y.toy({ shirt: '#4A7BF7', hairStyle: 'bun', hair: '#5B3A29' }); hero.g.position.set(-3.2, 0, 1); hero.g.scale.setScalar(1.8); scene.add(hero.g, blob(-3.2, 1, 1));
	const cab = new THREE.Group(); const cb = Y.box(1.5, 2.2, 1.1, '#9FA8C9'); cb.position.y = 1.1; cab.add(cb);
	const drs = [0, 1, 2].map(i => { const d = Y.box(1.3, .6, .1, '#C9D0EA'); d.position.set(0, .45 + i * .7, .58); cab.add(d); const h = Y.box(.4, .08, .08, '#4A4F6B'); h.position.set(0, .45 + i * .7, .66); cab.add(h); return d; });
	cab.position.set(.2, 0, 0); scene.add(cab, blob(.2, 0, 1.1));
	const no = Y.iconBadge('x', '#F0524A', 1.5); no.position.set(1.7, 3.4, .9); scene.add(no);
	const sgn = Y.sign(['ARQUIVO'], 2.6, { bg: '#FFF6E8', fg: '#1F2340' }); sgn.position.set(.2, 2.5 - .0, .7); scene.add(sgn); sgn.position.y = 2.65;
	const sg2 = Y.sign(['RECONSTRUÇÃO'], 4.2, { bg: '#FFD23F', fg: '#1F2340' }); sg2.position.set(3.3, 3.6, 0); scene.add(sg2);
	const cols = ['#4A7BF7', '#FF7A45', '#4CCB7A', '#FFD23F', '#F0524A', '#B9A7FF', '#4A7BF7', '#FF7A45', '#4CCB7A'];
	const lay = [[-.9, .4], [0, .4], [.9, .4], [1.8, .4], [-.45, 1.2], [.45, 1.2], [1.35, 1.2], [0, 2], [.9, 2]];
	const blocks = lay.map(([x, y], i) => { const b = Y.box(.85, .8, .85, cols[i], .1); b.userData = { x: x + 3.4, y, r: (i * 1.7) % 1 - .5 }; scene.add(b); return b; });
	const roof = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, .9, 3), Y.mat('#F0524A')); roof.rotation.set(0, 0, Math.PI / 2); roof.rotation.order = 'ZYX'; roof.rotation.y = 0; roof.userData = { x: 3.4 + .45, y: 2.85 };
	roof.rotation.set(Math.PI / 2, 0, Math.PI / 2); scene.add(roof);
	const nao = tw('arquivo'), rec = tw('reconstrói'), mont = tw('montar');
	return {
		scene, camera: cam,
		tick(T) {
			wobbleOrbit(cam, T, t0, t1, 11, 3.4, [.3, 1.5, 0]);
			hero.g.position.y = Math.sin(T * 2) * .03; hero.pose(); hero.face({ eyes: Y.blink(T, 1), mouth: T < rec ? 'o' : 'smile', brow: T < rec ? .8 : 0 });
			hero.head.rotation.y = -.5 + Math.sin(T * .8) * .12; hero.arms[1].rotation.z = T > rec ? -1.4 + Math.sin(T * 4) * .2 : .12;
			const cp = pop(T, nao - .4, .5) * gone(T, rec + .3, .35); show(cab, cp); drs[1].position.z = .58 + .5 * smooth(T, nao + .3, nao + .9); drs[1].position.y = .45 + .7;
			show(no, pop(T, nao + .4, .4) * gone(T, rec + .3, .3)); show(sgn, pop(T, nao - .2, .4) * gone(T, rec + .3, .3)); show(sg2, pop(T, rec + .1, .5));
			blocks.forEach((b, i) => { const t = rec + .2 + i * .33, u = seg(T, t, t + .55), k = ease.expoOut(u); b.visible = T > t - .01; b.position.set(b.userData.x, b.userData.y + (1 - k) * 7, 0); b.rotation.y = (1 - k) * b.userData.r * 3; const sq = 1 + Math.sin(clamp((T - t - .5) / .25) * Math.PI) * .1; b.scale.set(1 / sq, sq, 1 / sq); });
			const ru = pop(T, rec + 3.0, .5); roof.visible = ru > .01; roof.position.set(roof.userData.x, roof.userData.y + (1 - Math.min(1, ru)) * 3, 0); roof.scale.setScalar(Math.max(.01, ru));
		},
	};
}

export function toyB({ tw, t0, t1 }) {
	const { scene, cam } = toyWorld('#9FE2BF', '#E6FFF1');
	const mk = (h, c, label, x) => { const g = new THREE.Group(); const n = Math.round(h); for (let i = 0; i < n; i++) { const b = Y.box(1.1, .6, 1.1, c, .12); b.position.y = .3 + i * .6; b.userData.i = i; g.add(b); } const s = Y.sign([label], 2.6, { bg: '#FFF6E8', fg: '#1F2340' }); s.position.set(0, 0, 1.2); s.rotation.x = -.5; s.position.y = .35; g.add(s); g.position.x = x; g.userData.s = s; return g; };
	const t1_ = mk(6, '#4A7BF7', 'BATERAM', -6.4), t2_ = mk(8, '#F0524A', 'ESMAGARAM', -3.0); scene.add(t1_, t2_);
	const wit = [['#FF7A45', 1.6], ['#4CCB7A', 3.8], ['#B9A7FF', 5.8]].map(([c, x], i) => { const w = Y.toy({ shirt: c, hairStyle: i === 1 ? 'fringe' : 'bun', glasses: i === 2 }); w.g.scale.setScalar(1.6); w.g.position.set(x, 0, .5 - i * .2); w.g.rotation.y = -.5; scene.add(w.g, blob(x, .5 - i * .2, .9)); return w; });
	const balloon = new THREE.Group(); const bb = new THREE.Mesh(new THREE.SphereGeometry(1.6, 32, 20), new THREE.MeshStandardMaterial({ color: '#fff', roughness: .5, transparent: true, opacity: .92 })); bb.scale.set(1.35, 1, .5); balloon.add(bb);
	const shards = Array.from({ length: 22 }, (_, i) => { const r = mulberry32(i + 5), m = new THREE.Mesh(new THREE.TetrahedronGeometry(.16 + r() * .14), new THREE.MeshStandardMaterial({ color: '#7FD6FF', roughness: .05, metalness: .3, emissive: '#2A9BD6', emissiveIntensity: .5 })); m.userData = { a: r() * 6.28, rr: .3 + r() * 1.1, y: (r() - .5) * 1.3, s: r() * 3 + 1 }; balloon.add(m); return m; });
	balloon.position.set(3.7, 4.3, .6); scene.add(balloon);
	const zero = Y.sign(['VIDRO: 0'], 3.4, { bg: '#FFD23F', fg: '#1F2340' }); zero.position.set(3.7, 4.3, 1.2); scene.add(zero);
	const nope = Y.iconBadge('x', '#F0524A', 1.4); nope.position.set(5.6, 5.2, 1.3); scene.add(nope);
	const vid = tw('vidro'), nen = tw('nenhum'), esm = tw('esmagaram', 1), sem = tw('semana');
	return {
		scene, camera: cam,
		tick(T) {
			const pan = smooth(T, sem - .4, sem + .6);
			const a = Math.sin((T - t0) * .22) * .25; cam.position.set(lerp(-2.4, 3.5, pan) + Math.sin(a) * 9, 3.6 + (T - t0) * -.02, 10.5); cam.lookAt(lerp(-3.6, 3.6, pan), lerp(1.2, 1.5, pan), 0);
			[[t1_, t0 + .4], [t2_, esm + .1]].forEach(([g, ts]) => { g.visible = T > ts - .2; g.children.forEach(b => { if (b.userData.i == null) return; const t = ts + b.userData.i * .12, u = seg(T, t, t + .4); b.visible = T > t; b.position.y = .3 + b.userData.i * .6 + (1 - ease.expoOut(u)) * 5; }); g.userData.s.visible = T > ts + .6; });
			wit.forEach((w, i) => { w.pose(); w.face({ eyes: Y.blink(T, i), mouth: T > vid ? 'o' : 'smile', brow: T > vid ? .8 : 0 }); w.g.position.y = Math.abs(Math.sin(T * 2 + i)) * .03; w.g.visible = T > sem - 1.3 - i * .1; w.g.scale.setScalar(1.6 * Math.max(.01, pop(T, sem - 1.3 + i * .2, .4))); });
			const bk = pop(T, vid - .5, .5) * gone(T, nen + .1, .25); show(balloon, bk * .6);
			shards.forEach(s => { const a = s.userData.a + T * s.userData.s * .4; s.position.set(Math.cos(a) * s.userData.rr * 1.4, s.userData.y + Math.sin(T * 2 + s.userData.s) * .1, .95 + Math.sin(a) * .1); s.rotation.set(T * 2, T * s.userData.s, 0); });
			show(zero, pop(T, nen, .4)); show(nope, pop(T, nen + .25, .4));
		},
	};
}

// ───────────────────────── PAPEL (colagem) ─────────────────────────
function paperWorld(bg) {
	const scene = new THREE.Scene(); scene.background = new THREE.Color(bg);
	scene.add(new THREE.AmbientLight('#fff', 1.5)); const d = new THREE.DirectionalLight('#fff', 1.4); d.position.set(-3, 6, 8); scene.add(d);
	const cam = new THREE.PerspectiveCamera(40, 16 / 9, .1, 100);
	const board = Pa.sheet('board' + bg, 22, 13, Pa.C.kraft, { seed: 4, deco: (g, r) => { g.fillStyle = 'rgba(80,50,20,.10)'; for (let i = 0; i < 400; i++) g.fillRect((r() - .5) * 22, (r() - .5) * 13, .05 + r() * .06, .05 + r() * .06); } });
	board.position.z = -1; scene.add(board); return { scene, cam };
}
function housePhoto(sunny = true) {
	return Pa.cut('house' + sunny, 5.6, 4.2, g => {
		g.fillStyle = sunny ? '#A9D8FF' : '#B9B2C9'; g.fillRect(-2.7, -2.0, 5.4, 4.0);
		g.fillStyle = '#7FD1AE'; g.fillRect(-2.7, 1.0, 5.4, 1.0);
		g.fillStyle = '#F7A1B5'; g.fillRect(-1.2, -.3, 2.4, 1.4); g.fillStyle = '#E63946'; g.beginPath(); g.moveTo(-1.5, -.3); g.lineTo(0, -1.4); g.lineTo(1.5, -.3); g.fill();
		g.fillStyle = '#FFD23F'; g.fillRect(-.2, .45, .5, .95); g.fillRect(.65, -.05, .4, .4); g.fillRect(-1.0, -.05, .4, .4);
		g.fillStyle = '#FFD23F'; g.beginPath(); g.arc(2.0, -1.4, .38, 0, 7); g.fill();
	}, { border: .14 });
}
export function paperA({ tw, t0, t1 }) {
	const { scene, cam } = paperWorld('#C9A27A');
	const ph = housePhoto(); ph.position.set(-3.2, .2, 0); scene.add(ph);
	const ttl = Pa.textCut('t1', 'DETALHES EXTRAS', { size: .6, bg: Pa.C.amar, color: Pa.C.tinta }); ttl.position.set(3.6, 3.7, .4); scene.add(ttl);
	const notes = [['CHEIRO DE BOLO', 'cheiro', Pa.C.rosa, [-3.2, 2.6]], ['UMA COR', 'cor', Pa.C.menta, [-5.2, -1.2]], ['UM ROSTO', 'rosto', Pa.C.azulc, [-.9, -1.1]]].map(([t, w, c, [x, y]], i) => {
		const m = Pa.textCut('n' + t, t, { size: .5, bg: c, tape: true }); m.userData = { t: tw(w), x, y, rot: (i - 1) * .12, i }; m.position.z = .3 + i * .05; scene.add(m); return m;
	});
	const face = Pa.cut('face1', 2.2, 2.6, g => { Pa.circle(g, 0, -.2, .9, '#F2C7A5', Pa.C.tinta, .06); Pa.circle(g, -.3, -.3, .08, Pa.C.tinta); Pa.circle(g, .3, -.3, .08, Pa.C.tinta); g.strokeStyle = Pa.C.tinta; g.lineWidth = .06; g.beginPath(); g.arc(0, -.05, .35, .2, 2.9); g.stroke(); Pa.txt(g, '?', 0, 1.0, .5, { color: Pa.C.verm }); }, { border: .1 });
	face.position.set(3.6, -.6, .2); scene.add(face);
	return {
		scene, camera: cam,
		tick(T) {
			const u = (T - t0) / (t1 - t0); cam.position.set(Math.sin(u * 2) * 1.2, -.6 + u * .8, 13 - u * 1.2); cam.lookAt(0, 0, 0);
			show(ph, pop(T, t0 + .1, .6)); ph.rotation.z = Math.sin(T * .8) * .015 - .03;
			show(ttl, pop(T, tw('detalhes'), .4)); ttl.rotation.z = .04;
			notes.forEach(m => { const k = ease.expoOut(seg(T, m.userData.t - .1, m.userData.t + .35)); m.visible = k > .01; m.scale.setScalar(Math.max(.01, 2.2 - 1.2 * k)); m.position.x = m.userData.x; m.position.y = m.userData.y + (1 - k) * 2.5; m.rotation.z = m.userData.rot + (1 - k) * .5; });
			show(face, pop(T, tw('rosto') + .3, .5)); face.rotation.z = .08 + Math.sin(T * 1.2) * .02;
		},
	};
}

export function paperB({ tw, t0, t1 }) {
	const { scene, cam } = paperWorld('#D8C7F2');
	const strip = Pa.textCut('q1', 'A QUE VELOCIDADE OS CARROS', { size: .62, bg: Pa.C.creme, color: Pa.C.tinta }); strip.position.set(0, 2.4, .1); scene.add(strip);
	const w1 = Pa.textCut('q2', 'BATERAM', { size: .9, bg: Pa.C.azulc, color: Pa.C.tinta }); w1.position.set(0, .6, .2); scene.add(w1);
	const w2 = Pa.textCut('q3', 'ESMAGARAM', { size: .8, bg: Pa.C.verm, color: '#fff', tape: true }); w2.position.set(0, .6, .5); w2.rotation.z = -.05; scene.add(w2);
	const x = Pa.ribbon(Pa.handPath([[-2.2, 1.1], [2.2, .1]], { step: .08, jitter: .03 }), .16, Pa.C.verm); x.position.z = .3; scene.add(x);
	const ph = housePhoto(true), ph2 = housePhoto(false); ph.position.set(-5.4, -.9, .2); ph2.position.set(-5.4, -.9, .25); ph.scale.setScalar(.6); ph2.scale.setScalar(.6); scene.add(ph, ph2);
	const glass = Pa.cut('gl', 2.4, 1.6, g => { g.fillStyle = '#7FD6FF'; for (let i = 0; i < 9; i++) { const a = i * .7; g.beginPath(); g.moveTo(Math.cos(a) * .2, Math.sin(a) * .2); g.lineTo(Math.cos(a + .3) * (.5 + (i % 3) * .2), Math.sin(a + .3) * (.4 + (i % 2) * .3)); g.lineTo(Math.cos(a - .2) * .6, Math.sin(a - .2) * .5); g.fill(); } }, { border: .05 });
	glass.position.set(-5.4, -.9, .35); scene.add(glass);
	const sad = Pa.cut('nm', 2.2, 2.4, g => { Pa.circle(g, 0, 0, .85, '#F2C7A5', Pa.C.tinta, .06); Pa.circle(g, -.3, -.15, .08, Pa.C.tinta); Pa.circle(g, .3, -.15, .08, Pa.C.tinta); g.fillStyle = Pa.C.tinta; g.fillRect(-.25, .3, .5, .07); }, { border: .1 });
	sad.position.set(4.6, -.9, .3); scene.add(sad);
	const bal = Pa.textCut('b1', 'nem percebeu...', { size: .4, bg: '#fff', color: Pa.C.tinta, font: Pa.FONT.sans, weight: '800' }); bal.position.set(4.6, .6, .4); scene.add(bal);
	const mk = Pa.ribbon(Pa.handPath(Pa.arcPts(0, .6, 2.0, .8, 0, 6.3, 30), { step: .12, jitter: .03 }), .1, '#FFD23F'); mk.position.z = .15; scene.add(mk);
	const U = tw('única'), E = tw('editou'), N = tw('nem');
	return {
		scene, camera: cam,
		tick(T) {
			const u = (T - t0) / (t1 - t0); cam.position.set(Math.sin(u * 2.4 + 1) * 1.0, .2 - u * .5, 12.5 - u); cam.lookAt(0, .3, 0);
			show(strip, pop(T, t0 + .1, .5)); show(w1, pop(T, t0 + .3, .5) * (1 - seg(T, E + .5, E + .6)));
			mk.reveal(ease.cubicInOut(seg(T, U, U + .9))); mk.visible = mk.visible && T < E + .6;
			x.reveal(ease.cubicOut(seg(T, E, E + .35))); x.visible = x.visible && T < E + .6;
			w2.visible = T > E + .35; show(w2, pop(T, E + .35, .35)); w2.position.y = .6 - 0;
			const ch = smooth(T, E + .4, E + 1.2); ph.visible = ch < .5; ph2.visible = ch >= .5; glass.visible = ch > .5; show(glass, ch > .5 ? pop(T, E + .9, .4) : 0);
			ph.scale.setScalar(.6 * (T > t0 + 1 ? 1 : pop(T, t0, .5) + .0001)); ph2.scale.setScalar(.6);
			show(sad, pop(T, N - .2, .5)); sad.rotation.z = Math.sin(T * 1.5) * .05; show(bal, pop(T, N + .2, .4));
		},
	};
}

// ───────────────────────── NEURAL LUMINOSO ─────────────────────────
function dotTex() { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); return t; }
function neural(seed, { tw, t0, t1 }, opt) {
	const scene = new THREE.Scene(); scene.background = new THREE.Color('#04060E');
	const cam = new THREE.PerspectiveCamera(45, 16 / 9, .1, 100), r = mulberry32(seed), N = 280;
	const P = [], base = []; for (let i = 0; i < N; i++) { let x, y, z; do { x = r() * 2 - 1; y = r() * 2 - 1; z = r() * 2 - 1; } while (x * x + y * y + z * z > 1); P.push(new THREE.Vector3(x * 4.4, y * 2.9, z * 2.6)); base.push(P[i].clone()); }
	const E = []; for (let i = 0; i < N; i++) { const d = P.map((p, j) => [p.distanceToSquared(P[i]), j]).sort((a, b) => a[0] - b[0]); for (let k = 1; k <= 3; k++) if (i < d[k][1]) E.push([i, d[k][1]]); }
	const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), lpos = new Float32Array(E.length * 6), lcol = new Float32Array(E.length * 6);
	const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('color', new THREE.BufferAttribute(col, 3));
	const pts = new THREE.Points(pg, new THREE.PointsMaterial({ size: .5, map: dotTex(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true })); pts.frustumCulled = false; scene.add(pts);
	const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(lpos, 3)); lg.setAttribute('color', new THREE.BufferAttribute(lcol, 3));
	const ln = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); ln.frustumCulled = false; scene.add(ln);
	const cA = new THREE.Color(opt.c0), cB = new THREE.Color(opt.c1), cC = new THREE.Color(opt.c2 || opt.c1), tmp = new THREE.Color(), hot = new THREE.Color('#fff');
	const waves = opt.waves.map(w => ({ t: w[0], src: w[1] % N }));
	const lbl = F.mesh; // (apenas para manter a assinatura do kit; texto vem da legenda)
	return {
		scene, camera: cam,
		tick(T) {
			const u = (T - t0) / (t1 - t0), ang = u * 1.1 - .3; cam.position.set(Math.sin(ang) * 9.5, 1 + Math.sin(T * .3) * .6, Math.cos(ang) * 9.5 - u * 1.5); cam.lookAt(0, 0, 0);
			const stretch = opt.future ? 1 + 2.2 * smooth(T, opt.future, opt.future + 1.6) : 1, red = opt.costly ? smooth(T, opt.costly, opt.costly + .8) : 0, hue = opt.hue ? smooth(T, opt.hue, opt.hue + 2.2) : 0;
			const b = new Float32Array(N);
			for (let i = 0; i < N; i++) {
				const bp = base[i]; P[i].set(bp.x * (1 + (stretch - 1) * .25), bp.y, bp.z * stretch - (stretch - 1) * 2 + Math.sin(T * .5 + i) * .08);
				let v = .22 + .12 * Math.sin(T * 1.2 + i * 1.7);
				for (const w of waves) { const d = P[i].distanceTo(base[w.src]), f = (T - w.t) * 5.5; if (f > 0 && f < 14) v += Math.exp(-((d - f) ** 2) / .9) * Math.exp(-f * .09) * 1.4; }
				b[i] = v; tmp.copy(cA).lerp(cB, hue * (.4 + .6 * ((i * .37) % 1))).lerp(cC, red); tmp.lerp(hot, Math.min(1, Math.max(0, v - .9) * .6));
				pos.set([P[i].x, P[i].y, P[i].z], i * 3); col.set([tmp.r * v, tmp.g * v, tmp.b * v], i * 3);
			}
			E.forEach(([a, c], k) => { lpos.set([P[a].x, P[a].y, P[a].z, P[c].x, P[c].y, P[c].z], k * 6); const v = (b[a] + b[c]) * .32; tmp.copy(cA).lerp(cB, hue * .6).lerp(cC, red); lcol.set([tmp.r * v, tmp.g * v, tmp.b * v, tmp.r * v, tmp.g * v, tmp.b * v], k * 6); });
			pg.attributes.position.needsUpdate = pg.attributes.color.needsUpdate = lg.attributes.position.needsUpdate = lg.attributes.color.needsUpdate = true;
		},
	};
}
export const neuralA = ctx => neural(11, ctx, { c0: '#4FD8FF', c1: '#B06CFF', hue: ctx.tw('muda') - 1.2, waves: [[ctx.t0 + .3, 3], [ctx.tw('acende'), 40], [ctx.tw('cada'), 90], [ctx.tw('cada') + 1.3, 200]] });
export const neuralB = ctx => neural(23, ctx, { c0: '#FFD36A', c1: '#4FD8FF', c2: '#FF3B4E', future: ctx.tw('futuro') - .8, costly: ctx.tw('caro') - .2, waves: [[ctx.t0 + .3, 7], [ctx.tw('aprender'), 120], [ctx.tw('imaginar'), 220], [ctx.tw('lugar'), 5]] });
