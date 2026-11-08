// 11 — Demo do estilo Sticker (9:16, 30 s, sem narração): "Bocejo pega?". Uma praça pintada; um bocejo passa de
// pessoa em pessoa (dominó na fila da padaria, tombo no poste, casal no café ao pôr do sol, onda na praça inteira) e o
// cachorro termina bocejando para quem assiste. Serve de referência dos recursos do estilo (ver SKILL estilo-sticker).
import * as THREE from 'three';
import { createPost } from '../_sticker/post.js';
import { Cast, SU } from '../_sticker/cast.js';
import { SKIN, KID, fxBurst, fxPuff, fxStars, fxRing } from '../_sticker/toon.js';
import { dogFront, fxYawn, fxSpeed, fxBread, fxBird, fxBang, fxZ, fxHeart, fxWave, cloudCanvas } from '../_sticker/fx.js';
import { createWorld, applyLight, addClouds, house, signBoard, clockTower, tree, lamp, bench, fountain, cafeTable, flowerPot, mesh, mat, cobbleTex, grassTex, solid } from '../_sticker/world.js';
import { FPS, clamp, lerp, seg, smooth, smoother, easeOut, backOut, expoIn, kick, lidAt, exprAt, swapsOf, hash, v3lerp } from '../_sticker/anim.js';

const W = 1080, H = 1920, DURATION = 30;
const $ = (s) => document.querySelector(s);
const stage = $('#stage'), params = new URLSearchParams(location.search);
await Promise.all(['900 100px Inter', '800 100px Inter', '700 30px "JetBrains Mono"'].map((f) => document.fonts.load(f)));

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.prepend(renderer.domElement);

// ───────────────────────── mundo: praça ─────────────────────────
const Wd = createWorld(), scene = Wd.scene, root = Wd.root;
const camera = new THREE.PerspectiveCamera(38, W / H, .1, 1200); scene.add(camera);
const post = createPost(renderer, scene, camera, W, H);
addClouds(Wd, cloudCanvas, 10);

const cob = cobbleTex().clone(); cob.repeat.set(34, 34); cob.needsUpdate = true;
const ground = mesh(new THREE.PlaneGeometry(64, 64), mat('cobble', { map: cob }), 0, 0, 0, root); ground.rotation.x = -Math.PI / 2; ground.castShadow = false;
const gr = grassTex().clone(); gr.repeat.set(60, 60); gr.needsUpdate = true;
const grass = mesh(new THREE.PlaneGeometry(600, 600), mat('grass', { map: gr }), 0, -.03, 0, root); grass.rotation.x = -Math.PI / 2; grass.castShadow = false;

const COLS = ['#e8c9a0', '#d98b6a', '#f1dfb0', '#c9a6d9', '#a9c9b0', '#efb08a', '#e6d3b8', '#b9cde6'];
const ROOFS = ['#c0563f', '#a8483a', '#7a4b3a', '#3f6fb5', '#b5653f'];
const SHUT = ['#4f7f6a', '#3f6fb5', '#8c3b4a', '#2f5f6a', '#c9773f'];
let hs = 1;
const row = (x0, x1, z, yaw, skip = []) => { // fileira de casas ao longo de x (yaw 0 / π) ou z (±π/2)
	let a = x0;
	while (a < x1 - 2) {
		const w = 5.6 + hash(hs, 1) * 2.4, h = 6.4 + hash(hs, 2) * 3.4, c = a + w / 2;
		if (!skip.some(([s0, s1]) => c > s0 && c < s1)) {
			const o = { w, d: 6, h, col: COLS[hs % 8], roof: ROOFS[hs % 5], shutter: SHUT[hs % 5], floors: h > 8.6 ? 3 : 2, cols: w > 7 ? 3 : 2, door: w > 7 ? 1 : 0, seed: hs };
			if (Math.abs(yaw) === Math.PI / 2) house(root, z, c, yaw, o); else house(root, c, z, yaw, o);
		}
		a += w + .02; hs++;
	}
};
row(-34, 34, -27, 0, [[-4, 4]]);          // norte (torre no meio)
row(-34, 34, 31, Math.PI);                 // sul
row(-22, -9.5, -27, Math.PI / 2);          // oeste (x = -27 → frente para +x)
house(root, -27, -6, Math.PI / 2, { w: 8, d: 6, h: 7.4, col: '#f1dfb0', roof: '#a8483a', shutter: '#8c3b4a', floors: 2, cols: 3, door: 1, shop: 'padaria', seed: 40 });
row(-1.9, 26, -27, Math.PI / 2);
row(-22, 26, 27, -Math.PI / 2);            // leste
signBoard(root, 'PADARIA', -23.9, 3.6, -6, Math.PI / 2, 3.6, .9);
const clock = clockTower(root, 0, -27);
fountain(root, 0, 0);
[[-14, 13, 1.1], [14, 15, 1], [-16, -15, 1.15], [16, -16, 1], [11, -13, .9], [-12, -20, .95], [20, 8, 1.05]].forEach(([x, z, s], i) => tree(root, x, z, s, i + 3));
const LAMP = [6, 9];
const lampG = lamp(root, LAMP[0], LAMP[1], Wd);
lamp(root, -12, 3, Wd); lamp(root, 12, -3, Wd); lamp(root, -4, -12, Wd);
bench(root, -8, 7, 0);
bench(root, 9, -9, Math.PI);
cafeTable(root, 15, -6, null); cafeTable(root, 18.5, 0.5, ['#3f6fb5', '#fbf3df']); cafeTable(root, 12.5, 1.5, ['#4f8a3c', '#fbf3df']);
for (const [x, z] of [[14.15, -6.05], [15.85, -6.05]]) { mesh(new THREE.BoxGeometry(.42, .05, .42), solid('#2f3440'), x, .46, z - .05, root); mesh(new THREE.BoxGeometry(.05, .46, .05), solid('#2f3440'), x, .23, z - .05, root); }
[[-9.6, 7.2, '#e2453c'], [-5.0, 6.6, '#ffd23f'], [-21.6, -10.8, '#f08ab0'], [13.2, -7.6, '#ffd23f']].forEach(([x, z, c]) => flowerPot(root, x, z, 1, c));

// ───────────────────────── elenco ─────────────────────────
const cast = new Cast(root);
const P = (id, seed, o) => ({ id, seed, o });
const ZE = P('ze', 3, { jacket: '#5d7a3a', pants: '#4a4f63', boots: '#4a3426', hat: 'cap', cap: '#8c3b4a', moustache: '#ece6da', skin: '#f5c9a0', build: 'stout' });
const PADEIRA = P('pad', 5, { jacket: '#f4efe4', pants: '#3b3f52', boots: '#5a3b2a', hat: 'bonnet', dress: '#c25a7a', skin: '#c99067' });
const FILA = [
	P('f0', 1, { jacket: '#3f6fb5', pants: '#3b3f52', boots: '#4a3426', hat: 'tophat', skin: SKIN }),
	P('f1', 2, { jacket: '#b5653f', pants: '#3b3f52', boots: '#2a201a', hat: 'cap', cap: '#2f5f6a', moustache: '#4a3426', skin: '#ecd0b6' }),
	P('f2', 4, { jacket: '#5a8fc2', pants: '#3b3f52', boots: '#5a3b2a', hat: 'bonnet', dress: '#ffd23f', skin: '#f5c9a0' }),
	P('f3', 6, { jacket: '#2f5f6a', pants: '#4a4f63', boots: '#2a201a', hat: 'tophat', skin: '#c99067', build: 'stout' }),
	P('f4', 7, { jacket: '#7b5ac9', pants: '#3b3f52', boots: '#4a3426', hat: 'bonnet', dress: '#e2453c', skin: SKIN }),
	P('f5', 2, { ...KID, skin: '#ecd0b6' }),
];
const ENTREG = P('ent', 5, { jacket: '#e2453c', pants: '#3b5b9a', boots: '#2a201a', hat: 'cap', cap: '#ffd23f', skin: '#ecd0b6' });
const ELA = P('ela', 4, { jacket: '#5a8fc2', pants: '#3b3f52', boots: '#5a3b2a', hat: 'bonnet', dress: '#ffd23f', skin: SKIN });
const ELE = P('ele', 6, { jacket: '#8c3b4a', pants: '#3b3f52', boots: '#2a201a', hat: 'tophat', moustache: '#4a3020', skin: '#f5c9a0' });
const FOLK = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((i) => P('m' + i, (i % 7) + 1, {
	jacket: ['#3f6fb5', '#8c3b4a', '#5d7a3a', '#b5653f', '#2f5f6a', '#7b5ac9', '#e2453c'][i % 7], pants: '#3b3f52', boots: '#4a3426',
	hat: ['tophat', 'bonnet', 'cap', 'tophat', 'bonnet', 'cap', 'bonnet'][i % 7], cap: '#e2453c', dress: ['#d9a441', '#c25a7a', '#5a8fc2'][i % 3],
	skin: [SKIN, '#f5c9a0', '#ecd0b6', '#c99067'][i % 4], build: i % 5 === 3 ? 'kid' : i % 4 === 2 ? 'stout' : 'adult',
}));
const DOG = (t, expr, look, tail) => (p) => dogFront(p, { expr, blink: lidAt(t, 77), look, tail });
const DOGKEY = (t, expr, look, tail) => `${expr}|${lidAt(t, 77)}|${look.toFixed(1)}|${tail.toFixed(1)}`;
const DOG_GEO = (() => { const g = new THREE.PlaneGeometry(1, 1); g.translate(0, .5 - 25 / 600, 0); return g; })();
function dog(t, at, expr, look = 0, tail = 0, s = .78) {
	const k = DOGKEY(t, expr, look, tail);
	const d = cast.cam.distanceTo(new THREE.Vector3(...at)), res = d < 3.5 ? 900 : 360;
	const m = cast.card('dog|' + k + res, res, res, (p) => { p.g.scale(res / 600, res / 600); DOG(t, expr, look, tail)(p); }, at, [s, s]);
	m.geometry = DOG_GEO; cast.blob(at[0], 0, at[2] + .05, .9);
	return m;
}

// trilhas de expressão (tempo absoluto do vídeo)
const ZE_E = [[0, 'neutral'], [.55, 'yawn_half'], [.75, 'yawn'], [2.05, 'smile_closed'], [6.25, 'yawn_half'], [6.4, 'yawn'], [7.4, 'sleepy'], [25.8, 'sleepy']];
const PAD_E = [[0, 'smile'], [6.85, 'nervous'], [7.45, 'yawn_half'], [7.6, 'yawn'], [8.75, 'shock']];
const yawnAt = (t0, d = 1.0) => [[0, 'neutral'], [t0 - .15, 'yawn_half'], [t0, 'yawn'], [t0 + d, 'sleepy']];
const ENT_E = [[0, 'smile'], [13.55, 'yawn_half'], [13.7, 'yawn'], [14.62, 'shock'], [14.8, 'dazed']];
const ELA_E = [[0, 'smile'], [17.45, 'yawn_half'], [17.6, 'yawn'], [18.6, 'smile_closed'], [19.65, 'laugh']];
const ELE_E = [[0, 'grin'], [17.9, 'nervous'], [18.3, 'yawn_half'], [18.45, 'yawn'], [19.45, 'smile_closed'], [19.7, 'laugh']];

// ───────────────────────── planos ─────────────────────────
// cada plano: a/b (s), luz k (0 dia, 1 dourado), fwd (direção da câmera p/ o sol), cam(t) → { pos, look, fov, roll, focus, cInf }
const QX = -20.3, QZ = (j) => -9.6 + j * 1.18;
const padX = (t) => -10.7 + (t - 6.2) * 1.32;
const entX = (t) => (t < 14.6 ? 3.5 + (t - 13.2) * 1.5 : 5.6 - .55 * easeOut(seg(t, 14.6, 14.95)));
const yawnQ = (j) => 9.75 + .42 * j;
const SHOTS = [
	{ id: 1, a: 0, b: 2.7, k: 0, fwd: [0, -1], cam: (t) => { const u = seg(t, 0, 2.7); return { pos: [-8 + .05 * u, 1.06, 9.95 - .55 * smooth(u) - .4 * easeOut(seg(t, .6, 1.2), 4)], look: [-8, .98, 7], fov: 40, roll: 0, focus: 2.3, cInf: 15 }; } },
	{ id: 2, a: 2.7, b: 6.2, k: 0, fwd: [-.3, -1], cam: (t) => { const u = smoother(seg(t, 2.75, 6.15)); return { pos: v3lerp([12, 21, 34], [2, 7.5, 21], u), look: v3lerp([-2, 3, -8], [-6, 1.2, 4], u), fov: 42, roll: lerp(-3, 0, u), focus: 30, cInf: 0 }; } },
	{ id: 3, a: 6.2, b: 9.4, k: 0, fwd: [0, -1], cam: (t) => { const x = padX(t); return { pos: [x + .2, 1.3, 12.3 - .25 * seg(t, 6.2, 9.4)], look: [x + .55, 1.1, 8.3], fov: 40, roll: 2.5, focus: 4, cInf: 10 }; } },
	{ id: 4, a: 9.4, b: 13.2, k: 0, fwd: [-1, .1], cam: (t) => { const u = smoother(seg(t, 9.45, 12.6)), z = lerp(-13.2, -5.0, u) - .3 * seg(t, 12.6, 13.2); return { pos: [lerp(-16.2, -17.0, u), 1.45 - .3 * u, z], look: [QX - .3, 1.0 - .35 * u, z + lerp(5.2, 3.0, u)], fov: 42, roll: -2, focus: 4.6, cInf: 9 }; } },
	{ id: 5, a: 13.2, b: 16.8, k: 0, fwd: [.2, -1], cam: (t) => { const u = seg(t, 13.2, 16.8), lx = t < 14.6 ? (entX(t) + 6.1) / 2 : lerp((5.6 + 6.1) / 2, 4.45, smooth(seg(t, 14.6, 15.6))); return { pos: [lx - .3, 1.25 - .2 * seg(t, 14.6, 16.8), 15.0 - .5 * u], look: [lx, 1.15 - .35 * smooth(seg(t, 14.7, 15.6)), 9], fov: 40, roll: 0, focus: 6, cInf: 10 }; } },
	{ id: 6, a: 16.8, b: 21.8, k: 1, el: 17, fwd: [-1, -.3], cam: (t) => { const u = seg(t, 16.8, 21.8), a = lerp(-.22, .16, smooth(u)), r = 5.4 - .6 * u; return { pos: [15 + Math.sin(a) * r, 1.3, -6 + Math.cos(a) * r], look: [15, 1.05, -6], fov: 42, roll: 0, focus: r, cInf: 13 }; } },
	{ id: 7, a: 21.8, b: 25.8, k: 1, fwd: [0, -1], cam: (t) => { const u = smoother(seg(t, 21.85, 25.6)); return { pos: v3lerp([3, 1.5, 13], [7, 15, 27], u), look: v3lerp([0, 1.6, 0], [0, 2.5, -8], u), fov: 42, roll: lerp(0, 3, u), focus: 14, cInf: lerp(5, 0, u) }; } },
	{ id: 8, a: 25.8, b: 30.01, k: 1, fwd: [0, -1], cam: (t) => { const u = seg(t, 25.8, 30), push = .35 * u + .3 * easeOut(seg(t, 26.75, 27.2)); return { pos: [-6.9, .66, 9.65 - push], look: [-6.9, .6, 7.85], fov: 36, roll: 0, focus: 1.8 - push, cInf: 15 }; } },
];
const XFADE = [[9.4, 7], [16.8, 8]];        // [t, quadros] crossfade na troca de lugar/tempo
const FLASH = [[2.7, .14], [27.55, .2]];
const KICKS = [[14.6, 1], [27.55, .5]];
const WHIP = [[13.05, 13.4, -1], [25.6, 25.95, 1]];
const shotAt = (t) => SHOTS.find((s) => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];

// ───────────────────────── encenação por plano ─────────────────────────
function walker(t, i, r0, speed, ph) { // pedestres em círculos pela praça
	const a = ph + speed * t / r0, x = Math.cos(a) * r0, z = Math.sin(a) * r0, dx = -Math.sin(a) * Math.sign(speed), dz = Math.cos(a) * Math.sign(speed);
	return { x, z, dx, dz, phase: (Math.abs(speed) * t / 1.6 + i * .37) % 1 };
}
function populate(t, sh) {
	const id = sh.id, gold = sh.k > .5;
	// Zé no banco (todos os planos que mostram a praça oeste)
	if (id === 1 || id === 2 || id === 3 || id === 7 || id === 8) {
		const e = exprAt(t, ZE_E);
		cast.person(ZE, [-8, .3, 6.95], { expr: e, mode: 'sit', blink: lidAt(t, 3, swapsOf(ZE_E)), wave: e === 'yawn' && t < 2.1 ? smooth(seg(t, .8, 1.3)) - smooth(seg(t, 1.7, 2.05)) : undefined, look: 0 }, { blob: false });
		if (false) { const zz = (t * .7) % 1; cast.card('z', 200, 210, (p) => fxZ(p), [-7.55 + .2 * zz, 1.65 + .5 * zz, 6.95], [.22 + .1 * zz, .23 + .1 * zz], { rot: -15 + 20 * zz }); }
	}
	if (id === 1) { // sopro do bocejo
		const u = seg(t, .85, 2.0); if (u > 0 && u < 1) cast.card('yawn|' + Math.round(u * 30), 400, 300, (p) => fxYawn(p, Math.round(u * 30) / 30), [-7.45, 1.18 + .1 * u, 7.05], [.7, .52], { rot: 8 });
	}
	if (id === 2 || id === 7) { // pedestres + pássaros
		for (let i = 0; i < (id === 2 ? 7 : 4); i++) {
			const w = walker(t, i, 6.5 + (i % 4) * 2.6, (i % 2 ? 1 : -1) * (1.1 + .1 * (i % 3)), i * 1.7);
			const view = cast.right.x * w.dx + cast.right.z * w.dz;
			cast.person(FOLK[i], [w.x, 0, w.z], { mode: 'stroll', phase: w.phase, expr: id === 7 ? exprAt(t, yawnAt(22.4 + .3 * i)) : 'smile', blink: lidAt(t, i + 20), facing: view > .3 ? 1 : view < -.3 ? -1 : 0 });
		}
		for (let i = 0; i < 5; i++) {
			const u = (t * .07 + i * .19) % 1, x = lerp(-60, 60, u) * (i % 2 ? 1 : -1), y = 22 + i * 3 + Math.sin(t * 2 + i) * .6, z = -20 - i * 6;
			const fl = Math.round(((Math.sin(t * 14 + i * 2) + 1) / 2) * 4) / 4;
			cast.card('bird|' + fl, 200, 120, (p) => fxBird(p, fl), [x, y, z], [1.4, .84]);
		}
	}
	if (id === 3) { // padeira passa e pega o bocejo
		const x = padX(t), e = exprAt(t, PAD_E);
		cast.person(PADEIRA, [x, 0, 8.4], { side: true, mode: 'march', stride: .82, stomp: .3, phase: ((x + 20) / 1.31) % 1, expr: e, blink: lidAt(t, 5, swapsOf(PAD_E)) });
		if (t > 6.85 && t < 7.4) cast.card('bang?', 300, 260, (p) => fxBang(p, '?', '#ffd23f'), [x + .25, 2.35 + .06 * backOut(seg(t, 6.85, 7.05)), 8.35], [.42 * backOut(seg(t, 6.85, 7.05)), .36 * backOut(seg(t, 6.85, 7.05))], { rot: 12 });
		const u = seg(t, 7.65, 8.8); if (u > 0 && u < 1) cast.card('yawn|' + Math.round(u * 30), 400, 300, (p) => fxYawn(p, Math.round(u * 30) / 30), [x + .55, 1.68, 8.45], [.66, .5], { rot: 6 });
		if (t > 8.75) cast.card('bang!', 300, 260, (p) => fxBang(p, '!', '#ffd23f'), [x + .3, 2.3, 8.35], [.36 * backOut(seg(t, 8.75, 8.95)), .32 * backOut(seg(t, 8.75, 8.95))], { rot: -8 });
	}
	if (id === 4) { // dominó na fila da padaria
		FILA.forEach((who, j) => {
			const ty = yawnQ(j), tr = yawnAt(ty, .95);
			cast.person(who, [QX - (j % 2) * .25, 0, QZ(j)], { mode: 'stand', expr: exprAt(t, tr), blink: lidAt(t, 30 + j, swapsOf(tr)), facing: 1, look: t < ty - .4 ? -1 : 0, wave: t > ty && t < ty + .8 && j % 2 === 0 ? smooth(seg(t, ty, ty + .3)) : undefined });
			const u = seg(t, ty + .1, ty + 1.0); if (u > 0 && u < 1) cast.card('yawn|' + Math.round(u * 30), 400, 300, (p) => fxYawn(p, Math.round(u * 30) / 30), [QX + .5, j === 5 ? 1.25 : 1.62, QZ(j) + .35], [.55, .42], { rot: 4 });
		});
		const dt = 12.35, de = t > dt && t < dt + 1 ? 'yawn' : t > dt + 1 ? 'happy' : 'neutral';
		dog(t, [QX + .1, 0, QZ(6) + .2], de, t < dt - .3 ? -1 : 0, Math.sin(t * 10) * (de === 'happy' ? 1 : .2));
	}
	if (id === 5) { // entregador bocejando de olho fechado → poste
		const x = entX(t), e = exprAt(t, ENT_E), sw = swapsOf(ENT_E);
		if (t < 14.62) cast.person(ENTREG, [x, 0, 9.05], { side: true, mode: 'march', stride: .9, stomp: .3, phase: ((x + 20) / 1.44) % 1, expr: e, blink: lidAt(t, 8, sw) });
		else {
			const f = easeOut(seg(t, 14.62, 15.0), 2), bounce = Math.sin(seg(t, 15.0, 15.35) * Math.PI) * .08;
			cast.person(ENTREG, [x - .1 * f, .05 + .2 * f + bounce, 9.15], { mode: f < .4 ? 'stand' : 'fall', expr: e, blink: lidAt(t, 8, sw) }, { lean: 1.22 * f - bounce, blob: f < .5 });
			if (t > 14.95) { const hx = x - .1 - 1.55 * Math.sin(1.22), hy = .3 + 1.55 * Math.cos(1.22); cast.card('stars|' + Math.round((t * 1.6 % 1) * 24), 420, 210, (p) => fxStars(p, Math.round((t * 1.6 % 1) * 24) / 24), [hx, hy + .45, 9.2], [.75, .375]); }
		}
		const u = seg(t, 13.75, 14.55); if (u > 0 && u < 1) cast.card('yawn|' + Math.round(u * 30), 400, 300, (p) => fxYawn(p, Math.round(u * 30) / 30), [x + .55, 1.66, 9.1], [.6, .45], { rot: 5 });
		const b = seg(t, 14.6, 14.9); if (b > 0 && b < 1) cast.card('burst|' + Math.round(b * 12), 500, 500, (p) => fxBurst(p, Math.round(b * 12) / 12, '#fff3b0', 12), [5.88, 1.72, 9.1], [1.1, 1.1]);
		// pães voando (balística determinística) + poeira ao cair
		for (let i = 0; i < 3; i++) {
			const t0 = 14.62, dt = t - t0; if (dt < 0) continue;
			const vx = -1.4 + i * 1.05, vy = 3.6 + i * .5, vz = -.2 + .25 * i, T = (vy + Math.sqrt(vy * vy + 2 * 9.8 * 1.2)) / 9.8;
			const tt = Math.min(dt, T), px = 5.3 + vx * tt, py = 1.3 + vy * tt - 4.9 * tt * tt, pz = 9.25 + vz * tt;
			const landed = dt >= T;
			cast.card('bread', 320, 110, (p) => fxBread(p), [px, Math.max(.1, py), pz], [.55, .19], { rot: landed ? (i - 1) * 12 : dt * 520 * (i % 2 ? 1 : -1) + i * 40 });
			const pu = seg(dt, T, T + .5); if (pu > 0 && pu < 1) cast.card('puff|' + Math.round(pu * 12), 300, 300, (p) => fxPuff(p, Math.round(pu * 12) / 12), [px, .25, pz + .05], [.8, .8], { soft: true });
		}
		lampG.rotation.z = -Math.sin((t - 14.6) * 40) * .05 * Math.exp(-(t - 14.6) * 4) * (t > 14.6 ? 1 : 0);
	}
	if (id === 6) { // casal no café ao pôr do sol: um boceja, o outro "espelha"
		cast.person(ELA, [14.3, .22, -6.1], { mode: 'sit', expr: exprAt(t, ELA_E), blink: lidAt(t, 11, swapsOf(ELA_E)), facing: 1, wave: t > 17.6 && t < 18.5 ? smooth(seg(t, 17.6, 17.9)) : undefined }, { blob: false });
		cast.person(ELE, [15.7, .22, -6.1], { mode: 'sit', expr: exprAt(t, ELE_E), blink: lidAt(t, 12, swapsOf(ELE_E)), facing: -1, look: t > 17.7 && t < 18.3 ? -1 : 0 }, { blob: false, mirror: false });
		const h = seg(t, 19.75, 20.2); if (h > 0) { const s = .42 * backOut(h) + .02 * Math.sin(t * 9); cast.card('heart', 300, 280, (p) => fxHeart(p), [15, 1.95 + .15 * seg(t, 20.2, 21.8), -6.05], [s, s * .93]); }
		// fio pontilhado entre os dois bocejos ("espelho")
		const l = seg(t, 17.85, 18.35);
		if (l > 0 && t < 19.6) for (let i = 0; i < 6; i++) { if (i / 6 > l) break; const u = (i + .5) / 6; cast.card('dot', 64, 64, (p) => p.ell(32, 32, 22, 22, '#fff3b0', 6), [lerp(14.45, 15.55, u), 1.62 + Math.sin(u * Math.PI) * .25, -6.05], [.08, .08]); }
	}
	if (id === 7) { // praça inteira bocejando em onda a partir da fonte
		for (let i = 0; i < 10; i++) {
			const a = i * 2.4 + .5, r = 5.5 + (i % 3) * 3.2, x = Math.cos(a) * r, z = Math.sin(a) * r * .8 + 1, ty = 22.25 + r * .11;
			cast.person(FOLK[(i + 4) % 14], [x, 0, z], { mode: 'stand', expr: exprAt(t, yawnAt(ty, 1.1)), blink: lidAt(t, 40 + i), facing: x > 2 ? -1 : x < -2 ? 1 : 0, wave: t > ty && t < ty + 1 && i % 3 === 0 ? smooth(seg(t, ty, ty + .3)) : undefined });
		}
		for (const t0 of [22.0, 22.9, 23.8]) { const u = seg(t, t0, t0 + 1.8); if (u > 0 && u < 1) cast.card('wave|' + Math.round(u * 40), 600, 600, (p) => fxWave(p, Math.round(u * 40) / 40), [0, .06, 0], [30, 30], { flat: true, soft: true }); }
	}
	if (id === 8) { // final: o cachorro olha pra câmera e boceja pra você
		const e = t < 26.6 ? 'neutral' : t < 27.85 ? 'yawn' : 'happy';
		dog(t, [-6.9, 0, 7.85], e, t < 26.3 ? -1 + smooth(seg(t, 25.9, 26.3)) : 0, e === 'happy' ? Math.sin(t * 16) : .2 * Math.sin(t * 3), .8);
		const u = seg(t, 26.75, 27.9); if (u > 0 && u < 1) cast.card('yawn|' + Math.round(u * 30), 400, 300, (p) => fxYawn(p, Math.round(u * 30) / 30), [-6.62, .62, 7.95], [.5, .37], { rot: -4 });
	}
	// fonte: jatos + anéis na água
	if (id === 2 || id === 7 || id === 1) {
		for (let k = 0; k < 3; k++) { const u = ((t * .6 + k / 3) % 1); cast.card('ring|' + Math.round(u * 20), 600, 600, (p) => fxRing(p, Math.round(u * 20) / 20), [0, .57, 0], [5.6, 5.6], { flat: true, soft: true }); }
	}
}

// ───────────────────────── legendas e carimbo (identidade fixa) ─────────────────────────
const ui = $('#ui').getContext('2d');
const ACCENT = '#FFD23F', PLUM = '#241726';
const CAPS = [
	{ a: .25, b: 2.45, words: ['POR QUE', 'BOCEJO', 'PEGA?'], key: 1 },
	{ a: 19.0, b: 21.6, words: ['PEGA MAIS', 'EM QUEM', 'VOCÊ GOSTA'], key: 2 },
];
const STAMP = { a: 27.55, text: 'PEGOU EM VOCÊ?' };
function fitFont(text, maxW, size, weight = 900) { let s = size; ui.font = `${weight} ${s}px Inter`; while (ui.measureText(text).width > maxW && s > 20) { s -= 2; ui.font = `${weight} ${s}px Inter`; } return s; }
function drawCaptions(t) {
	ui.clearRect(0, 0, W, H);
	for (const c of CAPS) {
		if (t < c.a || t > c.b) continue;
		const out = expoIn(seg(t, c.b - .15, c.b));
		c.words.forEach((w, i) => {
			const t0 = c.a + i * .12 * 2.2, u = seg(t, t0, t0 + .25); if (u <= 0) return;
			const s = fitFont(w, 780, 118) * (.85 + .15 * backOut(u)) * (1 - .1 * out), y = 1180 + i * 128;
			ui.save(); ui.globalAlpha = clamp(u * 3) * (1 - out); ui.translate(470, y); ui.font = `900 ${s}px Inter`; ui.textAlign = 'center'; ui.textBaseline = 'middle';
			ui.lineJoin = 'round'; ui.lineWidth = s * .2; ui.strokeStyle = PLUM; ui.strokeText(w, 0, 0);
			ui.fillStyle = i === c.key ? ACCENT : '#FFFFFF'; ui.fillText(w, 0, 0); ui.restore();
		});
	}
	if (t >= STAMP.a) { // carimbo: 1.4 → 1 em 0,2 s, −3°
		const u = seg(t, STAMP.a, STAMP.a + .2), s = lerp(1.4, 1, easeOut(u, 3));
		ui.save(); ui.translate(470, 820); ui.rotate(-3 * Math.PI / 180); ui.scale(s, s); ui.globalAlpha = clamp(u * 4);
		const bw = 760, bh = 190, fs = fitFont(STAMP.text, bw - 90, 96);
		ui.fillStyle = ACCENT; ui.strokeStyle = PLUM; ui.lineWidth = 14; ui.beginPath(); ui.roundRect(-bw / 2, -bh / 2, bw, bh, 26); ui.fill(); ui.stroke();
		ui.lineWidth = 5; ui.beginPath(); ui.roundRect(-bw / 2 + 18, -bh / 2 + 18, bw - 36, bh - 36, 16); ui.stroke();
		ui.font = `900 ${fs}px Inter`; ui.textAlign = 'center'; ui.textBaseline = 'middle'; ui.fillStyle = PLUM; ui.fillText(STAMP.text, 0, 6);
		ui.restore();
	}
}

// ───────────────────────── render ─────────────────────────
const tmpV = new THREE.Vector3();
function renderShot(sh, t) {
	const c = sh.cam(t), kk = kick(t, KICKS);
	camera.position.set(...c.pos); camera.lookAt(...c.look); camera.fov = c.fov; camera.updateProjectionMatrix();
	camera.rotateZ((c.roll + 4.5 * kk) * Math.PI / 180); camera.position.y += .015 * kk;
	applyLight(Wd, sh.k, sh.fwd, c.look, sh.el);
	clock.setTime((sh.k > .5 ? 1110 : 610) + t * 1.2);
	for (const cl of Wd.clouds) cl.position.x += 0; // nuvens fixas (o movimento vem da câmera)
	cast.begin(camera, Wd.sunDir, sh.k);
	populate(t, sh);
	cast.end();
	post.lens(c.focus, c.cInf);
	post.grade({ warm: sh.k, sat: sh.k ? 1.08 : 1.06 });
}
function renderAt(T) {
	T = clamp(T, 0, DURATION - 1e-4);
	const sh = shotAt(T);
	let xf = 0;
	for (const [tx, n] of XFADE) { const d = n / FPS; if (T >= tx && T < tx + d) { const prev = shotAt(tx - 1e-3); renderShot(prev, T); post.capture(); xf = 1 - (T - tx) / d; } }
	renderShot(sh, T);
	let fl = 0; for (const [t0, d] of FLASH) if (T >= t0 && T < t0 + d) fl = Math.max(fl, 1 - (T - t0) / d);
	let wx = 0; for (const [a, b, s] of WHIP) if (T >= a && T < b) { const u = seg(T, a, b); wx = s * .06 * Math.sin(u * Math.PI); }
	post.render({ flash: fl * .9, xfade: xf, whip: [0, wx] });
	drawCaptions(T);
}

// ───────────────────────── player ─────────────────────────
function fit() { const k = Math.min(innerWidth / W, (innerHeight - 44) / H); stage.style.transform = `translate(-50%,-50%) translateY(-22px) scale(${k})`; }
addEventListener('resize', fit); fit();
const scrub = $('#scrub'), btn = $('#play');
let playing = false, cur = 0, t0 = performance.now();
const setPlay = (q) => { playing = q; btn.textContent = q ? '⏸' : '▶'; t0 = performance.now() - cur * 1000; };
btn.onclick = () => setPlay(!playing);
scrub.oninput = () => { cur = +scrub.value; setPlay(false); };
addEventListener('keydown', (e) => {
	if (e.code === 'Space') { e.preventDefault(); setPlay(!playing); }
	if (e.code === 'ArrowRight') { cur = clamp(cur + (e.shiftKey ? 2 : 1 / FPS), 0, DURATION); setPlay(false); }
	if (e.code === 'ArrowLeft') { cur = clamp(cur - (e.shiftKey ? 2 : 1 / FPS), 0, DURATION); setPlay(false); }
	if (e.code === 'KeyH') $('#hud').style.display = $('#hud').style.display === 'none' ? '' : 'none';
});
if (params.has('t')) cur = +params.get('t');
if (params.has('nohud')) $('#hud').style.display = 'none';
if (params.has('ink')) post.ink.debug = +params.get('ink');

for (const s of SHOTS) renderAt(s.a + .05); // pré-aquece shaders e texturas
renderAt(cur);
window.__mg = { duration: DURATION, fps: FPS, width: W, height: H, renderAt, scene, current: () => ({ scene, camera }) };
$('#loading').remove();
if (params.has('export')) { $('#hud').remove(); window.__mg.loaded = true; }
else (function loop() {
	if (playing) { cur = (performance.now() - t0) / 1000; if (cur >= DURATION) { cur = 0; setPlay(true); } }
	scrub.value = cur; $('#tc').textContent = cur.toFixed(2).padStart(5, '0');
	renderAt(cur);
	requestAnimationFrame(loop);
})();
