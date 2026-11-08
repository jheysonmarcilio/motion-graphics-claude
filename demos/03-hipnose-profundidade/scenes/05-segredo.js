// 47,6–63,0 · "Padronize uma sugestão… sempre que ele responde, está pronto… o que eu ensino é…"
import { seg, ease } from '../lib.js';
import { shots } from '../world.js';
const EM = [-2.7, .9, 2.2];
export default {
	id: 'o-segredo', t0: 47.6, t1: 63,
	update(T, w) {
		const hu = w.head.u; w.head.g.visible = true;
		w.spiral.u.uK.value = .45;
		hu.uScatter.value = 2.5 * (1 - ease.expoOut(seg(T, 47.6, 48.6))) + 3.5 * ease.expoIn(seg(T, 61.9, 63.0));
		let hit = 99;
		if (T > 49.4 && T < 57.2) {
			w.glowAt(w.emitter, EM, ease.expoOut(seg(T, 49.4, 49.9)) * (1 - seg(T, 56.8, 57.2)));
			hit = w.emitWaves(T, { from: EM, to: [-.2, .9, .5], t0: 49.8, t1: 56.0, period: .95, travel: .9 });
		}
		hu.uPulseR.value = hit < 1.2 ? hit * 3.2 - .2 : (T * 1.1) % 3.2 - .3;
		hu.uGlow.value = .25 * Math.exp(-hit * 3) + .2 * ease.expoOut(seg(T, 54.2, 54.8)) * (1 - seg(T, 56.8, 57.4));
		if (T > 57.0 && T < 60.6) w.orbs.forEach((o, i) => {          // qualquer sugestão serve
			const a = T * 1.4 + i * 2.094, k = ease.expoOut(seg(T, 57.0 + i * .2, 57.6 + i * .2)) * (1 - seg(T, 60.1, 60.6));
			w.glowAt(o, [Math.cos(a) * 2.1, .9 + Math.sin(a * 1.3) * .4, Math.sin(a) * 2.1], k);
		});
		shots(w.camera, T, [
			{ t: 47.6, p: [0, .7, 8.6], l: [0, .4, 0], d: [0, 0, -.25] },
			{ t: 49.5, p: [-4.6, 1.3, 5.6], l: [-1.3, .8, .6], tr: .6, d: [.12, 0, -.08] },
			{ t: 52.0, p: [1.4, 1.1, 4.0], l: [-.6, .8, .5], tr: .6, d: [-.08, 0, -.06] },
			{ t: 54.2, p: [0, .6, 5.6], l: [0, .55, 0], tr: .6, d: [0, 0, -.2] },
			{ t: 57.2, p: [0, 3.8, 7.2], l: [0, .4, 0], tr: .7, d: [.35, -.12, 0] },
			{ t: 60.0, p: [0, 1.0, 4.6], l: [0, .95, 0], tr: .6, d: [0, 0, -1.1] },
		]);
	},
};
