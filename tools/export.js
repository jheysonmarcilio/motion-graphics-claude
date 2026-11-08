// Exporta uma animação (HTML com window.__mg) para MP4, quadro a quadro.
// Uso: node tools/export.js demos/00-showreel [saida.mp4] [--fps 30] [--from 0] [--to 15] [--audio audio/narracao.wav] [--bg video.mp4]
// --bg: a página é um overlay transparente (PNG com alfa) composto por cima do vídeo de fundo.
// Tamanho do quadro: window.__mg.width/height (padrão 1920×1080; Shorts 1080×1920).
// Requer: servidor rodando (node tools/serve.js) + ffmpeg no PATH.
const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf('--' + name); return i >= 0 ? args.splice(i, 2)[1] : def; };
const fps = +opt('fps', 30), from = opt('from'), to = opt('to'), port = opt('port', 5173), audio = opt('audio'), bg = opt('bg');
if (audio && !fs.existsSync(audio)) { console.error('Áudio não encontrado: ' + audio); process.exit(1); }
const demo = args[0] || 'demos/00-showreel';
const out = path.resolve(args[1] || path.join('renders', path.basename(demo) + '.mp4'));
fs.mkdirSync(path.dirname(out), { recursive: true });

const browsers = [
	'C:/Program Files/Google/Chrome/Application/chrome.exe',
	'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];
const executablePath = browsers.find(fs.existsSync);

(async () => {
	const browser = await puppeteer.launch({
		executablePath, headless: 'new',
		args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--hide-scrollbars', '--force-device-scale-factor=1'],
		defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
	});
	const page = await browser.newPage();
	page.on('pageerror', e => console.error('[página]', e.message));
	await page.goto(`http://localhost:${port}/${demo.replace(/\\/g, '/')}/?export`, { waitUntil: 'domcontentloaded', timeout: 0 });
	await page.waitForFunction('window.__mg && window.__mg.loaded', { timeout: 300000 });
	const gpu = await page.evaluate(() => { const gl = document.createElement('canvas').getContext('webgl2'); const d = gl.getExtension('WEBGL_debug_renderer_info'); return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : '?'; });
	const dur = await page.evaluate('window.__mg.duration');
	const size = await page.evaluate(() => ({ width: window.__mg.width || 1920, height: window.__mg.height || 1080 }));
	if (size.width !== 1920 || size.height !== 1080) await page.setViewport({ ...size, deviceScaleFactor: 1 });
	const t0 = from ? +from : 0, t1 = to ? +to : dur, frames = Math.round((t1 - t0) * fps);
	console.log(`GPU: ${gpu}\nRenderizando ${frames} quadros ${size.width}×${size.height} @ ${fps}fps → ${out}${audio ? ' + áudio ' + audio : ''}`);

	const ss = ['-ss', String(t0), '-t', String(t1 - t0)];
	const ins = [...(bg ? [...ss, '-i', path.resolve(bg)] : []), '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', ...(audio ? [...ss, '-i', path.resolve(audio)] : [])];
	const vi = bg ? 1 : 0, ai = vi + 1;
	const vmap = bg ? ['-filter_complex', `[0:v]fps=${fps},setpts=PTS-STARTPTS[b];[b][1:v]overlay=0:0:format=auto:shortest=1,format=yuv420p[v]`, '-map', '[v]'] : ['-map', vi + ':v'];
	const aout = audio ? ['-map', ai + ':a', '-c:a', 'aac', '-b:a', '192k', '-shortest'] : [];
	const ff = spawn('ffmpeg', ['-y', '-loglevel', process.env.FFLOG || 'error', ...ins, ...vmap, ...aout,
		'-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });

	ff.stdin.on('error', e => { console.error('\nstdin do ffmpeg: ' + e.code); process.exitCode = 1; });
	ff.on('exit', (c, s) => { if (c) console.error('\nffmpeg saiu com código ' + c + ' ' + (s || '')); });
	const start = Date.now();
	for (let f = 0; f < frames; f++) {
		const t = t0 + f / fps;
		await page.evaluate(t => window.__mg.renderAt(t), t);
		const buf = await page.screenshot(bg ? { type: 'png', omitBackground: true, optimizeForSpeed: true, captureBeyondViewport: false } : { type: 'jpeg', quality: 95, optimizeForSpeed: true, captureBeyondViewport: false });
		if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
		const step = process.stdout.isTTY ? 30 : Math.max(30, Math.ceil(frames / 4)); // fora de terminal: só 4 linhas
		if (f % (process.env.EVERY ? 1 : step) === 0) process.stdout.write(`\r  ${f}/${frames}  (${((Date.now() - start) / 1000).toFixed(0)}s)`);
	}
	ff.stdin.end();
	await new Promise(r => ff.on('close', r));
	await browser.close();
	console.log(`\nPronto em ${((Date.now() - start) / 1000).toFixed(0)}s: ${out}`);
})().catch(e => { console.error(e); process.exit(1); });
