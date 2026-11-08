import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { seg, ease, smooth, inOut, label, uiLayer, normalize } from '../lib.js';

// textura de piso de tacos gerada num <canvas>
function woodTexture(rng) {
	const c = document.createElement('canvas'); c.width = 1024; c.height = 1024;
	const g = c.getContext('2d');
	for (let y = 0; y < 16; y++) for (let x = 0; x < 4; x++) {
		const off = (y % 2) * 128, l = 22 + rng() * 14;
		g.fillStyle = `hsl(${24 + rng() * 8},${35 + rng() * 15}%,${l}%)`;
		g.fillRect(x * 256 + off - 256, y * 64, 255, 63);
		g.fillRect(x * 256 + off, y * 64, 255, 63);
		for (let k = 0; k < 14; k++) { g.strokeStyle = `rgba(0,0,0,${.05 + rng() * .08})`; g.beginPath(); const yy = y * 64 + rng() * 64; g.moveTo(x * 256 + off, yy); g.bezierCurveTo(x * 256 + off + 80, yy + rng() * 6 - 3, x * 256 + off + 160, yy + rng() * 6 - 3, x * 256 + off + 255, yy); g.stroke(); }
	}
	const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2.5, 2); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
	return t;
}

const CCTV = {
	uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uOn: { value: 0 } },
	vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
	fragmentShader: `
		uniform sampler2D tDiffuse; uniform float uTime, uOn; varying vec2 vUv;
		float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
		void main(){
			if (uOn < .5) { gl_FragColor = texture2D(tDiffuse, vUv); return; }
			vec2 uv = vUv - .5; float r2 = dot(uv, uv);
			uv = uv * (1. + .28 * r2) * .93 + .5;                          // lente olho-de-peixe
			if (uv.x < 0. || uv.x > 1. || uv.y < 0. || uv.y > 1.) { gl_FragColor = vec4(0.,0.,0.,1.); return; }
			uv.x += (hash(vec2(floor(uv.y * 240.), floor(uTime * 15.))) - .5) * .0025;   // tremido de linha
			vec3 c = texture2D(tDiffuse, uv).rgb;
			float l = dot(c, vec3(.299,.587,.114));
			l = pow(l * 1.6, .8);
			vec3 col = vec3(l * .85, l, l * .8);                              // monocromático esverdeado
			col *= .82 + .18 * sin(uv.y * 1080. * 1.2);                       // scanlines
			col += (hash(uv * 1000. + uTime) - .5) * .14;                      // ruído
			col *= 1. - smoothstep(.35, .75, length(vUv - .5));               // vinheta
			gl_FragColor = vec4(col, 1.);
		}`
};

export default {
	id: 'crime', num: '04', dur: 12,
	title: 'Cena de crime &amp; câmera de segurança',
	tags: ['SpotLight (lanterna)', 'sombras dinâmicas', 'textura gerada em canvas', 'marcadores 3D', 'shader de CCTV', 'personagem no vídeo'],
	uses: 'true crime, reconstituição de caso, documentário investigativo',
	async init(ctx) {
		const rng = ctx.rng(99);
		const scene = new THREE.Scene();
		scene.background = new THREE.Color('#000000');
		const camera = new THREE.PerspectiveCamera(50, ctx.W / ctx.H, .05, 50);

		const wallMat = new THREE.MeshStandardMaterial({ color: '#6d7468', roughness: .95 });
		const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 8), new THREE.MeshStandardMaterial({ map: woodTexture(rng), roughness: .6 }));
		floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
		const ceil = new THREE.Mesh(new THREE.PlaneGeometry(10, 8), wallMat); ceil.rotation.x = Math.PI / 2; ceil.position.y = 3.2; scene.add(ceil);
		const wall = (w, h, x, y, z, ry = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, .15), wallMat); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = m.receiveShadow = true; scene.add(m); return m; };
		// parede do fundo com janela (abertura x 0.5..2.7, y 1..2.4)
		wall(5.5, 3.2, -2.25, 1.6, -4); wall(2.3, 3.2, 3.85, 1.6, -4); wall(2.2, 1, 1.6, .5, -4); wall(2.2, .8, 1.6, 2.8, -4);
		for (let i = 0; i < 9; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(2.2, .07, .04), wallMat); s.position.set(1.6, 1.08 + i * .16, -3.95); s.rotation.x = .5; s.castShadow = true; scene.add(s); }
		wall(8, 3.2, -5, 1.6, 0, Math.PI / 2); wall(8, 3.2, 5, 1.6, 0, Math.PI / 2); wall(10, 3.2, 0, 1.6, 4);
		const door = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.2), new THREE.MeshStandardMaterial({ color: '#1b1410', roughness: .5 })); door.position.set(-4.9, 1.1, -2.2); door.rotation.y = Math.PI / 2; scene.add(door);

		// móveis
		const wood = new THREE.MeshStandardMaterial({ color: '#3b2a1e', roughness: .6 });
		const box = (w, h, d, x, y, z, mat = wood, rot = [0, 0, 0]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.set(...rot); m.castShadow = m.receiveShadow = true; scene.add(m); return m; };
		box(1.8, .06, .9, -2.4, .78, -2.6); [[-3.2, -3], [-1.6, -3], [-3.2, -2.2], [-1.6, -2.2]].forEach(([x, z]) => box(.06, .78, .06, x, .39, z));
		const chair = new THREE.Group(); scene.add(chair); chair.position.set(2.6, .25, -1.5); chair.rotation.set(0, .6, Math.PI / 2);
		[[0, .45, 0, .5, .05, .5], [0, .75, -.22, .5, .6, .05], [-.22, .22, -.22, .04, .45, .04], [.22, .22, -.22, .04, .45, .04], [-.22, .22, .22, .04, .45, .04], [.22, .22, .22, .04, .45, .04]]
			.forEach(([x, y, z, w, h, d]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wood); m.position.set(x, y, z); m.castShadow = true; chair.add(m); });
		const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.2), new THREE.MeshStandardMaterial({ color: '#4a1f24', roughness: 1 })); rug.rotation.set(-Math.PI / 2, 0, .15); rug.position.set(.4, .005, -.2); rug.receiveShadow = true; scene.add(rug);
		const paperMat = new THREE.MeshStandardMaterial({ color: '#d8d4c8', roughness: .9, side: THREE.DoubleSide });
		for (let i = 0; i < 9; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(.21, .29), paperMat); p.rotation.set(-Math.PI / 2, 0, rng() * 6); p.position.set(-2 + rng() * 2.5, .01 + i * .001, .6 + rng() * 1.4); p.receiveShadow = true; scene.add(p); }
		const glass = new THREE.Mesh(new THREE.CylinderGeometry(.04, .035, .12, 16), new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: .05, transmission: .9, thickness: .02 }));
		glass.rotation.z = Math.PI / 2; glass.position.set(-1.6, .04, -.4); scene.add(glass);
		const phone = box(.08, .012, .16, 1.9, .006, 1.4, new THREE.MeshStandardMaterial({ color: '#111', roughness: .2, metalness: .5 }), [0, .8, 0]);

		// contorno de giz
		const outline = [[0, .95], [.12, .85], [.13, .7], [.35, .62], [.62, .75], [.68, .66], [.4, .5], [.22, .4], [.2, 0], [.28, -.45], [.42, -.92], [.3, -.95], [.12, -.5], [0, -.2], [-.12, -.5], [-.35, -.9], [-.47, -.86], [-.28, -.45], [-.2, 0], [-.22, .4], [-.45, .35], [-.75, .2], [-.8, .3], [-.5, .52], [-.13, .7], [-.12, .85]];
		const chalk = new THREE.CatmullRomCurve3(outline.map(([x, z]) => new THREE.Vector3(x * 1.1, .012, z * 1.1)), true);
		const chalkMesh = new THREE.Mesh(new THREE.TubeGeometry(chalk, 200, .012, 4, true), new THREE.MeshBasicMaterial({ color: '#e8e8e8' }));
		chalkMesh.position.set(.4, 0, -.25); chalkMesh.rotation.y = .4; chalkMesh.scale.y = .2; scene.add(chalkMesh);

		// pegadas
		const stepMat = new THREE.MeshStandardMaterial({ color: '#160d08', roughness: 1, transparent: true, opacity: .8 });
		for (let i = 0; i < 9; i++) { const f = new THREE.Mesh(new THREE.CircleGeometry(.06, 12), stepMat); f.scale.set(1, 2.1, 1); f.rotation.set(-Math.PI / 2, 0, -.9); f.position.set(-4.3 + i * .38, .008, -2.0 + i * .25 + (i % 2) * .1); scene.add(f); }

		// marcadores de evidência
		const evMat = new THREE.MeshStandardMaterial({ color: '#ffd400', roughness: .4 });
		const evid = [[-1.45, -.6, 'copo'], [2.05, 1.25, 'celular'], [-3.0, -1.4, 'pegadas'], [2.4, -1.0, 'cadeira']].map(([x, z, txt], i) => {
			const m = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .14, 3), evMat); m.rotation.set(0, 0, Math.PI / 2); m.position.set(x, .07, z); m.castShadow = true; scene.add(m);
			const lb = label(`${i + 1}<small style="color:#111">${txt}</small>`, 'tag3d evid'); lb.position.set(x, .45, z); scene.add(lb);
			return { m, lb, el: lb.userData.el };
		});

		// luzes
		scene.add(new THREE.HemisphereLight('#8090b8', '#3a2a20', 4.5));
		const moon = new THREE.SpotLight('#86a6ff', 6, 0, .5, .5, 0); moon.position.set(2.2, 4.2, -9); moon.target.position.set(.2, 0, .5);
		moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048); moon.shadow.bias = -.0004; scene.add(moon, moon.target);
		const torch = new THREE.SpotLight('#fff1d6', 30, 16, .3, .55, 1); torch.castShadow = true; torch.shadow.mapSize.set(1024, 1024); torch.shadow.bias = -.0005;
		scene.add(torch, torch.target);
		const beam = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 32, 1, true).translate(0, -.5, 0).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#fff1d6', transparent: true, opacity: .016, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
		scene.add(beam);
		const ceilingLamp = new THREE.PointLight('#d9f0ff', 0, 12, 1.4); ceilingLamp.position.set(0, 3, 0); ceilingLamp.castShadow = true; scene.add(ceilingLamp);

		// poeira no ar
		const DUST = 900, dp = new Float32Array(DUST * 3);
		for (let i = 0; i < DUST; i++) { dp[i * 3] = (rng() - .5) * 9; dp[i * 3 + 1] = rng() * 3; dp[i * 3 + 2] = (rng() - .5) * 7; }
		const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
		const dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: '#ffffff', size: .008, transparent: true, opacity: .22, blending: THREE.AdditiveBlending, depthWrite: false }));
		scene.add(dust);

		// suspeito (aparece só na câmera de segurança)
		const xGl = await ctx.gltf('models/gltf/Xbot.glb');
		const sus = SkeletonUtils.clone(xGl.scene); normalize(sus, 1.8);
		sus.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; o.material = new THREE.MeshStandardMaterial({ color: '#2a2a2a', roughness: .8 }); } });
		const susG = new THREE.Group(); susG.add(sus); scene.add(susG);
		const sMix = new THREE.AnimationMixer(sus); sMix.clipAction(xGl.animations.find(a => a.name === 'walk')).play();

		const cctv = new ShaderPass(CCTV);
		const ui = uiLayer(`
			<div class="cc" style="position:absolute;inset:0;font-family:'JetBrains Mono',monospace;color:#e9ffe9;text-shadow:0 0 6px rgba(0,0,0,.9)">
				<div style="position:absolute;left:120px;top:90px;font-size:30px;letter-spacing:.1em">CAM 03 · SALA</div>
				<div class="rec" style="position:absolute;right:130px;top:90px;font-size:30px"><span style="color:#ff3b3b">●</span> REC</div>
				<div class="ts" style="position:absolute;right:130px;bottom:240px;font-size:30px">05/11/2026 23:47:12</div>
				${['left:90px;top:70px;border-width:3px 0 0 3px', 'right:90px;top:70px;border-width:3px 3px 0 0', 'left:90px;bottom:70px;border-width:0 0 3px 3px', 'right:90px;bottom:70px;border-width:0 3px 3px 0'].map(s => `<i style="position:absolute;width:70px;height:70px;border:solid #e9ffe9;${s}"></i>`).join('')}
			</div>`);
		const cc = ui.querySelector('.cc'), rec = ui.querySelector('.rec'), ts = ui.querySelector('.ts');

		const lookKeys = new THREE.CatmullRomCurve3([[-2.2, .3, -1.6], [-1.5, .05, -.6], [.3, 0, -.2], [2.0, 0, 1.2], [2.4, .2, -1.1], [1.6, 1.6, -4]].map(a => new THREE.Vector3(...a)));
		const lk = new THREE.Vector3(), dir = new THREE.Vector3();
		const CUT = 6.8;

		return {
			scene, camera, ui, passes: [cctv], exposure: 1.2, bloom: { strength: .35, radius: .5, threshold: .7 },
			update(t) {
				const cam = t >= CUT;
				cctv.uniforms.uOn.value = cam ? 1 : 0; cctv.uniforms.uTime.value = t;
				cc.style.display = cam ? '' : 'none';
				evid.forEach((e, i) => { e.lb.visible = !cam; e.el.style.opacity = ease.expoOut(seg(t, 1 + i * .9, 1.6 + i * .9)); });
				dust.rotation.y = t * .02; dust.position.y = Math.sin(t * .3) * .05;
				if (!cam) {
					// câmera na mão + lanterna
					const k = seg(t, 0, CUT);
					camera.fov = 50; camera.updateProjectionMatrix();
					camera.position.set(-3.9 + k * 1.6 + Math.sin(t * 1.7) * .02, 1.62 + Math.sin(t * 3.1) * .015, 3.0 - k * .7);
					lookKeys.getPoint(ease.sineInOut(k), lk);
					camera.lookAt(lk);
					dir.subVectors(lk, camera.position).normalize();
					torch.intensity = 30; torch.position.copy(camera.position).add(new THREE.Vector3(.25, -.25, 0));
					torch.target.position.copy(lk);
					beam.visible = true; beam.position.copy(torch.position); beam.lookAt(lk);
					const L = torch.position.distanceTo(lk); beam.scale.set(Math.tan(.3) * L, Math.tan(.3) * L, L);
					ceilingLamp.intensity = 0; susG.visible = false;
				} else {
					const lt = t - CUT;
					camera.fov = 78; camera.updateProjectionMatrix();
					camera.position.set(4.6, 2.95, 3.6); camera.lookAt(-.6, .4, -1.2);
					torch.intensity = 0; beam.visible = false;
					const fl = (Math.sin(t * 37) > .92 || (lt > 2.2 && lt < 2.35)) ? .25 : 1;   // lâmpada piscando
					ceilingLamp.intensity = 3.2 * fl;
					susG.visible = true;
					const wk = Math.min(lt * 1.15, 6.4);
					susG.position.set(-4.4 + wk * .95, 0, -2.2 + wk * .45);
					susG.lookAt(susG.position.x + .95, 0, susG.position.z + .45);
					sMix.setTime(lt);
					const s = 47 * 60 + 12 + Math.floor(lt * 1.0), hh = 23, mm = Math.floor(s / 60) % 60, ss = s % 60;
					ts.textContent = `05/11/2026 ${hh}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
					rec.style.opacity = (Math.floor(lt * 2) % 2) ? .25 : 1;
				}
			}
		};
	}
};
