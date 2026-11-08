// Estilo Sticker — mundo: luz dia/dourado (lights.js), céu em shader, névoa = horizonte, texturas pintadas em canvas
// (costuras pintadas como tons escuros) e peças de cidade (casas, torre do relógio, árvores, poste, banco, fonte, mesa
// de café com guarda-sol, vaso de flores). Tudo em material twoTone (shade.js) na camada 0 → recebe a tinta do ink.js.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { TONE, CHAR, twoTone, untone } from './shade.js';
import { LIGHTS, LOOK } from './lights.js';
import { SOFT } from './ink.js';
import { mulberry32, lerp } from './anim.js';

export const INKC = '#2a1f2a'; // costuras pintadas nas texturas

// ───────────────────────── luz ─────────────────────────
const lerpA = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));
const colLerp = (a, b, k) => new THREE.Color(a).lerp(new THREE.Color(b), k);
export const lightMix = (k) => {
	const D = LIGHTS.day, G = LIGHTS.golden, L = {};
	for (const key in D) {
		const a = D[key], b = G[key];
		L[key] = typeof a === 'number' ? lerp(a, b, k) : Array.isArray(a) ? (Array.isArray(a[0]) ? a : lerpA(a, b, k)) : typeof a === 'string' && a[0] === '#' ? '#' + colLerp(a, b, k).getHexString() : k < .5 ? a : b;
	}
	const LD = LOOK.day, LG = LOOK.golden;
	L.skyC = LD.sky.c.map((c, i) => colLerp(c, LG.sky.c[i], k)); L.skyE = lerpA(LD.sky.e, LG.sky.e, k);
	L.cloud = { lit: colLerp(LD.cloud.lit, LG.cloud.lit, k), shade: colLerp(LD.cloud.shade, LG.cloud.shade, k) };
	L.bounce = lerpA(LD.bounce, LG.bounce, k); L.sat = lerp(LD.sat, LG.sat, k); L.k = k;
	return L;
};

// ───────────────────────── céu ─────────────────────────
const SKY_FRAG = /* glsl */`
uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e4; uniform float e0; uniform vec3 sunDir; uniform vec3 discCol; uniform float discK;
varying vec3 vDir;
void main() {
	vec3 d = normalize(vDir); float el = degrees(asin(clamp(d.y, -1.0, 1.0)));
	vec3 c = c0;
	c = mix(c, c1, smoothstep(e0, e4.x, el)); c = mix(c, c2, smoothstep(e4.x, e4.y, el));
	c = mix(c, c3, smoothstep(e4.y, e4.z, el)); c = mix(c, c4, smoothstep(e4.z, e4.w, el));
	float s = max(dot(d, sunDir), 0.0);
	c += discCol * discK * (smoothstep(.9994, .9997, s) * 3.0 + pow(s, 60.0) * .5 + pow(s, 8.0) * .12);
	gl_FragColor = vec4(c, 1.0);
}`;
export function makeSky() {
	const u = { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() }, c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e0: { value: 0 }, e4: { value: new THREE.Vector4() }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, discCol: { value: new THREE.Color() }, discK: { value: 0 } };
	const m = new THREE.ShaderMaterial({ uniforms: u, side: THREE.BackSide, depthWrite: false, fog: false,
		vertexShader: 'varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }', fragmentShader: SKY_FRAG });
	const sky = new THREE.Mesh(new THREE.SphereGeometry(800, 48, 24), m);
	sky.layers.set(SOFT); sky.renderOrder = -10; sky.frustumCulled = false;
	return sky;
}

/**
 * Aplica a luz (k: 0 dia → 1 dourado) na cena. Sol relativo à câmera do plano: az em graus a partir do eixo de visão
 * (0 = contraluz, +90 = direita da tela, 180 = atrás da câmera). `fwd` = direção (x,z) da câmera do plano, congelada.
 */
export function applyLight(W, k, fwd, focus, elO) {
	const L = lightMix(k);
	const f = new THREE.Vector3(fwd[0], 0, fwd[1]).normalize(), r = new THREE.Vector3(-f.z, 0, f.x);
	const az = L.az * Math.PI / 180, el = (elO ?? L.el) * Math.PI / 180;
	const sun = new THREE.Vector3().addScaledVector(f, Math.cos(az)).addScaledVector(r, Math.sin(az)).normalize().multiplyScalar(Math.cos(el)).setY(Math.sin(el)).normalize();
	W.sunDir.copy(sun);
	const S = W.sun; S.target.position.set(focus[0], focus[1], focus[2]); S.position.copy(S.target.position).addScaledVector(sun, 80);
	S.shadow.bias = L.bias; S.shadow.normalBias = L.normalBias;
	TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
	TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...L.bounce); TONE.uSat.value = L.sat;
	CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad; CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
	const su = W.sky.material.uniforms;
	['c0', 'c1', 'c2', 'c3', 'c4'].forEach((n, i) => untone(L.skyC[i], su[n].value));
	su.e0.value = L.skyE[0]; su.e4.value.set(L.skyE[1], L.skyE[2], L.skyE[3], L.skyE[4]);
	su.sunDir.value.copy(sun); untone(L.sunDisc, su.discCol.value); su.discK.value = k > .5 ? 1.6 : 0;
	untone(L.fog, W.scene.fog.color); W.scene.fog.near = L.fogNear; W.scene.fog.far = L.fogFar;
	W.light = L;
	for (const c of W.clouds) { c.material.color.copy(L.cloud.lit).lerp(L.cloud.shade, .25); }
	for (const g of W.glows) g.material.color.setScalar(lerp(.9, 3.2, k)).multiply(new THREE.Color('#ffd27a')); // lanternas acendem no dourado
	return L;
}

// ───────────────────────── pintura (canvas) ─────────────────────────
const TEX = new Map();
export function ctex(key, w, h, draw, rep = [1, 1]) {
	let t = TEX.get(key);
	if (!t) {
		const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
		draw(cv.getContext('2d'), w, h);
		t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
		t.wrapS = t.wrapT = THREE.RepeatWrapping; TEX.set(key, t);
	}
	if (rep[0] !== 1 || rep[1] !== 1) { t = t.clone(); t.repeat.set(rep[0], rep[1]); t.needsUpdate = true; }
	return t;
}
const shadeHex = (c, k) => '#' + new THREE.Color(c).multiplyScalar(k).getHexString();
/** manchas suaves de tinta (aquarela) */
function mottle(g, w, h, col, seed, n = 40, a = .07) {
	const r = mulberry32(seed);
	for (let i = 0; i < n; i++) {
		const x = r() * w, y = r() * h, rad = (.05 + r() * .18) * Math.max(w, h);
		const gr = g.createRadialGradient(x, y, 0, x, y, rad); const c = new THREE.Color(col).multiplyScalar(r() < .5 ? .86 : 1.1);
		gr.addColorStop(0, `rgba(${c.r * 255 | 0},${c.g * 255 | 0},${c.b * 255 | 0},${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
		g.fillStyle = gr; g.fillRect(0, 0, w, h);
	}
}
export const plasterTex = (col, seed = 1) => ctex(`pl|${col}|${seed}`, 256, 256, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); mottle(g, w, h, col, seed); });
/** fachada pintada: janelas com moldura, vidro, persiana, porta; costuras em tom escuro */
export function facadeTex(key, { col, trim = '#f3ead8', shutter = '#4f7f6a', floors = 2, cols = 3, w = 6, h = 7, door = 1, shop = null, seed = 1 }) {
	const PX = 72, W = Math.round(w * PX), H = Math.round(h * PX);
	return ctex('fa|' + key, W, H, (g) => {
		const r = mulberry32(seed);
		g.fillStyle = col; g.fillRect(0, 0, W, H); mottle(g, W, H, col, seed, 60, .08);
		// sujeira na base e manchas de chuva
		const gr = g.createLinearGradient(0, H, 0, H * .75); gr.addColorStop(0, 'rgba(60,40,50,.22)'); gr.addColorStop(1, 'rgba(60,40,50,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
		const fh = (H - .35 * PX) / floors;
		g.lineJoin = 'round';
		for (let f = 0; f < floors; f++) {
			for (let c = 0; c < cols; c++) {
				const cx = (c + .5) * W / cols, y0 = H - (f + 1) * fh + fh * .22, ww = Math.min(.95 * PX, W / cols * .42), wh = fh * .5;
				if (f === 0 && c === door) { // porta
					const dw = ww * 1.05, dh = fh * .78, dy = H - dh;
					g.fillStyle = shop ? '#6b3a2a' : shadeHex(shutter, .8); g.fillRect(cx - dw / 2, dy, dw, dh);
					g.strokeStyle = INKC; g.lineWidth = 4; g.strokeRect(cx - dw / 2, dy, dw, dh);
					g.fillStyle = '#2b3550'; g.fillRect(cx - dw * .3, dy + dh * .12, dw * .6, dh * .3); g.strokeRect(cx - dw * .3, dy + dh * .12, dw * .6, dh * .3);
					g.fillStyle = '#e8c45a'; g.beginPath(); g.arc(cx + dw * .32, dy + dh * .6, 4, 0, 7); g.fill();
					continue;
				}
				if (f === 0 && shop) { // vitrine da loja
					const sw = W / cols * .8, sh = fh * .55, sy = H - fh * .78;
					g.fillStyle = '#ffe2a8'; g.fillRect(cx - sw / 2, sy, sw, sh);
					g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(cx - sw * .4, sy + sh); g.lineTo(cx - sw * .1, sy); g.lineTo(cx + sw * .05, sy); g.lineTo(cx - sw * .25, sy + sh); g.fill();
					// pães na vitrine
					for (let i = 0; i < 3; i++) { g.fillStyle = '#d9913f'; g.beginPath(); g.ellipse(cx - sw * .28 + i * sw * .28, sy + sh * .78, sw * .11, sh * .1, -.2, 0, 7); g.fill(); g.strokeStyle = INKC; g.lineWidth = 2.5; g.stroke(); }
					g.strokeStyle = INKC; g.lineWidth = 4; g.strokeRect(cx - sw / 2, sy, sw, sh);
					continue;
				}
				// persianas
				g.fillStyle = shutter; g.fillRect(cx - ww / 2 - ww * .42, y0, ww * .38, wh); g.fillRect(cx + ww / 2 + ww * .04, y0, ww * .38, wh);
				g.strokeStyle = shadeHex(shutter, .6); g.lineWidth = 2;
				for (let k = 1; k < 6; k++) { const yy = y0 + wh * k / 6; g.beginPath(); g.moveTo(cx - ww / 2 - ww * .42, yy); g.lineTo(cx - ww / 2 - ww * .04, yy); g.moveTo(cx + ww / 2 + ww * .04, yy); g.lineTo(cx + ww / 2 + ww * .42, yy); g.stroke(); }
				g.strokeStyle = INKC; g.lineWidth = 3; g.strokeRect(cx - ww / 2 - ww * .42, y0, ww * .38, wh); g.strokeRect(cx + ww / 2 + ww * .04, y0, ww * .38, wh);
				// moldura + vidro
				g.fillStyle = trim; g.fillRect(cx - ww / 2 - 6, y0 - 6, ww + 12, wh + 12);
				const lit = r() < .25;
				const gg = g.createLinearGradient(0, y0, 0, y0 + wh); gg.addColorStop(0, lit ? '#ffdf9a' : '#3d5378'); gg.addColorStop(1, lit ? '#f2b45e' : '#24304d');
				g.fillStyle = gg; g.fillRect(cx - ww / 2, y0, ww, wh);
				g.fillStyle = 'rgba(255,255,255,.28)'; g.beginPath(); g.moveTo(cx - ww * .4, y0 + wh); g.lineTo(cx - ww * .05, y0); g.lineTo(cx + ww * .12, y0); g.lineTo(cx - ww * .23, y0 + wh); g.fill();
				g.strokeStyle = trim; g.lineWidth = 5; g.beginPath(); g.moveTo(cx, y0); g.lineTo(cx, y0 + wh); g.moveTo(cx - ww / 2, y0 + wh * .45); g.lineTo(cx + ww / 2, y0 + wh * .45); g.stroke();
				g.strokeStyle = INKC; g.lineWidth = 3.5; g.strokeRect(cx - ww / 2 - 6, y0 - 6, ww + 12, wh + 12);
				// peitoril + floreira em alguns
				g.fillStyle = shadeHex(trim, .92); g.fillRect(cx - ww / 2 - 12, y0 + wh + 6, ww + 24, 9); g.strokeRect(cx - ww / 2 - 12, y0 + wh + 6, ww + 24, 9);
				if (r() < .45) { g.fillStyle = '#4f8a3c'; g.fillRect(cx - ww / 2, y0 + wh + 15, ww, 12); for (let k = 0; k < 6; k++) { g.fillStyle = ['#e2453c', '#ffd23f', '#f08ab0'][k % 3]; g.beginPath(); g.arc(cx - ww / 2 + 8 + k * (ww - 16) / 5, y0 + wh + 12, 6, 0, 7); g.fill(); g.strokeStyle = INKC; g.lineWidth = 2; g.stroke(); } }
			}
			if (f > 0) { g.fillStyle = shadeHex(col, .9); g.fillRect(0, H - f * fh - 5, W, 6); }
		}
	});
}
export const roofTex = (col, seed = 1) => ctex(`rf|${col}|${seed}`, 256, 256, (g, w, h) => {
	const r = mulberry32(seed); g.fillStyle = shadeHex(col, .55); g.fillRect(0, 0, w, h);
	const rows = 8, tw = 32;
	for (let y = 0; y < rows; y++) for (let x = -1; x < w / tw + 1; x++) {
		const ox = (y % 2) * tw / 2, cx = x * tw + ox, cy = y * h / rows;
		g.fillStyle = shadeHex(col, .9 + r() * .2); g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + tw, cy); g.lineTo(cx + tw, cy + h / rows * .8);
		g.quadraticCurveTo(cx + tw / 2, cy + h / rows * 1.05, cx, cy + h / rows * .8); g.closePath(); g.fill();
		g.strokeStyle = shadeHex(col, .45); g.lineWidth = 2; g.stroke();
	}
});
export const cobbleTex = () => ctex('cobble', 512, 512, (g, w, h) => {
	const r = mulberry32(7); g.fillStyle = '#6f6670'; g.fillRect(0, 0, w, h);
	const n = 14, s = w / n;
	for (let y = 0; y < n; y++) for (let x = 0; x < n + 1; x++) {
		const cx = (x + (y % 2) * .5) * s, cy = (y + .5) * s, rx = s * (.4 + r() * .06), ry = s * (.4 + r() * .05);
		const base = ['#c9b89f', '#bba98f', '#d4c4aa', '#b7a48c', '#c2ae95'][Math.floor(r() * 5)];
		g.fillStyle = base; g.beginPath(); g.ellipse(cx % w, cy, rx, ry, r(), 0, 7); g.fill();
		g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.ellipse(cx % w - rx * .2, cy - ry * .25, rx * .5, ry * .35, 0, 0, 7); g.fill();
		if (cx > w - s) { g.fillStyle = base; g.beginPath(); g.ellipse(cx - w, cy, rx, ry, 0, 0, 7); g.fill(); }
	}
	mottle(g, w, h, '#a89a88', 3, 20, .1);
});
export const grassTex = () => ctex('grass', 256, 256, (g, w, h) => {
	const r = mulberry32(5); g.fillStyle = '#6fa64a'; g.fillRect(0, 0, w, h); mottle(g, w, h, '#6fa64a', 5, 30, .14);
	for (let i = 0; i < 500; i++) { const x = r() * w, y = r() * h; g.strokeStyle = r() < .5 ? '#5d9440' : '#86ba58'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * 4, y - 6 - r() * 5); g.stroke(); }
});
export const leafTex = (col = '#5aa04a') => ctex('leaf|' + col, 256, 256, (g, w, h) => {
	const r = mulberry32(11); g.fillStyle = col; g.fillRect(0, 0, w, h);
	for (let i = 0; i < 260; i++) { const x = r() * w, y = r() * h; g.fillStyle = r() < .5 ? shadeHex(col, .82) : shadeHex(col, 1.15); g.beginPath(); g.ellipse(x, y, 7 + r() * 5, 4 + r() * 3, r() * 3, 0, 7); g.fill(); }
});
export const woodTex = (col = '#a8744a') => ctex('wood|' + col, 256, 64, (g, w, h) => {
	const r = mulberry32(13); g.fillStyle = col; g.fillRect(0, 0, w, h);
	for (let i = 0; i < 14; i++) { g.strokeStyle = shadeHex(col, .8 + r() * .1); g.lineWidth = 1.5; g.beginPath(); const y = r() * h; g.moveTo(0, y); g.bezierCurveTo(w * .3, y + 4, w * .6, y - 4, w, y + 2); g.stroke(); }
	g.strokeStyle = INKC; g.lineWidth = 3; g.strokeRect(1, 1, w - 2, h - 2);
});
export const stripeTex = (a, b) => ctex(`st|${a}|${b}`, 256, 64, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(i * w / 8, 0, w / 8, h); } });

// ───────────────────────── materiais e peças ─────────────────────────
const MATS = new Map();
export const mat = (key, params) => { let m = MATS.get(key); if (!m) { m = twoTone(new THREE.MeshLambertMaterial(params)); MATS.set(key, m); } return m; };
export const solid = (col) => mat('c|' + col, { color: col });
export function mesh(geo, m, x = 0, y = 0, z = 0, parent) {
	const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; if (parent) parent.add(o); return o;
}
/** prisma de telhado de duas águas ao longo de x: largura w (x), profundidade d (z), altura h */
function gableGeo(w, d, h, over = .35) {
	const W = w / 2 + over, D = d / 2 + over, g = new THREE.BufferGeometry();
	const P = [[-W, 0, D], [W, 0, D], [W, h, 0], [-W, h, 0], [-W, 0, -D], [W, 0, -D]];
	const tris = [[0, 1, 2], [0, 2, 3], [5, 4, 3], [5, 3, 2], [0, 3, 4], [1, 5, 2]];
	const pos = [], uv = [];
	tris.forEach((t) => t.forEach((k) => { pos.push(...P[k]); uv.push(P[k][0] * .3, (P[k][1] + Math.abs(P[k][2])) * .3); }));
	g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
	g.computeVertexNormals(); return g;
}
/**
 * Casa: frente voltada para +z local. Gira com `yaw`. Retorna o grupo.
 * o: { w, d, h, col, roof, floors, cols, door, shop, shutter, seed, chimney }
 */
export function house(parent, x, z, yaw, o) {
	const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = yaw; parent.add(g);
	const { w = 6, d = 6, h = 7, col = '#e8c9a0', roof = '#c0563f', seed = 1 } = o;
	const side = mat('pl|' + col + seed, { map: plasterTex(col, seed) });
	const front = mat('fa|' + col + seed + (o.shop || ''), { map: facadeTex(col + seed, { col, w, h, floors: o.floors || 2, cols: o.cols || 3, door: o.door ?? 1, shop: o.shop, shutter: o.shutter || '#4f7f6a', seed }) });
	mesh(new THREE.BoxGeometry(w, h, d), [side, side, side, side, front, side], 0, h / 2, 0, g);
	mesh(new THREE.BoxGeometry(w + .16, .5, d + .16), solid(shadeHex(col, .62)), 0, .25, 0, g);                 // embasamento
	mesh(new THREE.BoxGeometry(w + .3, .28, d + .3), solid('#f1e6d2'), 0, h - .1, 0, g);                         // cornija
	const rh = o.roofH ?? Math.min(3.2, w * .42);
	mesh(gableGeo(w, d, rh), mat('rf|' + roof, { map: roofTex(roof, seed) }), 0, h, 0, g);
	if (o.chimney !== false) {
		const cx = (seed % 2 ? 1 : -1) * w * .25;
		mesh(new THREE.BoxGeometry(.6, 1.8, .6), solid('#a35a45'), cx, h + rh * .55 + .4, -d * .1, g);
		mesh(new THREE.BoxGeometry(.8, .2, .8), solid('#7a3b30'), cx, h + rh * .55 + 1.35, -d * .1, g);
		mesh(new THREE.CylinderGeometry(.14, .16, .35, 10), solid('#c06a3f'), cx, h + rh * .55 + 1.6, -d * .1, g);
	}
	return g;
}
/** placa de loja (texto pintado, material sem luz para não ficar cinza) */
export function signBoard(parent, text, x, y, z, yaw, w = 3.2, h = .8, bg = '#7a2f2a', fg = '#ffe7b0') {
	const t = ctex('sign|' + text, 512, Math.round(512 * h / w), (g, W, H) => {
		g.fillStyle = bg; g.fillRect(0, 0, W, H); g.strokeStyle = '#f3d9a0'; g.lineWidth = 8; g.strokeRect(12, 12, W - 24, H - 24);
		let fs = H * .62; g.font = `800 ${fs}px Inter`; while (g.measureText(text).width > W * .84 && fs > 8) { fs -= 2; g.font = `800 ${fs}px Inter`; }
		g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, W / 2, H / 2 + fs * .05);
	});
	const grp = new THREE.Group(); grp.position.set(x, y, z); grp.rotation.y = yaw; parent.add(grp);
	mesh(new THREE.BoxGeometry(w + .12, h + .12, .14), solid('#4a2a22'), 0, 0, 0, grp);
	const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, toneMapped: true }));
	face.position.z = .075; grp.add(face);
	return grp;
}
/** torre do relógio; o mostrador é redesenhado com a hora (ponteiros andam) */
export function clockTower(parent, x, z, yaw = 0) {
	const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = yaw; parent.add(g);
	const col = '#e9d2a8';
	mesh(new THREE.BoxGeometry(5, 17, 5), mat('tower', { map: plasterTex(col, 21) }), 0, 8.5, 0, g);
	mesh(new THREE.BoxGeometry(5.4, .6, 5.4), solid('#f3e8d2'), 0, 17.1, 0, g);
	mesh(new THREE.BoxGeometry(5.6, 1, 5.6), solid(shadeHex(col, .6)), 0, .5, 0, g);
	mesh(new THREE.BoxGeometry(5.3, .4, 5.3), solid('#f3e8d2'), 0, 11.5, 0, g);
	const roof = mesh(new THREE.ConeGeometry(4.3, 6, 4), mat('rf|#3f6fb5', { map: roofTex('#3f6fb5', 3) }), 0, 20.4, 0, g); roof.rotation.y = Math.PI / 4;
	mesh(new THREE.SphereGeometry(.35, 12, 8), solid('#e8c45a'), 0, 23.5, 0, g);
	const cv = document.createElement('canvas'); cv.width = cv.height = 256; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
	let last = -1;
	const draw = (min) => {
		const q = Math.round(min * 2) / 2; if (q === last) return; last = q;
		const c = cv.getContext('2d'); c.clearRect(0, 0, 256, 256);
		c.fillStyle = '#fbf3df'; c.beginPath(); c.arc(128, 128, 118, 0, 7); c.fill(); c.lineWidth = 12; c.strokeStyle = INKC; c.stroke();
		for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.lineWidth = i % 3 ? 5 : 9; c.beginPath(); c.moveTo(128 + Math.sin(a) * 92, 128 - Math.cos(a) * 92); c.lineTo(128 + Math.sin(a) * 108, 128 - Math.cos(a) * 108); c.stroke(); }
		const hA = (q / 60) / 12 * Math.PI * 2, mA = (q % 60) / 60 * Math.PI * 2;
		c.lineCap = 'round'; c.lineWidth = 12; c.beginPath(); c.moveTo(128, 128); c.lineTo(128 + Math.sin(hA) * 58, 128 - Math.cos(hA) * 58); c.stroke();
		c.lineWidth = 8; c.beginPath(); c.moveTo(128, 128); c.lineTo(128 + Math.sin(mA) * 88, 128 - Math.cos(mA) * 88); c.stroke();
		c.fillStyle = '#c0353a'; c.beginPath(); c.arc(128, 128, 11, 0, 7); c.fill();
		tex.needsUpdate = true;
	};
	draw(0);
	const fm = new THREE.MeshBasicMaterial({ map: tex, alphaTest: .5 });
	for (let i = 0; i < 4; i++) {
		const f = new THREE.Mesh(new THREE.CircleGeometry(1.7, 40), fm), a = i * Math.PI / 2;
		f.position.set(Math.sin(a) * 2.52, 14.3, Math.cos(a) * 2.52); f.rotation.y = a; g.add(f);
	}
	return { group: g, setTime: draw };
}
/** árvore: tronco + 4 bolhas de copa (ink nos contornos) */
export function tree(parent, x, z, s = 1, seed = 1) {
	const r = mulberry32(seed), g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); parent.add(g);
	mesh(new THREE.CylinderGeometry(.22, .34, 3.2, 10), solid('#7a5236'), 0, 1.6, 0, g);
	const leaf = mat('leaf', { map: leafTex() });
	const blobs = [[0, 4.2, 0, 1.9], [-1.1, 3.6, .3, 1.3], [1.1, 3.8, -.2, 1.4], [.2, 5.3, -.2, 1.3]];
	for (const [bx, by, bz, br] of blobs) { const m = mesh(new THREE.IcosahedronGeometry(br * (.9 + r() * .2), 3), leaf, bx, by, bz, g); m.scale.y = .88; }
	return g;
}
/** poste com lanterna (brilha no dourado → bloom) */
export function lamp(parent, x, z, W) {
	const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
	const iron = solid('#2f3440');
	mesh(new THREE.CylinderGeometry(.09, .13, 3.6, 10), iron, 0, 1.8, 0, g);
	mesh(new THREE.CylinderGeometry(.22, .26, .3, 10), iron, 0, .15, 0, g);
	mesh(new THREE.BoxGeometry(.5, .08, .5), iron, 0, 3.62, 0, g);
	mesh(new THREE.ConeGeometry(.42, .35, 4), iron, 0, 4.38, 0, g).rotation.y = Math.PI / 4;
	const glow = new THREE.Mesh(new THREE.BoxGeometry(.36, .5, .36), new THREE.MeshBasicMaterial({ color: '#ffd27a' })); glow.position.y = 3.92; g.add(glow);
	W.glows.push(glow);
	return g;
}
export function bench(parent, x, z, yaw = 0) {
	const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = yaw; parent.add(g);
	const wd = mat('wood', { map: woodTex() }), iron = solid('#2f3440');
	for (let i = 0; i < 3; i++) mesh(new THREE.BoxGeometry(2, .07, .16), wd, 0, .48, -.18 + i * .18, g);
	for (let i = 0; i < 2; i++) mesh(new THREE.BoxGeometry(2, .16, .06), wd, 0, .72 + i * .2, -.32, g).rotation.x = -.15;
	for (const sx of [-.85, .85]) { mesh(new THREE.BoxGeometry(.07, .48, .5), iron, sx, .24, 0, g); mesh(new THREE.BoxGeometry(.07, .6, .07), iron, sx, .75, -.3, g); }
	return g;
}
/** fonte central: tanque, coluna, bacia. Água = material sem tinta própria, com anéis em cartões (cast) */
export function fountain(parent, x, z) {
	const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
	const stone = mat('stone', { map: plasterTex('#cfc2ad', 8) });
	mesh(new THREE.CylinderGeometry(3.2, 3.3, .7, 40, 1, true), stone, 0, .35, 0, g);
	mesh(new THREE.TorusGeometry(3.25, .16, 8, 48), stone, 0, .72, 0, g).rotation.x = Math.PI / 2;
	const water = new THREE.Mesh(new THREE.CircleGeometry(3.1, 40), mat('water', { color: '#3fb6c9' })); water.rotation.x = -Math.PI / 2; water.position.y = .55; water.receiveShadow = true; g.add(water);
	mesh(new THREE.CylinderGeometry(.35, .5, 2.2, 16), stone, 0, 1.1, 0, g);
	mesh(new THREE.CylinderGeometry(1.2, .4, .45, 24), stone, 0, 2.3, 0, g);
	mesh(new THREE.SphereGeometry(.3, 12, 8), solid('#e8c45a'), 0, 2.75, 0, g);
	return g;
}
export function cafeTable(parent, x, z, umbrella = ['#e2453c', '#fbf3df']) {
	const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
	const iron = solid('#2f3440');
	mesh(new THREE.CylinderGeometry(.55, .55, .06, 24), solid('#f1ece0'), 0, .76, 0, g);
	mesh(new THREE.CylinderGeometry(.05, .05, .76, 8), iron, 0, .38, 0, g);
	mesh(new THREE.CylinderGeometry(.3, .32, .04, 16), iron, 0, .02, 0, g);
	if (umbrella) {
		mesh(new THREE.CylinderGeometry(.04, .04, 2.6, 8), solid('#f1ece0'), 0, 1.6, 0, g);
		mesh(new THREE.ConeGeometry(1.7, .7, 8, 1, true), mat('umb|' + umbrella, { map: stripeTex(...umbrella), side: THREE.DoubleSide }), 0, 2.75, 0, g);
	}
	// xícaras
	for (const s of [-1, 1]) mesh(new THREE.CylinderGeometry(.07, .06, .1, 12), solid('#fbf8f1'), s * .22, .84, s * .08, g);
	return g;
}
export function flowerPot(parent, x, z, s = 1, flowers = '#e2453c') {
	const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); parent.add(g);
	mesh(new THREE.CylinderGeometry(.42, .3, .6, 16), solid('#c0673f'), 0, .3, 0, g);
	mesh(new THREE.TorusGeometry(.42, .06, 6, 20), solid('#a95634'), 0, .6, 0, g).rotation.x = Math.PI / 2;
	const fl = mat('fl|' + flowers, { map: ctex('flw|' + flowers, 128, 128, (c, w, h) => { const r = mulberry32(3); c.fillStyle = '#4f8a3c'; c.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { c.fillStyle = r() < .6 ? flowers : '#fff3b0'; c.beginPath(); c.arc(r() * w, r() * h, 5 + r() * 4, 0, 7); c.fill(); } }) });
	mesh(new THREE.IcosahedronGeometry(.55, 2), fl, 0, .9, 0, g).scale.y = .75;
	return g;
}

/** cria a cena base (céu, névoa, sol com sombra) */
export function createWorld() {
	const scene = new THREE.Scene();
	scene.fog = new THREE.Fog('#b8d0ec', 25, 300);
	const sky = makeSky(); scene.add(sky);
	const sun = new THREE.DirectionalLight('#ffffff', 1); sun.castShadow = true;
	sun.shadow.mapSize.set(4096, 4096); const sc = sun.shadow.camera; sc.left = -32; sc.right = 32; sc.top = 32; sc.bottom = -32; sc.near = 1; sc.far = 200;
	sun.shadow.radius = 2; scene.add(sun, sun.target);
	const root = new THREE.Group(); scene.add(root);
	return { scene, sky, sun, root, sunDir: new THREE.Vector3(0, 1, 0), clouds: [], glows: [], light: null };
}
/** nuvens: cartões macios bem longe (camada SOFT) */
export function addClouds(W, drawCloud, n = 9, seed = 4) {
	const r = mulberry32(seed);
	for (let i = 0; i < n; i++) {
		const cv = document.createElement('canvas'); cv.width = 600; cv.height = 300;
		drawCloud(cv.getContext('2d'), i);
		const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
		const m = new THREE.Mesh(new THREE.PlaneGeometry(1, .5), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, fog: false }));
		const a = r() * Math.PI * 2, d = 330 + r() * 120, s = 90 + r() * 80;
		m.position.set(Math.cos(a) * d, 70 + r() * 90, Math.sin(a) * d); m.scale.setScalar(s); m.lookAt(0, m.position.y * .6, 0);
		m.layers.set(SOFT); m.renderOrder = -5; W.scene.add(m); W.clouds.push(m);
		m.userData.drift = (r() - .5) * .02;
	}
}
export { mergeGeometries };
