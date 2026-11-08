// 0,0–8,3 · "Como saber se o meu cliente está profundo o suficiente…?"
import { seg, ease } from '../lib.js';
import { shots } from '../world.js';
export default {
	id: 'pergunta', t0: 0, t1: 8.25,
	update(T, w) {
		w.head.g.visible = true;
		w.spiral.u.uK.value = 1; w.spiral.u.uCy.value = .1;
		w.head.u.uPulseR.value = (T * 1.1) % 3.2 - .3;
		w.head.u.uGlow.value = .05;
		shots(w.camera, T, [
			{ t: 0, p: [0, .95, 3.4], l: [0, .9, 0], d: [0, 0, .12] },
			{ t: 1.9, p: [1.7, .3, 6.6], l: [0, .3, 0], d: [-.25, 0, 0], tr: .7 },
			{ t: 3.6, p: [-1.4, 1.7, 5.2], l: [0, .4, 0], d: [.2, -.12, -.1], tr: .6 },
			{ t: 5.6, p: [0, -.1, 8.6], l: [0, .15, 0], d: [0, 0, -.35], tr: .7 },
		]);
	},
};
