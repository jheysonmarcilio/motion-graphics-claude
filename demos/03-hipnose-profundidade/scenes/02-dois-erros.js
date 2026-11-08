// 15,0–27,0 · "Às vezes já está no ponto e você continua… ou o oposto… as sugestões não funcionam"
import { seg, ease } from '../lib.js';
import { shots } from '../world.js';
export default {
	id: 'dois-erros', t0: 15, t1: 27,
	update(T, w) {
		if (T < 20.4) {
			const tu = w.tunnel.u; w.tunnel.g.visible = true;
			tu.uScroll.value = 27.47 + (T - 15) * 10;
			tu.uWarn.value = .75 * seg(T, 17.9, 18.8);
			tu.uOpacity.value = 1 - seg(T, 19.8, 20.4);
			const gz = 1 - (17.6 - T) * 10;          // o portal "PONTO" passa pela câmera em 17,6 s… e você continua
			if (gz < 2.5) { w.gate.visible = true; w.gate.position.set(0, 0, gz); w.gateM.opacity = seg(gz, -25, -12); w.haloM.opacity = .25 * w.gateM.opacity; }
		}
		const headOn = T > 19.6;
		w.spiral.u.uK.value = headOn ? .35 * seg(T, 19.6, 20.5) : 0;
		if (headOn) {
			const hu = w.head.u; w.head.g.visible = true;
			hu.uScatter.value = 2.5 * (1 - ease.expoOut(seg(T, 19.6, 20.8)));
			hu.uPulseR.value = (T * 1.1) % 3.2 - .3;
			hu.uWarn.value = .22 * seg(T, 21.4, 22.0);     // raso demais
			hu.uOpacity.value = .42 - .12 * seg(T, 21.4, 22.0);
			if (T > 23.0) {                                   // sugestões batem e voltam
				const EM = [-2.8, .9, 2.4];
				w.glowAt(w.emitter, EM, ease.expoOut(seg(T, 23.0, 23.5)));
				const hit = w.emitWaves(T, { from: EM, to: [-.35, .9, .6], t0: 23.2, t1: 27, period: .9, travel: 1.0, mode: 'bounce' });
				hu.uWarn.value = Math.max(hu.uWarn.value, .6 * Math.exp(-hit * 4));
			}
		}
		shots(w.camera, T, [
			{ t: 15, p: [.3, .2, 1.2], l: [-.5, .3, -20], roll: .15, droll: -.06 },
			{ t: 17.45, p: [0, 0, 1.0], l: [0, 0, -20], roll: 0, tr: .3, droll: .18 },
			{ t: 19.7, p: [0, .6, 7.8], l: [0, .4, 0], tr: .7, d: [0, 0, -.2] },
			{ t: 21.4, p: [-1.6, 1.9, 5.0], l: [0, .5, 0], tr: .6, d: [.15, -.05, -.1] },
			{ t: 23.4, p: [3.4, 1.0, 6.6], l: [-.9, .6, 0], tr: .7, d: [-.12, 0, -.12] },
			{ t: 25.4, p: [-.6, .9, 4.6], l: [-.4, .7, 0], tr: .6, d: [0, 0, -.15] },
		]);
	},
};
