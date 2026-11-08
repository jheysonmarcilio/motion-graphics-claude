// CAPÍTULO IV — O arquivo: como o cérebro data uma lembrança (05:22 – 06:24)
import * as THREE from 'three';
import { C, col, seg, eo, sm, inOut, lerp, ease, pulse, shots, dips, textPlane, op, uiLayer, uiMap, cue, texMat, glow, rimMat, figure, canvasTex, dust, mulberry32 } from '../lib.js';
import { iconTex, stampTex } from '../draw.js';
import { drawerWall, folder3D, lightPen, scribble } from '../worlds.js';
import { fitFont } from '../lib.js';
import { spiralPlane } from './03-consultorio.js';

const S = 322;
function labelPlane(text) {
	const tex = canvasTex(520, 140, (g, w, h) => { g.fillStyle = '#f4efe2'; g.fillRect(0, 0, w, h); g.strokeStyle = '#b9ad90'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6); g.fillStyle = '#2a2638'; fitFont(g, text, w - 70, { size: 64, track: .06 }); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 4); });
	const m = new THREE.Mesh(new THREE.PlaneGeometry(.78, .21), new THREE.MeshStandardMaterial({ map: tex, roughness: .8, side: THREE.DoubleSide }));
	m.geometry.translate(0, -.105, 0); return m;
}
// estilhaços de um plano (triângulos com UV)
function shards(tex, w, h, nx, ny, rng) {
	const g = new THREE.Group(), list = [];
	for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) for (let k = 0; k < 2; k++) {
		const x0 = i / nx, x1 = (i + 1) / nx, y0 = j / ny, y1 = (j + 1) / ny;
		const tri = k ? [[x0, y0], [x1, y0], [x1, y1]] : [[x0, y0], [x1, y1], [x0, y1]];
		const cx = tri.reduce((a, p) => a + p[0], 0) / 3, cy = tri.reduce((a, p) => a + p[1], 0) / 3;
		const geo = new THREE.BufferGeometry();
		geo.setAttribute('position', new THREE.Float32BufferAttribute(tri.flatMap(([u, v]) => [(u - cx) * w, (v - cy) * h, 0]), 3));
		geo.setAttribute('uv', new THREE.Float32BufferAttribute(tri.flat(), 2));
		const mat = texMat(tex, { additive: true, side: THREE.DoubleSide });
		const m = new THREE.Mesh(geo, mat); g.add(m);
		const home = new THREE.Vector3((cx - .5) * w, (cy - .5) * h, 0);
		const dir = new THREE.Vector3((cx - .5) * 2 + (rng() - .5), (cy - .5) * 2 + (rng() - .5), rng() * 1.5 + .3).normalize().multiplyScalar(1.2 + rng() * 1.8);
		list.push({ m, home, dir, rot: new THREE.Vector3(rng() * 6 - 3, rng() * 6 - 3, rng() * 6 - 3), tint: rng() < .28, off: new THREE.Vector3((rng() - .5) * .12, (rng() - .5) * .12, 0), spin: (rng() - .5) * .6 });
	}
	return { g, list };
}

export default {
	id: 'arquivo', dur: 62,
	async init(ctx) {
		const scene = new THREE.Scene();
		scene.background = new THREE.Color('#07060f');
		scene.fog = new THREE.FogExp2('#07060f', .05);
		const camera = new THREE.PerspectiveCamera(35, ctx.W / ctx.H, .05, 200);
		const rng = ctx.rng(707);
		const wall = drawerWall({ cols: 200, rows: 9, rng, color: '#24223a' }); wall.g.position.set(75, 0, -3.4); scene.add(wall.g); wall.labels(.8);
		const floor = new THREE.Mesh(new THREE.PlaneGeometry(220, 20), new THREE.MeshStandardMaterial({ color: '#0f0d1a', metalness: .7, roughness: .35 })); floor.rotation.x = -Math.PI / 2; floor.position.x = 75; scene.add(floor);
		scene.add(new THREE.HemisphereLight('#6b5ccc', '#050409', .8));
		const kl = new THREE.DirectionalLight('#cfe9ff', .9); kl.position.set(3, 6, 6); scene.add(kl);
		const ds = dust(rng, 900, [180, 5, 6], [75, 2, -.5], { color: '#cfc4ff', size: 1, opacity: .35 }); scene.add(ds);
		const card4 = textPlane('IV · O ARQUIVO', { size: 110, height: .6, color: '#C9B8FF', glow: 24 }); card4.position.set(0, 3.5, -2.75); scene.add(card4);

		// Z0: vídeo que trinca e se remonta
		const vtex = iconTex('video', C.sinapse, 512, 14);
		const vid = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), texMat(vtex, { additive: true })); vid.position.set(0, 1.6, 0); scene.add(vid);
		const SHD = shards(vtex, 1.8, 1.8, 6, 6, rng); SHD.g.position.set(0, 1.6, 0); scene.add(SHD.g);
		const flash = glow(C.luz, 3, 0); flash.position.set(0, 1.6, .1); scene.add(flash);

		// Z30: Bartlett — a frase passa de boca em boca
		const Z30 = new THREE.Group(); Z30.position.x = 30; scene.add(Z30);
		const bfig = [-2.4, 0, 2.4].map(x => { const f = figure(rimMat('#B9A6FF', { fill: .08, power: 1.7 }), { h: 1.6 }); f.position.set(x, 0, 0); Z30.add(f); return f; });
		const phr = ['remavam uma CANOA', 'remavam um BARCO', 'dirigiam um CARRO'].map((p, i) => { const m = textPlane(p, { size: 80, weight: 300, height: .3, color: i === 0 ? C.luz : '#FFB070', track: .05 }); m.position.set((i - 1) * 2.4, 2.05, 0); Z30.add(m); return m; });

		// Z60: duas pastas com etiquetas
		const Z60 = new THREE.Group(); Z60.position.x = 60; scene.add(Z60);
		const fA = folder3D('', '#c9b78f'), fB = folder3D('', '#bfae86'); fA.position.set(-.95, 1.35, 0); fB.position.set(.95, 1.35, 0); Z60.add(fA, fB);
		const lA = labelPlane('EU VIVI'), lB = labelPlane('ME CONTARAM');
		const lAg = new THREE.Group(), lBg = new THREE.Group(); lAg.add(lA); lBg.add(lB); Z60.add(lAg, lBg);
		const st2 = [fA, fB].map(f => { const s = new THREE.Mesh(new THREE.PlaneGeometry(.9, .34), texMat(stampTex('REAL', C.sinapse, 640, 240))); s.position.set(f.position.x + .15, f.position.y - .2, .03); s.rotation.z = .14; Z60.add(s); return s; });
		const z60L = new THREE.SpotLight('#fff', 10, 8, .6, .6, 1); z60L.position.set(0, 4, 4); z60L.target = fA; Z60.add(z60L);

		// Z90: scanner + 4 barras
		const Z90 = new THREE.Group(); Z90.position.x = 90; scene.add(Z90);
		const sf = folder3D('', '#c9b78f', true); sf.position.set(0, 1.3, 0); Z90.add(sf);
		const sb = folder3D('BALÃO', '#cdb98b'); sb.position.set(0, 1.3, .05); Z90.add(sb);
		const beam = new THREE.Mesh(new THREE.PlaneGeometry(.06, 2.2), new THREE.MeshBasicMaterial({ color: C.sinapse, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false })); beam.position.set(0, 1.3, .3); Z90.add(beam);
		const beamG = glow(C.sinapse, 1.4, .5); Z90.add(beamG);
		const bars = [0, 1, 2, 3].map(i => { const bg = new THREE.Mesh(new THREE.PlaneGeometry(.22, 1.6), new THREE.MeshBasicMaterial({ color: '#221e3c' })); const fg = new THREE.Mesh(new THREE.PlaneGeometry(.22, 1.6), new THREE.MeshBasicMaterial({ color: ['#3EE6FF', '#8B6CFF', '#FF5C7A', '#EEEAFF'][i], transparent: true })); fg.geometry.translate(0, .8, 0); bg.position.set(1.6 + i * .38, 1.3, 0); fg.position.set(1.6 + i * .38, .5, .01); Z90.add(bg, fg); return fg; });
		const thr = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .015), new THREE.MeshBasicMaterial({ color: C.luz })); thr.position.set(2.17, .5 + 1.6 * .8, .02); Z90.add(thr);
		const stReal = new THREE.Mesh(new THREE.PlaneGeometry(.9, .34), texMat(stampTex('REAL', C.sinapse, 640, 240))); stReal.position.set(.1, 1.15, .06); stReal.rotation.z = .12; Z90.add(stReal);
		const z90L = new THREE.PointLight('#e0d8ff', 6, 6, 1.5); z90L.position.set(0, 2, 2.5); Z90.add(z90L);

		// Z120: termo
		const Z120 = new THREE.Group(); Z120.position.x = 120; scene.add(Z120);
		const term = textPlane('MONITORAMENTO\nDA FONTE', { size: 120, height: 1.0, color: C.luz, glow: 18, lineH: 1.1 }); term.position.set(0, 1.7, 0); Z120.add(term);
		const orb = [0, 1, 2, 3].map(i => { const m = new THREE.Mesh(new THREE.PlaneGeometry(.12, .5), new THREE.MeshBasicMaterial({ color: ['#3EE6FF', '#8B6CFF', '#FF5C7A', '#EEEAFF'][i], transparent: true, opacity: .9 })); Z120.add(m); return m; });

		// Z150: a caneta de luz escreve em várias pastas
		const Z150 = new THREE.Group(); Z150.position.x = 150; scene.add(Z150);
		const pf = [0, 1, 2, 3].map(i => { const f = folder3D('', ['#c9b78f', '#bfae86', '#cdb98b', '#c4b48a'][i]); f.scale.setScalar(.7); f.position.set((i - 1.5) * 1.25, 1.2 + (i % 2) * .25, 0); Z150.add(f); const s = scribble(mulberry32(30 + i), .8, 4, .4); s.position.set(f.position.x, f.position.y - .05, .02); Z150.add(s); return { f, s }; });
		const pen = lightPen(); Z150.add(pen); pen.rotation.z = -.5;
		const spir = spiralPlane(9, 5); spir.position.set(0, 2, -3.2); Z150.add(spir);
		const z150L = new THREE.PointLight('#d8ccff', 5, 7, 1.5); z150L.position.set(0, 2.5, 3); Z150.add(z150L);

		const ui = uiLayer(`
			<div data-k="bart" class="lbl v" style="left:120px;top:120px">Bartlett · 1932</div>
			<div data-k="ill" class="ill" style="right:80px;bottom:44px">palavras ilustrativas</div>
			<div data-k="rem" class="q" style="left:120px;top:150px">lembrar = remontar</div>
			<div data-k="b1" class="sm" style="left:1170px;top:850px;color:#3EE6FF">imagem</div>
			<div data-k="b2" class="sm" style="left:1290px;top:850px;color:#B9A6FF">som</div>
			<div data-k="b3" class="sm" style="left:1380px;top:850px;color:#FF5C7A">emoção</div>
			<div data-k="b4" class="sm" style="left:1505px;top:850px;color:#EEEAFF">detalhe</div>
			<div data-k="mj" class="lbl v" style="left:0;right:0;text-align:center;top:820px">Marcia Johnson</div>
			<div data-k="s1" class="src">Johnson, Hashtroudi &amp; Lindsay, 1993 · Psychological Bulletin</div>
			<div data-k="im" class="lbl a" style="left:120px;top:120px">imaginação ×1</div>
			<div data-k="s2" class="src">Garry et al., 1996 · “inflação da imaginação”</div>
			<div data-k="rf" class="lbl v" style="left:0;right:0;text-align:center;top:930px">relaxamento · foco · “veja a cena”</div>`);
		const U = uiMap(ui);

		const SH = [
			{ a: 322, b: 328, p0: [0, 1.7, 5.6], p1: [0, 1.65, 4.4], l0: [0, 1.6, 0], l1: [0, 1.6, 0] },
			{ a: 328, b: 336, p0: [27, 1.65, 5.8], p1: [33, 1.6, 5.5], l0: [27.8, 1.5, 0], l1: [32.2, 1.5, 0] },
			{ a: 336, b: 342, fn: (cam, k, t) => { const a = lerp(-.35, .35, k); cam.position.set(Math.sin(a) * 4.6, 1.7, Math.cos(a) * 4.6); cam.up.set(0, 1, 0); cam.lookAt(0, 1.6, 0); } },
			{ a: 342, b: 350, p0: [60, 1.5, 4.3], p1: [60, 1.45, 3.3], l0: [60, 1.3, 0], l1: [60, 1.3, 0] },
			{ a: 350, b: 358, p0: [90.9, .95, 4.8], p1: [90.9, 1.75, 4.6], l0: [90.9, 1.2, 0], l1: [90.9, 1.4, 0] },
			{ a: 358, b: 363, p0: [118.6, 1.65, 5.2], p1: [121.4, 1.65, 5.0], l0: [120, 1.65, 0], l1: [120, 1.65, 0] },
			{ a: 363, b: 371, p0: [90.9, 1.45, 5.6], p1: [90.9, 1.45, 4.5], l0: [90.9, 1.3, 0], l1: [90.9, 1.3, 0] },
			{ a: 371, b: 378, p0: [150, 1.0, 5.2], p1: [150, 2.7, 5.8], l0: [150, 1.3, -1], l1: [150, 1.7, -1] },
			{ a: 378, b: 384, p0: [60, 1.45, 3.1], p1: [60, 1.6, 5.4], l0: [60, 1.3, 0], l1: [60, 1.35, 0] },
		];
		const CUTS = [328, 336, 342, 350, 358, 363, 371, 378];
		const v = new THREE.Vector3();

		return {
			scene, camera, ui, bloom: { strength: .45, radius: .5, threshold: .72 },
			fadeFn: lt => dips(lt + S, CUTS, .18) * .95,
			update(lt) {
				const t = lt + S;
				shots(camera, t, SH); ds.tick(t);
				op(card4, inOut(t, 322.4, 323.6, 326.6, 327.6));
				// vídeo trinca (325.2) e se remonta (336–339)
				op(vid, t < 325.2 ? eo(t, 322.3, 323.3) : 0); vid.visible = t < 325.2;
				vid.scale.setScalar(1 + pulse(t, 325, .2) * .05);
				flash.material.opacity = pulse(t, 325.2, .25) * .9;
				const burst = ease.expoOut(seg(t, 325.2, 327.5)), back = ease.cubicInOut(seg(t, 336.4, 339.6));
				SHD.g.visible = t > 325.2 && (t < 328 || t > 336);
				SHD.list.forEach((s, i) => {
					const k = (t < 336 ? burst : 1 - back);
					v.copy(s.home).addScaledVector(s.dir, k);
					if (t > 336) v.add(s.tint ? s.off : new THREE.Vector3());
					s.m.position.copy(v);
					s.m.rotation.set(s.rot.x * k, s.rot.y * k, s.rot.z * k + (t > 336 && s.tint ? s.spin * back : 0));
					const u = s.m.material.uniforms; u.uOpacity.value = t < 336 ? 1 - seg(t, 326.5, 328) * .6 : .45 + .55 * back;
					u.uColor.value.copy(col('#ffffff')).lerp(col(C.emocao), s.tint && t > 336 ? back : 0);
				});
				cue(U.rem, t, 338.2, 341.8);
				// Bartlett
				bfig.forEach((f, i) => f.set({ t: t + i, breathe: 1 }));
				phr.forEach((p, i) => { const a = 329 + i * 2.2; op(p, inOut(t, a, a + .6, a + 2.0, a + 2.4) * (i === 2 ? 1 : 1)); p.position.y = 2.05 + Math.sin(t * 1.5 + i) * .03; });
				op(phr[2], inOut(t, 333.4, 334, 335.4, 336));
				cue(U.bart, t, 328.6, 335.8); cue(U.ill, t, 330, 335.8);
				// Z60 etiquetas caem / depois os dois carimbos
				const peelA = seg(t, 345.6, 347.8), peelB = seg(t, 346.2, 348.4);
				[[lAg, fA, peelA], [lBg, fB, peelB]].forEach(([g, f, p]) => {
					g.position.set(f.position.x - .2, f.position.y + .32 - ease.expoIn(p) * 3, .02 + p * .3);
					g.rotation.set(ease.cubicInOut(Math.min(1, p * 2)) * -1.2, 0, p * .6); g.visible = p < .99;
				});
				[fA, fB].forEach((f, i) => { f.rotation.y = Math.sin(t * .5 + i) * .05; });
				st2.forEach((s, i) => { const a = 380.4 + i * .6; s.visible = t > a; s.scale.setScalar(lerp(1.7, 1, eo(t, a, a + .3))); op(s, t > a ? .95 : 0); });
				// Z90 scanner
				const pass1 = t >= 350 && t < 363;
				sf.visible = pass1; sb.visible = !pass1 && t >= 363;
				let bx;
				if (pass1) bx = lerp(-1.1, 1.1, sm(t, 351, 354.5));
				else { const p = seg(t, 364, 370.4) * 3; const pi = Math.min(2, Math.floor(p)); bx = lerp(-1.1, 1.1, ease.sineInOut(p - pi)); }
				beam.position.x = bx; beamG.position.set(bx, 1.3, .32); beam.material.opacity = .7 + .3 * Math.sin(t * 20);
				const lv = [.92, .85, .88, .95];
				bars.forEach((b, i) => {
					let k;
					if (pass1) k = eo(t, 351.4 + i * .5, 353.6 + i * .5) * lv[i];
					else { const steps = [.28, .58, .9]; const p = seg(t, 364, 370.4) * 3; const pi = Math.min(2, Math.floor(p)); k = lerp(pi ? steps[pi - 1] : 0, steps[pi], eo(p - pi, 0, .7)) * (lv[i] / .9) * .98; }
					b.scale.y = Math.max(.001, k);
				});
				thr.material.opacity = 1;
				stReal.visible = pass1 && t > 355.8; stReal.scale.setScalar(lerp(1.7, 1, eo(t, 355.8, 356.1)));
				cue(U.b1, t, 351, 357.8); cue(U.b2, t, 351.2, 357.8); cue(U.b3, t, 351.4, 357.8); cue(U.b4, t, 351.6, 357.8);
				['b1', 'b2', 'b3', 'b4'].forEach(k => { if (t > 363 && t < 371) cue(U[k], t, 363.4, 370.8); });
				U.im.textContent = 'imaginação ×' + (1 + Math.min(2, Math.floor(seg(t, 364, 370.4) * 3)));
				cue(U.im, t, 363.6, 370.8); cue(U.s2, t, 364.4, 370.8);
				// termo
				op(term, inOut(t, 358.3, 359.3, 362.4, 363));
				orb.forEach((o, i) => { const a = t * .8 + i * Math.PI / 2; o.position.set(Math.cos(a) * 2.6, 1.7 + Math.sin(a * 2) * .3, Math.sin(a) * .8); });
				cue(U.mj, t, 358.8, 362.8); cue(U.s1, t, 359, 362.8);
				// caneta de luz
				const pk = seg(t, 371.4, 377.6) * 4, pi = Math.min(3, Math.floor(pk)), pr = pk - pi;
				pf.forEach((p, i) => { const r = i < pi ? 1 : i === pi ? pr : 0; const g = p.s.geometry, n = g.attributes.position.count; g.setDrawRange(0, Math.floor(n * r)); p.s.visible = r > 0; });
				const cur = pf[pi].s, cn = cur.geometry.attributes.position.count, ci = Math.min(cn - 1, Math.floor(cn * pr));
				const cp = cur.pts[ci]; pen.position.set(cur.position.x + cp.x, cur.position.y + cp.y, .06); pen.on(1);
				pf.forEach((p, i) => { p.f.position.z = Math.max(0, Math.sin(t * 3 + i * 1.7)) * .15; });
				const act = t > 371 && t < 378;
				for (let c = 177; c <= 189; c++) for (let r = 1; r <= 6; r++) wall.open(r * 200 + c, act ? Math.max(0, Math.sin(t * 2.4 + c * 1.3 + r * 2.1)) * .32 * sm(t, 371.2, 372.4) : 0);
				spir.material.uniforms.uTime.value = t; spir.material.uniforms.uOpacity.value = sm(t, 372, 374) * .35;
				cue(U.rf, t, 372, 377.8);
			},
		};
	},
};
