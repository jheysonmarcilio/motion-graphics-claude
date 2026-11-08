// Utilidades do vídeo 02 — tempo, câmera, materiais e peças reutilizáveis.
import * as THREE from 'three';

// ── tempo / easing ──
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const lerp = (a, b, k) => a + (b - a) * k;
export const ease = {
	expoOut: x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x),
	expoIn: x => x <= 0 ? 0 : Math.pow(2, 10 * x - 10),
	expoInOut: x => x <= 0 ? 0 : x >= 1 ? 1 : x < .5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2,
	cubicInOut: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
	cubicOut: x => 1 - Math.pow(1 - x, 3),
	sineInOut: x => -(Math.cos(Math.PI * x) - 1) / 2,
	backOut: x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
};
export const inOut = (t, a, b, c, d, eIn = ease.expoOut, eOut = ease.expoInOut) => eIn(seg(t, a, b)) * (1 - eOut(seg(t, c, d)));
export const eo = (t, a, b) => ease.expoOut(seg(t, a, b));
export const sm = (t, a, b) => ease.cubicInOut(seg(t, a, b));
export function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// pulso 0..1 que acende em `a` e decai
export const pulse = (t, a, w = .6) => t < a ? 0 : Math.exp(-(t - a) / w);

// ── paleta (brand/identidade.md) ──
export const C = {
	abismo: '#06060C', nevoa: '#12122A', sinapse: '#3EE6FF', consciente: '#8B6CFF',
	emocao: '#FF5C7A', luz: '#EEEAFF', eco: '#8A88A8', ambar: '#FFB070', papel: '#E9DFC8',
};
export const col = h => new THREE.Color(h);

// ── UI 2D (HTML sobre o canvas) ──
export function uiLayer(html) {
	const d = document.createElement('div');
	d.className = 'scene-ui'; d.innerHTML = html;
	document.getElementById('ui').appendChild(d);
	return d;
}
export function fade(el, o, ty = 0, blur = 0) {
	el.style.opacity = o;
	el.style.visibility = o < .002 ? 'hidden' : 'visible';
	el.style.transform = ty ? `translateY(${ty}px)` : '';
	el.style.filter = blur > .05 ? `blur(${blur}px)` : 'none';
}
// mostra o elemento entre a e b (entrada expoOut, saída suave)
export function cue(el, t, a, b, { dy = 18, blur = 8, din = .9, dout = .6 } = {}) {
	const k = inOut(t, a, a + din, b - dout, b);
	fade(el, k, (1 - eo(t, a, a + din)) * dy, (1 - k) * blur);
	return k;
}
// atalho: cria todos os elementos com [data-k] e devolve um mapa
export function uiMap(ui) { const m = {}; ui.querySelectorAll('[data-k]').forEach(e => m[e.dataset.k] = e); return m; }

// ── câmera por planos ──
// list: [{ a, b, p0, p1, l0, l1, fov, fov1, e, fn }] — o plano ativo é o último com t >= a
const _l = new THREE.Vector3();
export function shots(cam, t, list, drift = 1) {
	let s = list[0];
	for (const x of list) if (t >= x.a) s = x;
	const k = (s.e || ease.sineInOut)(seg(t, s.a, s.b));
	if (s.fn) s.fn(cam, k, t);
	else {
		const p0 = s.p0, p1 = s.p1 || s.p0, l0 = s.l0, l1 = s.l1 || s.l0;
		cam.position.set(lerp(p0[0], p1[0], k), lerp(p0[1], p1[1], k), lerp(p0[2], p1[2], k));
		_l.set(lerp(l0[0], l1[0], k), lerp(l0[1], l1[1], k), lerp(l0[2], l1[2], k));
		cam.position.x += Math.sin(t * .37) * .025 * drift;
		cam.position.y += Math.sin(t * .29 + 1) * .018 * drift;
		cam.up.set(Math.sin(s.roll ? lerp(s.roll[0], s.roll[1] ?? s.roll[0], k) : 0), 1, 0).normalize();
		cam.lookAt(_l);
	}
	if (s.fov) { const f = lerp(s.fov, s.fov1 ?? s.fov, k); if (Math.abs(cam.fov - f) > 1e-4) { cam.fov = f; cam.updateProjectionMatrix(); } }
	return s;
}
// mergulho rápido para preto em volta de cada corte (0..1)
export function dips(t, times, w = .2) { let o = 0; for (const c of times) o = Math.max(o, 1 - clamp(Math.abs(t - c) / w)); return o; }

// ── texturas de canvas ──
// Ajusta a fonte para o texto CABER em maxW (px do canvas), com margem. Use sempre que o texto vai dentro
// de uma caixa (etiqueta, pasta, cartão, carimbo, documento). Retorna o tamanho usado.
export function fitFont(g, text, maxW, { weight = 800, size = 48, family = 'Inter', track = 0, min = 10 } = {}) {
	let s = size;
	for (; s > min; s -= .5) { g.font = `${weight} ${s}px ${family}`; g.letterSpacing = `${track * s}px`; if (g.measureText(text).width <= maxW) break; }
	return s;
}
export function canvasTex(w, h, draw) {
	const c = document.createElement('canvas'); c.width = w; c.height = h;
	const g = c.getContext('2d'); draw(g, w, h);
	const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
	t.userData.canvas = c;
	return t;
}

// material de textura com opacidade, revelação (esq→dir ou baixo→cima) e tinta
export function texMat(map, { additive = false, color = '#ffffff', opacity = 1, revealY = false, side = THREE.FrontSide } = {}) {
	return new THREE.ShaderMaterial({
		uniforms: { map: { value: map }, uColor: { value: col(color) }, uOpacity: { value: opacity }, uReveal: { value: 1 }, uSoft: { value: .04 } },
		vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
		fragmentShader: `uniform sampler2D map; uniform vec3 uColor; uniform float uOpacity, uReveal, uSoft; varying vec2 vUv;
			void main(){ vec4 c = texture2D(map, vUv); float r = ${revealY ? '1.-vUv.y' : 'vUv.x'};
			float m = 1. - smoothstep(uReveal - uSoft, uReveal, r) ;
			if (uReveal >= 1.) m = 1.;
			gl_FragColor = vec4(c.rgb * uColor, c.a * uOpacity * m); }`,
		transparent: true, depthWrite: false, side, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
	});
}

// plano de texto (tipografia "projetada" no cenário)
export function textPlane(text, { size = 110, weight = 800, family = 'Inter', color = C.luz, track = .2, height = 1, additive = true, glow = 0, italic = false, align = 'center', lineH = 1.18, revealY = false } = {}) {
	const lines = text.split('\n');
	const font = `${italic ? 'italic ' : ''}${weight} ${size}px ${family}`;
	const m = document.createElement('canvas').getContext('2d'); m.font = font; m.letterSpacing = `${track * size}px`;
	const tw = Math.max(...lines.map(l => m.measureText(l).width));
	const pad = size * .6 + glow * 2;
	const w = Math.ceil(tw + pad * 2), h = Math.ceil(lines.length * size * lineH + pad * 2);
	const tex = canvasTex(w, h, g => {
		g.font = font; g.letterSpacing = `${track * size}px`; g.textBaseline = 'middle'; g.textAlign = align;
		g.fillStyle = color;
		if (glow) { g.shadowColor = color; g.shadowBlur = glow; }
		const x = align === 'center' ? w / 2 : align === 'left' ? pad : w - pad;
		lines.forEach((l, i) => g.fillText(l, x + (align === 'center' ? track * size / 2 : 0), pad + size * lineH * (i + .5)));
	});
	const mesh = new THREE.Mesh(new THREE.PlaneGeometry(height * w / h, height), texMat(tex, { additive, revealY }));
	mesh.renderOrder = 10;
	return mesh;
}
export const op = (mesh, o) => { mesh.material.uniforms.uOpacity.value = o; mesh.visible = o > .002; };

// ── linhas (mundo do laboratório) ──
export const lineMat = (color = C.sinapse, opacity = 1) => new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
export const edges = (geo, mat, angle = 20) => new THREE.LineSegments(new THREE.EdgesGeometry(geo, angle), mat);
export function polyline(pts, mat) {
	const g = new THREE.BufferGeometry().setFromPoints(pts.map(p => p.isVector3 ? p : new THREE.Vector3(p[0], p[1], p[2] || 0)));
	return new THREE.Line(g, mat);
}
export function segs(pairs, mat) { // [[x,y,z,x,y,z], ...]
	const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pairs.flat(), 3));
	return new THREE.LineSegments(g, mat);
}
export function reveal(line, k) {
	const g = line.geometry, n = g.index ? g.index.count : g.attributes.position.count;
	let c = Math.floor(n * clamp(k)); if (line.isLineSegments) c -= c % 2;
	g.setDrawRange(0, c); line.visible = c > 0;
}
export function circlePts(r, n = 64, a0 = 0, a1 = Math.PI * 2, cx = 0, cy = 0) {
	const p = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0]); } return p;
}
export function rectPts(w, h) { return [[-w / 2, -h / 2, 0], [w / 2, -h / 2, 0], [w / 2, h / 2, 0], [-w / 2, h / 2, 0], [-w / 2, -h / 2, 0]]; }
export function setLineOpacity(obj, o) { obj.traverse(x => { if (x.material && 'opacity' in x.material && !x.material.uniforms) { x.material.opacity = (x.material.userData.base ?? (x.material.userData.base = x.material.opacity)) * o; } }); obj.visible = o > .002; }

// ── silhuetas (fresnel) ──
export function rimMat(color = C.sinapse, { power = 2.0, fill = .06, opacity = 1 } = {}) {
	return new THREE.ShaderMaterial({
		uniforms: { uColor: { value: col(color) }, uOpacity: { value: opacity }, uFill: { value: fill }, uPower: { value: power } },
		vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
		fragmentShader: `uniform vec3 uColor; uniform float uOpacity, uFill, uPower; varying vec3 vN; varying vec3 vV;
			void main(){ float r = pow(1. - abs(dot(normalize(vN), normalize(vV))), uPower); gl_FragColor = vec4(uColor * (uFill + r * 1.4), uOpacity); }`,
		transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
	});
}
// pessoa estilizada: cápsulas + esfera. set({walk, amp, breathe, tremble, t})
export function figure(mat, { h = 1.75, child = false, hunch = 0 } = {}) {
	const g = new THREE.Group(), u = h / 1.75;
	const headR = (child ? .15 : .115) * u * (child ? 1.6 : 1);
	const cap = (r, l) => new THREE.Mesh(new THREE.CapsuleGeometry(r, l, 4, 10), mat);
	const legL = child ? .5 * u : .8 * u, torsoL = child ? .38 * u : .5 * u;
	const hip = new THREE.Group(); hip.position.y = legL + .05 * u; g.add(hip);
	const torso = cap(.15 * u, torsoL); torso.position.y = torsoL / 2 + .1 * u; hip.add(torso);
	const chest = new THREE.Group(); chest.position.y = torsoL + .12 * u; hip.add(chest); chest.rotation.x = hunch;
	const head = new THREE.Mesh(new THREE.SphereGeometry(headR, 20, 14), mat); head.position.y = headR + .1 * u; chest.add(head);
	const mk = (x, y, r, l, parent) => { const p = new THREE.Group(); p.position.set(x, y, 0); const m = cap(r, l); m.position.y = -l / 2 - r * .6; p.add(m); parent.add(p); return p; };
	const armL = mk(-.21 * u, 0, .055 * u, torsoL * .95, chest), armR = mk(.21 * u, 0, .055 * u, torsoL * .95, chest);
	const lgL = mk(-.09 * u, 0, .07 * u, legL * .85, hip), lgR = mk(.09 * u, 0, .07 * u, legL * .85, hip);
	g.userData = { armL, armR, lgL, lgR, chest, head, hip, torso };
	g.set = ({ walk = 0, amp = 0, breathe = 0, tremble = 0, t = 0 } = {}) => {
		const s = Math.sin(walk) * amp;
		lgL.rotation.x = s; lgR.rotation.x = -s; armL.rotation.x = -s * .8; armR.rotation.x = s * .8;
		hip.position.y = legL + .05 * u + Math.abs(Math.cos(walk)) * amp * .04 * u;
		chest.scale.setScalar(1 + Math.sin(t * 1.3) * .02 * breathe);
		chest.rotation.z = Math.sin(t * 23) * .02 * tremble; head.rotation.x = .25 * tremble;
	};
	return g;
}

// ── partículas: poeira, brilho ──
const dotTex = (() => { let t; return () => t || (t = canvasTex(64, 64, (g, w) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.35, 'rgba(255,255,255,.5)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, w); })); })();
export function dust(rng, n, size3, center, { color = C.ambar, size = 3, opacity = .6 } = {}) {
	const pos = new Float32Array(n * 3), seed = new Float32Array(n);
	for (let i = 0; i < n; i++) { pos[i * 3] = center[0] + (rng() - .5) * size3[0]; pos[i * 3 + 1] = center[1] + (rng() - .5) * size3[1]; pos[i * 3 + 2] = center[2] + (rng() - .5) * size3[2]; seed[i] = rng() * 100; }
	const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
	const m = new THREE.ShaderMaterial({
		uniforms: { uTime: { value: 0 }, uColor: { value: col(color) }, uSize: { value: size }, uOpacity: { value: opacity }, map: { value: dotTex() } },
		vertexShader: `attribute float aSeed; uniform float uTime, uSize; varying float vA;
			void main(){ vec3 p = position + vec3(sin(uTime*.21+aSeed)*.25, sin(uTime*.17+aSeed*1.3)*.18, cos(uTime*.13+aSeed)*.25);
			vec4 mv = modelViewMatrix * vec4(p,1.); gl_Position = projectionMatrix * mv; gl_PointSize = uSize * (40. / -mv.z) * (.6 + .4*sin(aSeed));
			vA = .5 + .5*sin(uTime*.8 + aSeed*3.); }`,
		fragmentShader: `uniform sampler2D map; uniform vec3 uColor; uniform float uOpacity; varying float vA;
			void main(){ float a = texture2D(map, gl_PointCoord).a; gl_FragColor = vec4(uColor, a * uOpacity * vA); }`,
		transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
	});
	const p = new THREE.Points(g, m); p.frustumCulled = false;
	p.tick = t => m.uniforms.uTime.value = t;
	return p;
}

// partículas que migram entre 3 formas (A → B → C) com atraso individual
export function morphPoints(A, B, Cc, { color = C.sinapse, size = 2.2, opacity = 1, rng = Math.random } = {}) {
	const n = A.length / 3, seed = new Float32Array(n);
	for (let i = 0; i < n; i++) seed[i] = rng();
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(A), 3));
	g.setAttribute('aB', new THREE.BufferAttribute(new Float32Array(B), 3));
	g.setAttribute('aC', new THREE.BufferAttribute(new Float32Array(Cc), 3));
	g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
	const m = new THREE.ShaderMaterial({
		uniforms: { uTime: { value: 0 }, uM1: { value: 0 }, uM2: { value: 0 }, uScatter: { value: 0 }, uColor: { value: col(color) }, uSize: { value: size }, uOpacity: { value: opacity }, map: { value: dotTex() } },
		vertexShader: `attribute vec3 aB; attribute vec3 aC; attribute float aSeed; uniform float uTime, uM1, uM2, uScatter, uSize; varying float vA;
			float k(float m){ float d = aSeed*.45; return smoothstep(d, d+.55, m); }
			void main(){ float k1 = k(uM1), k2 = k(uM2);
			vec3 mid = mix(position, aB, k1);
			vec3 swirl = vec3(sin(aSeed*40.+uTime), cos(aSeed*31.+uTime*.8), sin(aSeed*17.)) * .35 * (sin(k1*3.1416) + sin(k2*3.1416));
			vec3 p = mix(mid, aC, k2) + swirl;
			p += vec3(sin(aSeed*91.), cos(aSeed*53.), sin(aSeed*27.)) * uScatter * (2. + aSeed*4.);
			p += vec3(sin(uTime*.6+aSeed*20.), cos(uTime*.5+aSeed*13.), 0.) * .012;
			vec4 mv = modelViewMatrix * vec4(p,1.); gl_Position = projectionMatrix * mv; gl_PointSize = uSize * (12. / -mv.z);
			vA = (.55 + .45*sin(uTime*1.3 + aSeed*30.)) * (1. - uScatter); }`,
		fragmentShader: `uniform sampler2D map; uniform vec3 uColor; uniform float uOpacity; varying float vA;
			void main(){ float a = texture2D(map, gl_PointCoord).a; gl_FragColor = vec4(uColor, a * uOpacity * vA); }`,
		transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
	});
	const p = new THREE.Points(g, m); p.frustumCulled = false;
	p.u = m.uniforms;
	return p;
}
// amostra pixels de um texto em posições 3D (plano XY), centralizado
export function textPoints(text, { size = 120, weight = 800, width = 6, n = 4000, rng = Math.random, track = .15 } = {}) {
	const lines = text.split('\n');
	const c = document.createElement('canvas'), g = c.getContext('2d');
	const font = `${weight} ${size}px Inter`; g.font = font; g.letterSpacing = `${track * size}px`;
	const tw = Math.max(...lines.map(l => g.measureText(l).width));
	c.width = Math.ceil(tw + 40); c.height = Math.ceil(lines.length * size * 1.2 + 40);
	g.font = font; g.letterSpacing = `${track * size}px`; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
	lines.forEach((l, i) => g.fillText(l, c.width / 2, 20 + size * 1.2 * (i + .5)));
	const d = g.getImageData(0, 0, c.width, c.height).data, hits = [];
	for (let y = 0; y < c.height; y += 2) for (let x = 0; x < c.width; x += 2) if (d[(y * c.width + x) * 4 + 3] > 128) hits.push([x, y]);
	const s = width / c.width, out = new Float32Array(n * 3);
	for (let i = 0; i < n; i++) { const [x, y] = hits[Math.floor(rng() * hits.length)]; out[i * 3] = (x - c.width / 2) * s + (rng() - .5) * s * 2; out[i * 3 + 1] = -(y - c.height / 2) * s + (rng() - .5) * s * 2; out[i * 3 + 2] = (rng() - .5) * .04; }
	return out;
}

// cone de luz volumétrica falso (aditivo)
export function lightCone(color = C.ambar, radius = 2, height = 4, opacity = .18) {
	const geo = new THREE.ConeGeometry(radius, height, 48, 1, true); geo.translate(0, -height / 2, 0);
	const m = new THREE.ShaderMaterial({
		uniforms: { uColor: { value: col(color) }, uOpacity: { value: opacity }, uH: { value: height } },
		vertexShader: `varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vY = -position.y; vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
		fragmentShader: `uniform vec3 uColor; uniform float uOpacity, uH; varying float vY; varying vec3 vN; varying vec3 vV;
			void main(){ float f = pow(abs(dot(normalize(vN), normalize(vV))), 2.); float h = vY/uH; gl_FragColor = vec4(uColor, uOpacity * f * (1.-h) * smoothstep(0., .08, h)); }`,
		transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
	});
	return new THREE.Mesh(geo, m);
}

// brilho redondo (sprite aditivo)
export function glow(color = C.sinapse, size = 1, opacity = 1) {
	const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }));
	s.scale.setScalar(size); return s;
}

// ── peça de quebra-cabeça ──
// tabs: [cima, direita, baixo, esquerda] em -1..1 (sinal = encaixe para fora/dentro)
export function pieceShape(s, tabs, N = 14) {
	const pts = [];
	const corners = [[-s / 2, -s / 2], [s / 2, -s / 2], [s / 2, s / 2], [-s / 2, s / 2]];
	const order = [2, 1, 0, 3]; // baixo, direita, cima, esquerda (anti-horário)
	for (let e = 0; e < 4; e++) {
		const [x0, y0] = corners[e], [x1, y1] = corners[(e + 1) % 4];
		const nx = (y1 - y0) / s, ny = -(x1 - x0) / s; // normal para fora
		const tab = tabs[order[e]];
		for (let i = 0; i < N; i++) {
			const u = i / N, b = tab * s * .26 * Math.exp(-Math.pow((u - .5) / .13, 2)) * (1 + .35 * Math.cos((u - .5) * 18) * Math.abs(tab));
			pts.push(new THREE.Vector2(x0 + (x1 - x0) * u + nx * b, y0 + (y1 - y0) * u + ny * b));
		}
	}
	return new THREE.Shape(pts);
}
export function pieceGeo(s, tabs, depth = .06, N = 14) {
	const g = new THREE.ExtrudeGeometry(pieceShape(s, tabs, N), { depth, bevelEnabled: false, curveSegments: 1 });
	g.translate(0, 0, -depth / 2); return g;
}
