// Short 21 — A estrada hipnótica (teste do painel). Linguagem: diorama de brinquedo 3D (toy.js) + trecho flat (flat.js).
// Herói: holofote de foco (diorama.js → spot). Tempos = narração (fala.json + transcrição fina).
import * as THREE from 'three';
import { clamp, seg, ease, lerp, smooth, wobble } from './lib.js';
import { toy, sign, iconBadge, blink } from './toy.js';
import { C, spot, roadLoop, car, house, armchair, padlock, guideHand } from './diorama.js';
import * as F from './flat.js';
import { buildOverlay } from './overlay.js';

const W = 1080, H = 1920, DURATION = 39.0;
const $ = s => document.querySelector(s);
const stage = $('#stage'), params = new URLSearchParams(location.search);
await Promise.all(['900 100px Inter', '800 100px Inter', '700 30px "JetBrains Mono"'].map(f => document.fonts.load(f)));

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.NeutralToneMapping; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.prepend(renderer.domElement);

// ── mundo 3D: 4 maquetes lado a lado ──
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, .1, 200); scene.add(camera);
const hemi = new THREE.HemisphereLight('#FFFFFF', '#7ED9C0', 1.6); scene.add(hemi);
const sun = new THREE.DirectionalLight('#FFF1DC', 2.6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 }); sun.shadow.bias = -.0006;
scene.add(sun, sun.target);
const ORG = { H: 0, R: 100, C: 200, O: 300 };
const at = (k, o) => { o.position.x += ORG[k]; scene.add(o); return o; };
const bills = [];                                   // placas que sempre encaram a câmera
const bill = o => (bills.push(o), o);
const sg = (txt, w, o) => bill(sign(txt, w, { w: 512, h: 512, radius: 256, bg: '#FFFFFF', fg: C.tinta, border: C.tinta, ...o }));

// H — porta de casa
const gH = at('H', new THREE.Group());
{ const gr = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshPhysicalMaterial({ color: '#BDEBD9', roughness: .9 })); gr.rotation.x = -Math.PI / 2; gr.receiveShadow = true; gH.add(gr);
	const rd = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 40), new THREE.MeshPhysicalMaterial({ color: '#C9CFDA', roughness: .9 })); rd.rotation.x = -Math.PI / 2; rd.rotation.z = -.06; rd.position.set(2.6, .01, -20); rd.receiveShadow = true; gH.add(rd); }
const hs = house(); hs.position.set(-.6, 0, -2.2); gH.add(hs);
const mH = toy({ shirt: C.tang, pants: C.tinta, glasses: true, hair: '#3B2A22' }); gH.add(mH.g); mH.g.position.set(0, 0, .1);
const qH = sg('?', .7); qH.position.set(.55, 1.75, .3); gH.add(qH);
const dots = []; for (let i = 0; i < 16; i++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .04, 12), new THREE.MeshStandardMaterial({ color: C.tang, transparent: true })); const u = i / 15; d.position.set(lerp(.6, 3.2, u), .04, lerp(.2, -18, Math.pow(u, 1.3))); gH.add(d); dots.push(d); }
const xH = bill(iconBadge('x', '#F0524A', .75)); xH.position.set(-.1, 1.1, 1.0); gH.add(xH);
const carH = car(); carH.g.position.set(1.8, 0, .5); carH.g.rotation.y = -.35; gH.add(carH.g);

// R — estrada de maquete (o mundo rola, o carro fica)
const gR = at('R', new THREE.Group());
const road = roadLoop({ seed: 21 }); gR.add(road.g);
const carR = car(); gR.add(carR.g);
const card = bill(sign('MARCOS', 1.5, { w: 512, h: 170, bg: C.amarelo, fg: C.tinta, border: C.tinta })); card.position.set(0, 2.1, 0); gR.add(card);
const spR = spot({ h: 8 }); gR.add(spR.g);
const abs = sign('ABSORÇÃO', 1.5, { w: 768, h: 200, bg: C.tang, fg: C.tinta, border: C.tinta }); abs.position.set(0, 2.0, .2); gR.add(abs);
const nums = [1, 2, 3, 4].map((n, i) => { const s = sign(String(n), .24, { w: 256, h: 256, radius: 128, bg: C.amarelo, fg: C.tinta, border: C.tinta }); s.position.set(-.42 + i * .27, .5, -3); camera.add(s); return s; });

// C — cabine (volante, banco vazio, placa)
const gC = at('C', new THREE.Group());
const road2 = roadLoop({ seed: 7, speed: 7 }); road2.g.position.z = -2; gC.add(road2.g);
{ const { box } = await import('./toy.js');
	const dash = box(3.2, .6, .9, C.petro, .12); dash.position.set(0, 1.1, -1.1); gC.add(dash);
	const hood = box(2.4, .5, 1.6, C.petro, .3); hood.position.set(0, .7, -2.4); gC.add(hood);
	const seat = box(.95, .18, .9, C.tang, .08); seat.position.set(-.45, .8, .7); gC.add(seat);
	const back = box(.95, 1.1, .18, C.tang, .08); back.position.set(-.45, 1.4, 1.15); gC.add(back);
	const col = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .6, 10), new THREE.MeshStandardMaterial({ color: C.tinta })); col.rotation.x = 1.0; col.position.set(-.45, 1.3, -.7); gC.add(col); }
const wheelC = new THREE.Group(); wheelC.position.set(-.45, 1.5, -.45); wheelC.rotation.x = -.45; gC.add(wheelC);
{ const r = new THREE.Mesh(new THREE.TorusGeometry(.42, .06, 12, 40), new THREE.MeshPhysicalMaterial({ color: C.tinta, clearcoat: .7, roughness: .35 })); r.castShadow = true; wheelC.add(r);
	for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(.06, .42, .05), r.material); s.rotation.z = i * Math.PI * 2 / 3; s.position.set(Math.sin(-i * 2.094) * .2, Math.cos(i * 2.094) * .2, 0); wheelC.add(s); }
	const hub = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .08, 20), new THREE.MeshPhysicalMaterial({ color: C.amarelo })); hub.rotation.x = Math.PI / 2; wheelC.add(hub); }
const qC = sg('?', .4); qC.position.set(-.45, 2.25, .75); gC.add(qC);
const pilot = sign(['PILOTO', 'AUTOMÁTICO'], .85, { w: 512, h: 256, bg: C.creme, fg: C.tinta, border: C.tang }); pilot.position.set(.45, 1.62, -.75); pilot.rotation.x = -.2; gC.add(pilot);
pilot.material.emissive = new THREE.Color('#FFFFFF'); pilot.material.emissiveMap = pilot.material.map;
const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.0), new THREE.MeshBasicMaterial({ color: C.tang, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); glow.position.set(.45, 1.62, -.8); glow.scale.setScalar(.7); glow.rotation.x = -.2; glow.renderOrder = 1; gC.add(glow);

// O — consultório de brinquedo
const gO = at('O', new THREE.Group());
{ const { box } = await import('./toy.js');
	const fl = box(16, .2, 10, C.madeira, .05, { r: .8, cc: .1 }); fl.position.y = -.1; gO.add(fl);
	const wl = box(16, 6, .3, '#2B4F5E', .05, { r: .9, cc: 0 }); wl.position.set(0, 3, -3); gO.add(wl);
	const couch = box(2.6, .6, 1.1, C.tang, .2); couch.position.set(4, .3, 0); gO.add(couch);
	const cb = box(2.6, .7, .3, C.tang, .15); cb.position.set(4, .9, -.45); gO.add(cb); }
const ch = armchair(); gO.add(ch);
const mO = toy({ shirt: C.tang, pants: C.tinta, glasses: true, hair: '#3B2A22' }); mO.sit(1); mO.g.position.set(0, .35, .2); gO.add(mO.g);
const mS = toy({ shirt: C.menta, pants: C.petro, hair: '#6B3E26', hairStyle: 'bun' }); mS.g.rotation.z = -Math.PI / 2; mS.g.position.set(3.0, .82, .1); mS.face({ eyes: 1, mouth: 'flat' }); gO.add(mS.g);
const zs = [0, 1, 2].map(i => { const z = sg('Z', .45 - i * .06, { bg: C.creme }); gO.add(z); return z; });
const xZ = bill(iconBadge('x', '#F0524A', .8)); xZ.position.set(4.3, 2.3, .6); gO.add(xZ);
const lock = padlock(); lock.g.position.set(-4, 0, 0); gO.add(lock.g);
const xL = bill(iconBadge('x', '#F0524A', .75)); xL.position.set(-3.45, 2.0, .5); gO.add(xL);
const hand = guideHand(); hand.position.set(3, 1.45, .7); hand.rotation.y = .3; gO.add(hand);
const ok = bill(iconBadge('check', '#4CCB7A', 1.0)); ok.position.set(-.9, 2.4, .4); gO.add(ok);
const hip = bill(sign('= HIPNOSE', 1.9, { w: 640, h: 180, bg: C.amarelo, fg: C.tinta, border: C.tinta })); hip.position.set(0, 2.75, .2); gO.add(hip);
const steps = []; for (let i = 0; i < 6; i++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .04, 14), new THREE.MeshStandardMaterial({ color: C.amarelo, emissive: C.amarelo, emissiveIntensity: .6 })); d.position.set(.2 + i * .1, .03, 1.2 + i * .55); gO.add(d); steps.push(d); }
const spO = [[0, 1.5], [4, 1.8], [-4, 1.4]].map(([x, r]) => { const s = spot({ h: 6, r, power: 40 }); s.g.position.x = x; gO.add(s.g); return s; });

// ── trecho flat: cérebro preguiçoso na rede + bateria ECO ──
const fScene = new THREE.Scene(); fScene.background = new THREE.Color('#1B2A4A');
const fCam = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 100); fCam.position.z = 50;
const stars = []; { let a = 9; const r = () => (a = (a * 16807) % 2147483647) / 2147483647;
	for (let i = 0; i < 30; i++) { const s = F.disc(.05 + r() * .06, { c: '#FFF3DE', line: 0 }); s.position.set((r() - .5) * 10, -4 + r() * 16, 0); fScene.add(s); stars.push(s); } }
[-1, 1].forEach(s => { const p = F.box(.35, 5.2, { c: C.madeira, r: .1 }); p.position.set(s * 3.6, -.9, 0); fScene.add(p); });
const swing = new THREE.Group(); swing.position.set(0, 1.7, 0); fScene.add(swing);
const ham = F.arc(3.5, .4, Math.PI + .2, Math.PI * 2 - .2, C.tang); swing.add(ham);
const brain = new THREE.Group(); brain.position.set(0, -2.3, 0); swing.add(brain);
for (const [x, y, r] of [[-1.05, .2, .9], [1.05, .2, .9], [0, .55, 1.05], [-.5, -.25, .85], [.55, -.25, .85]]) { const d = F.disc(r, { c: '#FF9AB0' }); d.position.set(x, y, 0); brain.add(d); }
{ const fold = F.arc(.45, .07, .3, 2.6, '#E26A88'); fold.position.set(-.6, .55, 0); brain.add(fold); const fold2 = F.arc(.4, .07, .5, 2.8, '#E26A88'); fold2.position.set(.7, .5, 0); brain.add(fold2);
	[-1, 1].forEach(s => { const e = F.arc(.2, .08, Math.PI + .2, Math.PI * 2 - .2, F.P.tinta); e.position.set(s * .45, 0, 0); brain.add(e); });
	const m = F.arc(.18, .07, Math.PI + .5, Math.PI * 2 - .5, F.P.tinta); m.position.set(0, -.4, 0); brain.add(m); }
const ham2 = F.arc(3.5, .4, Math.PI + 1.0, Math.PI * 2 - 1.0, C.tang); swing.add(ham2);   // frente da rede por cima do cérebro
const batt = new THREE.Group(); batt.position.set(0, 5.1, 0); fScene.add(batt);
batt.add(F.box(3.2, 1.4, { c: F.P.creme, shadow: .12 }));
const fill = F.box(2.8, 1.0, { c: C.menta, line: 0, r: .12 }); batt.add(fill);
{ const nub = F.box(.25, .6, { c: F.P.tinta, line: 0, r: .06 }); nub.position.x = 1.78; batt.add(nub); }
const eco = F.plate('ECO', { w: 2, h: .85, bg: C.amarelo, fg: F.P.tinta }); eco.position.set(0, 6.75, 0); fScene.add(eco);
const fz = [0, 1, 2].map(i => { const z = F.text('Z', { w: .9, h: .9, fg: F.P.creme, stroke: .05 }); fScene.add(z); return z; });

// ── planos ──
const SH = [
	{ t: 0, s: 'H', p: [[0, 2.4, 11], [.15, 1.5, 5.4]], l: [[0, 1.3, -2], [0, .85, -1]], e: 'expo' },
	{ t: 3.0, s: 'H', p: [[-2.0, 1.6, 5.6], [-1.6, 1.5, 5.0]], l: [[0, .8, 0], [0, .75, 0]] },
	{ t: 4.7, s: 'R', whip: 1, p: [[3.6, 8, 9], [2.2, 6.2, 6.4]], l: [[0, 0, -1], [0, .3, -.5]] },
	{ t: 7.4, s: 'R', p: [[1.9, .55, -4.2], [1.5, .6, -3.5]], l: [[0, .5, 1], [0, .55, 1]] },
	{ t: 9.9, s: 'H', p: [[3.6, 1.9, 5.6], [2.9, 1.5, 4.0]], l: [[1.7, .8, .3], [1.75, .9, .3]] },
	{ t: 11.9, s: 'C', p: [[1.7, 2.3, 2.7], [-.3, 2.1, 3.0]], l: [[-.3, 1.5, 0], [-.3, 1.5, 0]] },
	{ t: 14.1, s: 'C', p: [[.6, 2.2, 2.7], [.5, 2.0, 2.1]], l: [[.25, 1.5, -.8], [.4, 1.55, -.8]] },
	{ t: 17.3, s: 'F' },
	{ t: 19.98, s: 'R', p: [[4.2, 7.6, 7.2], [2.6, 5.0, 5.0]], l: [[0, 0, 0], [0, .4, 0]] },
	{ t: 23.3, s: 'R', p: [[2.4, 2.6, 5.4], [1.6, 2.3, 4.6]], l: [[0, 1.6, 0], [0, 1.7, 0]] },
	{ t: 25.6, s: 'O', p: [[0, 2.5, 6.4], [.35, 2.1, 5.2]], l: [[0, 1.5, 0], [0, 1.6, 0]] },
	{ t: 28.0, s: 'O', p: [[4.4, 2.5, 5.6], [4.1, 2.2, 4.8]], l: [[3.8, 1.2, 0], [3.8, 1.2, 0]] },
	{ t: 29.7, s: 'O', p: [[-3.5, 2.1, 5.4], [-3.6, 1.9, 4.6]], l: [[-3.7, .8, 0], [-3.7, .75, 0]] },
	{ t: 31.18, s: 'O', p: [[1.2, 2.6, 6.4], [.5, 2.3, 5.4]], l: [[0, 1.4, .3], [0, 1.4, .6]] },
	{ t: 33.66, s: 'R', whip: -1, p: [[-.5, 1.7, -4.4], [-.25, 1.5, -3.3]], l: [[0, .9, 0], [0, .95, 0]] },
	{ t: 36.5, s: 'H', p: [[.15, 1.5, 5.4], [0, 2.4, 11]], l: [[0, .85, -1], [0, 1.3, -2]] },
];
const WHIP = .2, wb = [wobble(1), wobble(2), wobble(3)];
const shotAt = T => { let i = 0; while (i + 1 < SH.length && T >= SH[i + 1].t) i++; return i; };
const V = (a, b, k) => new THREE.Vector3(lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k));

const overlay = buildOverlay($('#ui')), flashEl = $('#flash'), canvas = renderer.domElement;
const iris = document.createElement('div'); iris.style.cssText = 'position:absolute;inset:0;pointer-events:none'; $('#ui').before(iris);
const BG = { H: new THREE.Color(C.menta), R: new THREE.Color('#9ED7E0'), C: new THREE.Color('#9ED7E0'), O: new THREE.Color(C.tinta) }, INK = new THREE.Color(C.tinta);

function renderAt(T) {
	T = clamp(T, 0, DURATION - 1e-4);
	const i = shotAt(T), S = SH[i], t1 = (SH[i + 1] || { t: DURATION }).t, u = seg(T, S.t, t1);
	overlay(T);
	// flash do zoom through (17,3) e do carimbo
	let fl = Math.max(seg(T, 17.12, 17.3) * (T < 17.3 ? 1 : 0), T >= 17.3 ? 1 - seg(T, 17.3, 17.6) : 0, T >= 36.5 ? .5 * (1 - seg(T, 36.5, 36.75)) : 0);
	flashEl.style.opacity = fl;
	// íris (25,6)
	const ir = T > 25.3 && T < 25.95 ? (T < 25.6 ? 1 - ease.cubicInOut(seg(T, 25.3, 25.6)) : ease.cubicInOut(seg(T, 25.6, 25.95))) * 1300 : -1;
	iris.style.background = ir < 0 ? 'none' : `radial-gradient(circle at 50% 40%, transparent ${ir}px, ${C.tinta} ${ir + 2}px)`;
	// desfoque do whip
	let blur = 0; for (const s of SH) if (s.whip) { const d = T - s.t; if (Math.abs(d) < WHIP) blur = Math.max(blur, 22 * (1 - Math.abs(d) / WHIP)); }
	canvas.style.filter = blur > .5 ? `blur(${blur.toFixed(1)}px)` : 'none';

	if (S.s === 'F') return renderFlat(T, u);
	// ── câmera ──
	const k = S.e === 'expo' ? ease.expoOut(seg(T, S.t, S.t + 1.2)) * .8 + u * .2 : ease.sineInOut(u);
	const ox = ORG[S.s], p = V(S.p[0], S.p[1], k), l = V(S.l[0], S.l[1], k);
	p.x += ox + wb[0](T * .5) * .06; p.y += wb[1](T * .5) * .05; l.x += ox;
	if (i === 6 && T > 16.95) p.lerp(l, ease.expoIn(seg(T, 16.95, 17.3)) * .9);     // mergulho no farol/placa
	camera.position.copy(p); camera.lookAt(l); camera.rotation.z += wb[2](T * .4) * .012;
	for (const s of SH) if (s.whip) { const d = T - s.t; if (Math.abs(d) < WHIP) { const q = 1 - Math.abs(d) / WHIP; camera.rotateY((d < 0 ? 1 : -1) * s.whip * q * q * .7); } }
	// luz / fundo / escurecimento (visão de túnel)
	const dk = S.s === 'R' ? (T < 30 ? smooth(T, 20.2, 22.3) : 1 - smooth(T, 34.0, 35.6)) : 0;
	const dim = S.s === 'O' ? .85 : dk * .88;
	hemi.intensity = 1.6 * (1 - dim); sun.intensity = 2.6 * (1 - dim);
	scene.background = BG[S.s].clone().lerp(INK, S.s === 'O' ? 0 : dk * .92);
	sun.position.set(ox + 5, 11, 7); sun.target.position.set(ox, 0, 0);
	gH.visible = S.s === 'H'; gR.visible = S.s === 'R'; gC.visible = S.s === 'C'; gO.visible = S.s === 'O';

	// ── H ──
	if (S.s === 'H') {
		const fall = T >= 3.0 && T < 4.7 ? ease.cubicInOut(seg(T, 3.1, 3.45)) * (1 - ease.elasticOut(seg(T, 4.05, 4.65))) : 0;
		const end = T >= 36.5, arrived = T >= 9.9 && T < 11.9;
		mH.g.visible = !arrived; carH.g.visible = arrived;
		mH.g.rotation.z = -1.45 * fall; mH.hips.position.y = .64 + Math.sin(T * 2.4) * .012;
		mH.head.rotation.z = wb[0](T * .7) * .12; mH.head.rotation.y = T < 3 ? -.25 * smooth(T, 1.4, 2.2) : 0;
		mH.face({ eyes: fall > .5 ? 1 : blink(T, 2), mouth: T < 3 ? 'o' : fall > .1 ? 'o' : 'smile', brow: T < 3 ? 1 : 0 });
		mH.arms.forEach((a, j) => { a.rotation.z = (j ? 1 : -1) * (.12 + (T < 3 ? .5 * smooth(T, .4, .9) : 0)); });
		const qk = T < 3 ? ease.backOut(seg(T, .45, .8)) : 0; qH.scale.setScalar(Math.max(qk, 1e-3)); qH.position.y = 1.75 + Math.sin(T * 3) * .04;
		dots.forEach((d, j) => { const tj = 1.6 + (15 - j) * .08; d.material.opacity = end ? 0 : T < 3 ? 1 - seg(T, tj, tj + .12) : 0; d.visible = d.material.opacity > .01; d.scale.setScalar(.4 + .6 * d.material.opacity); });
		const xk = T >= 3.7 && T < 4.7 ? ease.backOut(seg(T, 3.75, 4.0)) * (1 - seg(T, 4.45, 4.65)) : 0; xH.visible = xk > .01; xH.scale.setScalar(Math.max(xk, 1e-3));
		if (arrived) { carH.roll(0); const d = carH.d; d.face({ eyes: blink(T * 1.7, 1), mouth: T > 10.6 ? 'o' : 'flat', brow: T > 10.6 ? 1 : 0 }); d.head.rotation.y = Math.PI * .15 * smooth(T, 10.4, 10.8); }
	}
	// ── R ──
	if (S.s === 'R') {
		const hop = [7.5, 8.15, 8.95, 9.5].reduce((a, t) => a + (T > t && T < t + .35 ? Math.sin(seg(T, t, t + .35) * Math.PI) * .18 : 0), 0);
		road.update(T, hop); carR.roll(T);
		carR.g.position.z = i === 2 ? 7 * (1 - ease.expoOut(seg(T, 4.75, 5.7))) : 0;
		carR.g.position.y = Math.abs(Math.sin(T * 11)) * .02; carR.g.rotation.z = wb[1](T * 2) * .02;
		const d = carR.d, smile = T > 35.0;
		d.face({ eyes: T > 20 && T < 30 ? .55 : blink(T, 3), mouth: smile ? 'smile' : 'flat', brow: 0 });
		d.head.rotation.y = T > 33 ? Math.sin(T * .8) * .05 : wb[2](T) * .15;
		d.arms.forEach((a, j) => { a.rotation.x = -1.25 + Math.sin(T * 2 + j) * .04; a.rotation.z = (j ? 1 : -1) * .12; });
		if (smile && T < 35.8) { d.arms[1].rotation.x = -2.6 * ease.backOut(seg(T, 35.0, 35.3)); }
		const ck = i === 2 ? ease.backOut(seg(T, 5.3, 5.6)) : 0; card.visible = ck > .01; card.scale.setScalar(Math.max(ck, 1e-3)); card.position.set(0, 2.1 + Math.sin(T * 3) * .05, carR.g.position.z);
		const r = T < 30 ? lerp(4.6, 1.3, ease.cubicInOut(seg(T, 20.3, 22.5))) : lerp(1.3, 5.5, ease.cubicInOut(seg(T, 34.0, 35.8)));
		spR.set(r * (1 + Math.sin(T * 2.2) * .03), dk);
		const ak = i === 9 ? ease.backOut(seg(T, 23.45, 23.85)) : 0; abs.visible = ak > .01; abs.scale.setScalar(Math.max(ak, 1e-3));
		abs.rotation.y = Math.sin((T - 23.3) * 1.1) * .35; abs.position.y = 2.0 + Math.sin(T * 2) * .06;
		const nk = i === 3; nums.forEach((s, j) => { const q = nk ? ease.backOut(seg(T, [7.5, 8.15, 8.95, 9.5][j], [7.5, 8.15, 8.95, 9.5][j] + .3)) : 0; s.visible = q > .01; s.scale.setScalar(Math.max(q, 1e-3)); });
		carR.lights.forEach(l => { l.material.emissiveIntensity = .8 + dk * 1.5; });
	} else nums.forEach(s => { s.visible = false; });
	// ── C ──
	if (S.s === 'C') {
		road2.update(T);
		wheelC.rotation.z = T < 14.1 ? Math.sin(T * 1.3) * .05 : Math.sin((T - 14.1) * 2.1) * .55 * smooth(T, 14.1, 14.5);
		const qk = i === 5 ? ease.backOut(seg(T, 12.4, 12.75)) : 0; qC.visible = qk > .01; qC.scale.setScalar(Math.max(qk, 1e-3)); qC.position.y = 2.25 + Math.sin(T * 3) * .05;
		const on = i === 6 ? ease.expoOut(seg(T, 14.95, 15.25)) : 0, flick = on * (.85 + .15 * Math.sin(T * 9));
		pilot.material.emissiveIntensity = .9 * flick; pilot.material.color.setScalar(.35 + .65 * on); glow.material.opacity = .55 * flick;
		pilot.scale.setScalar(1 + .12 * Math.sin(seg(T, 14.95, 15.35) * Math.PI));
	}
	// ── O ──
	if (S.s === 'O') {
		spO.forEach((s, j) => s.set([1.5, 1.8, 1.4][j] * (1 + Math.sin(T * 2 + j) * .03), 1));
		mO.face({ eyes: T > 31.18 ? .3 : 1, mouth: 'smile' }); mO.head.rotation.x = i === 13 ? Math.sin(T * 2.4) * .08 + .05 : .12;
		mO.hips.position.y = .5 + Math.sin(T * 1.6) * .01;
		const hk = i === 10 ? ease.backOut(seg(T, 26.2, 26.55)) : 0; hip.visible = hk > .01; hip.scale.setScalar(Math.max(hk, 1e-3));
		zs.forEach((z, j) => { const q = ((T * .45 + j / 3) % 1); z.position.set(3.0 + q * .9 + j * .1, 1.3 + q * 1.6, .4); z.scale.setScalar(Math.sin(q * Math.PI) + 1e-3); z.visible = i === 11; });
		mS.hips.position.x = Math.sin(T * 1.4) * .02;
		const xz = i === 11 ? ease.backOut(seg(T, 28.85, 29.15)) : 0; xZ.visible = xz > .01; xZ.scale.setScalar(Math.max(xz, 1e-3));
		const dropY = T < 29.75 ? 3.4 : 3.4 * (1 - ease.cubicOut(seg(T, 29.75, 30.05))) + (T > 30.05 ? Math.abs(Math.sin(seg(T, 30.05, 30.35) * Math.PI)) * .3 * (1 - seg(T, 30.05, 30.35)) : 0);
		lock.g.position.y = dropY; lock.g.rotation.z = (T < 30.05 ? .4 : 0) * (1 - seg(T, 29.75, 30.05)); lock.open(ease.backOut(seg(T, 30.3, 30.6)));
		const xl = i === 12 ? ease.backOut(seg(T, 30.65, 30.95)) : 0; xL.visible = xl > .01; xL.scale.setScalar(Math.max(xl, 1e-3));
		hand.position.x = 2.6 - 1.4 * ease.expoOut(seg(T, 31.3, 32.0)); hand.position.y = 1.45 + Math.sin(T * 2) * .04; hand.visible = i === 13;
		steps.forEach((d, j) => { const q = i === 13 ? ease.backOut(seg(T, 32.0 + j * .14, 32.25 + j * .14)) : 0; d.visible = q > .01; d.scale.setScalar(Math.max(q, 1e-3)); });
		const okk = i === 13 ? ease.backOut(seg(T, 32.4, 32.7)) : 0; ok.visible = okk > .01; ok.scale.setScalar(Math.max(okk, 1e-3));
	}
	for (const b of bills) { const pq = new THREE.Quaternion(); b.parent.getWorldQuaternion(pq); b.quaternion.copy(pq.invert().multiply(camera.quaternion)); }
	renderer.render(scene, camera);
}

function renderFlat(T, u) {
	const vh = lerp(17.5, 15.6, ease.cubicOut(u)), hw = vh / 2 * W / H;
	Object.assign(fCam, { left: -hw, right: hw, top: vh / 2, bottom: -vh / 2 }); fCam.position.set(wb[0](T) * .1, .3 + wb[1](T) * .1, 50); fCam.rotation.z = wb[2](T * .5) * .015; fCam.updateProjectionMatrix();
	const zin = ease.expoOut(seg(T, 17.3, 17.9)); fCam.zoom = .7 + .3 * zin; fCam.updateProjectionMatrix();
	swing.rotation.z = Math.sin(T * 1.7) * .07;
	brain.scale.set(1 + Math.sin(T * 2.2) * .03, 1 - Math.sin(T * 2.2) * .03, 1);
	const f = lerp(.12, 1, ease.cubicInOut(seg(T, 18.0, 19.6))); fill.scale.x = f; fill.position.x = -1.4 * (1 - f);
	const bk = ease.backOut(seg(T, 17.55, 17.9)); batt.scale.setScalar(Math.max(bk, 1e-3)); eco.scale.setScalar(Math.max(ease.backOut(seg(T, 17.75, 18.1)), 1e-3));
	fz.forEach((z, j) => { const q = ((T * .5 + j / 3) % 1); z.position.set(1.6 + q * 1.4, -.8 + q * 2.6, 0); z.material.opacity = Math.sin(q * Math.PI); z.scale.setScalar(.6 + q * .6); });
	stars.forEach((s, j) => { s.scale.setScalar(.7 + .3 * Math.sin(T * 1.5 + j)); });
	renderer.render(fScene, fCam);
}

// ── player (narração + SFX) ──
function fit() { const k = Math.min(innerWidth / W, (innerHeight - 44) / H); stage.style.transform = `translate(-50%,-50%) translateY(-22px) scale(${k})`; }
addEventListener('resize', fit); fit();
const voz = $('#voz'), fx = $('#fx'), scrub = $('#scrub'), btn = $('#play');
let playing = false, cur = 0, t0 = performance.now();
const setPlay = q => { playing = q; btn.textContent = q ? '⏸' : '▶'; t0 = performance.now() - cur * 1000; if (q) { voz.currentTime = cur; voz.play().catch(() => {}); if ($('#sfx').checked) { fx.currentTime = cur; fx.play().catch(() => {}); } } else { voz.pause(); fx.pause(); } };
btn.onclick = () => setPlay(!playing);
scrub.oninput = () => { cur = +scrub.value; setPlay(false); };
addEventListener('keydown', e => {
	if (e.code === 'Space') { e.preventDefault(); setPlay(!playing); }
	if (e.code === 'ArrowRight') { cur = clamp(cur + (e.shiftKey ? 5 : .5), 0, DURATION); setPlay(false); }
	if (e.code === 'ArrowLeft') { cur = clamp(cur - (e.shiftKey ? 5 : .5), 0, DURATION); setPlay(false); }
	if (e.code === 'KeyH') $('#hud').style.display = $('#hud').style.display === 'none' ? '' : 'none';
});
if (params.has('t')) cur = +params.get('t');
if (params.has('nohud')) $('#hud').style.display = 'none';

for (const s of SH) renderAt(s.t + .5);   // pré-aquece shaders e texturas de todos os planos
renderAt(cur);
window.__mg = { duration: DURATION, fps: 30, width: W, height: H, renderAt, scene, current: () => SH[shotAt(cur)].s === 'F' ? { scene: fScene, camera: fCam } : { scene, camera } };
const _r = renderAt; window.__mg.renderAt = T => { cur = T; _r(T); };
$('#loading').remove();
if (params.has('export')) { $('#hud').remove(); window.__mg.loaded = true; }
else (function loop() {
	if (playing) {
		cur = (performance.now() - t0) / 1000;
		if (!voz.paused && Math.abs(voz.currentTime - cur) > .08) cur = voz.currentTime, t0 = performance.now() - cur * 1000;
		if (!fx.paused && Math.abs(fx.currentTime - cur) > .08) fx.currentTime = cur;
		if (cur >= DURATION) { cur = 0; setPlay(true); }
	}
	scrub.value = cur; $('#tc').textContent = cur.toFixed(2).padStart(6, '0');
	renderAt(cur);
	requestAnimationFrame(loop);
})();
