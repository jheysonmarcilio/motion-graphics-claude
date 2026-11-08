// Desenhos procedurais em canvas: fotos antigas (pessoas SEM rosto), ícones, cartões, documentos.
// Tudo determinístico (seed fixa por desenho).
import * as THREE from 'three';
import { canvasTex, mulberry32, C, fitFont } from './lib.js';

// ── pessoa sem rosto (silhueta chapada) ──
function person(g, x, y, h, { body = '#5b4a3a', skin = '#c9a98a', dress = null, child = false, arm = 0 } = {}) {
	const hr = h * (child ? .13 : .1), bw = h * (child ? .26 : .24);
	g.save(); g.translate(x, y);
	// pernas
	g.fillStyle = body; g.fillRect(-bw * .32, -h * .42, bw * .26, h * .42); g.fillRect(bw * .06, -h * .42, bw * .26, h * .42);
	// tronco / vestido
	g.fillStyle = dress || body;
	g.beginPath();
	if (dress) { g.moveTo(-bw * .35, -h * .78); g.lineTo(bw * .35, -h * .78); g.lineTo(bw * .62, -h * .36); g.lineTo(-bw * .62, -h * .36); }
	else { g.roundRect(-bw / 2, -h * .8, bw, h * .44, bw * .25); }
	g.fill();
	// braços
	g.strokeStyle = dress || body; g.lineWidth = bw * .2; g.lineCap = 'round';
	g.beginPath(); g.moveTo(-bw * .45, -h * .74); g.lineTo(-bw * .62, -h * .48 - arm * h * .25); g.stroke();
	g.beginPath(); g.moveTo(bw * .45, -h * .74); g.lineTo(bw * .62, -h * .48 - arm * h * .25); g.stroke();
	// pescoço + cabeça lisa (sem rosto)
	g.fillStyle = skin; g.fillRect(-bw * .1, -h * .86, bw * .2, h * .08);
	g.beginPath(); g.ellipse(0, -h * .86 - hr * .95, hr * .82, hr, 0, 0, Math.PI * 2); g.fill();
	// cabelo (só um tom escuro em cima)
	g.fillStyle = 'rgba(40,30,22,.85)'; g.beginPath(); g.ellipse(0, -h * .86 - hr * 1.25, hr * .86, hr * .7, 0, Math.PI, 0); g.fill();
	g.restore();
}

function grain(g, w, h, rng, a = .08) {
	for (let i = 0; i < w * h / 60; i++) { g.fillStyle = `rgba(${rng() < .5 ? '255,255,255' : '0,0,0'},${rng() * a})`; g.fillRect(rng() * w, rng() * h, 1.5, 1.5); }
	const v = g.createRadialGradient(w / 2, h / 2, h * .3, w / 2, h / 2, h * .85); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(30,15,0,.45)'); g.fillStyle = v; g.fillRect(0, 0, w, h);
}
function frame(g, w, h, b = 26) { g.strokeStyle = '#efe6d2'; g.lineWidth = b * 2; g.strokeRect(0, 0, w, h); }

const SCENES = {
	aniversario(g, w, h, r) {
		g.fillStyle = '#a58c6c'; g.fillRect(0, 0, w, h);                      // parede
		g.fillStyle = '#8f7558'; for (let x = 0; x < w; x += 70) g.fillRect(x, 0, 6, h * .62);
		g.fillStyle = '#6d5844'; g.fillRect(0, h * .62, w, h);                // chão
		// bandeirinhas
		for (let i = 0; i < 12; i++) { g.fillStyle = ['#c9b089', '#9c7f5c', '#d8c3a0'][i % 3]; g.beginPath(); const x = 60 + i * 80, y = 80 + Math.sin(i * .5) * 12; g.moveTo(x, y); g.lineTo(x + 60, y); g.lineTo(x + 30, y + 50); g.fill(); }
		// mesa + bolo
		g.fillStyle = '#e4d6bb'; g.fillRect(w * .2, h * .58, w * .6, h * .1); g.fillStyle = '#5a4634'; g.fillRect(w * .23, h * .68, 18, h * .3); g.fillRect(w * .75, h * .68, 18, h * .3);
		g.fillStyle = '#f1e7d4'; g.fillRect(w * .44, h * .5, w * .12, h * .08); g.fillStyle = '#ffe6a8'; for (let i = 0; i < 5; i++) g.fillRect(w * .455 + i * 22, h * .45, 5, 22);
		person(g, w * .18, h * .95, h * .72, { body: '#4f4033' });
		person(g, w * .33, h * .96, h * .66, { body: '#6b5a49', arm: .4 });
		person(g, w * .5, h * .97, h * .44, { child: true, dress: '#d0283f' });  // vestido vermelho (única cor)
		person(g, w * .68, h * .96, h * .7, { body: '#3e342b' });
		person(g, w * .84, h * .95, h * .64, { body: '#5d4c3d', arm: .2 });
	},
	quintal(g, w, h) {
		g.fillStyle = '#b7a684'; g.fillRect(0, 0, w, h * .5); g.fillStyle = '#7d7350'; g.fillRect(0, h * .5, w, h);
		g.fillStyle = '#5c4c38'; g.fillRect(w * .72, h * .1, w * .3, h * .45); g.fillStyle = '#8a7656'; g.fillRect(w * .76, h * .2, 90, 90);
		g.fillStyle = '#4b4532'; g.beginPath(); g.arc(w * .2, h * .3, h * .22, 0, 7); g.fill(); g.fillRect(w * .19, h * .3, 22, h * .3);
		person(g, w * .42, h * .92, h * .6, { body: '#4c3f31' }); person(g, w * .55, h * .93, h * .38, { child: true, body: '#7a6a55' });
	},
	praia(g, w, h) {
		const s = g.createLinearGradient(0, 0, 0, h * .45); s.addColorStop(0, '#c7bda6'); s.addColorStop(1, '#ddd2b8'); g.fillStyle = s; g.fillRect(0, 0, w, h * .45);
		g.fillStyle = '#8e8a78'; g.fillRect(0, h * .45, w, h * .15); g.fillStyle = '#d8c7a2'; g.fillRect(0, h * .6, w, h);
		for (let i = 0; i < 6; i++) { g.strokeStyle = 'rgba(240,235,220,.6)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, h * .5 + i * 9); for (let x = 0; x < w; x += 20) g.lineTo(x, h * .5 + i * 9 + Math.sin(x * .03 + i) * 3); g.stroke(); }
		person(g, w * .3, h * .92, h * .6, { body: '#6a5642' }); person(g, w * .44, h * .94, h * .36, { child: true, body: '#8d7a62' }); person(g, w * .62, h * .92, h * .62, { body: '#4d4136' });
	},
	corredor(g, w, h) {
		g.fillStyle = '#9b8b70'; g.fillRect(0, 0, w, h);
		g.fillStyle = '#7b6c55'; g.beginPath(); g.moveTo(0, 0); g.lineTo(w * .4, h * .35); g.lineTo(w * .4, h * .7); g.lineTo(0, h); g.fill();
		g.beginPath(); g.moveTo(w, 0); g.lineTo(w * .6, h * .35); g.lineTo(w * .6, h * .7); g.lineTo(w, h); g.fill();
		g.fillStyle = '#c9b993'; g.fillRect(w * .4, h * .35, w * .2, h * .35);
		person(g, w * .5, h * .78, h * .3, { child: true, body: '#5a4a39' });
	},
	shopping(g, w, h) {
		g.fillStyle = '#a89878'; g.fillRect(0, 0, w, h); g.fillStyle = '#8a7a60'; g.fillRect(0, h * .66, w, h);
		for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? '#c4b28f' : '#b6a27e'; g.fillRect(i * w / 5 + 10, h * .18, w / 5 - 20, h * .42); g.fillStyle = '#6f614b'; g.fillRect(i * w / 5 + 10, h * .12, w / 5 - 20, h * .06); }
		for (let i = 0; i < 6; i++) person(g, 80 + i * 170 + (i % 2) * 40, h * .9 - (i % 2) * 20, h * .55, { body: ['#5d4e3e', '#6e604d', '#4a3e33'][i % 3] });
		person(g, w * .5, h * .97, h * .36, { child: true, body: '#3d332a' });
	},
	parque(g, w, h) {
		g.fillStyle = '#bcb08f'; g.fillRect(0, 0, w, h * .55); g.fillStyle = '#7a7550'; g.fillRect(0, h * .55, w, h);
		g.fillStyle = '#5a573a'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(120 + i * 260, h * .42, 90, 0, 7); g.fill(); }
		person(g, w * .3, h * .93, h * .64, { body: '#4f4234' }); person(g, w * .48, h * .95, h * .4, { child: true, body: '#7c6b55' }); person(g, w * .66, h * .93, h * .62, { body: '#5f4f3f' });
	},
	parque_buraco(g, w, h) {
		g.fillStyle = '#bcb08f'; g.fillRect(0, 0, w, h * .55); g.fillStyle = '#7a7550'; g.fillRect(0, h * .55, w, h);
		g.fillStyle = '#5a573a'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(120 + i * 260, h * .42, 90, 0, 7); g.fill(); }
		person(g, w * .3, h * .93, h * .64, { body: '#4f4234' }); person(g, w * .66, h * .93, h * .62, { body: '#5f4f3f' });
		g.save(); g.translate(w * .48, 0); g.scale(1.06, 1); g.translate(-w * .48, 0); person(g, w * .48, h * .95, h * .41, { child: true, body: '#e9e0cc', skin: '#e9e0cc', arm: .9 }); g.restore();
	},
	ceu(g, w, h) {
		const s = g.createLinearGradient(0, 0, 0, h); s.addColorStop(0, '#b9b4a2'); s.addColorStop(.75, '#d9cfb6'); s.addColorStop(.76, '#8a8466'); s.addColorStop(1, '#6f6a50'); g.fillStyle = s; g.fillRect(0, 0, w, h);
		g.fillStyle = '#625d45'; for (let x = 0; x < w; x += 40) { g.beginPath(); g.arc(x, h * .76, 26 + (x * 7 % 13), Math.PI, 0); g.fill(); }
	},
	balao(g, w, h) {
		SCENES.ceu(g, w, h);
		const cx = w * .55, cy = h * .3;
		g.fillStyle = '#9c7a5e'; g.beginPath(); g.ellipse(cx, cy, w * .16, h * .24, 0, 0, Math.PI * 2); g.fill();
		g.fillStyle = '#c4a483'; for (let i = -1; i <= 1; i++) { g.beginPath(); g.ellipse(cx + i * w * .06, cy, w * .022, h * .235, 0, 0, Math.PI * 2); g.fill(); }
		g.strokeStyle = '#4a3b2e'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - w * .1, cy + h * .19); g.lineTo(cx - w * .04, cy + h * .36); g.moveTo(cx + w * .1, cy + h * .19); g.lineTo(cx + w * .04, cy + h * .36); g.stroke();
		person(g, cx - w * .015, cy + h * .41, h * .14, { child: true, body: '#7c6b55', arm: .9 });
		person(g, cx + w * .025, cy + h * .43, h * .16, { body: '#4f4234' });
		g.fillStyle = '#6b5440'; g.fillRect(cx - w * .05, cy + h * .36, w * .1, h * .08);
	},
	familia(g, w, h) {
		g.fillStyle = '#a6957a'; g.fillRect(0, 0, w, h); g.fillStyle = '#7d6c55'; g.fillRect(0, h * .7, w, h);
		g.fillStyle = '#8d7c63'; g.fillRect(w * .1, h * .1, w * .25, h * .3);
		person(g, w * .26, h * .96, h * .72, { body: '#4a3d31' }); person(g, w * .42, h * .97, h * .46, { child: true, body: '#7c6a54' });
		person(g, w * .58, h * .97, h * .5, { child: true, body: '#695845' }); person(g, w * .74, h * .96, h * .68, { body: '#57483a' });
	},
};

// foto antiga completa (com borda creme e grão)
export function photoTex(kind, seed = 1, w = 1024, h = 768) {
	return canvasTex(w, h, (g) => { const r = mulberry32(seed); SCENES[kind](g, w, h, r); grain(g, w, h, r); frame(g, w, h); });
}
// recorte da criança da foto "parque" (com contorno branco de tesoura), fundo transparente
export function cutoutTex(border = true, w = 512, h = 512) {
	return canvasTex(w, h, g => {
		if (border) g.save(); else g.save(); g.shadowColor = '#f3ead6'; g.shadowBlur = 0;
		for (const [dx, dy] of (border ? [[-8, 0], [8, 0], [0, -8], [0, 8], [-6, -6], [6, 6], [6, -6], [-6, 6]] : [])) { g.save(); g.translate(dx, dy); g.filter = 'brightness(0) invert(.95)'; person(g, w / 2, h * .95, h * .78, { child: true, body: '#fff', skin: '#fff' }); g.restore(); }
		g.restore();
		person(g, w / 2, h * .95, h * .78, { child: true, body: '#7c6b55', arm: .9 });
	});
}
// balão sozinho (camada com alfa) — cesto vazio
export function balloonTex(w = 512, h = 768) {
	return canvasTex(w, h, g => {
		const cx = w / 2;
		g.fillStyle = '#b8805a'; g.beginPath(); g.ellipse(cx, h * .3, w * .4, h * .28, 0, 0, Math.PI * 2); g.fill();
		g.fillStyle = '#d9b48c'; for (let i = -2; i <= 2; i++) { g.beginPath(); g.ellipse(cx + i * w * .14, h * .3, w * .05, h * .27, 0, 0, Math.PI * 2); g.fill(); }
		g.strokeStyle = '#4a3b2e'; g.lineWidth = 4; g.beginPath(); g.moveTo(cx - w * .28, h * .5); g.lineTo(cx - w * .12, h * .78); g.moveTo(cx + w * .28, h * .5); g.lineTo(cx + w * .12, h * .78); g.stroke();
		g.fillStyle = '#6b5440'; g.fillRect(cx - w * .14, h * .78, w * .28, h * .14);
		g.strokeStyle = '#4a3b2e'; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(cx - w * .14 + i * w * .056, h * .78); g.lineTo(cx - w * .14 + i * w * .056, h * .92); g.stroke(); }
	});
}
export function cloudTex(seed = 3) {
	return canvasTex(512, 256, g => { const r = mulberry32(seed); for (let i = 0; i < 14; i++) { const x = 90 + r() * 330, y = 110 + r() * 60, rr = 40 + r() * 50; const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(245,240,228,.9)'); gr.addColorStop(1, 'rgba(245,240,228,0)'); g.fillStyle = gr; g.fillRect(0, 0, 512, 256); } });
}
// pintura "rica" do passeio (o que a imaginação completa)
export function paintedBalloonTex(w = 1280, h = 800) {
	return canvasTex(w, h, g => {
		const r = mulberry32(77);
		const s = g.createLinearGradient(0, 0, 0, h); s.addColorStop(0, '#2b2a6e'); s.addColorStop(.45, '#c4568a'); s.addColorStop(.75, '#ffb070'); s.addColorStop(1, '#ffd9a0'); g.fillStyle = s; g.fillRect(0, 0, w, h);
		const sun = g.createRadialGradient(w * .7, h * .78, 0, w * .7, h * .78, 260); sun.addColorStop(0, 'rgba(255,240,200,1)'); sun.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = sun; g.fillRect(0, 0, w, h);
		for (let i = 0; i < 1400; i++) { const y = r() * h, x = r() * w; g.strokeStyle = `hsla(${300 + r() * 80},70%,${55 + r() * 25}%,.10)`; g.lineWidth = 6 + r() * 14; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 40 + r() * 80, y + (r() - .5) * 12); g.stroke(); }
		g.fillStyle = '#3a2a4a'; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 40) g.lineTo(x, h * .86 + Math.sin(x * .01) * 26 + Math.sin(x * .037) * 10); g.lineTo(w, h); g.fill();
		const cx = w * .38, cy = h * .36;
		g.fillStyle = '#e8506e'; g.beginPath(); g.ellipse(cx, cy, 150, 175, 0, 0, Math.PI * 2); g.fill();
		g.fillStyle = '#ffd36b'; for (let i = -2; i <= 2; i += 2) { g.beginPath(); g.ellipse(cx + i * 45, cy, 26, 172, 0, 0, Math.PI * 2); g.fill(); }
		g.fillStyle = '#3ee6ff'; g.beginPath(); g.ellipse(cx, cy, 24, 172, 0, 0, Math.PI * 2); g.fill();
		g.strokeStyle = '#2a1d1d'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 110, cy + 130); g.lineTo(cx - 45, cy + 250); g.moveTo(cx + 110, cy + 130); g.lineTo(cx + 45, cy + 250); g.stroke();
		g.fillStyle = '#7a4a2a'; g.fillRect(cx - 50, cy + 250, 100, 56);
		person(g, cx - 18, cy + 262, 70, { child: true, body: '#2b8fa6', skin: '#e8b48f', arm: .9 });
		g.fillStyle = '#e8b48f'; g.beginPath(); g.ellipse(cx + 40, cy + 252, 12, 7, -.3, 0, 7); g.fill();     // mão da mãe na borda
		g.strokeStyle = '#2a1d2d'; g.lineWidth = 3; for (let i = 0; i < 7; i++) { const x = w * .62 + r() * 300, y = h * .2 + r() * 150; g.beginPath(); g.moveTo(x - 12, y); g.quadraticCurveTo(x - 4, y - 8, x, y); g.quadraticCurveTo(x + 4, y - 8, x + 12, y); g.stroke(); }
	});
}

// ── ícones de traço fino (para cartões, tokens, síntese) ──
export function iconTex(name, color = C.luz, size = 256, lw = 10) {
	return canvasTex(size, size, g => {
		const s = size, c = s / 2; g.strokeStyle = color; g.fillStyle = color; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
		const P = (f) => { g.beginPath(); f(); g.stroke(); };
		switch (name) {
			case 'guarda-chuva': P(() => { g.arc(c, c, s * .32, Math.PI, 0); g.lineTo(c - s * .32, c); }); P(() => { g.moveTo(c, c); g.lineTo(c, s * .78); g.arc(c - s * .06, s * .78, s * .06, 0, Math.PI); }); break;
			case 'chave': P(() => g.arc(s * .32, c, s * .13, 0, 7)); P(() => { g.moveTo(s * .45, c); g.lineTo(s * .82, c); g.moveTo(s * .7, c); g.lineTo(s * .7, c + s * .12); g.moveTo(s * .8, c); g.lineTo(s * .8, c + s * .1); }); break;
			case 'peixe': P(() => { g.ellipse(c - s * .05, c, s * .26, s * .14, 0, 0, 7); }); P(() => { g.moveTo(s * .7, c); g.lineTo(s * .86, c - s * .12); g.lineTo(s * .86, c + s * .12); g.closePath(); }); g.beginPath(); g.arc(s * .3, c - s * .03, lw * .7, 0, 7); g.fill(); break;
			case 'xicara': P(() => { g.moveTo(s * .25, s * .35); g.lineTo(s * .3, s * .7); g.lineTo(s * .62, s * .7); g.lineTo(s * .67, s * .35); g.closePath(); }); P(() => g.arc(s * .7, s * .48, s * .08, -1.2, 1.2)); break;
			case 'relogio': P(() => g.arc(c, c, s * .32, 0, 7)); P(() => { g.moveTo(c, c); g.lineTo(c, c - s * .2); g.moveTo(c, c); g.lineTo(c + s * .14, c); }); break;
			case 'casa': P(() => { g.moveTo(s * .2, s * .48); g.lineTo(c, s * .22); g.lineTo(s * .8, s * .48); g.moveTo(s * .28, s * .44); g.lineTo(s * .28, s * .78); g.lineTo(s * .72, s * .78); g.lineTo(s * .72, s * .44); }); break;
			case 'arvore': P(() => g.arc(c, s * .4, s * .22, 0, 7)); P(() => { g.moveTo(c, s * .62); g.lineTo(c, s * .82); }); break;
			case 'estrela': P(() => { for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? s * .14 : s * .32; i ? g.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r) : g.moveTo(c + Math.cos(a) * r, c + Math.sin(a) * r); } }); break;
			case 'bicicleta': P(() => g.arc(s * .3, s * .6, s * .14, 0, 7)); P(() => g.arc(s * .7, s * .6, s * .14, 0, 7)); P(() => { g.moveTo(s * .3, s * .6); g.lineTo(s * .45, s * .38); g.lineTo(s * .62, s * .38); g.lineTo(s * .7, s * .6); g.moveTo(s * .45, s * .38); g.lineTo(s * .52, s * .6); g.lineTo(s * .62, s * .38); }); break;
			case 'balao': P(() => g.ellipse(c, s * .38, s * .2, s * .24, 0, 0, 7)); P(() => { g.moveTo(c - s * .14, s * .56); g.lineTo(c - s * .07, s * .7); g.moveTo(c + s * .14, s * .56); g.lineTo(c + s * .07, s * .7); g.rect(c - s * .08, s * .7, s * .16, s * .1); }); break;
			case 'sapato': P(() => { g.moveTo(s * .2, s * .4); g.lineTo(s * .2, s * .66); g.lineTo(s * .8, s * .66); g.quadraticCurveTo(s * .8, s * .52, s * .55, s * .5); g.lineTo(s * .42, s * .4); g.closePath(); }); break;
			case 'olho': P(() => { g.moveTo(s * .15, c); g.quadraticCurveTo(c, s * .2, s * .85, c); g.quadraticCurveTo(c, s * .8, s * .15, c); }); P(() => g.arc(c, c, s * .1, 0, 7)); break;
			case 'calendario': P(() => g.rect(s * .2, s * .25, s * .6, s * .55)); P(() => { g.moveTo(s * .2, s * .38); g.lineTo(s * .8, s * .38); g.moveTo(s * .35, s * .18); g.lineTo(s * .35, s * .3); g.moveTo(s * .65, s * .18); g.lineTo(s * .65, s * .3); }); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { g.beginPath(); g.arc(s * (.32 + i * .18), s * (.48 + j * .1), lw * .6, 0, 7); g.fill(); } break;
			case 'foto': P(() => g.rect(s * .18, s * .26, s * .64, s * .48)); P(() => { g.moveTo(s * .22, s * .68); g.lineTo(s * .42, s * .48); g.lineTo(s * .56, s * .6); g.lineTo(s * .64, s * .52); g.lineTo(s * .78, s * .68); }); P(() => g.arc(s * .66, s * .38, s * .05, 0, 7)); break;
			case 'boca': P(() => { g.moveTo(s * .2, c); g.quadraticCurveTo(c, s * .3, s * .8, c); g.quadraticCurveTo(c, s * .72, s * .2, c); }); P(() => { g.moveTo(s * .82, s * .36); g.lineTo(s * .9, s * .3); g.moveTo(s * .84, c); g.lineTo(s * .94, c); }); break;
			case 'caneta': P(() => { g.moveTo(s * .25, s * .75); g.lineTo(s * .7, s * .3); g.lineTo(s * .78, s * .38); g.lineTo(s * .33, s * .83); g.closePath(); g.moveTo(s * .25, s * .75); g.lineTo(s * .2, s * .88); g.lineTo(s * .33, s * .83); }); break;
			case 'cartao': P(() => g.rect(s * .18, s * .28, s * .64, s * .44)); P(() => { g.moveTo(s * .26, s * .42); g.lineTo(s * .7, s * .42); g.moveTo(s * .26, s * .52); g.lineTo(s * .62, s * .52); g.moveTo(s * .26, s * .62); g.lineTo(s * .52, s * .62); }); break;
			case 'raio': P(() => { g.moveTo(s * .56, s * .15); g.lineTo(s * .34, s * .52); g.lineTo(s * .52, s * .52); g.lineTo(s * .42, s * .86); g.lineTo(s * .68, s * .44); g.lineTo(s * .5, s * .44); g.closePath(); }); break;
			case 'onda': for (let j = 0; j < 3; j++) P(() => { for (let x = 0; x <= 60; x++) { const xx = s * .15 + x * s * .7 / 60, yy = s * (.35 + j * .15) + Math.sin(x * .3 + j) * s * .05; x ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } }); break;
			case 'intestino': P(() => { g.moveTo(s * .3, s * .25); g.lineTo(s * .7, s * .25); g.quadraticCurveTo(s * .8, s * .25, s * .8, s * .35); g.lineTo(s * .8, s * .7); g.quadraticCurveTo(s * .8, s * .8, s * .7, s * .8); g.lineTo(s * .35, s * .8); for (let k = 0; k < 3; k++) { g.moveTo(s * .32, s * (.38 + k * .13)); g.bezierCurveTo(s * .45, s * (.32 + k * .13), s * .55, s * (.44 + k * .13), s * .68, s * (.38 + k * .13)); } }); break;
			case 'video': P(() => g.roundRect(s * .12, s * .22, s * .76, s * .56, s * .06)); g.beginPath(); g.moveTo(s * .44, s * .38); g.lineTo(s * .62, c); g.lineTo(s * .44, s * .62); g.closePath(); g.fill(); break;
			case 'pasta': P(() => { g.moveTo(s * .15, s * .3); g.lineTo(s * .4, s * .3); g.lineTo(s * .46, s * .38); g.lineTo(s * .85, s * .38); g.lineTo(s * .85, s * .75); g.lineTo(s * .15, s * .75); g.closePath(); }); break;
			case 'familia': selo(g, s, color, lw); break;
		}
	});
}
function selo(g, s, color, lw) {
	const c = s / 2; g.strokeStyle = color; g.fillStyle = color; g.lineWidth = lw;
	g.beginPath(); g.arc(c, c, s * .44, 0, 7); g.stroke(); g.lineWidth = lw * .5; g.beginPath(); g.arc(c, c, s * .36, 0, 7); g.stroke();
	const fig = (x, h) => { g.beginPath(); g.arc(x, c + s * .08 - h, h * .28, 0, 7); g.fill(); g.beginPath(); g.roundRect(x - h * .22, c + s * .08 - h * .7, h * .44, h * .72, h * .12); g.fill(); };
	fig(c - s * .14, s * .26); fig(c + s * .14, s * .24); fig(c, s * .16);
	fitFont(g, 'FAMÍLIA', s * .5, { size: s * .075, track: .27 }); g.textAlign = 'center'; g.fillText('FAMÍLIA', c, c + s * .23);
}
export function stampTex(text, color = C.emocao, w = 640, h = 240) {
	return canvasTex(w, h, g => {
		g.strokeStyle = color; g.fillStyle = color; g.lineWidth = 10; g.strokeRect(14, 14, w - 28, h - 28); g.lineWidth = 3; g.strokeRect(30, 30, w - 60, h - 60);
		fitFont(g, text, w - 150, { size: h * .3, track: .07 }); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 4);
		g.globalCompositeOperation = 'destination-out'; const r = mulberry32(text.length * 31); for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(0,0,0,${r() * .7})`; g.fillRect(r() * w, r() * h, 3 + r() * 6, 2 + r() * 4); }
	});
}

// cartão de história (caderno do experimento)
export function cardTex(title, n, color = C.sinapse, w = 600, h = 400) {
	return canvasTex(w, h, g => {
		g.fillStyle = 'rgba(10,14,30,.92)'; g.fillRect(0, 0, w, h);
		g.strokeStyle = color; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
		g.fillStyle = color; fitFont(g, `HISTÓRIA ${n}`, w - 80, { weight: 700, size: 34, track: .18 }); g.fillText(`HISTÓRIA ${n}`, 40, 70);
		g.fillStyle = C.luz; fitFont(g, title, w - 80, { weight: 300, size: 44 }); g.fillText(title, 40, 150);
		g.strokeStyle = 'rgba(238,234,255,.35)'; g.lineWidth = 3; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(40, 220 + i * 44); g.lineTo(w - 40 - (i * 37 % 120), 220 + i * 44); g.stroke(); }
	});
}
// documento genérico (linhas de texto, título)
export function docTex(title, sub = '', lines = 14, w = 700, h = 920, color = '#1b1a2e') {
	return canvasTex(w, h, g => {
		g.fillStyle = '#ece6d6'; g.fillRect(0, 0, w, h);
		g.fillStyle = color; fitFont(g, title, w - 120, { size: 40, track: .1 }); g.fillText(title, 60, 110);
		if (sub) { fitFont(g, sub, w - 120, { weight: 400, size: 28 }); g.fillStyle = '#4a4860'; g.fillText(sub, 60, 160); }
		const r = mulberry32(title.length * 7 + 3);
		g.fillStyle = 'rgba(30,28,50,.55)'; for (let i = 0; i < lines; i++) g.fillRect(60, 220 + i * 46, (w - 120) * (.55 + r() * .45), 14);
	});
}
// pasta de arquivo (frente) com etiqueta
export function folderTex(label = '', color = '#c9b78f', w = 800, h = 560, scribble = false) {
	return canvasTex(w, h, g => {
		g.fillStyle = color; g.beginPath(); g.moveTo(0, 60); g.lineTo(240, 60); g.lineTo(280, 0); g.lineTo(w * .55, 0); g.lineTo(w * .58, 60); g.lineTo(w, 60); g.lineTo(w, h); g.lineTo(0, h); g.fill();
		g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(0, 60, w, 8);
		if (label) { g.fillStyle = '#f4efe2'; g.fillRect(60, 110, 360, 90); g.fillStyle = '#2a2638'; fitFont(g, label, 360 - 40, { size: 46, track: .065 }); g.textBaseline = 'middle'; g.fillText(label, 80, 155); g.textBaseline = 'alphabetic'; }
		if (scribble) { const r = mulberry32(5); g.strokeStyle = 'rgba(40,30,60,.5)'; g.lineWidth = 4; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(70, 270 + i * 44); for (let x = 70; x < w - 80 - r() * 200; x += 18) g.lineTo(x, 270 + i * 44 + Math.sin(x * .2 + i) * 5); g.stroke(); } }
	});
}
// textura de madeira escura
export function woodTex(w = 1024, h = 1024, base = '#2a1d16') {
	const t = canvasTex(w, h, g => {
		g.fillStyle = base; g.fillRect(0, 0, w, h); const r = mulberry32(11);
		for (let i = 0; i < 260; i++) { g.strokeStyle = `rgba(${r() < .5 ? '0,0,0' : '90,60,40'},${.05 + r() * .12})`; g.lineWidth = 1 + r() * 4; const y = r() * h; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x * .004 + i) * 14 + Math.sin(x * .02 + i * 3) * 3); g.stroke(); }
	});
	t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
// página do álbum (papel escuro com cantoneiras)
export function pageTex(w = 1024, h = 740) {
	return canvasTex(w, h, g => {
		g.fillStyle = '#1d1712'; g.fillRect(0, 0, w, h); const r = mulberry32(4);
		for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(255,240,220,${r() * .03})`; g.fillRect(r() * w, r() * h, 2, 2); }
		g.strokeStyle = 'rgba(255,230,200,.06)'; g.lineWidth = 2; g.strokeRect(24, 24, w - 48, h - 48);
	});
}
// escrita à mão
export function handTex(text, color = '#e8dcc0', size = 92, w = 1024, h = 180) {
	return canvasTex(w, h, g => { g.fillStyle = color; g.font = `600 ${size}px Caveat, cursive`; g.textBaseline = 'middle'; g.fillText(text, 20, h / 2); });
}
