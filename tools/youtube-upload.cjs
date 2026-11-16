// Envia um MP4 ao YouTube (padrão: privado).
// Uso: node tools/youtube-upload.cjs arquivo.mp4 "Título" ["Descrição"] [private|unlisted|public]
const { google } = require('googleapis');
const fs = require('fs');

const [file, title, description = '', privacy = 'private'] = process.argv.slice(2);
if (!file || !title) { console.error('Uso: node tools/youtube-upload.cjs arquivo.mp4 "Título" ["Descrição"] [privacidade]'); process.exit(1); }

// Credenciais vindas do painel (canal conectado pelo botão "Conectar YouTube") ou client_secret.json + token local.
const cred = process.env.YT_CLIENT_ID ? { client_id: process.env.YT_CLIENT_ID, client_secret: process.env.YT_CLIENT_SECRET } : JSON.parse(fs.readFileSync('client_secret.json')).installed;
const oauth2 = new google.auth.OAuth2(cred.client_id, cred.client_secret, 'http://localhost:3000');
// Vários canais: YT_TOKEN=tokens/canal.json (gerado por youtube-auth.cjs tokens/canal.json). YT_TAGS=a,b,c
oauth2.setCredentials(process.env.YT_REFRESH ? { refresh_token: process.env.YT_REFRESH } : JSON.parse(fs.readFileSync(process.env.YT_TOKEN || 'token.json')));
const tags = (process.env.YT_TAGS || '').split(',').map(t => t.trim()).filter(Boolean).slice(0, 15);

(async () => {
  const youtube = google.youtube({ version: 'v3', auth: oauth2 });
  const r = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: { title, description, categoryId: '27', ...(tags.length ? { tags } : {}) },
      status: { privacyStatus: privacy, selfDeclaredMadeForKids: false },
    },
    media: { body: fs.createReadStream(file) },
  });
  console.log('Enviado:', 'https://youtu.be/' + r.data.id, '(' + privacy + ')');
})().catch(e => { console.error('Erro:', e.message); process.exit(1); });
