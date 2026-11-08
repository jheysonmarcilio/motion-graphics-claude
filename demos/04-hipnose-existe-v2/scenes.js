// O mural: cada "local" é uma folha presa na cortiça com seus recortes. Tudo é função do tempo absoluto T
// (segundos da narração gravada audio/04-hipnose-existe.mp3). A câmera passeia entre os locais (camera.js).
import * as THREE from 'three';
import { seg, ease, clamp, lerp, mulberry32 } from './lib.js';
import { C, FONT, cut, textCut, sheet, ribbon, handPath, arcPts, rrect, circle, spiral, txt } from './paper.js';
import { puppet, mini, blinkAt } from './puppet.js';
import { pop, gone, show, watch, notepad, tape, sticky, brain, stamp } from './props.js';

const TAU = Math.PI * 2;
const SPIEGEL = { skin: C.pele1, shirt: C.azulc, pants: '#4A4E5C', hair: 'grisalho', hairColor: '#B9B6C2', coat: true, glasses: true, tie: true };
const sw = (T, f, a = 1, ph = 0) => a * Math.sin(T * f * TAU + ph);

function loc(x, y, bg, { w = 8.5, h = 14, cy = 0, seed = 1, deco } = {}) {
	const g = new THREE.Group(); g.position.set(x, y, 0);
	const s = sheet('sheet' + x + '_' + y, w, h, bg, { seed, deco }); s.position.set(0, cy, (seed % 5) * .003); g.add(s);
	for (const sx of [-1, 1]) { // fitas segurando a folha
		const t = cut('tapeC', 1.3, .45, gg => { gg.fillStyle = 'rgba(245,238,215,.85)'; gg.fillRect(-.6, -.18, 1.2, .36); }, { border: 0, grainK: .5 });
		t.position.set(sx * (w / 2 - .5), cy + h / 2 - .25, .03); t.rotation.z = sx * -.5; g.add(t);
	}
	return { g, x, y, w, h, cy, update: () => {} };
}
const grid = (g) => { g.strokeStyle = 'rgba(43,89,195,.22)'; g.lineWidth = .02; for (let x = -8; x < 8; x += .4) { g.beginPath(); g.moveTo(x, -10); g.lineTo(x, 10); g.stroke(); } for (let y = -10; y < 10; y += .4) { g.beginPath(); g.moveTo(-8, y); g.lineTo(8, y); g.stroke(); } };
const dots = (col) => (g) => { g.fillStyle = col; for (let x = -8; x < 8; x += .5) for (let y = -12; y < 12; y += .5) { g.beginPath(); g.arc(x, y, .035, 0, TAU); g.fill(); } };

export function buildScenes(ctx) {
	const L = [];
	const add = l => (L.push(l), l);
	const rng = mulberry32(42);

	// ═════ L0 · a pergunta (folha azul) ═════
	{
		const l = add(loc(0, 0, C.azul, { seed: 1, deco: dots('rgba(255,255,255,.12)') }));
		const p = puppet({ h: 3.2, skin: C.pele2, shirt: C.amar, pants: '#2E3B5E', hair: 'cacheado' }); p.position.set(0, -.75, .1); l.g.add(p);
		const copies = [-1, 1].map(sx => { const c = puppet({ h: 3.2, skin: C.pele2, shirt: C.amar, pants: '#2E3B5E', hair: 'cacheado' }); c.position.set(0, -.75, .06); l.g.add(c); return c; });
		const W = watch(4.8); W.g.position.set(0, 6.6, .5); l.g.add(W.g);
		const q = ribbon(handPath([...arcPts(0, 0, .32, .32, Math.PI * .9, -Math.PI * .4, 30), [.02, -.38], [0, -.62]], { step: .03, jitter: .012 }), .14, C.verm); q.position.set(-1.75, 3.65, .3); l.g.add(q);
		const qd = cut('qdot', .3, .3, g => circle(g, 0, 0, .1, C.verm), { border: 0 }); qd.position.set(-1.75, 2.75, .3); l.g.add(qd);
		const hand = cut('hand', 2.0, .8, g => {
			g.fillStyle = C.branco; rrect(g, .35, -.26, .7, .52, .08); g.fill();
			g.fillStyle = C.pele1; rrect(g, -.55, -.2, .95, .42, .2); g.fill(); rrect(g, -.95, -.17, .6, .16, .08); g.fill();
			g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = .02; for (const y of [.0, .08]) { g.beginPath(); g.moveTo(-.4, y); g.lineTo(.2, y); g.stroke(); }
		}, { px: 220 }); hand.position.z = .7; l.g.add(hand);
		const ruler = cut('ruler', .55, 3.8, g => {
			g.fillStyle = C.amar; g.fillRect(-.22, -1.85, .44, 3.7); g.strokeStyle = C.tinta; g.lineWidth = .02;
			for (let i = 0; i <= 34; i++) { const y = 1.7 - i * .1, L2 = i % 5 ? .08 : .16; g.beginPath(); g.moveTo(-.22, y); g.lineTo(-.22 + L2, y); g.stroke(); if (i % 10 === 0) txt(g, String(i / 10 | 0), .06, y, .13, { font: FONT.mono, weight: '700' }); }
		}, { px: 220 }); ruler.position.set(-1.45, -6, .4); l.g.add(ruler);
		const pad = notepad('q', ['PALPÁVEL', 'MENSURÁVEL', 'REPLICÁVEL']); pad.g.position.set(0, -2.15, .6); pad.g.rotation.z = -.02; l.g.add(pad.g);
		l.update = T => {
			if (T > 86.9) T = Math.min(T - 88.35, 0);   // volta ao 1º quadro (loop)
			const swing = T < 2.1 ? .42 * Math.sin(TAU * .55 * T) : .42 * Math.sin(TAU * .55 * 2.1);
			const jig = T > 2.5 ? .3 * Math.exp(-(T - 2.5) * 3.5) * Math.sin((T - 2.5) * 22) : 0;
			W.g.rotation.z = swing + jig;
			const wx = Math.sin(W.g.rotation.z) * 4.8;
			const trance = T < 2.05;
			p.pose({ eyes: trance ? 'spiral' : 'dot', mouth: trance ? 'flat' : T > 2.5 && T < 3.1 ? 'o' : 'smile', look: trance ? 0 : clamp(wx, -1, 1), lean: trance ? swing * .15 : 0, head: trance ? swing * .2 : sw(T, .3, .04), brow: trance ? 0 : 1, browTilt: trance ? 0 : .6, blink: trance ? 0 : blinkAt(T, 1), armL: -.12, armR: T > 3.15 && T < 4.2 ? .5 : .12 });
			q.reveal(seg(T, 1.15, 1.85)); show(qd, pop(T, 1.9));
			const hIn = ease.expoOut(seg(T, 2.3, 2.52)), hOut = ease.expoIn(seg(T, 2.85, 3.15));
			hand.position.set(lerp(4.5, wx + .9, hIn * (1 - hOut)) + hOut * 1, 1.85 - .0, .7); hand.visible = T > 2.25 && T < 3.2;
			ruler.position.y = lerp(-7, 1.05, ease.expoOut(seg(T, 3.1, 3.45))) - 8 * ease.expoIn(seg(T, 4.0, 4.3)); ruler.visible = T > 3.05 && T < 4.3;
			pad.g.position.y = lerp(-8.5, -2.15, ease.expoOut(seg(T, 2.15, 2.5))); pad.g.visible = T > 2.1;
			pad.rows.forEach((r, i) => { const k = pop(T, [2.35, 3.15, 4.35][i]); show(r.t, k); r.t.scale.x = k; show(r.q, k); r.ck.reveal(0); });
			copies.forEach((c, i) => { const k = ease.expoOut(seg(T, 4.38, 4.8)); c.visible = k > 0; c.position.x = (i ? 1 : -1) * 2.15 * k; c.scale.setScalar(lerp(.9, .72, k)); c.pose({ eyes: 'dot', brow: .8, browTilt: .5, blink: blinkAt(T, 3 + i), look: i ? -1 : 1, armR: .1, armL: -.1 }); });
		};
	}

	// ═════ L1 · Spiegel (caderno quadriculado) ═════
	{
		const l = add(loc(12, 0, C.creme, { seed: 2, deco: grid }));
		const s = puppet({ h: 3.4, ...SPIEGEL }); s.position.set(-.5, -.75, .1); l.g.add(s);
		const bub = cut('bubbleQ', 2.2, 1.7, g => { g.fillStyle = '#fff'; for (const [x, y, r] of [[-.45, .1, .5], [.15, -.2, .55], [.55, .15, .45], [0, .3, .5]]) circle(g, x, y, r, '#fff'); txt(g, '?', .05, .05, .9, { color: C.verm }); }, { px: 220, border: .04 });
		bub.position.set(1.45, 3.9, .4); l.g.add(bub);
		const bb = [[.6, 2.95, .14], [.9, 3.3, .2]].map(([x, y, r], i) => { const m = cut('bb' + i, r * 2.4, r * 2.4, g => circle(g, 0, 0, r, '#fff'), { border: .03 }); m.position.set(x, y, .35); l.g.add(m); return m; });
		const nm = tape('tagSp', 'DAVID SPIEGEL', { size: .62, bg: '#FFFDF3' }); nm.position.set(0, -1.85, .7); nm.rotation.z = -.03; l.g.add(nm);
		const sub = textCut('tagSp2', 'PSIQUIATRA · PESQUISADOR', { font: FONT.mono, weight: '700', size: .26, color: '#fff', bg: C.azul, border: .03, pad: .1 }); sub.position.set(.35, -2.65, .72); sub.rotation.z = .02; l.g.add(sub);
		l.update = T => {
			const think = T < 7.6;
			s.pose({ armR: think ? 2.55 + sw(T, .6, .05) : .15, armL: -.12, head: think ? .12 : sw(T, .4, .03), eyes: think ? 'side' : 'dot', look: think ? 1 : 0, mouth: think ? 'flat' : 'smile', brow: think ? .6 : .3, browTilt: think ? .5 : 0, blink: blinkAt(T, 2), bob: Math.abs(sw(T, .9, .03)) });
			show(bub, pop(T, 6.45) * gone(T, 8.4)); bb.forEach((m, i) => show(m, pop(T, 6.2 + i * .1) * gone(T, 8.3)));
			bub.rotation.z = sw(T, .5, .04);
			const kn = pop(T, 7.75, .28); show(nm, kn); nm.rotation.z = -.03 + (1 - kn) * .3; show(sub, pop(T, 7.95, .28));
		};
	}

	// ═════ L1b · mapa dos EUA + calendário (kraft) ═════
	{
		const l = add(loc(12, -16, C.kraft, { seed: 3, w: 16, h: 14, deco: dots('rgba(90,60,30,.12)') }));
		l.g.children[0].position.x = 3.2;
		const US = [[.02, .08], [.12, .05], [.32, .07], [.55, .07], [.6, .12], [.66, .13], [.7, .2], [.75, .22], [.8, .18], [.86, .15], [.92, .06], [.97, .1], [.93, .2], [.88, .28], [.85, .38], [.86, .45], [.8, .55], [.82, .7], [.84, .86], [.79, .86], [.75, .68], [.68, .63], [.6, .66], [.52, .7], [.47, .85], [.42, .78], [.37, .68], [.3, .66], [.22, .62], [.12, .58], [.07, .48], [.03, .36], [.01, .22]];
		const MW = 5.6, MH = 3.5, mp = ([x, y]) => [-MW / 2 + x * MW, -MH / 2 + y * MH];
		const map = cut('usmap', MW + .4, MH + .4, g => {
			g.fillStyle = C.creme; g.beginPath(); US.forEach((p, i) => i ? g.lineTo(...mp(p)) : g.moveTo(...mp(p))); g.closePath(); g.fill();
			g.strokeStyle = C.tinta; g.lineWidth = .045; g.stroke();
			g.save(); g.clip(); g.strokeStyle = 'rgba(28,27,34,.25)'; g.lineWidth = .02; g.setLineDash([.08, .07]);
			for (const x of [.2, .36, .5, .64, .78]) { g.beginPath(); g.moveTo(-MW / 2 + x * MW, -MH); g.lineTo(-MW / 2 + x * MW + .2, MH); g.stroke(); }
			for (const y of [.35, .55]) { g.beginPath(); g.moveTo(-MW, -MH / 2 + y * MH); g.lineTo(MW, -MH / 2 + y * MH + .1); g.stroke(); }
			g.restore(); txt(g, 'EUA', .5, -.05, .7, { color: 'rgba(28,27,34,.75)' });
		}, { px: 200 });
		map.position.set(0, 2.2, .1); l.g.add(map);
		const SF = [-MW / 2 + .045 * MW, 2.2 + MH / 2 - .4 * MH];
		const pin = cut('pin', .55, .8, g => { g.strokeStyle = '#888'; g.lineWidth = .04; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, .38); g.stroke(); circle(g, 0, -.1, .2, C.verm); circle(g, -.06, -.16, .05, 'rgba(255,255,255,.6)'); }, { px: 240, anchor: [0, -.38] });
		pin.position.set(SF[0], SF[1], .5); l.g.add(pin);
		const ring = ribbon(arcPts(0, 0, .35, .25, 0, TAU, 40), .06, C.verm); ring.position.set(SF[0], SF[1], .15); l.g.add(ring);
		const bld = cut('uni', 2.0, 1.7, g => {
			g.fillStyle = '#E9D6AE'; g.fillRect(-.17, -.75, .34, .9); g.fillStyle = '#D9643A'; g.beginPath(); g.moveTo(-.22, -.75); g.lineTo(0, -.88); g.lineTo(.22, -.75); g.closePath(); g.fill();
			g.fillStyle = '#E9D6AE'; g.fillRect(-.85, -.1, 1.7, .72); g.fillStyle = '#D9643A'; g.fillRect(-.92, -.2, 1.84, .14);
			g.fillStyle = '#6B4A3A'; for (let i = 0; i < 5; i++) { const x = -.68 + i * .34; g.beginPath(); g.moveTo(x - .1, .62); g.lineTo(x - .1, .25); g.arc(x, .25, .1, Math.PI, 0); g.lineTo(x + .1, .62); g.closePath(); g.fill(); }
			g.fillStyle = '#6B4A3A'; g.fillRect(-.06, -.55, .12, .18);
		}, { px: 220 });
		bld.position.set(-2.0, .55, .3); l.g.add(bld);
		const uni = tape('tagSt', 'STANFORD', { size: .55, bg: C.creme }); uni.position.set(-1.4, -.6, .4); l.g.add(uni);
		const uni2 = textCut('tagSt2', 'UNIVERSIDADE · EUA', { font: FONT.mono, weight: '700', size: .22, color: '#fff', bg: C.verm, border: .03, pad: .09 }); uni2.position.set(-1.25, -1.25, .42); l.g.add(uni2);
		const line = ribbon(handPath([[SF[0], SF[1] - .25], [-2.1, 1.4]], { step: .05 }), .05, C.verm); line.position.z = .2; l.g.add(line);
		// calendário de folhas
		const cal = new THREE.Group(); cal.position.set(6.5, 2.0, .1); l.g.add(cal);
		cal.add(cut('calBack', 2.8, 3.2, g => { g.fillStyle = C.tinta; rrect(g, -1.25, -1.45, 2.5, 2.9, .1); g.fill(); }, { px: 160 }));
		const years = [2010, 2011, 2012, 2013, 2014, 2015, 2016];
		const pages = years.map((y, i) => {
			const m = cut('calP' + y, 2.4, 2.6, g => {
				g.fillStyle = '#FFFDF6'; g.fillRect(-1.12, -1.22, 2.24, 2.44); g.fillStyle = y === 2016 ? C.verm : C.azul; g.fillRect(-1.12, -1.22, 2.24, .55);
				txt(g, 'ANO', 0, -.94, .3, { font: FONT.sans, weight: '900', color: '#fff' });
				txt(g, String(y), 0, .28, .82, { font: FONT.sans, weight: '900', color: y === 2016 ? C.verm : C.tinta });
			}, { px: 200, border: .02, anchor: [0, 1.3] });
			m.position.set(0, 1.3 - .15, .05 + (years.length - i) * .006); cal.add(m); return m;
		});
		for (const x of [-.6, .6]) { const r = cut('calRing', .25, .5, g => { g.strokeStyle = '#999'; g.lineWidth = .06; g.beginPath(); g.ellipse(0, 0, .07, .18, 0, 0, TAU); g.stroke(); }, { border: 0 }); r.position.set(x, 1.2, .2); cal.add(r); }
		l.update = T => {
			const d = ease.expoIn(seg(T, 10.85, 11.1)); pin.position.y = SF[1] + (1 - d) * 5; pin.visible = T > 10.8; pin.rotation.z = (1 - d) * .4;
			pin.scale.setScalar(1 + .25 * Math.exp(-Math.max(0, T - 11.1) * 9) * (T > 11.1));
			ring.reveal(seg(T, 11.15, 11.5)); show(bld, pop(T, 11.35)); show(uni, pop(T, 11.55)); show(uni2, pop(T, 11.7)); line.reveal(seg(T, 11.3, 11.6));
			map.rotation.z = -.02 + sw(T, .2, .006);
			pages.forEach((m, i) => { const tf = 12.55 + i * .15; const k = i === years.length - 1 ? 0 : ease.cubicInOut(seg(T, tf, tf + .22)); m.rotation.x = -k * 2.6; m.position.y = 1.15 + k * .6; m.visible = i === years.length - 1 || k < 1; });
			cal.scale.setScalar(1 + .08 * Math.exp(-Math.max(0, T - 13.55) * 6) * (T > 13.55));
		};
	}

	// ═════ L2 · a sala com 60 pessoas (menta) ═════
	const crowdStyles = []; {
		const r = mulberry32(7), skins = [C.pele1, C.pele2, C.pele3], shirts = [C.azul, C.verm, C.amar, C.rosa, C.laranja, C.lilas, '#2E2E3A', '#3B6FE0'], hairs = ['curto', 'coque', 'cacheado', 'curto'], hc = [C.tinta, '#5A3A22', '#8B5A2B', '#E0B866'];
		for (let i = 0; i < 60; i++) crowdStyles.push({ skin: skins[r() * 3 | 0], shirt: shirts[r() * 8 | 0], hair: hairs[r() * 4 | 0], hairColor: hc[r() * 4 | 0] });
	}
	{
		const l = add(loc(24, 0, C.menta, { seed: 4, deco: dots('rgba(255,255,255,.18)') }));
		const order = [...Array(60).keys()].sort(() => rng() - .5);
		const P = crowdStyles.map((s, i) => {
			const col = i % 10, row = i / 10 | 0, m = mini(s, .95);
			const base = [-2.43 + col * .54, 4.25 - row * .7, .08 + row * .02];
			m.position.set(...base); l.g.add(m);
			return { m, col, row, base, t0: 15.15 + order.indexOf(i) / 59 * 2.35, rot: (rng() - .5) * .2, ph: rng() * TAU, st: rng() * .5 };
		});
		const div = ribbon(handPath([[0, 4.95], [.04, 2.5], [-.03, .15]], { step: .05, jitter: .03, seed: 5 }), .11, C.verm); div.position.z = .3; l.g.add(div);
		const hl = ribbon(handPath(arcPts(-1.62, 2.5, 1.55, 2.25, Math.PI * .55, Math.PI * 2.5, 60), { step: .06, jitter: .04, seed: 6 }), .2, C.amar, { opacity: .8 }); hl.position.z = .25; l.g.add(hl);
		const ta = tape('tagAlta', 'ALTA', { size: .5, bg: C.amar }), tb = tape('tagBaixa', 'BAIXA', { size: .5, bg: '#D5D3DA' });
		ta.position.set(-1.6, .38, .5); tb.position.set(1.6, .38, .5); ta.rotation.z = .04; tb.rotation.z = -.03; l.g.add(ta, tb);
		l.update = T => {
			const split = c => ease.expoInOut(seg(T, 24.05 + Math.abs(c - 4.5) * .05, 24.9 + Math.abs(c - 4.5) * .05));
			const alta = seg(T, 26.8, 27.6), baixa = T > 29.7;
			for (const p of P) {
				const k = pop(p.t0 < T ? T : 0, p.t0, .3); show(p.m, T >= p.t0 ? k : 0);
				const left = p.col < 5, s = split(p.col);
				const hop = Math.sin(Math.PI * s) * .18;
				let rot = p.rot, x = p.base[0] + (left ? -.45 : .45) * s, y = p.base[1] + hop;
				if (left && T > 26.8) { rot = alta * .16 * Math.sin(TAU * .55 * (T - 26.8) + p.row * .3); y += alta * .05 * Math.sin(TAU * 1.1 * (T - 26.8) + p.ph); }
				if (!left && baixa) rot = 0;
				p.m.position.set(x, y, p.base[2]); p.m.rotation.z = rot;
				p.m.setState(left && T > 26.9 + p.st ? 'spiral' : !left && T > 29.75 + p.st * .6 ? 'cross' : 'normal');
			}
			div.reveal(seg(T, 23.95, 24.5)); hl.reveal(seg(T, 27.0, 27.7));
			show(ta, pop(T, 27.1)); show(tb, pop(T, 29.85));
		};
	}

	// ═════ L2b · eletroencefalograma (amarelo-claro) ═════
	const capDraw = g => { g.fillStyle = '#ECEAF3'; g.beginPath(); g.arc(0, .08, .58, Math.PI * 1.03, Math.PI * 1.97); g.quadraticCurveTo(0, -.02, -.58, .06); g.fill(); g.strokeStyle = 'rgba(28,27,34,.35)'; g.lineWidth = .02; for (const a of [1.2, 1.35, 1.5, 1.65, 1.8]) { g.beginPath(); g.moveTo(0, .08); g.lineTo(Math.cos(a * Math.PI) * .58, .08 + Math.sin(a * Math.PI) * .58); g.stroke(); } [[1.15, C.verm], [1.3, C.azul], [1.45, C.amar], [1.6, '#3BAF85'], [1.75, C.verm], [1.88, C.azul]].forEach(([a, c]) => circle(g, Math.cos(a * Math.PI) * .45, .08 + Math.sin(a * Math.PI) * .45, .07, c, C.tinta, .015)); };
	{
		const l = add(loc(24, -16, '#FFE9A8', { seed: 5, deco: dots('rgba(200,140,0,.12)') }));
		const p = puppet({ h: 3.0, skin: C.pele3, shirt: C.verm, hair: 'coque', hairColor: C.tinta }); p.position.set(-.8, -.6, .1); l.g.add(p);
		const u = p.u, head = [-.8, -.6 + 2.75 * u];
		const capM = cut('eegcap', 1.4, 1.0, capDraw, { px: 260 }); capM.scale.setScalar(u); l.g.add(capM);
		const mac = cut('eegbox', 1.6, 1.2, g => { g.fillStyle = '#5E6B86'; rrect(g, -.7, -.5, 1.4, .95, .1); g.fill(); g.fillStyle = '#B8F5D8'; rrect(g, -.55, -.38, .8, .45, .05); g.fill(); g.strokeStyle = '#1F7A55'; g.lineWidth = .025; g.beginPath(); for (let x = -.5; x < .2; x += .02) g.lineTo(x, -.15 + Math.sin(x * 40) * .07); g.stroke(); circle(g, .45, -.2, .07, C.verm); circle(g, .45, .05, .07, C.amar); g.fillStyle = C.tinta; g.fillRect(-.45, .33, .9, .06); }, { px: 220 });
		mac.position.set(1.35, 2.75, .2); l.g.add(mac);
		const strip = new THREE.Group(); strip.position.set(1.35, 2.3, .15); l.g.add(strip);
		const paperS = cut('eegstrip', .95, 1.7, g => { g.fillStyle = '#fff'; g.fillRect(-.42, -.82, .84, 1.64); g.strokeStyle = 'rgba(230,57,70,.25)'; g.lineWidth = .012; for (let y = -.8; y < .8; y += .1) { g.beginPath(); g.moveTo(-.42, y); g.lineTo(.42, y); g.stroke(); } }, { px: 200, anchor: [0, .85], border: .03 });
		strip.add(paperS);
		const waves = [-.25, 0, .25].map((x0, k) => { const pts = []; for (let i = 0; i <= 80; i++) { const y = -.05 - i / 80 * 1.55; pts.push([x0 + .07 * Math.sin(i * 1.3 + k) + .04 * Math.sin(i * 3.1 + k * 2), y]); } const r = ribbon(pts, .022, [C.azul, C.verm, C.tinta][k]); r.position.z = .03; strip.add(r); return r; });
		const wires = [C.verm, C.azul, C.amar, '#3BAF85', C.tinta].map((c, i) => {
			const a = (1.2 + i * .14) * Math.PI, sx = head[0] + Math.cos(a) * .45 * u, sy = head[1] - Math.sin(a) * .45 * u;
			const pts = []; for (let j = 0; j <= 30; j++) { const v = j / 30; pts.push([lerp(sx, .75, v) + Math.sin(v * Math.PI) * .2, lerp(sy, 2.55 + i * .07, v) + Math.sin(v * Math.PI) * (.9 - i * .1)]); }
			const r = ribbon(pts, .035, c); r.position.z = .16; l.g.add(r); return r;
		});
		l.update = T => {
			const d = ease.expoOut(seg(T, 19.05, 19.4)); capM.position.set(head[0], head[1] + (1 - d) * 4 + .2 * u, .15); capM.visible = T > 19.0;
			const land = T > 19.4 ? Math.exp(-(T - 19.4) * 8) * Math.sin((T - 19.4) * 30) * .05 : 0; capM.position.y += land;
			p.pose({ eyes: T > 19.4 && T < 19.9 ? 'wide' : T > 19.9 ? 'side' : 'dot', look: T > 19.9 ? 1 : 0, mouth: T > 19.4 && T < 19.95 ? 'o' : 'smile', brow: T > 19.4 && T < 20 ? 1 : 0, blink: blinkAt(T, 4), armL: -.1, armR: .15, bob: -land });
			wires.forEach((w, i) => w.reveal(seg(T, 19.45 + i * .05, 19.85 + i * .05)));
			const k = ease.sineInOut(seg(T, 19.7, 22.3)); paperS.scale.y = Math.max(.001, k); waves.forEach(w => w.reveal(k));
			mac.rotation.z = T > 19.7 ? sw(T, 9, .012) : 0;
		};
	}

	// ═════ L2c · ressonância magnética (azul-claro) ═════
	{
		const l = add(loc(31, -16, C.azulc, { seed: 6, deco: dots('rgba(255,255,255,.3)') }));
		const back = cut('mriBack', 3.6, 2.2, g => { g.fillStyle = '#2B3550'; rrect(g, -1.6, -.4, 3.2, .8, .3); g.fill(); }, { border: 0 }); back.position.set(.9, 1.4, .05); l.g.add(back);
		const bed = cut('mriBed', 5.4, .7, g => { g.fillStyle = '#E8E6EF'; rrect(g, -2.6, -.12, 5.2, .24, .1); g.fill(); g.fillStyle = '#8A93A8'; g.fillRect(-2.2, .1, .14, .2); }, { px: 160 }); l.g.add(bed);
		const pt = puppet({ h: 2.3, skin: C.pele1, shirt: '#E8E6EF', pants: '#9FB0CF', hair: 'curto', hairColor: '#5A3A22' }); pt.rotation.z = -Math.PI / 2; l.g.add(pt);
		const front = cut('mriFront', 3.9, 2.9, g => {
			g.fillStyle = '#F7F7FA'; rrect(g, -1.85, -1.3, 3.7, 2.6, .45); g.fill();
			g.fillStyle = C.azul; g.fillRect(-1.85, -.62, 3.7, .2); g.fillStyle = '#1A2035'; g.beginPath(); g.ellipse(-1.62, .08, .22, .5, 0, 0, TAU); g.fill();
			txt(g, 'RM', .6, .55, .34, { font: FONT.sans, weight: '900', color: 'rgba(43,89,195,.6)' });
			g.fillStyle = '#B8F5D8'; rrect(g, .9, -1.1, .65, .34, .05); g.fill();
		}, { px: 200 }); front.position.set(.95, 1.6, .5); l.g.add(front);
		const arcs = [0, 1, 2].map(i => { const r = ribbon(arcPts(0, 0, .5 + i * .35, .3 + i * .2, Math.PI * .15, Math.PI * .85, 30), .06, C.azul); r.position.set(.95, 3.3, .3); l.g.add(r); return r; });
		const beep = textCut('beep', 'BEEP!', { size: .5, bg: C.amar, border: .04, pad: .12 }); beep.position.set(1.9, 4.2, .6); beep.rotation.z = .15; l.g.add(beep);
		l.update = T => {
			const k = ease.expoInOut(seg(T, 20.95, 21.9));
			bed.position.set(-1.4 + k * 1.6, .55, .2); pt.position.set(-3.25 + k * 1.6, .95, .25);
			pt.pose({ eyes: k > .1 ? 'closed' : 'dot', mouth: 'smile', armL: 0, armR: 0, blink: blinkAt(T, 6) });
			arcs.forEach((a, i) => { const ph = ((T - 21.8 - i * .18) % .9 + .9) % .9; a.reveal(T > 21.8 + i * .18 ? 1 : 0); a.scale.setScalar(.8 + ph * .5); a.material.opacity = 1 - ph; a.material.transparent = true; });
			show(beep, pop(T, 21.85) * (T < 22.45 ? 1 : 0)); beep.rotation.z = .15 + sw(T, 3, .05);
		};
	}

	// ═════ L4 · hipnotizar (rosa + espiral) ═════
	const VOL = [{ skin: C.pele2, shirt: C.amar, hair: 'cacheado', hairColor: C.tinta, pants: '#2E3B5E' }, { skin: C.pele1, shirt: C.lilas, hair: 'franja', hairColor: '#8B5A2B', pants: '#3B3F4A' }, { skin: C.pele3, shirt: C.laranja, hair: 'curto', hairColor: C.tinta, pants: '#2E2E3A' }];
	{
		const l = add(loc(36, 0, C.rosa, { seed: 7 }));
		const disc = cut('spiralDisc', 5.2, 5.2, g => { const n = 12; for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? '#FFFFFF' : '#E8718F'; g.beginPath(); g.moveTo(0, 0); for (let j = 0; j <= 30; j++) { const u = j / 30, a = (i + u) / n * TAU; g.lineTo(Math.cos(a) * 2.5, Math.sin(a) * 2.5); } g.closePath(); g.fill(); } }, { px: 160, border: .05 });
		const discW = new THREE.Group(); discW.position.set(.9, 2.7, .04); discW.add(disc); l.g.add(discW);
		// espiral real por cima das fatias: desenhada como uma fita
		const sp = ribbon(Array.from({ length: 220 }, (_, i) => { const u = i / 219, a = u * 4.5 * TAU, r = u * 2.4; return [Math.cos(a) * r, Math.sin(a) * r, .4 + u * 1.2]; }), .16, C.tinta); sp.position.z = .02; discW.add(sp);
		const s = puppet({ h: 3.0, ...SPIEGEL }); s.position.set(-2.15, -.8, .12); l.g.add(s);
		const W = watch(1.15); s.handR.add(W.g); W.g.position.z = .05;
		const ps = VOL.map((v, i) => { const p = puppet({ h: 2.3, ...v }); p.position.set(.15 + i * 1.0, -.7, .1 + i * .05); l.g.add(p); return p; });
		const caps = ps.map(p => { const c = cut('eegcap', 1.4, 1.0, capDraw, { px: 260 }); c.position.set(0, .75 * p.u, .1); c.scale.setScalar(p.u); p.neck.add(c); return c; });
		l.update = T => {
			discW.rotation.z = -(T - 32) * 1.4;
			const sw0 = Math.sin(TAU * .7 * (T - 32.7));
			const armR = 1.62;
			s.pose({ armR, armL: -.15, eyes: 'dot', look: 1, mouth: 'smile', brow: .2, blink: blinkAt(T, 8), head: -.05 });
			W.g.rotation.z = -armR + sw0 * .5;
			const ramp = seg(T, 33.0, 34.0);
			ps.forEach((p, i) => {
				const tr = T > 33.7 + i * .15;
				p.pose({ lean: ramp * .1 * Math.sin(TAU * .7 * (T - 32.7) - .6), head: ramp * .12 * Math.sin(TAU * .7 * (T - 32.7) - .9), eyes: tr ? 'spiral' : 'dot', look: tr ? 0 : -1, mouth: tr ? 'flat' : 'smile', armL: -.08, armR: .08, blink: tr ? 0 : blinkAt(T, 9 + i) });
				show(caps[i], pop(T, 35.75 + i * .12)); caps[i].scale.multiplyScalar(p.u);
			});
		};
	}

	// ═════ L5 · dentro do cérebro (azul-noite) ═════
	const brainLoc = add(loc(48, 0, C.noite, { seed: 8, deco: dots('rgba(255,255,255,.08)') }));
	{
		const l = brainLoc, B = brain(); B.position.set(0, 2.05, .1); l.g.add(B);
		const notes = [1, 2, 3].map((n, i) => { const m = sticky(n, [C.amar, C.laranja, '#7FD1AE'][i]); m.position.set(-1.5 + i * 1.5, 4.65, .3); m.rotation.z = [-.08, .04, .1][i]; l.g.add(m); return m; });
		const lab = (k, t, x, y, bg) => { const m = tape('lab' + k, t, { size: .25, bg }); m.position.set(x, y, .7); l.g.add(m); return m; };
		const lA = lab('A', 'CINGULADO ANTERIOR', -.95, 1.35, C.amar), lP = lab('P', 'PRÉ-FRONTAL', -1.65, 1.0, '#9DBBF5'), lC = lab('C', 'CINGULADO POSTERIOR', 1.05, 1.0, '#F9B27A');
		const lS = lab('S', 'SENSORIAL', 1.55, 3.55, '#9BE3C4'), lE = lab('E', 'EMOCIONAL', -.4, .55, '#F7A1B5');
		const can = () => cut('can', .5, .55, g => { g.fillStyle = '#B9BDC8'; rrect(g, -.2, -.22, .4, .44, .05); g.fill(); g.strokeStyle = '#8A8E99'; g.lineWidth = .03; for (const y of [-.12, .12]) { g.beginPath(); g.moveTo(-.2, y); g.lineTo(.2, y); g.stroke(); } }, { px: 240 });
		const canA = can(), canB = can(); canA.position.set(-1.75, 2.85, .55); canB.position.set(1.1, 3.0, .55); canA.rotation.z = -.5; canB.rotation.z = .5; l.g.add(canA, canB);
		const N = 40, str = ribbon(Array.from({ length: N + 1 }, () => [0, 0]), .035, C.tinta); str.position.z = .5; l.g.add(str);
		const dotsS = [0, 1, 2].map(i => { const m = cut('sdot', .3, .3, g => circle(g, 0, 0, .09, C.amar), { border: 0 }); m.position.z = .56; l.g.add(m); return m; });
		const rings = ['sens', 'emo'].map(k => { const r = ribbon(arcPts(0, 0, .5, .5, 0, TAU, 40), .05, k === 'sens' ? '#3BAF85' : C.verm, { opacity: .9 }); r.position.set(B.position.x + (k === 'sens' ? .3 : -.3), B.position.y + (k === 'sens' ? 1.38 : -.68), .5); l.g.add(r); return r; });
		l.update = T => {
			B.scale.setScalar(1 + sw(T, .5, .008));
			const active = T < 49.55 ? 0 : T < 63.45 ? 1 : 2;
			notes.forEach((m, i) => { const k = pop(T, 38.6 + i * .2); const on = T > 40 && i === active; m.visible = k > .002; m.scale.setScalar(Math.max(.002, k) * (T > 40 ? (on ? 1.2 : .82) : 1)); m.position.z = on ? .4 : .3; });
			const a = ease.expoOut(seg(T, 41.8, 42.2)) * (T < 49.5 ? 1 : .5);
			B.light('accA', a, T < 49.5 ? a : 0); show(lA, pop(T, 42.0) * gone(T, 44.7));
			const pf = ease.expoOut(seg(T, 51.7, 52.0)), pc = ease.expoOut(seg(T, 53.7, 54.0));
			B.light('pref', pf * (T < 63.4 ? 1 : .5), T < 56.5 ? pf : 0); B.light('accP', pc * (T < 63.4 ? 1 : .5), T < 56.5 ? pc : 0);
			show(lP, pop(T, 51.85) * gone(T, 56.4)); show(lC, pop(T, 53.85) * gone(T, 56.4));
			const sS = ease.expoOut(seg(T, 63.9, 64.2)), sE = ease.expoOut(seg(T, 64.2, 64.5));
			B.light('sens', sS, sS); B.light('emo', sE, sE); show(lS, pop(T, 64.0)); show(lE, pop(T, 64.3));
			const phase = 1 - ease.cubicInOut(seg(T, 64.4, 65.3));
			rings.forEach((r, i) => { const t = T - 63.9, per = i ? .8 + phase * .25 : .8, u = ((t + (i ? phase * .35 : 0)) % per + per) % per / per; r.visible = T > 63.9; r.scale.setScalar(.6 + u * 1.2); r.material.opacity = (1 - u) * .9; });
			// telefone de lata
			const canK = pop(T, 49.8) * (T < 56.5 ? 1 : 0); show(canA, canK); show(canB, canK);
			const slack = ease.cubicInOut(seg(T, 50.6, 51.6)), A0 = [-1.75 + .18, 2.85 + .12], B0 = [1.1 - .18, 3.0 + .12];
			const pts = []; for (let i = 0; i <= N; i++) { const v = i / N; pts.push([lerp(A0[0], B0[0], v), lerp(A0[1], B0[1], v) - Math.sin(v * Math.PI) * (.05 + slack * 1.25) + Math.sin(v * 13) * slack * .04]); }
			str.setPoints(pts); str.reveal(seg(T, 49.85, 50.15) * (T < 56.5 ? 1 : 0)); str.material.color.set(slack > .5 ? '#6E6B78' : C.tinta);
			dotsS.forEach((m, i) => { const v = ((T - 49.9) * 1.4 + i / 3) % 1; m.visible = T > 50.0 && T < 50.6 + i * .1; const p = pts[Math.round(v * N)]; if (p) m.position.set(p[0], p[1], .56); });
		};
	}

	// ═════ L5b · atenção focada (folha preta, lanterna) ═════
	{
		const l = add(loc(48, -16, '#15151B', { seed: 9 }));
		const lamp = cut('lamp', 1.6, 1.2, g => { g.fillStyle = '#C9CBD3'; g.beginPath(); g.moveTo(-.25, -.5); g.lineTo(.25, -.5); g.lineTo(.62, .35); g.lineTo(-.62, .35); g.closePath(); g.fill(); g.fillStyle = '#FFF3B0'; g.beginPath(); g.ellipse(0, .38, .6, .1, 0, 0, TAU); g.fill(); g.fillStyle = '#555'; g.fillRect(-.04, -.95, .08, .45); }, { px: 220 });
		lamp.position.set(0, 5.05, .3); l.g.add(lamp);
		const beam = cut('beam', 4.2, 4.6, g => { const gr = g.createLinearGradient(0, -2.3, 0, 2.3); gr.addColorStop(0, 'rgba(255,236,150,.65)'); gr.addColorStop(1, 'rgba(255,236,150,.35)'); g.fillStyle = gr; g.beginPath(); g.moveTo(-.5, -2.3); g.lineTo(.5, -2.3); g.lineTo(2.0, 2.3); g.lineTo(-2.0, 2.3); g.closePath(); g.fill(); }, { border: 0, grainK: 0, shadow: false, anchor: [0, 2.3] });
		beam.position.set(0, 4.95, .25); beam.material.depthWrite = false; l.g.add(beam);
		const spot = cut('spotEll', 4.4, 1.2, g => { g.fillStyle = 'rgba(255,236,150,.4)'; g.beginPath(); g.ellipse(0, 0, 2.1, .5, 0, 0, TAU); g.fill(); }, { border: 0, grainK: 0, shadow: false }); spot.position.set(0, .35, .06); spot.material.depthWrite = false; l.g.add(spot);
		const w = watch(.1).w; w.position.set(0, .95, .3); l.g.add(w);
		const D = [
			['phone', -1.95, 3.0, 45.55, g => { g.fillStyle = C.tinta; rrect(g, -.32, -.55, .64, 1.1, .1); g.fill(); g.fillStyle = '#7FB6FF'; rrect(g, -.26, -.45, .52, .85, .05); g.fill(); circle(g, .3, -.52, .17, C.verm); txt(g, '3', .3, -.51, .22, { font: FONT.sans, weight: '900', color: '#fff' }); }, 1.0, 1.4],
			['clock', 1.95, 3.5, 46.0, g => { circle(g, 0, .05, .45, C.verm); circle(g, 0, .05, .36, '#fff'); circle(g, -.33, -.38, .13, C.verm); circle(g, .33, -.38, .13, C.verm); g.strokeStyle = C.tinta; g.lineWidth = .05; g.beginPath(); g.moveTo(0, .05); g.lineTo(0, -.2); g.moveTo(0, .05); g.lineTo(.16, .12); g.stroke(); }, 1.1, 1.1],
			['chat', -1.9, 1.15, 46.45, g => { g.fillStyle = '#fff'; rrect(g, -.6, -.35, 1.2, .62, .2); g.fill(); g.beginPath(); g.moveTo(-.3, .25); g.lineTo(-.45, .5); g.lineTo(-.05, .27); g.fill(); txt(g, '...?', 0, -.05, .32, { font: FONT.sans, weight: '900' }); }, 1.4, 1.1],
			['mega', 2.0, 1.35, 46.9, g => { g.fillStyle = C.amar; g.beginPath(); g.moveTo(-.45, -.15); g.lineTo(.35, -.45); g.lineTo(.35, .45); g.lineTo(-.45, .15); g.closePath(); g.fill(); g.fillStyle = C.tinta; g.fillRect(-.58, -.16, .15, .32); txt(g, 'BLÁ', .02, .72, .26, { font: FONT.sans, weight: '900', color: '#fff' }); }, 1.3, 1.7],
		].map(([k, x, y, tf, dr, ww, hh]) => { const m = cut('dis' + k, ww, hh, dr, { px: 220 }); m.position.set(x, y, .35); l.g.add(m); return { m, x, y, tf, ph: rng() * 9 }; });
		l.update = T => {
			const nar = ease.expoInOut(seg(T, 46.4, 48.0));
			beam.scale.set(lerp(1, .36, nar), 1, 1); spot.scale.set(lerp(1, .38, nar), 1, 1);
			const glow = 1 + .1 * Math.exp(-Math.max(0, T - 47.6) * 4) * (T > 47.6);
			w.scale.setScalar(glow); w.rotation.z = sw(T, .4, .05);
			for (const d of D) {
				const f = Math.max(0, T - d.tf);
				d.m.position.set(d.x + sw(T, 11, .03, d.ph) * (f === 0), d.y - 9 * f * f, .35); d.m.rotation.z = sw(T, 13, .06, d.ph) * (f === 0) + f * 3 * Math.sign(d.x);
				d.m.visible = d.m.position.y > -6;
			}
		};
	}

	// ═════ L6b · o "juiz" do sistema crítico ═════
	{
		const l = add(loc(60, -16, '#E9D9BE', { seed: 10, deco: g => { g.strokeStyle = 'rgba(120,80,40,.18)'; g.lineWidth = .05; for (let x = -8; x < 8; x += .7) { g.beginPath(); g.moveTo(x, -10); g.lineTo(x, 10); g.stroke(); } } }));
		const j = puppet({ h: 3.4, skin: C.pele2, gown: true, hair: 'grisalho', hairColor: '#D9D6DE', glasses: true }); j.position.set(.55, -.45, .1); l.g.add(j);
		const gavel = cut('gavel', 1.0, .8, g => { g.fillStyle = '#8B5A2B'; g.fillRect(-.05, -.05, .1, .45); g.fillStyle = '#6B3F1E'; rrect(g, -.32, -.22, .64, .26, .06); g.fill(); g.fillStyle = '#C9A27A'; g.fillRect(-.33, -.13, .66, .06); }, { px: 240, anchor: [0, -.3] });
		gavel.position.set(0, 0, .05); gavel.rotation.z = -Math.PI / 2; j.handR.add(gavel);
		const desk = cut('desk', 3.9, 1.9, g => { g.fillStyle = '#9C6B3E'; g.fillRect(-1.85, -.85, 3.7, 1.7); g.fillStyle = '#7E5530'; g.fillRect(-1.95, -.9, 3.9, .22); g.strokeStyle = 'rgba(60,35,15,.3)'; g.lineWidth = .03; for (let y = -.5; y < .85; y += .3) { g.beginPath(); g.moveTo(-1.85, y); g.lineTo(1.85, y); g.stroke(); } }, { px: 180 });
		desk.position.set(.55, .2, .5); l.g.add(desk);
		const sign = tape('signCrit', 'SISTEMA CRÍTICO', { size: .42, bg: C.creme }); sign.position.set(.55, .55, .6); l.g.add(sign);
		const NOTES = [['VOCÊ ESTÁ\nRELAXADO', 56.5, 57.3, 1], ['SEU BRAÇO\nESTÁ LEVE', 58.2, 59.0, 1], ['VOCÊ SENTE\nCALOR', 60.95, 0, 0], ['O TEMPO PASSA\nDEVAGAR', 61.75, 0, 0]].map(([t, t0, tb, rej], i) => { const m = textCut('note' + i, t, { size: .3, bg: '#FFFFFF', border: .04, pad: .14, lineGap: 1.15 }); l.g.add(m); return { m, t0, tb, rej, i }; });
		const X = NOTES.slice(0, 2).map(() => { const r = ribbon(handPath([[-.45, .3], [.45, -.3]], { step: .04 }), .1, C.verm); const r2 = ribbon(handPath([[.45, .3], [-.45, -.3]], { step: .04, seed: 8 }), .1, C.verm); const g = new THREE.Group(); g.add(r, r2); l.g.add(g); return { g, r, r2 }; });
		const zzz = textCut('zzz', 'Zzz', { size: .7, color: C.azul, border: .05 }); zzz.position.set(1.4, 4.35, .8); l.g.add(zzz);
		l.update = T => {
			const bangs = [57.3, 59.0]; let armR = .9 + sw(T, .5, .04);
			for (const tb of bangs) { if (T > tb - .35 && T < tb + .3) { const u = T < tb ? ease.cubicInOut(seg(T, tb - .35, tb - .12)) : 1 - ease.expoOut(seg(T, tb, tb + .08)); armR = lerp(1.25, 2.75, T < tb - .12 ? u : u); if (T >= tb - .12 && T < tb) armR = lerp(2.75, 1.3, ease.expoIn(seg(T, tb - .12, tb))); } }
			const sleepy = seg(T, 60.4, 60.9), asleep = T > 60.9;
			if (T > 60.3) armR = lerp(armR, .15, ease.cubicInOut(seg(T, 60.4, 61.2)));
			const bang = bangs.some(tb => T > tb && T < tb + .2);
			j.pose({ armR, armL: T > 60.3 && T < 60.95 ? lerp(-.1, -2.6, ease.cubicInOut(seg(T, 60.3, 60.5))) * (1 - seg(T, 60.75, 60.95)) - .1 : -.1,
				eyes: asleep ? 'sleep' : T > 60.3 ? 'closed' : bang ? 'wide' : 'dot', mouth: T > 60.3 && T < 60.95 ? 'yawn' : asleep ? 'o' : bang ? 'o' : 'frown',
				brow: asleep ? -.3 : 0, browTilt: asleep ? .3 : -1, head: asleep ? .22 + sw(T, .35, .03) : 0, lean: asleep ? .06 : 0, blink: asleep || T > 60.3 ? 0 : blinkAt(T, 11), bob: bang ? -.04 : 0 });
			desk.position.y = .2 + (bang ? -.03 : 0);
			for (const n of NOTES) {
				const m = n.m; let x, y, r = 0, s = 1, v = true;
				if (n.rej) {
					const fly = ease.expoOut(seg(T, n.t0, n.t0 + .7)); x = lerp(-4.6, -1.15, fly); y = 2.9 - n.i * .1 + sw(T, .7, .06); r = sw(T, .9, .08, n.i);
					const f = Math.max(0, T - n.tb - .1); if (f > 0) { s = Math.max(.25, 1 - f * 2.4); x -= f * 2.2; y -= 7 * f * f; r += f * 6; }
					v = T > n.t0 && y > -6;
					const xg = X[n.i]; xg.g.position.set(x, y, .7); xg.g.scale.setScalar(s); xg.g.rotation.z = r; xg.r.reveal(seg(T, n.tb, n.tb + .1)); xg.r2.reveal(seg(T, n.tb + .08, n.tb + .18)); xg.g.visible = v;
				} else { const u = seg(T, n.t0, n.t0 + 1.4); x = lerp(-4.8, 4.8, u); y = 4.3 - (n.i - 2) * .8 + Math.sin(u * TAU) * .2; r = sw(T, .8, .1, n.i); v = u > 0 && u < 1; }
				m.position.set(x, y, .75); m.rotation.z = r; m.scale.setScalar(s); m.visible = v;
			}
			const zk = pop(T, 61.15); show(zzz, zk); zzz.position.y = 4.35 + Math.max(0, T - 61.15) * .15; zzz.rotation.z = sw(T, .6, .08);
		};
	}

	// ═════ L7 · metrônomos (creme) ═════
	{
		const l = add(loc(60, 0, C.creme, { seed: 11, deco: dots('rgba(28,27,34,.08)') }));
		const mk = (k, icon, col) => {
			const g = new THREE.Group();
			const body = cut('met' + k, 2.0, 3.0, gg => {
				gg.fillStyle = '#B5835A'; gg.beginPath(); gg.moveTo(-.35, -1.35); gg.lineTo(.35, -1.35); gg.lineTo(.85, 1.3); gg.lineTo(-.85, 1.3); gg.closePath(); gg.fill();
				gg.fillStyle = '#F3E6CF'; gg.beginPath(); gg.moveTo(-.18, -1.15); gg.lineTo(.18, -1.15); gg.lineTo(.45, .55); gg.lineTo(-.45, .55); gg.closePath(); gg.fill();
				gg.strokeStyle = 'rgba(28,27,34,.4)'; gg.lineWidth = .02; for (let y = -1.0; y < .5; y += .15) { gg.beginPath(); gg.moveTo(-.1, y); gg.lineTo(.1, y); gg.stroke(); }
				icon(gg, 0, .92);
			}, { px: 200 });
			body.position.set(0, 1.5, .1); g.add(body);
			const rod = new THREE.Group(); rod.position.set(0, .6, .2); g.add(rod);
			const arm = cut('metRod', .5, 2.6, gg => { gg.fillStyle = C.tinta; gg.fillRect(-.03, -1.25, .06, 2.4); gg.fillStyle = col; rrect(gg, -.17, -.75, .34, .26, .05); gg.fill(); }, { px: 200, anchor: [0, -1.2] });
			rod.add(arm); g.rod = rod; g.body = body; return g;
		};
		const eye = (g, x, y) => { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, y, .32, .17, 0, 0, TAU); g.fill(); circle(g, x, y, .1, '#1F7A55'); circle(g, x, y, .045, C.tinta); };
		const heart = (g, x, y) => { g.fillStyle = C.verm; g.beginPath(); g.moveTo(x, y + .2); g.bezierCurveTo(x - .4, y - .05, x - .2, y - .35, x, y - .12); g.bezierCurveTo(x + .2, y - .35, x + .4, y - .05, x, y + .2); g.fill(); };
		const A = mk('S', eye, '#3BAF85'), B = mk('E', heart, C.verm); A.position.set(-1.35, 0, .1); B.position.set(1.35, 0, .1); l.g.add(A, B);
		const tA = tape('metS', 'SENSORIAL', { size: .42, bg: '#9BE3C4' }), tB = tape('metE', 'EMOCIONAL', { size: .42, bg: '#F7A1B5' });
		tA.position.set(-1.35, -.4, .5); tB.position.set(1.35, -.4, .5); l.g.add(tA, tB);
		const heartsP = [0, 1, 2].map(i => { const m = cut('spark', .5, .5, g => { g.fillStyle = C.amar; g.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * TAU - Math.PI / 2, r = k % 2 ? .09 : .22; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); }, { border: .03 }); m.position.set(-.8 + i * .8, 4.3 + (i % 2) * .3, .5); l.g.add(m); return m; });
		l.update = T => {
			const ph = Math.PI * .95 * (1 - ease.cubicInOut(seg(T, 66.6, 68.2))), w = TAU * .8;
			A.rod.rotation.z = .42 * Math.sin(w * (T - 63));
			B.rod.rotation.z = .42 * Math.sin(w * (T - 63) * (1 + .25 * (ph / Math.PI)) + ph);
			A.scale.setScalar(1 + .1 * Math.exp(-Math.max(0, T - 65.55) * 5) * (T > 65.55)); B.scale.setScalar(1 + .1 * Math.exp(-Math.max(0, T - 66.95) * 5) * (T > 66.95));
			show(tA, pop(T, 65.6)); show(tB, pop(T, 67.0));
			heartsP.forEach((m, i) => { show(m, pop(T, 68.15 + i * .08) * gone(T, 68.6)); m.rotation.z = T; });
		};
	}

	// ═════ L7b · nuvens de pensamento (azul-claro) ═════
	{
		const l = add(loc(72, 0, C.azulc, { seed: 12, deco: dots('rgba(255,255,255,.3)') }));
		const pa = puppet({ h: 2.6, ...VOL[1] }), pb = puppet({ h: 2.6, skin: C.pele3, shirt: '#3B6FE0', hair: 'curto', hairColor: C.tinta, pants: '#2E2E3A' });
		pa.position.set(-1.5, -.7, .1); pb.position.set(1.5, -.7, .1); l.g.add(pa, pb);
		const cloudD = g => { for (const [x, y, r] of [[-.75, .15, .6], [0, -.25, .78], [.75, .1, .62], [0, .38, .62], [-.35, .3, .5], [.4, .35, .5]]) circle(g, x, y, r, '#fff'); };
		const mkCloud = (k, x) => { const g = new THREE.Group(); g.position.set(x, 3.5, .2); g.add(cut('cloud', 3.1, 2.4, cloudD, { px: 180, border: .05 })); l.g.add(g); const bs = [[.45, -1.55, .12], [.25, -1.15, .18]].map(([bx, by, r], i) => { const m = cut('cb' + i, r * 2.4, r * 2.4, gg => circle(gg, 0, 0, r, '#fff'), { border: .03 }); m.position.set(bx * (x < 0 ? 1 : -1), by, 0); g.add(m); return m; }); return g; };
		const ca = mkCloud('a', -1.5), cb = mkCloud('b', 1.5);
		const sketch = cut('beachSketch', 2.4, 1.7, g => { g.strokeStyle = '#7C7A82'; g.lineWidth = .025; circle(g, .6, -.4, .22, null, '#7C7A82', .025); g.beginPath(); for (let x = -1.0; x <= 1.0; x += .05) g.lineTo(x, .2 + Math.sin(x * 9) * .05); g.stroke(); g.beginPath(); g.moveTo(-1.0, .5); g.quadraticCurveTo(0, .35, 1.0, .5); g.stroke(); g.beginPath(); g.moveTo(-.55, .48); g.quadraticCurveTo(-.5, -.1, -.65, -.4); g.stroke(); for (const a of [-.8, -.3, .2, .6]) { g.beginPath(); g.moveTo(-.65, -.4); g.quadraticCurveTo(-.65 + Math.cos(a) * .3, -.55, -.65 + Math.cos(a) * .55, -.3 + Math.sin(a) * .1); g.stroke(); } }, { border: 0, grainK: .3 });
		const sk2 = sketch.clone(); sk2.material = sketch.material.clone(); sketch.position.set(0, .05, .06); ca.add(sketch); sk2.position.set(0, .05, .06); cb.add(sk2);
		const layers = [
			['sky', 0, .1, .07, g => { g.fillStyle = '#8FD3FF'; rrect(g, -1.15, -.75, 2.3, 1.1, .3); g.fill(); }, 2.4, 1.6],
			['sea', 0, -.25, .12, g => { g.fillStyle = C.azul; g.beginPath(); g.moveTo(-1.15, -.05); for (let x = -1.15; x <= 1.15; x += .05) g.lineTo(x, -.05 + Math.sin(x * 9) * .05); g.lineTo(1.15, .3); g.lineTo(-1.15, .3); g.closePath(); g.fill(); }, 2.4, .7],
			['sand', 0, -.5, .16, g => { g.fillStyle = '#F6D58E'; g.beginPath(); g.moveTo(-1.1, .1); g.quadraticCurveTo(0, -.12, 1.1, .1); g.lineTo(1.1, .25); g.lineTo(-1.1, .25); g.closePath(); g.fill(); }, 2.3, .6],
			['sun', .6, .45, .2, g => { circle(g, 0, 0, .24, C.amar); g.strokeStyle = C.amar; g.lineWidth = .05; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.beginPath(); g.moveTo(Math.cos(a) * .32, Math.sin(a) * .32); g.lineTo(Math.cos(a) * .44, Math.sin(a) * .44); g.stroke(); } }, 1.0, 1.0],
			['palm', -.6, -.05, .24, g => { g.strokeStyle = '#8B5A2B'; g.lineWidth = .08; g.beginPath(); g.moveTo(.05, .5); g.quadraticCurveTo(.1, 0, 0, -.35); g.stroke(); g.fillStyle = '#2FA36B'; for (const a of [-2.6, -2.0, -1.2, -.5]) { g.beginPath(); g.ellipse(Math.cos(a) * .25, -.38 + Math.sin(a) * .1, .3, .08, a, 0, TAU); g.fill(); } }, 1.0, 1.2],
		].map(([k, x, y, z, dr, ww, hh]) => { const m = cut('beach' + k, ww, hh, dr, { px: 200, border: .03 }); m.position.set(x, y, z); ca.add(m); return m; });
		const lA = tape('lblCom', 'COM HIPNOSE', { size: .36, bg: C.amar }), lB = tape('lblSem', 'SEM HIPNOSE', { size: .36, bg: '#D5D3DA' });
		lA.position.set(-1.5, 5.15, .6); lB.position.set(1.5, 5.15, .6); l.g.add(lA, lB);
		l.update = T => {
			pa.pose({ eyes: 'closed', mouth: T > 70.5 ? 'grin' : 'smile', head: sw(T, .3, .05), lean: sw(T, .3, .02), armL: -.1, armR: .1, brow: .2 });
			pb.pose({ eyes: 'dot', mouth: 'flat', look: -.6, blink: blinkAt(T, 13), armL: -.1, armR: .1, brow: -.2 });
			show(ca, pop(T, 68.55, .35) * (1 + .12 * ease.expoOut(seg(T, 71.4, 71.6)) - .12 * ease.cubicInOut(seg(T, 72.2, 72.9))));
			sketch.material.opacity = 1 - seg(T, 69.0, 69.6);
			layers.forEach((m, i) => { const k = pop(T, 69.0 + i * .3, .4); m.visible = k > .002; m.scale.setScalar(Math.max(.002, k)); });
			layers[3].rotation.z = T * .6;
			show(cb, pop(T, 73.1, .35)); show(lA, pop(T, 73.35)); show(lB, pop(T, 73.55));
		};
	}

	// ═════ L8 · conclusão + carimbo (azul) ═════
	{
		const l = add(loc(84, 0, C.azul, { seed: 13, h: 21, cy: -1.8, deco: dots('rgba(255,255,255,.12)') }));
		const s = puppet({ h: 3.0, ...SPIEGEL }); s.position.set(-1.55, -.75, .1); l.g.add(s);
		const B = brain(); B.scale.setScalar(.52); B.position.set(1.1, 2.75, .15); l.g.add(B);
		const pad = notepad('e', ['REAL', 'MENSURÁVEL', 'REPLICÁVEL']); pad.g.position.set(0, -2.15, .6); pad.g.rotation.z = .015; l.g.add(pad.g);
		const st = stamp('A HIPNOSE', 'EXISTE'); st.position.set(.1, -4.95, .9); l.g.add(st);
		l.update = T => {
			const thumbs = T > 81.3;
			s.pose({ armR: thumbs ? lerp(2.2, 2.85, ease.backOut(seg(T, 81.3, 81.6))) : T < 79.2 ? 2.2 + sw(T, .5, .04) : 1.0, armL: -.12, eyes: thumbs ? 'happy' : 'dot', look: T < 79.2 ? 1 : 0, mouth: thumbs ? 'grin' : 'smile', brow: .3, blink: thumbs ? 0 : blinkAt(T, 14), head: sw(T, .4, .04), bob: Math.abs(sw(T, 1, .03)) });
			for (const k of ['accA', 'pref', 'accP', 'sens', 'emo']) B.light(k, .85 + .15 * Math.sin(T * 3 + k.length), .3);
			pad.g.position.y = lerp(-9, -2.15, ease.expoOut(seg(T, 78.95, 79.3))); pad.g.visible = T > 78.9;
			pad.rows.forEach((r, i) => { const t0 = [79.3, 80.3, 81.3][i]; show(r.t, 1); r.q.visible = false; r.ck.reveal(seg(T, t0, t0 + .25)); });
			const k = ease.expoIn(seg(T, 86.2, 86.4)); st.visible = T > 86.2; st.scale.setScalar(lerp(1.5, 1, k)); st.rotation.z = lerp(-.25, -.05, k); st.material.opacity = k < 1 ? .6 + k * .4 : 1;
		};
	}

	return L;
}
