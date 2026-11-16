// Kit "cozinha true crime" (Short 25): pessoa sentada, avó de coque com sorriso âmbar, vapor, xícara, luminária pendente,
// aliança, gravador de rolo. Tudo silhueta/sem rosto; reaproveitável (cores e tamanhos por parâmetro).
import * as THREE from 'three';
import { clamp, mulberry32, canvasTex } from './lib.js';
import { glow } from './crime.js';
import { AMB, spotCone } from './caso.js';

const mat = c => new THREE.MeshStandardMaterial({ color: c, roughness: .85 });
const ghostMat = c => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .4, blending: THREE.AdditiveBlending, depthWrite: false });
const dotTex = (() => { let t; return () => t || (t = canvasTex(64, 64, g => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.5, 'rgba(255,255,255,.35)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); })); })();

// pessoa sentada numa cadeira, de frente para +z. slump(k) curva o tronco, reach(k) estica o braço, op(k) p/ fantasma
export function seated({ h = 1.7, color = '#040506', chair = '#1c1510', ghost = null, bun = false } = {}) {
	const g = new THREE.Group(), u = h / 1.7, m = ghost ? ghostMat(ghost) : mat(color), cm = mat(chair);
	const box = (w, hh, d, x, y, z, mm = cm) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w * u, hh * u, d * u), mm); b.position.set(x * u, y * u, z * u); g.add(b); return b; };
	box(.5, .06, .5, 0, .46, 0); box(.5, .62, .05, 0, .8, -.23);
	[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => box(.04, .46, .04, a * .21, .23, b * .21));
	const body = new THREE.Group(); body.position.set(0, .5 * u, -.05 * u); g.add(body);
	const cap = (r, l, x, y, z, rx = 0, par = body) => { const c = new THREE.Mesh(new THREE.CapsuleGeometry(r * u, l * u, 5, 12), m); c.position.set(x * u, y * u, z * u); c.rotation.x = rx; par.add(c); return c; };
	cap(.19, .4, 0, .36, 0);
	const head = new THREE.Mesh(new THREE.SphereGeometry(.13 * u, 18, 12), m); head.position.y = .82 * u; body.add(head);
	if (bun) { const b = new THREE.Mesh(new THREE.SphereGeometry(.075 * u, 14, 10), m); b.position.set(0, .9 * u, -.1 * u); body.add(b); }
	[-.1, .1].forEach(x => { cap(.08, .3, x, .02, .2, Math.PI / 2, g).position.y = .55 * u; cap(.07, .34, x, .27, .38, 0, g); });
	const arm = new THREE.Group(); arm.position.set(.2 * u, .6 * u, 0); body.add(arm);
	cap(.055, .42, 0, -.22, 0, 0, arm);
	g.body = body; g.head = head;
	g.slump = k => { body.rotation.x = .55 * k; head.position.y = (.82 - .05 * k) * u; };
	g.reach = k => { arm.rotation.x = -1.35 * k; arm.rotation.z = .25 * k; };
	g.op = k => { if (ghost) m.opacity = k; body.visible = k > .005; g.children.forEach(c => { if (c !== body && c.material === m) c.visible = k > .005; }); };
	return g;
}

// avó de coque e avental (de pé, de frente p/ +z); arm(k) levanta o braço direito; smile(k) acende o sorriso âmbar
export function granny({ h = 1.62, color = '#050607', apron = '#121416', smileColor = AMB } = {}) {
	const g = new THREE.Group(), u = h / 1.62, m = mat(color);
	const skirt = new THREE.Mesh(new THREE.CylinderGeometry(.2 * u, .38 * u, .78 * u, 20), m); skirt.position.y = .39 * u; g.add(skirt);
	const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.2 * u, .3 * u, 5, 14), m); torso.position.y = .98 * u; torso.scale.z = .8; g.add(torso);
	const head = new THREE.Mesh(new THREE.SphereGeometry(.14 * u, 20, 14), m); head.position.y = 1.4 * u; g.add(head);
	const bun = new THREE.Mesh(new THREE.SphereGeometry(.085 * u, 16, 12), m); bun.position.set(0, 1.5 * u, -.11 * u); g.add(bun);
	const ap = new THREE.Mesh(new THREE.PlaneGeometry(.34 * u, .62 * u), new THREE.MeshBasicMaterial({ map: canvasTex(120, 220, (c, w, hh) => { c.fillStyle = apron; c.beginPath(); c.moveTo(w * .2, 0); c.lineTo(w * .8, 0); c.lineTo(w, hh); c.lineTo(0, hh); c.closePath(); c.fill(); c.strokeStyle = 'rgba(255,176,46,.35)'; c.lineWidth = 4; c.stroke(); c.strokeRect(w * .3, hh * .45, w * .4, hh * .2); }), transparent: true }));
	ap.position.set(0, .68 * u, .29 * u); ap.rotation.x = -.18; g.add(ap);
	const armL = new THREE.Mesh(new THREE.CapsuleGeometry(.055 * u, .44 * u, 4, 10), m); armL.position.set(-.24 * u, .9 * u, 0); armL.rotation.z = -.12; g.add(armL);
	const arm = new THREE.Group(); arm.position.set(.24 * u, 1.13 * u, 0); g.add(arm);
	const a = new THREE.Mesh(new THREE.CapsuleGeometry(.055 * u, .44 * u, 4, 10), m); a.position.y = -.24 * u; arm.add(a);
	const sm = new THREE.Mesh(new THREE.TorusGeometry(.065 * u, .011 * u, 8, 28, Math.PI * .75), new THREE.MeshBasicMaterial({ color: smileColor, transparent: true, opacity: 0 }));
	sm.rotation.z = Math.PI + Math.PI * .125; sm.position.set(0, 1.37 * u, .138 * u); g.add(sm);
	const sg = glow('rgba(255,176,46,.8)', .5 * u); sg.position.set(0, 1.36 * u, .16 * u); sg.material.opacity = 0; g.add(sg);
	g.arm = (x, z = 0) => { arm.rotation.x = x; arm.rotation.z = z; };
	g.smile = k => { sm.material.opacity = clamp(k); sm.visible = sg.visible = k > .005; sg.material.opacity = clamp(k) * .8; };
	g.smile(0); g.head = head; return g;
}

// vapor/fumaça subindo (Points determinístico); tick(T)
export function steam({ n = 70, h = .7, w = .07, seed = 3, color = '#d8d2c4', size = .06 } = {}) {
	const r = mulberry32(seed), base = Array.from({ length: n }, () => [r(), r() * 6.28, .6 + r() * .6, r() - .5]);
	const pos = new Float32Array(n * 3), geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
	const m = new THREE.Points(geo, new THREE.PointsMaterial({ color, size, map: dotTex(), transparent: true, opacity: .35, depthWrite: false })); m.frustumCulled = false;
	m.tick = T => { base.forEach(([o, p, s, x], i) => { const k = (o + T * .35 * s) % 1; pos.set([x * w + Math.sin(T * 1.3 + p + k * 5) * .06 * k, k * h, Math.cos(T * 1.1 + p) * .04 * k], i * 3); }); geo.attributes.position.needsUpdate = true; };
	m.tick(0); return m;
}

// xícara com pires e café
export function cup({ s = 1, color = '#cfc6b2', coffee = '#2a1608' } = {}) {
	const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color, roughness: .35 });
	const c = new THREE.Mesh(new THREE.CylinderGeometry(.075 * s, .055 * s, .1 * s, 24, 1, true), new THREE.MeshStandardMaterial({ color, roughness: .35, side: THREE.DoubleSide })); c.position.y = .055 * s; g.add(c);
	const bot = new THREE.Mesh(new THREE.CircleGeometry(.055 * s, 20), m); bot.rotation.x = -Math.PI / 2; bot.position.y = .007 * s; g.add(bot);
	const cf = new THREE.Mesh(new THREE.CircleGeometry(.07 * s, 24), new THREE.MeshStandardMaterial({ color: coffee, roughness: .15 })); cf.rotation.x = -Math.PI / 2; cf.position.y = .09 * s; g.add(cf);
	const hd = new THREE.Mesh(new THREE.TorusGeometry(.03 * s, .008 * s, 8, 16), m); hd.position.set(.085 * s, .06 * s, 0); g.add(hd);
	const sau = new THREE.Mesh(new THREE.CylinderGeometry(.13 * s, .1 * s, .012 * s, 28), m); g.add(sau);
	g.coffee = cf; return g;
}

// luminária pendente: cúpula + lâmpada + cone + spot. set(k) = intensidade 0–1
export function pendant({ y = 2.3, cord = 2, color = '#ffcf8a', power = 45, cone = .3, reach = 9 } = {}) {
	const g = new THREE.Group();
	const cd = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, cord, 6), new THREE.MeshBasicMaterial({ color: '#000' })); cd.position.y = y + cord / 2; g.add(cd);
	const sh = new THREE.Mesh(new THREE.CylinderGeometry(.06, .3, .22, 28, 1, true), new THREE.MeshStandardMaterial({ color: '#141a18', roughness: .6, side: THREE.DoubleSide })); sh.position.y = y; g.add(sh);
	const bulb = glow('rgba(255,214,150,1)', .7); bulb.position.y = y - .08; g.add(bulb);
	const cn = spotCone(.22, 1.6, y - .05, color, cone); cn.position.y = y - .05; g.add(cn);
	const sp = new THREE.SpotLight(color, power, reach, .75, .7, 1.3); sp.position.y = y - .05; sp.target.position.set(0, 0, 0); g.add(sp, sp.target);
	g.set = k => { bulb.material.opacity = k; cn.op(cone * k); sp.intensity = power * k; };
	g.spot = sp; return g;
}

// aliança dourada
export function ring({ r = .11, color = '#d9a441' } = {}) {
	const m = new THREE.Mesh(new THREE.TorusGeometry(r, r * .2, 14, 40), new THREE.MeshStandardMaterial({ color, metalness: .9, roughness: .28, emissive: color, emissiveIntensity: .12 }));
	return m;
}

// pote/lata de veneno com rótulo genérico (texto por parâmetro)
export function poisonJar({ s = 1, label = 'VENENO', sub = 'DE RATO', tin = '#6d6a60', band = '#8f1d22' } = {}) {
	const g = new THREE.Group(), r = .16 * s, h = .4 * s;
	const b = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 28), new THREE.MeshStandardMaterial({ color: tin, metalness: .6, roughness: .45 })); b.position.y = h / 2; g.add(b);
	const lid = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.04, r * 1.04, h * .1, 28), new THREE.MeshStandardMaterial({ color: '#2a2724', metalness: .7, roughness: .4 })); lid.position.y = h * 1.04; g.add(lid);
	const lb = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.01, r * 1.01, h * .62, 28, 1, true, -Math.PI * .45, Math.PI * .9), new THREE.MeshStandardMaterial({ roughness: .9, map: canvasTex(360, 240, (c, w, hh) => {
		c.fillStyle = '#d9cfb4'; c.fillRect(0, 0, w, hh); c.fillStyle = band; c.fillRect(0, hh * .08, w, hh * .34);
		const f = (t, y, mh, col) => { let z = 120; const set = () => c.font = `700 ${z}px Oswald, Impact, sans-serif`; set(); while (z > 8 && (c.measureText(t).width > w * .8 || z > mh)) { z -= 2; set(); } c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t, w / 2, y); };
		f(label, hh * .26, hh * .28, '#f3ead6'); f(sub, hh * .62, hh * .22, '#1a1410');
		c.strokeStyle = band; c.lineWidth = 8; c.beginPath(); c.moveTo(w * .42, hh * .76); c.lineTo(w * .58, hh * .94); c.moveTo(w * .58, hh * .76); c.lineTo(w * .42, hh * .94); c.stroke();
	}) }));
	lb.position.y = h * .5; g.add(lb);
	return g;
}

// gravador de rolo: tick(T) gira as bobinas
export function recorder({ s = 1 } = {}) {
	const g = new THREE.Group();
	const b = new THREE.Mesh(new THREE.BoxGeometry(.7 * s, .12 * s, .45 * s), new THREE.MeshStandardMaterial({ color: '#2a2e2c', roughness: .5, metalness: .4 })); b.position.y = .06 * s; g.add(b);
	const reels = [-.17, .17].map(x => { const rg = new THREE.Group(); rg.position.set(x * s, .125 * s, -.03 * s); g.add(rg);
		const d = new THREE.Mesh(new THREE.CylinderGeometry(.13 * s, .13 * s, .01 * s, 28), new THREE.MeshStandardMaterial({ color: '#7d7768', metalness: .7, roughness: .35 })); rg.add(d);
		[0, 1, 2].forEach(i => { const sp = new THREE.Mesh(new THREE.BoxGeometry(.22 * s, .014 * s, .025 * s), new THREE.MeshStandardMaterial({ color: '#1a1c1b' })); sp.rotation.y = i * Math.PI / 3; sp.position.y = .006 * s; rg.add(sp); });
		return rg; });
	const led = glow('rgba(224,31,47,1)', .08 * s); led.position.set(.28 * s, .125 * s, .17 * s); led.rotation.x = -Math.PI / 2; g.add(led);
	g.tick = T => { reels.forEach((r, i) => r.rotation.y = -T * (2.2 + i * .4)); led.material.opacity = .6 + .4 * Math.sin(T * 6); };
	return g;
}

// ── peças extras (Short 25): prato, copo, lata de veneno, frasco, mesa, arquivo, grades ──
const lbl = (w, h, draw) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: canvasTex(Math.round(w * 400), Math.round(h * 400), draw), transparent: true }));
const fitTxt = (c, t, x, y, maxW, size, font, color, weight = '700') => { let s = size; c.font = `${weight} ${s}px ${font}`; while (c.measureText(t).width > maxW && s > 6) { s -= 2; c.font = `${weight} ${s}px ${font}`; } c.fillStyle = color; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t, x, y); };

// prato raso com comida genérica
export function plate({ s = 1, color = '#cfc6b2', food = '#5a3a1e' } = {}) {
	const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color, roughness: .35 });
	const p = new THREE.Mesh(new THREE.CylinderGeometry(.16 * s, .12 * s, .02 * s, 32), m); p.position.y = .01 * s; g.add(p);
	const f = new THREE.Mesh(new THREE.SphereGeometry(.08 * s, 16, 8, 0, 6.29, 0, 1.2), new THREE.MeshStandardMaterial({ color: food, roughness: .8 })); f.scale.y = .5; f.position.y = .015 * s; g.add(f);
	return g;
}
// copo baixo com bebida âmbar
export function glass({ s = 1, drink = '#b8641a' } = {}) {
	const g = new THREE.Group();
	const c = new THREE.Mesh(new THREE.CylinderGeometry(.06 * s, .05 * s, .14 * s, 24, 1, true), new THREE.MeshStandardMaterial({ color: '#cfe3ea', transparent: true, opacity: .25, roughness: .05, side: THREE.DoubleSide, depthWrite: false })); c.position.y = .07 * s; g.add(c);
	const d = new THREE.Mesh(new THREE.CylinderGeometry(.056 * s, .049 * s, .08 * s, 24), new THREE.MeshStandardMaterial({ color: drink, transparent: true, opacity: .8, roughness: .1, emissive: drink, emissiveIntensity: .25 })); d.position.y = .045 * s; d.renderOrder = 1; g.add(d);
	return g;
}
// lata de veneno de rato com rótulo genérico
export function poisonCan({ s = 1, text = 'VENENO DE RATO', sub = 'CUIDADO · TÓXICO' } = {}) {
	const g = new THREE.Group(), R = .09 * s, H = .2 * s;
	const tex = canvasTex(512, 220, (c, w, h) => { c.fillStyle = '#c9b98a'; c.fillRect(0, 0, w, h); c.fillStyle = '#7a1a1a'; c.fillRect(0, h * .18, w, h * .36); fitTxt(c, text, w * .25, h * .36, w * .46, h * .22, 'Oswald,Impact,sans-serif', '#f2e6c8'); fitTxt(c, sub, w * .25, h * .72, w * .46, h * .12, '"Special Elite",monospace', '#2a1a10', '400'); });
	const body = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 32), [new THREE.MeshStandardMaterial({ map: tex, roughness: .6 }), new THREE.MeshStandardMaterial({ color: '#6d6a60', metalness: .7, roughness: .35 }), new THREE.MeshStandardMaterial({ color: '#6d6a60' })]);
	body.rotation.y = -Math.PI / 2 - .5; body.position.y = H / 2; g.add(body);
	return g;
}
// frasco de vidro com rótulo (ex.: "As")
export function bottle({ s = 1, text = 'As', sub = 'ARSÊNICO', liquid = '#d8d2c4' } = {}) {
	const g = new THREE.Group();
	const b = new THREE.Mesh(new THREE.CylinderGeometry(.09 * s, .1 * s, .28 * s, 28), new THREE.MeshStandardMaterial({ color: '#2b3b34', transparent: true, opacity: .55, roughness: .08, metalness: .1, depthWrite: false })); b.position.y = .14 * s; g.add(b);
	const n = new THREE.Mesh(new THREE.CylinderGeometry(.035 * s, .05 * s, .08 * s, 18), b.material); n.position.y = .32 * s; g.add(n);
	const k = new THREE.Mesh(new THREE.CylinderGeometry(.04 * s, .04 * s, .04 * s, 18), new THREE.MeshStandardMaterial({ color: '#111' })); k.position.y = .37 * s; g.add(k);
	const pw = new THREE.Mesh(new THREE.CylinderGeometry(.08 * s, .09 * s, .12 * s, 24), new THREE.MeshStandardMaterial({ color: liquid, roughness: .9 })); pw.position.y = .07 * s; g.add(pw);
	const l = lbl(.15 * s, .12 * s, (c, w, h) => { c.fillStyle = '#e4d9bd'; c.fillRect(0, 0, w, h); c.strokeStyle = '#1a1410'; c.lineWidth = 3; c.strokeRect(4, 4, w - 8, h - 8); fitTxt(c, text, w / 2, h * .42, w * .8, h * .5, 'Oswald,Impact,sans-serif', '#1a1410'); fitTxt(c, sub, w / 2, h * .8, w * .84, h * .16, '"Special Elite",monospace', '#7a1a1a', '400'); });
	l.position.set(0, .16 * s, .1 * s + .004); l.renderOrder = 2; g.add(l);
	return g;
}
// mesa de cozinha retangular (tampo + 4 pernas)
export function kitchenTable({ w = 1.5, d = 1, h = .75, color = '#2a1d12' } = {}) {
	const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color, roughness: .55 });
	const top = new THREE.Mesh(new THREE.BoxGeometry(w, .05, d), m); top.position.y = h - .025; g.add(top);
	[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const l = new THREE.Mesh(new THREE.BoxGeometry(.05, h - .05, .05), m); l.position.set(a * (w / 2 - .08), (h - .05) / 2, b * (d / 2 - .08)); g.add(l); });
	return g;
}
// arquivo de aço com gaveta: open(k) puxa a gaveta (pastas dentro)
export function cabinet({ color = '#3a4440', seed = 4, label = 'DOSS, N.' } = {}) {
	const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color, roughness: .5, metalness: .5 }), r = mulberry32(seed);
	const b = new THREE.Mesh(new THREE.BoxGeometry(.6, 1.3, .7), m); b.position.y = .65; g.add(b);
	const dr = new THREE.Group(); dr.position.set(0, 1.05, 0); g.add(dr);
	const fr = new THREE.Mesh(new THREE.BoxGeometry(.56, .3, .03), m); fr.position.z = .36; dr.add(fr);
	const hd = new THREE.Mesh(new THREE.BoxGeometry(.16, .03, .04), new THREE.MeshStandardMaterial({ color: '#b9b2a0', metalness: .9, roughness: .3 })); hd.position.set(0, .05, .39); dr.add(hd);
	const lab = lbl(.18, .06, (c, w, h) => { c.fillStyle = '#e4d9bd'; c.fillRect(0, 0, w, h); fitTxt(c, label, w / 2, h / 2, w * .9, h * .7, '"Special Elite",monospace', '#1a1410', '400'); }); lab.position.set(0, -.06, .38); dr.add(lab);
	for (let i = 0; i < 9; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(.5, .26 + r() * .04, .012), new THREE.MeshStandardMaterial({ color: i % 3 ? '#8a6a3c' : '#a07c46', roughness: .9 })); f.position.set(0, .03, .3 - i * .065); f.rotation.x = (r() - .5) * .15; dr.add(f); }
	g.open = k => { dr.position.z = .55 * clamp(k); };
	return g;
}
// grades de cela (barras verticais)
export function bars({ w = 3, h = 2.6, n = 9, color = '#141917' } = {}) {
	const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color, metalness: .7, roughness: .4 });
	for (let i = 0; i < n; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, h, 10), m); b.position.set((i / (n - 1) - .5) * w, h / 2, 0); g.add(b); }
	[.15, h - .1].forEach(y => { const b = new THREE.Mesh(new THREE.BoxGeometry(w + .1, .06, .06), m); b.position.y = y; g.add(b); });
	return g;
}
