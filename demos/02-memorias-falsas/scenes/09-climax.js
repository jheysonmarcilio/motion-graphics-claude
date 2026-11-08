// CLÍMAX — o quebra-cabeça (07:54 – 08:38)
import * as THREE from 'three';
import { C, col, seg, eo, sm, inOut, lerp, ease, pulse, shots, dips, textPlane, op, uiLayer, uiMap, cue, lineMat, polyline, reveal, glow, dust, morphPoints, texMat } from '../lib.js';
import { iconTex } from '../draw.js';
import { photoMesh, puzzleBrain, headPositions } from '../worlds.js';

const S = 474;
export default {
	id: 'climax', dur: 44,
	async init(ctx) {
		const scene = new THREE.Scene();
		scene.background = new THREE.Color('#11112a');
		const camera = new THREE.PerspectiveCamera(35, ctx.W / ctx.H, .05, 200);
		const rng = ctx.rng(1010);

		// Z0: as duas fotos voltam + sliders de nitidez
		const Z0 = new THREE.Group(); scene.add(Z0);
		const ph = [-1.25, 1.25].map(x => { const p = photoMesh('aniversario', 1, 1.9); p.position.set(x, .1, 0); Z0.add(p); return p; });
		const card7 = textPlane('VII · A RESPOSTA', { size: 110, height: .34, color: C.sinapse, glow: 22 }); card7.position.set(0, 1.35, 0); Z0.add(card7);
		const sliders = ph.map(p => { const tr = polyline([[-.7, 0, 0], [.7, 0, 0]], lineMat(C.eco, .8)); tr.position.set(p.position.x, -.95, .02); Z0.add(tr); const k = glow(C.sinapse, .22, 1); Z0.add(k); return { tr, k, x: p.position.x }; });
		Z0.add(dust(rng, 260, [9, 5, 5], [0, 0, -1], { color: C.sinapse, size: 1.1, opacity: .4 }));

		// Z1: gráfico 11 de setembro (esquemático)
		const Z1 = new THREE.Group(); Z1.position.x = 40; scene.add(Z1);
		const axM = lineMat(C.eco, .9);
		const ax = polyline([[-3, 2, 0], [-3, -1.2, 0], [3.2, -1.2, 0]], axM); Z1.add(ax);
		const cons = [], conf = []; for (let i = 0; i <= 80; i++) { const u = i / 80, x = -3 + u * 6; cons.push([x, -1.2 + 2.7 * (1 - .62 * (1 - Math.exp(-u * 2.2))) - .1, 0]); conf.push([x, 1.45 + Math.sin(u * 9) * .03 - u * .08, 0]); }
		const lCons = polyline(cons, lineMat(C.sinapse, 1)), lConf = polyline(conf, lineMat(C.emocao, 1)); Z1.add(lCons, lConf);
		const hc = glow(C.sinapse, .3, 1), hf = glow(C.emocao, .3, 1); Z1.add(hc, hf);

		// Z2: cabeça → cérebro-quebra-cabeça → síntese
		const Z2 = new THREE.Group(); Z2.position.x = 80; scene.add(Z2);
		const HP = ctx.shared.headPositions || await headPositions(ctx, 11000, 3, rng);
		const head = morphPoints(HP, HP, HP, { color: C.sinapse, size: 1.7, rng }); head.position.y = .1; Z2.add(head);
		const brain = puzzleBrain(rng); brain.g.scale.setScalar(.8); Z2.add(brain.g);
		Z2.add(new THREE.HemisphereLight('#c8e8ff', '#120c20', 1.1));
		const kl = new THREE.DirectionalLight('#ffffff', 1.6); kl.position.set(3, 4, 5); Z2.add(kl);
		const rimL = new THREE.PointLight(C.consciente, 20, 10, 1.5); rimL.position.set(-3, 1, -3); Z2.add(rimL);
		// ícones nas peças da borda
		const edgeP = brain.pieces.filter(p => p.edge);
		const tags = ['foto', 'boca', 'olho', 'foto', 'boca', 'olho'].map((ic, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(.22, .22), texMat(iconTex(ic, C.luz, 256, 18), { additive: true })); const pc = edgeP[(i * 17 + 5) % edgeP.length]; pc.mesh.add(m); m.position.z = .05; return m; });
		// síntese: anel de elementos
		const ringDef = [['familia', 'voz confiável', true], ['cartao', '', false], ['calendario', '', false], ['balao', '', false], ['caneta', 'pergunta', true], ['olho', 'imaginar', true]];
		const ring = ringDef.map(([ic, _, main], i) => {
			const a = Math.PI / 2 + i / ringDef.length * Math.PI * 2, p = new THREE.Vector3(Math.cos(a) * 3.1, Math.sin(a) * 1.55 + .3, .3);
			const m = new THREE.Mesh(new THREE.PlaneGeometry(.62, .62), texMat(iconTex(ic, main ? C.emocao : C.luz, 512, 16), { additive: true })); m.position.copy(p); Z2.add(m);
			const l = polyline([[p.x * .82, p.y * .82, .2], [p.x * .4, p.y * .4, .4]], lineMat(main ? C.emocao : C.sinapse, .9)); Z2.add(l);
			return { m, l, main, p };
		});

		const ui = uiLayer(`
			<div data-k="nit" class="lbl" style="left:0;right:0;text-align:center;top:890px">nitidez <b style="color:#FF5C7A">✕</b></div>
			<div data-k="lc" class="lbl c" style="left:1500px;top:600px;font-size:24px">consistência<br>do relato</div>
			<div data-k="lf" class="lbl r" style="left:1500px;top:250px;font-size:24px">confiança</div>
			<div data-k="ax" class="sm" style="left:0;right:0;text-align:center;top:905px">semanas depois do 11 de Setembro</div>
			<div data-k="cx" class="lbl" style="left:160px;top:120px">certeza <b style="color:#FF5C7A">✕</b></div>
			<div data-k="esq" class="ill" style="right:80px;bottom:44px">esquemático · sem valores reais</div>
			<div data-k="s1" class="src">Talarico &amp; Rubin, 2003 · Psychological Science</div>
			<div data-k="nuc" class="lbl c" style="left:0;right:0;text-align:center;top:930px">o núcleo tende a ficar</div>
			<div data-k="dor" class="lbl v" style="left:0;right:0;text-align:center;top:930px">detalhes · ordem · origem</div>
			<div data-k="syn" class="lbl" style="left:0;right:0;text-align:center;top:985px;font-size:24px">voz confiável <span style="color:#FF5C7A">+</span> pergunta que já traz a resposta <span style="color:#FF5C7A">+</span> tempo para imaginar</div>`);
		const U = uiMap(ui);

		const SH = [
			{ a: 474, b: 480, p0: [-2.6, .3, 3.5], p1: [2.6, .2, 3.2], l0: [-.7, .1, 0], l1: [.7, .1, 0] },
			{ a: 480, b: 486, p0: [0, -.2, 3.3], p1: [0, -.3, 2.7], l0: [0, -.4, 0], l1: [0, -.4, 0] },
			{ a: 486, b: 496, p0: [39.2, .5, 7.4], p1: [40.8, .45, 7.0], l0: [40, .4, 0], l1: [40.1, .35, 0] },
			{ a: 496, b: 504, fn: (cam, k) => { const a = lerp(-.7, .2, k), r = 6.4; cam.position.set(80 + Math.sin(a) * r, .6, Math.cos(a) * r); cam.up.set(0, 1, 0); cam.lookAt(80, .1, 0); } },
			{ a: 504, b: 512, fn: (cam, k) => { const a = lerp(.6, 1.5, k), r = 3.4; cam.position.set(80 + Math.sin(a) * r, .9, Math.cos(a) * r); cam.up.set(0, 1, 0); cam.lookAt(80 + Math.sin(a) * .6, .3, Math.cos(a) * .6); } },
			{ a: 512, b: 518, p0: [80, .2, 5.2], p1: [80, .2, 8.2], l0: [80, .1, 0], l1: [80, .1, 0], e: ease.cubicInOut },
		];
		const CUTS = [480, 486, 496, 504, 512];
		return {
			scene, camera, ui, bloom: { strength: .6, radius: .5, threshold: .7 },
			fadeFn: lt => dips(lt + S, CUTS, .18) * .95,
			update(lt) {
				const t = lt + S;
				shots(camera, t, SH);
				ph.forEach((p, i) => { p.position.y = .1 + Math.sin(t * .7 + i * 2) * .04; p.rotation.y = (i ? -1 : 1) * .1; p.u.uSepia.value = .85; });
				op(card7, inOut(t, 474.6, 475.8, 478.8, 479.8));
				sliders.forEach((s, i) => { const k = eo(t, 481 + i * .4, 483 + i * .4); s.k.position.set(s.x - .7 + 1.4 * k, -.95, .03); s.k.material.opacity = t > 480 ? 1 : 0; reveal(s.tr, t > 480 ? 1 : 0); });
				cue(U.nit, t, 483.4, 485.8);
				// gráfico
				reveal(ax, sm(t, 486.4, 487.6));
				const g = seg(t, 487.6, 494); reveal(lCons, g); reveal(lConf, g);
				const gi = Math.min(80, Math.floor(g * 80)); hc.position.set(...cons[gi]); hf.position.set(...conf[gi]); hc.material.opacity = hf.material.opacity = g > 0 ? 1 : 0;
				cue(U.lc, t, 492, 495.8); cue(U.lf, t, 489, 495.8); cue(U.ax, t, 487, 495.8); cue(U.cx, t, 493.6, 495.8); cue(U.esq, t, 488, 495.8); cue(U.s1, t, 488.4, 495.8);
				// cabeça → quebra-cabeça
				head.u.uTime.value = t; head.u.uOpacity.value = .6 * (1 - sm(t, 497.4, 499.4)); head.u.uScatter.value = sm(t, 497.4, 499.6) * .3; head.visible = t < 499.7;
				const bk = ease.expoOut(seg(t, 497.8, 500.6));
				brain.g.scale.setScalar(.8 * Math.max(.001, bk)); brain.g.rotation.y = t * .08;
				brain.pieces.forEach((p, i) => { p.mesh.material.opacity = 1; });
				if (t > 504) brain.tick(t, sm(t, 504, 506), .31);
				cue(U.nuc, t, 500.4, 503.8); cue(U.dor, t, 505.4, 511.8);
				tags.forEach(m => op(m, sm(t, 504.4, 505.6)));
				// síntese
				ring.forEach((r, i) => { const k = eo(t, 512.4 + i * .3, 513.4 + i * .3); op(r.m, k); r.m.scale.setScalar(Math.max(.001, k) * (r.main ? 1 + .08 * Math.sin(t * 5) * sm(t, 515, 516) : .85)); reveal(r.l, k); r.l.material.opacity = r.main ? .5 + .5 * Math.max(0, Math.sin(t * 5)) * sm(t, 515, 516) : .5; });
				cue(U.syn, t, 514.6, 517.9);
			},
		};
	},
};
