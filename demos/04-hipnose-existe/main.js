// Motor do Short 04 (9:16): um palco 3D compartilhado + cenas por trecho da narração + camada HTML sincronizada.
// Todos os tempos são os da narração gravada (audio/04-hipnose-existe.mp3).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { clamp, mulberry32 } from './lib.js';
import { buildWorld } from './world.js';
import { buildOverlay } from './overlay.js';
import SCENES from './scenes/index.js';

const W = 1080, H = 1920, DURATION = 88.35;
const $ = s => document.querySelector(s);
const stage = $('#stage');
const params = new URLSearchParams(location.search);

await Promise.all(['900 100px Inter', '800 100px Inter', '200 100px Inter', '700 30px "JetBrains Mono"'].map(f => document.fonts.load(f)));

// ── renderer ──
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1;
stage.prepend(renderer.domElement);

const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }));
composer.setPixelRatio(1); composer.setSize(W, H);
const renderPass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
composer.addPass(renderPass);
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), .85, .55, .12);
composer.addPass(bloom);
composer.addPass(new OutputPass());
const grain = new ShaderPass({
	uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uGrain: { value: .04 }, uVig: { value: .42 } },
	vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
	fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime, uGrain, uVig; varying vec2 vUv;
		float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + uTime * 7.31) * 43758.5453); }
		void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 d = vUv - .5; d.y *= 1.2;
		float v = 1. - uVig * smoothstep(.3, .95, length(d));
		c.rgb = c.rgb * v + (h(vUv * 1000.) - .5) * uGrain; gl_FragColor = c; }`,
});
composer.addPass(grain);

// ── mundo + camada HTML ──
const gltfLoader = new GLTFLoader();
const ctx = { W, H, renderer, rng: seed => mulberry32(seed), gltf: path => gltfLoader.loadAsync('/three.js-master/examples/' + path) };
const w = await buildWorld(ctx);
renderPass.scene = w.scene; renderPass.camera = w.camera;
const overlay = buildOverlay($('#ui'));
const fadeEl = $('#fade'), flashEl = $('#flash');

const scaled = [w.head.u, w.brain.u, w.brain2.u, w.conn.u, w.sync.u, w.globe.u];
function setScale() { const s = H / (2 * Math.tan(THREE.MathUtils.degToRad(w.camera.fov) / 2)); for (const u of scaled) u.uScale.value = s; w.dust.u.uScale.value = s; }

function renderAt(T) {
	T = clamp(T, 0, DURATION - 1e-4);
	const s = SCENES.find(x => T >= x.t0 && T < x.t1) || SCENES[SCENES.length - 1];
	w.reset(T);
	w.tags = []; w.ui = {};
	s.update(T, w);
	setScale();
	const b = w.bloom; bloom.strength = b.strength; bloom.radius = b.radius; bloom.threshold = b.threshold;
	grain.uniforms.uTime.value = Math.floor(T * 30) / 30;
	composer.render();
	overlay(T, w);
	fadeEl.style.opacity = w.fade;
	flashEl.style.opacity = w.flash;
}

// ── player (narração + SFX) ──
function fit() { const k = Math.min(innerWidth / W, (innerHeight - 44) / H); stage.style.transform = `translate(-50%,-50%) translateY(-22px) scale(${k})`; }
addEventListener('resize', fit); fit();
const voz = $('#voz'), fx = $('#fx');
let playing = false, cur = 0, t0 = performance.now();
const scrub = $('#scrub'), btn = $('#play'), jump = $('#jump');
scrub.max = DURATION;
SCENES.forEach(s => jump.add(new Option(`${s.t0.toFixed(1).padStart(5)}s · ${s.id}`, s.t0)));
const setPlay = p => {
	playing = p; btn.textContent = p ? '⏸' : '▶'; t0 = performance.now() - cur * 1000;
	if (p) { voz.currentTime = cur; voz.play().catch(() => {}); if ($('#sfx').checked) { fx.currentTime = cur; fx.play().catch(() => {}); } } else { voz.pause(); fx.pause(); }
};
btn.onclick = () => setPlay(!playing);
scrub.oninput = () => { cur = +scrub.value; setPlay(false); };
jump.onchange = () => { cur = +jump.value + .01; setPlay(true); };
addEventListener('keydown', e => {
	if (e.code === 'Space') { e.preventDefault(); setPlay(!playing); }
	if (e.code === 'ArrowRight') { cur = clamp(cur + (e.shiftKey ? 5 : .5), 0, DURATION); setPlay(false); }
	if (e.code === 'ArrowLeft') { cur = clamp(cur - (e.shiftKey ? 5 : .5), 0, DURATION); setPlay(false); }
	if (e.code === 'KeyH') $('#hud').style.display = $('#hud').style.display === 'none' ? '' : 'none';
});
if (params.has('t')) cur = +params.get('t');
if (params.has('nohud')) $('#hud').style.display = 'none';

// pré-aquece shaders de todas as cenas
for (const s of SCENES) for (const x of [s.t0 + .3, (s.t0 + s.t1) / 2, s.t1 - .1]) renderAt(x);
renderAt(cur);
window.__mg = { duration: DURATION, fps: 30, width: W, height: H, renderAt };
$('#loading').remove();
if (params.has('export')) { $('#hud').remove(); window.__mg.loaded = true; }
else (function loop() {
	if (playing) {
		cur = (performance.now() - t0) / 1000;
		if (!voz.paused && Math.abs(voz.currentTime - cur) > .08) cur = voz.currentTime, t0 = performance.now() - cur * 1000;   // relógio = áudio
		if (!fx.paused && Math.abs(fx.currentTime - cur) > .08) fx.currentTime = cur;
		if (cur >= DURATION) { cur = 0; setPlay(true); }
	}
	scrub.value = cur; $('#tc').textContent = cur.toFixed(2).padStart(6, '0');
	renderAt(cur);
	requestAnimationFrame(loop);
})();
