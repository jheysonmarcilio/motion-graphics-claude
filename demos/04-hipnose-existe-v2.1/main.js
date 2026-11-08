// Motor do Short 04 v2 (9:16, papel recortado): mural de cortiça + folhas (scenes.js) + câmera (camera.js) + legendas (overlay.js).
// Tempos = narração gravada audio/04-hipnose-existe.mp3.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { clamp, seg, ease, mulberry32 } from './lib.js';
import { buildScenes } from './scenes.js';
import { camAt } from './camera.js';
import { buildOverlay } from './overlay.js';

const W = 1080, H = 1920, DURATION = 88.35, FOV = 30;
const $ = s => document.querySelector(s);
const stage = $('#stage'), params = new URLSearchParams(location.search);
await Promise.all(['900 100px Inter', '700 30px "JetBrains Mono"', '40px "Permanent Marker"'].map(f => document.fonts.load(f)));

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#B88A5A');
const camera = new THREE.PerspectiveCamera(FOV, W / H, .5, 200);
const amb = new THREE.AmbientLight('#ffffff', 2.35); scene.add(amb);
const sun = new THREE.DirectionalLight('#fff6e8', 1.15); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .01; sun.shadow.radius = 6;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 60;
scene.add(sun, sun.target);

// cortiça
{
	const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'), r = mulberry32(3);
	g.fillStyle = '#B88A5A'; g.fillRect(0, 0, 512, 512);
	for (let i = 0; i < 9000; i++) { const v = r(); g.fillStyle = v < .5 ? 'rgba(120,80,45,.35)' : 'rgba(225,185,135,.3)'; g.beginPath(); g.arc(r() * 512, r() * 512, .6 + r() * 2.2, 0, 7); g.fill(); }
	const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(30, 30); t.colorSpace = THREE.SRGBColorSpace;
	const cork = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), new THREE.MeshLambertMaterial({ map: t })); cork.position.set(40, -8, -.05); cork.receiveShadow = true; scene.add(cork);
}
const LOCS = buildScenes({ renderer });
for (const l of LOCS) scene.add(l.g);

const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }));
composer.setPixelRatio(1); composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const blur = new ShaderPass({
	uniforms: { tDiffuse: { value: null }, uDir: { value: new THREE.Vector2() } },
	vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
	fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 uDir; varying vec2 vUv;
		void main(){ vec4 c = vec4(0.); for (int i = 0; i < 13; i++) { float k = float(i) / 12. - .5; c += texture2D(tDiffuse, vUv + uDir * k); } gl_FragColor = c / 13.; }`,
});
composer.addPass(blur);
composer.addPass(new OutputPass());
const grain = new ShaderPass({
	uniforms: { tDiffuse: { value: null }, uTime: { value: 0 } },
	vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
	fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime; varying vec2 vUv;
		float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + uTime * 7.31) * 43758.5453); }
		void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 d = vUv - .5; d.y *= 1.3; c.rgb *= 1. - .22 * smoothstep(.35, .95, length(d)); c.rgb += (h(vUv * 900.) - .5) * .025; gl_FragColor = c; }`,
});
composer.addPass(grain);

const overlay = buildOverlay($('#ui')), flashEl = $('#flash');
const tanH = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
const FLASH = [[4.35, .35], [86.4, .5]];

function place(T) {
	const c = camAt(T);
	camera.position.set(c.x, c.y, c.z); camera.lookAt(c.x, c.y, 0); camera.rotation.z = c.rot;
	return c;
}
function renderAt(T) {
	T = clamp(T, 0, DURATION - 1e-4);
	const p = camAt(Math.max(0, T - 1 / 30)), c = place(T);
	const vh = 2 * c.z * tanH, vw = vh * W / H;
	for (const l of LOCS) { const v = Math.abs(l.x - c.x) < vw / 2 + l.w / 2 + 1 && Math.abs(l.y + (l.cy || 0) - c.y) < vh / 2 + l.h / 2 + 1; l.g.visible = v; if (v) l.update(T); }
	// sombra acompanha a câmera
	sun.target.position.set(c.x, c.y, 0); sun.position.set(c.x - 5, c.y + 7, 16);
	const sc = sun.shadow.camera, e = Math.max(vw, vh) * .62 + 2; sc.left = -e; sc.right = e; sc.top = e; sc.bottom = -e; sc.updateProjectionMatrix();
	// desfoque de movimento nos whip pans
	let dx = (c.x - p.x) / vw, dy = (c.y - p.y) / vh;
	if (Math.hypot(dx, dy) > 1.2) dx = dy = 0;
	const k = Math.min(1, Math.hypot(dx, dy) / .12), s = .55;
	blur.uniforms.uDir.value.set(dx * s, dy * s); blur.enabled = Math.hypot(dx, dy) > .004;
	grain.uniforms.uTime.value = Math.floor(T * 12) / 12;
	composer.render();
	overlay(T);
	let f = 0; for (const [t0, d] of FLASH) f = Math.max(f, T >= t0 ? 1 - ease.cubicInOut(seg(T, t0, t0 + d)) : 0);
	flashEl.style.opacity = f * .85;
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

for (let t = .2; t < DURATION; t += 2.5) renderAt(t);   // pré-aquece shaders e texturas
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
