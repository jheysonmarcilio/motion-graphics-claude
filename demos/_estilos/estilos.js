// Kit de ESTILOS do painel — a mesma cena pode virar estilos totalmente diferentes trocando
// só materiais, câmera e filtro de pós-processamento. Use como ponto de partida nos vídeos:
//   import { paletas, fabricaMat, quarto, personagem, montarEstilo } from '/demos/_estilos/estilos.js';
// Peças:
//   seg(a, b, raio, mat)        → cápsula entre dois pontos (braços, pernas de bonecos)
//   personagem(M, P, opts)      → boneco sentado com cabelo, rosto, braços articulados (pose "pensativo")
//   quarto(M, P, opts)          → quarto com mesa, cadeira, abajur aceso, janela com lua, estante, quadro, planta, tapete
//   FILTROS.{aquarela, noir, vitral, linhas, grao} → ShaderPass prontos (uniforms documentados em cada um)
//   montarEstilo(id, renderer)  → monta cena + câmera + composer do estilo (usado em painel/estilos-preview.html)
// Tudo determinístico (sem Math.random).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ── materiais ──
export function gradienteToon(n = 3) {
	const d = new Uint8Array(n * 4);
	for (let i = 0; i < n; i++) { const v = Math.round(255 * (0.45 + 0.55 * i / (n - 1))); d.set([v, v, v, 255], i * 4); }
	const t = new THREE.DataTexture(d, n, 1); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t;
}
/** tipo: 'toon' | 'std' | 'basic' | 'brilho' (plástico) | 'preto' */
export function fabricaMat(tipo) {
	const grad = gradienteToon(3), cache = {};
	return (cor, extra = {}) => {
		const k = cor + JSON.stringify(extra); if (cache[k]) return cache[k];
		const e = extra.emissive && tipo !== 'basic' && tipo !== 'preto' ? { emissive: extra.emissive, emissiveIntensity: extra.emissiveIntensity ?? 1 } : {};
		const side = extra.side || THREE.FrontSide;
		return cache[k] = tipo === 'toon' ? new THREE.MeshToonMaterial({ color: cor, gradientMap: grad, side, ...e })
			: tipo === 'basic' ? new THREE.MeshBasicMaterial({ color: extra.emissive && extra.basicLuz ? extra.basicLuz : cor, side })
			: tipo === 'preto' ? new THREE.MeshBasicMaterial({ color: extra.emissive ? extra.emissive : '#050307', side })
			: new THREE.MeshStandardMaterial({ color: cor, roughness: tipo === 'brilho' ? 0.28 : 0.78, metalness: 0, side, ...e });
	};
}

// ── paletas (cada estilo escolhe a sua; trocar a paleta já muda o clima do vídeo) ──
const BASE = { parede: '#E9D8C4', parede2: '#DCC7B0', chao: '#B98457', tapete: '#7A4E8C', madeira: '#8A5A3B', madeiraEsc: '#5E3B26',
	pele: '#F2C3A0', cabelo: '#3B2219', camisa: '#3E6FD8', calca: '#2E3550', sapato: '#2A1C17', abajur: '#F4E3B5', luz: '#FFD27A',
	livro1: '#C8423B', livro2: '#2E8B6E', livro3: '#E8B23A', livro4: '#4B5FB0', planta: '#3E9B57', vaso: '#C9673E', caneca: '#E8E2D6',
	cortina: '#B8483F', ceu: '#1E2A5A', lua: '#FFF4C8', quadro: '#5AA0C8', papel: '#F7F3EA' };
export const paletas = {
	base: BASE,
	anime: { ...BASE, parede: '#F6DCC8', parede2: '#EBC9B3', chao: '#C98B5E', camisa: '#FF6F61', calca: '#3B4A7A', cabelo: '#2B2340', tapete: '#5C7AEA', ceu: '#2B2F6B', cortina: '#6C5CE7' },
	sombrio: { ...BASE, parede: '#3A3E46', parede2: '#2E3138', chao: '#2A2422', tapete: '#3B1F22', camisa: '#4A4F58', calca: '#22252B', cabelo: '#141110', pele: '#C9A48A', cortina: '#2A2A30', ceu: '#0B1022', livro1: '#7A2020', livro2: '#2E3A36', livro3: '#6B5A3A', livro4: '#2B3248', planta: '#2F4A35', vaso: '#4A3A30', quadro: '#3A4450', luz: '#FFB45A' },
	noir: { ...BASE, parede: '#BFBFBF', parede2: '#9E9E9E', chao: '#6E6E6E', tapete: '#4A4A4A', camisa: '#D02020', calca: '#2A2A2A', cabelo: '#111', pele: '#E6E6E6', cortina: '#5A5A5A', ceu: '#151515', livro1: '#D02020', livro2: '#555', livro3: '#888', livro4: '#333', planta: '#555', vaso: '#777', quadro: '#999', madeira: '#666', madeiraEsc: '#3A3A3A', abajur: '#EEE', caneca: '#FFF' },
	aquarela: { ...BASE, parede: '#F1E4D0', parede2: '#E6D3BC', chao: '#D4A97E', tapete: '#9DB7D5', camisa: '#E88B7A', calca: '#6C7FA8', cabelo: '#6B4430', ceu: '#4A5E9A', cortina: '#D9A3B5', planta: '#7FB069', quadro: '#F2C57C' },
	papel: { ...BASE, parede: '#F3E1C7', parede2: '#EAD0AE', chao: '#D9A273', tapete: '#2F7F8C', camisa: '#F2A03D', calca: '#2F4858', cabelo: '#33261F', ceu: '#24305E', cortina: '#E05D5D', quadro: '#86BBD8' },
	vitral: { ...BASE, parede: '#2E4A9E', parede2: '#243C85', chao: '#7A2E8C', tapete: '#C8102E', camisa: '#F2B705', calca: '#1B7F5C', cabelo: '#5A2A0A', pele: '#F5C9A0', ceu: '#0E1A5C', cortina: '#C8102E', madeira: '#A0522D', luz: '#FFE066', quadro: '#1AA6B7', planta: '#2BA84A' },
	contorno: { ...BASE, parede: '#7FB3D5', parede2: '#5D9BC4', chao: '#E59866', tapete: '#AF7AC5', camisa: '#E74C3C', calca: '#2E4053', cabelo: '#4A235A', pele: '#F5CBA7', ceu: '#1B2631', cortina: '#48C9B0', quadro: '#F4D03F', planta: '#27AE60', vaso: '#D35400', madeira: '#A04000', madeiraEsc: '#6E2C00', livro1: '#C0392B', livro2: '#16A085', livro3: '#F1C40F', livro4: '#2980B9', caneca: '#ECF0F1', abajur: '#FDEBD0' },
	iso: { ...BASE, parede: '#F7F1E8', parede2: '#EFE5D6', chao: '#E4C9A8', tapete: '#7FC8A9', camisa: '#5B8DEF', calca: '#34495E', cabelo: '#3D2C2E', ceu: '#9AD0F5', lua: '#FFFFFF', cortina: '#F7A6A6', quadro: '#FFC857' },
	flat: { ...BASE, parede: '#FFD23F', parede2: '#F4C430', chao: '#2E5BFF', tapete: '#FF6B6B', camisa: '#00B894', calca: '#2D3436', cabelo: '#2D3436', pele: '#F5C9A8', ceu: '#2D3436', cortina: '#FF6B6B', quadro: '#FFFFFF', madeira: '#E17055', madeiraEsc: '#B9533A' },
};

// ── geometria utilitária ──
export function seg(a, b, r, mat) {
	const d = new THREE.Vector3().subVectors(b, a), m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.001, d.length()), 6, 14), mat);
	m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); return m;
}
const caixa = (w, h, d, mat, p, arred = 0) => { const m = new THREE.Mesh(arred ? new RoundedBoxGeometry(w, h, d, 3, arred) : new THREE.BoxGeometry(w, h, d), mat); m.position.set(...p); return m; };
const cil = (rt, rb, h, mat, p, s = 24, aberto = false) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s, 1, aberto), mat); m.position.set(...p); return m; };
const esf = (r, mat, p, s = [1, 1, 1]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 20), mat); m.position.set(...p); m.scale.set(...s); return m; };

/** Boneco sentado, olhando para -x, mão no queixo (pensativo). opts: { x, z } */
export function personagem(M, P, { x = 1.65, z = -1 } = {}) {
	const g = new THREE.Group(), dx = x - 1.65, dz = z + 1, p = (a, b, c) => V(a + dx, b, c + dz);
	const pele = M(P.pele), camisa = M(P.camisa), calca = M(P.calca), cab = M(P.cabelo), olho = M('#1A1414');
	g.add(seg(p(1.66, 1.18, -1), p(1.56, 1.78, -1), 0.31, camisa));                    // tronco
	g.add(seg(p(1.55, 1.8, -1), p(1.52, 1.98, -1), 0.09, pele));                        // pescoço
	g.add(esf(0.3, pele, [1.5 + dx, 2.2, z], [0.95, 1.05, 0.92]));                       // cabeça
	g.add(esf(0.32, cab, [1.58 + dx, 2.3, z], [0.95, 0.92, 0.98]));                      // cabelo
	g.add(esf(0.17, cab, [1.36 + dx, 2.42, z - 0.08], [1.2, 0.6, 1.4]));                 // franja
	g.add(esf(0.13, cab, [1.83 + dx, 2.32, z], [1, 1, 1]));                             // coque
	for (const s of [-1, 1]) {
		g.add(esf(0.045, olho, [1.235 + dx, 2.24, z + s * 0.11]));                       // olhos
		g.add(caixa(0.02, 0.025, 0.11, olho, [1.235 + dx, 2.33, z + s * 0.11]));         // sobrancelhas
		g.add(esf(0.06, pele, [1.52 + dx, 2.18, z + s * 0.285]));                         // orelhas
	}
	g.add(esf(0.045, pele, [1.2 + dx, 2.15, z]));                                       // nariz
	g.add(caixa(0.02, 0.018, 0.1, M('#8A3B3B'), [1.225 + dx, 2.06, z]));                 // boca
	// braço esquerdo apoiado na mesa
	g.add(seg(p(1.56, 1.8, -1.34), p(1.28, 1.36, -1.45), 0.085, camisa));
	g.add(seg(p(1.28, 1.36, -1.45), p(0.86, 1.24, -1.2), 0.075, pele));
	g.add(esf(0.085, pele, [0.82 + dx, 1.24, z - 0.18]));
	// braço direito: cotovelo na mesa, mão no queixo
	g.add(seg(p(1.56, 1.8, -0.66), p(1.08, 1.26, -0.66), 0.085, camisa));
	g.add(seg(p(1.08, 1.26, -0.66), p(1.22, 1.98, -0.9), 0.075, pele));
	g.add(esf(0.09, pele, [1.22 + dx, 2.02, z + 0.1]));
	// pernas
	for (const s of [-1, 1]) {
		g.add(seg(p(1.68, 0.98, -1 + s * 0.17), p(1.02, 0.98, -1 + s * 0.2), 0.13, calca));
		g.add(seg(p(1.02, 0.98, -1 + s * 0.2), p(1.02, 0.16, -1 + s * 0.2), 0.11, calca));
		g.add(caixa(0.36, 0.13, 0.19, M(P.sapato), [0.93 + dx, 0.07, z + s * 0.2], 0.05));
	}
	return g;
}

/** Quarto: opts { paredes = true, extras = true }. Devolve { grupo, luzAbajur(posição), lampada } */
export function quarto(M, P, { paredes = true, extras = true } = {}) {
	const g = new THREE.Group(), mad = M(P.madeira), madE = M(P.madeiraEsc);
	if (paredes) {
		g.add(caixa(8.4, 0.2, 6.4, M(P.chao), [0, -0.1, 0]));
		for (let i = 0; i < 7; i++) g.add(caixa(0.02, 0.005, 6.4, madE, [-3.6 + i * 1.2, 0.003, 0]));           // tábuas
		g.add(caixa(8.4, 4.6, 0.2, M(P.parede), [0, 2.3, -3.1]));
		g.add(caixa(0.2, 4.6, 6.4, M(P.parede2), [-4.1, 2.3, 0]));
		g.add(caixa(8.4, 0.18, 0.06, M('#FFFFFF'), [0, 0.09, -2.99])); g.add(caixa(0.06, 0.18, 6.4, M('#FFFFFF'), [-3.99, 0.09, 0])); // rodapé
		// janela com céu, lua e estrelas
		const jx = -1.7, jy = 2.55, jw = 1.7, jh = 1.5;
		const vidro = new THREE.Mesh(new THREE.PlaneGeometry(jw, jh), M(P.ceu, { emissive: P.ceu, emissiveIntensity: 0.6 })); vidro.position.set(jx, jy, -2.985); g.add(vidro);
		const lua = new THREE.Mesh(new THREE.CircleGeometry(0.2, 32), M(P.lua, { emissive: P.lua, basicLuz: P.lua })); lua.position.set(jx + 0.45, jy + 0.38, -2.98); g.add(lua);
		[[-0.6, 0.5], [-0.2, 0.15], [0.1, 0.55], [-0.5, -0.3], [0.6, -0.1], [0.25, -0.45]].forEach(([a, b]) => { const s = new THREE.Mesh(new THREE.CircleGeometry(0.025, 6), M(P.lua, { emissive: P.lua, basicLuz: P.lua })); s.position.set(jx + a, jy + b, -2.982); g.add(s); });
		const mold = M('#FFFFFF');
		g.add(caixa(jw + 0.16, 0.08, 0.12, mold, [jx, jy + jh / 2, -2.95])); g.add(caixa(jw + 0.3, 0.1, 0.25, mold, [jx, jy - jh / 2 - 0.02, -2.9]));
		g.add(caixa(0.08, jh, 0.12, mold, [jx - jw / 2, jy, -2.95])); g.add(caixa(0.08, jh, 0.12, mold, [jx + jw / 2, jy, -2.95]));
		g.add(caixa(0.05, jh, 0.06, mold, [jx, jy, -2.96])); g.add(caixa(jw, 0.05, 0.06, mold, [jx, jy, -2.96]));
		const cort = M(P.cortina);
		for (const s of [-1, 1]) for (let k = 0; k < 4; k++) g.add(cil(0.09, 0.11, 2.1, cort, [jx + s * (jw / 2 + 0.12 + k * 0.13), 2.35, -2.88 + (k % 2) * 0.06], 12));
		const vara = cil(0.025, 0.025, jw + 1.4, M(P.madeiraEsc), [jx, 3.42, -2.86]); vara.rotation.z = Math.PI / 2; g.add(vara);
		// estante com livros e vasinho
		g.add(caixa(2.1, 0.08, 0.42, mad, [1.6, 2.95, -2.82]));
		const cores = [P.livro1, P.livro2, P.livro3, P.livro4, P.livro2, P.livro1, P.livro3];
		let bx = 0.7; cores.forEach((c, i) => { const h = 0.32 + ((i * 37) % 5) * 0.04, w = 0.09 + (i % 3) * 0.03; g.add(caixa(w, h, 0.3, M(c), [bx, 2.99 + h / 2, -2.82])); bx += w + 0.02; });
		g.add(cil(0.09, 0.07, 0.16, M(P.vaso), [2.4, 3.07, -2.82], 16)); g.add(esf(0.16, M(P.planta), [2.4, 3.25, -2.82], [1, 0.8, 1]));
		// quadro e relógio
		const moldura = caixa(1.1, 0.85, 0.05, madE, [-3.97, 2.6, 0.9]); moldura.rotation.y = Math.PI / 2; g.add(moldura);
		const tela = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.92), M(P.quadro)); tela.position.set(-3.94, 2.6, 0.9); tela.rotation.y = Math.PI / 2; g.add(tela);
		const relogio = cil(0.25, 0.25, 0.05, M('#FFFFFF'), [0.9, 3.75, -2.98], 32); relogio.rotation.x = Math.PI / 2; g.add(relogio);
		g.add(caixa(0.02, 0.17, 0.02, M('#222'), [0.9, 3.81, -2.94])); g.add(caixa(0.12, 0.02, 0.02, M('#222'), [0.95, 3.75, -2.94]));
		// tapete
		const tap = cil(2.3, 2.3, 0.02, M(P.tapete), [0.4, 0.01, -0.9], 48); tap.scale.z = 0.62; g.add(tap);
		const borda = cil(2.05, 2.05, 0.022, M(P.livro3), [0.4, 0.012, -0.9], 48); borda.scale.z = 0.6; g.add(borda);
		const meio = cil(1.9, 1.9, 0.024, M(P.tapete), [0.4, 0.013, -0.9], 48); meio.scale.z = 0.58; g.add(meio);
	}
	// mesa
	g.add(caixa(2.5, 0.12, 1.55, mad, [0.15, 1.12, -1], 0.04));
	for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(caixa(0.1, 1.06, 0.1, madE, [0.15 + a * 1.1, 0.53, -1 + b * 0.62]));
	// cadeira
	g.add(caixa(0.85, 0.1, 0.85, mad, [1.75, 0.8, -1], 0.03));
	for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(caixa(0.07, 0.8, 0.07, madE, [1.75 + a * 0.36, 0.4, -1 + b * 0.36]));
	g.add(caixa(0.08, 1.05, 0.85, mad, [2.17, 1.35, -1], 0.03));
	// abajur aceso
	const ax = -0.65, az = -1.45;
	g.add(cil(0.2, 0.22, 0.05, madE, [ax, 1.205, az])); g.add(cil(0.025, 0.025, 0.7, madE, [ax, 1.55, az], 8));
	g.add(cil(0.15, 0.36, 0.38, M(P.abajur, { emissive: P.luz, emissiveIntensity: 0.35, side: THREE.DoubleSide }), [ax, 1.98, az], 32, true));
	const lampada = esf(0.09, M(P.luz, { emissive: P.luz, emissiveIntensity: 2, basicLuz: P.luz }), [ax, 1.86, az]); g.add(lampada);
	if (extras) {
		// livros empilhados, caderno aberto, lápis, caneca com vapor
		[[P.livro4, 0.07, 0.1], [P.livro1, 0.06, -0.15], [P.livro3, 0.07, 0.25]].forEach(([c, h, r], i) => { const b = caixa(0.62, h, 0.44, M(c), [-0.25, 1.21 + i * 0.07, -0.55], 0.01); b.rotation.y = r; g.add(b); });
		for (const s of [-1, 1]) { const f = caixa(0.36, 0.015, 0.5, M(P.papel), [0.45 + s * 0.18, 1.19, -1.0]); f.rotation.z = -s * 0.04; g.add(f); }
		for (let i = 0; i < 5; i++) g.add(caixa(0.22, 0.004, 0.012, M('#9AA3B5'), [0.27, 1.2, -1.15 + i * 0.07]));
		const lapis = cil(0.015, 0.015, 0.4, M(P.livro3), [0.75, 1.2, -0.75], 6); lapis.rotation.set(Math.PI / 2, 0, 0.6); g.add(lapis);
		g.add(cil(0.11, 0.1, 0.22, M(P.caneca), [0.95, 1.29, -1.5]));
		const asa = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.017, 8, 16), M(P.caneca)); asa.position.set(1.07, 1.29, -1.5); g.add(asa);
		for (let i = 0; i < 3; i++) g.add(esf(0.035 - i * 0.007, M('#FFFFFF'), [0.95 + Math.sin(i * 2) * 0.03, 1.48 + i * 0.1, -1.5]));
		// planta grande no canto
		g.add(cil(0.3, 0.24, 0.55, M(P.vaso), [-3.3, 0.28, -2.4]));
		for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, f = esf(0.13, M(P.planta), [-3.3 + Math.cos(a) * 0.28, 0.95 + (i % 3) * 0.22, -2.4 + Math.sin(a) * 0.28], [0.7, 2.6, 0.7]); f.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6); g.add(f); }
	}
	g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
	return { grupo: g, lampada, luzAbajur: V(ax, 1.85, az) };
}

// ── filtros (ShaderPass). Ruído e sobel compartilhados ──
const RUIDO = `float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
vec3 S(vec2 u){return texture2D(tDiffuse,u).rgb;}
float sobel(vec2 u,vec2 px){vec3 gx=-S(u+px*vec2(-1,-1))-2.*S(u+px*vec2(-1,0))-S(u+px*vec2(-1,1))+S(u+px*vec2(1,-1))+2.*S(u+px*vec2(1,0))+S(u+px*vec2(1,1));
vec3 gy=-S(u+px*vec2(-1,-1))-2.*S(u+px*vec2(0,-1))-S(u+px*vec2(1,-1))+S(u+px*vec2(-1,1))+2.*S(u+px*vec2(0,1))+S(u+px*vec2(1,1));return length(gx)+length(gy);}`;
const VERT = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
const filtro = (uniforms, corpo) => ({ uniforms: { tDiffuse: { value: null }, res: { value: new THREE.Vector2(1920, 1080) }, ...uniforms }, vertexShader: VERT,
	fragmentShader: `uniform sampler2D tDiffuse;uniform vec2 res;varying vec2 vUv;${Object.keys(uniforms).map(k => `uniform ${typeof uniforms[k].value === 'number' ? 'float' : uniforms[k].value.isColor ? 'vec3' : 'vec2'} ${k};`).join('')}${RUIDO}void main(){vec2 uv=vUv;vec2 px=1./res;${corpo}}` });
export const FILTROS = {
	/** Aquarela: borda que sangra, pigmento acumulado nos contornos, papel com grão. */
	aquarela: () => filtro({ forca: { value: 1 } }, `vec2 w=vec2(n(uv*vec2(16.,9.)),n(uv*vec2(16.,9.)+7.))-.5;vec2 u=uv+w*.007*forca;
		vec3 c=S(u);vec3 q=floor(c*6.)/6.;c=mix(c,q,.45);float e=sobel(u,px*1.5);c*=1.-clamp(e*.5,0.,.55);
		float b=n(uv*vec2(36.,20.));c=mix(c,vec3(.97,.95,.9),.08+.08*b);c*=.93+.07*n(uv*vec2(520.,290.));gl_FragColor=vec4(c,1.);`),
	/** HQ noir: retícula de pontos, tinta preta nos contornos, um acento vermelho preservado. */
	noir: () => filtro({ papel: { value: new THREE.Color('#F2EAD3') }, acento: { value: new THREE.Color('#C8141E') } }, `vec3 c=S(uv);float l=dot(c,vec3(.3,.59,.11));
		bool red=c.r>.12&&c.r>c.g*2.2&&c.r>c.b*2.2;vec2 p=uv*res;p=mat2(.707,-.707,.707,.707)*p;vec2 g=fract(p/7.)-.5;float d=length(g);
		float r=sqrt(clamp(1.-l*1.6,0.,1.))*.66;float ink=step(d,r);if(l<.035)ink=1.;float e=sobel(uv,px);ink=max(ink,step(.18,e));
		vec3 col=mix(papel,vec3(.04),ink);if(red){col=mix(acento,vec3(.04),max(step(.3,e),step(d,r*.5)));}
		col*=.94+.06*n(uv*vec2(600.,340.));gl_FragColor=vec4(col,1.);`),
	/** Vitral: células de vidro (Voronoi) com chumbo preto e brilho interno. celulas = quantas na altura. */
	vitral: () => filtro({ celulas: { value: 34 } }, `vec2 asp=vec2(res.x/res.y,1.)*celulas;vec2 p=uv*asp,ip=floor(p),fp=fract(p);float d1=8.,d2=8.;vec2 best=vec2(0);
		for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 gg=vec2(float(i),float(j));vec2 o=vec2(h(ip+gg),h(ip+gg+19.));o=.5+.42*sin(6.2831*o);vec2 r=gg+o-fp;float d=dot(r,r);
		if(d<d1){d2=d1;d1=d;best=ip+gg+o;}else if(d<d2)d2=d;}
		vec3 c=S(best/asp);c=mix(vec3(dot(c,vec3(.333))),c,1.25);c=pow(max(c,0.),vec3(.85))*1.15;c*=.82+.3*n(uv*vec2(140.,80.));c*=1.18-.45*sqrt(d1);
		float lead=1.-smoothstep(.0,.07,sqrt(d2)-sqrt(d1));float e=sobel(uv,px*1.5);lead=max(lead,smoothstep(.35,.7,e));
		vec3 col=mix(c,vec3(.03,.02,.04),lead);gl_FragColor=vec4(col,1.);`),
	/** Linhas: contorno de tudo + preenchimento leve. Serve para giz (fundo verde), quadro branco (fundo branco) e neon (neon=1). */
	linhas: ({ fundo = '#22382B', tinta = '#F4F1E6', preench = 0.18, neon = 0 } = {}) => filtro({ fundo: { value: new THREE.Color(fundo) }, tinta: { value: new THREE.Color(tinta) }, preench: { value: preench }, neon: { value: neon } },
		`vec2 j=(vec2(n(uv*vec2(260.,150.)),n(uv*vec2(260.,150.)+3.))-.5)*.0025;vec2 u=uv+j*(1.-neon);vec3 c=S(u);float e=sobel(u,px*1.2);float ln=smoothstep(.1,.28,e);
		vec3 col;if(neon>.5){vec3 cc=c/max(max(c.r,max(c.g,c.b)),.05);col=fundo+ln*cc*.85+c*preench;}
		else{float giz=.6+.4*n(uv*vec2(900.,520.));col=mix(fundo,c,preench*(.7+.3*n(uv*vec2(60.,34.))));col=mix(col,tinta,ln*giz);col*= .96+.04*n(uv*vec2(30.,17.));}
		gl_FragColor=vec4(col,1.);`),
	/** Grão de filme + vinheta (use no fim de qualquer estilo). */
	grao: ({ grao = 0.08, vinheta = 0.5 } = {}) => filtro({ grao: { value: grao }, vinheta: { value: vinheta } },
		`vec3 c=S(uv);c*=1.-grao+grao*2.*h(uv*res+.37);float v=length(uv-.5)*1.25;c*=1.-vinheta*v*v;gl_FragColor=vec4(c,1.);`),
};

function luzes(cena, { amb = '#FFFFFF', ambI = 0.9, chao = '#664433', sol = '#FFFFFF', solI = 1.6, solPos = [4, 8, 6], abajur = '#FFC870', abajurI = 6, pos = V(-0.65, 1.85, -1.45), lua = 0 } = {}) {
	cena.add(new THREE.HemisphereLight(amb, chao, ambI));
	const d = new THREE.DirectionalLight(sol, solI); d.position.set(...solPos); d.castShadow = true; d.shadow.mapSize.set(2048, 2048);
	Object.assign(d.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 0.5, far: 40 }); d.shadow.bias = -0.0005; d.shadow.radius = 4; cena.add(d);
	const p = new THREE.PointLight(abajur, abajurI, 8, 1.6); p.position.copy(pos); p.castShadow = true; p.shadow.bias = -0.002; cena.add(p);
	if (lua) { const l = new THREE.DirectionalLight('#7FA4FF', lua); l.position.set(-1.7, 3, -6); cena.add(l); }
}
const camPersp = (w, h, pos = [5.4, 3.7, 6.4], alvo = [-0.25, 1.55, -1.05], fov = 36) => { const c = new THREE.PerspectiveCamera(fov, w / h, 0.1, 100); c.position.set(...pos); c.lookAt(...alvo); return c; };
const camOrto = (w, h, alt, pos, alvo) => { const c = new THREE.OrthographicCamera(-alt * w / h, alt * w / h, alt, -alt, 0.1, 100); c.position.set(...pos); c.lookAt(...alvo); return c; };

/** Monta o estilo `id`. Devolve { render() } e, se houver, `legenda` (texto sugerido de sobreposição). */
export function montarEstilo(id, renderer, W, H) {
	const cena = new THREE.Scene(), cfg = {
		anime: ['toon', 'anime'], sombrio: ['std', 'sombrio'], hq: ['std', 'noir'], aquarela: ['std', 'aquarela'], papel: ['std', 'papel'], vitral: ['toon', 'vitral'],
		giz: ['basic', 'contorno'], whiteboard: ['basic', 'contorno'], neon: ['basic', 'contorno'], isometrico: ['std', 'iso'], silhueta: ['preto', 'base'], pixel: ['toon', 'anime'], flat: ['basic', 'flat'],
	}[id] || ['toon', 'anime'];
	const M = fabricaMat(cfg[0]), P = paletas[cfg[1]];
	const semParede = id === 'silhueta';
	const q = quarto(M, P, { paredes: !semParede }); cena.add(q.grupo); cena.add(personagem(M, P));
	renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.NoToneMapping;
	let cam = camPersp(W, H), passes = [], contorno = null;
	const frente = () => camOrto(W, H, 2.45, [0.1, 1.95, 12], [0.1, 1.95, 0]);
	switch (id) {
		case 'anime': cena.background = new THREE.Color(P.parede); luzes(cena, { ambI: 1.1, solI: 1.4, abajurI: 5 }); contorno = { espessura: 0.004 }; break;
		case 'pixel': cena.background = new THREE.Color(P.parede); luzes(cena, { ambI: 1.1, solI: 1.4, abajurI: 5 }); contorno = { espessura: 0.012 }; break;
		case 'sombrio': cena.background = new THREE.Color('#05060A'); cena.fog = new THREE.FogExp2('#0A0C12', 0.07);
			luzes(cena, { amb: '#3A4466', chao: '#000000', ambI: 0.25, solI: 0.15, abajur: '#FFAA55', abajurI: 14, lua: 0.8 }); renderer.toneMapping = THREE.ACESFilmicToneMapping;
			passes.push(FILTROS.grao({ grao: 0.1, vinheta: 0.9 })); break;
		case 'hq': cena.background = new THREE.Color('#999'); luzes(cena, { ambI: 0.9, solI: 2.6, solPos: [6, 9, 3], abajurI: 8 }); passes.push(FILTROS.noir()); break;
		case 'aquarela': cena.background = new THREE.Color(P.parede); luzes(cena, { ambI: 1.3, solI: 1.1, abajurI: 4 }); passes.push(FILTROS.aquarela()); break;
		case 'papel': cam = frente(); cena.background = new THREE.Color(P.parede); q.grupo.children.forEach((o, i) => { o.position.z += (i % 5) * 0.04; });
			luzes(cena, { ambI: 1.0, solI: 2.2, solPos: [-3, 6, 9], abajurI: 3 }); passes.push(FILTROS.grao({ grao: 0.07, vinheta: 0.25 })); break;
		case 'vitral': cena.background = new THREE.Color(P.parede); luzes(cena, { ambI: 1.2, solI: 1.5, abajurI: 6 }); passes.push(FILTROS.vitral()); break;
		case 'giz': cena.background = new THREE.Color(P.parede); passes.push(FILTROS.linhas({ fundo: '#1F3A2C', tinta: '#F2EFE4', preench: 0.22 })); break;
		case 'whiteboard': cena.background = new THREE.Color(P.parede); passes.push(FILTROS.linhas({ fundo: '#FAFAF6', tinta: '#1E1E24', preench: 0.12 })); break;
		case 'neon': cena.background = new THREE.Color('#000'); passes.push(FILTROS.linhas({ fundo: '#07031A', preench: 0.0, neon: 1 }), 'bloom'); break;
		case 'isometrico': cam = camOrto(W, H, 3.7, [9, 8.5, 9], [-0.4, 1.3, -0.9]); cena.background = new THREE.Color('#DDEBF7'); luzes(cena, { ambI: 1.2, solI: 1.8, solPos: [6, 10, 3], abajurI: 4 });
			passes.push(FILTROS.grao({ grao: 0.02, vinheta: 0.15 })); break;
		case 'silhueta': { cam = camPersp(W, H, [0.4, 1.7, 9], [0.1, 1.6, -1], 34);
			const cv = document.createElement('canvas'); cv.width = 4; cv.height = 256; const g = cv.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
			[[0, '#2A1650'], [0.45, '#C0396B'], [0.7, '#F47A44'], [1, '#FFD27A']].forEach(([a, c]) => gr.addColorStop(a, c)); g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
			const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; cena.background = t;
			const sol = new THREE.Mesh(new THREE.CircleGeometry(1.9, 64), new THREE.MeshBasicMaterial({ color: '#FFE7A8' })); sol.position.set(-1.2, 1.3, -8); cena.add(sol);
			const chao = new THREE.Mesh(new THREE.BoxGeometry(40, 0.6, 6), new THREE.MeshBasicMaterial({ color: '#050307' })); chao.position.set(0, -0.3, -1); cena.add(chao);
			const morro = new THREE.Mesh(new THREE.SphereGeometry(6, 32, 16), new THREE.MeshBasicMaterial({ color: '#3A1438' })); morro.position.set(4, -4.6, -9); morro.scale.set(2, 1, 1); cena.add(morro);
			for (let i = 0; i < 6; i++) { const p = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.32, 3), new THREE.MeshBasicMaterial({ color: '#150818' })); p.position.set(-3.2 + i * 0.45, 3.4 + Math.sin(i * 1.7) * 0.3, -3); p.rotation.z = Math.PI / 2; cena.add(p); }
			break; }
		case 'flat': cam = frente(); cena.background = new THREE.Color(P.parede); contorno = { espessura: 0.006, cor: [0.12, 0.1, 0.16] }; break;
	}
	if (contorno) {
		const ef = new OutlineEffect(renderer, { defaultThickness: contorno.espessura, defaultColor: contorno.cor || [0.1, 0.06, 0.12], defaultAlpha: 1 });
		return { render: () => ef.render(cena, cam) };
	}
	const comp = new EffectComposer(renderer); comp.addPass(new RenderPass(cena, cam));
	for (const f of passes) { if (f === 'bloom') { comp.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.75, 0.35, 0.2)); continue; } const p = new ShaderPass(f); p.uniforms.res.value.set(W, H); comp.addPass(p); }
	comp.addPass(new OutputPass());
	return { render: () => comp.render() };
}
