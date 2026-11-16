// Teste de estilos: a MESMA cena e história (14 s, 16:9) em estilos diferentes. Cada subpasta só escolhe o estilo.
import * as THREE from 'three';
import { montarEstilo } from '/demos/_estilos/estilos.js';

const LEG = {
	anime: 'background:rgba(255,255,255,.92);color:#2B2340;border-radius:22px;padding:18px 34px;font:800 54px "Segoe UI",Arial;box-shadow:0 10px 0 rgba(43,35,64,.25)',
	hq: 'background:#F2EAD3;color:#111;border:7px solid #111;padding:16px 30px;font:900 50px "Courier New";box-shadow:12px 12px 0 #111;text-transform:uppercase',
	vitral: 'background:rgba(10,8,30,.82);color:#FFD76A;border:4px solid #C9A23A;border-radius:6px;padding:16px 36px;font:700 56px Georgia,serif;letter-spacing:1px',
};
const FALAS = [[0.6, 4.4, '23:47.'], [4.8, 9.0, 'O corpo cansado. A mente, não.'], [9.8, 13.6, 'Por que a mente acelera à noite?']];

export function iniciar(estilo) {
	const W = 1920, H = 1080, q = new URLSearchParams(location.search);
	const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
	r.setSize(W, H, false); r.domElement.style.cssText = 'width:100%;height:100%;display:block';
	const palco = document.createElement('div'); palco.style.cssText = `position:relative;width:${W}px;height:${H}px;overflow:hidden;transform-origin:0 0`;
	palco.appendChild(r.domElement); document.body.style.cssText = 'margin:0;background:#000;overflow:hidden'; document.body.appendChild(palco);
	const ajustar = () => { const s = Math.min(innerWidth / W, innerHeight / H); palco.style.transform = `scale(${s})`; }; ajustar(); addEventListener('resize', ajustar);
	const leg = document.createElement('div'); leg.style.cssText = `position:absolute;left:50%;bottom:90px;transform:translateX(-50%);white-space:nowrap;${LEG[estilo]}`; palco.appendChild(leg);

	const e = montarEstilo(estilo, r, W, H), cam = e.cam, p0 = cam.position.clone(), alvo = new THREE.Vector3(0.6, 1.9, -1);
	const luz = e.cena.userData.abajur, luz0 = luz?.intensity || 0, lamp = e.q.lampada.material, emi0 = lamp.emissiveIntensity ?? 0;
	const vapor = e.q.grupo.userData.vapor || [], pont = e.q.grupo.userData.ponteiro, ease = x => x * x * (3 - 2 * x), cl = x => Math.min(1, Math.max(0, x));

	function renderAt(t) {
		const k = ease(cl(t / 14));
		cam.position.copy(p0).lerp(alvo, 0.22 * k); cam.position.x += Math.sin(t * 0.5) * 0.08; cam.position.y += Math.sin(t * 0.37) * 0.04;
		cam.lookAt(-0.25 + 0.6 * k, 1.55 + 0.3 * k, -1.05);
		e.pers.scale.y = 1 + 0.008 * Math.sin(t * 2.2);
		vapor.forEach((v, i) => { const f = (t * 0.35 + i / 3) % 1; v.position.y = 1.42 + f * 0.45; v.position.x = 0.95 + Math.sin(f * 6 + i) * 0.04; v.scale.setScalar(Math.max(0.01, Math.sin(f * Math.PI))); });
		if (pont) pont.rotation.z = -t * 0.35;
		const off = ease(cl((t - 9.4) / 0.5));                     // ela apaga o abajur aos 9,4 s
		const pisca = t < 9.4 ? 1 - 0.05 * Math.max(0, Math.sin(t * 13) * Math.sin(t * 3.1)) : 1;
		if (luz) luz.intensity = luz0 * (1 - off * 0.92) * pisca;
		if ('emissiveIntensity' in lamp) lamp.emissiveIntensity = emi0 * (1 - off * 0.95);
		const f = FALAS.find(([a, b]) => t >= a && t < b);
		if (f) { const a = cl((t - f[0]) / 0.25) * cl((f[1] - t) / 0.25); leg.textContent = f[2]; leg.style.opacity = a; leg.style.transform = `translateX(-50%) translateY(${(1 - a) * 20}px)`; } else leg.style.opacity = 0;
		e.render();
	}
	window.__mg = { duration: 14, fps: 30, width: W, height: H, renderAt };
	if (q.has('export')) { renderAt(0); window.__mg.loaded = true; return; }
	const t0 = +(q.get('t') || 0), ini = performance.now();
	const loop = () => { renderAt((t0 + (performance.now() - ini) / 1000) % 14); requestAnimationFrame(loop); }; loop();
}
