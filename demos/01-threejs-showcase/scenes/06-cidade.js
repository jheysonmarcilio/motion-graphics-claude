import * as THREE from 'three';
import { smooth } from '../lib.js';

export default {
	id: 'ambiente', num: '06', dur: 9,
	title: 'Ambientes completos e animados',
	tags: ['modelo glTF com Draco', 'animação embutida (keyframes)', 'iluminação por ambiente (PBR)', 'câmera cinematográfica'],
	uses: 'mostrar um bairro, uma casa, um cenário de época, maquetes animadas',
	async init(ctx) {
		const scene = new THREE.Scene();
		scene.background = new THREE.Color('#bfe3dd');
		scene.environment = ctx.room();
		const camera = new THREE.PerspectiveCamera(36, ctx.W / ctx.H, .1, 100);
		const gl = await ctx.gltf('models/gltf/LittlestTokyo.glb');
		const model = gl.scene; model.position.set(1, 1, 0); model.scale.setScalar(.01);
		scene.add(model);
		const mixer = new THREE.AnimationMixer(model);
		mixer.clipAction(gl.animations[0]).play();
		const sky = new THREE.Color('#bfe3dd'), dusk = new THREE.Color('#2b2f55');
		return {
			scene, camera, exposure: 1, bloom: { strength: .25, radius: .4, threshold: .9 },
			update(t) {
				mixer.setTime(t);
				// abre num detalhe e afasta revelando o mundo inteiro
				const k = smooth(t, 0, 9);
				const a = -.6 + t * .16, r = 4.6 + k * 5.5, h = .9 + k * 2.6;
				camera.position.set(Math.sin(a) * r, h, Math.cos(a) * r);
				camera.lookAt(0, .6 + k * .1, 0);
				scene.background.lerpColors(sky, dusk, smooth(t, 5, 8.5) * .6);
				scene.environmentIntensity = 1 - smooth(t, 5, 8.5) * .35;
			}
		};
	}
};
