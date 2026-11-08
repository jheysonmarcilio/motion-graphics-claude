import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { seg, ease, smooth, normalize } from '../lib.js';

export default {
	id: 'personagens', num: '01', dur: 11,
	title: 'Pessoas 3D animadas',
	tags: ['GLTFLoader', 'SkinnedMesh', 'AnimationMixer', 'crossfade idle→andar→correr', 'sombras', 'SkeletonHelper'],
	uses: 'reconstituir o trajeto de alguém, simular um comportamento, “visão raio‑X” do corpo',
	async init(ctx) {
		const scene = new THREE.Scene();
		scene.background = new THREE.Color('#0d1017');
		scene.fog = new THREE.Fog('#0d1017', 12, 60);
		const camera = new THREE.PerspectiveCamera(40, ctx.W / ctx.H, .1, 300);

		// chão + grade + postes
		const ground = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshStandardMaterial({ color: '#1a1e27', roughness: .85, metalness: .1 }));
		ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
		const grid = new THREE.GridHelper(300, 150, '#2b3242', '#202633'); grid.position.y = .01; scene.add(grid);
		scene.add(new THREE.HemisphereLight('#8fb3ff', '#2a2010', 2.0));
		const sun = new THREE.DirectionalLight('#ffe2c0', 2.6);
		sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
		Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 60 });
		sun.shadow.bias = -.0005;
		scene.add(sun, sun.target);

		const path = new THREE.CatmullRomCurve3([
			[-20, 0, 0], [-10, 0, -8], [5, 0, -10], [18, 0, -2], [15, 0, 10], [0, 0, 14], [-15, 0, 9]
		].map(a => new THREE.Vector3(...a)), true);
		const LEN = path.getLength();

		// postes de luz ao longo do caminho
		const rng = ctx.rng(11);
		const poleMat = new THREE.MeshStandardMaterial({ color: '#30384a', metalness: .7, roughness: .4 });
		const bulbMat = new THREE.MeshBasicMaterial({ color: '#ffd9a0' });
		for (let i = 0; i < 24; i++) {
			const u = i / 24, pt = path.getPointAt(u), tg = path.getTangentAt(u);
			const side = new THREE.Vector3(-tg.z, 0, tg.x).multiplyScalar(i % 2 ? 3.2 : -3.2);
			const pole = new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, 4, 8), poleMat);
			pole.position.copy(pt).add(side).setY(2); pole.castShadow = true; scene.add(pole);
			const bulb = new THREE.Mesh(new THREE.SphereGeometry(.16, 12, 8), bulbMat); bulb.position.copy(pole.position).setY(4.05); scene.add(bulb);
		}
		for (let i = 0; i < 40; i++) {   // blocos/prédios baixos
			const b = new THREE.Mesh(new THREE.BoxGeometry(2 + rng() * 4, 1 + rng() * 6, 2 + rng() * 4), new THREE.MeshStandardMaterial({ color: '#232a38', roughness: .7 }));
			const a = rng() * Math.PI * 2, r = 26 + rng() * 25;
			b.position.set(Math.cos(a) * r, b.geometry.parameters.height / 2, Math.sin(a) * r);
			b.castShadow = b.receiveShadow = true; scene.add(b);
		}

		// Personagem principal: Soldier (Idle / Walk / Run)
		const sGl = await ctx.gltf('models/gltf/Soldier.glb');
		const soldier = new THREE.Group(), inner = sGl.scene;
		inner.rotation.y = Math.PI;               // modelo olha para -Z → vira para +Z
		normalize(inner, 1.8); soldier.add(inner); scene.add(soldier);
		const meshes = [];
		inner.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; meshes.push(o); o.userData.mat = o.material; } });
		const mixer = new THREE.AnimationMixer(inner);
		const clip = n => sGl.animations.find(a => a.name === n);
		const A = { idle: mixer.clipAction(clip('Idle')), walk: mixer.clipAction(clip('Walk')), run: mixer.clipAction(clip('Run')) };
		Object.values(A).forEach(a => a.play());
		const xray = new THREE.MeshBasicMaterial({ color: '#7fe7ff', wireframe: true, transparent: true, opacity: .35, blending: THREE.AdditiveBlending, depthWrite: false });
		const skel = new THREE.SkeletonHelper(inner); skel.material.linewidth = 2; skel.material.color = new THREE.Color('#ff4d6d'); skel.material.depthTest = false; skel.visible = false;
		scene.add(skel);

		// Multidão: clones do Xbot com SkeletonUtils
		const xGl = await ctx.gltf('models/gltf/Xbot.glb');
		const crowd = [];
		for (let i = 0; i < 5; i++) {
			const c = SkeletonUtils.clone(xGl.scene); normalize(c, 1.75);
			c.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
			const g = new THREE.Group(); g.add(c); scene.add(g);
			const mx = new THREE.AnimationMixer(c);
			mx.clipAction(xGl.animations.find(a => a.name === 'walk')).play();
			crowd.push({ g, mx, d0: [7, 12, -6, 18, 3][i], lat: [1.4, -1.2, -1.5, .9, -2][i], sp: 1.2 + i * .08, ph: i * .37 });
		}

		const w = t => {   // pesos das animações ao longo do tempo
			const toWalk = smooth(t, 1.2, 1.8), toRun = smooth(t, 4.8, 5.4), back = smooth(t, 7.8, 8.4);
			const run = toRun * (1 - back);
			return { idle: 1 - toWalk, walk: toWalk * (1 - run), run };
		};
		const speedAt = t => { const k = w(t); return k.walk * 1.45 + k.run * 4.6; };
		const distAt = t => { let d = 0; for (let x = 0; x < t; x += .02) d += speedAt(x) * .02; return d; };
		const tmp = new THREE.Vector3(), tg = new THREE.Vector3(), look = new THREE.Vector3();

		const place = (g, d, lat) => {
			const u = (((d / LEN) % 1) + 1) % 1;
			path.getPointAt(u, tmp); path.getTangentAt(u, tg);
			g.position.copy(tmp).add(new THREE.Vector3(-tg.z, 0, tg.x).multiplyScalar(lat));
			g.lookAt(look.copy(g.position).add(tg));
		};

		return {
			scene, camera, bloom: { strength: .5, radius: .4, threshold: .7 },
			update(t) {
				const k = w(t);
				A.idle.setEffectiveWeight(k.idle); A.walk.setEffectiveWeight(k.walk); A.run.setEffectiveWeight(k.run);
				mixer.setTime(t);
				const d = 2 + distAt(t);
				place(soldier, d, 0);
				const heading = Math.atan2(tg.x, tg.z);
				crowd.forEach(c => { place(c.g, c.d0 + c.sp * t, c.lat); c.mx.setTime(t + c.ph); });

				// raio-X a partir de 8.3s
				const xr = t > 8.3;
				meshes.forEach(m => m.material = xr ? xray : m.userData.mat);
				skel.visible = xr;
				scene.background.set(xr ? '#04060c' : '#0d1017');

				// câmera acompanha
				const ang = heading + Math.PI * .78 - t * .06 + smooth(t, 8.2, 10.5) * 1.4;
				const dist = 6.2 - smooth(t, 8.2, 10) * 2.6, hgt = 2.2 - smooth(t, 8.2, 10) * .9;
				camera.position.set(soldier.position.x + Math.sin(ang) * dist, hgt, soldier.position.z + Math.cos(ang) * dist);
				camera.lookAt(soldier.position.x, 1.05, soldier.position.z);
				sun.position.set(soldier.position.x + 8, 14, soldier.position.z + 5);
				sun.target.position.copy(soldier.position);
			}
		};
	}
};
