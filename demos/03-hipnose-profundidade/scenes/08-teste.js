// 92,3–112,4 · "Faça esse teste: leve ao lugar seguro… pronto para qualquer protocolo, inclusive regressão de memória"
// Termina no mesmo enquadramento do 1º quadro (loop do Short).
import { seg, ease } from '../lib.js';
import { shots, C } from '../world.js';
export default {
	id: 'o-teste', t0: 92.3, t1: 112.4,
	update(T, w) {
		const hu = w.head.u;
		if (T < 98.3 || T > 106.8) {
			w.head.g.visible = true;
			hu.uScatter.value = (T < 100 ? 3.5 * ease.expoIn(seg(T, 97.5, 98.3)) : 0) + (T > 106.8 ? 2.5 * (1 - ease.expoOut(seg(T, 106.8, 108.0))) : 0);
			hu.uPulseR.value = T > 107.2 && T < 109 ? (T - 107.2) * 3 - .2 : (T * 1.1) % 3.2 - .3;
			hu.uGlow.value = T > 107.2 ? .15 * Math.exp(-(T - 107.2) * 1.5) : 0;
		}
		if (T > 97.8 && T < 107.4) {
			w.island.g.visible = true; w.island.g.rotation.y = (T - 97.8) * .12;
			w.island.u.uGrow.value = ease.cubicInOut(seg(T, 97.8, 99.4)) * 1.1 * (1 - seg(T, 106.6, 107.4));
			w.glowAt(w.sun, [1.6, 2.6, -1.8], seg(T, 98.6, 99.4) * (1 - seg(T, 106.6, 107.2)));
			w.island.u.uGlow.value = .4 * ease.expoOut(seg(T, 102.3, 103.2));
		}
		if (T > 107.1 && T < 109) {
			const q = seg(T, 107.2, 108.8);
			w.gate.visible = true; w.gate.position.set(0, .7, 0); w.gate.scale.setScalar(.55 + q * 1.4);
			w.gateM.color.set(C.verde); w.haloM.color.set(C.verde); w.gateM.opacity = 1 - q; w.haloM.opacity = .3 * (1 - q);
		}
		w.spiral.u.uK.value = .4 + .6 * seg(T, 107, 112.4);
		w.spiral.u.uCy.value = .1;
		shots(w.camera, T, [
			{ t: 92.3, p: [0, .4, 8.6], l: [0, .1, 0], d: [.2, 0, -.2] },
			{ t: 95.3, p: [-2.2, 2.0, 5.8], l: [0, .4, 0], tr: .6, d: [.1, -.1, -.1] },
			{ t: 98.2, p: [0, 4.6, 9.6], l: [0, .2, 0], tr: .7, d: [.3, -.1, -.15] },
			{ t: 100.4, p: [4.8, 2.2, 8.6], l: [0, -.5, 0], tr: .7, d: [-.25, 0, -.05] },
			{ t: 102.6, p: [-4.8, 2.8, 8.4], l: [0, -.5, 0], tr: .7, d: [.2, -.05, -.05] },
			{ t: 104.6, p: [0, 5.4, 9.4], l: [0, -.6, 0], tr: .7, d: [0, -.1, -.2] },
			{ t: 107.2, p: [0, .6, 7.4], l: [0, .4, 0], tr: .7, d: [0, 0, -.4] },
			{ t: 110.0, p: [0, .95, 4.4], l: [0, .9, 0], tr: .7, d: [0, 0, -.42] },
		]);
	},
};
