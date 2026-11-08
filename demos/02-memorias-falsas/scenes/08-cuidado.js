// CAPÍTULO VI — O cuidado clínico (07:14 – 07:54) · a mesma sala, agora clara
import * as THREE from 'three';
import { C, seg, eo, sm, inOut, lerp, ease, pulse, shots, dips, textPlane, op, uiLayer, uiMap, cue, texMat, glow, lightCone, mulberry32 } from '../lib.js';
import { iconTex, docTex } from '../draw.js';
import { room, drawerWall, folder3D, lightPen, scribble } from '../worlds.js';

const S = 434;
export default {
	id: 'cuidado', dur: 40,
	async init(ctx) {
		const scene = new THREE.Scene();
		scene.background = new THREE.Color('#0d0b18');
		scene.fog = new THREE.FogExp2('#0d0b18', .035);
		const camera = new THREE.PerspectiveCamera(35, ctx.W / ctx.H, .05, 200);
		const rng = ctx.rng(909);
		const R = room(scene, rng, { violet: .6 });
		// janela + cortinas (parede esquerda)
		const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.6), new THREE.MeshBasicMaterial({ color: '#fff0d6' })); win.position.set(-4.6, 2.2, -.5); win.rotation.y = Math.PI / 2; scene.add(win);
		const curt = [-1, 1].map(s => { const c = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 2.9), new THREE.MeshStandardMaterial({ color: '#3a2a4a', roughness: 1, side: THREE.DoubleSide })); c.rotation.y = Math.PI / 2; c.position.set(-4.55 + (s > 0 ? .012 : 0), 2.2, -.5 + s * .6); scene.add(c); return { c, s }; });
		const sun = new THREE.DirectionalLight('#ffe7c4', 0); sun.position.set(-8, 4, -.5); sun.target.position.set(0, 0, .5); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); scene.add(sun, sun.target);
		const shaft = lightCone('#fff0d6', 2.2, 6, .0); shaft.position.set(-4.5, 3.4, -.5); shaft.rotation.z = -1.0; scene.add(shaft);
		const card6 = textPlane('VI · O CUIDADO', { size: 110, height: .62, color: '#FFE2B8', glow: 24 }); card6.position.set(0, 3.3, -2.8); scene.add(card6);
		const icons = ['raio', 'onda', 'intestino'].map((ic, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(.7, .7), texMat(iconTex(ic, '#FFE2B8', 512, 16), { additive: true })); m.position.set((i - 1) * 1.5, 2.2, .6); scene.add(m); return m; });

		// Z2: resolução do CFP
		const Z2 = new THREE.Group(); Z2.position.x = 40; scene.add(Z2);
		const desk = new THREE.Mesh(new THREE.PlaneGeometry(8, 6), new THREE.MeshStandardMaterial({ color: '#2a2030', roughness: .7 })); desk.rotation.x = -Math.PI / 2; Z2.add(desk);
		const doc = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.84), texMat(docTex('RESOLUÇÃO CFP Nº 013/2000', 'hipnose como recurso auxiliar', 13), { revealY: true }));
		doc.rotation.x = -Math.PI / 2; doc.position.y = .01; Z2.add(doc);
		const pk = new THREE.PointLight('#fff0d6', 4, 6, 1.4); pk.position.set(0, 2.5, 1); Z2.add(pk);
		Z2.add(new THREE.HemisphereLight('#d8d0ff', '#100c18', .8));

		// Z3: três regras + caneta tampada
		const Z3 = new THREE.Group(); Z3.position.x = 80; scene.add(Z3);
		const dw3 = drawerWall({ cols: 14, rows: 8, rng: ctx.rng(910), color: '#2e2b44' }); dw3.g.position.set(0, 0, -2.6); Z3.add(dw3.g); dw3.labels(.6);
		Z3.add(new THREE.HemisphereLight('#d8d0ff', '#0c0a14', 1));
		const pen = lightPen(); pen.position.set(2.2, 1.2, 0); pen.rotation.z = -.35; Z3.add(pen);

		// Z4: investigar × escrever
		const Z4 = new THREE.Group(); Z4.position.x = 120; scene.add(Z4);
		const dw4 = drawerWall({ cols: 14, rows: 8, rng: ctx.rng(911), color: '#2a2738' }); dw4.g.position.set(0, 0, -2.4); Z4.add(dw4.g); dw4.labels(.5);
		Z4.add(new THREE.HemisphereLight('#c8c0f0', '#0a0810', .6));
		const fOld = folder3D('', '#c9b78f', true); fOld.position.set(-1.5, 1.35, 0); fOld.scale.setScalar(.85); Z4.add(fOld);
		const fNew = folder3D('', '#cdb98b', false); fNew.position.set(1.5, 1.35, 0); fNew.scale.setScalar(.85); Z4.add(fNew);
		const lamp = new THREE.SpotLight('#fff3d8', 0, 8, .22, .5, 1.2); lamp.position.set(-2.6, 2.4, 3); lamp.target = fOld; Z4.add(lamp);
		const lspot = glow('#fff3d8', 1.2, 0); lspot.position.set(-1.5, 1.35, .04); Z4.add(lspot);
		const pen4 = lightPen(); pen4.rotation.z = -.5; Z4.add(pen4);
		const sc4 = scribble(mulberry32(95), 1.0, 5, .6); sc4.material.color.set('#ffd0da'); sc4.position.set(1.5, 1.32, .03); Z4.add(sc4);
		const redG = glow(C.emocao, 2, 0); redG.position.set(1.5, 1.35, .02); Z4.add(redG);

		const ui = uiLayer(`
			<div data-k="ind" class="lbl a" style="left:0;right:0;text-align:center;top:860px">dor · ansiedade · alguns problemas digestivos</div>
			<div data-k="cfp" class="lbl" style="left:0;right:0;text-align:center;top:110px">Conselho Federal de Psicologia</div>
			<div data-k="cfp2" class="sm" style="left:0;right:0;text-align:center;top:160px">Resolução CFP nº 013/2000 · recurso auxiliar do psicólogo</div>
			<div data-k="r1" class="mid" style="left:160px;top:330px"><b style="color:#FF5C7A">✕</b>&nbsp; usar para “descobrir a verdade”</div>
			<div data-k="r2" class="mid" style="left:160px;top:460px"><b style="color:#FF5C7A">✕</b>&nbsp; sugerir o que aconteceu</div>
			<div data-k="r3" class="mid" style="left:160px;top:590px"><b style="color:#FF5C7A">✕</b>&nbsp; confirmar porque ficou nítido</div>
			<div data-k="q1" class="it" style="left:140px;top:130px">“o que você sente agora?”</div>
			<div data-k="q2" class="it" style="right:140px;top:130px">“o que ele fez com você naquele quarto?”</div>
			<div data-k="a1" class="lbl c" style="left:300px;top:880px">investigar</div>
			<div data-k="a2" class="lbl r" style="right:300px;top:880px">escrever</div>`);
		const U = uiMap(ui);

		const SH = [
			{ a: 434, b: 444, p0: [.4, 2.3, 8.2], p1: [0, 1.95, 6.0], l0: [-.4, 1.6, -1], l1: [0, 1.7, -1.5] },
			{ a: 444, b: 450, p0: [40, 3.4, 1.2], p1: [40, 2.5, .9], l0: [40, 0, 0], l1: [40, 0, 0] },
			{ a: 450, b: 460, p0: [79, 1.5, 5.2], p1: [81.2, 1.5, 4.8], l0: [79.6, 1.4, 0], l1: [80.8, 1.4, 0] },
			{ a: 460, b: 467, p0: [118.5, 1.55, 3.2], p1: [118.5, 1.45, 2.4], l0: [118.5, 1.35, 0], l1: [118.5, 1.35, 0] },
			{ a: 467, b: 471, p0: [121.5, 1.55, 3.0], p1: [121.5, 1.45, 2.5], l0: [121.5, 1.35, 0], l1: [121.5, 1.35, 0] },
			{ a: 471, b: 474, p0: [120, 1.6, 4.2], p1: [120, 1.6, 6.4], l0: [120, 1.4, 0], l1: [120, 1.4, 0] },
		];
		const CUTS = [444, 450, 460, 467, 471];
		return {
			scene, camera, ui, bloom: { strength: .45, radius: .5, threshold: .75 }, exposure: 1.1,
			fadeFn: lt => dips(lt + S, CUTS, .18) * .95,
			update(lt) {
				const t = lt + S;
				shots(camera, t, SH); R.tick(t);
				const op1 = ease.cubicInOut(seg(t, 434.8, 437.6));
				curt.forEach(({ c, s }) => { c.position.z = -.5 + s * (.6 + op1 * .95); });
				sun.intensity = 3.2 * op1; shaft.material.uniforms.uOpacity.value = .1 * op1;
				R.fill.intensity = .35 + .9 * op1; R.warm.intensity = 14;
				op(card6, inOut(t, 435.4, 436.6, 439.6, 440.6));
				icons.forEach((m, i) => { op(m, inOut(t, 439.4 + i * .5, 440.2 + i * .5, 443.4, 444)); m.position.y = 2.2 + Math.sin(t + i) * .05; m.lookAt(camera.position); });
				cue(U.ind, t, 439.6, 443.9);
				doc.position.x = lerp(-3, 0, ease.expoOut(seg(t, 444.2, 445.4)));
				doc.material.uniforms.uReveal.value = seg(t, 445.2, 449) * 1.05;
				cue(U.cfp, t, 445, 449.8); cue(U.cfp2, t, 445.6, 449.8);
				cue(U.r1, t, 451.2, 459.8); cue(U.r2, t, 453.4, 459.8); cue(U.r3, t, 455.6, 459.8);
				const capk = ease.expoOut(seg(t, 457.8, 458.6));
				const cap = pen.userData.cap; cap.visible = t > 457.6; cap.position.y = lerp(-1.2, -.08, capk);
				pen.on(t < 458.4 ? 1 : 1 - seg(t, 458.4, 459)); pen.position.y = 1.2 + Math.sin(t * 1.2) * .05;
				// investigar
				lamp.intensity = 25 * eo(t, 460.4, 461.4); lspot.material.opacity = .5 * eo(t, 460.4, 461.4);
				// escrever
				const w = seg(t, 467.6, 470.8), n = sc4.geometry.attributes.position.count, c = Math.floor(n * w);
				sc4.geometry.setDrawRange(0, c); sc4.visible = t > 467.4;
				const p = sc4.pts[Math.min(n - 1, c)]; pen4.position.set(1.5 + p.x, 1.32 + p.y, .08); pen4.visible = t > 467; pen4.on(t < 471 ? 1 : .6);
				redG.material.opacity = .12 * sm(t, 468, 471);
				cue(U.q1, t, 461, 473.8); cue(U.q2, t, 467.6, 473.8); cue(U.a1, t, 471.2, 473.8); cue(U.a2, t, 471.5, 473.8);
			},
		};
	},
};
