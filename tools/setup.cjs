// Prepara o projeto depois do git clone: baixa three.js r187 e o modelo do whisper (466 MB).
// Uso: node tools/setup.cjs [--sem-whisper]
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const raiz = path.join(__dirname, '..');
async function baixar(url, dest) {
	if (fs.existsSync(dest)) return console.log('já existe:', path.relative(raiz, dest));
	console.log('baixando', url);
	const r = await fetch(url); if (!r.ok) throw new Error(`${r.status} ${url}`);
	fs.writeFileSync(dest + '.part', Buffer.from(await r.arrayBuffer())); fs.renameSync(dest + '.part', dest);
}
(async () => {
	const three = path.join(raiz, 'three.js-master');
	if (!fs.existsSync(path.join(three, 'build', 'three.module.js'))) {
		const zip = path.join(os.tmpdir(), 'three-r187.zip'), tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'three-'));
		await baixar('https://github.com/mrdoob/three.js/archive/refs/tags/r187.zip', zip);
		try { execFileSync('tar', ['-xf', zip, '-C', tmp]); } catch { execFileSync('unzip', ['-q', zip, '-d', tmp]); }
		fs.renameSync(path.join(tmp, fs.readdirSync(tmp)[0]), three); fs.rmSync(zip); fs.rmSync(tmp, { recursive: true, force: true });
		console.log('✓ three.js r187 em three.js-master/');
	} else console.log('✓ three.js já instalado');
	if (!process.argv.includes('--sem-whisper')) {
		fs.mkdirSync(path.join(__dirname, 'models'), { recursive: true });
		await baixar('https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin', path.join(__dirname, 'models', 'ggml-small.bin'));
		console.log('✓ modelo whisper em tools/models/');
	}
	console.log('\nPronto. Rode: npm run serve  (animações)  |  npm run painel  (Estúdio)');
})().catch(e => { console.error('✗', e.message); process.exit(1); });
