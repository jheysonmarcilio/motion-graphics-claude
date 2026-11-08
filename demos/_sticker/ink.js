// Estilo Sticker — contorno de tinta do mundo 3D (porte de templates-ts/ink.ts para o EffectComposer do three).
// Diferença do original: em vez de ler a profundidade do render principal, o passe de normais desenha também os
// cartões (camada NOINK) com alfa 0 → eles ocultam a tinta do mundo atrás deles e nunca recebem contorno de retângulo.
// Camada SOFT (céu, nuvens, fumaça, sombras de contato) fica fora deste passe.
// Valores finais do original: #030303, 5,1 px a 6 m → 3,3 px a 90 m (em 1080×1920), vincos ×0,8 a partir de 35°,
// saltos de profundidade a partir de 1 %, névoa tinge a tinta 0,3 só longe.
// O depthTexture deste passe (mundo + cartões) é reaproveitado pelo desfoque de lente (post.js).
import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

export const NOINK = 3; // cartões de personagem e efeitos recortados
export const SOFT = 4;  // céu, nuvens, fumaça, sombras de contato (nem tinta nem profundidade)

const DEF = {
	color: '#030303', strength: 1.0, widthNear: 5.1, widthFar: 3.3, distNear: 6, distFar: 90, creaseScale: 0.8,
	depthLo: 0.01, depthHi: 0.03, angleLo: 35, angleHi: 50, concaveGain: 0.7, farOpacity: 0.95, fadeNear: 150, fadeFar: 450,
};

const NORMAL_VERT = /* glsl */`
#include <common>
#include <skinning_pars_vertex>
uniform mat3 cutUv;
varying vec3 vN; varying vec3 vV; varying vec2 vCut;
void main() {
	#include <beginnormal_vertex>
	#include <defaultnormal_vertex>
	vN = transformedNormal;
	vCut = (cutUv * vec3(uv, 1.0)).xy;
	#include <begin_vertex>
	#include <project_vertex>
	vV = mvPosition.xyz;
}`;
const NORMAL_FRAG = /* glsl */`
uniform sampler2D tCut; uniform float cut; uniform float card;
varying vec3 vN; varying vec3 vV; varying vec2 vCut;
void main() {
	if (cut > 0.0 && texture2D(tCut, vCut).a < cut) discard;
	vec3 n;
	if (dot(vN, vN) < 1e-8) n = normalize(cross(dFdx(vV), dFdy(vV)));
	else n = normalize(vN) * (gl_FrontFacing ? 1.0 : -1.0);
	gl_FragColor = vec4(n, card > 0.5 ? 0.0 : 1.0);
}`;
const MASK_FRAG = /* glsl */`
#include <packing>
uniform sampler2D tNormal; uniform sampler2D tDepth; uniform vec2 texel;
uniform float cNear; uniform float cFar; uniform float p00; uniform float p11;
uniform float wNear; uniform float wFar; uniform float dNear; uniform float dFar; uniform float creaseScale;
uniform float depthLo; uniform float depthHi; uniform float cosLo; uniform float cosHi; uniform float concaveGain;
uniform float farOpacity; uniform float fadeNear; uniform float fadeFar; uniform float strength; uniform float pxScale;
uniform vec2 fogRange; uniform float fogStart;
varying vec2 vUv;
const vec2 STEP[4] = vec2[4](vec2(1.0, 0.0), vec2(0.0, 1.0), vec2(1.0, 1.0), vec2(1.0, -1.0));
const float SLEN[4] = float[4](1.0, 1.0, 1.41421, 1.41421);
#define RMAX 9
float dist(vec2 uv) { return -perspectiveDepthToViewZ(textureLod(tDepth, uv, 0.0).x, cNear, cFar); }
vec3 viewPos(vec2 uv, float d) { vec2 n = uv * 2.0 - 1.0; return vec3(n.x * d / p00, n.y * d / p11, -d); }
float crease(vec3 n0, vec3 P0, float zc, vec2 uq, float zq) {
	vec4 nq = textureLod(tNormal, uq, 0.0);
	if (nq.a < 0.5 || abs(zq - zc) > zc * depthLo) return 0.0;
	float k = 1.0 - smoothstep(cosHi, cosLo, dot(n0, nq.xyz));
	if (dot(viewPos(uq, zq) - P0, n0) > 0.0) k *= concaveGain;
	return k;
}
void main() {
	vec4 nc = textureLod(tNormal, vUv, 0.0);
	if (nc.a < 0.5) { gl_FragColor = vec4(0.0); return; }   // céu, vazio ou cartão: sem tinta do mundo
	float zc = dist(vUv);
	float t = clamp(log(zc / dNear) / log(dFar / dNear), 0.0, 1.0);
	float w = mix(wNear, wFar, t) * pxScale;
	float hc = 0.5 * w * creaseScale;
	float Wc = 1.0 / zc; vec3 n0 = nc.xyz; vec3 P0 = viewPos(vUv, zc);
	float eD = 0.0, eN = 0.0;
	for (int a = 0; a < 4; a++) {
		for (int r = 1; r <= RMAX; r++) {
			vec2 o = STEP[a] * texel * float(r);
			float d = (float(r) - 0.5) * SLEN[a];
			float cw = clamp(w + 0.5 - d, 0.0, 1.0), ch = clamp(hc + 0.5 - d, 0.0, 1.0);
			if (cw <= 0.0 && ch <= 0.0) break;
			float z1 = dist(vUv - o), z2 = dist(vUv + o);
			float s = (1.0 / z1 + 1.0 / z2 - 2.0 * Wc) / Wc;
			eD = max(eD, smoothstep(depthLo, depthHi, -s) * cw);
			if (ch > 0.0) eN = max(eN, max(crease(n0, P0, zc, vUv - o, z1), crease(n0, P0, zc, vUv + o, z2)) * ch);
		}
	}
	float ink = max(eD, eN) * strength * mix(1.0, farOpacity, t) * (1.0 - smoothstep(fadeNear, fadeFar, zc));
	float f0 = max(fogRange.x, fogStart);
	float fogK = fogRange.y > f0 ? clamp((zc - f0) / (fogRange.y - f0), 0.0, 1.0) : 0.0;
	gl_FragColor = vec4(ink, fogK, 0.0, 1.0);
}`;
const COMP_FRAG = /* glsl */`
uniform sampler2D tDiffuse; uniform sampler2D tMask; uniform vec2 texel; uniform vec3 inkColor; uniform vec3 fogColor; uniform float fogInk;
uniform int debug;
varying vec2 vUv;
float m(float x, float y) { return texture2D(tMask, vUv + vec2(x, y) * texel).r; }
void main() {
	float a = (4.0 * m(0.0, 0.0) + 2.0 * (m(1.0, 0.0) + m(-1.0, 0.0) + m(0.0, 1.0) + m(0.0, -1.0))
		+ m(1.0, 1.0) + m(-1.0, 1.0) + m(1.0, -1.0) + m(-1.0, -1.0)) / 16.0;
	vec4 c = texture2D(tDiffuse, vUv);
	if (debug == 1) { gl_FragColor = vec4(vec3(1.0 - a), 1.0); return; }
	float fk = texture2D(tMask, vUv).g;
	fk = max(fk, max(texture2D(tMask, vUv + vec2(texel.x, 0.0)).g, texture2D(tMask, vUv - vec2(texel.x, 0.0)).g));
	vec3 inkC = mix(inkColor, fogColor, fk * fogInk);
	vec3 g = pow(max(c.rgb, 0.0), vec3(1.0 / 2.2));
	gl_FragColor = vec4(pow(mix(g, pow(inkC, vec3(1.0 / 2.2)), a), vec3(2.2)), c.a);
}`;
const FS_VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';

export class InkPass extends Pass {
	constructor(scene, camera, options = {}) {
		super();
		const o = { ...DEF, ...options };
		this.scene = scene; this.camera = camera; this.debug = 0;
		this.needsSwap = true;
		this.rt = new THREE.WebGLRenderTarget(1, 1, {
			type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, generateMipmaps: false,
			depthBuffer: true, depthTexture: new THREE.DepthTexture(1, 1, THREE.UnsignedIntType),
		});
		this.maskRT = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, generateMipmaps: false, depthBuffer: false });
		this.normalMat = new THREE.ShaderMaterial({
			vertexShader: NORMAL_VERT, fragmentShader: NORMAL_FRAG, side: THREE.DoubleSide,
			uniforms: { tCut: { value: null }, cut: { value: 0 }, card: { value: 0 }, cutUv: { value: new THREE.Matrix3() } },
		});
		// por objeto: recorte (map + alphaTest) e se é cartão (camada NOINK)
		this.normalMat.onBeforeRender = (_r, _s, _c, _g, object, group) => {
			const mat = object.material, src = Array.isArray(mat) ? mat[group?.materialIndex ?? 0] : mat;
			const u = this.normalMat.uniforms, map = src && src.alphaTest > 0 ? src.map : null;
			u.tCut.value = map; u.cut.value = map ? src.alphaTest : 0;
			u.card.value = object.layers.isEnabled(NOINK) && !object.layers.isEnabled(0) ? 1 : 0;
			if (map) { map.updateMatrix(); u.cutUv.value.copy(map.matrix); }
			this.normalMat.uniformsNeedUpdate = true;
		};
		const texel = new THREE.Vector2(1, 1);
		this.texel = texel;
		this.maskMat = new THREE.ShaderMaterial({
			vertexShader: FS_VERT, fragmentShader: MASK_FRAG, depthTest: false, depthWrite: false,
			uniforms: {
				tNormal: { value: this.rt.texture }, tDepth: { value: this.rt.depthTexture }, texel: { value: texel },
				cNear: { value: .1 }, cFar: { value: 1000 }, p00: { value: 1 }, p11: { value: 1 },
				wNear: { value: o.widthNear }, wFar: { value: o.widthFar }, dNear: { value: o.distNear }, dFar: { value: o.distFar },
				creaseScale: { value: o.creaseScale }, depthLo: { value: o.depthLo }, depthHi: { value: o.depthHi },
				cosLo: { value: Math.cos(o.angleLo * Math.PI / 180) }, cosHi: { value: Math.cos(o.angleHi * Math.PI / 180) },
				concaveGain: { value: o.concaveGain }, farOpacity: { value: o.farOpacity }, fadeNear: { value: o.fadeNear }, fadeFar: { value: o.fadeFar },
				strength: { value: o.strength }, pxScale: { value: 1 }, fogRange: { value: new THREE.Vector2() }, fogStart: { value: 60 },
			},
		});
		this.compMat = new THREE.ShaderMaterial({
			vertexShader: FS_VERT, fragmentShader: COMP_FRAG, depthTest: false, depthWrite: false,
			uniforms: { tDiffuse: { value: null }, tMask: { value: this.maskRT.texture }, texel: { value: texel }, inkColor: { value: new THREE.Color(o.color) }, fogColor: { value: new THREE.Color() }, fogInk: { value: .3 }, debug: { value: 0 } },
		});
		this.quad = new FullScreenQuad(this.maskMat);
		this.clearCol = new THREE.Color();
	}
	get depthTexture() { return this.rt.depthTexture; }
	setSize(w, h) {
		this.rt.setSize(w, h); this.maskRT.setSize(w, h);
		this.texel.set(1 / w, 1 / h); this.maskMat.uniforms.pxScale.value = h / 1920;
	}
	render(renderer, writeBuffer, readBuffer) {
		const scene = this.scene, cam = this.camera;
		const mask = cam.layers.mask, override = scene.overrideMaterial, bg = scene.background, sh = renderer.shadowMap.autoUpdate;
		renderer.getClearColor(this.clearCol); const ca = renderer.getClearAlpha();
		// 1) normais + profundidade: mundo (0) e cartões (NOINK), sem SOFT
		cam.layers.mask = (1 << 0) | (1 << NOINK);
		scene.overrideMaterial = this.normalMat; scene.background = null; renderer.shadowMap.autoUpdate = false;
		renderer.setClearColor(0x000000, 0); renderer.setRenderTarget(this.rt); renderer.clear(true, true, false);
		renderer.render(scene, cam);
		cam.layers.mask = mask; scene.overrideMaterial = override; scene.background = bg; renderer.shadowMap.autoUpdate = sh;
		renderer.setClearColor(this.clearCol, ca);
		// 2) máscara de bordas
		const u = this.maskMat.uniforms, e = cam.projectionMatrix.elements;
		u.cNear.value = cam.near; u.cFar.value = cam.far; u.p00.value = e[0]; u.p11.value = e[5];
		const fog = scene.fog;
		if (fog && fog.isFog) { u.fogRange.value.set(fog.near, fog.far); this.compMat.uniforms.fogColor.value.copy(fog.color); } else u.fogRange.value.set(0, 0);
		this.quad.material = this.maskMat; renderer.setRenderTarget(this.maskRT); this.quad.render(renderer);
		// 3) composição
		this.compMat.uniforms.tDiffuse.value = readBuffer.texture; this.compMat.uniforms.debug.value = this.debug;
		this.quad.material = this.compMat;
		renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer); this.quad.render(renderer);
	}
}
