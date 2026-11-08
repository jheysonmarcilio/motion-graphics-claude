// Bonecos de papel articulados (marionetes): pernas, tronco, cabeça, braços com pivô no ombro,
// olhos/boca/sobrancelhas trocáveis. Também os "bonequinhos" de multidão (um recorte só).
import * as THREE from 'three';
import { C, cut, rrect, circle, spiral } from './paper.js';

const HQ = 320; // px por unidade-u dos bonecos grandes

function hairBack(g, s) { if (s.hair === 'longo' || s.hair === 'franja') { g.fillStyle = s.hairColor; rrect(g, -.66, -.55, 1.32, s.hair === 'longo' ? 1.25 : .95, .5); g.fill(); } }
function hairFront(g, s) {
	const hc = s.hairColor; g.fillStyle = hc;
	const cap = (bottom = -.1) => { g.beginPath(); g.arc(0, .05, .6, Math.PI, 0); g.quadraticCurveTo(.45, bottom - .12, .25, bottom); g.quadraticCurveTo(0, bottom + .06, -.25, bottom - .02); g.quadraticCurveTo(-.5, bottom - .1, -.6, .05); g.fill(); };
	switch (s.hair) {
		case 'curto': cap(-.14); break;
		case 'coque': cap(-.12); circle(g, 0, -.64, .23, hc); break;
		case 'franja': cap(-.05); break;
		case 'longo': cap(-.12); break;
		case 'cacheado': for (let i = 0; i <= 9; i++) { const a = Math.PI * (1.02 + i * .096); circle(g, Math.cos(a) * .52, .02 + Math.sin(a) * .52, .17, hc); } circle(g, 0, -.42, .2, hc); break;
		case 'grisalho': for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * .5, -.04, .15, .24, sx * .3, 0, Math.PI * 2); g.fill(); }
			g.strokeStyle = hc; g.lineWidth = .05; for (const x of [-.18, 0, .16]) { g.beginPath(); g.moveTo(x - .1, -.42); g.quadraticCurveTo(x, -.6, x + .12, -.45); g.stroke(); } break;
		case 'careca': break;
	}
}
function drawHead(g, s) {
	hairBack(g, s);
	circle(g, -.56, .1, .11, s.skin); circle(g, .56, .1, .11, s.skin);
	circle(g, 0, .05, .55, s.skin);
	g.globalAlpha = .35; circle(g, -.3, .25, .09, '#FF8A8A'); circle(g, .3, .25, .09, '#FF8A8A'); g.globalAlpha = 1;
	hairFront(g, s);
}
const EYES = {
	dot: (g, x) => { g.fillStyle = C.tinta; g.beginPath(); g.ellipse(x, 0, .065, .085, 0, 0, Math.PI * 2); g.fill(); circle(g, x - .022, -.03, .022, '#fff'); },
	spiral: (g, x) => { circle(g, x, 0, .125, '#fff', C.tinta, .022); spiral(g, x, 0, .11, 2.6, .024, C.tinta); },
	closed: (g, x) => { g.strokeStyle = C.tinta; g.lineWidth = .035; g.beginPath(); g.arc(x, -.04, .08, .15 * Math.PI, .85 * Math.PI); g.stroke(); },
	happy: (g, x) => { g.strokeStyle = C.tinta; g.lineWidth = .035; g.beginPath(); g.arc(x, .05, .08, 1.15 * Math.PI, 1.85 * Math.PI); g.stroke(); },
	sleep: (g, x) => { g.strokeStyle = C.tinta; g.lineWidth = .035; g.beginPath(); g.moveTo(x - .08, .01); g.lineTo(x + .08, .01); g.stroke(); },
	wide: (g, x) => { circle(g, x, 0, .11, '#fff', C.tinta, .02); circle(g, x, .01, .05, C.tinta); },
	side: (g, x) => { g.fillStyle = C.tinta; g.beginPath(); g.ellipse(x + .03, -.01, .06, .08, 0, 0, Math.PI * 2); g.fill(); },
};
const MOUTH = {
	smile: g => { g.strokeStyle = C.tinta; g.lineWidth = .045; g.beginPath(); g.arc(0, -.08, .16, .18 * Math.PI, .82 * Math.PI); g.stroke(); },
	flat: g => { g.strokeStyle = C.tinta; g.lineWidth = .045; g.beginPath(); g.moveTo(-.11, 0); g.lineTo(.11, 0); g.stroke(); },
	o: g => { g.fillStyle = C.tinta; g.beginPath(); g.ellipse(0, 0, .07, .09, 0, 0, Math.PI * 2); g.fill(); },
	grin: g => { g.fillStyle = C.tinta; g.beginPath(); g.arc(0, -.05, .17, 0, Math.PI); g.closePath(); g.fill(); g.fillStyle = C.verm; g.beginPath(); g.arc(0, .06, .08, 0, Math.PI); g.fill(); },
	yawn: g => { g.fillStyle = C.tinta; g.beginPath(); g.ellipse(0, .02, .11, .16, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = C.verm; g.beginPath(); g.ellipse(0, .1, .06, .05, 0, 0, Math.PI * 2); g.fill(); },
	frown: g => { g.strokeStyle = C.tinta; g.lineWidth = .045; g.beginPath(); g.arc(0, .14, .15, 1.2 * Math.PI, 1.8 * Math.PI); g.stroke(); },
};
function drawTorso(g, s) {
	g.fillStyle = s.skin; g.fillRect(-.13, -.78, .26, .3);
	const body = () => { g.beginPath(); g.moveTo(-.44, -.58); g.lineTo(.44, -.58); g.quadraticCurveTo(.64, -.56, .64, -.32); g.lineTo(.56, .62); g.lineTo(-.56, .62); g.lineTo(-.64, -.32); g.quadraticCurveTo(-.64, -.56, -.44, -.58); g.closePath(); };
	if (s.gown) {
		g.fillStyle = '#16161C'; body(); g.fill();
		g.fillStyle = '#fff'; g.fillRect(-.16, -.6, .14, .3); g.fillRect(.02, -.6, .14, .3);
		g.strokeStyle = '#3a3a46'; g.lineWidth = .025; for (const x of [-.35, -.15, .15, .35]) { g.beginPath(); g.moveTo(x, -.2); g.lineTo(x * 1.15, .6); g.stroke(); }
		return;
	}
	g.fillStyle = s.shirt; body(); g.fill();
	if (s.stripe) { g.save(); body(); g.clip(); g.fillStyle = s.stripe; for (let y = -.45; y < .62; y += .2) g.fillRect(-.7, y, 1.4, .08); g.restore(); }
	g.fillStyle = s.skin; g.beginPath(); g.moveTo(-.13, -.58); g.lineTo(.13, -.58); g.lineTo(0, -.4); g.closePath(); g.fill();
	if (s.tie) { g.fillStyle = C.verm; g.beginPath(); g.moveTo(-.04, -.5); g.lineTo(.04, -.5); g.lineTo(.07, .05); g.lineTo(0, .14); g.lineTo(-.07, .05); g.closePath(); g.fill(); }
	if (s.coat) {
		g.fillStyle = '#FCFCF7';
		g.beginPath(); g.moveTo(-.64, -.32); g.quadraticCurveTo(-.64, -.56, -.44, -.58); g.lineTo(-.14, -.58); g.lineTo(-.06, .12); g.lineTo(-.08, .62); g.lineTo(-.56, .62); g.closePath(); g.fill();
		g.beginPath(); g.moveTo(.64, -.32); g.quadraticCurveTo(.64, -.56, .44, -.58); g.lineTo(.14, -.58); g.lineTo(.06, .12); g.lineTo(.08, .62); g.lineTo(.56, .62); g.closePath(); g.fill();
		g.strokeStyle = 'rgba(28,27,34,.55)'; g.lineWidth = .025;
		g.beginPath(); g.moveTo(-.14, -.58); g.lineTo(-.3, -.25); g.lineTo(-.06, .12); g.stroke();
		g.beginPath(); g.moveTo(.14, -.58); g.lineTo(.3, -.25); g.lineTo(.06, .12); g.stroke();
		g.strokeRect(.24, .05, .22, .2);
		g.fillStyle = C.azul; g.fillRect(.28, -.04, .04, .12); g.fillStyle = C.verm; g.fillRect(.36, -.02, .04, .1);
		circle(g, .1, .3, .025, 'rgba(28,27,34,.6)'); circle(g, .1, .48, .025, 'rgba(28,27,34,.6)');
	}
}
function drawLegs(g, s) {
	if (s.gown) { g.fillStyle = '#16161C'; g.beginPath(); g.moveTo(-.5, -.55); g.lineTo(.5, -.55); g.lineTo(.48, .38); g.lineTo(-.48, .38); g.closePath(); g.fill(); }
	else { g.fillStyle = s.pants; rrect(g, -.4, -.55, .36, .92, .06); g.fill(); rrect(g, .04, -.55, .36, .92, .06); g.fill(); }
	g.fillStyle = C.tinta; g.beginPath(); g.ellipse(-.25, .4, .2, .1, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(.25, .4, .2, .1, 0, 0, Math.PI * 2); g.fill();
}
function drawArm(g, s) {
	const sleeve = s.gown ? '#16161C' : s.coat ? '#FCFCF7' : s.shirt;
	g.fillStyle = sleeve; rrect(g, -.15, -.62, .3, .96, .14); g.fill();
	if (s.coat) { g.strokeStyle = 'rgba(28,27,34,.4)'; g.lineWidth = .02; g.beginPath(); g.moveTo(-.15, .22); g.lineTo(.15, .22); g.stroke(); }
	circle(g, 0, .45, .14, s.skin);
}
function drawGlasses(g) { g.strokeStyle = C.tinta; g.lineWidth = .035; for (const x of [-.2, .2]) { g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.arc(x, 0, .14, 0, Math.PI * 2); g.fill(); g.stroke(); } g.beginPath(); g.moveTo(-.06, -.02); g.lineTo(.06, -.02); g.stroke(); }

export function puppet(o = {}) {
	const s = { h: 3.4, skin: C.pele1, shirt: C.azul, pants: '#3B3F4A', hair: 'curto', hairColor: C.tinta, coat: false, gown: false, glasses: false, tie: false, stripe: null, ...o };
	const u = s.h / 3.4, K = JSON.stringify([s.skin, s.shirt, s.pants, s.hair, s.hairColor, s.coat, s.gown, s.tie, s.stripe]);
	const opt = { px: HQ, border: .05 };
	const sc = m => { m.scale.setScalar(u); return m; };
	const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
	const legs = sc(cut('pl' + K, 1.1, 1.05, g => drawLegs(g, s), opt)); legs.position.set(0, .5 * u, 0); body.add(legs);
	const hip = new THREE.Group(); hip.position.y = .95 * u; body.add(hip);
	const torso = sc(cut('pt' + K, 1.6, 1.6, g => drawTorso(g, s), opt)); torso.position.set(0, .55 * u, .03); hip.add(torso);
	const neck = new THREE.Group(); neck.position.y = 1.25 * u; hip.add(neck);
	const head = sc(cut('ph' + K, 1.5, 1.8, g => drawHead(g, s), opt)); head.position.set(0, .6 * u, .045); neck.add(head);
	const face = new THREE.Group(); face.position.set(0, .55 * u, .05); neck.add(face);
	const eyes = {}, mouths = {};
	const eyeG = new THREE.Group(); face.add(eyeG);
	for (const k in EYES) { const m = sc(cut('pe' + k, .9, .36, g => { EYES[k](g, -.2); EYES[k](g, .2); }, { px: HQ, border: 0, grainK: 0, shadow: false })); m.visible = false; eyeG.add(m); eyes[k] = m; }
	for (const k in MOUTH) { const m = sc(cut('pm' + k, .6, .44, g => MOUTH[k](g), { px: HQ, border: 0, grainK: 0, shadow: false })); m.position.y = -.27 * u; m.visible = false; face.add(m); mouths[k] = m; }
	const brows = [-1, 1].map(sx => { const m = sc(cut('pb', .26, .1, g => { g.fillStyle = C.tinta; rrect(g, -.11, -.03, .22, .06, .03); g.fill(); }, { px: HQ, border: 0, grainK: 0, shadow: false })); m.position.set(sx * .2 * u, .2 * u, .002); face.add(m); return m; });
	if (s.glasses) { const m = sc(cut('pg', 1.0, .4, drawGlasses, { px: HQ, border: 0, grainK: 0, shadow: false })); m.position.z = .006; face.add(m); }
	const arms = [-1, 1].map(sx => {
		const pivot = new THREE.Group(); pivot.position.set(sx * .6 * u, 1.1 * u, .07); hip.add(pivot);
		const m = sc(cut('pa' + K, .42, 1.3, g => drawArm(g, s), { ...opt, anchor: [0, .5] })); pivot.add(m);
		const hand = new THREE.Object3D(); hand.position.set(0, -.95 * u, .02); pivot.add(hand);
		return { pivot, hand };
	});
	root.handL = arms[0].hand; root.handR = arms[1].hand; root.u = u; root.neck = neck; root.hip = hip;
	root.headWorld = new THREE.Vector3();
	root.pose = ({ armL = -.1, armR = .1, head: ht = 0, lean = 0, bob = 0, eyes: e = 'dot', mouth = 'smile', brow = 0, browTilt = 0, blink = 0, torso: tl = 0, squash = 0, look = 0 } = {}) => {
		arms[0].pivot.rotation.z = armL; arms[1].pivot.rotation.z = armR;
		neck.rotation.z = ht; body.rotation.z = lean; body.position.y = bob; hip.rotation.z = tl;
		body.scale.set(1 + squash * .5, 1 - squash, 1);
		for (const k in eyes) eyes[k].visible = k === e; for (const k in mouths) mouths[k].visible = k === mouth;
		eyeG.scale.y = Math.max(.08, 1 - blink); eyeG.position.x = look * .05 * u;
		brows[0].position.y = brows[1].position.y = (.2 + brow * .07) * u;
		brows[0].rotation.z = browTilt * .35; brows[1].rotation.z = -browTilt * .35;
	};
	root.pose();
	return root;
}
// piscar determinístico: 1 piscada a cada ~3 s
export const blinkAt = (t, seed = 0) => { const p = (t + seed * 1.37) % 3.1; return p < .12 ? Math.sin(p / .12 * Math.PI) : 0; };

// ── bonequinho de multidão (um recorte só, 3 estados) ──
export function miniTex(key, s, state) {
	return { key: 'mini' + key + state, draw: g => {
		const gray = state === 'cross', shirt = gray ? '#B9B7BE' : s.shirt, skin = gray ? '#D9CFC8' : s.skin, hair = gray ? '#7C7A82' : s.hairColor;
		g.fillStyle = shirt; rrect(g, -.24, -.05, .48, .5, .14); g.fill();
		circle(g, 0, -.22, .2, skin);
		g.fillStyle = hair; g.beginPath(); g.arc(0, -.22, .215, Math.PI, 0); g.quadraticCurveTo(.1, -.3, 0, -.28); g.quadraticCurveTo(-.1, -.27, -.215, -.22); g.fill();
		if (s.hair === 'coque') circle(g, 0, -.45, .08, hair);
		if (s.hair === 'cacheado') for (let i = 0; i < 6; i++) { const a = Math.PI * (1.05 + i * .18); circle(g, Math.cos(a) * .19, -.22 + Math.sin(a) * .19, .07, hair); }
		if (state === 'spiral') { for (const x of [-.075, .075]) { circle(g, x, -.2, .055, '#fff', C.tinta, .012); spiral(g, x, -.2, .05, 2.2, .012, C.tinta); } }
		else { for (const x of [-.07, .07]) circle(g, x, -.2, .028, C.tinta); }
		g.strokeStyle = C.tinta; g.lineWidth = .02; g.beginPath();
		if (state === 'cross') { g.moveTo(-.05, -.1); g.lineTo(.05, -.1); g.stroke(); g.lineWidth = .022; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * .12, -.32); g.lineTo(sx * .02, -.29); g.stroke(); }
			g.fillStyle = '#A5A3AA'; rrect(g, -.26, .1, .52, .12, .06); g.fill(); }
		else { g.arc(0, -.15, .06, .2 * Math.PI, .8 * Math.PI); g.stroke(); }
	} };
}
export function mini(s, scale = 1) {
	const states = {};
	for (const st of ['normal', 'spiral', 'cross']) { const { key, draw } = miniTex(JSON.stringify(s), s, st); const m = cut(key, .6, .95, draw, { px: 180, border: .035 }); m.scale.setScalar(scale); m.visible = st === 'normal'; states[st] = m; }
	const g = new THREE.Group(); for (const k in states) g.add(states[k]);
	g.setState = st => { for (const k in states) states[k].visible = k === st; };
	return g;
}
