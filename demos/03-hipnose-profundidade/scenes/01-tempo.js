// 8,3–15,0 · "Dúvida muito comum… perder tempo aprofundando e aprofundando"
import { seg, ease } from '../lib.js';
import { shots } from '../world.js';
export default {
	id: 'perda-de-tempo', t0: 8.25, t1: 15,
	update(T, w) {
		const c = w.clock;
		if (T < 12.25) {
			c.g.visible = true;
			const e = ease.expoOut(seg(T, 8.25, 8.9));
			c.g.scale.setScalar(.6 + .4 * e); c.mats.forEach(m => m.opacity = e);
			c.g.position.set(0, .5, 0);
			const s = T - 8.25; c.min.rotation.z = -s * s * 1.6; c.hr.rotation.z = -s * s * .14;
		}
		if (T > 11.6) {
			w.tunnel.g.visible = true;
			w.tunnel.u.uOpacity.value = seg(T, 11.6, 12.4);
			const s = T - 11.6; w.tunnel.u.uScroll.value = s * s * 1.2 + s * 4;
		}
		w.spiral.u.uK.value = .55 * (1 - seg(T, 11.8, 12.4));
		w.head.g.visible = false;
		shots(w.camera, T, [
			{ t: 8.25, p: [0, .5, 6.5], l: [0, .5, 0], d: [0, 0, -.25], droll: .02 },
			{ t: 10.0, p: [1.6, -.4, 4.4], l: [0, .5, 0], d: [-.3, .05, -.15], tr: .5 },
			{ t: 11.7, p: [0, .5, .6], l: [0, .5, -20], tr: .55, droll: .25 },
			{ t: 13.5, p: [.3, .2, 1.2], l: [-.5, .3, -20], roll: .6, droll: -.3, tr: .5 },
		]);
	},
};
