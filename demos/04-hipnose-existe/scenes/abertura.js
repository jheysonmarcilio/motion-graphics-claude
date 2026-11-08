// Cenas 0–1 · a pergunta (palpável, mensurável, replicável) e quem a fez (Spiegel, Stanford, 2016)
import { seg, ease, lerp } from '../lib.js';
import { shots } from '../world.js';

// cópias da cabeça (para "replicável") — reaproveitadas no fim (cena 8)
export function copies(w, T, t0, t1 = 99) {
	const k = ease.expoOut(seg(T, t0, t0 + .6)) * (1 - ease.cubicInOut(seg(T, t1 - .4, t1)));
	w.head.copies.forEach((c, i) => {
		c.visible = k > .001; const s = i ? 1 : -1;
		c.position.set(s * 2.55, .5 - .15, -1.2); c.scale.setScalar(k * .92); c.rotation.set(0, -s * .35 + Math.sin(T * .35 + i) * .1, 0);
	});
}

export const s0 = {
	id: 'pergunta', t0: 0, t1: 5.95,
	update(T, w) {
		const hu = w.head.u; w.head.g.visible = true;
		w.spiral.u.uK.value = 1; w.spiral.u.uCy.value = .1;
		hu.uPulseR.value = T < 2.3 ? (T * 1.1) % 3.2 - .3 : (T - 2.3) * 3.2 - .3;        // palpável: pulso forte
		hu.uGlow.value = .05 + .1 * Math.exp(-Math.max(0, T - 2.35) * 3) * (T > 2.35);
		hu.uScanY.value = T > 3.1 && T < 4.4 ? lerp(1.7, -1.7, ease.cubicInOut(seg(T, 3.15, 4.2))) : -9;   // mensurável: varredura
		w.flash = .12 * Math.exp(-Math.max(0, T - 2.35) * 6) * (T > 2.35);
		copies(w, T, 4.35);                                                              // replicável
		shots(w.camera, T, [
			{ t: 0, p: [0, .95, 3.4], l: [0, .9, 0], d: [0, 0, .12] },
			{ t: 2.3, p: [1.7, .7, 5.6], l: [0, .45, 0], d: [-.25, 0, -.1], tr: .5 },
			{ t: 3.15, p: [-1.5, 1.3, 6.4], l: [0, .25, 0], d: [.2, -.1, -.1], tr: .5 },
			{ t: 4.35, p: [0, .1, 12.6], l: [0, -.55, 0], d: [0, 0, -.3], tr: .7 },
		]);
	},
};

export const s1 = {
	id: 'spiegel', t0: 5.95, t1: 14.9,
	update(T, w) {
		const hu = w.head.u, gl = w.globe;
		if (T < 8.2) {
			w.head.g.visible = true;
			hu.uPulseR.value = (T * 1.1) % 3.2 - .3;
			hu.uScatter.value = 3.5 * ease.expoIn(seg(T, 7.35, 8.2));
			w.head.g.rotation.y = -ease.cubicInOut(seg(T, 5.95, 7.6)) * .7;
			copies(w, T, -1, 6.6);
		}
		w.spiral.u.uK.value = lerp(1, .2, seg(T, 5.95, 7.8));
		if (T > 7.4) {                                                                  // globo
			gl.g.visible = true;
			const a = ease.expoOut(seg(T, 7.5, 8.6));
			gl.u.uOpacity.value = a; gl.g.position.set(0, 1.25, 0); gl.g.scale.setScalar(.6 + .4 * a);
			gl.g.rotation.set(.35, lerp(-2.4, .56, ease.cubicInOut(seg(T, 7.5, 11.1))) + (T - 11.1) * .02, 0);
			const drop = ease.backOut(seg(T, 11.1, 11.5));
			gl.stick.scale.set(1, Math.max(drop, 1e-3), 1); gl.stick.visible = T > 11.1;
			gl.u.uRipple.value = T > 11.2 ? Math.min(1.6, (T - 11.2) * 1.1) : 0;
			const tip = gl.pinPos.clone().multiplyScalar(1 + .5 / 1.6 * drop);
			w.glowAt(w.pin, tip.toArray(), drop * (.85 + .15 * Math.sin(T * 6)), .45);
		}
		w.flash = .3 * Math.exp(-Math.max(0, T - 13.6) * 5) * (T > 13.6);
		shots(w.camera, T, [
			{ t: 5.95, p: [0, .1, 12.6], l: [0, -.55, 0], d: [0, 0, -.6] },
			{ t: 6.6, p: [-2.4, 1.2, 6.8], l: [0, .5, 0], d: [.5, 0, -.1], tr: .6 },
			{ t: 7.7, p: [0, .1, 10.2], l: [0, .45, 0], d: [0, 0, -.12], tr: .8 },
			{ t: 11.1, p: [.6, .9, 8.4], l: [0, .75, 0], d: [-.1, 0, -.2], tr: .6 },
			{ t: 13.55, p: [.1, 1.9, 4.6], l: [0, 1.55, 0], d: [0, 0, -.5], tr: .5 },
		]);
	},
};
