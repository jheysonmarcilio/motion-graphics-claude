// Cenas 5–7 · as três descobertas: atenção focada, menos conexão com o sistema crítico, sincronia sensorial-emocional
import { seg, ease, lerp } from '../lib.js';
import { shots, C, REG } from '../world.js';

const headGhost = (w, T, o = .1) => { w.head.g.visible = true; w.head.u.uOpacity.value = o; w.head.u.uPulseR.value = (T * .8) % 3.2 - .3; };
const brainOn = w => { w.brain.g.visible = true; w.brain.pts.visible = true; };

export const s5 = {
	id: 'atencao', t0: 40.07, t1: 49.6,
	update(T, w) {
		headGhost(w, T, .12); brainOn(w);
		w.spiral.u.uK.value = .3;
		const b = w.brain.u;
		b.uDim.value = .3 + .4 * ease.cubicInOut(seg(T, 41.6, 42.6));
		b.uR.value.x = ease.expoOut(seg(T, 41.9, 42.9)) * (1 + .25 * seg(T, 44.6, 45.4)) * (.9 + .1 * Math.sin(T * 5));
		shots(w.camera, T, [
			{ t: 40.07, p: [0, 1.58, 4.3], l: [0, 1.28, 0], d: [.12, 0, -.1], tr: .5 },
			{ t: 41.7, p: [3.3, 1.78, 1.4], l: [0, 1.28, 0], d: [-.05, .02, .15], tr: .7 },
			{ t: 44.6, p: [2.0, 2.13, 2.9], l: [0, 1.33, .2], d: [-.15, 0, -.1], tr: .6 },
			{ t: 47.6, p: [-1.6, 2.58, 3.4], l: [0, 1.28, 0], d: [.3, -.05, -.05], tr: .7 },
		]);
		const acc = w.brainWorld(REG.acc);
		w.tags.push({ pos: acc, text: 'CÓRTEX CINGULADO', sub: 'ANTERIOR', color: C.sinapse, a: ease.expoOut(seg(T, 42.0, 42.6)) * (1 - seg(T, 49.2, 49.55)), side: 'left', len: 170, ang: -28 });
		// foco: anéis convergem sobre o cingulado anterior
		const k = ease.expoOut(seg(T, 44.6, 45.2)) * (1 - seg(T, 49.1, 49.55));
		w.focus.forEach((r, i) => {
			const ph = ((T - 44.6) * .75 + i / 4) % 1;
			r.visible = k > .001 && T > 44.6; r.position.copy(acc); r.quaternion.copy(w.camera.quaternion);
			r.scale.setScalar(lerp(1.5, .06, ease.cubicInOut(ph))); r.material.opacity = Math.sin(ph * Math.PI) * k;
		});
		w.glowAt(w.nodes[3], REG.acc, .6 * k + .25 * b.uR.value.x, .4);
		w.bloom.strength = .75 + .2 * k;
	},
};

export const s6 = {
	id: 'critico', t0: 49.6, t1: 63.5,
	update(T, w) {
		headGhost(w, T, .1); brainOn(w);
		w.spiral.u.uK.value = .25;
		const b = w.brain.u, c = w.conn.u;
		w.conn.g.visible = true;
		c.uGrow.value = ease.cubicInOut(seg(T, 49.65, 50.4));
		const weak = ease.cubicInOut(seg(T, 50.6, 52.0)), brk = ease.cubicInOut(seg(T, 60.3, 62.0));
		c.uOpacity.value = lerp(.85, .5, weak) * (1 - .55 * brk);
		c.uWarm.value = weak; c.uFlow.value = lerp(.6, .18, weak);
		c.uBreak.value = .18 * weak + .55 * brk;
		b.uDim.value = .55;
		b.uR.value.y = ease.expoOut(seg(T, 51.7, 52.4)) * .9;                                        // pré-frontal
		b.uR.value.z = ease.expoOut(seg(T, 53.7, 54.4)) * (.8 + .5 * ease.expoOut(seg(T, 56.4, 57)) * (1 - .6 * brk));  // cingulado posterior / sistema crítico
		const pcc = [REG.pcc[0] - .06, REG.pcc[1], REG.pcc[2]];
		w.glowAt(w.nodes[0], REG.pfc, .4 + .5 * b.uR.value.y, .34);
		w.glowAt(w.nodes[1], pcc, .3 + .6 * b.uR.value.z * (.8 + .2 * Math.sin(T * 6)), .34);
		shots(w.camera, T, [
			{ t: 49.6, p: [-1.2, 2.18, 4.2], l: [0, 1.33, 0], d: [-.3, 0, -.2], tr: .6 },
			{ t: 51.6, p: [-3.9, 2.08, .9], l: [0, 1.28, .05], d: [0, 0, -.12], tr: .7 },
			{ t: 53.6, p: [-3.6, 2.28, -.7], l: [0, 1.28, -.1], d: [0, -.03, -.1], tr: .6 },
			{ t: 56.4, p: [-2.4, 2.88, -2.0], l: [0, 1.33, -.2], d: [-.2, 0, .1], tr: .6 },
			{ t: 58.3, p: [-3.8, 1.88, .6], l: [0, 1.18, 0], d: [0, 0, -.1], tr: .7 },
			{ t: 60.3, p: [-3.1, 1.58, .3], l: [0, 1.33, -.05], d: [-.1, .02, .05], tr: .5 },
		]);
		w.tags.push({ pos: w.brainWorld(REG.pfc), text: 'PRÉ-FRONTAL', color: C.sol, a: ease.expoOut(seg(T, 51.75, 52.3)) * (1 - seg(T, 58.0, 58.3)), side: 'right', len: 130, ang: -35 });
		w.tags.push({ pos: w.brainWorld(pcc), text: 'CINGULADO', sub: 'POSTERIOR', color: C.emocao, a: ease.expoOut(seg(T, 53.75, 54.3)) * (1 - seg(T, 58.0, 58.3)), side: 'left', len: 130, ang: -35 });
	},
};

export const s7 = {
	id: 'sincronia', t0: 63.5, t1: 76.57,
	update(T, w) {
		const b = w.brain.u, s = w.sync.u, cmp = ease.expoInOut(seg(T, 72.75, 73.6));
		brainOn(w);
		w.spiral.u.uK.value = .25 + .4 * seg(T, 68.5, 71.4) * (1 - cmp);
		if (cmp < 1) headGhost(w, T, lerp(.08, .32, ease.cubicInOut(seg(T, 68.6, 70))) * (1 - cmp));
		w.head.u.uGlow.value = .12 * seg(T, 70, 71.5);
		b.uDim.value = .5 * (1 - seg(T, 68.5, 70.5));
		b.uR.value.w = ease.expoOut(seg(T, 65.55, 66.2));
		b.uEmo.value = ease.expoOut(seg(T, 66.95, 67.6));
		b.uSync.value = ease.cubicInOut(seg(T, 65.6, 68.2));
		b.uVivid.value = .7 * ease.cubicInOut(seg(T, 68.5, 71.4)) + .3 * Math.exp(-Math.max(0, T - 71.45) * 2) * (T > 71.45);
		b.uR.value.x = .5 * seg(T, 69, 71);
		w.sync.g.visible = T > 66.9; s.uGrow.value = ease.cubicInOut(seg(T, 66.9, 67.6)); s.uBeat.value = b.uSync.value; s.uFlow.value = .35; s.uOpacity.value = .9 * (1 - cmp);
		w.flash = .35 * Math.exp(-Math.max(0, T - 71.45) * 4) * (T > 71.45);
		w.bloom.strength = .7 + .15 * seg(T, 68.5, 71.4) * (1 - cmp * .5);
		shots(w.camera, T, [
			{ t: 63.5, p: [-1.6, 1.68, 5.4], l: [0, 1.43, 0], d: [-.25, 0, -.1], tr: .6 },
			{ t: 65.5, p: [-5.0, 1.58, 1.3], l: [0, 1.23, -.1], d: [0, 0, -.15], tr: .7 },
			{ t: 68.5, p: [-3.2, 2.18, 4.1], l: [0, 1.28, 0], d: [.3, 0, -.1], tr: .7 },
			{ t: 71.4, p: [0, 1.63, 5.4], l: [0, 1.13, 0], d: [0, 0, -.25], tr: .5 },
			{ t: 72.9, p: [0, .55, 8.0], l: [0, .25, 0], d: [0, 0, -.18], tr: .8 },
		]);
		// comparação: com hipnose (vivo) × sem hipnose (cinza)
		if (cmp > 0) {
			w.brain.g.position.set(lerp(0, -.88, cmp), lerp(1.33, .5, cmp), lerp(-.1, 0, cmp));
			w.brain.g.scale.setScalar(lerp(.98, .78, cmp)); w.brain.g.rotation.y = lerp(0, .5, cmp) + Math.sin(T * .5) * .15;
			const b2 = w.brain2; b2.g.visible = true;
			b2.g.position.set(lerp(3.2, .88, cmp), .5, 0); b2.g.scale.setScalar(.78); b2.g.rotation.y = -.5 + Math.sin(T * .5 + 1) * .15;
			b2.u.uGrey.value = 1; b2.u.uDim.value = .45; b2.u.uOpacity.value = cmp;
			const la = w.project(w.brainWorld([0, -.55, 0])), lb = w.project(w.brainWorld([0, -.55, 0], b2.g));
			const ga = ease.expoOut(seg(T, 73.4, 73.9)) * (1 - seg(T, 76.2, 76.55));
			w.ui.groups = [
				{ a: ga, x: la.x, y: la.y + 10, text: 'EM HIPNOSE', sub: 'MAIS SINCRONIA', color: C.sinapse },
				{ a: ga, x: lb.x, y: lb.y + 10, text: 'SEM HIPNOSE', sub: 'BASAL', color: C.eco },
			];
		}
		const ta = 1 - seg(T, 72.5, 72.9);
		if (T < 72.9) {
			w.tags.push({ pos: w.brainWorld(REG.sens), text: 'SENSORIAIS', color: C.verde, a: ease.expoOut(seg(T, 65.6, 66.2)) * ta * (1 - seg(T, 68.3, 68.6)), side: 'left', len: 120, ang: -40 });
			w.tags.push({ pos: w.brainWorld(REG.emo), text: 'EMOCIONAIS', color: C.emocao, a: ease.expoOut(seg(T, 67.0, 67.6)) * ta * (1 - seg(T, 68.3, 68.6)), side: 'right', len: 120, ang: 30 });
		}
	},
};
