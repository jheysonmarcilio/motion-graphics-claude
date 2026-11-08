import * as THREE from 'three';
import { seg, ease, inOut, uiLayer, fade } from '../lib.js';

const ITEMS = ['Pessoas animadas', 'Expressões faciais', 'Mapas e rotas', 'Cenas de crime', 'Câmera de segurança', 'Física', 'Cidades', 'Oceano e céu', 'Animais', 'Shaders hipnóticos', 'Globo e dados', 'Materiais realistas', '9 estilos de pós', 'Raio‑X'];

export default {
	id: 'final', dur: 7,
	async init(ctx) {
		const scene = new THREE.Scene();
		scene.background = new THREE.Color('#04040a');
		const camera = new THREE.PerspectiveCamera(50, ctx.W / ctx.H, .1, 200);
		const rng = ctx.rng(77), N = 6000, p = new Float32Array(N * 3), c = new Float32Array(N * 3);
		const pal = ['#7fe7ff', '#b38cff', '#ff6b9a', '#ffd166'].map(x => new THREE.Color(x));
		for (let i = 0; i < N; i++) {
			const r = 3 + Math.pow(rng(), 1.5) * 30, a = rng() * Math.PI * 2, arm = (i % 3) * 2.094;
			p[i * 3] = Math.cos(a * .15 + arm + r * .22) * r + (rng() - .5) * 2; p[i * 3 + 1] = (rng() - .5) * 2.5; p[i * 3 + 2] = Math.sin(a * .15 + arm + r * .22) * r + (rng() - .5) * 2;
			pal[i % 4].toArray(c, i * 3);
		}
		const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('color', new THREE.BufferAttribute(c, 3));
		const galaxy = new THREE.Points(g, new THREE.PointsMaterial({ size: .12, vertexColors: true, transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false }));
		scene.add(galaxy);

		const ui = uiLayer(`
			<div class="f1" style="position:absolute;left:0;right:0;top:250px;text-align:center;font-size:76px;font-weight:800;letter-spacing:-.01em">Tudo isso é <span style="color:#7fe7ff">código</span>.</div>
			<div class="grid" style="position:absolute;left:260px;right:260px;top:420px;display:flex;flex-wrap:wrap;justify-content:center;gap:14px">${ITEMS.map(s => `<span style="font:400 24px 'JetBrains Mono',monospace;padding:10px 18px;border:1px solid rgba(255,255,255,.3);border-radius:6px;background:rgba(0,0,0,.4)">${s}</span>`).join('')}</div>
			<div class="f2" style="position:absolute;left:0;right:0;top:760px;text-align:center;font-size:48px;font-weight:300;color:#ffd166">O que você quer criar?</div>`);
		const f1 = ui.querySelector('.f1'), f2 = ui.querySelector('.f2'), chips = [...ui.querySelector('.grid').children];
		return {
			scene, camera, ui, bloom: { strength: .8, radius: .6, threshold: .2 },
			update(t) {
				galaxy.rotation.y = t * .08;
				camera.position.set(0, 14 - t * .8, 26 - t * 1.2); camera.lookAt(0, 0, 0);
				fade(f1, ease.expoOut(seg(t, .3, 1.1)), (1 - ease.expoOut(seg(t, .3, 1.1))) * 20);
				chips.forEach((e, i) => { const k = ease.expoOut(seg(t, 1 + i * .09, 1.6 + i * .09)); fade(e, k, (1 - k) * 14); });
				fade(f2, ease.expoOut(seg(t, 3.2, 4.2)), 0, (1 - ease.expoOut(seg(t, 3.2, 4.2))) * 10);
			}
		};
	}
};
