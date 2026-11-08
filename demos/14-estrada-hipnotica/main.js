// 14 — "A estrada hipnótica": você já foi hipnotizado hoje? Short 9:16, estilo Sticker, narração neural pt-BR (a pedido).
// Tempos = audio/14-estrada-hipnotica.mp3 (words.json). Biblioteca: demos/_sticker. Cenários: sets.js.
import * as THREE from 'three';
import { createPost } from '../_sticker/post.js';
import { Cast } from '../_sticker/cast.js';
import { SKIN, fxBurst, fxStars, fxPuff } from '../_sticker/toon.js';
import { fxBang, fxSwirl, fxGlint, fxZ, fxSweat, cloudCanvas } from '../_sticker/fx.js';
import { createWorld, applyLight, addClouds, INKC } from '../_sticker/world.js';
import { FPS, clamp, lerp, seg, smooth, smoother, easeOut, backOut, expoIn, kick, lidAt, exprAt } from '../_sticker/anim.js';
import { buildSets, SET, SPEED } from './sets.js';

const WORDS = await (await fetch('./words.json')).json();
const W = 1080, H = 1920, DURATION = 39.0;
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
const MARCOS = P('marcos', 3, { jacket: '#3f7fd0', pants: '#3b3f52', boots: '#2a201a', hat: 'hair', hair: '#4a3020', moustache: '#4a3020', skin: '#ecd0b6' });
const LUCIA = P('lucia', 5, { jacket: '#fffaf0', dress: '#2f8f7a', pants: '#2f8f7a', boots: '#2a201a', hat: 'hair', hair: '#7a3b2a', glasses: true, skin: '#c99067' });

// ───── planos ─────
const C = (pos, look, fov = 40, focus = 4, cInf = 0, roll = 0) => ({ pos, look, fov, focus, cInf, roll });
const mx = (t, a, b) => smoother(seg(t, a, b));
const ROAD = { k: .3, el: 36, fwd: [.5, -1] }, GOLD = { k: .85, el: 17, fwd: [-1, -.4] }, ROOM = { k: .35, el: 62, fwd: [.3, 1] };
const SHOTS = [
	{ id: 'h1', a: 0, b: 2.75, set: 'H', ...ROAD, cam: (t) => { const u = seg(t, 0, 2.75); return C(at('H', -1.2 + .5 * u, 1.7, 5.6 - .9 * u), at('H', .35, 1.35, 0), 40, 3.6, 10, -2); } },
	{ id: 'h2', a: 2.75, b: 5.2, set: 'H', ...ROAD, cam: (t) => { const u = seg(t, 2.75, 5.2); return C(at('H', 1.9, 1.6, 4.4 - .5 * u), at('H', -.1, 1.55, 0), 40, 2.8, 14, 3); } },
	{ id: 'r1', a: 5.2, b: 7.6, set: 'R', ...ROAD, cam: (t) => { const u = seg(t, 5.2, 7.6); return C(at('R', lerp(3.6, 2.6, u), 1.3, lerp(8.4, 7.4, u)), at('R', 0, .95, 0), 40, 7.8, 7, -2); } },
	{ id: 'r2', a: 7.6, b: 10.9, set: 'R', ...ROAD, cam: (t) => { const u = seg(t, 7.6, 10.9); return C(at('R', 1.7, .6, 6.8 - 1.8 * u), at('R', .2, 1.1, 0), 38 - 4 * u, 5.8 - 1.4 * u, 12, lerp(-3, 3, u)); } },
	{ id: 'h3', a: 10.9, b: 12.13, set: 'H', ...ROAD, cam: (t) => C(at('H', -3.5 + .6 * seg(t, 10.9, 12.13), 1.3, 14.5), at('H', -.2 - 1.2 * seg(t, 10.9, 12.13), 1.1, 6.7), 36, 8.5, 6, -2) },
	{ id: 'h4', a: 12.13, b: 14.4, set: 'H', ...ROAD, cam: (t) => { const a = lerp(.7, -.5, mx(t, 12.13, 14.4)); return C(at('H', Math.sin(a) * 4.0 + .4, 1.9, Math.cos(a) * 4.0), at('H', .4, 1.55, 0), 40, 3.0, 12, 2); } },
	{ id: 'r3', a: 14.4, b: 17.35, set: 'R', ...ROAD, cam: (t) => { const u = seg(t, 14.4, 17.35); return C(at('R', lerp(-3.4, -2.6, u), 1.4, lerp(7.0, 6.2, u)), at('R', .1, 1.0, 0), 40, 6.6, 8, 4); } },
	{ id: 'c1', a: 17.35, b: 20.1, set: 'C', ...ROOM, cam: (t) => { const u = seg(t, 17.35, 20.1); return C(at('C', -1.0, 1.9, 7.4 - .9 * u), at('C', -1.0, 1.95, -1.5), 40, 7.4, 8, -2); } },
	{ id: 'r4', a: 20.1, b: 23.4, set: 'R', ...ROAD, cam: (t) => { const u = seg(t, 20.1, 23.4); return C(at('R', .5 - .15 * u, 1.55, 2.7 - .35 * u), at('R', .4, 1.45, 0), 36, 2.6, 12); } },
	{ id: 'c2', a: 23.4, b: 25.65, set: 'C', ...ROOM, cam: (t) => { const u = seg(t, 23.4, 25.65); return C(at('C', -.35, 1.8, 7.0 - .5 * u), at('C', -.35, 1.8, -1.3), 40, 7.0, 8, 2); } },
	{ id: 'c3', a: 25.65, b: 28.1, set: 'C', ...ROOM, cam: (t) => { const u = seg(t, 25.65, 28.1); return C(at('C', 5.0 + .1 * u, 1.75, 3.0 - .4 * u), at('C', 5.1, 1.45, -2.0), 42, 5.0 - .4 * u, 9, -2); } },
	{ id: 'c4', a: 28.1, b: 31.3, set: 'C', ...ROOM, cam: (t) => { const u = seg(t, 28.1, 31.3); return C(at('C', 4.7 + .4 * u, 1.7, 2.6 - .2 * u), at('C', 5.0, 1.5, -2.0), 42, 4.8, 11, lerp(2, -2, u)); } },
	{ id: 'r5', a: 31.3, b: 33.75, set: 'R', ...GOLD, cam: (t) => { const u = seg(t, 31.3, 33.75); return C(at('R', lerp(-3.4, -2.7, u), 1.35, lerp(6.8, 6.1, u)), at('R', 0, 1.1, 0), 42, 6.5, 8, -3); } },
	{ id: 'r6', a: 33.75, b: 36.6, set: 'R', ...GOLD, cam: (t) => { const u = seg(t, 33.75, 36.6) , p = .3 * easeOut(seg(t, 35.7, 35.95), 3); return C(at('R', .9 - .3 * u, 1.45, 3.0 - .9 * u - p), at('R', .2, 1.3, 0), 36, 3.0 - .9 * u - p, 14, lerp(-2, 2, u)); } },
	{ id: 'r7', a: 36.6, b: 39.01, set: 'R', k: 1, el: 15, fwd: [-1, -.4], cam: (t) => { const u = mx(t, 36.6, 39); return C(at('R', lerp(1.8, 3.8, u), lerp(1.3, 1.7, u), lerp(4.0, 8.8, u)), at('R', 0, 1.05, 0), 40, lerp(4, 9, u), 7 * u, 0); } },
];
const FLASH = [[12.0, .15], [24.74, .12], [35.73, .2], [36.6, .22]];
const KICKS = [[4.44, .4], [7.77, .5], [8.37, .5], [8.92, .6], [9.5, .7], [12.05, .9], [16.0, .4], [24.74, .5], [30.46, .5], [35.73, .8], [36.6, .6]];
const WHIP = [[2.6, 2.9, 1], [7.45, 7.75, -1], [10.75, 11.05, 1], [14.25, 14.55, -1], [17.2, 17.5, 1], [23.25, 23.55, -1], [25.5, 25.8, 1], [31.15, 31.45, -1]];
const shotAt = (t) => SHOTS.find((s) => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];
const loopFx = (t, fps, n) => Math.floor(t * fps) % n;
const q24 = (t, sp) => Math.round((t * sp % 1) * 24) / 24;

// ───── cartões desenhados ─────
const fitText = (g, text, maxW, size, weight = 900, fam = 'Inter') => { let s = size; g.font = `${weight} ${s}px ${fam}`; while (g.measureText(text).width > maxW && s > 12) { s -= 2; g.font = `${weight} ${s}px ${fam}`; } return s; };
const cloud = (p, ells, fill) => { for (const e of ells) p.ell(e[0], e[1], e[2], e[3], fill, 10); for (const e of ells) p.ell(e[0], e[1], e[2], e[3], fill, 0); };
function drawThought(p, x) {
	const g = p.g; cloud(p, [[260, 130, 200, 90], [150, 150, 100, 70], [370, 150, 100, 70], [260, 90, 130, 70]], '#ffffff');
	p.ell(120, 270, 28, 22, '#fff', 8); p.ell(70, 310, 16, 13, '#fff', 8);
	g.fillStyle = INKC; g.textAlign = 'center'; g.textBaseline = 'middle'; fitText(g, 'DESMAIEI?', 330, 74); g.fillText('DESMAIEI?', 260, 128);
	if (x) { g.lineCap = 'round'; for (const [c, w] of [[INKC, 36], ['#e2453c', 24]]) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(130, 40); g.lineTo(400, 230); g.moveTo(400, 40); g.lineTo(130, 230); g.stroke(); } }
}
function drawSwitch(p, on) {
	const g = p.g; g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(8, 8, 624, 284, 44); g.fill(); g.fillStyle = '#2f2a3a'; g.beginPath(); g.roundRect(24, 24, 592, 252, 32); g.fill();
	g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff'; fitText(g, 'PILOTO AUTOMÁTICO', 520, 56); g.fillText('PILOTO AUTOMÁTICO', 320, 82);
	g.fillStyle = on ? '#5ad06a' : '#6b6672'; g.strokeStyle = INKC; g.lineWidth = 8; g.beginPath(); g.roundRect(190, 150, 260, 90, 45); g.fill(); g.stroke();
	g.fillStyle = '#ffffff'; g.beginPath(); g.arc(on ? 400 : 240, 195, 34, 0, 7); g.fill(); g.stroke();
	g.font = '900 34px Inter'; g.fillStyle = INKC; g.fillText(on ? 'ON' : 'OFF', on ? 262 : 392, 197);
}
function drawBrain(p, glow) {
	const g = p.g, pink = '#f4a3b8';
	cloud(p, [[260, 230, 210, 140], [150, 200, 110, 100], [370, 200, 110, 100], [260, 140, 130, 90], [200, 300, 90, 70], [330, 300, 90, 70]], pink);
	g.strokeStyle = '#d9738f'; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round';
	for (const pts of [[[120, 180], [160, 150], [190, 190], [230, 150]], [[300, 130], [340, 160], [380, 130], [420, 170]], [[140, 260], [190, 240], [220, 280]], [[330, 250], [370, 280], [410, 240]], [[250, 90], [260, 150], [250, 200]]]) { g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.stroke(); }
	g.fillStyle = INKC; g.strokeStyle = INKC; g.lineWidth = 9; // óculos escuros
	g.beginPath(); g.roundRect(150, 215, 100, 62, 22); g.roundRect(270, 215, 100, 62, 22); g.fill(); g.beginPath(); g.moveTo(250, 235); g.lineTo(270, 235); g.stroke();
	g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(180, 233, 14, 7, -.5, 0, 7); g.ellipse(300, 233, 14, 7, -.5, 0, 7); g.fill();
	g.strokeStyle = INKC; g.lineWidth = 9; g.beginPath(); g.arc(260, 300, 34, .25, Math.PI - .25); g.stroke();
}
function drawBattery(p, lvl, eco) {
	const g = p.g; g.fillStyle = INKC; g.beginPath(); g.roundRect(90, 6, 100, 40, 12); g.fill();
	g.fillStyle = '#fff'; g.strokeStyle = INKC; g.lineWidth = 12; g.beginPath(); g.roundRect(24, 30, 232, 430, 38); g.fill(); g.stroke();
	g.fillStyle = eco ? '#5ad06a' : '#ffd23f'; const hh = 350 * lvl; g.beginPath(); g.roundRect(52, 60 + (350 - hh) + 0, 176, Math.max(hh, 16), 22); g.fill();
	if (eco) { g.fillStyle = INKC; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 64px Inter'; g.fillText('ECO', 140, 245); }
}
function drawSticker(p, text, bg, fg) {
	const g = p.g; g.fillStyle = '#fff'; g.beginPath(); g.roundRect(6, 6, 588, 188, 40); g.fill(); g.fillStyle = bg; g.beginPath(); g.roundRect(22, 22, 556, 156, 28); g.fill();
	g.textAlign = 'center'; g.textBaseline = 'middle'; fitText(g, text, 500, 96); g.fillStyle = fg; g.fillText(text, 300, 104);
}
function drawPendulum(p) {
	const g = p.g; g.strokeStyle = INKC; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(100, 280); g.lineTo(100, 468); g.stroke();
	p.ell(100, 500, 46, 46, '#ffd23f', 8); g.strokeStyle = '#b5833a'; g.lineWidth = 5; g.beginPath(); for (let a = 0; a < 12; a += .2) g.lineTo(100 + Math.cos(a) * a * 3.2, 500 + Math.sin(a) * a * 3.2); g.stroke();
	p.ell(100, 280, 9, 9, INKC, 0);
}
function drawX(p) { const g = p.g; g.lineCap = 'round'; for (const [c, w] of [[INKC, 56], ['#e2453c', 38]]) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(40, 40); g.lineTo(260, 260); g.moveTo(260, 40); g.lineTo(40, 260); g.stroke(); } }
function drawWheelOk(p) {
	const g = p.g; g.lineCap = 'round'; for (const [c, w] of [[INKC, 44], ['#3f6fd0', 28]]) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.ellipse(190, 200, 130, 130, 0, 0, 7); g.moveTo(190, 200); g.lineTo(190, 330); g.moveTo(190, 200); g.lineTo(80, 150); g.moveTo(190, 200); g.lineTo(300, 150); g.stroke(); }
	p.ell(190, 200, 36, 36, '#ffd23f', 8); p.ell(320, 90, 56, 56, '#5ad06a', 10);
	g.strokeStyle = INKC; g.lineWidth = 16; g.beginPath(); g.moveTo(290, 92); g.lineTo(313, 116); g.lineTo(352, 66); g.stroke();
}

// ───── encenação ─────
const glint = (k, at3, s = .3, rot = 0) => cast.card('glint', 200, 200, (p) => fxGlint(p), at3, [s * k, s * k], { rot });
const swirlFx = (t, at3, s, op = .85, sp = .6) => { const q = q24(t, sp); cast.card('swirl|' + q, 500, 500, (p) => fxSwirl(p, q, '#ffd23f'), at3, [s, s], { soft: true, opacity: op }); };
const car = S.car;
function rig(setK, px, pz, yaw, t, o = {}) { // carro + motorista (+ passageira)
	const [sx, sz] = SET[setK], c = Math.cos(yaw), s = Math.sin(yaw), b = o.bounce ?? 0;
	const Wp = (lx, lz) => [sx + px + lx * c + lz * s, sz + pz - lx * s + lz * c];
	car.g.visible = true; car.g.position.set(sx + px, b, sz + pz); car.g.rotation.y = yaw;
	car.wheels.forEach((w) => { w.rotation.x = o.wheelAng ?? 0; }); car.wheel.rotation.z = o.steer ?? 0;
	const d = Wp(.4, -.35);
	cast.person(MARCOS, [d[0], .9 + b, d[1]], { mode: 'sit', facing: 0, ...o.drv }, { blob: false });
	if (o.pass) { const q = Wp(-.4, -.35); cast.person(LUCIA, [q[0], .9 + b, q[1]], { mode: 'sit', facing: 0, ...o.pass }, { blob: false }); }
	return Wp;
}
const cruise = (t) => ({ bounce: .015 * Math.sin(t * 13) + .01, wheelAng: SPEED * t / .38 });
function populate(t, sh) {
	car.g.visible = false;
	if (sh.set === 'R') S.scroll(t);
	switch (sh.id) {
		case 'h1': {
			rig('H', 0, 0, 0, t, { drv: { expr: exprAt(t, [[0, 'dazed'], [1.0, 'shock']]), blink: lidAt(t, 3, [1.0]) } });
			const u = backOut(seg(t, .5, .75)); cast.card('bang?', 300, 260, (p) => fxBang(p, '?', '#ffd23f'), at('H', .35, 2.15, -.3), [.34 * u, .3 * u], { rot: -8 });
			if (t > 1.0) cast.card('sweat|' + loopFx(t, 8, 8), 300, 300, (p) => fxSweat(p, loopFx(t, 8, 8) / 8), at('H', .9, 1.7, -.3), [.3, .3]);
			break;
		}
		case 'h2': {
			rig('H', 0, 0, 0, t, { drv: { expr: exprAt(t, [[2.75, 'nervous'], [3.9, 'smile_closed'], [4.44, 'grin']]), blink: lidAt(t, 3, [3.9, 4.44]) } });
			const u = backOut(seg(t, 2.95, 3.25)); cast.card('thought|' + (t >= 4.44 ? 1 : 0), 520, 330, (p) => drawThought(p, t >= 4.44), at('H', -.85, 2.35, -.2), [1.05 * u, .67 * u], { rot: 4 });
			const b = seg(t, 4.44, 4.8); if (b > 0 && b < 1) cast.card('burst|' + Math.round(b * 12), 500, 500, (p) => fxBurst(p, Math.round(b * 12) / 12, '#fff3b0', 10), at('H', -.85, 2.35, -.1), [.9, .9]);
			break;
		}
		case 'r1': rig('R', 0, 0, 0, t, { ...cruise(t), drv: { expr: 'neutral', blink: lidAt(t, 3) } }); break;
		case 'r2': {
			const e = exprAt(t, [[7.6, 'neutral'], [8.4, 'sleepy'], [9.5, 'dazed']]);
			rig('R', 0, 0, 0, t, { ...cruise(t), drv: { expr: e, blink: e === 'neutral' ? lidAt(t, 3, [8.4]) : 0 } });
			const n = [7.77, 8.37, 8.92, 9.5].filter((x) => t > x).length;
			if (n > 0) swirlFx(t, at('R', .4, 1.75, -.5), .5 + .38 * n, .35 + .15 * n);
			break;
		}
		case 'h3': {
			const u = easeOut(seg(t, 10.9, 12.05), 2.4), x = lerp(-14, -.4, u), moving = 1 - u;
			rig('H', x, 6.7, Math.PI / 2, t, { bounce: .012 * Math.sin(t * 13) * moving, wheelAng: x / .38, drv: { expr: t > 12.0 ? 'shock' : 'sleepy', blink: t > 12.0 ? 0 : lidAt(t, 3, [12.0]) } });
			if (t > 11.7 && t < 12.13) { const q = Math.round(seg(t, 11.7, 12.13) * 12); cast.card('puff|' + q, 300, 300, (p) => fxPuff(p, q / 12), at('H', x - 1.7, .5, 6.9), [1.4, 1.4], { soft: true }); }
			break;
		}
		case 'h4': {
			rig('H', 0, 0, 0, t, { drv: { expr: 'shock', blink: 0 } });
			[[12.29, -.5, 2.0], [12.92, .35, 2.25], [13.45, 1.15, 2.0]].forEach(([ta, dx, dy], i) => { const u = backOut(seg(t, ta, ta + .22)); if (u > 0) cast.card('bang?', 300, 260, (p) => fxBang(p, '?', i === 1 ? '#ff8a5c' : '#ffd23f'), at('H', dx, dy, -.3), [.34 * u, .3 * u], { rot: (i - 1) * 12 }); });
			break;
		}
		case 'r3': {
			const e = exprAt(t, [[14.4, 'grin'], [15.5, 'dazed']]), sw = seg(t, 15.9, 16.2);
			rig('R', 0, 0, 0, t, { ...cruise(t), steer: Math.sin(t * 2.2) * .5 * seg(t, 15.5, 16.2), drv: { expr: e, blink: e === 'grin' ? lidAt(t, 3, [15.5]) : 0, wave: t < 15.5 ? smooth(seg(t, 14.45, 14.75)) : undefined } });
			const u = backOut(seg(t, 15.95, 16.3)); cast.card('switch|' + (sw > .5 ? 1 : 0), 640, 300, (p) => drawSwitch(p, sw > .5), at('R', .05, 2.55, .3), [1.4 * u, .66 * u], { rot: -3 });
			if (t > 16.2) glint(.7 + .3 * Math.sin(t * 9), at('R', 1.1, 2.7, .4), .35, t * 40);
			break;
		}
		case 'c1': {
			const bobY = Math.sin(t * 2.2) * .03;
			cast.card('brain', 520, 460, (p) => drawBrain(p), at('C', -1, 1.78 + bobY, -1.5), [1.25, 1.1], { rot: Math.sin(t * 1.4) * 3 });
			const eco = t > 18.73, lv = eco ? 1 : lerp(1, .2, seg(t, 17.5, 18.6)), pop = backOut(seg(t, 17.5, 17.8));
			cast.card('batt|' + Math.round(lv * 20) + eco, 280, 480, (p) => drawBattery(p, Math.round(lv * 20) / 20, eco), at('C', -1.75, 3.0, -1.3), [.62 * pop, 1.06 * pop], { rot: -6 });
			if (eco) { const g = seg(t, 18.73, 19.3); glint(Math.sin(g * Math.PI) * 1.2, at('C', -1.75, 3.5, -1.2), .4, t * 80); }
			for (let k = 0; k < 3 && t > 19.3; k++) { const u = ((t - 19.3) * .8 + k / 3) % 1; cast.card('z' + k, 200, 200, (p) => fxZ(p, '#eef6ff'), at('C', -.2 + k * .22, 2.4 + u * 1.1, -1.2), [.24 * Math.sin(u * Math.PI) + .02, .24 * Math.sin(u * Math.PI) + .02]); }
			break;
		}
		case 'r4': {
			const e = exprAt(t, [[20.1, 'neutral'], [21.5, 'sleepy']]);
			rig('R', 0, 0, 0, t, { ...cruise(t), drv: { expr: e, blink: e === 'neutral' ? lidAt(t, 3, [21.5]) : 0 } });
			break;
		}
		case 'c2': {
			cast.card('brain', 520, 460, (p) => drawBrain(p), at('C', -1, 1.78 + Math.sin(t * 2.2) * .03, -1.5), [1.25, 1.1], { rot: Math.sin(t * 1.4) * 3 });
			cast.person(LUCIA, at('C', .35, 0, -1.2), { mode: 'stand', expr: 'smile', blink: lidAt(t, 5), facing: 1, wave: smooth(seg(t, 23.6, 24.0)) });
			const u = backOut(seg(t, 24.74, 25.0)); if (u > 0) cast.card('abs', 600, 200, (p) => drawSticker(p, 'ABSORÇÃO', '#ffd23f', INKC), at('C', -.85, 3.05, -1.2), [1.5 * u, .5 * u], { rot: -6 });
			if (t > 24.74) for (let k = 0; k < 3; k++) { const g = Math.sin(clamp(seg(t, 24.74, 25.5) * 1.4 - k * .12) * Math.PI); glint(g, at('C', -1 + [-.7, .75, .2][k], 2.0 + [.45, .3, .85][k], -1.2), .26, k * 25); }
			break;
		}
		case 'c3': case 'c4': {
			const c4 = sh.id === 'c4', e = exprAt(t, [[25.65, 'neutral'], [26.94, 'dazed'], [27.6, 'sleepy'], [30.0, 'dazed'], [30.46, 'grin']]);
			cast.person(MARCOS, at('C', 4.2, .7, -2.35), { mode: 'sit', expr: e, blink: e === 'sleepy' ? 0 : lidAt(t, 3, [26.94, 27.6, 30.0, 30.46]), facing: 0, wave: c4 && t > 30.2 ? smooth(seg(t, 30.2, 30.6)) : undefined }, { blob: false });
			cast.person(LUCIA, at('C', 5.4, 0, -1.5), { mode: 'stand', expr: 'smile_closed', blink: lidAt(t, 5), facing: -1, wave: 1 });
			if (!c4) cast.card('pend', 200, 560, (p) => drawPendulum(p), at('C', 4.85, 2.2, -1.45), [.55, 1.54], { rot: 26 * Math.sin(t * 3.4) });
			else cast.card('pend', 200, 560, (p) => drawPendulum(p), at('C', 4.85, 2.2, -1.45), [.55, 1.54], { rot: 16 * Math.sin(t * 3.4) * (1 - seg(t, 29.2, 29.9)) });
			if (!c4 && t > 26.94) swirlFx(t, at('C', 4.2, 1.7, -2.9), 1.5, .8 * seg(t, 26.94, 27.4));
			if (c4) {
				const z = backOut(seg(t, 28.8, 29.1)); if (z > 0 && t < 30.0) { cast.card('zz', 200, 200, (p) => fxZ(p, '#eef6ff'), at('C', 4.95, 2.0 + Math.sin(t * 3) * .05, -2.0), [.5 * z, .5 * z]); const xx = backOut(seg(t, 29.3, 29.55)); cast.card('xx', 300, 300, drawX, at('C', 4.95, 2.0, -1.9), [.6 * xx, .6 * xx]); }
				const w = backOut(seg(t, 30.46, 30.8)); if (w > 0) cast.card('wok', 400, 400, drawWheelOk, at('C', 3.7, 1.6, -1.7), [.9 * w, .9 * w], { rot: -8 });
			}
			break;
		}
		case 'r5': {
			rig('R', 0, 0, 0, t, { ...cruise(t), steer: Math.sin(t * 1.5) * .12, drv: { expr: 'smile', blink: lidAt(t, 3) }, pass: { expr: 'grin', blink: lidAt(t, 5), wave: smooth(seg(t, 32.0, 32.4)) } });
			const g = seg(t, 32.0, 32.9); if (g > 0) { const a = backOut(g); cast.card('arrow', 260, 320, (p) => fxArrow(p), at('R', -.9, 2.5 + Math.sin(t * 7) * .1, 1.5), [.4 * a, .5 * a], { rot: 0 }); }
			break;
		}
		case 'r6': {
			const e = exprAt(t, [[33.75, 'smile'], [34.7, 'dazed']]);
			rig('R', 0, 0, 0, t, { ...cruise(t), drv: { expr: e, blink: e === 'smile' ? lidAt(t, 3, [34.7]) : 0, wave: t > 34.5 ? smooth(seg(t, 34.5, 34.8)) : undefined }, pass: { expr: 'grin', blink: lidAt(t, 5) } });
			if (t > 34.7) swirlFx(t, at('R', .45, 1.7, -.7), 1.1 + 1.1 * easeOut(seg(t, 35.73, 36.2)), .8, .8);
			const b = seg(t, 35.73, 36.1); if (b > 0 && b < 1) cast.card('burst|' + Math.round(b * 12), 500, 500, (p) => fxBurst(p, Math.round(b * 12) / 12, '#fff3b0', 12), at('R', .4, 1.6, .5), [1.6, 1.6]);
			break;
		}
		case 'r7': {
			rig('R', 0, 0, 0, t, { ...cruise(t), drv: { expr: 'dazed', blink: 0 }, pass: { expr: 'grin', blink: lidAt(t, 5), wave: 1 } });
			swirlFx(t, at('R', .45, 1.8, -.7), 1.8, .5, .8);
			break;
		}
	}
}
const fxArrow = (p) => p.poly([[90, 20], [170, 20], [170, 170], [235, 170], [130, 300], [25, 170], [90, 170]], '#ffd23f', 12);

// ───── legendas (identidade: até 5 palavras, palavra-chave em destaque, entrada palavra a palavra com a voz) ─────
const ACCENT = '#FFD23F', PLUM = '#241726';
const GROUPS = [[0, 2, 2], [3, 6, 4], [7, 11, 11], [12, 12, 12], [13, 15, 15], [16, 19, 17], [20, 24, 21], [25, 28, -1], [29, 31, 31], [32, 34, 34], [35, 36, 36], [37, 39, 39], [40, 40, 40], [41, 45, 45], [46, 49, 49], [50, 52, 51], [53, 56, 56], [57, 60, 60], [61, 64, 64], [65, 67, 66], [68, 70, 70], [71, 75, 74], [76, 78, 77], [79, 81, 80], [82, 85, 85], [86, 89, 89], [90, 92, 92], [93, 96, 96], [97, 98, -1], [99, 103, 102]];
const BIG = new Set([12, 40]);
const NAMES = [{ a: 5.35, b: 7.4, n: 'MARCOS', s: 'MOTORISTA · 40 MIN POR DIA' }, { a: 23.55, b: 25.4, n: 'DRA. LÚCIA', s: 'PSICÓLOGA' }];
const STAMP = { a: 36.6, text: 'SÓ FALTAVA UM GUIA' };
const ui = $('#ui').getContext('2d');
const word = (i) => WORDS[i].w.replace(/[".,:…]/g, '').toUpperCase();
function fitFont(text, maxW, size, weight = 900, fam = 'Inter') { let s = size; ui.font = `${weight} ${s}px ${fam}`; while (ui.measureText(text).width > maxW && s > 14) { s -= 2; ui.font = `${weight} ${s}px ${fam}`; } return s; }
function drawUI(t) {
	ui.clearRect(0, 0, W, H);
	const tu = smooth(seg(t, 21.35, 22.3)) - smooth(seg(t, 23.0, 23.4)); // visão de túnel: o foco estreita e o resto escurece
	if (tu > .002) {
		const r = lerp(1500, 310, tu); ui.save(); ui.fillStyle = `rgba(36,23,38,${.5 + .45 * tu})`; ui.beginPath(); ui.rect(0, 0, W, H); ui.arc(560, 700, r, 0, Math.PI * 2, true); ui.fill('evenodd');
		ui.globalAlpha = tu; ui.strokeStyle = ACCENT; ui.lineWidth = 12; ui.beginPath(); ui.arc(560, 700, r, 0, Math.PI * 2); ui.stroke(); ui.restore();
	}
	GROUPS.forEach(([i0, i1, key], gi) => {
		const a = WORDS[i0].a - .05, nx = GROUPS[gi + 1], b = nx ? WORDS[nx[0]].a - .07 : STAMP.a - .05;
		if (t < a || t > b || t >= STAMP.a) return;
		const out = expoIn(seg(t, b - .15, b)), line = [];
		for (let i = i0; i <= i1; i++) line.push(word(i));
		const big = BIG.has(i0); let rows = [line.map((w, k) => k)]; if (!big) { ui.font = '900 96px Inter'; if (ui.measureText(line.join(' ')).width > 800 && line.length > 1) { const h = Math.ceil(line.length / 2); rows = [line.slice(0, h).map((w, k) => k), line.slice(h).map((w, k) => k + h)]; } }
		const s0 = Math.min(...rows.map((r) => fitFont(r.map((k) => line[k]).join(' '), 800, big ? 150 : 96)));
		ui.font = `900 ${s0}px Inter`; const sp = ui.measureText(' ').width, wid = line.map((w) => ui.measureText(w).width);
		rows.forEach((row, ri) => { const tot = row.reduce((a2, k) => a2 + wid[k], 0) + sp * (row.length - 1); let x = 470 - tot / 2; const y = 1290 + (ri - (rows.length - 1) / 2) * s0 * 1.08;
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
	camera.rotateZ((c.roll + 4.5 * kk) * Math.PI / 180); camera.position.y += .015 * kk;
	applyLight(Wd, sh.k, sh.fwd, sh.cam(sh.a).look, sh.el); // foco da sombra fixo por plano: mapa de sombra não 'nada' com a câmera
	cast.begin(camera, Wd.sunDir, sh.k);
	populate(t, sh);
	cast.end();
	post.lens(c.focus, c.cInf);
	post.grade({ warm: sh.k * .8, sat: 1.07 });
}
function renderAt(T) {
	T = clamp(T, 0, DURATION - 1e-4);
	const sh = shotAt(T);
	renderShot(sh, T);
	let fl = 0; for (const [t0, d] of FLASH) if (T >= t0 && T < t0 + d) fl = Math.max(fl, 1 - (T - t0) / d);
	let wx = 0; for (const [a, b, s] of WHIP) if (T >= a && T < b) wx = s * .06 * Math.sin(seg(T, a, b) * Math.PI);
	post.render({ flash: fl * .85, xfade: 0, whip: [wx, 0] });
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
