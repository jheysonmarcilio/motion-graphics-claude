// CAPÍTULO I — O laboratório: perdido no shopping (01:08 – 02:38) · mundo de linhas
import * as THREE from 'three';
import { C, col, seg, eo, sm, inOut, lerp, ease, pulse, shots, dips, textPlane, op, uiLayer, uiMap, cue, lineMat, edges, polyline, segs, reveal, circlePts, rectPts, rimMat, figure, glow, dust, texMat, setLineOpacity } from '../lib.js';
import { cardTex, iconTex } from '../draw.js';
import { scribble } from '../worlds.js';

const S = 68;
// chão de pontos (grid) — compartilhado pelos capítulos do mundo de linhas
export function dotFloor(x0, x1, z0, z1, step = .5, color = C.sinapse, opacity = .35) {
	const p = [];
	for (let x = x0; x <= x1; x += step) for (let z = z0; z <= z1; z += step) p.push(x, 0, z);
	const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
	const m = new THREE.PointsMaterial({ color, size: 2, sizeAttenuation: false, transparent: true, opacity, depthWrite: false });
	const pts = new THREE.Points(g, m); pts.frustumCulled = false; return pts;
}
export function carLines(mat) {
	const prof = [[-1, .15], [-1, .45], [-.62, .52], [-.36, .82], [.36, .82], [.62, .52], [1, .45], [1, .15], [-1, .15]];
	const g = new THREE.Group();
	for (const z of [-.45, .45]) {
		g.add(polyline(prof.map(([x, y]) => [x, y, z]), mat));
		for (const wx of [-.6, .6]) g.add(polyline(circlePts(.18, 24, 0, Math.PI * 2, wx, .15).map(([x, y]) => [x, y, z]), mat));
		g.add(polyline([[-.33, .78, z], [-.05, .78, z], [-.05, .55, z], [-.55, .55, z], [-.33, .78, z]], mat));
		g.add(polyline([[.05, .78, z], [.33, .78, z], [.55, .55, z], [.05, .55, z], [.05, .78, z]], mat));
	}
	g.add(segs(prof.slice(0, -1).map(([x, y]) => [x, y, -.45, x, y, .45]), mat));
	return g;
}
export function shoppingLines(mat, rng) {
	const g = new THREE.Group();
	for (const side of [-1, 1]) for (let i = 0; i < 7; i++) {
		const z = 4 - i * 3.6;
		const shop = new THREE.Group(); shop.position.set(side * 5.2, 0, z - 1.6); g.add(shop);
		shop.add(edges(new THREE.BoxGeometry(2.2, 3.2, 3.2).translate(0, 1.6, 0), mat));
		shop.add(polyline([[-side * 1.1, .3, -1.3], [-side * 1.1, 2.4, -1.3], [-side * 1.1, 2.4, 1.3], [-side * 1.1, .3, 1.3]], mat)); // vitrine
		shop.add(polyline([[-side * 1.1, 2.75, -1.2], [-side * 1.1, 2.75, 1.2]], mat));
		for (let k = 0; k < 3; k++) shop.add(edges(new THREE.BoxGeometry(.3, .5 + rng() * .6, .3).translate(-side * .6, .25, -.8 + k * .8), mat));
	}
	// escada rolante ao fundo
	const esc = new THREE.Group(); esc.position.set(0, 0, -18); g.add(esc);
	esc.add(polyline([[-1.2, 0, 2], [-1.2, 4, -3], [1.2, 4, -3], [1.2, 0, 2], [-1.2, 0, 2]], mat));
	for (let k = 0; k < 10; k++) esc.add(polyline([[-1.2, k * .4, 2 - k * .5], [1.2, k * .4, 2 - k * .5]], mat));
	// luzes do teto
	for (let i = 0; i < 9; i++) g.add(polyline([[-1.5, 4.6, 4 - i * 3], [1.5, 4.6, 4 - i * 3]], mat));
	return g;
}

export default {
	id: 'laboratorio', dur: 90,
	async init(ctx) {
		const scene = new THREE.Scene();
		scene.background = new THREE.Color('#0a0b1e');
		scene.fog = new THREE.Fog('#0a0b1e', 10, 34);
		const camera = new THREE.PerspectiveCamera(35, ctx.W / ctx.H, .05, 200);
		const rng = ctx.rng(303);
		const L = lineMat(C.sinapse, .95), Ld = lineMat(C.sinapse, .4), Lr = lineMat(C.emocao, 1), Lw = lineMat(C.luz, .9);
		scene.add(dotFloor(-12, 212, -24, 12, .55));
		const fig = (c = C.sinapse, o = {}) => figure(rimMat(c, { fill: .07, power: 1.6 }), o);

		// ── ZD: mesa de pesquisa ──
		const ZD = new THREE.Group(); scene.add(ZD);
		const deskParts = [
			edges(new THREE.BoxGeometry(2.6, .06, 1.2).translate(0, .76, 0), L),
			...[[-1.2, -.5], [1.2, -.5], [-1.2, .5], [1.2, .5]].map(([x, z]) => edges(new THREE.BoxGeometry(.05, .76, .05).translate(x, .38, z), L)),
			...[0, 1, 2, 3].map(i => edges(new THREE.BoxGeometry(.5, .025, .36).translate(-.7 + (i % 2) * .05, .8 + i * .03, -.1), L)),
			polyline([[.8, .79, -.3], [.8, 1.4, -.35], [1.1, 1.7, -.3], [1.25, 1.62, -.3]], L),
			polyline(circlePts(.16, 20, Math.PI, Math.PI * 2, 1.25, 1.62).map(([x, y]) => [x, y, -.3]), L),
		];
		deskParts.forEach(p => ZD.add(p));
		const wall = new THREE.Group(); ZD.add(wall); wall.position.z = -3;
		for (let i = -6; i <= 6; i++) wall.add(polyline([[i * .7, 0, 0], [i * .7, 4, 0]], Ld));
		for (let j = 0; j <= 5; j++) wall.add(polyline([[-4.2, j * .8, 0], [4.2, j * .8, 0]], Ld));
		const card1 = textPlane('I · O LABORATÓRIO', { size: 110, height: .42, color: C.sinapse, glow: 26 }); card1.position.set(0, 2.55, -2.95); ZD.add(card1);
		const lamp = glow(C.sinapse, .3, .6); lamp.position.set(1.25, 1.55, -.3); ZD.add(lamp);

		// ── ZC: carros, velocímetro, moldura ──
		const ZC = new THREE.Group(); ZC.position.x = 40; scene.add(ZC);
		const car1 = carLines(L), car2 = carLines(L); car2.rotation.y = Math.PI; ZC.add(car1, car2);
		const wTo = textPlane('TOCARAM', { size: 110, height: .3, color: C.sinapse, glow: 20 }), wEs = textPlane('ESMAGARAM', { size: 110, height: .3, color: C.emocao, glow: 20 });
		[wTo, wEs].forEach(w => { w.position.set(0, 1.55, 0); ZC.add(w); });
		const SP = new THREE.Group(); SP.position.set(6, 1.2, 0); ZC.add(SP);
		SP.add(polyline(circlePts(.9, 80, -Math.PI * .25, Math.PI * 1.25), L));
		const ticks = []; for (let i = 0; i <= 12; i++) { const a = Math.PI * 1.25 - i / 12 * Math.PI * 1.5; ticks.push([Math.cos(a) * .9, Math.sin(a) * .9, 0, Math.cos(a) * (i % 2 ? .82 : .74), Math.sin(a) * (i % 2 ? .82 : .74), 0]); }
		SP.add(segs(ticks, L));
		const needle = polyline([[0, 0, .01], [.72, 0, .01]], Lr); SP.add(needle);
		const hub = glow(C.emocao, .25, 1); SP.add(hub);
		const frame = polyline(rectPts(6.2, 4.2), Lw); frame.position.set(6, 1.2, -.02); ZC.add(frame);
		const names = textPlane('LOFTUS & PICKRELL · 1995', { size: 90, weight: 300, height: .36, color: C.luz, track: .16 }); names.position.set(6, 1.75, 0); ZC.add(names);
		const mkEnv = () => { const m = lineMat(C.sinapse, .95), e = new THREE.Group(); e.add(polyline(rectPts(.7, .45), m), polyline([[-.35, .225, 0], [0, -.03, 0], [.35, .225, 0]], m)); return e; };
		const env = mkEnv(); ZC.add(env);
		const dotG = glow(C.emocao, .3, 1); ZC.add(dotG);

		// ── ZF: o parente ──
		const ZF = new THREE.Group(); ZF.position.x = 80; scene.add(ZF);
		const res = fig(); res.position.set(-3.2, 0, 1.2); res.rotation.y = .8; ZF.add(res);
		const mom = fig(), bro = fig(C.sinapse, { h: 1.55 }); mom.position.set(2.4, 0, -1); bro.position.set(3.3, 0, -.6); mom.rotation.y = bro.rotation.y = -.7; ZF.add(mom, bro);
		const env2 = mkEnv(); ZF.add(env2);
		const titles = ['a bicicleta', 'o casamento da tia', 'a primeira escola'];
		const fcards = titles.map((tt, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(.9, .6), new THREE.MeshBasicMaterial({ map: cardTex(tt, i + 1), transparent: true, opacity: 0, depthWrite: false })); m.position.set(.2 + i * 1.05, 2.5 + (i % 2) * .25, -.4); ZF.add(m); return m; });
		const ribbons = fcards.map((c, i) => { const src = i < 2 ? mom : bro; const s0 = new THREE.Vector3(src.position.x, 1.6, src.position.z); const e = c.position; const pts = []; for (let k = 0; k <= 40; k++) { const u = k / 40; pts.push(new THREE.Vector3(lerp(s0.x, e.x, u), lerp(s0.y, e.y - .3, u) + Math.sin(u * Math.PI) * .6, lerp(s0.z, e.z, u))); } const l = polyline(pts, lineMat(C.luz, .8)); ZF.add(l); return l; });

		// ── ZN: caderno com 4 histórias ──
		const ZN = new THREE.Group(); ZN.position.x = 120; scene.add(ZN);
		ZN.add(edges(new THREE.BoxGeometry(5.8, .08, 3.4).translate(0, .04, .2), L), polyline([[0, .09, -1.5], [0, .09, 1.9]], Ld));
		const ncTitles = ['a bicicleta', 'o casamento da tia', 'a primeira escola', 'o shopping'];
		const ncX = [-2.05, -.68, .68, 2.05];
		const ncards = ncTitles.map((tt, i) => {
			const g = new THREE.Group(); g.position.set(ncX[i], .1, -.55); ZN.add(g);
			const on = new THREE.Mesh(new THREE.PlaneGeometry(1.24, .83), new THREE.MeshBasicMaterial({ map: cardTex(tt, i + 1, i === 3 ? C.emocao : C.sinapse), transparent: true, depthWrite: false }));
			on.rotation.x = -Math.PI / 2; g.add(on);
			const chk = polyline([[-.12, 0, 0], [-.03, -.1, 0], [.15, .12, 0]], lineMat(C.sinapse, 1)); chk.rotation.x = -Math.PI / 2; chk.position.set(.45, .01, -.25); chk.scale.setScalar(1.2); g.add(chk);
			const wl = scribble(rng, 1.1, 3, .36); wl.rotation.x = -Math.PI / 2; wl.position.set(0, .01, .78); wl.material.color.set(C.luz); g.add(wl);
			return { g, on, chk, wl };
		});
		const cal = new THREE.Group(); cal.position.set(2.3, .1, 1.35); cal.rotation.x = -Math.PI / 2; ZN.add(cal);
		const cs = []; for (let i = 0; i <= 7; i++) cs.push([-.7 + i * .2, -.4, 0, -.7 + i * .2, .4, 0]); for (let j = 0; j <= 4; j++) cs.push([-.7, -.4 + j * .2, 0, .7, -.4 + j * .2, 0]);
		cal.add(segs(cs, Ld));
		const circ = [[-.5, .1], [.3, -.1]].map(([x, y]) => { const c = polyline(circlePts(.09, 30, 0, Math.PI * 2, x, y), lineMat(C.emocao, 1)); cal.add(c); return c; });
		const sig = scribble(rng, .6, 1, 0); sig.material.color.set(C.emocao); sig.rotation.x = -Math.PI / 2; sig.position.set(ncX[3] + .1, .12, -.3); ZN.add(sig);
		const stamp = new THREE.Mesh(new THREE.PlaneGeometry(.55, .55), texMat(iconTex('familia', C.emocao, 512, 14), { additive: true })); stamp.rotation.x = -Math.PI / 2; stamp.position.set(ncX[3] + .35, .13, -.6); ZN.add(stamp);

		// ── ZS: shopping ──
		const ZS = new THREE.Group(); ZS.position.x = 160; scene.add(ZS);
		ZS.add(shoppingLines(Ld, rng));
		const crowd = []; for (let i = 0; i < 28; i++) { const f = fig(C.sinapse, { h: 1.6 + rng() * .3 }); const lane = (rng() < .5 ? -1 : 1) * (1.2 + rng() * 2.2); const dir = rng() < .5 ? 1 : -1; f.rotation.y = dir > 0 ? 0 : Math.PI; ZS.add(f); crowd.push({ f, lane, dir, z0: rng() * 26, sp: .9 + rng() * .5, ph: rng() * 6 }); }
		const child = fig(C.luz, { h: 1.0, child: true }); child.position.set(0, 0, 0); child.rotation.y = .2; ZS.add(child);
		const old = fig(C.sinapse, { h: 1.68, hunch: .25 }); ZS.add(old);
		const det = new THREE.Group(); old.add(det);
		const hat = [edges(new THREE.CylinderGeometry(.12, .13, .14, 16).translate(0, 1.74, 0), Lr), polyline(circlePts(.24, 30).map(([x, y]) => [x, 1.67, y]), Lr)];
		const coat = [polyline([[-.2, 1.45, .05], [-.32, .55, .12], [.32, .55, .12], [.2, 1.45, .05]], Lr), polyline([[0, 1.4, .17], [0, .6, .17]], Lr)];
		const cane = [polyline([[.38, 0, .25], [.36, 1.0, .2], [.28, 1.08, .2]], Lr)];
		const details = [...hat, ...coat, ...cane]; details.forEach(d => det.add(d));
		const tear = glow(C.luz, .12, 1); ZS.add(tear);

		// ── ZG: grade 6×4 ──
		const ZG = new THREE.Group(); ZG.position.x = 200; scene.add(ZG);
		const grid = []; const lit = [2, 7, 11, 14, 19, 22];
		for (let i = 0; i < 24; i++) { const m = rimMat(C.sinapse, { fill: .05, power: 1.7 }); const f = figure(m, { h: .9 }); f.position.set((i % 6 - 2.5) * .85 - 1.7, (3 - Math.floor(i / 6)) * 1.05 - .2, 0); ZG.add(f); grid.push({ f, m, k: lit.indexOf(i) }); }

		// ── UI ──
		const ui = uiLayer(`
			<div data-k="lof" class="lbl" style="left:120px;top:170px">Elizabeth Loftus</div>
			<div data-k="lof2" class="sm" style="left:120px;top:222px">psicóloga · memória e testemunho</div>
			<div data-k="ano" class="lbl c" style="right:120px;top:170px">anos 90</div>
			<div data-k="v1" class="mid" style="left:150px;top:760px">se <b style="color:#3EE6FF;font-weight:800">tocaram</b> → ≈ 51 km/h</div>
			<div data-k="v2" class="mid" style="left:150px;top:850px">se <b style="color:#FF5C7A;font-weight:800">esmagaram</b> → ≈ 65 km/h</div>
			<div data-k="s1" class="src">Loftus &amp; Palmer, 1974 · médias convertidas de mph</div>
			<div data-k="det" class="lbl a" style="left:1060px;top:600px;font-size:22px">um detalhe</div>
			<div data-k="int" class="q cx" style="top:470px">uma lembrança inteira?</div>
			<div data-k="ill" class="ill" style="right:80px;bottom:44px">exemplos ilustrativos</div>
			<div data-k="quo" class="it cx" style="top:120px">“Aos cinco anos, você se perdeu num shopping…”</div>
			<div data-k="e1" class="lbl c" style="left:560px;top:860px">entrevista 1</div>
			<div data-k="e2" class="lbl c" style="left:1120px;top:860px">entrevista 2</div>
			<div data-k="nin" class="it cx" style="top:110px">ninguém disse: <span style="text-decoration:line-through;text-decoration-color:#FF5C7A">“você precisa lembrar”</span></div>
			<div data-k="n6" class="big" style="right:150px;top:330px">6<span style="opacity:.5"> / 24</span></div>
			<div data-k="n14" class="big" style="right:150px;top:330px"><b style="color:#FF5C7A">1</b> em 4</div>
			<div data-k="s2" class="src">Loftus &amp; Pickrell, 1995 · 24 participantes</div>`);
		const U = uiMap(ui);

		const SH = [
			{ a: 68, b: 75, p0: [0, 1.9, 5.8], p1: [0, 1.55, 3.7], l0: [0, 1.15, -1], l1: [0, 1.2, -1] },
			{ a: 75, b: 80, p0: [38.4, .95, 5], p1: [41.4, .9, 4.6], l0: [39.6, .55, 0], l1: [40.6, .55, 0] },
			{ a: 80, b: 85, p0: [45.7, 1.25, 2.4], p1: [46, 1.2, 1.9], l0: [46, 1.2, 0], l1: [46, 1.2, 0] },
			{ a: 85, b: 92, p0: [46, 1.2, 1.9], p1: [46, 1.2, 8.6], l0: [46, 1.2, 0], l1: [46, 1.2, 0], e: ease.expoInOut },
			{ a: 92, b: 98, p0: [45.3, 1.3, 8.4], p1: [46.9, 1.25, 7.9], l0: [45.6, 1.3, 0], l1: [46.6, 1.3, 0] },
			{ a: 98, b: 106, p0: [76.6, 1.5, 6.4], p1: [82.6, 1.5, 6], l0: [77.4, 1.3, 0], l1: [82, 1.4, 0] },
			{ a: 106, b: 113, p0: [120, 6.6, 1.3], p1: [120, 5.1, 1.0], l0: [120, 0, 0], l1: [120, 0, -.1] },
			{ a: 113, b: 117, p0: [121.6, 3.2, 1.0], p1: [122.05, .62, -.35], l0: [122.05, 0, -.55], l1: [122.05, 0, -.56], e: ease.expoIn },
			{ a: 117, b: 123, p0: [160, 6.5, 10], p1: [160, 2.3, 5.8], l0: [160, .4, -3], l1: [160, .7, -2] },
			{ a: 123, b: 130, p0: [118.2, 3.4, 2.9], p1: [121.9, 3.4, 2.7], l0: [118.5, 0, .3], l1: [121.6, 0, .3] },
			{ a: 130, b: 138, p0: [122.05, 1.7, .9], p1: [122.1, 1.35, .62], l0: [122.1, 0, -.5], l1: [122.1, 0, -.48], roll: [0, .055] },
			{ a: 138, b: 146, p0: [200, 1.5, 6.8], p1: [200, 1.7, 9.6], l0: [200, 1.3, 0], l1: [200, 1.4, 0] },
			{ a: 146, b: 152, p0: [161.6, 1.5, 3.2], p1: [161.0, 1.45, 1.4], l0: [160.4, 1.2, -1.6], l1: [160.4, 1.25, -1.6] },
			{ a: 152, b: 158, fn: (cam, k, t) => { const a = lerp(-.5, .35, k); cam.position.set(160 + Math.sin(a) * 2.7, .95, Math.cos(a) * 2.7); cam.up.set(0, 1, 0); cam.lookAt(160, .55, 0); } },
		];
		const CUTS = [75, 80, 98, 106, 117, 123, 130, 138, 146, 152];

		return {
			scene, camera, ui, bloom: { strength: .85, radius: .5, threshold: .35 }, exposure: 1,
			fadeFn: lt => dips(lt + S, CUTS, .18) * .95,
			update(lt) {
				const t = lt + S;
				shots(camera, t, SH);
				// ZD
				deskParts.forEach((p, i) => reveal(p, seg(t, 68.2 + i * .12, 69.6 + i * .12)));
				wall.children.forEach((l, i) => reveal(l, seg(t, 68 + i * .05, 69.5 + i * .05)));
				op(card1, inOut(t, 69, 70.4, 73.6, 74.6)); lamp.material.opacity = .4 + .2 * Math.sin(t * 3);
				cue(U.lof, t, 70.6, 74.8); cue(U.lof2, t, 71, 74.8); cue(U.ano, t, 71.2, 74.8);
				// ZC carros
				const ck = ease.cubicOut(seg(t, 75, 78.6));
				car1.position.x = lerp(-3.2, -1.02, ck); car2.position.x = lerp(3.2, 1.02, ck);
				const crush = eo(t, 78.5, 79.2) * (t > 77.6 ? 1 : 0);
				car1.scale.x = 1 - crush * .1; car2.scale.x = 1 - crush * .1;
				car1.position.y = car2.position.y = Math.max(0, Math.sin((t - 78.6) * 18) * .03 * pulse(t, 78.6, .3));
				const es = t > 77.4;
				op(wTo, (es ? 0 : 1) * inOut(t, 75.4, 76, 79.6, 80)); op(wEs, (es ? 1 : 0) * inOut(t, 77.4, 77.6, 79.6, 80));
				wEs.scale.setScalar(1 + pulse(t, 77.4, .4) * .25);
				// velocímetro
				const sp = t < 82.5 ? lerp(0, 51, eo(t, 80.4, 81.6)) : lerp(51, 65, eo(t, 82.5, 83.4));
				const ang = Math.PI * 1.25 - (sp / 120) * Math.PI * 1.5 + Math.sin(t * 30) * .006;
				needle.rotation.z = ang;
				cue(U.v1, t, 80.8, 84.9); cue(U.v2, t, 82.6, 84.9); cue(U.s1, t, 81.5, 84.9);
				const shrink = ease.expoInOut(seg(t, 85.4, 87));
				SP.scale.setScalar(Math.max(.001, 1 - shrink)); SP.visible = shrink < .999;
				dotG.position.set(6, 1.2, .02); dotG.material.opacity = shrink > .9 ? .9 : 0; dotG.scale.setScalar(.25 + .05 * Math.sin(t * 5));
				const fr = sm(t, 87.6, 89.2); frame.visible = t > 87.3; reveal(frame, fr);
				cue(U.det, t, 86.6, 88.6); cue(U.int, t, 88.8, 91.8);
				names.material.uniforms.uReveal.value = seg(t, 92.4, 94.6) * 1.05; op(names, t > 92.3 ? 1 - sm(t, 97.4, 98) : 0);
				const ek = sm(t, 94.4, 97.8); env.position.set(lerp(6.2, 10.5, ek), lerp(.6, 1.0, ek), .02); env.rotation.z = Math.sin(t * 2) * .08; setLineOpacity(env, inOut(t, 94.2, 94.8, 97.4, 98));
				// ZF
				const e2 = sm(t, 98.4, 101.6); env2.position.set(lerp(-2.6, 2.0, e2), 1.3 + Math.sin(e2 * Math.PI) * .5, 0); env2.rotation.z = Math.sin(t * 2) * .1; setLineOpacity(env2, inOut(t, 98.4, 99, 101.4, 102));
				[res, mom, bro].forEach((f, i) => f.set({ t: t + i, breathe: 1 }));
				ribbons.forEach((r, i) => reveal(r, seg(t, 101.6 + i * .6, 103 + i * .6)));
				fcards.forEach((c, i) => { const k = eo(t, 102.6 + i * .6, 103.6 + i * .6); c.material.opacity = k; c.position.y = 2.5 + (i % 2) * .25 + Math.sin(t + i) * .04 + (1 - k) * -.3; c.lookAt(camera.position); });
				// ZN
				ncards.forEach((c, i) => {
					const inK = eo(t, 106.4 + i * .35, 107.4 + i * .35);
					c.g.position.y = .1 + (1 - inK) * .6; c.on.material.opacity = inK * (i < 3 ? 1 : (t < 113 ? .35 : 1));
					if (i < 3) reveal(c.chk, seg(t, 108.6 + i * .7, 109.2 + i * .7)); else c.chk.visible = false;
					reveal(c.wl, seg(t, 124 + i * .9, 125.6 + i * .9));
				});
				ncards[3].g.scale.setScalar(1 + pulse(t, 113.2, .5) * .06);
				circ.forEach((c, i) => reveal(c, seg(t, 126.4 + i * 1.4, 127.2 + i * 1.4)));
				cue(U.e1, t, 126.4, 129.8); cue(U.e2, t, 127.8, 129.8);
				reveal(sig, seg(t, 130.6, 132.4));
				const st = seg(t, 133.2, 133.6); stamp.visible = t > 133.2; stamp.scale.setScalar(lerp(1.8, 1, ease.expoOut(st))); op(stamp, t > 133.2 ? .95 : 0); stamp.rotation.z = -.18;
				cue(U.nin, t, 134, 137.8);
				// ZS
				for (const c of crowd) { const z = 6 - ((c.z0 + t * c.sp * .9) % 26); c.f.position.set(c.lane, 0, c.dir > 0 ? -z + -14 + 20 : z - 6); c.f.set({ walk: t * 5 * c.sp + c.ph, amp: .45 }); }
				child.set({ t, tremble: 1, breathe: 1 });
				const oz = lerp(-12, -1.6, sm(t, 117, 149));
				old.position.set(.35, 0, oz); old.rotation.y = 0; old.set({ walk: t * 3.6, amp: t < 149 ? .3 : .3 * (1 - sm(t, 149, 150)), t });
				details.forEach((d, i) => reveal(d, seg(t, 147.2 + i * .55, 148.2 + i * .55)));
				cue(U.quo, t, 118.4, 122.8);
				tear.position.set(.03, lerp(.86, .55, seg((t - 153) % 2.5, 0, 2.5)), .14); tear.material.opacity = t > 152.6 ? .9 : 0;
				// ZG
				grid.forEach(g => { const k = g.k >= 0 ? eo(t, 139.4 + g.k * .55, 139.9 + g.k * .55) : 0; g.m.uniforms.uColor.value.copy(col(C.sinapse)).lerp(col(C.emocao), k); g.m.uniforms.uFill.value = .05 + .3 * k; g.f.set({ t: t + g.f.position.x, breathe: 1 }); });
				cue(U.n6, t, 140.6, 143.4, { dout: .3 }); cue(U.n14, t, 143.4, 145.9, { din: .4 }); cue(U.s2, t, 141.2, 145.9);
				cue(U.ill, t, 102.6, 105.9);
			},
		};
	},
};
