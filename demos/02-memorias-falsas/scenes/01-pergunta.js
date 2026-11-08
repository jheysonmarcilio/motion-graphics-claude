// PERGUNTA CENTRAL (00:45 – 01:08)
import * as THREE from 'three';
import { C, seg, eo, sm, inOut, lerp, ease, shots, textPlane, op, dust, morphPoints, textPoints, glow, polyline } from '../lib.js';
import { photoMesh, headPositions } from '../worlds.js';

const S = 45;
export default {
	id: 'pergunta', dur: 23,
	async init(ctx) {
		const scene = new THREE.Scene();
		scene.background = new THREE.Color('#08081a');
		const camera = new THREE.PerspectiveCamera(35, ctx.W / ctx.H, .05, 200);
		const rng = ctx.rng(202);

		// ── zona 1: duas fotos idênticas ──
		const Z1 = new THREE.Group(); scene.add(Z1);
		const ph = [-1.25, 1.25].map(x => { const p = photoMesh('aniversario', 1, 1.9); p.position.set(x, 0, 0); Z1.add(p); return p; });
		const qm = ph.map(p => { const q = textPlane('?', { weight: 200, size: 160, height: .38, track: 0, color: C.luz }); q.position.set(p.position.x, -1.05, .05); Z1.add(q); return q; });
		const bridge = polyline([[-.3, 0, .02], [.3, 0, .02]], new THREE.LineBasicMaterial({ color: C.sinapse, transparent: true, opacity: .9 })); Z1.add(bridge);
		const spark = glow(C.sinapse, .35, 1); Z1.add(spark);
		const d1 = dust(rng, 300, [9, 5, 6], [0, 0, -1], { color: C.consciente, size: 1.4, opacity: .5 }); Z1.add(d1);

		// ── zona 2: cabeça de partículas ──
		const Z2 = new THREE.Group(); Z2.position.set(40, 0, 0); scene.add(Z2);
		const HP = await headPositions(ctx, 11000, 3, rng);
		const head = morphPoints(HP, HP, HP, { color: C.sinapse, size: 1.7, rng }); Z2.add(head);
		ctx.shared.headPositions = HP;
		const fly = photoMesh('aniversario', 1, .9); Z2.add(fly);
		const temple = new THREE.Vector3(.68, .55, .05);
		// partículas da foto → cabeça → título
		const N = 3200, A = new Float32Array(N * 3), B = new Float32Array(N * 3);
		for (let i = 0; i < N; i++) {
			A[i * 3] = temple.x + .25 + (rng() - .5) * .9; A[i * 3 + 1] = temple.y + (rng() - .5) * .68; A[i * 3 + 2] = temple.z + .25 + (rng() - .5) * .05;
			const j = Math.floor(rng() * (HP.length / 3)) * 3;
			B[i * 3] = HP[j]; B[i * 3 + 1] = HP[j + 1]; B[i * 3 + 2] = HP[j + 2];
		}
		const T = textPoints('LEMBRANÇAS QUE\nNUNCA EXISTIRAM', { width: 3.0, n: N, rng, size: 120 });
		for (let i = 0; i < N; i++) { T[i * 3] += 3.15; T[i * 3 + 1] += .15; }
		const burst = morphPoints(A, B, T, { color: C.luz, size: 2.1, rng }); Z2.add(burst);
		const d2 = dust(rng, 260, [14, 6, 8], [1.5, 0, -2], { color: C.sinapse, size: 1.1, opacity: .35 }); Z2.add(d2);

		const orbit = (a0, a1, r0, r1, l0, l1) => (cam, k, t) => {
			const a = lerp(a0, a1, k), r = lerp(r0, r1, k);
			cam.position.set(Z2.position.x + Math.sin(a) * r, .35 + Math.sin(t * .3) * .05, Math.cos(a) * r);
			cam.up.set(0, 1, 0); cam.lookAt(Z2.position.x + lerp(l0, l1, k), .2, 0);
		};
		const SH = [
			{ a: S + 0, b: S + 8, p0: [-2.6, .25, 3.4], p1: [2.6, .1, 3.1], l0: [-.7, 0, 0], l1: [.7, 0, 0] },
			{ a: S + 8, b: S + 14, fn: orbit(1.05, .78, 4.4, 4.0, 0, .1) },
			{ a: S + 14, b: S + 19.5, fn: orbit(.78, .1, 4.0, 8.4, .1, 1.6), e: ease.cubicInOut },
			{ a: S + 19.5, b: S + 23, fn: orbit(.1, .02, 8.4, 8.0, 1.6, 1.62) },
		];

		return {
			scene, camera, bloom: { strength: .6, radius: .55, threshold: .82 },
			update(lt) {
				const t = lt + S;
				shots(camera, t, SH);
				// zona 1
				ph.forEach((p, i) => { p.position.y = Math.sin(t * .7 + i * 2) * .05; p.rotation.y = (i ? -1 : 1) * (.12 + Math.sin(t * .4) * .03); });
				qm.forEach((q, i) => op(q, inOut(t, 47.4 + i * .3, 48.6 + i * .3, 52.5, 53)));
				const pu = .5 + .5 * Math.sin(t * 4);
				bridge.material.opacity = .35 + .6 * pu;
				spark.position.set(Math.sin(t * 1.6) * .3, 0, .03); spark.material.opacity = .6 + .4 * pu;
				d1.tick(t);
				// zona 2
				head.u.uTime.value = burst.u.uTime.value = t; d2.tick(t);
				head.u.uOpacity.value = eo(t, 53, 54.2) * .6;
				const fk = ease.cubicInOut(seg(t, 54, 56));
				fly.position.set(lerp(3.6, temple.x + .25, fk), lerp(1.4, temple.y, fk), lerp(3.2, temple.z + .25, fk));
				fly.rotation.set(0, lerp(-.8, .7, fk), lerp(.4, 0, fk));
				fly.u.uOpacity.value = (t > 53.8 ? 1 : 0) * (1 - sm(t, 55.6, 56.6));
				fly.visible = fly.u.uOpacity.value > .01;
				fly.u.uMelt.value = sm(t, 55.2, 56.6) * .8; fly.u.uTime.value = t;
				burst.u.uOpacity.value = eo(t, 55.5, 56.2) * (1 - sm(t, 66.4, 68));
				burst.u.uM1.value = sm(t, 55.6, 57.8);
				burst.u.uM2.value = sm(t, 59.6, 62.8);
				burst.u.uScatter.value = sm(t, 66.3, 68) * .6;
				burst.u.uSize.value = lerp(2.1, 2.6, sm(t, 60, 62));
			},
		};
	},
};
