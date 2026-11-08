import * as THREE from 'three';
import { seg, ease, inOut, uiLayer, fade, normalize } from '../lib.js';

export default {
	id: 'rosto', num: '02', dur: 9,
	title: 'Rostos e expressões faciais',
	tags: ['morph targets (52 blendshapes)', 'captura facial', 'wireframe', 'KTX2 + Meshopt'],
	uses: 'microexpressões, linguagem corporal, “o que esse rosto está sentindo?”',
	async init(ctx) {
		const scene = new THREE.Scene();
		scene.background = new THREE.Color('#0b0c12');
		scene.environment = ctx.room();
		scene.environmentIntensity = .4;
		const camera = new THREE.PerspectiveCamera(30, ctx.W / ctx.H, .05, 100);
		const rim = new THREE.DirectionalLight('#7fe7ff', 3); rim.position.set(-3, 2, -3); scene.add(rim);
		const key = new THREE.DirectionalLight('#ffe7d1', 1.0); key.position.set(2, 2, 3); scene.add(key);

		const gl = await ctx.gltf('models/gltf/facecap.glb');
		const build = (root) => { const g = new THREE.Group(); g.add(root); normalize(g, 2.3); scene.add(g); return g; };
		const realRoot = gl.scene, wireRoot = gl.scene.clone(true);
		const real = build(realRoot), wire = build(wireRoot);
		real.position.x -= 1.25; wire.position.x += 1.05;
		const wireMat = new THREE.MeshBasicMaterial({ color: '#b38cff', wireframe: true, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false });
		wireRoot.traverse(o => { if (o.isMesh) o.material = wireMat; });

		const mixers = [realRoot, wireRoot].map(r => { const m = new THREE.AnimationMixer(r); gl.animations.forEach(c => m.clipAction(c).play()); return m; });
		const clipDur = Math.max(...gl.animations.map(c => c.duration));
		const head = realRoot.getObjectByName('mesh_2');
		const dict = head.morphTargetDictionary, names = Object.keys(dict);
		const find = s => names.filter(n => n.toLowerCase().includes(s.toLowerCase())).map(n => dict[n]);
		const avg = (ids, inf) => ids.length ? ids.reduce((a, i) => a + inf[i], 0) / ids.length : 0;
		const E = {
			'Alegria': find('mouthSmile'), 'Surpresa': [...find('jawOpen'), ...find('eyeWide'), ...find('browInnerUp')],
			'Tensão': [...find('browDown'), ...find('mouthPress')], 'Tristeza': [...find('mouthFrown'), ...find('browInnerUp')],
		};

		const ui = uiLayer(`
			<div class="fp" style="position:absolute;left:1340px;top:150px;width:500px;font-family:'JetBrains Mono',monospace">
				<div style="font-size:16px;letter-spacing:.25em;color:#7fe7ff;margin-bottom:18px">BLENDSHAPES ATIVOS · ${names.length}</div>
				<div class="rows"></div>
				<div style="font-size:16px;letter-spacing:.25em;color:#ffd166;margin:34px 0 14px">LEITURA EMOCIONAL (simulada)</div>
				<div class="emo"></div>
			</div>`);
		const panel = ui.querySelector('.fp'), rows = ui.querySelector('.rows'), emo = ui.querySelector('.emo');
		const row = (lbl, col) => { const d = document.createElement('div'); d.style.cssText = 'display:flex;align-items:center;gap:12px;margin:7px 0;font-size:17px;color:#cdd6e0'; d.innerHTML = `<span style="width:190px;overflow:hidden">${lbl}</span><span style="flex:1;height:8px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden"><i style="display:block;height:100%;width:0;background:${col}"></i></span><b style="width:48px;text-align:right;font-weight:400"></b>`; return d; };
		const rowEls = Array.from({ length: 7 }, () => rows.appendChild(row('', '#7fe7ff')));
		const emoEls = Object.keys(E).map(k => emo.appendChild(row(k, '#ffd166')));

		return {
			scene, camera, ui, exposure: .85, bloom: { strength: .35, radius: .5, threshold: .9 },
			update(t) {
				const at = (t * 1.0 + 2) % clipDur;
				mixers.forEach(m => m.setTime(at));
				camera.position.set(-.1 + Math.sin(t * .3) * .4, 1.35, 7.6 - t * .12);
				camera.lookAt(.75, 1.2, 0);
				const inf = head.morphTargetInfluences;
				const top = names.map(n => [n, inf[dict[n]]]).sort((a, b) => b[1] - a[1]).slice(0, 7);
				top.forEach(([n, v], i) => {
					const el = rowEls[i];
					el.children[0].textContent = n; el.children[1].firstChild.style.width = (v * 100) + '%'; el.children[2].textContent = (v * 100).toFixed(0);
				});
				Object.values(E).forEach((ids, i) => { const v = Math.min(1, avg(ids, inf) * 1.6); emoEls[i].children[1].firstChild.style.width = (v * 100) + '%'; emoEls[i].children[2].textContent = (v * 100).toFixed(0); });
				fade(panel, inOut(t, .6, 1.4, 8.3, 8.9), (1 - ease.expoOut(seg(t, .6, 1.4))) * 20);
			}
		};
	}
};
