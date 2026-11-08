// Camada 2D (HTML) sincronizada com a narração: legendas-chave, medidor de profundidade, sentidos e checklist.
// Todos os tempos são absolutos (segundos da narração gravada).
import { clamp, seg, ease, lerp } from './lib.js';

const C = { sinapse: '#3EE6FF', consciente: '#8B6CFF', emocao: '#FF5C7A', luz: '#EEEAFF', eco: '#8A88A8', verde: '#5CF2C0' };

// [início, fim, html, opções] — ≤ 5 palavras; <b> = ciano, <r> = rosa
const CAPS = [
	[0.10, 2.00, 'ELE ESTÁ <b>PROFUNDO</b>'],
	[2.00, 3.60, '<b>O SUFICIENTE?</b>'],
	[3.60, 5.60, 'TRANSE <b>HIPNÓTICO</b>'],
	[5.60, 8.25, 'HORA DE <b>INICIAR</b> A TERAPIA?'],
	[8.40, 10.0, 'DÚVIDA <b>MUITO COMUM</b>'],
	[10.0, 12.0, '<r>PERDA DE TEMPO</r>'],
	[12.0, 13.5, 'APROFUNDANDO…'],
	[13.5, 15.0, '…E <b>APROFUNDANDO</b>'],
	[15.1, 17.6, 'JÁ ESTAVA <b>NO PONTO</b>'],
	[17.6, 19.7, 'E VOCÊ <r>CONTINUA</r>'],
	[19.7, 21.4, 'OU O <b>OPOSTO</b>'],
	[21.4, 23.9, '<r>RASO DEMAIS</r>'],
	[23.9, 27.0, 'SUGESTÕES <r>NÃO FUNCIONAM</r>'],
	[27.1, 29.2, 'A GRANDE <b>VERDADE</b>'],
	[29.2, 30.3, 'NÃO EXISTE'],
	[30.3, 32.3, 'APROFUNDAMENTO ESPECIAL', { strike: 31.0 }],
	[32.3, 34.4, 'TÉCNICA OU INDUÇÃO', { strike: 33.2 }],
	[34.4, 36.6, 'QUE <b>GARANTA</b> O PONTO'],
	[37.2, 39.4, 'O GRANDE <b>PONTO</b>'],
	[39.4, 42.2, '<b>DEFINA</b> O SEU PONTO'],
	[42.2, 44.8, 'A PARTIR DELE…'],
	[44.8, 47.6, 'PROCESSO <b>TERAPÊUTICO</b>'],
	[47.8, 49.6, 'O <b>SEGREDO</b>', { big: 1 }],
	[49.6, 52.0, 'PADRONIZE <b>UMA SUGESTÃO</b>'],
	[52.0, 54.2, 'ELE <b>RESPONDE</b>?'],
	[54.2, 57.1, 'ENTÃO ESTÁ <b>PRONTO</b>'],
	[57.2, 60.0, 'PODE SER <b>QUALQUER UMA</b>'],
	[60.0, 63.0, 'MAS EU ENSINO…'],
	[63.4, 66.0, '<b>LUGAR SEGURO</b>', { big: 1 }],
	[66.0, 68.6, '<b>PROTEGE</b>'],
	[68.6, 71.4, 'VOCÊ <b>E</b> O CLIENTE'],
	[71.4, 74.4, 'EXIGE <b>PROFUNDIDADE</b>'],
	[74.4, 77.2, '<b>IMAGINAR</b>', { big: 1 }],
	[77.2, 79.4, 'E <b>SENTIR</b>', { big: 1 }],
	[79.6, 81.0, 'O GRANDE PONTO?'],
	[81.0, 83.6, 'SE <b>IMAGINA</b> NO LUGAR'],
	[83.6, 86.4, 'SENTE <b>SENSAÇÕES</b>'],
	[86.4, 89.3, 'E <b>SENTIMENTOS</b>'],
	[89.3, 92.3, '<b>PRONTO</b> PARA O PROTOCOLO'],
	[92.4, 95.3, 'ESTÁ COM <b>DÚVIDA</b>?'],
	[95.3, 98.2, 'FAÇA <b>ESTE TESTE</b>'],
	[98.2, 100.0, 'LEVE AO <b>LUGAR SEGURO</b>'],
	[107.2, 110.0, '<b>PRONTO</b> PARA QUALQUER PROTOCOLO'],
	[110.0, 112.4, 'ATÉ <b>REGRESSÃO DE MEMÓRIA</b>'],
];

// medidor: janelas visíveis, profundidade (keyframes), marca-alvo e janelas de alerta
const G_SHOW = [[0.8, 8.1], [15.2, 26.9], [37.0, 47.5], [71.2, 79.3], [83.4, 92.2]];
const G_DEPTH = [[0.8, .0], [2.4, .32], [4.6, .48], [6.6, .58], [8.2, .6],
	[15.2, .3], [17.4, .58], [19.5, .92], [20.4, .92], [21.6, .24], [26.9, .22],
	[37.0, .12], [42.4, .14], [45.0, .58], [47.5, .62],
	[71.2, .1], [74.2, .58], [79.3, .6],
	[83.4, .3], [89.3, .6], [92.2, .62]];
const G_TGT = [[2.6, 8.1, .6, '?', C.eco], [15.4, 26.9, .58, 'PONTO', C.sinapse], [39.6, 47.5, .58, 'PONTO', C.sinapse], [71.8, 79.3, .58, 'PONTO', C.sinapse], [83.4, 92.2, .58, 'PONTO', C.sinapse]];
const G_WARN = [[18.4, 20.6], [21.6, 26.9]];
const G_OK = [[45.0, 47.5], [74.2, 79.3], [89.3, 92.2]];

const SENSES = [
	['VER', '<path d="M4 32s10-16 28-16 28 16 28 16-10 16-28 16S4 32 4 32z"/><circle cx="32" cy="32" r="8"/>', 84.0],
	['OUVIR', '<path d="M20 26a12 12 0 0 1 24 0c0 9-10 11-10 20a7 7 0 0 1-12 3"/><path d="M27 27a5 5 0 0 1 10 0"/>', 84.7],
	['TOCAR', '<path d="M24 34V14a4 4 0 0 1 8 0v16m0-4a4 4 0 0 1 8 0v6m0-2a4 4 0 0 1 8 0v8c0 10-7 16-16 16h-2c-6 0-10-3-13-8l-6-10a4 4 0 0 1 7-4l6 6"/>', 85.4],
	['SENTIR', '<path d="M32 54S8 40 8 24a12 12 0 0 1 24-4 12 12 0 0 1 24 4c0 16-24 30-24 30z"/>', 86.6],
];
const CHECK = [['SE IMAGINA LÁ', 100.4], ['SENTE-SE TRANQUILO', 102.3], ['VÊ E SENTE O LUGAR', 104.6]];

const inWin = (T, list) => list.some(([a, b]) => T >= a && T <= b);
function winAlpha(T, list, f = .4) { let a = 0; for (const [t0, t1] of list) a = Math.max(a, ease.expoOut(seg(T, t0, t0 + f)) * (1 - ease.cubicInOut(seg(T, t1 - f * .6, t1)))); return a; }
function keyed(T, K) {
	if (T <= K[0][0]) return K[0][1];
	for (let i = 1; i < K.length; i++) if (T <= K[i][0]) return lerp(K[i - 1][1], K[i][1], ease.cubicInOut(seg(T, K[i - 1][0], K[i][0])));
	return K[K.length - 1][1];
}

export function buildOverlay(root) {
	const caps = CAPS.map(([t0, t1, html, o = {}]) => {
		const d = document.createElement('div'); d.className = 'cap' + (o.big ? ' big' : '');
		d.innerHTML = `<span class="in">${html}${o.strike ? '<i class="strike"></i>' : ''}</span>`;
		root.appendChild(d);
		return { t0, t1, o, d, s: d.querySelector('.strike'), inner: d.querySelector('.in') };
	});

	const gauge = document.createElement('div'); gauge.id = 'gauge';
	gauge.innerHTML = `<div class="lbl">PROFUNDIDADE</div><div class="track"></div><div class="fill"></div>` +
		Array.from({ length: 11 }, (_, i) => `<div class="tick${i % 5 ? '' : ' m'}" style="top:${i * 10}%"></div>`).join('') +
		`<div class="tgt"><i></i><span></span></div><div class="needle"><i></i></div>`;
	root.appendChild(gauge);
	const GH = 760, gFill = gauge.querySelector('.fill'), gTgt = gauge.querySelector('.tgt'), gTgtS = gauge.querySelector('.tgt span'), gNeedle = gauge.querySelector('.needle');

	const senses = document.createElement('div'); senses.id = 'senses';
	senses.innerHTML = SENSES.map(([t, svg]) => `<div class="s"><div class="c"><svg viewBox="0 0 64 64">${svg}</svg></div><div class="t">${t}</div></div>`).join('');
	root.appendChild(senses);
	const sEls = [...senses.querySelectorAll('.s')];

	const check = document.createElement('div'); check.id = 'check';
	check.innerHTML = `<div class="h">TESTE DO LUGAR SEGURO</div>` + CHECK.map(([t]) => `<div class="row"><div class="box"><svg viewBox="0 0 62 62"><path d="M12 32l12 12 26-28"/></svg></div><div class="tx">${t}</div></div>`).join('');
	root.appendChild(check);
	const rows = [...check.querySelectorAll('.row')];

	return function update(T) {
		// legendas
		for (const c of caps) {
			if (T < c.t0 - .01 || T > c.t1 + .01) { if (c.d.style.display !== 'none') c.d.style.display = 'none'; continue; }
			c.d.style.display = 'flex';
			const e = ease.expoOut(seg(T, c.t0, c.t0 + .38)), o = ease.cubicInOut(seg(T, c.t1 - .22, c.t1));
			const k = e * (1 - o), sc = (.82 + .18 * e) * (1 + (T - c.t0) * .015) * (1 + o * .06);
			c.d.style.opacity = k;
			c.d.style.transform = `translateY(${(1 - e) * 40 - o * 20}px) scale(${sc})`;
			c.d.style.filter = (1 - k) > .03 ? `blur(${(1 - e) * 14 + o * 10}px)` : 'none';
			if (c.s) {
				const st = ease.expoOut(seg(T, c.o.strike, c.o.strike + .35));
				c.s.style.width = (st * 104) + '%';
				c.inner.style.color = st > .5 ? C.eco : '';
				c.d.style.transform += ` rotate(${Math.sin(seg(T, c.o.strike, c.o.strike + .4) * Math.PI * 3) * (1 - seg(T, c.o.strike, c.o.strike + .4)) * 2}deg)`;
			}
		}

		// medidor de profundidade
		const ga = winAlpha(T, G_SHOW, .45);
		gauge.style.opacity = ga; gauge.style.display = ga > .001 ? '' : 'none';
		if (ga > .001) {
			gauge.style.transform = `translateX(${(1 - ga) * -60}px)`;
			const d = keyed(T, G_DEPTH) + Math.sin(T * 3.1) * .006, y = d * GH;
			gNeedle.style.top = y + 'px'; gFill.style.height = y + 'px';
			let tg = null; for (const t of G_TGT) if (T >= t[0] && T <= t[1]) tg = t;
			if (tg) {
				const ta = ease.expoOut(seg(T, tg[0], tg[0] + .5)) * (1 - seg(T, tg[1] - .3, tg[1]));
				gTgt.style.opacity = ta; gTgt.style.top = tg[2] * GH + 'px'; gTgt.style.color = tg[4]; gTgtS.textContent = tg[3];
				gTgt.style.transform = `scaleX(${.6 + .4 * ta})`; gTgt.style.transformOrigin = '0 0';
			} else gTgt.style.opacity = 0;
			const warn = inWin(T, G_WARN), ok = inWin(T, G_OK);
			const nc = warn ? C.emocao : ok ? C.verde : C.luz;
			gNeedle.style.color = nc;
			const pulse = warn || ok ? 1 + .12 * Math.sin(T * 12) : 1;
			gNeedle.querySelector('i').style.transform = `scale(${pulse})`;
		}

		// sentidos
		const sa = winAlpha(T, [[83.5, 89.6]], .4);
		senses.style.display = sa > .001 ? 'flex' : 'none';
		sEls.forEach((el, i) => {
			const t0 = SENSES[i][2], e = ease.expoOut(seg(T, t0 - .5, t0)), lit = ease.expoOut(seg(T, t0, t0 + .4));
			el.style.opacity = e * sa;
			el.style.transform = `translateY(${(1 - e) * 30}px) scale(${.9 + .1 * e + lit * .06 * Math.max(0, Math.sin((T - t0) * 3))})`;
			const c = el.querySelector('.c'), clr = i === 3 ? C.emocao : C.sinapse;
			c.style.borderColor = lit > .5 ? clr : C.eco; c.style.color = lit > .5 ? clr : C.eco;
			c.style.boxShadow = lit > .5 ? `0 0 ${30 + 10 * Math.sin(T * 4 + i)}px ${clr}` : 'none';
			el.querySelector('.t').style.color = lit > .5 ? C.luz : C.eco;
		});

		// checklist do teste
		const ca = winAlpha(T, [[99.9, 107.0]], .45);
		check.style.display = ca > .001 ? '' : 'none';
		check.style.opacity = ca; check.style.transform = `translateY(${(1 - ca) * 40}px) scale(${.95 + .05 * ca})`;
		rows.forEach((r, i) => {
			const t0 = CHECK[i][1], e = ease.expoOut(seg(T, t0 - .45, t0)), m = ease.expoOut(seg(T, t0 + .1, t0 + .6));
			r.style.opacity = e; r.style.transform = `translateX(${(1 - e) * -40}px)`;
			r.querySelector('svg').style.strokeDashoffset = 60 * (1 - m);
			r.querySelector('.box').style.borderColor = m > .3 ? C.verde : C.eco;
		});
	};
}
