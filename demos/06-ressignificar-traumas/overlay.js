// Legendas-chave no estilo fixo do canal (brand/identidade.md): Inter 900, caixa alta, palavra por palavra,
// uma palavra-chave em destaque (*palavra* = amarelo). ~palavra~ = riscada. Carimbo final.
// O tamanho de cada legenda é medido para caber em 2 linhas de 880 px (nunca vaza).
import { seg, ease } from './lib.js';

export const CAPS = [
	[0.05, 0.95, '*TERAPEUTA,*', 'big'],
	[0.95, 2.95, 'COMO O *HipnoEMDR®*'],
	[3.35, 4.6, '*RESSIGNIFICAR*', 'big'],
	[4.6, 5.95, 'EVENTOS *TRAUMÁTICOS*'],
	[6.0, 7.6, 'EM *POUCOS MINUTOS*'],
	[7.75, 9.0, 'O *HipnoEMDR®*'],
	[9.0, 10.35, 'É UMA *TÉCNICA*'],
	[10.35, 11.85, 'QUE MESCLA *HIPNOSE*', 'sm'],
	[11.9, 13.3, '+ *ESTÍMULO BILATERAL*', 'sm'],
	[13.3, 14.9, '*DUAS* FERRAMENTAS'],
	[15.15, 17.85, 'PROTOCOLO *PODEROSO*'],
	[17.9, 19.0, 'FAZER *O QUÊ?*'],
	[19.0, 20.8, '*ATIVAR* AS MEMÓRIAS', 'sm'],
	[20.8, 23.75, 'OS *TRAUMAS* DO CLIENTE', 'sm'],
	[24.35, 25.8, '*REDE NEURAL*', 'big'],
	[25.8, 27.75, 'UMA REDE *ESPECÍFICA*', 'sm'],
	[27.8, 29.7, 'REDE *ATIVADA*'],
	[29.8, 32.4, '*ESTÍMULOS* BILATERAIS', 'sm'],
	[32.4, 34.55, '*DESSENSIBILIZAR*'],
	[34.6, 35.8, 'VAMOS *ALTERAR*'],
	[35.8, 38.65, 'AS *CONEXÕES*', 'big'],
	[38.7, 41.7, 'A *ESTRUTURA* DO TRAUMA', 'sm'],
	[41.7, 44.65, '*DESSENSIBILIZADA*'],
	[44.7, 47.55, 'PARA DE *AFETAR*'],
	[47.6, 50.6, '*DIFERENTE* DE OUTRAS', 'sm'],
	[50.6, 52.75, '~MUITOS~ ~MESES~', 'big'],
	[52.8, 55.15, '*POUCAS* SESSÕES'],
	[55.2, 56.45, 'JÁ TEM *ALTA*'],
	[58.7, 60.05, 'JÁ CONHECE O *HipnoEMDR®*?', 'sm'],
];
const STAMP = [56.5, 58.6, ['ALTA', 'TERAPÊUTICA']];
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
