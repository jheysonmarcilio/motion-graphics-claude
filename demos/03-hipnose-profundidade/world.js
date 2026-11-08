// Mundo compartilhado do Short 03: um único palco 3D com todos os elementos.
// Cada cena (scenes/*.js) liga só o que precisa a cada quadro — w.reset() desliga tudo antes.
import * as THREE from 'three';
import { clamp, seg, ease, lerp } from './lib.js';

export const C = {
	abismo: '#06060C', nevoa: '#12122A', sinapse: '#3EE6FF', consciente: '#8B6CFF', emocao: '#FF5C7A',
	luz: '#EEEAFF', eco: '#8A88A8', verde: '#5CF2C0', sol: '#FFC48A',
};
const col = h => new THREE.Color(h);
const ADD = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };

// ── textura de brilho (sprite) ──
function glowTex() {
	const c = document.createElement('canvas'); c.width = c.height = 128;
	const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
	gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.18, 'rgba(255,255,255,.75)'); gr.addColorStop(.45, 'rgba(255,255,255,.18)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
	g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
	const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function glow(tex, color, size) {
	const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, ...ADD }));
	s.scale.setScalar(size); s.userData.size = size; return s;
}

// ── shader de partículas comum ──
const pointFrag = `
	varying vec3 vC; varying float vA;
	void main(){ float r = length(gl_PointCoord - .5); if (r > .5) discard;
		float a = smoothstep(.5, .05, r); gl_FragColor = vec4(vC, a * vA); }`;

// ── cabeça de partículas (Lee Perry-Smith / triplegangers.com, CC BY 3.0) ──
async function makeHead(ctx, rng, n = 16000) {
	const gl = await ctx.gltf('models/gltf/LeePerrySmith/LeePerrySmith.glb');
	let mesh; gl.scene.traverse(o => { if (o.isMesh && !mesh) mesh = o; });
	mesh.updateMatrixWorld(true);
	const pos = mesh.geometry.attributes.position, idx = mesh.geometry.index, v = new THREE.Vector3();
	const A = new THREE.Vector3(), B = new THREE.Vector3(), Cc = new THREE.Vector3();
	// amostragem por área de triângulo (distribuição uniforme na superfície)
	const tri = idx ? idx.count / 3 : pos.count / 3, area = new Float32Array(tri); let tot = 0;
	const vi = (k) => idx ? idx.getX(k) : k;
	for (let i = 0; i < tri; i++) {
		A.fromBufferAttribute(pos, vi(i * 3)); B.fromBufferAttribute(pos, vi(i * 3 + 1)); Cc.fromBufferAttribute(pos, vi(i * 3 + 2));
		tot += B.sub(A).cross(Cc.sub(A)).length() * .5; area[i] = tot;
	}
	const P = new Float32Array(n * 3);
	for (let i = 0; i < n; i++) {
		const r = rng() * tot; let lo = 0, hi = tri - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (area[m] < r) lo = m + 1; else hi = m; }
		A.fromBufferAttribute(pos, vi(lo * 3)); B.fromBufferAttribute(pos, vi(lo * 3 + 1)); Cc.fromBufferAttribute(pos, vi(lo * 3 + 2));
		let a = rng(), b = rng(); if (a + b > 1) { a = 1 - a; b = 1 - b; }
		v.copy(A).addScaledVector(B.sub(A), a).addScaledVector(Cc.sub(A), b).applyMatrix4(mesh.matrixWorld);
		P.set([v.x, v.y, v.z], i * 3);
	}
	const box = new THREE.Box3().setFromArray(P), c = box.getCenter(new THREE.Vector3()), s = 3 / (box.max.y - box.min.y);
	const rnd = new Float32Array(n), dir = new Float32Array(n * 3);
	for (let i = 0; i < n; i++) {
		P[i * 3] = (P[i * 3] - c.x) * s; P[i * 3 + 1] = (P[i * 3 + 1] - c.y) * s; P[i * 3 + 2] = (P[i * 3 + 2] - c.z) * s;
		rnd[i] = rng();
		v.set(P[i * 3] + (rng() - .5) * 1.5, P[i * 3 + 1] + (rng() - .5) * 1.5, P[i * 3 + 2] + (rng() - .5) * 1.5).normalize();
		dir.set([v.x, v.y, v.z], i * 3);
	}
	const geo = new THREE.BufferGeometry();
	geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
	geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 1));
	geo.setAttribute('aDir', new THREE.BufferAttribute(dir, 3));
	const u = {
		uTime: { value: 0 }, uSize: { value: .011 }, uScale: { value: 1 }, uScatter: { value: 0 }, uPulseR: { value: -9 }, uOpacity: { value: .6 },
		uColA: { value: col(C.sinapse) }, uColB: { value: col(C.consciente) }, uHi: { value: col(C.luz) }, uWarnCol: { value: col(C.emocao) },
		uWarn: { value: 0 }, uGlow: { value: 0 },
	};
	const mat = new THREE.ShaderMaterial({
		uniforms: u, ...ADD,
		vertexShader: `
			attribute float aRnd; attribute vec3 aDir;
			uniform float uTime, uSize, uScale, uScatter, uPulseR, uOpacity, uWarn, uGlow;
			uniform vec3 uColA, uColB, uHi, uWarnCol;
			varying vec3 vC; varying float vA;
			void main(){
				vec3 p = position + aDir * uScatter * (.6 + aRnd * 3.);
				p += .018 * vec3(sin(uTime * 1.3 + aRnd * 40.), cos(uTime * 1.1 + aRnd * 30.), sin(uTime * .9 + aRnd * 20.));
				float d = length(position - vec3(0., .4, 0.));
				float pulse = exp(-pow((d - uPulseR) * 3.2, 2.));
				float mx = clamp(.5 - position.y / 3. + (aRnd - .5) * .5, 0., 1.);
				vC = mix(mix(uColA, uColB, mx), uWarnCol, uWarn) + uHi * (pulse * 1.3 + uGlow);
				vec4 mv = modelViewMatrix * vec4(p, 1.);
				gl_PointSize = uSize * uScale / max(-mv.z, .05) * (.55 + aRnd * .9) * (1. + pulse * .8);
				gl_Position = projectionMatrix * mv;
				vA = uOpacity * (1. - clamp(uScatter * .35, 0., 1.)) * (.7 + .3 * sin(uTime * 2. + aRnd * 50.));
			}`,
		fragmentShader: pointFrag,
	});
	const pts = new THREE.Points(geo, mat); pts.frustumCulled = false;
	const g = new THREE.Group(); g.add(pts); g.position.y = .5;
	return { g, u };
}

// ── túnel em espiral (anéis de partículas que vêm em direção à câmera) ──
function makeTunnel(rng, rings = 120, per = 130, gap = .85) {
	const n = rings * per, z = new Float32Array(n), ang = new Float32Array(n), rnd = new Float32Array(n);
	for (let r = 0, k = 0; r < rings; r++) for (let j = 0; j < per; j++, k++) { z[k] = r * gap + rng() * gap * .3; ang[k] = j / per * Math.PI * 2 + rng() * .04; rnd[k] = rng(); }
	const geo = new THREE.BufferGeometry();
	geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
	geo.setAttribute('aZ', new THREE.BufferAttribute(z, 1)); geo.setAttribute('aAng', new THREE.BufferAttribute(ang, 1)); geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 1));
	const u = {
		uTime: { value: 0 }, uScroll: { value: 0 }, uLen: { value: rings * gap }, uRad: { value: 2.6 }, uTwist: { value: .12 }, uSize: { value: .035 }, uScale: { value: 1 }, uOpacity: { value: 1 },
		uColA: { value: col(C.sinapse) }, uColB: { value: col(C.consciente) }, uWarnCol: { value: col(C.emocao) }, uWarn: { value: 0 },
	};
	const mat = new THREE.ShaderMaterial({
		uniforms: u, ...ADD,
		vertexShader: `
			attribute float aZ, aAng, aRnd;
			uniform float uTime, uScroll, uLen, uRad, uTwist, uSize, uScale, uOpacity, uWarn;
			uniform vec3 uColA, uColB, uWarnCol;
			varying vec3 vC; varying float vA;
			void main(){
				float m = mod(aZ + uScroll, uLen);
				float z = 4. - (uLen - m);
				float ang = aAng + z * uTwist + uTime * .15;
				float r = uRad * (1. + .07 * sin(aAng * 5. + z * .6 + uTime * 1.3)) + (aRnd - .5) * .22;
				vec3 p = vec3(cos(ang) * r, sin(ang) * r, z);
				float arm = pow(.5 + .5 * sin(aAng * 4. - z * .35), 3.);
				vC = mix(mix(uColA, uColB, clamp(-z / 30., 0., 1.)), uWarnCol, uWarn) * (.25 + 1.3 * arm);
				vec4 mv = modelViewMatrix * vec4(p, 1.);
				vA = uOpacity * smoothstep(.2, 2.2, -mv.z) * smoothstep(0., 14., m);
				gl_PointSize = uSize * uScale / max(-mv.z, .05) * (.6 + aRnd);
				gl_Position = projectionMatrix * mv;
			}`,
		fragmentShader: pointFrag,
	});
	const pts = new THREE.Points(geo, mat); pts.frustumCulled = false;
	return { g: pts, u };
}

// ── espiral hipnótica de fundo (plano em tela cheia) ──
function makeSpiral(asp) {
	const u = { uTime: { value: 0 }, uAsp: { value: asp }, uK: { value: 0 }, uC1: { value: col('#2a1170') }, uC2: { value: col('#6a1a6a') }, uCy: { value: .12 } };
	const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
		uniforms: u, depthWrite: false, depthTest: false,
		vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, .9999, 1.); }`,
		fragmentShader: `
			uniform float uTime, uAsp, uK, uCy; uniform vec3 uC1, uC2; varying vec2 vUv;
			void main(){
				vec2 p = (vUv - vec2(.5, .5 + uCy)) * vec2(uAsp, 1.) * 2.;
				float r = length(p), a = atan(p.y, p.x);
				float s = fract(a / 6.2831 * 3. + log(r + .001) * 1.6 - uTime * .45);
				float band = smoothstep(.0, .05, s) - smoothstep(.45, .5, s) + smoothstep(.95, 1., s);
				vec3 base = vec3(.024, .024, .047);
				vec3 c2 = mix(uC1, uC2, .5 + .5 * sin(uTime * .7 + r * 2.));
				vec3 c = mix(base, c2, band * uK * .55);
				c += vec3(.35, .3, 1.) * exp(-r * 2.6) * .35 * uK;
				c = mix(base, c, smoothstep(1.6, .1, r) * .9 + .1);
				gl_FragColor = vec4(c, 1.);
			}`,
	}));
	m.frustumCulled = false; m.renderOrder = -10;
	return { g: m, u };
}

// ── poeira de fundo ──
function makeDust(rng, n = 1400) {
	const P = new Float32Array(n * 3), rnd = new Float32Array(n);
	for (let i = 0; i < n; i++) { P.set([(rng() - .5) * 18, (rng() - .5) * 22, -16 + rng() * 24], i * 3); rnd[i] = rng(); }
	const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(P, 3)); geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 1));
	const u = { uTime: { value: 0 }, uScale: { value: 1 }, uOpacity: { value: .7 }, uCol: { value: col('#9f9cff') } };
	const pts = new THREE.Points(geo, new THREE.ShaderMaterial({
		uniforms: u, ...ADD,
		vertexShader: `attribute float aRnd; uniform float uTime, uScale, uOpacity; uniform vec3 uCol; varying vec3 vC; varying float vA;
			void main(){ vec3 p = position + vec3(sin(uTime * .21 + aRnd * 30.) * .4, mod(uTime * .12 * (.5 + aRnd) + aRnd * 22., 22.) - 11. - position.y * 0., cos(uTime * .17 + aRnd * 20.) * .4);
				p.y = position.y * 0. + p.y; vC = uCol; vec4 mv = modelViewMatrix * vec4(p, 1.);
				vA = uOpacity * (.25 + .75 * aRnd) * smoothstep(.3, 2., -mv.z);
				gl_PointSize = .02 * uScale / max(-mv.z, .05) * (.5 + aRnd); gl_Position = projectionMatrix * mv; }`,
		fragmentShader: pointFrag,
	}));
	pts.frustumCulled = false;
	return { g: pts, u };
}

// ── ilha do "lugar seguro" (partículas que crescem do centro) ──
function makeIsland(rng) {
	const P = [], Cl = [], O = [], R = [], T = [];
	const push = (x, y, z, c, o, t) => { P.push(x, y, z); Cl.push(c.r, c.g, c.b); O.push(o); R.push(rng()); T.push(t); };
	const cG = col(C.verde), cS = col(C.sinapse), cV = col(C.consciente), cL = col(C.luz), cW = col(C.sol), tmp = new THREE.Color();
	for (let i = 0; i < 3200; i++) {      // topo (grama)
		const r = Math.sqrt(rng()) * 1.7, a = rng() * Math.PI * 2;
		push(Math.cos(a) * r, .14 * (1 - (r / 1.7) ** 2) + (rng() - .5) * .04, Math.sin(a) * r, tmp.copy(cG).lerp(cS, rng() * .6).multiplyScalar(.75), r / 1.7 * .35, 0);
	}
	for (let i = 0; i < 2600; i++) {      // rocha embaixo (profundidade)
		const d = Math.pow(rng(), .8) * 1.6, rr = 1.7 * Math.pow(1 - d / 1.6, .75) * (.85 + rng() * .15), a = rng() * Math.PI * 2;
		push(Math.cos(a) * rr, -d, Math.sin(a) * rr, tmp.copy(cV).multiplyScalar(.35 + .4 * (1 - d / 1.6)), .15 + d / 1.6 * .3, 0);
	}
	for (let i = 0; i < 1700; i++) {      // água em volta
		const r = 2.0 + rng() * 1.0, a = rng() * Math.PI * 2;
		push(Math.cos(a) * r, -.05, Math.sin(a) * r, tmp.copy(cS).multiplyScalar(.35 + rng() * .35), .3 + (r - 2) * .2, 1);
	}
	for (let i = 0; i < 260; i++) {       // tronco
		const h = rng() * 1.15;
		push(-.35 + Math.sin(h * 2) * .06 + (rng() - .5) * .07, .12 + h, .15 + (rng() - .5) * .07, tmp.copy(cL).multiplyScalar(.5), .45 + h * .12, 2);
	}
	for (let i = 0; i < 1800; i++) {      // copa
		const v = new THREE.Vector3(rng() - .5, rng() - .5, rng() - .5).normalize().multiplyScalar(Math.pow(rng(), .4) * .62);
		push(-.35 + v.x * 1.15, 1.45 + v.y * .8, .15 + v.z * 1.15, tmp.copy(cG).lerp(cS, .3 + rng() * .5).multiplyScalar(.8), .6 + v.length() * .25, 2);
	}
	for (let i = 0; i < 160; i++) {       // vaga-lumes
		const r = .4 + rng() * 2.2, a = rng() * Math.PI * 2;
		push(Math.cos(a) * r, .1 + rng() * 1.5, Math.sin(a) * r, cW, .82 + rng() * .15, 3);
	}
	const geo = new THREE.BufferGeometry();
	geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(Cl, 3));
	geo.setAttribute('aOrder', new THREE.Float32BufferAttribute(O, 1)); geo.setAttribute('aRnd', new THREE.Float32BufferAttribute(R, 1)); geo.setAttribute('aType', new THREE.Float32BufferAttribute(T, 1));
	const u = { uTime: { value: 0 }, uGrow: { value: 1 }, uSize: { value: .03 }, uScale: { value: 1 }, uOpacity: { value: 1 }, uGlow: { value: 0 } };
	const pts = new THREE.Points(geo, new THREE.ShaderMaterial({
		uniforms: u, ...ADD,
		vertexShader: `
			attribute vec3 color; attribute float aOrder, aRnd, aType;
			uniform float uTime, uGrow, uSize, uScale, uOpacity, uGlow;
			varying vec3 vC; varying float vA;
			void main(){
				vec3 p = position;
				float g = smoothstep(aOrder, aOrder + .1, uGrow);
				if (aType == 1.) p.y += sin(uTime * 1.6 + p.x * 2.3 + p.z * 1.7) * .045;
				if (aType == 2.) p.x += sin(uTime * .9 + p.y * 2.) * .025 * p.y;
				if (aType == 3.) { p.y += mod(uTime * .18 + aRnd * 2., 1.6) - .4; p.x += sin(uTime * .7 + aRnd * 20.) * .15; p.z += cos(uTime * .6 + aRnd * 15.) * .15; }
				p.y -= (1. - g) * .6;
				float tw = aType == 3. ? (.35 + .65 * pow(.5 + .5 * sin(uTime * 3. + aRnd * 30.), 2.)) * (1. + uGlow * 1.5) : 1. + uGlow * .35;
				vC = color * tw;
				vec4 mv = modelViewMatrix * vec4(p, 1.);
				vA = uOpacity * g;
				gl_PointSize = uSize * uScale / max(-mv.z, .05) * (.6 + aRnd * .8) * (aType == 3. ? 1.8 : 1.);
				gl_Position = projectionMatrix * mv;
			}`,
		fragmentShader: pointFrag,
	}));
	pts.frustumCulled = false;
	const g = new THREE.Group(); g.add(pts);
	return { g, u };
}

// ── cartas de "técnicas" (exemplos ilustrativos) ──
function makeCards(names) {
	return names.map((name, i) => {
		const cv = document.createElement('canvas'); cv.width = 640; cv.height = 360;
		const g = cv.getContext('2d');
		g.fillStyle = 'rgba(14,14,34,.92)'; g.strokeStyle = i % 2 ? C.consciente : C.sinapse; g.lineWidth = 8;
		g.beginPath(); g.roundRect(8, 8, 624, 344, 34); g.fill(); g.stroke();
		g.fillStyle = C.eco; g.font = '700 30px "JetBrains Mono"'; g.textAlign = 'center'; g.fillText('TÉCNICA', 320, 92);
		g.fillStyle = C.luz; g.font = '900 64px Inter';
		const words = name.split('\n'); words.forEach((w, k) => g.fillText(w, 320, 190 + k * 72 - (words.length - 1) * 30));
		const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
		const card = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .9), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
		const xc = document.createElement('canvas'); xc.width = 640; xc.height = 360; const x = xc.getContext('2d');
		x.strokeStyle = C.emocao; x.lineWidth = 34; x.lineCap = 'round'; x.shadowColor = C.emocao; x.shadowBlur = 30;
		x.beginPath(); x.moveTo(150, 40); x.lineTo(490, 320); x.moveTo(490, 40); x.lineTo(150, 320); x.stroke();
		const xt = new THREE.CanvasTexture(xc); xt.colorSpace = THREE.SRGBColorSpace;
		const xm = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .9), new THREE.MeshBasicMaterial({ map: xt, transparent: true, depthWrite: false }));
		xm.position.z = .01; card.add(xm); card.userData.x = xm;
		return card;
	});
}

// ── relógio (perda de tempo) ──
function makeClock() {
	const g = new THREE.Group();
	const ring = [], n = 240; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; ring.push(Math.cos(a) * 1.6, Math.sin(a) * 1.6, 0); }
	const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(ring, 3));
	const ringPts = new THREE.Points(rg, new THREE.PointsMaterial({ color: C.sinapse, size: .05, ...ADD })); g.add(ringPts);
	const tickM = new THREE.MeshBasicMaterial({ color: C.luz, ...ADD });
	for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, m = new THREE.Mesh(new THREE.PlaneGeometry(.05, i % 3 ? .14 : .28), tickM); m.position.set(Math.sin(a) * 1.38, Math.cos(a) * 1.38, 0); m.rotation.z = -a; g.add(m); }
	const handM = new THREE.MeshBasicMaterial({ color: C.luz, ...ADD }), handR = new THREE.MeshBasicMaterial({ color: C.emocao, ...ADD });
	const min = new THREE.Mesh(new THREE.PlaneGeometry(.06, 1.25).translate(0, .55, 0), handM);
	const hr = new THREE.Mesh(new THREE.PlaneGeometry(.09, .8).translate(0, .35, 0), handR); hr.position.z = .01;
	g.add(min, hr);
	return { g, min, hr, mats: [ringPts.material, tickM, handM, handR] };
}

export async function buildWorld(ctx) {
	const rng = ctx.rng(31);
	const scene = new THREE.Scene();
	scene.background = col(C.abismo);
	const camera = new THREE.PerspectiveCamera(40, ctx.W / ctx.H, .05, 200);
	const tex = glowTex();

	const spiral = makeSpiral(ctx.W / ctx.H); scene.add(spiral.g);
	const dust = makeDust(rng); scene.add(dust.g);
	const head = await makeHead(ctx, rng); scene.add(head.g);
	const tunnel = makeTunnel(rng); scene.add(tunnel.g);
	const island = makeIsland(rng); scene.add(island.g);
	const clock = makeClock(); scene.add(clock.g);
	const cards = makeCards(['ESCADA', 'CONTAGEM\n10 → 1', 'ELEVADOR', 'FRACIONA-\nMENTO', 'INDUÇÃO\nRÁPIDA', 'TÉCNICA\nSECRETA']);
	const cardG = new THREE.Group(); cards.forEach(c => cardG.add(c)); scene.add(cardG);

	// portal (o "ponto" definido) — anel fino + halo
	const gate = new THREE.Group();
	const gateM = new THREE.MeshBasicMaterial({ color: C.sinapse, ...ADD }), haloM = new THREE.MeshBasicMaterial({ color: C.sinapse, ...ADD, opacity: .18 });
	gate.add(new THREE.Mesh(new THREE.TorusGeometry(2.25, .03, 8, 160), gateM), new THREE.Mesh(new THREE.TorusGeometry(2.25, .16, 8, 160), haloM));
	scene.add(gate);

	// escudo do lugar seguro
	const shield = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.6, 2)), new THREE.LineBasicMaterial({ color: C.sinapse, ...ADD }));
	scene.add(shield);

	// ondas de sugestão
	const waves = [];
	for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(new THREE.TorusGeometry(.32, .018, 8, 72), new THREE.MeshBasicMaterial({ color: C.sinapse, ...ADD })); scene.add(m); waves.push(m); }

	// brilhos
	const emitter = glow(tex, col(C.sinapse), .6), sun = glow(tex, col(C.sol), 2.6), dotA = glow(tex, col(C.sinapse), .55), dotB = glow(tex, col(C.consciente), .55);
	const orbs = [glow(tex, col(C.sinapse), .5), glow(tex, col(C.consciente), .5), glow(tex, col(C.emocao), .5)];
	[emitter, sun, dotA, dotB, ...orbs].forEach(s => scene.add(s));

	const objs = [spiral.g, dust.g, head.g, tunnel.g, island.g, clock.g, cardG, gate, shield, emitter, sun, dotA, dotB, ...orbs, ...waves];
	const V = new THREE.Vector3(), V2 = new THREE.Vector3();

	const w = {
		scene, camera, C, head, tunnel, island, spiral, dust, clock, cards, cardG, gate, gateM, haloM, shield, waves, emitter, sun, dotA, dotB, orbs,
		fade: 0, flash: 0, bloom: { strength: .7, radius: .5, threshold: .22 },
		reset(T) {
			objs.forEach(o => o.visible = false);
			spiral.g.visible = true; dust.g.visible = true;
			spiral.u.uTime.value = T; spiral.u.uK.value = .25; spiral.u.uCy.value = .12;
			dust.u.uTime.value = T; dust.u.uOpacity.value = .7;
			const hu = head.u; hu.uTime.value = T; hu.uScatter.value = 0; hu.uPulseR.value = -9; hu.uOpacity.value = .42; hu.uWarn.value = 0; hu.uGlow.value = 0;
			head.g.position.set(0, .5, 0); head.g.rotation.set(0, Math.sin(T * .35) * .12, 0); head.g.scale.setScalar(1);
			const tu = tunnel.u; tu.uTime.value = T; tu.uOpacity.value = 1; tu.uWarn.value = 0; tu.uRad.value = 2.6; tu.uColA.value.set(C.sinapse); tu.uColB.value.set(C.consciente);
			island.u.uTime.value = T; island.u.uGrow.value = 1; island.u.uOpacity.value = 1; island.u.uGlow.value = 0; island.u.uSize.value = .02; island.u.uOpacity.value = .75;
			island.g.position.set(0, 0, 0); island.g.rotation.set(0, T * .08, 0); island.g.scale.setScalar(1);
			gate.position.set(0, 0, 0); gate.rotation.set(0, 0, 0); gate.scale.setScalar(1); gateM.opacity = 1; haloM.opacity = .18; gateM.color.set(C.sinapse); haloM.color.set(C.sinapse);
			shield.material.opacity = 0; shield.scale.setScalar(1); shield.position.set(0, .4, 0); shield.rotation.set(0, T * .1, 0);
			sun.material.opacity = 1;
			this.fade = 0; this.flash = 0;
			this.bloom = { strength: .7, radius: .5, threshold: .22 };
		},
		// ondas de sugestão: saem de `from` até `to`. mode 'absorb' (entra) ou 'bounce' (bate e volta em rosa). Devolve o tempo desde o último impacto.
		emitWaves(T, { from, to, t0, t1, period = .85, travel = 1.1, mode = 'absorb', color = C.sinapse }) {
			V.fromArray(from); V2.fromArray(to);
			let lastHit = 99;
			const k = Math.floor((T - t0) / period);
			for (let i = 0; i < waves.length; i++) {
				const e = k - i, m = waves[i];
				const te = t0 + e * period; const lt = T - te;
				if (e < 0 || te > t1 || lt > travel * 2) continue;
				const p = lt / travel;
				if (p >= 1) lastHit = Math.min(lastHit, lt - travel);
				if (mode === 'absorb' && p > 1.05) continue;
				m.visible = true;
				if (p <= 1) {
					m.position.lerpVectors(V, V2, ease.cubicInOut(p) * .92);
					m.scale.setScalar(.4 + p * 1.0); m.material.color.set(color);
					m.material.opacity = Math.min(1, p * 5) * (mode === 'absorb' ? 1 - seg(p, .8, 1.02) : 1);
				} else {
					const q = (p - 1);
					m.position.lerpVectors(V2, V, .92 - q * .45); m.position.y += q * .6;
					m.scale.setScalar(1.9 + q * 1.5); m.material.color.set(C.emocao); m.material.opacity = 1 - seg(q, 0, 1);
				}
				m.quaternion.copy(camera.quaternion);
			}
			return lastHit;
		},
		glowAt(s, pos, k, size) { s.visible = k > .001; s.position.fromArray(pos); s.material.opacity = k; s.scale.setScalar((size ?? s.userData.size) * (.6 + .4 * k)); },
	};
	return w;
}

// Câmera por planos: cada plano {t, p, l, d (drift/s), fov, tr (duração da transição)}; transições em expoInOut (whip/zoom).
export function shots(cam, T, list) {
	let k = 0; for (let i = 0; i < list.length; i++) if (T >= list[i].t) k = i;
	const at = s => { const dt = T - s.t, d = s.d || [0, 0, 0], dl = s.dl || [0, 0, 0]; return { p: s.p.map((v, j) => v + d[j] * dt), l: s.l.map((v, j) => v + dl[j] * dt), fov: s.fov || 40, roll: (s.roll || 0) + (s.droll || 0) * dt }; };
	let A = at(list[k]); const s = list[k], tr = s.tr ?? .6;
	if (k > 0 && T < s.t + tr) {
		const B = at(list[k - 1]), e = ease.expoInOut(seg(T, s.t, s.t + tr));
		A = { p: B.p.map((v, j) => lerp(v, A.p[j], e)), l: B.l.map((v, j) => lerp(v, A.l[j], e)), fov: lerp(B.fov, A.fov, e), roll: lerp(B.roll, A.roll, e) };
	}
	const hx = Math.sin(T * .7) * .025 + Math.sin(T * 1.9) * .01, hy = Math.sin(T * .9 + 1) * .02 + Math.sin(T * 2.3) * .006;
	cam.position.set(A.p[0] + hx, A.p[1] + hy, A.p[2]);
	cam.fov = A.fov; cam.updateProjectionMatrix();
	cam.up.set(Math.sin(A.roll), Math.cos(A.roll), 0);
	cam.lookAt(A.l[0] + hx * .5, A.l[1] + hy * .5, A.l[2]);
}
