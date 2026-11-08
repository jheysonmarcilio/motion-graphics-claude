import * as THREE from 'three';
import { ImprovedNoise } from 'three/addons/math/ImprovedNoise.js';
import { seg, ease, smooth, label } from '../lib.js';

export default {
	id: 'rota', num: '03', dur: 11,
	title: 'Mapas, terrenos e rotas',
	tags: ['terreno procedural (noise)', 'shader de curvas de nível', 'TubeGeometry', 'CSS2DRenderer (etiquetas)', 'câmera drone'],
	uses: 'linha do tempo de um crime, rota de fuga, expedição histórica, aula de geografia',
	async init(ctx) {
		const scene = new THREE.Scene();
		const BG = new THREE.Color('#060a12');
		scene.background = BG;
		const camera = new THREE.PerspectiveCamera(42, ctx.W / ctx.H, .1, 500);

		// Terreno: ruído Perlin em várias oitavas, achatado no centro (cidade)
		const noise = new ImprovedNoise();
		const height = (x, z) => {
			let h = 0, a = 1, f = .025;
			for (let o = 0; o < 4; o++) { h += noise.noise(x * f, z * f, 1.7) * a; a *= .5; f *= 2.1; }
			const flat = THREE.MathUtils.smoothstep(Math.hypot(x - 2, z + 2), 6, 18);
			return h * 9 * flat;
		};
		const geo = new THREE.PlaneGeometry(120, 120, 240, 240); geo.rotateX(-Math.PI / 2);
		const pos = geo.attributes.position;
		for (let i = 0; i < pos.count; i++) pos.setY(i, height(pos.getX(i), pos.getZ(i)));
		const terrain = new THREE.Mesh(geo, new THREE.ShaderMaterial({
			uniforms: { uBg: { value: BG }, uCam: { value: camera.position } },
			vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
			fragmentShader: `
				uniform vec3 uBg, uCam; varying vec3 vW;
				void main(){
					vec3 n = normalize(cross(dFdx(vW), dFdy(vW)));
					float diff = max(dot(n, normalize(vec3(.4,1.,.3))), 0.);
					float h = clamp((vW.y + 4.) / 12., 0., 1.);
					vec3 base = mix(vec3(.03,.09,.12), vec3(.10,.26,.30), h);
					float lv = vW.y * 1.2; float c = abs(fract(lv) - .5) / fwidth(lv); float contour = 1. - min(c, 1.);
					vec2 gq = abs(fract(vW.xz / 5.) - .5) / fwidth(vW.xz / 5.); float grid = 1. - min(min(gq.x, gq.y), 1.);
					vec3 col = base * (.35 + .9 * diff) + contour * vec3(.2,.75,.8) * .35 + grid * vec3(.3,.5,.7) * .08;
					float fog = smoothstep(30., 90., distance(vW, uCam));
					gl_FragColor = vec4(mix(col, uBg, fog), 1.);
				}`
		}));
		scene.add(terrain);

		// Cidade no centro (InstancedMesh)
		const rng = ctx.rng(31), NB = 140;
		const city = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: '#16324a' }), NB);
		const edges = new THREE.InstancedMesh(new THREE.BoxGeometry(1.02, 1.02, 1.02), new THREE.MeshBasicMaterial({ color: '#3fb6d8', wireframe: true, transparent: true, opacity: .25 }), NB);
		const m4 = new THREE.Matrix4();
		for (let i = 0; i < NB; i++) {
			const x = 2 + (Math.floor(rng() * 12) - 6) * 1.6, z = -2 + (Math.floor(rng() * 12) - 6) * 1.6, h = .5 + rng() * rng() * 5;
			m4.compose(new THREE.Vector3(x, h / 2, z), new THREE.Quaternion(), new THREE.Vector3(1.1, h, 1.1));
			city.setMatrixAt(i, m4); edges.setMatrixAt(i, m4);
		}
		scene.add(city, edges);

		// Rota
		const pts = [[-34, -26], [-22, -14], [-9, -15], [2, -2], [9, 8], [22, 5], [33, 20]].map(([x, z]) => new THREE.Vector3(x, height(x, z) + .3, z));
		const curve = new THREE.CatmullRomCurve3(pts);
		// garante que o tubo passe por cima do relevo
		const dense = curve.getSpacedPoints(300).map(p => p.setY(height(p.x, p.z) + .35));
		const path = new THREE.CatmullRomCurve3(dense);
		const TS = 600, RS = 8;
		const tube = new THREE.Mesh(new THREE.TubeGeometry(path, TS, .22, RS), new THREE.MeshBasicMaterial({ color: '#ff3d63' }));
		const ghost = new THREE.Mesh(new THREE.TubeGeometry(path, 300, .08, 6), new THREE.MeshBasicMaterial({ color: '#ff3d63', transparent: true, opacity: .18 }));
		scene.add(tube, ghost);
		const head = new THREE.Mesh(new THREE.SphereGeometry(.55, 24, 16), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
		const ring = new THREE.Mesh(new THREE.RingGeometry(.8, 1, 48), new THREE.MeshBasicMaterial({ color: '#ff3d63', transparent: true, side: THREE.DoubleSide }));
		ring.rotation.x = -Math.PI / 2; scene.add(head, ring);

		// Pins com etiquetas
		const stops = [
			[0, '21:04', 'Saída do bar'], [2, '21:37', 'Posto 24h'], [4, '22:10', 'Câmera de rua'], [6, '22:15', 'Sinal perdido'],
		];
		const samples = path.getSpacedPoints(1000);
		const pins = stops.map(([idx, hr, txt]) => {
			const p = pts[idx]; let best = 0, bd = 1e9;
			samples.forEach((s, i) => { const d = s.distanceToSquared(p); if (d < bd) { bd = d; best = i; } });
			const g = new THREE.Group(); g.position.copy(samples[best]);
			const stick = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 4, 6), new THREE.MeshBasicMaterial({ color: '#ffffff' })); stick.position.y = 2;
			const top = new THREE.Mesh(new THREE.SphereGeometry(.3, 16, 12), new THREE.MeshBasicMaterial({ color: idx === 6 ? '#ffd166' : '#ff3d63' })); top.position.y = 4;
			const lb = label(`${txt}<small>${hr}</small>`, 'tag3d pin'); lb.position.y = 4.3;
			g.add(stick, top, lb); scene.add(g);
			return { g, u: best / 1000, el: lb.userData.el };
		});

		const look = new THREE.Vector3(), tgt = new THREE.Vector3();
		return {
			scene, camera, bloom: { strength: .8, radius: .4, threshold: .5 },
			update(t) {
				const p = ease.sineInOut(seg(t, .6, 9.2));
				tube.geometry.setDrawRange(0, Math.floor(p * TS) * RS * 6);
				path.getPointAt(Math.max(p, .0001), tgt);
				head.position.copy(tgt);
				const pul = (t * 1.3) % 1; ring.position.copy(tgt).setY(tgt.y + .05); ring.scale.setScalar(1 + pul * 3); ring.material.opacity = 1 - pul;
				pins.forEach(pn => {
					const k = ease.backOut(seg(p, pn.u - .02, pn.u + .04));
					pn.g.scale.setScalar(Math.max(.001, k));
					pn.el.style.opacity = seg(p, pn.u, pn.u + .05);
				});
				// câmera drone → visão de mapa
				const a = .5 + t * .07, top = smooth(t, 8.8, 10.8);
				const chase = new THREE.Vector3(tgt.x + Math.sin(a) * 30, tgt.y + 27, tgt.z + Math.cos(a) * 30);
				const over = new THREE.Vector3(0, 78, 30);
				camera.position.lerpVectors(chase, over, top);
				look.lerpVectors(tgt, new THREE.Vector3(0, 0, -2), top);
				camera.lookAt(look);
			}
		};
	}
};
