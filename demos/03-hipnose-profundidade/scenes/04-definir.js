// 36,6–47,6 · "Você precisa definir qual é o ponto… a partir dele, o processo terapêutico"
import * as THREE from 'three';
import { seg, ease } from '../lib.js';
import { shots, C } from '../world.js';
const scroll = T => { const go = Math.max(0, T - 42.2); return (T - 36.6) * 1.6 + go * go * .81; };
const cA = new THREE.Color(C.sinapse), cG = new THREE.Color(C.verde);
export default {
	id: 'definir-o-ponto', t0: 36.6, t1: 47.6,
	update(T, w) {
		const tu = w.tunnel.u; w.tunnel.g.visible = true;
		tu.uOpacity.value = seg(T, 36.6, 37.3);
		tu.uScroll.value = scroll(T);
		w.spiral.u.uK.value = 0;
		if (T > 39.6) {                                  // o portal: ponto definido, preso ao túnel
			const gz = -14 + scroll(T) - scroll(39.6);
			if (gz < 2.5) {
				const e = ease.expoOut(seg(T, 39.6, 40.4));
				w.gate.visible = true; w.gate.position.set(0, 0, gz); w.gate.scale.setScalar(1.7 - .7 * e);
				w.gateM.opacity = e; w.haloM.opacity = .22 * e + .15 * Math.max(0, Math.sin(T * 5)) * e;
			}
		}
		const passed = ease.expoOut(seg(T, 45.0, 45.8));    // atravessou: zona terapêutica
		tu.uColA.value.lerpColors(cA, cG, passed);
		w.flash = T > 44.85 ? seg(T, 44.85, 45.0) * Math.exp(-Math.max(0, T - 45) * 4) * .6 : 0;
		shots(w.camera, T, [
			{ t: 36.6, p: [0, .3, 10], l: [0, 0, -10], d: [0, 0, -.7] },
			{ t: 39.4, p: [1.4, 1.1, 2.2], l: [0, 0, -14], tr: .6, d: [-.1, -.08, 0] },
			{ t: 42.2, p: [0, 0, 1.0], l: [0, 0, -20], tr: .6, droll: .12 },
			{ t: 45.3, p: [.2, -.3, 1.2], l: [0, .2, -20], roll: .4, tr: .4, droll: -.15 },
		]);
	},
};
