// Mundo do 07 (anúncio do curso): estações de brinquedo brilhante enfileiradas no eixo x (uma a cada 40 u),
// câmera voando entre elas (keys K), pêndulo dourado como herói/transição. Tudo é função de T.
import * as THREE from 'three';
import { seg, ease, pop, clamp, lerp, mulberry32 } from './lib.js';
import { P, mat, own, box, mesh, sign, signCanvas, texOf, toy, blink, iconBadge, iconCanvas } from './toy.js';

export const C = { mag: '#FF2E88', turq: '#13C4A3', tang: '#FF8A1F', ink: '#1B1035', lima: '#C6FF00', ouro: '#FFC23A', azul: '#3D5AFE', amarelo: '#FFD23F', creme: '#FFF4E6', branco: '#FFFFFF' };
const gold = () => new THREE.MeshPhysicalMaterial({ color: '#FFC23A', metalness: .55, roughness: .25, emissive: "#6A4200", emissiveIntensity: .35, clearcoat: 1, clearcoatRoughness: .1 });
const ad = (p, ...cs) => { cs.forEach(c => p.add(c)); return p; };
const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };
const sq = (o, k, base = 1) => { const s = Math.max(1e-4, k) * base; o.scale.set(s, s, s); };
// squash & stretch na chegada (k 0→1 de backOut)
const squash = (o, T, t0, base = 1) => { const k = pop(T, t0, .4), w = Math.max(0, 1 - seg(T, t0 + .1, t0 + .55)) * Math.sin(seg(T, t0 + .1, t0 + .55) * Math.PI * 2) * .18; o.scale.set(base * k * (1 + w), base * k * (1 - w), base * k * (1 + w)); };
const hop = (T, a, b, h) => { const k = seg(T, a, b); return 4 * h * k * (1 - k); };

// ── camera keys: S = ponto do assunto, vh = altura visível no assunto, az/el = órbita, d = duração da ida ──
export const K = [
	{ t: 0, d: 0, S: [-.2, .55, .3], vh: 1.05, az: .55, el: .05, bg: C.mag },
	{ t: .3, d: 1.5, S: [0, .95, 0], vh: 3.7, az: .06, el: .12, e: 'expoOut' },
	{ t: 1.9, d: .9, S: [.5, 1.0, 0], vh: 3.0, az: -.18, el: .1 },
	{ t: 2.9, d: 1.4, S: [.85, 1.2, 0], vh: 2.1, az: -.75, el: .1 },
	{ t: 4.4, d: 1.8, S: [.8, 1.55, 0], vh: 1.35, az: -.35, el: .04 },
	{ t: 6.5, d: .5, whip: 1, S: [40, 1.2, 0], vh: 6.4, az: 1.25, el: .24, bg: C.turq },
	{ t: 7.0, d: 2.4, S: [40, 1.3, 0], vh: 5.6, az: .95, el: .16 },
	{ t: 9.42, d: .3, whip: 1, S: [35.5, 1.75, 0], vh: 2.7, az: .18, el: .12 },
	{ t: 10.28, d: .3, whip: 1, S: [38.5, 1.75, 0], vh: 2.7, az: .05, el: .12 },
	{ t: 11.28, d: .3, whip: 1, S: [41.5, 1.7, 0], vh: 2.7, az: -.08, el: .12 },
	{ t: 12.4, d: .3, whip: 1, S: [44.5, 1.85, 0], vh: 3.0, az: -.18, el: .1 },
	{ t: 13.75, d: 1.2, S: [40, 1.6, 0], vh: 6.0, az: -1.05, el: .22, e: 'expoOut' },
	{ t: 15.25, d: .5, whip: 1, S: [80, 1.45, 0], vh: 4.4, az: .25, el: .1, bg: C.tang },
	{ t: 15.9, d: 2.7, S: [80, 1.45, 0], vh: 3.7, az: -.35, el: .05 },
	{ t: 18.68, d: .35, whip: 1, S: [88, 1.15, 0], vh: 3.3, az: .4, el: .18 },
	{ t: 19.9, d: .22, S: [88, 1.45, 0], vh: 2.6, az: .28, el: .14 },
	{ t: 21.45, d: .5, whip: 1, S: [120, 1.1, 0], vh: 4.6, az: .45, el: .25, bg: C.mag },
	{ t: 22.0, d: 2.1, S: [120, 1.05, 0], vh: 4.0, az: .08, el: .16 },
	{ t: 24.25, d: 1.1, e: 'expoIn', S: [120, 1.02, -.12], vh: .12, az: 0, el: .02 },
	{ t: 25.35, d: 0, S: [160, 1.6, 0], vh: 1.0, az: 0, el: 0, bg: C.turq },
	{ t: 25.36, d: 1.0, S: [160, 1.75, 0], vh: 6.6, az: .14, el: .06, e: 'expoOut' },
	{ t: 26.4, d: 2.4, S: [160, 1.8, 0], vh: 6.3, az: -.16, el: .1 },
	{ t: 28.88, d: .45, whip: 1, S: [201.5, 1.7, 0], vh: 5.6, az: .38, el: .2, bg: C.tang },
	{ t: 29.35, d: 1.9, S: [203, 2.7, 0], vh: 5.2, az: .2, el: .12 },
	{ t: 31.3, d: .45, whip: 1, S: [240, 1.05, 0], vh: 4.6, az: -.32, el: .18, bg: C.mag },
	{ t: 32.55, d: .3, S: [240.6, 1.6, 0], vh: 4.9, az: -.2, el: .25 },
	{ t: 33.08, d: .45, whip: 1, S: [280, 2.3, 0], vh: 5.6, az: 0, el: .05, bg: C.ink },
	{ t: 34.24, d: .16, S: [280, 2.3, 0], vh: 4.9, az: 0, el: .03 },
	{ t: 34.5, d: 1.2, S: [280, 2.3, 0], vh: 5.3, az: .12, el: .07 },
];
export const WHIPS = K.filter(k => k.whip).map(k => k.t);
const EZ = { expoOut: ease.expoOut, expoIn: ease.expoIn, def: ease.cubicInOut, whip: ease.expoInOut };
export function camPose(T) {
	let i = 0; while (i + 1 < K.length && K[i + 1].t <= T) i++;
	const a = K[Math.max(0, i - 1)], b = K[i];
	const k = b.d ? (EZ[b.e] || (b.whip ? EZ.whip : EZ.def))(seg(T, b.t, b.t + b.d)) : 1;
	const S = b.S.map((v, j) => lerp(i ? a.S[j] : v, v, k));
	const vh = Math.exp(lerp(Math.log(a.vh), Math.log(b.vh), k)), az = lerp(a.az, b.az, k) + Math.sin(T * .5) * .03, el = lerp(a.el, b.el, k) + Math.sin(T * .37 + 1) * .015;
	let bi = i; while (bi > 0 && !K[bi].bg) bi--; let ai = bi - 1; while (ai > 0 && !K[ai].bg) ai--;
	const bk = K[bi].d ? ease.cubicInOut(seg(T, K[bi].t, K[bi].t + K[bi].d)) : 1;
	return { S: new THREE.Vector3(...S), vh, az, el, whip: !!b.whip && k < 1, bgA: K[Math.max(0, ai)].bg, bgB: K[bi].bg, bk };
}

// ── peças ──
function pendulum(r = .14, len = .5) {
	const g = new THREE.Group(), m = gold();
	const chain = mesh(new THREE.CylinderGeometry(.008, .008, len, 6), m); chain.position.y = -len / 2;
	const coin = mesh(new THREE.CylinderGeometry(r, r, r * .22, 40), m); coin.rotation.x = Math.PI / 2; coin.position.y = -len - r * .9;
	const ring = mesh(new THREE.TorusGeometry(r * .78, r * .07, 8, 32), mat(C.ink, { r: .3 })); ring.position.set(0, -len - r * .9, r * .12);
	const ring2 = ring.clone(); ring2.position.z = -r * .12;
	ad(g, chain, coin, ring, ring2); return g;
}
function heart(s = .2, color = '#FF3355') {
	const sh = new THREE.Shape(); sh.moveTo(0, -1); sh.bezierCurveTo(-1.6, .1, -.9, 1.25, 0, .45); sh.bezierCurveTo(.9, 1.25, 1.6, .1, 0, -1);
	const m = mesh(new THREE.ExtrudeGeometry(sh, { depth: .4, bevelEnabled: true, bevelSize: .18, bevelThickness: .18, bevelSegments: 4 }), color); m.geometry.center(); m.scale.setScalar(s); return m;
}
function spiralTex(c1, c2) {
	const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
	g.fillStyle = c1; g.beginPath(); g.arc(128, 128, 126, 0, 7); g.fill();
	g.strokeStyle = c2; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath();
	for (let a = 0; a < 6 * Math.PI; a += .05) { const r = 8 + a * 6; g.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r); } g.stroke();
	return texOf(c);
}
// confete / formas flutuantes de fundo (micro-movimento)
function floaters(n, seed, cx, colors) {
	const r = mulberry32(seed), g = new THREE.Group(), items = [];
	const geos = [new THREE.TorusGeometry(.16, .06, 10, 24), new THREE.SphereGeometry(.14, 16, 12), new THREE.BoxGeometry(.22, .22, .22), new THREE.ConeGeometry(.15, .28, 16)];
	for (let i = 0; i < n; i++) {
		const m = mesh(geos[i % 4], colors[i % colors.length]); m.castShadow = false;
		const side = i % 2 ? 1 : -1;
		const p = new THREE.Vector3(cx + side * (2.2 + r() * 4), .8 + r() * 4.2, -2.5 - r() * 5);
		items.push({ m, p, ph: r() * 6, sp: .5 + r() * .7, rot: new THREE.Vector3(r(), r(), r()) }); g.add(m);
	}
	g.userData.update = T => items.forEach(o => { o.m.position.set(o.p.x, o.p.y + Math.sin(T * o.sp + o.ph) * .18, o.p.z); o.m.rotation.set(o.rot.x * T, o.rot.y * T * 1.3, o.ph); });
	return g;
}
const ringWave = (color = C.branco) => { const m = new THREE.Mesh(new THREE.RingGeometry(.9, 1, 64), new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = .01; m.renderOrder = 5; return m; };
const wave = (m, T, t0, R = 3, d = .6) => { const k = seg(T, t0, t0 + d); m.visible = T > t0 && k < 1; m.scale.setScalar(.1 + ease.expoOut(k) * R); m.material.opacity = (1 - k) * .8; };
function burst(n, seed, colors, size = .07) { // confete instanciado com balística determinística
	const r = mulberry32(seed), geo = new THREE.PlaneGeometry(size, size * 1.6);
	const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: .5 }), n); m.frustumCulled = false;
	const P0 = []; const col = new THREE.Color();
	for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, up = 4 + r() * 4, out = 1 + r() * 2.5; P0.push({ v: new THREE.Vector3(Math.cos(a) * out, up, Math.sin(a) * out * .6), s: r() * 10, w: 3 + r() * 6 }); m.setColorAt(i, col.set(colors[i % colors.length])); }
	const d = new THREE.Object3D();
	m.userData.update = (T, t0, origin) => {
		const t = T - t0; m.visible = t > 0 && t < 3.5;
		if (!m.visible) return;
		P0.forEach((p, i) => {
			const drag = 1 - Math.exp(-t * 2.2), fall = Math.max(0, t - .35);
			d.position.set(origin.x + p.v.x * drag * .45, origin.y + p.v.y * drag * .45 - fall * fall * .9 - fall * .6, origin.z + p.v.z * drag * .45);
			d.rotation.set(t * p.w + p.s, t * p.w * .7, p.s); d.scale.setScalar(Math.min(1, t * 8)); d.updateMatrix(); m.setMatrixAt(i, d.matrix);
		});
		m.instanceMatrix.needsUpdate = true;
	};
	return m;
}

export function buildWorld() {
	const root = new THREE.Group(), U = [];
	const floor = new THREE.Mesh(new THREE.PlaneGeometry(600, 120), new THREE.ShadowMaterial({ opacity: .26 }));
	floor.rotation.x = -Math.PI / 2; floor.position.set(140, 0, 0); floor.receiveShadow = true; root.add(floor);
	const station = (x, a, b) => { const g = new THREE.Group(); root.add(g); U.push(T => { g.visible = T > a && T < b; }); return g; };
	const flo = (g, x, seed, colors) => { const f = floaters(12, seed, x, colors); g.add(f); U.push(T => g.visible && f.userData.update(T)); };

	// ═══ S0 · sugestão muda a percepção (x = 0) ═══
	{
		const g = station(0, -1, 7.1); flo(g, 0, 11, [C.amarelo, C.turq, C.lima, '#FFFFFF']);
		const A = toy({ shirt: C.ink, pants: '#2D2550', hair: '#2A1A12', hairStyle: 'fringe', collar: C.lima }); at(A.g, -.85, 0, 0); A.g.rotation.y = .6;
		const B = toy({ shirt: C.amarelo, pants: '#5B3FD0', hair: '#7A3B1C', hairStyle: 'bun', skin: '#E9B48C' }); at(B.g, .85, 0, 0); B.g.rotation.y = -.55;
		ad(g, A.g, B.g);
		// pêndulo na mão do hipnotista
		A.arms[1].rotation.set(-1.25, 0, .15); const pd = pendulum(.11, .42); at(pd, 0, -.5, .02); pd.rotation.x = 1.25; A.arms[1].add(pd);
		// limão → maçã na mão dela
		B.arms[0].rotation.set(-1.0, 0, -.25);
		const lemon = mesh(new THREE.SphereGeometry(.13, 24, 16), '#FFE53B'); lemon.scale.set(1.3, 1, 1); at(lemon, 0, -.6, .02); B.arms[0].add(lemon);
		const apple = new THREE.Group(); ad(apple, mesh(new THREE.SphereGeometry(.15, 28, 20), '#F2263C'), at(mesh(new THREE.CylinderGeometry(.012, .015, .1, 6), '#5A3A1A'), 0, .16, 0), at(mesh(new THREE.SphereGeometry(.05, 12, 8), '#3CCB5A'), .05, .17, 0));
		apple.children[0].scale.set(1, .92, 1); apple.children[2].scale.set(1.4, .5, .8); at(apple, 0, -.62, .02); B.arms[0].add(apple);
		const puff = new THREE.Group(); const pr = mulberry32(5); const puffs = [];
		for (let i = 0; i < 9; i++) { const m = mesh(new THREE.SphereGeometry(.09 + pr() * .07, 14, 10), own('#FFFFFF', { t: true })); m.castShadow = false; puffs.push({ m, d: new THREE.Vector3(pr() - .5, pr() - .3, pr() - .5).normalize() }); puff.add(m); }
		g.add(puff);
		// balão de fala "PSIU!"
		const bub = new THREE.Group(); const bs = sign(['PSIU!'], .62, { w: 512, h: 300, bg: '#FFFFFF', fg: C.ink, radius: 120, border: C.ink });
		const tail = mesh(new THREE.ConeGeometry(.07, .18, 3), '#FFFFFF'); at(tail, -.16, -.2, -.01); tail.rotation.z = -.6;
		ad(bub, bs, tail); g.add(bub);
		// óculos de espiral
		const lensT = spiralTex('#FFFFFF', C.ink); const lenses = [-1, 1].map(s => { const l = new THREE.Mesh(new THREE.CircleGeometry(.085, 32), new THREE.MeshBasicMaterial({ map: lensT })); at(l, s * .1, .03, .29); l.renderOrder = 4; B.head.add(l); return l; });
		const frame = [-1, 1].map(s => { const r = mesh(new THREE.TorusGeometry(.088, .018, 8, 24), C.mag); at(r, s * .1, .03, .29); B.head.add(r); return r; });
		const hearts = [0, 1, 2].map(i => { const h = heart(.075); g.add(h); return h; });
		const hitWave = ringWave(C.lima); g.add(hitWave);
		U.push(T => {
			if (!g.visible) return;
			const sw = Math.sin(T * 4.2) * .55; pd.rotation.z = sw;
			A.face({ eyes: blink(T, 1), mouth: T > 1.3 && T < 2.0 ? 'o' : 'smile', brow: .2 }); A.head.rotation.set(-.05, 0, Math.sin(T * 1.3) * .05);
			A.hips.rotation.y = Math.sin(T * 1.1) * .04;
			// balão: nasce na boca dele (1.35), voa em arco até ela (2.05→2.45)
			const k0 = pop(T, 1.3, .35), fk = ease.cubicInOut(seg(T, 1.95, 2.42));
			const p0 = new THREE.Vector3(-.55, 1.95, .35), p1 = new THREE.Vector3(.72, 1.75, .3);
			bub.position.lerpVectors(p0, p1, fk); bub.position.y += hop(T, 1.95, 2.42, .45);
			bub.rotation.z = Math.sin(T * 6) * .06 - fk * .3; sq(bub, k0 * (1 - seg(T, 2.38, 2.48)));
			bub.visible = T > 1.3 && T < 2.48;
			const hit = T > 2.45;
			const stun = hit ? 1 - seg(T, 3.0, 3.4) : 0;
			B.face({ eyes: hit && T < 4.5 ? .15 : blink(T, 3), mouth: hit && T < 3.6 ? 'o' : 'smile', brow: hit && T < 3.4 ? .6 : 0, look: -.4 });
			B.head.rotation.set(Math.sin(T * 1.7) * .04, 0, hit ? Math.sin((T - 2.45) * 18) * .12 * stun : 0);
			wave(hitWave, T, 2.45, 1.6, .5); hitWave.position.set(.85, 1.95, 0); hitWave.rotation.x = 0;
			// POOF 2.7
			const pk = seg(T, 2.68, 3.25);
			lemon.visible = T < 2.74; lemon.rotation.z = Math.sin(T * 30) * .25 * seg(T, 2.45, 2.7);
			apple.visible = T >= 2.74; squash(apple, T, 2.74); apple.rotation.y = T * .8;
			const wp = new THREE.Vector3(); B.arms[0].localToWorld(wp.set(0, -.6, .02)); g.worldToLocal(wp);
			puffs.forEach(({ m, d }, i) => { m.visible = pk > 0 && pk < 1; m.position.copy(wp).addScaledVector(d, ease.expoOut(pk) * .32); sq(m, (1 - pk) * 1.4 + .2); m.material.opacity = 1 - pk; });
			// óculos de espiral (4.5)
			const gk = pop(T, 4.45, .35); lenses.forEach((l, i) => { l.visible = gk > .01; sq(l, gk); l.rotation.z = -T * 7 * (i ? 1 : -1); }); frame.forEach(f => { f.visible = gk > .01; sq(f, gk); });
			B.arms[1].rotation.z = .12 + ease.backOut(seg(T, 5.0, 5.4)) * .9 * (1 - seg(T, 6.3, 6.6));
			hearts.forEach((h, i) => { const t0 = 5.15 + i * .25, k = seg(T, t0, t0 + 1.4); h.visible = k > 0 && k < 1; h.position.set(.8 + (i - 1) * .62 + Math.sin(T * 3 + i) * .05, 1.9 + ease.cubicOut(k) * .5, .35); sq(h, ease.backOut(Math.min(1, k * 4)) * (1 - seg(k, .75, 1)), .075); h.rotation.y = Math.sin(T * 4 + i) * .5; });
			B.g.position.y = hop(T, 4.45, 4.75, .12);
		});
	}

	// ═══ S1 · atenção, imaginação, expectativa, resposta (x = 40) ═══
	{
		const g = station(40, 6.3, 15.6); flo(g, 40, 22, [C.mag, C.amarelo, C.lima, '#FFFFFF']);
		const XS = [35.5, 38.5, 41.5, 44.5], TOPS = [C.mag, C.tang, C.lima, C.ink], LAB = ['ATENÇÃO', 'IMAGINAÇÃO', 'EXPECTATIVA', 'RESPOSTA'], TT = [9.55, 10.38, 11.38, 12.5];
		const peds = XS.map((x, i) => {
			const p = new THREE.Group(); at(p, x, 0, 0);
			const col = mesh(new THREE.CylinderGeometry(.72, .8, 1, 48), C.creme); col.position.y = .5;
			const top = mesh(new THREE.CylinderGeometry(.78, .78, .1, 48), TOPS[i]); top.position.y = 1.05;
			const lab = sign([LAB[i]], 1.25, { w: 640, h: 170, bg: C.ink, fg: '#FFFFFF', radius: 50 }); at(lab, 0, .55, .82);
			ad(p, col, top, lab); g.add(p); return p;
		});
		// 1 · holofote + olho
		const cone = new THREE.Mesh(new THREE.ConeGeometry(.95, 3.2, 48, 1, true), new THREE.MeshBasicMaterial({ color: '#FFF6B0', transparent: true, opacity: .22, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
		cone.renderOrder = 6; at(cone, 35.5, 2.7, 0); g.add(cone);
		const lamp = mesh(new THREE.CylinderGeometry(.18, .26, .35, 24), C.ink); at(lamp, 35.5, 4.35, 0); g.add(lamp);
		const eye = iconBadge('olho', C.mag, .8); at(eye, 35.5, 1.75, .1); g.add(eye);
		// 2 · nuvem + arco-íris
		const cloud = new THREE.Group(); [[0, 0, .3], [-.28, -.05, .22], [.28, -.06, .24], [.12, .14, .2], [-.12, .12, .19]].forEach(([x, y, r]) => cloud.add(at(mesh(new THREE.SphereGeometry(r, 20, 14), '#FFFFFF'), x, y, 0)));
		const rainbow = new THREE.Group(); ['#FF3B5C', '#FFB01F', '#FFE53B', '#3CCB5A', '#3D8BFF'].forEach((c, i) => { const m = mesh(new THREE.TorusGeometry(.62 - i * .07, .036, 8, 48, Math.PI), c); rainbow.add(m); });
		at(rainbow, 0, -.1, -.1); cloud.add(rainbow); at(cloud, 38.5, 1.75, 0); g.add(cloud);
		const stars = [0, 1, 2].map(i => { const s = mesh(new THREE.OctahedronGeometry(.08), C.amarelo); g.add(s); return s; });
		// 3 · caixa-surpresa
		const gift = new THREE.Group(); const gb = box(.62, .5, .62, C.mag, .05); gb.position.y = .25;
		const rib1 = box(.14, .52, .64, C.lima, .02); rib1.position.y = .25; const rib2 = box(.64, .52, .14, C.lima, .02); rib2.position.y = .25;
		const lid = new THREE.Group(); ad(lid, at(box(.7, .14, .7, C.mag, .05), 0, 0, 0), at(box(.16, .16, .72, C.lima, .02), 0, 0, 0), at(mesh(new THREE.TorusGeometry(.09, .035, 8, 20), C.lima), -.08, .12, 0), at(mesh(new THREE.TorusGeometry(.09, .035, 8, 20), C.lima), .08, .12, 0)); lid.position.y = .56;
		ad(gift, gb, rib1, rib2, lid); at(gift, 41.5, 1.1, 0); g.add(gift);
		const bang = sign(['?'], .5, { w: 256, h: 256, bg: C.amarelo, fg: C.ink, radius: 128 }); g.add(bang);
		// 4 · boneca com balão: braço sobe sozinho
		const D = toy({ shirt: C.amarelo, pants: '#5B3FD0', hair: '#7A3B1C', hairStyle: 'bun', skin: '#E9B48C' }); D.g.scale.setScalar(.72); at(D.g, 44.5, 1.1, .05); g.add(D.g);
		const balloon = mesh(new THREE.SphereGeometry(.2, 24, 18), '#FF3B5C'); balloon.scale.set(1, 1.18, 1); g.add(balloon);
		const str = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, 1, 5), mat('#FFFFFF')); g.add(str);
		const checks = XS.map(x => { const c = iconBadge('check', C.lima, .55); g.add(c); return c; });
		U.push(T => {
			if (!g.visible) return;
			peds.forEach((p, i) => { const k = ease.backOut(seg(T, 7.45 + i * .2, 7.95 + i * .2)); p.position.y = -1.3 * (1 - k); p.visible = T > 7.4 + i * .2; });
			const on = TT.map(t => T > t);
			cone.visible = lamp.visible = T > 9.0; cone.material.opacity = on[0] ? .22 + Math.sin(T * 9) * .02 : .0; lamp.position.y = 4.35 - 2 * (1 - ease.expoOut(seg(T, 9.0, 9.6)));
			eye.visible = on[0]; squash(eye, T, TT[0], 1); eye.position.y = 1.75 + Math.sin(T * 2.4) * .06;
			cloud.visible = on[1]; squash(cloud, T, TT[1]); cloud.position.y = 1.75 + Math.sin(T * 2) * .05; rainbow.scale.setScalar(ease.expoOut(seg(T, TT[1] + .15, TT[1] + .6)) + 1e-3);
			stars.forEach((s, i) => { const k = seg(T, TT[1] + .2 + i * .12, TT[1] + 1.2 + i * .12); s.visible = on[1] && k < 1; s.position.set(38.5 + (i - 1) * .55, 2.0 + k * .8, .25); s.rotation.y = T * 6; sq(s, Math.sin(k * Math.PI)); });
			gift.visible = T > 7.4; gift.position.y = peds[2].position.y + 1.1;
			const shake = on[2] ? Math.sin(T * 38) * .07 * (1 - seg(T, TT[2] + .7, TT[2] + 1.0)) : 0; gift.rotation.z = shake; gift.rotation.y = .3;
			lid.position.y = .56 + (on[2] ? Math.abs(Math.sin((T - TT[2]) * 14)) * .1 * (1 - seg(T, TT[2] + .7, TT[2] + .9)) + ease.backOut(seg(T, TT[2] + .72, TT[2] + 1.0)) * .35 : 0);
			lid.rotation.z = on[2] ? ease.backOut(seg(T, TT[2] + .72, TT[2] + 1.0)) * -.5 : 0;
			bang.visible = on[2]; squash(bang, T, TT[2] + .75); at(bang, 41.5, 2.25 + Math.sin(T * 3) * .04, .2);
			D.g.position.y = peds[3].position.y + 1.1; D.g.visible = T > 7.4;
			D.face({ eyes: on[3] ? .7 : blink(T, 2), mouth: on[3] ? 'smile' : 'flat' });
			const up = ease.cubicInOut(seg(T, TT[3] + .1, TT[3] + 1.3));
			D.arms[1].rotation.z = .12 + up * 2.75 + Math.sin(T * 3) * .05 * up; D.head.rotation.z = up * -.12;
			// mão (ponta do braço) → balão acima
			const hp = new THREE.Vector3(0, -.43, 0); D.arms[1].localToWorld(hp); g.worldToLocal(hp);
			const bp = new THREE.Vector3(hp.x + .1 + Math.sin(T * 2) * .05, Math.max(hp.y + .55, D.g.position.y + 1.6 + up * .5), hp.z);
			balloon.position.copy(bp); balloon.visible = str.visible = D.g.visible;
			const mid = hp.clone().add(bp).multiplyScalar(.5), len = hp.distanceTo(bp) - .2;
			str.position.copy(mid); str.scale.set(1, Math.max(.01, len), 1); str.lookAt(bp); str.rotateX(Math.PI / 2);
			checks.forEach((c, i) => { const t0 = 14.0 + i * .14; c.visible = T > t0; squash(c, T, t0); at(c, XS[i] + .55, 2.65, .3); });
		});
	}

	// ═══ S2 · técnicas (cartas) + estudar/aprender (x = 80 / 88) ═══
	{
		const g = station(80, 15.0, 21.9); flo(g, 80, 33, [C.mag, C.turq, C.lima, '#FFFFFF']); flo(g, 88, 34, [C.mag, C.turq, '#FFFFFF']);
		const kinds = ['espiral', 'pendulo', 'olho', 'mao', 'coracao'], cc = [C.mag, C.turq, C.ink, C.azul, C.lima];
		const cards = kinds.map((k, i) => {
			const c = new THREE.Group();
			const body = box(1.0, 1.4, .06, '#FFFFFF', .06);
			const cv = document.createElement('canvas'); cv.width = 400; cv.height = 560; const x = cv.getContext('2d');
			x.fillStyle = cc[i]; x.beginPath(); x.roundRect(0, 0, 400, 560, 36); x.fill();
			x.fillStyle = '#FFFFFF'; x.beginPath(); x.arc(200, 240, 150, 0, 7); x.fill();
			if (k === 'espiral') { x.strokeStyle = C.ink; x.lineWidth = 18; x.lineCap = 'round'; x.beginPath(); for (let a = 0; a < 5.5 * Math.PI; a += .05) { const r = 6 + a * 7.4; x.lineTo(200 + Math.cos(a) * r, 240 + Math.sin(a) * r); } x.stroke(); }
			else if (k === 'pendulo') { x.strokeStyle = C.ink; x.lineWidth = 10; x.beginPath(); x.moveTo(200, 110); x.lineTo(240, 270); x.stroke(); x.fillStyle = C.ouro; x.beginPath(); x.arc(246, 300, 50, 0, 7); x.fill(); x.lineWidth = 12; x.stroke(); }
			else x.drawImage(iconCanvas(k, cc[i] === C.lima ? C.mag : cc[i]), 70, 110, 260, 260);
			x.fillStyle = cc[i] === C.lima ? C.ink : '#FFFFFF'; x.textAlign = 'center'; x.textBaseline = 'middle';
			const s = (() => { let f = 64; for (; f > 10; f -= 2) { x.font = `800 ${f}px "JetBrains Mono"`; if (x.measureText('TÉCNICA ' + (i + 1)).width < 330) break; } return f; })();
			x.font = `800 ${s}px "JetBrains Mono"`; x.fillText('TÉCNICA ' + (i + 1), 200, 470);
			const face = new THREE.Mesh(new THREE.PlaneGeometry(.92, 1.288), new THREE.MeshStandardMaterial({ map: texOf(cv), roughness: .35 })); face.position.z = .032; face.renderOrder = 2;
			ad(c, body, face); g.add(c); return c;
		});
		// mesa
		const desk = new THREE.Group(); at(desk, 88, 0, 0);
		const top = box(2.2, .1, 1.0, '#F5E6D3', .03); top.position.y = .78; desk.add(top);
		[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => desk.add(at(box(.08, .78, .08, C.ink, .02), sx * 1.0, .39, sz * .42)));
		const S = toy({ shirt: C.azul, pants: C.ink, hair: '#1E1410', hairStyle: 'fringe', glasses: true }); at(S.g, 88, 0, -.75); S.sit(1);
		const stool = box(.6, .5, .5, C.mag, .08); at(stool, 88, .25, -.95); g.add(desk, S.g, stool);
		const BC = [C.mag, C.turq, C.lima, C.amarelo], books = BC.map((c, i) => { const b = new THREE.Group(); ad(b, box(.62, .12, .45, c, .03), at(box(.58, .1, .43, '#FFFFFF', .01), .03, 0, 0)); g.add(b); return b; });
		const BT = [18.85, 19.12, 19.4, 19.62];
		const bulb = new THREE.Group(); const glass = mesh(new THREE.SphereGeometry(.22, 24, 18), own('#FFF2A8', { e: '#FFD23F', ei: 0 })); const base = at(mesh(new THREE.CylinderGeometry(.1, .1, .16, 16), '#9AA0B5'), 0, -.25, 0);
		const rays = new THREE.Group(); for (let i = 0; i < 8; i++) { const r = box(.04, .2, .04, C.amarelo, .02); const a = i / 8 * Math.PI * 2; at(r, Math.cos(a) * .42, Math.sin(a) * .42, 0); r.rotation.z = a - Math.PI / 2; rays.add(r); }
		ad(bulb, glass, base, rays); g.add(bulb);
		const ok = iconBadge('check', C.lima, .5); g.add(ok);
		U.push(T => {
			if (!g.visible) return;
			cards.forEach((c, i) => {
				const t0 = 15.75 + i * .12, k = ease.backOut(seg(T, t0, t0 + .55)), n = i - 2;
				const ang = n * .32 * k, R = 2.3;
				c.position.set(80 + Math.sin(ang) * R * k, 1.45 + (Math.cos(ang) - 1) * R * .5 + Math.sin(T * 2 + i) * .04 + (1 - k) * -1.2, -Math.abs(n) * .12 + Math.cos(T * 1.5 + i) * .03);
				c.rotation.set(Math.sin(T * 1.2 + i) * .06, n * -.12 * k + Math.sin(T + i) * .05, -ang * .9 + (1 - k) * 2.5);
				sq(c, Math.max(.001, Math.min(1, seg(T, t0, t0 + .2) * 1.2)));
				c.visible = T > t0;
			});
			S.face({ eyes: T > 20.0 ? 0 : blink(T, 4), mouth: T > 20.0 ? 'o' : 'flat', brow: T > 20 ? -.0 : .4, look: 0 });
			S.head.rotation.x = T < 20 ? .25 : -.15 * ease.backOut(seg(T, 20, 20.3));
			S.arms.forEach((a, i) => { const s = i ? 1 : -1, upk = ease.backOut(seg(T, 20.15, 20.5)); a.rotation.set(-1.2 * (1 - upk), 0, s * (.12 + upk * 2.5)); });
			S.g.position.y = hop(T, 20.15, 20.55, .18);
			books.forEach((b, i) => { const t0 = BT[i], k = seg(T, t0 - .25, t0); b.visible = T > t0 - .25; at(b, 87.3 + Math.sin(i * 2) * .03, .89 + i * .125 + (1 - k * k) * 2.2, .1); b.rotation.y = i * .15 - .1; if (T > t0) { const w = Math.max(0, 1 - (T - t0) * 6); b.scale.set(1 + w * .15, 1 - w * .2, 1 + w * .15); } });
			bulb.visible = T > 19.9; squash(bulb, T, 19.95); at(bulb, 88, 2.3 + Math.sin(T * 3) * .04, -.75);
			glass.material.emissiveIntensity = T > 20.0 ? 1.6 + Math.sin(T * 10) * .2 : 0;
			rays.scale.setScalar(ease.expoOut(seg(T, 20.0, 20.4)) + 1e-3); rays.rotation.z = T * .8;
			ok.visible = T > 20.3; squash(ok, T, 20.3); at(ok, 88.7, 2.45, -.6);
		});
	}

	// ═══ S3 · o curso no notebook (x = 120) ═══
	{
		const g = station(120, 21.0, 25.4); flo(g, 120, 44, [C.amarelo, C.turq, C.lima, '#FFFFFF']);
		const lap = new THREE.Group(); at(lap, 120, 0, 0); g.add(lap);
		const baseL = box(2.5, .1, 1.6, '#2A2340', .05); baseL.position.y = .05; lap.add(baseL);
		lap.add(at(box(2.2, .02, .9, '#3A3256', .01), 0, .105, .2));
		const hinge = new THREE.Group(); at(hinge, 0, .1, -.78); lap.add(hinge);
		const lid = box(2.5, 1.62, .07, '#2A2340', .05); at(lid, 0, .81, 0); hinge.add(lid);
		const sc = document.createElement('canvas'); sc.width = 1000; sc.height = 640; const x = sc.getContext('2d');
		x.fillStyle = C.turq; x.fillRect(0, 0, 1000, 640);
		x.fillStyle = C.ink; x.fillRect(0, 0, 1000, 70); [C.mag, C.amarelo, C.lima].forEach((c, i) => { x.fillStyle = c; x.beginPath(); x.arc(40 + i * 40, 35, 12, 0, 7); x.fill(); });
		x.fillStyle = '#FFFFFF'; x.beginPath(); x.roundRect(80, 110, 840, 180, 30); x.fill();
		x.fillStyle = C.ink; x.textAlign = 'center'; x.textBaseline = 'middle';
		let f = 120; for (; f > 10; f -= 2) { x.font = `900 ${f}px Inter`; if (x.measureText('CURSO DE HIPNOSE').width < 780 && f < 130) break; }
		x.fillText('CURSO DE HIPNOSE', 500, 202);
		x.fillStyle = C.mag; x.beginPath(); x.arc(500, 430, 90, 0, 7); x.fill(); x.fillStyle = '#FFFFFF'; x.beginPath(); x.moveTo(470, 380); x.lineTo(470, 480); x.lineTo(552, 430); x.closePath(); x.fill();
		x.fillStyle = 'rgba(27,16,53,.3)'; x.beginPath(); x.roundRect(120, 560, 760, 22, 11); x.fill(); x.fillStyle = C.lima; x.beginPath(); x.roundRect(120, 560, 300, 22, 11); x.fill();
		const scr = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.472), new THREE.MeshBasicMaterial({ map: texOf(sc), toneMapped: false })); at(scr, 0, .81, .037); scr.renderOrder = 3; hinge.add(scr);
		const S = toy({ shirt: C.azul, pants: C.ink, hair: '#1E1410', hairStyle: 'fringe', glasses: true }); at(S.g, 121.75, 0, .5); S.g.rotation.y = -.5; g.add(S.g);
		const arrow = new THREE.Group(); const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(.3, .3); sh.lineTo(.15, .3); sh.lineTo(.15, .7); sh.lineTo(-.15, .7); sh.lineTo(-.15, .3); sh.lineTo(-.3, .3); sh.closePath();
		const am = mesh(new THREE.ExtrudeGeometry(sh, { depth: .1, bevelEnabled: true, bevelSize: .03, bevelThickness: .03 }), C.lima); arrow.add(am); g.add(arrow);
		const shine = ringWave(C.lima); g.add(shine);
		U.push(T => {
			if (!g.visible) return;
			const k = ease.backOut(seg(T, 21.6, 22.1)); sq(lap, Math.max(.001, k)); lap.rotation.y = (1 - k) * -1.2;
			hinge.rotation.x = -Math.PI / 2 * (1 - ease.backOut(seg(T, 21.95, 22.6))) + .12;
			S.g.visible = T > 22.75; squash(S.g, T, 22.75); S.g.position.y = hop(T, 22.75, 23.05, .3);
			S.face({ eyes: blink(T, 6), mouth: T > 23 ? 'o' : 'smile', look: -.6 }); S.arms[0].rotation.set(-.9 * ease.backOut(seg(T, 23.1, 23.4)), 0, -.5);
			arrow.visible = T > 23.0 && T < 24.6; squash(arrow, T, 23.0, 1); at(arrow, 121.75, 2.0 + Math.abs(Math.sin(T * 7)) * .15, .5); arrow.rotation.set(0, -.3, Math.PI);
			wave(shine, T, 22.6, 2.4, .6); shine.position.set(120, .02, 0); shine.rotation.x = -Math.PI / 2;
		});
	}

	// ═══ S4 · módulos (x = 160) ═══
	{
		const g = station(160, 25.3, 29.3); flo(g, 160, 55, [C.mag, C.amarelo, '#FFFFFF']);
		const MODS = [['01', 'FUNDAMENTOS', 25.62], ['02', 'TUTORIAIS', 26.66], ['03', 'PASSO A PASSO', 28.2]];
		const mods = MODS.map(([n, l, t0], i) => {
			const m = new THREE.Group(); m.add(box(3.3, .82, .14, '#FFFFFF', .14));
			const cv = document.createElement('canvas'); cv.width = 1280; cv.height = 300; const x = cv.getContext('2d');
			x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, 1280, 300);
			x.fillStyle = [C.mag, C.tang, C.ink][i]; x.beginPath(); x.roundRect(30, 40, 220, 220, 50); x.fill();
			x.fillStyle = '#FFFFFF'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '900 120px Inter'; x.fillText(n, 140, 155);
			x.fillStyle = C.ink; x.textAlign = 'left';
			let f = 130; for (; f > 10; f -= 2) { x.font = `900 ${f}px Inter`; const mm = x.measureText(l); if (mm.width < 760 && mm.actualBoundingBoxAscent + mm.actualBoundingBoxDescent < 150) break; } x.fillText(l, 290, 155);
			x.font = '700 34px "JetBrains Mono"'; x.fillStyle = '#8A86A0'; x.fillText('MÓDULO ' + n, 292, 238);
			const face = new THREE.Mesh(new THREE.PlaneGeometry(3.14, .736), new THREE.MeshStandardMaterial({ map: texOf(cv), roughness: .4 })); face.position.z = .072; face.renderOrder = 2; m.add(face);
			const ck = iconBadge('check', C.lima, .62); at(ck, 1.5, .02, .1); m.add(ck); m.userData = { t0, ck };
			g.add(m); return m;
		});
		U.push(T => {
			if (!g.visible) return;
			mods.forEach((m, i) => {
				const { t0, ck } = m.userData, k = ease.expoOut(seg(T, t0 - .1, t0 + .3));
				m.visible = T > t0 - .1;
				at(m, 160 + (1 - k) * 6, 2.75 - i * 1.0 + Math.sin(T * 2 + i) * .03, 0); m.rotation.set(0, (1 - k) * -.8 + Math.sin(T * 1.3 + i) * .04, (1 - k) * -.3);
				const w = Math.max(0, 1 - (T - t0 - .2) * 5) * (T > t0 + .2 ? 1 : 0); m.scale.set(1 - w * .06, 1 + w * .1, 1);
				ck.visible = T > t0 + .45; squash(ck, T, t0 + .45, 1); ck.rotation.z = Math.sin(T * 3 + i) * .1;
			});
		});
	}

	// ═══ S5 · escada do zero (x = 200) ═══
	{
		const g = station(200, 28.6, 31.7); flo(g, 201, 66, [C.mag, C.turq, '#FFFFFF']);
		const SC = [C.lima, C.turq, C.mag, C.azul, C.ink], H = i => .6 + i * .6, X = i => 200 + i * 1.0;
		const steps = SC.map((c, i) => {
			const b = new THREE.Group(); const bx = box(.96, H(i), .96, c, .08); bx.position.y = H(i) / 2; b.add(bx);
			const n = sign([String(i)], .5, { w: 256, h: 256, bg: null, fg: i === 0 ? C.ink : '#FFFFFF' }); at(n, 0, H(i) - .32, .49); b.add(n);
			at(b, X(i), 0, 0); g.add(b); return b;
		});
		const flag = new THREE.Group(); flag.add(at(mesh(new THREE.CylinderGeometry(.02, .02, .9, 8), '#FFFFFF'), 0, .45, 0)); flag.add(at(box(.45, .3, .02, C.lima, .01), .23, .75, 0)); g.add(flag);
		const S = toy({ shirt: C.azul, pants: C.ink, hair: '#1E1410', hairStyle: 'fringe', glasses: true }); g.add(S.g);
		const HOPS = [29.25, 29.62, 29.95, 30.35, 30.72]; // chega em cada degrau
		const land = ringWave('#FFFFFF'); g.add(land);
		U.push(T => {
			if (!g.visible) return;
			steps.forEach((s, i) => { const t0 = 28.95 + i * .06; s.scale.set(1, Math.max(.001, ease.backOut(seg(T, t0, t0 + .4))), 1); });
			let i = 0; while (i + 1 < HOPS.length && T >= HOPS[i + 1] - .3) i++;
			let x, y; const t0 = HOPS[i];
			if (i === 0) { const k = seg(T, 28.95, t0); x = X(0); y = H(0) + (1 - k * k) * 3.5; }
			else { const k = seg(T, t0 - .3, t0), e = ease.sineInOut(k); x = lerp(X(i - 1), X(i), e); y = lerp(H(i - 1), H(i), e) + 4 * .45 * k * (1 - k); }
			const sqk = Math.max(0, 1 - (T - t0) * 5) * (T > t0 ? 1 : 0);
			at(S.g, x, y, 0); S.g.scale.set(1 + sqk * .15, 1 - sqk * .2, 1 + sqk * .15); S.g.rotation.y = .5;
			S.face({ eyes: blink(T, 7), mouth: T > 30.7 ? 'o' : 'smile' });
			const air = T < t0 ? 1 : 0; S.arms.forEach((a, j) => a.rotation.z = (j ? 1 : -1) * (.12 + air * 1.2 + (T > 30.75 ? ease.backOut(seg(T, 30.75, 31.05)) * 1.6 : 0)));
			S.legs.forEach((l, j) => l.rotation.x = air * (j ? .5 : -.5));
			flag.visible = T > 30.75; squash(flag, T, 30.8); at(flag, X(4) + .3, H(4), -.2);
			const li = HOPS.findIndex((h, j) => T >= h && T < h + .5); if (li >= 0) { wave(land, T, HOPS[li], .9, .4); at(land, X(li), H(li) + .02, 0); } else land.visible = false;
		});
	}

	// ═══ S6 · confete + botão COMEÇAR (x = 240) ═══
	{
		const g = station(240, 31.0, 33.6); flo(g, 240, 77, [C.amarelo, C.turq, C.lima, '#FFFFFF']);
		const btn = new THREE.Group(); at(btn, 240.6, 0, 0); g.add(btn);
		btn.add(at(mesh(new THREE.CylinderGeometry(.85, .95, .5, 48), C.ink), 0, .25, 0));
		const cap = mesh(new THREE.CylinderGeometry(.62, .66, .3, 48), '#FF2E3E'); btn.add(cap);
		const lab = sign(['COMEÇAR'], 1.2, { w: 640, h: 170, bg: C.lima, fg: C.ink, radius: 50 }); at(lab, 0, .24, .97); lab.rotation.x = -.15; btn.add(lab);
		const S = toy({ shirt: C.azul, pants: C.ink, hair: '#1E1410', hairStyle: 'fringe', glasses: true }); g.add(S.g);
		const conf = [burst(110, 7, [C.lima, C.amarelo, C.turq, '#FFFFFF', C.azul]), burst(110, 8, [C.lima, C.amarelo, C.turq, '#FFFFFF', C.azul])]; conf.forEach(c => g.add(c));
		const cannons = [-1, 1].map(s => { const c = mesh(new THREE.ConeGeometry(.22, .6, 24, 1, true), C.amarelo); at(c, 240 + s * 1.8, .35, -.6); c.rotation.z = s * .5; g.add(c); return c; });
		const press = ringWave(C.lima); g.add(press);
		const conf2 = burst(140, 9, [C.lima, C.amarelo, C.mag, '#FFFFFF']); g.add(conf2);
		U.push(T => {
			if (!g.visible) return;
			conf[0].userData.update(T, 31.62, new THREE.Vector3(238.2, .6, -.6)); conf[1].userData.update(T, 31.62, new THREE.Vector3(241.8, .6, -.6));
			cannons.forEach((c, i) => { const k = seg(T, 31.62, 31.8); c.scale.set(1 + Math.sin(k * Math.PI) * .3, 1 - Math.sin(k * Math.PI) * .2, 1); });
			btn.scale.setScalar(Math.max(.001, ease.backOut(seg(T, 31.45, 31.85))));
			const pk = T > 32.92 ? Math.max(0, 1 - (T - 32.92) * 3) : 0; cap.position.y = .62 - pk * .16;
			// aluno entra pulando e cai em cima do botão
			const k1 = seg(T, 32.25, 32.92), y = T < 32.25 ? 0 : T < 32.92 ? lerp(0, .78, k1) + 4 * 1.1 * k1 * (1 - k1) : .78 - pk * .16;
			const x = T < 32.25 ? 238.9 : lerp(238.9, 240.6, ease.sineInOut(k1));
			at(S.g, x, y, .05); S.g.rotation.y = T < 32.25 ? .6 : .2;
			const sqk = T > 32.92 ? Math.max(0, 1 - (T - 32.92) * 4) : 0; S.g.scale.set(1 + sqk * .2, 1 - sqk * .25, 1 + sqk * .2);
			S.face({ eyes: blink(T, 9), mouth: T > 32.2 ? 'o' : 'smile', brow: -.2 });
			S.arms.forEach((a, j) => a.rotation.z = (j ? 1 : -1) * (.12 + (T > 32.25 ? 2.6 : .3 + Math.sin(T * 8) * .15)));
			S.g.visible = T > 31.75; if (T < 32.25) S.g.position.y = hop(T, 31.75, 32.05, .25);
			wave(press, T, 32.92, 2.8, .55); at(press, 240.6, .03, 0); press.rotation.x = -Math.PI / 2;
			conf2.userData.update(T, 32.92, new THREE.Vector3(240.6, 1.2, 0));
		});
	}

	// ═══ S7 · moeda R$ 97 (x = 280) ═══
	{
		const g = station(280, 32.9, 99); flo(g, 280, 88, [C.mag, C.turq, C.lima, C.ouro]);
		const coin = new THREE.Group(); g.add(coin);
		const R = 1.15, edge = mesh(new THREE.CylinderGeometry(R, R, .2, 72), gold()); edge.rotation.x = Math.PI / 2; coin.add(edge);
		const fc = document.createElement('canvas'); fc.width = fc.height = 512; const x = fc.getContext('2d');
		x.fillStyle = '#FFC23A'; x.beginPath(); x.arc(256, 256, 256, 0, 7); x.fill();
		x.strokeStyle = '#E09A10'; x.lineWidth = 22; x.beginPath(); x.arc(256, 256, 222, 0, 7); x.stroke();
		x.fillStyle = C.ink; x.textAlign = 'center'; x.textBaseline = 'middle';
		x.font = '800 64px "JetBrains Mono"'; x.fillText('R$', 256, 150);
		let f = 260; for (; f > 20; f -= 4) { x.font = `900 ${f}px Inter`; const m = x.measureText('97'); if (m.width < 330 && m.actualBoundingBoxAscent + m.actualBoundingBoxDescent < 220) break; } x.fillText('97', 256, 300);
		const faceM = new THREE.MeshStandardMaterial({ map: texOf(fc), roughness: .3, metalness: .35 });
		const front = new THREE.Mesh(new THREE.CircleGeometry(R * .97, 72), faceM); front.position.z = .102; front.renderOrder = 2; coin.add(front);
		const back = front.clone(); back.position.z = -.102; back.rotation.y = Math.PI; coin.add(back);
		const chain = mesh(new THREE.CylinderGeometry(.02, .02, 4, 8), gold()); g.add(chain);
		const slam = ringWave(C.lima); g.add(slam);
		// chuva de moedas
		const N = 46, rr = mulberry32(97), cg = new THREE.CylinderGeometry(.16, .16, .04, 24);
		const rain = new THREE.InstancedMesh(cg, gold(), N); rain.frustumCulled = false; rain.castShadow = true; g.add(rain);
		const RD = Array.from({ length: N }, () => ({ x: 280 + (rr() - .5) * 5, z: -1.6 - rr() * 1.4, t0: 34.3 + rr() * 1.2, v: 3 + rr() * 2, w: 4 + rr() * 8, a: rr() * 6 }));
		const d = new THREE.Object3D();
		U.push(T => {
			if (!g.visible) return;
			// cai pendurada como o pêndulo (33.2), gira, e bate de frente em 34.24
			const fall = ease.expoOut(seg(T, 33.15, 33.7));
			const spin = T < 34.24 ? (1 - ease.cubicOut(seg(T, 33.15, 34.24))) * Math.PI * 5 : 0;
			const swing = T < 34.24 ? Math.sin(T * 5) * .25 * (1 - seg(T, 33.6, 34.24)) : 0;
			const hit = T > 34.24 ? Math.max(0, 1 - (T - 34.24) * 4) : 0;
			const cy = 2.35 + (1 - fall) * 5 + Math.sin(T * 1.6) * .05;
			at(coin, 280 + Math.sin(swing) * .4, cy, 0); coin.rotation.set(0, spin + Math.sin(T * .9) * .12 * seg(T, 34.6, 35), swing * .5 + (T > 34.24 ? Math.sin((T - 34.24) * 30) * .06 * hit : 0));
			const s = 1 + hit * .18; coin.scale.set(s, s, s);
			at(chain, coin.position.x, cy + R + 2, -.02); chain.visible = T < 34.24; chain.rotation.z = -swing * .1;
			wave(slam, T, 34.24, 4, .7); at(slam, 280, cy, -.3); slam.rotation.x = 0;
			RD.forEach((c, i) => { const t = T - c.t0; d.position.set(c.x, t < 0 ? 99 : 7 - c.v * t - 2 * t * t, c.z); if (d.position.y < .02) d.position.y = .02; d.rotation.set(c.a + t * c.w, c.a, t * c.w * .6); d.scale.setScalar(1); d.updateMatrix(); rain.setMatrixAt(i, d.matrix); });
			rain.instanceMatrix.needsUpdate = true;
		});
	}

	return { root, update: T => U.forEach(f => f(T)) };
}

// pêndulo de transição: preso na câmera, atravessa o quadro em cada whip
export function buildSwinger(camera) {
	const g = new THREE.Group(); camera.add(g); g.position.set(0, 1.25, -3);
	const pd = pendulum(.34, 1.25); g.add(pd);
	return T => {
		let k = -1, dir = 1; WHIPS.forEach((t, i) => { if (T > t - .12 && T < t + .48) { k = seg(T, t - .12, t + .48); dir = i % 2 ? -1 : 1; } });
		g.visible = k >= 0; if (k < 0) return;
		pd.rotation.z = dir * lerp(-1.35, 1.35, ease.sineInOut(k));
	};
}
