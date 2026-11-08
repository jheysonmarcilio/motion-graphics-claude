// Legendas-chave no estilo fixo do canal (brand/identidade.md): Inter 900, caixa alta, palavra por palavra,
// uma palavra-chave em destaque (*palavra* = amarelo). ~palavra~ = riscada. + carimbo final.
import { seg, ease } from './lib.js';

export const CAPS = [
	[0.10, 2.95, 'A INDUÇÃO *MAIS ÚTIL*'],
	[3.00, 5.85, 'NO *ATENDIMENTO ONLINE*', 'sm'],
	[5.95, 8.85, 'INDUÇÃO DE *DAVE ELMAN*', 'sm'],
	[8.95, 11.8, '*ADAPTADA* PRO ONLINE', 'sm'],
	[11.9, 14.8, '*5* PASSOS', 'big'],
	[14.9, 17.8, '1 · OLHOS *COLADOS*'],
	[17.9, 20.75, '2 · BRAÇO *PESADO*'],
	[20.85, 23.75, '3 · *RESPIRAÇÃO*'],
	[23.85, 26.75, '4 · *FRACIONAMENTO*', 'sm'],
	[26.85, 29.7, '5 · AMNÉSIA DOS *NÚMEROS*', 'sm'],
	[29.8, 33.7, 'AS *5 ETAPAS*', 'big'],
	[33.8, 37.6, 'SÓ *UMA* ETAPA…'],
	[37.7, 41.6, 'PRECISA *ENCOSTAR*'],
	[41.7, 44.5, 'SEM ELA…', 'big'],
	[44.6, 47.6, '*100%* ONLINE', 'big'],
	[47.7, 50.5, '*ELIMINE*…', 'big'],
	[50.6, 53.5, '…ESSA *ETAPA*'],
	[53.6, 56.5, 'DIRETO PRA *AMNÉSIA*'],
	[56.6, 59.4, 'FEZ A AMNÉSIA? *TUDO CERTO*', 'sm'],
	[59.5, 61.6, 'JÁ ESTÁ *HIPNOTIZADO*', 'sm'],
	[61.7, 65.4, 'OU *SUBSTITUA*', 'big'],
	[65.5, 67.9, 'COMPLETAMENTE *SOZINHO*', 'sm'],
	[68.5, 71.4, 'FECHE A *MÃO*', 'big'],
	[71.5, 74.35, 'EM VEZ DE ~BRAÇO~ ~PESADO~', 'sm'],
	[74.45, 77.3, 'FECHE A MÃO *AGORA*'],
	[77.4, 79.4, '*APERTE* COM FORÇA', 'sm'],
	[80.4, 82.35, '*MAIS FORTE*', 'big'],
	[83.6, 86.3, '*RELAXA*… MAIS FUNDO', 'sm'],
	[86.4, 89.2, 'REPITA O *PROCESSO*'],
	[89.3, 92.2, '*2×* MAIS RELAXADO'],
	[92.3, 95.2, 'MAIS *PROFUNDO*', 'big'],
	[95.3, 98.2, 'O *MESMO EFEITO*', 'big'],
	[98.3, 101.1, '*SUBSTITUA* ESSA ETAPA…', 'sm'],
	[101.2, 104.2, '…OU *ELIMINE*', 'big'],
];
const STAMP = [104.3, 106.95, ['100% ONLINE', 'SEM ENCOSTAR']];

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
