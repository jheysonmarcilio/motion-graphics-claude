import * as THREE from 'three';
import { seg, ease, label } from '../lib.js';

const CITIES = {
	'São Paulo': [-23.55, -46.63], 'Nova York': [40.71, -74.0], 'Lisboa': [38.72, -9.14], 'Londres': [51.5, -.12],
	'Lagos': [6.52, 3.38], 'Tóquio': [35.68, 139.69], 'Mumbai': [19.07, 72.88], 'Sydney': [-33.87, 151.2], 'Cidade do México': [19.43, -99.13],
};
const ll = (lat, lon, r = 1) => { const phi = (90 - lat) * Math.PI / 180, th = (lon + 180) * Math.PI / 180; return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th)); };

export default {
	id: 'globo', num: '09', dur: 10,
	title: 'Globo, dados e conexões',
	tags: ['texturas da NASA (dia/noite)', 'shader de atmosfera', 'arcos animados', 'barras de dados 3D', 'etiquetas de cidades'],
	uses: 'estatísticas pelo mundo, onde um caso aconteceu, migração, “quantas pessoas sofrem de…”',
	async init(ctx) {
		const scene = new THREE.Scene();
		scene.background = new THREE.Color('#02030a');
		const camera = new THREE.PerspectiveCamera(35, ctx.W / ctx.H, .1, 100);
		const [day, night, clouds] = await Promise.all(['earth_atmos_2048.jpg', 'earth_lights_2048.png', 'earth_clouds_1024.png'].map(f => ctx.tex('textures/planets/' + f)));
		day.colorSpace = night.colorSpace = THREE.SRGBColorSpace;
		const sunDir = new THREE.Vector3(1, .3, .6).normalize();
		const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 64), new THREE.ShaderMaterial({
			uniforms: { uDay: { value: day }, uNight: { value: night }, uSun: { value: sunDir } },
			vertexShader: `varying vec2 vUv; varying vec3 vN; void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
			fragmentShader: `
				uniform sampler2D uDay, uNight; uniform vec3 uSun; varying vec2 vUv; varying vec3 vN;
				void main(){
					float d = dot(normalize(vN), uSun);
					vec3 dayC = texture2D(uDay, vUv).rgb, nightC = texture2D(uNight, vUv).rgb * vec3(1., .8, .5) * 2.2;
					float k = smoothstep(-.15, .2, d);
					vec3 col = mix(nightC + dayC * .03, dayC * (.25 + .9 * max(d, 0.)), k);
					gl_FragColor = vec4(col, 1.);
					#include <colorspace_fragment>
				}`
		}));
		const cloud = new THREE.Mesh(new THREE.SphereGeometry(1.012, 96, 48), new THREE.MeshLambertMaterial({ alphaMap: clouds, transparent: true, opacity: .55, depthWrite: false }));
		const atmo = new THREE.Mesh(new THREE.SphereGeometry(1.18, 96, 48), new THREE.ShaderMaterial({
			vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
			fragmentShader: `varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1. - abs(dot(vN, vV)), 3.); gl_FragColor = vec4(vec3(.3,.6,1.) * f * .8, f); }`,
			side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
		}));
		const globe = new THREE.Group(); globe.add(earth); scene.add(globe, atmo);
		const sunL = new THREE.DirectionalLight('#ffffff', 2.5); sunL.position.copy(sunDir); scene.add(sunL);
		// estrelas
		const rng = ctx.rng(3), SP = new Float32Array(3000 * 3);
		for (let i = 0; i < 3000; i++) { const v = new THREE.Vector3(rng() - .5, rng() - .5, rng() - .5).normalize().multiplyScalar(40 + rng() * 20); v.toArray(SP, i * 3); }
		const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(SP, 3));
		scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: '#ffffff', size: .08, sizeAttenuation: true })));

		// barras de dados + etiquetas
		const values = { 'São Paulo': .55, 'Nova York': .7, 'Lisboa': .3, 'Londres': .5, 'Lagos': .45, 'Tóquio': .8, 'Mumbai': .65, 'Sydney': .35, 'Cidade do México': .4 };
		const bars = Object.entries(CITIES).map(([name, [la, lo]], i) => {
			const p = ll(la, lo, 1.0);
			const bar = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, 1, 8).translate(0, .5, 0), new THREE.MeshBasicMaterial({ color: '#7fe7ff' }));
			bar.position.copy(p); bar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), p.clone().normalize());
			globe.add(bar);
			const lb = label(name, 'tag3d city'); lb.position.copy(ll(la, lo, 1.0 + values[name] * .5 + .05)); globe.add(lb);
			return { bar, v: values[name], el: lb.userData.el, i, p };
		});
		// arcos saindo de São Paulo
		const from = ll(...CITIES['São Paulo'], 1.0);
		const arcs = ['Lisboa', 'Nova York', 'Tóquio', 'Lagos', 'Londres', 'Sydney'].map((n, i) => {
			const to = ll(...CITIES[n], 1.0), mid = from.clone().add(to).multiplyScalar(.5);
			mid.normalize().multiplyScalar(1 + from.distanceTo(to) * .45);
			const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
			const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 120, .004, 6), new THREE.MeshBasicMaterial({ color: '#ffb347' }));
			const dot = new THREE.Mesh(new THREE.SphereGeometry(.014, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
			globe.add(tube, dot);
			return { tube, dot, curve, d: i * .35 };
		});

		const v = new THREE.Vector3(), wp = new THREE.Vector3();
		return {
			scene, camera, exposure: 1, bloom: { strength: .45, radius: .5, threshold: .7 },
			update(t) {
				globe.rotation.y = -1.2 + t * .22;
				cloud.rotation.y = t * .03;
				const zoom = ease.expoOut(seg(t, 0, 3));
				camera.position.set(0, .45, 7 - zoom * 3.2);
				camera.lookAt(0, .05, 0);
				bars.forEach(b => {
					const k = ease.expoOut(seg(t, 1.2 + b.i * .12, 2.6 + b.i * .12));
					b.bar.scale.set(1, Math.max(.001, b.v * .5 * k), 1);
					b.bar.getWorldPosition(wp);
					const facing = wp.clone().normalize().dot(v.copy(camera.position).normalize());
					b.el.style.opacity = k * THREE.MathUtils.smoothstep(facing, .15, .45);
				});
				arcs.forEach(a => {
					const k = ease.expoInOut(seg(t, 3 + a.d, 4.6 + a.d));
					a.tube.geometry.setDrawRange(0, Math.floor(k * 120) * 6 * 6);
					a.dot.visible = k > 0 && k < 1; a.curve.getPoint(k, a.dot.position);
				});
			}
		};
	}
};
