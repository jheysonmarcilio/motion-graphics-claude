// Publica o painel (versão PHP) na hospedagem via FTP: /motion-graphics/painel/
// Uso: node painel/publicar-ftp.cjs [--sem-kit]   (credenciais no .env da raiz: FTP_HOST, FTP_USER, FTP_PASS, FTP_PORT)
// Envia o código do painel e o "kit do projeto" (o que o agente precisa para fazer vídeos em outro PC:
// skills, agentes, ferramentas, kits de demos, painel) para dados/kit.zip — só baixável com o token de um agente.
// Nunca envia: .env, credenciais, tokens, midia/, renders/, audio/, roteiros/, three.js, node_modules, modelos do whisper.
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const raiz = path.resolve(__dirname, '..'), env = {};
for (const l of fs.readFileSync(path.join(raiz, '.env'), 'utf8').split(/\r?\n/)) { const m = l.match(/^\s*([\w]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, ''); }
const host = env.FTP_HOST.replace(/^ftp:\/\//, '').replace(/\/+$/, ''), porta = env.FTP_PORT || 21, destino = (process.argv.find(a => a.startsWith('--destino='))?.slice(10)) || '/motion-graphics/painel/';
if (!destino.startsWith('/motion-graphics/')) throw new Error('destino fora de /motion-graphics');
const e = require('./etapas.cjs');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'painel-ftp-'));
const enviar = (local, nome) => { execFileSync('curl', ['-s', '-S', '--ftp-create-dirs', '-T', local, `ftp://${host}:${porta}${destino}${nome}`, '-u', `${env.FTP_USER}:${env.FTP_PASS}`]); console.log('enviado', destino + nome); };
try {
	fs.writeFileSync(path.join(tmp, 'etapas.json'), JSON.stringify({ ETAPAS: e.ETAPAS, PROMPTS: e.PROMPTS, ESTILOS: e.ESTILOS_INICIAIS, RETIRADOS: e.ESTILOS_RETIRADOS }));
	for (const [local, nome] of [[path.join(__dirname, 'web/index.html'), 'index.html'], [path.join(__dirname, 'php/api.php'), 'api.php'], [path.join(tmp, 'etapas.json'), 'etapas.json'],
		[path.join(__dirname, 'php/.htaccess'), '.htaccess'], [path.join(__dirname, 'conector.cmd.txt'), 'conector.cmd.txt']]) enviar(local, nome);
	for (const f of fs.readdirSync(path.join(__dirname, 'web/estilos'))) if (f.endsWith('.jpg')) enviar(path.join(__dirname, 'web/estilos', f), 'estilos/' + f); // amostras dos estilos

	if (!process.argv.includes('--sem-kit')) {
		const versao = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
		fs.writeFileSync(path.join(tmp, '.kit-versao'), versao);
		const tar = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe'), zip = path.join(tmp, 'kit.zip');
		const excluir = ['painel/dados', 'brand/dominio-e-voz.md', 'painel/config.json', 'painel/.env', 'tools/models', '.claude/settings.local.json', '*.mp4', '*.mp3', '*.wav', 'node_modules'];
		const itens = ['.claude/agents', '.claude/skills', 'brand', 'demos', 'docs', 'painel', 'tools', 'CLAUDE.md', 'package.json', 'package-lock.json'].filter(p => fs.existsSync(path.join(raiz, p)));
		execFileSync(tar, ['-a', '-c', '-f', zip, ...excluir.flatMap(x => ['--exclude', x]), ...itens, '-C', tmp, '.kit-versao'], { cwd: raiz });
		fs.writeFileSync(path.join(tmp, 'kit-versao.txt'), versao);
		enviar(zip, 'dados/kit.zip'); enviar(path.join(tmp, 'kit-versao.txt'), 'dados/kit-versao.txt');
		console.log(`kit ${versao}: ${(fs.statSync(zip).size / 1e6).toFixed(1)} MB`);
	}
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }
