// Verificação automática de uma animação antes do export.
// Uso: node tools/check.js demos/NN-nome [--step 0.5] [--from s] [--to s] [--port 5173]
// Requer o servidor rodando (node tools/serve.js).
//
// 1) TEXTO QUE VAZA: intercepta todo fillText/strokeText de canvas 2D e compara a caixa real do texto
//    (measureText) com o canvas e com o menor retângulo (fillRect/strokeRect/rect/roundRect) já desenhado
//    que contém o ponto de ancoragem: etiqueta, pasta, cartão, carimbo, post-it…
//    ERRO = passa da borda; AVISO = folga < 4% da largura da caixa.
// 2) SUPERFÍCIES COPLANARES (z-fighting → "fotos piscando"): a cada --step segundos chama __mg.renderAt(t)
//    e, se a página expõe __mg.current() → { scene }, procura pares de planos visíveis no mesmo plano
//    (mesma normal, distância < 2 mm em unidades de cena) que se sobrepõem e têm o mesmo renderOrder.
// Sai com código 1 se achar erro.
const puppeteer = require('puppeteer-core');
const fs = require('fs');

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const step = +opt('step', .5), port = opt('port', 5173), from = +opt('from', 0), to = opt('to');
const demo = (args[0] || '').replace(/\\/g, '/').replace(/\/$/, '');
if (!demo) { console.error('uso: node tools/check.js demos/NN-nome'); process.exit(2); }
const executablePath = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);

// roda dentro da página ANTES de qualquer script
function textGuard() {
	const issues = [];
	window.__mgTextIssues = issues;
	const P = CanvasRenderingContext2D.prototype;
	const RECTS = new WeakMap();
	const rects = g => { let r = RECTS.get(g); if (!r) RECTS.set(g, r = []); return r; };
	const tf = (g, x, y) => { const m = g.getTransform(); return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]; };
	const addRect = (g, x, y, w, h, st) => {
		if (Math.abs(w) < 4 || Math.abs(h) < 4) return;
		const c4 = [tf(g, x, y), tf(g, x + w, y), tf(g, x, y + h), tf(g, x + w, y + h)], xs = c4.map(p => p[0]), ys = c4.map(p => p[1]); // 4 cantos: caixa girada
		const q = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; q.st = st; rects(g).push(q);
	};
	for (const k of ['fillRect', 'strokeRect']) { const o = P[k]; P[k] = function (x, y, w, h) { addRect(this, x, y, w, h, String(k === 'fillRect' ? this.fillStyle : this.strokeStyle)); return o.apply(this, arguments); }; }
	// canvas redesenhado do zero a cada quadro (overlay 2D): clearRect da tela toda zera as caixas
	{ const o = P.clearRect; P.clearRect = function (x, y, w, h) { if (w * h >= this.canvas.width * this.canvas.height * .98) rects(this).length = 0; return o.apply(this, arguments); }; }
	for (const k of ['rect', 'roundRect']) { const o = P[k]; if (o) P[k] = function (x, y, w, h) { addRect(this, x, y, w, h); return o.apply(this, arguments); }; }
	// caminhos fechados (rrect com arcTo, polígonos de pasta) → caixa do caminho
	const oBegin = P.beginPath, oMove = P.moveTo, oLine = P.lineTo, oArcTo = P.arcTo, oFill = P.fill, oStroke = P.stroke;
	const PATH = new WeakMap();
	const pt = (g, x, y) => { const b = PATH.get(g); if (!b) return; const [a, c] = tf(g, x, y); b[0] = Math.min(b[0], a); b[1] = Math.min(b[1], c); b[2] = Math.max(b[2], a); b[3] = Math.max(b[3], c); b.n++; };
	P.beginPath = function () { const b = [1e9, 1e9, -1e9, -1e9]; b.n = 0; PATH.set(this, b); return oBegin.apply(this, arguments); };
	P.moveTo = function (x, y) { pt(this, x, y); return oMove.apply(this, arguments); };
	P.lineTo = function (x, y) { pt(this, x, y); return oLine.apply(this, arguments); };
	P.arcTo = function (x1, y1, x2, y2) { pt(this, x1, y1); pt(this, x2, y2); return oArcTo.apply(this, arguments); };
	const oArc = P.arc; P.arc = function (x, y, r) { pt(this, x - r, y - r); pt(this, x + r, y + r); pt(this, x - r, y + r); pt(this, x + r, y - r); return oArc.apply(this, arguments); };
	const closePath = (g, st) => { const b = PATH.get(g); if (b && b.n >= 4 && b[2] - b[0] > 8 && b[3] - b[1] > 8) { const q = [b[0], b[1], b[2], b[3]]; q.st = st; rects(g).push(q); } };
	P.fill = function () { closePath(this, String(this.fillStyle)); return oFill.apply(this, arguments); };
	P.stroke = function () { closePath(this, String(this.strokeStyle)); return oStroke.apply(this, arguments); };

	const check = (g, text, x, y, maxWidth) => {
		if (!text || !String(text).trim()) return;
		const m = g.measureText(text);
		let l = m.actualBoundingBoxLeft, r = m.actualBoundingBoxRight;
		if (maxWidth != null && m.width > maxWidth) { const k = maxWidth / m.width; l *= k; r *= k; }
		const [ax, ay] = tf(g, x, y), sx = Math.hypot(g.getTransform().a, g.getTransform().b), sy = Math.hypot(g.getTransform().c, g.getTransform().d);
		const box = [ax - l * sx, ay - m.actualBoundingBoxAscent * sy, ax + r * sx, ay + m.actualBoundingBoxDescent * sy];
		const cw = g.canvas.width, ch = g.canvas.height;
		const tb = g.canvas.__tb; g.canvas.__tb = tb ? [Math.min(tb[0], box[0]), Math.min(tb[1], box[1]), Math.max(tb[2], box[2]), Math.max(tb[3], box[3])] : box.slice(); (g.canvas.__txt = g.canvas.__txt || []).push(String(text));
		const inside = rects(g).filter(q => ax >= q[0] - 1 && ax <= q[2] + 1 && ay >= q[1] - 1 && ay <= q[3] + 1 && (q[2] - q[0]) * (q[3] - q[1]) < cw * ch * .98);
		inside.sort((a, b) => (a[2] - a[0]) * (a[3] - a[1]) - (b[2] - b[0]) * (b[3] - b[1]));
		const cont = inside[0] || [0, 0, cw, ch];
		let over = Math.max(cont[0] - box[0], box[2] - cont[2], cont[1] - box[1], box[3] - cont[3]);
		if (over > 1 && inside[0] && cont.st) {
			const same = rects(g).filter(q => q.st === cont.st), mxp = (box[0] + box[2]) / 2, myp = (box[1] + box[3]) / 2;
			const probe = [[box[0], box[1]], [box[2], box[1]], [box[0], box[3]], [box[2], box[3]], [mxp, box[1]], [mxp, box[3]], [box[0], myp], [box[2], myp]];
			if (probe.every(([x, y]) => same.some(q => x >= q[0] - 1 && x <= q[2] + 1 && y >= q[1] - 1 && y <= q[3] + 1))) return;   // cabe na forma composta
		}
		const marg = Math.min(box[0] - cont[0], cont[2] - box[2]);
		const where = inside[0] ? `caixa ${Math.round(cont[2] - cont[0])}×${Math.round(cont[3] - cont[1])}` : `canvas ${cw}×${ch}`;
		if (over > 1) issues.push({ level: 'ERRO', text: String(text), where, px: Math.round(over), font: g.font });
		else if (inside[0] && marg < (cont[2] - cont[0]) * .04) issues.push({ level: 'AVISO', text: String(text), where, px: Math.round(marg), font: g.font });
	};
	for (const k of ['fillText', 'strokeText']) { const o = P[k]; P[k] = function (text, x, y, mw) { try { check(this, text, x, y, mw); } catch (e) { } return o.apply(this, arguments); }; }
}

// roda na página: procura pares de planos coplanares que se sobrepõem de verdade (triângulo a triângulo)
function coplanar() {
	const cur = window.__mg.current && window.__mg.current();
	if (!cur || !cur.scene) return null;
	const out = [], items = [];
	cur.scene.updateMatrixWorld(true);
	let M = null; if (cur.camera) { const C = cur.camera; C.updateMatrixWorld(); M = C.projectionMatrix.clone().multiply(C.matrixWorldInverse).elements; }
	const onScreen = wv => { if (!M) return true; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, any = false;
		for (const p of wv) { const w = M[3] * p[0] + M[7] * p[1] + M[11] * p[2] + M[15]; if (w <= 1e-6) continue; any = true; const x = (M[0] * p[0] + M[4] * p[1] + M[8] * p[2] + M[12]) / w, y = (M[1] * p[0] + M[5] * p[1] + M[9] * p[2] + M[13]) / w; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
		return any && x1 > -1 && x0 < 1 && y1 > -1 && y0 < 1; };
	const vis = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
	const opac = mt => { const u = mt.uniforms; return u && u.uOpacity ? u.uOpacity.value : (mt.transparent ? mt.opacity : 1); };
	const nm = o => { const path = []; for (let p = o; p && path.length < 3; p = p.parent) if (p.name) path.unshift(p.name); const e = o.matrixWorld.elements;
		return (path.join('/') || o.geometry.type) + ` @(${e[12].toFixed(2)},${e[13].toFixed(2)},${e[14].toFixed(2)})`; };
	cur.scene.traverse(o => {
		if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || !vis(o)) return;
		const mt = Array.isArray(o.material) ? o.material[0] : o.material;
		if (!mt || mt.visible === false || mt.depthTest === false || opac(mt) < .02) return;
		const g = o.geometry, pos = g.attributes.position; if (!pos) return;
		if (!g.boundingBox) g.computeBoundingBox();
		const bb = g.boundingBox, sz = [bb.max.x - bb.min.x, bb.max.y - bb.min.y, bb.max.z - bb.min.z];
		const thin = sz.indexOf(Math.min(...sz)); if (sz[thin] > 1e-4) return;          // só superfícies planas
		const e = o.matrixWorld.elements;
		const n = [[e[0], e[1], e[2]], [e[4], e[5], e[6]], [e[8], e[9], e[10]]][thin], ln = Math.hypot(...n); if (!ln) return;
		const N = n.map(v => v / ln);
		const W = i => { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); return [e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]]; };
		const p0 = W(0), d = N[0] * p0[0] + N[1] * p0[1] + N[2] * p0[2];
		const idx = g.index ? Array.from(g.index.array) : Array.from({ length: pos.count }, (_, i) => i);
		const wv = Array.from({ length: pos.count }, (_, i) => W(i));
		if (!onScreen(wv)) return;                                                     // fora do quadro: não aparece no vídeo
		const mn = [bb.min.x, bb.min.y, bb.min.z], ax = [0, 1, 2].filter(i => i !== thin);
		const map = mt.map || (mt.uniforms && (mt.uniforms.map || mt.uniforms.tMap || mt.uniforms.uMap) || {}).value || null;
		const cv = map && map.image && map.image.getContext ? map.image : null;
		items.push({ o, mt, N, d, wv, idx, mn, sz, ax, cv, flipY: map ? map.flipY !== false : true, inv: o.matrixWorld.clone().invert().elements, plane: g.type === 'PlaneGeometry' });
	});
	// ponto do mundo cai na parte opaca do plano X? (lê o alfa da textura de canvas, se houver)
	const alphaCache = new Map();
	const opaqueAt = (X, p) => {
		const e = X.inv, l = [e[0] * p[0] + e[4] * p[1] + e[8] * p[2] + e[12], e[1] * p[0] + e[5] * p[1] + e[9] * p[2] + e[13], e[2] * p[0] + e[6] * p[1] + e[10] * p[2] + e[14]];
		const u = (l[X.ax[0]] - X.mn[X.ax[0]]) / X.sz[X.ax[0]], v = (l[X.ax[1]] - X.mn[X.ax[1]]) / X.sz[X.ax[1]];
		if (u < 0 || u > 1 || v < 0 || v > 1) return false;
		if (!X.cv || !X.plane) return true;
		let a = alphaCache.get(X.cv); if (a === undefined) { try { a = X.cv.getContext('2d').getImageData(0, 0, X.cv.width, X.cv.height); } catch (err) { a = null; } alphaCache.set(X.cv, a); }
		if (!a) return true;
		const x = Math.min(a.width - 1, Math.floor(u * a.width)), y = Math.min(a.height - 1, Math.floor((X.flipY ? 1 - v : v) * a.height));
		return a.data[(y * a.width + x) * 4 + 3] > 128;
	};
	const realOverlap = (A, B) => {   // amostra 24×24 pontos de A e conta onde A e B são opacos ao mesmo tempo
		if (!(A.cv && A.plane) && !(B.cv && B.plane)) return true;
		const e = A.o.matrixWorld.elements; let n = 0;
		for (let i = 0; i < 24; i++) for (let j = 0; j < 24; j++) {
			const l = [0, 0, 0]; l[A.ax[0]] = A.mn[A.ax[0]] + (i + .5) / 24 * A.sz[A.ax[0]]; l[A.ax[1]] = A.mn[A.ax[1]] + (j + .5) / 24 * A.sz[A.ax[1]]; l[3 - A.ax[0] - A.ax[1]] = A.mn[3 - A.ax[0] - A.ax[1]];
			const p = [e[0] * l[0] + e[4] * l[1] + e[8] * l[2] + e[12], e[1] * l[0] + e[5] * l[1] + e[9] * l[2] + e[13], e[2] * l[0] + e[6] * l[1] + e[10] * l[2] + e[14]];
			if (opaqueAt(A, p) && opaqueAt(B, p) && ++n >= 2) return true;
		}
		return false;
	};
	const sat = (A, B) => {   // dois triângulos 2D se sobrepõem (área > 0)?
		for (const T of [A, B]) for (let k = 0; k < 3; k++) {
			const p = T[k], q = T[(k + 1) % 3], ax = q[1] - p[1], ay = p[0] - q[0];
			let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9;
			for (const v of A) { const s = v[0] * ax + v[1] * ay; a0 = Math.min(a0, s); a1 = Math.max(a1, s); }
			for (const v of B) { const s = v[0] * ax + v[1] * ay; b0 = Math.min(b0, s); b1 = Math.max(b1, s); }
			if (a1 <= b0 || b1 <= a0) return false;
		}
		return true;
	};
	for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
		const A = items[i], B = items[j];
		if (A.o.renderOrder !== B.o.renderOrder) continue;
		if (A.mt.blending === 2 && B.mt.blending === 2) continue;                        // aditivo + aditivo: ordem não importa
		if ((A.mt.polygonOffset || B.mt.polygonOffset) && A.mt.polygonOffsetUnits !== B.mt.polygonOffsetUnits) continue;
		const dot = A.N[0] * B.N[0] + A.N[1] * B.N[1] + A.N[2] * B.N[2];
		if (Math.abs(dot) < .9995) continue;
		// distância mínima segura = precisão do depth buffer (24 bits) nessa profundidade, com folga ×8
		const cp = cur.camera ? cur.camera.getWorldPosition(new cur.camera.position.constructor()) : null, near = cur.camera?.near || .1;
		const dz = cp ? Math.abs(A.N[0] * cp.x + A.N[1] * cp.y + A.N[2] * cp.z - A.d) : 10;
		if (Math.abs(A.d - Math.sign(dot) * B.d) > Math.max(1e-4, 8 * dz * dz / (near * 16777216))) continue;
		const N = A.N, t = Math.abs(N[0]) < .9 ? [1, 0, 0] : [0, 1, 0];
		const U = [N[1] * t[2] - N[2] * t[1], N[2] * t[0] - N[0] * t[2], N[0] * t[1] - N[1] * t[0]], lu = Math.hypot(...U); U.forEach((v, k) => U[k] = v / lu);
		const V = [N[1] * U[2] - N[2] * U[1], N[2] * U[0] - N[0] * U[2], N[0] * U[1] - N[1] * U[0]];
		const tris = X => { const r = []; for (let k = 0; k + 2 < X.idx.length; k += 3) { const T = [0, 1, 2].map(m => { const p = X.wv[X.idx[k + m]]; return [p[0] * U[0] + p[1] * U[1] + p[2] * U[2], p[0] * V[0] + p[1] * V[1] + p[2] * V[2]]; });
			const cx = (T[0][0] + T[1][0] + T[2][0]) / 3, cy = (T[0][1] + T[1][1] + T[2][1]) / 3; const S = T.map(p => [cx + (p[0] - cx) * .97, cy + (p[1] - cy) * .97]);
			S.bb = [Math.min(S[0][0], S[1][0], S[2][0]), Math.min(S[0][1], S[1][1], S[2][1]), Math.max(S[0][0], S[1][0], S[2][0]), Math.max(S[0][1], S[1][1], S[2][1])]; r.push(S); } return r; };
		const ta = tris(A), tb = tris(B); if (ta.length * tb.length > 4e5) continue;
		let hit = false;
		for (const a of ta) { for (const b of tb) { if (a.bb[2] <= b.bb[0] || b.bb[2] <= a.bb[0] || a.bb[3] <= b.bb[1] || b.bb[3] <= a.bb[1]) continue; if (sat(a, b)) { hit = true; break; } } if (hit) break; }
		if (hit && realOverlap(A, B)) out.push({ key: A.o.uuid + B.o.uuid, desc: `${nm(A.o)}  ×  ${nm(B.o)}  (separação ${(Math.abs(A.d - Math.sign(dot) * B.d) * 1000).toFixed(2)} mm, câmera a ${dz.toFixed(1)})` });
	}
	return out;
}

// roda na página: texto 3D (mesh com textura que contém fillText) apoiado num papel/etiqueta/pasta:
// o retângulo do texto inteiro tem que estar sobre a parte opaca do papel de trás.
function paperFit() {
	const cur = window.__mg.current && window.__mg.current();
	if (!cur || !cur.scene) return null;
	const out = [], P = [];
	cur.scene.updateMatrixWorld(true);
	const C = cur.camera; if (!C) return null; C.updateMatrixWorld();
	const cp = C.getWorldPosition(new C.position.constructor());
	const vis = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
	const opac = mt => { const u = mt.uniforms; return u && u.uOpacity ? u.uOpacity.value : (mt.transparent ? mt.opacity : 1); };
	const mapOf = mt => mt.map || (mt.uniforms && (mt.uniforms.map || mt.uniforms.tMap || mt.uniforms.uMap) || {}).value || null;
	cur.scene.traverse(o => {
		if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || !vis(o)) return;
		const mt = Array.isArray(o.material) ? o.material[0] : o.material;
		if (!mt || mt.visible === false || opac(mt) < .05) return;
		const g = o.geometry; if (!g.attributes.position) return; if (!g.boundingBox) g.computeBoundingBox();
		const bb = g.boundingBox, mn = [bb.min.x, bb.min.y, bb.min.z], mx = [bb.max.x, bb.max.y, bb.max.z], sz = mx.map((v, i) => v - mn[i]);
		const thin = sz.indexOf(Math.min(...sz)); if (sz[thin] > 1e-4) return;
		const ax = [0, 1, 2].filter(i => i !== thin);
		const e = o.matrixWorld.elements, n = [[e[0], e[1], e[2]], [e[4], e[5], e[6]], [e[8], e[9], e[10]]][thin], ln = Math.hypot(...n); if (!ln) return;
		const N = n.map(v => v / ln), W = l => [e[0] * l[0] + e[4] * l[1] + e[8] * l[2] + e[12], e[1] * l[0] + e[5] * l[1] + e[9] * l[2] + e[13], e[2] * l[0] + e[6] * l[1] + e[10] * l[2] + e[14]];
		const o0 = W(mn), d = N[0] * o0[0] + N[1] * o0[1] + N[2] * o0[2];
		const map = mapOf(mt), cv = map && map.image && map.image.getContext ? map.image : null;
		P.push({ o, N, d, mn, mx, sz, ax, thin, W, cv, flipY: map ? map.flipY !== false : true, inv: o.matrixWorld.clone().invert().elements });
	});
	const local = (B, p) => { const e = B.inv; return [e[0] * p[0] + e[4] * p[1] + e[8] * p[2] + e[12], e[1] * p[0] + e[5] * p[1] + e[9] * p[2] + e[13], e[2] * p[0] + e[6] * p[1] + e[10] * p[2] + e[14]]; };
	const alphaCache = new Map();
	const on = (B, p) => {   // ponto (mundo) cai sobre a parte opaca de B?
		const l = local(B, p), u = (l[B.ax[0]] - B.mn[B.ax[0]]) / B.sz[B.ax[0]], v = (l[B.ax[1]] - B.mn[B.ax[1]]) / B.sz[B.ax[1]];
		if (u < 0 || u > 1 || v < 0 || v > 1) return false;
		if (!B.cv) return true;
		let a = alphaCache.get(B.cv); if (!a) { try { a = B.cv.getContext('2d').getImageData(0, 0, B.cv.width, B.cv.height); } catch (e) { a = null; } alphaCache.set(B.cv, a || 0); }
		if (!a) return true;
		const x = Math.min(a.width - 1, Math.floor(u * a.width)), y = Math.min(a.height - 1, Math.floor((B.flipY ? 1 - v : v) * a.height));
		return a.data[(y * a.width + x) * 4 + 3] > 128;
	};
	for (const T of P) {
		const tb = T.cv && T.cv.__tb; if (!tb) continue;
		const cw = T.cv.width, ch = T.cv.height;
		const toW = (px, py) => { const u = px / cw, v = T.flipY ? 1 - py / ch : py / ch; const l = [0, 0, 0]; l[T.thin] = T.mn[T.thin]; l[T.ax[0]] = T.mn[T.ax[0]] + u * T.sz[T.ax[0]]; l[T.ax[1]] = T.mn[T.ax[1]] + v * T.sz[T.ax[1]]; return T.W(l); };
		const x0 = Math.max(0, tb[0]), y0 = Math.max(0, tb[1]), x1 = Math.min(cw, tb[2]), y1 = Math.min(ch, tb[3]);
		// texto impresso no próprio papel (fundo opaco na mesma textura): já coberto pela checagem 2D
		{ let im = alphaCache.get(T.cv); if (im === undefined) { try { im = T.cv.getContext('2d').getImageData(0, 0, cw, ch); } catch (err) { im = null; } alphaCache.set(T.cv, im); }
		  const own = im && [[x0, y0], [x1 - 1, y0], [x0, y1 - 1], [x1 - 1, y1 - 1]].every(([x, y]) => im.data[(Math.floor(y) * cw + Math.floor(x)) * 4 + 3] > 200);
		  if (own) continue; }
		const pts = [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [(x0 + x1) / 2, y0], [(x0 + x1) / 2, y1], [x0, (y0 + y1) / 2], [x1, (y0 + y1) / 2]].map(q => toW(...q));
		const ctr = toW((x0 + x1) / 2, (y0 + y1) / 2), hW = Math.hypot(...pts[3].map((v, i) => v - pts[0][i]));
		const side = Math.sign(T.N[0] * cp.x + T.N[1] * cp.y + T.N[2] * cp.z - T.d) || 1;
		let best = null, bd = 1e9;
		for (const B of P) {
			if (B === T) continue;
			const dot = T.N[0] * B.N[0] + T.N[1] * B.N[1] + T.N[2] * B.N[2]; if (Math.abs(dot) < .995) continue;
			const gap = side * (T.N[0] * ctr[0] + T.N[1] * ctr[1] + T.N[2] * ctr[2] - (T.N[0] * B.W(B.mn)[0] + T.N[1] * B.W(B.mn)[1] + T.N[2] * B.W(B.mn)[2]));
			if (gap < -1e-4 || gap > Math.max(.02, hW * .8)) continue;      // papel logo atrás do texto
			if (!on(B, ctr)) continue;
			if (B.cv && B.cv.__tb && B.cv.__txt && B.sz[B.ax[0]] * B.sz[B.ax[1]] < 1e-9) continue;
			if (gap < bd) { bd = gap; best = B; }
		}
		if (!best) continue;
		const off = pts.filter(p => !on(best, p)).length;
		if (off) {
			const e = T.o.matrixWorld.elements;
			out.push({ key: T.o.uuid + best.o.uuid, desc: `"${T.cv.__txt.join(' ').slice(0, 40)}" sai do papel de trás (${off}/8 pontos da borda do texto fora) @(${e[12].toFixed(2)},${e[13].toFixed(2)},${e[14].toFixed(2)})` });
		}
	}
	return out;
}

(async () => {
	const browser = await puppeteer.launch({ executablePath, headless: 'new', args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'], defaultViewport: { width: 1280, height: 720 } });
	const page = await browser.newPage();
	page.on('pageerror', e => console.error('[página]', e.message));
	await page.evaluateOnNewDocument(textGuard);
	await page.goto(`http://localhost:${port}/${demo}/?export`, { waitUntil: 'domcontentloaded', timeout: 0 });
	await page.waitForFunction('window.__mg && window.__mg.loaded', { timeout: 600000 });
	const dur = await page.evaluate('window.__mg.duration');
	let errors = 0;

	// texto (todas as texturas já foram criadas no init; renderiza alguns tempos para pegar as criadas depois)
	for (let t = 0; t < dur; t += Math.max(step, 2)) await page.evaluate(t => window.__mg.renderAt(t), t);
	const tx = await page.evaluate(() => window.__mgTextIssues);
	const uniq = new Map(); for (const i of tx) uniq.set(i.level + i.text + i.where, i);
	console.log(`\n── TEXTO (${uniq.size} problema(s)) ──`);
	for (const i of uniq.values()) { console.log(`${i.level.padEnd(5)} "${i.text}" — ${i.level === 'ERRO' ? `vaza ${i.px}px da` : `folga de ${i.px}px na`} ${i.where}  [${i.font}]`); if (i.level === 'ERRO') errors++; }

	// coplanares
	const has = await page.evaluate(() => typeof (window.__mg.current) === 'function');
	if (!has) console.log('\n── COPLANARES: pulado (a página não expõe __mg.current() → { scene }) ──');
	else {
		const seen = new Map();
		await page.evaluate((a, b) => { window.__mgCoplanar = new Function('return ' + a)(); window.__mgPaper = new Function('return ' + b)(); }, coplanar.toString(), paperFit.toString());
		const paper = new Map();
		for (let t = from; t < (to ? +to : dur); t += step) {
			const [r, q] = await page.evaluate(t => { window.__mg.renderAt(t); return [window.__mgCoplanar(), window.__mgPaper()]; }, t);
			for (const p of q || []) { const s = paper.get(p.key); if (s) s[1] = t; else paper.set(p.key, [t, t, p.desc]); }
			for (const p of r || []) { const s = seen.get(p.key); if (s) s[1] = t; else seen.set(p.key, [t, t, p.desc]); }
		}
		console.log(`
── TEXTO 3D SOBRE PAPEL (${paper.size} problema(s)) ──`);
		for (const [, [a, b, p]] of paper) { console.log(`ERRO  ${a.toFixed(1)}–${b.toFixed(1)} s  ${p}`); errors++; }
		console.log(`\n── COPLANARES / Z-FIGHTING (${seen.size} par(es)) ──`);
		for (const [, [a, b, p]] of seen) { console.log(`ERRO  ${a.toFixed(1)}–${b.toFixed(1)} s  ${p}`); errors++; }
	}
	await browser.close();
	console.log(errors ? `\n✗ ${errors} erro(s) — corrigir antes de exportar.` : '\n✓ nenhum erro.');
	process.exit(errors ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
