// Utilidades compartilhadas por todas as cenas do showcase.
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const lerp = (a, b, k) => a + (b - a) * k;
export const ease = {
	expoOut: x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x),
	expoIn: x => x <= 0 ? 0 : Math.pow(2, 10 * x - 10),
	expoInOut: x => x <= 0 ? 0 : x >= 1 ? 1 : x < .5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2,
	cubicInOut: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
	sineInOut: x => -(Math.cos(Math.PI * x) - 1) / 2,
	backOut: x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
};
export const inOut = (t, a, b, c, d, eIn = ease.expoOut, eOut = ease.expoInOut) => eIn(seg(t, a, b)) * (1 - eOut(seg(t, c, d)));
export const smooth = (t, a, b) => ease.cubicInOut(seg(t, a, b));

export function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// Etiqueta HTML presa a um ponto 3D (CSS2DRenderer)
export function label(html, cls = 'tag3d') {
	const d = document.createElement('div');
	d.className = cls; d.innerHTML = html;
	const o = new CSS2DObject(d);
	o.userData.el = d;
	return o;
}

// Bloco de UI 2D próprio da cena (mostrado só enquanto ela está ativa)
export function uiLayer(html, cls = '') {
	const d = document.createElement('div');
	d.className = 'scene-ui ' + cls; d.innerHTML = html;
	document.getElementById('ui').appendChild(d);
	return d;
}

export function fade(el, o, ty = 0, blur = 0) {
	el.style.opacity = o;
	el.style.transform = `translateY(${ty}px)`;
	el.style.filter = blur > .05 ? `blur(${blur}px)` : 'none';
}

// Coloca um objeto com altura `h` e base apoiada em y=0, centralizado em x/z
export function normalize(obj, h, center = true) {
	obj.updateMatrixWorld(true);
	const box = new THREE.Box3().setFromObject(obj), size = box.getSize(new THREE.Vector3());
	const s = h / size.y; obj.scale.multiplyScalar(s);
	obj.updateMatrixWorld(true);
	box.setFromObject(obj);
	const c = box.getCenter(new THREE.Vector3());
	if (center) { obj.position.x -= c.x; obj.position.z -= c.z; }
	obj.position.y -= box.min.y;
	return obj;
}
