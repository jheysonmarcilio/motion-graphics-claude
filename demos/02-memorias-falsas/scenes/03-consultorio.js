// CAPÍTULO II — O consultório (02:38 – 03:56) · mundo sólido violeta
import * as THREE from 'three';
import { C, col, seg, eo, sm, inOut, lerp, ease, pulse, shots, dips, textPlane, op, uiLayer, uiMap, cue, texMat, glow, rimMat, figure, canvasTex, lineMat, segs } from '../lib.js';
import { iconTex, docTex, stampTex } from '../draw.js';
import { room } from '../worlds.js';

const S = 158;
// espiral hipnótica num plano (sutil)
export function spiralPlane(w = 4, h = 4) {
	const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.ShaderMaterial({
		uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, uAsp: { value: w / h } },
		vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
		fragmentShader: `uniform float uTime, uOpacity, uAsp; varying vec2 vUv;
			void main(){ vec2 p = (vUv - .5) * vec2(uAsp, 1.) * 2.; float r = length(p), a = atan(p.y, p.x);
			float s = fract(a / 6.2831 * 3. + log(r + .001) * 1.6 - uTime * .35);
			float band = smoothstep(0., .05, s) - smoothstep(.45, .5, s);
			vec3 c = mix(vec3(.25,.12,.7), vec3(.65,.2,.6), .5 + .5 * sin(uTime * .5 + r * 2.));
			float a2 = band * smoothstep(1.0, .1, r) * uOpacity;
			gl_FragColor = vec4(c * 1.4, a2); }`,
		transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
	}));
	return m;
}
// cartão com ícone (para desfile e pilhas)
export function iconCard(icon, color = C.sinapse, w = 1, h = .66) {
	const ic = iconTex(icon, color, 256, 12).userData.canvas;
	const tex = canvasTex(360, 240, (g, W, H) => { g.fillStyle = 'rgba(14,12,30,.94)'; g.fillRect(0, 0, W, H); g.strokeStyle = color; g.lineWidth = 6; g.strokeRect(6, 6, W - 12, H - 12); g.drawImage(ic, W / 2 - 100, H / 2 - 100, 200, 200); });
	const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
	return m;
}

export default {
	id: 'consultorio', dur: 78,
	async init(ctx) {
		const scene = new THREE.Scene();
		scene.background = new THREE.Color('#07060f');
		scene.fog = new THREE.FogExp2('#07060f', .045);
		const camera = new THREE.PerspectiveCamera(35, ctx.W / ctx.H, .05, 200);
		const rng = ctx.rng(404);
		const R = room(scene, rng);
		const card2 = textPlane('II · O CONSULTÓRIO', { size: 110, height: .62, color: '#FFC890', glow: 24 }); card2.position.set(0, 3.3, -2.8); scene.add(card2);
		const hipn = textPlane('HIPNOSE COM REGRESSÃO', { size: 100, height: .34, color: '#C9B8FF', glow: 22 }); hipn.position.set(0, 2.6, -2.86); scene.add(hipn);
		// fios do mundo de linhas caindo (transição)
		const fallM = lineMat(C.sinapse, .8); const fall = []; for (let i = 0; i < 40; i++) fall.push([(rng() - .5) * 8, 4 + rng() * 2, 2 + rng() * 2, (rng() - .5) * 8, 3 + rng(), 2 + rng() * 2]);
		const fallL = segs(fall, fallM); scene.add(fallL);
		// tokens: fonte confiável, repetição, imaginação
		const tokens = ['familia', 'calendario', 'olho'].map((ic, i) => {
			const g = new THREE.Group(); g.position.set((i - 1) * 1.6, 2.2 + (i === 1 ? .2 : 0), -.2 * (i === 1)); scene.add(g);
			const m = new THREE.Mesh(new THREE.PlaneGeometry(.8, .8), texMat(iconTex(ic, C.luz, 512, 16), { additive: true })); g.add(m);
			const h = glow(C.consciente, 2.2, 0); g.add(h);
			return { g, m, h };
		});
		// gaveta-herói
		const HI = 4 * 22 + 12, hd = R.wall.info[HI];
		const hx = hd.x, hy = hd.y, hz = -3.2;
		const inner = glow('#d8ccff', 1.6, 0); inner.position.set(hx, hy + .2, hz + .3); scene.add(inner);
		const innerL = new THREE.PointLight('#cbbcff', 0, 4, 1.6); innerL.position.set(hx, hy + .3, hz + .6); scene.add(innerL);
		const ask = textPlane('A HIPNOSE AJUDA A LEMBRAR?', { size: 100, height: .16, color: C.luz, glow: 16 }); ask.position.set(hx, hy + .52, hz + .9); scene.add(ask);

		// ── Z2: desfile de imagens (dentro da gaveta) ──
		const Z2 = new THREE.Group(); Z2.position.x = 40; scene.add(Z2);
		const stage = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), new THREE.MeshStandardMaterial({ color: '#15122a', metalness: .6, roughness: .35 })); stage.rotation.x = -Math.PI / 2; Z2.add(stage);
		const parade = ['guarda-chuva', 'chave', 'peixe', 'xicara', 'relogio', 'casa', 'arvore', 'estrela', 'bicicleta'].map(ic => { const c = iconCard(ic, C.luz); Z2.add(c); return c; });
		Z2.add(new THREE.HemisphereLight('#8b6cff', '#000', 1.2));
		// ── Z3: grupo que se divide ──
		const Z3 = new THREE.Group(); Z3.position.x = 80; scene.add(Z3);
		const spiral = spiralPlane(3.4, 3.4); spiral.position.set(1.3, 1.5, -1.4); Z3.add(spiral);
		const grp = []; for (let i = 0; i < 12; i++) { const f = figure(rimMat(i % 2 ? '#B9A6FF' : C.consciente, { fill: .08, power: 1.7 }), { h: 1.25 }); Z3.add(f); grp.push({ f, x0: (i % 6 - 2.5) * .5, z0: Math.floor(i / 6) * -.7, side: i % 2 ? 1 : -1, row: Math.floor(i / 2) }); }
		// ── Z4: pilhas de cartões lembrados ──
		const Z4 = new THREE.Group(); Z4.position.x = 120; scene.add(Z4);
		const base6 = ['guarda-chuva', 'chave', 'peixe', 'xicara', 'relogio', 'casa'];
		const left = base6.map(ic => iconCard(ic, C.sinapse, .8, .53));
		const rightDef = [...base6.map(ic => [ic, 0]), ['arvore', 0], ['balao', 1], ['sapato', 1], ['estrela', 0], ['foto', 1], ['boca', 1], ['caneta', 1], ['pasta', 1]];
		const right = rightDef.map(([ic, bad]) => { const c = iconCard(ic, bad ? C.emocao : C.sinapse, .8, .53); c.userData.bad = bad; return c; });
		left.forEach((c, i) => { c.position.set(-1.4, .4 + i * .3, i * .002); Z4.add(c); });
		right.forEach((c, i) => { c.position.set(1.1, .4 + i * .3, i * .002); Z4.add(c); });
		const meters = right.map((c, i) => { const bg = new THREE.Mesh(new THREE.PlaneGeometry(.7, .07), new THREE.MeshBasicMaterial({ color: '#2a2448', transparent: true })); const fg = new THREE.Mesh(new THREE.PlaneGeometry(.7, .07), new THREE.MeshBasicMaterial({ color: C.luz, transparent: true })); fg.geometry.translate(.35, 0, 0); bg.position.set(2.0, c.position.y, .01); fg.position.set(1.65, c.position.y, .02); Z4.add(bg, fg); return { bg, fg }; });
		const lab = textPlane('SEM HIPNOSE', { size: 80, height: .14, color: C.sinapse }), labR = textPlane('COM HIPNOSE', { size: 80, height: .14, color: '#C9B8FF' });
		lab.position.set(-1.4, .05, 0); labR.position.set(1.1, .05, 0); Z4.add(lab, labR);
		const d4 = glow(C.consciente, 6, .25); d4.position.set(0, 2.5, -3); Z4.add(d4);
		// ── Z5: documento ──
		const Z5 = new THREE.Group(); Z5.position.x = 160; scene.add(Z5);
		const desk = new THREE.Mesh(new THREE.PlaneGeometry(8, 6), new THREE.MeshStandardMaterial({ color: '#1e1626', roughness: .7 })); desk.rotation.x = -Math.PI / 2; desk.receiveShadow = true; Z5.add(desk);
		const doc = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.84), new THREE.MeshStandardMaterial({ map: docTex('HIPNOSE E MEMÓRIA', 'Council on Scientific Affairs · 1985', 16), roughness: .9 })); doc.rotation.x = -Math.PI / 2; doc.castShadow = true; Z5.add(doc);
		const stmp = new THREE.Mesh(new THREE.PlaneGeometry(1.3, .49), texMat(stampTex('NÃO USAR COMO PROVA', C.emocao, 900, 240))); stmp.rotation.x = -Math.PI / 2; stmp.rotation.z = .12; stmp.position.set(0, .012, .1); Z5.add(stmp);
		const k5 = new THREE.SpotLight('#e8dcff', 7, 10, .6, .6, 1); k5.position.set(-1, 4, 2); k5.target = doc; k5.castShadow = true; Z5.add(k5);

		const ui = uiLayer(`
			<div data-k="t1" class="lbl" style="left:330px;top:760px">fonte confiável</div>
			<div data-k="t2" class="lbl" style="left:830px;top:760px">repetição</div>
			<div data-k="t3" class="lbl" style="left:1310px;top:760px">imaginação</div>
			<div data-k="db" class="lbl v" style="left:120px;top:120px">Dywan &amp; Bowers · 1983</div>
			<div data-k="day" class="mid" style="right:140px;top:110px">dia 1</div>
			<div data-k="ill" class="ill" style="right:80px;bottom:44px">número de dias ilustrativo</div>
			<div data-k="sem" class="lbl c" style="left:560px;top:230px">sem hipnose</div>
			<div data-k="com" class="lbl v" style="left:1150px;top:230px">com hipnose</div>
			<div data-k="lg" class="sm" style="left:120px;top:120px"><span style="color:#3EE6FF">■</span> acertos &nbsp;&nbsp; <span style="color:#FF5C7A">■</span> nunca vistos</div>
			<div data-k="esq" class="ill" style="right:80px;bottom:44px">esquemático · proporções ilustrativas</div>
			<div data-k="s1" class="src">Dywan &amp; Bowers, 1983 · Science</div>
			<div data-k="cf" class="lbl" style="right:160px;top:120px">confiança</div>
			<div data-k="s2" class="src">AMA · Council on Scientific Affairs, 1985</div>
			<div data-k="pq" class="q" style="left:160px;top:470px">por quê?</div>`);
		const U = uiMap(ui);

		const SH = [
			{ a: 158, b: 165, p0: [0, 2.3, 9], p1: [0, 1.9, 6.4], l0: [0, 1.5, -1], l1: [0, 1.6, -1.5] },
			{ a: 165, b: 170, p0: [.7, 1.55, 3.5], p1: [.25, 1.45, 3.0], l0: [-.9, .9, .2], l1: [-.9, .95, .1] },
			{ a: 170, b: 175, p0: [2.8, 1.75, 3.4], p1: [1.9, 1.95, 2.8], l0: [-.4, 1.3, -1], l1: [0, 2.3, -3.2] },
			{ a: 175, b: 185, p0: [-2.6, 2.15, 3.4], p1: [2.6, 2.15, 3.1], l0: [-.9, 2.25, -.2], l1: [.9, 2.25, -.2] },
			{ a: 185, b: 191, p0: [hx + .5, hy + .45, hz + 2.8], p1: [hx + .12, hy + .32, hz + 1.9], l0: [hx, hy + .1, hz + .3], l1: [hx, hy + .15, hz + .4] },
			{ a: 191, b: 201, p0: [37.6, 1.25, 4.2], p1: [42.2, 1.2, 3.9], l0: [38.6, .75, 0], l1: [41.4, .75, 0] },
			{ a: 201, b: 208, p0: [80, 1.4, 4.6], p1: [80, 1.65, 7.4], l0: [80, 1, 0], l1: [80, 1.1, 0] },
			{ a: 208, b: 218, p0: [119.9, 1.3, 5.8], p1: [119.9, 2.4, 6.0], l0: [119.9, 1.2, 0], l1: [119.9, 2.2, 0] },
			{ a: 218, b: 225, p0: [122.4, 1.0, 2.9], p1: [122.4, 3.3, 2.9], l0: [121.5, 1.0, 0], l1: [121.5, 3.3, 0] },
			{ a: 225, b: 231, p0: [160, 3.7, 1.3], p1: [160, 2.7, .95], l0: [160, 0, 0], l1: [160, 0, 0] },
			{ a: 231, b: 236, p0: [121.6, 3.25, 2.1], p1: [121.6, 3.3, 3.4], l0: [121.4, 3.25, 0], l1: [121.4, 3.3, 0] },
		];
		const CUTS = [165, 170, 175, 185, 191, 201, 208, 218, 225, 231];

		return {
			scene, camera, ui, bloom: { strength: .55, radius: .5, threshold: .7 }, exposure: 1.05,
			fadeFn: lt => dips(lt + S, CUTS, .18) * .95,
			update(lt) {
				const t = lt + S;
				shots(camera, t, SH);
				R.tick(t);
				// transição de linhas caindo
				fallL.position.y = -ease.expoIn(seg(t, 158, 159.6)) * 6; fallM.opacity = .8 * (1 - seg(t, 158.4, 159.6)); fallL.visible = t < 159.7;
				R.warm.intensity = 14 * eo(t, 158.3, 160.5); R.wall.labels(eo(t, 159, 162) * (.5 + .5 * sm(t, 171, 173)));
				op(card2, inOut(t, 159.4, 160.8, 163.8, 164.8));
				op(hipn, inOut(t, 171.6, 172.6, 174.4, 175));
				// tokens
				tokens.forEach((k, i) => {
					const inK = eo(t, 176 + i * 1.4, 177 + i * 1.4), turbo = eo(t, 182.8, 183.8);
					k.g.position.y = 2.2 + (i === 1 ? .2 : 0) + Math.sin(t * .9 + i) * .06;
					k.g.scale.setScalar(Math.max(.001, inK * (1 + turbo)) * .75);
					op(k.m, inK); k.h.material.opacity = turbo * (.5 + .2 * Math.sin(t * 3 + i));
					k.g.lookAt(camera.position);
				});
				cue(U.t1, t, 176.4, 182.6); cue(U.t2, t, 177.8, 182.6); cue(U.t3, t, 179.2, 182.6);
				// gaveta abre
				const out = ease.cubicInOut(seg(t, 186, 188.6)) * .6; R.wall.open(HI, out);
				inner.material.opacity = sm(t, 186.4, 188.8) * (.7 + .1 * Math.sin(t * 4)); innerL.intensity = 4 * sm(t, 186.4, 188.8);
				op(ask, inOut(t, 188.4, 189.4, 190.4, 191));
				// desfile
				parade.forEach((c, i) => { const x = -6 + ((t - 191) * .75 + i * 1.5) % 13.5; c.position.set(x, .75 + Math.sin(t * 2 + i) * .03, -.4 + (i % 2) * .5); c.rotation.y = -.15; });
				cue(U.db, t, 191.6, 200.8); cue(U.ill, t, 194, 200.8); cue(U.day, t, 192.2, 200.8);
				U.day.textContent = 'dia ' + Math.min(7, 1 + Math.floor(seg(t, 192.5, 199.5) * 7));
				// grupo divide
				const sp = ease.cubicInOut(seg(t, 202.4, 204.6));
				grp.forEach((g, i) => { g.f.position.set(lerp(g.x0, g.side * (1.2 + .0), sp) + (sp > .5 ? 0 : 0), 0, lerp(g.z0, -g.row * .55 + 1, sp)); g.f.set({ t: t + i, breathe: 1 }); g.f.lookAt(camera.position.x, 0, camera.position.z); });
				spiral.material.uniforms.uTime.value = t; spiral.material.uniforms.uOpacity.value = sm(t, 204, 206) * .55;
				cue(U.sem, t, 204.4, 207.8); cue(U.com, t, 204.8, 207.8);
				// pilhas
				left.forEach((c, i) => { const k = eo(t, 208.6 + i * .35, 209.2 + i * .35); c.material.opacity = k; c.scale.setScalar(Math.max(.001, k)); });
				right.forEach((c, i) => { const k = eo(t, 208.6 + i * .35 + (i > 5 ? 2.6 : 0), 209.2 + i * .35 + (i > 5 ? 2.6 : 0)); c.material.opacity = k; c.scale.setScalar(Math.max(.001, k) * (1 + pulse(t, 208.9 + i * .35 + (i > 5 ? 2.6 : 0), .3) * .15)); });
				op(lab, eo(t, 208.4, 209.4)); op(labR, eo(t, 208.4, 209.4));
				cue(U.lg, t, 212.4, 217.8); cue(U.esq, t, 212, 217.8); cue(U.s1, t, 212.6, 217.8);
				// medidores de confiança — todos iguais
				meters.forEach((m, i) => { const k = eo(t, 218.6 + i * .2, 219.6 + i * .2) * .82; m.fg.scale.x = Math.max(.001, k); m.fg.visible = m.bg.visible = t > 218.3; m.fg.material.color.set(right[i].userData.bad ? C.emocao : '#9f96d8'); });
				cue(U.cf, t, 218.8, 224.8);
				// documento + carimbo
				doc.position.set(lerp(-3, 0, ease.expoOut(seg(t, 225.2, 226.6))), .005, 0);
				const st = seg(t, 227.6, 227.9); stmp.visible = t > 227.6; stmp.scale.setScalar(lerp(1.7, 1, ease.expoOut(st))); op(stmp, t > 227.6 ? .95 : 0);
				cue(U.s2, t, 228.2, 230.8);
				// gancho: confiança sobe enquanto o cartão fica vermelho
				const top = right[right.length - 1], tm = meters[meters.length - 1];
				if (t > 231) { const k = sm(t, 231.4, 235); tm.fg.scale.x = lerp(.82, 1, k); top.material.color.setRGB(1, lerp(1, .45, k), lerp(1, .5, k)); } else top.material.color.setRGB(1, 1, 1);
				cue(U.pq, t, 232.6, 235.9);
			},
		};
	},
};
