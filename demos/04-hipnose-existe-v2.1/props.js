// Objetos de papel reutilizados: relógio de bolso, bloco de checklist, etiquetas, post-its, cérebro em corte sagital, carimbo.
import * as THREE from 'three';
import { seg, ease } from './lib.js';
import { C, FONT, cut, textCut, ribbon, handPath, rrect, circle, txt } from './paper.js';

export const pop = (T, t0, d = .32) => ease.backOut(seg(T, t0, t0 + d));
export const gone = (T, t1, d = .22) => 1 - ease.expoIn(seg(T, t1 - d, t1));
export function show(o, k) { o.visible = k > .002; if (o.visible) o.scale.setScalar(k); }

// ── relógio de bolso pendurado (pivô no topo da corrente) ──
export function watch(L = 4.6) {
	const pivot = new THREE.Group();
	const chain = ribbon(handPath([[0, 0], [0, -L + .5]], { jitter: 0, step: .2 }), .05, '#C99A2E'); chain.position.z = .02; pivot.add(chain);
	const w = cut('watch', 1.0, 1.2, g => {
		circle(g, 0, -.48, .09, null, '#C99A2E', .04); g.fillStyle = '#C99A2E'; g.fillRect(-.07, -.42, .14, .1);
		circle(g, 0, .08, .42, '#E2B33C'); circle(g, 0, .08, .34, '#FBF6EC');
		for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.strokeStyle = C.tinta; g.lineWidth = i % 3 ? .015 : .03; g.beginPath(); g.moveTo(Math.cos(a) * .26, .08 + Math.sin(a) * .26); g.lineTo(Math.cos(a) * .31, .08 + Math.sin(a) * .31); g.stroke(); }
		g.lineWidth = .03; g.beginPath(); g.moveTo(0, .08); g.lineTo(.12, -.04); g.moveTo(0, .08); g.lineTo(0, -.14); g.stroke(); circle(g, 0, .08, .03, C.verm);
	}, { px: 260 });
	w.position.set(0, -L, .04); pivot.add(w);
	return { g: pivot, w };
}

// ── bloco amarelo com checklist ──
export function notepad(key, rows, { w = 4.4, h = 2.7 } = {}) {
	const g = new THREE.Group();
	const ys = rows.map((_, i) => .5 - i * .68);
	const bx = -w / 2 + .98;
	const pad = cut('pad' + key, w, h, gg => {
		gg.fillStyle = '#FFE98A'; rrect(gg, -w / 2 + .08, -h / 2 + .08, w - .16, h - .16, .06); gg.fill();
		gg.fillStyle = C.verm; gg.fillRect(-w / 2 + .08, -h / 2 + .08, w - .16, .24);
		gg.strokeStyle = 'rgba(43,89,195,.3)'; gg.lineWidth = .02;
		for (let y = -h / 2 + .7; y < h / 2 - .1; y += .34) { gg.beginPath(); gg.moveTo(-w / 2 + .1, y); gg.lineTo(w / 2 - .1, y); gg.stroke(); }
		gg.strokeStyle = 'rgba(230,57,70,.45)'; gg.beginPath(); gg.moveTo(-w / 2 + .55, -h / 2 + .32); gg.lineTo(-w / 2 + .55, h / 2 - .1); gg.stroke();
		gg.strokeStyle = C.tinta; gg.lineWidth = .045; for (const y of ys) { rrect(gg, bx - .2, -y - .2, .4, .4, .05); gg.stroke(); }
	}, { px: 220 });
	g.add(pad);
	const R = rows.map((text, i) => {
		const tm = textCut('padt' + text, text, { size: .5, border: 0, pad: .05 }); tm.castShadow = false;
		// cabe no papel: encolhe a palavra se ela passar da margem direita do bloco (escala fixa no mesh; a animação escala o grupo)
		const room = w / 2 - .22 - (bx + .42), k = Math.min(1, room / tm.userData.w); tm.scale.setScalar(k);
		const t = new THREE.Group(); t.add(tm); t.userData.w = tm.userData.w * k;
		t.position.set(bx + .42 + t.userData.w / 2, ys[i], .02); g.add(t);
		const q = textCut('qmark', '?', { size: .42, color: C.cinza, border: 0, pad: .02 }); q.castShadow = false; q.position.set(bx, ys[i], .02); g.add(q);
		const ck = ribbon(handPath([[bx - .17, ys[i] + .02], [bx - .03, ys[i] - .16], [bx + .3, ys[i] + .38]], { step: .03, jitter: .01, seed: 9 + i }), .1, C.verm); ck.position.z = .04; g.add(ck); ck.reveal(0);
		return { t, q, ck };
	});
	return { g, rows: R, pad };
}

export const tape = (key, text, o = {}) => textCut(key, text, { bg: o.bg || '#FFFDF3', tape: true, size: o.size || .4, color: o.color || C.tinta, pad: o.pad || .14, font: o.font, weight: o.weight, border: .04 });

export function sticky(n, color = C.amar) {
	return cut('sticky' + n + color, .95, .95, g => {
		g.fillStyle = color; g.beginPath(); g.moveTo(-.4, -.4); g.lineTo(.4, -.4); g.lineTo(.4, .3); g.lineTo(.3, .4); g.lineTo(-.4, .4); g.closePath(); g.fill();
		g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.moveTo(.4, .3); g.lineTo(.3, .3); g.lineTo(.3, .4); g.closePath(); g.fill();
		txt(g, String(n), 0, .02, .6, { color: C.tinta });
	}, { border: .03 });
}

// ── cérebro de papel em corte sagital (frente à esquerda) ──
const OUT = [[-2.2, .2], [-2.28, -.5], [-1.95, -1.2], [-1.25, -1.62], [-.35, -1.76], [.6, -1.66], [1.4, -1.36], [2.02, -.82], [2.26, -.1], [2.1, .5], [1.55, .74], [.85, .68], [.25, .92], [-.5, 1.02], [-1.25, .96], [-1.9, .7]];
function smoothPath(g, P) { g.beginPath(); const n = P.length, m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; let s = m(P[n - 1], P[0]); g.moveTo(...s); for (let i = 0; i < n; i++) { const p = P[i], q = m(P[i], P[(i + 1) % n]); g.quadraticCurveTo(p[0], p[1], q[0], q[1]); } g.closePath(); }
function band(g, cx, cy, rx0, ry0, rx1, ry1, a0, a1) { g.beginPath(); for (let i = 0; i <= 30; i++) { const a = a0 + (a1 - a0) * i / 30; g.lineTo(cx + Math.cos(a) * rx1, cy + Math.sin(a) * ry1); } for (let i = 30; i >= 0; i--) { const a = a0 + (a1 - a0) * i / 30; g.lineTo(cx + Math.cos(a) * rx0, cy + Math.sin(a) * ry0); } g.closePath(); }
const BW = 5.0, BH = 4.0;
export const PIECES = {
	pref: { c: [-1.72, .3], col: '#5B8DEF', draw: g => { g.beginPath(); g.moveTo(-2.22, .25); g.quadraticCurveTo(-2.4, -.6, -1.95, -1.22); g.quadraticCurveTo(-1.6, -1.5, -1.28, -1.58); g.quadraticCurveTo(-1.05, -.9, -1.3, -.25); g.quadraticCurveTo(-1.45, .35, -1.6, .82); g.quadraticCurveTo(-2.0, .68, -2.22, .25); g.fill(); } },
	accA: { c: [-.86, .42], col: C.amar, draw: g => { band(g, .1, .15, 1.22, .66, 1.55, .98, Math.PI * 1.0, Math.PI * 1.5); g.fill(); } },
	accP: { c: [1.06, .42], col: C.laranja, draw: g => { band(g, .1, .15, 1.22, .66, 1.55, .98, Math.PI * 1.5, Math.PI * 1.98); g.fill(); } },
	sens: { c: [.3, 1.38], col: '#3BAF85', draw: g => { g.beginPath(); g.moveTo(-.05, -1.74); g.quadraticCurveTo(.3, -1.76, .6, -1.66); g.lineTo(.56, -1.12); g.quadraticCurveTo(.28, -1.0, .02, -1.12); g.closePath(); g.fill(); } },
	emo: { c: [-.3, -.68], col: C.verm, draw: g => { g.beginPath(); g.ellipse(-.3, .68, .38, .2, -.15, 0, Math.PI * 2); g.fill(); } },
};
const DORM = '#E79AAE';
export function brain(key = 'b') {
	const g = new THREE.Group();
	const cortex = cut('brainCortex', BW, BH, gg => {
		gg.fillStyle = '#F4B3C2'; smoothPath(gg, OUT); gg.fill();
		gg.save(); smoothPath(gg, OUT); gg.clip();
		gg.strokeStyle = '#D9839A'; gg.lineWidth = .05;
		const r = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(5);
		for (let k = 0; k < 26; k++) { let x = -2.2 + r() * 4.4, y = -1.7 + r() * 2.6; gg.beginPath(); gg.moveTo(x, y); for (let j = 0; j < 5; j++) { const nx = x + (r() - .5) * .9, ny = y + (r() - .5) * .6; gg.quadraticCurveTo((x + nx) / 2 + (r() - .5) * .3, (y + ny) / 2 + (r() - .5) * .3, nx, ny); x = nx; y = ny; } gg.stroke(); }
		gg.restore();
		gg.fillStyle = '#C9A27A'; gg.beginPath(); gg.ellipse(1.5, .95, .66, .44, -.1, 0, Math.PI * 2); gg.fill();
		gg.strokeStyle = '#A57E57'; gg.lineWidth = .04; for (let i = 0; i < 5; i++) { gg.beginPath(); gg.ellipse(1.5, .95, .6 - i * .1, .38 - i * .07, -.1, Math.PI * 1.1, Math.PI * 1.95); gg.stroke(); }
		gg.fillStyle = '#D8C3A5'; gg.beginPath(); gg.moveTo(.55, .7); gg.lineTo(.98, .72); gg.lineTo(1.0, 1.85); gg.lineTo(.68, 1.85); gg.closePath(); gg.fill();
		gg.fillStyle = C.creme; band(gg, .1, .15, 1.0, .46, 1.2, .64, Math.PI * .98, Math.PI * 2.02); gg.fill();
	}, { px: 220, border: .07 });
	g.add(cortex);
	const parts = {};
	for (const k in PIECES) {
		const P = PIECES[k];
		const m = cut('brainP' + k, BW, BH, gg => { gg.fillStyle = '#fff'; P.draw(gg); }, { px: 220, border: .045, anchor: [P.c[0], P.c[1]] });
		const zi = Object.keys(parts).length * .006; m.userData.z0 = .05 + zi; m.renderOrder = Object.keys(parts).length; m.position.set(P.c[0], P.c[1], m.userData.z0); m.material.color.set(DORM); g.add(m); parts[k] = m;
	}
	const dorm = new THREE.Color(DORM), tmp = new THREE.Color();
	g.light = (k, a, lift = a) => { const m = parts[k]; m.material.color.copy(dorm).lerp(tmp.set(PIECES[k].col), a); m.position.z = m.userData.z0 + lift * .28; m.scale.setScalar(1 + lift * .1); };
	g.parts = parts;
	return g;
}

// ── carimbo de borracha ──
export function stamp(text1, text2) {
	return cut('stamp', 4.6, 2.0, g => {
		g.strokeStyle = C.verm; g.lineWidth = .1; rrect(g, -2.15, -.85, 4.3, 1.7, .14); g.stroke();
		txt(g, text1, 0, -.38, .42, { font: FONT.sans, weight: '900', color: C.verm });
		txt(g, text2, 0, .26, .82, { font: FONT.sans, weight: '900', color: C.verm });
		g.globalCompositeOperation = 'destination-out';
		const r = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(11);
		for (let i = 0; i < 260; i++) { g.globalAlpha = .3 + r() * .7; circle(g, -2.3 + r() * 4.6, -1 + r() * 2, .01 + r() * .035, '#000'); }
		g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
	}, { border: 0, grainK: 0, shadow: false, px: 240 });
}
