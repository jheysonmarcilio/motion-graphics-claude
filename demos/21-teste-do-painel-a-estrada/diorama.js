// Kit "diorama de brinquedo" do 21 (sobre o toy.js do 07): holofote volumétrico, esteira de estrada de maquete,
// carrinho, casinha, cabine, poltrona, cadeado, mão-guia. Tudo parametrizado por cor/tamanho para reaproveitar.
import * as THREE from 'three';
import { box, mesh, mat, own, toy } from './toy.js';

export const C = { menta: '#7ED9C0', tang: '#FF9A4D', petro: '#1F5F7A', tinta: '#1B1B2F', amarelo: '#FFC93C', creme: '#FFF4E2', asfalto: '#2E3346', grama: '#9EE3C9', madeira: '#C68B59' };

// textura radial (centro claro → borda transparente)
function radialTex(stops = [[0, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']]) {
	const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
	const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); stops.forEach(([k, s]) => gr.addColorStop(k, s));
	g.fillStyle = gr; g.fillRect(0, 0, 256, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ── holofote de teatro: cone volumétrico aditivo + poça de luz no chão + SpotLight real ──
// set(r, k): raio do círculo no chão e intensidade 0..1
export function spot({ color = '#FFE6A8', h = 8, r = 3, power = 60 } = {}) {
	const g = new THREE.Group();
	const coneMat = new THREE.ShaderMaterial({
		uniforms: { uC: { value: new THREE.Color(color) }, uOp: { value: .5 } },
		vertexShader: `varying vec2 vUv; varying vec3 vN, vV; void main(){ vUv = uv; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position,1.); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
		fragmentShader: `uniform vec3 uC; uniform float uOp; varying vec2 vUv; varying vec3 vN, vV;
			void main(){ float f = pow(abs(dot(vN, vV)), 1.6); float a = uOp * f * (.35 + .65 * smoothstep(0., .9, 1. - vUv.y)) * smoothstep(0., .08, vUv.y);
			gl_FragColor = vec4(uC * a, a); }`,
		transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
	});
	const cone = new THREE.Mesh(new THREE.ConeGeometry(1, h, 48, 1, true), coneMat);
	cone.rotation.x = Math.PI; cone.position.y = h / 2; cone.renderOrder = 5; cone.frustumCulled = false; g.add(cone);
	const poolMat = new THREE.MeshBasicMaterial({ map: radialTex([[0, 'rgba(255,240,200,1)'], [.7, 'rgba(255,230,170,.55)'], [1, 'rgba(255,220,150,0)']]), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
	const pool = new THREE.Mesh(new THREE.CircleGeometry(1.25, 48), poolMat); pool.rotation.x = -Math.PI / 2; pool.position.y = .03; pool.renderOrder = 4; g.add(pool);
	const lamp = mesh(new THREE.CylinderGeometry(.35, .5, .6, 20), C.tinta); lamp.position.y = h + .2; g.add(lamp);
	const light = new THREE.SpotLight(color, power, h * 3, .5, .45, 1.2); light.position.set(0, h, 0); g.add(light); g.add(light.target);
	const S = { g, cone, pool, light, set(rr, k = 1) {
		cone.scale.set(rr, 1, rr); pool.scale.setScalar(rr); coneMat.uniforms.uOp.value = .55 * k; poolMat.opacity = .8 * k;
		light.angle = Math.atan(rr * 1.15 / h); light.intensity = power * k; g.visible = k > .001;
	} };
	S.set(r, 1); return S;
}

// ── esteira de estrada de maquete: o mundo rola, o carro fica ──
export function roadLoop({ len = 70, width = 3.2, speed = 9, gap = 3, grass = C.grama, road = C.asfalto, trees = true, seed = 3 } = {}) {
	const g = new THREE.Group();
	const ground = mesh(new THREE.PlaneGeometry(80, len), grass, { r: .9, cc: 0 }); ground.rotation.x = -Math.PI / 2; ground.position.z = -len / 2 + 10; g.add(ground);
	const asphalt = box(width, .08, len, road, .03, { r: .7, cc: .2 }); asphalt.position.set(0, .04, -len / 2 + 10); g.add(asphalt);
	[-1, 1].forEach(s => { const e = box(.12, .1, len, '#FFFFFF', .02); e.position.set(s * (width / 2 - .2), .06, -len / 2 + 10); g.add(e); });
	const n = Math.ceil(len / gap), stripes = [];
	for (let i = 0; i < n; i++) { const s = box(.16, .1, 1.2, '#FFFFFF', .04); s.position.y = .07; g.add(s); stripes.push(s); }
	const props = [];
	if (trees) {
		let a = seed; const r = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
		for (let i = 0; i < 26; i++) {
			const t = new THREE.Group(), big = .7 + r() * .6;
			const trunk = mesh(new THREE.CylinderGeometry(.08, .1, .5, 8), C.madeira); trunk.position.y = .25; t.add(trunk);
			const top = mesh(new THREE.ConeGeometry(.45 * big, 1.1 * big, 10), r() > .5 ? '#3FA98C' : '#5BC4A2'); top.position.y = .5 + .55 * big; t.add(top);
			t.userData.x = (i % 2 ? 1 : -1) * (width / 2 + 1 + r() * 4); t.userData.z0 = r() * len; g.add(t); props.push(t);
		}
	}
	return { g, stripes, update(T, hop = 0, spd = speed) {
		const d = T * spd;
		stripes.forEach((s, i) => { s.position.z = 10 - len + ((i * gap + d) % len); s.position.y = .07 + hop; });
		props.forEach(p => { p.position.set(p.userData.x, 0, 10 - len + ((p.userData.z0 + d) % len)); });
	} };
}

// ── carrinho de brinquedo (frente para −z) com motorista toy ──
export function car({ color = C.petro, driver = {} } = {}) {
	const g = new THREE.Group();
	const body = box(1.35, .42, 2.3, color, .16); body.position.y = .5; g.add(body);
	const hood = box(1.2, .2, .7, color, .1); hood.position.set(0, .78, -.75); g.add(hood);
	const bar = mesh(new THREE.TorusGeometry(.55, .05, 8, 24, Math.PI), C.tinta); bar.position.set(0, .7, .55); g.add(bar);
	const glass = box(1.1, .4, .05, own('#CFF3FF', { t: true, op: .45 }), .03); glass.position.set(0, 1.05, -.42); glass.rotation.x = -.35; g.add(glass);
	const wheels = [];
	for (const [x, z] of [[-.66, -.75], [.66, -.75], [-.66, .75], [.66, .75]]) {
		const w = mesh(new THREE.CylinderGeometry(.27, .27, .22, 20), C.tinta); w.rotation.z = Math.PI / 2; w.position.set(x, .27, z); g.add(w);
		const cap = mesh(new THREE.CylinderGeometry(.11, .11, .24, 12), C.creme); cap.rotation.z = Math.PI / 2; cap.position.copy(w.position); g.add(cap); wheels.push(w);
	}
	const lights = [-1, 1].map(s => { const l = mesh(new THREE.SphereGeometry(.11, 14, 10), own('#FFF2B0', { e: '#FFD86B', ei: .8 })); l.position.set(s * .45, .58, -1.15); g.add(l); return l; });
	const wheel = mesh(new THREE.TorusGeometry(.18, .035, 8, 20), C.tinta); wheel.position.set(0, .98, -.28); wheel.rotation.x = -.6; g.add(wheel);
	const d = toy({ shirt: C.tang, pants: C.tinta, glasses: true, hair: '#3B2A22', ...driver });
	d.sit(1); d.g.scale.setScalar(.62); d.g.position.set(0, .45, .2); d.g.rotation.y = Math.PI; g.add(d.g);
	d.arms.forEach(a => { a.rotation.x = -1.25; });
	return { g, wheels, lights, wheel, d, roll(T, spd = 9) { wheels.forEach(w => { w.rotation.x = -T * spd / .27; }); } };
}

// ── casinha de maquete ──
export function house({ wall = C.creme, roof = C.tang, door = C.petro } = {}) {
	const g = new THREE.Group();
	const body = box(3, 2.4, 2.4, wall, .1); body.position.y = 1.2; g.add(body);
	const rf = mesh(new THREE.ConeGeometry(2.4, 1.4, 4), roof); rf.position.y = 3.1; rf.rotation.y = Math.PI / 4; g.add(rf);
	const dr = box(.8, 1.4, .1, door, .06); dr.position.set(.6, .72, 1.22); g.add(dr);
	const knob = mesh(new THREE.SphereGeometry(.06, 10, 8), C.amarelo); knob.position.set(.85, .72, 1.3); g.add(knob);
	const win = box(.8, .7, .1, own('#BFEFFF', { e: '#FFE6A8', ei: .25 }), .06); win.position.set(-.7, 1.4, 1.22); g.add(win);
	const step = box(1.2, .15, .6, '#E8D9C4', .05); step.position.set(.6, .07, 1.5); g.add(step);
	return g;
}

// ── poltrona de consultório ──
export function armchair({ color = C.petro, cushion = C.tang } = {}) {
	const g = new THREE.Group();
	const base = box(1.6, .5, 1.3, color, .14); base.position.y = .35; g.add(base);
	const seat = box(1.2, .2, 1.0, cushion, .1); seat.position.set(0, .68, .1); g.add(seat);
	const back = box(1.6, 1.3, .3, color, .14); back.position.set(0, 1.05, -.55); g.add(back);
	[-1, 1].forEach(s => { const a = box(.25, .5, 1.3, color, .1); a.position.set(s * .75, .78, 0); g.add(a); });
	return g;
}

// ── cadeado de brinquedo: open(k) 0 fechado … 1 aberto ──
export function padlock({ color = C.amarelo } = {}) {
	const g = new THREE.Group();
	const b = box(1, .8, .4, color, .12); b.position.y = .4; g.add(b);
	const hole = mesh(new THREE.CylinderGeometry(.09, .09, .42, 12), C.tinta); hole.rotation.x = Math.PI / 2; hole.position.set(0, .45, .01); g.add(hole);
	const piv = new THREE.Group(); piv.position.set(.3, .8, 0); g.add(piv);
	const sh = mesh(new THREE.TorusGeometry(.3, .07, 10, 24, Math.PI), '#B9C0DA', { m: .6, r: .25 }); sh.position.set(-.3, 0, 0); piv.add(sh);
	return { g, open(k) { piv.position.y = .8 + .08 * k; piv.rotation.y = -1.6 * k; } };
}

// ── mão-guia (indicador apontando para −x local) ──
export function guideHand({ skin = '#F3C9A4', sleeve = C.creme } = {}) {
	const g = new THREE.Group();
	const palm = box(.55, .45, .25, skin, .12); g.add(palm);
	const f = mesh(new THREE.CapsuleGeometry(.08, .45, 4, 10), skin); f.rotation.z = Math.PI / 2; f.position.set(-.48, .12, 0); g.add(f);
	const th = mesh(new THREE.CapsuleGeometry(.08, .2, 4, 10), skin); th.rotation.z = .6; th.position.set(-.2, .28, .05); g.add(th);
	for (let i = 0; i < 3; i++) { const k = mesh(new THREE.SphereGeometry(.1, 10, 8), skin); k.position.set(-.27, .02 - i * .13, .08); g.add(k); }
	const cuff = mesh(new THREE.CylinderGeometry(.3, .3, .9, 16), sleeve); cuff.rotation.z = Math.PI / 2; cuff.position.set(.7, 0, 0); g.add(cuff);
	return g;
}
export { mat };
