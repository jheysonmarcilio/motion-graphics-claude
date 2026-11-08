import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { seg, ease, inOut, uiLayer, fade } from '../lib.js';

export default {
	id: 'abertura', dur: 6,
	async init(ctx) {
		const scene = new THREE.Scene();
		scene.background = new THREE.Color('#05060a');
		scene.environment = await ctx.envHDR('textures/equirectangular/venice_sunset_1k.hdr');
		scene.environmentIntensity = 1.0;
		const camera = new THREE.PerspectiveCamera(35, ctx.W / ctx.H, .1, 200);

		// Texto 3D extrudado com material metálico refletindo um HDR
		const font = await ctx.font('fonts/helvetiker_bold.typeface.json');
		const geo = new TextGeometry('three.js', { font, size: 1, depth: .32, curveSegments: 10, bevelEnabled: true, bevelThickness: .04, bevelSize: .025, bevelSegments: 5 });
		geo.center();
		const text = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: '#ffffff', metalness: 1, roughness: .12, clearcoat: 1 }));
		scene.add(text);

		// Centenas de objetos com UMA chamada de desenho (InstancedMesh)
		const rng = ctx.rng(7), N = 380;
		const shapes = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.12, 0), new THREE.MeshStandardMaterial({ metalness: .3, roughness: .55, flatShading: true }), N);
		const data = [];
		const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), sc = new THREE.Vector3(), eul = new THREE.Euler();
		const pal = ['#7fe7ff', '#b38cff', '#ff6b9a', '#ffd166', '#ffffff'].map(c => new THREE.Color(c));
		for (let i = 0; i < N; i++) {
			const r = 5 + rng() * 14, a = rng() * Math.PI * 2, y = (rng() - .5) * 9;
			data.push({ r, a, y, s: .3 + rng() * .9, sp: (.05 + rng() * .15) * (rng() < .5 ? -1 : 1), rx: rng() * 6, ry: rng() * 6 });
			shapes.setColorAt(i, pal[i % pal.length]);
		}
		shapes.frustumCulled = false; scene.add(shapes);
		const key = new THREE.DirectionalLight('#ffffff', 2); key.position.set(3, 5, 4); scene.add(key);

		const ui = uiLayer(`
			<div class="i-sub" style="position:absolute;left:0;right:0;top:700px;text-align:center;font-size:34px;font-weight:300;letter-spacing:.35em;text-transform:uppercase;color:#cfd8e3">o que dá pra criar em 2 minutos</div>
			<div class="i-sm" style="position:absolute;left:0;right:0;top:760px;text-align:center;font:400 18px 'JetBrains Mono',monospace;color:#7fe7ff;letter-spacing:.2em">13 cenas · tudo feito em código · tudo em tempo real</div>`);
		const sub = ui.querySelector('.i-sub'), sm = ui.querySelector('.i-sm');

		return {
			scene, camera, ui, bloom: { strength: .35, radius: .4, threshold: .8 },
			update(t) {
				const k = ease.expoOut(seg(t, .2, 2.6));
				text.rotation.y = (1 - k) * -1.4 + Math.sin(t * .6) * .12;
				text.rotation.x = (1 - k) * .5;
				text.scale.setScalar(.6 + .4 * k);
				camera.position.set(Math.sin(t * .2) * 1.2, .4 + Math.cos(t * .3) * .2, 11 - t * .5);
				camera.lookAt(0, -.3, 0);
				for (let i = 0; i < N; i++) {
					const d = data[i], a = d.a + t * d.sp;
					p.set(Math.cos(a) * d.r * 1.3, d.y + Math.sin(t * .5 + i) * .3, -4 - (Math.sin(a) * .5 + .5) * d.r);
					q.setFromEuler(eul.set(d.rx + t * .5, d.ry + t * .7, 0));
					sc.setScalar(d.s * ease.expoOut(seg(t, .1 + (i % 40) * .02, 1.6 + (i % 40) * .02)));
					shapes.setMatrixAt(i, m.compose(p, q, sc));
				}
				shapes.instanceMatrix.needsUpdate = true;
				fade(sub, inOut(t, 1.4, 2.4, 5.2, 5.8), (1 - ease.expoOut(seg(t, 1.4, 2.4))) * 20);
				fade(sm, inOut(t, 2.0, 3.0, 5.2, 5.8) * .9);
			}
		};
	}
};
