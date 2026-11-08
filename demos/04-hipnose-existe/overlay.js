// Camada 2D (HTML) sincronizada com a narração: legendas-chave, lista ?/✓, cartão, contador, chips, etiquetas, osciloscópio, medidor e carimbo.
// Todos os tempos são absolutos (segundos da narração gravada). Elementos que dependem do 3D leem w.tags / w.ui (preenchidos pelas cenas).
import { clamp, seg, ease, lerp } from './lib.js';

const C = { sinapse: '#3EE6FF', consciente: '#8B6CFF', emocao: '#FF5C7A', luz: '#EEEAFF', eco: '#8A88A8', verde: '#5CF2C0', sol: '#FFC48A' };

// [início, fim, html, opções] — ≤ 5 palavras; <b> ciano, <r> rosa, <g> verde, <a> âmbar
export const CAPS = [
	[0.10, 2.25, 'DÁ PRA <b>COMPROVAR</b>?'],
	[6.00, 7.70, 'ESSA FOI A <b>PERGUNTA</b>'],
	[13.6, 14.85, '<b>2016</b>', { cls: 'num' }],
	[14.95, 16.75, 'UM <b>ESTUDO</b>'],
	[16.75, 19.0, '≈ <b>60</b> PESSOAS', { cls: 'big' }],
	[19.0, 20.85, '<b>ELETRO</b>ENCEFALOGRAMA', { cls: 'sm' }],
	[20.85, 22.4, '+ <b>RESSONÂNCIA</b> MAGNÉTICA', { cls: 'sm' }],
	[22.5, 24.0, '60 PESSOAS'],
	[24.0, 26.8, 'DOIS GRUPOS <b>DISTINTOS</b>'],
	[26.8, 29.7, '<b>ALTAMENTE</b> SUGESTIONÁVEIS', { cls: 'sm' }],
	[29.7, 32.65, '<r>POUCO</r> SUGESTIONÁVEIS', { cls: 'sm' }],
	[32.8, 35.7, 'AO <b>HIPNOTIZAR</b>'],
	[35.7, 38.6, 'EEG <b>+</b> RESSONÂNCIA'],
	[38.6, 40.05, '<b>3</b> DESCOBERTAS', { cls: 'big' }],
	[40.15, 41.7, 'DURANTE O <b>TRANSE</b>'],
	[41.7, 44.6, 'CINGULADO <b>ANTERIOR</b>', { cls: 'sm' }],
	[44.6, 47.6, '<b>ATENÇÃO</b> FOCADA', { cls: 'big' }],
	[47.6, 49.5, 'MAIS <b>FOCO</b>'],
	[49.6, 51.6, '<r>MENOS</r> CONEXÃO'],
	[51.6, 53.6, 'CÓRTEX <a>PRÉ-FRONTAL</a>', { cls: 'sm' }],
	[53.6, 56.4, 'CINGULADO <r>POSTERIOR</r>', { cls: 'sm' }],
	[56.4, 58.3, 'SISTEMA <b>CRÍTICO</b>'],
	[58.3, 60.3, 'OU SEJA…'],
	[60.3, 63.4, '<r>MENOS</r> JULGAMENTO RACIONAL', { cls: 'sm' }],
	[63.6, 65.5, 'MAIS <b>SINCRONIA</b>'],
	[65.5, 66.9, 'REGIÕES <g>SENSORIAIS</g>', { cls: 'sm' }],
	[66.9, 68.5, 'E <r>EMOCIONAIS</r>'],
	[68.5, 71.4, 'VIVÊNCIA <b>SUBJETIVA</b>', { cls: 'sm' }],
	[71.4, 72.9, 'MUITO MAIS <b>REAL</b>', { cls: 'big' }],
	[72.9, 76.5, 'COM <b>×</b> SEM HIPNOSE'],
	[76.6, 78.9, 'ESTADO <b>NEUROFUNCIONAL</b>', { cls: 'sm' }],
	[83.4, 84.9, 'VISÃO <b>CIENTÍFICA</b>'],
	[84.9, 86.35, 'NÃO DÁ PRA <b>NEGAR</b>'],
];

const Q_OPEN = [['PALPÁVEL', 2.35], ['MENSURÁVEL', 3.15], ['REPLICÁVEL', 4.35]];
const Q_END = [['REAL', 79.3], ['MENSURÁVEL', 80.3], ['REPLICÁVEL', 81.3]];
const CHIPS = [[40.1, 49.5, 'DESCOBERTA 1/3', C.sinapse], [49.6, 63.4, 'DESCOBERTA 2/3', C.sol], [63.6, 72.85, 'DESCOBERTA 3/3', C.verde]];

function winAlpha(T, list, f = .4) { let a = 0; for (const [t0, t1] of list) a = Math.max(a, ease.expoOut(seg(T, t0, t0 + f)) * (1 - ease.cubicInOut(seg(T, t1 - f * .6, t1)))); return a; }
const el = (root, html, id, cls) => { const d = document.createElement('div'); if (id) d.id = id; if (cls) d.className = cls; d.innerHTML = html; root.appendChild(d); return d; };
const show = (d, a) => { d.style.display = a > .001 ? '' : 'none'; d.style.opacity = a; return a > .001; };

export function buildOverlay(root) {
	const caps = CAPS.map(([t0, t1, html, o = {}]) => {
		const d = el(root, `<span class="in">${html}</span>`, null, 'cap' + (o.cls ? ' ' + o.cls : ''));
		return { t0, t1, o, d };
	});

	const ql = el(root, [0, 1, 2].map(() => `<div class="row"><div class="mk"><span>?</span><svg viewBox="0 0 62 62"><path d="M12 32l12 12 26-28"/></svg></div><div class="tx"></div></div>`).join('') + `<div class="foot">EM LABORATÓRIO</div>`, 'qlist');
	const qRows = [...ql.querySelectorAll('.row')], qFoot = ql.querySelector('.foot');

	const card = el(root, `<i class="bar"></i><div class="nm">DAVID SPIEGEL</div><div class="ln">PSIQUIATRA <b>·</b> PESQUISADOR</div><div class="ln uni">UNIVERSIDADE DE <b>STANFORD</b> · EUA</div>`, 'card');
	const cardParts = [card.querySelector('.nm'), ...card.querySelectorAll('.ln')];

	const count = el(root, `<div class="n">0</div><div class="t">PARTICIPANTES</div>`, 'count'), countN = count.querySelector('.n');
	const chip = el(root, `<span></span>`, 'chip'), chipS = chip.querySelector('span');

	const tags = [0, 1, 2].map(() => { const d = el(root, `<i class="ln"></i><i class="dot"></i><div class="tx"></div>`, null, 'tag'); return { d, ln: d.querySelector('.ln'), tx: d.querySelector('.tx') }; });

	const scope = el(root, `<div class="lbl"></div><canvas width="960" height="400"></canvas>`, 'scope');
	const sLbl = scope.querySelector('.lbl'), cv = scope.querySelector('canvas'), g = cv.getContext('2d');

	const meter = el(root, `<div class="lbl"><span>JULGAMENTO CRÍTICO</span><b>100%</b></div><div class="tr"><div class="fl"></div></div>`, 'meter');
	const mFill = meter.querySelector('.fl'), mVal = meter.querySelector('b');

	const glbl = [0, 1].map(() => el(root, `<div class="a"></div><div class="b"></div>`, null, 'glbl'));
	const stamp = el(root, `<div class="s1">A HIPNOSE</div><div class="s2">EXISTE</div>`, 'stamp'), stampBox = stamp.querySelector('.s2');

	function drawEEG(T, a) {
		g.clearRect(0, 0, 960, 400);
		const hyp = seg(T, 34, 36);   // em transe: ondas mais lentas e amplas (ilustrativo)
		for (let k = 0; k < 8; k++) {
			const y0 = 28 + k * 49;
			g.strokeStyle = k % 2 ? 'rgba(139,108,255,.95)' : 'rgba(62,230,255,.95)'; g.lineWidth = 3; g.shadowColor = g.strokeStyle; g.shadowBlur = 10;
			g.beginPath();
			const head = 960 * a;
			for (let x = 0; x <= head; x += 3) {
				const t = T - (1 - x / 960) * 2.4;
				const fast = .35 * Math.sin(t * (52 + k * 7) + k) + .25 * Math.sin(t * (91 + k * 3) + k * 2), slow = .6 * Math.sin(t * (12 + k) + k * 1.3);
				const v = lerp(fast, slow, hyp * .7) + .3 * Math.sin(t * (21 + k * 2.3)) * Math.sin(t * 1.7 + k);
				x === 0 ? g.moveTo(x, y0 + v * 17) : g.lineTo(x, y0 + v * 17);
			}
			g.stroke();
			g.fillStyle = C.luz; g.shadowBlur = 16; g.beginPath(); g.arc(head, y0, 4, 0, Math.PI * 2); g.fill();
		}
		g.shadowBlur = 0;
	}
	function drawSync(T, k) {
		g.clearRect(0, 0, 960, 400);
		const y0 = 200, A = 110;
		const wave = (ph, f, x) => Math.sin((x / 960) * Math.PI * 2 * f - T * 6.2 + ph);
		const ph = (1 - k) * Math.PI * 1.1, fB = lerp(3.6, 2.5, k);
		for (const [c, f, p] of [[C.verde, 2.5, 0], [C.emocao, fB, ph]]) {
			g.strokeStyle = c; g.lineWidth = 6; g.shadowColor = c; g.shadowBlur = 18; g.globalCompositeOperation = 'lighter';
			g.beginPath(); for (let x = 0; x <= 960; x += 4) { const y = y0 + wave(p, f, x) * A; x === 0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
		}
		g.globalCompositeOperation = 'source-over'; g.shadowBlur = 0;
		g.font = '700 26px "JetBrains Mono"'; g.fillStyle = C.verde; g.fillText('SENSORIAL', 8, 40); g.fillStyle = C.emocao; g.fillText('EMOCIONAL', 8, 386);
		const pct = Math.round(lerp(31, 94, k));
		g.fillStyle = C.luz; g.textAlign = 'right'; g.fillText(`FASE ${pct}%`, 952, 40); g.textAlign = 'left';
	}

	return function update(T, w) {
		// legendas
		for (const c of caps) {
			if (T < c.t0 - .01 || T > c.t1 + .01) { if (c.d.style.display !== 'none') c.d.style.display = 'none'; continue; }
			c.d.style.display = 'flex';
			const e = ease.expoOut(seg(T, c.t0, c.t0 + .35)), o = ease.cubicInOut(seg(T, c.t1 - .2, c.t1));
			const k = e * (1 - o), sc = (.8 + .2 * e) * (1 + (T - c.t0) * .02) * (1 + o * .06);
			c.d.style.opacity = k;
			c.d.style.transform = `translateY(${(1 - e) * 40 - o * 20}px) scale(${sc})`;
			c.d.style.filter = (1 - k) > .03 ? `blur(${(1 - e) * 14 + o * 10}px)` : 'none';
		}

		// lista ? → ✓
		const end = T > 60, list = end ? Q_END : Q_OPEN;
		const qa = end ? winAlpha(T, [[78.9, 83.3]], .35) : winAlpha(T, [[2.2, 5.95]], .3);
		if (show(ql, qa)) {
			ql.style.transform = `translateY(${(1 - qa) * 30}px)`;
			qRows.forEach((r, i) => {
				const t0 = list[i][1], e = ease.expoOut(seg(T, t0 - .1, t0 + .3));
				r.style.opacity = e; r.style.transform = `translateX(${(1 - e) * -50}px) scale(${1 + .08 * Math.exp(-(T - t0) * 6) * (T > t0)})`;
				r.querySelector('.tx').textContent = list[i][0] + (end ? '' : '?');
				r.querySelector('.tx').style.color = end ? C.luz : (T > t0 && T < (list[i + 1]?.[1] ?? 6) ? C.luz : C.eco);
				const mk = r.querySelector('.mk'), m = end ? ease.expoOut(seg(T, t0 + .1, t0 + .55)) : 0;
				mk.querySelector('span').style.opacity = end ? 0 : 1;
				mk.querySelector('svg').style.strokeDashoffset = 60 * (1 - m);
				mk.style.borderColor = end ? (m > .3 ? C.verde : C.eco) : (T > t0 ? C.sinapse : C.eco);
				mk.style.color = T > t0 ? C.sinapse : C.eco;
			});
			qFoot.style.opacity = end ? ease.expoOut(seg(T, 82.0, 82.4)) : 0;
		}

		// cartão do pesquisador
		const ca = winAlpha(T, [[7.7, 13.5]], .4);
		if (show(card, ca)) {
			card.style.transform = `translateY(${(1 - ca) * 40}px) scale(${.95 + .05 * ca})`;
			[7.75, 9.0, 11.0].forEach((t0, i) => { const e = ease.expoOut(seg(T, t0, t0 + .45)); cardParts[i].style.opacity = e; cardParts[i].style.transform = `translateX(${(1 - e) * -30}px)`; });		}

		// contador
		const na = winAlpha(T, [[15.0, 18.9]], .35);
		if (show(count, na)) { countN.textContent = Math.round(60 * ease.cubicInOut(seg(T, 15.2, 17.6))); count.style.transform = `scale(${.9 + .1 * na})`; }

		// chip de descoberta
		let ch = null; for (const c of CHIPS) if (T >= c[0] && T <= c[1]) ch = c;
		if (show(chip, ch ? winAlpha(T, [[ch[0], ch[1]]], .4) : 0)) { chipS.textContent = ch[2]; chipS.style.color = ch[3]; chip.style.transform = `translateY(${(1 - +chip.style.opacity) * -20}px)`; }

		// etiquetas presas ao 3D
		tags.forEach((tg, i) => {
			const t = w.tags[i];
			if (!t || !show(tg.d, t.a)) { tg.d.style.display = 'none'; return; }
			const p = w.project(t.pos); let dir = t.side === 'right' ? 1 : -1; const len = (t.len ?? 150) * ease.expoOut(clamp(t.a * 1.4));
			const ang = (t.ang ?? -20) * Math.PI / 180;
			tg.tx.innerHTML = t.text + (t.sub ? `<small>${t.sub}</small>` : '');
			const tw = tg.tx.offsetWidth || 300, full = (t.len ?? 150) * Math.cos((t.ang ?? -20) * Math.PI / 180) + 14;
			if (dir > 0 && p.x + full + tw > 910) dir = -1; else if (dir < 0 && p.x - full - tw < 50) dir = 1;
			tg.d.style.left = p.x + 'px'; tg.d.style.top = p.y + 'px'; tg.d.style.color = t.color;
			tg.ln.style.width = len + 'px'; tg.ln.style.transform = `rotate(${dir > 0 ? ang : Math.PI - ang}rad)`;
			const ex = Math.cos(ang) * len * dir, ey = Math.sin(ang) * len;
			tg.tx.style.left = (dir > 0 ? ex + 14 : ex - 14) + 'px'; tg.tx.style.top = (ey - 26) + 'px';
			tg.tx.style.transform = dir > 0 ? 'none' : 'translateX(-100%)'; tg.tx.style.textAlign = dir > 0 ? 'left' : 'right';
			tg.tx.style.opacity = seg(t.a, .4, 1);
		});

		// osciloscópio: EEG ou sincronia
		const ea = winAlpha(T, [[19.0, 22.35], [35.6, 38.5]], .4), sa = winAlpha(T, [[64.0, 71.3]], .45);
		if (show(scope, Math.max(ea, sa))) {
			if (sa > ea) { scope.style.top = '330px'; sLbl.textContent = 'SINCRONIA ENTRE REGIÕES'; drawSync(T, ease.cubicInOut(seg(T, 65.6, 68.2))); }
			else { scope.style.top = '250px'; sLbl.textContent = T < 30 ? 'EEG · 8 CANAIS (ILUSTRATIVO)' : 'EEG · EM TRANSE (ILUSTRATIVO)'; drawEEG(T, ease.cubicInOut(seg(T, T < 30 ? 19.0 : 35.6, (T < 30 ? 19.0 : 35.6) + 1.2))); }
			scope.style.transform = `translateY(${(1 - Math.max(ea, sa)) * -30}px)`;
		}

		// medidor de julgamento crítico
		const ma = winAlpha(T, [[57.0, 63.4]], .4);
		if (show(meter, ma)) {
			const v = Math.min(1, lerp(1, .22, ease.cubicInOut(seg(T, 60.3, 62.2))) + .015 * Math.sin(T * 9));
			mFill.style.width = (v * 100) + '%'; mVal.textContent = Math.round(v * 100) + '%'; mVal.style.color = v < .5 ? C.emocao : C.luz;
		}

		// rótulos de grupos / comparação
		glbl.forEach((d, i) => {
			const o = w.ui.groups && w.ui.groups[i];
			if (!o || !show(d, o.a)) { d.style.display = 'none'; return; }
			d.style.left = (o.x - 210) + 'px'; d.style.top = o.y + 'px';
			d.querySelector('.a').innerHTML = o.text; d.querySelector('.a').style.color = o.color; d.querySelector('.b').textContent = o.sub || '';
			d.style.transform = `translateY(${(1 - o.a) * 20}px)`;
		});

		// carimbo final
		const st = seg(T, 86.4, 86.75);
		if (show(stamp, T > 86.4 ? ease.expoOut(st) : 0)) {
			stampBox.style.transform = `scale(${lerp(2.2, 1, ease.expoOut(st)) * (1 + .012 * Math.sin(T * 5))}) rotate(${lerp(-8, -3, ease.expoOut(st))}deg)`;
			stamp.querySelector('.s1').style.opacity = ease.expoOut(seg(T, 86.55, 87.0));
		}
	};
}
