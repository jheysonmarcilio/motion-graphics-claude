// ABERTURA — o álbum (00:00 – 00:45)
import * as THREE from 'three';
import { C, seg, eo, sm, inOut, lerp, ease, shots, textPlane, op } from '../lib.js';
import { tableAndLamp, album, drawerWall } from '../worlds.js';

export default {
	id: 'abertura', dur: 45,
	async init(ctx) {
		const scene = new THREE.Scene();
		scene.background = new THREE.Color(C.abismo);
		scene.fog = new THREE.FogExp2(C.abismo, .03);
		const camera = new THREE.PerspectiveCamera(35, ctx.W / ctx.H, .05, 200);
		const rng = ctx.rng(101);

		const env = tableAndLamp(scene, rng, { size: [14, 70], target: [0.4, 0, 0] });
		env.table.position.z = -20;
		const A = album(scene);
		const P = A.photos;
		Object.values(P).forEach(p => p.u.uSepia.value = 1);
		['balao', 'shopping'].forEach(k => { P[k].visible = false; });

		// pergunta projetada na página
		const q = textPlane('COMO VOCÊ SABE?', { size: 120, color: '#FFD2A0', height: .26, glow: 22 });
		q.rotation.x = -Math.PI / 2; q.position.set(1.45, .15, -.2); scene.add(q);

		// gota de tinta
		const drop = new THREE.Mesh(new THREE.SphereGeometry(.035, 16, 12), new THREE.MeshStandardMaterial({ color: '#0a0710', roughness: .05, metalness: .2 }));
		scene.add(drop);
		const trail = new THREE.Mesh(new THREE.PlaneGeometry(.05, 1), new THREE.MeshBasicMaterial({ color: '#0a0710', transparent: true, opacity: .85 }));
		trail.rotation.x = -Math.PI / 2; scene.add(trail);

		// corredor de arquivo infinito
		const walls = [];
		for (const side of [-1, 1]) {
			const w = drawerWall({ cols: 64, rows: 13, rng, color: '#1c1b2c', labelColor: C.consciente });
			w.g.rotation.y = side * -Math.PI / 2; w.g.position.set(side * 6.2, 0, -18);
			scene.add(w.g); walls.push(w);
		}
		const corridorLight = new THREE.HemisphereLight('#4b3f8a', '#000', 0); scene.add(corridorLight);

		// cortes de câmera (planos de 7–8 s)
		const SH = [
			{ a: 0, b: 8, p0: [0, 9, 10], p1: [0, 5.6, 5.4], l0: [0, 0, 0], l1: [0, .1, 0] },
			{ a: 8, b: 16, p0: [.2, 7.4, 1.8], p1: [.1, 5.6, 1.15], l0: [0, 0, 0], l1: [0, 0, 0], roll: [0, .05] },
			{ a: 16, b: 23, p0: [1.45, 2.35, 1.15], p1: [1.45, 1.9, .82], l0: [1.45, 0, -.12], l1: [1.45, 0, -.1] },
			{ a: 23, b: 31, p0: [.85, 1.85, 1.95], p1: [2.05, 1.85, 1.8], l0: [.9, 0, .45], l1: [1.9, 0, .35] },
			{ a: 31, b: 38, p0: [-.6, 3.6, 3.3], p1: [1.7, 3.0, 2.7], l0: [0, 0, 0], l1: [1.5, 0, 0] },
			{ a: 38, b: 45, p0: [2.1, 1.7, 2.1], p1: [0, 7.5, 16], l0: [2.1, 0, .45], l1: [0, 1.6, -8], e: ease.cubicInOut },
		];

		return {
			scene, camera, bloom: { strength: .35, radius: .5, threshold: .78 },
			update(t) {
				shots(camera, t, SH);
				env.set(eo(t, .4, 6.5));
				env.dust.tick(t);
				// álbum abre
				const open = ease.cubicInOut(seg(t, 8.6, 11.4));
				A.cover.rotation.z = Math.PI * open;
				A.g.position.x = lerp(-1.5, 0, open);
				// pergunta
				op(q, inOut(t, 17.4, 18.8, 22.3, 23) * .95);
				// legenda à mão + tinta escorrendo
				A.caption.material.uniforms.uReveal.value = seg(t, 24.2, 26.4) * 1.05;
				op(A.caption, 1 - sm(t, 28.5, 30.8));
				A.caption.visible = t > 24;
				const melt = sm(t, 27.4, 31.4) * .85;
				['aniversario', 'quintal', 'praia', 'corredor'].forEach((k, i) => { P[k].u.uMelt.value = melt * (k === 'aniversario' ? 1 : .55); P[k].u.uTime.value = t; });
				// folha vira → fotos novas reveladas como polaroid
				const flip = ease.cubicInOut(seg(t, 31.4, 33.8));
				A.leaf.rotation.z = Math.PI * flip;
				A.leaf.position.y = .125 + .06 * Math.sin(flip * Math.PI) + .055 * flip;
				P.balao.visible = P.shopping.visible = t > 31.4;
				P.balao.u.uDev.value = sm(t, 33.6, 36.4);
				P.shopping.u.uDev.value = sm(t, 34.4, 37.2);
				// gota (lágrima) escorrendo da foto do shopping
				const dk = sm(t, 38.6, 43);
				drop.visible = trail.visible = t > 38.4;
				const sx = 2.1 + A.g.position.x, z0 = .35 + .47;
				drop.position.set(sx + .05, .15, z0 + dk * .9);
				drop.scale.set(1, .6, 1 + dk * 1.2);
				trail.scale.y = Math.max(.001, dk * .9); trail.position.set(sx + .05, .13, z0 + dk * .45);
				// corredor
				const cor = sm(t, 38.5, 44);
				walls.forEach(w => { w.g.visible = t > 37.5; w.labels(cor); });
				corridorLight.intensity = .6 * cor;
				scene.fog.density = lerp(.03, .045, cor);
			},
		};
	},
};
