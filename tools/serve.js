// Servidor estático mínimo (sem dependências) para rodar as animações no navegador.
// Uso: node tools/serve.js [porta]   → raiz = pasta do projeto
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const port = Number(process.argv[2]) || 5173;
const types = {
	'.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
	'.css': 'text/css', '.json': 'application/json', '.glb': 'model/gltf-binary',
	'.gltf': 'model/gltf+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
	'.ttf': 'font/ttf', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.wasm': 'application/wasm'
};

http.createServer((req, res) => {
	let p = decodeURIComponent(req.url.split('?')[0]);
	let file = path.join(root, p);
	if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
	if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
	fs.readFile(file, (err, data) => {
		if (err) { res.writeHead(404); return res.end('404 ' + p); }
		const head = { 'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes' };
		// Range (necessário para o <audio> poder pular para qualquer ponto da narração)
		const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
		if (m) {
			const a = m[1] ? +m[1] : data.length - +m[2], b = m[1] && m[2] ? Math.min(+m[2], data.length - 1) : data.length - 1;
			res.writeHead(206, { ...head, 'Content-Range': `bytes ${a}-${b}/${data.length}`, 'Content-Length': b - a + 1 });
			return res.end(data.subarray(a, b + 1));
		}
		res.writeHead(200, head);
		res.end(data);
	});
}).listen(port, () => console.log(`Servindo ${root} em http://localhost:${port}`));
