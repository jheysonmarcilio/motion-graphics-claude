// CAPÍTULO III — A foto do balão (03:56 – 05:08) · mundo de linhas + colagem
import * as THREE from 'three';
import { C, col, seg, eo, sm, inOut, lerp, ease, pulse, shots, dips, textPlane, op, uiLayer, uiMap, cue, lineMat, polyline, reveal, rectPts, rimMat, figure, glow, setLineOpacity, texMat, segs } from '../lib.js';
import { photoTex, cutoutTex, balloonTex, cloudTex, paintedBalloonTex, handTex } from '../draw.js';
import { photoMat, photoMesh } from '../worlds.js';
import { dotFloor, shoppingLines } from './02-laboratorio.js';

const S = 236;
// pintura revelada por pinceladas (máscara de ruído)
export function paintMat(map) {
	return new THREE.ShaderMaterial({
		uniforms: { map: { value: map }, uReveal: { value: 0 }, uOpacity: { value: 1 }, uSat: { value: 1 } },
		vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
		fragmentShader: `uniform sampler2D map; uniform float uReveal, uOpacity, uSat; varying vec2 vUv;
			float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
			float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
			void main(){ vec4 c = texture2D(map, vUv);
				float stroke = n(vec2(vUv.x * 5., vUv.y * 38.)) * .6 + n(vUv * 9.) * .4;
				float m = smoothstep(stroke - .05, stroke + .05, uReveal * 1.25 - .1 + vUv.x * .1);
				float l = dot(c.rgb, vec3(.3,.59,.11)); c.rgb = mix(vec3(l), c.rgb, uSat);
				gl_FragColor = vec4(c.rgb, m * uOpacity); }`,
		transparent: true, depthWrite: false,
	});
}

export default {
	id: 'balao', dur: 72,
	async init(ctx) {
		const scene = new THREE.Scene();
		scene.background = new THREE.Color('#0a0b1e');
		scene.fog = new THREE.Fog('#0a0b1e', 10, 34);
		const camera = new THREE.PerspectiveCamera(35, ctx.W / ctx.H, .05, 200);
		const rng = ctx.rng(505);
		scene.add(dotFloor(-14, 175, -24, 12, .55));
		const L = lineMat(C.sinapse, .9), Ld = lineMat(C.sinapse, .45), Lr = lineMat(C.emocao, .7), Lw = lineMat(C.luz, .9);
		const fig = (c = C.sinapse, o = {}) => figure(rimMat(c, { fill: .07, power: 1.6 }), o);

		// ── Z0: shopping se remonta + fantasma ──
		const shopA = shoppingLines(Ld, rng); scene.add(shopA);
		const shopB = shoppingLines(Lr, ctx.rng(506)); scene.add(shopB);
		const shopLines = []; shopA.traverse(o => o.isLine && shopLines.push(o));
		const childA = fig(C.luz, { h: 1, child: true }), childB = fig(C.emocao, { h: 1, child: true }); scene.add(childA, childB);
		const card3 = textPlane('III · A FOTO', { size: 120, height: .6, color: C.sinapse, glow: 26 }); card3.rotation.x = -Math.PI / 2; card3.position.set(0, .02, 2.2); scene.add(card3);

		// ── Z1: moldura + linha do tempo ──
		const Z1 = new THREE.Group(); Z1.position.x = 40; scene.add(Z1);
		const fr = polyline(rectPts(3.6, 2.6), Lw); fr.position.y = 1.5; Z1.add(fr);
		const tl = polyline([[-4.5, 0, 0], [4.5, 0, 0]], Ld); tl.position.y = .2; Z1.add(tl);
		const tk = []; for (let y = 1990; y <= 2010; y += 2) { const x = (y - 2000) * .42; tk.push([x, .1, 0, x, .3, 0]); } const ticks = segs(tk, Ld); Z1.add(ticks);
		const mark = glow(C.emocao, .4, 1); Z1.add(mark);
		const y95 = textPlane('1995', { size: 70, weight: 300, height: .14, color: C.eco, track: .05 }); y95.position.set(-5 * .42, -.05, 0); Z1.add(y95);
		const y02 = textPlane('2002', { size: 70, weight: 800, height: .16, color: C.emocao, track: .05 }); y02.position.set(2 * .42, -.05, 0); Z1.add(y02);

		// ── Z2: mesa de colagem ──
		const Z2 = new THREE.Group(); Z2.position.x = 80; scene.add(Z2);
		const table = new THREE.Mesh(new THREE.PlaneGeometry(8, 5), new THREE.MeshStandardMaterial({ color: '#1c1a2c', roughness: .8 })); table.rotation.x = -Math.PI / 2; table.receiveShadow = true; Z2.add(table);
		Z2.add(new THREE.HemisphereLight('#c8c0ff', '#100c18', 1.4));
		const key = new THREE.DirectionalLight('#fff2dd', 1.6); key.position.set(-2, 5, 3); Z2.add(key);
		const flat = (m, x, z, y = .01) => { m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); Z2.add(m); return m; };
		const parque = flat(photoMesh('parque', 12, 1.6), -1.1, 0);
		const parqueH = flat(photoMesh('parque_buraco', 12, 1.6), -1.1, 0, .011); parqueH.visible = false;
		// balão composto (camadas com uniforms compartilhados → cor/sépia juntas)
		const U = { uMelt: { value: 0 }, uDev: { value: 1 }, uOpacity: { value: 1 }, uSepia: { value: 1 }, uKeepRed: { value: 0 }, uTime: { value: 0 }, uBurn: { value: 0 }, uTint: { value: new THREE.Color(1, 1, 1) }, uBright: { value: 1 }, uHue: { value: 0 } };
		const BX = 1.15;
		const ceu = flat(new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2), photoMat(photoTex('ceu', 13), { shared: U })), BX, 0);
		const bal = flat(new THREE.Mesh(new THREE.PlaneGeometry(.6, .9), photoMat(balloonTex(), { shared: U })), BX + .12, -.08, .016); bal.renderOrder = 3;
		const clouds = [0, 1, 2].map(i => { const c = flat(new THREE.Mesh(new THREE.PlaneGeometry(.6, .3), photoMat(cloudTex(20 + i), { shared: U })), BX - .5 + i * .45, -.35 + (i % 2) * .2, .012 + i * .0015); c.renderOrder = 2; return c; });
		const cutB = new THREE.Mesh(new THREE.PlaneGeometry(.62, .62), photoMat(cutoutTex(true), { shared: null }));
		const cutN = new THREE.Mesh(new THREE.PlaneGeometry(.62, .62), photoMat(cutoutTex(false)));
		const cutG = new THREE.Group(); Z2.add(cutG); [cutB, cutN].forEach((m, i) => { m.rotation.x = -Math.PI / 2; m.position.y = i * .002; cutG.add(m); m.renderOrder = 2 + i; });
		cutB.material.uniforms.uSepia.value = 1;
		const tape = new THREE.Mesh(new THREE.PlaneGeometry(.12, .045), new THREE.MeshStandardMaterial({ color: '#efe6c8', transparent: true, opacity: .7, roughness: .3 })); tape.rotation.x = -Math.PI / 2; Z2.add(tape); tape.renderOrder = 5;
		// tesoura (linhas) + caminho de corte
		const sc = new THREE.Group(); Z2.add(sc);
		sc.add(polyline([[0, 0, 0], [.3, 0, -.05], [.33, 0, -.02], [0, 0, 0], [.3, 0, .05], [.33, 0, .02], [0, 0, 0]], Lw));
		const ring = (cx, cz) => polyline(Array.from({ length: 21 }, (_, i) => [cx + Math.cos(i / 20 * 6.283) * .05, 0, cz + Math.sin(i / 20 * 6.283) * .05]), Lw);
		sc.add(ring(-.07, -.04), ring(-.07, .04)); sc.position.y = .06;
		const cutPath = []; for (let i = 0; i <= 80; i++) { const a = i / 80 * Math.PI * 2; cutPath.push(new THREE.Vector3(-1.1 - .032 + Math.sin(a) * .13, .03, .26 + -Math.cos(a) * .26)); }
		const cutLine = polyline(cutPath, lineMat(C.luz, .9)); cutLine.material = new THREE.LineDashedMaterial({ color: C.luz, dashSize: .02, gapSize: .015, transparent: true }); cutLine.computeLineDistances(); Z2.add(cutLine);
		const viewer = fig('#B9A6FF', { h: 1.6 }); viewer.position.set(BX - .9, 0, 1.9); viewer.rotation.y = Math.PI + .5; Z2.add(viewer);

		// ── Z4: grade 20 ──
		const Z4 = new THREE.Group(); Z4.position.x = 120; scene.add(Z4);
		const lit = { 1: 1, 3: .5, 6: 1, 8: 1, 9: .5, 12: 1, 13: .5, 15: 1, 17: .5, 19: 1 };
		const grid = []; for (let i = 0; i < 20; i++) { const m = rimMat(C.sinapse, { fill: .05, power: 1.7 }); const f = figure(m, { h: .95 }); f.position.set((i % 5 - 2) * .95 - 1.6, (3 - Math.floor(i / 5)) * 1.1 - .25, 0); Z4.add(f); grid.push({ f, m, v: lit[i] || 0, o: Object.keys(lit).indexOf(String(i)) }); }

		// ── Z5: queima → texto → pintura ──
		const Z5 = new THREE.Group(); Z5.position.x = 160; scene.add(Z5);
		const burnP = photoMesh('balao', 9, 2.4); burnP.position.set(0, 1.2, 0); Z5.add(burnP);
		const desc = textPlane('um passeio de balão…\nvocê tinha uns seis anos,\no cesto balançava,\na sua família estava junto', { size: 84, weight: 600, family: 'Caveat', track: 0, height: .95, color: '#EEE3C8', additive: false, lineH: 1.15 });
		desc.position.set(0, 1.2, -.05); Z5.add(desc);
		const paint = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.125), paintMat(paintedBalloonTex())); paint.position.set(0, 1.2, -.08); Z5.add(paint);
		const bars = new THREE.Group(); bars.position.x = 8; Z5.add(bars);
		const bar = (x, c) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(.9, 1), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .9 })); m.geometry.translate(0, .5, 0); m.position.set(x, .3, 0); bars.add(m); return m; };
		const bFoto = bar(-.8, C.sinapse), bHist = bar(.8, C.emocao);
		const lf = textPlane('FOTO', { size: 80, height: .16, color: C.sinapse }), lh = textPlane('HISTÓRIA', { size: 80, height: .16, color: C.emocao });
		lf.position.set(-.8, .12, 0); lh.position.set(.8, .12, 0); bars.add(lf, lh);
		bars.add(polyline([[-1.8, .3, 0], [1.8, .3, 0]], Ld));

		const ui = uiLayer(`
			<div data-k="este" class="lbl c" style="left:360px;top:200px">este dia?</div>
			<div data-k="outro" class="lbl r" style="right:360px;top:200px">outro dia?</div>
			<div data-k="wade" class="lbl" style="left:0;right:0;text-align:center;top:120px">Wade et al. · 2002</div>
			<div data-k="cv" class="lbl v" style="left:120px;top:120px">conversa 1</div>
			<div data-k="n50" class="big" style="right:170px;top:300px">≈ 50<span style="opacity:.6">%</span></div>
			<div data-k="lg" class="sm" style="right:170px;top:520px"><span style="color:#FF5C7A">■</span> cena completa &nbsp; <span style="color:#FF5C7A;opacity:.55">■</span> fragmentos</div>
			<div data-k="s1" class="src">Wade, Garry, Read &amp; Lindsay, 2002 · 20 participantes</div>
			<div data-k="gw" class="lbl" style="left:0;right:0;text-align:center;top:110px">Garry &amp; Wade · 2005</div>
			<div data-k="ill" class="ill" style="right:80px;bottom:44px">comparação ilustrativa</div>
			<div data-k="s2" class="src">Garry &amp; Wade, 2005 · Psychonomic Bulletin &amp; Review</div>
			<div data-k="f1" class="lbl c" style="left:120px;top:880px">foto = cena pronta</div>
			<div data-k="f2" class="lbl r" style="right:120px;top:880px">história = você completa</div>`);
		const M = uiMap(ui);

		const bx = 80 + BX, basket = new THREE.Vector3(bx + .12, 0, -.08 + .25);
		const SH = [
			{ a: 236, b: 243, p0: [0, 2.6, 9.4], p1: [1.4, 2.3, 8.2], l0: [0, .9, -4], l1: [.4, 1, -4] },
			{ a: 243, b: 251, p0: [-1.6, 1.6, 6.2], p1: [1.6, 1.6, 5.7], l0: [-.2, 1, -2], l1: [.2, 1, -2] },
			{ a: 251, b: 259, p0: [40, 1.3, 9.2], p1: [40.4, 1.3, 6.8], l0: [40, 1, 0], l1: [40.4, 1, 0] },
			{ a: 259, b: 264, p0: [80, 4.3, 1.3], p1: [80.3, 3.9, 1.1], l0: [80, 0, 0], l1: [80.3, 0, 0] },
			{ a: 264, b: 269, p0: [80.9, 2.3, .9], p1: [81.15, 1.85, .65], l0: [81.1, 0, 0], l1: [81.2, 0, 0] },
			{ a: 269, b: 274, p0: [basket.x + .05, .95, basket.z + .38], p1: [basket.x, .62, basket.z + .26], l0: [basket.x, 0, basket.z - .02], l1: [basket.x, 0, basket.z - .02] },
			{ a: 274, b: 282, p0: [bx + .3, 2.1, 2.9], p1: [bx + .15, 1.7, 2.0], l0: [bx, 0, 0], l1: [bx, 0, -.05] },
			{ a: 282, b: 289, p0: [120, 1.5, 6.8], p1: [120, 1.7, 9.4], l0: [120, 1.4, 0], l1: [120, 1.4, 0] },
			{ a: 289, b: 296, p0: [160, 1.25, 4.8], p1: [160, 1.2, 3.9], l0: [160, 1.2, 0], l1: [160, 1.2, 0], roll: [.06, 0] },
			{ a: 296, b: 301, p0: [168, 1.25, 4.8], p1: [168, 1.2, 4.1], l0: [168, 1.1, 0], l1: [168, 1.1, 0] },
			{ a: 301, b: 308, p0: [160, 1.2, 3.1], p1: [160, 1.25, 5.4], l0: [160, 1.2, 0], l1: [160, 1.2, 0] },
		];
		const CUTS = [243, 251, 259, 264, 269, 274, 282, 289, 296, 301];

		return {
			scene, camera, ui, bloom: { strength: .8, radius: .5, threshold: .4 },
			bloomFn: lt => { const t = lt + S; return (t > 259 && t < 282) || t > 289 ? { strength: .35, radius: .4, threshold: .85 } : { strength: .8, radius: .5, threshold: .4 }; },
			fadeFn: lt => dips(lt + S, CUTS, .18) * .95,
			update(lt) {
				const t = lt + S;
				shots(camera, t, SH);
				// Z0
				shopLines.forEach((l, i) => reveal(l, seg(t, 236 + (i % 40) * .05, 238 + (i % 40) * .05)));
				op(card3, inOut(t, 237, 238.4, 241.8, 242.8));
				const gh = sm(t, 243.2, 244.6) * (1 - sm(t, 250, 251));
				setLineOpacity(shopB, gh); shopB.position.x = Math.sin((t - 243) * .7) * .9; shopB.position.z = Math.cos((t - 243) * .5) * .4;
				childA.position.set(0, 0, 0); childB.position.set(shopB.position.x, 0, shopB.position.z); childB.visible = gh > .01;
				childA.set({ t, tremble: 1 }); childB.set({ t: t + 1, tremble: 1 }); childB.children.forEach(() => {});
				cue(M.este, t, 244, 250.6); cue(M.outro, t, 244.6, 250.6);
				// Z1
				reveal(fr, sm(t, 251.6, 253.4)); reveal(tl, sm(t, 251.2, 252.6)); reveal(ticks, sm(t, 251.6, 253));
				const mk = ease.cubicInOut(seg(t, 253, 256)); mark.position.set(lerp(-5, 2, mk) * .42, .2, .02); mark.material.opacity = t > 252.8 ? 1 : 0;
				op(y95, eo(t, 252.6, 253.4) * .8); op(y02, eo(t, 255.6, 256.4)); y02.scale.setScalar(1 + pulse(t, 255.8, .4) * .3);
				cue(M.wade, t, 255.8, 258.8);
				// Z2 colagem
				const cutK = seg(t, 260, 263.4);
				const si = Math.min(80, Math.floor(cutK * 80)); sc.position.set(cutPath[si].x, .06, cutPath[si].z); sc.rotation.y = -cutK * Math.PI * 2 + Math.sin(t * 20) * .15;
				sc.visible = t > 259.6 && t < 263.8; cutLine.visible = t > 259.6 && t < 264.2; cutLine.geometry.setDrawRange(0, si + 1);
				const lift = ease.cubicInOut(seg(t, 264.2, 267.4)), land = eo(t, 267.2, 267.8);
				const from = new THREE.Vector3(-1.1 - .032, .02, .26), to = new THREE.Vector3(BX + .12, .014, -.08 + .2);
				cutG.position.lerpVectors(from, to, lift); cutG.position.y = .02 + Math.sin(lift * Math.PI) * .5;
				cutG.scale.setScalar(lerp(1, .25, lift));
				cutG.rotation.y = Math.sin(lift * Math.PI) * .4;
				parqueH.visible = t > 264.2; parque.visible = !parqueH.visible;
				// emenda some (cicatriza)
				const heal = sm(t, 271.6, 273.6);
				cutB.material.uniforms.uOpacity.value = 1 - heal; cutN.material.uniforms.uOpacity.value = heal; cutN.material.uniforms.uSepia.value = U.uSepia.value; cutN.material.uniforms.uBright.value = U.uBright.value;
				tape.position.set(to.x + .03, .03, to.z + .06); tape.rotation.z = .5; tape.material.opacity = (t > 268 ? .75 : 0) * (1 - heal); tape.visible = t > 268;
				// três conversas: a foto ganha vida
				const c1 = sm(t, 275, 276.4), c2 = sm(t, 277.4, 278.8), c3 = sm(t, 279.8, 281.2);
				const life = (c1 + c2 + c3) / 3;
				U.uSepia.value = 1 - life * .75; U.uBright.value = 1 + life * .15;
				clouds.forEach((c, i) => c.position.x = BX - .5 + i * .45 + Math.sin(t * .2 + i) * .03 + life * (t - 274) * .012);
				bal.position.z = -.08 - life * .08; cutG.position.z = (t > 267.8 ? to.z - life * .08 : cutG.position.z);
				viewer.visible = t > 274; viewer.set({ t, breathe: 1 });
				M.cv.textContent = 'conversa ' + (t < 277.4 ? 1 : t < 279.8 ? 2 : 3);
				cue(M.cv, t, 275, 281.8);
				// Z4
				grid.forEach(g => { const k = g.o >= 0 ? eo(t, 283 + g.o * .4, 283.5 + g.o * .4) * g.v : 0; g.m.uniforms.uColor.value.copy(col(C.sinapse)).lerp(col(C.emocao), Math.min(1, k * 1.6)); g.m.uniforms.uFill.value = .05 + .32 * k; g.f.set({ t: t + g.f.position.x, breathe: 1 }); });
				cue(M.n50, t, 285.4, 288.8); cue(M.lg, t, 286, 288.8); cue(M.s1, t, 285.6, 288.8);
				// Z5 queima
				burnP.u.uBurn.value = sm(t, 290.6, 295.2) * 1.02; burnP.visible = t < 295.6;
				op(desc, eo(t, 291, 292.4) * (1 - sm(t, 302, 304.4)));
				desc.position.y = 1.2 + sm(t, 302, 304.6) * .4; desc.scale.setScalar(1 + sm(t, 302, 304.6) * .1);
				cue(M.gw, t, 290.8, 295.8);
				// barras
				bFoto.scale.y = Math.max(.001, eo(t, 296.6, 298) * 1.0); bHist.scale.y = Math.max(.001, eo(t, 297.6, 299.2) * 1.55);
				cue(M.ill, t, 297, 300.8); cue(M.s2, t, 297.4, 300.8);
				// pintura
				paint.material.uniforms.uReveal.value = sm(t, 301.6, 306.4);
				cue(M.f1, t, 302.4, 307.6); cue(M.f2, t, 303.8, 307.6);
			},
		};
	},
};
