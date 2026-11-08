// Legendas-chave no estilo fixo do canal (brand/identidade.md): Inter 900, caixa alta, palavra por palavra,
// uma palavra-chave em destaque (*palavra* = amarelo). ~palavra~ = riscada. Carimbo final.
// O tamanho de cada legenda é medido para caber em 2 linhas de 880 px (nunca vaza).
import { seg, ease } from './lib.js';

export const CAPS = [
	[0.22, 1.05, "COMO É *POSSÍVEL*"],
	[1.05, 2.25, "UMA SIMPLES *SUGESTÃO*"],
	[2.27, 3.45, "*MUDAR* A MANEIRA"],
	[3.47, 4.45, "COMO UMA PESSOA"],
	[4.47, 6.35, "*PERCEBE* A REALIDADE", "sm"],
	[7.42, 9.5, "A *HIPNOSE* ENVOLVE"],
	[9.55, 10.33, "*ATENÇÃO*", "big"],
	[10.36, 11.33, "*IMAGINAÇÃO*", "big"],
	[11.36, 12.47, "*EXPECTATIVA*", "big"],
	[12.5, 14.5, "E *RESPOSTA* ÀS SUGESTÕES", "sm"],
	[15.95, 17.1, "O MAIS *INTERESSANTE*", "sm"],
	[17.12, 18.75, "ESSAS *TÉCNICAS*"],
	[18.85, 19.85, "PODEM SER *ESTUDADAS*", "sm"],
	[19.87, 20.85, "E *APRENDIDAS*"],
	[21.85, 22.95, "EXISTE UM *CURSO*"],
	[22.97, 25.25, "PARA ENSINAR *VOCÊ*"],
	[25.6, 26.62, "OS *FUNDAMENTOS*"],
	[26.64, 27.36, "OS *TUTORIAIS*"],
	[27.38, 29.2, "APRENDER O *PASSO A PASSO*", "sm"],
	[29.22, 29.97, "DA *HIPNOSE*", "big"],
	[30.0, 31.15, "DO ABSOLUTO *ZERO*"],
	[31.6, 32.2, "E O *MELHOR*", "big"],
	[32.22, 33.15, "VOCÊ PODE *COMEÇAR*"],
	[33.18, 34.2, "COM *APENAS*", "big"],
];
const STAMP = [34.22, 99, ["R$ 97", "PARA COMEÇAR"]];
const SIZES = { big: 124, sm: 76 }, BASE = 96, MAXW = 860;

export function buildOverlay(root) {
	const g = document.createElement('canvas').getContext('2d');
	const width = (t, s) => { g.font = `900 ${s}px Inter`; return g.measureText(t).width + t.length * s * .02 + s * .3; };
	const caps = CAPS.map(([t0, t1, text, cls]) => {
		const d = document.createElement('div'); d.className = 'cap';
		const plain = text.split(' ').map(w => w.replace(/[*~]/g, ''));
		// encolhe até a palavra mais longa caber e o texto inteiro caber em 2 linhas
		let s = SIZES[cls] || BASE;
		for (; s > 40; s -= 2) {
			if (Math.max(...plain.map(w => width(w, s))) > MAXW) continue;
			let lines = 1, cur = 0; for (const w of plain) { const ww = width(w, s); if (cur && cur + ww > MAXW) { lines++; cur = ww; } else cur += ww; }
			if (lines <= 2) break;
		}
		d.style.fontSize = s + 'px'; d.style.webkitTextStrokeWidth = Math.round(s * .19) + 'px';
		const words = text.split(' ').map(w => {
			const sp = document.createElement('span'); sp.className = 'w' + (/^~.*~$/.test(w) ? ' strike' : '');
			sp.style.margin = '0 .13em'; const raw = w.replace(/[*~]/g, '');
			// marca: grafia exata (sem caixa alta) e ® pequeno
			if (/HipnoEMDR/.test(raw)) { sp.style.textTransform = 'none'; sp.innerHTML = raw.replace('®', '<sup style="font-size:.42em;vertical-align:.95em;-webkit-text-stroke-width:.12em">®</sup>'); } else sp.textContent = raw;
			d.appendChild(sp); return sp;
		});
		let inB = false; text.split(' ').forEach((w, i) => { const st = w.startsWith('*'), en = /\*[?,.!]?$/.test(w); if (st || inB) words[i].classList.add('hl'); if (st && !en) inB = true; if (en) inB = false; });
		root.appendChild(d); return { t0, t1, d, words };
	});
	const stamp = document.createElement('div'); stamp.className = 'stamp'; stamp.innerHTML = STAMP[2].map(l => `<span>${l}</span>`).join('');
	root.appendChild(stamp);
	return T => {
		for (const c of caps) {
			const on = T >= c.t0 - .01 && T <= c.t1 + .01;
			c.d.style.display = on ? 'flex' : 'none'; if (!on) continue;
			const o = ease.expoIn(seg(T, c.t1 - .15, c.t1));
			c.words.forEach((s, i) => {
				const t = c.t0 + i * .12, k = seg(T, t, t + .22), e = ease.backOut(k);
				s.style.opacity = Math.min(1, k * 2) * (1 - o);
				s.style.transform = `translateY(${(1 - e) * 30 - o * 20}px) scale(${(.85 + .15 * e) * (1 - o * .1)})`;
				if (s.classList.contains('strike')) s.style.setProperty('--st', Math.min(1, seg(T, c.t0 + .9 + i * .15, c.t0 + 1.2 + i * .15)));
			});
		}
		const [a, b] = STAMP, on = T >= a && T <= b;
		stamp.style.display = on ? 'flex' : 'none';
		if (on) {
			const k = ease.expoOut(seg(T, a, a + .2)), o = ease.expoIn(seg(T, b - .2, b));
			const shake = T - a < .1 ? Math.sin(T * 300) * 6 : 0;
			stamp.style.opacity = Math.min(1, seg(T, a, a + .06) * 2) * (1 - o);
			stamp.style.transform = `translate(${shake}px, 0) rotate(-3deg) scale(${(1.4 - .4 * k) * (1 + .01 * Math.sin((T - a) * 3))})`;
		}
	};
}
