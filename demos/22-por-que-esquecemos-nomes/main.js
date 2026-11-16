// Motor do Short 22 (9:16, explainer flat) — copiado do 06; + transição whip pan; legendas palavra a palavra de words.json.
// Cada quadro: o set ativo é renderizado num alvo; nas trocas de set, o anterior também, e um shader compõe
// a transição (varrida da bolinha amarela, íris ou zoom through).
import * as THREE from 'three';
import { clamp, seg, ease } from './lib.js';
import { buildWorld, K, keyIndex, runStart, poseAt, TRANS_DUR } from './sets.js';
import { buildOverlay } from './overlay.js';

const W = 1080, H = 1920, DURATION = 50.92;
const $ = s => document.querySelector(s);
const stage = $('#stage'), params = new URLSearchParams(location.search);
await Promise.all(['900 100px Inter', '800 100px Inter', '700 30px "JetBrains Mono"', '800 30px "JetBrains Mono"'].map(f => document.fonts.load(f)));

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.NoToneMapping;
stage.prepend(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 200); camera.position.z = 50;
const w = buildWorld(); scene.add(w.root);

const mkRT = () => new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const rtA = mkRT(), rtB = mkRT();
const comp = new THREE.ShaderMaterial({
	uniforms: { tA: { value: rtA.texture }, tB: { value: rtB.texture }, uP: { value: 1 }, uType: { value: 0 }, uC: { value: new THREE.Vector2(.5, .5) }, uAsp: { value: W / H } },
	vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`,
	fragmentShader: `uniform sampler2D tA, tB; uniform float uP, uAsp; uniform int uType; uniform vec2 uC; varying vec2 vUv;
		const vec3 YEL = vec3(1., .788, .235), INK = vec3(.102, .102, .227);
		vec3 lin(vec3 c){ return pow(c, vec3(2.2)); }
		void main(){
			vec2 uv = vUv; vec4 B = texture2D(tB, uv); vec3 col = B.rgb;
			if (uP < 1.) {
				vec2 q = (uv - uC) * vec2(uAsp, 1.);
				if (uType == 1) {            // varrida da bolinha: borda vertical da esquerda para a direita
					float ex = mix(-.15, 1.15, uP), by = .62 + .04 * sin(uP * 9.);
					vec4 A = texture2D(tA, uv);
					col = uv.x < ex - .02 ? B.rgb : A.rgb;
					float band = smoothstep(.05, .0, abs(uv.x - (ex - .01)));
					col = mix(col, lin(YEL), band * .9);
					vec2 d = (uv - vec2(ex, by)) * vec2(uAsp, 1.); float r = length(d);
					col = mix(col, lin(INK), step(r, .072)); col = mix(col, lin(YEL), step(r, .06));
					col = mix(col, vec3(1.), step(length(d - vec2(.018, .02)), .016));
				} else {                      // íris (2) / zoom through (3): círculo crescendo com aro amarelo
					vec2 ua = uType == 3 ? uC + (uv - uC) / (1. + uP * uP * 5.) : uv;
					vec4 A = texture2D(tA, ua);
					float R = ease(uP) * 1.25, r = length(q);
					col = r < R ? B.rgb : A.rgb;
					col = mix(col, lin(YEL), step(abs(r - R), .022) * step(.001, R));
					col = mix(col, lin(INK), step(abs(r - R - .03), .008) * step(.001, R));
				}
			}
			gl_FragColor = vec4(col, 1.);
			#include <colorspace_fragment>
		}`.replace('float R = ease(uP)', 'float R = (uP < .5 ? 4. * uP * uP * uP : 1. - pow(-2. * uP + 2., 3.) / 2.)'),
	depthTest: false, depthWrite: false,
});
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), comp); quad.frustumCulled = false;
const compScene = new THREE.Scene(); compScene.add(quad);
const compCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const WORDS = await (await fetch('./words.json')).json();
const overlay = buildOverlay($('#ui'), WORDS), flashEl = $('#flash');
const FLASH = [[13.36, .3], [46.05, .3]];
const TYPE = { ball: 1, iris: 2, zoom: 3, whip: 4 };

function setCam(p) {
	const hh = p.vh / 2, hw = hh * W / H;
	camera.left = -hw; camera.right = hw; camera.top = hh; camera.bottom = -hh;
	camera.position.set(p.set * 100 + p.x, p.y, 50); camera.rotation.set(0, 0, p.rot); camera.updateProjectionMatrix();
}
function renderAt(T) {
	T = clamp(T, 0, DURATION - 1e-4);
	w.update(T);
	const i = keyIndex(T), s = runStart(i), ts = K[s].t, trans = s > 0 && K[s].tr && T < ts + TRANS_DUR;
	if (trans) { setCam(poseAt(T, s - 1)); renderer.setRenderTarget(rtA); renderer.render(scene, camera); }
	setCam(poseAt(T, i)); renderer.setRenderTarget(rtB); renderer.render(scene, camera);
	comp.uniforms.uP.value = trans ? seg(T, ts, ts + TRANS_DUR) : 1;
	comp.uniforms.uType.value = trans ? TYPE[K[s].tr] : 0;
	if (trans) comp.uniforms.uC.value.set(...(K[s].at || [.5, .5]));
	renderer.setRenderTarget(null); renderer.render(compScene, compCam);
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

for (let t = .2; t < DURATION; t += 2.3) renderAt(t);   // pré-aquece shaders e texturas
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
