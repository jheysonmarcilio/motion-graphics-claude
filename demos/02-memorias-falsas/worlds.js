// "Mundos" reutilizados entre capítulos: material de foto, álbum, sala/arquivo, cabeça de partículas, cérebro-quebra-cabeça.
import * as THREE from 'three';
import { C, col, lerp, clamp, seg, ease, canvasTex, texMat, lightCone, dust, pieceGeo, rimMat, figure, glow, morphPoints } from './lib.js';
import { photoTex, pageTex, woodTex, handTex, folderTex } from './draw.js';

// ── material de foto: sépia, tinta escorrendo, revelação polaroid, queima nas bordas ──
const NOISE = `
	float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
	float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
		return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }`;
export function photoMat(map, { sepia = 1, keepRed = 1, side = THREE.FrontSide, shared = null } = {}) {
	const u = shared || {
		uMelt: { value: 0 }, uDev: { value: 1 }, uOpacity: { value: 1 }, uSepia: { value: sepia }, uKeepRed: { value: keepRed },
		uTime: { value: 0 }, uBurn: { value: 0 }, uTint: { value: new THREE.Color(1, 1, 1) }, uBright: { value: 1 }, uHue: { value: 0 },
	};
	return new THREE.ShaderMaterial({
		uniforms: { map: { value: map }, ...u },
		vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
		fragmentShader: `uniform sampler2D map; uniform float uMelt, uDev, uOpacity, uSepia, uKeepRed, uTime, uBurn, uBright, uHue; uniform vec3 uTint; varying vec2 vUv;
			${NOISE}
			vec3 hue(vec3 c, float a){ const vec3 k = vec3(.57735); float ca = cos(a); return c*ca + cross(k,c)*sin(a) + k*dot(k,c)*(1.-ca); }
			void main(){
				vec2 uv = vUv;
				float col = vn(vec2(uv.x * 22., 3.)) * .7 + vn(vec2(uv.x * 61., 9.)) * .3;
				float drip = uMelt * (.2 + .8 * col) * (1.15 - uv.y * .5);
				vec2 suv = uv + vec2(sin(uv.y * 30. + uTime) * .004 * uMelt, drip * .55);
				vec4 c = texture2D(map, suv);
				if (suv.y > 1.) c = vec4(.05,.04,.05, c.a);
				float l = dot(c.rgb, vec3(.299,.587,.114));
				vec3 sep = vec3(l*1.08, l*.88, l*.68);
				float red = smoothstep(.12, .3, c.r - max(c.g, c.b));
				vec3 cc = hue(c.rgb, uHue * red);
				vec3 o = mix(cc, sep, uSepia * (1. - red * uKeepRed));
				float ink = smoothstep(.05, .6, drip) * (.6 + .4 * vn(uv * 9. + uTime * .1));
				o = mix(o, vec3(.035,.03,.05), ink * .85);
				o = mix(vec3(.62,.6,.56), o, uDev) * uTint * uBright;
				float a = c.a * uOpacity;
				if (uBurn > 0.) {
					float ed = min(min(uv.x, 1.-uv.x), min(uv.y, 1.-uv.y)) + vn(uv * 7.) * .09 + vn(uv * 23.) * .03;
					float th = uBurn * .62;
					if (ed < th) discard;
					float rim = 1. - smoothstep(0., .035, ed - th);
					o = mix(o, vec3(.05,.02,0.), smoothstep(.07, 0., ed - th) * .8);
					o += vec3(1.5, .55, .12) * rim * step(.001, uBurn);
				}
				gl_FragColor = vec4(o, a);
			}`,
		transparent: true, side, depthWrite: true,
	});
}
export function photoMesh(kind, seed, w = 1.6, opts = {}) {
	const tex = photoTex(kind, seed);
	const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * .75), photoMat(tex, opts));
	m.u = m.material.uniforms; m.tex = tex;
	return m;
}

// ── mesa + abajur ──
export function tableAndLamp(scene, rng, { lampPos = [-3.2, 3.6, -2.4], target = [0.6, 0, 0], size = [16, 11] } = {}) {
	const wood = woodTex(); wood.repeat.set(3, 2);
	const table = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), new THREE.MeshStandardMaterial({ map: wood, roughness: .65, metalness: 0, color: '#8a6a55' }));
	table.rotation.x = -Math.PI / 2; table.receiveShadow = true; scene.add(table);
	const spot = new THREE.SpotLight(C.ambar, 0, 18, .62, .65, 1.2);
	spot.position.set(...lampPos); spot.target.position.set(...target); spot.castShadow = true; spot.shadow.mapSize.set(2048, 2048); spot.shadow.bias = -.0004;
	scene.add(spot, spot.target);
	const shade = new THREE.Mesh(new THREE.ConeGeometry(.55, .6, 32, 1, true), new THREE.MeshStandardMaterial({ color: '#1a1410', roughness: .5, side: THREE.DoubleSide }));
	shade.position.set(lampPos[0], lampPos[1] + .2, lampPos[2]);
	const dir = new THREE.Vector3(...target).sub(new THREE.Vector3(...lampPos)).normalize();
	shade.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir); scene.add(shade);
	const bulb = glow(C.ambar, 1.4, .9); bulb.position.copy(shade.position); scene.add(bulb);
	const cone = lightCone(C.ambar, 2.6, 7, .09); cone.position.copy(shade.position); cone.quaternion.copy(shade.quaternion); scene.add(cone);
	const ds = dust(rng, 320, [6, 4, 5], [lampPos[0] * .5 + target[0] * .5, 2.2, lampPos[2] * .5 + target[2] * .5], { color: C.ambar, size: 1.0, opacity: .5 });
	scene.add(ds);
	const amb = new THREE.HemisphereLight('#4a4a7a', '#120c08', .25); scene.add(amb);
	return { table, spot, shade, bulb, cone, dust: ds, amb, set(k) { spot.intensity = 60 * k; bulb.material.opacity = .9 * k; cone.material.uniforms.uOpacity.value = .09 * k; ds.material.uniforms.uOpacity.value = .55 * k; } };
}

// ── álbum: capa articulada, página que vira, fotos ──
export function album(scene) {
	const W = 3, D = 2.2;          // cada página
	const g = new THREE.Group(); scene.add(g);
	const leather = new THREE.MeshStandardMaterial({ color: '#3b1f17', roughness: .55, metalness: .05 });
	const pageMat = new THREE.MeshStandardMaterial({ map: pageTex(), roughness: .9 });
	const block = new THREE.Mesh(new THREE.BoxGeometry(W, .12, D), [leather, leather, pageMat, leather, leather, leather]);
	block.position.set(W / 2, .06, 0); block.castShadow = block.receiveShadow = true; g.add(block);
	// capa (gira em torno da lombada, eixo z em x=0)
	const cover = new THREE.Group(); cover.position.y = .13; g.add(cover);
	const coverMesh = new THREE.Mesh(new THREE.BoxGeometry(W + .06, .04, D + .08), leather); coverMesh.position.x = W / 2; coverMesh.castShadow = true; cover.add(coverMesh);
	const inner = new THREE.Mesh(new THREE.PlaneGeometry(W - .1, D - .1), new THREE.MeshStandardMaterial({ map: pageTex(), roughness: .9 }));
	inner.rotation.x = Math.PI / 2; inner.position.set(W / 2, -.025, 0); cover.add(inner);     // face interna (vira página esquerda)
	const coverEmb = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .5), new THREE.MeshStandardMaterial({ map: canvasTex(640, 200, (c, w, h) => { c.strokeStyle = '#a07a4a'; c.lineWidth = 4; c.strokeRect(10, 10, w - 20, h - 20); c.fillStyle = '#b58c55'; c.font = '600 84px Caveat'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Lembranças', w / 2, h / 2); }), transparent: true, roughness: .4, metalness: .6 }));
	coverEmb.rotation.x = -Math.PI / 2; coverEmb.position.set(W / 2, .021, 0); cover.add(coverEmb);
	// folha que vira (frente = página direita 1, verso = página esquerda 2)
	const leaf = new THREE.Group(); leaf.position.y = .125; g.add(leaf);
	const leafFront = new THREE.Mesh(new THREE.PlaneGeometry(W - .1, D - .1), pageMat); leafFront.rotation.x = -Math.PI / 2; leafFront.position.x = W / 2; leafFront.receiveShadow = true; leaf.add(leafFront);
	const leafBack = new THREE.Mesh(new THREE.PlaneGeometry(W - .1, D - .1), pageMat); leafBack.rotation.x = Math.PI / 2; leafBack.position.set(W / 2, -.004, 0); leaf.add(leafBack);

	// fotos: [onde, tipo, seed, x, z, largura, rot]
	const photos = {}; let layer = 0;
	const put = (parent, key, kind, seed, x, z, w, rot, under = false) => {
		layer++;   // cada foto numa altura própria: fotos sobrepostas nunca ficam no mesmo plano (senão piscam)
		const m = photoMesh(kind, seed, w); m.rotation.x = under ? Math.PI / 2 : -Math.PI / 2; m.rotation.z = rot;
		m.position.set(x, under ? -.032 - layer * .003 : .004 + layer * .003, z); m.renderOrder = layer; m.castShadow = false; m.name = 'foto:' + key; parent.add(m); photos[key] = m; return m;
	};
	// página esquerda (face interna da capa — fica "embaixo" com a capa fechada)
	put(cover, 'quintal', 'quintal', 3, W - 1.6 + .75, .45, 1.15, -.06, true).rotation.z = Math.PI + .05;
	put(cover, 'praia', 'praia', 5, W - .75 - .1, -.5, 1.05, Math.PI - .08, true);
	put(cover, 'corredor', 'corredor', 6, .75, .25, .9, Math.PI + .1, true);
	// folha (frente): aniversário + legenda
	const aniv = put(leaf, 'aniversario', 'aniversario', 1, W / 2 - .05, -.22, 1.9, .03);
	const caption = new THREE.Mesh(new THREE.PlaneGeometry(1.7, .3), texMat(handTex('porque eu lembro'), { color: '#ffffff' }));
	caption.rotation.x = -Math.PI / 2; caption.position.set(W / 2, .006, .78); leaf.add(caption);
	// verso da folha: página vazia com cantoneiras de foto arrancada
	const ghost = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.1), new THREE.MeshBasicMaterial({ map: canvasTex(400, 300, (c, w, h) => { c.strokeStyle = 'rgba(220,200,170,.25)'; c.lineWidth = 3; c.setLineDash([10, 8]); c.strokeRect(20, 20, w - 40, h - 40); }), transparent: true }));
	ghost.rotation.x = Math.PI / 2; ghost.position.set(W / 2, -.009, 0); leaf.add(ghost);
	// página direita de baixo (2): balão + shopping (polaroids)
	const base = new THREE.Group(); base.position.y = .121; g.add(base);
	put(base, 'balao', 'balao', 9, 1.0, -.25, 1.25, .08);
	put(base, 'shopping', 'shopping', 8, 2.1, .35, 1.25, -.07);
	return { g, cover, leaf, base, photos, caption, aniv, W, D };
}

// ── arquivo de gavetas (InstancedMesh) ──
export function drawerWall({ cols = 14, rows = 6, cw = .9, ch = .55, depth = .6, color = '#2a2840', rng = Math.random, labelColor = C.consciente } = {}) {
	const g = new THREE.Group();
	const n = cols * rows;
	const box = new THREE.InstancedMesh(new THREE.BoxGeometry(cw * .96, ch * .94, depth), new THREE.MeshStandardMaterial({ color, metalness: .65, roughness: .38 }), n);
	const handle = new THREE.InstancedMesh(new THREE.BoxGeometry(cw * .3, ch * .06, .05), new THREE.MeshStandardMaterial({ color: '#9a96b8', metalness: 1, roughness: .25 }), n);
	const lab = new THREE.InstancedMesh(new THREE.PlaneGeometry(cw * .32, ch * .16), new THREE.MeshBasicMaterial({ color: labelColor, transparent: true, opacity: .8, toneMapped: false }), n);
	const m = new THREE.Matrix4(), info = [];
	for (let i = 0; i < n; i++) {
		const c = i % cols, r = Math.floor(i / cols);
		const x = (c - (cols - 1) / 2) * cw, y = r * ch + ch / 2;
		info.push({ x, y, out: 0, lit: rng() });
		m.makeTranslation(x, y, 0); box.setMatrixAt(i, m);
		m.makeTranslation(x, y - ch * .12, depth / 2 + .02); handle.setMatrixAt(i, m);
		m.makeTranslation(x, y + ch * .2, depth / 2 + .005); lab.setMatrixAt(i, m);
		lab.setColorAt(i, col(labelColor).multiplyScalar(.3 + rng() * .9));
	}
	[box, handle, lab].forEach(o => { o.frustumCulled = false; g.add(o); });
	box.castShadow = box.receiveShadow = true;
	const api = {
		g, info, box, handle, lab, cols, rows, cw, ch, depth,
		// abre a gaveta i em `out` metros
		open(i, out) {
			const d = info[i]; d.out = out;
			m.makeTranslation(d.x, d.y, out); box.setMatrixAt(i, m);
			m.makeTranslation(d.x, d.y - ch * .12, depth / 2 + .02 + out); handle.setMatrixAt(i, m);
			m.makeTranslation(d.x, d.y + ch * .2, depth / 2 + .005 + out); lab.setMatrixAt(i, m);
			box.instanceMatrix.needsUpdate = handle.instanceMatrix.needsUpdate = lab.instanceMatrix.needsUpdate = true;
		},
		labels(k) { lab.material.opacity = .8 * k; },
	};
	return api;
}

// ── sala do consultório ──
export function room(scene, rng, { violet = 1 } = {}) {
	const R = new THREE.Group(); scene.add(R);
	const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), new THREE.MeshStandardMaterial({ map: (() => { const t = woodTex(1024, 1024, '#1f1712'); t.repeat.set(4, 3); return t; })(), roughness: .7, color: '#7a6a62' }));
	floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; R.add(floor);
	const rug = new THREE.Mesh(new THREE.CircleGeometry(2.6, 64), new THREE.MeshStandardMaterial({ color: '#2b2140', roughness: 1 })); rug.rotation.x = -Math.PI / 2; rug.position.set(0, .005, .6); rug.receiveShadow = true; R.add(rug);
	const wall = drawerWall({ cols: 22, rows: 9, rng }); wall.g.position.set(0, 0, -3.2); R.add(wall.g);
	// poltrona reclinada
	const fab = new THREE.MeshStandardMaterial({ color: '#4a2e3a', roughness: .85 });
	const chair = new THREE.Group(); R.add(chair); chair.position.set(-.9, 0, .5); chair.rotation.y = .5;
	const part = (w, h, d, x, y, z, rx = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), fab); m.position.set(x, y, z); m.rotation.x = rx; m.castShadow = m.receiveShadow = true; chair.add(m); return m; };
	part(1.1, .45, 1.2, 0, .3, 0); part(1.1, .9, .25, 0, .85, -.62, -.55); part(.18, .35, 1.2, -.6, .6, 0); part(.18, .35, 1.2, .6, .6, 0); part(1, .2, .7, 0, .3, .9, .25);
	// paciente reclinado (silhueta fresnel)
	const pm = rimMat(C.consciente, { fill: .1, power: 1.8 });
	const patient = figure(pm, { h: 1.6 }); patient.rotation.x = -1.05; patient.position.set(0, .55, -.35); chair.add(patient);
	// profissional sentado
	const tm = rimMat('#b9a6ff', { fill: .06, power: 2.2, opacity: .8 });
	const ther = figure(tm, { h: 1.7 }); ther.position.set(1.6, 0, 1.6); ther.rotation.y = -2.3; R.add(ther);
	ther.userData.lgL.rotation.x = ther.userData.lgR.rotation.x = -1.4; ther.userData.hip.position.y = .5;
	const stool = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, .45, 24), new THREE.MeshStandardMaterial({ color: '#1d1a26', roughness: .6 })); stool.position.set(1.62, .22, 1.62); R.add(stool);
	// abajur de pé
	const lampPos = new THREE.Vector3(-2.6, 2.4, -.6);
	const pole = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 2.4, 8), new THREE.MeshStandardMaterial({ color: '#222', metalness: .8, roughness: .3 })); pole.position.set(lampPos.x, 1.2, lampPos.z); R.add(pole);
	const shade = new THREE.Mesh(new THREE.CylinderGeometry(.25, .42, .4, 32, 1, true), new THREE.MeshStandardMaterial({ color: '#d9b38a', emissive: '#ffb070', emissiveIntensity: .8, side: THREE.DoubleSide })); shade.position.copy(lampPos); R.add(shade);
	const warm = new THREE.PointLight(C.ambar, 14, 9, 1.4); warm.position.copy(lampPos).add(new THREE.Vector3(0, -.15, 0)); warm.castShadow = true; R.add(warm);
	const cone = lightCone(C.ambar, 1.6, 2.4, .12); cone.position.copy(lampPos).add(new THREE.Vector3(0, -.1, 0)); R.add(cone);
	const vio = new THREE.SpotLight(C.consciente, 30 * violet, 20, .7, .8, 1); vio.position.set(3, 6, 5); vio.target.position.set(0, 1, -3); R.add(vio, vio.target);
	const fill = new THREE.HemisphereLight('#3a3466', '#0a0810', .35); R.add(fill);
	const ds = dust(rng, 700, [10, 5, 7], [0, 2.4, 0], { color: '#d8c8ff', size: 2, opacity: .45 }); R.add(ds);
	return { R, wall, chair, patient, ther, warm, vio, fill, cone, dust: ds, shade, floor, rug,
		tick(t) { ds.tick(t); patient.set({ breathe: 1, t }); ther.set({ t, breathe: .5 }); } };
}

// ── pasta 3D (para scanner, caneta, carimbos) ──
export function folder3D(label = '', color = '#c9b78f', scribble = false) {
	const tex = folderTex(label, color, 800, 560, scribble);
	const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.12), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: .8, side: THREE.DoubleSide }));
	m.castShadow = true; return m;
}

// ── caneta de luz ──
export function lightPen() {
	const g = new THREE.Group();
	const body = new THREE.Mesh(new THREE.CylinderGeometry(.035, .03, .9, 16), new THREE.MeshStandardMaterial({ color: '#1b1a24', metalness: .9, roughness: .2 }));
	body.position.y = .45; g.add(body);
	const tip = new THREE.Mesh(new THREE.SphereGeometry(.03, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' })); g.add(tip);
	const halo = glow(C.luz, .5, 1); g.add(halo);
	const halo2 = glow(C.consciente, 1.3, .7); g.add(halo2);
	const cap = new THREE.Mesh(new THREE.CylinderGeometry(.045, .04, .25, 16), new THREE.MeshStandardMaterial({ color: '#2a2838', metalness: .9, roughness: .25 }));
	cap.position.y = -.5; g.add(cap); cap.visible = false;
	const light = new THREE.PointLight('#d9ccff', 3, 2.5, 1.5); g.add(light);
	g.userData = { tip, halo, halo2, cap, light, body };
	g.on = k => { halo.material.opacity = .6 * k; halo2.material.opacity = .3 * k; light.intensity = 1.5 * k; tip.material.color.setScalar(.2 + .8 * k); };
	return g;
}
// traço da caneta (linha luminosa que se revela)
export function scribble(rng, w = 1.2, rows = 4, h = .5) {
	const pts = [];
	for (let r = 0; r < rows; r++) {
		const y = h / 2 - r * h / Math.max(1, rows - 1);
		for (let i = 0; i <= 50; i++) { const x = -w / 2 + w * i / 50 * (.75 + .25 * rng()); pts.push(new THREE.Vector3(x, y + Math.sin(i * 1.7 + r) * .03 + (rng() - .5) * .015, 0)); }
	}
	const geo = new THREE.BufferGeometry().setFromPoints(pts);
	const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: '#f2edff', transparent: true, opacity: 1 }));
	line.pts = pts; return line;
}

// ── cabeça de partículas (Lee Perry-Smith) ──
export async function headPositions(ctx, n = 9000, height = 3, rng = Math.random) {
	const gl = await ctx.gltf('models/gltf/LeePerrySmith/LeePerrySmith.glb');
	let mesh; gl.scene.traverse(o => { if (o.isMesh && !mesh) mesh = o; });
	mesh.updateMatrixWorld(true);
	const pos = mesh.geometry.attributes.position, v = new THREE.Vector3(), arr = [];
	for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld); arr.push(v.x, v.y, v.z); }
	const box = new THREE.Box3(); for (let i = 0; i < arr.length; i += 3) box.expandByPoint(v.set(arr[i], arr[i + 1], arr[i + 2]));
	const c = box.getCenter(new THREE.Vector3()), s = height / (box.max.y - box.min.y);
	const out = new Float32Array(n * 3), cnt = arr.length / 3;
	for (let i = 0; i < n; i++) { const j = Math.floor(rng() * cnt) * 3; out[i * 3] = (arr[j] - c.x) * s; out[i * 3 + 1] = (arr[j + 1] - c.y) * s; out[i * 3 + 2] = (arr[j + 2] - c.z) * s; }
	return out;
}
export function headPoints(P, rng, color = C.sinapse) {
	const p = morphPoints(P, P, P, { color, size: 2.0, rng }); return p;
}

// ── cérebro de peças de quebra-cabeça ──
export function puzzleBrain(rng, { s = .31, rx = 1.35, ry = 1.05, rz = 1.75 } = {}) {
	const g = new THREE.Group(), pieces = [];
	const matCore = new THREE.MeshStandardMaterial({ color: '#163a5a', emissive: C.sinapse, emissiveIntensity: .22, metalness: .3, roughness: .4 });
	const variants = []; for (let i = 0; i < 6; i++) variants.push(pieceGeo(s, [rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1].map(x => Math.sign(x) * (.6 + .4 * Math.abs(x))), .07));
	for (const side of [-1, 1]) {
		for (let la = -45; la <= 65; la += 15) {
			const lat = la * Math.PI / 180, ring = Math.max(3, Math.round(12 * Math.cos(lat)));
			for (let j = 0; j < ring; j++) {
				const lon = (j + .5) / ring * Math.PI - Math.PI / 2;     // meia esfera por hemisfério
				const nx = Math.cos(lat) * Math.cos(lon), ny = Math.sin(lat), nz = Math.cos(lat) * Math.sin(lon);
				const p = new THREE.Vector3(side * (Math.abs(nx) * rx + .08), ny * ry, nz * rz);
				const n = new THREE.Vector3(side * Math.abs(nx) / rx, ny / ry, nz / rz).normalize();
				const edge = Math.abs(nx) < .45 || la >= 60 || la <= -45;   // peças da borda/frente mudam
				const tabs = [rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1, rng() * 2 - 1].map(x => Math.sign(x) * (.5 + .5 * Math.abs(x)));
				const mat = edge ? new THREE.MeshStandardMaterial({ color: '#2a2850', emissive: C.consciente, emissiveIntensity: .25, metalness: .2, roughness: .5, transparent: true }) : matCore;
				const mesh = new THREE.Mesh(edge ? pieceGeo(s, tabs, .07, 10) : variants[pieces.length % variants.length], mat);
				mesh.position.copy(p); mesh.lookAt(p.clone().add(n)); mesh.rotateZ(rng() * Math.PI * 2);
				g.add(mesh);
				pieces.push({ mesh, p, n, edge, tabs, phase: rng() * 10, rot: mesh.quaternion.clone() });
			}
		}
	}
	return {
		g, pieces,
		// morph das peças da borda (reconstrói a geometria) + deslocamentos
		tick(t, amt = 1, s2 = s) {
			for (const pc of pieces) {
				if (!pc.edge) continue;
				const tb = pc.tabs.map((x, i) => Math.sin(t * (.9 + i * .23) + pc.phase + i) * amt + x * (1 - amt) );
				pc.mesh.geometry.dispose(); pc.mesh.geometry = pieceGeo(s2, tb.map(x => clamp(x, -1, 1)), .07, 10);
				const off = Math.sin(t * .7 + pc.phase) * .12 * amt;
				pc.mesh.position.copy(pc.p).addScaledVector(pc.n, .05 + off);
			}
		},
	};
}
