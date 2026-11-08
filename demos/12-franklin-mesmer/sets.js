// 12 — cenários (Paris 1784 + 1841): Versalhes, salão do Mesmer, rua de Paris, pomar do Franklin em Passy, consultório do Braid.
// Todos no estilo Sticker (twoTone + tinta). Cada cenário em um canto do mundo; o plano escolhe a câmera.
import * as THREE from 'three';
import { ctex, mat, solid, mesh, house, signBoard, cobbleTex, grassTex, plasterTex, woodTex, INKC } from '../_sticker/world.js';
import { mulberry32 } from '../_sticker/anim.js';

export const SET = { V: [-300, 0], M: [0, 0], RUA: [80, 0], G: [300, 0], B: [-150, 300] };
const shadeHex = (c, k) => '#' + new THREE.Color(c).multiplyScalar(k).getHexString();

// ───── paredes pintadas ─────
const wallVersailles = () => ctex('w|ver', 1024, 512, (g, W, H) => {
	g.fillStyle = '#f1e3c4'; g.fillRect(0, 0, W, H);
	g.fillStyle = '#e6d2a8'; g.fillRect(0, H * .78, W, H * .22);
	for (let i = 0; i < 5; i++) {
		const x = 30 + i * W / 5, w = W / 5 - 60;
		g.strokeStyle = '#c9952e'; g.lineWidth = 10; g.strokeRect(x, 50, w, H * .62);
		g.strokeStyle = '#f7e7a8'; g.lineWidth = 3; g.strokeRect(x + 12, 62, w - 24, H * .62 - 24);
		g.strokeStyle = INKC; g.lineWidth = 2.5; g.strokeRect(x - 5, 45, w + 10, H * .62 + 10);
		g.strokeStyle = '#c9952e'; g.lineWidth = 6; g.strokeRect(x, H * .81, w, H * .14);
		g.fillStyle = '#d4b46a'; g.fillRect(x - 26, 0, 14, H); // pilastra
	}
	g.fillStyle = '#c9952e'; g.fillRect(0, 0, W, 22); g.fillRect(0, H * .76, W, 10);
});
const wallSalon = () => ctex('w|salon', 1024, 512, (g, W, H) => {
	g.fillStyle = '#7d5aa8'; g.fillRect(0, 0, W, H);
	const r = mulberry32(3);
	for (let y = 30; y < H * .75; y += 64) for (let x = (y / 64 % 2) * 40; x < W; x += 80) { // damasco
		g.fillStyle = '#6c4b96'; g.beginPath(); g.ellipse(x, y, 14, 22, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(x - 14, y + 10, 8, 12, -.6, 0, 7); g.ellipse(x + 14, y + 10, 8, 12, .6, 0, 7); g.fill();
	}
	g.fillStyle = '#4a2f6a'; g.fillRect(0, H * .76, W, H * .24);
	g.fillStyle = '#d4a94a'; g.fillRect(0, H * .75, W, 9); g.fillRect(0, 0, W, 16);
	for (let i = 0; i < 6; i++) { g.strokeStyle = '#3a2456'; g.lineWidth = 3; g.strokeRect(20 + i * W / 6, H * .8, W / 6 - 40, H * .15); }
	void r;
});
const wallStudy = () => ctex('w|study', 1024, 512, (g, W, H) => {
	g.fillStyle = '#3f6b55'; g.fillRect(0, 0, W, H);
	const r = mulberry32(9);
	for (let s = 0; s < 2; s++) { // estantes
		const x0 = s ? W * .62 : W * .05, w = W * .32;
		g.fillStyle = '#6b4a30'; g.fillRect(x0, H * .08, w, H * .86);
		for (let k = 0; k < 5; k++) {
			const y = H * .12 + k * H * .17; let x = x0 + 10;
			while (x < x0 + w - 20) { const bw = 12 + r() * 14, bh = H * .13 * (.75 + r() * .25); g.fillStyle = ['#a8483a', '#3f6fb5', '#d9a441', '#4f8a3c', '#7b5ac9', '#e8dcc0'][Math.floor(r() * 6)]; g.fillRect(x, y + H * .14 - bh, bw, bh); g.strokeStyle = INKC; g.lineWidth = 2; g.strokeRect(x, y + H * .14 - bh, bw, bh); x += bw + 2; }
			g.fillStyle = '#4a3020'; g.fillRect(x0, y + H * .14, w, 8);
		}
		g.strokeStyle = INKC; g.lineWidth = 4; g.strokeRect(x0, H * .08, w, H * .86);
	}
	// janela dourada no meio
	const wx = W * .4, ww = W * .2; const gr = g.createLinearGradient(0, H * .15, 0, H * .7); gr.addColorStop(0, '#ffd08a'); gr.addColorStop(1, '#f2a05e');
	g.fillStyle = gr; g.fillRect(wx, H * .15, ww, H * .55); g.strokeStyle = '#e8dcc0'; g.lineWidth = 10; g.strokeRect(wx, H * .15, ww, H * .55);
	g.beginPath(); g.moveTo(wx + ww / 2, H * .15); g.lineTo(wx + ww / 2, H * .7); g.moveTo(wx, H * .42); g.lineTo(wx + ww, H * .42); g.stroke();
	g.strokeStyle = INKC; g.lineWidth = 3; g.strokeRect(wx - 6, H * .15 - 6, ww + 12, H * .55 + 12);
});
const checker = () => ctex('fl|checker', 512, 512, (g, W, H) => { const n = 8; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { g.fillStyle = (x + y) % 2 ? '#3b3442' : '#efe6d4'; g.fillRect(x * W / n, y * H / n, W / n, H / n); } g.strokeStyle = 'rgba(40,30,40,.35)'; g.lineWidth = 2; for (let k = 0; k <= n; k++) { g.beginPath(); g.moveTo(k * W / n, 0); g.lineTo(k * W / n, H); g.moveTo(0, k * H / n); g.lineTo(W, k * H / n); g.stroke(); } });
const parquet = () => ctex('fl|parquet', 512, 512, (g, W, H) => { const r = mulberry32(4); for (let y = 0; y < 16; y++) for (let x = 0; x < 8; x++) { g.fillStyle = shadeHex('#9a6a42', .85 + r() * .25); const xx = x * 64 + (y % 2) * 32, yy = y * 32; g.fillRect(xx, yy, 64, 32); g.strokeStyle = '#5a3b26'; g.lineWidth = 2; g.strokeRect(xx, yy, 64, 32); } });
const rep = (t, x, y) => { const c = t.clone(); c.repeat.set(x, y); c.needsUpdate = true; return c; };

/** sala: chão + 4 paredes (caixas) */
function room(parent, cx, cz, w, d, h, wallTex, floorTex, floorRep) {
	const g = new THREE.Group(); g.position.set(cx, 0, cz); parent.add(g);
	const fl = mesh(new THREE.PlaneGeometry(w, d), mat('fl|' + cx, { map: rep(floorTex, floorRep, floorRep * d / w) }), 0, .005, 0, g); fl.rotation.x = -Math.PI / 2; fl.castShadow = false;
	const wm = mat('wall|' + cx, { map: wallTex });
	for (const [x, z, ry, len] of [[0, -d / 2, 0, w], [0, d / 2, Math.PI, w], [-w / 2, 0, Math.PI / 2, d], [w / 2, 0, -Math.PI / 2, d]]) {
		const m = mesh(new THREE.BoxGeometry(len, h, .3), wm, x, h / 2, z, g); m.rotation.y = ry;
		const base = mesh(new THREE.BoxGeometry(len, .25, .42), solid('#3a2a24'), x, .125, z, g); base.rotation.y = ry;
	}
	return g;
}
function candleFlame(parent, x, y, z, glows) {
	mesh(new THREE.CylinderGeometry(.04, .04, .22, 8), solid('#fbf6ea'), x, y + .11, z, parent);
	const f = new THREE.Mesh(new THREE.ConeGeometry(.045, .13, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffb84a').multiplyScalar(3) }));
	f.position.set(x, y + .29, z); parent.add(f); glows.push(f); return f;
}
function chandelier(parent, x, y, z, glows) {
	const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
	const gold = solid('#d4a94a');
	mesh(new THREE.TorusGeometry(.7, .05, 8, 32), gold, 0, 0, 0, g).rotation.x = Math.PI / 2;
	mesh(new THREE.CylinderGeometry(.03, .03, 2, 6), gold, 0, 1, 0, g);
	mesh(new THREE.SphereGeometry(.16, 12, 8), gold, 0, 0, 0, g);
	for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; candleFlame(g, Math.cos(a) * .7, .03, Math.sin(a) * .7, glows); }
	return g;
}
/** cortina com dobras (plano ondulado) */
function curtain(parent, x, z, ry, w, h, col) {
	const geo = new THREE.PlaneGeometry(w, h, 24, 1), p = geo.attributes.position;
	for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) / w * Math.PI * 7) * .09);
	geo.computeVertexNormals();
	const m = mesh(geo, mat('cur|' + col, { color: col, side: THREE.DoubleSide }), x, h / 2, z, parent); m.rotation.y = ry; return m;
}
function fruitTree(parent, x, z, s, seed, fruit = '#f08a2c') {
	const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); parent.add(g);
	mesh(new THREE.CylinderGeometry(.16, .26, 2.2, 10), solid('#7a5236'), 0, 1.1, 0, g);
	const leaf = mat('fruitleaf|' + fruit, { map: ctex('fruitleaf|' + fruit, 256, 256, (c, w, h) => { const r = mulberry32(seed + 1); c.fillStyle = '#5aa04a'; c.fillRect(0, 0, w, h); for (let i = 0; i < 200; i++) { c.fillStyle = r() < .5 ? '#4b8c3d' : '#6cb458'; c.beginPath(); c.ellipse(r() * w, r() * h, 8, 5, r() * 3, 0, 7); c.fill(); } for (let i = 0; i < 26; i++) { const fx = r() * w, fy = r() * h; c.fillStyle = fruit; c.beginPath(); c.arc(fx, fy, 9, 0, 7); c.fill(); c.strokeStyle = INKC; c.lineWidth = 2.5; c.stroke(); } }) });
	const r = mulberry32(seed);
	for (const [bx, by, bz, br] of [[0, 2.9, 0, 1.35], [-.8, 2.5, .2, .95], [.8, 2.6, -.1, 1.0]]) mesh(new THREE.IcosahedronGeometry(br * (.9 + r() * .2), 3), leaf, bx, by, bz, g).scale.y = .85;
	return g;
}
/** plaquinha de número pintada presa no tronco */
function tag(parent, x, y, z, n) {
	const t = ctex('tag|' + n, 128, 128, (g, W, H) => { g.fillStyle = '#fbf3df'; g.fillRect(0, 0, W, H); g.strokeStyle = INKC; g.lineWidth = 10; g.strokeRect(5, 5, W - 10, H - 10); g.fillStyle = INKC; g.font = '900 86px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), W / 2, H / 2 + 6); });
	const b = mesh(new THREE.BoxGeometry(.42, .42, .04), solid('#6b4a30'), x, y, z, parent);
	const f = new THREE.Mesh(new THREE.PlaneGeometry(.38, .38), new THREE.MeshBasicMaterial({ map: t })); f.position.set(x, y, z + .025); parent.add(f);
	return b;
}

export function buildSets(W) {
	const root = W.root, glows = W.glows, out = {};
	// ── Versalhes ──
	{
		const [x, z] = SET.V, g = room(root, x, z, 14, 14, 10, wallVersailles(), checker(), 4);
		const red = solid('#b8323a'), gold = solid('#d4a94a');
		const rug = mesh(new THREE.BoxGeometry(2.4, .02, 12), red, x, .02, z, root); rug.castShadow = false;
		mesh(new THREE.BoxGeometry(3.4, .3, 2.4), gold, x, .15, z - 5.4, root);             // degrau
		mesh(new THREE.BoxGeometry(1.4, .5, 1.1), red, x, .55, z - 5.6, root);              // trono assento
		mesh(new THREE.BoxGeometry(1.5, 2.6, .25), red, x, 1.6, z - 6.1, root);             // encosto
		mesh(new THREE.BoxGeometry(1.7, .2, .35), gold, x, 2.95, z - 6.1, root);
		mesh(new THREE.SphereGeometry(.2, 12, 8), gold, x, 3.15, z - 6.1, root);
		for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(.18, .4, 1.1), gold, x + s * .75, .95, z - 5.6, root);
		chandelier(root, x, 5.2, z - 1, glows);
		for (const s of [-1, 1]) curtain(root, x + s * 6.6, z - 6.75, 0, 1.6, 6.6, '#b8323a');
		out.V = g;
	}
	// ── salão do Mesmer ──
	{
		const [x, z] = SET.M; room(root, x, z, 18, 18, 12, wallSalon(), parquet(), 4);
		for (const [cx, cz, ry] of [[-8.8, -3, Math.PI / 2], [-8.8, 3, Math.PI / 2], [8.8, -3, -Math.PI / 2], [8.8, 3, -Math.PI / 2], [-3, -8.8, 0], [3, -8.8, 0]]) curtain(root, x + cx, z + cz, ry, 1.8, 6.6, '#4a2f6a');
		chandelier(root, x, 5.0, z, glows); chandelier(root, x - 3, 5.2, z - 3.5, glows);
		// banheira magnética (baquet)
		const wood = mat('tub', { map: woodTex('#8a5a36') });
		mesh(new THREE.CylinderGeometry(1.25, 1.15, .85, 32), wood, x, .43, z, root);
		mesh(new THREE.CylinderGeometry(1.32, 1.32, .1, 32), solid('#5e3c26'), x, .9, z, root);
		const iron = solid('#3a3d47'); out.rods = [];
		for (let i = 0; i < 10; i++) {
			const a = i / 10 * Math.PI * 2, r = mesh(new THREE.CylinderGeometry(.025, .025, 1.1, 6), iron, x + Math.cos(a) * .9, 1.25, z + Math.sin(a) * .9, root);
			r.rotation.set(0, 0, 0); r.lookAt(x + Math.cos(a) * 3, 2.2, z + Math.sin(a) * 3); r.rotateX(Math.PI / 2); out.rods.push(r);
		}
		// pacientes em cadeiras + cordas do aro até as mãos
		out.seats = [];
		const rope = solid('#c9a46a');
		for (let i = 0; i < 7; i++) {
			const a = -Math.PI / 2 + (i - 3) * .62 + Math.PI, px = x + Math.cos(a) * 2.5, pz = z + Math.sin(a) * 2.5;
			mesh(new THREE.BoxGeometry(.5, .06, .5), solid('#6b3a2a'), px, .44, pz, root);
			for (const s of [[-.2, -.2], [.2, -.2], [-.2, .2], [.2, .2]]) mesh(new THREE.BoxGeometry(.05, .44, .05), solid('#4a2a1e'), px + s[0], .22, pz + s[1], root);
			out.seats.push([px, pz]);
			const p0 = new THREE.Vector3(x + Math.cos(a) * 1.3, .92, z + Math.sin(a) * 1.3), p2 = new THREE.Vector3(px - Math.cos(a) * .25, .95, pz - Math.sin(a) * .25);
			const mid = p0.clone().lerp(p2, .5); mid.y -= .25;
			mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(p0, mid, p2), 12, .025, 6), rope, 0, 0, 0, root);
		}
		// harmônica de vidro (mesa + eixo + taças)
		const hx = x + 4.2, hz = z - 5.6; out.arm = [hx, hz];
		mesh(new THREE.BoxGeometry(1.8, .5, .7), mat('armbox', { map: woodTex('#6b3a2a') }), hx, .85, hz, root);
		for (const s of [[-.8, -.28], [.8, -.28], [-.8, .28], [.8, .28]]) mesh(new THREE.BoxGeometry(.07, .6, .07), solid('#4a2a1e'), hx + s[0], .3, hz + s[1], root);
		const axle = new THREE.Group(); axle.position.set(hx, 1.22, hz); root.add(axle); out.axle = axle;
		mesh(new THREE.CylinderGeometry(.02, .02, 1.7, 6), iron, 0, 0, 0, axle).rotation.z = Math.PI / 2;
		for (let i = 0; i < 12; i++) { const r = .2 - i * .011; const c = mesh(new THREE.CylinderGeometry(r, r, .07, 24), solid(i % 3 === 0 ? '#e8c45a' : '#dfe9f5'), -.72 + i * .13, 0, 0, axle); c.rotation.z = Math.PI / 2; }
		candleFlame(root, hx - .7, 1.1, hz + .2, glows); candleFlame(root, hx + .7, 1.1, hz + .2, glows);
	}
	// ── rua de Paris (fila na porta do Mesmer) ──
	{
		const [x, z] = SET.RUA;
		const cob = rep(cobbleTex(), 14, 14);
		const gnd = mesh(new THREE.PlaneGeometry(40, 40), mat('rua', { map: cob }), x, .01, z, root); gnd.rotation.x = -Math.PI / 2; gnd.castShadow = false;
		let a = x - 18, i = 0;
		while (a < x + 18) { const w = 5.5 + (i % 3) * 1.1; house(root, a + w / 2, z - 7, 0, { w, d: 6, h: 8 + (i % 2) * 1.6, col: ['#e8c9a0', '#d9b48a', '#c9a6d9', '#f1dfb0'][i % 4], roof: ['#5a6070', '#4a5060', '#6a5a70'][i % 3], shutter: ['#3f6fb5', '#4f7f6a', '#8c3b4a'][i % 3], floors: 3, cols: 2, door: 0, seed: 60 + i }); a += w + .02; i++; }
		house(root, x + 1.2, z - 7.05, 0, { w: 6.6, d: 6.2, h: 9.6, col: '#b48ae0', roof: '#4a2f6a', shutter: '#4a2f6a', floors: 3, cols: 3, door: 1, seed: 77 });
		signBoard(root, 'MESMER', x + 1.2, 3.4, z - 3.85, 0, 3.2, .8, '#4a2f6a', '#f3e3ff');
	}
	// ── pomar do Franklin (Passy) ──
	{
		const [x, z] = SET.G;
		const gr = rep(grassTex(), 50, 50);
		const gnd = mesh(new THREE.PlaneGeometry(200, 200), mat('gram', { map: gr }), x, 0, z, root); gnd.rotation.x = -Math.PI / 2; gnd.castShadow = false;
		house(root, x - 2, z - 16, 0, { w: 12, d: 7, h: 9, col: '#f1e6d2', roof: '#5a6070', shutter: '#4f7f6a', floors: 3, cols: 5, door: 2, seed: 88 });
		const hedge = mat('hedge', { color: '#4b8c3d' });
		mesh(new THREE.BoxGeometry(40, 1.1, .8), hedge, x, .55, z - 10, root);
		out.trees = [];
		for (let i = 0; i < 4; i++) { const tx = x - 6 + i * 3.4; fruitTree(root, tx, z, 1, 10 + i); tag(root, tx, 1.25, z + .27, i + 1); out.trees.push([tx, z]); }
		out.tree5 = [x + 9.5, z - 5.5]; fruitTree(root, ...out.tree5, 1.05, 20);
		// mesa do relatório
		mesh(new THREE.BoxGeometry(1.4, .06, .8), solid('#a8744a'), x - 9, .78, z + 3, root);
		for (const s of [[-.6, -.32], [.6, -.32], [-.6, .32], [.6, .32]]) mesh(new THREE.BoxGeometry(.06, .78, .06), solid('#6b4a30'), x - 9 + s[0], .39, z + 3 + s[1], root);
	}
	// ── consultório do Braid (1841) ──
	{
		const [x, z] = SET.B; room(root, x, z, 12, 12, 6.5, wallStudy(), ctex('fl|boards', 256, 256, (g, w, h) => { const r = mulberry32(2); for (let i = 0; i < 8; i++) { g.fillStyle = shadeHex('#8a6040', .85 + r() * .25); g.fillRect(0, i * 32, w, 32); g.strokeStyle = '#4a3020'; g.lineWidth = 2; g.strokeRect(0, i * 32, w, 32); } }), 3);
		mesh(new THREE.BoxGeometry(1.8, .08, .9), solid('#6b3a2a'), x + 2.6, .8, z - 3.6, root);
		mesh(new THREE.BoxGeometry(1.7, .78, .8), mat('desk', { map: woodTex('#6b3a2a') }), x + 2.6, .39, z - 3.6, root);
		candleFlame(root, x + 2.2, .84, z - 3.5, glows);
		mesh(new THREE.BoxGeometry(.7, .08, .7), solid('#8c3b4a'), x - .4, .46, z - 1.2, root);    // poltrona do paciente
		mesh(new THREE.BoxGeometry(.7, .9, .12), solid('#8c3b4a'), x - .4, .9, z - 1.55, root);
		for (const s of [[-.3, -.3], [.3, -.3], [-.3, .3], [.3, .3]]) mesh(new THREE.BoxGeometry(.06, .46, .06), solid('#4a2a1e'), x - .4 + s[0], .23, z - 1.2 + s[1], root);
	}
	return out;
}
