// Mundo compartilhado do Short 04 ("Hipnose existe?"): um único palco 3D com todos os elementos.
// Cada cena (scenes/*.js) liga só o que precisa a cada quadro — w.reset() desliga tudo antes.
import * as THREE from 'three';
import { clamp, seg, ease, lerp, mulberry32 } from './lib.js';

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
	const tri = idx ? idx.count / 3 : pos.count / 3, area = new Float32Array(tri); let tot = 0;
	const vi = k => idx ? idx.getX(k) : k;
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
		uColA: { value: col(C.sinapse) }, uColB: { value: col(C.consciente) }, uHi: { value: col(C.luz) }, uScanY: { value: -9 }, uScanCol: { value: col(C.verde) },
		uGlow: { value: 0 },
	};
	const mat = new THREE.ShaderMaterial({
		uniforms: u, ...ADD,
		vertexShader: `
			attribute float aRnd; attribute vec3 aDir;
			uniform float uTime, uSize, uScale, uScatter, uPulseR, uOpacity, uGlow, uScanY;
			uniform vec3 uColA, uColB, uHi, uScanCol;
			varying vec3 vC; varying float vA;
			void main(){
				vec3 p = position + aDir * uScatter * (.6 + aRnd * 3.);
				p += .018 * vec3(sin(uTime * 1.3 + aRnd * 40.), cos(uTime * 1.1 + aRnd * 30.), sin(uTime * .9 + aRnd * 20.));
				float d = length(position - vec3(0., .4, 0.));
				float pulse = exp(-pow((d - uPulseR) * 3.2, 2.));
				float scan = exp(-pow((position.y - uScanY) * 14., 2.));
				float mx = clamp(.5 - position.y / 3. + (aRnd - .5) * .5, 0., 1.);
				vC = mix(uColA, uColB, mx) + uHi * (pulse * 1.3 + uGlow) + uScanCol * scan * 2.2;
				vec4 mv = modelViewMatrix * vec4(p, 1.);
				gl_PointSize = uSize * uScale / max(-mv.z, .05) * (.55 + aRnd * .9) * (1. + pulse * .8 + scan * .6);
				gl_Position = projectionMatrix * mv;
				vA = uOpacity * (1. - clamp(uScatter * .35, 0., 1.)) * (.7 + .3 * sin(uTime * 2. + aRnd * 50.));
			}`,
		fragmentShader: pointFrag,
	});
	const pts = new THREE.Points(geo, mat); pts.frustumCulled = false;
	// cópias (para "replicável")
	const copies = [new THREE.Points(geo, mat), new THREE.Points(geo, mat)]; copies.forEach(c => c.frustumCulled = false);
	const g = new THREE.Group(); g.add(pts); g.position.y = .5;
	return { g, u, pts, copies };
}

// ── cérebro procedural em partículas (ilustrativo) ──
// espaço local: x lateral, y para cima, z para a frente (rosto). Regiões aproximadas, só para leitura visual.
export const REG = {
	acc: [0, .14, .32],          // córtex cingulado anterior (medial, frente)
	pfc: [-.44, .3, .5],         // córtex pré-frontal (dorsolateral, esquerdo — espelhado no direito)
	pcc: [0, .16, -.34],         // córtex cingulado posterior (medial, trás)
	sens: [-.42, .2, -.48],      // regiões sensoriais (parieto-occipital)
	emo: [-.5, -.2, .14],        // regiões emocionais (ínsula / amígdala)
};
function brainGeo(rng, n = 24000) {
	const P = new Float32Array(n * 3), R4 = new Float32Array(n * 4), E = new Float32Array(n), RD = new Float32Array(n), RN = new Float32Array(n), D = new Float32Array(n * 3);
	const v = new THREE.Vector3();
	const gw = (x, y, z, c, rx, ry, rz) => Math.exp(-(((x - c[0]) / rx) ** 2 + ((y - c[1]) / ry) ** 2 + ((z - c[2]) / rz) ** 2));
	for (let i = 0; i < n; i++) {
		const s = rng() < .5 ? -1 : 1, kind = rng();
		let x, y, z, ridge;
		if (kind < .8) {           // superfície cortical
			v.set(rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1); if (v.lengthSq() < 1e-4) v.set(1, 0, 0); v.normalize();
			v.x = Math.abs(v.x) * s;
			const rx = .62 * (.82 + .18 * (1 - v.z * .5)), ry = .5, rz = .86;
			const f = Math.sin(v.x * 15 + Math.sin(v.z * 9) * 1.8) * Math.sin(v.z * 13 + Math.sin(v.y * 11) * 1.6) + Math.sin(v.y * 14 + v.x * 6) * .5;
			ridge = clamp(Math.abs(f) * 1.1);
			const k = (.95 + .05 * ridge) * (1 - rng() * .03);
			x = v.x * rx * k + s * .025; y = v.y * ry * k; z = v.z * rz * k;
			if (y < -.18) y = -.18 + (y + .18) * .55;                        // base achatada
			if (y < -.05 && Math.abs(z) < .35 && Math.abs(x) > .3) y -= .08 * (1 - Math.abs(z) / .35); // lobo temporal
		} else if (kind < .93) {   // parede medial
			const a = rng() * Math.PI * 2, r = Math.sqrt(rng()) * .95;
			x = s * (.03 + rng() * .02); y = Math.sin(a) * r * .46; z = Math.cos(a) * r * .82;
			if (y < -.16) y = -.16 + (y + .16) * .5;
			const f = Math.sin(z * 18 + Math.sin(y * 9) * 2) * Math.sin(y * 16);
			ridge = clamp(Math.abs(f) * 1.2) * .8;
		} else {                   // interior
			v.set(rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1).multiplyScalar(.8);
			x = Math.abs(v.x) * .55 * s + s * .03; y = v.y * .38; z = v.z * .75; ridge = .15;
		}
		P.set([x, y, z], i * 3);
		const ax = Math.abs(x);
		R4[i * 4] = gw(ax, y, z, [0, REG.acc[1], REG.acc[2]], .14, .2, .26);
		R4[i * 4 + 1] = gw(ax, y, z, [-REG.pfc[0], REG.pfc[1], REG.pfc[2]], .26, .24, .26);
		R4[i * 4 + 2] = gw(ax, y, z, [0, REG.pcc[1], REG.pcc[2]], .14, .2, .24);
		R4[i * 4 + 3] = gw(ax, y, z, [-REG.sens[0], REG.sens[1], REG.sens[2]], .32, .3, .32);
		E[i] = gw(ax, y, z, [-REG.emo[0], REG.emo[1], REG.emo[2]], .22, .2, .24);
		RD[i] = ridge; RN[i] = rng();
		v.set(x + (rng() - .5), y + (rng() - .5), z + (rng() - .5)).normalize(); D.set([v.x, v.y, v.z], i * 3);
	}
	const geo = new THREE.BufferGeometry();
	geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
	geo.setAttribute('aReg', new THREE.BufferAttribute(R4, 4));
	geo.setAttribute('aEmo', new THREE.BufferAttribute(E, 1));
	geo.setAttribute('aRidge', new THREE.BufferAttribute(RD, 1));
	geo.setAttribute('aRnd', new THREE.BufferAttribute(RN, 1));
	geo.setAttribute('aDir', new THREE.BufferAttribute(D, 3));
	return geo;
}
function brainMat() {
	const u = {
		uTime: { value: 0 }, uScale: { value: 1 }, uSize: { value: .01 }, uOpacity: { value: 1 }, uScatter: { value: 0 }, uDim: { value: 0 },
		uR: { value: new THREE.Vector4() }, uEmo: { value: 0 }, uSync: { value: 0 }, uVivid: { value: 0 }, uGrey: { value: 0 },
		uColA: { value: col(C.sinapse) }, uColB: { value: col(C.consciente) },
		uC0: { value: col(C.sinapse) }, uC1: { value: col(C.sol) }, uC2: { value: col(C.emocao) }, uC3: { value: col(C.verde) }, uC4: { value: col(C.emocao) },
		uWave: { value: -9 },
	};
	const m = new THREE.ShaderMaterial({
		uniforms: u, ...ADD,
		vertexShader: `
			attribute vec4 aReg; attribute float aEmo, aRidge, aRnd; attribute vec3 aDir;
			uniform float uTime, uScale, uSize, uOpacity, uScatter, uDim, uEmo, uSync, uVivid, uGrey, uWave;
			uniform vec4 uR; uniform vec3 uColA, uColB, uC0, uC1, uC2, uC3, uC4;
			varying vec3 vC; varying float vA;
			void main(){
				vec3 p = position + aDir * uScatter * (.5 + aRnd * 2.5);
				p += .006 * vec3(sin(uTime * 1.7 + aRnd * 40.), cos(uTime * 1.3 + aRnd * 30.), sin(uTime * 1.1 + aRnd * 20.));
				// pulsos: sensoriais e emocionais entram em fase quando uSync -> 1
				float phS = uTime * 6.2, phE = mix(uTime * 8.9 + 1.7, uTime * 6.2, uSync);
				float pS = .55 + .45 * sin(phS - length(position) * 4.), pE = .55 + .45 * sin(phE - length(position) * 4.);
				float wave = exp(-pow((position.z - uWave) * 7., 2.));
				vec3 base = mix(uColA, uColB, clamp(.5 - position.z * .7 + (aRnd - .5) * .4, 0., 1.));
				base = mix(base, vec3(.45, .45, .55), uGrey);
				vec3 c = base * (.08 + .5 * aRidge * aRidge) * (1. - uDim * .8);
				float hi = aReg.x * uR.x + aReg.y * uR.y + aReg.z * uR.z + aReg.w * uR.w * pS + aEmo * uEmo * pE;
				c += (uC0 * aReg.x * uR.x + uC1 * aReg.y * uR.y + uC2 * aReg.z * uR.z + uC3 * aReg.w * uR.w * pS + uC4 * aEmo * uEmo * pE) * (.35 + .65 * aRidge) * .95;
				c += vec3(1.) * wave * .9;
				c *= 1. + uVivid * (.25 + .2 * sin(uTime * 3. + aRnd * 20.));
				vC = c;
				vec4 mv = modelViewMatrix * vec4(p, 1.);
				gl_PointSize = uSize * uScale / max(-mv.z, .05) * (.55 + aRnd * .9) * (1. + clamp(hi, 0., 1.) * .7 + wave * .5);
				gl_Position = projectionMatrix * mv;
				vA = uOpacity * (1. - clamp(uScatter * .3, 0., 1.)) * (.75 + .25 * sin(uTime * 2.3 + aRnd * 50.));
			}`,
		fragmentShader: pointFrag,
	});
	return { m, u };
}

// ── conexão entre duas regiões: partículas que fluem por uma curva (uBreak abre um vão no meio) ──
function makeConn(n = 900) {
	const U = new Float32Array(n), R = new Float32Array(n), S = new Float32Array(n);
	const rng = mulberry32(77);
	for (let i = 0; i < n; i++) { U[i] = rng(); R[i] = rng(); S[i] = i % 2 ? 1 : -1; }
	const geo = new THREE.BufferGeometry();
	geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
	geo.setAttribute('aU', new THREE.BufferAttribute(U, 1)); geo.setAttribute('aRnd', new THREE.BufferAttribute(R, 1)); geo.setAttribute('aSide', new THREE.BufferAttribute(S, 1));
	const u = {
		uTime: { value: 0 }, uScale: { value: 1 }, uSize: { value: .018 }, uOpacity: { value: 1 }, uFlow: { value: .5 }, uBreak: { value: 0 }, uGrow: { value: 1 },
		uA: { value: new THREE.Vector3() }, uB: { value: new THREE.Vector3() }, uH: { value: .5 }, uCol: { value: col(C.sinapse) }, uCol2: { value: col(C.emocao) }, uWarm: { value: 0 },
		uMirror: { value: 1 }, uBeat: { value: 0 },
	};
	const m = new THREE.ShaderMaterial({
		uniforms: u, ...ADD,
		vertexShader: `
			attribute float aU, aRnd, aSide;
			uniform float uTime, uScale, uSize, uOpacity, uFlow, uBreak, uGrow, uH, uWarm, uMirror, uBeat;
			uniform vec3 uA, uB, uCol, uCol2;
			varying vec3 vC; varying float vA;
			void main(){
				float t = fract(aU + uTime * uFlow * (.8 + aRnd * .4));
				vec3 A = uA, B = uB; if (aSide > 0. && uMirror > .5) { A.x = -A.x; B.x = -B.x; }
				vec3 M = (A + B) * .5 + vec3(0., uH, 0.);
				vec3 p = mix(mix(A, M, t), mix(M, B, t), t);
				p += .025 * vec3(sin(aRnd * 60. + uTime * 2.), cos(aRnd * 40. + uTime * 1.7), sin(aRnd * 80.));
				float gap = 1. - smoothstep(uBreak * .5 - .05, uBreak * .5 + .02, abs(t - .5)) * step(.001, uBreak);
				gap = uBreak > .001 ? smoothstep(uBreak * .5, uBreak * .5 + .06, abs(t - .5)) : 1.;
				float beat = exp(-pow((t - fract(uTime * .9)) * 9., 2.)) * uBeat;
				vC = mix(uCol, uCol2, uWarm) * (.5 + beat * 1.6);
				vec4 mv = modelViewMatrix * vec4(p, 1.);
				gl_PointSize = uSize * uScale / max(-mv.z, .05) * (.5 + aRnd) * (1. + beat);
				gl_Position = projectionMatrix * mv;
				vA = uOpacity * gap * step(t, uGrow) * (.5 + .5 * aRnd);
			}`,
		fragmentShader: pointFrag,
	});
	const pts = new THREE.Points(geo, m); pts.frustumCulled = false;
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
			void main(){ vec3 p = vec3(position.x + sin(uTime * .21 + aRnd * 30.) * .4, mod(uTime * .12 * (.5 + aRnd) + aRnd * 22., 22.) - 11., position.z + cos(uTime * .17 + aRnd * 20.) * .4);
				vC = uCol; vec4 mv = modelViewMatrix * vec4(p, 1.);
				vA = uOpacity * (.25 + .75 * aRnd) * smoothstep(.3, 2., -mv.z);
				gl_PointSize = .02 * uScale / max(-mv.z, .05) * (.5 + aRnd); gl_Position = projectionMatrix * mv; }`,
		fragmentShader: pointFrag,
	}));
	pts.frustumCulled = false;
	return { g: pts, u };
}

// ── globo pontilhado com pino (Stanford, Califórnia) ──
export const STANFORD = { lat: 37.43, lon: -122.17 };
function makeGlobe(rng, R = 1.6) {
	const P = [], A = [];
	const n = 5200, ga = Math.PI * (3 - Math.sqrt(5));
	for (let i = 0; i < n; i++) { const y = 1 - (i + .5) / n * 2, r = Math.sqrt(1 - y * y), th = ga * i; P.push(Math.cos(th) * r * R, y * R, Math.sin(th) * r * R); A.push(.35 + rng() * .3); }
	for (let la = -60; la <= 60; la += 30) for (let k = 0; k < 360; k++) { const a = k / 360 * Math.PI * 2, c = Math.cos(la * Math.PI / 180); P.push(Math.cos(a) * c * R * 1.005, Math.sin(la * Math.PI / 180) * R * 1.005, Math.sin(a) * c * R * 1.005); A.push(.9); }
	for (let lo = 0; lo < 180; lo += 30) for (let k = 0; k < 360; k++) { const a = k / 360 * Math.PI * 2, l = lo * Math.PI / 180; P.push(Math.cos(a) * Math.cos(l) * R * 1.005, Math.sin(a) * R * 1.005, Math.cos(a) * Math.sin(l) * R * 1.005); A.push(.9); }
	const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('aA', new THREE.Float32BufferAttribute(A, 1));
	const u = { uScale: { value: 1 }, uOpacity: { value: 1 }, uCol: { value: col(C.consciente) }, uCol2: { value: col(C.sinapse) }, uPin: { value: new THREE.Vector3(0, 1, 0) }, uRipple: { value: 0 } };
	const pts = new THREE.Points(geo, new THREE.ShaderMaterial({
		uniforms: u, ...ADD,
		vertexShader: `attribute float aA; uniform float uScale, uOpacity, uRipple; uniform vec3 uCol, uCol2, uPin; varying vec3 vC; varying float vA;
			void main(){ vec3 wn = normalize((modelMatrix * vec4(position, 0.)).xyz);
				float d = acos(clamp(dot(normalize(position), uPin), -1., 1.));
				float rip = exp(-pow((d - uRipple) * 10., 2.)) * step(.01, uRipple) * (1. - uRipple / 1.6);
				float near = exp(-d * d * 30.);
				vec4 mv = modelViewMatrix * vec4(position, 1.);
				float facing = clamp(dot(wn, normalize(cameraPosition - (modelMatrix * vec4(position,1.)).xyz)) * 1.4 + .25, 0., 1.);
				vC = mix(uCol, uCol2, clamp(near + rip, 0., 1.)) * (1. + rip * 2. + near);
				vA = uOpacity * aA * facing;
				gl_PointSize = .024 * uScale / max(-mv.z, .05) * (1. + rip + near * .6); gl_Position = projectionMatrix * mv; }`,
		fragmentShader: pointFrag,
	}));
	pts.frustumCulled = false;
	const g = new THREE.Group(); g.add(pts);
	const ll = (lat, lon, r = R) => { const a = lat * Math.PI / 180, b = lon * Math.PI / 180; return new THREE.Vector3(Math.cos(a) * Math.cos(b) * r, Math.sin(a) * r, -Math.cos(a) * Math.sin(b) * r); };
	const pinPos = ll(STANFORD.lat, STANFORD.lon);
	u.uPin.value.copy(pinPos).normalize();
	const stick = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, .5, 8).translate(0, .25, 0), new THREE.MeshBasicMaterial({ color: C.emocao, ...ADD }));
	stick.position.copy(pinPos); stick.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pinPos.clone().normalize());
	g.add(stick);
	return { g, u, pts, pinPos, stick, ll };
}

// ── 60 participantes (pictogramas) ──
function personGeo() {
	const s = new THREE.Shape();
	s.moveTo(-.13, 0); s.lineTo(.13, 0); s.lineTo(.13, .12); s.absarc(0, .12, .13, 0, Math.PI, false); s.lineTo(-.13, 0);
	const body = new THREE.ShapeGeometry(s, 12);
	const head = new THREE.CircleGeometry(.075, 24).translate(0, .37, 0);
	const g = new THREE.BufferGeometry();
	const merge = [body, head].map(x => x.toNonIndexed());
	const pos = []; merge.forEach(m => pos.push(...m.attributes.position.array));
	g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
	return g.translate(0, -.22, 0);
}
function makePeople(rng, n = 60) {
	const m = new THREE.InstancedMesh(personGeo(), new THREE.MeshBasicMaterial({ color: 0xffffff, ...ADD }), n);
	m.frustumCulled = false;
	// metade "altamente sugestionável" (grupo A) e metade "pouco sugestionável" (grupo B) — ilustrativo
	const ids = Array.from({ length: n }, (_, i) => i);
	for (let i = n - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
	const grp = new Int8Array(n); ids.forEach((id, k) => grp[id] = k < n / 2 ? 0 : 1);
	const grid = [], split = [], rnd = [];
	const idxIn = [0, 0];
	for (let i = 0; i < n; i++) {
		const c = i % 10, r = Math.floor(i / 10);
		grid.push([(c - 4.5) * .4, (2.5 - r) * .4, c + r]);
		const g = grp[i], k = idxIn[g]++, cc = k % 5, rr = Math.floor(k / 5);
		split.push([(g ? 1 : -1) * (.92 + (cc - 2) * .31), (2.5 - rr) * .4]);
		rnd.push(rng());
	}
	return { g: m, grp, grid, split, rnd, n };
}

// ── fatia de ressonância (axial, procedural — ilustrativa) ──
function makeMRI() {
	const u = { uTime: { value: 0 }, uOpacity: { value: 1 }, uScan: { value: -1 }, uAct: { value: new THREE.Vector4() }, uReveal: { value: 1 } };
	const m = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.ShaderMaterial({
		uniforms: u, transparent: true, depthWrite: false,
		vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
		fragmentShader: `
			uniform float uTime, uOpacity, uScan, uReveal; uniform vec4 uAct; varying vec2 vUv;
			float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
			float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
				return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + 1.), f.x), f.y); }
			float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 5; i++){ s += a * n2(p); p *= 2.03; a *= .5; } return s; }
			float blob(vec2 p, vec2 c, float r){ return exp(-dot(p - c, p - c) / (r * r)); }
			void main(){
				vec2 p = (vUv - .5) * 2.; p.x *= 1.18;
				float e = length(p / vec2(.78, .95));
				float skull = smoothstep(.06, .0, abs(e - 1.02)) * .9;
				float scalp = smoothstep(.04, .0, abs(e - 1.1)) * .35;
				float inside = smoothstep(1., .96, e);
				float g = fbm(p * 5. + vec2(3.1, 1.7));
				float folds = smoothstep(.35, .65, abs(sin(g * 9. + p.y * 3.)));
				float wm = smoothstep(.85, .45, e) * .55;                         // substância branca
				float tissue = inside * (.35 + .45 * folds * (1. - wm) + wm * .7);
				float fiss = smoothstep(.025, .0, abs(p.x)) * smoothstep(.1, .3, abs(p.y)) * inside;  // fissura
				vec2 q = vec2(abs(p.x), p.y);
				float vent = smoothstep(.13, .08, length((q - vec2(.12, .02)) / vec2(.6, 1.6)));          // ventrículos
				float v = tissue * (1. - fiss * .8) * (1. - vent * .85) + skull + scalp;
				v *= .85 + .15 * n2(p * 60.);
				vec3 c = vec3(v) * vec3(.82, .86, 1.) * .5;
				// "ativações" estilo fMRI (pontos quentes)
				float a = blob(p, vec2(0., .38), .16) * uAct.x + blob(q, vec2(.42, .5), .17) * uAct.y + blob(p, vec2(0., -.45), .16) * uAct.z + blob(q, vec2(.45, -.4), .2) * uAct.w;
				a *= inside * (.8 + .2 * sin(uTime * 5.));
				c = mix(c, mix(vec3(1., .25, .1), vec3(1., .95, .3), clamp(a * 1.4 - .3, 0., 1.)), clamp(a * 1.6, 0., 1.));
				float sc = smoothstep(.03, 0., abs(vUv.y - uScan));
				c += vec3(.25, .9, 1.) * sc * .9;
				float rev = step(1. - uReveal, 1. - vUv.y);
				float frame = max(step(.985, max(abs(vUv.x - .5), abs(vUv.y - .5)) * 2.), 0.);
				c += vec3(.24, .9, 1.) * frame * .5;
				gl_FragColor = vec4(c, uOpacity * rev * max(max(v, a), frame));
			}`,
	}));
	m.frustumCulled = false;
	return { g: m, u };
}

export async function buildWorld(ctx) {
	const rng = ctx.rng(404);
	const scene = new THREE.Scene();
	scene.background = col(C.abismo);
	const camera = new THREE.PerspectiveCamera(40, ctx.W / ctx.H, .05, 200);
	const tex = glowTex();

	const spiral = makeSpiral(ctx.W / ctx.H); scene.add(spiral.g);
	const dust = makeDust(rng); scene.add(dust.g);
	const head = await makeHead(ctx, rng); scene.add(head.g); head.copies.forEach(c => scene.add(c));

	// cérebro: um dentro da cabeça (rig) e um segundo para a comparação lado a lado
	const bgeo = brainGeo(rng);
	const b1 = brainMat(), b2 = brainMat();
	const brain = new THREE.Points(bgeo, b1.m), brain2 = new THREE.Points(bgeo, b2.m);
	brain.frustumCulled = brain2.frustumCulled = false;
	const brainG = new THREE.Group(); brainG.add(brain); scene.add(brainG);
	const brain2G = new THREE.Group(); brain2G.add(brain2); scene.add(brain2G);
	const conn = makeConn(); brainG.add(conn.g);           // pré-frontal ↔ cingulado posterior
	const sync = makeConn(); brainG.add(sync.g);           // sensorial ↔ emocional
	const nodes = [glow(tex, col(C.sol), .3), glow(tex, col(C.emocao), .3), glow(tex, col(C.sol), .3), glow(tex, col(C.sinapse), .5)];
	nodes.forEach(s => brainG.add(s));

	const globe = makeGlobe(rng); scene.add(globe.g);
	const people = makePeople(rng); scene.add(people.g);
	const mri = makeMRI(); scene.add(mri.g);

	// anel do scanner (ressonância)
	const bore = new THREE.Group();
	const boreM = new THREE.MeshBasicMaterial({ color: C.sinapse, ...ADD }), boreH = new THREE.MeshBasicMaterial({ color: C.sinapse, ...ADD, opacity: .15 });
	bore.add(new THREE.Mesh(new THREE.TorusGeometry(2.1, .025, 8, 160), boreM), new THREE.Mesh(new THREE.TorusGeometry(2.1, .14, 8, 160), boreH));
	scene.add(bore);

	// foco de atenção: anéis que convergem
	const focus = [];
	for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.TorusGeometry(1, .012, 8, 96), new THREE.MeshBasicMaterial({ color: C.sinapse, ...ADD })); scene.add(m); focus.push(m); }

	const pin = glow(tex, col(C.emocao), .5), flare = glow(tex, col(C.sinapse), 1.6);
	[pin, flare].forEach(s => scene.add(s));
	globe.g.add(pin);

	const objs = [spiral.g, dust.g, head.g, ...head.copies, brainG, brain2G, globe.g, people.g, mri.g, bore, flare, ...focus];
	const V = new THREE.Vector3(), M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), S3 = new THREE.Vector3(), PC = new THREE.Color();

	const resetBrain = (u, T) => {
		u.uTime.value = T; u.uOpacity.value = 1; u.uScatter.value = 0; u.uDim.value = 0; u.uR.value.set(0, 0, 0, 0); u.uEmo.value = 0; u.uSync.value = 0; u.uVivid.value = 0; u.uGrey.value = 0; u.uWave.value = -9; u.uSize.value = .01;
	};

	const w = {
		scene, camera, C, spiral, dust, head, brain: { g: brainG, pts: brain, u: b1.u }, brain2: { g: brain2G, u: b2.u }, conn, sync, nodes, globe, people, mri, bore, boreM, boreH, focus, pin, flare,
		fade: 0, flash: 0, bloom: { strength: .7, radius: .5, threshold: .22 },
		reset(T) {
			objs.forEach(o => o.visible = false);
			spiral.g.visible = true; dust.g.visible = true;
			spiral.u.uTime.value = T; spiral.u.uK.value = .25; spiral.u.uCy.value = .12;
			dust.u.uTime.value = T; dust.u.uOpacity.value = .7;
			const hu = head.u; hu.uTime.value = T; hu.uScatter.value = 0; hu.uPulseR.value = -9; hu.uOpacity.value = .42; hu.uGlow.value = 0; hu.uScanY.value = -9;
			head.pts.visible = true;
			head.g.position.set(0, .5, 0); head.g.rotation.set(0, Math.sin(T * .35) * .12, 0); head.g.scale.setScalar(1);
			resetBrain(b1.u, T); resetBrain(b2.u, T);
			brainG.position.set(0, 1.33, -.1); brainG.rotation.set(0, Math.sin(T * .35) * .12, 0); brainG.scale.setScalar(.98);
			brain2G.position.set(0, 0, 0); brain2G.rotation.set(0, 0, 0); brain2G.scale.setScalar(1);
			brain.visible = true;
			for (const c of [conn, sync]) { const u = c.u; u.uTime.value = T; c.g.visible = false; u.uOpacity.value = 1; u.uBreak.value = 0; u.uGrow.value = 1; u.uWarm.value = 0; u.uBeat.value = 0; u.uFlow.value = .45; }
			conn.u.uA.value.fromArray(REG.pfc); conn.u.uB.value.set(REG.pcc[0] - .06, REG.pcc[1], REG.pcc[2]); conn.u.uH.value = .38; conn.u.uCol.value.set(C.sol); conn.u.uCol2.value.set(C.emocao);
			sync.u.uA.value.fromArray(REG.sens); sync.u.uB.value.fromArray(REG.emo); sync.u.uH.value = -.05; sync.u.uCol.value.set(C.verde); sync.u.uCol2.value.set(C.emocao);
			nodes.forEach(s => s.visible = false);
			globe.g.rotation.set(.35, 0, 0); globe.u.uOpacity.value = 1; globe.u.uRipple.value = 0; globe.g.position.set(0, .9, 0); globe.g.scale.setScalar(1);
			pin.visible = false;
			mri.u.uTime.value = T; mri.u.uOpacity.value = 1; mri.u.uScan.value = -1; mri.u.uAct.value.set(0, 0, 0, 0); mri.u.uReveal.value = 1; mri.g.position.set(0, .9, 0); mri.g.rotation.set(0, 0, 0); mri.g.scale.setScalar(1);
			bore.position.set(0, 0, 0); bore.rotation.set(0, 0, 0); bore.scale.setScalar(1); boreM.opacity = 1; boreH.opacity = .15;
			focus.forEach(f => { f.visible = false; f.material.opacity = 0; });
			this.fade = 0; this.flash = 0;
			this.bloom = { strength: .7, radius: .5, threshold: .22 };
		},
		glowAt(s, pos, k, size) { s.visible = k > .001; s.position.fromArray(pos); s.material.opacity = k; s.scale.setScalar((size ?? s.userData.size) * (.6 + .4 * k)); },
		// posiciona as 60 pessoas: mode(i) devolve {x, y, z, s, color, a}
		layoutPeople(fn) {
			for (let i = 0; i < people.n; i++) {
				const o = fn(i);
				V.set(o.x, o.y, o.z || 0); S3.setScalar(Math.max(o.s, 1e-4)); Q.copy(camera.quaternion);
				M4.compose(V, o.face === false ? Q.identity() : Q, S3); people.g.setMatrixAt(i, M4);
				PC.set(o.color).multiplyScalar((o.a ?? 1) * .3); people.g.setColorAt(i, PC);
			}
			people.g.instanceMatrix.needsUpdate = true; if (people.g.instanceColor) people.g.instanceColor.needsUpdate = true;
		},
		// projeção de um ponto 3D (mundo) para pixels do palco
		project(v3) { V.copy(v3).project(camera); return { x: (V.x * .5 + .5) * ctx.W, y: (-V.y * .5 + .5) * ctx.H, front: V.z < 1 }; },
		brainWorld(local, g = brainG) { g.updateMatrixWorld(true); return new THREE.Vector3().fromArray(local).applyMatrix4(g.matrixWorld); },
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
	cam.updateMatrixWorld(true);
}
