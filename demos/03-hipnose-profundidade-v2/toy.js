// Kit "brinquedo" do 03 v2: materiais foscos, bonecos de cápsula, placas com texto que sempre cabe.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const P = {
	menta: '#9FE2BF', pessego: '#FFB38A', lilas: '#B9A7FF', madeira: '#C68B59', ceu: '#BFE6FF', terra: '#8A5A3C',
	navy: '#1F2340', creme: '#FFF6E8', laranja: '#FF7A45', vermelho: '#F0524A', verde: '#4CCB7A', amarelo: '#FFD23F', azul: '#4A7BF7', fundo: '#3F4596',
};

const MATS = new Map();
export function mat(color, o = {}) {
	const k = color + JSON.stringify(o);
	if (!MATS.has(k)) MATS.set(k, new THREE.MeshStandardMaterial({ color, roughness: o.r ?? .72, metalness: o.m ?? 0, emissive: o.e || '#000000', emissiveIntensity: o.ei ?? 1, transparent: !!o.t, opacity: o.op ?? 1 }));
	return MATS.get(k);
}
// material próprio (para animar cor/emissão sem afetar outros objetos)
export const own = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: o.r ?? .72, metalness: o.m ?? 0, emissive: o.e || '#000000', emissiveIntensity: o.ei ?? 1, transparent: !!o.t, opacity: o.op ?? 1 });

export function box(w, h, d, color, r = .06, o) {
	const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2.01, h / 2.01, d / 2.01)), typeof color === 'string' ? mat(color, o) : color);
	m.castShadow = m.receiveShadow = true; return m;
}
export function mesh(geo, color, o) { const m = new THREE.Mesh(geo, typeof color === 'string' ? mat(color, o) : color); m.castShadow = m.receiveShadow = true; return m; }

// ── texto que cabe: encolhe a fonte até caber em maxW × maxH ──
export function fitFont(g, text, maxW, maxH, weight = 900, family = 'Inter', start = 200) {
	let s = Math.min(start, maxH);
	for (; s > 6; s -= 2) { g.font = `${weight} ${s}px ${family}`; const m = g.measureText(text); if (m.width <= maxW && (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) <= maxH) break; }
	return s;
}
// placa: fundo arredondado + 1–3 linhas centralizadas, cada linha medida para caber
export function signCanvas(lines, { w = 512, h = 256, bg = P.creme, fg = P.navy, border = null, radius = 40, weight = 900, family = 'Inter', pad = .14, sub = null, subColor = null } = {}) {
	const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
	if (bg) { g.fillStyle = bg; g.beginPath(); g.roundRect(0, 0, w, h, radius); g.fill(); }
	if (border) { g.strokeStyle = border; g.lineWidth = Math.max(6, h * .05); g.beginPath(); g.roundRect(g.lineWidth / 2, g.lineWidth / 2, w - g.lineWidth, h - g.lineWidth, radius); g.stroke(); }
	lines = [].concat(lines);
	const px = w * pad, subH = sub ? h * .18 : 0, avail = h * (1 - pad * 1.6) - subH, lh = avail / lines.length;
	const sizes = lines.map(t => fitFont(g, t, w - px * 2, lh * .78, weight, family));
	const s = Math.min(...sizes);
	g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `${weight} ${s}px ${family}`;
	const top = (h - subH - lh * lines.length) / 2 + lh / 2;
	lines.forEach((t, i) => g.fillText(t, w / 2, top + i * lh));
	if (sub) { const ss = fitFont(g, sub, w - px * 2, subH * .62, 700, 'JetBrains Mono'); g.font = `700 ${ss}px "JetBrains Mono"`; g.fillStyle = subColor || fg; g.fillText(sub, w / 2, h - subH * .62 - h * pad * .3); }
	return c;
}
export function texOf(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
// plano com a placa; largura em unidades de cena, altura proporcional ao canvas
export function sign(lines, width, o = {}) {
	const c = signCanvas(lines, o), h = width * c.height / c.width;
	const m = new THREE.Mesh(new THREE.PlaneGeometry(width, h), new THREE.MeshStandardMaterial({ map: texOf(c), transparent: true, roughness: .8, alphaTest: .02 }));
	m.castShadow = false; m.receiveShadow = true; m.renderOrder = 2; m.userData.canvas = c;
	return m;
}

// ── boneco de brinquedo ──
export function toy(o = {}) {
	const g = new THREE.Group();
	const skin = mat(o.skin || '#F3C9A4'), dark = mat('#262433'), shirt = mat(o.shirt || P.azul), pants = mat(o.pants || '#3D4E7A');
	const hips = new THREE.Group(); hips.position.y = .64; g.add(hips);
	const legs = [-1, 1].map(s => {
		const p = new THREE.Group(); p.position.set(s * .12, 0, 0);
		const m = mesh(new THREE.CapsuleGeometry(.1, .36, 4, 12), pants); m.position.y = -.3; p.add(m);
		const shoe = box(.2, .1, .3, '#2E2B3D', .045); shoe.position.set(0, -.58, .05); p.add(shoe);
		hips.add(p); return p;
	});
	const torso = mesh(new THREE.CapsuleGeometry(.25, .34, 4, 16), shirt); torso.position.y = .32; hips.add(torso);
	if (o.collar) { const c = mesh(new THREE.TorusGeometry(.13, .035, 8, 20), mat(o.collar)); c.rotation.x = Math.PI / 2; c.position.y = .62; hips.add(c); }
	const arms = [-1, 1].map(s => {
		const p = new THREE.Group(); p.position.set(s * .31, .55, 0);
		const m = mesh(new THREE.CapsuleGeometry(.075, .3, 4, 10), shirt); m.position.y = -.2; p.add(m);
		const hand = mesh(new THREE.SphereGeometry(.085, 14, 10), skin); hand.position.y = -.43; p.add(hand);
		p.rotation.z = s * .12; hips.add(p); return p;
	});
	const head = new THREE.Group(); head.position.y = 1.02; hips.add(head);
	const skull = mesh(new THREE.SphereGeometry(.28, 28, 20), skin); head.add(skull);
	const eyes = [-1, 1].map(s => { const e = mesh(new THREE.SphereGeometry(.042, 14, 10), dark); e.position.set(s * .1, .03, .25); e.scale.set(1, 1.25, .55); head.add(e); return e; });
	const brows = [-1, 1].map(s => { const b = box(.11, .026, .03, '#3A2E2A', .012); b.position.set(s * .1, .14, .262); head.add(b); return b; });
	const smile = mesh(new THREE.TorusGeometry(.07, .016, 6, 18, Math.PI), dark); smile.rotation.z = Math.PI; smile.position.set(0, -.075, .262); head.add(smile);
	const mouthO = mesh(new THREE.SphereGeometry(.05, 14, 10), dark); mouthO.scale.set(1, 1, .45); mouthO.position.set(0, -.1, .255); head.add(mouthO); mouthO.visible = false;
	[-1, 1].forEach(s => { const c = mesh(new THREE.SphereGeometry(.045, 12, 8), mat('#FF9AA2', { r: .9 })); c.scale.set(1, .7, .35); c.position.set(s * .17, -.05, .225); head.add(c); });
	const hairM = mat(o.hair || '#4A3426');
	if (o.hairStyle !== 'none') {
		const cap = mesh(new THREE.SphereGeometry(.295, 28, 14, 0, Math.PI * 2, 0, Math.PI * .5), hairM); cap.rotation.x = -.38; cap.position.set(0, .02, -.02); head.add(cap);
		if (o.hairStyle === 'bun') { const b = mesh(new THREE.SphereGeometry(.12, 16, 12), hairM); b.position.set(0, .26, -.18); head.add(b); }
		if (o.hairStyle === 'fringe') { const f = box(.42, .1, .12, hairM, .05); f.position.set(.03, .2, .2); f.rotation.z = -.18; head.add(f); }
	}
	if (o.glasses) {
		const gm = mat('#262433', { r: .4 });
		[-1, 1].forEach(s => { const r = mesh(new THREE.TorusGeometry(.07, .014, 8, 20), gm); r.position.set(s * .1, .03, .275); head.add(r); });
		const br = box(.07, .018, .018, gm, .008); br.position.set(0, .045, .28); head.add(br);
	}
	g.traverse(m => { if (m.isMesh) m.castShadow = true; });
	const T = {
		g, hips, legs, arms, head, eyes, brows, smile, mouthO,
		// eyes: 0 aberto … 1 fechado · mouth: 'smile' | 'o' | 'flat' · brow: −1 bravo … 0 … 1 preocupado
		face({ eyes: e = 0, mouth = 'smile', brow = 0, look = 0 } = {}) {
			eyes.forEach(x => { x.scale.y = 1.25 * (1 - e) + .14 * e; x.position.x = Math.sign(x.position.x) * .1 + look * .035; });
			brows.forEach((b, i) => { const s = i ? 1 : -1; b.rotation.z = -s * brow * .35; b.position.y = .14 + Math.abs(brow) * .015 - e * .02; });
			smile.visible = mouth === 'smile' || mouth === 'flat'; smile.scale.set(1, mouth === 'flat' ? .25 : 1, 1); mouthO.visible = mouth === 'o';
			if (mouth === 'o') mouthO.scale.set(1, 1.3, .45);
		},
		sit(k = 1) {
			legs.forEach(l => { l.rotation.x = -Math.PI / 2 * k; });
			legs.forEach(l => { l.children[1].rotation.x = Math.PI / 2 * k; l.children[1].position.set(0, -.58 + k * .05, .05 - k * .02); });
			hips.position.y = .64 - k * .14;
		},
		pose() { arms.forEach((a, i) => { a.rotation.set(0, 0, (i ? 1 : -1) * .12); }); head.rotation.set(0, 0, 0); hips.rotation.set(0, 0, 0); },
	};
	T.face(); return T;
}
export const blink = (t, seed = 0) => { const p = (t + seed * 1.37) % 3.3; return p < .13 ? Math.sin(p / .13 * Math.PI) : 0; };

// ícones desenhados (sem texto) para as placas dos sentidos
export function iconCanvas(kind, color) {
	const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
	g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(128, 128, 122, 0, 7); g.fill();
	g.strokeStyle = color; g.lineWidth = 14; g.beginPath(); g.arc(128, 128, 112, 0, 7); g.stroke();
	g.lineCap = g.lineJoin = 'round'; g.strokeStyle = P.navy; g.fillStyle = P.navy; g.lineWidth = 13;
	if (kind === 'olho') { g.beginPath(); g.moveTo(48, 128); g.quadraticCurveTo(128, 50, 208, 128); g.quadraticCurveTo(128, 206, 48, 128); g.stroke(); g.beginPath(); g.arc(128, 128, 26, 0, 7); g.fill(); }
	if (kind === 'ouvido') { g.beginPath(); g.moveTo(98, 176); g.bezierCurveTo(70, 120, 100, 58, 140, 62); g.bezierCurveTo(196, 66, 190, 140, 150, 158); g.bezierCurveTo(130, 168, 136, 196, 110, 198); g.stroke(); g.beginPath(); g.arc(138, 108, 18, Math.PI * .9, Math.PI * 2.1); g.stroke(); }
	if (kind === 'mao') { g.beginPath(); g.moveTo(92, 200); g.lineTo(92, 120); g.moveTo(92, 120); g.lineTo(92, 64); g.moveTo(120, 118); g.lineTo(120, 54); g.moveTo(148, 120); g.lineTo(148, 62); g.moveTo(174, 128); g.lineTo(174, 84); g.moveTo(92, 200); g.quadraticCurveTo(170, 214, 176, 128); g.moveTo(92, 150); g.lineTo(60, 118); g.stroke(); }
	if (kind === 'coracao') { g.fillStyle = color; g.beginPath(); g.moveTo(128, 200); g.bezierCurveTo(40, 140, 50, 64, 100, 66); g.bezierCurveTo(118, 66, 128, 82, 128, 92); g.bezierCurveTo(128, 82, 138, 66, 156, 66); g.bezierCurveTo(206, 64, 216, 140, 128, 200); g.fill(); }
	if (kind === 'x') { g.strokeStyle = P.vermelho; g.lineWidth = 34; g.beginPath(); g.moveTo(70, 70); g.lineTo(186, 186); g.moveTo(186, 70); g.lineTo(70, 186); g.stroke(); }
	if (kind === 'check') { g.strokeStyle = P.verde; g.lineWidth = 34; g.beginPath(); g.moveTo(62, 134); g.lineTo(108, 180); g.lineTo(196, 82); g.stroke(); }
	if (kind === 'escudo') { g.fillStyle = color; g.beginPath(); g.moveTo(128, 40); g.lineTo(200, 70); g.quadraticCurveTo(200, 170, 128, 214); g.quadraticCurveTo(56, 170, 56, 70); g.closePath(); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 16; g.beginPath(); g.moveTo(96, 128); g.lineTo(120, 152); g.lineTo(164, 104); g.stroke(); }
	return c;
}
export function iconBadge(kind, color, size = .7) {
	const m = new THREE.Mesh(new THREE.CircleGeometry(size / 2, 40), new THREE.MeshStandardMaterial({ map: texOf(iconCanvas(kind, color)), roughness: .8, transparent: true }));
	m.renderOrder = 3; m.castShadow = true; return m;
}
