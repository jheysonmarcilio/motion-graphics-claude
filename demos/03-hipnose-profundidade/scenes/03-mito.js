// 27,0–36,6 · "Não existe aprofundamento especial, técnica, indução específica…"
// (nomes das cartas = exemplos ilustrativos de aprofundamentos comuns)
import { seg, ease } from '../lib.js';
import { shots } from '../world.js';
const POS = [[-.45, 2.35, 0], [.45, 1.45, -.3], [-.42, .5, -.1], [.45, -.5, -.4], [-.42, -1.45, -.2], [.45, -2.4, -.5]];
const XT = [30.6, 30.9, 31.2, 32.7, 33.0, 33.3];
export default {
	id: 'mito', t0: 27, t1: 36.6,
	update(T, w) {
		w.cardG.visible = true;
		w.spiral.u.uK.value = .25 + .45 * seg(T, 34.4, 36.6);
		w.cards.forEach((c, i) => {
			const tin = 27.2 + i * .16, e = ease.expoOut(seg(T, tin, tin + .6));
			const xt = XT[i], x = ease.expoOut(seg(T, xt, xt + .25)), fall = ease.expoIn(seg(T, xt + .5, xt + 1.6));
			const [px, py, pz] = POS[i];
			c.visible = e > .001 && fall < 1;
			c.position.set(px + Math.sin(T * .8 + i) * .05, py + Math.sin(T * 1.1 + i * 2) * .06 - fall * 4, pz - (1 - e) * 2);
			c.rotation.set(Math.sin(T * .6 + i) * .12 + fall * 1.2, Math.sin(T * .5 + i * 1.3) * .25 - px * .3, (i % 2 ? -.06 : .06) + fall * (i % 2 ? 1 : -1) * 1.4);
			c.scale.setScalar((.55 + .2 * e) * (1 + x * .1 * (1 - seg(T, xt + .25, xt + .5))));
			c.material.opacity = e * (1 - fall);
			c.userData.x.material.opacity = x * (1 - fall); c.userData.x.scale.setScalar(1.6 - .6 * x);
		});
		shots(w.camera, T, [
			{ t: 27, p: [0, 0, 10.5], l: [0, 0, 0], d: [0, 0, -.4] },
			{ t: 29.2, p: [0, 1.9, 6.2], l: [0, 1.5, 0], tr: .6, d: [0, -.15, -.1] },
			{ t: 31.9, p: [0, -1.4, 6.2], l: [0, -1.4, 0], tr: .6, d: [0, -.12, -.1] },
			{ t: 34.4, p: [0, .3, 9.0], l: [0, .3, 0], tr: .7, d: [0, 0, .25] },
		]);
	},
};
