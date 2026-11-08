import * as THREE from 'three';
import { seg, ease, label } from '../lib.js';

export default {
	id: 'materiais', num: '10', dur: 9,
	title: 'Materiais realistas (ou não)',
	tags: ['MeshPhysicalMaterial', 'vidro com refração e dispersão', 'verniz', 'iridescência', 'veludo', 'toon', 'iluminação HDR'],
	uses: 'objetos de cena convincentes, estilo cartoon, peças de museu, produtos',
	async init(ctx) {
		const scene = new THREE.Scene();
		const env = await ctx.envHDR('textures/equirectangular/quarry_01_1k.hdr');
		scene.environment = env; scene.background = env; scene.backgroundBlurriness = .55; scene.backgroundIntensity = .35; scene.environmentIntensity = .5;
		const camera = new THREE.PerspectiveCamera(32, ctx.W / ctx.H, .1, 100);
		const sun = new THREE.DirectionalLight('#ffffff', 1.5); sun.position.set(3, 8, 4); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
		Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 6, bottom: -6 }); sun.shadow.radius = 6; scene.add(sun);
		const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: '#15171c', roughness: .25, metalness: .2 }));
		floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

		const knot = new THREE.TorusKnotGeometry(.48, .17, 220, 32), ball = new THREE.SphereGeometry(.68, 96, 64);
		const toonGrad = new THREE.DataTexture(new Uint8Array([60, 140, 255]), 3, 1, THREE.RedFormat); toonGrad.needsUpdate = true;
		const defs = [
			['Metal escovado', 'metalness + roughness', knot, new THREE.MeshPhysicalMaterial({ color: '#c9ccd2', metalness: 1, roughness: .3 })],
			['Vidro', 'transmission · ior · dispersion', ball, new THREE.MeshPhysicalMaterial({ color: '#ffffff', metalness: 0, roughness: 0, transmission: 1, thickness: 1.2, ior: 1.5, dispersion: 4, attenuationColor: '#bfefff', attenuationDistance: 2 })],
			['Pintura de carro', 'clearcoat', knot, new THREE.MeshPhysicalMaterial({ color: '#a8001c', metalness: .5, roughness: .45, clearcoat: 1, clearcoatRoughness: .03 })],
			['Iridescente', 'iridescence', ball, new THREE.MeshPhysicalMaterial({ color: '#ffffff', metalness: 1, roughness: .1, iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [100, 900] })],
			['Veludo', 'sheen', knot, new THREE.MeshPhysicalMaterial({ color: '#2a0630', roughness: .95, sheen: 1, sheenColor: '#ff7ad9', sheenRoughness: .35 })],
			['Ouro rugoso', 'metal + roughness alto', ball, new THREE.MeshPhysicalMaterial({ color: '#ffcf6b', metalness: 1, roughness: .55 })],
			['Cartoon', 'MeshToonMaterial', ball, new THREE.MeshToonMaterial({ color: '#ffb400', gradientMap: toonGrad })],
			['Neon', 'emissive + bloom', knot, new THREE.MeshStandardMaterial({ color: '#000000', emissive: '#7fe7ff', emissiveIntensity: 1.8 })],
		];
		const items = defs.map(([name, sub, geo, mat], i) => {
			const m = new THREE.Mesh(geo, mat); m.castShadow = true;
			const col = i % 4, row = Math.floor(i / 4);
			m.position.set((col - 1.5) * 2.4, .95, row * -2.6);
			const lb = label(`${name}<small>${sub}</small>`, 'tag3d mat'); lb.position.copy(m.position).add(new THREE.Vector3(0, -.95, 0)); scene.add(lb);
			scene.add(m);
			return { m, el: lb.userData.el, i };
		});
		// faixas atrás para o vidro ter o que refratar
		const stripes = new THREE.Mesh(new THREE.PlaneGeometry(20, 4), new THREE.ShaderMaterial({
			vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
			fragmentShader: `varying vec2 vUv; void main(){ float s = step(.5, fract(vUv.x * 40.)); gl_FragColor = vec4(mix(vec3(.05), vec3(.9,.3,.5), s) * .16, 1.); }`
		}));
		stripes.position.set(0, 2, -6); scene.add(stripes);

		return {
			scene, camera, exposure: 1, bloom: { strength: .4, radius: .4, threshold: .97 },
			update(t) {
				items.forEach(({ m, el, i }) => {
					const k = ease.backOut(seg(t, .2 + i * .1, 1 + i * .1));
					m.scale.setScalar(Math.max(.001, k));
					m.rotation.set(t * .4 + i, t * .6 + i * .5, 0);
					el.style.opacity = seg(t, .6 + i * .1, 1.2 + i * .1);
				});
				camera.position.set(-2.5 + t * .55, 4.6 - t * .1, 10 - t * .25);
				camera.lookAt(t * .15 - .5, .6, -1.3);
			}
		};
	}
};
