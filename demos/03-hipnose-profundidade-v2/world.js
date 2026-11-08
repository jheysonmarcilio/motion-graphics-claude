// Maquete do 03 v2: prédio em corte com andares subterrâneos (profundidade do transe), elevador, consultório,
// loja de "técnicas mágicas", praia do lugar seguro, portas de protocolos. Só constrói; quem anima é scenes.js.
import * as THREE from 'three';
import { P, mat, own, box, mesh, sign, signCanvas, texOf, toy, iconBadge, fitFont } from './toy.js';
import { mulberry32 } from './lib.js';

export const FH = 3, FLOORS = 7;            // altura do andar · andares abaixo do térreo
export const fy = k => k * FH;               // y do piso do andar k (0 = térreo, −1…−7)
export const XL = -3.85, XR = 3.85;          // centro das salas esquerda/direita
export const STORE_X = 30;

const depthCol = k => new THREE.Color('#FFE6D2').lerp(new THREE.Color(P.fundo), Math.min(1, -k / FLOORS) ** .85);

function earthTex(seed) {
	const c = document.createElement('canvas'); c.width = 256; c.height = 512; const g = c.getContext('2d'), r = mulberry32(seed);
	g.fillStyle = P.terra; g.fillRect(0, 0, 256, 512);
	for (let i = 0; i < 2600; i++) { g.fillStyle = r() < .5 ? 'rgba(60,35,20,.35)' : 'rgba(190,140,95,.3)'; g.beginPath(); g.arc(r() * 256, r() * 512, .8 + r() * 2.5, 0, 7); g.fill(); }
	for (let i = 0; i < 40; i++) { g.fillStyle = ['#A9A39A', '#8E8378', '#C2B8A8'][i % 3]; g.beginPath(); g.ellipse(r() * 256, r() * 512, 5 + r() * 9, 4 + r() * 6, r() * 3, 0, 7); g.fill(); }
	const t = texOf(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

export function buildWorld() {
	const root = new THREE.Group(), rng = mulberry32(303);
	const W = {};

	// ── terreno ──
	const et = earthTex(7); et.repeat.set(2, 6);
	const earthM = new THREE.MeshStandardMaterial({ map: et, roughness: .95 });
	for (const s of [-1, 1]) {
		const e = new THREE.Mesh(new THREE.BoxGeometry(14, 27, 6), earthM); e.position.set(s * (6.3 + 7), -13.5, 0); e.receiveShadow = true; root.add(e);
		const gr = box(14, .3, 6, '#7CCB6B', .1); gr.position.set(s * (6.3 + 7), .15 - .3, 0); root.add(gr);
		for (let i = 0; i < 4; i++) {          // arvorezinhas na superfície
			const x = s * (8 + i * 2.6 + rng()), tr = new THREE.Group(); tr.position.set(x, 0, -1 + rng() * 1.5);
			const tk = box(.22, 1, .22, P.madeira, .05); tk.position.y = .5; tr.add(tk);
			const cr = mesh(new THREE.SphereGeometry(.7 + rng() * .3, 16, 12), ['#6CC56B', '#8FD87A', '#5DB27A'][i % 3]); cr.position.y = 1.4; tr.add(cr);
			root.add(tr);
		}
	}
	const rock = box(40, 4, 6, '#6E4A33', .1); rock.position.set(0, fy(-FLOORS) - .35 - 2, 0); root.add(rock);
	// nuvens
	for (let i = 0; i < 6; i++) {
		const cl = new THREE.Group(); cl.position.set(-14 + i * 6 + rng() * 2, 7 + rng() * 5, -6 - rng() * 4);
		for (let j = 0; j < 4; j++) { const b = mesh(new THREE.SphereGeometry(.6 + rng() * .5, 14, 10), '#FFFFFF'); b.position.set(j * .7 - 1, rng() * .3, 0); b.castShadow = false; cl.add(b); }
		root.add(cl);
	}

	// ── prédio ──
	const bld = new THREE.Group(); root.add(bld);
	for (let k = 1; k >= -FLOORS; k--) {          // lajes (k = 1 é o telhado)
		const y = fy(k) - .175;
		for (const x of [XL, XR]) { const s = box(4.7, .35, 4.9, k === 1 ? '#E9E1D4' : '#D8CFC2', .06); s.position.set(x, y, 0); bld.add(s); }
		if (k === 1) { const r = box(3.1, .35, 4.9, '#E9E1D4', .06); r.position.set(0, y, 0); bld.add(r); }
		if (k <= 0 && k > -FLOORS - 1) {         // número do andar na laje (frente)
			const n = sign([k === 0 ? 'TÉRREO' : String(k)], 1.15, { w: 360, h: 150, bg: P.navy, fg: '#FFFFFF', radius: 30 });
			n.position.set(-5.45, y, 2.47); bld.add(n);
		}
	}
	for (let k = 0; k >= -FLOORS; k--) {          // paredes do fundo por sala (cor = profundidade)
		const c = depthCol(k), y = fy(k) + FH / 2;
		for (const x of [XL, XR]) { const w = box(4.7, FH, .2, '#' + c.getHexString(), .02); w.position.set(x, y, -2.5); bld.add(w); }
		const sh = box(3.1, FH, .2, '#' + c.clone().multiplyScalar(.78).getHexString(), .02); sh.position.set(0, y, -2.52); bld.add(sh);
		for (const s of [-1, 1]) { const rail = box(.12, FH, .12, '#6B6880', .03); rail.position.set(s * 1.1, y, -2.33); bld.add(rail); }
		for (const s of [-1, 1]) { const ow = box(.2, FH, 4.9, '#CFC6B8', .02); ow.position.set(s * 6.3, y, 0); bld.add(ow); }
		// luminária de teto em cada sala
		for (const x of [XL, XR]) { const l = mesh(new THREE.CylinderGeometry(.28, .36, .12, 18), mat('#FFF4D6', { e: '#FFE9B0', ei: .6 })); l.position.set(x, fy(k) + FH - .41, 0); l.castShadow = false; bld.add(l); }
	}
	// telhado: placa da clínica + casa de máquinas
	const mach = box(2.4, 1.1, 2.4, '#D6CCF2', .08); mach.position.set(0, FH + .55, -.6); bld.add(mach);
	const clin = sign(['CLÍNICA'], 3.2, { w: 640, h: 170, bg: P.laranja, fg: '#FFFFFF', radius: 40 }); clin.position.set(XL, FH + .5, 2.2); bld.add(clin);
	const clinPost = box(.12, .6, .12, '#6B6880', .03); clinPost.position.set(XL, FH + .1, 2.1); bld.add(clinPost);

	// decoração dos andares (exceto salas com função)
	const deco = (x, k, kind) => {
		const g = new THREE.Group(); g.position.set(x, fy(k), 0);
		if (kind === 0) { const b1 = box(.9, .8, .7, P.madeira, .06); b1.position.set(-1.2, .4, -1.6); const b2 = box(.7, .6, .6, '#D9A066', .06); b2.position.set(-1.1, 1.1, -1.6); g.add(b1, b2); }
		if (kind === 1) { const pot = mesh(new THREE.CylinderGeometry(.25, .2, .4, 16), P.pessego); pot.position.set(1.5, .2, -1.6); const pl = mesh(new THREE.SphereGeometry(.4, 14, 10), '#5DB27A'); pl.position.set(1.5, .7, -1.6); g.add(pot, pl); }
		if (kind === 2) { const sh = box(1.6, 1.8, .5, '#E7DCCB', .05); sh.position.set(-1, .9, -2.1); g.add(sh); for (let i = 0; i < 6; i++) { const bk = box(.18, .5, .35, [P.lilas, P.menta, P.pessego][i % 3], .02); bk.position.set(-1.6 + i * .22, 1.35 - (i > 2 ? .7 : 0), -2.0); g.add(bk); } }
		if (kind === 3) { const ch = box(.6, .5, .6, P.lilas, .1); ch.position.set(.9, .25, -1.3); const bk = box(.6, .7, .15, P.lilas, .06); bk.position.set(.9, .75, -1.6); g.add(ch, bk); }
		bld.add(g);
	};
	[[-1, 0], [-2, 1], [-3, 2], [-4, 3], [-5, 0], [-6, 1], [-7, 2]].forEach(([k, d]) => deco(XL, k, d));
	[[0, 3], [-1, 1], [-2, 2], [-3, 0]].forEach(([k, d]) => deco(XR, k, d));

	// ── consultório (térreo, sala esquerda) ──
	const cons = new THREE.Group(); cons.position.set(XL, 0, 0); bld.add(cons);
	const rug = mesh(new THREE.CylinderGeometry(1.4, 1.4, .03, 40), mat(P.menta)); rug.position.set(.3, .02, .3); cons.add(rug);
	const win = sign([''], 1.5, { w: 300, h: 240, bg: P.ceu, border: '#FFFFFF', radius: 16 }); win.position.set(1.2, 1.9, -2.385); cons.add(win);
	const pot = mesh(new THREE.CylinderGeometry(.3, .24, .5, 16), P.laranja); pot.position.set(-1.8, .25, -1.7); cons.add(pot);
	for (let i = 0; i < 5; i++) { const lf = mesh(new THREE.SphereGeometry(.28, 12, 8), '#5DB27A'); lf.scale.set(.6, 1.4, .6); lf.position.set(-1.8 + Math.sin(i * 1.3) * .2, .9 + (i % 2) * .2, -1.7 + Math.cos(i * 1.3) * .2); lf.rotation.z = Math.sin(i * 2) * .5; cons.add(lf); }
	// relógio de parede
	const clock = new THREE.Group(); clock.position.set(-1.0, 2.15, -2.36); cons.add(clock);
	const face = mesh(new THREE.CylinderGeometry(.48, .48, .08, 40), '#FFFFFF'); face.rotation.x = Math.PI / 2; clock.add(face);
	const rim = mesh(new THREE.TorusGeometry(.48, .05, 10, 40), P.laranja); rim.position.z = .04; clock.add(rim);
	for (let i = 0; i < 12; i++) { const t = box(.035, i % 3 ? .07 : .12, .02, P.navy, .01); const a = i / 12 * Math.PI * 2; t.position.set(Math.sin(a) * .38, Math.cos(a) * .38, .05); t.rotation.z = -a; clock.add(t); }
	const hMin = new THREE.Group(), hHour = new THREE.Group(); hMin.position.z = .06; hHour.position.z = .07;
	const hm = box(.035, .34, .02, P.navy, .01); hm.position.y = .15; hMin.add(hm);
	const hh = box(.05, .22, .02, P.vermelho, .01); hh.position.y = .09; hHour.add(hh);
	clock.add(hMin, hHour);
	// painel de controle
	const panel = new THREE.Group(); panel.position.set(1.65, 0, 1.0); cons.add(panel);
	const ped = box(.9, 1.0, .6, '#5A6FA8', .08); ped.position.y = .5; panel.add(ped);
	const top = box(1.0, .08, .7, '#3E4C7D', .03); top.position.y = 1.03; panel.add(top);
	const bStart = mesh(new THREE.CylinderGeometry(.16, .17, .1, 24), mat(P.vermelho, { r: .4 })); bStart.position.set(-.22, 1.11, .05); panel.add(bStart);
	const bDown = mesh(new THREE.CylinderGeometry(.11, .12, .09, 20), mat(P.amarelo, { r: .4 })); bDown.position.set(.22, 1.1, .05); panel.add(bDown);
	const lampM = own('#7A2A2A', { e: '#000000', r: .3 });
	const lamp = mesh(new THREE.SphereGeometry(.12, 18, 12), lampM); lamp.position.set(.32, 1.25, -.22); panel.add(lamp);
	const lampBase = box(.18, .08, .18, '#262433', .02); lampBase.position.set(.32, 1.1, -.22); panel.add(lampBase);
	const lStart = sign(['INICIAR', 'PROTOCOLO'], .42, { w: 300, h: 210, bg: '#FFFFFF', fg: P.vermelho, radius: 24 }); lStart.position.set(-.22, .78, .305); panel.add(lStart);
	const lDown = sign(['▼ DESCER'], .38, { w: 300, h: 130, bg: '#FFFFFF', fg: P.navy, radius: 24 }); lDown.position.set(.22, .82, .305); panel.add(lDown);
	const cable = mesh(new THREE.CylinderGeometry(.03, .03, 1.2, 8), '#262433'); cable.rotation.z = Math.PI / 2; cable.position.set(.9, .15, -.1); panel.add(cable);
	// hipnoterapeuta
	const ther = toy({ shirt: P.azul, pants: '#2E3A5C', hair: '#3B2A22', glasses: true, collar: '#FFFFFF' });
	ther.g.position.set(.25, 0, .55); ther.g.rotation.y = .35; cons.add(ther.g);
	// prancheta (vai para a mão do terapeuta ou flutua na frente da praia)
	const clip = makeClipboard(); root.add(clip.g);
	// cartão da sugestão (frente/verso) + cartões do carrossel
	const card = new THREE.Group(); root.add(card);
	const cf = sign(['SUGESTÃO', 'TESTE'], .9, { w: 400, h: 280, bg: P.amarelo, fg: P.navy, radius: 30 }); card.add(cf);
	const cb = sign(['LUGAR', 'SEGURO'], .9, { w: 400, h: 280, bg: P.menta, fg: P.navy, radius: 30 }); cb.rotation.y = Math.PI; cb.position.z = -.012; cb.renderOrder = 3; card.add(cb);
	const carousel = [['BRAÇO', 'LEVE'], ['PÁLPEBRAS', 'PESADAS'], ['MÃOS', 'GRUDADAS'], ['CONTAR', 'ATÉ 3']].map((t, i) => { const s = sign(t, .9, { w: 400, h: 280, bg: [P.lilas, P.pessego, P.menta, '#FFFFFF'][i], fg: P.navy, radius: 30, sub: 'EXEMPLO' }); root.add(s); return s; });
	// "?" e "Z"
	const qmark = sign(['?'], .7, { w: 200, h: 240, bg: null, fg: P.laranja }); root.add(qmark);
	const zz = [0, 1, 2].map(i => { const z = sign(['Z'], .45 - i * .08, { w: 160, h: 160, bg: '#FFFFFF', fg: P.navy, radius: 80 }); root.add(z); return z; });

	// ── elevador ──
	const cab = new THREE.Group(); bld.add(cab);
	const cw = 2.7, chh = 2.75, cd = 2.7, wallM = mat(P.lilas), wallM2 = mat('#A493F2');
	const cFloor = box(cw, .12, cd, P.madeira, .03); cFloor.position.y = .06; cab.add(cFloor);
	const cRoof = box(cw, .12, cd, '#A493F2', .03); cRoof.position.y = chh; cab.add(cRoof);
	const cBack = box(cw, chh, .1, wallM2, .02); cBack.position.set(0, chh / 2, -cd / 2); cab.add(cBack);
	const cLeft = box(.1, chh, cd, wallM, .02); cLeft.position.set(-cw / 2, chh / 2, 0); cab.add(cLeft);
	const doors = [-1, 1].map(s => { const d = box(.1, chh - .14, cd / 2, '#C9BCFF', .02); d.position.set(cw / 2, chh / 2, s * cd / 4); cab.add(d); return d; });
	const frame = box(cw + .1, .16, .14, '#7F6FD0', .03); frame.position.set(0, chh + .14, cd / 2 - .07); cab.add(frame);
	const dispC = document.createElement('canvas'); dispC.width = 256; dispC.height = 128;
	const dispT = texOf(dispC);
	const disp = new THREE.Mesh(new THREE.PlaneGeometry(.9, .45), new THREE.MeshStandardMaterial({ map: dispT, emissive: '#ffffff', emissiveMap: dispT, emissiveIntensity: .6, roughness: .6 }));
	disp.position.set(0, chh + .42, cd / 2 - .04); disp.renderOrder = 2; cab.add(disp);
	const dispBox = box(1.0, .55, .1, '#262433', .04); dispBox.position.set(0, chh + .42, cd / 2 - .11); cab.add(dispBox);
	let dispLast = null;
	const setDisplay = (k, color = '#FFB000') => {
		const key = k + color; if (key === dispLast) return; dispLast = key;
		const g = dispC.getContext('2d'); g.fillStyle = '#141220'; g.fillRect(0, 0, 256, 128);
		const t = k === 0 ? 'T' : String(k), s = fitFont(g, t, 200, 96, 900, 'JetBrains Mono');
		g.font = `900 ${s}px "JetBrains Mono"`; g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, 128, 68); dispT.needsUpdate = true;
	};
	const cableUp = mesh(new THREE.CylinderGeometry(.035, .035, 1, 8), '#262433'); cableUp.castShadow = false; bld.add(cableUp);
	// poltrona + cliente
	const chair = new THREE.Group(); chair.position.set(-.1, .12, -.35); cab.add(chair);
	const seat = box(1.1, .4, .9, '#FF8F6B', .12); seat.position.y = .2; chair.add(seat);
	const back = box(1.1, 1.0, .25, '#FF8F6B', .12); back.position.set(0, .7, -.36); chair.add(back);
	for (const s of [-1, 1]) { const a = box(.22, .55, .9, '#F2795A', .1); a.position.set(s * .6, .38, 0); chair.add(a); }
	const cli = toy({ shirt: P.menta, pants: '#4B6FA8', hair: '#6B4A2E', hairStyle: 'fringe', collar: '#5DB27A' });
	cli.sit(1); cli.g.position.set(0, .2, -.05); chair.add(cli.g);

	// ── marcadores de ponto ──
	const ghost = sign(['PONTO?'], 1.3, { w: 400, h: 150, bg: 'rgba(255,210,63,.9)', fg: P.navy, radius: 30 }); ghost.position.set(-2.1, fy(-4) + .55, 2.2); bld.add(ghost);
	const flag = new THREE.Group(); root.add(flag);
	const pole = mesh(new THREE.CylinderGeometry(.035, .035, 1.5, 10), '#F5F1E8'); pole.position.y = .75; flag.add(pole);
	const pen = sign(['PONTO'], .95, { w: 380, h: 190, bg: P.verde, fg: '#FFFFFF', radius: 16 }); pen.position.set(.5, 1.25, 0); flag.add(pen);
	const terapiaM = own('#5A6B60', { e: '#000000' });
	const terapia = new THREE.Group(); terapia.position.set(XL - .6, fy(-4), -2.37); bld.add(terapia);
	const tDoor = box(1.2, 2.0, .1, '#E7DCCB', .04); tDoor.position.y = 1.0; terapia.add(tDoor);
	const tSign = sign(['TERAPIA'], 1.4, { w: 420, h: 140, bg: '#FFFFFF', fg: P.verde, radius: 30 }); tSign.position.set(0, 2.35, .07); terapia.add(tSign);
	const tLight = mesh(new THREE.SphereGeometry(.12, 16, 10), terapiaM); tLight.position.set(.75, 2.35, .1); terapia.add(tLight);

	// ── balões de sugestão ──
	const bubbles = ['relaxe…', 'mais fundo…', 'braço leve…', 'sinta…', 'SUGESTÃO-TESTE'].map((t, i) => {
		const b = new THREE.Group(); root.add(b);
		const s = sign([t], 1.25, { w: 460, h: 190, bg: i === 4 ? P.amarelo : '#FFFFFF', fg: P.navy, radius: 95, border: P.navy }); b.add(s);
		const x = iconBadge('x', P.vermelho, .42); x.position.set(.55, .2, .02); x.renderOrder = 4; b.add(x); b.userData.x = x;
		return b;
	});

	// ── praia (lugar seguro) · sala direita do −4 ──
	const beach = new THREE.Group(); beach.position.set(XR, fy(-4), 0); bld.add(beach);
	const bParts = [];
	const part = (o, order) => { beach.add(o); bParts.push({ o, order, base: o.scale.clone() }); return o; };
	const skyC = document.createElement('canvas'); skyC.width = 512; skyC.height = 340; { const g = skyC.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 340); gr.addColorStop(0, '#7FD3FF'); gr.addColorStop(1, '#E6F7FF'); g.fillStyle = gr; g.fillRect(0, 0, 512, 340); g.fillStyle = '#FFFFFF'; [[90, 80], [360, 60], [250, 120]].forEach(([x, y]) => { g.beginPath(); g.ellipse(x, y, 50, 16, 0, 0, 7); g.fill(); }); }
	const sky = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 2.95), new THREE.MeshStandardMaterial({ map: texOf(skyC), roughness: 1, emissive: '#ffffff', emissiveMap: texOf(skyC), emissiveIntensity: .35 })); sky.position.set(0, 1.5, -2.385); sky.renderOrder = 1; part(sky, 0);
	const sand = box(4.55, .22, 4.7, '#F5D9A0', .05); sand.position.set(0, .11, 0); part(sand, 0);
	const seaGeo = new THREE.PlaneGeometry(4.5, 1.3, 40, 8); seaGeo.rotateX(-Math.PI / 2);
	const sea = new THREE.Mesh(seaGeo, mat('#4FC3E8', { r: .35 })); sea.position.set(0, .25, -1.65); sea.receiveShadow = true; part(sea, .05);
	const seaBase = seaGeo.attributes.position.array.slice();
	const foam = box(4.5, .05, .12, '#FFFFFF', .02); foam.position.set(0, .27, -.98); part(foam, .08);
	const sunM = mat('#FFD23F', { e: '#FFB000', ei: .9 });
	const sunB = mesh(new THREE.SphereGeometry(.38, 24, 16), sunM); sunB.position.set(1.3, 2.25, -2.15); sunB.castShadow = false; part(sunB, .15);
	const palm = new THREE.Group(); palm.position.set(-1.45, .22, -.55); part(palm, .25);
	for (let i = 0; i < 6; i++) { const s = mesh(new THREE.CylinderGeometry(.11 - i * .008, .13 - i * .008, .38, 12), i % 2 ? '#B9824F' : '#A87140'); s.position.set(Math.sin(i * .3) * .18, .19 + i * .36, 0); s.rotation.z = -.12; palm.add(s); }
	for (let i = 0; i < 6; i++) { const lf = mesh(new THREE.SphereGeometry(.5, 14, 8), i % 2 ? '#4FB86A' : '#62C97A'); lf.scale.set(1.5, .12, .45); const a = i / 6 * Math.PI * 2; lf.position.set(.35 + Math.cos(a) * .55, 2.25 - Math.abs(Math.sin(a)) * .05, Math.sin(a) * .55); lf.rotation.set(0, -a, -.35); palm.add(lf); }
	for (let i = 0; i < 3; i++) { const co = mesh(new THREE.SphereGeometry(.1, 12, 8), '#7A5230'); co.position.set(.3 + i * .1, 2.08, (i - 1) * .12); palm.add(co); }
	const umb = new THREE.Group(); umb.position.set(1.45, .22, -.2); part(umb, .35);
	const up = mesh(new THREE.CylinderGeometry(.03, .03, 1.7, 8), '#FFFFFF'); up.position.y = .85; umb.add(up);
	for (let i = 0; i < 8; i++) { const sl = mesh(new THREE.ConeGeometry(.95, .4, 3, 1, true, i / 8 * Math.PI * 2, Math.PI * 2 / 8), mat(i % 2 ? '#FFFFFF' : P.laranja, { r: .7 })); sl.material.side = THREE.DoubleSide; sl.position.y = 1.75; umb.add(sl); }
	const lounger = new THREE.Group(); lounger.position.set(.45, .22, .5); lounger.rotation.y = -Math.PI / 2; part(lounger, .45);
	const lb = box(1.7, .1, .7, P.lilas, .04); lb.position.set(0, .35, 0); lounger.add(lb);
	const lr = box(.8, .1, .7, P.lilas, .04); lr.position.set(-.95, .62, 0); lr.rotation.z = -.62; lounger.add(lr);
	for (const [x, z] of [[-.7, -.28], [-.7, .28], [.7, -.28], [.7, .28]]) { const l = box(.06, .35, .06, '#FFFFFF', .02); l.position.set(x, .17, z); lounger.add(l); }
	const towel = box(.9, .04, .6, P.menta, .02); towel.position.set(.25, .42, 0); lounger.add(towel);
	const cli2 = toy({ shirt: P.menta, pants: '#4B6FA8', hair: '#6B4A2E', hairStyle: 'fringe', collar: '#5DB27A' });
	cli2.sit(1); cli2.g.rotation.set(0, Math.PI / 2, 0); cli2.g.position.set(-.3, .16, 0); lounger.add(cli2.g);
	for (let i = 0; i < 5; i++) { const sh = mesh(new THREE.SphereGeometry(.07, 10, 8), ['#FF9AA2', '#FFFFFF', P.amarelo][i % 3]); sh.scale.y = .5; sh.position.set(-1.8 + i * .85 + rng() * .2, .25, 1.2 + rng() * .7); part(sh, .5 + i * .03); }
	// pensamento + sentidos + escudos
	const thought = new THREE.Group(); root.add(thought);
	[[0, 0, .42], [.42, .1, .36], [-.4, .08, .34], [.15, .32, .34], [-.2, .3, .3]].forEach(([x, y, r]) => { const b = mesh(new THREE.SphereGeometry(r, 16, 12), '#FFFFFF'); b.position.set(x, y, 0); b.castShadow = false; thought.add(b); });
	[[-.55, -.45, .1], [-.75, -.7, .07]].forEach(([x, y, r]) => { const b = mesh(new THREE.SphereGeometry(r, 12, 8), '#FFFFFF'); b.position.set(x, y, 0); thought.add(b); });
	const tPalm = iconBadge('coracao', P.laranja, .5); tPalm.position.set(0, .12, .42); thought.add(tPalm);
	const senses = [['olho', P.azul], ['ouvido', P.azul], ['mao', P.azul], ['coracao', P.vermelho]].map(([k, c]) => { const b = iconBadge(k, c, .62); root.add(b); return b; });
	const shieldM = new THREE.MeshStandardMaterial({ color: P.menta, transparent: true, opacity: .28, roughness: .2, depthWrite: false });
	const shields = [0, 1].map(() => { const g = new THREE.Group(); const s = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), shieldM); s.renderOrder = 5; g.add(s); const b = iconBadge('escudo', P.verde, .55); b.position.set(0, 1.05, .2); g.add(b); root.add(g); return g; });
	const linkPts = []; { const a = new THREE.Vector3(XL + .25, 1.2, 1.2), b = new THREE.Vector3(XR + .4, fy(-4) + 1.0, 1.6); for (let i = 0; i <= 60; i++) { const u = i / 60; linkPts.push(new THREE.Vector3().lerpVectors(a, b, u).add(new THREE.Vector3(Math.sin(u * Math.PI) * 1.2, 0, Math.sin(u * Math.PI) * .6))); } }
	const linkGeo = new THREE.BufferGeometry().setFromPoints(linkPts);
	const link = new THREE.Line(linkGeo, new THREE.LineDashedMaterial({ color: P.verde, dashSize: .25, gapSize: .15, linewidth: 2 })); link.computeLineDistances(); root.add(link);

	// ── portas de protocolos (−5, −6, −7, sala direita) ──
	const doorsP = [[-5, ['FOBIAS'], P.azul], [-6, ['ANSIEDADE'], P.lilas], [-7, ['REGRESSÃO', 'DE MEMÓRIA'], '#C98A4B']].map(([k, t, c]) => {
		const g = new THREE.Group(); g.position.set(XR, fy(k), -2.37); bld.add(g);
		const glowM = own('#000000', { e: c === '#C98A4B' ? '#FFC27A' : '#FFF2C2', ei: 0 });
		const glow = box(1.3, 2.1, .04, glowM, .02); glow.position.set(0, 1.05, .02); g.add(glow);
		const hinge = new THREE.Group(); hinge.position.set(-.65, 0, .1); g.add(hinge);
		const d = box(1.3, 2.1, .1, c, .04); d.position.set(.65, 1.05, 0); hinge.add(d);
		const kn = mesh(new THREE.SphereGeometry(.06, 10, 8), '#FFD23F'); kn.position.set(1.15, 1.0, .08); hinge.add(kn);
		const s = sign(t, t.length > 1 ? 1.35 : 1.6, { w: 520, h: t.length > 1 ? 230 : 140, bg: '#FFFFFF', fg: P.navy, radius: 30, sub: t.length > 1 ? null : null }); s.position.set(0, 2.42, .1); g.add(s);
		return { g, hinge, glowM, s };
	});

	// ── loja de técnicas mágicas ──
	const store = new THREE.Group(); store.position.set(STORE_X, 0, 0); root.add(store);
	const sf = box(10, .3, 5.4, '#D9B48A', .05); sf.position.y = -.15; store.add(sf);
	const sw = box(10, 7, .2, P.lilas, .02); sw.position.set(0, 3.35, -2.6); store.add(sw);
	const sSign = sign(['LOJA DE TÉCNICAS MÁGICAS'], 6.6, { w: 1400, h: 300, bg: P.laranja, fg: '#FFFFFF', radius: 60, sub: 'EXEMPLOS ILUSTRATIVOS', subColor: '#FFF1D6' }); sSign.position.set(0, 5.75, -2.47); store.add(sSign);
	const shelfY = [.95, 2.45, 3.95];
	shelfY.forEach(y => { const b = box(6.4, .14, 1.0, P.madeira, .03); b.position.set(0, y, -1.95); store.add(b); });
	for (const s of [-1, 1]) { const u = box(.16, 4.2, 1.0, '#A8734A', .03); u.position.set(s * 3.2, 2.1, -1.95); store.add(u); }
	const counter = box(2.6, 1.0, 1.0, '#E7C9A0', .08); counter.position.set(2.8, .5, 1.3); store.add(counter);
	const LABELS = [['ESCADA'], ['CONTAGEM', '10 → 1'], ['ELEVADOR'], ['FRACIO-', 'NAMENTO'], ['INDUÇÃO', 'RÁPIDA'], ['VARINHA', 'MÁGICA']];
	const COLS = [P.menta, P.pessego, P.azul, P.amarelo, P.lilas, P.vermelho];
	const boxes = LABELS.map((t, i) => {
		const g = new THREE.Group(); store.add(g);
		const b = box(1.5, 1.15, .8, COLS[i], .08); g.add(b);
		const l = sign(t, 1.25, { w: 420, h: 260, bg: '#FFFFFF', fg: P.navy, radius: 30, border: P.navy }); l.position.z = .43; g.add(l);
		if (i === 5) { const wand = mesh(new THREE.CylinderGeometry(.03, .03, .9, 8), '#262433'); wand.position.set(.55, .85, 0); wand.rotation.z = -.5; g.add(wand); const st = mesh(new THREE.OctahedronGeometry(.13), mat(P.amarelo, { e: '#FFB000', ei: .5 })); st.position.set(.78, 1.25, 0); g.add(st); }
		const x = iconBadge('x', P.vermelho, .7); x.position.set(.35, .2, .45); x.renderOrder = 4; g.add(x);
		const home = new THREE.Vector3(i % 2 ? 1.45 : -1.45, shelfY[2 - Math.floor(i / 2)] + .07 + .575, -1.9);
		const land = new THREE.Vector3(-2.6 + i * 1.05 + (i % 2) * .2, .575, .2 + (i % 3) * .45);
		return { g, x, home, land, rotLand: (i % 2 ? 1 : -1) * (.3 + i * .12) };
	});

	Object.assign(W, {
		root, bld, ther, cli, cli2, cab, doors, setDisplay, cableUp, panel, bStart, bDown, lampM, clock, hMin, hHour, clip, card, carousel, qmark, zz,
		ghost, flag, pen, terapiaM, terapia, bubbles, beach, bParts, sea, seaBase, sunM, thought, senses, shields, link, doorsP, store, boxes, sSign,
	});
	return W;
}

// prancheta com 3 itens
function makeClipboard() {
	const g = new THREE.Group();
	const board = box(1.0, 1.36, .05, P.madeira, .04); g.add(board);
	const c = document.createElement('canvas'); c.width = 600; c.height = 760; const x = c.getContext('2d');
	x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, 600, 760);
	x.fillStyle = P.laranja; x.fillRect(0, 0, 600, 120);
	const s1 = fitFont(x, 'TESTE DO LUGAR SEGURO', 520, 60, 900); x.font = `900 ${s1}px Inter`; x.fillStyle = '#FFFFFF'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('TESTE DO LUGAR SEGURO', 300, 62);
	const rows = [['SE IMAGINA', 'NO LUGAR'], ['SENTE-SE BEM,', 'TRANQUILO'], ['VÊ E SENTE', '(SENTIDOS)']];
	rows.forEach((r, i) => {
		const y = 190 + i * 190;
		x.strokeStyle = P.navy; x.lineWidth = 8; x.strokeRect(40, y, 110, 110);
		x.fillStyle = P.navy; x.textAlign = 'left';
		r.forEach((t, j) => { const s = fitFont(x, t, 380, 52, 800); x.font = `800 ${s}px Inter`; x.fillText(t, 180, y + 30 + j * 56); });
	});
	const paper = new THREE.Mesh(new THREE.PlaneGeometry(.88, 1.12), new THREE.MeshStandardMaterial({ map: texOf(c), roughness: .9 }));
	paper.position.set(0, -.06, .03); paper.renderOrder = 2; g.add(paper);
	const clipM = box(.4, .14, .08, '#B8BCC8', .03, { m: .6, r: .3 }); clipM.position.set(0, .63, .05); g.add(clipM);
	const checks = [0, 1, 2].map(i => {
		const cc = document.createElement('canvas'); cc.width = cc.height = 128; const q = cc.getContext('2d');
		q.strokeStyle = P.verde; q.lineWidth = 22; q.lineCap = q.lineJoin = 'round'; q.beginPath(); q.moveTo(20, 66); q.lineTo(52, 100); q.lineTo(110, 26); q.stroke();
		const m = new THREE.Mesh(new THREE.PlaneGeometry(.2, .2), new THREE.MeshBasicMaterial({ map: texOf(cc), transparent: true }));
		m.position.set(-.31, -.06 + 1.12 / 2 - (190 + i * 190 + 55) / 760 * 1.12, .045); m.renderOrder = 3; g.add(m); return m;
	});
	return { g, checks };
}
