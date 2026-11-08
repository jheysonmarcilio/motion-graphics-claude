// Direção do 03 v2: tudo em função do tempo T da narração gravada (audio/03-hipnose-profundidade.mp3).
import * as THREE from 'three';
import { clamp, seg, ease, lerp } from './lib.js';
import { P } from './toy.js';
import { FH, fy, XL, XR, STORE_X } from './world.js';

const pop = (T, t0, d = .35) => ease.backOut(seg(T, t0, t0 + d));
const gone = (T, t1, d = .22) => 1 - ease.expoIn(seg(T, t1 - d, t1));
const win = (T, a, b, di = .35, dout = .22) => (T < a || T > b) ? 0 : pop(T, a, di) * gone(T, b, dout);
const inW = (T, a, b) => T >= a && T < b;
const show = (o, k) => { o.visible = k > .002; if (o.visible) o.scale.setScalar(Math.max(k, .0001)); };
const V = new THREE.Vector3(), V2 = new THREE.Vector3();

// ── andar do elevador ── [t, andar, degraus?]
const CK = [[0, 0], [12.0, 0], [15.0, -3, 1], [19.0, -7, 1], [19.75, -7], [20.55, -1, 0], [42.4, -1], [45.0, -4, 1]];
export function cabK(T) {
	for (let i = 1; i < CK.length; i++) {
		const [ta, ka] = CK[i - 1], [tb, kb, st] = CK[i];
		if (T > tb) continue;
		if (T <= ta) return ka;
		const u = seg(T, ta, tb);
		if (!st) return lerp(ka, kb, ease.expoInOut(u));
		const n = Math.abs(kb - ka), s = u * n, j = Math.min(n - 1, Math.floor(s));
		return ka + Math.sign(kb - ka) * (j + ease.cubicInOut(s - j));
	}
	return CK[CK.length - 1][1];
}
const cabY = T => fy(cabK(T));

// ── câmera: chaves = {t: deixa da narração, dur: duração do movimento (centrado em t), s:[x,y], d, tilt°, yaw, sz} ──
const CAB = (o = 1.3) => T => cabY(T) + o;
const FS = new THREE.Vector3(XL + .95, 2.1, 1.0), FL = new THREE.Vector3(-2.05, fy(-4) + .02, 2.15);
export function flagAt(T, out = new THREE.Vector3()) {
	const fu = seg(T, 39.4, 41.0), e = ease.cubicInOut(fu);
	return out.set(lerp(FS.x, FL.x, e), lerp(FS.y, FL.y, e) + Math.sin(fu * Math.PI) * 1.6, fu < .85 ? 2.95 : lerp(2.95, FL.z, seg(fu, .85, 1)));
}
const FLAG = T => flagAt(T).y + .9;
const BS = new THREE.Vector3(XL + .9, 2.0, 1.2), BM = new THREE.Vector3(0, 2.6, 1.6);
export function bubbleAt(T, t0, tr, out = new THREE.Vector3()) {
	const u = seg(T, t0, t0 + tr), E = new THREE.Vector3(0, cabY(Math.min(T, t0 + tr)) + 3.15, 1.6), e = ease.cubicInOut(u), a = 1 - e;
	return out.set(0, 0, 0).addScaledVector(BS, a * a).addScaledVector(BM, 2 * a * e).addScaledVector(E, e * e);
}
const TESTB = T => bubbleAt(T, 50.0, 2.0).y - .4;
const K = [
	{ t: 0, s: [XL + .25, 1.5], d: 4.2, tilt: 4, yaw: .2 },
	{ t: 1.95, dur: .5, s: [-1.9, 1.3], d: 13, tilt: 6 },
	{ t: 3.6, dur: 1.1, s: [0, -6.5], d: 46, tilt: 3 },
	{ t: 5.6, dur: .55, s: [XL + 1.55, 1.3], d: 3.4, tilt: 28, sz: .9 },
	{ t: 8.3, dur: .5, s: [XL - .6, 1.7], d: 7.5, tilt: 6, yaw: -.15 },
	{ t: 10.0, dur: .45, s: [XL - 1.0, 2.1], d: 3.2, tilt: 0, sz: -2.3 },
	{ t: 10.9, dur: .45, s: [XL + .25, 1.5], d: 4.5, tilt: 4 },
	{ t: 11.75, dur: .45, s: [XL + 1.75, 1.05], d: 3.0, tilt: 30, sz: .9 },
	{ t: 12.3, dur: .5, s: [0, CAB(1.4)], d: 10, tilt: 5 },
	{ t: 15.1, dur: .5, s: [-.6, CAB(1.2)], d: 13, tilt: 4, yaw: -.2 },
	{ t: 17.6, dur: .5, s: [0, CAB(1.5)], d: 6.5, tilt: 6 },
	{ t: 19.75, dur: .6, s: [0, CAB(1.3)], d: 9, tilt: 5 },
	{ t: 21.4, dur: .45, s: [0, fy(-1) + 1.45], d: 4.2, tilt: 4 },
	{ t: 23.4, dur: .5, s: [-.6, -1.0], d: 14, tilt: 4 },
	{ t: 25.4, dur: .45, s: [0, fy(-1) + 2.1], d: 6.5, tilt: 6, yaw: .2 },
	{ t: 27.1, dur: .55, s: [STORE_X, 3.0], d: 24, tilt: 5 },
	{ t: 29.2, dur: .45, s: [STORE_X, 3.8], d: 17, tilt: 4 },
	{ t: 31.9, dur: .45, s: [STORE_X, 2.1], d: 17, tilt: 6 },
	{ t: 34.4, dur: .5, s: [STORE_X - .3, 1.6], d: 15, tilt: 14 },
	{ t: 36.7, dur: .6, s: [0, -6], d: 40, tilt: 3 },
	{ t: 39.5, dur: .5, s: [T => flagAt(T).x + .45, FLAG], d: 8.5, tilt: 4, sz: 2.9 },
	{ t: 42.2, dur: .45, s: [0, CAB(1.3)], d: 10, tilt: 4 },
	{ t: 44.9, dur: .45, s: [-1.0, fy(-4) + 1.5], d: 9, tilt: 5 },
	{ t: 47.7, dur: .5, s: [XL + .25, 1.75], d: 5, tilt: 4 },
	{ t: 49.6, dur: .55, s: [-.3, TESTB], d: 12, tilt: 3 },
	{ t: 52.0, dur: .45, s: [0, fy(-4) + 1.6], d: 5, tilt: 4 },
	{ t: 54.2, dur: .45, s: [XL + 1.1, 1.45], d: 5.2, tilt: 12 },
	{ t: 57.2, dur: .5, s: [XL + .25, 1.8], d: 8, tilt: 8, yaw: .3 },
	{ t: 60.0, dur: .45, s: [XL + .55, 2.05], d: 3.6, tilt: 2, sz: .9 },
	{ t: 63.0, dur: .55, s: [XR - .5, fy(-4) + 1.5], d: 10, tilt: 5, yaw: -.15 },
	{ t: 66.0, dur: .6, s: [0, -4.5], d: 36, tilt: 3 },
	{ t: 68.6, dur: .5, s: [XR + .3, fy(-4) + 1.4], d: 7.5, tilt: 6, yaw: .2 },
	{ t: 71.4, dur: .55, s: [1.5, -8.5], d: 28, tilt: 3 },
	{ t: 74.4, dur: .5, s: [XR + .2, fy(-4) + 1.5], d: 4.6, tilt: 8, yaw: -.25, sz: .6 },
	{ t: 77.2, dur: .45, s: [XR + .6, fy(-4) + 1.5], d: 6.5, tilt: 5, yaw: .15 },
	{ t: 79.5, dur: .5, s: [XR, fy(-4) + 1.5], d: 10, tilt: 5 },
	{ t: 81.0, dur: .45, s: [XR + .3, fy(-4) + 1.2], d: 4.2, tilt: 10, yaw: .3, sz: .6 },
	{ t: 83.6, dur: .45, s: [XR + .3, fy(-4) + 2.15], d: 8.5, tilt: 4, sz: .9 },
	{ t: 86.4, dur: .45, s: [XR + .9, fy(-4) + 2.3], d: 6, tilt: 2, yaw: -.15, sz: 1.0 },
	{ t: 89.3, dur: .5, s: [XL + .8, 1.5], d: 6, tilt: 8 },
	{ t: 92.4, dur: .5, s: [XL + .25, 1.55], d: 4.6, tilt: 4, yaw: -.2 },
	{ t: 95.3, dur: .45, s: [XL + .45, 1.3], d: 4.8, tilt: 8 },
	{ t: 98.2, dur: .55, s: [1, -6], d: 34, tilt: 3 },
	{ t: 99.9, dur: .5, s: [XR, fy(-4) + 1.75], d: 4.6, tilt: 2, sz: 2.6 },
	{ t: 102.4, dur: .6, s: [XR + .1, fy(-4) + 1.7], d: 4.4, tilt: 2, yaw: .1, sz: 2.6 },
	{ t: 104.6, dur: .6, s: [XR - .05, fy(-4) + 1.75], d: 4.6, tilt: 3, yaw: -.1, sz: 2.6 },
	{ t: 107.2, dur: .55, s: [XR, fy(-6) + .9], d: 17, tilt: 3 },
	{ t: 110.0, dur: .45, s: [XR, fy(-7) + 1.6], d: 6.5, tilt: 4 },
	{ t: 112.1, dur: .5, s: [XL + .25, 1.5], d: 4.2, tilt: 4, yaw: .2 },
];
const FOV = 30, TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
const ev = (v, T) => typeof v === 'function' ? v(T) : v;
function keyPose(k, T) { return { x: ev(k.s[0], T), y: ev(k.s[1], T), d: k.d, tilt: k.tilt ?? 5, yaw: k.yaw ?? 0, sz: k.sz ?? 0 }; }
export function camPose(T) {
	let i = 0; while (i < K.length - 1 && T >= K[i + 1].t - (K[i + 1].dur ?? .5) / 2) i++;
	let A = keyPose(K[i], T), whip = false;
	const B = K[i + 1];
	if (i > 0) {
		const k = K[i], u = seg(T, k.t - (k.dur ?? .5) / 2, k.t + (k.dur ?? .5) / 2);
		if (u < 1) { whip = u > 0;
			const Pv = keyPose(K[i - 1], T), e = ease.expoInOut(u);
			// zoom: interpolar a distância em escala logarítmica (zoom-in/out fluido)
			A = { x: lerp(Pv.x, A.x, e), y: lerp(Pv.y, A.y, e), d: Math.exp(lerp(Math.log(Pv.d), Math.log(A.d), e)), tilt: lerp(Pv.tilt, A.tilt, e), yaw: lerp(Pv.yaw, A.yaw, e), sz: lerp(Pv.sz, A.sz, e) };
		}
	}
	// respiração da câmera
	const br = A.d / 10;
	A.x += Math.sin(T * .41) * .04 * br; A.y += Math.sin(T * .33 + 1) * .035 * br; A.d *= 1 - .012 * Math.sin(T * .27); A.yaw += Math.sin(T * .19) * .02;
	const vh = 2 * A.d * TAN, tr = THREE.MathUtils.degToRad(A.tilt);
	const L = new THREE.Vector3(A.x, A.y - .15 * vh, A.sz);
	const pos = L.clone().add(new THREE.Vector3(Math.sin(A.yaw) * Math.cos(tr), Math.sin(tr), Math.cos(A.yaw) * Math.cos(tr)).multiplyScalar(A.d));
	return { pos, L, vh, fov: FOV, whip, d: A.d };
}

// ── atualização do mundo ──
const XT = [30.6, 30.9, 31.2, 32.7, 33.0, 33.3];
const handPos = (toyObj, i, out) => toyObj.arms[i].children[1].getWorldPosition(out);

export function update(T, w) {
	const { ther, cli, cli2 } = w;
	// ── elevador ──
	const k = cabK(T), cy = fy(k);
	w.cab.position.set(0, cy, 0);
	w.cableUp.position.set(0, (cy + 2.9 + FH + .2) / 2, -.2); w.cableUp.scale.y = Math.max(.01, FH + .2 - cy - 2.9 + 3);
	w.cableUp.position.y = (cy + 2.9 + FH + .1) / 2; w.cableUp.scale.y = Math.max(.05, FH + .1 - (cy + 2.9));
	const moving = Math.abs(cabK(T + .05) - k) > .002;
	w.setDisplay(Math.round(k), T > 45 && T < 112.5 ? '#5CFF9A' : moving ? '#FF7A45' : '#FFB000');
	w.cab.rotation.z = moving ? Math.sin(T * 40) * .003 : 0;
	const dOpen = ease.cubicInOut(seg(T, 63.0, 63.7));
	w.doors.forEach((d, i) => { const s = i ? 1 : -1; d.position.z = s * (2.7 / 4 + dOpen * 2.7 / 4 * .95); });

	// ── cliente (no elevador) ──
	cli.pose(); cli.sit(1);
	let ce = .85, cm = 'smile', cb = 0, look = 0;
	if (T < 12) ce = .85 + .15 * Math.sin(T * 1.7) * .5;
	else if (T < 19.75) ce = 1;
	else if (T < 27.0) { ce = 0; cm = 'flat'; cb = -.6; look = Math.sin(T * 1.6); }
	else if (T < 42.4) ce = .6;
	else ce = 1;
	if (inW(T, 17.6, 19.9)) { cm = 'o'; cli.head.rotation.z = .35 * pop(T, 17.6, .5); cli.mouthO.scale.y = 1 + .4 * Math.sin(T * 5); }
	if (inW(T, 24.6, 26.6)) { const s = win(T, 24.6, 26.6, .3, .3); cli.arms[0].rotation.set(-.4 * s, 0, -.12 - 1.1 * s); cli.arms[1].rotation.set(-.4 * s, 0, .12 + 1.1 * s); cli.head.rotation.z = .15 * s; cb = -.2 - .6 * s; }
	if (inW(T, 52.2, 63.5)) { const a = ease.sineInOut(seg(T, 52.2, 54.0)) * (1 - ease.cubicInOut(seg(T, 57, 58))); cli.arms[1].rotation.set(-.3 * a, 0, .12 + 2.3 * a + Math.sin(T * 2) * .06 * a); }
	cli.face({ eyes: Math.max(ce, 0), mouth: cm, brow: cb, look });
	if (ce < .5) { const b = blinkT(T); cli.eyes.forEach(e => e.scale.y *= 1 - b * .9); }
	cli.hips.position.x = 0; cli.g.position.y = .2 + Math.sin(T * 1.3) * .006;
	const poof = 1 - ease.expoIn(seg(T, 63.9, 64.15));
	cli.g.visible = poof > .01; cli.g.scale.setScalar(Math.max(poof, .01));
	w.root.updateMatrixWorld(true);

	// zzz
	w.zz.forEach((z, i) => {
		const ph = ((T - 17.7) / 1.1 + i / 3) % 1, on = inW(T, 17.7, 19.85);
		show(z, on ? Math.sin(ph * Math.PI) : 0);
		cli.head.getWorldPosition(V); z.position.set(V.x + .3 + ph * .5, V.y + .3 + ph * .9, V.z + .4); z.rotation.z = .3 - ph * .4;
	});

	// ── terapeuta ──
	ther.pose();
	let te = 0, tm = 'smile', tb = 0, tl = 0;
	ther.g.rotation.y = .35 + Math.sin(T * .6) * .05; ther.hips.rotation.z = Math.sin(T * 1.1) * .02;
	const scratch = Math.max(win(T, .1, 3.6, .3, .3), win(T, 92.3, 95.3, .3, .3));
	if (scratch > 0) { ther.arms[1].rotation.set(-2.7 * scratch, 0, .12 + .55 * scratch); ther.arms[1].rotation.x += Math.sin(T * 14) * .08 * scratch; ther.head.rotation.z = -.12 * scratch; tb = scratch; tm = 'flat'; }
	const hover = win(T, 5.6, 8.25, .4, .3);
	if (hover > 0) { ther.g.rotation.y = lerp(ther.g.rotation.y, .9, hover); ther.arms[1].rotation.set(-1.35 * hover + Math.sin(T * 9) * .04, 0, .12); tb = .7 * hover; tm = 'flat'; tl = .6; }
	const yawn = win(T, 10.9, 11.7, .25, .2);
	if (yawn > 0) { ther.arms[0].rotation.z = -.12 - 2.5 * yawn; ther.arms[1].rotation.z = .12 + 2.5 * yawn; tm = 'o'; te = .7 * yawn; ther.mouthO.scale.y = 1.6; }
	const press = Math.max(win(T, 11.7, 19.75, .2, .3), win(T, 42.2, 45.0, .2, .3));
	if (press > 0) {
		ther.g.rotation.y = lerp(ther.g.rotation.y, 1.0, press);
		const p = Math.pow(Math.abs(Math.sin(T * 6.5)), 3); ther.arms[1].rotation.set((-1.05 - .35 * (1 - p)) * press, 0, .12);
		w.bDown.position.y = 1.1 - .035 * p * press; tb = .3 * press;
	} else w.bDown.position.y = 1.1;
	const talk = win(T, 23.0, 27.0, .3, .3);
	if (talk > 0) { ther.arms[1].rotation.set(-1.6 * talk, 0, .5 * talk); ther.arms[0].rotation.set(-1.0 * talk, 0, -.4 * talk); tm = Math.sin(T * 13) > 0 ? 'o' : 'smile'; }
	const thr = win(T, 39.0, 40.0, .2, .25);
	if (thr > 0) { const u = seg(T, 39.1, 39.6); ther.arms[1].rotation.set(lerp(-2.9, -1.0, ease.expoOut(u)) * thr, 0, .12); tm = 'o'; }
	const holdCard = win(T, 47.6, 63.3, .35, .25);
	if (holdCard > 0) { ther.arms[1].rotation.set(-2.5 * holdCard, 0, .2 * holdCard); }
	const thumbs = Math.max(win(T, 54.3, 57.0, .3, .3), win(T, 89.4, 92.2, .3, .3));
	if (thumbs > 0) { ther.arms[0].rotation.set(-2.9 * thumbs, 0, -.3 * thumbs); ther.arms[0].rotation.x += Math.sin(T * 8) * .06 * thumbs; tm = 'smile'; }
	const holdClip = win(T, 95.3, 99.7, .35, .25);
	if (holdClip > 0) { ther.arms[0].rotation.set(-1.25 * holdClip, 0, .25 * holdClip); ther.arms[1].rotation.set(-1.25 * holdClip, 0, -.25 * holdClip); ther.g.rotation.y = lerp(ther.g.rotation.y, .15, holdClip); tl = 0; }
	ther.face({ eyes: te, mouth: tm, brow: tb, look: tl });
	{ const b = blinkT(T + 1.1); ther.eyes.forEach(e => e.scale.y *= 1 - b * .9); }
	w.root.updateMatrixWorld(true);

	// "?" sobre o terapeuta
	ther.head.getWorldPosition(V);
	const q = Math.max(win(T, .35, 3.55, .35, .2), win(T, 92.6, 95.2, .35, .2));
	show(w.qmark, q); w.qmark.position.set(V.x + .45, V.y + .55 + Math.sin(T * 4) * .05, V.z + .3); w.qmark.rotation.z = Math.sin(T * 3) * .15;

	// ── painel: lâmpada ──
	const green = inW(T, 54.2, 57.2) || inW(T, 89.3, 92.3) || T >= 107.2;
	const amber = !green && (moving || inW(T, 11.7, 19.75)) && Math.sin(T * 14) > 0;
	w.lampM.color.set(green ? P.verde : amber ? '#FFB000' : '#8A3030');
	w.lampM.emissive.set(green ? '#2CFF7A' : amber ? '#FF9000' : '#200000'); w.lampM.emissiveIntensity = green || amber ? .9 : .4;
	w.bStart.position.y = 1.11;

	// ── relógio ──
	const sp = T < 8.25 ? T * .15 : 8.25 * .15 + (T - 8.25) * (T < 12 ? (T - 8.25) * 3.2 : 12) ;
	w.hMin.rotation.z = -sp * 2; w.hHour.rotation.z = -sp * 2 / 12;

	// ── marcador "PONTO?" (fantasma) ──
	show(w.ghost, win(T, 15.0, 19.7, .35, .25) * (1 + .05 * Math.sin(T * 6)));

	// ── bandeira ──
	const fu = seg(T, 39.4, 41.0), land = FL;
	if (T < 39.4) w.flag.visible = false;
	else {
		w.flag.visible = true; w.flag.scale.setScalar(1);
		const e = ease.cubicInOut(fu);
		if (fu < 1) {
			flagAt(T, w.flag.position);
			w.flag.rotation.set(0, 0, Math.sin(fu * 18) * .35 * (1 - e));
		} else {
			const b = seg(T, 41.0, 41.5); w.flag.position.copy(land); w.flag.rotation.set(0, 0, Math.sin(b * 12) * .2 * (1 - b));
			w.pen.rotation.y = Math.sin(T * 3) * .15;
		}
	}
	const tOn = ease.expoOut(seg(T, 44.9, 45.4));
	show(w.terapia, pop(T, 44.7, .4));
	w.terapiaM.color.set(tOn > .5 ? P.verde : '#5A6B60'); w.terapiaM.emissive.set(P.verde); w.terapiaM.emissiveIntensity = tOn * (.7 + .3 * Math.sin(T * 5));

	// ── balões de sugestão ──
	w.bubbles.forEach((b, i) => {
		b.visible = false;
		const t0 = i < 4 ? 23.2 + i * .8 : 50.0, tr = i < 4 ? 1.0 : 2.0;
		if (T < t0 || T > t0 + tr + 1.6) return;
		const u = seg(T, t0, t0 + tr);
		b.visible = true;
		const pos = bubbleAt(T, t0, tr);
		let s = pop(T, t0, .3), rz = Math.sin(T * 5 + i) * .06;
		b.userData.x.visible = false;
		if (u >= 1) {
			const qq = T - t0 - tr;
			if (i < 4) {   // bate e cai
				pos.x += qq * (i % 2 ? .9 : -.9); pos.y += 1.4 * qq - 3.2 * qq * qq; pos.z += .9 * qq; rz = (i % 2 ? -1 : 1) * qq * 3;
				b.userData.x.visible = true; b.userData.x.scale.setScalar(pop(T, t0 + tr + .03, .25));
				s *= gone(T, t0 + tr + 1.3, .3);
			} else { s *= 1 - ease.expoIn(seg(qq, 0, .3)); pos.y -= qq * 1.5; }   // entra no elevador
		}
		b.position.copy(pos); b.rotation.set(0, 0, rz); b.scale.setScalar(Math.max(s, .001)); b.visible = s > .002;
	});

	// ── cartão + carrossel ──
	const showCard = holdCard * (1 - win(T, 57.2, 60.0, .3, .3));
	handPos(ther, 1, V);
	show(w.card, showCard * .85); w.card.position.set(V.x + .05, V.y + .45, V.z + .15);
	const flip = ease.backOut(seg(T, 60.9, 61.5));
	w.card.rotation.set(0, -.25 + Math.PI * flip, Math.sin(T * 2) * .04);
	ther.head.getWorldPosition(V2);
	w.carousel.forEach((c, i) => {
		const kk = win(T, 57.2 + i * .12, 60.1, .35, .25);
		show(c, kk * .8);
		const a = T * 1.3 + i * Math.PI / 2;
		c.position.set(V2.x + Math.sin(a) * 1.25, V2.y + .1 + Math.sin(a * 2) * .15, V2.z + Math.cos(a) * 1.25 + .3); c.rotation.set(0, 0, Math.sin(a) * .1);
	});

	// ── praia ──
	const bVis = T >= 63.0;
	w.beach.visible = bVis;
	if (bVis) {
		for (const p of w.bParts) { const kk = pop(T, 63.05 + p.order * 2.2, .45); p.o.scale.copy(p.base).multiplyScalar(Math.max(kk, .001)); p.o.visible = kk > .002; }
		const pa = w.sea.geometry.attributes.position, b0 = w.seaBase;
		for (let i = 0; i < pa.count; i++) { const x = b0[i * 3], z = b0[i * 3 + 2]; pa.setY(i, b0[i * 3 + 1] + Math.sin(x * 2.2 + T * 2.4) * .035 + Math.sin(z * 4 - T * 3) * .03); }
		pa.needsUpdate = true; w.sea.geometry.computeVertexNormals();
		w.sunM.emissiveIntensity = .9 + .25 * seg(T, 77.2, 78) + .1 * Math.sin(T * 2);
	}
	cli2.pose(); cli2.sit(1);
	const c2 = pop(T, 64.15, .45);
	cli2.g.visible = c2 > .01; cli2.g.scale.setScalar(Math.max(c2, .01));
	cli2.face({ eyes: 1, mouth: 'smile', brow: 0 });
	cli2.arms[0].rotation.set(.25, 0, -2.45); cli2.arms[1].rotation.set(.25, 0, 2.45); cli2.hips.rotation.x = -.32;   // mãos atrás da cabeça, recostado
	cli2.head.rotation.y = Math.sin(T * .7) * .1;
	w.root.updateMatrixWorld(true);

	// escudos + ligação
	ther.g.getWorldPosition(V);
	const shK = win(T, 66.0, 71.5, .4, .3);
	show(w.shields[0], shK); w.shields[0].position.set(V.x, V.y + .95, V.z);
	cli2.g.getWorldPosition(V2);
	show(w.shields[1], shK); w.shields[1].position.set(V2.x, V2.y + .45, V2.z + .1);
	w.shields.forEach(s => s.scale.multiplyScalar(1.15 + .02 * Math.sin(T * 3)));
	w.link.visible = shK > .01; w.link.geometry.setDrawRange(0, Math.floor(61 * ease.cubicInOut(seg(T, 66.4, 67.6))));

	// pensamento + sentidos
	cli2.head.getWorldPosition(V2);
	show(w.thought, win(T, 74.6, 79.4, .4, .25) * .9);
	w.thought.position.set(V2.x + .8, V2.y + .95 + Math.sin(T * 2) * .04, V2.z + .3);
	const ST = [83.9, 84.6, 85.3, 86.6];
	w.senses.forEach((s, i) => {
		const kk = win(T, ST[i], 89.3, .4, .25) * (1 + .08 * Math.max(0, Math.sin((T - ST[i]) * 6)) * (1 - seg(T, ST[i], ST[i] + 1)));
		show(s, kk);
		s.position.set(XR + .3 + (i - 1.5) * .78, fy(-4) + 2.45 + Math.sin(T * 2 + i) * .05 - Math.abs(i - 1.5) * .12, 1.1); s.rotation.set(0, 0, (i - 1.5) * -.06);
	});

	// ── prancheta ──
	const clipHand = holdClip, clipBig = win(T, 99.85, 107.0, .4, .3);
	if (clipHand > 0) {
		handPos(ther, 0, V); handPos(ther, 1, V2); V.add(V2).multiplyScalar(.5);
		show(w.clip.g, clipHand * .55); w.clip.g.position.set(V.x, V.y + .02, V.z + .2); w.clip.g.rotation.set(-.15, -.2, 0);
	} else if (clipBig > 0) {
		show(w.clip.g, clipBig * .92); w.clip.g.position.set(XR, fy(-4) + 1.75, 2.6); w.clip.g.rotation.set(-.04, Math.sin(T * .7) * .05, Math.sin(T * .9) * .02);
	} else w.clip.g.visible = false;
	const CH = [100.6, 102.6, 104.8];
	w.clip.checks.forEach((c, i) => { const kk = pop(T, CH[i], .3) * (T < 99.8 ? 0 : 1); c.visible = kk > .002; c.scale.setScalar(Math.max(kk, .001) * (1 + .3 * (1 - seg(T, CH[i], CH[i] + .35)))); });

	// ── portas de protocolos ──
	w.doorsP.forEach((d, i) => {
		const t0 = 107.4 + i * .3;
		show(d.s, pop(T, t0, .4));
		const open = i < 2 ? ease.cubicInOut(seg(T, 107.9 + i * .35, 108.6 + i * .35)) * .55 : ease.cubicInOut(seg(T, 110.2, 111.0)) * 1.45;
		d.hinge.rotation.y = -open;
		d.glowM.emissiveIntensity = open * 1.6;
	});

	// ── loja ──
	w.boxes.forEach((b, i) => {
		const enter = pop(T, 26.9 + i * .1, .4), xt = XT[i];
		const x = pop(T, xt, .25), fu2 = seg(T, xt + .35, xt + 1.0);
		show(b.x, x);
		if (fu2 <= 0) { b.g.position.copy(b.home); b.g.position.y += (1 - enter) * .8; b.g.rotation.set(0, Math.sin(T * .8 + i) * .04, 0); b.g.scale.setScalar(Math.max(enter, .001)); }
		else {
			const z = lerp(b.home.z, b.land.z, Math.min(1, fu2 * 2.5)), e = ease.expoIn(fu2);
			const bounce = fu2 >= 1 ? Math.abs(Math.sin(seg(T, xt + 1.0, xt + 1.5) * Math.PI * 2)) * .2 * (1 - seg(T, xt + 1.0, xt + 1.5)) : 0;
			b.g.position.set(lerp(b.home.x, b.land.x, e), lerp(b.home.y, b.land.y, e) + bounce, z);
			b.g.rotation.set(e * .5, e * b.rotLand, e * b.rotLand * .6); b.g.scale.setScalar(1);
		}
	});
}

function blinkT(t) { const p = t % 3.4; return p < .14 ? Math.sin(p / .14 * Math.PI) : 0; }
