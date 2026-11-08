// NOVA PERGUNTA — ponte entre laboratório e consultório (05:08 – 05:22)
import * as THREE from 'three';
import { C, seg, eo, sm, inOut, lerp, ease, shots, lineMat, edges, setLineOpacity, lightCone, dust } from '../lib.js';
import { paintedBalloonTex } from '../draw.js';
import { drawerWall, folder3D } from '../worlds.js';
import { paintMat } from './04-balao.js';
import { dotFloor } from './02-laboratorio.js';

const S = 308;
export default {
	id: 'ponte', dur: 14,
	async init(ctx) {
		const scene = new THREE.Scene();
		scene.background = new THREE.Color('#09081a');
		const camera = new THREE.PerspectiveCamera(35, ctx.W / ctx.H, .05, 200);
		const rng = ctx.rng(606);
		// esquerda: mundo de linhas
		const Lg = new THREE.Group(); scene.add(Lg);
		const L = lineMat(C.sinapse, .8);
		for (let i = 0; i < 9; i++) Lg.add(edges(new THREE.BoxGeometry(.6 + rng(), .8 + rng() * 2, .6 + rng()).translate((rng() - .5) * 3, .9, -1 - rng() * 3), L));
		const fl = dotFloor(-3, 3, -5, 2, .4); Lg.add(fl);
		// direita: mundo sólido violeta
		const Rg = new THREE.Group(); scene.add(Rg);
		const dw = drawerWall({ cols: 6, rows: 5, rng }); dw.g.position.set(0, 0, -3); Rg.add(dw.g);
		const cone = lightCone(C.ambar, 1.4, 2.6, .14); cone.position.set(-1.4, 2.8, -1); Rg.add(cone);
		Rg.add(new THREE.HemisphereLight('#8b6cff', '#0a0610', 1.1));
		const pl = new THREE.PointLight(C.ambar, 6, 7, 1.5); pl.position.set(-1.4, 2.4, -1); Rg.add(pl);
		// gaveta final (fixa no centro)
		const W2 = drawerWall({ cols: 7, rows: 5, rng: ctx.rng(607) }); W2.g.position.set(0, 0, -2.6); scene.add(W2.g);
		const HI = 2 * 7 + 4, hd = W2.info[HI];
		scene.add(new THREE.HemisphereLight('#6b5ccc', '#06040a', .6));
		const key = new THREE.DirectionalLight('#e0d8ff', 1.2); key.position.set(2, 4, 4); scene.add(key);
		// cena imaginada repintando
		const paint = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5), paintMat(paintedBalloonTex())); paint.position.set(0, 1.25, 0); scene.add(paint);
		const fold = folder3D('BALÃO', '#c9b78f'); fold.scale.setScalar(.5); scene.add(fold);
		const ds = dust(rng, 200, [8, 4, 6], [0, 1.5, -1], { color: '#cfc4ff', size: 1, opacity: .4 }); scene.add(ds);

		const SH = [
			{ a: 308, b: 316, p0: [0, 1.25, 7.2], p1: [0, 1.25, 5.4], l0: [0, 1.2, 0], l1: [0, 1.2, 0] },
			{ a: 316, b: 322, p0: [0, 1.35, 4.6], p1: [hd.x + .35, hd.y + .25, 1.1], l0: [0, 1.2, -.5], l1: [hd.x, hd.y, -2.4] },
		];
		return {
			scene, camera, bloom: { strength: .5, radius: .5, threshold: .7 },
			fadeFn: lt => 0,
			update(lt) {
				const t = lt + S;
				shots(camera, t, SH); ds.tick(t);
				const m = ease.cubicInOut(seg(t, 308.2, 313.5));
				Lg.position.x = lerp(-5.5, -1, m); Rg.position.x = lerp(5.5, 1, m);
				const gk = 1 - sm(t, 313, 315.5);
				setLineOpacity(Lg, gk); Rg.visible = gk > .01; dw.labels(gk); cone.material.uniforms.uOpacity.value = .14 * gk; pl.intensity = 6 * gk;
				W2.g.visible = t > 314; W2.labels(sm(t, 314, 316));
				// repinta em loop (cada vez mais nítido/saturado)
				const cyc = Math.min(2.999, Math.max(0, (t - 309) / 2.2)), ci = Math.floor(cyc), cf = cyc - ci;
				paint.material.uniforms.uReveal.value = t < 309 ? 0 : (ci < 2 ? Math.min(1, cf * 1.25) : Math.min(1, cf * 1.25));
				paint.material.uniforms.uSat.value = .3 + ci * .35;
				const fk = ease.cubicInOut(seg(t, 316.2, 317.4));
				paint.scale.set(1 - fk * .3, Math.max(.02, 1 - fk), 1); paint.material.uniforms.uOpacity.value = 1 - seg(t, 317, 317.4);
				paint.visible = t < 317.45;
				// vira pasta e entra na gaveta
				const out = (t < 318 ? sm(t, 315.6, 317) : 1 - sm(t, 320.2, 321)) * .6; W2.open(HI, out);
				const mv = ease.cubicInOut(seg(t, 317.2, 319.8));
				fold.visible = t > 317 && t < 320.6;
				fold.position.set(lerp(0, hd.x, mv), lerp(1.25, hd.y + .25, mv), lerp(.03, -2.6 + .35 + out, mv));
				fold.rotation.set(lerp(0, -Math.PI / 2 + .3, mv), 0, 0);
				fold.scale.setScalar(lerp(.6, .42, mv));
			},
		};
	},
};
