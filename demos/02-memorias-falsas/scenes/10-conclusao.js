// CONCLUSÃO + TELA FINAL (08:38 – 09:28) · de volta ao álbum, agora mais claro
import * as THREE from 'three';
import { C, seg, eo, sm, inOut, lerp, ease, shots, dips, uiLayer, uiMap, cue, pieceShape, glow, mulberry32 } from '../lib.js';
import { tableAndLamp, album, photoMat, drawerWall } from '../worlds.js';

const S = 518;
export default {
	id: 'conclusao', dur: 50,
	async init(ctx) {
		const scene = new THREE.Scene();
		scene.background = new THREE.Color(C.abismo);
		scene.fog = new THREE.FogExp2(C.abismo, .04);
		const camera = new THREE.PerspectiveCamera(35, ctx.W / ctx.H, .05, 200);
		const rng = ctx.rng(1111);
		const env = tableAndLamp(scene, rng, { size: [14, 70], target: [0.6, 0, 0] });
		env.table.position.z = -20;
		const A = album(scene);
		A.cover.rotation.z = Math.PI; A.g.position.x = 0;
		A.photos.balao.visible = A.photos.shopping.visible = false;
		A.caption.visible = false;
		const walls = [-1, 1].map(side => { const w = drawerWall({ cols: 64, rows: 13, rng, color: '#1c1b2c' }); w.g.rotation.y = side * -Math.PI / 2; w.g.position.set(side * 6.2, 0, -18); scene.add(w.g); w.labels(.6); return w; });
		scene.add(new THREE.HemisphereLight('#4b3f8a', '#000', .35));

		// quebra-cabeça da foto do aniversário
		const ph = A.aniv, PW = 1.9, PH = 1.425, NX = 4, NY = 3, s = PW / NX;
		const r2 = mulberry32(5);
		const hT = [], vT = []; // tabs internos
		for (let j = 0; j < NY; j++) { hT[j] = []; for (let i = 0; i < NX - 1; i++) hT[j][i] = r2() < .5 ? -1 : 1; }
		for (let j = 0; j < NY - 1; j++) { vT[j] = []; for (let i = 0; i < NX; i++) vT[j][i] = r2() < .5 ? -1 : 1; }
		const PG = new THREE.Group(); PG.position.copy(ph.position); PG.rotation.copy(ph.rotation); PG.position.y += .003; A.leaf.add(PG);
		const pieces = [];
		for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
			const top = j < NY - 1 ? vT[j][i] : 0, bottom = j > 0 ? -vT[j - 1][i] : 0, right = i < NX - 1 ? hT[j][i] : 0, left = i > 0 ? -hT[j][i - 1] : 0;
			const sy = PH / NY;
			const shp = pieceShape(s, [top, right, bottom, left], 16);
			const geo = new THREE.ShapeGeometry(shp); geo.scale(1, sy / s, 1);
			const cx = -PW / 2 + s * (i + .5), cy = -PH / 2 + sy * (j + .5);
			const p = geo.attributes.position, uv = geo.attributes.uv;
			for (let k = 0; k < p.count; k++) uv.setXY(k, (p.getX(k) + cx) / PW + .5, (p.getY(k) + cy) / PH + .5);
			const mat = photoMat(ph.tex); mat.uniforms.uSepia.value = 1;
			const m = new THREE.Mesh(geo, mat); m.position.set(cx, cy, 0); PG.add(m);
			const dress = i === 2 && j === 0 || (i === 1 && j === 0);
			pieces.push({ m, home: new THREE.Vector3(cx, cy, 0), up: .35 + r2() * .45, rx: (r2() - .5) * 1.2, ry: (r2() - .5) * 1.2, rz: (r2() - .5) * .8, hue: i === 2 && j === 0, dl: r2() * .6 });
		}
		PG.visible = false;
		// três fluxos de luz
		const streams = [C.sinapse, C.consciente, C.emocao].map((c, si) => {
			const curve = new THREE.CubicBezierCurve3(new THREE.Vector3(-2.6 + si * 2.6, 3.2, -1.6), new THREE.Vector3(-1.6 + si * 1.8, 2.2, -1.2), new THREE.Vector3(1.2 + si * .3, 1.0, -.4), new THREE.Vector3(1.45, .15, -.2));
			const dots = Array.from({ length: 16 }, () => { const g = glow(c, .14, 0); scene.add(g); return g; });
			return { curve, dots };
		});

		const ui = uiLayer(`
			<div data-k="m1" class="lbl c" style="left:140px;top:120px">o que você sabe hoje</div>
			<div data-k="m2" class="lbl v" style="left:0;right:0;text-align:center;top:120px">o que te contaram</div>
			<div data-k="m3" class="lbl r" style="right:140px;top:120px">o que você sente agora</div>
			<div data-k="cr" class="src" style="font-size:18px">Cabeça 3D: Lee Perry-Smith / triplegangers.com (CC BY 3.0) · Fontes na descrição</div>`);
		const U = uiMap(ui);

		const SH = [
			{ a: 518, b: 524, p0: [1.45, 2.4, 1.2], p1: [1.45, 2.0, .9], l0: [1.45, 0, -.15], l1: [1.45, 0, -.12] },
			{ a: 524, b: 532, fn: (cam, k, t) => { const a = lerp(-.25, .25, k); cam.position.set(1.45 + Math.sin(a) * 2.2, 2.3, -.15 + Math.cos(a) * 2.2); cam.up.set(0, 1, 0); cam.lookAt(1.45, .3, -.2); } },
			{ a: 532, b: 540, p0: [1.0, 2.6, 2.6], p1: [.8, 3.0, 3.6], l0: [1.2, .6, -.6], l1: [1.0, .7, -.6] },
			{ a: 540, b: 548, p0: [.8, 3.0, 3.6], p1: [3.4, 5.4, 6.8], l0: [1.0, .7, -.6], l1: [3.6, .6, -1.5], e: ease.cubicInOut },
			{ a: 548, b: 568, p0: [3.4, 5.4, 6.8], p1: [3.9, 5.3, 6.5], l0: [3.6, .6, -1.5], l1: [4.0, .6, -1.6] },
		];
		const CUTS = [524, 532];
		const q = new THREE.Quaternion(), e = new THREE.Euler();
		return {
			scene, camera, ui, bloom: { strength: .4, radius: .5, threshold: .75 },
			fadeFn: lt => dips(lt + S, CUTS, .18) * .9,
			update(lt) {
				const t = lt + S;
				shots(camera, t, SH);
				env.set(1.15); env.dust.tick(t);
				env.spot.color.set('#ffc890');
				// quebra-cabeça
				const split = t > 524.4 && t < 531.8;
				PG.visible = split; ph.visible = !split;
				pieces.forEach(p => {
					const up = ease.cubicInOut(seg(t, 524.6 + p.dl * .5, 527.2 + p.dl * .5)), back = ease.cubicInOut(seg(t, 528.2 + p.dl * .4, 531.2 + p.dl * .4));
					const k = up * (1 - back);
					p.m.position.set(p.home.x * (1 + k * .25), p.home.y * (1 + k * .25), p.up * k);
					p.m.rotation.set(p.rx * k, p.ry * k, p.rz * k + Math.sin(t * 1.5 + p.dl * 9) * .05 * k);
					p.m.material.uniforms.uHue.value = p.hue ? -.8 * sm(t, 528, 530.5) : 0;
					p.m.material.uniforms.uSepia.value = 1;
				});
				// depois da remontagem, a foto inteira mantém a peça diferente
				ph.u.uHue.value = t > 531 ? -.8 : 0;
				// fluxos de luz
				streams.forEach((st, si) => st.dots.forEach((d, i) => { const u = ((t - 532) * .28 + i / 16 + si * .11) % 1; st.curve.getPoint(u, d.position); d.material.opacity = (t > 532.6 ? 1 : 0) * (1 - sm(t, 539, 540.5)) * Math.sin(u * Math.PI) * .9; }));
				cue(U.m1, t, 533, 539.8); cue(U.m2, t, 534.4, 539.8); cue(U.m3, t, 535.8, 539.8);
				// álbum fecha
				const cl = ease.cubicInOut(seg(t, 541, 545.6));
				A.cover.rotation.z = Math.PI * (1 - cl);
				cue(U.cr, t, 549, 567.5);
			},
		};
	},
};
