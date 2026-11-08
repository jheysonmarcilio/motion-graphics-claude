// Legendas-chave no estilo fixo do canal (brand/identidade.md): Inter 900, caixa alta, palavra por palavra,
// uma palavra-chave em destaque (*palavra* = laranja). ~palavra~ = riscada. + carimbo final.
import { seg, ease } from './lib.js';

export const CAPS = [
	[0.10, 2.00, 'ELE ESTÁ *PROFUNDO*'],
	[2.00, 3.60, '*O SUFICIENTE?*', 'big'],
	[3.60, 5.60, 'TRANSE *HIPNÓTICO*'],
	[5.60, 8.25, 'HORA DE *INICIAR* A TERAPIA?', 'sm'],
	[8.40, 10.0, 'DÚVIDA *MUITO COMUM*'],
	[10.0, 12.0, '*PERDA* DE TEMPO'],
	[12.0, 13.5, 'APROFUNDANDO…'],
	[13.5, 15.0, '…E *APROFUNDANDO*', 'sm'],
	[15.1, 17.6, 'JÁ ESTAVA *NO PONTO*'],
	[17.6, 19.7, 'E VOCÊ *CONTINUA*'],
	[19.7, 21.4, 'OU O *OPOSTO*'],
	[21.4, 23.9, '*RASO* DEMAIS', 'big'],
	[23.9, 27.0, 'SUGESTÕES *NÃO FUNCIONAM*', 'sm'],
	[27.1, 29.2, 'A GRANDE *VERDADE*'],
	[29.2, 30.3, '*NÃO* EXISTE', 'big'],
	[30.3, 32.3, '~APROFUNDAMENTO~ ~ESPECIAL~', 'sm'],
	[32.3, 34.4, '~TÉCNICA~ ~OU~ ~INDUÇÃO~', 'sm'],
	[34.4, 36.6, 'QUE *GARANTA* O PONTO'],
	[37.2, 39.4, 'O GRANDE *PONTO*'],
	[39.4, 42.2, '*DEFINA* O SEU PONTO'],
	[42.2, 44.8, 'A PARTIR DELE…'],
	[44.8, 47.6, 'PROCESSO *TERAPÊUTICO*', 'sm'],
	[47.8, 49.6, 'O *SEGREDO*', 'big'],
	[49.6, 52.0, 'PADRONIZE *UMA SUGESTÃO*', 'sm'],
	[52.0, 54.2, 'ELE *RESPONDE*?'],
	[54.2, 57.1, 'ENTÃO ESTÁ *PRONTO*'],
	[57.2, 60.0, 'PODE SER *QUALQUER UMA*', 'sm'],
	[60.0, 63.0, 'MAS EU ENSINO…'],
	[63.4, 66.0, '*LUGAR SEGURO*', 'big'],
	[66.0, 68.6, '*PROTEGE*', 'big'],
	[68.6, 71.4, 'VOCÊ *E* O CLIENTE'],
	[71.4, 74.4, 'EXIGE *PROFUNDIDADE*', 'sm'],
	[74.4, 77.2, '*IMAGINAR*', 'big'],
	[77.2, 79.4, 'E *SENTIR*', 'big'],
	[79.6, 81.0, 'O GRANDE *PONTO*?'],
	[81.0, 83.6, 'SE *IMAGINA* NO LUGAR'],
	[83.6, 86.4, 'SENTE *SENSAÇÕES*'],
	[86.4, 89.3, 'E *SENTIMENTOS*'],
	[89.3, 92.3, '*PRONTO* PARA O PROTOCOLO', 'sm'],
	[92.4, 95.3, 'ESTÁ COM *DÚVIDA*?'],
	[95.3, 98.2, 'FAÇA *ESTE TESTE*'],
	[98.2, 99.9, 'LEVE AO *LUGAR SEGURO*', 'sm'],
	[110.0, 112.0, 'ATÉ *REGRESSÃO DE MEMÓRIA*', 'sm'],
];
const STAMP = [107.2, 109.95, ['PRONTO PRA', 'QUALQUER PROTOCOLO']];

export function buildOverlay(root) {
	const caps = CAPS.map(([t0, t1, text, cls]) => {
		const d = document.createElement('div'); d.className = 'cap' + (cls ? ' ' + cls : '');
		const words = text.split(' ').map(w => {
			const s = document.createElement('span'); s.className = 'w' + (/^~.*~$/.test(w) ? ' strike' : '');
			s.style.margin = '0 .13em'; s.innerHTML = w.replace(/\*(.+?)\*/g, '<b>$1</b>').replace(/^\*|\*$/g, '').replace(/~/g, '');
			d.appendChild(s); return s;
		});
		// palavras-chave com * que atravessam espaços (ex.: *MUITO COMUM*)
		let inB = false; text.split(' ').forEach((w, i) => { const st = w.startsWith('*'), en = w.endsWith('*'); if (st || inB) words[i].classList.add('hl'); if (st && !en) inB = true; if (en) inB = false; });
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
				if (s.classList.contains('strike')) s.style.setProperty('--st', Math.min(1, seg(T, c.t0 + .7 + i * .12, c.t0 + 1.0 + i * .12)));
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
