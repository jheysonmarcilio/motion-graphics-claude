// Motor do Short 07 (9:16, anúncio, 3D pop brilhante). Player/legendas herdados do 06; mundo em world.js.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { clamp, seg, ease } from './lib.js';
import { buildWorld, buildSwinger, camPose } from './world.js';
import { buildOverlay } from './overlay.js';

const W = 1080, H = 1920, DURATION = 35.65, FOV = 30;
const $ = s => document.querySelector(s);
const stage = $('#stage'), params = new URLSearchParams(location.search);
await Promise.all(['900 100px Inter', '800 100px Inter', '700 30px "JetBrains Mono"', '800 30px "JetBrains Mono"'].map(f => document.fonts.load(f)));

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color();
const pm = new THREE.PMREMGenerator(renderer);
scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .8;
const camera = new THREE.PerspectiveCamera(FOV, W / H, .05, 400); scene.add(camera);
scene.add(new THREE.HemisphereLight('#FFFFFF', '#B9A0C8', 1.1));
const sun = new THREE.DirectionalLight('#FFF6EC', 2.2); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0005; sun.shadow.normalBias = .02; sun.shadow.radius = 6;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 60;
scene.add(sun, sun.target);
const rim = new THREE.DirectionalLight('#FFFFFF', 1.2); scene.add(rim, rim.target);

const w = buildWorld(); scene.add(w.root);
const swing = buildSwinger(camera);

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
const look = new ShaderPass({
	uniforms: { tDiffuse: { value: null }, uTime: { value: 0 } },
	vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
	fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime; varying vec2 vUv;
		float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)) + uTime * 7.31) * 43758.5453); }
		void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 d = vUv - .5; d.y *= 1.25;
			c.rgb *= 1. - .22 * smoothstep(.3, .95, length(d)); c.rgb += (h(vUv * 900.) - .5) * .015; gl_FragColor = c; }`,
});
composer.addPass(look);

const overlay = buildOverlay($('#ui')), flashEl = $('#flash');
const FLASH = [[2.45, .25], [32.92, .3], [34.24, .45]];
const bgA = new THREE.Color(), bgB = new THREE.Color();

function camAt(T) {
	const c = camPose(T), d = c.vh / (2 * Math.tan(FOV * Math.PI / 360));
	const dir = new THREE.Vector3(Math.sin(c.az) * Math.cos(c.el), Math.sin(c.el), Math.cos(c.az) * Math.cos(c.el));
	const L = c.S.clone(); L.y -= c.vh * .16;
	return { ...c, pos: L.clone().addScaledVector(dir, d), L };
}
function renderAt(T) {
	T = clamp(T, 0, DURATION - 1e-4);
	const p = camAt(Math.max(0, T - 1 / 30)), c = camAt(T);
	camera.position.copy(c.pos); camera.lookAt(c.L); camera.rotateZ(Math.sin(T * .31) * .008);
	camera.near = Math.max(.02, c.vh * .02); camera.updateProjectionMatrix();
	w.update(T); swing(T);
	scene.background.copy(bgA.set(c.bgA)).lerp(bgB.set(c.bgB), c.bk);
	sun.target.position.copy(c.S); sun.position.set(c.S.x - 5, c.S.y + 9, c.S.z + 10);
	rim.target.position.copy(c.S); rim.position.set(c.S.x + 6, c.S.y + 3, c.S.z - 6);
	const sc = sun.shadow.camera, e = Math.min(14, c.vh * .8 + 2); sc.left = -e; sc.right = e; sc.top = e; sc.bottom = -e; sc.updateProjectionMatrix();
	// desfoque de movimento nos whips (direção do deslocamento na tela, limitado)
	let dx = 0, dy = 0;
	if (c.whip || p.whip) { const v = c.L.clone().sub(p.L).project ? null : null; dx = (c.L.x - p.L.x) / (c.vh * W / H); dy = (c.L.y - p.L.y) / c.vh; const m = Math.hypot(dx, dy); if (m > .12) { dx *= .12 / m; dy *= .12 / m; } }
	blur.uniforms.uDir.value.set(-dx, -dy); blur.enabled = Math.hypot(dx, dy) > .002;
	look.uniforms.uTime.value = Math.floor(T * 12) / 12;
	composer.render();
	overlay(T);
	let f = 0; for (const [t0, d] of FLASH) f = Math.max(f, T >= t0 ? 1 - ease.cubicInOut(seg(T, t0, t0 + d)) : 0);
	flashEl.style.opacity = f * .55;
}

// ── player (narração) ──
function fit() { const k = Math.min(innerWidth / W, (innerHeight - 44) / H); stage.style.transform = `translate(-50%,-50%) translateY(-22px) scale(${k})`; }
addEventListener('resize', fit); fit();
const voz = $('#voz'), scrub = $('#scrub'), btn = $('#play');
let playing = false, cur = 0, t0 = performance.now();
const setPlay = q => { playing = q; btn.textContent = q ? '⏸' : '▶'; t0 = performance.now() - cur * 1000; if (q) { voz.currentTime = cur; voz.play().catch(() => {}); } else voz.pause(); };
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

for (let t = .2; t < DURATION; t += 1.7) renderAt(t);   // pré-aquece shaders e texturas
renderAt(cur);
window.__mg = { duration: DURATION, fps: 30, width: W, height: H, renderAt, scene, current: () => ({ scene, camera }) };
$('#loading').remove();
if (params.has('export')) { $('#hud').remove(); window.__mg.loaded = true; }
else (function loop() {
	if (playing) {
		cur = (performance.now() - t0) / 1000;
		if (!voz.paused && Math.abs(voz.currentTime - cur) > .08) cur = voz.currentTime, t0 = performance.now() - cur * 1000;
		if (cur >= DURATION) { cur = 0; setPlay(true); }
	}
	scrub.value = cur; $('#tc').textContent = cur.toFixed(2).padStart(6, '0');
	renderAt(cur);
	requestAnimationFrame(loop);
})();
