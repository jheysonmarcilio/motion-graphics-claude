import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { HalftonePass } from 'three/addons/postprocessing/HalftonePass.js';
import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js';
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js';
import { DotScreenPass } from 'three/addons/postprocessing/DotScreenPass.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js';
import { SobelOperatorShader } from 'three/addons/shaders/SobelOperatorShader.js';
import { SepiaShader } from 'three/addons/shaders/SepiaShader.js';
import { KaleidoShader } from 'three/addons/shaders/KaleidoShader.js';
import { seg, ease, uiLayer, normalize } from '../lib.js';

export default {
	id: 'efeitos', num: '11', dur: 9,
	title: 'Pós‑produção: um clique, outro estilo',
	tags: ['EffectComposer', 'profundidade de campo', 'rastro', 'halftone', 'pixel art', 'contorno', 'filme antigo', 'aberração cromática', 'caleidoscópio'],
	uses: 'dar identidade ao canal, flashback, sonho, memória, distorção da percepção',
	async init(ctx) {
		const scene = new THREE.Scene();
		scene.background = new THREE.Color('#1a1430');
		scene.fog = new THREE.Fog('#1a1430', 8, 22);
		const camera = new THREE.PerspectiveCamera(38, ctx.W / ctx.H, .1, 100);
		const floor = new THREE.Mesh(new THREE.CircleGeometry(6, 64), new THREE.MeshStandardMaterial({ color: '#1a1822', roughness: .35, metalness: .3 }));
		floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
		scene.add(new THREE.HemisphereLight('#9a9aff', '#302040', 3.5));
		const key = new THREE.DirectionalLight('#ffffff', 2.2); key.position.set(2, 4, 3); scene.add(key);
		scene.environment = ctx.room(); scene.environmentIntensity = .35;
		const spots = ['#ff3d8a', '#3de0ff', '#ffd23d'].map((c, i) => {
			const s = new THREE.SpotLight(c, 22, 20, .38, .5, 1.5); s.castShadow = i === 0; s.shadow.mapSize.set(1024, 1024);
			scene.add(s, s.target); return s;
		});
		// colunas ao fundo para dar profundidade (DOF)
		for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, c = new THREE.Mesh(new THREE.BoxGeometry(.3, 4 + (i % 3), .3), new THREE.MeshStandardMaterial({ color: '#2a2540', emissive: i % 2 ? '#3a1060' : '#05303a', emissiveIntensity: 1.5 })); c.position.set(Math.cos(a) * 7, 2, Math.sin(a) * 7); scene.add(c); }

		const gl = await ctx.gltf('models/gltf/Michelle.glb');
		const dancer = new THREE.Group(); dancer.add(gl.scene); normalize(dancer, 1.7); scene.add(dancer);
		gl.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
		const mixer = new THREE.AnimationMixer(gl.scene); mixer.clipAction(gl.animations.find(a => a.name === 'SambaDance')).play();

		const W = ctx.W, H = ctx.H;
		const P = {
			bokeh: new BokehPass(scene, camera, { focus: 4.2, aperture: .012, maxblur: .012 }),
			after: new AfterimagePass(.93),
			half: new HalftonePass({ shape: 1, radius: 6, scatter: 0, blending: .85, greyscale: false }),
			pixel: new RenderPixelatedPass(7, scene, camera),
			sobel: new ShaderPass(SobelOperatorShader),
			sepia: new ShaderPass(SepiaShader), film: new FilmPass(.9, false),
			rgb: new ShaderPass(RGBShiftShader), dots: new DotScreenPass(new THREE.Vector2(0, 0), .5, 1.4),
			kal: new ShaderPass(KaleidoShader),
		};
		P.sobel.uniforms.resolution.value.set(W, H);
		P.rgb.uniforms.amount.value = .008;
		P.kal.uniforms.sides.value = 7;
		const LIST = [
			['Original', 'sem efeito', []],
			['Profundidade de campo', 'BokehPass', ['bokeh']],
			['Rastro de movimento', 'AfterimagePass', ['after']],
			['Quadrinhos', 'HalftonePass', ['half']],
			['Pixel art', 'RenderPixelatedPass', ['pixel']],
			['Contorno / desenho', 'Sobel', ['sobel']],
			['Filme antigo', 'Sepia + FilmPass', ['sepia', 'film']],
			['Aberração cromática', 'RGBShift', ['rgb']],
			['Caleidoscópio', 'KaleidoShader', ['kal']],
		];
		const ui = uiLayer(`<div class="fx" style="position:absolute;right:90px;top:110px;text-align:right;text-shadow:0 2px 16px #000"><div class="n" style="font-size:54px;font-weight:800"></div><div class="c" style="font:400 20px 'JetBrains Mono',monospace;color:#7fe7ff;margin-top:6px"></div><div class="d" style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px"></div></div>`);
		const nEl = ui.querySelector('.n'), cEl = ui.querySelector('.c'), dEl = ui.querySelector('.d');
		dEl.innerHTML = LIST.map(() => '<i style="width:28px;height:4px;background:rgba(255,255,255,.25);display:block"></i>').join('');
		const ticks = [...dEl.children];
		const STEP = .95;

		return {
			scene, camera, ui, passes: Object.values(P), exposure: 1, bloom: { strength: .5, radius: .4, threshold: .6 },
			update(t) {
				mixer.setTime(t + 1);
				const a = t * .35;
				camera.position.set(Math.sin(a) * 4.4, 1.5 + Math.sin(t * .5) * .2, Math.cos(a) * 4.4);
				camera.lookAt(0, 1, 0);
				spots.forEach((s, i) => {
					const b = t * (.8 + i * .3) + i * 2.1;
					s.position.set(Math.cos(b) * 4, 5.5, Math.sin(b) * 4);
					s.target.position.set(Math.sin(t + i) * .5, 0, Math.cos(t * .7 + i) * .5);
				});
				const idx = Math.max(0, Math.min(LIST.length - 1, Math.floor((t - .3) / STEP)));
				const on = new Set(LIST[idx][2]);
				for (const [k, p] of Object.entries(P)) p.enabled = on.has(k);
				P.kal.uniforms.angle.value = t * .4;
				P.film.uniforms.time && (P.film.uniforms.time.value = t);
				nEl.textContent = LIST[idx][0]; cEl.textContent = LIST[idx][1];
				const local = (t - .3) - idx * STEP;
				ui.firstChild.style.opacity = ease.expoOut(seg(local, 0, .25));
				ticks.forEach((e, i) => e.style.background = i === idx ? '#7fe7ff' : i < idx ? 'rgba(127,231,255,.45)' : 'rgba(255,255,255,.2)');
			}
		};
	}
};
