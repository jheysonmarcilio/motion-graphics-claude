import * as THREE from 'three';
import { seg, ease, inOut, uiLayer, fade } from '../lib.js';

// Simulação física própria (determinística) pré-calculada: gravidade, colisão esfera-esfera, obstáculos e paredes.
function simulate(rng, N, seconds) {
	const FPS = 60, SUB = 2, dt = 1 / (FPS * SUB), G = 9.8, E = .45, B = 2.1;
	const p = new Float32Array(N * 3), v = new Float32Array(N * 3), r = new Float32Array(N), born = new Float32Array(N);
	for (let i = 0; i < N; i++) {
		r[i] = .14 + rng() * .16; born[i] = .2 + i * .016;
		p[i * 3] = (rng() - .5) * .9; p[i * 3 + 1] = 7.5; p[i * 3 + 2] = (rng() - .5) * .9;
		v[i * 3] = (rng() - .5) * .6; v[i * 3 + 1] = -1; v[i * 3 + 2] = (rng() - .5) * .6;
	}
	const obs = [[-.9, 4.4, 0, .55], [.9, 4.4, .1, .55], [0, 3.1, -.3, .5], [-1.1, 2, .5, .4], [1.1, 2, -.4, .4]];
	const frames = [], total = Math.ceil(seconds * FPS);
	let time = 0;
	for (let f = 0; f <= total; f++) {
		frames.push(p.slice());
		for (let s = 0; s < SUB; s++) {
			time += dt;
			for (let i = 0; i < N; i++) {
				if (time < born[i]) continue;
				const k = i * 3; v[k + 1] -= G * dt;
				p[k] += v[k] * dt; p[k + 1] += v[k + 1] * dt; p[k + 2] += v[k + 2] * dt;
				const ri = r[i];
				if (p[k + 1] < ri) { p[k + 1] = ri; if (v[k + 1] < 0) v[k + 1] *= -E; v[k] *= .985; v[k + 2] *= .985; }
				for (const ax of [0, 2]) {
					if (p[k + ax] < -B + ri) { p[k + ax] = -B + ri; if (v[k + ax] < 0) v[k + ax] *= -E; }
					if (p[k + ax] > B - ri) { p[k + ax] = B - ri; if (v[k + ax] > 0) v[k + ax] *= -E; }
				}
				for (const [ox, oy, oz, or] of obs) {
					const dx = p[k] - ox, dy = p[k + 1] - oy, dz = p[k + 2] - oz, d = Math.hypot(dx, dy, dz), m = or + ri;
					if (d < m && d > 1e-6) {
						const nx = dx / d, ny = dy / d, nz = dz / d; p[k] = ox + nx * m; p[k + 1] = oy + ny * m; p[k + 2] = oz + nz * m;
						const vn = v[k] * nx + v[k + 1] * ny + v[k + 2] * nz;
						if (vn < 0) { v[k] -= (1 + E) * vn * nx; v[k + 1] -= (1 + E) * vn * ny; v[k + 2] -= (1 + E) * vn * nz; }
					}
				}
			}
			for (let i = 0; i < N; i++) {
				if (time < born[i]) continue;
				const a = i * 3;
				for (let j = i + 1; j < N; j++) {
					if (time < born[j]) continue;
					const b = j * 3, dx = p[a] - p[b], dy = p[a + 1] - p[b + 1], dz = p[a + 2] - p[b + 2], m = r[i] + r[j];
					const d2 = dx * dx + dy * dy + dz * dz;
					if (d2 >= m * m || d2 < 1e-10) continue;
					const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, nz = dz / d, ov = (m - d) * .5;
					p[a] += nx * ov; p[a + 1] += ny * ov; p[a + 2] += nz * ov; p[b] -= nx * ov; p[b + 1] -= ny * ov; p[b + 2] -= nz * ov;
					const vn = (v[a] - v[b]) * nx + (v[a + 1] - v[b + 1]) * ny + (v[a + 2] - v[b + 2]) * nz;
					if (vn < 0) { const J = -(1 + E) * vn * .5; v[a] += J * nx; v[a + 1] += J * ny; v[a + 2] += J * nz; v[b] -= J * nx; v[b + 1] -= J * ny; v[b + 2] -= J * nz; }
				}
			}
		}
	}
	return { frames, r, born, obs, FPS };
}

export default {
	id: 'física', num: '05', dur: 9,
	title: 'Simulação física',
	tags: ['gravidade e colisões', '300+ objetos (InstancedMesh)', 'câmera lenta', 'sombras suaves'],
	uses: 'explicar causa e efeito, “efeito dominó”, multidões, experimentos de ciência',
	async init(ctx) {
		const N = 320;
		const sim = simulate(ctx.rng(5), N, 9.5);
		const scene = new THREE.Scene();
		scene.background = new THREE.Color('#e6e9f0');
		scene.fog = new THREE.Fog('#e6e9f0', 14, 40);
		scene.environment = ctx.room(); scene.environmentIntensity = .5;
		const camera = new THREE.PerspectiveCamera(38, ctx.W / ctx.H, .1, 100);
		scene.add(new THREE.HemisphereLight('#ffffff', '#b9c0cc', 1.4));
		const sun = new THREE.DirectionalLight('#ffffff', 2.4); sun.position.set(4, 10, 5); sun.castShadow = true;
		sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 }); sun.shadow.radius = 4;
		scene.add(sun);
		const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshStandardMaterial({ color: '#f1f3f7', roughness: .8 }));
		floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
		const glass = new THREE.MeshStandardMaterial({ color: '#9fc4ff', transparent: true, opacity: .14, roughness: .1, depthWrite: false });
		[[0, 1.2, -2.15, 4.3, 2.4, .05], [0, 1.2, 2.15, 4.3, 2.4, .05], [-2.15, 1.2, 0, .05, 2.4, 4.3], [2.15, 1.2, 0, .05, 2.4, 4.3]].forEach(([x, y, z, w, h, d]) => {
			const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), glass); m.position.set(x, y, z); scene.add(m);
			const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: '#7a8aa6' })); e.position.copy(m.position); scene.add(e);
		});
		sim.obs.forEach(([x, y, z, r]) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), new THREE.MeshStandardMaterial({ color: '#3a4256', metalness: .8, roughness: .2 })); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; scene.add(o); });

		const balls = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshStandardMaterial({ roughness: .35, metalness: .05 }), N);
		balls.castShadow = balls.receiveShadow = true; balls.frustumCulled = false;
		const pal = ['#ff5a5f', '#ffb400', '#00a699', '#3d5afe', '#7b2cbf', '#ff7a00'].map(c => new THREE.Color(c));
		for (let i = 0; i < N; i++) balls.setColorAt(i, pal[i % pal.length]);
		scene.add(balls);

		// relógio da cena: desacelera para 0.2× entre 3.6s e 6.2s
		const speed = t => 1 - .8 * inOut(t, 3.4, 3.9, 5.8, 6.3, ease.sineInOut, ease.sineInOut);
		const simTime = t => { let s = 0; for (let x = 0; x < t; x += .01) s += speed(x) * .01; return s; };
		const ui = uiLayer(`<div class="slow" style="position:absolute;right:90px;top:120px;font:700 28px 'JetBrains Mono',monospace;color:#111;background:#ffd166;padding:10px 18px;border-radius:4px">CÂMERA LENTA · <span>0.20</span>×</div>`);
		const slow = ui.querySelector('.slow'), slowN = slow.querySelector('span');
		const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), pv = new THREE.Vector3(), sv = new THREE.Vector3();

		return {
			scene, camera, ui, exposure: 1, bloom: { strength: 0 },
			update(t) {
				const st = simTime(t), fi = st * sim.FPS, f0 = Math.min(Math.floor(fi), sim.frames.length - 2), a = fi - f0;
				const A = sim.frames[f0], Bf = sim.frames[f0 + 1];
				for (let i = 0; i < N; i++) {
					const k = i * 3, alive = st >= sim.born[i];
					pv.set(A[k] + (Bf[k] - A[k]) * a, A[k + 1] + (Bf[k + 1] - A[k + 1]) * a, A[k + 2] + (Bf[k + 2] - A[k + 2]) * a);
					sv.setScalar(alive ? sim.r[i] : 0);
					balls.setMatrixAt(i, m4.compose(pv, q, sv));
				}
				balls.instanceMatrix.needsUpdate = true;
				const ang = .4 + t * .12 - inOut(t, 3.4, 3.9, 5.8, 6.3) * .3;
				const d = 11 - inOut(t, 3.4, 4.2, 5.8, 6.6) * 3.5;
				camera.position.set(Math.sin(ang) * d, 4.2 + Math.sin(t * .3) * .4, Math.cos(ang) * d);
				camera.lookAt(0, 2.3, 0);
				const sl = inOut(t, 3.4, 3.7, 6.0, 6.3);
				fade(slow, sl); slowN.textContent = speed(t).toFixed(2);
			}
		};
	}
};
