// Estilo Sticker — pós-processamento. Ordem (do original): tinta → lente → bloom (limiar 1,0) → tone map NEUTRAL → grade.
// Extra do projeto: no passe final entram flash branco, crossfade entre planos (tPrev) e desfoque direcional de whip.
// Uso:
//   const post = createPost(renderer, scene, camera, W, H);
//   post.lens(focoMetros, cInfPx)      // cInf = desfoque no infinito em px a 1080 de largura (0 = sem desfoque)
//   post.render({ flash, whip:[dx,dy], xfade })  → desenha na tela
//   post.capture() antes de um crossfade: guarda o quadro atual em tPrev
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { InkPass, NOINK, SOFT } from './ink.js';

const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';

// desfoque de lente "scatter-as-gather": 64 amostras em espiral dourada, peso pelo círculo de confusão de cada amostra;
// fundo não vaza sobre primeiro plano nítido.
const LENS = {
	uniforms: { tDiffuse: { value: null }, tDepth: { value: null }, cNear: { value: .1 }, cFar: { value: 1000 }, focus: { value: 5 }, cInf: { value: 0 }, texel: { value: new THREE.Vector2() }, maxR: { value: 22 } },
	vertexShader: VS,
	fragmentShader: /* glsl */`
	#include <packing>
	uniform sampler2D tDiffuse; uniform sampler2D tDepth; uniform float cNear, cFar, focus, cInf, maxR; uniform vec2 texel;
	varying vec2 vUv;
	float zOf(vec2 uv) { float d = texture2D(tDepth, uv).x; return d >= 1.0 ? cFar : -perspectiveDepthToViewZ(d, cNear, cFar); }
	float coc(float z) { return min(maxR, cInf * abs(1.0 - focus / z)); }
	void main() {
		vec4 c0 = texture2D(tDiffuse, vUv);
		if (cInf < 0.05) { gl_FragColor = c0; return; }
		float z0 = zOf(vUv), r0 = coc(z0);
		vec3 acc = c0.rgb; float wsum = 1.0;
		const int N = 64; const float GA = 2.39996323;
		for (int i = 1; i < N; i++) {
			float fi = float(i), r = sqrt(fi / float(N)) * maxR; float a = fi * GA;
			vec2 uv = vUv + vec2(cos(a), sin(a)) * r * texel;
			float z = zOf(uv), rs = coc(z);
			float behind = step(z0 + 0.05, z);                 // amostra atrás do pixel central
			float rr = mix(rs, min(rs, r0), behind);            // fundo só espalha até o raio do centro
			float w = clamp(rr - r + 1.0, 0.0, 1.0);
			acc += texture2D(tDiffuse, uv).rgb * w; wsum += w;
		}
		gl_FragColor = vec4(acc / wsum, c0.a);
	}`,
};

// grade (sRGB, depois do tone map) + flash + crossfade + whip
const FINAL = {
	uniforms: { tDiffuse: { value: null }, tPrev: { value: null }, xfade: { value: 0 }, flash: { value: 0 }, whip: { value: new THREE.Vector2() },
		sat: { value: 1.06 }, contrast: { value: 1.04 }, lift: { value: new THREE.Vector3(.008, .010, .03) }, warm: { value: 0 }, vig: { value: .12 } },
	vertexShader: VS,
	fragmentShader: /* glsl */`
	uniform sampler2D tDiffuse; uniform sampler2D tPrev; uniform float xfade, flash, sat, contrast, warm, vig; uniform vec2 whip; uniform vec3 lift;
	varying vec2 vUv;
	vec3 grade(vec3 c) {
		float l = dot(c, vec3(.2126, .7152, .0722));
		c = mix(vec3(l), c, sat);
		c = (c - .5) * contrast + .5;
		c += lift * (1.0 - smoothstep(0.0, .55, l));         // sombras um pouco azul-violeta, sem esmagar o preto
		c += warm * vec3(.03, .012, -.02) * smoothstep(.3, 1.0, l);
		return c;
	}
	void main() {
		vec3 c;
		if (length(whip) > 1e-4) { c = vec3(0.0); for (int i = 0; i < 13; i++) { float k = float(i) / 12.0 - .5; c += texture2D(tDiffuse, vUv + whip * k).rgb; } c /= 13.0; }
		else c = texture2D(tDiffuse, vUv).rgb;
		c = grade(c);
		vec2 d = vUv - .5; d.y *= 1.3; c *= 1.0 - vig * smoothstep(.35, .95, length(d));
		if (xfade > 0.0) c = mix(c, texture2D(tPrev, vUv).rgb, xfade);
		c = mix(c, vec3(1.0), flash);
		gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
	}`,
};

export function createPost(renderer, scene, camera, W, H) {
	camera.layers.enable(0); camera.layers.enable(NOINK); camera.layers.enable(SOFT);
	const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
	const composer = new EffectComposer(renderer, rt);
	composer.setPixelRatio(1); composer.setSize(W, H); composer.renderToScreen = false;
	composer.addPass(new RenderPass(scene, camera));
	const ink = new InkPass(scene, camera); composer.addPass(ink);
	const lens = new ShaderPass(LENS); lens.uniforms.tDepth.value = ink.depthTexture; lens.uniforms.texel.value.set(1 / W, 1 / H);
	composer.addPass(lens);
	const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), .5, .6, 1.0); composer.addPass(bloom);
	composer.addPass(new OutputPass());
	const fin = new ShaderPass(FINAL); composer.addPass(fin);
	const prev = new THREE.WebGLRenderTarget(W, H);
	fin.uniforms.tPrev.value = prev.texture;
	const copy = new FullScreenQuad(new THREE.ShaderMaterial({ uniforms: { t: { value: null } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }', fragmentShader: 'uniform sampler2D t; varying vec2 vUv; void main(){ gl_FragColor = texture2D(t, vUv); }', depthTest: false, depthWrite: false }));
	const px = H / 1920; // parâmetros em pixel escalam com a altura
	return {
		composer, ink, bloom, final: fin,
		lens(focus, cInf) { const u = lens.uniforms; u.focus.value = Math.max(.3, focus); u.cInf.value = cInf * px * (1080 / W) * (W / 1080); u.maxR.value = Math.max(4, Math.min(24, cInf * 1.4)) * px; lens.enabled = cInf > .05; },
		grade(o) { for (const k in o) { const u = fin.uniforms[k]; if (u?.value?.set && Array.isArray(o[k])) u.value.set(...o[k]); else if (u) u.value = o[k]; } },
		render({ flash = 0, whip = [0, 0], xfade = 0, toScreen = true } = {}) {
			const u = lens.uniforms; u.cNear.value = camera.near; u.cFar.value = camera.far;
			fin.uniforms.flash.value = flash; fin.uniforms.whip.value.set(whip[0], whip[1]); fin.uniforms.xfade.value = xfade;
			composer.render();
			copy.material.uniforms.t.value = composer.readBuffer.texture;
			renderer.setRenderTarget(toScreen ? null : prev); copy.render(renderer); renderer.setRenderTarget(null);
		},
		/** renderiza o quadro atual para tPrev (usar antes do render do outro plano, durante um crossfade) */
		capture() { this.render({ toScreen: false }); },
	};
}
