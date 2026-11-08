// 14 — cenários: H (garagem de casa), R (estrada reta com props que rolam), C (consultório da Dra. Lúcia) + carro conversível.
import * as THREE from 'three';
import { ctex, mat, solid, mesh, house, signBoard, tree, grassTex, woodTex, flowerPot, INKC } from '../_sticker/world.js';
import { mulberry32 } from '../_sticker/anim.js';

export const SET = { H: [0, 0], R: [500, 0], C: [-300, 0] };
export const SPEED = 10, DASH = 6;                       // m/s, passo da faixa
const rep = (t, x, y) => { const c = t.clone(); c.repeat.set(x, y); c.needsUpdate = true; return c; };
const grn = (g, o) => { g.rotation.x = -Math.PI / 2; g.castShadow = false; return g; };

const roadTex = () => ctex('road14', 256, 256, (g, W, H) => {
	g.fillStyle = '#4b4a58'; g.fillRect(0, 0, W, H);
	const r = mulberry32(5); for (let i = 0; i < 260; i++) { g.fillStyle = r() < .5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.08)'; g.fillRect(r() * W, r() * H, 3 + r() * 6, 2 + r() * 4); }
	g.fillStyle = '#f4efe2'; g.fillRect(12, 0, 9, H); g.fillRect(W - 21, 0, 9, H);
});
const wallClinic = () => ctex('w|clinic', 1024, 512, (g, W, H) => {
	g.fillStyle = '#5aa39a'; g.fillRect(0, 0, W, H);
	g.fillStyle = '#3e7f78'; g.fillRect(0, H * .72, W, H * .28); g.fillStyle = '#f0dcc0'; g.fillRect(0, H * .715, W, 9);
	const r = mulberry32(7); for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,255,255,.05)'; g.beginPath(); g.arc(r() * W, r() * H * .7, 8 + r() * 14, 0, 7); g.fill(); }
	const wx = W * .3, ww = W * .26; // janela com pôr do sol
	const gr = g.createLinearGradient(0, H * .12, 0, H * .58); gr.addColorStop(0, '#6b8fd8'); gr.addColorStop(.7, '#ffb36b'); gr.addColorStop(1, '#ff8a5c');
	g.fillStyle = gr; g.fillRect(wx, H * .12, ww, H * .46); g.strokeStyle = '#f0dcc0'; g.lineWidth = 12; g.strokeRect(wx, H * .12, ww, H * .46);
	g.beginPath(); g.moveTo(wx + ww / 2, H * .12); g.lineTo(wx + ww / 2, H * .58); g.moveTo(wx, H * .35); g.lineTo(wx + ww, H * .35); g.stroke();
	g.strokeStyle = INKC; g.lineWidth = 3; g.strokeRect(wx - 7, H * .12 - 7, ww + 14, H * .46 + 14);
	g.fillStyle = '#fbf3df'; g.fillRect(W * .72, H * .2, W * .13, H * .26); g.strokeStyle = '#8a5a34'; g.lineWidth = 9; g.strokeRect(W * .72, H * .2, W * .13, H * .26); // diploma
	g.fillStyle = '#9a8c80'; for (let k = 0; k < 4; k++) g.fillRect(W * .74, H * .25 + k * 22, W * .09, 6);
});
const spiralTex = () => ctex('spiral14', 512, 512, (g, W, H) => {
	g.fillStyle = '#f4e3b8'; g.fillRect(0, 0, W, H); g.translate(W / 2, H / 2); g.strokeStyle = '#b5533c'; g.lineWidth = 26; g.lineCap = 'round'; g.beginPath();
	for (let a = 0; a < 6.28 * 5; a += .08) { const rr = 10 + a * 8.6; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.stroke();
});

function buildCar(parent) {
	const g = new THREE.Group(); parent.add(g);
	const red = solid('#e2453c'), dark = solid('#2a2230'), cream = solid('#f4ecd8'), gold = solid('#ffd23f'), blk = solid('#241726');
	mesh(new THREE.BoxGeometry(1.7, .5, 3.7), red, 0, .6, 0, g);
	mesh(new THREE.BoxGeometry(1.6, .26, 1.3), red, 0, .88, 1.25, g);        // capô
	mesh(new THREE.BoxGeometry(1.6, .34, 1.0), red, 0, .96, -1.3, g);        // porta-malas
	mesh(new THREE.BoxGeometry(1.5, .12, 3.2), cream, 0, .86, -.1, g);       // friso
	for (const x of [-.4, .4]) { mesh(new THREE.BoxGeometry(.62, .18, .62), dark, x, .9, -.45, g); mesh(new THREE.BoxGeometry(.62, .62, .14), dark, x, 1.15, -.78, g); }
	for (const x of [-.78, .78]) mesh(new THREE.BoxGeometry(.06, .5, .06), cream, x, 1.1, .55, g).rotation.x = -.35; // moldura do para-brisa
	mesh(new THREE.BoxGeometry(1.58, .06, .08), cream, 0, 1.31, .38, g);
	for (const x of [-.55, .55]) { const h = mesh(new THREE.CylinderGeometry(.11, .11, .1, 14), gold, x, .88, 1.9, g); h.rotation.x = Math.PI / 2; }
	mesh(new THREE.BoxGeometry(1.5, .14, .12), cream, 0, .5, 1.92, g);
	const wheels = [];
	for (const [x, z] of [[-.9, 1.2], [.9, 1.2], [-.9, -1.2], [.9, -1.2]]) {
		const w = new THREE.Group(); w.position.set(x, .38, z); g.add(w);
		const c = mesh(new THREE.CylinderGeometry(.38, .38, .24, 16), blk, 0, 0, 0, w); c.rotation.z = Math.PI / 2;
		const hub = mesh(new THREE.CylinderGeometry(.17, .17, .27, 12), gold, 0, 0, 0, w); hub.rotation.z = Math.PI / 2;
		mesh(new THREE.BoxGeometry(.28, .52, .07), cream, 0, 0, 0, w);
		wheels.push(w);
	}
	// volante (gira sozinho no piloto automático)
	const wheel = new THREE.Group(); wheel.position.set(.4, 1.12, .3); wheel.rotation.x = -.95; g.add(wheel);
	const ring = mesh(new THREE.TorusGeometry(.2, .035, 8, 20), blk, 0, 0, 0, wheel);
	mesh(new THREE.BoxGeometry(.38, .04, .04), blk, 0, 0, 0, wheel);
	return { g, wheels, wheel, ring };
}

export function buildSets(Wd) {
	const root = Wd.root, out = {};
	out.car = buildCar(root);

	// ── H: garagem ──
	{
		const [x, z] = SET.H;
		const gnd = mesh(new THREE.PlaneGeometry(160, 160), mat('gram14', { map: rep(grassTex(), 40, 40) }), x, 0, z, root); grn(gnd);
		const dw = mesh(new THREE.PlaneGeometry(6, 12.4), mat('drive14', { color: '#c9c3b6' }), x, .02, z - 1.8, root); grn(dw);
		const st = mesh(new THREE.PlaneGeometry(160, 5.5), mat('street14', { color: '#4b4a58' }), x, .03, z + 6.7, root); grn(st);
		for (let i = -6; i < 7; i++) { const d = mesh(new THREE.BoxGeometry(2.2, .02, .2), solid('#ffd23f'), x + i * 5, .05, z + 6.7, root); d.castShadow = false; }
		house(root, x, z - 11, 0, { w: 11, d: 6, h: 6.5, col: '#f0d9a8', roof: '#b5533c', floors: 2, cols: 4, door: 1, shutter: '#3f7fd0', seed: 21 });
		mesh(new THREE.BoxGeometry(2.2, .12, 1.6), solid('#a89c88'), x, .06, z - 7.7, root);  // degrau da porta
		tree(root, x - 9, z - 7, 1.05, 4); tree(root, x + 10, z - 8, .95, 6);
		flowerPot(root, x - 2.2, z - 7.9, 1, '#ffd23f'); flowerPot(root, x + 2.4, z - 7.9, 1, '#e2453c');
	}

	// ── R: estrada ──
	{
		const [x, z] = SET.R;
		mesh(new THREE.PlaneGeometry(400, 520), mat('gram14r', { map: rep(grassTex(), 100, 130) }), x, 0, z - 120, root).castShadow = false;
		root.children[root.children.length - 1].rotation.x = -Math.PI / 2;
		const rd = mesh(new THREE.PlaneGeometry(9, 520), mat('road14m', { map: rep(roadTex(), 1, 130) }), x, .02, z - 120, root); grn(rd);
		out.dashes = []; for (let i = 0; i < 40; i++) { const d = mesh(new THREE.BoxGeometry(.2, .02, 2.6), solid('#ffd23f'), x, .05, z, root); d.castShadow = false; out.dashes.push(d); }
		out.props = [];
		const add = (obj, z0, L) => { out.props.push({ obj, z0, L }); };
		for (let i = 0; i < 8; i++) { // postes
			const g = new THREE.Group(); root.add(g);
			mesh(new THREE.CylinderGeometry(.1, .13, 6.5, 8), solid('#7a5236'), 0, 3.25, 0, g); mesh(new THREE.BoxGeometry(2.4, .14, .14), solid('#7a5236'), 0, 6.1, 0, g);
			for (const sx of [-1, 0, 1]) mesh(new THREE.CylinderGeometry(.06, .06, .2, 6), solid('#cfe8e0'), sx * .9, 6.3, 0, g);
			add(g, i * 9, 72); g.userData.x = 6.4;
		}
		for (let i = 0; i < 6; i++) { const g = new THREE.Group(); root.add(g); tree(g, 0, 0, 1 + (i % 3) * .12, 30 + i); add(g, i * 14, 84); g.userData.x = -(8 + (i % 3) * 2.5); }
		for (let i = 0; i < 4; i++) { const g = new THREE.Group(); root.add(g); tree(g, 0, 0, .95 + (i % 2) * .15, 50 + i); add(g, 7 + i * 21, 84); g.userData.x = 9 + (i % 2) * 3; }
		const BB = [['SORVETE', '#e2453c'], ['FRUTAS', '#3f8f4a'], ['PROMOÇÃO', '#3f6fd0']];
		BB.forEach(([tx, bg], i) => {
			const g = new THREE.Group(); root.add(g);
			for (const sx of [-1.6, 1.6]) mesh(new THREE.CylinderGeometry(.09, .09, 3.2, 8), solid('#6b6672'), sx, 1.6, -.1, g);
			signBoard(g, tx, 0, 3.7, 0, 0, 4.6, 2.2, bg, '#fff3d6');
			add(g, i * 24 + 6, 72); g.userData.x = i % 2 ? 7.8 : -7.8;
		});
		// colinas ao fundo
		for (let i = 0; i < 7; i++) { const h = mesh(new THREE.SphereGeometry(40 + (i % 3) * 14, 20, 10), solid(['#6fa05a', '#5b8f4f', '#7fb064'][i % 3]), x - 150 + i * 50, 0, z - 270 - (i % 2) * 40, root); h.scale.y = .5; h.castShadow = false; }
		out.scroll = (t) => {
			const o = ((-SPEED * t) % DASH + DASH) % DASH; // o carro vai para +z, então o cenário recua para -z
			out.dashes.forEach((d, i) => { d.position.z = z - 200 + i * DASH + o; d.position.x = x; });
			for (const p of out.props) p.obj.position.set(x + p.obj.userData.x, 0, z - p.L * .78 + ((((p.z0 - SPEED * t) % p.L) + p.L) % p.L));
		};
	}

	// ── C: consultório ──
	{
		const [x, z] = SET.C, w = 18, d = 18, h = 10;
		const g = new THREE.Group(); g.position.set(x, 0, z); root.add(g);
		const fl = mesh(new THREE.PlaneGeometry(w, d), mat('fl14', { map: rep(woodTex('#b98a5a'), 5, 5) }), 0, .005, 0, g); grn(fl);
		const wm = mat('wall14', { map: wallClinic() });
		for (const [wx, wz, ry, len] of [[0, -d / 2, 0, w], [0, d / 2, Math.PI, w], [-w / 2, 0, Math.PI / 2, d], [w / 2, 0, -Math.PI / 2, d]]) {
			const m = mesh(new THREE.BoxGeometry(len, h, .3), wm, wx, h / 2, wz, g); m.rotation.y = ry;
			const b = mesh(new THREE.BoxGeometry(len, .25, .42), solid('#3a2a24'), wx, .125, wz, g); b.rotation.y = ry;
		}
		// tapete espiral
		const rug = mesh(new THREE.CylinderGeometry(2.3, 2.3, .03, 40), [solid('#b5533c'), mat('spiral14m', { map: spiralTex() }), solid('#b5533c')], 4.2, .02, -.3, g); rug.castShadow = false;
		// poltrona do paciente
		const mus = solid('#d9a441'), mus2 = solid('#b98a2e');
		mesh(new THREE.BoxGeometry(1.7, .45, 1.5), mus, 4.2, .42, -2.4, g); mesh(new THREE.BoxGeometry(1.7, 1.5, .35), mus, 4.2, 1.1, -3.05, g);
		for (const sx of [-.95, .95]) mesh(new THREE.BoxGeometry(.28, .85, 1.5), mus2, 4.2 + sx, .62, -2.4, g);
		mesh(new THREE.BoxGeometry(1.4, .1, 1.1), solid('#e8c06a'), 4.2, .72, -2.25, g);
		// pedestal do cérebro
		mesh(new THREE.CylinderGeometry(.55, .62, 1.1, 20), solid('#efe4cc'), -1, .55, -1.5, g); mesh(new THREE.CylinderGeometry(.68, .68, .08, 20), solid('#c9952e'), -1, 1.14, -1.5, g);
		// estante
		const sh = new THREE.Group(); sh.position.set(-5.2, 0, -8.5); g.add(sh);
		mesh(new THREE.BoxGeometry(5, 3.4, .5), mat('shelf14', { map: woodTex('#8a5a34') }), 0, 1.7, 0, sh);
		const r = mulberry32(11); for (let row = 0; row < 3; row++) { let bx = -2.3; while (bx < 2.2) { const bw = .15 + r() * .12; mesh(new THREE.BoxGeometry(bw, .75, .3), solid(['#e2453c', '#3f6fd0', '#ffd23f', '#3f8f4a', '#9b6fd6', '#f4ecd8'][Math.floor(r() * 6)]), bx + bw / 2, .72 + row * 1.0, .2, sh); bx += bw + .02; } }
		flowerPot(g, -8, -6, 1.4, '#ff8a5c'); flowerPot(g, 8, -6.5, 1.2, '#ffd23f');
	}
	return out;
}
