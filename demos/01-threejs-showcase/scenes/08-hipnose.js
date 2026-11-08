import * as THREE from 'three';
import { seg, ease, inOut, uiLayer, fade, normalize } from '../lib.js';

export default {
	id: 'hipnose', num: '08', dur: 9,
	title: 'Shaders: efeitos que não existem na câmera',
	tags: ['GLSL ShaderMaterial', 'espiral procedural', 'modelo PBR (relógio)', 'pêndulo físico', 'tipografia sincronizada'],
	uses: 'hipnose, estados alterados de consciência, ilusões de ótica, transições hipnóticas',
	async init(ctx) {
		const scene = new THREE.Scene();
		scene.environment = await ctx.envHDR('textures/equirectangular/venice_sunset_1k.hdr'); scene.environmentIntensity = .7;
		const camera = new THREE.PerspectiveCamera(35, ctx.W / ctx.H, .1, 100);

		const spiral = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
			uniforms: { uTime: { value: 0 }, uAsp: { value: ctx.W / ctx.H }, uK: { value: 0 } },
			vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, .9999, 1.); }`,
			fragmentShader: `
				uniform float uTime, uAsp, uK; varying vec2 vUv;
				void main(){
					vec2 p = (vUv - .5) * vec2(uAsp, 1.) * 2.;
					float r = length(p), a = atan(p.y, p.x);
					float s = fract(a / 6.2831 * 3. + log(r + .001) * 1.6 - uTime * .45);
					float band = smoothstep(.0, .04, s) - smoothstep(.48, .52, s) + smoothstep(.96, 1., s);
					vec3 c1 = vec3(.01, .0, .03), c2 = mix(vec3(.30, .08, .75), vec3(.75, .1, .45), .5 + .5 * sin(uTime * .7 + r * 2.));
					vec3 col = mix(c1, c2, band * (.35 + .65 * uK));
					col += vec3(.6, .4, 1.) * exp(-r * 3.) * .6 * uK;                 // brilho central
					col *= smoothstep(1.9, .2, r);
					gl_FragColor = vec4(col, 1.);
				}`,
			depthWrite: false, depthTest: false
		}));
		spiral.frustumCulled = false; spiral.renderOrder = -1; scene.add(spiral);

		const gl = await ctx.gltf('models/gltf/rolex.glb');
		gl.scene.getObjectByName('Dummy001')?.removeFromParent(); gl.scene.rotation.x = Math.PI / 2;
		const watch = new THREE.Group(); watch.add(gl.scene); normalize(watch, 1.6);
		const holder = new THREE.Group(); holder.add(watch);
		watch.position.y -= 3.1 + .0;   // pendurado 3.1 abaixo do pivô
		const pivot = new THREE.Group(); pivot.position.set(0, 2.6, 0); pivot.add(holder); scene.add(pivot);
		const chain = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, 1.6, 6), new THREE.MeshStandardMaterial({ color: '#d4af37', metalness: 1, roughness: .2 }));
		chain.position.y = -.75; holder.add(chain);
		const key = new THREE.DirectionalLight('#ffffff', 1); key.position.set(2, 3, 5); scene.add(key);

		const ui = uiLayer(`
			<div class="h1" style="position:absolute;left:0;right:0;top:110px;text-align:center;font-size:44px;font-weight:300;letter-spacing:.08em;text-shadow:0 0 30px #000">olhe fixamente para o relógio…</div>
			<div class="h2" style="position:absolute;left:0;right:0;top:110px;text-align:center;font-size:44px;font-weight:300;letter-spacing:.08em;text-shadow:0 0 30px #000">suas pálpebras estão ficando <i>pesadas</i></div>
			<div class="h3" style="position:absolute;left:0;right:0;top:100px;text-align:center;font-size:80px;font-weight:200;letter-spacing:.3em;text-shadow:0 0 30px #000"></div>`);
		const [h1, h2, h3] = ['.h1', '.h2', '.h3'].map(s => ui.querySelector(s));

		return {
			scene, camera, ui, exposure: 1, bloom: { strength: .5, radius: .7, threshold: .9 },
			update(t) {
				spiral.material.uniforms.uTime.value = t * (1 + t * .12);
				spiral.material.uniforms.uK.value = ease.expoOut(seg(t, .1, 2));
				holder.rotation.z = Math.sin(t * 2.3) * .42 * ease.sineInOut(seg(t, 0, 1.5));
				watch.rotation.y = Math.sin(t * .9) * .35;
				camera.position.set(0, -.2, 9 - t * .35);
				camera.lookAt(0, -.4, 0);
				fade(h1, inOut(t, .8, 1.6, 3.2, 3.7), 0, (1 - inOut(t, .8, 1.6, 3.2, 3.7)) * 8);
				fade(h2, inOut(t, 3.9, 4.7, 6.2, 6.7), 0, (1 - inOut(t, 3.9, 4.7, 6.2, 6.7)) * 8);
				const n = t < 7.1 ? '' : t < 7.7 ? '3' : t < 8.3 ? '3 · 2' : '3 · 2 · 1';
				h3.textContent = n; fade(h3, inOut(t, 6.9, 7.2, 8.6, 8.9));
			}
		};
	}
};
