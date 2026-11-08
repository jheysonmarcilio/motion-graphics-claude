// 12 — "Franklin desmascarou a hipnose (e provou que ela funciona)". Short 9:16, estilo Sticker, narração neural pt-BR.
// Tempos = audio/12-franklin-mesmer.mp3 (palavras em words.json). Biblioteca: demos/_sticker. Cenários: sets.js.
import * as THREE from 'three';
import { createPost } from '../_sticker/post.js';
import { Cast } from '../_sticker/cast.js';
import { SKIN, KID, fxBurst, fxStars, fxPuff, fxNote } from '../_sticker/toon.js';
import { fxBang, fxTears, fxSweat, fxSwirl, fxWand, fxArrow, fxGlint, fxCough, cloudCanvas } from '../_sticker/fx.js';
import { createWorld, applyLight, addClouds, ctex, INKC } from '../_sticker/world.js';
import { FPS, clamp, lerp, seg, smooth, smoother, easeOut, backOut, expoIn, kick, lidAt, exprAt, swapsOf, v3lerp } from '../_sticker/anim.js';
import { buildSets, SET } from './sets.js';

const WORDS = await (await fetch('./words.json')).json();
const W = 1080, H = 1920, DURATION = 60.4;
const $ = (s) => document.querySelector(s);
const stage = $('#stage'), params = new URLSearchParams(location.search);
await Promise.all(['900 100px Inter', '800 100px Inter', '700 30px "JetBrains Mono"'].map((f) => document.fonts.load(f)));

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.NeutralToneMapping; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.prepend(renderer.domElement);
const Wd = createWorld(), scene = Wd.scene, root = Wd.root;
const camera = new THREE.PerspectiveCamera(40, W / H, .1, 1200); scene.add(camera);
const post = createPost(renderer, scene, camera, W, H);
addClouds(Wd, cloudCanvas, 12);
const S = buildSets(Wd);
const cast = new Cast(root);
const at = (k, x, y, z) => [SET[k][0] + x, y, SET[k][1] + z];

// ───── elenco ─────
const P = (id, seed, o) => ({ id, seed, o });
const REI = P('rei', 6, { jacket: '#3f4fb5', pants: '#f1efe6', boots: '#2a201a', hat: 'wig', crown: true, skin: SKIN, build: 'stout' });
const FRANK = P('frank', 3, { jacket: '#7a5236', pants: '#5a4030', boots: '#2a201a', hat: 'bald', hair: '#dcd6cc', glasses: true, skin: '#f5c9a0', build: 'stout' });
const MESMER = P('mesmer', 5, { jacket: '#b48ae0', dress: '#9b6fd6', pants: '#3b3f52', boots: '#2a201a', hat: 'wig', skin: SKIN });
const MENINO = P('menino', 2, { ...KID, hat: 'hair', hair: '#7a4a2a', jacket: '#4f8a3c', skin: '#ecd0b6' });
const MENINO_V = P('meninoV', 2, { ...MENINO.o, blindfold: '#e2453c' });
const DESLON = P('deslon', 4, { jacket: '#2f5f6a', pants: '#3b3f52', boots: '#2a201a', hat: 'wig', skin: '#f5c9a0' });
const BRAID = P('braid', 7, { jacket: '#2e2a36', pants: '#3b3f52', boots: '#2a201a', hat: 'tophat', moustache: '#5a3b2a', skin: '#ecd0b6' });
const PAC = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => P('p' + i, (i % 7) + 1, {
	jacket: ['#c25a7a', '#3f6fb5', '#d9a441', '#5d7a3a', '#8c3b4a', '#2f5f6a', '#e2453c'][i % 7], pants: '#3b3f52', boots: '#4a3426',
	hat: ['bonnet', 'tophat', 'wig', 'bonnet', 'tophat', 'bonnet', 'wig'][i % 7], dress: ['#f2c6d4', '#ffd23f', '#9fd4ff'][i % 3],
	skin: [SKIN, '#f5c9a0', '#ecd0b6', '#c99067'][i % 4], build: i % 4 === 3 ? 'stout' : 'adult',
}));

// ───── planos ─────
// k: luz (0 dia → 1 dourado) · el: elevação do sol (interiores: alto, entra pelo "teto") · fwd: direção da câmera p/ o sol
const C = (pos, look, fov = 40, focus = 4, cInf = 0, roll = 0) => ({ pos, look, fov, focus, cInf, roll });
const mx = (t, a, b) => smoother(seg(t, a, b));
const BOY = { hug: [[34.9, 35.45], [36.0, 36.55], [37.05, 37.6], [37.95, 99]] };
const boyX = (t) => { const tr = S.trees, hx = (i) => tr[i][0] - .55; for (let i = 0; i < 4; i++) { const [a, b] = BOY.hug[i]; if (t < a) return i === 0 ? hx(0) : lerp(hx(i - 1), hx(i), smooth(seg(t, BOY.hug[i - 1][1], a))); if (t <= b) return hx(i); } return hx(3); };
const SHOTS = [
	{ a: 0, b: 3.55, set: 'V', k: .15, el: 62, fwd: [.3, 1], cam: (t) => { const u = mx(t, 0, 3.55); return C(at('V', lerp(-1.5, -.9, u), 1.45, lerp(3.6, 2.4, u)), at('V', .15, 1.25, -4), 40, 4.0, 10, -2); } },
	{ a: 3.55, b: 6.7, set: 'M', k: .35, el: 62, fwd: [.3, 1], cam: (t) => { const u = seg(t, 3.55, 6.7); return C(at('M', .35, 1.25, 8.6 - .5 * u), at('M', .35, 1.0, 4.1), 40, 4.4, 10); } },
	{ a: 6.7, b: 8.3, set: 'M', k: .35, el: 62, fwd: [.3, 1], cam: (t) => { const u = seg(t, 6.7, 8.3); return C(at('M', -.4, 1.55, 6.2 - .45 * u - .25 * easeOut(seg(t, 7.4, 7.7))), at('M', -.4, 1.28, 4.2), 40, 1.9, 15); } },
	{ a: 8.3, b: 10.45, set: 'RUA', k: 0, fwd: [0, -1], cam: (t) => { const u = mx(t, 8.3, 10.4), x = lerp(-9, -1.5, u); return C(at('RUA', x, 1.6, 5.2), at('RUA', x + 2.6, 1.35, -3.2), 42, 7.5, 7, -2); } },
	{ a: 10.45, b: 12.85, set: 'M', k: .35, el: 62, fwd: [.3, 1], cam: (t) => { const z = mesZ(t); return C(at('M', -1.5, .75, z + 3.3), at('M', -1.5, 1.45, z), 42, 3.3, 12); } },
	{ a: 12.85, b: 16.3, set: 'M', k: .35, el: 62, fwd: [.3, 1], cam: (t) => { const a = lerp(.55, -.35, mx(t, 12.85, 16.3)), r = 6.2; return C(at('M', Math.sin(a) * r, 3.1, Math.cos(a) * r), at('M', 0, .7, 0), 42, 6, 6); } },
	{ a: 16.3, b: 19.4, set: 'M', k: .35, el: 62, fwd: [.3, 1], cam: (t) => { const u = seg(t, 16.3, 19.4), [hx, hz] = S.arm; return C([hx - .3 + .5 * u, 1.95, hz + 2.9 - .5 * u], [hx, 1.3, hz - .4], 40, 3.1, 13, 2); } },
	{ a: 19.4, b: 21.25, set: 'V', k: .15, el: 62, fwd: [.3, 1], cam: (t) => { const p = .3 * seg(t, 19.4, 21.25) + .45 * easeOut(seg(t, 20.5, 20.75), 4); return C(at('V', .95, 1.62, -.3 - p), at('V', .95, 1.36, -2.5), 38, 2.1 - p, 15); } },
	{ a: 21.25, b: 25.6, set: 'M', k: .35, el: 62, fwd: [.3, 1], cam: (t) => { const a = .95 + .62 * mx(t, 22.95, 23.45) + .62 * mx(t, 23.95, 24.3), r = 5.0 + 1.3 * mx(t, 24.35, 24.9); return C(at('M', Math.cos(a) * r, 1.3, Math.sin(a) * r), at('M', Math.cos(a) * 2.5, .9, Math.sin(a) * 2.5), 42, 2.5, 11); } },
	{ a: 25.6, b: 28.25, set: 'M', k: .35, el: 62, fwd: [.3, 1], cam: (t) => { const u = seg(t, 25.6, 28.25); return C(at('M', 0, .85, 8.4 - .7 * u), at('M', 0, 1.7, 4.2), 42, 4.0, 9, lerp(-3, 3, u)); } },
	{ a: 28.25, b: 29.55, set: 'G', k: 0, fwd: [0, -1], cam: (t) => { const p = .5 * easeOut(seg(t, 28.25, 29.55), 2); return C(at('G', -10.1, 1.6, 5.6 - p), at('G', -10.1, 1.33, 3.4), 38, 2.2 - p, 14); } },
	{ a: 29.55, b: 32.45, set: 'G', k: 0, fwd: [.3, -1], cam: (t) => { const u = mx(t, 29.55, 32.4); return C(v3lerp(at('G', 2, 10, 17), at('G', -6.5, 1.9, 7.5), u), v3lerp(at('G', -2, 1, -2), at('G', -9, 1.1, 2.2), u), 42, 6, lerp(0, 7, u)); } },
	{ a: 32.45, b: 34.95, set: 'G', k: 0, fwd: [.6, -1], cam: (t) => { const [x5, z5] = S.tree5, u = seg(t, 32.45, 34.95); return C([x5 - 3.2 + .4 * u, 1.7, z5 + 4.4 - .3 * u], [x5 - .6, 1.7, z5], 42, 4.6, 9); } },
	{ a: 34.95, b: 39.9, set: 'G', k: 0, fwd: [0, -1], cam: (t) => { const x = boyX(t) + .3 - .7 * smooth(seg(t, 38.4, 38.9)); return C([x, 1.25, SET.G[1] + 5.0], [x, 1.0, SET.G[1] + .4], 42, 4.6, 11); } },
	{ a: 39.9, b: 41.8, set: 'G', k: 0, fwd: [.5, -1], cam: (t) => { const [x5, z5] = S.tree5, u = seg(t, 39.9, 44.05); return C([x5 - 1.5, 2.5, z5 + 10 - 1.2 * u], [x5, 2.9, z5], 40, 9, 8); } },
	{ a: 41.8, b: 44.05, set: 'G', k: 0, fwd: [.5, -1], cam: (t) => { const [x5, z5] = S.tree5, u = seg(t, 41.8, 44.05); return C([x5 - 1.5, 2.5, z5 + 8.6 - .9 * u], [x5, 2.9, z5], 40, 8.2, 8); } },
	{ a: 44.05, b: 46.15, set: 'G', k: 0, fwd: [0, -1], cam: (t) => { const u = seg(t, 44.05, 46.15), bx = S.trees[3][0] - .9; return C([bx, 1.0, SET.G[1] + 2.9 - .4 * u], [bx, .95, SET.G[1] + .9], 38, 1.9, 15, 3); } },
	{ a: 46.15, b: 48.7, set: 'G', k: 0, fwd: [0, -1], cam: (t) => { const u = seg(t, 46.15, 48.7); return C(at('G', -9, 3.0 - .5 * u, 3.9), at('G', -9, .8, 3.0), 38, 2.3, 8, -4); } },
	{ a: 48.7, b: 51.4, set: 'B', k: .7, el: 40, fwd: [.3, 1], cam: (t) => { const u = mx(t, 48.7, 51.3); return C(at('B', lerp(1.0, .3, u), 1.45, 2.9), at('B', .15, 1.15, -1.0), 42, 4.0, 10); } },
	{ a: 51.4, b: 54.5, set: 'B', k: .7, el: 40, fwd: [.3, 1], cam: (t) => { const p = .5 * seg(t, 51.4, 54.5) + .3 * easeOut(seg(t, 53.5, 53.7), 4); return C(at('B', -.4, 1.32, 1.2 - p), at('B', -.4, 1.1, -1.25), 38, 2.4 - p, 15); } },
	{ a: 54.5, b: 60.41, set: 'G', k: 1, el: 15, fwd: [-1, -.4], cam: (t) => { const p = .25 * seg(t, 54.5, 60.4) + .3 * easeOut(seg(t, 58.0, 58.3), 4); return C(at('G', -10.1, 1.62, 5.3 - p), at('G', -10.1, 1.33, 3.4), 38, 1.9 - p, 15); } },
];
const XFADE = [[29.55, 8], [48.7, 9]];
const FLASH = [[3.55, .14], [53.55, .2], [58.66, .2], [47.87, .1]];
const KICKS = [[6.15, .8], [20.57, .4], [24.45, .7], [38.45, .8], [47.87, 1], [53.55, .5], [58.66, .6]];
const WHIP = [[8.15, 8.45, 1], [19.27, 19.55, -1], [28.1, 28.4, 1], [39.75, 40.05, 1]];
const shotAt = (t) => SHOTS.find((s) => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
const mesZ = (t) => lerp(3.0, 5.0, seg(t, 10.45, 12.85));
const bob = (t, f = 1.5) => Math.sin(t * f) * .02;

// ───── encenação ─────
const glint = (k, at3, s = .3, rot = 0) => cast.card('glint', 200, 200, (p) => fxGlint(p), at3, [s * k, s * k], { rot });
const loopFx = (key, t, fps, n) => Math.floor(t * fps) % n;
function populate(t, sh) {
	const i = SHOTS.indexOf(sh);
	if (sh.set === 'V') {
		cast.person(REI, at('V', 0, .62, -5.55), { mode: 'sit', expr: t < 1.9 ? 'stern' : 'grin', blink: lidAt(t, 6), facing: 1, wave: t > 1.9 && t < 3.55 ? smooth(seg(t, 1.9, 2.2)) : undefined }, { blob: false });
		const fe = i === 0 ? (t < 2.9 ? 'neutral' : 'smile') : exprAt(t, [[0, 'neutral'], [19.9, 'stern'], [20.55, 'nervous']]);
		cast.person(FRANK, at('V', i === 0 ? .25 : .95, 0, i === 0 ? -1.3 : -2.5), { mode: 'stand', expr: fe, blink: lidAt(t, 3, [2.9, 19.9, 20.55]), facing: i === 0 ? -1 : 0, look: i === 0 ? -1 : 0 });
		if (i === 7 && t > 20.55) cast.card('sweat|' + loopFx(0, t, 8, 8), 300, 300, (p) => fxSweat(p, loopFx(0, t, 8, 8) / 8), at('V', 1.4, 1.95, -2.45), [.3, .3]);
		if (i === 7 && t > 19.9) { const u = backOut(seg(t, 19.9, 20.1)); cast.card('bang?', 300, 260, (p) => fxBang(p, '?', '#c9a0ff'), at('V', .55, 2.25, -2.45), [.32 * u, .28 * u], { rot: -10 }); }
	}
	if (sh.set === 'M') {
		// pacientes ao redor da banheira (todos os planos do salão)
		S.seats.forEach(([sx, sz], j) => {
			let mode = 'sit', e = 'neutral', lean = 0, y = .38, jx = 0, tears = false;
			if (i === 1 && j === 3) return; // a vítima do dedo está de pé no plano 2
			if (t > 21.25) {
				if (j === 2 && t > 22.6) { e = 'pained'; tears = true; }
				if (j === 3 && t > 23.55) e = 'laugh';
				if (j === 4 && t > 24.3) { const f = easeOut(seg(t, 24.3, 24.6), 2); mode = f > .3 ? 'fall' : 'sit'; e = 'shock'; lean = .95 * f; y = lerp(.38, .12, f); jx = f > .9 ? Math.sin(t * 60) * .03 : 0; }
				if (j !== 2 && j !== 3 && j !== 4 && t > 22.0) e = ['shock', 'nervous', 'dazed', 'grin'][j % 4];
			}
			if (i === 9) e = 'dazed';
			cast.person(PAC[j], [sx + jx, y, sz], { mode, expr: e, blink: lidAt(t, 50 + j), facing: sx > SET.M[0] ? -1 : 1 }, { lean, blob: false });
			if (tears) cast.card('tears|' + loopFx(0, t, 10, 10), 400, 200, (p) => fxTears(p, loopFx(0, t, 10, 10) / 10), [sx, 1.2, sz + .05], [.6, .3]);
		});
		if (i === 1) { // Mesmer aponta, paciente cai
			cast.person(MESMER, at('M', -.4, 0, 4.2), { mode: 'stand', expr: 'stern', blink: lidAt(t, 5), facing: 1, wave: smooth(seg(t, 4.4, 4.8)) });
			const f = easeOut(seg(t, 6.1, 6.45), 2);
			cast.person(PAC[3], at('M', .6, .02 + .15 * f, 4.0), { mode: f > .3 ? 'fall' : 'stand', expr: t < 6.1 ? 'nervous' : 'dazed', blink: lidAt(t, 53), facing: -1 }, { lean: -.95 * f, blob: f < .5 });
			const b = seg(t, 5.85, 6.25); if (b > 0 && b < 1) cast.card('burstL|' + Math.round(b * 12), 500, 500, (p) => fxBurst(p, Math.round(b * 12) / 12, '#e6d2ff', 10), at('M', .05, 1.62, 4.25), [.7, .7]);
			if (t > 6.5) cast.card('stars|' + loopFx(0, t, 24, 24), 420, 210, (p) => fxStars(p, loopFx(0, t, 24, 24) / 24), at('M', 1.45, 1.05, 4.05), [.6, .3]);
		}
		if (i === 2) { // close do Mesmer
			cast.person(MESMER, at('M', -.4, 0, 4.2), { mode: 'stand', expr: t < 7.4 ? 'smile' : 'grin', blink: lidAt(t, 5, [7.4]), facing: 0 });
			for (let k = 0; k < 3; k++) { const u = (t * .9 + k / 3) % 1; glint(Math.sin(u * Math.PI), at('M', -.4 + [-.45, .5, .3][k], 1.5 + [.5, .35, .05][k], 4.3), .22); }
		}
		if (i === 4) { // Mesmer entra de roupão e varinha
			const z = mesZ(t);
			cast.person(MESMER, at('M', -1.5, 0, z), { mode: 'stroll', phase: (t * 1.25) % 1, expr: 'grin', blink: lidAt(t, 5), facing: 0, wave: 1 });
			cast.card('wand', 80, 500, (p) => fxWand(p), at('M', -1.5 + .3, 1.55, z + .05), [.07, .44], { rot: -8 });
			const g = seg(t, 12.2, 12.85); if (g > 0) glint(Math.sin(g * Math.PI) * 1.4, at('M', -1.5 + .27, 1.8, z + .08), .4, t * 90);
		}
		if (i === 5) { // banheira: varetas brilham em "magnetizada"
			const g = seg(t, 15.45, 16.3); if (g > 0) S.rods.forEach((r, j) => { const q = r.position, d = new THREE.Vector3(0, .55, 0).applyQuaternion(r.quaternion); glint(Math.sin(clamp(g * 1.6 - j * .05) * Math.PI), [q.x + d.x, q.y + d.y, q.z + d.z], .35, j * 20); });
		}
		if (i === 6) { // harmônica de vidro
			const [hx, hz] = S.arm;
			cast.person(MESMER, [hx, 0, hz - 1.0], { mode: 'stand', expr: 'smile_closed', blink: lidAt(t, 5), facing: 0, headTilt: Math.sin(t * 3) * 4 });
			for (let k = 0; k < 4; k++) { const u = ((t - 16.3) * .55 + k / 4) % 1; cast.card('note' + (k % 2), 220, 230, (p) => fxNote(p, k % 2, '#4a2f6a'), [hx - .5 + k * .32 + Math.sin(u * 6 + k) * .1, 1.45 + u * 1.3, hz + .3], [.22 * Math.sin(u * Math.PI) + .02, .23 * Math.sin(u * Math.PI) + .02], { rot: Math.sin(t * 4 + k) * 15 }); }
		}
		if (i === 9) { // "fluido magnético invisível"
			cast.person(MESMER, at('M', 0, 0, 4.2), { mode: 'stand', expr: 'grin', blink: lidAt(t, 5), facing: 0, wave: 1 });
			cast.card('wand', 80, 500, (p) => fxWand(p), at('M', .3, 1.6, 4.25), [.07, .44], { rot: -15 });
			const fade = 1 - seg(t, 27.5, 28.1);
			if (fade > 0) for (const [dx, dy, s, sp] of [[-.9, 1.9, 1.1, 1], [.95, 1.5, .9, -1.3], [0, 2.6, .8, .8]]) { const ph = ((t * .5 * sp) % 1 + 1) % 1, q = Math.round(ph * 24) / 24; cast.card('swirl|' + q, 500, 500, (p) => fxSwirl(p, q), at('M', dx, dy, 4.0), [s, s], { soft: true, opacity: fade * .9 }); }
		}
	}
	if (sh.set === 'RUA') { // fila na porta do Mesmer
		for (let j = 0; j < 9; j++) cast.person(PAC[(j + 3) % 10], at('RUA', .2 - j * .95, 0, -2.75 - (j % 2) * .25), { mode: 'stand', expr: ['smile', 'grin', 'nervous', 'smile_closed'][j % 4], blink: lidAt(t, 70 + j), facing: 1, look: 1, headTilt: Math.sin(t * 2 + j) * 3 });
	}
	if (sh.set === 'G' && i <= 10 || i === 20) { // Franklin no jardim (close)
		const e = i === 10 ? exprAt(t, [[0, 'smile'], [28.95, 'stern']]) : exprAt(t, [[0, 'smile'], [55.3, 'grin'], [57.25, 'nervous'], [58.0, 'dazed'], [59.3, 'laugh']]);
		cast.person(FRANK, at('G', -10.1, 0, 3.4), { mode: 'stand', expr: e, blink: lidAt(t, 3, i === 10 ? [28.95] : [55.3, 57.25, 58.0, 59.3]), facing: 0 });
		if (i === 20 && t > 57.25 && t < 58.0) cast.card('sweat|' + loopFx(0, t, 8, 8), 300, 300, (p) => fxSweat(p, loopFx(0, t, 8, 8) / 8), at('G', -9.65, 1.95, 3.45), [.28, .28]);
	}
	if (sh.set === 'G' && (i === 11 || i === 12)) { // menino sendo vendado + d'Eslon magnetizando
		cast.person(t > 31.0 ? MENINO_V : MENINO, at('G', -8.4, 0, 1.6), { mode: 'stand', expr: t > 31.0 ? 'nervous' : 'smile', blink: lidAt(t, 2), facing: 1 });
		cast.person(FRANK, at('G', -10.0, 0, 2.2), { mode: 'stand', expr: 'smile', blink: lidAt(t, 3), facing: 1 });
		const [x5, z5] = S.tree5;
		cast.person(DESLON, i === 11 ? at('G', -7.2, 0, 1.2) : [x5 - 1.7, 0, z5 + .9], { mode: 'stand', expr: 'grin', blink: lidAt(t, 4), facing: 1, wave: i === 12 ? smooth(seg(t, 33.3, 33.7)) : undefined });
		if (i === 12) {
			cast.card('wand', 80, 500, (p) => fxWand(p), [x5 - 1.38, 1.6, z5 + .95], [.07, .44], { rot: -55 });
			const g = seg(t, 33.9, 34.95); if (g > 0) { const q = Math.round((t * .6 % 1) * 24) / 24; cast.card('swirl|' + q, 500, 500, (p) => fxSwirl(p, q), [x5, 2.5, z5 + 1.9], [2.2 * easeOut(g), 2.2 * easeOut(g)], { soft: true, opacity: .75 }); }
		}
	}
	if (sh.set === 'G' && (i === 13 || i === 14 || i === 16)) { // menino abraçando as árvores
		const x = boyX(t), tz = SET.G[1] + .35, hugging = BOY.hug.some(([a, b]) => t >= a && t <= b);
		if (i === 13 && t < 38.4) cast.person(MENINO_V, [x, 0, tz], { side: true, mode: hugging ? 'stand' : 'march', stride: 1.1, phase: ((x + 50) / 1.3) % 1, expr: t > 37.4 ? 'pained' : t > 36.8 ? 'nervous' : 'neutral', blink: lidAt(t, 2) });
		else if (i !== 16) { const f = easeOut(seg(t, 38.4, 38.8), 2); cast.person(MENINO_V, [x - .15 * f, .05 + .18 * f, tz + .1], { mode: f > .3 ? 'fall' : 'stand', expr: 'dazed', blink: 0 }, { lean: 1.25 * f, blob: f < .5 }); }
		else { cast.person(MENINO_V, [S.trees[3][0] - .9, 0, SET.G[1] + .9], { mode: 'sit', expr: 'dazed', blink: 0, facing: 0 }, { blob: false }); }
		if (i === 13) {
			if (t > 36.85 && t < 37.6) cast.card('sweat|' + loopFx(0, t, 8, 8), 300, 300, (p) => fxSweat(p, loopFx(0, t, 8, 8) / 8), [x - .05, 1.55, tz + .1], [.3, .3]);
			const c = seg(t, 37.4, 37.9); if (c > 0 && c < 1) cast.card('cough|' + Math.round(c * 10), 300, 200, (p) => fxCough(p, Math.round(c * 10) / 10), [x + .5, 1.15, tz + .1], [.45, .3]);
			if (t > 38.75) { const hx = x - .15 - 1.0 * Math.sin(1.25), hy = .3 + 1.0 * Math.cos(1.25); cast.card('stars|' + loopFx(0, t, 24, 24), 420, 210, (p) => fxStars(p, loopFx(0, t, 24, 24) / 24), [hx, hy + .35, tz + .15], [.6, .3]); }
		}
		if (i === 16) { const g = seg(t, 45.1, 45.6); if (g > 0) { const q = Math.round((t * .7 % 1) * 24) / 24; cast.card('swirl|' + q, 500, 500, (p) => fxSwirl(p, q), [S.trees[3][0] - .9, 1.3, SET.G[1] + 1.0], [1.1 * backOut(g), 1.1 * backOut(g)], { soft: true, opacity: .85 }); } }
	}
	if (sh.set === 'G' && (i === 14 || i === 15)) { // a magnetizada era outra: brilho + seta; depois some ("nunca existiu")
		const [x5, z5] = S.tree5, off = seg(t, 43.2, 43.45);
		if (off < 1) {
			const q = Math.round((t * .5 % 1) * 24) / 24; cast.card('swirl|' + q, 500, 500, (p) => fxSwirl(p, q), [x5, 2.5, z5 + 1.9], [2.2 * (1 - off), 2.2 * (1 - off)], { soft: true, opacity: .75 });
			const a = backOut(seg(t, 40.4, 40.7)); if (a > 0) cast.card('arrow', 260, 320, (p) => fxArrow(p), [x5, 4.9 + Math.sin(t * 8) * .12, z5 + .6], [.8 * a, .98 * a]);
		}
		const pu = seg(t, 43.2, 43.75); if (pu > 0 && pu < 1) cast.card('puff|' + Math.round(pu * 12), 300, 300, (p) => fxPuff(p, Math.round(pu * 12) / 12), [x5, 2.7, z5 + .5], [3, 3], { soft: true });
	}
	if (i === 17) { // relatório + carimbo IMAGINAÇÃO
		const st = t >= 47.87, u = seg(t, 47.87, 48.05);
		cast.card('report|' + (st ? 1 : 0), 600, 800, (p) => drawReport(p.g, st), at('G', -9, .82, 3.0), [.6, .8], { flat: true, rot: -6 });
		if (t > 47.6 && t < 47.95) cast.card('stampblock', 300, 300, (p) => { p.poly([[40, 40], [260, 40], [260, 200], [40, 200]], '#8c3b4a', 10); p.poly([[110, 200], [190, 200], [190, 280], [110, 280]], '#5a3b26', 8); }, at('G', -9, .82 + .6 * (1 - seg(t, 47.6, 47.87)), 3.0), [.45, .45]);
		void u;
	}
	if (sh.set === 'B') { // Braid 1841
		cast.person(PAC[5], at('B', -.4, .4, -1.25), { mode: 'sit', expr: exprAt(t, [[0, 'neutral'], [51.0, 'dazed'], [52.35, 'sleepy']]), blink: t > 52.35 ? 0 : lidAt(t, 55), facing: 1, look: 1 }, { blob: false });
		cast.person(BRAID, at('B', .75, 0, -.6), { mode: 'stand', expr: t < 53.5 ? 'smile' : 'grin', blink: lidAt(t, 7), facing: 1, wave: smooth(seg(t, 49.6, 50.0)) }, { mirror: true });
		const gk = .7 + .3 * Math.sin(t * 7); glint(gk * 1.2, at('B', .42, 1.72, -.5), .32, t * 60);
		if (t > 53.5) { const g = seg(t, 53.5, 53.8), q = Math.round((t * .6 % 1) * 24) / 24; cast.card('swirl|' + q, 500, 500, (p) => fxSwirl(p, q), at('B', -.4, 1.45, -1.4), [1.6 * backOut(g), 1.6 * backOut(g)], { soft: true, opacity: .8 }); }
	}
}
function drawReport(g, stamped) {
	g.fillStyle = '#fbf3df'; g.fillRect(0, 0, 600, 800); g.strokeStyle = INKC; g.lineWidth = 10; g.strokeRect(5, 5, 590, 790);
	g.fillStyle = INKC; g.textAlign = 'center';
	let fs = 54; g.font = `900 ${fs}px Inter`; while (g.measureText('RELATÓRIO').width > 480) { fs -= 2; g.font = `900 ${fs}px Inter`; } g.fillText('RELATÓRIO', 300, 110);
	fs = 26; g.font = `700 ${fs}px "JetBrains Mono"`; while (g.measureText('COMISSÃO REAL · 1784').width > 480) { fs -= 1; g.font = `700 ${fs}px "JetBrains Mono"`; } g.fillText('COMISSÃO REAL · 1784', 300, 160);
	g.strokeStyle = '#9a8c80'; g.lineWidth = 6; for (let k = 0; k < 9; k++) { g.beginPath(); g.moveTo(70, 230 + k * 50); g.lineTo(530 - (k % 3) * 60, 230 + k * 50); g.stroke(); }
	if (stamped) {
		g.save(); g.translate(300, 560); g.rotate(-.18); g.strokeStyle = '#c0353a'; g.lineWidth = 12; g.strokeRect(-250, -70, 500, 140); g.lineWidth = 4; g.strokeRect(-236, -56, 472, 112);
		let s = 76; g.font = `900 ${s}px Inter`; while (g.measureText('IMAGINAÇÃO').width > 430) { s -= 2; g.font = `900 ${s}px Inter`; }
		g.fillStyle = '#c0353a'; g.textBaseline = 'middle'; g.fillText('IMAGINAÇÃO', 0, 6); g.restore();
	}
}

// ───── legendas (identidade: até 5 palavras, palavra-chave em destaque, entrada palavra a palavra com a voz) ─────
const ACCENT = '#C9A0FF', PLUM = '#241726';
const GROUPS = [[0, 0, 0], [1, 4, 4], [5, 7, 7], [8, 11, 9], [12, 15, 13], [16, 19, 19], [20, 23, -1], [24, 25, 25], [26, 30, 27], [31, 33, 33], [34, 38, 38], [39, 42, 40], [43, 46, 46], [47, 49, 49], [50, 52, 52], [53, 57, 57], [58, 61, 61], [62, 63, 63], [64, 67, 67], [68, 71, 71], [72, 73, 73], [74, 75, 75], [76, 80, 80], [81, 84, 82], [85, 88, 88], [89, 91, 91], [92, 96, 93], [97, 99, 97], [100, 102, 101], [103, 104, -1], [105, 109, 109], [110, 113, 113], [114, 116, -1], [117, 118, 118], [119, 123, 122], [124, 127, 127], [128, 129, 129], [130, 133, 133], [134, 135, 134], [136, 139, 137], [140, 143, 142], [144, 146, 145], [147, 149, 149], [150, 154, 154], [155, 158, 158], [159, 162, 162], [163, 164, -1], [165, 165, 165], [166, 168, 168], [169, 171, 169], [172, 174, 174]];
const BIG = new Set([165]);
const NAMES = [{ a: 3.1, b: 6.5, n: 'BENJAMIN FRANKLIN', s: 'INVENTOR · EUA' }, { a: 7.4, b: 10.3, n: 'FRANZ MESMER', s: 'MÉDICO · PARIS 1784' }, { a: 49.9, b: 53.2, n: 'JAMES BRAID', s: 'CIRURGIÃO · 1841' }];
const STAMP = { a: 58.02, text: 'PROVOU QUE FUNCIONA' };
const ui = $('#ui').getContext('2d');
const word = (i) => WORDS[i].w.replace(/[".,:…]/g, '').toUpperCase();
function fitFont(text, maxW, size, weight = 900, fam = 'Inter') { let s = size; ui.font = `${weight} ${s}px ${fam}`; while (ui.measureText(text).width > maxW && s > 14) { s -= 2; ui.font = `${weight} ${s}px ${fam}`; } return s; }
function drawUI(t) {
	ui.clearRect(0, 0, W, H);
	GROUPS.forEach(([i0, i1, key], gi) => {
		const a = WORDS[i0].a - .05, nx = GROUPS[gi + 1], b = nx ? WORDS[nx[0]].a - .07 : STAMP.a - .05;
		if (t < a || t > b || t >= STAMP.a) return;
		const out = expoIn(seg(t, b - .15, b)), line = [];
		for (let i = i0; i <= i1; i++) line.push(word(i));
		const big = BIG.has(i0); let rows = [line.map((w, k) => k)]; if (!big) { ui.font = '900 96px Inter'; if (ui.measureText(line.join(' ')).width > 800 && line.length > 1) { const h = Math.ceil(line.length / 2); rows = [line.slice(0, h).map((w, k) => k), line.slice(h).map((w, k) => k + h)]; } }
		const s0 = Math.min(...rows.map((r) => fitFont(r.map((k) => line[k]).join(' '), 800, big ? 150 : 96)));
		ui.font = `900 ${s0}px Inter`; const sp = ui.measureText(' ').width, wid = line.map((w) => ui.measureText(w).width);
		rows.forEach((row, ri) => { const tot = row.reduce((a, k) => a + wid[k], 0) + sp * (row.length - 1); let x = 470 - tot / 2; const y = 1290 + (ri - (rows.length - 1) / 2) * s0 * 1.08;
		row.forEach((k) => { const w = line[k];
			const wi = i0 + k, u = seg(t, WORDS[wi].a - .04, WORDS[wi].a + .16);
			if (u > 0) {
				let sc = (.85 + .15 * backOut(u)) * (1 - .1 * out);
				if (big) sc *= 1 + .15 * (1 - seg(t, WORDS[wi].a, WORDS[wi].a + .2));
				ui.save(); ui.globalAlpha = clamp(u * 3) * (1 - out); ui.translate(x + wid[k] / 2 + (big && u < 1 ? Math.sin(t * 90) * 3 : 0), y); ui.scale(sc, sc);
				ui.font = `900 ${s0}px Inter`; ui.textAlign = 'center'; ui.textBaseline = 'middle'; ui.lineJoin = 'round';
				ui.lineWidth = s0 * .2; ui.strokeStyle = PLUM; ui.strokeText(w, 0, 0); ui.fillStyle = wi === key ? ACCENT : '#FFFFFF'; ui.fillText(w, 0, 0); ui.restore();
			}
			x += wid[k] + sp;
		}); });
	});
	for (const n of NAMES) { // cartão de nome (figurinha com borda branca)
		if (t < n.a || t > n.b) continue;
		const u = backOut(seg(t, n.a, n.a + .3)), o = 1 - expoIn(seg(t, n.b - .2, n.b));
		ui.save(); ui.globalAlpha = o; ui.translate(440, 330); ui.rotate(-.04); ui.scale(u, u);
		const fs = fitFont(n.n, 560, 64), fm = fitFont(n.s, 560, 30, 700, '"JetBrains Mono"');
		ui.fillStyle = '#FFFFFF'; ui.beginPath(); ui.roundRect(-340, -95, 680, 190, 34); ui.fill();
		ui.fillStyle = PLUM; ui.beginPath(); ui.roundRect(-324, -79, 648, 158, 24); ui.fill();
		ui.textAlign = 'center'; ui.textBaseline = 'middle';
		ui.font = `900 ${fs}px Inter`; ui.fillStyle = '#FFFFFF'; ui.fillText(n.n, 0, -20);
		ui.font = `700 ${fm}px "JetBrains Mono"`; ui.fillStyle = ACCENT; ui.fillText(n.s, 0, 42);
		ui.restore();
	}
	if (t >= STAMP.a) { // carimbo final
		const u = seg(t, STAMP.a, STAMP.a + .2), s = lerp(1.4, 1, easeOut(u, 3));
		ui.save(); ui.translate(470, 1290); ui.rotate(-3 * Math.PI / 180); ui.scale(s, s); ui.globalAlpha = clamp(u * 4);
		const bw = 820, bh = 200, fs = fitFont(STAMP.text, bw - 100, 92);
		ui.fillStyle = ACCENT; ui.strokeStyle = PLUM; ui.lineWidth = 14; ui.beginPath(); ui.roundRect(-bw / 2, -bh / 2, bw, bh, 26); ui.fill(); ui.stroke();
		ui.lineWidth = 5; ui.beginPath(); ui.roundRect(-bw / 2 + 18, -bh / 2 + 18, bw - 36, bh - 36, 16); ui.stroke();
		ui.font = `900 ${fs}px Inter`; ui.textAlign = 'center'; ui.textBaseline = 'middle'; ui.fillStyle = PLUM; ui.fillText(STAMP.text, 0, 6);
		ui.restore();
	}
}

// ───── render ─────
function renderShot(sh, t) {
	const c = sh.cam(t), kk = kick(t, KICKS);
	camera.position.set(...c.pos); camera.lookAt(...c.look); camera.fov = c.fov; camera.updateProjectionMatrix();
	camera.rotateZ((c.roll + 4.5 * kk) * Math.PI / 180); camera.position.y += .015 * kk + bob(t) * 0;
	applyLight(Wd, sh.k, sh.fwd, c.look, sh.el);
	S.axle.rotation.x = t * 3;
	cast.begin(camera, Wd.sunDir, sh.k);
	populate(t, sh);
	cast.end();
	post.lens(c.focus, c.cInf);
	post.grade({ warm: sh.k * .8, sat: 1.07 });
}
function renderAt(T) {
	T = clamp(T, 0, DURATION - 1e-4);
	const sh = shotAt(T); let xf = 0;
	for (const [tx, n] of XFADE) { const d = n / FPS; if (T >= tx && T < tx + d) { renderShot(shotAt(tx - 1e-3), T); post.capture(); xf = 1 - (T - tx) / d; } }
	renderShot(sh, T);
	let fl = 0; for (const [t0, d] of FLASH) if (T >= t0 && T < t0 + d) fl = Math.max(fl, 1 - (T - t0) / d);
	let wx = 0; for (const [a, b, s] of WHIP) if (T >= a && T < b) wx = s * .06 * Math.sin(seg(T, a, b) * Math.PI);
	post.render({ flash: fl * .85, xfade: xf, whip: [wx, 0] });
	drawUI(T);
}

// ───── player ─────
function fit() { const k = Math.min(innerWidth / W, (innerHeight - 44) / H); stage.style.transform = `translate(-50%,-50%) translateY(-22px) scale(${k})`; }
addEventListener('resize', fit); fit();
const scrub = $('#scrub'), btn = $('#play'), voz = $('#voz');
let playing = false, cur = 0, t0 = performance.now();
const setPlay = (q) => { playing = q; btn.textContent = q ? '⏸' : '▶'; t0 = performance.now() - cur * 1000; if (q) { voz.currentTime = cur; voz.play().catch(() => {}); } else voz.pause(); };
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
for (const s of SHOTS) renderAt(s.a + .05);
renderAt(cur);
window.__mg = { duration: DURATION, fps: FPS, width: W, height: H, renderAt, scene, current: () => ({ scene, camera }) };
$('#loading').remove();
if (params.has('export')) { $('#hud').remove(); window.__mg.loaded = true; }
else (function loop() {
	if (playing) { cur = (performance.now() - t0) / 1000; if (!voz.paused && Math.abs(voz.currentTime - cur) > .08) { cur = voz.currentTime; t0 = performance.now() - cur * 1000; } if (cur >= DURATION) { cur = 0; setPlay(true); } }
	scrub.value = cur; $('#tc').textContent = cur.toFixed(2).padStart(5, '0');
	renderAt(cur);
	requestAnimationFrame(loop);
})();
