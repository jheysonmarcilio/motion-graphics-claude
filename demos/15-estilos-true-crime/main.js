// Motor do 15 (16:9). Blocos de estilos alternados (flat → brinquedo → papel → neural, 2×) e, no final, o estilo True Crime.
// Cada bloco é uma cena three.js própria; nas trocas, os dois são renderizados e um shader compõe a transição.
import * as THREE from 'three';
import { clamp, seg, ease, mulberry32 } from './lib.js';
import * as B from './blocks.js';
import { buildCrime, CC } from './crime.js';

const W = 1920, H = 1080, DURATION = 118;
const $ = s => document.querySelector(s);
const stage = $('#stage'), params = new URLSearchParams(location.search);
await Promise.all(['900 60px Inter', '800 60px Inter', '700 60px Oswald', '400 40px "Special Elite"', '400 40px "Permanent Marker"', '700 30px "JetBrains Mono"'].map(f => document.fonts.load(f)));
const words = await (await fetch('./words.json')).json();

// tempo de uma palavra (1ª ocorrência n-ésima; normalizada)
const norm = s => s.toLowerCase().normalize('NFC').replace(/[.,:;!?…"“”]/g, '');
const flat = words.segs.flatMap(s => s.words);
const tw = (w, n = 0) => { const a = flat.filter(x => norm(x[0]) === w); if (!a[n]) throw new Error('palavra não achada: ' + w); return a[n][1]; };

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false); stage.prepend(renderer.domElement);

// blocos a partir dos segmentos
const order = [], first = {};
words.segs.forEach(s => { if (!(s.block in first)) { first[s.block] = s.t0; order.push(s.block); } });
const T0 = order.map((k, i) => i ? first[k] - .3 : 0), T1 = order.map((k, i) => i + 1 < order.length ? first[order[i + 1]] - .3 : DURATION);
const BUILD = { flat: B.flatA, toy: B.toyA, paper: B.paperA, neural: B.neuralA, flat2: B.flatB, toy2: B.toyB, paper2: B.paperB, neural2: B.neuralB, crime: buildCrime };
const TR = { toy: 1, paper: 2, neural: 3, flat2: 1, toy2: 2, paper2: 1, neural2: 3, crime: 4 };
const TRC = { toy: [1, .8, .3], paper: [.95, .3, .3], neural: [.3, .85, 1], flat2: [1, .8, .24], toy2: [.3, .8, .55], paper2: [1, .82, .25], neural2: [1, .85, .4], crime: [0, 0, 0] };
const blocks = order.map((k, i) => ({ id: k, t0: T0[i], t1: T1[i], ...BUILD[k]({ tw, t0: T0[i], t1: T1[i] }) }));
const crime = blocks[blocks.length - 1];

const mkRT = () => new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const rtA = mkRT(), rtB = mkRT();
const comp = new THREE.ShaderMaterial({
	uniforms: { tA: { value: rtA.texture }, tB: { value: rtB.texture }, uP: { value: 1 }, uType: { value: 0 }, uCol: { value: new THREE.Vector3(1, .8, .2) }, uAsp: { value: W / H } },
	vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`,
	fragmentShader: `uniform sampler2D tA, tB; uniform float uP, uAsp; uniform int uType; uniform vec3 uCol; varying vec2 vUv;
		vec3 lin(vec3 c){ return pow(c, vec3(2.2)); }
		float eio(float x){ return x < .5 ? 4.*x*x*x : 1. - pow(-2.*x + 2., 3.) / 2.; }
		void main(){
			vec2 uv = vUv; vec3 col = texture2D(tB, uv).rgb;
			if (uP < 1.) {
				float p = eio(uP);
				if (uType == 1) {                       // varrida diagonal com faixa de cor
					float ex = mix(-.3, 1.3, p), d = uv.x + (uv.y - .5) * .35;
					vec3 A = texture2D(tA, uv).rgb; col = d < ex - .03 ? col : A;
					col = mix(col, lin(uCol), smoothstep(.05, .0, abs(d - (ex - .015))) * .95);
				} else if (uType == 2) {                // íris com aro
					vec2 q = (uv - .5) * vec2(uAsp, 1.); float R = p * 1.3, r = length(q); vec3 A = texture2D(tA, uv).rgb;
					col = r < R ? col : A; col = mix(col, lin(uCol), step(abs(r - R), .02) * step(.001, R));
				} else if (uType == 3) {                // zoom through
					vec2 ua = .5 + (uv - .5) / (1. + p * p * 4.); vec3 A = texture2D(tA, ua).rgb;
					vec2 ub = .5 + (uv - .5) * (1. - .25 * (1. - p)); vec3 Bz = texture2D(tB, ub).rgb; col = mix(A, Bz, smoothstep(.35, .75, p));
				} else {                                // true crime: mergulho no preto com picos de tremor
					vec3 A = texture2D(tA, uv + vec2(sin(uv.y * 60.) * .004 * (1. - p), 0.)).rgb; col = p < .5 ? A * (1. - p * 2.) : col * ((p - .5) * 2.);
				}
			}
			gl_FragColor = vec4(col, 1.);
			#include <colorspace_fragment>
		}`,
	depthTest: false, depthWrite: false,
});
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), comp); quad.frustumCulled = false;
const compScene = new THREE.Scene(); compScene.add(quad); const compCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const capEl = $('#cap'), tcEl = $('#tc'), tagEl = $('#tag'), recEl = $('#rec'), flashEl = $('#flash'), grain = $('#grain'), gctx = grain.getContext('2d');
const TRANS = .6;
const blockAt = T => { let i = 0; blocks.forEach((b, k) => { if (T >= b.t0) i = k; }); return i; };

let capKey = '';
function captions(T, isCrime) {
	const s = words.segs.find(x => T >= x.t0 - .05 && T <= x.t1 + .35);
	capEl.classList.toggle('crime', isCrime);
	if (!s) { if (capKey) { capEl.innerHTML = ''; capKey = ''; } return; }
	const key = s.t0 + (isCrime ? 'c' : '');
	if (key !== capKey) { capKey = key; capEl.innerHTML = s.words.map((w, i) => `<span class="w" data-i="${i}">${w[0]}</span>`).join(' '); }
	const out = 1 - ease.cubicOut(seg(T, s.t1 + .1, s.t1 + .35));
	capEl.style.opacity = out;
	capEl.querySelectorAll('.w').forEach((el, i) => { const w = s.words[i], k = ease.backOut(seg(T, w[1] - .04, w[1] + .16)); el.style.opacity = clamp(k * 1.5); el.style.transform = isCrime ? 'none' : `translateY(${(1 - k) * 22}px) scale(${.85 + .15 * k})`; });
}
function crimeDom(T, on) {
	tcEl.style.display = on ? 'block' : 'none'; if (!on) return;
	const tl = T - crime.t0, bars = 96 * ease.cubicOut(seg(tl, .2, 1.2));
	tcEl.querySelector('.top').style.height = tcEl.querySelector('.bot').style.height = bars + 'px';
	const names = ['RUA DAS FLORES · 23:47', 'SALA DO DEPOIMENTO', 'FILA DE RECONHECIMENTO', 'LABORATÓRIO · ANOS DEPOIS', 'DADOS · INNOCENCE PROJECT', 'QUADRO DE PROVAS', 'ARQUIVO ENCERRADO'];
	const k = crime.setAt(T);
	tagEl.textContent = `ARQUIVO Nº 0714 · CASO ILUSTRATIVO\n${names[k]}`; tagEl.style.opacity = seg(tl, .5, 1.2);
	recEl.textContent = (Math.floor(T * 2) % 2 ? '● ' : '○ ') + 'REC'; recEl.style.display = k === 6 ? 'none' : '';
	const r = mulberry32(Math.floor(T * 24) + 7), id = gctx.createImageData(320, 180);
	for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
	gctx.putImageData(id, 0, 0);
}

function renderAt(T) {
	T = clamp(T, 0, DURATION - 1e-4);
	const i = blockAt(T), b = blocks[i], inTr = i > 0 && T < b.t0 + TRANS;
	if (inTr) { const a = blocks[i - 1]; a.tick(Math.min(T, a.t1)); renderer.setRenderTarget(rtA); renderer.render(a.scene, a.camera); }
	b.tick(T); renderer.setRenderTarget(rtB); renderer.render(b.scene, b.camera);
	comp.uniforms.uP.value = inTr ? seg(T, b.t0, b.t0 + TRANS) : 1; comp.uniforms.uType.value = inTr ? TR[b.id] : 0;
	if (inTr) comp.uniforms.uCol.value.set(...TRC[b.id]);
	renderer.setRenderTarget(null); renderer.render(compScene, compCam);
	const isCrime = b.id === 'crime' && !inTr;
	captions(T, b.id === 'crime'); crimeDom(T, b.id === 'crime' && (!inTr || T > b.t0 + TRANS * .5));
	flashEl.style.opacity = b.id === 'crime' ? crime.flash(T) * .35 : 0;
}

// ── player ──
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

for (let t = .3; t < DURATION; t += 3.1) renderAt(t);   // pré-aquece shaders e texturas
renderAt(cur);
window.__mg = { duration: DURATION, fps: 30, width: W, height: H, renderAt, current: () => { const b = blocks[blockAt(cur)]; return { scene: b.scene, camera: b.camera }; } };
$('#loading').remove();
if (params.has('export')) { $('#hud').remove(); window.__mg.loaded = true; }
else (function loop() {
	if (playing) {
		cur = (performance.now() - t0) / 1000;
		if (!voz.paused && Math.abs(voz.currentTime - cur) > .08) cur = voz.currentTime, t0 = performance.now() - cur * 1000;
		if (cur >= DURATION) { cur = 0; setPlay(true); }
	}
	scrub.value = cur; $('#tc2').textContent = cur.toFixed(2).padStart(6, '0');
	renderAt(cur);
	requestAnimationFrame(loop);
})();
