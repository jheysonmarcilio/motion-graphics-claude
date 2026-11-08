// Cenas 8–9 · "estado neurofuncional real, mensurável e replicável" → "a hipnose existe"
// Termina no mesmo enquadramento do 1º quadro (loop do Short).
import { seg, ease, lerp } from '../lib.js';
import { shots, REG } from '../world.js';
import { copies } from './abertura.js';

const CHECKS = [79.3, 80.3, 81.3];

export const s8 = {
	id: 'conclusao', t0: 76.57, t1: 83.3,
	update(T, w) {
		const hu = w.head.u, b = w.brain.u, back = ease.expoInOut(seg(T, 76.57, 77.5));
		w.head.g.visible = true; hu.uOpacity.value = .32 * ease.cubicInOut(seg(T, 76.8, 77.8)) + .1 * seg(T, 81.3, 82.2);
		hu.uPulseR.value = (T * 1.1) % 3.2 - .3;
		w.spiral.u.uK.value = .35 + .3 * seg(T, 81.3, 83);
		w.brain.g.visible = true; w.brain.pts.visible = true;
		w.brain.g.position.set(lerp(-.88, 0, back), lerp(.5, 1.33, back), lerp(0, -.1, back));
		w.brain.g.scale.setScalar(lerp(.78, .98, back));
		b.uSync.value = 1; b.uR.value.set(.5, .3, 0, .6); b.uEmo.value = .6; b.uVivid.value = .4;
		if (back < 1) { const b2 = w.brain2; b2.g.visible = true; b2.g.position.set(lerp(.88, 3.4, back), .5, 0); b2.g.scale.setScalar(.78); b2.u.uGrey.value = 1; b2.u.uDim.value = .45; b2.u.uOpacity.value = 1 - back; }
		let wave = -9, fl = 0;
		for (const t of CHECKS) if (T > t) { wave = lerp(-1.3, 1.3, seg(T, t, t + .6)); fl = .18 * Math.exp(-(T - t) * 5); }
		b.uWave.value = wave; w.flash = fl; hu.uGlow.value = fl * .8;
		copies(w, T, 81.3);
		w.bloom.strength = .8;
		shots(w.camera, T, [
			{ t: 76.57, p: [0, 1.78, 5.6], l: [0, 1.23, 0], d: [.15, 0, -.15], tr: .9 },
			{ t: 79.3, p: [1.9, 1.38, 6.6], l: [0, 0.83, 0], d: [-.2, 0, -.1], tr: .6 },
			{ t: 80.3, p: [-1.9, 1.78, 6.4], l: [0, 0.83, 0], d: [.2, 0, -.1], tr: .6 },
			{ t: 81.3, p: [0, .1, 12.6], l: [0, -.55, 0], d: [0, 0, -.25], tr: .7 },
		]);
	},
};

export const s9 = {
	id: 'existe', t0: 83.3, t1: 88.36,
	update(T, w) {
		const hu = w.head.u, b = w.brain.u;
		w.head.g.visible = true;
		hu.uOpacity.value = .34;
		hu.uPulseR.value = T > 86.4 ? (T - 86.4) * 2.6 - .3 : (T * 1.1) % 3.2 - .3;
		hu.uGlow.value = .05 + .25 * Math.exp(-Math.max(0, T - 86.4) * 2.5) * (T > 86.4);
		const bo = 1 - ease.cubicInOut(seg(T, 83.3, 85.2));
		if (bo > .001) { w.brain.g.visible = true; w.brain.pts.visible = true; b.uOpacity.value = bo; b.uSync.value = 1; b.uR.value.set(.5, .3, 0, .6); b.uEmo.value = .6; b.uVivid.value = .4; }
		copies(w, T, -1, 83.75);
		w.spiral.u.uK.value = lerp(.65, 1, seg(T, 83.3, 86)); w.spiral.u.uCy.value = .1;
		w.flash = .5 * Math.exp(-Math.max(0, T - 86.4) * 4) * (T > 86.4);
		w.bloom.strength = .75 + .25 * Math.exp(-Math.max(0, T - 86.4) * 2) * (T > 86.4);
		shots(w.camera, T, [
			{ t: 83.3, p: [-1.5, 1.3, 6.4], l: [0, .3, 0], d: [.2, -.1, -.12], tr: .6 },
			{ t: 84.9, p: [1.6, .5, 6.0], l: [0, .4, 0], d: [-.22, .03, -.15], tr: .6 },
			{ t: 86.4, p: [0, .6, 7.6], l: [0, .45, 0], d: [0, .1, -1.3], tr: .4 },
			{ t: 87.25, p: [0, .95, 3.53], l: [0, .9, 0], d: [0, 0, -.12], tr: .9 },
		]);
	},
};
