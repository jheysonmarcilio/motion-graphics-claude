// Estilo ESPECIAL "True Crime" (novo kit): noite, chuva, âmbar de poste × giroflex vermelho/azul, silhuetas, fita de isolamento,
// fila de reconhecimento, quadro de provas com barbante, DNA, tipografia de máquina de escrever, carimbo vermelho, letterbox + grão (DOM).
// Peças exportadas para reuso: textPlane, stamp, silhouette, rain, tape. Tudo é função do tempo T absoluto.
import * as THREE from 'three';
import { clamp, seg, lerp, ease, pop, gone, smooth, mulberry32, canvasTex, fitFont } from './lib.js';

export const CC = { amb: '#FFB347', red: '#E01F2F', blu: '#2B6BFF', bone: '#D8CDB4', teal: '#1F3A44', ink: '#07090C', green: '#5FD3B0' };
const MONO = '"Special Elite","Courier New",monospace', COND = 'Oswald,"Arial Narrow",Impact,sans-serif';
const show = (o, k) => { o.visible = k > .004; o.scale.setScalar(Math.max(k, 1e-4)); };

export function textPlane(text, w, h, { color = CC.bone, font = COND, weight = '700', bg = null, border = null, px = 110, track = 0 } = {}) {
	const cw = Math.round(w * px), ch = Math.round(h * px), lines = [].concat(text);
	const tex = canvasTex(cw, ch, g => {
		if (bg) { g.fillStyle = bg; g.fillRect(0, 0, cw, ch); }
		if (border) { g.strokeStyle = border; g.lineWidth = ch * .07; g.strokeRect(ch * .05, ch * .05, cw - ch * .1, ch - ch * .1); }
		const lh = ch / lines.length, size = Math.min(...lines.map(t => fitFont(g, t, cw * .86 - t.length * track, lh * .62, weight, font)));
		g.font = `${weight} ${size}px ${font}`; g.letterSpacing = `${track}px`; g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
		lines.forEach((t, i) => g.fillText(t, cw / 2, lh * (i + .5) + size * .04));
	});
	return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
}
// carimbo que bate: entra grande, "bate" e treme
export function stamp(text, w = 5, h = 1.5, color = CC.red) {
	const m = textPlane(text, w, h, { color, border: color, weight: '700', track: 6 }); m.rotation.z = -.1; return m;
}
export function slam(m, T, t, base = -.1) { const u = seg(T, t, t + .16), k = u < 1 ? lerp(2.6, 1, ease.expoIn(u)) : 1 + .05 * Math.max(0, 1 - (T - t - .16) * 6) * Math.cos((T - t) * 40); m.visible = T >= t; m.scale.setScalar(k); m.material.opacity = Math.min(1, u * 3); m.rotation.z = base + (T - t < .4 ? Math.sin((T - t) * 60) * .01 * (1 - (T - t) / .4) : 0); }

export function silhouette(h = 1.8, c = '#000') {
	const g = new THREE.Group(), m = c === '#000' ? new THREE.MeshBasicMaterial({ color: c }) : new THREE.MeshStandardMaterial({ color: c, roughness: .9 });
	const body = new THREE.Mesh(new THREE.CapsuleGeometry(.27 * h / 1.8, h * .52, 6, 14), m); body.position.y = h * .42;
	const legs = new THREE.Mesh(new THREE.CylinderGeometry(.2 * h / 1.8, .17 * h / 1.8, h * .34, 12), m); legs.position.y = h * .17;
	const head = new THREE.Mesh(new THREE.SphereGeometry(.2 * h / 1.8, 20, 14), m); head.position.y = h * .86;
	g.add(body, legs, head); return g;
}
function rainLines(n, seed) {
	const r = mulberry32(seed), p = new Float32Array(n * 6), base = Array.from({ length: n }, () => [(r() - .5) * 34, r() * 16, (r() - .75) * 14, .8 + r() * .6]);
	const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
	const m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#9DB7C8', transparent: true, opacity: .35, depthWrite: false })); m.frustumCulled = false;
	m.tick = T => { base.forEach(([x, y0, z, sp], i) => { const y = 14 - ((y0 + T * 15 * sp) % 16); p.set([x + y * .06, y, z, x + y * .06 + .05, y - .75 * sp, z], i * 6); }); g.attributes.position.needsUpdate = true; };
	return m;
}
const glow = (c, s) => { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(cv); const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ map: t, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); return m; };

function building(w, h, d, seed) {
	const r = mulberry32(seed), tex = canvasTex(128, Math.round(128 * h / w), (g, cw, ch) => { g.fillStyle = '#0D1318'; g.fillRect(0, 0, cw, ch); for (let y = 8; y < ch - 10; y += 16) for (let x = 8; x < cw - 10; x += 16) { if (r() < .28) { g.fillStyle = r() < .85 ? '#FFB347' : '#9DD6FF'; g.globalAlpha = .35 + r() * .5; g.fillRect(x, y, 8, 10); g.globalAlpha = 1; } else { g.fillStyle = '#131C23'; g.fillRect(x, y, 8, 10); } } });
	return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ map: tex }));
}
const wall = (w, h, draw) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: canvasTex(Math.round(w * 90), Math.round(h * 90), draw) }));

export function buildCrime({ tw, t0, t1 }) {
	const scene = new THREE.Scene(); scene.background = new THREE.Color(CC.ink); scene.fog = new THREE.Fog(CC.ink, 9, 34);
	const cam = new THREE.PerspectiveCamera(38, 16 / 9, .1, 100);
	scene.add(new THREE.AmbientLight('#7FA0B5', .8)); const key = new THREE.DirectionalLight(CC.amb, 2.2); key.position.set(-4, 6, 5); scene.add(key);
	const rim = new THREE.PointLight(CC.blu, 40, 20); rim.position.set(5, 3, 3); scene.add(rim); const rim2 = new THREE.PointLight(CC.red, 40, 20); rim2.position.set(-5, 3, 3); scene.add(rim2);
	const S = {}; const mkSet = k => { const g = new THREE.Group(); g.visible = false; scene.add(g); S[k] = g; return g; };
	const rain = rainLines(650, 9); scene.add(rain);

	// ── 1 · rua à noite ──
	const st = mkSet('street');
	[[-9, 9, 3, 1], [-5.4, 12, 3, 2], [5.2, 10, 3, 3], [9.4, 13, 3, 4], [0, 15, 3, 5], [-13, 11, 3, 6], [13, 12, 3, 7]].forEach(([x, h, d, s], i) => { const b = building(3.4 + (i % 3) * .6, h, d, s); b.position.set(x, h / 2 - 2, -9 - (i % 3) * 2); st.add(b); });
	const gnd = new THREE.Mesh(new THREE.PlaneGeometry(50, 40), new THREE.MeshStandardMaterial({ color: '#0F161B', roughness: .25, metalness: .6 })); gnd.rotation.x = -Math.PI / 2; gnd.position.y = -2; st.add(gnd);
	const pole = new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, 7, 8), new THREE.MeshBasicMaterial({ color: '#05080A' })); pole.position.set(-3.6, 1.5, -2); st.add(pole);
	const cone = new THREE.Mesh(new THREE.ConeGeometry(3, 6.5, 32, 1, true), new THREE.MeshBasicMaterial({ color: CC.amb, transparent: true, opacity: .05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); cone.position.set(-3.6, .75, -2); st.add(cone);
	const lampG = glow('rgba(255,190,90,.9)', 2.4); lampG.position.set(-3.6, 5, -1.9); st.add(lampG);
	const pool = glow('rgba(255,179,71,.55)', 7); pool.rotation.x = -Math.PI / 2; pool.position.set(-3.6, -1.95, -2); st.add(pool);
	const redG = glow('rgba(224,31,47,.9)', 9), bluG = glow('rgba(43,107,255,.9)', 9); redG.position.set(-6, 1.5, -6); bluG.position.set(6, 1.5, -6); st.add(redG, bluG);
	const chalk = wall(4.6, 2.6, (g, w, h) => { g.strokeStyle = '#F2EEE2'; g.lineWidth = 7; g.lineCap = g.lineJoin = 'round'; g.beginPath(); g.arc(w * .2, h * .5, h * .15, 0, 7); g.moveTo(w * .35, h * .5); g.lineTo(w * .62, h * .36); g.lineTo(w * .82, h * .32); g.moveTo(w * .35, h * .5); g.lineTo(w * .6, h * .66); g.lineTo(w * .86, h * .72); g.moveTo(w * .42, h * .5); g.lineTo(w * .52, h * .22); g.moveTo(w * .42, h * .5); g.lineTo(w * .5, h * .82); g.stroke(); });
	chalk.material.transparent = true; chalk.rotation.x = -Math.PI / 2; chalk.position.set(.4, -1.94, 1.2); st.add(chalk);
	const tex = canvasTex(256, 32, g => { g.fillStyle = '#F4C20D'; g.fillRect(0, 0, 256, 32); g.fillStyle = '#111'; for (let i = -2; i < 12; i++) { g.beginPath(); g.moveTo(i * 28, 0); g.lineTo(i * 28 + 14, 0); g.lineTo(i * 28 + 2, 32); g.lineTo(i * 28 - 12, 32); g.fill(); } g.font = '700 22px Oswald,Impact'; });
	tex.wrapS = THREE.RepeatWrapping; tex.repeat.set(6, 1);
	const tapes = [0, 1].map(i => { const m = new THREE.Mesh(new THREE.PlaneGeometry(26, .32, 24, 1), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide })); m.position.set(0, -.5 + i * .5, 1.2 - i * .4); m.rotation.z = i ? .03 : -.05; st.add(m); return m; });

	// ── 2 · testemunha (persiana + silhueta) ──
	const wi = mkSet('witness');
	const blinds = wall(22, 12, (g, w, h) => { g.fillStyle = '#05080B'; g.fillRect(0, 0, w, h); const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(255,179,71,.0)'); gr.addColorStop(.5, 'rgba(255,179,71,.85)'); gr.addColorStop(1, 'rgba(255,179,71,.55)'); g.fillStyle = gr; for (let y = 0; y < h; y += h / 14) g.fillRect(0, y, w, h / 14 * .5); });
	blinds.position.z = -3; wi.add(blinds);
	const wsil = silhouette(3.4); wsil.position.set(-1.8, -3.1, 0); wsil.scale.set(1.5, 1, 1); wi.add(wsil); const ww = { scale: { setScalar() {} } };
	const FN = 260, fr = mulberry32(31), fpts = [], fpos = new Float32Array(FN * 3); for (let i = 0; i < FN; i++) { const a = fr() * 6.283, rr = Math.sqrt(fr()); fpts.push([Math.cos(a) * .9 * rr, Math.sin(a) * 1.25 * rr, (fr() - .5) * .3, .3 + fr() * 1.2, fr() * 6.28]); }
	const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(fpos, 3));
	const fcloud = new THREE.Points(fg, new THREE.PointsMaterial({ color: CC.bone, size: .07, transparent: true, opacity: .85, depthWrite: false })); fcloud.frustumCulled = false; fcloud.position.set(2.8, .2, 0); wi.add(fcloud);

	// ── 3 · fila de reconhecimento ──
	const li = mkSet('lineup');
	const back = wall(20, 9, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2D3C43'); gr.addColorStop(1, '#10181C'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(220,210,185,.55)'; g.fillStyle = 'rgba(220,210,185,.8)'; g.lineWidth = 2; g.font = '700 22px Oswald,Impact'; for (let i = 0; i < 9; i++) { const y = h * .96 - i * (h * .095); g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); g.fillText(String(150 + i * 10), 10, y - 5); } });
	back.position.set(0, 2.2, -2.5); li.add(back);
	const flo = new THREE.Mesh(new THREE.PlaneGeometry(30, 10), new THREE.MeshStandardMaterial({ color: '#0A0F12', roughness: .4 })); flo.rotation.x = -Math.PI / 2; flo.position.set(0, -2, 0); li.add(flo);
	const sils = [-4.4, -2.2, 0, 2.2, 4.4].map((x, i) => { const g = silhouette([1.75, 1.82, 1.7, 1.9, 1.78][i] * 1.45); g.position.set(x, -2, -1.4); li.add(g); const n = textPlane(String(i + 1), .7, .7, { color: CC.ink, bg: CC.bone }); n.position.set(x, -1.1, -.4); li.add(n); return g; });
	const spot = new THREE.Mesh(new THREE.ConeGeometry(1.7, 8.5, 28, 1, true), new THREE.MeshBasicMaterial({ color: '#E9E2CC', transparent: true, opacity: .1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); spot.position.set(0, 2.3, -1.4); li.add(spot);
	const ring = new THREE.Mesh(new THREE.RingGeometry(.9, 1.0, 40), new THREE.MeshBasicMaterial({ color: CC.red, transparent: true, side: THREE.DoubleSide })); ring.position.set(0, .3, -1.2); li.add(ring);
	const cond = stamp('CONDENADO', 6, 1.7); cond.position.set(0, 0, 4.2); li.add(cond);

	// ── 4 · DNA ──
	const dn = mkSet('dna');
	const helix = new THREE.Group(); dn.add(helix);
	const hm1 = new THREE.MeshBasicMaterial({ color: CC.green }), hm2 = new THREE.MeshBasicMaterial({ color: CC.amb }), hm3 = new THREE.MeshBasicMaterial({ color: '#7FA0B5' });
	for (let i = 0; i < 44; i++) { const y = (i - 22) * .3, a = i * .42, x1 = Math.cos(a) * 1.1, z1 = Math.sin(a) * 1.1; const s1 = new THREE.Mesh(new THREE.SphereGeometry(.13, 12, 10), hm1), s2 = new THREE.Mesh(new THREE.SphereGeometry(.13, 12, 10), hm2); s1.position.set(x1, y, z1); s2.position.set(-x1, y, -z1); const r = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 2.2, 6), hm3); r.position.set(0, y, 0); r.rotation.z = Math.PI / 2; r.rotation.y = -a; helix.add(s1, s2, r); }
	helix.position.set(3.4, 0, -1); helix.rotation.z = .35;
	const dg = glow('rgba(95,211,176,.5)', 10); dg.position.set(3.4, 0, -4); dn.add(dg);
	const yrs = textPlane('ANOS DEPOIS', 5.6, 1.2, { color: CC.bone, font: MONO, weight: '400', track: 4 }); yrs.position.set(-3.2, 1.7, 0); dn.add(yrs);
	const lab = textPlane(['EXAME DE DNA', 'amostra ≠ suspeito'], 5.4, 1.5, { color: CC.green, font: MONO, weight: '400', bg: 'rgba(31,58,68,.55)', border: CC.green }); lab.position.set(-3.2, .2, 0); dn.add(lab);
	const inn = stamp('INOCENTE', 4.6, 1.2, CC.green); inn.position.set(-3.2, -1.35, .5); dn.add(inn);

	// ── 5 · estatística ──
	const sa = mkSet('stat');
	const figs = Array.from({ length: 10 }, (_, i) => { const g = silhouette(1.6, '#2A3840'); g.position.set((i - 4.5) * 1.35, -1.55, 0); sa.add(g); return g; });
	const big = textPlane('7 em cada 10', 9, 1.8, { color: CC.bone, weight: '700' }); big.position.set(0, 1.95, 0); sa.add(big);
	const sub = textPlane(['erro de testemunha ocular nas condenações', 'revertidas por DNA · Innocence Project (EUA)'], 12, 1.6, { color: CC.amb, font: MONO, weight: '400' }); sub.position.set(0, .55, 0); sa.add(sub);

	// ── 6 · quadro de provas ──
	const bo = mkSet('board');
	const cork = wall(24, 14, (g, w, h) => { g.fillStyle = '#1E1812'; g.fillRect(0, 0, w, h); const r = mulberry32(8); for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(${90 + r() * 60},${60 + r() * 40},30,.2)`; g.fillRect(r() * w, r() * h, 3 + r() * 5, 3 + r() * 5); } });
	cork.position.z = -1; bo.add(cork);
	const card = (label, x, y, rot, face = -1) => { const g = new THREE.Group(), c = textPlane(label, 2.6, 3.1, { bg: CC.bone, color: CC.ink, font: MONO, weight: '400' }); c.material.transparent = false; g.add(c); if (face >= 0) { const f = faceCut(face); f.position.set(0, .35, .02); g.add(f); } const pin = new THREE.Mesh(new THREE.SphereGeometry(.1, 10, 8), new THREE.MeshBasicMaterial({ color: CC.red })); pin.position.set(0, 1.4, .06); g.add(pin); g.position.set(x, y, 0); g.rotation.z = rot; bo.add(g); g.userData.pin = new THREE.Vector3(x - Math.sin(rot) * 1.4, y + Math.cos(rot) * 1.4, .1); return g; };
	function faceCut(v) { return new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), new THREE.MeshBasicMaterial({ map: canvasTex(200, 200, (g, w, h) => { g.fillStyle = '#6E5B45'; g.fillRect(0, 0, w, h); g.fillStyle = ['#C9A27E', '#B98F6E', '#D8B28D'][v]; g.beginPath(); g.ellipse(w / 2, h * .52, w * (.26 + v * .03), h * (.34 - v * .02), 0, 0, 7); g.fill(); g.fillStyle = '#2B2018'; g.beginPath(); g.ellipse(w / 2, h * (.3 - v * .02), w * .28, h * (.12 + v * .05), 0, Math.PI, 0); g.fill(); g.fillRect(w * (.34 + v * .02), h * .48, w * .08, h * .04); g.fillRect(w * (.58 - v * .02), h * .48, w * .08, h * .04); g.fillRect(w * .44, h * (.66 + v * .02), w * (.12 + v * .02), h * .03); }) })); }
	const cards = [card('TESTEMUNHA', -6.5, 1.8, -.06, 0), card('SUSPEITO Nº 3', -2.2, -.9, .05, 1), card('DNA', 2.4, 2.2, -.04), card('VEREDITO', 6.4, -.6, .06)];
	const rosto = card('O ROSTO', 0, 2.3, .02, 0); rosto.position.z = .05;
	const faces = [0, 1, 2].map(v => { const f = faceCut(v); f.position.set(0, .35, .03); rosto.add(f); return f; });
	const sp = [rosto, ...cards].map(c => c.userData.pin), order = [1, 0, 4, 2, 3, 0];
	const strpos = new Float32Array(order.length * 3), sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(strpos, 3));
	const string = new THREE.Line(sg, new THREE.LineBasicMaterial({ color: CC.red })); string.frustumCulled = false; bo.add(string);
	const recast = tw('reescrito');

	// ── 7 · cartão final ──
	const fi = mkSet('final');
	const FT = [['A MEMÓRIA NÃO MENTE.', tw('condena') - .5], ['ELA REESCREVE.', tw('condena') + .55]];
	const typed = FT.map(([t, ts], i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(12.5, 2.32), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false })); m.position.set(0, 1.1 - i * 1.7, 0); m.userData = { t, ts, n: -1, i }; fi.add(m); return m; });
	const note = textPlane('CASO ILUSTRATIVO · baseado em padrões reais de erro de identificação', 15, .7, { color: CC.bone, font: MONO, weight: '400', px: 90 }); note.position.set(0, -2.6, 0); fi.add(note);
	function typeTex(m, n) { const { t, i } = m.userData; m.material.map = canvasTex(1400, 260, g => { g.font = `700 140px ${COND}`; const full = g.measureText(t + '▌').width, sz = Math.floor(140 * Math.min(1, 1240 / full)); g.font = `700 ${sz}px ${COND}`; const fw = g.measureText(t + '▌').width; g.fillStyle = i ? CC.red : CC.bone; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText(t.slice(0, n) + (n < t.length ? '▌' : ''), (1400 - fw) / 2, 130); }); m.material.needsUpdate = true; }

	const sets = [['street', t0], ['witness', tw('jura') - .1], ['lineup', tw('fila') - .1], ['dna', tw('anos') - .2], ['stat', tw('estados') - .3], ['board', tw('jurava', 1) - .3], ['final', tw('condena') - 1.2]];
	const setAt = T => { let k = 0; sets.forEach(([, t], i) => { if (T >= t) k = i; }); return k; };
	const flashes = sets.slice(1).map(s => s[1]);
	const out = {
		scene, camera: cam, flashes, setAt, sets,
		flash: T => flashes.reduce((m, t) => Math.max(m, T >= t && T < t + .22 ? 1 - (T - t) / .22 : 0), 0),
		tick(T) {
			const k = setAt(T), name = sets[k][0], tl = T - sets[k][1], tt = (T - t0) / (t1 - t0);
			for (const key in S) S[key].visible = key === name;
			rain.tick(T); rain.visible = name !== 'dna' && name !== 'lineup';
			scene.background.set(name === 'dna' ? '#081418' : name === 'final' ? '#000' : CC.ink);
			const fl = Math.sin(T * 9.4), flp = Math.sin(T * 4.7); rim.intensity = 30 + 25 * Math.max(0, flp); rim2.intensity = 30 + 25 * Math.max(0, -flp);
			if (name === 'street') {
				cam.position.set(Math.sin(tl * .3) * 1.2, .2 + tl * .06, 9 - tl * .25); cam.lookAt(0, .6, 0);
				redG.material.opacity = bluG.material.opacity = 1; redG.scale.setScalar(.8 + .5 * Math.max(0, flp)); bluG.scale.setScalar(.8 + .5 * Math.max(0, -flp));
				lampG.scale.setScalar(1 + .04 * Math.sin(T * 17) * (T % 3 > 2.6 ? 1 : 0)); chalk.material.opacity = smooth(T, tw('crime'), tw('crime') + 1);
				tapes.forEach((m, i) => { m.position.y = -.5 + i * .5 + Math.sin(T * 1.4 + i) * .03; m.material.map.offset.x = T * .02; });
			} else if (name === 'witness') {
				cam.position.set(-1.4 + tl * .05, 0 + tl * .02, 8 - tl * .45); cam.lookAt(-.6, -.5, 0);
				const sc = 1 + .004 * Math.sin(T * 1.2); wsil.scale.set(1.5 * sc, sc, 1); wsil.position.y = -3.1; ww.scale.setScalar(1);
				const dis = smooth(T, tw('nunca', 1) + .3, tw('rosto', 1) + 1.2);
				for (let i = 0; i < FN; i++) { const p = fpts[i]; fpos.set([p[0] + dis * (p[3] * 2.4) + Math.sin(T * 2 + p[4]) * .02, p[1] + dis * Math.sin(p[4]) * 1.2 + Math.cos(T * 1.5 + p[4]) * .02, p[2] + dis * p[3]], i * 3); }
				fg.attributes.position.needsUpdate = true; fcloud.material.opacity = (1 - dis * .7) * pop(T, tw('jura') + .2, .6);
			} else if (name === 'lineup') {
				const pt = tw('aponta'), cd = tw('condenado');
				cam.position.set(lerp(-3, 1.5, seg(tl, 0, 9)), .2, 10.5 - tl * .08); cam.lookAt(0, .2, 0);
				const px_ = sils[2].position.x; spot.position.x = lerp(-4.4, 0, smooth(T, pt - 1.6, pt)); ring.position.x = spot.position.x; show(ring, pop(T, pt, .3)); ring.rotation.z = T * .5;
				slam(cond, T, cd + .1); sils.forEach((s, i) => s.position.y = -2 + (i === 2 && T > cd ? -.03 : 0));
			} else if (name === 'dna') {
				cam.position.set(Math.sin(tl * .25) * .8, .2, 10 - tl * .1); cam.lookAt(0, 0, 0); helix.rotation.y = T * .7;
				show(yrs, pop(T, sets[3][1] + .1, .4)); show(lab, pop(T, tw('exame') - .1, .4)); slam(inn, T, tw('inocente') - .35); dg.scale.setScalar(1 + .08 * Math.sin(T * 2));
			} else if (name === 'stat') {
				cam.position.set(Math.sin(tl * .3) * .5, .4, 11 - tl * .1); cam.lookAt(0, 0, 0);
				const c7 = tw('sete');
				figs.forEach((f, i) => { const on = i < 7 && T > c7 + i * .12; f.children.forEach(m => m.material = on ? hot : cold); f.position.y = -1.55 + (on ? .08 * Math.sin((T - c7) * 4 + i) : 0); });
				show(big, pop(T, c7 - .3, .5)); show(sub, pop(T, tw('erro') - .1, .5));
			} else if (name === 'board') {
				cam.position.set(Math.sin(tl * .3) * .6, .2 + tl * .02, 15.5 - tl * .12); cam.lookAt(0, .4, 0);
				const reveal = ease.cubicInOut(seg(tl, .5, 3.2)), n = order.length;
				for (let i = 0; i < n; i++) { const a = sp[order[Math.min(n - 1, Math.floor(reveal * (n - 1)))]], p = sp[order[i]]; const kk = Math.min(1, Math.max(0, reveal * (n - 1) - (i - 1))); const prev = sp[order[Math.max(0, i - 1)]]; const q = i === 0 ? p : prev.clone().lerp(p, i <= reveal * (n - 1) + 1 ? Math.min(1, reveal * (n - 1) - (i - 1)) : 0); strpos.set([q.x, q.y, q.z], i * 3); }
				sg.attributes.position.needsUpdate = true;
				const fv = T < recast ? 0 : 1 + Math.floor((T - recast) / .6) % 2; faces.forEach((f, i) => f.visible = i === fv);
				rosto.rotation.z = .02 + (T > recast ? Math.sin(T * 25) * .008 : 0); rosto.scale.setScalar(1 + .12 * smooth(T, tw('jurava', 1), tw('jurava', 1) + 2));
				cards.forEach((c, i) => c.position.y += Math.sin(T * 1.1 + i) * .0015);
			} else {
				cam.position.set(0, 0, 14 - tl * .04); cam.lookAt(0, 0, 0);
				typed.forEach(m => { const { t, ts } = m.userData, n = clamp(Math.floor((T - ts) * 18), 0, t.length); if (n !== m.userData.n) { m.userData.n = n; typeTex(m, n); } m.visible = T >= ts; });
				show(note, pop(T, tw('condena') + 1.6, .5));
			}
		},
	};
	const cold = new THREE.MeshStandardMaterial({ color: '#2A3840', roughness: .9 }), hot = new THREE.MeshStandardMaterial({ color: '#B3141F', roughness: .6, emissive: '#5A0A10' });
	return out;
}
