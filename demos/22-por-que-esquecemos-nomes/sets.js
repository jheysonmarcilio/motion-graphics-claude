// Mundo do Short 22 (Por que esquecemos nomes — explainer flat). Estrutura de câmera/sets do 06:
// cada set é um cenário deslocado 100 u em X; conteúdo vital entre y≈1,4 e y≈8,4 (legendas abaixo).
// Herói: o gancho laranja (props.js → hook). Tempos = narração (fala.json / words.json).
import * as THREE from 'three';
import { clamp, seg, lerp, ease, pop, gone, win, mulberry32 } from './lib.js';
import { P, mat, mesh, raise, box, disc, poly, limb, stroke, plate, text, star, person, blinkAt } from './flat.js';
import { hook, ghostHook, tag, blob, bread, oven, moon, cup, teacup, calendar, balance, flashlight, dumbbell, houseHead, mustache, bakerHat, apron, longHair } from './props.js';

export const SET = { FACE: 0, YOU: 1, SPLIT: 2, CAL: 3, LAB: 4, HOOK: 5, LONE: 6, MEET: 7, HOUSE: 8, RECAP: 9, TRICK: 10, END: 11 };
export const BG = [P.creme, P.agua, P.lilas, P.creme, P.coral, P.mostarda, P.lilas, P.coral, P.creme, P.agua, P.mostarda, P.creme];
const show = (o, k) => { o.visible = k > .002; if (o.visible) o.scale.setScalar(Math.max(k, 1e-4)); };
const fade = (o, a) => { o.visible = a > .01; o.traverse(m => { if (m.isMesh) m.material.opacity = a; }); };
const VOCE = '#1F7A70';

// partículas decorativas que flutuam (micro-animação de fundo)
function deco(g, seed, cols, cx = 0, cy = 4.6, w = 9, h = 11, n = 14) {
	const r = mulberry32(seed), items = [];
	for (let i = 0; i < n; i++) {
		const c = cols[i % cols.length], k = r();
		let o; if (k < .5) o = disc(.07 + r() * .08, { c, line: 0 }); else { o = new THREE.Group(); const a = limb(.07, { c, line: 0 }), b = limb(.07, { c, line: 0 }); a.set(-.15, 0, .15, 0); b.set(0, -.15, 0, .15); o.add(a, b); }
		const x = cx + (r() - .5) * w, y = cy + (r() - .5) * h, ph = r() * 6, sp = .3 + r() * .4;
		g.add(o); items.push({ o, x, y, ph, sp });
	}
	return T => items.forEach(({ o, x, y, ph, sp }) => { o.position.set(x + Math.sin(T * sp + ph) * .15, y + Math.sin(T * sp * .8 + ph * 2) * .25, 0); o.rotation.z = T * sp * .5 + ph; });
}
const mkPerson = (o, sc, x, y) => { const U = person(o); U.g.scale.setScalar(sc); U.g.position.set(x, y, 0); return U; };

export function buildWorld() {
	const root = new THREE.Group(), sets = [], U = [];
	const mk = i => { const g = new THREE.Group(); g.position.x = i * 100; root.add(g); g.add(mesh(new THREE.PlaneGeometry(96, 96), BG[i])); sets[i] = g; return g; };

	// ═══ 0 · rosto nítido + crachá que evapora (0–2,6) ═══
	{
		const g = mk(SET.FACE), dc = deco(g, 11, [P.lilas, P.agua, P.mostarda]);
		const ring = stroke(40, .14, { c: P.agua, line: .06 }); g.add(ring);
		const man = mkPerson({ shirt: P.lilas, hair: P.cabelo }, 1.9, 0, -1.0); g.add(man.g); mustache(man);
		const card = box(3.8, 2.0, { r: .14, c: P.branco, shadow: .14 }); card.position.set(0, 1.85, 0); g.add(card);
		const hd = plate(['OLÁ, MEU NOME É'], { w: 3.5, h: .55, bg: P.coral, fg: P.creme, shadow: 0, radius: .1 }); hd.position.set(0, 2.5, 0); g.add(hd);
		const L = [...'PADEIRO'].map((ch, i) => { const t = text(ch, { w: .5, h: .85, fg: P.tinta }); t.position.set((i - 3) * .46, 1.5, 0); g.add(t); return t; });
		const q = text('???', { w: 2.2, h: 1.0, fg: P.coral }); q.position.set(0, 1.5, 0); g.add(q);
		const puffs = L.map(() => { const p = disc(.18, { line: 0, fillMat: mat(P.cinza, 0) }); g.add(p); return p; });
		U.push(T => {
			dc(T);
			ring.set(u => [Math.cos(Math.PI / 2 - u * Math.PI * 2) * 2.55, 5.25 + Math.sin(Math.PI / 2 - u * Math.PI * 2) * 2.55], ease.cubicOut(seg(T, 0, 1.0)));
			const k = pop(T, 0, .5); man.g.scale.setScalar(1.9 * (.8 + .2 * k));
			man.g.setPose({ look: [Math.sin(T * .8) * .3, 0], blink: blinkAt(T, 2), mouth: T > 1.6 ? 'o' : 'smile', brow: T > 1.6 ? .6 : 0, tilt: Math.sin(T * 1.1) * .03 });
			show(card, pop(T, .45, .4)); show(hd, pop(T, .55, .35));
			L.forEach((t, i) => { const t0 = 1.6 + i * .06, u = seg(T, t0, t0 + .45); t.position.y = 1.5 + ease.cubicOut(u) * 1.2; t.material.opacity = (1 - u) * seg(T, .65 + i * .04, .8 + i * .04); t.visible = t.material.opacity > .01;
				const p = puffs[i]; p.position.set(t.position.x, 1.6 + u * .9, 0); p.scale.setScalar(.2 + u * 1.6); p.userData.fill.material.opacity = u > 0 && u < 1 ? .6 * (1 - u) : 0; });
			show(q, pop(T, 2.05, .4)); q.rotation.z = Math.sin(T * 3) * .05;
		});
	}

	// ═══ 1 · "você" coça a cabeça + cerebrozinho "não fui eu" (2,6–4,5); prancheta TESTE (4,5–5,6) ═══
	{
		const g = mk(SET.YOU), dc = deco(g, 12, [P.creme, VOCE]), dc2 = deco(g, 13, [P.creme, P.mostarda], 10, 4.6, 7, 9, 10);
		const you = mkPerson({ shirt: VOCE, hair: P.tinta }, .95, -1.0, 2.6); g.add(you.g);
		const sign = plate(['NÃO FUI EU'], { w: 1.9, h: .62, bg: P.creme, fg: P.tinta }); g.add(sign);
		const stick = limb(.08, { c: P.madeira, line: .04 }); g.add(stick); raise(sign);
		const brain = blob([[-.35, .1, .42], [.1, .3, .45], [.45, 0, .38], [0, -.2, .42], [-.5, -.2, .32]], { c: '#F7A1B5' }); g.add(brain);
		const be = [-1, 1].map(s => { const e = disc(.09, { c: P.tinta, line: 0 }); brain.add(e); e.position.set(s * .2, .02, 0); return e; });
		const sweat = poly([[0, .2], [.12, -.05], [0, -.15], [-.12, -.05]], { c: P.branco, line: .04 }); g.add(sweat);
		// prancheta
		const cb = new THREE.Group(); cb.position.set(10, 4.6, 0); g.add(cb);
		cb.add(box(3.4, 4.4, { r: .2, c: P.madeira, shadow: .16 }));
		const pap = box(2.9, 3.7, { r: .08, c: P.branco, line: .05 }); pap.position.y = -.2; cb.add(pap);
		const clip = box(1.4, .5, { r: .12, c: P.cinza }); clip.position.y = 2.1; cb.add(clip);
		const lines = [0, 1, 2].map(i => { const b = box(.35, .35, { r: .06, c: P.branco, line: .05 }); b.position.set(-.95, .5 - i * .9, 0); const l = limb(.12, { c: P.lilas, line: 0 }); l.set(-.5, .5 - i * .9, .9, .5 - i * .9); cb.add(b, l); return l; });
		const st = plate(['TESTE'], { w: 2.4, h: .9, bg: P.coral, fg: P.creme }); st.rotation.z = .14; st.position.set(.1, -1.2, 0); cb.add(st);
		U.push(T => {
			dc(T); dc2(T);
			const sc = Math.sin(T * 12.5) * .25;
			you.g.setPose({ ra: [2.6, 1.2 + sc], la: [.25, .15], look: [.6, .2], brow: .7, mouth: 'flat', blink: blinkAt(T, 3), tilt: -.08 });
			you.g.position.x = -1.0 + Math.sin(T * 1.2) * .05;
			const kb = pop(T, 3.1, .45), bob = Math.sin(T * 5) * .08;
			brain.position.set(1.45, 6.55 + bob, 0); show(brain, kb);
			sign.position.set(1.45, 4.85 + bob, 0); show(sign, pop(T, 3.35, .4)); sign.rotation.z = Math.sin(T * 4) * .06;
			stick.set(1.45, 4.5 + bob, 1.45, 5.9 + bob, Math.max(kb, .001)); stick.visible = kb > .01;
			const sw = seg(T, 2.8, 3.6) % 1; sweat.position.set(-.2, 6.6 - sw * .6, 0); show(sweat, T > 2.8 && T < 4.4 ? 1 - sw * .5 : 0);
			lines.forEach((l, i) => { const u = seg(T, 4.1 + i * .12, 4.35 + i * .12); l.set(-.5, .5 - i * .9, -.5 + 1.4 * u + .001, .5 - i * .9); });
			const ks = seg(T, 4.6, 4.78); st.visible = T > 4.6; st.scale.setScalar(lerp(2.2, 1, ease.cubicOut(ks))); st.userData.mesh.material.opacity = Math.min(1, ks * 3);
			cb.rotation.z = Math.sin(T * 1.3) * .02 + (T > 4.6 && T < 4.9 ? Math.sin((T - 4.6) * 40) * .02 * (1 - seg(T, 4.6, 4.9)) : 0);
		});
	}

	// ═══ 2 · split: Sr. Padeiro (lilás) × o padeiro (mostarda) (5,6–10,8; 13,3–15,3) ═══
	{
		const g = mk(SET.SPLIT);
		const half = mesh(new THREE.PlaneGeometry(50, 60), P.mostarda); g.add(half);
		const div = limb(.12, { c: P.tinta, line: 0 }); g.add(div);
		const dc = deco(g, 21, [P.creme], -2, 4.6, 4, 9, 7), dc2 = deco(g, 22, [P.creme, P.forno], 2.2, 4.6, 4, 9, 7);
		const rays = new THREE.Group(); rays.position.set(1.5, 4.6, 0); g.add(rays);
		for (let i = 0; i < 10; i++) { const r = mesh(new THREE.CircleGeometry(9, 3, -.16, .32), mat(P.creme, .55)); r.rotation.z = i * Math.PI / 5; rays.add(r); }
		const A = mkPerson({ shirt: P.creme, hair: P.cabelo }, .8, -1.75, 2.4); g.add(A.g); mustache(A);
		const bA = plate(['SR. PADEIRO'], { w: 1.5, h: .45, bg: P.branco, fg: P.tinta, shadow: .06 }); bA.position.set(.0, 1.7, 0); A.body.add(bA);
		const Bm = mkPerson({ shirt: P.branco, hair: P.cabelo }, .8, 1.5, 2.4); g.add(Bm.g); mustache(Bm); bakerHat(Bm);
		const ap = apron(Bm, P.forno);
		const br = bread(.75); Bm.body.add(br);
		const gray = mesh(new THREE.PlaneGeometry(50, 60), mat('#7E7890', 0)); g.add(gray);
		const chk = stroke(10, .3, { c: P.agua, line: .08 }); g.add(chk);
		U.push(T => {
			dc(T); dc2(T);
			const kh = ease.expoOut(seg(T, 8.2, 8.75)), bx = lerp(9, .2, kh);
			half.position.set(bx + 25, 4, 0); div.set(bx, -20, bx, 30); div.visible = kh > .001;
			A.g.position.x = lerp(-7, -1.75, ease.expoOut(seg(T, 5.6, 6.1)));
			Bm.g.position.x = lerp(7.5, 1.5, ease.expoOut(seg(T, 8.25, 8.8)));
			const win13 = T > 13.3;
			A.g.setPose({ la: [.3, .2], ra: [.3, .2], look: [.3, 0], blink: blinkAt(T, 4), mouth: win13 ? 'flat' : 'smile', tilt: Math.sin(T * 1.4) * .03 });
			Bm.g.setPose({ la: [.3, .2], ra: [1.2 + Math.sin(T * 2) * .1, 1.2], look: [-.3, 0], blink: blinkAt(T, 5), mouth: win13 ? 'big' : 'smile', tilt: Math.sin(T * 1.2 + 1) * .03 });
			br.position.set(Bm.rh[0] + .1, Bm.rh[1] + .25, 0); br.rotation.z = .3;
			const kg = seg(T, 13.4, 13.9); gray.position.set(-25 + .2, 4, 0); gray.material.opacity = .6 * kg; gray.visible = kg > 0;
			rays.rotation.z = T * .25; show(rays, ease.expoOut(seg(T, 13.35, 13.9)));
			const kc = seg(T, 13.6, 14.0);
			chk.visible = kc > 0; chk.set(u => u < .35 ? [lerp(.9, 1.3, u / .35), lerp(7.5, 7.1, u / .35)] : [lerp(1.3, 2.1, (u - .35) / .65), lerp(7.1, 8.0, (u - .35) / .65)], Math.max(kc, .001));
		});
	}

	// ═══ 3 · calendário: semana que vem, qual dos dois? (10,8–13,3) ═══
	{
		const g = mk(SET.CAL), dc = deco(g, 31, [P.lilas, P.mostarda, P.coral]);
		const cal = calendar([1, 3, 5, 8], { head: 'SEMANA QUE VEM' }); cal.position.set(0, 5.9, 0); g.add(cal);
		const plus = plate(['+7 DIAS'], { w: 1.6, h: .55, bg: P.mostarda, fg: P.tinta }); plus.position.set(1.0, 4.45, 0); plus.rotation.z = -.12; g.add(plus);
		const a = mkPerson({ shirt: P.creme }, .42, -1.3, 1.55); mustache(a); g.add(a.g);
		const b = mkPerson({ shirt: P.branco }, .42, 1.1, 1.55); mustache(b); bakerHat(b); g.add(b.g);
		const qs = [-1.3, 1.1].map(x => { const q = text('?', { w: .8, h: 1.0, fg: P.coral, stroke: .05, strokeColor: P.tinta }); q.position.set(x, 3.75, 0); g.add(q); return q; });
		U.push(T => {
			dc(T);
			const u = seg(T, 11.0, 12.4), i = Math.min(3, Math.floor(u * 4)), ph = (u * 4) % 1;
			cal.setNum(i, i < 3 ? Math.abs(Math.cos(Math.min(1, ph * 1.2) * Math.PI * .5)) * (ph > .85 ? 0 : 1) + (ph > .85 ? (ph - .85) / .15 : 0) : 1);
			cal.rotation.z = Math.sin(T * 1.5) * .02; show(cal, pop(T, 10.8, .45));
			show(plus, pop(T, 12.45, .35));
			[a, b].forEach((p, k) => p.g.setPose({ look: [k ? -.5 : .5, .3], blink: blinkAt(T, 6 + k), mouth: 'flat', brow: .3 }));
			show(a.g, .42 * pop(T, 11.6, .4)); show(b.g, .42 * pop(T, 11.75, .4));
			qs.forEach((q, k) => { show(q, pop(T, 12.0 + k * .15, .35)); q.position.y = 3.6 + Math.sin(T * 4 + k) * .1; });
			if (T > 12.4 && i === 3) cal.setNum(3, 1);
		});
	}

	// ═══ 4 · laboratório britânico 1987 → balança → "?" (15,3–22,4) ═══
	{
		const g = mk(SET.LAB), dc = deco(g, 41, [P.creme, P.mostarda]);
		const flag = new THREE.Group(); flag.position.set(-1.4, 7.4, 0); g.add(flag);
		const pole = limb(.1, { c: P.cinza }); pole.set(-.95, -1.6, -.95, .55); flag.add(pole);
		flag.add(box(1.7, 1.05, { r: .06, c: '#2F4A9A' }));
		[[-.85, -.52, .85, .52], [-.85, .52, .85, -.52]].forEach(([a, b, c, d]) => { const w = limb(.22, { c: P.branco, line: 0 }); w.set(a, b, c, d); flag.add(w); });
		const h1 = limb(.32, { c: P.branco, line: 0 }); h1.set(-.85, 0, .85, 0); const v1 = limb(.32, { c: P.branco, line: 0 }); v1.set(0, -.5, 0, .5); flag.add(h1, v1);
		const h2 = limb(.16, { c: '#D8333A', line: 0 }); h2.set(-.85, 0, .85, 0); const v2 = limb(.16, { c: '#D8333A', line: 0 }); v2.set(0, -.5, 0, .5); flag.add(h2, v2);
		const card = plate(['1987', 'McWeeny et al.'], { w: 2.5, h: 1.3, bg: P.creme, fg: P.tinta }); card.position.set(.95, 7.2, 0); g.add(card);
		const S = [mkPerson({ shirt: P.lilas, coat: true, glasses: true, hair: '#B8B0A0' }, .7, -1.7, 2.6), mkPerson({ shirt: P.agua, coat: true, glasses: true, hair: P.castanho, beard: true }, .7, 1.25, 2.6)];
		S.forEach(s => g.add(s.g));
		const cups = S.map(s => { const c = teacup(.9); s.body.add(c); return c; });
		const bench = box(6.6, .7, { r: .12, c: P.madeira, shadow: .12 }); bench.position.set(-.2, 2.0, 0); g.add(bench);
		const flask = poly([[-.35, .5], [.35, .5], [.75, -.55], [-.75, -.55]], { c: P.lilas, line: .07 }); flask.position.set(-.2, 2.9, 0); g.add(flask);
		const neck = box(.32, .5, { r: .06, c: P.branco, line: .06 }); neck.position.set(-.2, 3.6, 0); g.add(neck);
		const bub = [0, 1, 2].map(() => { const d = disc(.09, { c: P.branco, line: .03 }); g.add(d); return d; });
		// balança (x=12)
		const bal = balance(['SOBRENOME', 'PROFISSÃO']); bal.position.set(11.7, 1.6, 0); g.add(bal);
		// "?" gigante (x=24)
		const qs = stroke(30, .55, { c: P.creme, line: .12 }); qs.position.set(24, 4.3, 0); g.add(qs);
		const qd = disc(.38, { c: P.creme, line: .12 }); qd.position.set(24, 2.2, 0); g.add(qd);
		U.push(T => {
			dc(T);
			flag.rotation.z = Math.sin(T * 1.6) * .03; show(flag, pop(T, 15.5, .4)); show(card, pop(T, 16.6, .4));
			S.forEach((s, i) => {
				const sip = Math.max(0, Math.sin((T - 15.3) * 1.6 + i * 2.2)) ** 4;
				s.g.setPose({ ra: [.4 + sip * .5, 1.9 + sip * .2], la: [.25, .1], look: [i ? -.4 : .4, 0], blink: blinkAt(T, 8 + i), mouth: T > 19 ? 'smile' : (sip > .3 ? 'o' : 'smile'), tilt: Math.sin(T + i) * .03 });
				cups[i].position.set(s.rh[0], s.rh[1] + .15, 0);
			});
			bub.forEach((b, i) => { const u = (T * .7 + i / 3) % 1; b.position.set(-.2 + Math.sin(u * 9 + i) * .1, 3.4 + u * 1.2, 0); show(b, 1 - u); });
			bal.tilt(.32 * ease.elasticOut(seg(T, 20.3, 21.3)) + Math.sin(T * 2) * .01);
			const kq = seg(T, 21.76, 22.15);
			qs.visible = kq > 0; qs.set(u => { if (u < .72) { const a = Math.PI * (.85 - u / .72 * 1.35); return [Math.cos(a) * 1.25, 1.7 + Math.sin(a) * 1.25]; } const k = (u - .72) / .28; return [0, lerp(.45, -.55, k)]; }, Math.max(.001, ease.cubicOut(kq)));
			show(qd, pop(T, 22.1, .25));
		});
	}

	// ═══ 5 · o gancho da profissão: pão, forno, madrugada, café (22,4–28,5) ═══
	{
		const g = mk(SET.HOOK), dc = deco(g, 51, [P.creme, P.forno]);
		const baker = mkPerson({ shirt: P.branco, hair: P.cabelo }, .62, -2.0, 1.95); mustache(baker); bakerHat(baker); apron(baker, P.forno); g.add(baker.g);
		const hk = hook(.95); hk.position.set(-.05, 6.25, 0); g.add(hk);
		const tip = [hk.position.x + hk.tip[0], hk.position.y + hk.tip[1]];
		const off = [[-1.35, -1.6], [-.45, -2.55], [.6, -2.55], [1.45, -1.6]], times = [24.94, 25.59, 26.4, 27.39];
		const icons = [bread(.85), oven(.8), moon(.85), cup(.85)];
		const strs = icons.map(() => { const l = limb(.05, { c: P.tinta, line: 0 }); g.add(l); return l; });
		icons.forEach(i => g.add(i));
		const glow = disc(.4, { line: 0, fillMat: mat(P.creme, 0) }); g.add(glow);
		U.push(T => {
			dc(T);
			hk.draw(ease.cubicOut(seg(T, 22.6, 23.3)));
			hk.rotation.z = Math.sin(T * 1.7) * .02 * seg(T, 23.3, 24);
			const cap = T > 23.0 && T < 24.9 ? 1 : 0;
			baker.g.setPose({ ra: [cap ? 2.3 : .3, cap ? .8 : .2], la: [.3, .2], look: [.6, .7], blink: blinkAt(T, 12), mouth: T > 24.9 ? 'big' : 'smile', tilt: .05 + Math.sin(T * 1.3) * .03 });
			icons.forEach((ic, i) => {
				const k = pop(T, times[i], .4), sw = Math.sin(T * 2.1 + i) * .07 * k, [ox, oy] = off[i];
				const x = tip[0] + ox * Math.cos(sw) - oy * Math.sin(sw), y = tip[1] + ox * Math.sin(sw) + oy * Math.cos(sw);
				ic.position.set(x, y, 0); show(ic, k); ic.rotation.z = sw;
				strs[i].visible = k > .01; strs[i].set(tip[0], tip[1], lerp(tip[0], x, k), lerp(tip[1], y + .45, k));
				if (ic.tick) ic.tick(T);
			});
			const lt = times.reduce((a, t) => T >= t ? t : a, -9), gk = seg(T, lt, lt + .5);
			glow.position.set(tip[0], tip[1], 0); glow.scale.setScalar(1 + gk * 3); glow.userData.fill.material.opacity = lt > 0 ? .45 * (1 - gk) : 0;
			icons[1].userData.flame.scale.y = 1 + Math.sin(T * 9) * .15;
		});
	}

	// ═══ 6 · o nome não puxa nada: etiqueta solta que cai (28,5–32,2) ═══
	{
		const g = mk(SET.LONE), dc = deco(g, 61, [P.creme], 0, 2, 9, 16, 12);
		const gh = ghostHook(.95, P.tinta, .2); gh.position.set(-.5, 6.9, 0); g.add(gh);
		const tg = tag('SR. PADEIRO', { c: P.creme, w: 3.0, h: 1.0 }); g.add(tg);
		const floor = box(30, .4, { r: .1, c: '#9C86C9', line: 0 }); floor.position.set(0, -3.3, 0); g.add(floor);
		const cri = [[1.5, 3.4, 28.8], [-1.7, 2.6, 29.35]].map(([x, y, t0]) => { const t = text('cri…', { w: 1.6, h: .6, fg: P.tinta, weight: 800 }); t.position.set(x, y, 0); g.add(t); return { t, t0 }; });
		const dust = [0, 1, 2, 3].map(() => { const d = disc(.2, { line: 0, fillMat: mat(P.creme, 0) }); g.add(d); return d; });
		const land = 31.15;
		U.push(T => {
			dc(T);
			gh.userData.mat.opacity = .22 * seg(T, 28.6, 29.2) * (1 - seg(T, 30.0, 30.3));
			const tf = Math.max(0, T - 30.3), fall = Math.min(8.16, 5.9 * tf * tf * 1.9);
			let y = 6.5 - fall, rot = Math.sin(T * 1.6) * .08 + (T > 30.0 ? Math.min(.5, (T - 30.0) * .9) : 0);
			if (T >= land) { const b = T - land; y = 6.5 - 8.16 + Math.max(0, Math.sin(b * 9) * .35 * Math.exp(-b * 6)); rot = lerp(.5, .08, ease.cubicOut(seg(T, land, land + .3))); }
			tg.position.set(.0 + (T > 30.3 ? Math.sin(tf * 3) * .3 : 0), y, 0); tg.rotation.z = rot;
			show(tg, pop(T, 28.55, .4));
			cri.forEach(({ t, t0 }) => { const a = seg(T, t0, t0 + .15) * (1 - seg(T, t0 + .5, t0 + .8)); t.material.opacity = a; t.visible = a > .01; t.position.y += 0; });
			dust.forEach((d, i) => { const u = seg(T, land, land + .6); d.position.set((i - 1.5) * .5 + (i - 1.5) * u * 1.5, -3.0 + u * .5, 0); d.scale.setScalar(.2 + u * 1.2); d.userData.fill.material.opacity = u > 0 && u < 1 ? .7 * (1 - u) : 0; });
		});
	}

	// ═══ 7 · e piora: Ana se apresenta, sua cabeça está lotada (32,2–37,1) ═══
	{
		const g = mk(SET.MEET), dc = deco(g, 71, [P.creme, P.mostarda]);
		const ana = mkPerson({ shirt: P.mostarda, hair: '#7A3B2A', skin: P.pele2 }, .72, -1.6, 2.0); longHair(ana, '#7A3B2A'); g.add(ana.g);
		const you = mkPerson({ shirt: VOCE, hair: P.tinta }, .72, 1.05, 2.0); g.add(you.g);
		const trail = [[.75, 5.25, .12], [.55, 5.65, .18]].map(([x, y, r]) => { const d = disc(r, { c: P.branco, line: .06 }); d.position.set(x, y, 0); g.add(d); return d; });
		const bal = blob([[-.9, 7.0, .95], [.2, 7.45, 1.05], [1.25, 7.0, .9], [.3, 6.45, .95], [-.6, 6.4, .7], [1.1, 6.35, .7]], { c: P.branco }); bal.position.x = .2; g.add(bal);
		const notes = [['OI, TUDO BEM?', -.55, 7.55, -.05, 33.9], ['FALO O QUÊ?', .9, 7.0, .06, 34.5], ['APERTO A MÃO?', -.45, 6.55, .04, 35.2], ['E SE EU TRAVAR?', 1.0, 6.25, -.06, 35.9]]
			.map(([s, x, y, r, t0]) => { const p = plate([s], { w: 1.65, h: .48, bg: [P.lilas, P.mostarda, P.agua, P.coral][Math.round(t0 * 10) % 4], fg: P.tinta, shadow: .06, radius: .12 }); p.position.set(x + .2, y, 0); p.rotation.z = r; g.add(p); return { p, t0 }; });
		const nm = tag('ANA', { c: P.creme, w: 1.2, h: .55, str: .2 }); g.add(nm);
		U.push(T => {
			dc(T);
			const sh = T < 33.0 ? Math.sin((T - 32.2) * 13) * .18 * Math.max(0, 1 - (T - 32.2) / .8) : 0;
			g.position.y = sh;
			ana.g.position.x = lerp(-6.5, -1.6, ease.expoOut(seg(T, 33.15, 33.7)));
			const hand = ease.expoOut(seg(T, 33.6, 34.0));
			ana.g.setPose({ ra: [lerp(.3, 1.45, hand), lerp(.2, .1, hand)], la: [.3, .2], look: [.6, 0], blink: blinkAt(T, 14), mouth: T > 34.0 && T < 35.2 && Math.sin(T * 12) > 0 ? 'o' : 'smile', step: T < 33.7 ? T * 10 : 0 });
			you.g.setPose({ ra: [.3, .2], la: [lerp(.3, 1.3, ease.expoOut(seg(T, 35.4, 35.8))), .3], look: [-.6, .5], brow: .9, mouth: T < 33.1 ? 'frown' : 'flat', blink: blinkAt(T, 15), tilt: Math.sin(T * 1.6) * .05 });
			trail.forEach((d, i) => show(d, pop(T, 33.5 + i * .1, .3)));
			show(bal, pop(T, 33.65, .45)); bal.position.y = Math.sin(T * 1.4) * .06;
			notes.forEach(({ p, t0 }, i) => { show(p, pop(T, t0, .3)); p.position.y += 0; p.children[0].position.y = Math.sin(T * 3 + i) * .03; });
			// "ANA" sai da boca dela, bate no balão lotado e cai
			const u = seg(T, 34.1, 35.3), d = seg(T, 35.3, 36.4);
			const x = lerp(-1.1, .1, ease.sineInOut(u)) + d * .4, y = lerp(5.1, 5.9, Math.sin(u * Math.PI * .5)) - d * d * 6;
			nm.position.set(x, y, 0); nm.rotation.z = Math.sin(T * 5) * .12 + d * 1.2; show(nm, pop(T, 34.1, .3) * (1 - seg(T, 36.3, 36.5)));
		});
	}

	// ═══ 8 · a casa-cabeça: o nome entra e não tem ninguém (37,1–40,0) ═══
	{
		const g = mk(SET.HOUSE), dc = deco(g, 81, [P.lilas, P.agua], 0, 4.6, 16, 10, 16);
		const hs = houseHead({ w: 8.6, h: 4.4, wall: P.coral, roof: P.tinta }); hs.position.set(0, 1.7, 0); g.add(hs);
		const R = hs.userData.rooms;
		const hanger = limb(.08, { c: P.tinta, line: 0 }); hanger.set(R[0] - .4, 4.6, R[0] + .4, 4.6); g.add(hanger);
		const hk2 = limb(.06, { c: P.tinta, line: 0 }); hk2.set(R[0], 4.6, R[0], 4.95); g.add(hk2);
		const back = plate(['VOLTO JÁ'], { w: 1.8, h: .6, bg: P.branco, fg: P.tinta }); back.position.set(R[1], 4.6, 0); back.rotation.z = -.08; g.add(back);
		const webs = [0, 1, 2].map(i => { const a = mesh(new THREE.RingGeometry(.3 + i * .25, .34 + i * .25, 16, 1, Math.PI, Math.PI / 2), P.tinta); a.position.set(R[2] + 1.3, 5.6, 0); g.add(a); return a; });
		const qs = R.map(x => { const q = text('?', { w: .6, h: .8, fg: P.tinta }); q.position.set(x, 2.75, 0); g.add(q); return q; });
		const nm = tag('ANA', { c: P.creme, w: 1.2, h: .55, str: .2 }); g.add(nm);
		U.push(T => {
			dc(T);
			hs.userData.eyes.forEach(({ p }, i) => { p.position.set(clamp((nm.position.x) / 4, -.18, .18), -.05, 0); });
			const u = seg(T, 37.25, 39.7), x = lerp(-6.5, R[2] + .2, ease.sineInOut(u));
			nm.position.set(x, 3.4 + Math.abs(Math.sin(u * 14)) * .25, 0); nm.rotation.z = Math.sin(T * 6) * .12;
			R.forEach((rx, i) => show(qs[i], pop(T, 37.25 + (rx + 6.5) / (R[2] + 6.7) * 2.45 + .1, .3)));
			back.rotation.z = -.08 + Math.sin(T * 2) * .03;
		});
	}

	// ═══ 9 · resumo: não é memória fraca; nome sem gancho + atenção no lugar errado (40,0–44,5) ═══
	{
		const g = mk(SET.RECAP), dc = deco(g, 91, [P.creme, P.mostarda], 6, 4.6, 20, 10, 18);
		const db = dumbbell('MEMÓRIA'); db.position.set(0, 5.9, 0); g.add(db);
		const fr = text('FRACA', { w: 3.2, h: 1.1, fg: P.creme, stroke: .07, strokeColor: P.tinta }); fr.position.set(0, 3.8, 0); g.add(fr);
		const strike = limb(.2, { c: P.forno, line: .06 }); g.add(strike);
		const gh = ghostHook(.85, P.tinta, .3); gh.position.set(9.8, 5.6, 0); g.add(gh);
		const x1 = limb(.2, { c: P.coral, line: .06 }), x2 = limb(.2, { c: P.coral, line: .06 }); g.add(x1, x2);
		const tg = tag('ANA', { c: P.creme, w: 1.6, h: .7 }); tg.position.set(10.6, 3.9, 0); g.add(tg);
		const fl = flashlight(.85); fl.position.set(11.2, 2.2, 0); fl.rotation.z = .55; g.add(fl);
		const tb = blob([[-.6, 0, .7], [.2, .25, .75], [.8, -.1, .6], [.0, -.4, .6]], { c: P.branco }); tb.position.set(13.2, 4.7, 0); g.add(tb);
		const tp = plate(['FALO O QUÊ?'], { w: 1.8, h: .5, bg: P.mostarda, fg: P.tinta, shadow: .05 }); tp.position.set(13.25, 4.7, 0); g.add(tp);
		U.push(T => {
			dc(T);
			db.position.y = 5.9 + Math.sin(T * 2.4) * .12; db.rotation.z = Math.sin(T * 1.2) * .04; show(db, pop(T, 40.1, .45));
			show(fr, pop(T, 40.6, .35));
			const ks = ease.cubicOut(seg(T, 41.0, 41.35)); strike.visible = ks > 0; strike.set(-1.5, 3.65, lerp(-1.5, 1.5, ks) + .001, lerp(3.65, 4.0, ks));
			show(gh, pop(T, 42.2, .35));
			const kx = ease.cubicOut(seg(T, 42.5, 42.75)), kx2 = ease.cubicOut(seg(T, 42.65, 42.9));
			x1.visible = kx > 0; x1.set(9.7, 7.6, lerp(9.7, 11.0, kx) + .001, lerp(7.6, 5.3, kx)); x2.visible = kx2 > 0; x2.set(11.0, 7.6, lerp(11.0, 9.7, kx2) + .001, lerp(7.6, 5.3, kx2));
			show(tg, pop(T, 42.3, .35)); tg.rotation.z = .35 + Math.sin(T * 1.5) * .06;
			show(fl, pop(T, 43.1, .35)); fl.userData.beam.visible = T > 43.35;
			show(tb, pop(T, 43.4, .35)); show(tp, pop(T, 43.5, .3));
		});
	}

	// ═══ 10 · o truque: inventa o gancho — Ana do avental (44,5–48,6) ═══
	{
		const g = mk(SET.TRICK), dc = deco(g, 101, [P.creme, P.coral]);
		const aw = new THREE.Group(); aw.position.set(0, 8.55, 0); g.add(aw);
		for (let i = -5; i <= 5; i++) { const b = box(.9, .9, { r: .0, c: i % 2 ? P.coral : P.creme, line: .05 }); b.position.x = i * .9; aw.add(b); const d = disc(.45, { c: i % 2 ? P.coral : P.creme, line: .05 }); d.position.set(i * .9, -.45, 0); aw.add(d); }
		const ana = mkPerson({ shirt: P.mostarda, hair: '#7A3B2A', skin: P.pele2 }, .7, -1.9, 1.95); longHair(ana, '#7A3B2A'); g.add(ana.g);
		const apr = apron(ana, P.coral);
		const you = mkPerson({ shirt: VOCE, hair: P.tinta }, .7, 1.15, 1.95); g.add(you.g);
		const pen = limb(.12, { c: P.forno, line: .05 }); g.add(pen);
		const hk = hook(.85); hk.position.set(-.55, 5.0, 0); g.add(hk);
		const tip = [hk.position.x + hk.tip[0], hk.position.y + hk.tip[1]];
		const nm = tag('ANA DO AVENTAL', { c: P.creme, w: 2.3, h: .6, str: .2 }); g.add(nm);
		const st = star(.4, P.creme); g.add(st);
		const note = text('*exemplo ilustrativo', { w: 2.6, h: .38, fg: P.tinta, weight: 700 }); note.position.set(-1.2, 1.25, 0); g.add(note);
		U.push(T => {
			dc(T);
			const kd = ease.cubicInOut(seg(T, 44.7, 45.6));
			hk.draw(kd);
			const thumbs = T > 47.3;
			const lift = ease.expoOut(seg(T, 44.55, 44.8)) * (1 - seg(T, 45.7, 45.95));
			you.g.setPose({ la: [lerp(.3, 2.35, lift) + Math.sin(kd * Math.PI * 2) * .15 * lift, lerp(.2, .7, lift)], ra: thumbs ? [2.9, .15] : [.3, .2], look: [-.7, .4], brow: -.2, mouth: thumbs ? 'big' : 'smile', blink: blinkAt(T, 18) });
			const hx = you.g.position.x + you.lh[0] * .7, hy = you.g.position.y + you.lh[1] * .7;
			pen.visible = lift > .05; pen.set(hx, hy, hx - .3, hy + .45);
			ana.g.setPose({ ra: [.3, .2], la: [.3, .2], look: [.7, .4], blink: blinkAt(T, 19), mouth: T > 46.05 ? 'big' : 'smile', tilt: Math.sin(T * 1.3) * .04 });
			show(apr, pop(T, 46.05, .4));
			const kt = ease.backOut(seg(T, 46.2, 46.7));
			nm.position.set(lerp(-1.9, tip[0], kt), lerp(4.9, tip[1], kt) + (1 - kt) * 1.5 * Math.sin(kt * Math.PI), 0); nm.rotation.z = Math.sin(T * 2.2) * .08 * kt; show(nm, pop(T, 46.1, .3));
			hk.rotation.z = Math.sin(T * 1.7) * .02;
			st.position.set(you.g.position.x + .7 * 1.6, 5.1, 0); show(st, pop(T, 47.35, .35)); st.rotation.z = T * 1.5;
			const kn = seg(T, 47.4, 47.7); note.material.opacity = kn; note.visible = kn > 0;
		});
	}

	// ═══ 11 · fim: segue pra mais mistérios da mente (48,6–50,9) ═══
	{
		const g = mk(SET.END), dc = deco(g, 111, [P.lilas, P.agua, P.mostarda, P.coral], 0, 4.6, 9, 11, 18);
		const hk = hook(.9); hk.position.set(-.5, 7.0, 0); g.add(hk);
		const tip = [hk.position.x + hk.tip[0], hk.position.y + hk.tip[1]];
		const sign = tag('MISTÉRIOS DA MENTE', { c: P.agua, fg: P.creme, w: 4.4, h: 1.2, str: .25 }); sign.position.set(tip[0], tip[1], 0); g.add(sign);
		const btn = plate(['SEGUE PRA MAIS'], { w: 3.4, h: .85, bg: P.coral, fg: P.creme }); btn.position.set(0, 3.0, 0); g.add(btn);
		const arrow = poly([[-.3, .5], [.3, .5], [.3, 0], [.6, 0], [0, -.6], [-.6, 0], [-.3, 0]], { c: P.forno, line: .07 }); arrow.position.set(0, 4.1, 0); g.add(arrow);
		U.push(T => {
			dc(T);
			hk.draw(ease.cubicOut(seg(T, 48.6, 49.0)));
			sign.rotation.z = Math.sin(T * 1.8) * .05; show(sign, pop(T, 48.9, .45));
			show(btn, pop(T, 49.4, .4) * (1 + .04 * Math.sin(T * 5)));
			arrow.position.y = 4.15 + Math.sin(T * 5) * .12; show(arrow, pop(T, 49.6, .35));
		});
	}

	const update = T => U.forEach(f => f(T));
	return { root, sets, update };
}

// ── câmera: chaves { t, set, x, y, vh, rot, dur, tr: 'whip'|'ball'|'iris'|'zoom', at } ──
const aim = (tx, ty, V) => ({ x: tx, y: ty - V * .1667, vh: V });
export const K = [
	{ t: 0, set: SET.FACE, ...aim(0, 4.8, 14.5) },
	{ t: 1.5, dur: .35, set: SET.FACE, ...aim(0, 2.6, 8.8), rot: .02 },
	{ t: 2.62, set: SET.YOU, tr: 'whip', ...aim(0, 4.6, 12.5) },
	{ t: 4.45, dur: .35, set: SET.YOU, ...aim(10, 4.8, 10.5), rot: -.03 },
	{ t: 5.6, set: SET.SPLIT, tr: 'whip', ...aim(-1.5, 4.6, 11) },
	{ t: 8.2, dur: .5, set: SET.SPLIT, ...aim(.25, 4.5, 13) },
	{ t: 10.8, set: SET.CAL, tr: 'iris', at: [.5, .4], ...aim(0, 4.7, 13) },
	{ t: 13.3, set: SET.SPLIT, tr: 'zoom', at: [.62, .4], x: 1.3, y: 4.5, vh: 10.5 },
	{ t: 15.35, set: SET.LAB, tr: 'whip', ...aim(-.2, 4.7, 13) },
	{ t: 17.2, dur: 1.5, set: SET.LAB, ...aim(.2, 5.0, 11.5) },
	{ t: 19.05, dur: .45, set: SET.LAB, ...aim(11.9, 4.6, 12) },
	{ t: 21.72, dur: .25, set: SET.LAB, ...aim(24, 4.7, 10.5) },
	{ t: 22.45, set: SET.HOOK, tr: 'whip', ...aim(0, 5.0, 12.5) },
	{ t: 24.9, dur: .25, set: SET.HOOK, ...aim(-.3, 4.9, 11.6) },
	{ t: 25.55, dur: .25, set: SET.HOOK, ...aim(.3, 4.7, 11.0), rot: .015 },
	{ t: 26.35, dur: .25, set: SET.HOOK, ...aim(0, 4.6, 10.6), rot: -.015 },
	{ t: 27.35, dur: .25, set: SET.HOOK, ...aim(.2, 4.8, 10.2) },
	{ t: 28.55, set: SET.LONE, tr: 'iris', at: [.5, .35], ...aim(0, 5.2, 12) },
	{ t: 30.3, dur: 1.1, set: SET.LONE, ...aim(0, -1.6, 12) },
	{ t: 32.28, set: SET.MEET, tr: 'whip', ...aim(0, 4.6, 12.5) },
	{ t: 35.0, dur: .4, set: SET.MEET, ...aim(.5, 6.6, 8.6) },
	{ t: 37.2, set: SET.HOUSE, tr: 'zoom', at: [.5, .4], ...aim(-2.5, 4.4, 11) },
	{ t: 37.6, dur: 2.2, set: SET.HOUSE, ...aim(2.3, 4.4, 11) },
	{ t: 40.05, set: SET.RECAP, tr: 'whip', ...aim(0, 4.8, 12) },
	{ t: 42.05, dur: .45, set: SET.RECAP, ...aim(11.6, 4.8, 12) },
	{ t: 44.55, set: SET.TRICK, tr: 'iris', at: [.45, .4], ...aim(-.2, 4.8, 12.5) },
	{ t: 44.75, dur: .4, set: SET.TRICK, ...aim(.0, 5.4, 9.5) },
	{ t: 46.0, dur: .3, set: SET.TRICK, ...aim(-.6, 4.8, 10.8), rot: .02 },
	{ t: 47.25, dur: .5, set: SET.TRICK, ...aim(-.2, 4.6, 12.5) },
	{ t: 48.6, set: SET.END, tr: 'whip', ...aim(0, 5.0, 10) },
	{ t: 49.1, dur: 1.4, set: SET.END, ...aim(0, 5.2, 12.5) },
];
const TD = .42;
export const TRANS_DUR = TD;
export function keyIndex(T) { let i = 0; while (i + 1 < K.length && K[i + 1].t <= T) i++; return i; }
export function runStart(i) { while (i > 0 && K[i - 1].set === K[i].set && !K[i].tr) i--; return i; }
function baseAt(T, i) {
	const k = K[i], p = K[i - 1];
	let x = k.x, y = k.y, vh = k.vh, rot = k.rot || 0;
	if (p && p.set === k.set && !k.tr) {
		const q = baseAt(k.t, i - 1), u = ease.expoInOut(seg(T, k.t, k.t + (k.dur ?? .5)));
		x = lerp(q.x, x, u); y = lerp(q.y, y, u); vh = lerp(q.vh, vh, u); rot = lerp(q.rot, rot, u);
		const dt = Math.max(0, T - k.t - (k.dur ?? .5)); vh *= 1 - Math.min(dt, 6) * .012;
	} else { const dt = Math.max(0, T - k.t); vh *= 1 - Math.min(dt, 6) * .014; }
	return { x, y, vh, rot };
}
export function poseAt(T, i) {
	const b = baseAt(T, i);
	return { set: K[i].set, x: b.x + Math.sin(T * .9) * .05 * b.vh / 15, y: b.y + Math.sin(T * .7 + 1) * .04 * b.vh / 15, vh: b.vh, rot: b.rot + Math.sin(T * .5) * .004 };
}
