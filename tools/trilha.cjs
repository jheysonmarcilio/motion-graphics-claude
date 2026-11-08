// Trilha de fundo procedural, por clima. Determinística (seed).
// Uso como módulo: require('./trilha.cjs').trilha(DUR, [[t, 'clima'], ...], { bpm, seed }) → [L, R] Float32Array
// Climas: misterio, investigacao, tensao, descoberta, humor, sonho, triunfo, calmo
'use strict';
const { SR, SVF, freeverb, mulberry32 } = require('./sfx-lib.js');
const TAU = Math.PI * 2, hz = m => 440 * Math.pow(2, (m - 69) / 12);

// acordes em MIDI (1 por compasso, repete em ciclo)
const MOODS = {
	misterio:     { ch: [[57, 60, 64, 71], [53, 57, 60, 64], [50, 53, 57, 64], [52, 56, 59, 64]], pad: .9, cut: 900,  bass: 'long', arp: 'sparse', drum: 'none', bright: .3 },
	investigacao: { ch: [[57, 60, 64], [57, 60, 64], [53, 57, 60], [55, 59, 62]],                pad: .6, cut: 1300, bass: 'eighth', arp: 'pulse', drum: 'soft', bright: .5 },
	tensao:       { ch: [[45, 57, 58, 64], [45, 56, 60, 63], [45, 57, 58, 64], [44, 56, 59, 62]], pad: 1,  cut: 700,  bass: 'drone', arp: 'none', drum: 'heart', bright: .2 },
	descoberta:   { ch: [[53, 57, 60, 64], [48, 55, 60, 64], [55, 59, 62, 67], [57, 60, 64, 69]], pad: .7, cut: 2200, bass: 'quarter', arp: 'run', drum: 'half', bright: .8 },
	humor:        { ch: [[48, 52, 55], [43, 50, 53, 59], [48, 52, 55], [53, 57, 60]],            pad: .5, cut: 1600, bass: 'bounce', arp: 'stacc', drum: 'tick', bright: .7 },
	sonho:        { ch: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]], pad: 1,  cut: 1500, bass: 'long', arp: 'twinkle', drum: 'none', bright: .6 },
	triunfo:      { ch: [[48, 55, 60, 64], [43, 50, 55, 59], [45, 52, 57, 60], [41, 48, 53, 57]], pad: .9, cut: 3000, bass: 'quarter', arp: 'run', drum: 'full', bright: 1 },
	calmo:        { ch: [[48, 52, 55, 59], [53, 57, 60, 64]],                                    pad: .8, cut: 1100, bass: 'long', arp: 'none', drum: 'none', bright: .4 },
};

function trilha(DUR, cues, { bpm = 96, seed = 1, xf = 1.6, tail = 2 } = {}) {
	const n = Math.ceil(DUR * SR), L = new Float32Array(n), R = new Float32Array(n), rng = mulberry32(seed);
	const beat = 60 / bpm, bar = beat * 4;
	// peso de cada clima no tempo t (crossfade suave entre cues)
	const w = (k, t) => { const a = cues[k][0], b = k + 1 < cues.length ? cues[k + 1][0] : DUR + 99; const s = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x); return s((t - a + xf / 2) / xf) * (1 - s((t - b + xf / 2) / xf)); };
	const master = t => Math.min(1, t / 1.2, Math.max(0, (DUR - t) / tail));
	const put = (buf, t0, gain, pan, k) => { // escreve nota ponderada pelo clima k
		const s0 = Math.floor(t0 * SR), gl = Math.cos((pan + 1) * Math.PI / 4) * gain, gr = Math.sin((pan + 1) * Math.PI / 4) * gain;
		for (let i = 0; i < buf.length; i++) { const j = s0 + i; if (j < 0 || j >= n) continue; const e = w(k, j / SR) * master(j / SR); if (!e) continue; L[j] += buf[i] * gl * e; R[j] += buf[i] * gr * e; }
	};
	const synth = (f, dur, { att = .01, dec = 3, wave = 'tri', cut = 4000, det = 0, rel = .05 } = {}) => {
		const m = Math.floor((dur + rel) * SR), b = new Float32Array(m), lp = new SVF().set(cut, .7); let ph = 0, ph2 = 0;
		for (let i = 0; i < m; i++) {
			const t = i / SR; ph += f / SR; ph2 += f * (1 + det) / SR;
			const o = x => wave === 'saw' ? 2 * (x % 1) - 1 : wave === 'sin' ? Math.sin(TAU * x) : 4 * Math.abs((x % 1) - .5) - 1;
			let v = o(ph) + (det ? o(ph2) : 0);
			const env = Math.min(1, t / att) * Math.exp(-t * dec / Math.max(dur, .05)) * (t > dur ? Math.max(0, 1 - (t - dur) / rel) : 1);
			b[i] = lp.run(v) * env;
		}
		return b;
	};
	const noise = (dur, f, q, dec) => { const m = Math.floor(dur * SR), b = new Float32Array(m), bp = new SVF().set(f, q); for (let i = 0; i < m; i++) { bp.run(rng() * 2 - 1); b[i] = bp.bp * Math.exp(-i / SR * dec); } return b; };
	const kick = () => { const m = Math.floor(.35 * SR), b = new Float32Array(m); let ph = 0; for (let i = 0; i < m; i++) { const t = i / SR; ph += (45 + 90 * Math.exp(-t * 30)) / SR; b[i] = Math.sin(TAU * ph) * Math.exp(-t * 9); } return b; };
	const K = kick();

	const bus = { pad: [new Float32Array(n), new Float32Array(n)] }; // pad recebe reverb
	cues.forEach(([t0], k) => {
		const M = MOODS[cues[k][1]]; if (!M) throw new Error('clima desconhecido: ' + cues[k][1]);
		const a = Math.max(0, t0 - xf), b = Math.min(DUR, (k + 1 < cues.length ? cues[k + 1][0] : DUR) + xf);
		for (let bt = Math.floor(a / bar) * bar; bt < b; bt += bar) {
			const ch = M.ch[Math.round(bt / bar) % M.ch.length];
			// pad (saw desafinado, filtro do clima)
			if (M.pad) ch.forEach((m, i) => { const s = synth(hz(m), bar + .02, { att: .6, dec: .4, wave: 'saw', det: .004, cut: M.cut, rel: .8 }); put(s, bt, .05 * M.pad, (i % 2 ? .5 : -.5), k); });
			const root = ch[0] - 12 - (ch[0] > 52 ? 12 : 0);
			// baixo
			const bp = { long: [[0, 4]], drone: [[0, 4]], eighth: [0, 1, 2, 3, 4, 5, 6, 7].map(i => [i / 2, .4]), quarter: [[0, .9], [1, .9], [2, .9], [3, .9]], bounce: [[0, .35], [1, .35], [1.5, .25], [2, .35], [3, .35]] }[M.bass] || [];
			bp.forEach(([o, d], i) => { const f = hz(root + (M.bass === 'bounce' && i % 2 ? 7 : 0)); put(synth(f, d * beat, { att: .01, dec: M.bass === 'long' || M.bass === 'drone' ? .6 : 3, wave: 'tri', cut: 600 }), bt + o * beat, M.bass === 'drone' ? .2 : .16, 0, k); });
			// arpejo / melodia
			const tones = [...ch, ch[1] + 12, ch[2] + 12];
			const ap = { sparse: [[0, 0], [2.5, 2]], pulse: [0, .5, 1, 1.5, 2, 2.5, 3, 3.5].map((o, i) => [o, i % 3]), run: [0, .5, 1, 1.5, 2, 2.5, 3, 3.5].map((o, i) => [o, [0, 1, 2, 3, 4, 3, 2, 1][i]]), stacc: [[0, 2], [.75, 1], [1.5, 3], [2, 2], [3, 4], [3.5, 1]], twinkle: [[0, 4], [1.5, 5], [3, 3]] }[M.arp] || [];
			ap.forEach(([o, ix]) => { const f = hz(tones[ix % tones.length] + 12); const d = M.arp === 'stacc' ? .18 : M.arp === 'twinkle' || M.arp === 'sparse' ? 1.4 : .35; put(synth(f, d, { att: .004, dec: M.arp === 'stacc' ? 6 : 4, wave: M.arp === 'twinkle' ? 'sin' : 'tri', cut: 1800 + 3000 * M.bright }), bt + o * beat, M.arp === 'twinkle' || M.arp === 'sparse' ? .05 : .045, (ix % 2 ? .35 : -.35), k); });
			// bateria
			const dp = M.drum;
			for (let q = 0; q < 4; q++) {
				const t = bt + q * beat;
				if (dp === 'full' || (dp === 'half' && q % 2 === 0) || (dp === 'soft' && q === 0)) put(K, t, dp === 'full' ? .22 : .15, 0, k);
				if (dp === 'heart') { if (q === 0 || q === 2) { put(K, t, .14, 0, k); put(K, t + .22, .08, 0, k); } }
				if (dp === 'full' && q % 2) put(noise(.18, 1800, .8, 18), t, .12, .1, k);
				if (dp === 'full' || dp === 'soft' || dp === 'half') for (const h of [0, .5]) put(noise(.05, 8000, 1.2, 70), t + h * beat, dp === 'soft' ? .035 : .05, .3, k);
				if (dp === 'tick') put(noise(.04, 5200, 3, 90), t + .5 * beat, .05, .4, k);
			}
		}
	});
	// reverb leve no todo
	const [rl, rr] = freeverb(L.map((x, i) => (x + R[i]) * .5), { room: .8, tail: .1 });
	for (let i = 0; i < n; i++) { L[i] += rl[i] * .35; R[i] += rr[i] * .35; }
	// normaliza por RMS (alvo −24 dBFS) com teto de pico
	let s = 0, pk = 0; for (let i = 0; i < n; i++) { s += L[i] * L[i] + R[i] * R[i]; pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i])); }
	const rms = Math.sqrt(s / (2 * n)), g = Math.min(Math.pow(10, -24 / 20) / (rms || 1), .9 / (pk || 1));
	for (let i = 0; i < n; i++) { L[i] *= g; R[i] *= g; }
	return [L, R];
}
module.exports = { trilha, MOODS };
