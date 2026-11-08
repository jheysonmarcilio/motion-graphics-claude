// Short 05 · Como hipnotizar alguém online. Explainer flat: folhas de cor chapada lado a lado num grande mural;
// a câmera ortográfica faz whip pan de uma folha para outra. Tudo é função de T (narração gravada).
import * as THREE from 'three';
import { seg, ease, clamp, lerp, mulberry32 } from './lib.js';
import { P, at, rrect, circle, ring, poly, card, setOpacity, textPlane, stroke, arc, quad, arrow, hand, person, blinkAt, wifi, bits, burst, mesh } from './flat.js';

export const DUR = 107.6;
const CW = 1700, CH = 2800;
const GRID = { DESK: [0, 0], STAGE: [1, 0], BOARD: [2, 0], BAR: [3, 0], TRASH: [4, 0], S1: [0, 1], S2: [1, 1], S3: [2, 1], S4: [3, 1], S5: [4, 1], FIST: [0, 2], DEEP: [1, 2], SCALE: [2, 2] };
const BG = { DESK: P.noite, STAGE: P.noite2, BOARD: P.creme, BAR: P.menta, TRASH: P.rosa, S1: P.menta, S2: P.laranja, S3: P.azul, S4: P.amarelo, S5: P.noite2, FIST: P.azul, DEEP: P.noite, SCALE: P.amarelo };
const ORIG = Object.fromEntries(Object.entries(GRID).map(([k, [c, r]]) => [k, new THREE.Vector2(c * CW, -r * CH)]));

const eo = ease.expoOut, bo = ease.backOut, sm = (T, a, b) => ease.cubicInOut(seg(T, a, b));
const pop = (T, t0, d = .35) => bo(seg(T, t0, t0 + d));
const win = (T, a, b, fi = .25, fo = .2) => eo(seg(T, a, a + fi)) * (1 - ease.expoIn(seg(T, b - fo, b)));
const V = new THREE.Vector3();
const toLocal = (obj, root, x = 0, y = 0) => { V.set(x, y, 0); obj.localToWorld(V); root.worldToLocal(V); return [V.x, V.y]; };

// ═══ câmera: planos (tempo, folha, x, y, zoom) ═══
const SHOTS = [
	[0, 'DESK', 0, 300, 1], [2.4, 'DESK', 0, 330, 1.08], [3.0, 'DESK', 0, 360, 1.2], [4.6, 'DESK', 195, 330, 2.0],
	[5.95, 'STAGE', 0, 150, 1], [7.4, 'STAGE', -40, 230, 1.18], [8.95, 'STAGE', 60, 260, 1.1], [10.4, 'STAGE', 150, 390, 1.45],
	[11.9, 'BOARD', 0, 0, 1], [13.4, 'BOARD', -40, 60, 1.06],
	[14.9, 'S1', 0, 150, 1], [16.3, 'S1', -20, 330, 1.35], [17.9, 'S2', 0, 150, 1], [19.2, 'S2', 40, 250, 1.12],
	[20.85, 'S3', 0, 150, 1], [22.3, 'S3', 0, 300, 1.3], [23.85, 'S4', 0, 150, 1], [25.3, 'S4', 60, 250, 1.12],
	[26.85, 'S5', 0, 150, 1], [28.3, 'S5', 80, 300, 1.2],
	[29.8, 'BOARD', 0, 0, 1], [31.8, 'BOARD', -40, 40, 1.05], [33.8, 'BOARD', -10, 560, 1.5], [35.7, 'BOARD', -10, 580, 1.65],
	[37.7, 'DESK', 0, 360, 1.2], [39.0, 'DESK', 120, 345, 1.5], [40.4, 'DESK', 100, 350, 1.4],
	[41.7, 'BAR', 0, 380, 1], [44.6, 'BAR', 0, 400, 1.12],
	[47.7, 'BOARD', -40, 560, 1.35], [49.2, 'TRASH', 0, 450, 1], [51.4, 'TRASH', 0, 400, 1.3],
	[53.6, 'BOARD', 0, 0, 1], [55.4, 'BOARD', -60, 90, 1.12],
	[56.6, 'DESK', 195, 330, 2.0], [58.3, 'DESK', 195, 345, 2.25],
	[59.5, 'BOARD', -20, 560, 1.4], [62.0, 'BOARD', -20, 590, 1.5], [63.6, 'BOARD', 0, 200, 1.1],
	[65.5, 'DESK', 0, 360, 1.2], [66.8, 'DESK', 0, 370, 1.3],
	[68.5, 'FIST', 0, 320, 1], [70.0, 'FIST', -40, 360, 1.15],
	[71.5, 'S2', 0, 150, 1], [73.0, 'S2', 0, 200, 1.08],
	[74.45, 'DESK', 0, 360, 1.2], [76.0, 'DESK', 100, 360, 1.35],
	[77.4, 'FIST', 0, 320, 1], [79.4, 'FIST', 0, 360, 1.15], [80.9, 'FIST', 80, 430, 1.3], [82.4, 'FIST', 0, 350, 1],
	[84.5, 'DEEP', 0, 250, 1], [85.6, 'DEEP', 0, 220, 1.1],
	[86.4, 'DESK', 0, 360, 1.2], [87.9, 'DESK', 195, 330, 1.8],
	[89.3, 'DEEP', 0, 220, 1], [90.8, 'DEEP', -40, 160, 1.12], [92.3, 'DEEP', 0, 80, 1.05], [93.8, 'DEEP', 0, 30, 1.18],
	[95.3, 'SCALE', 0, 300, 1], [96.8, 'SCALE', 0, 330, 1.12], [98.3, 'SCALE', 0, 380, 1], [99.8, 'SCALE', 0, 400, 1.1],
	[101.2, 'DESK', 0, 360, 1.2], [102.8, 'DESK', 0, 350, 1.1], [104.3, 'DESK', 0, 330, 1.05], [106.6, 'DESK', 0, 300, 1],
];
const lead = i => i > 0 && SHOTS[i][1] !== SHOTS[i - 1][1] ? .18 : .05;
function shotPose(i, T) {
	const s = SHOTS[i], nx = SHOTS[i + 1]?.[0] ?? DUR, k = seg(T, s[0], nx), o = ORIG[s[1]];
	return { x: o.x + s[2] + Math.sin(T * .37 + i) * 7, y: o.y + s[3] + Math.cos(T * .29 + i * 1.3) * 6, z: s[4] * (1 + .035 * k) };
}
export function camPose(T) {
	let i = 0; for (let j = 0; j < SHOTS.length; j++) if (SHOTS[j][0] - lead(j) <= T) i = j;
	const c = shotPose(i, T); if (i === 0) return { ...c, whip: false };
	const diff = SHOTS[i][1] !== SHOTS[i - 1][1], a = SHOTS[i][0] - lead(i), d = diff ? .42 : .8;
	const k = seg(T, a, a + d); if (k >= 1) return { ...c, whip: false };
	const p = shotPose(i - 1, T), e = diff ? ease.expoInOut(k) : ease.cubicInOut(k);
	return { x: lerp(p.x, c.x, e), y: lerp(p.y, c.y, e), z: Math.exp(lerp(Math.log(p.z), Math.log(c.z), e)), whip: diff };
}

// ═══ mundo ═══
function ambient(g, color, seed, n = 16) {
	const r = mulberry32(seed), list = [];
	for (let i = 0; i < n; i++) {
		const kind = i % 3, m = kind === 0 ? circle(6 + r() * 8, color, .5) : kind === 1 ? ring(10, 16, color, .45) : (() => { const q = new THREE.Group(); q.add(rrect(28, 7, 3.5, color, .45), at(rrect(7, 28, 3.5, color, .45))); return q; })();
		m.position.set((r() - .5) * 1500, (r() - .5) * 2500, 0); g.add(m); list.push({ m, x: m.position.x, y: m.position.y, p: r() * 6, s: .3 + r() * .5 });
	}
	return T => list.forEach(a => { a.m.position.y = a.y + Math.sin(T * a.s + a.p) * 24; a.m.position.x = a.x + Math.cos(T * a.s * .7 + a.p) * 14; a.m.rotation.z = T * a.s * .5 + a.p; });
}
const sheet = (g, key) => { g.add(rrect(CW + 2, CH + 2, 0, BG[key])); };
const shade = (hex, k) => '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();

function client(o = {}) { return person({ skin: P.pele2, shirt: P.rosa, hair: P.cabelo, hairStyle: 'long', legs: false, ...o }); }
function therapist(o = {}) { return person({ skin: P.pele1, shirt: P.amarelo, hair: P.tinta, hairStyle: 'short', legs: false, ...o }); }
function shadowText(lines, w, h, color, o = {}) { const g = new THREE.Group(); at(textPlane(lines, w, h, { ...o, color: P.tinta }), 10, -10, g); g.add(textPlane(lines, w, h, { ...o, color })); return g; }
function check(size = 36, bg = P.menta) { const g = new THREE.Group(); g.add(circle(size, bg)); const s = stroke([[-size * .4, 0], [-size * .1, -size * .32], [size * .42, size * .34]], P.tinta, size * .2); g.add(s); g.userData.s = s; return g; }
function cloth(w = 200, h = 120) {
	const g = new THREE.Group(); g.add(rrect(w, h, 18, P.azul));
	for (let i = 0; i < 5; i++) at(circle(w / 10, P.azul), -w / 2 + w / 10 + i * w / 5, -h / 2, g);
	at(rrect(w * .9, 14, 7, shade(P.azul, .78)), 0, h * .12, g); at(rrect(w * .7, 10, 5, shade(P.azul, .78)), 0, -h * .14, g);
	return g;
}
function drips(n, color = '#A9C1FF') { const g = new THREE.Group(), l = []; for (let i = 0; i < n; i++) { const d = circle(11, color); g.add(d); l.push(d); } g.userData.l = l; return g; }
function dripAt(g, lt, x0, w, y0, fall = 380, rate = 1.4) { g.userData.l.forEach((d, i) => { const ph = ((lt * rate + i / g.userData.l.length) % 1 + 1) % 1; d.position.set(x0 - w / 2 + (i * 0.618 % 1) * w, y0 - ph * ph * fall, 0); d.scale.set(1 - ph * .4, 1 + ph * .5, 1); setOpacity(d, lt > 0 ? 1 - ph : 0); }); }
function bin(scale = 1) {
	const g = new THREE.Group();
	g.add(poly([[-190, 400], [190, 400], [150, 0], [-150, 0]], P.noite2));
	for (const x of [-90, 0, 90]) at(rrect(20, 300, 10, '#3A4C85'), x, 200, g);
	at(rrect(420, 44, 22, '#3A4C85'), 0, 410, g);
	g.scale.setScalar(scale); return g;
}

// ── 1 · mesa com notebook / videochamada (herói) ──
function buildDesk(g) {
	const amb = ambient(g, '#3A4C85', 51);
	// parede: janela com lua, quadro
	const win1 = at(card(380, 300, 30, '#2C3D73', { off: 12 }), -250, 950, g);
	at(circle(48, P.creme), -300, 990, g); at(circle(40, '#2C3D73'), -280, 1005, g);
	const stars = []; for (let i = 0; i < 6; i++) stars.push(at(circle(5, P.creme), -380 + i * 48, 900 + (i * 37 % 60), g));
	at(card(200, 250, 18, P.rosa, { off: 12 }), 270, 960, g); at(rrect(130, 170, 12, P.amarelo), 270, 960, g); at(circle(40, P.menta), 270, 980, g);
	// mesa
	at(rrect(CW, 1400, 0, '#2B3A67'), 0, -660, g); at(rrect(CW, 26, 0, '#3A4C85'), 0, 40, g);
	// planta e caneca
	at(poly([[-470, 40], [-370, 40], [-385, 160], [-455, 160]], P.laranja), -110, 0, g);
	const leaves = []; for (let i = 0; i < 5; i++) { const l = at(rrect(40, 120, 20, P.menta), -530 + (i - 2) * 26, 220 + (i % 2) * 20, g); l.rotation.z = (i - 2) * .32; leaves.push(l); }
	at(rrect(90, 110, 20, P.amarelo), 560, 110, g); at(ring(26, 38, P.amarelo, 1, -Math.PI / 2, Math.PI), 605, 112, g);
	const steam = []; for (let i = 0; i < 3; i++) steam.push(at(circle(12, P.cinza, .5), 550 + i * 14, 190, g));
	// notebook
	at(rrect(990, 48, 24, '#C9CFE6'), 0, 62, g); at(rrect(220, 12, 6, '#9AA3C4'), 0, 46, g);
	const lid = at(new THREE.Group(), 0, 80, g);
	at(rrect(860, 580, 32, P.tinta), 0, 290, lid);
	at(rrect(812, 532, 18, P.tela), 0, 290, lid);
	const sc = at(new THREE.Group(), 0, 290, lid);
	at(rrect(812, 56, 18, '#1A2547'), 0, 238, sc);
	[P.rosa, P.amarelo, P.menta].forEach((c, i) => at(circle(8, c), -372 + i * 24, 238, sc));
	at(textPlane(['SESSÃO DE HIPNOSE · ONLINE'], 380, 30, { family: 'JetBrains Mono', weight: 700, color: P.cinza, pad: .02 }), -90, 238, sc);
	const timer = at(textPlane(['00:00'], 96, 30, { family: 'JetBrains Mono', weight: 700, color: P.cinza, pad: .02 }), 185, 238, sc);
	const live = at(new THREE.Group(), 322, 238, sc); live.add(rrect(132, 34, 17, P.rosa)); at(circle(6, P.branco), -46, 0, live); at(textPlane(['AO VIVO'], 82, 24, { family: 'JetBrains Mono', weight: 800, color: P.branco, pad: .02 }), 10, 0, live);
	const tiles = [-197, 197].map((x, i) => { const t = at(new THREE.Group(), x, 12, sc); t.add(rrect(374, 336, 20, i ? P.tile2 : P.tile1)); return t; });
	const calling = tiles.map(t => { const c = new THREE.Group(); t.add(c); const r = at(ring(70, 80, P.cinza, .6), 0, 10, c); c.add(at(circle(66, '#3A4C85'), 0, 10)); at(circle(28, P.cinza), 0, 26, c); at(rrect(80, 40, 20, P.cinza), 0, -22, c); return { c, r }; });
	const ther = at(therapist(), 0, -197, tiles[0]); ther.scale.setScalar(.5);
	const cli = at(client(), 0, -197, tiles[1]); cli.scale.setScalar(.5);
	at(rrect(812, 110, 8, P.tela), 0, -211, sc);
	[[-80, '#2F3F73'], [0, '#2F3F73'], [80, P.vermelho]].forEach(([x, c]) => at(circle(27, c), x, -212, sc));
	at(rrect(14, 26, 7, P.creme), -80, -210, sc); at(rrect(26, 18, 5, P.creme), -4, -212, sc); at(poly([[8, -212], [20, -202], [20, -222]], P.creme), 0, 0, sc);
	at(rrect(30, 11, 5.5, P.creme), 80, -212, sc).rotation.z = -.4;
	const pills = tiles.map((t, i) => { const p = at(new THREE.Group(), -118, -132, t); p.add(rrect(118, 34, 17, P.tinta, .75)); at(textPlane([i ? 'CLIENTE' : 'VOCÊ'], 100, 24, { family: 'JetBrains Mono', weight: 800, color: P.creme, pad: .02 }), 0, 0, p); return p; });
	// selo HIPNOTIZADO
	const seal = at(new THREE.Group(), 0, 110, tiles[1]); seal.add(card(300, 84, 16, P.menta, { off: 8 })); at(textPlane(['HIPNOTIZADO'], 270, 56, { color: P.tinta, pad: .04 }), 0, 0, seal); seal.rotation.z = -.14;
	// balão "feche a mão"
	const bub = at(new THREE.Group(), -160, 120, sc); bub.add(poly([[60, -50], [130, -100], [110, -40]], P.creme)); bub.add(card(330, 130, 30, P.creme, { off: 10 }));
	at(textPlane(['FECHE A MÃO', 'E APERTE!'], 300, 110, { color: P.tinta, pad: .06 }), 0, 0, bub);
	// ícone de repetir
	const loop = at(new THREE.Group(), 0, 110, tiles[1]); loop.add(circle(58, P.tinta, .6)); loop.add(stroke(arc(0, 0, 38, .3, Math.PI * 1.75, 30), P.amarelo, 10, { dashed: false }));
	at(poly([[0, 0], [-22, 16], [-22, -16]], P.amarelo), Math.cos(.3) * 38 + 4, Math.sin(.3) * 38 - 10, loop).rotation.z = -1.4;
	// cartões finais
	const fin = [0, 1].map(i => {
		const c = at(new THREE.Group(), i ? 197 : -197, 12, sc);
		c.add(card(352, 316, 24, i ? P.amarelo : P.rosa, { off: 10 }));
		if (i === 0) { const h = at(hand({ skin: P.pele2, sleeve: P.rosa }), 0, 60, c); h.scale.setScalar(.38); h.userData.curl(1); h.userData.sleeve.visible = false; }
		else at(bin(.32), 0, 2, c);
		at(textPlane([i ? 'ELIMINE' : 'SUBSTITUA'], 300, 62, { color: i ? P.tinta : P.creme, pad: .02 }), 0, -78, c);
		at(textPlane([i ? 'O BRAÇO PESADO' : 'POR MÃO FECHADA'], 300, 34, { family: 'JetBrains Mono', weight: 800, color: i ? P.tinta : P.creme, pad: .12 }), 0, -125, c);
		return c;
	});
	// vidro rachando + mão em primeira pessoa
	const crack = at(new THREE.Group(), 232, -40, sc);
	const cr = mulberry32(77); const cracks = [];
	for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + cr() * .4, L = 60 + cr() * 80, pts = [[0, 0]]; for (let j = 1; j <= 4; j++) { const r = L * j / 4, aa = a + (cr() - .5) * .5; pts.push([Math.cos(aa) * r, Math.sin(aa) * r]); } const s = stroke(pts, P.branco, 4, { opacity: .85 }); crack.add(s); cracks.push(s); }
	const bigHand = hand({ skin: P.pele1, sleeve: P.amarelo }); g.add(bigHand); bigHand.scale.setScalar(1.25);
	const toc = at(shadowText(['TOC!'], 240, 120, P.amarelo), 20, 560, g); toc.rotation.z = .12;
	const bang = at(shadowText(['!'], 90, 130, P.amarelo), 330, 170, sc);
	const rng = mulberry32(5);

	return T => {
		amb(T);
		stars.forEach((s, i) => s.scale.setScalar(.7 + .4 * Math.abs(Math.sin(T * 1.3 + i))));
		leaves.forEach((l, i) => l.rotation.z = (i - 2) * .32 + Math.sin(T * 1.6 + i) * .04);
		steam.forEach((s, i) => { const ph = (T * .5 + i / 3) % 1; s.position.set(550 + i * 14 + Math.sin(T * 2 + i) * 10, 180 + ph * 120, 0); setOpacity(s, .5 * Math.sin(ph * Math.PI)); });
		const open = eo(seg(T, .05, .85)) * (1 - ease.expoIn(seg(T, 106.8, 107.5)));
		lid.scale.y = Math.max(.02, open); sc.visible = open > .15;
		// conexão
		const con = seg(T, 3.05, 3.4);
		calling.forEach((c, i) => { setOpacity(c.c, 1 - con); const ph = (T * 1.4 + i * .5) % 1; c.r.scale.setScalar(1 + ph * .6); setOpacity(c.r, (1 - ph) * .7 * (1 - con)); });
		live.scale.setScalar(pop(T, 3.2)); live.children[1].visible = Math.floor(T * 2) % 2 === 0;
		const secs = Math.max(0, Math.floor((T - 3.2) * 1.0) + 12 * 60 * 0); timer.userData.set([`${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`]);
		ther.visible = cli.visible = T > 3.1;
		ther.scale.setScalar(.5 * pop(T, 3.15)); cli.scale.setScalar(.5 * pop(T, 3.25));
		// layout "sozinho"
		const solo = sm(T, 65.45, 66.0) * (1 - sm(T, 67.95, 68.4));
		tiles[1].position.set(lerp(197, 0, solo), 12, 0); tiles[1].scale.setScalar(1 + .2 * solo);
		tiles[0].position.set(lerp(-197, 300, solo), lerp(12, 150, solo), 0); tiles[0].scale.setScalar(1 - .58 * solo);
		pills[0].visible = solo < .5;
		// poses
		const talking = (T > 3.4 && T < 5.9) || (T > 37.7 && T < 41.6) || (T > 74.45 && T < 77.4) || (T > 86.4 && T < 89.3) || (T > 101.2 && T < 104.2);
		const tw = win(T, 3.35, 4.9, .3, .3), handsUp = solo;
		ther.userData.pose({ blink: blinkAt(T, 1), talk: talking ? T : 0, smile: .6, brow: .2 * tw,
			arm: [[.08 + 2.5 * handsUp, -.2 - .5 * handsUp], [.08 + (2.5 + .25 * Math.sin(T * 9)) * Math.max(tw, handsUp), -.1 - .4 * Math.max(tw, handsUp)]] });
		const cw = win(T, 3.6, 5.9, .3, .3);
		const hyp = win(T, 56.7, 59.6, .4, .2);
		const bonk = T > 37.7 && T < 41.7, shock = bonk ? win(T, 38.95, 40.8, .05, .3) : 0;
		const fist = Math.max(win(T, 65.9, 68.0, .3, .3), win(T, 75.5, 77.4, .3, .2), win(T, 86.6, 89.3, .3, .2));
		const cyc = T > 86.6 && T < 89.3 ? .5 + .5 * Math.sin((T - 86.6) * 5) : 0;
		cli.userData.pose({ blink: blinkAt(T, 3), lids: hyp, smile: hyp > .5 ? .8 : .4, tilt: .12 * hyp, brow: shock * 1.1 + fist * .4, shock,
			arm: [[.08, -.1], [Math.max(.08 + 2.55 * cw + .2 * cw * Math.sin(T * 8), .6 * (bonk ? 1 : 0), 2.4 * fist), -.1 - .3 * cw - (bonk ? .3 : 0) - .9 * fist]] });
		cli.userData.parts.arms[1].hnd.scale.setScalar(1 - .2 * fist * (cyc > .5 ? 1 : .5) + .05 * Math.sin(T * 40) * fist);
		seal.scale.setScalar(pop(T, 57.9) * (1 - seg(T, 59.5, 59.6)));
		bub.scale.setScalar(pop(T, 74.7) * (1 - seg(T, 77.3, 77.45)));
		loop.scale.setScalar(pop(T, 86.6) * (1 - seg(T, 89.2, 89.35))); loop.rotation.z = -T * 3;
		fin.forEach((c, i) => { const k = pop(T, i ? 102.1 : 101.35, .4); c.scale.setScalar(k); c.rotation.z = (1 - k) * (i ? .3 : -.3); c.visible = T > 100 && k > .01; });
		// mão bate no vidro
		const up = ease.expoIn(seg(T, 38.1, 38.95)), back = eo(seg(T, 39.0, 39.5));
		const hit = T > 38.95 && T < 39.12 ? 1 : 0, ouch = win(T, 39.0, 41.0, .1, .6);
		bigHand.visible = T > 37.9 && T < 41.8;
		bigHand.position.set(lerp(380, 232, up) + Math.sin(T * 50) * 6 * ouch, lerp(-1000, 50, up) - 160 * back * (1 - seg(T, 40.6, 41.6) * 0) - 700 * ease.expoIn(seg(T, 40.9, 41.6)), 0);
		bigHand.rotation.z = -.12 + Math.sin(T * 32) * .06 * ouch;
		bigHand.scale.set(1.25 * (1 + .08 * hit), 1.25 * (1 - .1 * hit), 1);
		cracks.forEach((s, i) => s.userData.draw(T > 30 && T < 45 ? eo(seg(T, 38.95 + i * .015, 39.15 + i * .015)) : 0));
		crack.visible = T > 38.9 && T < 41.7;
		toc.scale.setScalar(pop(T, 38.97, .25) * (1 - seg(T, 40.2, 40.35))); toc.visible = T > 38.9 && T < 40.4;
		bang.scale.setScalar(pop(T, 39.1, .3) * (1 - seg(T, 40.6, 40.75))); bang.position.y = 170 + Math.abs(Math.sin(T * 7)) * 14;
	};
}

// ── 2 · palco do Dave Elman ──
function buildStage(g) {
	const amb = ambient(g, '#34467A', 52);
	at(rrect(CW, 1000, 0, '#1A2448'), 0, -560, g);
	const curt = [];
	for (let s of [-1, 1]) for (let i = 0; i < 4; i++) curt.push(at(rrect(110, 2000, 50, i % 2 ? '#B8323C' : '#9E2A33'), s * (820 - i * 85), 300, g));
	at(rrect(CW, 170, 0, '#9E2A33'), 0, 1110, g); for (let i = 0; i < 16; i++) at(circle(55, '#9E2A33'), -800 + i * 106, 1025, g);
	const cone = poly([[-50, 1150], [50, 1150], [400, -150], [-400, -150]], P.amarelo, .12); g.add(cone);
	const spot = at(circle(330, P.amarelo, .2), 0, -200, g); spot.scale.y = .2;
	const el = person({ skin: P.pele1, shirt: P.terno, hair: P.grisalho, hairStyle: 'slick', glasses: true, tie: P.vermelho, pants: P.terno });
	g.add(el);
	const wr = at(new THREE.Group(), 0, -110, el.userData.parts.arms[1].el);
	at(rrect(26, 150, 13, P.cinza), 0, -80, wr); at(ring(20, 44, P.cinza, 1, Math.PI * .65, Math.PI * 1.7), 0, -170, wr);
	const nc = at(new THREE.Group(), 40, 830, g);
	nc.add(card(650, 170, 26, P.creme, { off: 12 })); at(rrect(16, 120, 8, P.rosa), -300, 0, nc);
	at(textPlane(['DAVE ELMAN'], 560, 84, { color: P.tinta, pad: .02 }), 15, 26, nc);
	at(textPlane(['HIPNOTIZADOR · EUA · 1900–1967'], 560, 40, { family: 'JetBrains Mono', weight: 800, color: P.rosa, pad: .02 }), 15, -46, nc);
	const wf = at(wifi(230, '#3A4C85'), 200, 520, g);
	const onl = at(new THREE.Group(), 200, 380, g); onl.add(card(210, 64, 32, P.menta, { off: 7 })); at(textPlane(['ONLINE'], 170, 44, { color: P.tinta, pad: .02 }), 0, 0, onl);
	const sparks = at(bits(14, [P.amarelo, P.menta, P.creme], mulberry32(9), { w: 14, h: 24 }), 200, 600, g);
	const lit = new THREE.Color(P.amarelo), off = new THREE.Color('#3A4C85');
	return T => {
		amb(T);
		curt.forEach((c, i) => c.scale.x = 1 + Math.sin(T * 1.1 + i) * .03);
		const x = lerp(-900, -100, eo(seg(T, 5.95, 6.7))) - 70 * sm(T, 8.95, 9.4);
		const walk = seg(T, 5.95, 6.7) < 1 ? Math.abs(Math.sin(T * 14)) * 18 : 0;
		el.position.set(x, -40 + walk, 0);
		cone.position.x = x + 100; spot.position.x = x;
		const wave = win(T, 6.6, 8.6, .3, .3), fix = win(T, 9.05, 11.9, .3, .1);
		el.userData.pose({ blink: blinkAt(T, 2), smile: .8, brow: .3 * wave, look: [fix * .8, fix * .6],
			arm: [[.1 + 2.6 * wave + .25 * wave * Math.sin(T * 9), -.2 - .4 * wave], [.1 + 2.45 * fix, -.05 - fix * (.15 + .3 * Math.sin(T * 10))]] });
		wr.visible = fix > .05; wr.scale.setScalar(pop(T, 9.05, .3));
		nc.position.x = lerp(900, 40, eo(seg(T, 6.5, 7.0))); nc.rotation.z = (1 - eo(seg(T, 6.5, 7.2))) * .2 - .02;
		wf.scale.setScalar(pop(T, 9.0, .35));
		wf.userData.parts.forEach((m, i) => m.material.color.copy(off).lerp(lit, seg(T, 9.7 + i * .5, 9.9 + i * .5)));
		onl.scale.setScalar(pop(T, 11.3, .35));
		burst(sparks, T - 11.3); sparks.visible = T > 11.3 && T < 12.5;
	};
}

// ── 3 · mural com os 5 cartões ──
const STEPS = [['OLHOS COLADOS', P.menta], ['BRAÇO PESADO', P.laranja], ['RESPIRAÇÃO', P.azul], ['FRACIONAMENTO', P.amarelo], ['AMNÉSIA DOS NÚMEROS', P.noite2]];
const CY = [820, 610, 400, 190, -20], CX = -40;
function stepCard(n, label, col, w = 640) {
	const g = new THREE.Group(); g.add(card(w, 170, 30, P.branco, { off: 12 }));
	at(circle(54, col), -w / 2 + 75, 0, g); at(textPlane([String(n)], 70, 84, { color: col === P.amarelo ? P.tinta : P.creme, pad: .02 }), -w / 2 + 75, 0, g);
	at(textPlane([label], 380, 76, { color: P.tinta, align: 'left', pad: .03 }), 45, 0, g);
	const ck = at(check(34), 272, 0, g); g.userData.ck = ck;
	return g;
}
function buildBoard(g) {
	const amb = ambient(g, '#E9D9BE', 53);
	at(textPlane(['INDUÇÃO DE DAVE ELMAN · ONLINE'], 640, 40, { family: 'JetBrains Mono', weight: 800, color: '#B9A98E', pad: .02 }), CX, 935, g);
	const slot = at(rrect(650, 180, 32, '#E2D2B6'), CX, CY[1], g);
	const cards = STEPS.map(([l, c], i) => at(stepCard(i + 1, l, c), CX, CY[i], g));
	const dim = rrect(CW, CH, 0, P.tinta, .6); g.add(dim);
	cards[1].traverse(o => { if (o.renderOrder) o.userData.ro0 = o.renderOrder; });
	const touch = at(new THREE.Group(), 250, 100, cards[1]); touch.add(circle(56, P.vermelho)); const th = at(hand({ skin: P.creme, sleeve: P.vermelho, cuff: P.vermelho }), 0, -4, touch); th.scale.setScalar(.2);
	touch.traverse(o => { if (o.renderOrder) o.userData.ro0 = o.renderOrder; });
	const ball = at(new THREE.Group(), CX, CY[1], g); ball.add(circle(70, P.branco)); const br = mulberry32(4); for (let i = 0; i < 5; i++) { const a = br() * 6.28; ball.add(stroke([[Math.cos(a) * 50, Math.sin(a) * 50], [Math.cos(a + 1) * 15, Math.sin(a + 1) * 15], [Math.cos(a + 2.2) * 45, Math.sin(a + 2.2) * 45]], '#C9C2B2', 6, { dashed: false })); }
	const arrows = [[0, 2], [2, 3], [3, 4]].map(([a, b], i) => { const y0 = CY[a], y1 = CY[b], xl = CX - 330; const ar = arrow(quad([xl, y0 - 20], [xl - (i ? 110 : 190), (y0 + y1) / 2], [xl + 6, y1 + 20]), P.rosa, 13); g.add(ar); return ar; });
	const nc = at(stepCard(2, 'MÃO FECHADA', P.rosa), CX, CY[1], g);
		const ncSpark = at(bits(12, [P.rosa, P.amarelo, P.menta], mulberry32(12), { w: 14, h: 22 }), CX, CY[1], g);
	return T => {
		amb(T);
		cards.forEach((c, i) => {
			const k = bo(seg(T, 12.0 + i * .38, 12.45 + i * .38));
			c.position.set(CX, CY[i], 0); c.scale.setScalar(Math.max(.001, k)); c.rotation.z = (1 - k) * (i % 2 ? .3 : -.3) + Math.sin(T * 1.3 + i) * .006;
			c.userData.ck.scale.setScalar(pop(T, 30.15 + i * .55, .3)); c.userData.ck.userData.s.userData.draw(seg(T, 30.25 + i * .55, 30.45 + i * .55));
			if (i === 4) { const p = T > 55.6 && T < 56.7 ? 1 + .06 * Math.sin((T - 55.6) * 14) : 1; c.scale.setScalar(p * Math.max(.001, k)); }
		});
		// destaque do cartão 2 (só ele encosta no cliente)
		const hi = win(T, 33.85, 37.75, .3, .15);
		setOpacity(dim, hi); const on = hi > .01;
		[cards[1], touch].forEach(o => o.traverse(m => { if (m.userData.ro0) m.renderOrder = m.userData.ro0 + (on ? 100000 : 0); }));
		cards[1].scale.setScalar((1 + .1 * hi * (T < 40 ? 1 : 0)) * Math.max(.001, bo(seg(T, 12.38, 12.83))));
		touch.scale.setScalar(pop(T, 34.4, .35) * (T < 48.2 ? 1 : 0)); touch.rotation.z = Math.sin(T * 6) * .12;
		// amassa e voa
		const shake = T > 47.9 && T < 48.25 ? Math.sin(T * 70) * .06 : 0, cr = eo(seg(T, 48.2, 48.45));
		cards[1].rotation.z += shake + cr * 2.5; if (T > 47.9) cards[1].scale.set(1 - .75 * cr, 1 - .6 * cr, 1);
		cards[1].visible = T < 48.45;
		const fl = seg(T, 48.55, 49.25), flying = T >= 48.4 && T < 49.3;
		ball.visible = flying; ball.position.set(CX + fl * 1100, CY[1] + 260 * Math.sin(fl * Math.PI) + fl * 200, 0); ball.rotation.z = -fl * 8; ball.scale.setScalar(.6 + .4 * eo(seg(T, 48.4, 48.55)));
		slot.visible = T > 48.3;
		arrows.forEach((a, i) => { a.userData.draw(T > 53 && T < 59 ? eo(seg(T, 53.9 + i * .6, 54.4 + i * .6)) : 0); a.visible = T > 53.8 && T < 59; });
		// cartão novo gira
		const f = seg(T, 61.85, 62.3); nc.visible = T > 61.85; nc.scale.set(Math.max(.01, Math.abs(Math.sin(f * Math.PI / 2 + (1 - f) * Math.PI * 1.5)) * bo(f)), bo(f) * .2 + .8, 1);
		burst(ncSpark, T - 62.2); ncSpark.visible = T > 62.2 && T < 63.6;
	};
}

// ── 4 · barra 100% online ──
function buildBar(g) {
	const amb = ambient(g, '#5FE3B6', 54);
	const pct = at(textPlane(['0%'], 600, 300, { color: P.tinta, pad: .02 }), 0, 720, g);
	at(textPlane(['ONLINE'], 400, 66, { family: 'JetBrains Mono', weight: 800, color: P.tinta, pad: .02 }), 0, 535, g);
	at(card(800, 150, 75, P.tinta, { shadow: '#1E9C74', off: 12 }), 0, 330, g);
	const segs = [0, 1, 2, 3, 4].map(i => {
		const s = at(new THREE.Group(), -312 + i * 156, 330, g); s.add(rrect(146, 116, 50, i === 1 ? P.vermelho : P.amarelo));
		if (i === 1) { const h = at(hand({ skin: P.creme, sleeve: P.vermelho, cuff: P.vermelho }), 0, -10, s); h.scale.setScalar(.2); }
		else at(wifi(70, P.tinta), 0, -26, s);
		return s;
	});
	const tag = at(new THREE.Group(), -156, 470, g); tag.add(poly([[-16, -36], [16, -36], [0, -58]], P.vermelho)); tag.add(card(240, 56, 28, P.vermelho, { off: 6 })); at(textPlane(['PRESENCIAL'], 200, 36, { family: 'JetBrains Mono', weight: 800, color: P.creme, pad: .02 }), 0, 0, tag);
	const conf = at(bits(30, [P.amarelo, P.rosa, P.azul, P.creme], mulberry32(31)), 0, 760, g);
	return T => {
		amb(T);
		let n = 0;
		segs.forEach((s, i) => { const t0 = 41.95 + i * .42; const k = pop(T, t0, .3); s.scale.setScalar(k); if (T > t0 + .1 && i !== 1) n++; });
		const red = segs[1], out = seg(T, 44.65, 45.6), close = sm(T, 44.75, 45.25);
		red.position.set(-156 + Math.sin(T * 50) * 8 * win(T, 43.9, 44.65, .1, .05) + out * 260, 330 + 300 * out - 1800 * out * out, 0); red.rotation.z = -out * 3;
		tag.position.copy(red.position).add(new THREE.Vector3(0, 140, 0)); tag.scale.setScalar(pop(T, 42.5, .3)); tag.rotation.z = red.rotation.z * .6;
		let j = 0; segs.forEach((s, i) => { if (i === 1) return; s.position.x = lerp(-312 + i * 156, -291 + j * 194, close); s.scale.x *= 1 + .3 * close; j++; });
		const v = T < 44.9 ? n * 20 : Math.round(lerp(80, 100, sm(T, 44.9, 45.3)));
		pct.userData.set([v + '%']); pct.scale.setScalar(1 + .15 * (1 - eo(seg(T, 45.3, 45.7))) * (T > 45.3 ? 1 : 0));
		burst(conf, T - 45.3); conf.visible = T > 45.3 && T < 47.8;
	};
}

// ── 5 · lixeira com cesta ──
function buildTrash(g) {
	const amb = ambient(g, '#FF86AC', 55);
	at(rrect(CW, 1200, 0, '#E24C7E'), 0, -560, g);
	at(card(360, 240, 16, P.creme, { off: 10 }), 0, 900, g); at(rrect(140, 104, 8, P.vermelho), 0, 840, g); at(rrect(116, 80, 6, P.creme), 0, 840, g);
	const ball = at(new THREE.Group(), 0, 0, g); ball.add(circle(52, P.branco)); const br = mulberry32(4); for (let i = 0; i < 4; i++) { const a = br() * 6.28; ball.add(stroke([[Math.cos(a) * 38, Math.sin(a) * 38], [Math.cos(a + 1) * 10, Math.sin(a + 1) * 10], [Math.cos(a + 2.2) * 34, Math.sin(a + 2.2) * 34]], '#C9C2B2', 5, { dashed: false })); }
	const rim = at(ring(74, 88, P.laranja), 0, 760, g); rim.scale.y = .3;
	const net = []; for (let i = 0; i < 5; i++) { const s = at(stroke([[0, 0], [(i - 2) * -8, -110]], P.creme, 5, { dashed: false }), -64 + i * 32, 750, g); net.push(s); }
	const bn = at(new THREE.Group(), 0, 40, g); bn.add(bin(1));
	const lab = at(new THREE.Group(), 0, 260, bn); lab.add(card(270, 92, 12, P.amarelo, { off: 6 })); at(textPlane(['BRAÇO PESADO'], 240, 50, { color: P.tinta, pad: .02 }), 0, 0, lab); lab.rotation.z = -.06;
	const x1 = at(stroke([[-120, -40], [120, 40]], P.vermelho, 16), 0, 0, lab), x2 = at(stroke([[-120, 40], [120, -40]], P.vermelho, 16), 0, 0, lab);
	const cesta = at(shadowText(['CESTA!'], 300, 120, P.amarelo), -250, 620, g); cesta.rotation.z = .14;
	return T => {
		amb(T);
		const k = seg(T, 49.25, 50.25), p0 = [-950, 950], p1 = [-320, 1250], p2 = [0, 770];
		let bx, by; if (T < 50.25) { const u = k, v = 1 - u; bx = v * v * p0[0] + 2 * u * v * p1[0] + u * u * p2[0]; by = v * v * p0[1] + 2 * u * v * p1[1] + u * u * p2[1]; } else { const d = ease.expoIn(seg(T, 50.25, 50.6)); bx = 0; by = lerp(770, 330, d); }
		ball.position.set(bx, by, 0); ball.rotation.z = -T * 7; ball.visible = T > 49.2 && T < 50.6;
		const sw = win(T, 50.2, 51.0, .05, .4);
		net.forEach((s, i) => { s.rotation.z = Math.sin(T * 20 + i) * .12 * sw + Math.sin(T * 1.5 + i) * .02; s.scale.y = 1 - .15 * sw; });
		const wob = T > 50.55 ? Math.exp(-(T - 50.55) * 4) * Math.sin((T - 50.55) * 22) * .08 : 0; bn.rotation.z = wob;
		cesta.scale.setScalar(pop(T, 50.65, .3) * (1 - seg(T, 52.6, 52.75))); cesta.position.y = 620 + Math.sin(T * 5) * 10;
		lab.scale.setScalar(pop(T, 51.0, .3));
		x1.userData.draw(eo(seg(T, 51.6, 51.85))); x2.userData.draw(eo(seg(T, 51.85, 52.1)));
	};
}

// ── 6..10 · os 5 passos, close na cliente ──
function stepBadge(g, n, col) { const b = at(new THREE.Group(), -330, 830, g); b.add(circle(84, P.tinta)); at(textPlane([String(n)], 110, 130, { color: col, pad: .02 }), 0, 0, b); return b; }
function buildStep(g, n) {
	const key = 'S' + n, amb = ambient(g, shade(BG[key], n === 5 ? 1.5 : .88), 60 + n);
	const badge = stepBadge(g, n, n === 5 ? P.amarelo : BG[key]);
	const cl = client(); g.add(cl); cl.scale.setScalar(1.5);
	const X = [0, -60, -170, 0, -110, -170][n]; cl.position.set(X, -150, 0);
	const T0 = [0, 14.9, 17.9, 20.85, 23.85, 26.85][n];
	let extra = () => {};
	if (n === 1) {
		const tube = at(new THREE.Group(), 0, 0, g);
		tube.add(poly([[0, 0], [-14, 46], [14, 46]], P.branco)); at(rrect(46, 40, 10, P.rosa), 0, 64, tube);
		const body = at(new THREE.Group(), 0, 190, tube); body.add(rrect(100, 210, 30, P.branco)); at(rrect(100, 60, 0, P.rosa), 0, 0, body); at(textPlane(['COLA'], 90, 40, { color: P.branco, pad: .04 }), 0, 0, body);
		const drop = circle(12, P.branco); g.add(drop);
		const blobs = [-1, 1].map(s => at(circle(9, P.branco), X + s * 60 + s * 8, 490, g));
		const lines = []; for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const a = Math.PI / 2 + s * (.5 + i * .5); const cx = X + s * 60, cy = 470; lines.push(stroke([[cx + Math.cos(a) * 52, cy + Math.sin(a) * 52], [cx + Math.cos(a) * 80, cy + Math.sin(a) * 80]], P.tinta, 8)); g.add(lines[lines.length - 1]); }
		extra = T => {
			const inK = eo(seg(T, 14.95, 15.4)), outK = ease.expoIn(seg(T, 17.0, 17.5));
			tube.position.set(lerp(600, 70, inK) + outK * 500, lerp(1100, 560, inK) + outK * 300, 0); tube.rotation.z = -.7;
			body.scale.x = 1 - .15 * win(T, 15.4, 15.75, .1, .15);
			const d = seg(T, 15.45, 15.65); drop.visible = d > 0 && d < 1; drop.position.set(lerp(70, X + 60, d), lerp(560, 490, d), 0);
			blobs.forEach(b => b.scale.setScalar(pop(T, 15.85, .25)));
			lines.forEach((l, i) => l.userData.draw(T < 17.8 ? eo(seg(T, 16.1 + i * .03, 16.35 + i * .03)) * (1 - seg(T, 17.4, 17.6)) : 0));
			const strain = win(T, 16.5, 17.8, .2, .2);
			cl.userData.pose({ blink: T < 15.5 ? blinkAt(T, 4) : 0, lids: eo(seg(T, 15.55, 15.85)), brow: strain * (.8 + .3 * Math.sin(T * 18)), smile: strain > .3 ? -.5 : .4, blushA: strain * .8, look: [0, .3] });
		};
	}
	if (n === 2) {
		const cl2 = cloth(220, 130); g.add(cl2);
		const dr = drips(5); g.add(dr);
		const thud = []; for (let i = 0; i < 3; i++) { const s = stroke([[0, 0], [30 + i * 10, 0]], P.tinta, 9); g.add(s); thud.push(s); }
		const xs = [stroke([[-420, 900], [380, -120]], P.vermelho, 42), stroke([[380, 900], [-420, -120]], P.vermelho, 42)]; xs.forEach(s => g.add(s));
		const q = at(shadowText(['?'], 120, 170, P.creme), 230, 780, g);
		extra = T => {
			const raise = bo(seg(T, 18.0, 18.4)), drop = ease.expoIn(seg(T, 19.5, 19.85)), bounce = T > 19.85 ? Math.exp(-(T - 19.85) * 7) * Math.sin((T - 19.85) * 26) * .15 : 0;
			const a0 = .1 + 1.45 * raise * (1 - drop) + bounce;
			cl.userData.pose({ blink: blinkAt(T, 5), look: [1, -.3 * drop], arm: [[.1, -.1], [a0, -.05]], shock: win(T, 19.85, 20.7, .05, .2), brow: .6 * win(T, 19.8, 20.7, .05, .2) });
			g.updateMatrixWorld(true);
			const [px, py] = toLocal(cl.userData.parts.arms[1].el, g, 0, -70);
			const c = eo(seg(T, 18.5, 18.75));
			cl2.position.set(px, lerp(py + 400, py - 40, c), 0); cl2.rotation.z = (1 - c) * .4 + Math.sin(T * 3) * .02; cl2.visible = T > 18.45;
			cl2.scale.y = 1 + .15 * win(T, 19.85, 20.1, .03, .2);
			dripAt(dr, T > 18.8 ? T - 18.8 : -1, px, 160, py - 110, 420, 1.3);
			thud.forEach((s, i) => { s.position.set(px - 140 + i * 30, py - 140 - i * 22, 0); s.rotation.z = -2.4 + i * .3; s.userData.draw(win(T, 19.85, 20.5, .08, .2)); });
			xs.forEach((s, i) => s.userData.draw(T > 71 ? eo(seg(T, 71.8 + i * .3, 72.15 + i * .3)) : 0));
			q.scale.setScalar(pop(T, 72.6, .3) * (T < 74.5 ? 1 : 0));
		};
	}
	if (n === 3) {
		const puffs = [0, 1].map(() => { const p = new THREE.Group(); [[0, 0, 26], [30, 12, 20], [-26, 14, 18]].forEach(([x, y, r]) => at(circle(r, P.creme, .85), x, y, p)); g.add(p); return p; });
		const lab = ['INSPIRA', 'SOLTA'].map(t => { const p = at(new THREE.Group(), 250, 820, g); p.add(card(220, 70, 35, P.creme, { off: 7 })); at(textPlane([t], 180, 44, { family: 'JetBrains Mono', weight: 800, color: P.tinta, pad: .02 }), 0, 0, p); return p; });
		extra = T => {
			const ph = (T - 20.85) * Math.PI * 2 / 1.5, b = Math.sin(ph), db = Math.cos(ph);
			cl.userData.parts.torso.scale.set(1 + .06 * b, 1 + .04 * b, 1);
			cl.userData.pose({ lids: 1, smile: .7, bob: 8 * b, tilt: .03 * b, arm: [[.1 + .04 * b, -.1], [.1 + .04 * b, -.1]] });
			[21.75, 23.25].forEach((t0, i) => { const k = seg(T, t0, t0 + 1.3), p = puffs[i]; p.visible = k > 0 && k < 1; p.position.set(X - 60 - k * 340, 380 + k * 160, 0); p.scale.setScalar(.4 + k * 1.1); setOpacity(p, Math.sin(Math.min(1, k * 1.4) * Math.PI) * .9 + .001); });
			lab[0].scale.setScalar(db > 0 ? 1 : 0); lab[1].scale.setScalar(db > 0 ? 0 : 1);
			lab.forEach(l => l.position.y = 820 + Math.sin(T * 3) * 6);
		};
	}
	if (n === 4) {
		const m = at(new THREE.Group(), 280, 0, g);
		at(textPlane(['PROFUNDIDADE'], 220, 40, { family: 'JetBrains Mono', weight: 800, color: P.tinta, pad: .02 }), 0, 800, m);
		m.add(at(card(84, 640, 42, P.tinta, { off: 8 }), 0, 430));
		const L = [690, 520, 350, 180]; L.forEach((y, i) => at(rrect(44, 10, 5, i ? P.amarelo : P.creme), 0, y, m));
		const mk = at(new THREE.Group(), -78, 690, m); mk.add(poly([[30, 0], [-12, 26], [-12, -26]], P.rosa));
		const fl = at(ring(20, 30, P.rosa), -60, 690, m);
		const CL = [24.2, 25.0, 25.8, 26.4];
		extra = T => {
			let lids = 0, lvl = 0;
			CL.forEach((t, i) => { const c = ease.expoIn(seg(T, t, t + .16)), o = i < 3 ? eo(seg(T, t + .4, t + .58)) : 0; lids = Math.max(lids, c * (1 - o)); lvl += eo(seg(T, t + .05, t + .35)) * (i < 3 ? 1 : 0); });
			cl.userData.pose({ blink: T < 24.1 ? blinkAt(T, 6) : 0, lids, smile: .5, look: [.4, 0] });
			mk.position.y = 690 - lvl * 170; fl.position.y = mk.position.y;
			const lastC = CL.reduce((a, t) => T > t ? t : a, -9); const fk = seg(T, lastC + .05, lastC + .4); fl.scale.setScalar(1 + fk * 1.5); setOpacity(fl, (1 - fk) * (lastC > 0 ? 1 : 0));
		};
	}
	if (n === 5) {
		const bub = at(new THREE.Group(), 0, 0, g);
		at(circle(22, P.creme), -40, 640, bub); at(circle(34, P.creme), 30, 690, bub); bub.add(at(circle(190, P.creme), 190, 760));
		const nums = ['100', '99', '98'].map(s => at(textPlane([s], 280, 190, { color: P.tinta, pad: .03 }), 190, 760, g));
		const qm = at(textPlane(['?'], 140, 200, { color: P.rosa, pad: .02 }), 190, 760, g);
		const er = at(new THREE.Group(), 0, 0, g); er.add(rrect(110, 64, 14, P.rosa)); at(rrect(110, 26, 8, P.azul), 0, 30, er); er.rotation.z = .5;
		const dust = nums.map((_, i) => { const d = at(bits(10, ['#C9C2B2', P.rosa], mulberry32(70 + i), { w: 10, h: 10 }), 190, 740, g); return d; });
		const W = [[27.0, 27.9], [27.9, 28.75], [28.75, 29.45]];
		extra = T => {
			cl.userData.pose({ lids: 1, smile: .6, tilt: -.05 + Math.sin(T * 1.2) * .03, bob: Math.sin(T * 2) * 5 });
			let erOn = false;
			nums.forEach((nm, i) => {
				const [a, b] = W[i], e = seg(T, b - .4, b - .05);
				nm.visible = T > a && T < b; nm.scale.setScalar(pop(T, a, .25) * (1 - .1 * e)); setOpacity(nm, 1 - e);
				if (T > b - .45 && T < b) { erOn = true; er.position.set(190 - 150 + 300 * e, 760 + Math.sin(e * 18) * 30, 0); }
				burst(dust[i], T - (b - .3)); dust[i].visible = T > b - .3 && T < b + .8;
			});
			er.visible = erOn; qm.scale.setScalar(pop(T, 29.4, .3)); qm.rotation.z = Math.sin(T * 4) * .1;
			bub.scale.setScalar(1 + Math.sin(T * 2.2) * .01);
		};
	}
	return T => { amb(T); badge.scale.setScalar(pop(T, T0 + .1, .35) * (n === 2 && T > 70 ? 1 : 1)); badge.rotation.z = Math.sin(T * 2 + n) * .05; extra(T); };
}

// ── 11 · mão fechada + medidor de força + 3·2·1 ──
function buildFist(g) {
	const amb = ambient(g, '#6E95FF', 56);
	const h = at(hand({ skin: P.pele2, sleeve: P.rosa }), -110, 300, g); h.scale.setScalar(2);
	const sweat = [0, 1, 2].map(i => at(circle(16, '#D6ECFF'), 0, 0, g));
	const lines = []; for (let i = 0; i < 6; i++) { const a = Math.PI * (.15 + i * .14); const s = stroke([[Math.cos(a) * 270, Math.sin(a) * 270], [Math.cos(a) * 330, Math.sin(a) * 330]], P.creme, 10); at(s, -110, 400, g); lines.push(s); }
	const m = at(new THREE.Group(), 290, 0, g);
	at(textPlane(['FORÇA'], 200, 56, { family: 'JetBrains Mono', weight: 800, color: P.creme, pad: .02 }), 0, 880, m);
	m.add(at(card(100, 690, 50, P.tinta, { off: 8 }), 0, 470));
	const fill = at(rrect(66, 640, 33, P.rosa), 0, 0, m);
	at(circle(72, P.tinta), 0, 115, m); at(circle(56, P.rosa), 0, 115, m);
	for (let i = 0; i < 5; i++) at(rrect(26, 6, 3, P.creme, .7), -14, 260 + i * 120, m);
	const cap = at(circle(34, P.amarelo), 0, 820, m);
	const stars = at(bits(16, [P.amarelo, P.creme, P.rosa], mulberry32(88), { w: 16, h: 16 }), 290, 830, g);
	const nums = ['3', '2', '1'].map((s, i) => at(shadowText([s], 480, 600, [P.amarelo, P.creme, P.menta][i]), 0, 470, g));
	const relief = []; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const s = stroke([[Math.cos(a) * 280, Math.sin(a) * 280], [Math.cos(a) * 380, Math.sin(a) * 380]], P.amarelo, 12); at(s, -110, 420, g); relief.push(s); }
	return T => {
		amb(T);
		const curl = eo(seg(T, 69.6, 70.15)) * (1 - eo(seg(T, 83.4, 83.75)));
		h.userData.curl(curl);
		const shk = Math.max(.4 * seg(T, 77.6, 79.4), T > 79.4 && T < 83.4 ? 1 : 0) * (T < 83.4 ? 1 : 0);
		h.position.set(-110 + Math.sin(T * 57) * 7 * shk, 300 + Math.cos(T * 49) * 5 * shk, 0); h.rotation.z = Math.sin(T * 41) * .02 * shk;
		lines.forEach((l, i) => l.userData.draw(shk > .05 && Math.floor(T * 10 + i) % 2 === 0 ? 1 : 0));
		let v = .3 * eo(seg(T, 70.0, 70.6)) + .48 * sm(T, 77.6, 79.3) + .22 * sm(T, 80.2, 81.3);
		v *= 1 - .95 * sm(T, 83.4, 84.2); if (T > 81.3 && T < 83.4) v += Math.sin(T * 40) * .01;
		fill.scale.y = Math.max(.02, v); fill.position.y = 150 + 320 * Math.max(.02, v);
		const cp = seg(T, 81.35, 82.4); cap.position.set(cp * 120, 820 + cp * 500 - cp * cp * 300, 0); cap.rotation.z = cp * 6; cap.visible = T < 82.4;
		burst(stars, T - 81.35); stars.visible = T > 81.35 && T < 82.6;
		sweat.forEach((s, i) => { const ph = ((T - 79.6) * .9 + i / 3) % 1; s.visible = T > 79.6 && T < 83.4; s.position.set(-260 + i * 150, 700 - ph * ph * 400, 0); s.scale.set(1, 1.3, 1); });
		const C = [82.5, 82.85, 83.2];
		nums.forEach((n, i) => { const a = C[i], b = i < 2 ? C[i + 1] : 83.5; n.visible = T > a && T < b; n.scale.setScalar((1.35 - .35 * eo(seg(T, a, a + .14)))); n.rotation.z = (i - 1) * .06; });
		relief.forEach((s, i) => { s.userData.draw(eo(seg(T, 83.5 + i * .02, 83.8 + i * .02))); setOpacity(s, 1 - seg(T, 84.0, 84.5)); });
	};
}

// ── 12 · poltrona afundando ──
function buildDeep(g) {
	const amb = ambient(g, '#2C3D73', 57);
	at(rrect(CW, 1300, 0, '#121A33'), 0, -670, g);
	const rip = [0, 1, 2, 3].map(() => { const r = at(ring(220, 234, P.azul, .6), 0, -40, g); return r; });
	const sink = at(new THREE.Group(), 0, 0, g);
	at(rrect(560, 620, 100, '#E8742B'), 0, 300, sink);
	const cl = client(); sink.add(cl); cl.position.set(0, -10, 0);
	for (const s of [-1, 1]) at(rrect(120, 280, 55, P.laranja), s * 260, 50, sink);
	at(rrect(620, 160, 60, '#FFA05C'), 0, -40, sink);
	const gauge = at(new THREE.Group(), 345, 0, g);
	gauge.add(at(rrect(56, 640, 28, '#2A3B6E'), 0, 470));
	[740, 600, 460, 320, 180].forEach((y, i) => at(rrect(30, 8, 4, P.creme, .6), 0, y, gauge));
	const mk = at(poly([[26, 0], [-12, 24], [-12, -24]], P.amarelo), -50, 740, gauge);
	const badges = [640, 460].map(y => { const b = at(new THREE.Group(), -340, y, g); b.add(circle(80, P.tinta)); b.add(circle(72, P.amarelo)); at(textPlane(['2×'], 110, 90, { color: P.tinta, pad: .02 }), 0, 0, b); return b; });
	return T => {
		amb(T);
		const L = eo(seg(T, 84.0, 84.9)) + eo(seg(T, 89.6, 90.2)) + eo(seg(T, 90.9, 91.5)) + 1.2 * sm(T, 92.4, 93.8);
		sink.position.y = -L * 42 + Math.sin(T * 1.4) * 4;
		cl.userData.pose({ lids: 1, smile: .9, tilt: .06 + Math.sin(T * .9) * .03, bob: Math.sin(T * 2.1) * 4, arm: [[.32, -.55], [.32, -.55]] });
		cl.userData.parts.torso.scale.set(1 + .03 * Math.sin(T * 2.1), 1, 1);
		mk.position.y = 740 - L * 125;
		rip.forEach((r, i) => { const ph = ((T * .55 + i / 4) % 1); r.scale.set(.6 + ph * (1.4 + L * .3), (.6 + ph * (1.4 + L * .3)) * .28, 1); r.position.y = -40 + sink.position.y * .5; setOpacity(r, (1 - ph) * (.25 + .15 * L)); });
		badges.forEach((b, i) => { b.scale.setScalar(pop(T, i ? 91.0 : 89.7, .35)); b.rotation.z = Math.sin(T * 3 + i) * .08; });
	};
}

// ── 13 · balança: mão fechada = pano molhado ──
function buildScale(g) {
	const amb = ambient(g, '#FFE08A', 58);
	at(rrect(300, 40, 20, P.tinta), 0, 50, g); at(rrect(34, 600, 17, P.tinta), 0, 350, g);
	const beam = at(rrect(600, 28, 14, P.tinta), 0, 650, g);
	at(circle(30, P.tinta), 0, 650, g);
	const pans = [-1, 1].map(s => {
		const p = new THREE.Group(); g.add(p);
		p.add(stroke([[0, 0], [-105, -230]], P.tinta, 6, { dashed: false })); p.add(stroke([[0, 0], [105, -230]], P.tinta, 6, { dashed: false }));
		at(rrect(250, 26, 13, P.tinta), 0, -235, p);
		at(textPlane([s < 0 ? 'MÃO FECHADA' : 'PANO MOLHADO'], 250, 50, { color: P.tinta, pad: .02 }), 0, -300, p);
		return p;
	});
	const fi = at(hand({ skin: P.pele2, sleeve: P.rosa }), 0, -150, pans[0]); fi.scale.setScalar(.45); fi.userData.curl(1); fi.userData.sleeve.visible = false;
	const cw = at(cloth(180, 100), 0, -170, pans[1]);
	const dr = drips(4); pans[1].add(dr);
	const eq = at(new THREE.Group(), 0, 450, g); eq.add(circle(74, P.tinta)); eq.add(circle(66, P.creme)); at(rrect(70, 14, 7, P.tinta), 0, 14, eq); at(rrect(70, 14, 7, P.tinta), 0, -14, eq);
	const ar = arrow(quad([285, 580], [0, 930], [-265, 600]), P.rosa, 13); g.add(ar);
	const tr = at(new THREE.Group(), 0, 900, g); tr.add(card(200, 60, 30, P.rosa, { off: 6 })); at(textPlane(['TROCA'], 160, 40, { family: 'JetBrains Mono', weight: 800, color: P.creme, pad: .02 }), 0, 0, tr);
	return T => {
		amb(T);
		const u = Math.max(0, T - 95.45), th = -.3 * Math.exp(-1.8 * u) * Math.cos(5.5 * u);
		beam.rotation.z = th;
		pans.forEach((p, i) => { const s = i ? 1 : -1; p.position.set(s * 285 * Math.cos(th), 650 + s * 285 * Math.sin(th), 0); });
		dripAt(dr, T - 95, 0, 120, -230, 0, 1.2); dr.visible = false;
		cw.scale.y = 1 + Math.sin(T * 3) * .03;
		eq.scale.setScalar(pop(T, 97.6, .35)); eq.rotation.z = (1 - eo(seg(T, 97.6, 98))) * .5;
		ar.userData.draw(eo(seg(T, 98.6, 99.4))); ar.visible = T > 98.5;
		tr.scale.setScalar(pop(T, 99.2, .3));
	};
}

export function buildWorld() {
	const root = new THREE.Group(), sets = {};
	const B = { DESK: buildDesk, STAGE: buildStage, BOARD: buildBoard, BAR: buildBar, TRASH: buildTrash, FIST: buildFist, DEEP: buildDeep, SCALE: buildScale };
	for (const key of Object.keys(GRID)) {
		const g = new THREE.Group(); g.position.set(ORIG[key].x, ORIG[key].y, 0); root.add(g);
		sheet(g, key);
		const up = key[0] === 'S' && key.length === 2 ? buildStep(g, +key[1]) : B[key](g);
		sets[key] = { g, up };
	}
	return { root, sets };
}
export function update(T, w, cam) {
	for (const k in w.sets) {
		const s = w.sets[k], o = ORIG[k];
		const vis = Math.abs(cam.x - o.x) < CW * .5 + 540 / cam.z + 20 && Math.abs(cam.y - o.y) < CH * .5 + 960 / cam.z + 20;
		s.g.visible = vis; if (vis) s.up(T);
	}
}
