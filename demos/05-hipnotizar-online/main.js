// Motor do Short 05 (9:16, explainer flat). Motor herdado do 03 v2 (renderAt, desfoque de whip pan, legendas,
// player com narração + SFX); o mundo (flat.js / scenes.js) é novo: câmera ortográfica sobre um mural de folhas.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { clamp, seg, ease } from './lib.js';
import { P } from './flat.js';
import { buildWorld, update, camPose, DUR } from './scenes.js';
import { buildOverlay } from './overlay.js';

const W = 1080, H = 1920, DURATION = DUR;
const $ = s => document.querySelector(s);
const stage = $('#stage'), params = new URLSearchParams(location.search);
await Promise.all(['900 100px Inter', '800 100px Inter', '700 30px "JetBrains Mono"', '800 30px "JetBrains Mono"'].map(f => document.fonts.load(f)));

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
stage.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(P.noite);
const camera = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, -100, 100);
camera.position.z = 50;
const w = buildWorld();
scene.add(w.root);

const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }));
composer.setPixelRatio(1); composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const blur = new ShaderPass({
	uniforms: { tDiffuse: { value: null }, uDir: { value: new THREE.Vector2() } },
	vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
	fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 uDir; varying vec2 vUv;
		void main(){ vec4 c = vec4(0.); for (int i = 0; i < 15; i++) { float k = float(i) / 14. - .5; c += texture2D(tDiffuse, vUv + uDir * k); } gl_FragColor = c / 15.; }`,
});
composer.addPass(blur);
composer.addPass(new OutputPass());
// grão leve + vinheta suave (papel impresso chapado)
const look = new ShaderPass({
	uniforms: { tDiffuse: { value: null }, uTime: { value: 0 } },
	vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
	fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime; varying vec2 vUv;
		float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + uTime * 7.31) * 43758.5453); }
		void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 d = vUv - .5; d.y *= 1.3; c.rgb *= 1. - .14 * smoothstep(.4, .95, length(d)); c.rgb += (h(vUv * 900.) - .5) * .025; gl_FragColor = c; }`,
});
composer.addPass(look);

const overlay = buildOverlay($('#ui')), flashEl = $('#flash');
const FLASH = [[104.3, .4], [45.3, .25]];

function place(T) {
	const c = camPose(T);
	camera.position.set(c.x, c.y, 50); camera.zoom = c.z; camera.rotation.z = Math.sin(T * .23) * .004;
	camera.updateProjectionMatrix();
	return c;
}
function renderAt(T) {
	T = clamp(T, 0, DURATION - 1e-4);
	const p = camPose(Math.max(0, T - 1 / 30)), c = place(T);
	update(T, w, c);
	let dx = (c.x - p.x) * c.z / W, dy = (c.y - p.y) * c.z / H;
	if (Math.hypot(dx, dy) > 1.5 || !(c.whip || p.whip)) dx = dy = 0;
	blur.uniforms.uDir.value.set(dx * .6, dy * .6); blur.enabled = Math.hypot(dx, dy) > .004;
	look.uniforms.uTime.value = Math.floor(T * 12) / 12;
	composer.render();
	overlay(T);
	let f = 0; for (const [t0, d] of FLASH) f = Math.max(f, T >= t0 ? 1 - ease.cubicInOut(seg(T, t0, t0 + d)) : 0);
	flashEl.style.opacity = f * .7;
}

// ── player (narração + SFX) ──
function fit() { const k = Math.min(innerWidth / W, (innerHeight - 44) / H); stage.style.transform = `translate(-50%,-50%) translateY(-22px) scale(${k})`; }
addEventListener('resize', fit); fit();
const voz = $('#voz'), fx = $('#fx'), scrub = $('#scrub'), btn = $('#play');
let playing = false, cur = 0, t0 = performance.now();
const setPlay = q => { playing = q; btn.textContent = q ? '⏸' : '▶'; t0 = performance.now() - cur * 1000; if (q) { voz.currentTime = cur; voz.play().catch(() => {}); if ($('#sfx').checked) { fx.currentTime = cur; fx.play().catch(() => {}); } } else { voz.pause(); fx.pause(); } };
btn.onclick = () => setPlay(!playing);
scrub.oninput = () => { cur = +scrub.value; setPlay(false); };
addEventListener('keydown', e => {
	if (e.code === 'Space') { e.preventDefault(); setPlay(!playing); }
	if (e.code === 'ArrowRight') { cur = clamp(cur + (e.shiftKey ? 5 : .5), 0, DURATION); setPlay(false); }
	if (e.code === 'ArrowLeft') { cur = clamp(cur - (e.shiftKey ? 5 : .5), 0, DURATION); setPlay(false); }
	if (e.code === 'KeyH') $('#hud').style.display = $('#hud').style.display === 'none' ? '' : 'none';
});
if (params.has('t')) cur = +params.get('t');
if (params.has('nohud')) $('#hud').style.display = 'none';

for (let t = .2; t < DURATION; t += 2.9) renderAt(t);   // pré-aquece shaders e texturas
renderAt(cur);
window.__mg = { duration: DURATION, fps: 30, width: W, height: H, renderAt, scene, current: () => ({ scene, camera }) };
$('#loading').remove();
if (params.has('export')) { $('#hud').remove(); window.__mg.loaded = true; }
else (function loop() {
	if (playing) {
		cur = (performance.now() - t0) / 1000;
		if (!voz.paused && Math.abs(voz.currentTime - cur) > .08) cur = voz.currentTime, t0 = performance.now() - cur * 1000;
		if (!fx.paused && Math.abs(fx.currentTime - cur) > .08) fx.currentTime = cur;
		if (cur >= DURATION) { cur = 0; setPlay(true); }
	}
	scrub.value = cur; $('#tc').textContent = cur.toFixed(2).padStart(6, '0');
	renderAt(cur);
	requestAnimationFrame(loop);
})();
