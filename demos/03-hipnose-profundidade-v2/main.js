// Motor do Short 03 v2 (9:16, diorama de brinquedo). Motor herdado do 04 v2 (renderAt, desfoque de whip pan,
// legendas, player com narração + SFX); o mundo (world.js / scenes.js / toy.js) é novo.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { clamp, seg, ease } from './lib.js';
import { P } from './toy.js';
import { buildWorld } from './world.js';
import { update, camPose } from './scenes.js';
import { buildOverlay } from './overlay.js';

const W = 1080, H = 1920, DURATION = 112.4;
const $ = s => document.querySelector(s);
const stage = $('#stage'), params = new URLSearchParams(location.search);
await Promise.all(['900 100px Inter', '800 100px Inter', '700 30px "JetBrains Mono"', '900 30px "JetBrains Mono"'].map(f => document.fonts.load(f)));

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(P.ceu);
const pm = new THREE.PMREMGenerator(renderer);
scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .55;
const camera = new THREE.PerspectiveCamera(30, W / H, .3, 400);
scene.add(new THREE.HemisphereLight('#FFFFFF', '#C9B8A6', 1.25));
const sun = new THREE.DirectionalLight('#FFF3E0', 2.1); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0005; sun.shadow.normalBias = .02; sun.shadow.radius = 5;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 120;
scene.add(sun, sun.target);

const w = buildWorld();
scene.add(w.root);

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
// vinheta + grão leve + "tilt-shift" barato (desfoque nas bordas de cima/baixo)
const look = new ShaderPass({
	uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uTS: { value: 0 } },
	vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
	fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime, uTS; varying vec2 vUv;
		float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + uTime * 7.31) * 43758.5453); }
		void main(){
			float b = uTS * smoothstep(.2, .5, abs(vUv.y - .48));
			vec4 c = vec4(0.); float tw = 0.;
			for (int i = -3; i <= 3; i++) for (int j = -3; j <= 3; j++) { vec2 o = vec2(float(i), float(j)) * b * vec2(.0016, .0009); float wt = 1. - length(vec2(i, j)) / 5.; c += texture2D(tDiffuse, vUv + o) * wt; tw += wt; }
			c /= tw; vec2 d = vUv - .5; d.y *= 1.3; c.rgb *= 1. - .2 * smoothstep(.35, .95, length(d)); c.rgb += (h(vUv * 900.) - .5) * .02; gl_FragColor = c; }`,
});
composer.addPass(look);

const overlay = buildOverlay($('#ui')), flashEl = $('#flash');
const FLASH = [[63.1, .35], [107.2, .45]];

function place(T) {
	const c = camPose(T);
	camera.position.copy(c.pos); camera.lookAt(c.L); camera.fov = c.fov; camera.updateProjectionMatrix();
	camera.rotateZ(Math.sin(T * .23) * .006);
	return c;
}
function renderAt(T) {
	T = clamp(T, 0, DURATION - 1e-4);
	const p = camPose(Math.max(0, T - 1 / 30)), c = place(T);
	update(T, w);
	// sombra acompanha o enquadramento
	sun.target.position.copy(c.L); sun.position.set(c.L.x - 6, c.L.y + 10, c.L.z + 14);
	const sc = sun.shadow.camera, e = c.vh * .75 + 2; sc.left = -e; sc.right = e; sc.top = e; sc.bottom = -e; sc.updateProjectionMatrix();
	// desfoque de movimento nos whip pans (em fração da tela)
	let dx = (c.L.x - p.L.x) / (c.vh * W / H), dy = (c.L.y - p.L.y) / c.vh;
	if (Math.hypot(dx, dy) > 1.2 || !(c.whip || p.whip)) dx = dy = 0;
	blur.uniforms.uDir.value.set(dx * .55, dy * .55); blur.enabled = Math.hypot(dx, dy) > .004;
	look.uniforms.uTime.value = Math.floor(T * 12) / 12;
	look.uniforms.uTS.value = clamp((7 - c.d) / 6, 0, .55);       // tilt-shift só nos planos próximos (efeito maquete)
	composer.render();
	overlay(T);
	let f = 0; for (const [t0, d] of FLASH) f = Math.max(f, T >= t0 ? 1 - ease.cubicInOut(seg(T, t0, t0 + d)) : 0);
	flashEl.style.opacity = f * .8;
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

for (let t = .2; t < DURATION; t += 3.1) renderAt(t);   // pré-aquece shaders e texturas
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
