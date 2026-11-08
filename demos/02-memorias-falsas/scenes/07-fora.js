// CAPÍTULO V — Fora do laboratório (06:24 – 07:14) · tom sóbrio, tudo abstrato
import * as THREE from 'three';
import { C, col, seg, eo, sm, inOut, lerp, ease, pulse, shots, dips, textPlane, op, uiLayer, uiMap, cue, lineMat, polyline, segs, edges, setLineOpacity, glow, lightCone, dust, mulberry32 } from '../lib.js';
import { docTex, photoTex } from '../draw.js';
import { drawerWall, folder3D, lightPen, scribble, photoMat } from '../worlds.js';
import { spiralPlane } from './03-consultorio.js';
import { dotFloor } from './02-laboratorio.js';

const S = 384;
// metade da foto rasgada (borda irregular), com UV da foto inteira
function tornHalf(tex, w, h, left, rng) {
	const edge = []; for (let i = 0; i <= 24; i++) { const y = h / 2 - i * h / 24; edge.push([(rng() - .5) * .08 + Math.sin(i * 1.3) * .03, y]); }
	const sh = new THREE.Shape();
	if (left) { sh.moveTo(-w / 2, h / 2); edge.forEach(([x, y]) => sh.lineTo(x, y)); sh.lineTo(-w / 2, -h / 2); }
	else { sh.moveTo(w / 2, h / 2); edge.forEach(([x, y]) => sh.lineTo(x, y)); sh.lineTo(w / 2, -h / 2); }
	const g = new THREE.ShapeGeometry(sh);
	const p = g.attributes.position, uv = g.attributes.uv;
	for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + .5, p.getY(i) / h + .5);
	return { geo: g, edge };
}

export default {
	id: 'fora', dur: 50,
	async init(ctx) {
		const scene = new THREE.Scene();
		scene.background = new THREE.Color('#08070f');
		scene.fog = new THREE.Fog('#08070f', 14, 60);
		const camera = new THREE.PerspectiveCamera(35, ctx.W / ctx.H, .05, 200);
		const rng = ctx.rng(808);
		const Ld = lineMat(C.sinapse, .45), Lw = lineMat('#9a94c8', .5);

		// ── Z0: paredes de linha caem → cidade ──
		const Z0 = new THREE.Group(); scene.add(Z0);
		Z0.add(dotFloor(-16, 16, -30, 8, .7, C.sinapse, .25));
		const walls = [];
		const mkWall = (w, h) => { const g = new THREE.Group(); const l = []; for (let i = 0; i <= w; i++) l.push([i - w / 2, 0, 0, i - w / 2, h, 0]); for (let j = 0; j <= h; j++) l.push([-w / 2, j, 0, w / 2, j, 0]); g.add(segs(l, lineMat(C.sinapse, .5))); return g; };
		[[0, -3, 0], [-3, 0, Math.PI / 2], [3, 0, -Math.PI / 2]].forEach(([x, z, ry]) => { const p = new THREE.Group(); p.position.set(x, 0, z); p.rotation.y = ry; const w = mkWall(6, 4); p.add(w); Z0.add(p); walls.push(p); });
		const city = new THREE.Group(); Z0.add(city);
		const winMat = new THREE.MeshBasicMaterial({ color: '#ffcf8a', transparent: true, opacity: .9 });
		const winGeo = new THREE.PlaneGeometry(.35, .5);
		let heroWin;
		for (let i = 0; i < 18; i++) {
			const w = 2 + rng() * 2.5, h = 4 + rng() * 10, x = -22 + i * 2.6 + rng(), z = -20 - rng() * 6;
			city.add(edges(new THREE.BoxGeometry(w, h, 2).translate(x, h / 2, z), Lw));
			for (let k = 0; k < 10; k++) if (rng() < .5) { const m = new THREE.Mesh(winGeo, winMat); m.position.set(x - w / 2 + .4 + rng() * (w - .8), 1 + rng() * (h - 2), z + 1.01 + k * .015); city.add(m); if (!heroWin && Math.abs(m.position.x - 2.4) < 1.5 && m.position.y > 3 && m.position.y < 7) heroWin = m; }
		}
		if (!heroWin) { heroWin = new THREE.Mesh(winGeo, winMat); heroWin.position.set(2.4, 4.5, -19); city.add(heroWin); }
		const winGlow = glow('#ffcf8a', 2, .5); winGlow.position.copy(heroWin.position); city.add(winGlow);
		const card5 = textPlane('V · FORA DO LABORATÓRIO', { size: 110, height: .55, color: C.luz, glow: 22 }); card5.position.set(0, 3.2, -6); Z0.add(card5);

		// ── Z1: arquivo por trás da janela ──
		const Z1 = new THREE.Group(); Z1.position.x = 40; scene.add(Z1);
		const dw = drawerWall({ cols: 12, rows: 8, rng }); dw.g.position.set(0, 0, -2.4); Z1.add(dw.g); dw.labels(.7);
		Z1.add(new THREE.HemisphereLight('#7a6acc', '#050409', .9));
		const k1 = new THREE.PointLight('#ffd0a0', 6, 8, 1.4); k1.position.set(-1.5, 3, 1.5); Z1.add(k1);
		const fe = folder3D('', '#c9b78f'); fe.position.set(.2, 1.4, 0); Z1.add(fe);
		const sc = scribble(mulberry32(91), 1.1, 6, .7); sc.position.set(.2, 1.35, .02); sc.material.color.set('#f2edff'); Z1.add(sc);
		const pen = lightPen(); pen.rotation.z = -.5; Z1.add(pen);
		const rec = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.64), new THREE.MeshStandardMaterial({ map: docTex('REGISTRO', 'documento · datas · laudo', 14), roughness: .9, transparent: true })); Z1.add(rec);
		const xLine = new THREE.Mesh(new THREE.PlaneGeometry(2.2, .035), new THREE.MeshBasicMaterial({ color: C.emocao })); xLine.geometry.translate(1.1, 0, 0); xLine.position.set(-.9, 1.9, .06); xLine.rotation.z = -.42; Z1.add(xLine);

		// ── Z2: foto de família rasgando + tribunal ──
		const Z2 = new THREE.Group(); Z2.position.x = 80; scene.add(Z2);
		const ftex = photoTex('familia', 41);
		const hl = tornHalf(ftex, 2.4, 1.8, true, ctx.rng(42)), hr = tornHalf(ftex, 2.4, 1.8, false, ctx.rng(42));
		const mL = new THREE.Mesh(hl.geo, photoMat(ftex, { side: THREE.DoubleSide })), mR = new THREE.Mesh(hr.geo, photoMat(ftex, { side: THREE.DoubleSide }));
		[mL, mR].forEach(m => { m.position.set(0, 1.5, 0); Z2.add(m); });
		const court = new THREE.Group(); court.position.set(0, 0, -5); Z2.add(court);
		const cm = lineMat('#8f88c0', .55);
		court.add(polyline([[-4, 4.2, 0], [0, 5.6, 0], [4, 4.2, 0], [-4, 4.2, 0]], cm), polyline([[-4.2, 4, 0], [4.2, 4, 0]], cm));
		for (let i = 0; i < 7; i++) { const x = -3.3 + i * 1.1; court.add(polyline([[x - .18, .6, 0], [x - .18, 4, 0]], cm), polyline([[x + .18, .6, 0], [x + .18, 4, 0]], cm)); }
		for (let i = 0; i < 3; i++) court.add(polyline([[-4.6 - i * .3, .6 - i * .2, 0], [4.6 + i * .3, .6 - i * .2, 0]], cm));
		const gavel = new THREE.Group(); Z2.add(gavel); gavel.position.set(2.4, 2.4, -1.5);
		gavel.add(edges(new THREE.CylinderGeometry(.18, .18, .6, 12).rotateZ(Math.PI / 2), lineMat(C.luz, .7)), edges(new THREE.CylinderGeometry(.04, .04, 1.1, 8).translate(0, -.55, 0), lineMat(C.luz, .7)));
		const war = textPlane('GUERRA DAS MEMÓRIAS', { size: 110, height: .4, color: C.luz, glow: 20 }); war.position.set(0, 3.15, .2); Z2.add(war);
		Z2.add(new THREE.HemisphereLight('#c0b8ff', '#100c18', 1.0));

		// ── Z3: lanterna e pastas reais ──
		const Z3 = new THREE.Group(); Z3.position.x = 120; scene.add(Z3);
		const dw3 = drawerWall({ cols: 12, rows: 8, rng: ctx.rng(809), color: '#2a2738' }); dw3.g.position.set(0, 0, -2.4); Z3.add(dw3.g); dw3.labels(.5);
		Z3.add(new THREE.HemisphereLight('#bfb6e8', '#0a0810', .55));
		const rf = [0, 1, 2, 3].map(i => { const f = folder3D('', ['#c9b78f', '#bfae86', '#cdb98b', '#c4b48a'][i], true); f.scale.setScalar(.75); f.position.set((i - 1.5) * 1.35, 1.3 + (i % 2) * .2, 0); Z3.add(f); return f; });
		const lant = new THREE.SpotLight('#fff3d8', 0, 10, .2, .5, 1.2); lant.position.set(-1, 2.2, 4); Z3.add(lant, lant.target);
		const lb = new THREE.Mesh(new THREE.CylinderGeometry(.08, .12, .5, 16), new THREE.MeshStandardMaterial({ color: '#30303a', metalness: .8, roughness: .3 })); lb.rotation.x = Math.PI / 2; Z3.add(lb);
		const beam = lightCone('#fff3d8', .7, 4.2, .1); Z3.add(beam);
		const spot = glow('#fff3d8', 1.1, 0); Z3.add(spot);
		const pen3 = lightPen(); pen3.rotation.z = -.5; Z3.add(pen3);
		const sc3 = scribble(mulberry32(93), .5, 3, .25); sc3.material.color.set('#f2edff'); Z3.add(sc3);

		// ── Z4: espiral ──
		const Z4 = new THREE.Group(); Z4.position.x = 160; scene.add(Z4);
		const spir = spiralPlane(16, 9); spir.position.set(0, 1.5, -2); Z4.add(spir);

		const ui = uiLayer(`
			<div data-k="eua" class="lbl" style="left:0;right:0;text-align:center;top:700px;color:#8A88A8">EUA · anos 90</div>
			<div data-k="tec" class="lbl v" style="left:0;right:0;text-align:center;top:930px">hipnose · imaginação guiada · perguntas insistentes</div>
			<div data-k="imp" class="q" style="right:160px;top:250px;color:#FF5C7A;font-weight:300;letter-spacing:.3em">impossível</div>
			<div data-k="s1" class="src">Loftus, 1997 · Scientific American, “Creating false memories”</div>
			<div data-k="per" class="q cx" style="top:470px">então a hipnose é perigosa?</div>`);
		const U = uiMap(ui);

		const SH = [
			{ a: 384, b: 390, p0: [0, 1.6, 2.6], p1: [0, 2.6, 8.4], l0: [0, 1.8, -10], l1: [0, 2.6, -15], e: ease.cubicInOut },
			{ a: 390, b: 395, p0: [0, 2.6, 7], p1: [heroWin.position.x, heroWin.position.y, heroWin.position.z + 2.2], l0: [heroWin.position.x * .5, 3, -15], l1: heroWin.position.toArray(), e: ease.expoIn },
			{ a: 395, b: 400, p0: [38.5, 1.7, 4.4], p1: [41.2, 1.7, 4.2], l0: [39.4, 1.5, 0], l1: [40.6, 1.5, 0] },
			{ a: 400, b: 408, p0: [40.2, 1.5, 3.2], p1: [40.2, 1.45, 2.4], l0: [40.2, 1.4, 0], l1: [40.2, 1.4, 0] },
			{ a: 408, b: 416, p0: [78.6, 1.9, 5.6], p1: [81.4, 1.9, 5.3], l0: [79.4, 1.9, 0], l1: [80.6, 1.9, 0] },
			{ a: 416, b: 421, p0: [120, 1.8, 6.4], p1: [120, 1.7, 5.4], l0: [120, 1.4, 0], l1: [120, 1.4, 0] },
			{ a: 421, b: 426, p0: [120.2, 1.5, 2.2], p1: [120.9, 1.5, 2.0], l0: [120.4, 1.35, 0], l1: [120.8, 1.35, 0] },
			{ a: 426, b: 434, p0: [160, 1.5, 3], p1: [160, 1.5, 5], l0: [160, 1.5, -2], l1: [160, 1.5, -2] },
		];
		const CUTS = [395, 400, 408, 416, 421, 426];
		let spinT = 0;
		return {
			scene, camera, ui, bloom: { strength: .45, radius: .5, threshold: .86 },
			fadeFn: lt => Math.max(dips(lt + S, CUTS, .18) * .95, lt + S < 395 ? sm(lt + S, 394.2, 395) : 0),
			update(lt) {
				const t = lt + S;
				shots(camera, t, SH);
				// paredes tombam para fora
				const fall = ease.expoIn(seg(t, 385, 387.6));
				walls.forEach((w, i) => { w.rotation.x = i === 0 ? -fall * Math.PI / 2 : 0; if (i) w.rotation.z = (i === 1 ? 1 : -1) * fall * Math.PI / 2 * 0; if (i) w.children[0].rotation.x = -fall * Math.PI / 2; setLineOpacity(w, 1 - sm(t, 387, 389)); });
				winMat.opacity = .5 + .4 * eo(t, 386, 388);
				winGlow.material.opacity = .4 + .4 * sm(t, 390, 394);
				op(card5, inOut(t, 386.2, 387.4, 389.2, 390));
				cue(U.eua, t, 386.8, 389.8);
				// Z1 terapia sugestiva
				for (let i = 0; i < dw.info.length; i++) dw.open(i, t > 395 && t < 408 ? Math.max(0, Math.sin(t * 1.6 + i * 2.3)) * .25 * sm(t, 395.4, 396.6) : 0);
				const wr = seg(t, 396, 402), n = sc.geometry.attributes.position.count, ci = Math.floor(n * wr);
				sc.geometry.setDrawRange(0, ci); sc.visible = ci > 0;
				const p = sc.pts[Math.min(n - 1, ci)]; pen.position.set(.2 + p.x, 1.35 + p.y, .07); pen.on(t < 402.2 ? 1 : 1 - seg(t, 402.2, 402.8)); pen.visible = t < 402.8;
				sc.material.opacity = 1;
				cue(U.tec, t, 396, 399.8);
				const rk = ease.expoOut(seg(t, 403.2, 404.4)); rec.position.set(lerp(-3.5, .55, rk), 1.25, .04); rec.rotation.z = lerp(.4, -.08, rk); rec.visible = t > 403;
				xLine.scale.x = Math.max(.001, ease.expoOut(seg(t, 404.8, 405.6))); xLine.visible = t > 404.8;
				cue(U.imp, t, 405.2, 407.8);
				// Z2 rasgo
				const tear = ease.cubicInOut(seg(t, 409, 411.6));
				mL.position.set(-tear * .55, 1.5 - tear * .1, 0); mL.rotation.z = tear * .12; mR.position.set(tear * .55, 1.5 - tear * .05, 0); mR.rotation.z = -tear * .1;
				[mL, mR].forEach(m => m.material.uniforms.uSepia.value = 1);
				const gv = ease.sineInOut(seg(t, 411, 414.8)); gavel.rotation.z = lerp(.9, -.2, gv);
				op(war, inOut(t, 412.4, 413.4, 415.4, 416)); cue(U.s1, t, 412.6, 415.8);
				// Z3 lanterna
				const sweep = Math.sin((t - 416) * .8) * 2;
				const tgt = t < 421 ? new THREE.Vector3(sweep, 1.35, 0) : new THREE.Vector3(.6, 1.3, .02);
				lant.target.position.copy(tgt); lant.intensity = 4 * eo(t, 416.2, 417.2);
				const lp = new THREE.Vector3(-1.2, 2.4, 3.6); lb.position.copy(lp); lb.lookAt(tgt); lb.rotateX(Math.PI / 2);
				beam.position.copy(lp); beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), tgt.clone().sub(lp).normalize()); beam.material.uniforms.uOpacity.value = .08 * eo(t, 416.2, 417.2);
				spot.position.set(tgt.x, tgt.y, .05); spot.material.opacity = .18 * eo(t, 416.4, 417.4);
				const w3 = seg(t, 421.6, 425.4), n3 = sc3.geometry.attributes.position.count, c3 = Math.floor(n3 * w3);
				sc3.position.set(tgt.x - .05, tgt.y, .05); sc3.geometry.setDrawRange(0, c3); sc3.visible = t > 421.4;
				const p3 = sc3.pts[Math.min(n3 - 1, c3)]; pen3.position.set(sc3.position.x + p3.x, sc3.position.y + p3.y, .1); pen3.visible = t > 421; pen3.on(1);
				// Z4 espiral que desacelera
				const sp = t < 426 ? 0 : (t - 426) - .5 * Math.pow(Math.min(t - 426, 8), 2) / 8 * .9;
				spir.material.uniforms.uTime.value = 20 + sp * 2.2; spir.material.uniforms.uOpacity.value = eo(t, 426.2, 427.4) * .5;
				cue(U.per, t, 427.2, 433.8);
			},
		};
	},
};
