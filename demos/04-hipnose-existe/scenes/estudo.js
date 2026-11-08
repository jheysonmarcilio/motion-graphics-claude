// Cenas 2–4 · o estudo: ~60 pessoas, EEG + ressonância, dois grupos, hipnose → cérebro
import * as THREE from 'three';
import { seg, ease, lerp, clamp } from '../lib.js';
import { shots, C, REG } from '../world.js';

const Y0 = .5;   // altura do centro da grade
const WHITE = C.luz;

export const s2 = {
	id: 'estudo', t0: 14.9, t1: 22.43,
	update(T, w) {
		const P = w.people; P.g.visible = true;
		w.spiral.u.uK.value = .2;
		const back = ease.cubicInOut(seg(T, 18.9, 19.8)), gone = seg(T, 20.6, 21.1);
		w.layoutPeople(i => {
			const [x, y, o] = P.grid[i], t0 = 15.15 + o / 14 * 2.4, e = ease.backOut(seg(T, t0, t0 + .35));
			const bob = Math.sin(T * 2 + P.rnd[i] * 9) * .02;
			return { x: x * (1 - back * .15), y: Y0 + y + bob - back * .9, z: -back * 3, s: e * (1 - gone), color: WHITE, a: .75 - back * .45 };
		});
		if (T > 20.7) {                                                                 // fatia de ressonância
			const m = w.mri; m.g.visible = true;
			const a = ease.expoOut(seg(T, 20.85, 21.4));
			m.g.position.set(0, -.25, 1.2); m.g.scale.setScalar(.75 + .25 * a); m.g.rotation.set(-.15 + .1 * a, Math.sin(T * .6) * .12, 0);
			m.u.uReveal.value = ease.cubicInOut(seg(T, 20.85, 21.7)); m.u.uScan.value = 1 - ((T - 20.85) * .8) % 1;
			m.u.uOpacity.value = a;
		}
		shots(w.camera, T, [
			{ t: 14.9, p: [0, -.2, 11.5], l: [0, -.1, 0], d: [0, 0, -.25] },
			{ t: 16.75, p: [-.6, -.4, 11.2], l: [0, -.1, 0], d: [.2, .05, -.12], tr: .6 },
			{ t: 19.0, p: [.4, -.6, 11.0], l: [0, -.3, 0], d: [-.15, 0, -.2], tr: .6 },
			{ t: 20.85, p: [0, -.3, 10.2], l: [0, -.2, 0], d: [0, 0, -.25], tr: .6 },
		]);
	},
};

export const s3 = {
	id: 'grupos', t0: 22.43, t1: 32.7,
	update(T, w) {
		const P = w.people; P.g.visible = true;
		w.spiral.u.uK.value = .2 + .15 * seg(T, 26.8, 28);
		const ret = ease.expoOut(seg(T, 22.45, 23.1));
		const A = ease.expoOut(seg(T, 26.8, 27.4)), B = ease.expoOut(seg(T, 29.7, 30.3));
		w.layoutPeople(i => {
			const [gx, gy] = P.grid[i], [sx, sy] = P.split[i], g = P.grp[i];
			const sp = ease.expoInOut(seg(T, 24.0 + P.rnd[i] * .5, 25.2 + P.rnd[i] * .5));
			let x = lerp(gx, sx, sp), y = lerp(gy, sy, sp);
			let color = WHITE, a = .75, s = ret;
			if (g === 0) {          // altamente sugestionável: acende e balança
				const sw = Math.sin(T * 2.2 + P.rnd[i] * 6) * .07 * A;
				x += sw; y += Math.abs(sw) * .3; color = A > .5 ? C.sinapse : WHITE; a = .75 + .45 * A; s *= 1 + .1 * A;
			} else {                // pouco sugestionável: rígido, violeta, apagado
				color = B > .5 ? C.consciente : WHITE; a = .75 - .3 * B + .15 * Math.exp(-Math.max(0, T - 29.7) * 4) * (T > 29.7);
				if (A > 0 && B < .5) a -= .25 * A;
			}
			return { x, y: Y0 + y + Math.sin(T * 2 + P.rnd[i] * 9) * .015, z: -3 * (1 - ret), s, color, a };
		});
		const la = w.project(new THREE.Vector3(-.92, Y0 + 1.45, 0)), lb = w.project(new THREE.Vector3(.92, Y0 + 1.45, 0));
		w.ui.groups = [
			{ a: A * (1 - seg(T, 32.3, 32.65)), x: la.x, y: la.y - 120, text: 'ALTA', sub: 'SUGESTIONABILIDADE', color: C.sinapse },
			{ a: B * (1 - seg(T, 32.3, 32.65)), x: lb.x, y: lb.y - 120, text: 'BAIXA', sub: 'SUGESTIONABILIDADE', color: C.consciente },
		];
		shots(w.camera, T, [
			{ t: 22.43, p: [0, -.3, 10.6], l: [0, -.15, 0], d: [0, 0, -.2], tr: .6 },
			{ t: 24.0, p: [.6, .6, 10.4], l: [0, -.05, 0], d: [-.25, 0, -.1], tr: .6 },
			{ t: 26.8, p: [-.3, -.2, 10.4], l: [-.15, -.1, 0], d: [.05, 0, -.15], tr: .6 },
			{ t: 29.7, p: [.3, -.2, 10.4], l: [.15, -.1, 0], d: [-.05, 0, -.15], tr: .6 },
		]);
	},
};

export const s4 = {
	id: 'hipnotizar', t0: 32.7, t1: 40.07,
	update(T, w) {
		const P = w.people, hu = w.head.u;
		w.spiral.u.uK.value = lerp(.35, 1, ease.cubicInOut(seg(T, 32.8, 34.2))) - .55 * seg(T, 37.5, 39.5);
		w.spiral.u.uCy.value = .1;
		if (T < 35.2) {                                                                   // pessoas se fundem na cabeça
			P.g.visible = true;
			w.layoutPeople(i => {
				const [sx, sy] = P.split[i], g = P.grp[i];
				const f = ease.expoIn(seg(T, 33.3 + P.rnd[i] * .6, 34.5 + P.rnd[i] * .6));
				const sw = Math.sin(T * 2.2 + P.rnd[i] * 6) * .09;
				return { x: lerp(sx + sw, 0, f), y: lerp(Y0 + sy, Y0 + .4, f), z: f * .5, s: 1 - f * .8, color: g ? C.consciente : C.sinapse, a: (g ? .6 : 1.1) * (1 - f * .5) };
			});
		}
		if (T > 33.8) {
			w.head.g.visible = true;
			hu.uScatter.value = 3.5 * (1 - ease.expoOut(seg(T, 33.8, 35.4)));
			hu.uPulseR.value = (T * 1.1) % 3.2 - .3;
			hu.uOpacity.value = .42 - .3 * ease.cubicInOut(seg(T, 37.5, 38.8));
			// anel do scanner passa pela cabeça
			const q = seg(T, 35.7, 38.1);
			if (q > 0 && q < 1) {
				const y = lerp(2.4, -1.4, ease.sineInOut(q));
				w.bore.visible = true; w.bore.position.set(0, y, 0); w.bore.rotation.set(Math.PI / 2, 0, 0);
				const a = Math.min(1, q * 6, (1 - q) * 6); w.boreM.opacity = a; w.boreH.opacity = .15 * a;
				hu.uScanY.value = y - .5;
			}
		}
		if (T > 37.3) {                                                                   // cérebro se monta dentro da cabeça
			const b = w.brain; b.g.visible = true; b.pts.visible = true;
			b.u.uScatter.value = 3 * (1 - ease.expoOut(seg(T, 37.3, 38.7)));
			b.u.uOpacity.value = ease.cubicInOut(seg(T, 37.3, 38));
			const k = ease.backOut(seg(T, 38.6, 39.0));                                  // 3 descobertas: 3 pontos
			[[3, REG.acc], [0, REG.pfc], [1, REG.emo]].forEach(([n, p], i) => {
				const kk = ease.backOut(seg(T, 38.6 + i * .2, 39.0 + i * .2));
				w.glowAt(w.nodes[n], p, kk * (.8 + .2 * Math.sin(T * 7 + i)), .32);
			});
			b.u.uDim.value = .3 * k;
		}
		w.flash = .2 * Math.exp(-Math.max(0, T - 38.6) * 5) * (T > 38.6);
		shots(w.camera, T, [
			{ t: 32.7, p: [0, -.2, 10.6], l: [0, -.05, 0], d: [0, .05, -.35], tr: .6 },
			{ t: 35.7, p: [2.6, 1.4, 6.6], l: [0, .45, 0], d: [-.35, 0, -.1], tr: .7 },
			{ t: 37.6, p: [-1.4, 1.98, 5.0], l: [0, 1.23, 0], d: [.25, -.05, -.15], tr: .7 },
			{ t: 38.6, p: [0, 1.63, 4.5], l: [0, 1.28, 0], d: [0, 0, -.2], tr: .5 },
		]);
	},
};

