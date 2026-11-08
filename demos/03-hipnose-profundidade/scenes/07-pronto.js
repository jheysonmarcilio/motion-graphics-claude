// 79,4–92,3 · "Se ele se imagina no lugar e sente sensações e sentimentos, está pronto"
import { seg, ease } from '../lib.js';
import { shots, C } from '../world.js';
export default {
	id: 'o-grande-ponto', t0: 79.4, t1: 92.3,
	update(T, w) {
		const hu = w.head.u; w.head.g.visible = true;
		w.spiral.u.uK.value = .4;
		hu.uOpacity.value = .3;
		hu.uScatter.value = 2.5 * (1 - ease.expoOut(seg(T, 79.4, 80.4)));
		hu.uPulseR.value = T > 89.3 ? (T - 89.3) * 3 - .2 : (T * 1.1) % 3.2 - .3;
		const ready = ease.expoOut(seg(T, 89.3, 89.8));
		hu.uGlow.value = .15 * ready;
		// lugar seguro dentro da mente
		w.island.g.visible = true; w.island.g.scale.setScalar(.36); w.island.g.position.set(0, .9, .05);
		w.island.u.uSize.value = .02;
		w.island.u.uGrow.value = ease.cubicInOut(seg(T, 80.8, 82.4)) * 1.1;
		w.island.u.uGlow.value = .35 * ease.expoOut(seg(T, 83.6, 86.4)) + .25 * ready;
		w.glowAt(w.sun, [.55, 1.9, -.6], ease.expoOut(seg(T, 81.5, 82.5)), 1.1);
		if (T > 89.2) {                                      // pronto: anel verde se expande
			const q = seg(T, 89.3, 90.9);
			w.gate.visible = true; w.gate.position.set(0, .7, 0); w.gate.scale.setScalar(.55 + q * 1.4);
			w.gateM.color.set(C.verde); w.haloM.color.set(C.verde); w.gateM.opacity = 1 - q; w.haloM.opacity = .3 * (1 - q);
		}
		shots(w.camera, T, [
			{ t: 79.4, p: [0, .2, 10.5], l: [0, -.3, 0], d: [0, 0, -.3] },
			{ t: 81.0, p: [2.6, 1.7, 4.4], l: [0, .9, 0], tr: .6, d: [-.15, 0, -.08] },
			{ t: 83.5, p: [0, .2, 9.4], l: [0, -.6, 0], tr: .6, d: [0, 0, -.15] },
			{ t: 86.4, p: [-2.6, .5, 8.6], l: [0, -.55, 0], tr: .6, d: [.2, 0, -.05] },
			{ t: 89.3, p: [0, .4, 9.2], l: [0, -.5, 0], tr: .6, d: [0, 0, -.4] },
		]);
	},
};
