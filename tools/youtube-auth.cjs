// Autoriza a conta do YouTube e salva o token. Uso: node tools/youtube-auth.cjs [tokens/canal.json]
// Para vários canais: rode uma vez por canal e, na tela do Google, escolha o canal (conta de marca) certo.
const SAIDA = process.argv[2] || 'token.json';
const { google } = require('googleapis');
const http = require('http');
const fs = require('fs');
const { exec } = require('child_process');

const cred = JSON.parse(fs.readFileSync('client_secret.json')).installed;
const REDIRECT = 'http://localhost:3000';
const oauth2 = new google.auth.OAuth2(cred.client_id, cred.client_secret, REDIRECT);

const url = oauth2.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/youtube.upload'],
});
console.log('Abra este link e autorize:\n' + url);
exec(`start "" "${url}"`);

http.createServer(async (req, res) => {
  const code = new URL(req.url, REDIRECT).searchParams.get('code');
  if (!code) return res.end();
  try {
    const { tokens } = await oauth2.getToken(code);
    fs.mkdirSync(require('path').dirname(SAIDA), { recursive: true }); fs.writeFileSync(SAIDA, JSON.stringify(tokens));
    res.end('Autorizado! Pode fechar esta aba.');
    console.log('OK: ' + SAIDA + ' salvo.');
  } catch (e) {
    res.end('Erro: ' + e.message);
    console.error(e.message);
  }
  setTimeout(() => process.exit(), 300);
}).listen(3000);
