// Legendas-chave no estilo fixo do canal (brand/identidade.md): Inter 900, caixa alta, palavra por palavra
// sincronizada com a voz, uma palavra-chave em destaque. *palavra* = vermelho, _palavra_ = azul.
import { seg, ease } from './lib.js';

export const CAPS = [
	[0.10, 2.25, 'DÁ PRA *COMPROVAR*?'],
	[6.00, 7.70, 'ESSA FOI A *PERGUNTA*'],
	[14.95, 16.75, 'UM *ESTUDO*'],
	[16.75, 19.0, '≈ *60* PESSOAS', 'big'],
	[19.0, 20.85, '*ELETRO*ENCEFALOGRAMA', 'sm'],
	[20.85, 22.4, '+ *RESSONÂNCIA* MAGNÉTICA', 'sm'],
	[22.5, 24.0, '60 PESSOAS'],
	[24.0, 26.8, 'DOIS GRUPOS *DISTINTOS*'],
	[26.8, 29.7, '*ALTAMENTE* SUGESTIONÁVEIS', 'sm'],
	[29.7, 32.65, '_POUCO_ SUGESTIONÁVEIS', 'sm'],
	[32.8, 35.7, 'AO *HIPNOTIZAR*'],
	[35.7, 38.2, 'EEG *+* RESSONÂNCIA'],
	[38.6, 40.05, '*3* DESCOBERTAS', 'big'],
	[40.15, 41.7, 'DURANTE O *TRANSE*'],
	[41.7, 44.6, 'CINGULADO *ANTERIOR*', 'sm'],
	[44.6, 47.6, '*ATENÇÃO* FOCADA', 'big'],
	[47.6, 49.5, 'MAIS *FOCO*'],
	[49.6, 51.6, '*MENOS* CONEXÃO'],
	[51.6, 53.6, 'CÓRTEX _PRÉ-FRONTAL_', 'sm'],
	[53.6, 56.4, 'CINGULADO *POSTERIOR*', 'sm'],
	[56.4, 58.3, 'SISTEMA *CRÍTICO*'],
	[58.3, 60.3, 'OU SEJA…'],
	[60.3, 63.4, '*MENOS* JULGAMENTO RACIONAL', 'sm'],
	[63.6, 65.5, 'MAIS *SINCRONIA*'],
	[65.5, 66.9, 'REGIÕES _SENSORIAIS_', 'sm'],
	[66.9, 68.5, 'E *EMOCIONAIS*'],
	[68.5, 71.4, 'VIVÊNCIA *SUBJETIVA*', 'sm'],
	[71.4, 72.9, 'MUITO MAIS *REAL*', 'big'],
	[72.9, 76.5, 'COM *×* SEM HIPNOSE'],
	[76.6, 78.9, 'ESTADO *NEUROFUNCIONAL*', 'sm'],
	[83.4, 84.9, 'VISÃO *CIENTÍFICA*'],
	[84.9, 86.2, 'NÃO DÁ PRA *NEGAR*'],
];

export function buildOverlay(root) {
	const caps = CAPS.map(([t0, t1, text, cls]) => {
		const d = document.createElement('div'); d.className = 'cap' + (cls ? ' ' + cls : '');
		const words = text.split(' ').map(w => {
			const s = document.createElement('span'); s.className = 'w';
			s.style.margin = '0 .13em'; s.innerHTML = w.replace(/\*(.+?)\*/g, '<b>$1</b>').replace(/_(.+?)_/g, '<i>$1</i>');
			d.appendChild(s); return s;
		});
		root.appendChild(d); return { t0, t1, d, words };
	});
	return T => {
		for (const c of caps) {
			const on = T >= c.t0 - .01 && T <= c.t1 + .01;
			c.d.style.display = on ? 'flex' : 'none'; if (!on) continue;
			const o = ease.expoIn(seg(T, c.t1 - .15, c.t1));
			c.words.forEach((s, i) => {
				const k = seg(T, c.t0 + i * .12, c.t0 + i * .12 + .22), e = ease.backOut(k);
				s.style.opacity = Math.min(1, k * 2) * (1 - o);
				s.style.transform = `translateY(${(1 - e) * 30 - o * 20}px) scale(${(.85 + .15 * e) * (1 - o * .1)})`;
			});
		}
	};
}
