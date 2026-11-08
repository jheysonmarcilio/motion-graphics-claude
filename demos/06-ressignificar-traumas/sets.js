// Mundo do Short 06 (explainer flat). Cada "set" é um cenário montado em coordenadas de quadro
// (largura 10,8 × altura 19,2 com o centro em 0,0; conteúdo vital em y ∈ [-1,6; 8,1], legendas embaixo disso)
// e deslocado de 100 u no eixo X. Tudo é função do tempo T da narração gravada.
import * as THREE from 'three';
import { clamp, seg, lerp, ease, pop, gone, win, mulberry32 } from './lib.js';
import { P, mat, mesh, raise, box, disc, poly, limb, stroke, plate, text, star, bolt, cloud, polaroid, person, blinkAt, rrGeo } from './flat.js';

export const SET = { FACE: 0, ROOM: 1, WATCH: 2, BENCH: 3, FILE: 4, NET: 5, SWITCH: 6, TOWER: 7, CAL: 8, TICKETS: 9 };
export const BG = ['#3049FF', P.creme, '#3049FF', P.creme, '#3049FF', P.noite, P.creme, '#3049FF', P.coral, P.creme];
const show = (o, k) => { o.visible = k > .002; if (o.visible) o.scale.setScalar(Math.max(k, 1e-4)); };
const showXY = (o, kx, ky) => { o.visible = kx > .002 && ky > .002; if (o.visible) o.scale.set(Math.max(kx, 1e-4), Math.max(ky, 1e-4), 1); };
const rng = mulberry32(6060);

export function buildWorld() {
	const root = new THREE.Group(), sets = [];
	const mk = i => { const g = new THREE.Group(); g.position.x = i * 100; root.add(g); const bg = mesh(new THREE.PlaneGeometry(96, 96), BG[i]); g.add(bg); sets[i] = g; return g; };
	const U = [];

	// ═══ 0 · CLOSE NO ROSTO + bolinha bilateral ═══
	{
		const g = mk(SET.FACE);
		// raios de fundo girando (micro-animação)
		const rays = new THREE.Group(); rays.position.set(0, 3.6, 0); g.add(rays);
		for (let i = 0; i < 12; i++) { const r = mesh(new THREE.CircleGeometry(16, 3, -.13, .26), mat('#3A55FF')); r.rotation.z = i * Math.PI / 6; rays.add(r); }
		const pp = person({ shirt: P.calmo }); pp.g.scale.setScalar(2.6); pp.g.position.set(0, -4.7, 0); g.add(pp.g);
		const cl = cloud(.9); cl.position.set(0, 7.55, 0); g.add(cl);
		const track = box(9.2, .34, { r: .17, c: P.noite, line: .06 }); track.position.set(0, .45, 0); g.add(track);
		const halo = mesh(new THREE.CircleGeometry(1, 40), mat(P.amarelo, .28)); g.add(halo);
		const ball = disc(.46, { c: P.amarelo, line: .08 }); g.add(ball);
		const shine = mesh(new THREE.CircleGeometry(.13, 20), P.branco); g.add(shine);
		const ghosts = [1, 2, 3].map(k => { const m = mesh(new THREE.CircleGeometry(.4, 30), mat(P.amarelo, .35 - k * .09)); return m; });
		ghosts.forEach(m => g.add(m)); raise(halo); raise(ball); raise(shine);
		const bx = T => 4.1 * Math.sin(T * 2 * Math.PI * .62 - Math.PI / 2);
		U.push(T => {
			rays.rotation.z = T * .08;
			const late = T > 58.4, x = bx(T);
			ball.position.set(x, .45, 0); shine.position.set(x + .13, .58, 0); halo.position.set(x, .45, 0); halo.scale.setScalar(.75 + .08 * Math.sin(T * 9));
			ghosts.forEach((m, k) => m.position.set(bx(T - (k + 1) * .045), .45, 0));
			const sad = !late;
			pp.g.setPose({ look: [x / 4.1, -.6], brow: sad ? .9 : -.1, mouth: sad ? 'frown' : 'big', blink: blinkAt(T, 1) * .9, tilt: Math.sin(T * 1.3) * .03 });
			const ck = late ? 1 - ease.expoIn(seg(T, 58.4, 58.6)) : 1;
			show(cl, ck * (1 + .03 * Math.sin(T * 5))); cl.tick(T, ck); cl.position.y = 7.55 + Math.sin(T * 2.1) * .08;
		});
	}

	// ═══ 1 · CONSULTÓRIO ═══
	{
		const g = mk(SET.ROOM);
		const floor = mesh(new THREE.PlaneGeometry(96, 40), P.chao); floor.position.y = -20 + .1; g.add(floor);
		const base = mesh(new THREE.PlaneGeometry(96, .18), mat('#E8BE84')); base.position.y = .19; g.add(base);
		// janela
		const win0 = box(3.2, 2.7, { r: .12, c: '#9FD3FF', shadow: .14 }); win0.position.set(1.9, 7.25, 0); g.add(win0);
		const sun = disc(.42, { c: P.amarelo, line: .06 }); sun.position.set(2.7, 7.9, 0); g.add(sun);
		const wbar = mesh(new THREE.PlaneGeometry(.12, 2.7), P.tinta); wbar.position.set(1.9, 7.25, 0); g.add(wbar);
		const wbar2 = mesh(new THREE.PlaneGeometry(3.2, .12), P.tinta); wbar2.position.set(1.9, 7.25, 0); g.add(wbar2);
		// quadro
		const fr = box(1.5, 1.9, { r: .06, c: P.menta, shadow: .1 }); fr.position.set(-3.9, 6.7, 0); g.add(fr);
		const frm = poly([[-.55, -.6], [.0, .35], [.55, -.6]], { c: P.cobalto, line: .04 }); frm.position.set(-3.9, 6.6, 0); g.add(frm);
		// planta
		const pot = box(1.1, 1.0, { r: .14, c: P.coral }); pot.position.set(4.35, .65, 0); g.add(pot);
		[[-.4, 1.9, .5], [.3, 2.3, -.4], [0, 2.8, .1], [.5, 1.7, -.8]].forEach(([x, y, a]) => { const l = box(.55, 1.4, { r: .27, c: '#2BB673', line: .06 }); l.position.set(4.35 + x, y, 0); l.rotation.z = a; g.add(l); });
		raise(pot);
		// poltrona (encosto e assento antes do cliente)
		const CX = -1.75, CY = .95;
		const back = box(3.3, 3.6, { r: .7, c: P.cobalto, shadow: .16 }); back.position.set(CX, CY + 2.3, 0); g.add(back);
		const seat = box(3.5, 1.0, { r: .4, c: '#2238C9' }); seat.position.set(CX, CY + .1, 0); g.add(seat);
		const legsC = [-1, 1].map(s => { const l = box(.3, .7, { r: .1, c: P.tinta, line: 0 }); l.position.set(CX + s * 1.4, CY - .65, 0); g.add(l); return l; });
		const cli = person({ shirt: P.calmo }); cli.g.scale.setScalar(1.12); g.add(cli.g);
		const armsC = [-1, 1].map(s => { const a = box(.75, 1.9, { r: .37, c: P.cobalto }); a.position.set(CX + s * 1.72, CY + .55, 0); g.add(a); return a; });
		const cl = cloud(.82); g.add(cl);
		const pola = polaroid(.85); g.add(pola);
		const polaHand = polaroid(.5); g.add(polaHand);
		// terapeuta
		const th = person({ coat: true, shirt: P.cobalto, hair: P.castanho, glasses: true }); th.g.scale.setScalar(1.12); th.g.position.set(2.15, -.25, 0); g.add(th.g);
		const clip = box(.95, 1.25, { r: .08, c: P.madeira }); g.add(clip);
		const clipP = box(.72, .9, { r: .04, c: P.branco, line: 0 }); g.add(clipP);
		const q = text('?', { w: 1.4, h: 1.8, fg: P.amarelo, stroke: .07 }); q.position.set(2.3, 6.4, 0); g.add(q);
		const sweat = mesh(new THREE.CircleGeometry(.14, 16), P.calmo); g.add(sweat);
		const confetti = Array.from({ length: 34 }, (_, i) => { const c = mesh(rrGeo(.2, .34, .05), [P.amarelo, P.cobalto, P.coral, P.menta][i % 4]); c.userData = { x: -5 + rng() * 10, v: 3 + rng() * 2.5, w: rng() * 6, ph: rng() * 6, d: rng() * .5 }; g.add(c); return c; });
		const sparkles = [0, 1, 2].map(i => { const s = star(.28); g.add(s); return s; });
		U.push(T => {
			// cliente: encolhido (3–6), aliviado (44,7–47,6), em pé acenando (55,2+)
			const relief = ease.backOut(seg(T, 45.3, 45.8)), stand = ease.expoInOut(seg(T, 55.2, 55.7)), late = T > 40;
			const sad = !late || relief < .5;
			const cy = CY + .15 + stand * .9, lean = late ? lerp(.06, 0, relief) : .06;
			cli.g.position.set(CX + stand * .2, cy + (sad ? -.12 : 0) + Math.sin(T * 2.2) * .02, 0);
			const wave = T > 55.4 ? Math.sin(T * 9) * .35 : 0;
			cli.g.setPose({
				la: stand > .5 ? [2.6 + wave, .5] : sad ? [.15, 1.6] : [.35, 1.2], ra: sad ? [.15, 1.6] : [.3, .9],
				look: T < 7 ? [.6, .4] : [.3, .2], brow: sad ? .9 : -.15, mouth: sad ? 'frown' : (stand > .2 ? 'big' : 'smile'),
				blink: blinkAt(T, 2), lean: stand > .5 ? 0 : lean, shrug: sad ? .5 : 0, sit: stand < .5, tilt: sad ? -.12 : Math.sin(T * 1.7) * .04,
			});
			// nuvem sobre o cliente: viva até 45,0, murcha até 45,6
			const ck = T < 44.95 ? 1 : 1 - ease.expoIn(seg(T, 44.95, 45.55));
			show(cl, ck * (1 + .04 * Math.sin(T * 6))); cl.tick(T, ck);
			cl.position.set(CX + Math.sin(T * 1.4) * .1, cy + 5.3 + Math.sin(T * 2.3) * .07, 0);
			// polaroid salta da nuvem (3,7) e fica tremendo
			const pk = win(T, 3.7, 6.2, .45, .2), pu = ease.expoOut(seg(T, 3.7, 4.3));
			show(pola, pk); pola.position.set(lerp(CX, .5, pu) + Math.sin(T * 15) * .03, lerp(cy + 5, 6.0, pu), 0); pola.rotation.z = lerp(0, -.18, pu) + Math.sin(T * 11) * .025;
			// polaroid sem carga na mão do cliente (45,7–47,6)
			const hk = win(T, 45.7, 47.7, .4, .2); show(polaHand, hk); polaHand.charge(0);
			if (cli.lh) { const s = cli.g.scale.x; polaHand.position.set(cli.g.position.x + cli.rh[0] * s + .35, cli.g.position.y + cli.rh[1] * s + .55, 0); polaHand.rotation.z = -.2 + Math.sin(T * 2) * .05; }
			// terapeuta: prancheta / dá de ombros (17,9) / joinha (55,2)
			const shrugK = win(T, 17.95, 19.05, .25, .15), happy = T > 55.2;
			th.g.position.y = -.25 + Math.sin(T * 2.6 + 1) * .03;
			th.g.setPose({
				la: shrugK > .3 ? [1.25, -1.9] : [.35, 1.55], ra: shrugK > .3 ? [1.25, -1.9] : happy ? [2.4, .9 + Math.sin(T * 8) * .2] : [.2, .2],
				look: shrugK > .3 ? [0, .3] : [-.8, .1], brow: shrugK > .3 ? .8 : (T > 44 && T < 48 ? -.2 : .2), mouth: shrugK > .3 ? 'flat' : happy ? 'big' : 'smile',
				shrug: shrugK, blink: blinkAt(T, 4), tilt: shrugK * .12,
			});
			const s = th.g.scale.x, hx = th.g.position.x + th.lh[0] * s, hy = th.g.position.y + th.lh[1] * s;
			const ck2 = shrugK > .3 ? 0 : 1; show(clip, ck2); show(clipP, ck2);
			clip.position.set(hx + .15, hy + .45, 0); clipP.position.set(hx + .15, hy + .4, 0); clip.rotation.z = clipP.rotation.z = .12;
			show(q, shrugK); q.position.y = 6.5 + Math.sin(T * 9) * .12; q.rotation.z = Math.sin(T * 7) * .15;
			const sw = win(T, 4.0, 6.1, .3, .2) * (T < 7 ? 1 : 0); show(sweat, sw); sweat.position.set(CX + .95, cy + 4.2 - ((T * 1.5) % 1) * .5, 0);
			// confete na alta
			confetti.forEach(c => { const { x, v, w, ph, d } = c.userData, u = T - 55.45 - d; c.visible = u > 0 && T < 58.7; if (!c.visible) return; c.position.set(x + Math.sin(u * 3 + ph) * .4, 9.5 - u * v, 0); c.rotation.z = u * w; c.scale.setScalar(1); });
			sparkles.forEach((st, i) => { const k = win(T, 45.6 + i * .15, 47.6, .3, .2); show(st, k * (.8 + .2 * Math.sin(T * 8 + i))); st.position.set(CX + [-1.6, 1.5, .2][i], cy + [4.6, 5.2, 6.1][i], 0); st.rotation.z = T * 2; });
		});
	}

	// ═══ 2 · CRONÔMETRO ═══
	{
		const g = mk(SET.WATCH);
		const W0 = [0, 3.4];
		const btn = box(.9, .7, { r: .12, c: P.coral }); btn.position.set(W0[0], W0[1] + 3.45, 0); g.add(btn);
		const stem = box(.4, .5, { r: .08, c: P.cinza }); stem.position.set(W0[0], W0[1] + 3.05, 0); g.add(stem);
		const face = disc(2.9, { c: P.creme, line: .16, shadow: .2 }); face.position.set(...W0, 0); g.add(face);
		for (let i = 0; i < 60; i++) { const big = i % 5 === 0, t = mesh(rrGeo(big ? .12 : .06, big ? .45 : .22, .03), P.tinta), a = i / 60 * Math.PI * 2; t.position.set(W0[0] + Math.sin(a) * (big ? 2.45 : 2.56), W0[1] + Math.cos(a) * (big ? 2.45 : 2.56), 0); t.rotation.z = -a; g.add(t); }
		const lbl = text('MIN', { w: 1.4, h: .55, fg: P.cobalto, family: 'JetBrains Mono', weight: 800 }); lbl.position.set(W0[0], W0[1] - 1.1, 0); g.add(lbl);
		const sweep = mesh(new THREE.CircleGeometry(2.3, 48, 0, .001), mat(P.amarelo, .55)); sweep.position.set(...W0, 0); g.add(sweep);
		const hand = limb(.2, { c: P.coral, line: .06 }); g.add(hand);
		const hub = disc(.25, { c: P.tinta, line: 0 }); hub.position.set(...W0, 0); g.add(hub);
		const lines = [0, 1, 2].map(i => { const l = limb(.12, { c: P.amarelo, line: 0 }); g.add(l); return l; });
		U.push(T => {
			// o ponteiro anda "só um pouquinho": 3 passos (6,3 · 6,7 · 7,1)
			let st = 0; [6.3, 6.7, 7.1].forEach(t0 => st += ease.backOut(seg(T, t0, t0 + .18)));
			const a = st * (Math.PI * 2 / 12);
			hand.set(W0[0], W0[1], W0[0] + Math.sin(a) * 2.1, W0[1] + Math.cos(a) * 2.1);
			sweep.geometry.dispose(); sweep.geometry = new THREE.CircleGeometry(2.3, 48, Math.PI / 2 - a, Math.max(.001, a));
			const b = st > 2.9 ? Math.sin(seg(T, 7.1, 7.5) * Math.PI) * .06 : 0;
			face.scale.setScalar(1 + b); btn.position.y = W0[1] + 3.45 - (T > 6.2 && T < 6.35 ? .15 : 0);
			lines.forEach((l, i) => { const k = win(T, 7.1, 7.7, .2, .2), ang = .6 + i * .45, r0 = 3.3, r1 = 3.3 + .7 * k; l.visible = k > .01; if (l.visible) l.set(W0[0] + Math.cos(ang) * r0, W0[1] + Math.sin(ang) * r0, W0[0] + Math.cos(ang) * r1, W0[1] + Math.sin(ang) * r1); });
		});
	}

	// ═══ 3 · BANCADA DA FÓRMULA ═══
	{
		const g = mk(SET.BENCH);
		const tbl = box(12, 1.1, { r: .2, c: P.madeira }); tbl.position.set(0, -.95, 0); g.add(tbl);
		const title = plate('HipnoEMDR®', { w: 6.6, h: 1.5, bg: P.cobalto, fg: P.creme }); title.position.set(0, 7.55, 0); g.add(title);
		// pêndulo (hipnose)
		const PV = [-2.45, 6.05];
		const chain = limb(.07, { c: P.cinza, line: .04 }); g.add(chain);
		const watch = new THREE.Group(); g.add(watch);
		watch.add(disc(.82, { c: P.amarelo, line: .1, shadow: .1 }), disc(.6, { c: P.creme, line: .05 }));
		const wh = limb(.08, { c: P.tinta, line: 0 }); watch.add(wh); wh.set(0, 0, 0, .42);
		const wh2 = limb(.08, { c: P.tinta, line: 0 }); watch.add(wh2); wh2.set(0, 0, .3, -.1);
		const pivot = disc(.15, { c: P.tinta, line: 0 }); pivot.position.set(...PV, 0); g.add(pivot);
		const hip = plate('HIPNOSE', { w: 3.0, h: .85, bg: P.cobalto }); hip.position.set(-2.45, 1.45, 0); g.add(hip);
		// barra de luz (bilateral)
		const BC = [2.15, 3.55];
		const bar = box(3.5, .78, { r: .39, c: P.noite, shadow: .12 }); bar.position.set(...BC, 0); g.add(bar);
		const bhalo = mesh(new THREE.CircleGeometry(.6, 30), mat(P.amarelo, .3)); g.add(bhalo);
		const bball = disc(.3, { c: P.amarelo, line: .06 }); g.add(bball);
		const stand = box(.3, 1.1, { r: .1, c: P.cinza }); stand.position.set(BC[0], BC[1] - .95, 0); g.add(stand);
		const bil = plate(['ESTÍMULO', 'BILATERAL'], { w: 3.0, h: 1.35, bg: P.cobalto }); bil.position.set(2.15, 1.45, 0); g.add(bil);
		const plus = text('+', { w: 1.2, h: 1.5, fg: P.coral, stroke: .06 }); plus.position.set(-.15, 3.6, 0); g.add(plus);
		// coqueteleira
		const shaker = new THREE.Group(); shaker.position.set(0, 2.2, 0); g.add(shaker);
		const sb = poly([[-1.05, 2.4], [1.05, 2.4], [.8, -1.0], [-.8, -1.0]], { c: P.cinza, line: .1 }); shaker.add(sb);
		const sband = box(2.0, .4, { r: .05, c: P.coral, line: .06 }); sband.position.y = .9; shaker.add(sband);
		const lid = poly([[-1.15, 2.4], [1.15, 2.4], [.55, 3.3], [-.55, 3.3]], { c: P.cinza, line: .1 }); shaker.add(lid);
		const cap = box(.6, .5, { r: .15, c: P.coral }); cap.position.y = 3.45; shaker.add(cap);
		const shine = box(.18, 2.2, { r: .09, c: P.branco, line: 0 }); shine.position.set(-.45, .7, 0); shine.rotation.z = -.08; shaker.add(shine);
		// mini ícones que pulam para dentro
		const miniW = disc(.45, { c: P.amarelo, line: .08 }); g.add(miniW);
		const miniB = box(1.4, .4, { r: .2, c: P.noite }); g.add(miniB);
		// PROTOCOLO
		const proto = new THREE.Group(); proto.position.set(0, 3.9, 0); g.add(proto);
		const pb = box(3.6, 4.4, { r: .2, c: P.madeira, shadow: .18 }); proto.add(pb);
		const pp2 = box(3.0, 3.6, { r: .08, c: P.branco, line: .05 }); pp2.position.y = -.15; proto.add(pp2);
		const pclip = box(1.4, .5, { r: .1, c: P.cinza }); pclip.position.y = 2.2; proto.add(pclip);
		const ptxt = plate('PROTOCOLO', { w: 2.6, h: .7, bg: P.coral, fg: P.branco, shadow: 0 }); ptxt.position.y = 1.1; proto.add(ptxt);
		[0, 1, 2].forEach(i => { const l = box(2.2 - i * .4, .16, { r: .08, c: P.cinza, line: 0 }); l.position.set(-.2 + i * -.2 * 0, .1 - i * .55, 0); proto.add(l); });
		const chk = [0, 1, 2].map(i => { const c = disc(.17, { c: P.menta, line: .04 }); c.position.set(-1.25, .1 - i * .55, 0); proto.add(c); return c; });
		// braço flexionando (humor)
		const arm = new THREE.Group(); proto.add(arm); arm.position.set(1.75, .2, 0);
		const up = limb(.55, { c: P.pele }), lo = limb(.5, { c: P.pele }), bic = disc(.42, { c: P.pele, line: .08 }), fist = disc(.35, { c: P.pele, line: .08 });
		arm.add(up, bic, lo, fist);
		const sparks = [0, 1, 2, 3].map(i => { const s = star(.35); g.add(s); return s; });
		U.push(T => {
			show(title, (T < 9.1 ? pop(T, 7.75, .4) * gone(T, 9.1) : pop(T, 13.35, .4)) * (1 + .02 * Math.sin(T * 4)));
			// pêndulo balançando
			const a = .5 * Math.sin(T * 2 * Math.PI * .75), L = 3.15, kW = pop(T, 9.15, .45) * (1 - ease.expoIn(seg(T, 13.35, 13.6)));
			const wx = PV[0] + Math.sin(a) * L, wy = PV[1] - Math.cos(a) * L;
			chain.visible = pivot.visible = kW > .01; if (chain.visible) chain.set(PV[0], PV[1], lerp(PV[0], wx, kW), lerp(PV[1], wy, kW));
			show(watch, kW); watch.position.set(wx, wy, 0); watch.rotation.z = a * .6;
			show(hip, pop(T, 10.55, .35) * gone(T, 13.55));
			// barra
			const kB = pop(T, 11.9, .4) * (1 - ease.expoIn(seg(T, 13.45, 13.7)));
			show(bar, kB); show(stand, kB);
			const bx = BC[0] + 1.32 * Math.sin(T * 2 * Math.PI * .95);
			bball.position.set(bx, BC[1], 0); bhalo.position.set(bx, BC[1], 0); show(bball, kB); show(bhalo, kB * (1 + .1 * Math.sin(T * 12)));
			show(bil, pop(T, 12.05, .35) * gone(T, 13.65));
			show(plus, win(T, 11.95, 13.4, .3, .2)); plus.rotation.z = Math.sin(T * 5) * .1;
			// pulam para a coqueteleira (13,4–13,9)
			const kS = pop(T, 13.3, .4) * gone(T, 15.25, .25), j = seg(T, 13.45, 13.95), je = ease.cubicInOut(j);
			show(shaker, kS);
			const shake = T > 13.95 && T < 14.95 ? Math.sin(T * 22) : 0;
			shaker.rotation.z = shake * .22 + (T > 14.95 ? -ease.expoOut(seg(T, 14.95, 15.2)) * .9 : 0);
			shaker.position.set(shake * .25, 2.2 + Math.abs(shake) * .15, 0);
			const arcP = (x0, y0, u) => [lerp(x0, 0, u), lerp(y0, 6.0, u) + Math.sin(u * Math.PI) * 2.2];
			const m1 = arcP(-2.45, 3.0, je), m2 = arcP(2.15, 3.55, je), km = j > 0 && j < 1 ? 1 - ease.expoIn(seg(j, .75, 1)) : 0;
			show(miniW, km); miniW.position.set(...m1, 0); show(miniB, km); miniB.position.set(...m2, 0); miniB.rotation.z = j * 4;
			// protocolo salta (15,05)
			const kP = ease.elasticOut(seg(T, 15.05, 15.9)) * gone(T, 17.95, .1);
			show(proto, kP * (1 + .015 * Math.sin(T * 5))); proto.rotation.z = Math.sin(T * 2.4) * .03;
			chk.forEach((c, i) => show(c, pop(T, 15.9 + i * .35, .3)));
			// flexão: cotovelo dobra e o bíceps incha
			const fl = .5 + .5 * Math.sin((T - 15.6) * 7), on = seg(T, 15.5, 15.8);
			const ex = 1.0, ey = .1, ang = lerp(.3, 1.6, fl * on), hx = ex + Math.cos(ang) * .9 * -0 + .1, hy = ey + .95;
			up.set(0, 0, ex, ey); lo.set(ex, ey, ex + Math.cos(Math.PI / 2 + ang * .5) * .2 + .25, ey + Math.sin(Math.PI / 2 + ang * .3) * 1.0);
			fist.position.set(ex + .25 + Math.cos(Math.PI / 2 + ang * .5) * .2, ey + 1.0, 0); bic.position.set(.55, .28, 0); bic.scale.setScalar(.6 + .5 * fl * on);
			sparks.forEach((s, i) => { const k = win(T, 15.3 + i * .12, 17.95, .3, .1); show(s, k * (.7 + .3 * Math.sin(T * 9 + i * 2))); s.rotation.z = T * 3 * (i % 2 ? 1 : -1); s.position.set([-2.3, 2.4, -2.0, 2.6][i], [6.2, 6.4, 1.3, 1.6][i], 0); });
		});
	}

	// ═══ 4 · ARQUIVO DE MEMÓRIAS ═══
	{
		const g = mk(SET.FILE);
		const cab = box(4.6, 6.9, { r: .25, c: P.creme, shadow: .22 }); cab.position.set(0, 2.55, 0); g.add(cab);
		const inside = box(3.9, .7, { r: .06, c: P.tinta, line: 0 }); inside.position.set(0, 4.95, 0); g.add(inside);
		const drawers = [4.55, 2.45, .35].map((y, i) => {
			const d = new THREE.Group(); d.position.set(0, y, 0); g.add(d);
			d.add(box(4.0, 1.85, { r: .14, c: i ? '#E9DDC6' : P.amarelo }));
			const h = box(1.3, .28, { r: .14, c: P.tinta, line: 0 }); h.position.y = -.4; d.add(h);
			if (!i) { const lb = plate('MEMÓRIAS', { w: 2.4, h: .6, bg: P.branco, fg: P.tinta, shadow: 0 }); lb.position.y = .3; d.add(lb); }
			else { const lb = box(1.6, .4, { r: .04, c: P.branco, line: .04 }); lb.position.y = .3; d.add(lb); }
			return d;
		});
		const pola = polaroid(1.15); g.add(pola);
		const alarm = [-1, 1].map(s => [0, 1].map(k => { const l = limb(.16, { c: P.coral, line: .05 }); g.add(l); return l; }));
		const exc = text('!', { w: 1, h: 1.4, fg: P.coral, stroke: .06 }); g.add(exc);
		U.push(T => {
			const o = ease.backOut(seg(T, 19.25, 19.65));
			drawers[0].position.y = 4.55 - o * .35; drawers[0].scale.setScalar(1 + o * .1); inside.visible = o > .02; inside.scale.y = Math.max(o, 1e-3);
			const u = ease.expoOut(seg(T, 19.55, 20.2)), k = pop(T, 19.55, .5);
			const shake = T > 20.2 ? (Math.sin(T * 17) * .06 + Math.sin(T * 11) * .04) * (1 + seg(T, 20.8, 23)) : 0;
			show(pola, k); pola.position.set(shake, lerp(4.6, 7.6, u), 0); pola.rotation.z = lerp(.4, -.06, u) + shake * .5;
			pola.charge(1);
			const ak = win(T, 20.8, 23.85, .3, .15);
			alarm.forEach((pair, i) => pair.forEach((l, j) => { const s = i ? 1 : -1, ang = (j ? .35 : -.2) + Math.sin(T * 9) * .05, r0 = 1.75, r1 = 1.75 + .65 * ak; l.visible = ak > .01; if (l.visible) l.set(s * Math.cos(ang) * r0, 7.6 + Math.sin(ang) * r0, s * Math.cos(ang) * r1, 7.6 + Math.sin(ang) * r1); }));
			show(exc, ak); exc.position.set(1.85, 9.2 + Math.sin(T * 10) * .1, 0); exc.rotation.z = Math.sin(T * 8) * .2;
		});
	}

	// ═══ 5 · DENTRO DA CABEÇA: rede neural flat ═══
	let NET;
	{
		const g = mk(SET.NET);
		const skull = mesh(new THREE.RingGeometry(6.2, 6.55, 80), mat('#2A3080')); skull.position.set(0, 3.5, 0); g.add(skull);
		const r2 = mulberry32(55), nodes = [];
		for (let i = 0; i < 26; i++) {
			const a = r2() * Math.PI * 2, rr = Math.sqrt(r2()) * 4.8;
			const x = clamp(Math.cos(a) * rr, -4.3, 3.6), y = 3.5 + Math.sin(a) * rr * 1.05;
			if (y < -1.1 || y > 8.6) { i--; continue; }
			if (nodes.some(n => Math.hypot(n[0] - x, n[1] - y) < 1.25)) { i--; continue; }
			nodes.push([x, y]);
		}
		const PATH = [[-3.25, 7.35], [-1.85, 5.95], [-.55, 6.75], [.55, 5.2], [1.6, 3.8], [.65, 2.35], [1.85, .7]];
		const all = nodes.filter(n => !PATH.some(p => Math.hypot(p[0] - n[0], p[1] - n[1]) < 1.0));
		// cabos de fundo (vizinhos próximos)
		const dim = '#3A4196';
		const edges = [];
		all.forEach((a, i) => all.forEach((b, j) => { if (j > i && Math.hypot(a[0] - b[0], a[1] - b[1]) < 2.0) edges.push([a, b]); }));
		const cables = edges.map(([a, b]) => { const l = limb(.1, { c: dim, line: 0 }); l.set(a[0], a[1], b[0], b[1]); g.add(l); return l; });
		// ligações entre o caminho e o resto
		PATH.forEach((p, i) => { const nn = all.map(n => [Math.hypot(n[0] - p[0], n[1] - p[1]), n]).sort((x, y) => x[0] - y[0]).slice(0, 2); nn.forEach(([, n]) => { const l = limb(.1, { c: dim, line: 0 }); l.set(p[0], p[1], n[0], n[1]); g.add(l); }); });
		const dots = all.map(([x, y], i) => { const d = disc(.26, { c: '#5867E8', line: .06 }); d.position.set(x, y, 0); g.add(d); return d; });
		// caminho específico
		const cA = new THREE.Color(P.coral), cB = new THREE.Color(P.calmo), cD = new THREE.Color(dim);
		const pmats = PATH.slice(1).map(() => mat(dim));
		const pcab = PATH.slice(1).map((b, i) => { const a = PATH[i], l = limb(.22, { line: .05, fillMat: pmats[i] }); l.set(a[0], a[1], b[0], b[1]); g.add(l); return l; });
		const nmats = PATH.map(() => mat('#5867E8'));
		const pdots = PATH.slice(0, -1).map(([x, y], i) => { const d = disc(.36, { line: .07, fillMat: nmats[i] }); d.position.set(x, y, 0); g.add(d); return d; });
		const mini = polaroid(.42); mini.position.set(PATH[0][0], PATH[0][1] + .2, 0); g.add(mini);
		// sino de alarme
		const bell = new THREE.Group(); bell.position.set(...PATH[6], 0); g.add(bell);
		const bmat = mat(P.cinza);
		const bb = poly([[-.85, -.55], [.85, -.55], [.62, .1], [.5, .75], [0, 1.05], [-.5, .75], [-.62, .1]], { line: .08, fillMat: bmat }); bell.add(bb);
		const brim = box(2.0, .3, { r: .15, line: .07, fillMat: bmat }); brim.position.y = -.6; bell.add(brim);
		const clap = disc(.2, { c: P.tinta, line: 0 }); clap.position.y = -.85; bell.add(clap);
		const rings = [0, 1, 2, 3].map(i => { const l = limb(.12, { c: P.coral, line: 0 }); g.add(l); return l; });
		const pulses = [0, 1, 2].map(() => { const d = disc(.17, { c: P.amarelo, line: .04 }); g.add(d); return d; });
		// bolinha bilateral gigante + rastro
		const ghosts = [1, 2, 3, 4].map(k => { const m = mesh(new THREE.CircleGeometry(.62, 30), mat(P.amarelo, .3 - k * .06)); g.add(m); return m; });
		const halo = mesh(new THREE.CircleGeometry(1.2, 40), mat(P.amarelo, .22)); g.add(halo);
		const ball = disc(.7, { c: P.amarelo, line: .1 }); g.add(ball);
		const shine = mesh(new THREE.CircleGeometry(.2, 20), P.branco); g.add(shine);
		const ON = i => seg(NET.T, 24.45 + i * .3, 24.75 + i * .3);
		const bx = T => -5.3 * Math.cos(Math.PI * (T - 29.75) / .8);
		NET = { T: 0 };
		U.push(T => {
			NET.T = T;
			// ativação: acende em sequência (24,45–26,6); esfria a cada passada da bolinha (30,2–34,4)
			const calm = ease.cubicInOut(seg(T, 30.1, 34.35)), steps = clamp(Math.floor((T - 29.75) / .8 + .5) / 6, 0, 1), cool = lerp(calm, steps, .5);
			const tmp = new THREE.Color();
			pmats.forEach((m, i) => { const on = ON(i + 1); tmp.copy(cD).lerp(cA, on); if (cool > 0) tmp.lerp(cB, cool * on); m.color.copy(tmp); });
			nmats.forEach((m, i) => { const on = ON(i); tmp.set('#5867E8').lerp(cA, on); if (cool > 0) tmp.lerp(cB, cool * on); m.color.copy(tmp); });
			pdots.forEach((d, i) => d.scale.setScalar(1 + ON(i) * (1 - cool) * .12 * (1 + Math.sin(T * 8 - i))));
			const act = ON(6) * (1 - cool);
			mini.charge(1 - cool); mini.rotation.z = Math.sin(T * 13) * .05 * act;
			bmat.color.set(P.cinza).lerp(new THREE.Color(P.amarelo), ON(6)); if (cool > 0) bmat.color.lerp(cB, cool);
			bell.rotation.z = Math.sin(T * 14) * .22 * act; clap.position.x = Math.sin(T * 14 + 1) * .2 * act;
			rings.forEach((l, i) => { const s = i % 2 ? 1 : -1, ang = (i < 2 ? .25 : .75), r0 = 1.25, r1 = 1.25 + .6 * act * (1 + .2 * Math.sin(T * 9)); l.visible = act > .03; if (l.visible) l.set(PATH[6][0] + s * Math.cos(ang) * r0, PATH[6][1] + Math.sin(ang) * r0, PATH[6][0] + s * Math.cos(ang) * r1, PATH[6][1] + Math.sin(ang) * r1); });
			// pulsos correndo pelo caminho enquanto ativo
			pulses.forEach((p, i) => {
				const u = ((T * .55 + i / 3) % 1) * 6, j = Math.floor(u), f = u - j, a = PATH[j], b = PATH[j + 1];
				const k = ON(6) * (1 - cool); show(p, k); p.position.set(lerp(a[0], b[0], f), lerp(a[1], b[1], f), 0);
			});
			dots.forEach((d, i) => d.scale.setScalar(1 + .06 * Math.sin(T * 2 + i)));
			// bolinha
			const kb = win(T, 29.75, 34.65, .2, .2), x = bx(T);
			show(ball, kb); show(halo, kb * (1 + .08 * Math.sin(T * 10))); show(shine, kb);
			ball.position.set(x, 4.0, 0); halo.position.set(x, 4.0, 0); shine.position.set(x + .22, 4.22, 0);
			ghosts.forEach((m, k) => { m.visible = kb > .01; m.position.set(bx(T - (k + 1) * .035), 4.0, 0); });
		});
	}

	// ═══ 6 · MESA TELEFÔNICA: trocar as conexões ═══
	{
		const g = mk(SET.SWITCH);
		const panel = box(7.4, 7.6, { r: .35, c: P.cobalto, shadow: .22 }); panel.position.set(0, 3.9, 0); g.add(panel);
		const la = plate('ALARME', { w: 2.9, h: .78, bg: P.coral, fg: P.branco }); la.position.set(0, 3.55, 0); g.add(la);
		const lc = plate('CALMA', { w: 2.9, h: .78, bg: P.menta, fg: P.tinta }); lc.position.set(0, 7.0, 0); g.add(lc);
		const SX = [-2.2, 0, 2.2], YA = 2.3, YC = 5.75;
		const sockets = [];
		for (const y of [YA, YC]) for (const x of SX) { const s = disc(.42, { c: P.noite, line: .08 }); s.position.set(x, y, 0); g.add(s); const h = mesh(new THREE.CircleGeometry(.16, 20), P.tinta); h.position.set(x, y, 0); g.add(h); sockets.push(s); }
		const lamps = [YA, YC].map((y, i) => SX.map(x => { const l = disc(.16, { fillMat: mat(i ? '#3A6B5A' : '#7A2E2E'), line: .04 }); l.position.set(x + .75, y + .45, 0); g.add(l); return l; }));
		// cabos: começam embaixo do painel e terminam num plugue
		const cab = [0, 1, 2].map(i => {
			const st = stroke(22, .2, { fillMat: mat(P.amarelo), line: .06 }); g.add(st);
			const pm = mat(P.amarelo), plug = new THREE.Group(); plug.userData.pm = pm; plug.add(box(.42, .5, { r: .08, fillMat: pm }), (() => { const b = box(.22, .55, { r: .04, c: P.cinza, line: .05 }); b.position.y = -.5; return b; })());
			const tip = box(.12, .3, { r: .03, c: P.cinza, line: .04 }); tip.position.y = .38; plug.add(tip); raise(plug.children[0]);
			g.add(plug); return { st, plug };
		});
		raise(la); raise(lc); lamps.flat().forEach(raise); // placas por cima dos cabos
		// mão do terapeuta (manga de jaleco)
		const sleeve = limb(.9, { c: P.creme }), hand = disc(.48, { c: P.pele, line: .08 }), thumb = box(.24, .5, { r: .12, c: P.pele, line: .07 });
		g.add(sleeve, hand, thumb);
		const sparks = [0, 1, 2].map(i => { const s = star(.32); g.add(s); return s; });
		// trajetória do plugue i: sai do ALARME e vai para a CALMA
		const plan = [[35.2, 36.35], [36.95, 37.55], [37.55, 38.15]];
		const plugAt = (i, T) => {
			const [a, b] = plan[i], x = SX[[1, 0, 2][i]], u = ease.cubicInOut(seg(T, a, b));
			const pull = ease.expoOut(seg(T, a - .3, a)) * .5;
			const y = lerp(YA - .55 - pull, YC - .55, u), bulge = Math.sin(u * Math.PI) * (i ? 1.4 : 2.2) * (i === 2 ? 1 : -1) * (i ? 1 : -1);
			return [x + bulge * (u > 0 && u < 1 ? 1 : 0) * Math.sin(u * Math.PI), u >= 1 ? YC - .55 : y];
		};
		U.push(T => {
			cab.forEach(({ st, plug }, i) => {
				const [px, py] = plugAt(i, T), x0 = SX[[1, 0, 2][i]], y0 = -.2;
				plug.position.set(px, py, 0); plug.rotation.z = 0;
				st.set(u => { const a = 1 - u; const c1 = [x0, 1.6], c2 = [px, py - 1.6]; return [a * a * a * x0 + 3 * a * a * u * c1[0] + 3 * a * u * u * c2[0] + u * u * u * px, a * a * a * y0 + 3 * a * a * u * c1[1] + 3 * a * u * u * c2[1] + u * u * u * (py - .75)]; }, 1);
				const done = T > plan[i][1];
				st.userData.mat.color.set(done ? P.menta : P.amarelo);
				plug.userData.pm.color.set(done ? P.menta : P.amarelo);
			});
			lamps[0].forEach((l, i) => { const on = T < plan[[1, 0, 2].indexOf(i)][0]; l.userData.fill.material.color.set(on ? (Math.sin(T * 7) > 0 ? P.coral : '#7A2E2E') : '#5A4A55'); });
			lamps[1].forEach((l, i) => { const on = T > plan[[1, 0, 2].indexOf(i)][1]; l.userData.fill.material.color.set(on ? P.menta : '#3A6B5A'); });
			// mão: entra (34,8), segura o plugue do meio, sai (36,7)
			const hk = win(T, 34.75, 36.75, .4, .35), [px, py] = plugAt(0, T);
			const hx = lerp(-7.5, px - .05, hk), hy = lerp(py - 1.5, py - .15, hk);
			sleeve.visible = hand.visible = thumb.visible = hk > .01;
			if (hk > .01) { sleeve.set(-9, hy - 2.5, hx - .35, hy - .3); hand.position.set(hx, hy, 0); thumb.position.set(hx + .42, hy + .1, 0); thumb.rotation.z = -.3; }
			sparks.forEach((s, i) => { const t0 = plan[i][1], k = win(T, t0, t0 + .6, .15, .3); show(s, k); const x = SX[[1, 0, 2][i]]; s.position.set(x + [.6, -.6, .6][i], YC + .3, 0); s.rotation.z = T * 4; });
		});
	}

	// ═══ 7 · ESTRUTURA DO TRAUMA: torre que desaba ═══
	{
		const g = mk(SET.TOWER);
		const ground = box(10.5, .35, { r: .17, c: P.creme }); ground.position.set(0, -1.35, 0); g.add(ground);
		const r3 = mulberry32(777), H = .95, blocks = [];
		let y = -1.15;
		for (let i = 0; i < 7; i++) {
			const w = 2.1 + r3() * 1.3, x = (r3() - .5) * .5, m = mat(P.coral);
			const b = box(w, H, { r: .12, line: .08, fillMat: m }); g.add(b);
			const crack = limb(.07, { c: P.tinta, line: 0 }); b.add(crack); crack.set(-w * .3, .2, -w * .1, -.15);
			const y0 = y + H / 2; y += H + .02;
			const rest = [(-3.2 + i * 1.05) + (r3() - .5) * .4, -1.15 + .5 * .7 + (i % 3 === 1 ? .62 : 0)];
			blocks.push({ b, m, w, x, y0, rest, rot: (r3() - .5) * .8, t0: 41.85 + (6 - i) * .06 + r3() * .08, dur: .45 + r3() * .2 });
		}
		const pola = polaroid(.75); g.add(pola);
		const topY = y + .9;
		const dust = Array.from({ length: 12 }, (_, i) => { const d = mesh(new THREE.CircleGeometry(.25 + rng() * .25, 16), mat(P.creme, .7)); d.userData = { a: rng() * Math.PI, v: 1.5 + rng() * 2 }; g.add(d); return d; });
		const cA = new THREE.Color(P.coral), cB = new THREE.Color(P.cinza);
		U.push(T => {
			const sway = (.012 + .05 * seg(T, 38.8, 41.8)) * Math.sin(T * 6.5), fall = T > 41.85;
			const gray = ease.cubicInOut(seg(T, 42.3, 43.8));
			blocks.forEach(o => {
				const pivotRot = sway, cx = o.x, cy = o.y0 + 1.15;
				let px = cx * Math.cos(pivotRot) - cy * Math.sin(pivotRot), py = cx * Math.sin(pivotRot) + cy * Math.cos(pivotRot) - 1.15, rot = pivotRot;
				const u = seg(T, o.t0, o.t0 + o.dur);
				if (fall && u > 0) {
					const e = ease.cubicOut(u), bounce = Math.sin(seg(T, o.t0 + o.dur, o.t0 + o.dur + .25) * Math.PI) * .3;
					px = lerp(px, o.rest[0], e); py = lerp(py, o.rest[1], u * u) + bounce; rot = lerp(rot, o.rot, e);
				}
				o.b.position.set(px, py, 0); o.b.rotation.z = rot;
				o.b.scale.setScalar(lerp(1, .7, gray));
				o.m.color.copy(cA).lerp(cB, gray);
			});
			const pu = seg(T, 41.9, 42.55);
			const ptop = [-Math.sin(sway) * (topY + 1.15), topY + (Math.cos(sway) - 1) * (topY + 1.15)];
			pola.position.set(lerp(ptop[0], 2.6, ease.cubicOut(pu)), lerp(ptop[1], -.5, pu * pu) + Math.sin(seg(T, 42.55, 42.8) * Math.PI) * .3, 0);
			pola.rotation.z = lerp(sway, -.35, ease.cubicOut(pu)); pola.charge(1 - gray);
			dust.forEach((d, i) => { const u = seg(T, 42.2, 43.4); d.visible = u > 0 && u < 1; if (!d.visible) return; const { a, v } = d.userData; d.position.set(Math.cos(a) * u * v * 2 - 1 + i * .2, -1.0 + Math.sin(a) * u * v * .7, 0); d.scale.setScalar(1 - u); });
		});
	}

	// ═══ 8 · CALENDÁRIO: muitos meses (gag) ═══
	{
		const g = mk(SET.CAL);
		const title = plate('OUTRAS TERAPIAS', { w: 6.0, h: 1.05, bg: P.tinta, fg: P.creme }); title.position.set(0, 7.75, 0); g.add(title);
		const C0 = [-1.35, 3.4];
		const cal = box(4.2, 4.7, { r: .2, c: P.branco, shadow: .2 }); cal.position.set(...C0, 0); g.add(cal);
		const head = box(4.2, 1.0, { r: .2, c: P.cobalto }); head.position.set(C0[0], C0[1] + 1.85, 0); g.add(head);
		[-1.2, 0, 1.2].forEach(x => { const r = box(.22, .7, { r: .11, c: P.cinza }); r.position.set(C0[0] + x, C0[1] + 2.4, 0); g.add(r); });
		const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ', 'JAN'];
		const pages = MESES.map((m, i) => { const p = new THREE.Group(); p.add(box(3.9, 3.4, { r: .1, c: P.branco, line: .05 })); const t = text(m, { w: 3.2, h: 2.0, fg: i % 12 === 0 ? P.coral : P.tinta }); t.position.y = .3; p.add(t); const sub = text(i < 12 ? '2026' : '2027', { w: 1.6, h: .5, fg: P.cinza, family: 'JetBrains Mono', weight: 700 }); sub.position.y = -1.15; p.add(sub); g.add(p); return p; });
		pages.reverse().forEach(p => raise(p)); pages.reverse(); // a página atual por cima
		const th = person({ coat: true, shirt: P.cobalto, hair: P.castanho, glasses: true }); th.g.scale.setScalar(1.05); th.g.position.set(2.75, -.4, 0); g.add(th.g);
		const web = new THREE.Group(); g.add(web);
		for (let i = 0; i < 5; i++) { const l = limb(.035, { c: P.branco, line: 0 }); const a = -Math.PI / 2 * i / 4; l.set(0, 0, Math.cos(a) * 1.3, Math.sin(a) * 1.3); web.add(l); }
		for (let r = 1; r <= 3; r++) for (let i = 0; i < 4; i++) { const a0 = -Math.PI / 2 * i / 4, a1 = -Math.PI / 2 * (i + 1) / 4, k = r * .38; const l = limb(.03, { c: P.branco, line: 0 }); l.set(Math.cos(a0) * k, Math.sin(a0) * k, Math.cos(a1) * k, Math.sin(a1) * k); web.add(l); }
		web.position.set(C0[0] - 2.1, C0[1] + 2.35, 0);
		const spider = disc(.12, { c: P.tinta, line: 0 }); g.add(spider);
		const X = [limb(.42, { c: P.creme, line: .1 }), limb(.42, { c: P.creme, line: .1 })]; X.forEach(x => g.add(x));
		U.push(T => {
			show(title, pop(T, 47.7, .35) * (1 + .015 * Math.sin(T * 4)));
			// folhas arrancadas: uma a cada 0,3 s de 48,3 a 51,9
			pages.forEach((p, i) => {
				const t0 = 48.3 + i * .3, u = seg(T, t0, t0 + .55);
				p.visible = i === pages.length - 1 || T < t0 + .55;
				p.position.set(C0[0] + u * u * 4.5, C0[1] - .45 + Math.sin(u * Math.PI) * 1.4 + u * 2, 0);
				p.rotation.z = -u * 1.6; p.scale.setScalar(1 - u * .4);
			});
			const beard = ease.cubicInOut(seg(T, 48.8, 52.0));
			th.beard.visible = beard > .01; th.beard.scale.set(1, Math.max(beard * 1.25, 1e-3), 1);
			th.g.setPose({ la: [.3, .4], ra: [.3, .4], look: [-.9, .2], brow: .6, mouth: 'flat', blink: .35 + blinkAt(T, 3) * .6, lean: -.03 * beard, tilt: Math.sin(T * 1.2) * .04 });
			const wk = ease.backOut(seg(T, 50.7, 51.1)); show(web, wk);
			show(spider, wk); spider.position.set(C0[0] - 1.25, C0[1] + 1.6 - Math.abs(Math.sin(T * 2)) * .4, 0);
			const xk = [seg(T, 51.55, 51.75), seg(T, 51.75, 51.95)];
			X[0].visible = xk[0] > 0; X[0].set(-4.0, 6.0, lerp(-4.0, 4.0, ease.expoOut(xk[0])), lerp(6.0, .3, ease.expoOut(xk[0])));
			X[1].visible = xk[1] > 0; X[1].set(4.0, 6.0, lerp(4.0, -4.0, ease.expoOut(xk[1])), lerp(6.0, .3, ease.expoOut(xk[1])));
		});
	}

	// ═══ 9 · POUCAS SESSÕES ═══
	{
		const g = mk(SET.TICKETS);
		const tk = [0, 1, 2].map(i => {
			const t = new THREE.Group(); g.add(t);
			t.add(box(4.6, 1.6, { r: .2, c: [P.cobalto, P.coral, P.amarelo][i], shadow: .16 }));
			[-1, 1].forEach(s => { const n = disc(.3, { c: P.creme, line: .08 }); n.position.set(s * 2.38, 0, 0); t.add(n); });
			const lb = plate(`SESSÃO ${i + 1}`, { w: 3.0, h: .9, bg: P.branco, fg: P.tinta, shadow: 0 }); lb.position.x = -.3; t.add(lb);
			const ck = stroke(8, .26, { c: P.menta, line: .08 }); g.add(ck);
			return { t, ck };
		});
		const hand = [0, 1, 2];
		U.push(T => {
			tk.forEach(({ t, ck }, i) => {
				const k = ease.backOut(seg(T, 52.85 + i * .22, 53.25 + i * .22));
				show(t, k); t.position.set(-.5 + Math.sin(T * 1.5 + i) * .05, 6.3 - i * 2.1, 0); t.rotation.z = [-.05, .04, -.03][i] + Math.sin(T * 2 + i) * .01;
				const d = seg(T, 53.55 + i * .45, 53.8 + i * .45), cx = 2.55, cy = 6.3 - i * 2.1;
				ck.visible = d > 0;
				ck.set(u => u < .35 ? [cx - .5 + u / .35 * .4, cy + .05 - u / .35 * .4] : [cx - .1 + (u - .35) / .65 * .8, cy - .35 + (u - .35) / .65 * 1.0], d);
			});
		});
	}

	const update = T => U.forEach(f => f(T));
	return { root, sets, update };
}

// ── câmera: chaves { t, set, x, y, vh, rot, dur, tr: 'ball'|'iris'|'zoom' (entrada no set), at: [u,v] da íris/zoom } ──
// aim(): coloca o ponto (tx,ty) na faixa de cima-centro da tela (y ≈ 640 px) com altura de visão V
const aim = (tx, ty, V) => ({ x: tx, y: ty - V * .1667, vh: V });
export const K = [
	{ t: 0, set: SET.FACE, ...aim(0, 4.1, 17.0) },
	{ t: .95, dur: .45, set: SET.FACE, ...aim(0, 4.3, 14.6) },
	{ t: 2.98, set: SET.ROOM, tr: 'zoom', at: [.5, .55], ...aim(0, 3.6, 17.5) },
	{ t: 4.6, dur: .5, set: SET.ROOM, ...aim(-.7, 5.0, 11.5) },
	{ t: 6.0, set: SET.WATCH, tr: 'iris', at: [.62, .45], ...aim(0, 3.4, 12.5) },
	{ t: 7.65, set: SET.BENCH, tr: 'ball', ...aim(0, 6.6, 9.5) },
	{ t: 9.0, dur: .55, set: SET.BENCH, ...aim(-1.9, 3.6, 9.8) },
	{ t: 11.85, dur: .5, set: SET.BENCH, ...aim(1.7, 3.6, 9.8) },
	{ t: 13.3, dur: .5, set: SET.BENCH, ...aim(0, 4.6, 13.5) },
	{ t: 14.95, dur: .3, set: SET.BENCH, ...aim(0, 4.3, 10.5), rot: .02 },
	{ t: 17.9, set: SET.ROOM, tr: 'ball', ...aim(2.2, 4.4, 9.5) },
	{ t: 19.0, set: SET.FILE, tr: 'ball', ...aim(0, 4.6, 13.5) },
	{ t: 20.8, dur: .5, set: SET.FILE, ...aim(0, 7.75, 6.9), rot: -.02 },
	{ t: 23.8, set: SET.NET, tr: 'zoom', at: [.5, .32], ...aim(0, 3.9, 18.6) },
	{ t: 25.8, dur: .5, set: SET.NET, ...aim(-.4, 5.4, 11.5) },
	{ t: 27.8, dur: .45, set: SET.NET, ...aim(1.3, 2.2, 9.0), rot: .02 },
	{ t: 29.75, dur: .45, set: SET.NET, ...aim(0, 4.0, 18.6) },
	{ t: 32.4, dur: 1.2, set: SET.NET, ...aim(.2, 3.4, 15.2) },
	{ t: 34.6, set: SET.SWITCH, tr: 'iris', at: [.5, .38], ...aim(0, 4.2, 10.5) },
	{ t: 36.3, dur: .6, set: SET.SWITCH, ...aim(0, 4.0, 12.8) },
	{ t: 38.7, set: SET.TOWER, tr: 'ball', ...aim(0, 3.2, 15.5) },
	{ t: 40.2, dur: .6, set: SET.TOWER, ...aim(0, 5.7, 9.6) },
	{ t: 41.75, dur: .35, set: SET.TOWER, ...aim(0, 1.3, 11.5), rot: -.02 },
	{ t: 44.7, set: SET.ROOM, tr: 'iris', at: [.4, .4], ...aim(-1.4, 4.3, 10.5) },
	{ t: 47.6, set: SET.CAL, tr: 'iris', at: [.5, .5], ...aim(0, 4.5, 15.2) },
	{ t: 50.6, dur: .5, set: SET.CAL, ...aim(1.9, 3.5, 9.6) },
	{ t: 51.5, dur: .3, set: SET.CAL, ...aim(0, 4.0, 14.8) },
	{ t: 52.8, set: SET.TICKETS, tr: 'ball', ...aim(.3, 4.6, 12.5) },
	{ t: 55.2, set: SET.ROOM, tr: 'iris', at: [.5, .5], ...aim(0, 3.8, 16.5) },
	{ t: 58.55, set: SET.FACE, tr: 'ball', ...aim(0, 4.1, 15.8) },
];
const TD = .42; // duração das transições
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
