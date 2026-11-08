// Estilo Sticker — elenco como cartões 2D iluminados no mundo 3D (porte enxuto de templates-ts/cast.ts).
// Cada quadro: cast.begin(camera, sunDir) → cast.person(...) / cast.card(...) / cast.blob(...) → cast.end().
// Um canvas por desenho distinto (pool com chave), resolução pela distância à câmera. Personagens = billboards que só
// giram em y (cardShade: tinta da luz da cena, chão claro na sombra, gradiente lateral para o sol). Camada NOINK.
import * as THREE from 'three';
import { Pen, bodyFront, bodySide, fxContact, fxShadow } from './toon.js';
import { cardShade, blobMaterial, CARD_K } from './cardshade.js';
import { NOINK, SOFT } from './ink.js';

export const SU = 0.00216; // metros por unidade de desenho: 1000 = 2,16 m
const q = (v, n = 60) => Math.round(v * n) / n;
const fkey = (o) => JSON.stringify(o, (_k, v) => (typeof v === 'number' ? q(v) : v));
const tier = (d) => (d < 3.2 ? [1200, 2000, 2] : d < 6.5 ? [720, 1200, 1.2] : d < 16 ? [360, 600, .6] : [180, 300, .3]);

class Pool {
	constructor() { this.live = new Map(); this.free = []; this.reqs = []; }
	req(key, w, h, k, draw) { const r = { key: `${w}x${h}|${key}`, w, h, k, draw, tex: null }; this.reqs.push(r); return r; }
	flush() {
		const want = new Map();
		for (const r of this.reqs) { const l = want.get(r.key); if (l) l.push(r); else want.set(r.key, [r]); }
		for (const [key, e] of this.live) if (!want.has(key)) { this.live.delete(key); this.free.push(e); }
		for (const [key, rs] of want) {
			let e = this.live.get(key);
			if (!e) {
				const r = rs[0], i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
				if (i >= 0) e = this.free.splice(i, 1)[0];
				else { const cv = document.createElement('canvas'); cv.width = r.w; cv.height = r.h; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; e = { cv, tex, w: r.w, h: r.h }; }
				const g = e.cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, e.w, e.h); g.setTransform(r.k, 0, 0, r.k, 0, 0);
				r.draw(new Pen(g)); e.tex.needsUpdate = true; this.live.set(key, e);
			}
			for (const r of rs) r.tex = e.tex;
		}
		this.reqs = [];
	}
}
const blank = (() => { const c = document.createElement('canvas'); c.width = c.height = 2; return new THREE.CanvasTexture(c); })();
const BODY = (() => { const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU); g.translate(0, (975 - 500) * SU, 0); return g; })();
const QUAD = new THREE.PlaneGeometry(1, 1);

export class Cast {
	constructor(parent) {
		this.parent = parent; this.pool = new Pool(); this.actors = []; this.fxs = []; this.ia = 0; this.ifx = 0; this.jobs = []; this.nb = 0;
		this.cam = new THREE.Vector3(); this.right = new THREE.Vector3(1, 0, 0); this.sun = new THREE.Vector3(0, 1, 0); this.golden = 0;
	}
	begin(camera, sunDir, golden = 0) {
		camera.updateMatrixWorld(); this.cam.setFromMatrixPosition(camera.matrixWorld);
		this.right.setFromMatrixColumn(camera.matrixWorld, 0); this.sun.copy(sunDir); this.golden = golden;
		this.ia = 0; this.ifx = 0; this.jobs = [];
	}
	/** ângulo (no canvas) de onde vem a luz, em passos de 45° */
	light2D(mirror) { const sx = this.sun.dot(this.right) * (mirror ? -1 : 1), sy = -this.sun.y; return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4); }
	_actor() {
		let a = this.actors[this.ia++];
		if (!a) {
			const m = cardShade(new THREE.MeshLambertMaterial({ map: blank, alphaTest: .5, side: THREE.DoubleSide }));
			const mesh = new THREE.Mesh(BODY, m); mesh.receiveShadow = true; mesh.renderOrder = 1; mesh.rotation.order = 'YXZ'; mesh.layers.set(NOINK); mesh.frustumCulled = false;
			mesh.onBeforeRender = (r) => { const rt = r.getRenderTarget(); CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920; };
			this.parent.add(mesh); a = { mesh, mat: m }; this.actors.push(a);
		}
		a.mesh.visible = true; return a;
	}
	_fx() {
		let f = this.fxs[this.ifx++];
		if (!f) {
			const cut = new THREE.MeshBasicMaterial({ map: blank, alphaTest: .5, side: THREE.DoubleSide });
			const soft = new THREE.MeshBasicMaterial({ map: blank, transparent: true, depthWrite: false, side: THREE.DoubleSide });
			const blob = blobMaterial(blank);
			const mesh = new THREE.Mesh(QUAD, cut); mesh.frustumCulled = false; this.parent.add(mesh); f = { mesh, cut, soft, blob }; this.fxs.push(f);
		}
		f.mesh.visible = true; return f;
	}
	/**
	 * Personagem. who: { id, o: Outfit, seed }. at: [x, y, z]. opts: FrontOpts de toon.js (expr, mode, phase, blink, look,
	 * facing, wave, tilt, headTilt, prop) ou { side: true, ...SideOpts }. extra: { scale, mirror, lean, yaw, blob }
	 */
	person(who, at, opts = {}, extra = {}) {
		const [x, y, z] = at, sc = extra.scale ?? 1;
		const d = this.cam.distanceTo(new THREE.Vector3(x, y + 1.2, z)) / sc;
		const [w, h, k] = tier(d), mirror = !!extra.mirror, side = !!opts.side;
		const o2 = { ...opts, light: this.light2D(mirror), seed: who.seed ?? 1 }; delete o2.side;
		const key = `${side ? 'S' : 'F'}|${who.id}|${fkey(o2)}`;
		const draw = extra.draw ? (p) => extra.draw(p, o2) : side ? (p) => bodySide(p, who.o, o2) : (p) => bodyFront(p, who.o, o2);
		const r = this.pool.req(key, w, h, k, draw);
		const a = this._actor();
		a.mesh.geometry = extra.geo || BODY;
		a.mesh.position.set(x, y, z); a.mesh.scale.set(mirror ? -sc : sc, sc, sc);
		a.mesh.rotation.set(0, extra.yaw ?? Math.atan2(this.cam.x - x, this.cam.z - z), extra.lean ?? 0);
		this.jobs.push(() => { if (r.tex) a.mat.map = r.tex; });
		if (extra.blob !== false && y < .05) this.blob(x, y, z, sc);
		return a.mesh;
	}
	/**
	 * Cartão de efeito: key, canvas [cw, ch], draw(p), at [x,y,z], size [w,h] em metros.
	 * o: { soft, flat (deitado no chão), rot (graus no plano), face: 'yaw'|'screen' }
	 */
	card(key, cw, ch, draw, at, size, o = {}) {
		const r = this.pool.req(key, cw, ch, 1, draw), f = this._fx(), m = f.mesh;
		m.position.set(...at); m.scale.set(size[0], size[1], 1);
		m.layers.set(o.soft || o.blob ? SOFT : NOINK);
		m.material = o.blob ? f.blob : o.soft ? f.soft : f.cut; m.renderOrder = o.blob ? .5 : o.soft ? 5 : 2;
		if (o.flat) { m.rotation.set(-Math.PI / 2, 0, (o.rot || 0) * Math.PI / 180, 'XYZ'); }
		else if (o.face === 'screen') { m.quaternion.copy(o.camQuat); m.rotateZ((o.rot || 0) * Math.PI / 180); }
		else { m.rotation.set(0, Math.atan2(this.cam.x - at[0], this.cam.z - at[2]), (o.rot || 0) * Math.PI / 180, 'YXZ'); }
		if (o.opacity !== undefined) { f.soft.opacity = o.opacity; }
		this.jobs.push(() => { if (!r.tex) return; if (o.blob && r.tex.generateMipmaps) { r.tex.generateMipmaps = false; r.tex.minFilter = THREE.LinearFilter; r.tex.needsUpdate = true; } m.material.map = r.tex; });
		return m;
	}
	/** sombra de contato (multiplica o chão) + cauda longe do sol de dia */
	blob(x, y, z, sc = 1) {
		const S = this.sun, hl = Math.hypot(S.x, S.z) || 1, ox = -S.x / hl, oz = -S.z / hl, rot = Math.atan2(-ox, -oz) * 180 / Math.PI;
		const gold = this.golden > .5, lift = (this.nb = ((this.nb || 0) + 1) % 12) * .006; // altura própria por sombra (sem z-fighting)
		const el = Math.asin(Math.min(.99, Math.max(.1, S.y)));
		const len = Math.min(gold ? 4.5 : 2.4, Math.max(.5, 1.6 / Math.tan(el))) * sc, hh = len + .55 * sc, c = .3 * hh;
		const tail = gold ? '#9a92b8' : '#8f93b4';
		this.card('blob|tail|' + tail, 128, 256, (p) => fxShadow(p, tail), [x + ox * c, y + .02 + lift, z + oz * c], [.72 * sc, hh], { flat: true, blob: true, rot });
		const cc = gold ? '#5d5584' : '#55587f';
		this.card('blob|contact|' + cc, 128, 128, (p) => fxContact(p, cc), [x, y + .023 + lift, z], [.55 * sc, .42 * sc], { flat: true, blob: true, rot });
	}
	end() {
		this.pool.flush(); for (const j of this.jobs) j();
		for (let i = this.ia; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
		for (let i = this.ifx; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
	}
}
