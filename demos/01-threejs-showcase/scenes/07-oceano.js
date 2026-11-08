import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { smooth, normalize } from '../lib.js';

export default {
	id: 'natureza', num: '07', dur: 9,
	title: 'Natureza: oceano, céu e animais',
	tags: ['Water (reflexo + ondas)', 'Sky (atmosfera física)', 'pôr do sol animado', 'animais com morph animation'],
	uses: 'abrir um capítulo, metáforas visuais (calma, solidão, tempo passando)',
	async init(ctx) {
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(50, ctx.W / ctx.H, 1, 20000);
		const normals = await ctx.tex('textures/waternormals.jpg');
		normals.wrapS = normals.wrapT = THREE.RepeatWrapping;
		const water = new Water(new THREE.PlaneGeometry(10000, 10000), {
			textureWidth: 1024, textureHeight: 1024, waterNormals: normals,
			sunDirection: new THREE.Vector3(), sunColor: 0xffffff, waterColor: 0x001e2f, distortionScale: 3.7
		});
		water.rotation.x = -Math.PI / 2; scene.add(water);
		const sky = new Sky(); sky.scale.setScalar(10000); scene.add(sky);
		const su = sky.material.uniforms;
		Object.assign({}, su);
		su.turbidity.value = 8; su.rayleigh.value = 2.2; su.mieCoefficient.value = .005; su.mieDirectionalG.value = .85;
		if (su.cloudCoverage) { su.cloudCoverage.value = .35; su.cloudDensity.value = .45; su.cloudElevation.value = .55; }
		const sun = new THREE.Vector3();

		// boias flutuando
		const buoys = [];
		const bm = new THREE.MeshStandardMaterial({ color: '#ff5a2a', roughness: .4 });
		for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.9, 1.3, 3, 16), bm); b.position.set(-14 + i * 15, 0, -40 - i * 18); scene.add(b); buoys.push(b); }
		const light = new THREE.DirectionalLight('#ffd2a1', 2); scene.add(light);
		scene.add(new THREE.HemisphereLight('#9fc4ff', '#0a1a2a', .6));

		// bando de cegonhas (morph animation)
		const gl = await ctx.gltf('models/gltf/Stork.glb');
		const birds = [];
		for (let i = 0; i < 7; i++) {
			const m = gl.scene.children[0].clone(); const g = new THREE.Group(); g.add(m); normalize(g, 2.4);
			const mx = new THREE.AnimationMixer(m); mx.clipAction(gl.animations[0]).setDuration(1.1).play();
			scene.add(g); birds.push({ g, mx, off: [0, 6, -5, 12, -9, 3, 17][i], y: 26 + [0, 3, -2, 5, 1, -4, 2][i], z: -110 - [0, 8, 14, 4, 20, 26, 12][i], ph: i * .17 });
		}

		return {
			scene, camera, exposure: .1, bloom: { strength: 0 },
			update(t) {
				const elev = 9 - smooth(t, 0, 9) * 9.2;      // sol se pondo
				sun.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - elev), THREE.MathUtils.degToRad(180));
				su.sunPosition.value.copy(sun); if (su.time) su.time.value = t;
				water.material.uniforms.sunDirection.value.copy(sun).normalize();
				water.material.uniforms.time.value = t * .8;
				light.position.copy(sun).multiplyScalar(100);
				ctx.renderer.toneMappingExposure = .09 + smooth(t, 3, 9) * .1;
				camera.position.set(Math.sin(t * .05) * 10, 7 + Math.sin(t * .5) * .4, 30 - t * 2.2);
				camera.lookAt(camera.position.x * .5, 9, -200);
				buoys.forEach((b, i) => { b.position.y = Math.sin(t * 1.3 + i) * .4; b.rotation.z = Math.sin(t * 1.1 + i * 2) * .12; b.rotation.x = Math.cos(t * .9 + i) * .1; });
				birds.forEach(b => {
					b.g.position.set(-70 + b.off + t * 13, b.y + Math.sin(t * 1.2 + b.ph * 9) * .8, b.z);
					b.g.rotation.y = Math.PI / 2;
					b.mx.setTime(t + b.ph);
				});
			}
		};
	}
};
