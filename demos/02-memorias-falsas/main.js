// Motor do vídeo 02: carrega os capítulos, monta a timeline e renderiza tudo em função do tempo.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { clamp, seg, ease, mulberry32 } from './lib.js';
import TIMEMAP from './timemap.js';

import abertura from './scenes/00-abertura.js';
import pergunta from './scenes/01-pergunta.js';
import lab from './scenes/02-laboratorio.js';
import consultorio from './scenes/03-consultorio.js';
import balao from './scenes/04-balao.js';
import ponte from './scenes/05-ponte.js';
import arquivo from './scenes/06-arquivo.js';
import fora from './scenes/07-fora.js';
import cuidado from './scenes/08-cuidado.js';
import climax from './scenes/09-climax.js';
import conclusao from './scenes/10-conclusao.js';
const MODULES = [abertura, pergunta, lab, consultorio, balao, ponte, arquivo, fora, cuidado, climax, conclusao];

const W = 1920, H = 1080;
const $ = s => document.querySelector(s);
const stage = $('#stage');
const params = new URLSearchParams(location.search);

await Promise.all(['800 100px Inter', '200 100px Inter', '300 100px Inter', '400 100px Inter', 'italic 300 100px Inter', '600 100px Caveat'].map(f => document.fonts.load(f)));

// ── renderer ──
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.prepend(renderer.domElement);

const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }));
composer.setPixelRatio(1); composer.setSize(W, H);
const renderPass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
composer.addPass(renderPass);
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0, .5, .85);
composer.addPass(bloom);
composer.addPass(new OutputPass());
// grão de filme + vinheta (determinístico: semente = tempo)
const grain = new ShaderPass({
	uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uGrain: { value: .045 }, uVig: { value: .38 } },
	vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
	fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime, uGrain, uVig; varying vec2 vUv;
		float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + uTime * 7.31) * 43758.5453); }
		void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 d = vUv - .5; d.x *= 1.6;
		float v = 1. - uVig * smoothstep(.25, 1.0, length(d));
		c.rgb = c.rgb * v + (h(vUv * 1000.) - .5) * uGrain; gl_FragColor = c; }`,
});
composer.addPass(grain);

// ── contexto compartilhado ──
const gltfLoader = new GLTFLoader();
const cache = new Map();
const once = (key, fn) => { if (!cache.has(key)) cache.set(key, fn()); return cache.get(key); };
const ctx = {
	W, H, renderer,
	rng: seed => mulberry32(seed),
	gltf: path => once('g:' + path, () => gltfLoader.loadAsync('/three.js-master/examples/' + path)),
	shared: {},
};

// ── carrega capítulos ──
const scenes = [];
let acc = 0;
for (const m of MODULES) {
	$('#loading').textContent = `carregando… ${m.id}`;
	const s = await m.init(ctx);
	s.meta = m; s.start = acc; s.dur = m.dur; acc += m.dur;
	if (s.ui) s.ui.style.display = 'none';
	scenes.push(s);
}
const ANIM_DUR = acc;
// mapa de tempo: [tempo do vídeo/narração, tempo da animação] — gerado a partir da narração gravada
const TM = params.has('raw') ? [[0, 0], [ANIM_DUR, ANIM_DUR]] : TIMEMAP;
const DURATION = TM[TM.length - 1][0];
function warp(T) { for (let k = 1; k < TM.length; k++) if (T <= TM[k][0] || k === TM.length - 1) { const [a0, b0] = TM[k - 1], [a1, b1] = TM[k]; return b0 + (b1 - b0) * clamp((T - a0) / (a1 - a0), 0, 1); } return T; }
function unwarp(t) { for (let k = 1; k < TM.length; k++) if (t <= TM[k][1] || k === TM.length - 1) { const [a0, b0] = TM[k - 1], [a1, b1] = TM[k]; return a0 + (a1 - a0) * clamp((t - b0) / (b1 - b0), 0, 1); } return t; }

let active = -1;
function activate(i) {
	if (i === active) return;
	const prev = scenes[active];
	if (prev?.ui) prev.ui.style.display = 'none';
	const s = scenes[i];
	renderPass.scene = s.scene; renderPass.camera = s.camera;
	renderer.toneMapping = s.toneMapping ?? THREE.NeutralToneMapping;
	renderer.toneMappingExposure = s.exposure ?? 1;
	if (s.ui) s.ui.style.display = 'block';
	active = i;
}

function renderAt(T) {
	const t = clamp(warp(clamp(T, 0, DURATION - 1e-4)), 0, ANIM_DUR - 1e-4);
	let i = scenes.findIndex(s => t >= s.start && t < s.start + s.dur); if (i < 0) i = scenes.length - 1;
	activate(i);
	const s = scenes[i], lt = t - s.start;
	s.update(lt, s.dur);
	const b = s.bloomFn ? s.bloomFn(lt) : (s.bloom || { strength: 0 });
	bloom.enabled = b.strength > 0; bloom.strength = b.strength; bloom.radius = b.radius ?? .5; bloom.threshold = b.threshold ?? .85;
	if (s.exposureFn) renderer.toneMappingExposure = s.exposureFn(lt);
	grain.uniforms.uTime.value = Math.floor(T * 30) / 30;
	composer.render();
	// fade entre capítulos (curto) + mergulhos internos da cena
	const first = i === 0, last = i === scenes.length - 1;
	const fin = first ? 1 - seg(lt, 0, 1.2) : 1 - ease.cubicInOut(seg(lt, 0, .45));
	const fout = last ? ease.cubicInOut(seg(lt, s.dur - 1.5, s.dur)) : ease.cubicInOut(seg(lt, s.dur - .45, s.dur));
	$('#fade').style.opacity = Math.max(fin, fout, s.fadeFn ? s.fadeFn(lt) : 0);
}

// ── player ──
function fit() { const k = Math.min(innerWidth / W, innerHeight / H); stage.style.transform = `translate(-50%,-50%) scale(${k})`; }
addEventListener('resize', fit); fit();
let playing = true, cur = 0, t0 = performance.now();
const scrub = $('#scrub'), btn = $('#play'), jump = $('#jump');
scrub.max = DURATION;
scenes.forEach(s => { const u = unwarp(s.start); jump.add(new Option(`${Math.floor(u / 60)}:${String(Math.floor(u % 60)).padStart(2, '0')} · ${s.meta.id}`, u)); });
const setPlay = p => { playing = p; btn.textContent = p ? '⏸' : '▶'; t0 = performance.now() - cur * 1000; };
btn.onclick = () => setPlay(!playing);
scrub.oninput = () => { cur = +scrub.value; setPlay(false); };
jump.onchange = () => { cur = +jump.value + .01; setPlay(true); };
addEventListener('keydown', e => {
	if (e.code === 'Space') { e.preventDefault(); setPlay(!playing); }
	if (e.code === 'ArrowRight') { cur = clamp(cur + (e.shiftKey ? 5 : .5), 0, DURATION); setPlay(false); }
	if (e.code === 'ArrowLeft') { cur = clamp(cur - (e.shiftKey ? 5 : .5), 0, DURATION); setPlay(false); }
	if (e.code === 'KeyH') $('#hud').style.display = $('#hud').style.display === 'none' ? '' : 'none';
});
if (params.has('t')) { cur = +params.get('t'); setPlay(false); }
if (params.has('nohud')) $('#hud').style.display = 'none';

// pré-aquece shaders de todos os capítulos
for (const s of scenes) for (const x of [s.start + .5, s.start + s.dur * .5, s.start + s.dur - .1]) renderAt(unwarp(x));
renderAt(cur);
window.__mg = { duration: DURATION, fps: 30, width: W, height: H, renderAt, scenes, current: () => scenes[active] };
$('#loading').remove();
if (params.has('export')) { $('#hud').remove(); window.__mg.loaded = true; }
else (function loop() {
	if (playing) cur = ((performance.now() - t0) / 1000) % DURATION;
	scrub.value = cur; $('#tc').textContent = cur.toFixed(2).padStart(6, '0');
	renderAt(cur);
	requestAnimationFrame(loop);
})();
