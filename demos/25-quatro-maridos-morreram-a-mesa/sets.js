// Cenas do Short 25 (true crime 9:16 · Nannie Doss). Cada set é um grupo com tick(T) (T absoluto); SH define os planos.
// Herói: a mesa da cozinha com 4 cadeiras sob a luminária pendente + a xícara de café.
import * as THREE from 'three';
import { clamp, seg, lerp, ease, pop, mulberry32, canvasTex, fitFont } from './lib.js';
import { CC, textPlane, stamp, slam, silhouette, rainLines, glow, wall } from './crime.js';
import { AMB, MONO, COND, fileCard, house, screen, spotCone, dust, typeLine } from './caso.js';
import { seated, granny, steam, cup, pendant, ring, recorder, poisonJar } from './cozinha.js';

const appear = (o, k) => { o.visible = k > .003; o.scale.setScalar(Math.max(1e-4, k)); };
const sm = (T, a, b) => ease.cubicInOut(seg(T, a, b));
const std = (c, r = .8, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
const boxM = (w, h, d, c, x, y, z, r = .8) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), std(c, r)); b.position.set(x, y, z); return b; };
const flat = (m, x, y, z, rz = 0) => { m.rotation.set(-Math.PI / 2, 0, rz); m.position.set(x, y, z); return m; };
const woodTex = seed => { const r = mulberry32(seed); return canvasTex(1024, 1024, (g, w, h) => { g.fillStyle = '#1d140d'; g.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { g.strokeStyle = `rgba(${60 + r() * 40},${40 + r() * 25},20,${.15 + r() * .25})`; g.lineWidth = 1 + r() * 3; const y = r() * h; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * .3, y + (r() - .5) * 30, w * .6, y + (r() - .5) * 30, w, y + (r() - .5) * 20); g.stroke(); } }); };
const wood = (seed, size = 12) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshStandardMaterial({ map: woodTex(seed), roughness: .7 })); m.rotation.x = -Math.PI / 2; return m; };
const ground = (c = '#0d1214', s = 40) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), std(c, .5, .3)); m.rotation.x = -Math.PI / 2; return m; };
const tag = (t, w, h, o = {}) => textPlane(t, w, h, { font: MONO, weight: '400', color: AMB, bg: 'rgba(7,9,12,.8)', border: AMB, ...o });
const ftxt = (g, t, x, y, mw, mh, wt, fam, col) => { const s = fitFont(g, t, mw, mh, wt, fam); g.font = `${wt} ${s}px ${fam}`; g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, x, y); };
const lights = (g, sky = '#5b6a70', amb = .35) => g.add(new THREE.HemisphereLight(sky, '#050607', amb));

// ── cozinha anos 50: mesa, 4 cadeiras/maridos, avó junto ao fogão, janela com chuva ──
const SEATS = [[-1.05, 0, Math.PI / 2], [-.4, -.85, 0], [.4, -.85, 0], [1.05, 0, -Math.PI / 2]];
function setMesa() {
	const g = new THREE.Group(); lights(g, '#56656a', .3);
	const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({ roughness: .6, map: canvasTex(512, 512, (c, w, h) => { const n = 16; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { c.fillStyle = (i + j) % 2 ? '#1b1e1c' : '#5a574c'; c.fillRect(i * w / n, j * h / n, w / n, h / n); } }) }));
	fl.rotation.x = -Math.PI / 2; g.add(fl);
	const bw = wall(8, 4, (c, w, h) => { c.fillStyle = '#26302c'; c.fillRect(0, 0, w, h); c.fillStyle = '#6f7466'; c.fillRect(0, h * .5, w, h * .5); c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 3; for (let x = 0; x < w; x += w / 40) { c.beginPath(); c.moveTo(x, h * .5); c.lineTo(x, h); c.stroke(); } for (let y = h * .5; y < h; y += w / 40) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } });
	bw.material.color.setScalar(.55); bw.position.set(0, 2, -2.4); g.add(bw);
	const wi = wall(1.1, 1, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2b4a5c'); gr.addColorStop(1, '#0c1a22'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(180,210,230,.35)'; c.lineWidth = 2; for (let i = 0; i < 40; i++) { const x = (i * 37) % w; c.beginPath(); c.moveTo(x, (i * 53) % h); c.lineTo(x + 4, (i * 53) % h + 30); c.stroke(); } c.fillStyle = '#0a0d0c'; c.fillRect(w / 2 - 4, 0, 8, h); c.fillRect(0, h / 2 - 4, w, 8); });
	wi.position.set(-1, 2.1, -2.39); g.add(wi);
	const stove = boxM(.8, .9, .6, '#b9b4a5', 1.5, .45, -2.05, .4); g.add(stove); g.add(boxM(.84, .05, .64, '#2a2a28', 1.5, .92, -2.05));
	const pan = new THREE.Mesh(new THREE.CylinderGeometry(.14, .14, .14, 20), std('#3a3a38', .3, .7)); pan.position.set(1.35, 1.02, -2.0); g.add(pan);
	const pSt = steam({ n: 40, h: .6, w: .1, seed: 9, size: .05 }); pSt.position.set(1.35, 1.1, -2); g.add(pSt);
	g.add(boxM(1.5, .06, 1, '#3a2617', 0, .75, 0, .6));
	[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => g.add(boxM(.06, .72, .06, '#24170e', a * .68, .36, b * .44)));
	const P = [], G = [], plates = [];
	SEATS.forEach(([x, z, ry], i) => {
		const p = seated({ chair: '#2a1d12' }); p.position.set(x, 0, z); p.rotation.y = ry; g.add(p); P.push(p);
		const gh = seated({ ghost: AMB }); gh.children.forEach(c => { if (c !== gh.body && c.material !== gh.body.children[0].material) c.visible = false; }); gh.position.set(x, .002, z); gh.rotation.y = ry; g.add(gh); G.push(gh);
		const dx = x === 0 ? 0 : Math.sign(x) * (Math.abs(x) > .9 ? .5 : 0), px = Math.abs(x) > .9 ? Math.sign(x) * .5 : x, pz = Math.abs(x) > .9 ? 0 : -.3;
		const pl = new THREE.Mesh(new THREE.CylinderGeometry(.13, .1, .015, 24), std('#cfc6b2', .4)); pl.position.set(px, .79, pz); g.add(pl);
		const gl = glow('rgba(255,176,46,.9)', .7); flat(gl, px, .8, pz); gl.renderOrder = 2; g.add(gl); plates.push(gl);
	});
	const c1 = cup({ s: .9 }); c1.position.set(-.2, .78, -.25); g.add(c1);
	const cs = steam({ n: 50, h: .45, w: .04, seed: 4, size: .035 }); cs.position.set(-.2, .87, -.25); g.add(cs);
	const gr = granny(); gr.position.set(1.1, 0, -1.65); gr.rotation.y = -.45; g.add(gr);
	const lamp = pendant({ y: 2.15, cord: 2, power: 40, cone: .28 }); g.add(lamp);
	const du = dust(140, [5, 3, 4], 25); du.position.set(0, 1.6, 0); g.add(du);
	const pres = (i, T) => {
		if (T < 3.7) return 1;
		if (T < 24.1) return i === 1 && T < 14.31 ? 1 : 0;
		if (T < 27.6) return 1;
		if (T < 30.4) return i === 1 ? 0 : T < [28.73, 0, 29.04, 29.7][i] ? 1 : 0;
		return 0;
	};
	g.tick = T => {
		P.forEach((p, i) => { const k = pres(i, T); p.op(k); const gk = T >= 54.9 && i !== 1 ? sm(T, [55.22, 0, 55.76, 56.11][i], [55.22, 0, 55.76, 56.11][i] + .35) : 0; G[i].op(gk * (.55 + .1 * Math.sin(T * 3 + i)));
			const fl = T >= 27.6 && T < 30.4 && i !== 1 ? Math.exp(-Math.max(0, T - [28.73, 0, 29.04, 29.7][i]) * 5) * (T >= [28.73, 0, 29.04, 29.7][i] ? 1 : 0) : 0;
			plates[i].material.opacity = clamp(k * .3 + gk * .85 + fl * 1.5); });
		const s1 = P[1]; s1.slump(T >= 6.2 && T < 8.8 ? sm(T, 6.9, 7.6) * .7 : 0); s1.reach(T >= 12 && T < 14.31 ? sm(T, 12.9, 13.4) : 0);
		s1.body.rotation.z = T >= 6.2 && T < 8.8 ? .04 * Math.sin(T * 9) * seg(T, 6.9, 7.3) : 0;
		gr.visible = (T >= 24.1 && T < 27.6) || (T >= 30.4 && T < 33);
		gr.arm(T < 27.6 ? -1.1 - .15 * Math.sin(T * 3) : -.2, 0);
		let L = 1;
		if (T >= 6.9 && T < 8.8) L = .55 + .45 * Math.cos((T - 6.9) * 2 * Math.PI * 1.6);
		if (T >= 14.31 && T < 15.2) L = .05 + .9 * Math.exp(-(T - 14.31) * 30);
		if (T >= 30.4 && T < 33) L = .75;
		if (T >= 54.9) L = .55;
		lamp.set(L);
		cs.visible = c1.visible = T < 14.4 || T >= 54.9; cs.tick(T); pSt.tick(T); du.tick(T);
	};
	return { g, bg: '#050706', fog: [3, 14] };
}

// ── macro da xícara (servir, café envenenado, CTA final) ──
function setXicara() {
	const g = new THREE.Group(); lights(g, '#4f5c5e', .4); g.add(wood(31, 10));
	const sp = new THREE.SpotLight('#ffcf8a', 30, 6, .5, .7, 1.2); sp.position.set(.3, 2.6, .6); sp.target.position.set(0, 0, 0); g.add(sp, sp.target);
	const c = cup({ s: 2.6 }); g.add(c);
	const st = steam({ n: 110, h: 1.3, w: .16, seed: 7, size: .09 }); st.position.y = .26; g.add(st);
	const pot = new THREE.Group(); const pb = new THREE.Mesh(new THREE.CylinderGeometry(.16, .22, .42, 24), std('#8a8478', .3, .6)); pot.add(pb);
	const sp2 = new THREE.Mesh(new THREE.CylinderGeometry(.02, .04, .3, 10), std('#8a8478', .3, .6)); sp2.position.set(-.22, .02, 0); sp2.rotation.z = 1; pot.add(sp2);
	pot.position.set(.38, 1.15, 0); pot.rotation.z = .7; g.add(pot);
	const pour = new THREE.Mesh(new THREE.CylinderGeometry(.012, .016, .85, 8), new THREE.MeshBasicMaterial({ color: '#3b1f0b' })); pour.position.set(.02, .66, 0); g.add(pour);
	const jar = poisonJar({ s: 1.3 }); jar.position.set(-.55, 0, -.3); jar.rotation.y = .3; g.add(jar);
	const bg = glow('rgba(255,176,46,.35)', 4); bg.position.set(0, .6, -2); g.add(bg);
	const t1 = textPlane('SEGUE O CANAL', 1.7, .38, { color: AMB }); t1.position.set(0, 1.85, .2); g.add(t1);
	const t2 = textPlane('MAIS CRIMES REAIS', 1.5, .26, { color: CC.bone, font: MONO, weight: '400' }); t2.position.set(0, 1.47, .2); g.add(t2);
	const du = dust(90, [3, 2, 2], 33); du.position.y = 1; g.add(du);
	const sc = new THREE.Color('#d8d2c4'), sk = new THREE.Color('#7f8c74');
	g.tick = T => {
		const pr = T >= 2.2 && T < 3.7; pot.visible = pr; pour.visible = pr && T > 2.35 && T < 3.3; pot.position.y = 1.15 + (pr ? .05 * Math.sin(T * 2) : 0);
		const jk = T >= 56.8 && T < 60.3 ? pop(T, 57.0, .4) : 0; appear(jar, jk);
		st.material.color.copy(sc).lerp(sk, T >= 56.8 && T < 60.3 ? sm(T, 57.6, 58.2) : 0); st.material.opacity = T >= 57.6 && T < 60.3 ? .5 : .35;
		appear(t1, T >= 60.3 ? pop(T, 60.38, .4) : 0); appear(t2, T >= 60.3 ? pop(T, 61.2, .35) : 0);
		st.tick(T); du.tick(T); c.rotation.y = T * .05;
	};
	return { g, bg: '#050605', fog: [2.5, 9] };
}

// ── casa em Oklahoma na chuva, 1954 ──
function setCasa() {
	const g = new THREE.Group(); lights(g, '#4f6a7a', .9);
	const moon = new THREE.DirectionalLight('#8fb0cf', .6); moon.position.set(-4, 6, 5); g.add(moon); g.add(ground('#0b1114', 60));
	const h = house({ w: 3.4, h: 1.9, d: 2.6, wins: 2 }); g.add(h);
	const h2 = house({ w: 2.6, h: 1.6, d: 2.2, wins: 2 }); h2.position.set(-4.5, 0, -3); g.add(h2);
	const fence = new THREE.Group(); for (let i = 0; i < 18; i++) fence.add(boxM(.06, .55, .04, '#141a1d', -4 + i * .5, .27, 2.4)); fence.add(boxM(9, .05, .04, '#141a1d', .25, .45, 2.4)); g.add(fence);
	const lp = glow('rgba(255,176,46,.5)', 2.6); lp.position.set(0, 1.1, 1.45); g.add(lp);
	const rain = rainLines(520, 25); rain.position.set(0, -2, 3); g.add(rain);
	const t1 = tag('OKLAHOMA', 2.2, .5); t1.position.set(0, 3.35, 1.6); g.add(t1);
	const t2 = textPlane('1954', 1.6, .62, { color: CC.bone }); t2.position.set(0, 2.75, 1.6); g.add(t2);
	g.tick = T => { rain.tick(T); h.light(0, sm(T, 3.8, 4.2)); h.light(1, .6 + .4 * Math.sin(T * 1.7)); h2.light(0, .4); appear(t1, pop(T, 3.66, .4)); appear(t2, pop(T, 4.45, .4)); };
	return { g, bg: '#05080b', fog: [5, 24] };
}

// ── corredor de hospital: maca, monitor, ALTA ──
function setHospital() {
	const g = new THREE.Group(); lights(g, '#8fa8a8', .5); g.add(ground('#1a2222', 30));
	[-1.3, 1.3].forEach(x => { const w = wall(14, 3, (c, ww, hh) => { c.fillStyle = '#28332f'; c.fillRect(0, 0, ww, hh); c.fillStyle = '#3c4a44'; c.fillRect(0, hh * .62, ww, hh * .38); c.fillStyle = 'rgba(0,0,0,.4)'; for (let i = 0; i < 6; i++) c.fillRect(ww * (i / 6 + .05), hh * .15, ww * .06, hh * .55); }); w.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2; w.position.set(x, 1.5, -2); g.add(w); });
	const lamps = []; for (let i = 0; i < 8; i++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(.6, .3), new THREE.MeshBasicMaterial({ color: '#d7e6e0' })); flat(l, 0, 2.9, 4 - i * 1.8); l.rotation.x = Math.PI / 2; g.add(l); lamps.push(l); }
	const pl = new THREE.PointLight('#cfe6dd', 6, 8, 1.4); pl.position.set(0, 2.6, 1); g.add(pl);
	const gur = new THREE.Group(); gur.add(boxM(.7, .08, 1.9, '#9aa3a0', 0, .8, 0, .4)); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => gur.add(boxM(.04, .76, .04, '#555', a * .3, .38, b * .85)));
	const bod = new THREE.Mesh(new THREE.CapsuleGeometry(.2, 1.1, 5, 12), std('#050606')); bod.rotation.x = Math.PI / 2; bod.position.set(0, .98, .1); gur.add(bod);
	const hd = new THREE.Mesh(new THREE.SphereGeometry(.13, 16, 12), std('#050606')); hd.position.set(0, 1, -.72); gur.add(hd);
	gur.add(boxM(.66, .06, 1.2, '#c8ccc6', 0, 1.05, .25, .9));
	gur.position.set(-.35, 0, 0); g.add(gur);
	const mon = screen(.62, .42, 512); mon.position.set(.65, 1.45, .35); mon.rotation.y = -.35; g.add(mon);
	g.add(boxM(.05, 1.25, .05, '#444', .65, .62, .3));
	const st = stamp('ALTA', .5, .18, AMB); st.position.set(.45, 1.85, .7); g.add(st);
	g.tick = T => {
		lamps.forEach((l, i) => l.material.color.setScalar(.75 + .25 * Math.sin(T * 1.3 + i)));
		const amp = T < 9.9 ? 1 : .6, bpm = T < 9.9 ? 2.2 : 1.2;
		mon.redraw((c, w, h) => { c.fillStyle = '#041010'; c.fillRect(0, 0, w, h); c.strokeStyle = '#5FD3B0'; c.lineWidth = 4; c.beginPath();
			for (let x = 0; x <= w; x += 4) { const ph = ((x / w) * 3 - T * bpm) % 1, p = ph < 0 ? ph + 1 : ph; const y = h * .55 - (p > .4 && p < .45 ? -h * .1 : p > .45 && p < .5 ? h * .35 * amp : p > .5 && p < .55 ? -h * .15 : 0); x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
			c.fillStyle = '#5FD3B0'; c.font = `700 ${h * .14}px ${COND}`; c.textAlign = 'right'; c.textBaseline = 'top'; c.fillText(T < 9.9 ? '112' : '74', w * .95, h * .05); });
		slam(st, T, 11.34, -.08);
	};
	return { g, bg: '#070b0a', fog: [4, 16] };
}

// ── médico com prancheta, AUTÓPSIA ──
function setMedico() {
	const g = new THREE.Group(); lights(g, '#56656a', .25); g.add(ground('#0c1011', 20));
	const bw = wall(8, 5, (c, w, h) => { c.fillStyle = '#121918'; c.fillRect(0, 0, w, h); }); bw.position.set(0, 2.5, -1.5); g.add(bw);
	const sp = new THREE.SpotLight('#e6efe9', 55, 9, .32, .6, 1.2); sp.position.set(0, 4.5, .8); sp.target.position.set(0, 1, 0); g.add(sp, sp.target);
	const cn = spotCone(.1, 1.4, 4.3, '#dfeee8', .22); cn.position.set(0, 4.5, .3); g.add(cn);
	const doc = silhouette(1.8, '#07090a'); g.add(doc);
	const coat = new THREE.Mesh(new THREE.CylinderGeometry(.29, .4, 1.05, 22, 1, true), new THREE.MeshStandardMaterial({ color: '#c9cec8', roughness: .8, side: THREE.DoubleSide })); coat.position.y = .82; g.add(coat);
	const clip = new THREE.Group(); clip.add(boxM(.34, .46, .02, '#5a4128', 0, 0, 0)); const pap = textPlane('ÓBITO · S. DOSS', .3, .07, { color: '#1a1410', font: MONO, weight: '400', bg: CC.bone, px: 900 }); pap.position.z = .012; clip.add(pap);
	clip.position.set(0, 1.18, .36); clip.rotation.x = -.5; g.add(clip);
	const st = stamp('AUTÓPSIA', 1.1, .32, AMB); st.position.set(0, 2.15, .7); g.add(st);
	const du = dust(120, [3, 4, 2], 41); du.position.y = 2; g.add(du);
	g.tick = T => { doc.rotation.y = .15 * Math.sin(T * .8); coat.rotation.y = doc.rotation.y; clip.rotation.z = .05 * Math.sin(T * 1.6); slam(st, T, 16.68, -.07); du.tick(T); };
	return { g, bg: '#040606', fog: [4, 14] };
}

// ── frasco de arsênico + pote de veneno de rato ──
function setFrasco() {
	const g = new THREE.Group(); lights(g, '#56656a', .35);
	const tb = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), std('#1d2321', .35, .5)); tb.rotation.x = -Math.PI / 2; g.add(tb);
	const sp = new THREE.SpotLight('#ffcf8a', 30, 6, .45, .7, 1.2); sp.position.set(0, 2.4, 1); sp.target.position.set(.1, 0, 0); g.add(sp, sp.target);
	const vial = new THREE.Group(); const gl = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, .62, 24, 1, true), new THREE.MeshStandardMaterial({ color: '#cfe3ea', transparent: true, opacity: .25, roughness: .1, side: THREE.DoubleSide, depthWrite: false })); gl.position.y = .31; gl.renderOrder = 3; vial.add(gl);
	const lq = new THREE.Mesh(new THREE.CylinderGeometry(.105, .105, .3, 20), new THREE.MeshBasicMaterial({ color: '#e8e2d2', transparent: true, opacity: .55 })); lq.position.y = .16; vial.add(lq);
	vial.add(boxM(.26, .08, .26, '#2a2724', 0, .66, 0)); const lab = textPlane('As', .16, .14, { color: '#1a1410', bg: AMB }); lab.position.set(0, .4, .125); lab.renderOrder = 4; vial.add(lab);
	vial.position.set(-.15, 0, 0); g.add(vial);
	const vg = glow('rgba(255,176,46,.5)', 1.4); vg.position.set(-.15, .35, -.3); g.add(vg);
	const t = textPlane('ARSÊNICO', 1, .22, { color: AMB }); t.position.set(-.1, .95, 0); g.add(t);
	const jar = poisonJar({ s: 1 }); jar.position.set(.5, 0, .05); jar.rotation.y = -.3; g.add(jar);
	const du = dust(70, [2, 1.5, 1], 47); du.position.y = .7; g.add(du);
	g.tick = T => { appear(t, pop(T, 18.28, .4)); jar.position.x = .5 + 1.2 * (1 - ease.expoOut(seg(T, 19.15, 19.6))); vg.material.opacity = .7 + .3 * Math.sin(T * 2.4); du.tick(T); };
	return { g, bg: '#040606', fog: [2, 7] };
}

// ── certidão: NANNIE DOSS batido à máquina ──
function setFicha() {
	const g = new THREE.Group(); lights(g, '#5b6a70', .45); g.add(wood(37, 8));
	const sp = new THREE.SpotLight('#ffe2b8', 28, 6, .5, .8, 1.2); sp.position.set(0, 2.6, .4); sp.target.position.set(0, 0, 0); g.add(sp, sp.target);
	const card = fileCard({ w: 1.15, h: 1.5, label: 'CERTIDÃO · ESPOSA', seed: 12, photo: true }); flat(card, 0, .005, 0, .04); g.add(card);
	const tl = typeLine('NANNIE DOSS', .9, .16); flat(tl, 0, .012, .38, .04); tl.renderOrder = 2; g.add(tl);
	const st = tag('TULSA · OK', .6, .14); flat(st, .22, .015, .62, .04); st.renderOrder = 3; g.add(st);
	g.tick = T => tl.type(Math.max(0, (T - 21.3) / .055));
	return { g, bg: '#050605', fog: [2, 8] };
}

// ── avó em contraluz (sorriso âmbar) ──
function setAvo() {
	const g = new THREE.Group(); lights(g, '#3e4a4c', .2); g.add(ground('#0a0c0b', 20));
	const win = wall(1.6, 2, (c, w, h) => { const gr = c.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, h * .7); gr.addColorStop(0, '#ffcf86'); gr.addColorStop(.6, '#9a5a14'); gr.addColorStop(1, '#1a0e04'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = '#050505'; c.fillRect(w / 2 - 5, 0, 10, h); c.fillRect(0, h / 2 - 5, w, 10); });
	win.position.set(0, 1.5, -2); g.add(win);
	const back = wall(8, 5, (c, w, h) => { c.fillStyle = '#0b0e0d'; c.fillRect(0, 0, w, h); }); back.position.set(0, 2.5, -2.02); g.add(back);
	const rim = new THREE.DirectionalLight('#ffb84d', 2.2); rim.position.set(0, 2, -3); g.add(rim);
	const gr = granny(); g.add(gr);
	const halo = glow('rgba(255,176,46,.35)', 3); halo.position.set(0, 1.3, -1.2); g.add(halo);
	const du = dust(120, [3, 3, 2], 53); du.position.y = 1.5; g.add(du);
	g.tick = T => { gr.smile(T < 30 ? .55 * sm(T, 23.15, 23.6) : sm(T, 58.6, 59.5)); gr.rotation.y = .06 * Math.sin(T * .7); gr.arm(-.15 + .05 * Math.sin(T), 0); halo.material.opacity = .7 + .3 * Math.sin(T * 1.5); du.tick(T); };
	return { g, bg: '#030404', fog: [3, 10] };
}

// ── arquivo: gaveta abre, três maridos anteriores ──
function setArquivo() {
	const g = new THREE.Group(); lights(g, '#5b6a70', .4); g.add(ground('#0c1011', 20));
	const sp = new THREE.SpotLight('#ffe2b8', 40, 8, .5, .7, 1.2); sp.position.set(0, 4, 1.5); sp.target.position.set(0, 1, 0); g.add(sp, sp.target);
	const cab = boxM(1.2, 2, .8, '#3a4440', 0, 1, -.4, .5); g.add(cab);
	const dr = new THREE.Group(); dr.add(boxM(1.1, .5, .8, '#46524d', 0, 0, 0, .5)); dr.add(boxM(.25, .05, .05, '#9aa', 0, .05, .42, .3));
	for (let i = 0; i < 8; i++) dr.add(boxM(1, .42, .015, i % 2 ? '#a08050' : '#b8975c', 0, .1, -.3 + i * .08, .9));
	dr.position.set(0, 1.55, 0); g.add(dr);
	const CARDS = [['MARIDO · 1945', 'F. HARRELSON', 26.27], ['MARIDO · 1952', 'A. LANNING', 26.6], ['MARIDO · 1953', 'R. MORTON', 26.99]].map(([l, n, t], i) => {
		const c = fileCard({ w: .62, h: .8, label: l, name: n, seed: 20 + i }); c.position.set((i - 1) * .66, 2.3, .3 + i * .01); c.rotation.z = (i - 1) * -.08; c.renderOrder = i; g.add(c); return [c, t];
	});
	g.tick = T => { dr.position.z = .65 * ease.expoOut(seg(T, 25.8, 26.2)); CARDS.forEach(([c, t], i) => { const k = ease.expoOut(seg(T, t, t + .4)); c.visible = k > .01; c.position.y = lerp(1.6, 2.35 + Math.sin(T * 1.2 + i) * .02, k); c.position.z = .3 + .65 * (1 - k) + i * .01; }); };
	return { g, bg: '#050706', fog: [3, 12] };
}

// ── atestados: NATURAL ×3; coração / estômago / doença ──
const CZ = [-1.7, 0, 1.7], CX = [-.15, .15, -.1];
function setAtestados() {
	const g = new THREE.Group(); lights(g, '#5b6a70', .55); g.add(wood(43, 10));
	const sp = new THREE.SpotLight('#ffe2b8', 45, 9, .7, .8, 1.2); sp.position.set(0, 5, 1); sp.target.position.set(0, 0, 0); g.add(sp, sp.target);
	const ST = [], CA = [];
	['CORAÇÃO', 'ESTÔMAGO', 'DOENÇA'].forEach((cause, i) => {
		const p = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.45), new THREE.MeshBasicMaterial({ map: canvasTex(330, 435, (c, w, h) => {
			c.fillStyle = '#d8cdb4'; c.fillRect(0, 0, w, h); c.strokeStyle = '#3a3026'; c.lineWidth = 4; c.strokeRect(10, 10, w - 20, h - 20);
			ftxt(c, 'ATESTADO DE ÓBITO', w / 2, h * .1, w * .8, h * .06, '700', COND, '#1a1410');
			c.strokeStyle = 'rgba(40,30,20,.5)'; c.lineWidth = 2; for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(w * .12, h * (.22 + k * .07)); c.lineTo(w * .88, h * (.22 + k * .07)); c.stroke(); }
			c.font = `400 ${h * .04}px ${MONO}`; c.fillStyle = '#1a1410'; c.textAlign = 'left'; c.fillText(['MARIDO · 1945', 'MARIDO · 1952', 'MARIDO · 1953'][i], w * .12, h * .2); c.fillText('CAUSA:', w * .12, h * .66);
		}) }));
		p.material.color.setScalar(.85); flat(p, CX[i], .005, CZ[i], (i - 1) * .06); g.add(p);
		const s = textPlane('NATURAL', .6, .2, { color: AMB, border: AMB, weight: '700', track: 6, px: 700 }); s.position.set(CX[i] + .1, .02, CZ[i] - .1); s.rotation.x = -Math.PI / 2; s.renderOrder = 3; g.add(s); ST.push(s);
		const ca = textPlane(cause, .62, .15, { color: AMB, font: MONO, weight: '400' }); flat(ca, CX[i] + .12, .015, CZ[i] + .28, (i - 1) * .06); ca.renderOrder = 2; g.add(ca); CA.push(ca);
	});
	g.tick = T => { ST.forEach((s, i) => { const t = [34.41, 34.62, 34.83][i], u = seg(T, t, t + .14); s.visible = T >= t; s.scale.setScalar(lerp(1.5, 1, ease.expoIn(u))); s.material.opacity = Math.min(1, u * 3); s.rotation.z = -.2; }); CA.forEach((c, i) => appear(c, pop(T, [35.2, 36.16, 37.11][i], .35))); };
	return { g, bg: '#050605', fog: [3, 12] };
}

// ── rua: vizinhos passam sem olhar, avó acena da varanda ──
function setRua() {
	const g = new THREE.Group(); lights(g, '#6a7f8c', 1.1); g.add(ground('#10161a', 60));
	const moon = new THREE.DirectionalLight('#9ab4c8', .7); moon.position.set(3, 6, 6); g.add(moon);
	const h = house({ w: 3.4, h: 1.9, d: 2.6, wins: 2 }); h.position.z = -2; g.add(h);
	const h2 = house({ w: 2.6, h: 1.6, d: 2.2 }); h2.position.set(4, 0, -3.5); g.add(h2);
	const h3 = house({ w: 2.6, h: 1.7, d: 2.2 }); h3.position.set(-4, 0, -3.5); g.add(h3);
	const gr = granny({ h: 1.5 }); gr.position.set(.9, 0, -.4); g.add(gr);
	const pg = glow('rgba(255,176,46,.45)', 2.4); pg.position.set(.9, 1, -.6); g.add(pg);
	const N = [0, 1, 2].map(i => { const s = silhouette(1.75 - i * .08, '#2a3238'); s.position.z = 1.6 + i * .5; g.add(s); return s; });
	g.tick = T => { N.forEach((s, i) => { s.position.x = -4.5 + (T - 37.9 - i * .7) * 2.2 * (i % 2 ? -1 : 1) + (i % 2 ? 9 : 0); s.position.y = Math.abs(Math.sin(T * 6 + i)) * .03; s.rotation.y = i % 2 ? -Math.PI / 2 : Math.PI / 2; });
		gr.arm(0, 2.5 + .3 * Math.sin(T * 4)); h.light(0, 1); h.light(1, .8); h2.light(1, .5); };
	return { g, bg: '#05080b', fog: [6, 22] };
}

// ── interrogatório: ela ri; gravador ──
function setInterrog() {
	const g = new THREE.Group(); lights(g, '#4b5a5c', .3); g.add(ground('#0d1110', 20));
	const bw = wall(6, 4, (c, w, h) => { c.fillStyle = '#1a2220'; c.fillRect(0, 0, w, h); const gr = c.createLinearGradient(w * .2, 0, w * .8, h); gr.addColorStop(0, '#0e1517'); gr.addColorStop(.5, '#26363a'); gr.addColorStop(1, '#0a0f10'); c.fillStyle = gr; c.fillRect(w * .2, h * .2, w * .6, h * .45); c.strokeStyle = '#05080a'; c.lineWidth = 10; c.strokeRect(w * .2, h * .2, w * .6, h * .45); });
	bw.position.set(0, 2, -2); g.add(bw);
	g.add(boxM(1.6, .06, .9, '#2a2e2c', 0, .75, 0, .5)); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => g.add(boxM(.05, .72, .05, '#1a1c1b', a * .74, .36, b * .4)));
	const nd = seated({ bun: true, chair: '#1a1c1b' }); nd.position.set(0, 0, -.8); g.add(nd);
	const rec = recorder({ s: .8 }); rec.position.set(0, .78, .15); g.add(rec);
	const lamp = pendant({ y: 2.1, cord: 2, power: 38, cone: .3 }); g.add(lamp);
	const du = dust(100, [3, 3, 2], 59); du.position.y = 1.5; g.add(du);
	g.tick = T => { const laugh = T >= 40.6 && T < 42.6 ? 1 : .3; nd.body.position.y = .5 + .018 * laugh * Math.abs(Math.sin(T * Math.PI * 2.2)); nd.body.rotation.z = .03 * laugh * Math.sin(T * Math.PI * 2.2); nd.body.rotation.x = .08; rec.tick(T); lamp.set(T >= 45 ? 1 - .45 * sm(T, 45.3, 46.1) : 1); du.tick(T); };
	return { g, bg: '#040606', fog: [3, 11] };
}

// ── jornal: A VOVÓ RISONHA ──
function setJornal() {
	const g = new THREE.Group(); g.add(new THREE.AmbientLight('#ffffff', 1));
	const np = new THREE.Mesh(new THREE.PlaneGeometry(2, 2.8), new THREE.MeshBasicMaterial({ map: canvasTex(600, 840, (c, w, h) => {
		c.fillStyle = '#d6ccb2'; c.fillRect(0, 0, w, h); ftxt(c, 'O DIÁRIO DA TARDE', w / 2, h * .07, w * .86, h * .07, '700', COND, '#1a1410');
		c.fillStyle = '#1a1410'; c.fillRect(w * .05, h * .12, w * .9, 4); c.font = `400 ${h * .022}px ${MONO}`; c.textAlign = 'center'; c.fillText('TULSA · NOVEMBRO DE 1954', w / 2, h * .145);
		ftxt(c, 'A VOVÓ', w / 2, h * .23, w * .88, h * .1, '700', COND, '#111'); ftxt(c, 'RISONHA', w / 2, h * .33, w * .88, h * .1, '700', COND, '#111');
		ftxt(c, 'avó confessa ter envenenado maridos', w / 2, h * .41, w * .86, h * .035, '400', MONO, '#2a2018');
		c.fillStyle = '#6a6a62'; c.fillRect(w * .08, h * .46, w * .42, h * .3); c.fillStyle = '#121212'; c.beginPath(); c.arc(w * .29, h * .57, w * .07, 0, 7); c.fill(); c.beginPath(); c.arc(w * .29, h * .51, w * .035, 0, 7); c.fill(); c.beginPath(); c.ellipse(w * .29, h * .76, w * .15, h * .12, 0, Math.PI, 0); c.fill();
		c.fillStyle = 'rgba(30,24,18,.5)'; for (let i = 0; i < 18; i++) c.fillRect(w * .55, h * (.47 + i * .016), w * (.37 - (i % 4) * .03), h * .006); for (let i = 0; i < 12; i++) c.fillRect(w * .08, h * (.79 + i * .016), w * .84, h * .006);
	}) }));
	np.material.color.setScalar(.88); g.add(np);
	const bg = glow('rgba(255,240,210,.25)', 6); bg.position.z = -1; g.add(bg);
	g.tick = T => { const k = ease.expoOut(seg(T, 42.5, 43.05)); np.rotation.z = (1 - k) * 5 + .04; np.scale.setScalar(.15 + .85 * k); np.position.y = .1 * Math.sin(T * .8); };
	return { g, bg: '#0a0b0b', fog: [5, 20] };
}

// ── comida / café / bebida, cada um com o pote ao lado ──
const TX = [-1.6, 0, 1.6];
function setTrio() {
	const g = new THREE.Group(); lights(g, '#56656a', .4); g.add(wood(51, 10));
	TX.forEach((x, i) => { const sp = new THREE.SpotLight('#ffcf8a', 22, 4, .5, .7, 1.2); sp.position.set(x, 2, .8); sp.target.position.set(x, 0, 0); g.add(sp, sp.target); const j = poisonJar({ s: .8 }); j.position.set(x - .38, 0, -.25); j.rotation.y = .4; g.add(j); });
	const pl = new THREE.Group(); pl.add(new THREE.Mesh(new THREE.CylinderGeometry(.3, .24, .03, 32), std('#cfc6b2', .4))); [[0, 0, '#5a3a1a', .1], [.1, .06, '#6b7a3a', .06], [-.1, .05, '#c9a76a', .07]].forEach(([x, z, c, r]) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), std(c, .7)); s.scale.y = .5; s.position.set(x, .04, z); pl.add(s); });
	pl.position.set(TX[0], .015, 0); g.add(pl);
	const c = cup({ s: 2 }); c.position.x = TX[1]; g.add(c); const st = steam({ n: 70, h: .8, w: .12, seed: 61, size: .07 }); st.position.set(TX[1], .2, 0); g.add(st);
	const gl = new THREE.Mesh(new THREE.CylinderGeometry(.11, .09, .34, 24, 1, true), new THREE.MeshStandardMaterial({ color: '#cfe3ea', transparent: true, opacity: .25, roughness: .1, side: THREE.DoubleSide, depthWrite: false })); gl.position.set(TX[2], .17, 0); gl.renderOrder = 3; g.add(gl);
	const lq = new THREE.Mesh(new THREE.CylinderGeometry(.1, .085, .2, 20), new THREE.MeshBasicMaterial({ color: '#c97a1c', transparent: true, opacity: .8 })); lq.position.set(TX[2], .1, 0); g.add(lq);
	g.tick = T => { st.tick(T); };
	return { g, bg: '#050605', fog: [1.5, 6] };
}

// ── romance perfeito: moldura vazia + 4 alianças ──
function setAliancas() {
	const g = new THREE.Group(); lights(g, '#56656a', .3); g.add(ground('#0c0f0e', 20));
	const bw = wall(6, 4, (c, w, h) => { c.fillStyle = '#1b201d'; c.fillRect(0, 0, w, h); }); bw.position.set(0, 2, -.6); g.add(bw);
	const fr = new THREE.Group(); [[0, .58, 1, .08], [0, -.58, 1, .08], [-.46, 0, .08, 1.24], [.46, 0, .08, 1.24]].forEach(([x, y, w, h]) => fr.add(boxM(w, h, .05, '#8a6a3c', x, y, 0, .4)));
	const ins = wall(.84, 1.08, (c, w, h) => { c.fillStyle = '#2a2a26'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(216,205,180,.25)'; c.setLineDash([8, 8]); c.lineWidth = 3; [[.35, .45], [.65, .4]].forEach(([x, y]) => { c.beginPath(); c.arc(w * x, h * y, w * .1, 0, 7); c.stroke(); c.beginPath(); c.ellipse(w * x, h * (y + .4), w * .17, h * .25, 0, Math.PI, 0); c.stroke(); }); });
	ins.position.z = -.01; fr.add(ins); fr.position.set(0, 1.55, -.55); g.add(fr);
	g.add(boxM(1.6, .06, .7, '#2a1d12', 0, .75, 0, .6));
	const sp = new THREE.SpotLight('#ffcf8a', 35, 6, .5, .7, 1.2); sp.position.set(0, 3, 1.2); sp.target.position.set(0, 1, 0); g.add(sp, sp.target);
	const R = [-.45, -.15, .15, .45].map((x, i) => { const r = ring({ r: .09 }); r.position.set(x, .89, .1); g.add(r); return r; });
	const gl = glow('rgba(255,176,46,.4)', 1.6); gl.position.set(0, .95, -.2); g.add(gl);
	g.tick = T => R.forEach((r, i) => { appear(r, pop(T, [49.5, 49.95, 50.42, 50.87][i], .4)); r.rotation.y = T * .8 + i; });
	return { g, bg: '#040605', fog: [3, 10] };
}

// ── cela: CONDENADA, PRISÃO PERPÉTUA ──
function setCela() {
	const g = new THREE.Group(); lights(g, '#4b5a5c', .3);
	const fl = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshStandardMaterial({ roughness: .8, map: canvasTex(512, 512, (c, w, h) => { c.fillStyle = '#3a3e3a'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(0,0,0,.75)'; for (let i = 0; i < 9; i++) c.fillRect(w * (.3 + i * .05), 0, w * .018, h); }) }));
	fl.rotation.x = -Math.PI / 2; g.add(fl);
	const bw = wall(6, 4, (c, w, h) => { c.fillStyle = '#161a18'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,.04)'; for (let y = 0; y < h; y += 30) c.fillRect(0, y, w, 2); }); bw.position.set(0, 2, -1.6); g.add(bw);
	const sp = new THREE.SpotLight('#cfdcd6', 40, 9, .45, .6, 1.2); sp.position.set(0, 4, -1); sp.target.position.set(0, 0, 1); g.add(sp, sp.target);
	for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 3, 8), std('#0a0c0c', .4, .8)); b.position.set(-1.6 + i * .4, 1.5, .9); g.add(b); }
	g.add(boxM(3.4, .06, .06, '#0a0c0c', 0, 2.6, .9)); g.add(boxM(3.4, .06, .06, '#0a0c0c', 0, .4, .9));
	const nd = seated({ bun: true, chair: '#202422' }); nd.position.set(0, 0, -.7); g.add(nd);
	const st = stamp('CONDENADA', 1.25, .34, CC.red); st.position.set(0, 2.2, 1.4); st.renderOrder = 5; g.add(st);
	const sub = tag('PRISÃO PERPÉTUA', 1.15, .2); sub.position.set(0, 1.72, 1.4); sub.renderOrder = 5; g.add(sub);
	g.tick = T => { nd.slump(.35); slam(st, T, 51.9, -.08); appear(sub, pop(T, 53.72, .35)); };
	return { g, bg: '#030404', fog: [3, 12] };
}

export function buildSets() {
	return { mesa: setMesa(), xicara: setXicara(), casa: setCasa(), hospital: setHospital(), medico: setMedico(), frasco: setFrasco(), ficha: setFicha(), avo: setAvo(), arquivo: setArquivo(), atestados: setAtestados(), rua: setRua(), interrog: setInterrog(), jornal: setJornal(), trio: setTrio(), aliancas: setAliancas(), cela: setCela() };
}

const certCam = (i, a) => [CX[i] + .05, a ? 1.7 : 1.3, CZ[i] + (a ? .8 : .6), CX[i] + .05, 0, CZ[i] + .05];
const trioCam = (i, a) => [TX[i] + (a ? .25 : .1), a ? .75 : .6, a ? 1.15 : .85, TX[i] - .1, .15, -.05];
// planos: [início, set, câmera A, câmera B, transição]
export const SH = [
	[0, 'mesa', [0, 2.2, 4.4, 0, .9, -.3], [0, 1.9, 3.3, 0, .95, -.35]],
	[1.18, 'mesa', [-1.6, 1.7, 3.4, -.3, 1.2, -1.6], [1.3, 1.7, 3.4, .7, 1.2, -1.6], 'whip'],
	[2.21, 'xicara', [.6, .7, 1.6, 0, .45, 0], [.25, .6, 1.2, 0, .5, 0], 'dip'],
	[3.61, 'casa', [-2, 1.7, 9.5, 0, 1.6, 0], [1, 1.6, 7.6, 0, 1.6, 0], 'sweep'],
	[6.23, 'mesa', [.1, 1.6, 1.5, -.4, 1.05, -.7], [-.15, 1.4, 1, -.4, 1, -.75], 'dip'],
	[8.78, 'hospital', [0, 1.6, 7.5, -.1, 1.3, 0], [0, 1.5, 3.8, -.1, 1.2, -1], 'whip'],
	[10.82, 'hospital', [.6, 1.65, 2.8, .45, 1.55, .3], [.5, 1.6, 2.3, .45, 1.55, .3]],
	[11.99, 'mesa', [.35, 1.25, .75, -.35, .9, -.45], [.15, 1.15, .45, -.35, .88, -.45], 'sweep'],
	[14.28, 'mesa', [0, 1.9, 3.2, -.3, .9, -.6], [0, 1.8, 2.8, -.3, .9, -.6]],
	[15.18, 'medico', [0, 1.7, 4.4, 0, 1.45, 0], [0, 1.65, 3.2, 0, 1.55, 0], 'dip'],
	[17.49, 'frasco', [0, .35, 1.7, -.1, .25, 0], [0, .8, 1.6, -.1, .65, 0], 'whip'],
	[19.18, 'frasco', [.75, .55, 1.5, .4, .35, 0], [.6, .5, 1.15, .4, .35, 0]],
	[20.43, 'ficha', [0, 2.2, 1.0, 0, 0, .6], [0, 1.8, .9, 0, 0, .62], 'sweep'],
	[22.38, 'avo', [0, 1.4, 3.6, 0, 1.2, 0], [0, 1.4, 2.4, 0, 1.3, 0], 'dip'],
	[24.2, 'mesa', [-1.6, 1.8, 3.2, 0, .9, -.6], [1.3, 1.8, 3.2, 0, .9, -.6], 'whip'],
	[25.71, 'arquivo', [0, 3, 3, 0, 2.1, 0], [0, 2.6, 2.6, 0, 1.9, 0], 'sweep'],
	[27.61, 'mesa', [0, 1.7, 2.4, 0, .9, -.4], [0, 2.4, 4.4, 0, .9, -.4], 'dip'],
	[30.48, 'mesa', [-.9, 1.35, 2.2, .7, 1.2, -1.6], [-.7, 1.35, 1.9, .7, 1.2, -1.6], 'whip'],
	[31.63, 'mesa', [1.6, 1.25, 1.4, .8, 1.15, -1.6], [1.4, 1.25, 1.1, .8, 1.2, -1.6]],
	[32.98, 'atestados', [0, 5.6, 1.4, 0, 0, 0], [0, 4.8, 1.1, 0, 0, 0], 'dip'],
	[35.17, 'atestados', certCam(0, 1), certCam(0, 0), 'whip'],
	[36.13, 'atestados', certCam(1, 1), certCam(1, 0)],
	[37.08, 'atestados', certCam(2, 1), certCam(2, 0)],
	[37.99, 'rua', [-1.6, 1.6, 6.2, 0, 1.2, -.5], [1, 1.6, 5.6, 0, 1.2, -.5], 'sweep'],
	[40.65, 'interrog', [0, 1.7, 3.8, 0, 1.15, -.6], [0, 1.5, 2.6, 0, 1.15, -.6], 'dip'],
	[42.53, 'jornal', [0, 0, 4.6, 0, 0, 0], [0, 0, 3.5, 0, 0, 0], 'whip'],
	[45.03, 'interrog', [.3, 1.4, 1.5, 0, .85, .1], [.1, 1.2, 1.05, 0, .85, .1], 'dip'],
	[46.26, 'trio', trioCam(0, 1), trioCam(0, 0), 'whip'],
	[47.61, 'trio', trioCam(1, 1), trioCam(1, 0)],
	[48.52, 'trio', trioCam(2, 1), trioCam(2, 0)],
	[49.46, 'aliancas', [0, 1.5, 3.4, 0, 1.2, 0], [0, 1.3, 2.5, 0, 1.1, 0], 'sweep'],
	[51.67, 'cela', [0, 2.8, 4.6, 0, 1.8, 0], [0, 1.9, 4.2, 0, 1.4, 0], 'dip'],
	[54.96, 'mesa', [0, 1.7, 2.4, 0, .9, -.4], [0, 2.5, 4.6, 0, .9, -.4], 'sweep'],
	[56.82, 'xicara', [0, .8, 1.9, 0, .45, 0], [0, .6, 1.25, 0, .5, 0], 'dip'],
	[58.37, 'avo', [0, 1.4, 2.8, 0, 1.33, 0], [0, 1.38, 1.3, 0, 1.37, 0], 'dip'],
	[60.35, 'xicara', [0, 1.7, 3.6, 0, 1.25, 0], [0, 1.6, 3.1, 0, 1.25, 0], 'dip'],
];
