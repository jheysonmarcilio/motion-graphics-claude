// Captura uma thumbnail 1280×720 em JPG (YouTube: máx. 2 MB).
// Uso: node tools/thumb.cjs "http://localhost:5173/demos/NN-x/thumb.html?v=1" renders/NN-x-thumb-1.jpg
// A página marca window.__thumbPronto = true quando terminou de desenhar (espera até 20 s).
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const [url, saida] = process.argv.slice(2);
if (!url || !saida) { console.error('uso: node tools/thumb.cjs <url> <saida.jpg>'); process.exit(1); }
const executablePath = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);

(async () => {
	const b = await puppeteer.launch({ executablePath, headless: 'new', args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
	try {
		const p = await b.newPage();
		await p.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
		p.on('pageerror', e => console.error('erro na página:', e.message));
		await p.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
		await p.waitForFunction('window.__thumbPronto === true', { timeout: 20000 }).catch(() => console.error('aviso: __thumbPronto não chegou; capturando assim mesmo'));
		await new Promise(r => setTimeout(r, 300));
		fs.mkdirSync(path.dirname(path.resolve(saida)), { recursive: true });
		for (const q of [92, 85, 75, 65]) {
			await p.screenshot({ path: saida, type: 'jpeg', quality: q, clip: { x: 0, y: 0, width: 1280, height: 720 } });
			if (fs.statSync(saida).size < 1.9 * 1024 * 1024) break;
		}
		console.log(saida, Math.round(fs.statSync(saida).size / 1024) + ' KB');
	} finally { await b.close(); }
})().catch(e => { console.error(e.message); process.exit(1); });
