// Trilha ambiente do vídeo 02 (pad + drone + sininhos esparsos), por capítulo, nos tempos da narração.
// node demos/02-memorias-falsas/trilha.cjs → audio/02-memorias-falsas-trilha.wav (estéreo 44,1 kHz, 664,6 s)
const fs = require('fs'), path = require('path');
const SR = 44100, DUR = 664.6, N = Math.round(SR * DUR), TAU = Math.PI * 2;
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rng = mulberry32(2024);
const mid = n => 440 * Math.pow(2, (n - 69) / 12);
const NOTE = { C: 0, 'C#': 1, Db: 1, D: 2, Eb: 3, E: 4, F: 5, 'F#': 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 };
// acorde → notas MIDI (raiz na oitava 3) ; sufixos: m, maj7, m7, sus2, (vazio = maior)
function chord(name) {
  const m = name.match(/^([A-G][b#]?)(.*)$/), r = 48 + NOTE[m[1]], q = m[2];
  const iv = { '': [0, 4, 7, 12], m: [0, 3, 7, 12], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], sus2: [0, 2, 7, 12], m9: [0, 3, 7, 14] }[q];
  return { root: r, notes: iv.map(i => r + i) };
}
// capítulos (tempo do vídeo): acordes, segundos por acorde, brilho (nº de harmônicos), nível, densidade de sininhos (notas/s), oitava dos sininhos
const CH = [
  { a: 0,     b: 71,    seq: ['Am', 'Fmaj7', 'C', 'Em'],       per: 9,  bright: .35, gain: .8,  bells: .22, drone: .5 },  // abertura: mistério
  { a: 71,    b: 180,   seq: ['Dm', 'Bb', 'F', 'C', 'Dm', 'Bb', 'Gm', 'A'], per: 7, bright: .45, gain: .85, bells: .3, drone: .45, pulse: .25 }, // Loftus / shopping
  { a: 180,   b: 270,   seq: ['Em', 'Cmaj7', 'Em', 'B'],       per: 10, bright: .22, gain: .8,  bells: .12, drone: .8 },  // hipnose: escuro
  { a: 270,   b: 372,   seq: ['F', 'C', 'Am', 'G'],            per: 8,  bright: .55, gain: .85, bells: .38, drone: .35 }, // balão: encanto
  { a: 372,   b: 440,   seq: ['Am7', 'G', 'Fmaj7', 'E'],       per: 8,  bright: .4,  gain: .8,  bells: .25, drone: .45 }, // reconstrução
  { a: 440,   b: 498,   seq: ['Dm', 'Bb', 'Gm', 'A'],          per: 7,  bright: .28, gain: .9,  bells: .1,  drone: .85, pulse: .4 }, // guerra das memórias
  { a: 498,   b: 551,   seq: ['C', 'G', 'Am', 'Fmaj7'],        per: 8,  bright: .5,  gain: .8,  bells: .28, drone: .3 },  // cuidado clínico
  { a: 551,   b: 664.6, seq: ['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'Esus2'], per: 8, bright: .6, gain: .95, bells: .35, drone: .4 }, // conclusão
];
const X = 4; // crossfade entre capítulos (s)
const L = new Float32Array(N), R = new Float32Array(N);
const env = (t, a, b) => Math.min(1, Math.max(0, (t - a + X) / X)) * Math.min(1, Math.max(0, (b + X - t) / X));
for (const c of CH) {
  const s0 = Math.max(0, Math.round((c.a - X) * SR)), s1 = Math.min(N, Math.round((c.b + X) * SR));
  const nh = 1 + Math.round(c.bright * 6);
  // pad: cada acorde vira com crossfade de 2 s; vozes desafinadas L/R
  for (let i = s0; i < s1; i++) {
    const t = i / SR, lt = t - c.a + X, k = Math.floor(Math.max(0, lt) / c.per), u = (Math.max(0, lt) % c.per) / c.per;
    const e = env(t, c.a, c.b) * c.gain;
    let l = 0, r = 0;
    for (let h = 0; h < 2; h++) {
      const idx = k - (h === 0 ? 0 : 1); if (idx < 0) continue;
      const w = h === 0 ? Math.min(1, u * c.per / 2) : Math.max(0, 1 - u * c.per / 2); if (w <= 0) continue;
      const ch = chord(c.seq[idx % c.seq.length]);
      for (let v = 0; v < ch.notes.length; v++) {
        const f = mid(ch.notes[v] + 12);
        const breathe = .75 + .25 * Math.sin(TAU * (.05 + v * .013) * t + v);
        for (let hh = 1; hh <= nh; hh++) {
          const amp = w * breathe / (hh * hh * .9 + .1) / ch.notes.length;
          l += amp * Math.sin(TAU * f * hh * 1.0018 * t + v);
          r += amp * Math.sin(TAU * f * hh * .9982 * t + v * 2);
        }
      }
      // drone grave na raiz
      const fr = mid(ch.root - 12), dr = c.drone * w * (.8 + .2 * Math.sin(TAU * .07 * t));
      const d = dr * (Math.sin(TAU * fr * t) + .3 * Math.sin(TAU * fr * 2 * t));
      l += d * .5; r += d * .5;
    }
    // pulso suave (tensão) — batida lenta de 60 bpm no grave
    if (c.pulse) { const ph = (t % 1), p = c.pulse * Math.exp(-ph * 6) * Math.sin(TAU * 55 * t); l += p * .35; r += p * .35; }
    L[i] += l * e * .22; R[i] += r * e * .22;
  }
  // sininhos: notas do acorde corrente, 2 oitavas acima, decaimento exponencial, pan aleatório
  const cnt = Math.round((c.b - c.a) * c.bells);
  for (let j = 0; j < cnt; j++) {
    const t0 = c.a + rng() * (c.b - c.a); const k = Math.floor((t0 - c.a + X) / c.per);
    const ch = chord(c.seq[k % c.seq.length]), f = mid(ch.notes[Math.floor(rng() * 3)] + 24 + (rng() < .3 ? 12 : 0));
    const pan = rng(), g = (.05 + rng() * .05) * env(t0, c.a, c.b) * c.gain, dl = 3.5;
    const i0 = Math.round(t0 * SR), n = Math.min(N - i0, Math.round(dl * SR));
    for (let q = 0; q < n; q++) { const tt = q / SR, a = g * Math.min(1, tt / .004) * Math.exp(-tt * 1.8) * (Math.sin(TAU * f * tt) + .25 * Math.sin(TAU * f * 2.76 * tt) * Math.exp(-tt * 4)); L[i0 + q] += a * (1 - pan); R[i0 + q] += a * pan; }
  }
}
// ar (ruído rosa filtrado bem baixo) para nunca ficar seco
{ let b0 = 0, b1 = 0, lp = 0, lpr = 0; for (let i = 0; i < N; i++) { const w = rng() * 2 - 1; b0 = .997 * b0 + w * .03; b1 = .97 * b1 + w * .1; const x = (b0 + b1) * .5; lp += .02 * (x - lp); lpr += .02 * ((rng() * 2 - 1) * .1 + b0 * .5 - lpr); L[i] += lp * .05; R[i] += lpr * .05; } }
// reverb simples (Schroeder: 4 combs + 2 allpass por canal)
function verb(x, seed) {
  const out = new Float32Array(x.length), combs = [1557, 1617, 1491, 1422].map(d => d + seed), fb = .84;
  for (const d of combs) { const buf = new Float32Array(d); let p = 0, lp = 0; for (let i = 0; i < x.length; i++) { const y = buf[p]; lp = y * .6 + lp * .4; buf[p] = x[i] + lp * fb; out[i] += y * .25; p = (p + 1) % d; } }
  for (const d of [225, 556]) { const buf = new Float32Array(d); let p = 0; for (let i = 0; i < x.length; i++) { const b = buf[p], v = out[i] + b * .5; buf[p] = v; out[i] = b - v * .5; p = (p + 1) % d; } }
  return out;
}
const vL = verb(L, 0), vR = verb(R, 23);
// fade-in 3 s, fade-out 6 s, normaliza pico em −3 dBFS
let pk = 0; const fo = 6 * SR, fi = 3 * SR;
for (let i = 0; i < N; i++) { const g = Math.min(1, i / fi, (N - i) / fo); L[i] = (L[i] * .7 + vL[i] * .45) * g; R[i] = (R[i] * .7 + vR[i] * .45) * g; pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i])); }
const kk = .708 / pk, buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * kk)) * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * kk)) * 32767), 46 + i * 4); }
const outp = path.join(__dirname, '../../audio/02-memorias-falsas-trilha.wav'); fs.writeFileSync(outp, buf); console.log('ok', outp);
