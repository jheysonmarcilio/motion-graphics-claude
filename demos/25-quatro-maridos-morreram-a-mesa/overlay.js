// Legendas palavra a palavra (words.json: { w, a, d, s }) no estilo fixo do canal: Inter 900, caixa alta,
// grupos de até 3 palavras por frase; a palavra falada acende (mostarda), palavras-chave ficam laranja.
// Tamanho medido para caber em 2 linhas de 860 px. Carimbo fixo da identidade.
import { seg, ease } from './lib.js';

const KEY = /^(quatro|cozinha|1954|arsênico|rato|Nannie|Doss|avó|sorridente|três|natural|coração|estômago|doença|risonha|veneno|café|condenada|perpétua|sorriso)$/i;
const STAMP = [-9, -8, ['']];
const BASE = 104, MAXW = 860;
const NUM = { quarenta: '40', cem: '100', treze: '13', setenta: '70' };

function prep(words) {
	const out = [];
	for (let i = 0; i < words.length; i++) {
		const w = words[i], nx = words[i + 1]?.w || '';
		const merge = (n, t) => { const e = words[i + n - 1]; out.push({ w: t, a: w.a, d: e.a + e.d - w.a, s: w.s }); i += n - 1; };
		if (/^mil$/i.test(w.w) && /^novecentos$/i.test(nx)) { merge(6, '1954'); continue; }       // mil novecentos e cinquenta e quatro
		out.push(NUM[w.w.toLowerCase()] ? { ...w, w: NUM[w.w.toLowerCase()] } : w);
	}
	return out;
}

export function buildOverlay(root, raw) {
	const words = prep(raw), groups = [];
	let cur = null;
	for (const w of words) {
		const len = cur ? cur.ws.reduce((a, x) => a + x.w.length + 1, 0) + w.w.length : 0;
		if (!cur || cur.s !== w.s || cur.ws.length >= 3 || len > 17) { cur = { s: w.s, ws: [] }; groups.push(cur); }
		cur.ws.push(w);
	}
	groups.forEach((g, i) => { const l = g.ws.at(-1), n = groups[i + 1]; g.t0 = g.ws[0].a - .05; g.t1 = Math.min(n ? n.ws[0].a - .06 : 99, l.a + l.d + .45); });
	const ctx = document.createElement('canvas').getContext('2d');
	const width = (t, s) => { ctx.font = `900 ${s}px Inter`; return ctx.measureText(t.toUpperCase()).width + t.length * s * .02 + s * .3; };
	for (const g of groups) {
		const d = g.d = document.createElement('div'); d.className = 'cap';
		let s = BASE;
		for (; s > 40; s -= 2) {
			if (Math.max(...g.ws.map(w => width(w.w, s))) > MAXW) continue;
			let lines = 1, c = 0; for (const w of g.ws) { const ww = width(w.w, s); if (c && c + ww > MAXW) { lines++; c = ww; } else c += ww; }
			if (lines <= 2) break;
		}
		d.style.fontSize = s + 'px'; d.style.webkitTextStrokeWidth = Math.round(s * .19) + 'px';
		g.spans = g.ws.map(w => { const sp = document.createElement('span'); sp.className = 'w' + (KEY.test(w.w) ? ' k' : ''); sp.style.margin = '0 .13em'; sp.textContent = w.w; d.appendChild(sp); return sp; });
		root.appendChild(d);
	}
	const stamp = document.createElement('div'); stamp.className = 'stamp'; stamp.innerHTML = STAMP[2].map(l => `<span>${l}</span>`).join('');
	root.appendChild(stamp);
	return T => {
		for (const g of groups) {
			const on = T >= g.t0 && T <= g.t1;
			g.d.style.display = on ? 'flex' : 'none'; if (!on) continue;
			const o = ease.expoIn(seg(T, g.t1 - .12, g.t1));
			g.ws.forEach((w, i) => {
				const sp = g.spans[i], k = seg(T, w.a - .06, w.a + .16), e = ease.backOut(k);
				sp.style.opacity = Math.min(1, k * 2) * (1 - o);
				sp.style.transform = `translateY(${(1 - e) * 26 - o * 18}px) scale(${(.85 + .15 * e) * (1 + .06 * (T >= w.a && T < w.a + w.d ? 1 : 0))})`;
				sp.classList.toggle('hl', T >= w.a && T < w.a + w.d + .08 && !sp.classList.contains('k'));
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
