// Cenas do Short 23 (true crime 9:16). Cada set é um grupo com tick(T) (T absoluto); a lista SH define os planos.
import * as THREE from 'three';
import { clamp, seg, lerp, ease, pop, mulberry32, canvasTex } from './lib.js';
import { CC, textPlane, stamp, slam, silhouette, rainLines, glow, building, wall } from './crime.js';
import { AMB, MONO, COND, fileCard, helix, cork, yarn, house, car, screen, tube, ghost, coatMan, tapeStrip, bag, spotCone, counter, dust, typeLine } from './caso.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const appear = (o, k) => { o.visible = k > .003; o.scale.setScalar(Math.max(1e-4, k)); };
const win = (T, a, b) => T >= a && T < b;
function ground(color = '#0E1418', w = 80, d = 80, rough = .3, metal = .5) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal })); m.rotation.x = -Math.PI / 2; return m; }
const flat = (m, x, y, z, rz = 0) => { m.rotation.set(-Math.PI / 2, 0, rz); m.position.set(x, y, z); return m; };
const woodTex = (seed) => { const r = mulberry32(seed); return canvasTex(1024, 1024, (g, w, h) => { g.fillStyle = '#1d140d'; g.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { g.strokeStyle = `rgba(${60 + r() * 40},${40 + r() * 25},20,${.15 + r() * .25})`; g.lineWidth = 1 + r() * 3; const y = r() * h; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * .3, y + (r() - .5) * 30, w * .6, y + (r() - .5) * 30, w, y + (r() - .5) * 20); g.stroke(); } }); };
const table = (seed, size = 14) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshStandardMaterial({ map: woodTex(seed), roughness: .7 })); m.rotation.x = -Math.PI / 2; return m; };
const tag = (t, w, h, o = {}) => textPlane(t, w, h, { font: MONO, weight: '400', color: AMB, bg: 'rgba(7,9,12,.78)', border: AMB, ...o });

// ── 1 · porta: rua em neblina, o contorno vazio no vão iluminado ──
function setPorta() {
	const g = new THREE.Group();
	g.add(new THREE.HemisphereLight('#5a7080', '#050708', .7));
	const fac = wall(18, 12, (c, w, h) => { c.fillStyle = '#121a1f'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 3; for (let y = 0; y < h; y += h / 44) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } });
	fac.position.set(0, 5, 0); g.add(fac);
	const door = wall(1.5, 2.7, (c, w, h) => { const gr = c.createRadialGradient(w / 2, h * .45, 4, w / 2, h * .5, h * .7); gr.addColorStop(0, '#ffd89a'); gr.addColorStop(.5, '#e08a22'); gr.addColorStop(1, '#3a1d06'); c.fillStyle = gr; c.fillRect(0, 0, w, h); });
	door.position.set(0, 1.35, .02); g.add(door);
	[-1, 1].forEach(s => { const f = new THREE.Mesh(new THREE.BoxGeometry(.16, 2.9, .3), new THREE.MeshBasicMaterial({ color: '#05070a' })); f.position.set(s * .83, 1.42, .1); g.add(f); });
	const lint = new THREE.Mesh(new THREE.BoxGeometry(1.82, .16, .3), new THREE.MeshBasicMaterial({ color: '#05070a' })); lint.position.set(0, 2.82, .1); g.add(lint);
	[-3.6, 3.6].forEach(x => { const wi = wall(1.5, 1.2, (c, w, h) => { c.fillStyle = '#b8701c'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(10,8,5,.75)'; for (let y = 0; y < h; y += h / 9) c.fillRect(0, y, w, h / 18); }); wi.position.set(x, 2.2, .02); g.add(wi); });
	const sil = silhouette(1.85); sil.position.set(0, 0, .45); g.add(sil);
	const smat = sil.children[0].material; smat.transparent = true;
	const gh = ghost(1.95, '#ffcf86'); gh.position.set(0, -.04, .4); g.add(gh);
	const spill = glow('rgba(255,170,60,.6)', 5); spill.rotation.x = -Math.PI / 2; spill.position.set(0, .01, 1.6); g.add(spill);
	const gnd = ground('#0b1115', 40, 30, .2, .6); g.add(gnd);
	const rain = rainLines(520, 23); rain.position.set(0, -2, 3); g.add(rain);
	const st = stamp('40 ANOS', 2.6, .82, AMB); st.position.set(0, 3.15, 1.3); g.add(st);
	g.tick = T => {
		rain.tick(T); smat.opacity = 1 - .85 * ease.cubicInOut(seg(T, .2, 1.4));
		gh.op(.12 + .3 * ease.cubicInOut(seg(T, .3, 1.4)) + .05 * Math.sin(T * 5));
		door.material.color.setScalar(.85 + .15 * Math.sin(T * 7) * Math.sin(T * 2.3));
		slam(st, T, 1.04, -.06);
	};
	return { g, bg: '#05080b', fog: [5, 24] };
}

// ── 2 · hélice âmbar → cartão do primo ──
function setDna() {
	const g = new THREE.Group();
	const hx = helix({ n: 80, turns: 3.6, r: .8, h: 7, size: .17 }); g.add(hx);
	const dg = glow('rgba(255,176,46,.28)', 10); dg.position.z = -2; g.add(dg);
	const card = fileCard({ w: 1.6, h: 2.1, label: 'PRIMO DISTANTE', seed: 3 }); card.position.set(.7, 2.7, 1.3); card.rotation.z = -.08; g.add(card);
	const y = yarn(1); g.add(y);
	const du = dust(160, [8, 10, 5], 7); g.add(du);
	g.tick = T => { hx.tick(T, seg(T, 2.2, 3.5), T * 1.1); hx.rotation.z = .12; appear(card, pop(T, 3.62, .45)); card.position.y = 2.7 + .05 * Math.sin(T * 1.5); y.set(0, V(-.1, 3.4, 0), V(.66, 3.72, 1.3), seg(T, 3.75, 4.3)); du.tick(T); };
	return { g, bg: '#060a0d', fog: [6, 30] };
}

// ── 3–4 · bairro californiano, anos 70; janelas acendendo (100+ casas) ──
function setBairro() {
	const g = new THREE.Group(), r = mulberry32(70);
	g.add(new THREE.HemisphereLight('#5a7486', '#020304', 1.4));
	const moon = new THREE.DirectionalLight('#8fb0cf', .7); moon.position.set(-5, 8, 6); g.add(moon);
	const gnd = ground('#0c1216', 120, 120, .35, .5); g.add(gnd);
	const road = new THREE.Mesh(new THREE.PlaneGeometry(80, 3), new THREE.MeshStandardMaterial({ color: '#07090b', roughness: .2, metalness: .7 })); road.rotation.x = -Math.PI / 2; road.position.set(0, .01, 3.2); g.add(road);
	const houses = [], wins = [];
	for (let row = 0; row < 6; row++) for (let i = 0; i < 9; i++) {
		const h = house({ w: 2.8 + r() * .8, h: 1.5 + r() * .7, d: 2.4, wall: ['#1b2329', '#20282e', '#171e23'][(i + row) % 3], wins: 2 });
		h.position.set((i - 4) * 4.3 + (row % 2) * 2.1, 0, -row * 5.5); h.rotation.y = (r() - .5) * .08; g.add(h); houses.push(h);
		h.wins.forEach((_, k) => wins.push({ h, k, pre: r() < .25, on: 6.75 + r() * 1.5 }));
	}
	const pole = new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, 5, 8), new THREE.MeshBasicMaterial({ color: '#05080a' })); pole.position.set(-2.3, 2.5, 2.2); g.add(pole);
	const cone = spotCone(.12, 2.4, 5, '#ffcf8a', .3); cone.position.set(-2.3, 5, 2.2); g.add(cone);
	const lampG = glow('rgba(255,200,120,.9)', 1.4); lampG.position.set(-2.3, 5, 2.25); g.add(lampG);
	const lamp = new THREE.PointLight(AMB, 25, 12, 1.4); lamp.position.set(-2.3, 4.6, 2.4); g.add(lamp);
	const cal = tag(['CALIFÓRNIA', 'ANOS 70'], 2.8, 1.3, { color: CC.bone, font: COND, weight: '700' }); cal.position.set(0, 3.3, 2.2); g.add(cal);
	const cnt = counter(5, 2); cnt.position.set(0, 8.2, -5); g.add(cnt);
	const sub = tag('CASAS INVADIDAS', 4.6, .8); sub.position.set(0, 6.8, -5); g.add(sub);
	g.tick = T => {
		const fl = .75 + .25 * Math.sin(T * 2.1) * Math.sin(T * 1.3) - (Math.floor(T * 1.6) % 6 === 0 ? .45 : 0);
		cone.op(.3 * fl); lamp.intensity = 25 * fl; lampG.material.opacity = fl;
		wins.forEach(w => { let k = w.pre ? .55 : 0; if (T >= w.on) k = Math.max(k, 1 - .35 * ease.cubicOut(seg(T, w.on + .15, w.on + .5))); w.h.light(w.k, k); });
		appear(cal, pop(T, 4.77, .4) * (1 - seg(T, 6.4, 6.58)));
		const n = Math.round(100 * ease.cubicOut(seg(T, 6.7, 7.9))); cnt.set(n >= 100 ? '100+' : String(n)); appear(cnt, pop(T, 6.65, .35)); appear(sub, pop(T, 7.2, .35));
	};
	return { g, bg: '#070b0e', fog: [8, 42] };
}

// ── 5 · treze cartões caem na mesa ──
export const TREZE = Array.from({ length: 13 }, (_, i) => 8.6 + i * .085);
function setTreze() {
	const g = new THREE.Group(), r = mulberry32(13);
	g.add(table(5)); g.add(new THREE.AmbientLight('#9aa8b0', .5));
	const sp = new THREE.SpotLight('#ffe2b8', 90, 16, .6, .8, 1.3); sp.position.set(0, 7, 1); sp.target.position.set(0, 0, -.5); g.add(sp, sp.target);
	const rows = [3, 3, 3, 4], cards = [];
	let i = 0; rows.forEach((n, row) => { for (let c = 0; c < n; c++, i++) {
		const m = fileCard({ w: .72, h: .94, label: 'Nº ' + (i + 1), seed: 100 + i, photo: true }); m.material.color.setScalar(.82); m.material.transparent = true;
		m.userData = { x: (c - (n - 1) / 2) * .84, z: row * 1.06 - 1.4, rz: (r() - .5) * .35, t: TREZE[i] }; g.add(m); cards.push(m);
	} });
	const cnt = counter(2, 1.3, { color: CC.bone }); cnt.position.set(0, 1.3, -3.2); cnt.rotation.x = -.7; g.add(cnt);
	const lab = tag('ASSASSINATOS', 2.6, .5, { color: CC.bone }); lab.position.set(0, .55, -2.75); lab.rotation.x = -.8; g.add(lab);
	g.tick = T => {
		let n = 0; cards.forEach(m => { const { x, z, rz, t } = m.userData, u = seg(T, t, t + .2); m.visible = T >= t; if (T >= t + .2) n++; m.rotation.set(-Math.PI / 2, 0, rz + (1 - u) * .8); m.position.set(x, .02 + .002 * cards.indexOf(m) + (1 - ease.expoIn(u)) * 3, z); m.material.opacity = Math.min(1, u * 3); });
		cnt.set(String(n)); appear(cnt, pop(T, 8.6, .3)); appear(lab, pop(T, 8.9, .3));
	};
	return { g, bg: '#050709', fog: [4, 18] };
}

// ── 6 · nenhum rosto, nenhum nome ──
function setVazio() {
	const g = new THREE.Group();
	const back = glow('rgba(120,150,170,.6)', 7); back.position.set(0, 1.4, -1.6); g.add(back);
	const sil = silhouette(2.1); sil.position.set(-.15, 0, 0); g.add(sil);
	const cone = spotCone(.1, 1.7, 6, '#dfe8ef', .38); cone.position.set(-.15, 6, 0); g.add(cone);
	const pool = glow('rgba(220,232,240,.35)', 3.4); pool.rotation.x = -Math.PI / 2; pool.position.set(-.15, .01, 0); g.add(pool);
	const q = counter(.7, .9); q.set('?'); q.position.set(-.15, 1.82, .3); g.add(q);
	const card = fileCard({ w: 1.5, h: 1.95, label: 'SUSPEITO', name: ['NOME: ?', 'IDADE: ?'], seed: 9 }); card.material.transparent = true; card.scale.set(.8, .8, 1); card.position.set(.38, 1.1, 1.4); g.add(card);
	const du = dust(160, [3, 6, 3], 11, '#e8eef2', .035); du.position.set(-.15, 3, 0); g.add(du);
	g.tick = T => { du.tick(T); cone.op(.34 + .05 * Math.sin(T * 1.7)); appear(q, pop(T, 10.44, .4)); q.position.y = 1.82 + .04 * Math.sin(T * 2); slam(card, T, 11.21, -.09); };
	return { g, bg: '#040608', fog: [4, 20] };
}

// ── 7 · mesa de evidências: o DNA guardado ──
function setMesa() {
	const g = new THREE.Group();
	g.add(table(12)); g.add(new THREE.AmbientLight('#7d8c96', .35));
	const sp = new THREE.SpotLight('#ffe2b8', 70, 14, .55, .8, 1.3); sp.position.set(0, 5, 1.2); sp.target.position.set(0, 0, 0); g.add(sp, sp.target);
	const tb = tube({ h: 1.6, r: .2 }); tb.position.set(0, .82, 0); g.add(tb);
	const b1 = flat(bag(1.4, 1.8, 'EVIDÊNCIA', 'CENA Nº 7'), -1.25, .02, .35, .35), b2 = flat(bag(1.3, 1.6, 'EVIDÊNCIA', 'CENA Nº 12'), 1.35, .025, -.45, -.25);
	[b1, b2].forEach(b => { b.material.color.setScalar(.75); g.add(b); });
	const fc = flat(fileCard({ w: 1.3, h: 1.7, label: 'CENA DO CRIME', seed: 21, photo: false }), -.7, .03, -1.4, .15); fc.material.color.setScalar(.7); g.add(fc);
	const tp = flat(tapeStrip(9, .26), 0, .035, 1.15, .14); g.add(tp);
	const lab = tag(['AMOSTRA', 'DNA DAS CENAS'], 2.1, .85); lab.position.set(0, 2.05, .2); g.add(lab);
	const cone = spotCone(.08, 1.6, 4.4, '#ffe2b8', .14); cone.position.set(0, 4.6, .3); g.add(cone);
	const pg = glow('rgba(255,176,46,.6)', 1.6); pg.position.set(0, .55, .25); g.add(pg);
	const du = dust(140, [4, 4, 3], 12); du.position.set(0, 2, 0); g.add(du);
	g.tick = T => {
		const p = Math.exp(-Math.max(0, T - 14.04) * 2.2) * (T >= 14.04 ? 1 : 0);
		tb.hx.tick(T, 1, T * 1.6); tb.liq.material.opacity = .6 + .3 * p + .08 * Math.sin(T * 3); pg.material.opacity = .4 + .6 * p + .1 * Math.sin(T * 3); pg.scale.setScalar(1 + p * .8);
		appear(lab, pop(T, 14.04, .4)); du.tick(T);
	};
	return { g, bg: '#050709', fog: [3, 16] };
}

// ── 8 · banco de dados: sem correspondência ──
function setBanco() {
	const g = new THREE.Group(), r = mulberry32(44);
	const desk = new THREE.Mesh(new THREE.BoxGeometry(6, .1, 2.6), new THREE.MeshStandardMaterial({ color: '#111619', roughness: .5 })); desk.position.set(0, -.05, .6); g.add(desk);
	const bez = new THREE.Mesh(new THREE.BoxGeometry(3.1, 3.6, .18), new THREE.MeshStandardMaterial({ color: '#0b0e10', roughness: .4 })); bez.position.set(0, 1.9, -.1); g.add(bez);
	const stand = new THREE.Mesh(new THREE.BoxGeometry(.3, .2, .3), bez.material); stand.position.set(0, .05, 0); g.add(stand);
	g.add(new THREE.AmbientLight('#4f6470', .5)); const sl = new THREE.PointLight('#6fb4d8', 10, 8, 1.2); sl.position.set(0, 1.9, 1.6); g.add(sl);
	const tiles = Array.from({ length: 20 }, () => Array.from({ length: 9 }, () => .2 + r() * .8));
	const query = Array.from({ length: 16 }, () => .2 + r() * .8);
	const scr = screen(2.9, 3.4, 720); scr.position.set(0, 1.9, 0); g.add(scr);
	const gl = glow('rgba(80,160,210,.35)', 6); gl.position.set(0, 1.9, -.4); g.add(gl);
	const bars = (c, x, y, w, h, v, col) => { c.fillStyle = col; v.forEach((k, i) => c.fillRect(x + i * w / v.length, y + h * (1 - k), w / v.length * .6, h * k)); };
	g.tick = T => {
		const si = Math.floor((T - 16.75) * 9);
		scr.material.color.setScalar(.88 + .12 * Math.sin(T * 2.2));
		scr.redraw((c, w, h) => {
			c.fillStyle = '#0a1419'; c.fillRect(0, 0, w, h); c.fillStyle = '#15303b'; c.fillRect(0, 0, w, h * .08);
			c.font = `400 ${h * .035}px ${MONO}`; c.fillStyle = CC.bone; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('BANCO DE DADOS · PERFIS GENÉTICOS', w * .05, h * .04);
			c.fillStyle = '#10222a'; c.fillRect(w * .05, h * .1, w * .9, h * .11); c.fillStyle = AMB; c.fillText('AMOSTRA DA CENA', w * .08, h * .135); bars(c, w * .08, h * .155, w * .84, h * .045, query, AMB);
			for (let i = 0; i < 20; i++) {
				const cx = w * .05 + (i % 4) * w * .228, cy = h * .24 + Math.floor(i / 4) * h * .13, tw = w * .21, th = h * .115;
				c.fillStyle = '#16252d'; c.fillRect(cx, cy, tw, th); c.fillStyle = '#2b3c45'; c.beginPath(); c.arc(cx + tw * .25, cy + th * .38, th * .18, 0, 7); c.fill(); c.fillRect(cx + tw * .1, cy + th * .6, tw * .3, th * .3);
				bars(c, cx + tw * .5, cy + th * .15, tw * .45, th * .7, tiles[i], '#5a7d8c');
				if (i < si) { c.strokeStyle = 'rgba(224,31,47,.85)'; c.lineWidth = 5; c.beginPath(); c.moveTo(cx + 8, cy + 8); c.lineTo(cx + tw - 8, cy + th - 8); c.moveTo(cx + tw - 8, cy + 8); c.lineTo(cx + 8, cy + th - 8); c.stroke(); }
				if (i === si) { c.strokeStyle = AMB; c.lineWidth = 6; c.strokeRect(cx, cy, tw, th); }
			}
			c.fillStyle = '#6f8a96'; c.fillText(`perfis comparados: ${Math.max(0, Math.min(20, si)) * 41 + 3}…`, w * .05, h * .92);
			const k = ease.expoOut(seg(T, 18.13, 18.4));
			if (k > 0) { c.globalAlpha = k; c.fillStyle = 'rgba(10,5,6,.86)'; c.fillRect(w * .04, h * .42, w * .92, h * .17); c.strokeStyle = '#E01F2F'; c.lineWidth = 10; c.strokeRect(w * .06, h * .435, w * .88, h * .14);
				c.fillStyle = '#ff3a48'; c.textAlign = 'center'; c.font = `700 ${h * .052}px ${COND}`; c.fillText('SEM CORRESPONDÊNCIA', w / 2, h * .505); c.globalAlpha = 1; c.textAlign = 'left'; }
		});
	};
	return { g, bg: '#04070a', fog: [4, 20] };
}

// ── 9/13–16/20 · mural de cortiça: a árvore (herói) ──
const ROWS = [[[-3, 6.2], [3, 6.2]], [[-5, 3.4], [-1.7, 3.4], [1.7, 3.4], [5, 3.4]], [[-5.6, .6], [-3.4, .6], [-1.1, .6], [1.1, .6], [3.4, .6], [5.6, .6]], [[-5.7, -2.2], [-3.8, -2.2], [-1.9, -2.2], [0, -2.2], [1.9, -2.2], [3.8, -2.2], [5.7, -2.2]]];
const LINKS = [[0, 2], [0, 3], [1, 4], [1, 5], [2, 6], [2, 7], [3, 8], [4, 9], [5, 10], [5, 11], [6, 12], [7, 13], [8, 14], [8, 15], [9, 16], [10, 17], [11, 18]];
const TARGET = 15, PATH = [0, 3, 8, 15], COUS = { 13: 31.72, 17: 33.0, 18: 33.35 };
const OUT = {}; [1, 4, 5, 9, 10, 11, 16, 17, 18].forEach((i, j) => OUT[i] = 37.43 + j * .05); [2, 6, 7, 12, 13].forEach((i, j) => OUT[i] = 37.82 + j * .05); OUT[14] = 38.45;
function setMural() {
	const g = new THREE.Group(), r = mulberry32(77);
	g.add(new THREE.AmbientLight('#8a9eac', .55));
	const sp = new THREE.SpotLight('#ffe0b0', 160, 45, .8, .75, 1.1); sp.position.set(0, 9, 14); sp.target.position.set(0, 1, 0); g.add(sp, sp.target);
	const board = cork(17, 15); board.position.set(0, 2, -.02); g.add(board);
	const LAB = ['ANCESTRAL', 'AVÔ / AVÓ', 'GERAÇÃO 3', 'PARENTE'];
	const cards = []; let idx = 0;
	ROWS.forEach((row, ri) => row.forEach(([x, y], ci) => {
		const i = idx++, cous = i in COUS, tgt = i === TARGET;
		const grp = new THREE.Group(); grp.position.set(x, y, 0);
		const frame = new THREE.Mesh(new THREE.PlaneGeometry(1.66, 2.11), new THREE.MeshBasicMaterial({ color: AMB, transparent: true, opacity: 0 })); frame.position.z = .01; grp.add(frame);
		const c = fileCard({ w: 1.5, h: 1.95, label: cous ? 'PRIMO DISTANTE' : LAB[ri], seed: 300 + i, name: tgt ? [''] : null }); c.material.transparent = true; c.position.z = .02; grp.add(c);
		const pin = new THREE.Mesh(new THREE.SphereGeometry(.08, 10, 8), new THREE.MeshStandardMaterial({ color: CC.red, roughness: .4 })); pin.position.set(0, .9, .07); grp.add(pin);
		grp.userData = { i, x, y, ta: cous ? COUS[i] : 33.65 + (3 - ri) * .42 + ci * .04, out: OUT[i] ?? 99, rz: (r() - .5) * .08, spin: r() < .5 ? -1 : 1, frame, c, cous };
		g.add(grp); cards.push(grp);
	}));
	const y = yarn(LINKS.length); g.add(y);
	const idade = tag('IDADE ✓', .85, .32), ender = tag('ENDEREÇO ✓', .95, .32); idade.position.set(-.45, -.82, .2); idade.rotation.z = .05; ender.position.set(.5, -.82, .2); ender.rotation.z = -.04; g.add(idade, ender);
	const T1 = new THREE.Group(); T1.position.set(0, -2.2, 0); g.add(T1);
	const nm1 = typeLine('JOSEPH JAMES', 1.35, .24), nm2 = typeLine('DEANGELO', 1.35, .26); nm1.position.set(0, -.36, .04); nm2.position.set(0, -.6, .04); T1.add(nm1, nm2);
	const fill = new THREE.Mesh(new THREE.PlaneGeometry(.84, .82), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, map: canvasTex(168, 164, (c, w, h) => { c.fillStyle = '#5d4a30'; c.fillRect(0, 0, w, h); c.fillStyle = AMB; c.beginPath(); c.arc(w / 2, h * .42, w * .2, 0, 7); c.fill(); c.beginPath(); c.ellipse(w / 2, h * 1.02, w * .42, h * .38, 0, Math.PI, 0); c.fill(); }) }));
	fill.position.set(0, .19, .035); T1.add(fill);
	const preso = stamp('PRESO', .74, .26); preso.position.set(0, .12, .06); T1.add(preso);
	const gh = ghost(2.6, '#a8c4d4'); gh.position.set(0, -1.3, 2); g.add(gh);
	const q = counter(1.5, 2.1); q.set('?'); q.position.set(0, 1.7, 2.3); g.add(q);
	const du = dust(260, [16, 12, 4], 31); du.position.set(0, 2, 2); g.add(du);
	g.tick = T => {
		du.tick(T);
		const ghostOn = T < 22.6;
		gh.op(ghostOn ? .22 + .08 * Math.sin(T * 2.2) : 0); gh.position.y = -1.3 + .06 * Math.sin(T * 1.3);
		appear(q, ghostOn ? pop(T, 20.4, .45) : 0); q.rotation.z = .05 * Math.sin(T * 1.7);
		const alive = cards.map(cd => { const { ta, out, x, y: cy, rz, spin, frame, c, cous, i } = cd.userData;
			const k = pop(T, ta, .35), u = seg(T, out, out + .75);
			cd.visible = T >= ta && u < 1; cd.scale.set(Math.max(1e-4, k), Math.max(1e-4, k), 1);
			cd.position.set(x, cy - 7 * u * u, .1 * u); cd.rotation.z = rz + spin * u * 1.4; c.material.opacity = 1 - u;
			const lit = cous ? 1 - seg(T, 33.6, 34.2) * .7 : i === TARGET ? ease.cubicOut(seg(T, 38.89, 39.2)) : PATH.includes(i) ? .35 * seg(T, 38.5, 39) : 0;
			frame.material.opacity = lit * (1 - u) * (.85 + .15 * Math.sin(T * 4)); c.material.color.setScalar(T > 38.5 && !PATH.includes(i) ? .6 : 1);
			return T >= ta ? 1 - u : 0; });
		LINKS.forEach(([a, b], li) => { const A = cards[a].userData, B = cards[b].userData, tl = Math.max(A.ta, B.ta) + .15;
			y.set(li, V(A.x, A.y - .98, .06), V(B.x, B.y + .9, .07), seg(T, tl, tl + .4), Math.min(alive[a], alive[b]));
			y.color(li, PATH.includes(a) && PATH.includes(b) && T > 38.5 ? '#ffd27a' : AMB); });
		appear(idade, pop(T, 39.29, .3)); appear(ender, pop(T, 39.76, .3));
		if (T > 40.9) idade.visible = ender.visible = false;
		nm1.type((T - 41.0) / .045); nm2.type((T - 41.78) / .06);
		fill.material.opacity = ease.cubicInOut(seg(T, 48.7, 49.4));
		appear(preso, ease.expoOut(seg(T, 49.45, 49.62))); preso.rotation.z = -.12;
		T1.visible = T > 35;
	};
	return { g, bg: '#07090b', fog: [10, 60], cards };
}

// ── 10 · 2018: investigadora de costas no notebook ──
function setSala() {
	const g = new THREE.Group();
	const back = wall(16, 9, (c, w, h) => { c.fillStyle = '#06090b'; c.fillRect(0, 0, w, h); const gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(255,176,46,0)'); gr.addColorStop(.6, 'rgba(255,176,46,.7)'); gr.addColorStop(1, 'rgba(255,176,46,.3)'); c.fillStyle = gr; for (let y = h * .1; y < h * .7; y += h / 22) c.fillRect(w * .45, y, w * .45, h / 44); });
	back.position.set(0, 3, -3); g.add(back);
	const desk = new THREE.Mesh(new THREE.BoxGeometry(3.4, .08, 1.6), new THREE.MeshStandardMaterial({ color: '#1a130d', roughness: .6 })); desk.position.set(0, .88, 0); g.add(desk);
	const base = new THREE.Mesh(new THREE.BoxGeometry(1.1, .04, .75), new THREE.MeshStandardMaterial({ color: '#2a3035', metalness: .6, roughness: .3 })); base.position.set(0, .94, 0); g.add(base);
	const lid = screen(1.1, .7, 440, (c, w, h) => { c.fillStyle = '#0d1a22'; c.fillRect(0, 0, w, h); c.fillStyle = '#9fd0ea'; c.fillRect(w * .08, h * .1, w * .5, h * .08); for (let i = 0; i < 6; i++) { c.fillStyle = i === 2 ? AMB : '#3c6273'; c.fillRect(w * .08, h * (.28 + i * .1), w * (.3 + (i * 37 % 50) / 100), h * .05); } });
	lid.position.set(0, 1.3, -.37); lid.rotation.x = -.18; g.add(lid);
	const gl = glow('rgba(150,200,255,.5)', 2.6); gl.position.set(0, 1.3, -.2); g.add(gl);
	const pl = new THREE.PointLight('#9fc8ff', 6, 6, 1.3); pl.position.set(0, 1.4, .1); g.add(pl); g.add(new THREE.AmbientLight('#3f505c', .5));
	const inv = silhouette(1.75); inv.position.set(0, 0, .95); g.add(inv);
	const bun = new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 10), inv.children[0].material); bun.position.set(0, 1.58, 1.12); g.add(bun);
	const st = stamp('2018', 1.7, .62, AMB); st.position.set(0, 2.75, .2); g.add(st);
	const sub = tag('ALGO NOVO', 1.8, .42, { color: CC.bone }); sub.position.set(0, 2.15, .3); g.add(sub);
	g.tick = T => { slam(st, T, 22.92, -.05); appear(sub, pop(T, 24.83, .35)); gl.material.opacity = .85 + .15 * Math.sin(T * 3); };
	return { g, bg: '#05080a', fog: [4, 18] };
}

// ── 11–12 · site público de genealogia (UI genérica, sem marca) ──
function setSite() {
	const g = new THREE.Group(), r = mulberry32(55);
	const bez = new THREE.Mesh(new THREE.BoxGeometry(2.9, 3.7, .12), new THREE.MeshStandardMaterial({ color: '#0b0e10' })); bez.position.set(0, 1.9, -.08); g.add(bez);
	g.add(new THREE.AmbientLight('#4f6470', .6));
	const scr = screen(2.7, 3.5, 760); scr.position.set(0, 1.9, 0); g.add(scr);
	const gl = glow('rgba(255,176,46,.22)', 7); gl.position.set(0, 1.9, -.5); g.add(gl);
	const sh = silhouette(2.4); sh.position.set(-1.25, -1.05, 2.4); g.add(sh);
	const av = Array.from({ length: 12 }, () => ({ c: `hsl(${Math.floor(r() * 360)},${20 + r() * 20}%,${38 + r() * 14}%)`, w: .4 + r() * .45 }));
	const hb = Array.from({ length: 14 }, () => .25 + r() * .75);
	const txt = (c, t, x, y, s, col, al = 'left', f = MONO, wt = '400') => { c.font = `${wt} ${s}px ${f}`; c.fillStyle = col; c.textAlign = al; c.textBaseline = 'middle'; c.fillText(t, x, y); };
	g.tick = T => scr.redraw((c, w, h) => {
		c.fillStyle = '#0f1519'; c.fillRect(0, 0, w, h); c.fillStyle = '#1b252b'; c.fillRect(0, 0, w, h * .06);
		['#d65a4a', '#d9a33a', '#5aa86a'].forEach((cc, i) => { c.fillStyle = cc; c.beginPath(); c.arc(w * (.04 + i * .035), h * .03, h * .009, 0, 7); c.fill(); });
		c.fillStyle = '#0c1114'; c.fillRect(w * .18, h * .012, w * .76, h * .036); txt(c, 'arvoredeparentes.exemplo · busca pública', w * .2, h * .031, h * .02, '#7f97a3');
		txt(c, 'ENCONTRE SEUS PARENTES', w / 2, h * .1, h * .042, CC.bone, 'center', COND, '700');
		c.fillStyle = '#17232a'; c.fillRect(w * .06, h * .14, w * .88, h * .14);
		hb.forEach((k, i) => { c.fillStyle = AMB; c.fillRect(w * .09 + i * w * .018, h * .2 - h * .05 * k, w * .01, h * .1 * k); });
		const p = seg(T, 25.85, 27.4); txt(c, p < 1 ? 'ENVIANDO PERFIL…' : 'PERFIL ENVIADO ✓', w * .4, h * .175, h * .026, AMB);
		c.fillStyle = '#26343c'; c.fillRect(w * .4, h * .22, w * .5, h * .02); c.fillStyle = AMB; c.fillRect(w * .4, h * .22, w * .5 * p, h * .02);
		txt(c, 'gente comum procurando parentes', w * .06, h * .32, h * .022, '#7f97a3');
		const dim = T >= 30.26 ? .35 : 1;
		av.forEach((a, i) => { const k = ease.backOut(seg(T, 28.45 + i * .07, 28.75 + i * .07)); if (k <= 0) return;
			const cx = w * (.2 + (i % 3) * .3), cy = h * (.4 + Math.floor(i / 3) * .105), rr = h * .036 * k;
			c.globalAlpha = dim; c.fillStyle = a.c; c.beginPath(); c.arc(cx, cy, rr, 0, 7); c.fill(); c.fillStyle = 'rgba(10,12,14,.85)'; c.beginPath(); c.arc(cx, cy - rr * .15, rr * .38, 0, 7); c.fill(); c.beginPath(); c.ellipse(cx, cy + rr * .75, rr * .62, rr * .45, 0, Math.PI, 0); c.fill();
			c.filter = 'blur(3px)'; c.fillStyle = '#8fa3ad'; c.fillRect(cx - w * .08 * a.w, cy + rr + h * .012, w * .16 * a.w, h * .012); c.filter = 'none'; c.globalAlpha = 1; });
		c.fillStyle = '#121b20'; c.fillRect(w * .06, h * .83, w * .88, h * .13);
		if (T < 30.26) txt(c, 'buscando correspondência' + '.'.repeat(Math.floor(T * 3) % 4), w / 2, h * .895, h * .028, '#7f97a3', 'center');
		else { const k = ease.expoOut(seg(T, 30.26, 30.5)); c.globalAlpha = k; c.strokeStyle = '#E01F2F'; c.lineWidth = 6; c.strokeRect(w * .08, h * .845, w * .84, h * .1); txt(c, 'CORRESPONDÊNCIA EXATA: 0', w / 2, h * .895, h * .036, '#ff3a48', 'center', COND, '700'); c.globalAlpha = 1; }
	});
	return { g, bg: '#05080a', fog: [4, 18] };
}

// ── 17–18 · ex-policial ao lado do carro; maçaneta ──
function setCarro() {
	const g = new THREE.Group();
	g.add(new THREE.HemisphereLight('#3f5563', '#020304', .6));
	const gnd = ground('#0b1014', 60, 40, .18, .7); g.add(gnd);
	[[-9, 9, 1], [-4.6, 12, 2], [3.6, 10, 3], [8.4, 13, 4], [0, 15, 5]].forEach(([x, h, s], i) => { const b = building(3.6 + (i % 2) * .6, h, 3, s + 40); b.position.set(x, h / 2, -9 - (i % 2) * 2); g.add(b); });
	const cr = car(); g.add(cr);
	const man = coatMan(1.8); man.position.set(1.75, 0, 1.45); man.rotation.y = .3; g.add(man); const mg = glow('rgba(170,190,210,.55)', 4.5); mg.position.set(1.9, 1.2, -.4); g.add(mg); g.add(new THREE.AmbientLight('#8aa0b0', .5));
	const amb = new THREE.PointLight(AMB, 40, 14, 1.3); amb.position.set(-3, 4.5, 2.5); g.add(amb);
	const rim = new THREE.PointLight('#5b8cff', 30, 12, 1.3); rim.position.set(3.5, 2.6, -2); g.add(rim);
	const cone = spotCone(.12, 2.6, 5, '#ffcf8a', .22); cone.position.set(-3, 5, 2.5); g.add(cone);
	const bk = [['rgba(255,176,46,.7)', -2, 1.4, -4], ['rgba(91,140,255,.6)', 2.5, 1.8, -5], ['rgba(255,176,46,.5)', .8, 2.6, -6], ['rgba(255,120,90,.5)', -3.5, 2.2, -7]].map(([c, x, y, z]) => { const m = glow(c, 1.6); m.position.set(x, y, z); g.add(m); return m; });
	const rain = rainLines(500, 47); rain.position.set(0, -2, 0); g.add(rain);
	const ex = textPlane('EX-POLICIAL', 2.2, .55, { color: CC.ink, bg: AMB, weight: '700' }); ex.position.set(1.75, 2.45, 1.45); g.add(ex);
	const age = tag('72 ANOS', 1.6, .55); age.position.set(1.75, 3.1, 1.45); g.add(age);
	const swab = new THREE.Group(); const stick = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .6, 8), new THREE.MeshStandardMaterial({ color: '#e9e4d8' })); stick.rotation.z = Math.PI / 2; stick.position.x = .3;
	const tip = new THREE.Mesh(new THREE.SphereGeometry(.035, 12, 10), new THREE.MeshStandardMaterial({ color: '#fbf8f0', roughness: 1 })); tip.scale.set(1.5, 1, 1); swab.add(stick, tip); g.add(swab);
	const gloveL = new THREE.PointLight('#fff1d6', 3, 2, 1.5); gloveL.position.set(.2, 1.2, 1.6); g.add(gloveL);
	const hx = helix({ n: 30, turns: 2, r: .05, h: .45, size: .045 }); g.add(hx);
	const H = cr.userData.handle.position;
	g.tick = T => {
		rain.tick(T); appear(ex, pop(T, 42.6, .35)); appear(age, pop(T, 43.72, .35));
		bk.forEach((m, i) => m.material.opacity = .7 + .3 * Math.sin(T * (.8 + i * .3) + i));
		const a = ease.cubicOut(seg(T, 45.3, 45.9)), b = ease.cubicInOut(seg(T, 46.7, 47.3));
		const rub = T > 45.9 && T < 46.7 ? Math.sin((T - 45.9) * 12.6) * .05 : 0;
		swab.position.set(lerp(lerp(.65, H.x + .02, a), .45, b) + rub, lerp(lerp(1.25, H.y + .02, a), 1.3, b), lerp(lerp(1.5, H.z + .07, a), 1.55, b));
		swab.rotation.z = lerp(-.4, -.1, a); swab.visible = T > 45.1;
		hx.visible = T > 46.1; hx.position.copy(swab.position).add(V(0, .2 + seg(T, 46.1, 47.5) * .25, 0)); hx.tick(T, seg(T, 46.1, 46.8), T * 2.2);
	};
	return { g, bg: '#05080b', fog: [6, 30] };
}

// ── 19 · bateu: as duas hélices se encaixam ──
function setMatch() {
	const g = new THREE.Group();
	const a = helix({ n: 60, turns: 3, r: .6, h: 4.2, size: .15 }), b = helix({ n: 60, turns: 3, r: .6, h: 4.2, size: .15, color: CC.bone }); g.add(a, b);
	const gl = glow('rgba(255,176,46,.8)', 6); gl.position.z = -.5; g.add(gl);
	const st = stamp('PRESO', 2, .65); st.position.set(0, 2.3, 1.2); g.add(st);
	const sub = tag('ABRIL · 2018', 2, .5, { color: CC.bone }); sub.position.set(0, 1.75, 1.2); g.add(sub);
	g.tick = T => {
		const k = ease.expoOut(seg(T, 47.62, 47.8)); a.position.x = -2.4 * (1 - k); b.position.x = 2.4 * (1 - k);
		a.tick(T, 1, T * 1.4); b.tick(T, 1, T * 1.4 + .02);
		gl.scale.setScalar(.6 + 1.2 * Math.exp(-Math.max(0, T - 47.75) * 3) * (T > 47.75 ? 1 : 0)); gl.material.opacity = T > 47.75 ? .9 : .3;
		slam(st, T, 47.78, -.08); appear(sub, pop(T, 47.95, .3));
	};
	return { g, bg: '#06090b', fog: [6, 30] };
}

// ── 21 · você faria? ──
function setPergunta() {
	const g = new THREE.Group();
	g.add(table(9)); g.add(new THREE.AmbientLight('#7d8c96', .45));
	const sp = new THREE.SpotLight('#ffe2b8', 60, 14, .6, .8, 1.3); sp.position.set(0, 5, 2); sp.target.position.set(0, .8, 0); g.add(sp, sp.target);
	const box = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.9, .5), new THREE.MeshStandardMaterial({ color: '#d9d2c2', roughness: .8 })); box.position.set(-.8, .95, -.2); box.rotation.y = .25; g.add(box);
	const front = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.8), new THREE.MeshBasicMaterial({ map: canvasTex(260, 360, (c, w, h) => { c.fillStyle = '#e8e1d0'; c.fillRect(0, 0, w, h); c.fillStyle = '#1f2a30'; c.fillRect(0, h * .62, w, h * .38);
		c.strokeStyle = AMB; c.lineWidth = 6; for (let i = 0; i < 9; i++) { const y = h * (.12 + i * .05), x = Math.sin(i * .9) * w * .18; c.beginPath(); c.moveTo(w / 2 - x, y); c.lineTo(w / 2 + x, y); c.stroke(); }
		c.font = `700 ${h * .07}px ${COND}`; c.fillStyle = CC.bone; c.textAlign = 'center'; c.fillText('KIT DE', w / 2, h * .74); c.fillText('ANCESTRALIDADE', w / 2, h * .83); c.font = `400 ${h * .04}px ${MONO}`; c.fillText('descubra sua família', w / 2, h * .92); }) }));
	front.material.color.setScalar(.85); front.position.set(0, 0, .26); box.add(front);
	const tb = tube({ h: 2, r: .24 }); tb.position.set(.75, 1.05, .35); g.add(tb);
	const pg = glow('rgba(255,176,46,.55)', 4); pg.position.set(.2, 1.2, -1.2); g.add(pg);
	const q = textPlane('VOCÊ FARIA?', 2.3, .62, { color: AMB, weight: '700' }); q.position.set(0, 2.95, .4); g.add(q);
	const du = dust(160, [5, 4, 3], 61); du.position.set(0, 2, 0); g.add(du);
	g.tick = T => { tb.hx.tick(T, 1, T * 1.5); const p = .5 + .5 * Math.sin((T - 50.66) * 3.2); pg.scale.setScalar(1 + .25 * p); pg.material.opacity = .6 + .4 * p; tb.liq.material.opacity = .6 + .3 * p; appear(q, pop(T, 50.75, .4)); du.tick(T); };
	return { g, bg: '#050709', fog: [4, 18] };
}

// ── 22 · próximo caso ──
function setFim() {
	const g = new THREE.Group();
	g.add(table(9)); g.add(new THREE.AmbientLight('#6f7d86', .3));
	const sp = new THREE.SpotLight('#ffe2b8', 60, 12, .5, .8, 1.3); sp.position.set(0, 5, .5); sp.target.position.set(0, 0, 0); g.add(sp, sp.target);
	const folder = new THREE.Mesh(new THREE.BoxGeometry(2, .06, 2.6), new THREE.MeshStandardMaterial({ color: '#8a6a3c', roughness: .9 })); folder.position.y = .03; folder.rotation.y = -.08; g.add(folder);
	const cov = flat(new THREE.Mesh(new THREE.PlaneGeometry(1.9, 2.5), new THREE.MeshBasicMaterial({ map: canvasTex(380, 500, (c, w, h) => { c.fillStyle = '#a07c46'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8dcc0'; c.fillRect(w * .15, h * .12, w * .7, h * .2); c.font = `700 ${h * .06}px ${COND}`; c.fillStyle = '#1a1410'; c.textAlign = 'center'; c.fillText('CASO Nº 024', w / 2, h * .2); c.font = `400 ${h * .035}px ${MONO}`; c.fillText('próximo arquivo', w / 2, h * .27); c.strokeStyle = '#B3202B'; c.lineWidth = 6; c.strokeRect(w * .2, h * .6, w * .6, h * .12); c.font = `700 ${h * .055}px ${COND}`; c.fillStyle = '#B3202B'; c.fillText('CONFIDENCIAL', w / 2, h * .68); }) })), 0, .065, 0, -.08);
	cov.material.color.setScalar(.8); g.add(cov);
	const cone = spotCone(.08, 2, 4.8, '#ffe2b8', .16); cone.position.set(0, 4.8, .3); g.add(cone);
	const t1 = textPlane('SEGUE O CANAL', 2, .42, { color: AMB, weight: '700' }); t1.position.set(0, 2.05, .6); t1.rotation.x = -.35; g.add(t1);
	const t2 = textPlane('PRÓXIMO CASO', 1.5, .28, { color: CC.bone, font: MONO, weight: '400' }); t2.position.set(0, 1.55, .7); t2.rotation.x = -.35; g.add(t2);
	const du = dust(120, [4, 4, 3], 71); du.position.set(0, 2, 0); g.add(du);
	g.tick = T => { appear(t1, pop(T, 53.6, .4)); appear(t2, pop(T, 54.35, .35)); du.tick(T); };
	return { g, bg: '#040607', fog: [3, 14] };
}

export function buildSets() {
	return { porta: setPorta(), dna: setDna(), bairro: setBairro(), treze: setTreze(), vazio: setVazio(), mesa: setMesa(), banco: setBanco(), mural: setMural(), sala: setSala(), site: setSite(), carro: setCarro(), match: setMatch(), pergunta: setPergunta(), fim: setFim() };
}

const arc = (cx, cy, cz, R, y, a0, a1, lx, ly, lz) => u => { const th = lerp(a0, a1, u); return [cx + Math.sin(th) * R, y, cz + Math.cos(th) * R, lx, ly, lz]; };
// planos: [início, set, câmera A, câmera B (ou A = função u→pose), transição]
export const SH = [
	[0, 'porta', [0, 1.5, 8.5, 0, 1.1, 0], [0, 1.4, 6, 0, 1.0, 0]],
	[2.19, 'dna', [0, -1.2, 7.5, 0, -1.4, 0], [0, 1.6, 7.5, 0, 1.4, 0], 'dip'],
	[4.72, 'bairro', [-2.5, 1.8, 9, -.5, 1.6, 0], [1.5, 1.9, 8.6, .5, 1.6, 0], 'sweep'],
	[6.58, 'bairro', [0, 3.2, 10, 0, 2.4, -4], [0, 7.5, 21, 0, 4.2, -6]],
	[8.52, 'treze', [0, 6.6, 4.6, 0, 0, -.4], [0, 5.6, 3.6, 0, 0, -.6], 'whip'],
	[9.93, 'vazio', [0, 1.5, 7, 0, 1, 0], [0, 1.65, 4.6, 0, 1.25, 0], 'dip'],
	[12.22, 'mesa', [2.4, 1.4, 3.2, 0, .9, 0], [1.3, 1.2, 2.6, 0, .95, 0], 'sweep'],
	[14.9, 'mesa', [-2.2, 3.2, 3.6, -.2, .6, 0], [-1, 2.6, 3, 0, .6, 0]],
	[16.56, 'banco', [-1.2, 2.1, 7.4, 0, 1.7, 0], [.6, 2, 6.2, 0, 1.75, 0], 'whip'],
	[19.63, 'mural', [0, .5, 9.5, 0, .2, 0], [0, .6, 7, 0, .4, 0], 'dip'],
	[22.43, 'sala', arc(0, 1.3, .5, 4.4, 2.2, -.5, .35, 0, 1.55, 0), null, 'sweep'],
	[25.68, 'site', [-1.8, 2.3, 6.2, 0, 1.8, 0], [-.6, 2.1, 5.4, 0, 1.85, 0], 'whip'],
	[28.3, 'site', [.4, 2.1, 4.6, 0, 1.9, 0], [0, 2, 4, 0, 1.9, 0]],
	[30.24, 'site', [0, .9, 3.4, 0, .45, 0], [0, .85, 3, 0, .45, 0]],
	[31.48, 'mural', [-3.6, -1.4, 10, -3.4, -2.1, 0], [4.0, -1.4, 10, 3.8, -2.1, 0], 'sweep', 'lin'],
	[33.5, 'mural', [0, -1.8, 9, 0, -1.2, 0], [0, 2.4, 23, 0, 1.8, 0]],
	[36.5, 'mural', [0, 3, 20, 0, 2.6, 0], [0, -.6, 14, 0, .2, 0]],
	[38.3, 'mural', [0, -1.5, 6.2, 0, -2.4, 0], [0, -1.8, 4.6, 0, -2.45, 0]],
	[40.95, 'mural', [0, -2.95, 3.8, 0, -2.95, 0], [0, -2.95, 3.3, 0, -2.95, 0]],
	[42.55, 'carro', arc(1, 1.4, .6, 7, 1.9, .5, -.05, 1.2, 1.6, .8), null, 'whip'],
	[45.13, 'carro', [.55, 1.05, 2.3, -.15, .9, .93], [.25, 1, 1.8, -.15, .9, .93]],
	[47.62, 'match', [0, .8, 7.5, 0, 1, 0], [0, 1, 6.2, 0, 1.1, 0], 'dip'],
	[48.44, 'mural', [0, -2.5, 3.8, 0, -2.7, 0], [0, -.8, 12, 0, -1.4, 0], 'dip'],
	[50.64, 'pergunta', [0, 1.9, 6.5, 0, 1.6, 0], [0, 1.8, 4.8, 0, 1.65, 0], 'sweep'],
	[53.53, 'fim', [0, 3.6, 5, 0, .8, 0], [0, 3.3, 4.3, 0, .9, 0], 'dip'],
];
