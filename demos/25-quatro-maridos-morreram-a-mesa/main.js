// Motor do Short 25 (9:16, true crime cinematográfico) — base do 22 + sets em perspectiva (sets.js / caso.js / crime.js).
// Cada quadro: o plano ativo vai para um alvo; nas trocas, o plano anterior também, e um shader compõe a transição
// (mergulho no preto com tremor, varrida de lanterna, whip) + grade de cor (dessaturação, vinheta, grão).
import * as THREE from 'three';
import { clamp, seg, lerp, ease, wobble } from './lib.js';
import { buildSets, SH } from './sets.js';
import { buildOverlay } from './overlay.js';

const W = 1080, H = 1920, DURATION = 62.9;
const $ = s => document.querySelector(s);
const stage = $('#stage'), params = new URLSearchParams(location.search);
await Promise.all(['900 100px Inter', '800 100px Inter', '700 60px Oswald', '400 40px "Special Elite"'].map(f => document.fonts.load(f)));

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false); stage.prepend(renderer.domElement);

const scene = new THREE.Scene(); scene.background = new THREE.Color('#000'); scene.fog = new THREE.Fog('#000', 5, 30);
const camera = new THREE.PerspectiveCamera(50, W / H, .05, 200);
const S = buildSets(); for (const k in S) { S[k].g.visible = false; scene.add(S[k].g); }

const mkRT = () => new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const rtA = mkRT(), rtB = mkRT();
const comp = new THREE.ShaderMaterial({
	uniforms: { tA: { value: rtA.texture }, tB: { value: rtB.texture }, uP: { value: 1 }, uType: { value: 0 }, uSeed: { value: 0 }, uFade: { value: 1 } },
	vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`,
	fragmentShader: `uniform sampler2D tA, tB; uniform float uP, uSeed, uFade; uniform int uType; varying vec2 vUv;
		const vec3 AMB = vec3(1., .435, .027);
		float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + uSeed) * 43758.5453); }
		void main(){
			vec2 uv = vUv; vec3 col = texture2D(tB, uv).rgb;
			if (uP < 1.) {
				float p = uP;
				if (uType == 1) {            // mergulho no preto com tremor de linha
					vec3 A = texture2D(tA, uv + vec2(sin(uv.y * 90. + p * 20.) * .006 * (1. - p), 0.)).rgb;
					col = p < .5 ? A * (1. - p * 2.) : col * ((p - .5) * 2.);
				} else if (uType == 2) {     // varrida de lanterna (borda âmbar)
					float d = uv.x - mix(-.25, 1.25, p) + (uv.y - .5) * .25; vec3 A = texture2D(tA, uv).rgb;
					col = d < 0. ? col : A; col += AMB * smoothstep(.14, 0., abs(d)) * .7;
				} else {                      // whip pan horizontal
					float s = sin(p * 3.14159); vec3 acc = vec3(0.);
					for (int i = 0; i < 14; i++) { float o = (float(i) / 13. - .5) * .3 * s; vec2 q = clamp(uv + vec2(o + (p < .5 ? p * .5 : (p - 1.) * .5), 0.), 0., 1.); acc += p < .5 ? texture2D(tA, q).rgb : texture2D(tB, q).rgb; }
					col = acc / 14.;
				}
			}
			// aberração cromática leve nas bordas
			vec2 dc = (uv - .5) * .004; col.r = mix(col.r, texture2D(tB, uv + dc).r, uP >= 1. ? .7 : 0.);
			float l = dot(col, vec3(.2126, .7152, .0722)); col = mix(vec3(l), col, .74);
			col = col / (1. + col * .35);
			float v = smoothstep(1.02, .3, length((uv - .5) * vec2(.85, 1.))); col *= mix(.28, 1., v);
			col += (hash(floor(uv * vec2(540., 960.))) - .5) * .045;
			col *= uFade;
			gl_FragColor = vec4(max(col, 0.), 1.);
			#include <colorspace_fragment>
		}`,
	depthTest: false, depthWrite: false,
});
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), comp); quad.frustumCulled = false;
const compScene = new THREE.Scene(); compScene.add(quad); const compCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const WORDS = await (await fetch('./words.json')).json();
const overlay = buildOverlay($('#ui'), WORDS), flashEl = $('#flash'), caseEl = $('#case');
const FLASH = [[42.75, .25, .45], [43.3, .22, .4], [43.9, .25, .45]];
const SHAKE = [[.05, .06], [7.2, .04], [11.34, .06], [14.3, .1], [16.68, .07], [33.4, .05], [33.85, .05], [34.4, .07], [51.9, .14], [54.09, .06]];
const TYPE = { dip: 1, sweep: 2, whip: 3 }, TRANS = .45;
const wx = wobble(11), wy = wobble(23), wz = wobble(37), V0 = new THREE.Vector3();

const shotAt = T => { let i = 0; SH.forEach((s, k) => { if (T >= s[0]) i = k; }); return i; };
function use(i, T) {
	const [t0, name, A, B, , mode] = SH[i], t1 = SH[i + 1] ? SH[i + 1][0] : DURATION, set = S[name];
	for (const k in S) S[k].g.visible = k === name;
	scene.background.set(set.bg); scene.fog.color.set(set.bg); [scene.fog.near, scene.fog.far] = set.fog;
	set.g.tick(T);
	const u = seg(T, t0, t1), e = mode === 'lin' ? u : .45 * u + .55 * ease.sineInOut(u);
	const p = typeof A === 'function' ? A(e) : A.map((v, k) => lerp(v, B[k], e));
	let sh = 0; for (const [ts, a] of SHAKE) if (T >= ts && T < ts + .5) sh += a * Math.exp(-(T - ts) * 9) * Math.sin((T - ts) * 70);
	const hh = .035;
	camera.position.set(p[0] + wx(T * .5) * hh + sh, p[1] + wy(T * .5) * hh + sh * .6, p[2] + wz(T * .4) * hh);
	camera.lookAt(V0.set(p[3] + wx(T * .35 + 9) * hh * .6, p[4] + wy(T * .35 + 9) * hh * .6, p[5]));
	camera.rotation.z += wz(T * .3 + 4) * .006;
}
function renderAt(T) {
	T = clamp(T, 0, DURATION - 1e-4);
	const i = shotAt(T), ts = SH[i][0], tr = i > 0 && SH[i][4] && T < ts + TRANS;
	if (tr) { use(i - 1, T); renderer.setRenderTarget(rtA); renderer.render(scene, camera); }
	use(i, T); renderer.setRenderTarget(rtB); renderer.render(scene, camera);
	comp.uniforms.uP.value = tr ? seg(T, ts, ts + TRANS) : 1; comp.uniforms.uType.value = tr ? TYPE[SH[i][4]] : 0;
	comp.uniforms.uSeed.value = Math.floor(T * 24) * 1.37 % 97;
	comp.uniforms.uFade.value = ease.sineInOut(seg(T, 0, .25)) * (1 - ease.sineInOut(seg(T, DURATION - .45, DURATION)) * .9);
	renderer.setRenderTarget(null); renderer.render(compScene, compCam);
	overlay(T);
	let f = 0; for (const [t0, d, a] of FLASH) f = Math.max(f, T >= t0 ? a * (1 - ease.cubicOut(seg(T, t0, t0 + d))) : 0);
	flashEl.style.opacity = f;
	caseEl.style.opacity = (.75 * seg(T, .3, 1)) * (1 - seg(T, 3.4, 3.7));
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

SH.forEach((s, k) => { renderAt(s[0] + .05); renderAt((s[0] + (SH[k + 1] ? SH[k + 1][0] : DURATION)) / 2); });   // pré-aquece shaders e texturas
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
