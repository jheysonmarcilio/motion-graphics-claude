// 63,0–79,4 · "…o lugar seguro: protege você e o cliente; exige profundidade para imaginar e sentir"
import { seg, ease } from '../lib.js';
import { shots } from '../world.js';
export default {
	id: 'lugar-seguro', t0: 63, t1: 79.4,
	update(T, w) {
		w.island.g.visible = true; w.island.g.rotation.y = Math.sin(T * .2) * .2;
		w.spiral.u.uK.value = .3;
		w.island.u.uGrow.value = ease.cubicInOut(seg(T, 63.0, 65.2)) * 1.1;
		w.flash = Math.exp(-(T - 63) * 3) * .55;
		w.glowAt(w.sun, [1.6, 2.6, -1.8], ease.expoOut(seg(T, 64.0, 65.0)) * (.85 + .15 * Math.sin(T * 2)) + .3 * seg(T, 77.2, 78));
		const sh = ease.expoOut(seg(T, 66.0, 67.4));        // escudo: protege
		w.shield.visible = sh > .001; w.shield.material.opacity = sh * .5 * (1 - .4 * seg(T, 71.4, 72.4)); w.shield.scale.setScalar(1.6 - .6 * sh);
		const two = ease.expoOut(seg(T, 68.6, 69.2));       // você e o cliente
		w.glowAt(w.dotA, [.5, .4, .55], two); w.glowAt(w.dotB, [-.1, .4, .8], two);
		w.island.u.uGlow.value = .25 * ease.expoOut(seg(T, 74.4, 75.2)) + .5 * ease.expoOut(seg(T, 77.2, 78.0));
		shots(w.camera, T, [
			{ t: 63, p: [0, 5.5, 9.5], l: [0, .3, 0], d: [.3, -.25, -.25] },
			{ t: 66.0, p: [6, 2.2, 6], l: [0, .6, 0], tr: .7, d: [-.25, 0, .1] },
			{ t: 68.6, p: [-4.6, 2.8, 6.4], l: [0, .5, 0], tr: .7, d: [.2, 0, -.1] },
			{ t: 71.4, p: [0, -3.0, 8.6], l: [0, -.2, 0], tr: .7, d: [0, .15, 0] },
			{ t: 74.4, p: [-2.2, 2.2, 4.2], l: [-.35, 1.25, 0], tr: .6, d: [.12, 0, -.05] },
			{ t: 77.2, p: [2.2, 1.2, 5.0], l: [0, .7, 0], tr: .6, d: [-.1, .05, -.1] },
		]);
	},
};
