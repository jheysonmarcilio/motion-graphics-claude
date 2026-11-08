// Renderiza quadros avulsos de uma animação e monta uma folha de contato (para conferência).
// Uso: node tools/frames.js demos/02-memorias-falsas <pasta_saida|-> t1 t2 t3 ...   (até 12 tempos por folha)
// '-' = pasta temporária no TEMP (padrão para conferência; nunca salvar em renders/). Imprime só o caminho da folha.
// Requer: servidor rodando (node tools/serve.js) + ffmpeg no PATH.
const puppeteer = require('puppeteer-core');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

let [demo, outDir, ...times] = process.argv.slice(2);
if (outDir === '-') outDir = path.join(require('os').tmpdir(), 'mg-frames-' + path.basename(demo));
fs.mkdirSync(outDir, { recursive: true });
const executablePath = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);

(async () => {
	const browser = await puppeteer.launch({ executablePath, headless: 'new', args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--hide-scrollbars'], defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 } });
	const page = await browser.newPage();
	const errs = [];
	page.on('pageerror', e => errs.push(e.message));
	page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
	await page.goto(`http://localhost:${process.env.MG_PORT || 5173}/${demo}/?export`, { waitUntil: 'domcontentloaded', timeout: 0 });
	try { await page.waitForFunction('window.__mg && window.__mg.loaded', { timeout: 300000 }); }
	catch (e) { console.error('não carregou', errs.join('\n')); process.exit(1); }
	const size = await page.evaluate(() => ({ width: __mg.width, height: __mg.height }));
	if (size.width !== 1920) await page.setViewport({ ...size, deviceScaleFactor: 1 });
	const files = [];
	for (const [i, t] of times.entries()) {
		await page.evaluate(t => { __mg.renderAt(t); __mg.renderAt(t); }, +t);
		const f = path.join(outDir, `f${String(i).padStart(2, '0')}_${String(t).replace('.', '_')}.jpg`);
		await page.screenshot({ path: f, type: 'jpeg', quality: 85 });
		files.push(f);
	}
	if (errs.length) console.log('ERROS:\n' + [...new Set(errs)].join('\n'));
	await browser.close();
	const cols = files.length <= 4 ? 2 : 3, rows = Math.ceil(files.length / cols);
	const sheet = path.join(outDir, 'sheet.jpg');
	const inputs = files.flatMap(f => ['-i', f]);
	const filter = files.map((_, i) => `[${i}:v]scale=640:-1[v${i}]`).join(';') + ';' + files.map((_, i) => `[v${i}]`).join('') + `xstack=inputs=${files.length}:layout=${files.map((_, i) => `${(i % cols) ? Array.from({ length: i % cols }, () => 'w0').join('+') : '0'}_${Math.floor(i / cols) ? Array.from({ length: Math.floor(i / cols) }, () => 'h0').join('+') : '0'}`).join('|')}:fill=black`;
	if (files.length === 1) fs.copyFileSync(files[0], sheet);
	else execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', filter, '-frames:v', '1', sheet]);
	console.log('ok', sheet);
})().catch(e => { console.error(e); process.exit(1); });
