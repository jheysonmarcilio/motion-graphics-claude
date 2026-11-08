// 13 — Short 9:16 em estilo Sticker, 41 s, com narração: "Você já foi hipnotizado hoje?".
// Tema: hipnose de palco × foco de atenção × telas com rolagem infinita. Narração em demos/13-sticker-hipnose/words.json.
import * as THREE from 'three';
import { createPost } from '../_sticker/post.js';
import { Cast } from '../_sticker/cast.js';
import { SKIN, fxStars } from '../_sticker/toon.js';
import { fxSwirl, fxSpeed, cloudCanvas } from '../_sticker/fx.js';
import { createWorld, applyLight, addClouds, tree, bench, mesh, mat, cobbleTex, grassTex, woodTex, stripeTex } from '../_sticker/world.js';
import { FPS, clamp, lerp, seg, smooth, smoother, easeOut, backOut, expoIn, kick, lidAt, exprAt, hash } from '../_sticker/anim.js';

const W = 1080, H = 1920, DURATION = 41;
const $ = (s) => document.querySelector(s);
const stage = $('#stage'), params = new URLSearchParams(location.search);
await Promise.all(['900 100px Inter', '800 100px Inter'].map((f) => document.fonts.load(f)));

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.prepend(renderer.domElement);

// ───────────────────────── mundo ─────────────────────────
const Wd = createWorld(), scene = Wd.scene, root = Wd.root;
const camera = new THREE.PerspectiveCamera(40, W / H, .1, 1200); scene.add(camera);
const post = createPost(renderer, scene, camera, W, H);
addClouds(Wd, cloudCanvas, 8);

// cenário A: calçada/praça (sets 'park')
const parkG = new THREE.Group(); root.add(parkG);
const cob = cobbleTex().clone(); cob.repeat.set(30, 30); cob.needsUpdate = true;
const pg = mesh(new THREE.PlaneGeometry(60, 60), mat('cobble', { map: cob }), 0, 0, 0, parkG); pg.rotation.x = -Math.PI / 2; pg.castShadow = false;
[[-6, 10, 1.1, 1], [6.5, 11, 1.0, 2], [-9, 15, 1.2, 3], [9.5, 14, 1.05, 4], [-3.5, 22, 1.25, 5]].forEach(([x, z, s, sd]) => tree(parkG, x, z, s, sd));
bench(parkG, 0, 7, 0);

// cenário B: palco (sets 'stage')
const stageG = new THREE.Group(); root.add(stageG);
const wood = woodTex().clone(); wood.repeat.set(6, 6); wood.needsUpdate = true;
const fl = mesh(new THREE.PlaneGeometry(40, 40), mat('stagefloor', { map: wood }), 0, 0, 0, stageG); fl.rotation.x = -Math.PI / 2; fl.castShadow = false;
mesh(new THREE.PlaneGeometry(16, 8), mat('curtain', { map: stripeTex('#7a1f2a', '#a83a44') }), 0, 4, -2.4, stageG);
mesh(new THREE.BoxGeometry(16, .5, .4), mat('stagelip', { color: '#d9a441' }), 0, 8.1, -2.2, stageG);

const cast = new Cast(root);
const P = (id, seed, o) => ({ id, seed, o });
const MAN = P('man', 3, { jacket: '#3f6fb5', pants: '#4a4f63', boots: '#4a3426', hat: 'cap', cap: '#2f5f6a', skin: SKIN, moustache: '#4a3020' });
const GIR = P('gir', 4, { jacket: '#5a8fc2', pants: '#3b3f52', boots: '#5a3b2a', hat: 'bonnet', dress: '#ffd23f', skin: SKIN });
const HIP = P('hip', 6, { jacket: '#2b2f48', pants: '#24263a', boots: '#1a1410', hat: 'tophat', moustache: '#4a3020', skin: '#c99067', build: 'stout' });
const VOL = P('vol', 2, { jacket: '#e2453c', pants: '#3b5b9a', boots: '#2a201a', hat: 'cap', cap: '#ffd23f', skin: '#ecd0b6' });
const CROWD = [
	P('c0', 1, { jacket: '#8c3b4a', pants: '#3b3f52', boots: '#2a201a', hat: 'tophat', skin: '#f5c9a0' }),
	P('c1', 5, { jacket: '#5d7a3a', pants: '#4a4f63', boots: '#4a3426', hat: 'bonnet', dress: '#c25a7a', skin: '#c99067' }),
	P('c2', 7, { jacket: '#b5653f', pants: '#3b3f52', boots: '#2a201a', hat: 'cap', cap: '#2f5f6a', skin: '#ecd0b6' }),
];
const STREET = [
	P('s0', 2, { jacket: '#3f6fb5', pants: '#3b3f52', boots: '#4a3426', hat: 'cap', cap: '#e2453c', skin: SKIN }),
	P('s1', 4, { jacket: '#7b5ac9', pants: '#3b3f52', boots: '#2a201a', hat: 'bonnet', dress: '#ffd23f', skin: '#f5c9a0' }),
	P('s2', 6, { jacket: '#2f5f6a', pants: '#4a4f63', boots: '#5a3b2a', hat: 'tophat', skin: '#c99067' }),
];

// ───────────────────────── cartões (efeitos e telas) ─────────────────────────
function spiral(t, at, size, speed = .8) {
	const b = Math.round(((t * speed) % 1) * 24) / 24;
	cast.card('sw|' + b, 500, 500, (p) => fxSwirl(p, b), at, [size, size]);
}
function pendulum(t) {
	const a = Math.sin(t * 3.4) * .42, k = Math.round(a * 60) / 60;
	cast.card('pend|' + k, 300, 400, (p) => {
		const px = 150, py = 18, L = 250, x = px + Math.sin(k) * L, y = py + Math.cos(k) * L;
		p.stroke([[px, py], [x, y]], 8); p.ell(x, y, 30, 30, '#f2c541', 7); p.ell(x - 9, y - 9, 8, 8, '#fffbe6', 2);
	}, [0, 2.4, -1.2], [1.2, 1.6]);
}
function phone(t, at, size, key) {
	const b = Math.round(((t * 2.2) % 1) * 6) / 6, cols = ['#ff7a45', '#c9a0ff', '#3fb8a8', '#ffd23f'];
	cast.card(`ph|${key}|${b}`, 300, 540, (p) => {
		const g = p.g; g.save(); g.lineJoin = 'round';
		g.fillStyle = '#1d1b2e'; g.strokeStyle = '#241726'; g.lineWidth = 14; g.beginPath(); g.roundRect(20, 10, 260, 520, 42); g.fill(); g.stroke();
		g.fillStyle = '#fbf3df'; g.beginPath(); g.roundRect(44, 52, 212, 436, 14); g.fill();
		const off = b * 92;
		for (let i = 0; i < 6; i++) { const y = 62 + i * 92 - off; g.fillStyle = cols[i % 4]; g.beginPath(); g.roundRect(64, y, 172, 70, 16); g.fill(); g.lineWidth = 8; g.stroke(); }
		g.restore();
	}, at, size, { rot: 0 });
}

// ───────────────────────── planos ─────────────────────────
// set: 'park' | 'stage'; k: 0 dia / 1 dourado; cam(t) → { pos, look, fov, roll, focus, cInf }
const MAN_E = [[0, 'neutral'], [1.0, 'shock'], [1.9, 'dazed'], [3.0, 'sleepy']];
const VOL_E = [[0, 'smile'], [6.6, 'nervous'], [7.6, 'sleepy']];
const HIP_E = [[0, 'grin'], [7.4, 'laugh']];
const SHOTS = [
	{ id: 1, set: 'park', a: 0, b: 3.9, k: 0, fwd: [0, -1], cam: (t) => { const u = smoother(seg(t, 0, 3.9)); return { pos: [0, 1.3, 3.4 - .45 * u], look: [0, 1.25, 7], fov: 40, roll: lerp(-2, 1, u), focus: 3.6, cInf: 10 }; } },
	{ id: 2, set: 'stage', a: 3.9, b: 13.1, k: 0, fwd: [0, -1], cam: (t) => { const u = smoother(seg(t, 3.9, 13.1)); return { pos: [0, 1.4, 9.4 - .6 * u], look: [0, 1.5, -.5], fov: 42, roll: lerp(3, -1, u), focus: 6.5, cInf: 8 }; } },
	{ id: 3, set: 'park', a: 13.1, b: 21.0, k: 0, fwd: [.3, -1], cam: (t) => { const u = smoother(seg(t, 13.1, 21)); return { pos: [lerp(3, 1.2, u), 2.2, 3.9], look: [0, 1.4, 6.9], fov: 40, roll: -2, focus: 3.5, cInf: 10 }; } },
	{ id: 4, set: 'park', a: 21.0, b: 26.7, k: 0, fwd: [0, -1], cam: (t) => { const u = seg(t, 21, 26.7); return { pos: [0, 1.7, -.4 + .3 * u], look: [0, 1.2, 6.6], fov: 42, roll: 0, focus: 4.2, cInf: 9 }; } },
	{ id: 5, set: 'park', a: 26.7, b: 31.9, k: 0, fwd: [0, -1], cam: (t) => { const u = smoother(seg(t, 26.7, 31.9)); return { pos: [0, 1.25, 4.3 - .45 * u], look: [0, 1.25, 6.9], fov: 40, roll: 0, focus: 2.6, cInf: 10 }; } },
	{ id: 6, set: 'stage', a: 31.9, b: 35.7, k: 0, fwd: [0, -1], cam: (t) => { const u = seg(t, 31.9, 35.7); return { pos: [.4 * u, 1.4, 4.6 - .3 * u], look: [0, 1.4, -.4], fov: 40, roll: 0, focus: 5, cInf: 8 }; } },
	{ id: 7, set: 'stage', a: 35.7, b: 41.01, k: 1, el: 17, fwd: [-1, -.3], cam: (t) => { const u = smoother(seg(t, 35.7, 41)); return { pos: [lerp(-1.4, .4, u), 1.3, 4.2 - .5 * u], look: [0, 1.6, -.4], fov: 40, roll: lerp(0, 2, u), focus: 4.6, cInf: 9 }; } },
];
const XFADE = [[13.1, 6], [21.0, 6], [26.7, 6], [31.9, 6], [35.7, 6]];
const FLASH = [[0, .14], [35.7, .2]];
const KICKS = [[13.1, 1], [35.7, .5]];
const shotAt = (t) => SHOTS.find((s) => t >= s.a && t < s.b) || SHOTS[SHOTS.length - 1];

// ───────────────────────── encenação ─────────────────────────
function populate(t, sh) {
	const id = sh.id;
	if (id === 1) { // o cara no banco, pego pelo espiral
		cast.person(MAN, [0, .3, 6.95], { mode: 'sit', expr: exprAt(t, MAN_E), blink: lidAt(t, 3) }, { blob: false });
		spiral(t, [0, 2.3, 8.4], 1.6, 1.1);
	}
	if (id === 2) { // palco: pêndulo, voluntário caindo no sono, plateia
		pendulum(t);
		cast.person(HIP, [-1.8, 0, -.4], { mode: 'stand', expr: exprAt(t, HIP_E), blink: lidAt(t, 9), facing: 1, lean: .02 * Math.sin(t * 3.4) }, {});
		const sw = seg(t, 6.6, 7.6);
		cast.person(VOL, [1.5, 0, -.3], { mode: 'stand', expr: exprAt(t, VOL_E), blink: lidAt(t, 10), facing: -1, lean: .06 * sw * Math.sin(t * 4) + .08 * sw }, {});
		CROWD.forEach((who, i) => cast.person(who, [-3.4 + i * 3.4, 0, 4.2 + (i % 2) * .7], { mode: 'stand', expr: t > 8 ? 'laugh' : 'smile', blink: lidAt(t, 20 + i), facing: 0 }));
	}
	if (id === 3) { // a leitora: o mundo gira em volta
		cast.person(GIR, [0, .3, 6.95], { mode: 'sit', expr: t < 17 ? 'smile' : 'dazed', blink: lidAt(t, 4) }, { blob: false });
		spiral(t, [0, 1.75, 8.2], 2.2, 1.4);
		spiral(t + .5, [0, 1.75, 8.4], 2.8, -.6);
	}
	if (id === 4) { // "Mas espera…": fila olhando o celular, rolagem infinita
		STREET.forEach((who, i) => {
			const x = (i - 1) * .85, z = 5.6 + (i % 2) * .3;
			cast.person(who, [x, 0, z], { mode: 'stand', expr: 'sleepy', blink: lidAt(t, 30 + i), facing: 0, look: -1 });
			phone(t, [x, .72, z - .5], [.26, .48], 'p' + i);
		});
	}
	if (id === 5) { // "Basta uma tela": o cara do banco com o celular na cara
		cast.person(MAN, [0, .3, 6.95], { mode: 'sit', expr: 'sleepy', blink: lidAt(t, 3) }, { blob: false });
		phone(t, [0, 1.45, 5.7], [.3, .55], 'big');
	}
	if (id === 6) { // "Você é convidado": o hipnotizador estende a mão
		cast.person(HIP, [0, 0, -.4], { mode: 'stand', expr: 'grin', blink: lidAt(t, 9), facing: 0, wave: smooth(seg(t, 32.2, 32.8)) - smooth(seg(t, 34.6, 35.2)) }, {});
		pendulum(t);
	}
	if (id === 7) { // final: risada, pêndulo e o carimbo
		cast.person(HIP, [0, 0, -.4], { mode: 'stand', expr: t < 38 ? 'laugh' : 'grin', blink: lidAt(t, 9), facing: 0, lean: .03 * Math.sin(t * 2.6) }, {});
		pendulum(t);
		cast.card('speed|' + Math.round(((t * 2) % 1) * 7), 300, 260, (p) => fxSpeed(p, Math.round(((t * 2) % 1) * 7)), [-1.3, 2.1, 1.6], [1.5, 1.3]);
		if (t > 38.4) { const s = (t * 1.2) % 1; cast.card('stars|' + Math.round(s * 24), 420, 210, (p) => fxStars(p, Math.round(s * 24) / 24), [1.2, 2.5, 1.5], [.75, .375]); }
	}
}

// ───────────────────────── legendas e carimbo ─────────────────────────
const ui = $('#ui').getContext('2d');
const ACCENT = '#FFD23F', PLUM = '#241726';
const CAPS = [
	{ a: .05, b: 3.85, words: ['VOCÊ JÁ FOI', 'HIPNOTIZADO', 'HOJE?'], key: 1 },
	{ a: 4.0, b: 13.0, words: ['PÊNDULO', 'DE PALCO', 'É SHOW'], key: 0 },
	{ a: 13.2, b: 20.9, words: ['O FOCO', 'É REAL'], key: 1 },
	{ a: 22.7, b: 26.6, words: ['MAS ESPERA…'], key: 0 },
	{ a: 26.8, b: 31.8, words: ['BASTA', 'UMA TELA'], key: 1 },
	{ a: 32.0, b: 35.6, words: ['VOCÊ É', 'CONVIDADO'], key: 1 },
];
const STAMP = { a: 36.0, text: 'QUEM MANDA AQUI?' };
function fitFont(text, maxW, size, weight = 900) { let s = size; ui.font = `${weight} ${s}px Inter`; while (ui.measureText(text).width > maxW && s > 20) { s -= 2; ui.font = `${weight} ${s}px Inter`; } return s; }
function drawCaptions(t) {
	ui.clearRect(0, 0, W, H);
	for (const c of CAPS) {
		if (t < c.a || t > c.b) continue;
		const out = expoIn(seg(t, c.b - .15, c.b));
		c.words.forEach((w, i) => {
			const t0 = c.a + i * .26, u = seg(t, t0, t0 + .25); if (u <= 0) return;
			const s = fitFont(w, 780, 118) * (.85 + .15 * backOut(u)) * (1 - .1 * out), y = 1180 + i * 128;
			ui.save(); ui.globalAlpha = clamp(u * 3) * (1 - out); ui.translate(470, y); ui.font = `900 ${s}px Inter`; ui.textAlign = 'center'; ui.textBaseline = 'middle';
			ui.lineJoin = 'round'; ui.lineWidth = s * .2; ui.strokeStyle = PLUM; ui.strokeText(w, 0, 0);
			ui.fillStyle = i === c.key ? ACCENT : '#FFFFFF'; ui.fillText(w, 0, 0); ui.restore();
		});
	}
	if (t >= STAMP.a) { // carimbo 1.4 → 1 em 0,2 s, −3°
		const u = seg(t, STAMP.a, STAMP.a + .2), s = lerp(1.4, 1, easeOut(u, 3));
		ui.save(); ui.translate(470, 820); ui.rotate(-3 * Math.PI / 180); ui.scale(s, s); ui.globalAlpha = clamp(u * 4);
		const bw = 800, bh = 190, fs = fitFont(STAMP.text, bw - 90, 96);
		ui.fillStyle = ACCENT; ui.strokeStyle = PLUM; ui.lineWidth = 14; ui.beginPath(); ui.roundRect(-bw / 2, -bh / 2, bw, bh, 26); ui.fill(); ui.stroke();
		ui.lineWidth = 5; ui.beginPath(); ui.roundRect(-bw / 2 + 18, -bh / 2 + 18, bw - 36, bh - 36, 16); ui.stroke();
		ui.font = `900 ${fs}px Inter`; ui.textAlign = 'center'; ui.textBaseline = 'middle'; ui.fillStyle = PLUM; ui.fillText(STAMP.text, 0, 6);
		ui.restore();
	}
}

// ───────────────────────── render ─────────────────────────
function renderShot(sh, t) {
	const c = sh.cam(t), kk = kick(t, KICKS);
	camera.position.set(...c.pos); camera.lookAt(...c.look); camera.fov = c.fov; camera.updateProjectionMatrix();
	camera.rotateZ((c.roll + 4.5 * kk) * Math.PI / 180); camera.position.y += .015 * kk;
	parkG.visible = sh.set === 'park'; stageG.visible = sh.set === 'stage';
	applyLight(Wd, sh.k, sh.fwd, c.look, sh.el);
	cast.begin(camera, Wd.sunDir, sh.k);
	populate(t, sh);
	cast.end();
	post.lens(c.focus, c.cInf);
	post.grade({ warm: sh.k, sat: sh.k ? 1.08 : 1.08 });
}
function renderAt(T) {
	T = clamp(T, 0, DURATION - 1e-4);
	const sh = shotAt(T);
	let xf = 0;
	for (const [tx, n] of XFADE) { const d = n / FPS; if (T >= tx && T < tx + d) { const prev = shotAt(tx - 1e-3); renderShot(prev, T); post.capture(); xf = 1 - (T - tx) / d; } }
	renderShot(sh, T);
	let fl = 0; for (const [t0, d] of FLASH) if (T >= t0 && T < t0 + d) fl = Math.max(fl, 1 - (T - t0) / d);
	post.render({ flash: fl * .9, xfade: xf, whip: [0, 0] });
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

for (const s of SHOTS) renderAt(s.a + .05); // pré-aquece shaders e texturas
renderAt(cur);
window.__mg = { duration: DURATION, fps: FPS, width: W, height: H, renderAt, scene };
$('#loading').remove();
if (params.has('export')) { $('#hud').remove(); window.__mg.loaded = true; }
else (function loop() {
	if (playing) { cur = (performance.now() - t0) / 1000; if (cur >= DURATION) { cur = 0; setPlay(true); } }
	scrub.value = cur; $('#tc').textContent = cur.toFixed(2).padStart(5, '0');
	renderAt(cur);
	requestAnimationFrame(loop);
})();
