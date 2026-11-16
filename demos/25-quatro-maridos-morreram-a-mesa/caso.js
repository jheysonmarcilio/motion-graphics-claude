// Kit "Caso" (true crime 9:16, vídeo 23) — peças reaproveitáveis, parametrizadas por cor/tamanho:
// fileCard, helix, cork, yarn, house, car, screen, tube, ghost, coatMan, tapeStrip, bag, spotCone, counter, dust, typeLine.
// Tudo determinístico (seed) e animado por T absoluto.
import * as THREE from 'three';
import { mulberry32, canvasTex, fitFont, clamp } from './lib.js';
import { CC, silhouette } from './crime.js';

export const AMB = '#FFB02E';
export const MONO = '"Special Elite","Courier New",monospace', COND = 'Oswald,"Arial Narrow",Impact,sans-serif';

const dot = (() => { let t; return () => t || (t = canvasTex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.4, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); })); })();

// texto centralizado que sempre cabe
function fitText(g, t, x, y, maxW, maxH, weight, font, color, align = 'center') {
	const s = fitFont(g, t, maxW, maxH, weight, font); g.font = `${weight} ${s}px ${font}`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(t, x, y);
}

// cartão-arquivo: rótulo, foto 3x4 com silhueta sem rosto, nome (borrado ou escrito), carimbo opcional
export function fileCard({ w = 2, h = 2.6, label = 'PRIMO', name = null, seed = 1, paper = CC.bone, photo = true, stampText = null, stampColor = CC.red } = {}) {
	const px = Math.max(150, 240 / w), r = mulberry32(seed);
	const tex = canvasTex(Math.round(w * px), Math.round(h * px), (g, cw, ch) => {
		g.fillStyle = paper; g.fillRect(0, 0, cw, ch);
		for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(80,60,30,${r() * .08})`; g.fillRect(r() * cw, r() * ch, 2 + r() * 4, 2 + r() * 4); }
		g.fillStyle = 'rgba(40,30,20,.85)'; g.fillRect(0, 0, cw, ch * .14);
		fitText(g, label, cw / 2, ch * .075, cw * .86, ch * .09, '400', MONO, paper);
		if (photo) {
			const pw = cw * .56, ph = ch * .42, px0 = (cw - pw) / 2, py0 = ch * .19;
			g.fillStyle = '#7d8a90'; g.fillRect(px0, py0, pw, ph);
			g.fillStyle = '#14191c'; g.beginPath(); g.arc(cw / 2, py0 + ph * .42, pw * .2, 0, 7); g.fill();
			g.beginPath(); g.ellipse(cw / 2, py0 + ph * 1.02, pw * .42, ph * .38, 0, Math.PI, 0); g.fill();
			g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 3; g.strokeRect(px0, py0, pw, ph);
		}
		const ny = photo ? ch * .7 : ch * .3;
		if (name) [].concat(name).forEach((t, i) => fitText(g, t, cw / 2, ny + i * ch * .1, cw * .86, ch * .08, '400', MONO, '#1a1410'));
		else { g.filter = 'blur(4px)'; g.fillStyle = 'rgba(30,24,18,.75)'; [0, 1, 2].forEach(i => g.fillRect(cw * .14, ny + i * ch * .085, cw * (.72 - r() * .3), ch * .035)); g.filter = 'none'; }
		if (stampText) { g.save(); g.translate(cw * .5, ch * .9); g.rotate(-.12); g.strokeStyle = stampColor; g.lineWidth = 5; g.strokeRect(-cw * .36, -ch * .055, cw * .72, ch * .11); fitText(g, stampText, 0, 0, cw * .66, ch * .085, '700', COND, stampColor); g.restore(); }
	});
	const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
	return m;
}

// hélice de DNA em partículas (2 fitas + degraus); tick(T, revelado 0–1, giro)
export function helix({ n = 60, turns = 3, r = .5, h = 4, color = AMB, color2 = null, size = .12, rung = 4 } = {}) {
	const per = 2 + rung, N = n * per, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
	const c1 = new THREE.Color(color), c2 = new THREE.Color(color2 || color), c3 = new THREE.Color(color).multiplyScalar(.55);
	const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
	for (let i = 0; i < n; i++) for (let j = 0; j < per; j++) (j === 0 ? c1 : j === 1 ? c2 : c3).toArray(col, (i * per + j) * 3);
	const m = new THREE.Points(g, new THREE.PointsMaterial({ size, map: dot(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
	m.frustumCulled = false;
	m.tick = (T, reveal = 1, spin = T * 1.2) => {
		for (let i = 0; i < n; i++) {
			const a = i / n * turns * 6.283 + spin, y = (i / n - .5) * h, x = Math.cos(a) * r, z = Math.sin(a) * r;
			for (let j = 0; j < per; j++) {
				const k = j === 0 ? 1 : j === 1 ? -1 : -1 + 2 * (j - 1) / (rung + 1);
				pos.set([x * k, y, z * k], (i * per + j) * 3);
			}
		}
		g.attributes.position.needsUpdate = true; g.setDrawRange(0, Math.floor(N * clamp(reveal)));
	};
	m.tick(0); return m;
}

export function cork(w = 12, h = 16, seed = 8) {
	const r = mulberry32(seed);
	return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ roughness: .95, map: canvasTex(Math.round(w * 60), Math.round(h * 60), (g, cw, ch) => {
		g.fillStyle = '#4a3a28'; g.fillRect(0, 0, cw, ch);
		for (let i = 0; i < cw * ch / 60; i++) { g.fillStyle = `rgba(${110 + r() * 70},${80 + r() * 40},${40 + r() * 20},${.25 + r() * .3})`; g.fillRect(r() * cw, r() * ch, 2 + r() * 4, 2 + r() * 4); }
	}) }));
}

// fios de lã: n ligações, cada uma em 2 trechos com barriga; set(i, a, b, progresso, opacidade)
export function yarn(n, color = AMB, rad = .025) {
	const grp = new THREE.Group(), geo = new THREE.CylinderGeometry(rad, rad, 1, 6, 1, true); geo.translate(0, .5, 0); geo.rotateX(Math.PI / 2);
	const mats = [], segs = [];
	for (let i = 0; i < n; i++) { const mt = new THREE.MeshBasicMaterial({ color, transparent: true }); mats.push(mt); const s = [new THREE.Mesh(geo, mt), new THREE.Mesh(geo, mt)]; s.forEach(x => { x.visible = false; grp.add(x); }); segs.push(s); }
	const A = new THREE.Vector3(), B = new THREE.Vector3(), M = new THREE.Vector3(), E = new THREE.Vector3();
	const put = (m, a, b) => { m.position.copy(a); m.scale.set(1, 1, Math.max(1e-4, a.distanceTo(b))); m.lookAt(b); };
	grp.set = (i, a, b, k = 1, op = 1) => {
		const [s1, s2] = segs[i]; s1.visible = s2.visible = k > .001 && op > .01; if (!s1.visible) return;
		mats[i].opacity = op; A.copy(a); B.copy(b); M.lerpVectors(A, B, .5); M.y -= A.distanceTo(B) * .07; M.z += .02;
		if (k <= .5) { E.lerpVectors(A, M, k * 2); put(s1, A, E); s2.visible = false; }
		else { put(s1, A, M); E.lerpVectors(M, B, (k - .5) * 2); put(s2, M, E); }
	};
	grp.color = (i, c) => mats[i].color.set(c);
	return grp;
}

// casa de subúrbio californiano: corpo, telhado, porta, janelas que acendem (light(i, k))
export function house({ w = 3, h = 1.8, d = 2.4, wall = '#1A2228', roof = '#0B0F12', wins = 2, lit = AMB } = {}) {
	const g = new THREE.Group(), body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: wall, roughness: .9 }));
	body.position.y = h / 2; g.add(body);
	const rf = new THREE.Mesh(new THREE.CylinderGeometry(.01, w * .62, h * .55, 4, 1), new THREE.MeshStandardMaterial({ color: roof, roughness: .8 }));
	rf.rotation.y = Math.PI / 4; rf.scale.set(1, 1, d / w * 1.05); rf.position.y = h + h * .27; g.add(rf);
	const door = new THREE.Mesh(new THREE.PlaneGeometry(w * .16, h * .55), new THREE.MeshBasicMaterial({ color: '#07090b' })); door.position.set(0, h * .275, d / 2 + .01); g.add(door);
	const dark = new THREE.Color('#0d1216'), on = new THREE.Color(lit);
	const win = Array.from({ length: wins }, (_, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w * .2, h * .3), new THREE.MeshBasicMaterial({ color: dark.clone() })); m.position.set(wins > 1 ? (i / (wins - 1) - .5) * w * .6 : w * .28, h * .58, d / 2 + .012); g.add(m); return m; });
	g.light = (i, k) => win[i].material.color.copy(dark).lerp(on, clamp(k));
	g.wins = win; return g;
}

// sedã anos 80 em silhueta; userData.handle = maçaneta
export function car({ color = '#151b20', glass = '#05080a', chrome = '#9aa6ad' } = {}) {
	const g = new THREE.Group(), M = c => new THREE.MeshStandardMaterial({ color: c, roughness: .35, metalness: .6 });
	const body = new THREE.Mesh(new THREE.BoxGeometry(4.6, .75, 1.8), M(color)); body.position.y = .65; g.add(body);
	const cab = new THREE.Mesh(new THREE.BoxGeometry(2.4, .6, 1.62), M(glass)); cab.position.set(-.2, 1.3, 0); g.add(cab);
	[[-1.5, .9], [1.5, .9], [-1.5, -.9], [1.5, -.9]].forEach(([x, z]) => { const wl = new THREE.Mesh(new THREE.CylinderGeometry(.36, .36, .25, 18), M('#050607')); wl.rotation.x = Math.PI / 2; wl.position.set(x, .36, z); g.add(wl); });
	const handle = new THREE.Mesh(new THREE.BoxGeometry(.32, .07, .06), M(chrome)); handle.position.set(-.15, .88, .93); g.add(handle);
	const hl = new THREE.Mesh(new THREE.PlaneGeometry(.35, .16), new THREE.MeshBasicMaterial({ color: '#fff2c8' })); hl.position.set(2.31, .7, .55); hl.rotation.y = Math.PI / 2; g.add(hl);
	const hl2 = hl.clone(); hl2.position.z = -.55; g.add(hl2);
	g.userData.handle = handle; return g;
}

// tela com canvas redesenhável: draw(g, w, h) chamado em redraw()
export function screen(w, h, cw = 1024, draw = () => {}) {
	const ch = Math.round(cw * h / w), tex = canvasTex(cw, ch, draw), m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
	const g = tex.userData.canvas.getContext('2d');
	m.redraw = fn => { fn(g, cw, ch); tex.needsUpdate = true; };
	return m;
}

// tubo de coleta com líquido âmbar e mini-hélice
export function tube({ h = 1.6, r = .2, liquid = AMB, cap = CC.red } = {}) {
	const g = new THREE.Group();
	const glassM = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 24, 1, true), new THREE.MeshStandardMaterial({ color: '#cfe3ea', transparent: true, opacity: .22, roughness: .1, metalness: .2, side: THREE.DoubleSide, depthWrite: false }));
	glassM.renderOrder = 3; g.add(glassM);
	const bottom = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 10, 0, 6.283, Math.PI / 2, Math.PI / 2), glassM.material); bottom.position.y = -h / 2; g.add(bottom);
	const liq = new THREE.Mesh(new THREE.CylinderGeometry(r * .86, r * .86, h * .35, 20), new THREE.MeshBasicMaterial({ color: liquid, transparent: true, opacity: .75 })); liq.position.y = -h / 2 + h * .17; g.add(liq);
	const c = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.15, r * 1.15, h * .16, 24), new THREE.MeshStandardMaterial({ color: cap, roughness: .5 })); c.position.y = h / 2 + h * .07; g.add(c);
	const hx = helix({ n: 26, turns: 2.2, r: r * .55, h: h * .8, size: .07 }); g.add(hx);
	g.liq = liq; g.hx = hx; return g;
}

// fantasma: silhueta translúcida aditiva (op 0–1)
export function ghost(h = 1.8, color = '#9DB7C8') {
	const s = silhouette(h), mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .3, blending: THREE.AdditiveBlending, depthWrite: false });
	s.traverse(o => { if (o.isMesh) o.material = mat; });
	s.op = k => { mat.opacity = k; s.visible = k > .005; }; return s;
}

// homem idoso de capa de chuva e chapéu, levemente curvado
export function coatMan(h = 1.8, color = '#0B0E11') {
	const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color, roughness: .7 }), u = h / 1.8;
	const coat = new THREE.Mesh(new THREE.CylinderGeometry(.24 * u, .42 * u, 1.05 * u, 18), m); coat.position.y = .78 * u; g.add(coat);
	const sh = new THREE.Mesh(new THREE.SphereGeometry(.27 * u, 18, 12), m); sh.scale.set(1.05, .6, .8); sh.position.y = 1.3 * u; g.add(sh);
	const legs = new THREE.Mesh(new THREE.CylinderGeometry(.16 * u, .14 * u, .3 * u, 10), m); legs.position.y = .15 * u; g.add(legs);
	const head = new THREE.Mesh(new THREE.SphereGeometry(.16 * u, 18, 12), m); head.position.set(0, 1.5 * u, .08 * u); g.add(head);
	const brim = new THREE.Mesh(new THREE.CylinderGeometry(.3 * u, .3 * u, .03 * u, 24), m); brim.position.set(0, 1.6 * u, .08 * u); brim.rotation.x = .12; g.add(brim);
	const crown = new THREE.Mesh(new THREE.CylinderGeometry(.15 * u, .17 * u, .15 * u, 18), m); crown.position.set(0, 1.68 * u, .08 * u); g.add(crown);
	return g;
}

// fita de evidência amarela com texto repetido
export function tapeStrip(len = 10, hgt = .3, text = 'EVIDÊNCIA · NÃO VIOLAR · ') {
	const tex = canvasTex(512, 40, (g, w, h) => { g.fillStyle = '#F4C20D'; g.fillRect(0, 0, w, h); g.fillStyle = '#111'; g.fillRect(0, 2, w, 3); g.fillRect(0, h - 5, w, 3); fitText(g, text, w / 2, h / 2 + 1, w * .96, h * .6, '700', COND, '#111'); });
	tex.wrapS = THREE.RepeatWrapping; tex.repeat.set(Math.max(1, Math.round(len / (hgt * 12.8))), 1);
	return new THREE.Mesh(new THREE.PlaneGeometry(len, hgt), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
}

// saco de prova (plástico + faixa vermelha)
export function bag(w = 1.6, h = 2, label = 'EVIDÊNCIA', note = 'CENA Nº 7') {
	const tex = canvasTex(Math.round(w * 140), Math.round(h * 140), (g, cw, ch) => {
		g.fillStyle = 'rgba(200,215,220,.28)'; g.fillRect(0, 0, cw, ch);
		g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(cw * .08, ch * .05, cw * .05, ch * .9);
		g.fillStyle = '#B3202B'; g.fillRect(0, ch * .1, cw, ch * .16); fitText(g, label, cw / 2, ch * .18, cw * .86, ch * .1, '700', COND, '#fff');
		g.fillStyle = 'rgba(232,224,204,.92)'; g.fillRect(cw * .15, ch * .32, cw * .7, ch * .24);
		g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 2; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(cw * .2, ch * (.39 + i * .06)); g.lineTo(cw * .8, ch * (.39 + i * .06)); g.stroke(); }
		fitText(g, note, cw / 2, ch * .36, cw * .6, ch * .05, '400', MONO, '#222');
	});
	return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
}

// cone de luz volumétrico (mais forte perto da fonte, borda suave)
export function spotCone(rTop = .15, rBot = 2.2, h = 7, color = '#ffe6b8', op = .35) {
	const geo = new THREE.CylinderGeometry(rTop, rBot, h, 40, 1, true); geo.translate(0, -h / 2, 0);
	const mat = new THREE.ShaderMaterial({
		uniforms: { uC: { value: new THREE.Color(color) }, uO: { value: op } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
		vertexShader: `varying float vY; varying vec3 vN, vV; void main(){ vY = uv.y; vec4 mv = modelViewMatrix * vec4(position,1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
		fragmentShader: `uniform vec3 uC; uniform float uO; varying float vY; varying vec3 vN, vV; void main(){ float e = pow(abs(dot(normalize(vN), normalize(vV))), 1.6); gl_FragColor = vec4(uC * uO * e * pow(vY, 1.3), 1.); }`,
	});
	const m = new THREE.Mesh(geo, mat); m.op = k => { mat.uniforms.uO.value = k; m.visible = k > .002; }; return m;
}

// número/rótulo que só redesenha quando muda
export function counter(w, h, { color = AMB, font = COND, weight = '700' } = {}) {
	let last = null; const m = screen(w, h, Math.round(w * 160)); m.material.transparent = true; m.material.depthWrite = false;
	m.set = t => { if (t === last) return; last = t; m.redraw((g, cw, ch) => { g.clearRect(0, 0, cw, ch); fitText(g, t, cw / 2, ch / 2, cw * .94, ch * .8, weight, font, color); }); };
	return m;
}

// poeira no ar (micro-animação contínua)
export function dust(n = 220, box = [10, 10, 6], seed = 5, color = '#ffe2b0', size = .05) {
	const r = mulberry32(seed), base = Array.from({ length: n }, () => [r() - .5, r() - .5, r() - .5, r() * 6.28, .2 + r() * .6]);
	const pos = new Float32Array(n * 3), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
	const m = new THREE.Points(g, new THREE.PointsMaterial({ color, size, map: dot(), transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending })); m.frustumCulled = false;
	m.tick = T => { base.forEach(([x, y, z, p, s], i) => pos.set([(x + Math.sin(T * .3 * s + p) * .04) * box[0], (((y + .5 + T * .02 * s) % 1) - .5) * box[1], (z + Math.cos(T * .25 * s + p) * .04) * box[2]], i * 3)); g.attributes.position.needsUpdate = true; };
	m.tick(0); return m;
}

// linha batida à máquina de escrever: type(n) mostra n letras + cursor
export function typeLine(text, w, h, color = '#1a1410', font = MONO) {
	const m = screen(w, h, Math.round(w * 200)); m.material.transparent = true; m.material.depthWrite = false; let last = -2;
	m.type = n => { n = Math.max(0, Math.min(text.length, Math.floor(n))); if (n === last) return; last = n; m.redraw((g, cw, ch) => {
		g.clearRect(0, 0, cw, ch); const s = fitFont(g, text + '▌', cw * .94, ch * .7, '400', font); g.font = `400 ${s}px ${font}`; const fw = g.measureText(text + '▌').width;
		g.fillStyle = color; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(text.slice(0, n) + (n < text.length ? '▌' : ''), (cw - fw) / 2, ch / 2);
	}); };
	m.type(0); return m;
}
