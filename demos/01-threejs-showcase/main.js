// Motor do showcase: carrega as cenas, monta a timeline e renderiza tudo em função do tempo.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader, DRACO_GLTF_CONFIG } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { clamp, seg, ease, mulberry32 } from './lib.js';

import intro from './scenes/00-intro.js';
import chars from './scenes/01-personagens.js';
import face from './scenes/02-rosto.js';
import route from './scenes/03-rota.js';
import crime from './scenes/04-crime.js';
import physics from './scenes/05-fisica.js';
import city from './scenes/06-cidade.js';
import ocean from './scenes/07-oceano.js';
import hypno from './scenes/08-hipnose.js';
import globe from './scenes/09-globo.js';
import materials from './scenes/10-materiais.js';
import fx from './scenes/11-efeitos.js';
import outro from './scenes/12-final.js';
const MODULES = [intro, chars, face, route, crime, physics, city, ocean, hypno, globe, materials, fx, outro];

const W = 1920, H = 1080;
const $ = s => document.querySelector(s);
const stage = $('#stage');

// ── renderer ──
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.prepend(renderer.domElement);
const css2d = new CSS2DRenderer({ element: $('#css2d') }); css2d.setSize(W, H);

const composer = new EffectComposer(renderer);
composer.setPixelRatio(1); composer.setSize(W, H);
const renderPass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
composer.addPass(renderPass);
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0, .5, .85);
composer.addPass(bloom);

// ── contexto compartilhado com as cenas ──
const pmrem = new THREE.PMREMGenerator(renderer);
const draco = new DRACOLoader().setDecoderPath(DRACO_GLTF_CONFIG);
const ktx2 = new KTX2Loader().setTranscoderPath('/three.js-master/examples/jsm/libs/basis/').detectSupport(renderer);
const gltfLoader = new GLTFLoader().setDRACOLoader(draco).setKTX2Loader(ktx2).setMeshoptDecoder(MeshoptDecoder);
const cache = new Map();
const once = (key, fn) => { if (!cache.has(key)) cache.set(key, fn()); return cache.get(key); };
const ASSETS = '/three.js-master/examples/';
const ctx = {
	W, H, renderer, composer,
	rng: seed => mulberry32(seed),
	gltf: path => once('g:' + path, () => gltfLoader.loadAsync(ASSETS + path)),
	tex: path => once('t:' + path, () => new THREE.TextureLoader().loadAsync(ASSETS + path)),
	font: path => once('f:' + path, () => new FontLoader().loadAsync(ASSETS + path)),
	hdr: path => once('h:' + path, async () => { const t = await new HDRLoader().loadAsync(ASSETS + path); t.mapping = THREE.EquirectangularReflectionMapping; return t; }),
	envHDR: path => once('e:' + path, async () => pmrem.fromEquirectangular(await ctx.hdr(path)).texture),
	room: () => once('room', () => pmrem.fromScene(new RoomEnvironment(), .04).texture),
};

// ── carrega todas as cenas ──
const scenes = [];
let acc = 0;
for (const m of MODULES) {
	const s = await m.init(ctx);
	s.meta = m; s.start = acc; s.dur = m.dur; acc += m.dur;
	(s.passes || []).forEach(p => { p.enabled = false; composer.addPass(p); });
	if (s.ui) s.ui.style.display = 'none';
	s.labels = [];
	s.scene.traverse(o => { if (o.isCSS2DObject) s.labels.push(o.element); });
	scenes.push(s);
	$('#loading').textContent = `carregando cenas… ${scenes.length}/${MODULES.length}`;
}
composer.addPass(new OutputPass());
const DURATION = acc;

// ── capítulo (overlay HTML) ──
const chap = $('#chap');
function setChapter(s, i) {
	const m = s.meta;
	chap.querySelector('.num').textContent = m.num ? `${m.num} / ${String(MODULES.length - 2).padStart(2, '0')}` : '';
	chap.querySelector('.ttl').innerHTML = m.title || '';
	chap.querySelector('.tags').innerHTML = (m.tags || []).map(t => `<span>${t}</span>`).join('');
	chap.querySelector('.uses').innerHTML = m.uses ? `<b>Use em:</b> ${m.uses}` : '';
	chap.style.display = m.title ? '' : 'none';
}

let active = -1;
function activate(i) {
	if (i === active) return;
	const prev = scenes[active];
	if (prev) { prev.ui && (prev.ui.style.display = 'none'); (prev.passes || []).forEach(p => p.enabled = false); prev.labels.forEach(e => e.style.display = 'none'); prev.onExit?.(); }
	const s = scenes[i];
	renderPass.scene = s.scene; renderPass.camera = s.camera;
	renderer.toneMapping = s.toneMapping ?? THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = s.exposure ?? 1;
	if (s.ui) s.ui.style.display = 'block';
	(s.passes || []).forEach(p => p.enabled = true);
	setChapter(s, i);
	active = i;
}

function renderAt(t) {
	t = clamp(t, 0, DURATION - 1e-4);
	let i = scenes.findIndex(s => t >= s.start && t < s.start + s.dur); if (i < 0) i = scenes.length - 1;
	activate(i);
	const s = scenes[i], lt = t - s.start;
	const b = s.bloom || { strength: 0 };
	bloom.enabled = b.strength > 0; bloom.strength = b.strength; bloom.radius = b.radius ?? .5; bloom.threshold = b.threshold ?? .85;
	s.update(lt, s.dur);
	if (s.bloomFn) Object.assign(bloom, s.bloomFn(lt));
	composer.render();
	css2d.render(s.scene, s.camera);

	// overlay do capítulo
	const cIn = ease.expoOut(seg(lt, .35, 1.2)), cOut = ease.expoInOut(seg(lt, s.dur - .9, s.dur - .35));
	const ci = cIn * (1 - cOut);
	chap.style.opacity = ci; chap.style.transform = `translateX(${(1 - cIn) * -40}px)`;
	$('#counter').textContent = s.meta.num ? `THREE.JS · ${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}` : '';
	$('#progress').style.width = (t / DURATION * 100) + '%';
	const first = i === 0, last = i === scenes.length - 1;
	$('#fade').style.opacity = Math.max(first ? 1 - seg(lt, 0, .6) : 1 - ease.cubicInOut(seg(lt, 0, .35)), last ? ease.cubicInOut(seg(lt, s.dur - .8, s.dur)) : ease.cubicInOut(seg(lt, s.dur - .35, s.dur)));
}

// ── player ──
function fit() { const k = Math.min(innerWidth / W, innerHeight / H); stage.style.transform = `translate(-50%,-50%) scale(${k})`; }
addEventListener('resize', fit); fit();
const params = new URLSearchParams(location.search);
let playing = true, cur = 0, t0 = performance.now();
const scrub = $('#scrub'), btn = $('#play'), jump = $('#jump');
scrub.max = DURATION;
scenes.forEach((s, i) => jump.add(new Option(`${s.start.toFixed(0).padStart(3)}s · ${s.meta.id}`, s.start)));
const setPlay = p => { playing = p; btn.textContent = p ? '⏸' : '▶'; t0 = performance.now() - cur * 1000; };
btn.onclick = () => setPlay(!playing);
scrub.oninput = () => { cur = +scrub.value; setPlay(false); };
jump.onchange = () => { cur = +jump.value + .01; setPlay(true); };
addEventListener('keydown', e => {
	if (e.code === 'Space') { e.preventDefault(); setPlay(!playing); }
	if (e.code === 'ArrowRight') { cur = clamp(cur + (e.shiftKey ? 1 : .1), 0, DURATION); setPlay(false); }
	if (e.code === 'ArrowLeft') { cur = clamp(cur - (e.shiftKey ? 1 : .1), 0, DURATION); setPlay(false); }
	if (e.code === 'KeyH') $('#hud').style.display = $('#hud').style.display === 'none' ? '' : 'none';
});
if (params.has('t')) { cur = +params.get('t'); setPlay(false); }
if (params.has('nohud')) $('#hud').style.display = 'none';

// pré-aquece: compila os shaders de todas as cenas antes de tocar/exportar
for (const s of scenes) { renderAt(s.start + .05); renderAt(s.start + s.dur - .05); }
window.__mg = { duration: DURATION, fps: 30, width: W, height: H, renderAt, scenes };
await document.fonts.ready;
$('#loading').remove();
if (params.has('export')) { $('#hud').remove(); window.__mg.loaded = true; }
else (function loop() {
	if (playing) cur = ((performance.now() - t0) / 1000) % DURATION;
	scrub.value = cur; $('#tc').textContent = cur.toFixed(2).padStart(6, '0');
	renderAt(cur);
	requestAnimationFrame(loop);
})();
