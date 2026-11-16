<?php
// Estúdio — servidor do painel em PHP (hospedagem compartilhada via FTP). Mesma API do servidor.cjs.
// Rotas: api/<rota> (via .htaccess) ou api.php?r=<rota>. Dados em dados/ (protegidos).
declare(strict_types=1);
error_reporting(E_ALL & ~E_DEPRECATED); ini_set('display_errors', '0');
date_default_timezone_set('UTC');

const DADOS = __DIR__ . '/dados';
const PREFIXO = "<?php exit; ?>\n";
$E = json_decode(file_get_contents(__DIR__ . '/etapas.json'), true);
if (!$E) { usleep(500000); $E = json_decode(file_get_contents(__DIR__ . '/etapas.json'), true); } // arquivo sendo trocado no deploy
if (!$E) { http_response_code(503); header('Retry-After: 2'); exit('{"erro":"atualizando, tente de novo"}'); }
$ETAPAS = $E['ETAPAS']; $PROMPTS = $E['PROMPTS'];
$IDS_ETAPAS = array_column($ETAPAS, 'id');
const GATES = ['roteiro', 'revisao', 'storyboard', 'animacao'];
const FERRAMENTAS = 'Read Write Edit Glob Grep Skill Agent Bash(node:*) Bash(cp:*) Bash(ls:*) Bash(mkdir:*) Bash(ffmpeg:*) Bash(ffprobe:*) Bash(grep:*) Bash(cat:*) Bash(head:*) Bash(tail:*) Bash(sed:*) Bash(wc:*) Bash(python:*) Bash(py:*) Bash(pip:*) Bash(cd:*) Bash(rm:*)';
// Motor por etapa (ver servidor.cjs). prefs modeloFixo/esforcoFixo sobrepõem.
const MOTORES = ['pesquisa' => ['haiku', 'medium'], 'tema' => ['haiku', 'medium'], 'roteiro' => ['opus', 'medium'], 'revisao' => ['sonnet', 'medium'], 'storyboard' => ['sonnet', 'medium'], 'animacao' => ['opus', 'medium'], 'thumbs' => ['sonnet', 'medium']];
function motor(string $id, array $pr): array { [$m, $e] = MOTORES[$id] ?? ['sonnet', 'medium']; return ['modelo' => ($pr['modeloFixo'] ?? '') ?: $m, 'esforco' => ($pr['esforcoFixo'] ?? '') ?: $e, 'permissao' => $pr['permissao'], 'ferramentas' => $pr['ferramentas']]; }
const PREFS = ['modeloFixo' => '', 'esforcoFixo' => '', 'permissao' => 'acceptEdits', 'ferramentas' => FERRAMENTAS];

// ── armazenamento (arquivo PHP que não executa nada se for aberto pela web) ──
if (!is_dir(DADOS)) { mkdir(DADOS, 0755, true); }
if (!is_dir(DADOS . '/uploads')) { mkdir(DADOS . '/uploads', 0755, true); }
if (!file_exists(DADOS . '/.htaccess')) { file_put_contents(DADOS . '/.htaccess', "Require all denied\nDeny from all\n"); file_put_contents(DADOS . '/index.html', ''); }
function ler(string $nome, $padrao) { $f = DADOS . "/$nome.php"; if (!file_exists($f)) return $padrao; $s = file_get_contents($f); return json_decode(substr($s, strlen(PREFIXO)), true) ?? $padrao; }
function gravar(string $nome, $v): void { $f = DADOS . "/$nome.php"; file_put_contents($f . '.tmp', PREFIXO . json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)); rename($f . '.tmp', $f); }

$LOCK = fopen(DADOS . '/.lock', 'c'); flock($LOCK, LOCK_EX);
$cfg = ler('config', null);
if (!$cfg) { $cfg = ['segredo' => bin2hex(random_bytes(24)), 'fuso' => 'America/Sao_Paulo', 'urlPublica' => '', 'prompts' => new stdClass, 'google' => ['clientId' => '', 'clientSecret' => '']]; gravar('config', $cfg); }
$cfg['prompts'] = (array)($cfg['prompts'] ?? []);
$db = ler('db', ['jobs' => [], 'regras' => [], 'temas' => [], 'seq' => 1]);
$db += ['usuarios' => [], 'avisos' => [], 'pesquisas' => [], 'agentes' => [], 'cancelar' => [], 'ultimaAgenda' => 0, 'ultimoMinuto' => ''];
$sujo = false;
function salvar(): void { global $sujo; $sujo = true; }
register_shutdown_function(function () { global $db, $sujo, $LOCK; if ($sujo) gravar('db', $db); if ($LOCK) { flock($LOCK, LOCK_UN); fclose($LOCK); } });

function novoId(string $p): string { global $db; return $p . base_convert((string)($db['seq']++), 10, 36) . bin2hex(random_bytes(2)); }
function agora(): string { return gmdate('Y-m-d\TH:i:s.v\Z'); }
function ms(string $iso): float { return (float)strtotime($iso) * 1000; }
function slugify(string $s): string { $s = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s ?: 'video') ?: 'video'; $s = strtolower(trim(preg_replace('/[^a-zA-Z0-9]+/', '-', $s), '-')); return implode('-', array_slice(explode('-', $s), 0, 5)) ?: 'video'; }
function b64u(string $s): string { return rtrim(strtr(base64_encode($s), '+/', '-_'), '='); }
function assinar(string $s): string { global $cfg; return b64u(hash_hmac('sha256', $s, $cfg['segredo'], true)); }

// ── estilos e canal padrão ──
if (!isset($db['estilos'])) $db['estilos'] = $E['ESTILOS'];
// estilos novos de etapas.json entram uma vez (apagados pelo autor não voltam); amostra (img) é preenchida se faltar
$db['estilosSemeados'] ??= array_column($db['estilos'], 'id');
foreach ($E['ESTILOS'] as $ei) { $achou = false;
	foreach ($db['estilos'] as &$ex) if ($ex['id'] === $ei['id']) { $achou = true; if (($ei['rev'] ?? 0) > ($ex['rev'] ?? 0)) foreach (['nome', 'desc', 'guia', 'referencia', 'img', 'rev'] as $k) $ex[$k] = $ei[$k] ?? ''; } unset($ex);
	if (!$achou && !in_array($ei['id'], $db['estilosSemeados'], true)) $db['estilos'][] = $ei;
	if (!in_array($ei['id'], $db['estilosSemeados'], true)) $db['estilosSemeados'][] = $ei['id']; }
foreach ($E['RETIRADOS'] ?? [] as $rid) foreach ($db['estilos'] as $k => $ex) if ($ex['id'] === $rid) {
	$usado = false; foreach ($db['jobs'] ?? [] as $j) if (($j['estilo'] ?? null) === $rid) $usado = true;
	if ($usado) $db['estilos'][$k]['ativo'] = false; else { array_splice($db['estilos'], $k, 1); } break; }
// Um canal tem vários pilotos automáticos: cada um com sua temática, formato, dias, horários e fila de temas.
function pilotoPadrao(array $b = []): array {
	return array_merge(['id' => novoId('pl'), 'nome' => 'Piloto', 'ativo' => false, 'formato' => 'short', 'fonte' => 'pesquisa', 'palavraChave' => '', 'estilos' => [],
		'dias' => [0, 1, 2, 3, 4, 5, 6], 'horarios' => ['18:00'], 'publicar' => true, 'estoqueAlvo' => 3, 'limite' => 3, 'privacidade' => '', 'ultimas' => [], 'criado' => agora()], $b);
}
function limparPiloto(array $b, array $atual): array {
	$p = $atual;
	foreach (['nome', 'palavraChave', 'privacidade'] as $k) if (array_key_exists($k, $b)) $p[$k] = trim((string)$b[$k]);
	foreach (['ativo', 'publicar'] as $k) if (array_key_exists($k, $b)) $p[$k] = (bool)$b[$k];
	if (isset($b['formato'])) $p['formato'] = $b['formato'] === 'longo' ? 'longo' : 'short';
	if (isset($b['fonte'])) $p['fonte'] = $b['fonte'] === 'manual' ? 'manual' : 'pesquisa';
	if (isset($b['estilos'])) $p['estilos'] = array_values(array_filter((array)$b['estilos'], 'is_string'));
	if (isset($b['dias'])) $p['dias'] = array_values(array_unique(array_map('intval', (array)$b['dias'])));
	if (isset($b['horarios'])) { $h = array_values(array_unique(array_filter((array)$b['horarios'], fn($x) => preg_match('/^\d\d:\d\d$/', (string)$x)))); sort($h); $p['horarios'] = $h ?: ['18:00']; }
	foreach (['estoqueAlvo' => [1, 20], 'limite' => [0, 30]] as $k => [$mn, $mx]) if (isset($b[$k])) $p[$k] = max($mn, min($mx, (int)$b[$k]));
	if ($p['nome'] === '') $p['nome'] = 'Piloto';
	return $p;
}
$PILOTO = ['ativo' => false, 'fonte' => 'pesquisa', 'estoqueAlvo' => 3, 'limite' => 3, 'publicar' => ['ativo' => false, 'horarios' => ['18:00'], 'dias' => [0, 1, 2, 3, 4, 5, 6]], 'ultimas' => new stdClass];
function canalPadrao(array $b = []): array {
	global $db, $PILOTO;
	return array_merge(['nome' => 'Novo canal', 'cor' => '#8b7cff', 'principal' => false, 'ativo' => true, 'nicho' => '', 'pesquisaTema' => '', 'publico' => '', 'tom' => '', 'regras' => '', 'cta' => '', 'idioma' => 'pt-BR',
		'narracao' => 'tts', 'voz' => 'pt-BR-AntonioNeural', 'velocidade' => '+22%', 'formato' => 'short', 'duracaoShort' => 50, 'duracaoLongo' => 420,
		'estilos' => array_values(array_map(fn($e) => $e['id'], array_filter($db['estilos'], fn($e) => $e['ativo']))), 'notaMinima' => 8,
		'gates' => ['roteiro' => false, 'revisao' => false, 'storyboard' => false, 'animacao' => false],
		'youtube' => ['ativo' => false, 'token' => '', 'privacidade' => 'private', 'conexao' => null], 'pilotos' => []], $b);
}
if (!isset($db['canais'])) { $db['canais'] = [array_merge(['id' => 'principal'], canalPadrao(['nome' => 'Mente & Psicologia (principal)', 'principal' => true, 'narracao' => 'autor', 'cor' => '#5ee0c0',
	'gates' => ['roteiro' => true, 'revisao' => false, 'storyboard' => false, 'animacao' => true], 'youtube' => ['ativo' => false, 'token' => 'token.json', 'privacidade' => 'private', 'conexao' => null]]))]; salvar(); }
foreach ($db['canais'] as &$c) {
	$c['youtube']['conexao'] ??= null; $c['pesquisaTema'] ??= '';
	if (!isset($c['pilotos'])) { // migração: o piloto único antigo vira o 1º piloto da lista
		$c['pilotos'] = []; $v = (array)($c['piloto'] ?? []);
		$temTemas = (bool)array_filter($db['temas'], fn($t) => $t['canalId'] === $c['id']);
		if (!empty($v['ativo']) || $temTemas) $c['pilotos'][] = pilotoPadrao(['nome' => 'Piloto principal', 'ativo' => !empty($v['ativo']), 'formato' => $c['formato'] ?? 'short', 'fonte' => $v['fonte'] ?? 'pesquisa',
			'palavraChave' => $c['pesquisaTema'] ?? '', 'estilos' => $c['estilos'] ?? [], 'dias' => $v['publicar']['dias'] ?? [0, 1, 2, 3, 4, 5, 6], 'horarios' => $v['publicar']['horarios'] ?? ['18:00'],
			'publicar' => !empty($v['publicar']['ativo']), 'estoqueAlvo' => $v['estoqueAlvo'] ?? 3, 'limite' => $v['limite'] ?? 3, 'ultimas' => (array)($v['ultimas'] ?? [])]);
		unset($c['piloto']); salvar();
	}
	foreach ($c['pilotos'] as &$p) $p['ultimas'] = (array)$p['ultimas']; unset($p);
} unset($c);
foreach ($db['jobs'] as &$jj) foreach ($IDS_ETAPAS as $k) $jj['etapas'][$k] ??= ['estado' => 'pulado', 'log' => []]; unset($jj);
$db['testes'] ??= [];
foreach ($db['temas'] as &$t) if (!array_key_exists('pilotoId', $t)) { $cc = null; foreach ($db['canais'] as $x) if ($x['id'] === $t['canalId']) $cc = $x; $t['pilotoId'] = $cc['pilotos'][0]['id'] ?? null; $t['usado'] ??= false; } unset($t);
function &piloto(array &$c, ?string $pid) { foreach ($c['pilotos'] as &$p) if ($p['id'] === $pid) return $p; $n = null; return $n; }

// ── buscas ──
function &achar(array &$lista, callable $f) { foreach ($lista as $i => &$x) if ($f($x)) return $x; $nada = null; return $nada; }
function &canal(?string $id) { global $db; $r = &achar($db['canais'], fn($c) => $c['id'] === $id); return $r; }
function estilo(?string $id) { global $db; foreach ($db['estilos'] as $e) if ($e['id'] === $id) return $e; return null; }
function &usuario(?string $id) { global $db; $r = &achar($db['usuarios'], fn($u) => $u['id'] === $id); return $r; }
function donoJob(array $j): ?string { $c = &canal($j['canalId']); return $c['dono'] ?? null; }
function meusCanais(array $u): array { global $db; return array_values(array_filter($db['canais'], fn($c) => ($c['dono'] ?? null) === $u['id'])); }
function idsMeus(array $u): array { return array_column(meusCanais($u), 'id'); }
function base(array $j): ?string { return $j['nn'] ? sprintf('%02d-%s', $j['nn'], $j['slug']) : null; }
function etapaAtual(array $j): ?array { global $ETAPAS; foreach ($ETAPAS as $e) if (!in_array($j['etapas'][$e['id']]['estado'], ['feito', 'pulado'])) return $e; return null; }
function nomeEtapa(string $id): string { global $ETAPAS; foreach ($ETAPAS as $e) if ($e['id'] === $id) return $e['nome']; return $id; }

function horaLocal(): array { global $cfg; $d = new DateTime('now', new DateTimeZone($cfg['fuso'] ?: 'America/Sao_Paulo')); return ['data' => $d->format('Y-m-d'), 'hm' => $d->format('H:i'), 'dia' => (int)$d->format('w')]; }

// ── avisos ──
function postar(string $url, array $dados): void {
	$ch = curl_init($url); curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => json_encode($dados, JSON_UNESCAPED_UNICODE), CURLOPT_HTTPHEADER => ['Content-Type: application/json'], CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 4]);
	curl_exec($ch); curl_close($ch);
}
function avisar(?string $userId, string $texto, array $o = []): void {
	global $db; $u = &usuario($userId); if (!$u) return;
	$chave = $o['chave'] ?? null;
	if ($chave) foreach ($db['avisos'] as $a) if ($a['userId'] === $userId && ($a['chave'] ?? null) === $chave) return;
	$db['avisos'][] = ['id' => novoId('a'), 'userId' => $userId, 'em' => agora(), 'texto' => $texto, 'tipo' => $o['tipo'] ?? 'info', 'chave' => $chave, 'jobId' => $o['jobId'] ?? null, 'canalId' => $o['canalId'] ?? null, 'lido' => false];
	if (count($db['avisos']) > 600) array_splice($db['avisos'], 0, count($db['avisos']) - 600);
	$msg = "🎬 Estúdio — $texto"; $c = &canal($o['canalId'] ?? null);
	if (!empty($u['avisos']['telegramToken']) && !empty($u['avisos']['telegramChat'])) postar("https://api.telegram.org/bot{$u['avisos']['telegramToken']}/sendMessage", ['chat_id' => $u['avisos']['telegramChat'], 'text' => $msg]);
	if (!empty($u['avisos']['webhook'])) postar($u['avisos']['webhook'], ['texto' => $msg, 'tipo' => $o['tipo'] ?? 'info', 'canal' => $c['nome'] ?? null, 'em' => agora()]);
	salvar();
}

// ── vídeos ──
function criarJob(array $d): string {
	global $db, $ETAPAS;
	$c = &canal($d['canalId']); $formato = (($d['formato'] ?? '') ?: $c['formato']) === 'longo' ? 'longo' : 'short';
	$tema = trim($d['tema'] ?? ''); $audio = ($d['origem'] ?? '') === 'audio';
	$etapas = []; foreach ($ETAPAS as $e) $etapas[$e['id']] = ['estado' => 'pendente', 'log' => []];
	if ($tema) $etapas['tema']['estado'] = 'pulado';
	if ($formato !== 'longo' && isset($etapas['thumbs'])) $etapas['thumbs']['estado'] = 'pulado';
	if ($audio) foreach (['tema', 'roteiro', 'revisao'] as $k) $etapas[$k]['estado'] = 'pulado';
	$j = ['id' => novoId('v'), 'criado' => agora(), 'status' => 'ativo', 'regraId' => $d['regraId'] ?? null, 'loteId' => $d['loteId'] ?? null, 'canalId' => $c['id'], 'pilotoId' => $d['pilotoId'] ?? null, 'estilo' => $d['estilo'] ?? null,
		'tema' => $tema, 'slug' => $tema ? slugify($tema) : '', 'nn' => null, 'formato' => $formato, 'origem' => $audio ? 'audio' : 'tema', 'narracao' => $audio ? 'autor' : $c['narracao'],
		'gates' => array_merge((array)$c['gates'], (array)($d['gates'] ?? [])),
		'instrucoes' => implode("\n", array_filter([$d['instrucoes'] ?? '', !empty($d['detalhe']) ? 'Sugestão da pesquisa (siga este ângulo): ' . $d['detalhe'] : ''])),
		'youtube' => ['titulo' => '', 'descricao' => '', 'tags' => [], 'privacidade' => ($d['privacidade'] ?? '') ?: $c['youtube']['privacidade'], 'editado' => false, 'url' => ''],
		'publicarEm' => $d['publicarEm'] ?? null, 'audioUpload' => null, 'mp4Upload' => null, 'mp4Local' => null, 'thumbs' => [], 'demo' => null, 'custo' => 0, 'duracao' => null, 'etapas' => $etapas, 'arquivos' => new stdClass];
	$db['jobs'][] = $j; $r = &$db['jobs'][count($db['jobs']) - 1]; recalcular($r); return $j['id'];
}

function criarLote(array $b): array {
	global $db;
	$c = &canal($b['canalId']); $n = max(1, min(50, (int)($b['quantidade'] ?? 1))); $loteId = novoId('l');
	$pid = $b['pilotoId'] ?? null; $p = $pid ? piloto($c, $pid) : null; if (!$p) $pid = null;
	$formato = $p['formato'] ?? (($b['formato'] ?? '') ?: $c['formato']);
	if ($p && !empty($p['privacidade'])) $b['privacidade'] = $p['privacidade'];
	$estilos = array_values(array_filter(!empty($b['estilos']) ? $b['estilos'] : (!empty($p['estilos']) ? $p['estilos'] : $c['estilos']), fn($id) => estilo($id)));
	$temas = array_values(array_filter(array_map('trim', $b['temas'] ?? []), 'strlen'));
	$usados = array_values(array_map(fn($j) => $j['estilo'], array_filter($db['jobs'], fn($j) => $j['canalId'] === $c['id'] && $j['estilo'])));
	$ultimo = end($usados) ?: null; $k = $estilos ? (((int)array_search($ultimo, $estilos, true) + ($ultimo !== null && in_array($ultimo, $estilos, true) ? 1 : 0)) % count($estilos)) : 0;
	$ids = [];
	for ($i = 0; $i < $n; $i++) {
		$tema = $temas[$i] ?? ''; $detalhe = ''; $tiUsado = null;
		if (!$tema && ($b['origem'] ?? '') !== 'audio') foreach ($db['temas'] as $ti => $t)
			if ($t['canalId'] === $c['id'] && empty($t['usado']) && ($pid ? ($t['pilotoId'] ?? null) === $pid : true)) { $tema = $t['tema']; $detalhe = $t['detalhe'] ?? ''; $tiUsado = $ti; break; }
		if (!$tema && !empty($b['soDaFila'])) break;
		$est = null;
		if ($estilos) {
			if (($b['distribuicao'] ?? '') === 'aleatorio') { $pool = count($estilos) > 1 ? array_values(array_filter($estilos, fn($e) => $e !== $ultimo)) : $estilos; $est = $pool[random_int(0, count($pool) - 1)]; }
			else { $est = $estilos[$k % count($estilos)]; $k++; }
			$ultimo = $est;
		}
		$jid = criarJob(array_merge($b, ['canalId' => $c['id'], 'pilotoId' => $pid, 'formato' => $formato, 'tema' => $tema, 'detalhe' => $detalhe, 'estilo' => $est, 'loteId' => $loteId]));
		if ($tiUsado !== null) { $db['temas'][$tiUsado]['usado'] = true; $db['temas'][$tiUsado]['jobId'] = $jid; $db['temas'][$tiUsado]['usadoEm'] = agora(); }
		elseif ($tema) $db['temas'][] = ['canalId' => $c['id'], 'pilotoId' => $pid, 'tema' => $tema, 'origem' => 'manual', 'usado' => true, 'jobId' => $jid, 'usadoEm' => agora(), 'criado' => agora()];
		$ids[] = $jid;
	}
	salvar(); return $ids;
}

function recalcular(array &$j): void {
	global $cfg;
	$e = etapaAtual($j);
	if (!$e) { if ($j['status'] === 'ativo') $j['status'] = 'concluido'; return; }
	$s = &$j['etapas'][$e['id']]; $c = &canal($j['canalId']); if (!$c) return;
	if ($e['id'] === 'narracao' && $j['narracao'] === 'autor' && !$j['audioUpload'] && in_array($s['estado'], ['pendente', 'aguardando'])) { $s['estado'] = 'aguardando'; $s['motivo'] = 'Envie a narração gravada (mp3/wav)'; }
	elseif ($e['id'] === 'narracao' && $s['estado'] === 'aguardando') { $s['estado'] = 'pendente'; $s['motivo'] = ''; }
	if ($e['id'] === 'publicar' && in_array($s['estado'], ['pendente', 'aguardando'])) {
		$yt = $c['youtube']['ativo'] && ($c['youtube']['conexao'] || $c['youtube']['token']);
		if (!$j['publicarEm']) { $s['estado'] = 'aguardando'; $s['motivo'] = 'Pronto, no estoque. Esperando o horário de publicação ou "Publicar agora".'; }
		elseif (ms($j['publicarEm']) > microtime(true) * 1000) { $s['estado'] = 'aguardando'; $d = new DateTime($j['publicarEm']); $d->setTimezone(new DateTimeZone($cfg['fuso'])); $s['motivo'] = 'Agendado para ' . $d->format('d/m/Y H:i'); }
		elseif (!$yt) { $s['estado'] = 'aguardando'; $s['motivo'] = "Horário chegou. YouTube do canal \"{$c['nome']}\" desligado/desconectado: publique à mão e clique \"Marcar publicado\".";
			avisar($c['dono'] ?? null, '"' . ($j['youtube']['titulo'] ?: $j['tema']) . "\" está no horário, mas o YouTube do canal {$c['nome']} não está conectado. Publique à mão.", ['chave' => 'pubmanual:' . $j['id'], 'jobId' => $j['id'], 'canalId' => $c['id'], 'tipo' => 'aviso']); }
		else { $s['estado'] = 'pendente'; $s['motivo'] = ''; }
	}
}

function historicoCanal(string $cid, ?string $exceto): string {
	global $db; $l = [];
	foreach (array_slice(array_values(array_filter($db['jobs'], fn($x) => $x['canalId'] === $cid && $x['id'] !== $exceto && $x['tema'])), -25) as $x) { $e = estilo($x['estilo']); $l[] = "- {$x['tema']}" . ($x['estilo'] ? ' [' . ($e['nome'] ?? $x['estilo']) . ']' : ''); }
	foreach ($db['temas'] as $t) if ($t['canalId'] === $cid && empty($t['usado'])) $l[] = "- {$t['tema']} (na fila)";
	return $l ? implode("\n", $l) : '(canal novo, nada ainda)';
}
function blocoCanal(array $c): string {
	if (!empty($c['principal'])) return "CANAL: {$c['nome']} — é o canal principal do autor: siga brand/dominio-e-voz.md e o histórico em brand/historico-visual.md (adicione a linha do vídeo lá)." . ($c['nicho'] ? "\nBriefing extra: {$c['nicho']}" : '');
	return implode("\n", array_filter(["CANAL: {$c['nome']} (canal dark — sem rosto e sem a voz do autor).",
		'Este NÃO é o canal do autor: ignore brand/dominio-e-voz.md, a marca HipnoEMDR® e brand/historico-visual.md (não escreva nele). ' . ($c['narracao'] === 'tts' ? 'Narração por voz sintética AUTORIZADA pelo autor para este canal.' : 'Narração gravada e enviada pelo autor.'),
		$c['nicho'] ? "Nicho / briefing: {$c['nicho']}" : '', $c['publico'] ? "Público: {$c['publico']}" : '', $c['tom'] ? "Tom e jeito de falar: {$c['tom']}" : '',
		$c['regras'] ? "Regras do canal: {$c['regras']}" : '', $c['cta'] ? "CTA de fechamento: {$c['cta']}" : '', 'Idioma: ' . ($c['idioma'] ?: 'pt-BR')]));
}
function blocoEstilo(?array $e): string {
	if (!$e) return 'ESTILO: livre — escolha uma linguagem de brand/linguagens.md que combine com o tema.';
	return "ESTILO VISUAL ESCOLHIDO: {$e['nome']}\n{$e['guia']}" . (!empty($e['referencia']) ? "\nReferência pronta no projeto (copie o motor/kit daqui, não o roteiro): {$e['referencia']}" : '');
}
function renderPrompt(string $id, array $j, array $extra = []): string {
	global $cfg, $PROMPTS;
	$tpl = $cfg['prompts'][$id] ?? $PROMPTS[$id] ?? ''; if (!$tpl) return '';
	$c = &canal($j['canalId']); $formato = ($j['formato'] ?? '') ?: $c['formato']; $seg = $formato === 'longo' ? $c['duracaoLongo'] : $c['duracaoShort'];
	$b = isset($j['nn']) ? base($j) : null;
	$v = ['base' => $b ?? '', 'tema' => $j['tema'] ?? '', 'formato' => $formato === 'longo' ? 'vídeo longo 16:9' : 'Short 9:16', 'formatoCurto' => $formato,
		'skillStoryboard' => $formato === 'longo' ? 'roteiro-longo' : 'roteiro-short', 'canal' => blocoCanal($c), 'estilo' => blocoEstilo(estilo($j['estilo'] ?? null)),
		'historico' => historicoCanal($c['id'], $j['id'] ?? null), 'duracao' => $seg >= 90 ? round($seg / 60) . ' min' : "$seg s",
		'palavras' => (string)round($seg * ((($j['narracao'] ?? 'tts') === 'tts') ? 2.8 : 2.5)),
		'instrucoes' => !empty($j['instrucoes']) ? 'Instruções do autor para este vídeo: ' . $j['instrucoes'] : '', 'feedback' => !empty($extra['feedback']) ? 'REFAÇÃO pedida pelo autor: ' . $extra['feedback'] : '',
		'titulo' => ($j['youtube']['titulo'] ?? '') ?: ($j['tema'] ?? ''), 'audio' => ($j['audioLocal'] ?? null) ?: "audio/$b.mp3", 'erro' => $extra['erro'] ?? '', 'nota' => (string)$c['notaMinima'], 'pesquisaTema' => ($j['palavraChave'] ?? '') ?: $c['pesquisaTema'] ?: ($c['nicho'] ?: $c['nome'])];
	$s = preg_replace_callback('/\{\{(\w+)\}\}/', fn($m) => $v[$m[1]] ?? '', $tpl);
	return trim(preg_replace("/\n{3,}/", "\n\n", $s));
}

// ── agentes ──
function agenteDe(array $u): array { global $db; $a = $db['agentes'][$u['id']] ?? ['visto' => 0]; $a['online'] = microtime(true) * 1000 - ($a['visto'] ?? 0) < 20000; return $a; }
function cancelarId(?string $userId, string $id): void { global $db; if ($userId) { $db['cancelar'][$userId] ??= []; $db['cancelar'][$userId][] = $id; } }

function proximaTarefa(array $u): ?array {
	global $db;
	$meus = array_column(array_filter(meusCanais($u), fn($c) => $c['ativo'] !== false), 'id');
	$cand = [];
	foreach ($db['jobs'] as $i => &$j) {
		if ($j['status'] !== 'ativo' || !in_array($j['canalId'], $meus, true)) continue;
		recalcular($j); $e = etapaAtual($j);
		if ($e && $j['etapas'][$e['id']]['estado'] === 'pendente') $cand[] = ['i' => $i, 'e' => $e, 'p' => $e['id'] === 'publicar' ? 0 : ($e['id'] === 'exportar' ? 1 : 3), 'c' => $j['criado']];
	} unset($j);
	usort($cand, fn($a, $b) => $a['p'] <=> $b['p'] ?: strcmp($a['c'], $b['c']));
	foreach ($db['pesquisas'] as $pi => $q) if ($q['estado'] === 'pendente' && in_array($q['canalId'], $meus, true) && (!$cand || $cand[0]['p'] > 1)) return ['pesquisa' => $pi];
	return $cand[0] ?? null;
}

function montarTarefa(int $i, array $e, array $u): array {
	global $db;
	$j = &$db['jobs'][$i]; $s = &$j['etapas'][$e['id']]; $c = &canal($j['canalId']); $pr = array_merge(PREFS, (array)$u['prefs']);
	$s['estado'] = 'rodando'; $s['inicio'] = agora(); $s['fim'] = null; $s['erro'] = ''; $s['log'] = [];
	$reserv = []; foreach ($db['jobs'] as $x) if ($x['nn'] && donoJob($x) === $u['id']) $reserv[] = $x['nn'];
	$t = ['jobId' => $j['id'], 'etapa' => $e['id'], 'tipo' => $e['tipo'], 'nn' => $j['nn'], 'slug' => $j['slug'] ?: slugify($j['tema']), 'formato' => $j['formato'], 'tema' => $j['tema'],
		'reservados' => $reserv, 'arquivos' => new stdClass, 'feedback' => $s['feedback'] ?? '',
		'claude' => motor($e['id'], $pr)];
	$arq = []; foreach ((array)$j['arquivos'] as $p => $f) if (!empty($f['sujo'])) $arq[$p] = $f['conteudo']; if ($arq) $t['arquivos'] = $arq;
	if ($e['id'] === 'tema') $t['prompt'] = renderPrompt('tema', $j);
	if ($e['id'] === 'narracao') { $t['modo'] = $j['narracao']; $t['voz'] = $c['voz']; $t['velocidade'] = $c['velocidade']; $t['formato'] = ($j['formato'] ?? '') ?: $c['formato']; $t['audioUpload'] = $j['audioUpload'] ? '.' . pathinfo($j['audioUpload'], PATHINFO_EXTENSION) : null; }
	if ($e['id'] === 'exportar') $t['audio'] = $j['audioLocal'] ?? null;
	if ($e['id'] === 'publicar') { $g = googleDe($u); $cx = $c['youtube']['conexao'];
		$t['youtube'] = array_merge($j['youtube'], ['mp4' => $j['mp4Local'], 'token' => $c['youtube']['token'] ?: 'token.json',
			'credenciais' => $cx ? ['client_id' => $g['clientId'], 'client_secret' => $g['clientSecret'], 'refresh_token' => $cx['refresh']] : null]); }
	return $t;
}

// ── piloto automático e agenda ──
function pedirPesquisa(array &$c, ?array $pl, string $motivo): ?array {
	global $db; $pid = $pl['id'] ?? null;
	foreach ($db['pesquisas'] as $p) if ($p['canalId'] === $c['id'] && ($p['pilotoId'] ?? null) === $pid && in_array($p['estado'], ['pendente', 'rodando'])) return null;
	$ult = null; foreach ($db['pesquisas'] as $p) if ($p['canalId'] === $c['id'] && ($p['pilotoId'] ?? null) === $pid) $ult = $p;
	if ($motivo !== 'pedida manualmente' && $ult && ($ult['estado'] === 'erro' || empty($ult['temas'])) && microtime(true) * 1000 - ms($ult['fim'] ?? $ult['criado']) < 6 * 3600e3) return null;
	$chave = $pl ? ($pl['palavraChave'] ?: ($c['pesquisaTema'] ?: $c['nicho'])) : ($c['pesquisaTema'] ?: $c['nicho']);
	$p = ['id' => novoId('p'), 'canalId' => $c['id'], 'pilotoId' => $pid, 'palavraChave' => $chave, 'formato' => $pl['formato'] ?? $c['formato'], 'estado' => 'pendente', 'criado' => agora(), 'log' => [], 'motivo' => $motivo];
	$db['pesquisas'][] = $p; if (count($db['pesquisas']) > 300) array_shift($db['pesquisas']);
	avisar($c['dono'] ?? null, "Pesquisa de novos temas iniciada: {$c['nome']}" . ($pl ? " · {$pl['nome']}" : '') . " ($motivo).", ['canalId' => $c['id']]); return $p;
}
function naoRetroagirPiloto(array &$p): void { $h = horaLocal(); foreach ($p['horarios'] as $hora) if ($h['hm'] >= $hora) $p['ultimas'][$hora] = $h['data']; }

function rodarPiloto(array &$c, array &$pl, array $h): void {
	global $db;
	if (!$pl['ativo'] || $c['ativo'] === false) return;
	$doPiloto = fn($j) => $j['canalId'] === $c['id'] && ($j['pilotoId'] ?? null) === $pl['id'];
	$ativos = count(array_filter($db['jobs'], fn($j) => $doPiloto($j) && $j['status'] === 'ativo'));
	$fila = count(array_filter($db['temas'], fn($t) => $t['canalId'] === $c['id'] && ($t['pilotoId'] ?? null) === $pl['id'] && empty($t['usado'])));
	$faltam = max(1, (int)$pl['estoqueAlvo']) - $ativos;
	if ($faltam > 0 && $fila) { criarLote(['canalId' => $c['id'], 'pilotoId' => $pl['id'], 'quantidade' => min($faltam, $fila), 'soDaFila' => true, 'distribuicao' => 'alternar']); $ativos += min($faltam, $fila); $fila -= min($faltam, $fila); }
	$restante = $fila + $ativos; $nome = "{$c['nome']} · {$pl['nome']}";
	if ($restante <= (int)$pl['limite']) {
		if ($pl['fonte'] === 'pesquisa') pedirPesquisa($c, $pl, $restante ? "restam $restante temas/vídeos" : 'fila vazia');
		else avisar($c['dono'] ?? null, $restante ? "O piloto $nome está acabando: restam $restante temas/vídeos. Adicione novos temas." : "O piloto $nome parou: não há temas nem vídeos em produção. Adicione temas para continuar.",
			['chave' => "fila:{$pl['id']}:{$h['data']}:" . ($restante ? 'baixa' : 'zero'), 'canalId' => $c['id'], 'tipo' => 'aviso']);
	}
	if ($pl['publicar'] && in_array($h['dia'], $pl['dias'])) foreach ($pl['horarios'] as $hora) {
		if ($h['hm'] < $hora || ($pl['ultimas'][$hora] ?? '') === $h['data']) continue;
		$pl['ultimas'][$hora] = $h['data']; $alvo = null;
		foreach ($db['jobs'] as $i => $j) { $e = etapaAtual($j); if ($doPiloto($j) && $j['status'] === 'ativo' && $e && $e['id'] === 'publicar' && !$j['publicarEm'] && ($alvo === null || strcmp($j['criado'], $db['jobs'][$alvo]['criado']) < 0)) $alvo = $i; }
		if ($alvo !== null) { $db['jobs'][$alvo]['publicarEm'] = agora(); recalcular($db['jobs'][$alvo]); }
		else avisar($c['dono'] ?? null, "Horário $hora do piloto $nome chegou sem vídeo pronto.", ['chave' => "semestoque:{$pl['id']}:{$h['data']}:$hora", 'canalId' => $c['id'], 'tipo' => 'aviso']);
	}
}

function rodarAgenda(): void {
	global $db;
	$agora = microtime(true); if ($agora - ($db['ultimaAgenda'] ?? 0) < 15) return; $db['ultimaAgenda'] = $agora; salvar();
	$h = horaLocal();
	foreach ($db['jobs'] as &$j) if ($j['status'] === 'ativo') recalcular($j); unset($j);
	foreach ($db['canais'] as &$c) if (!empty($c['dono'])) foreach ($c['pilotos'] as &$pl) rodarPiloto($c, $pl, $h); unset($c, $pl);
	rodarTestes($h);
	$chave = $h['data'] . ' ' . $h['hm'];
	if ($chave !== $db['ultimoMinuto']) {
		$db['ultimoMinuto'] = $chave;
		foreach ($db['regras'] as &$r) { if (!$r['ativo'] || !in_array($h['dia'], $r['dias']) || ($r['ultima'] ?? '') === $h['data'] || $h['hm'] < $r['hora'] || !canal($r['canalId'])) continue; executarRegra($r); $r['ultima'] = $h['data']; } unset($r);
	}
}

// ── teste A/B de thumbnails (todo vídeo longo publicado com 2+ thumbnails) ──
// Fase k = thumbnail k no ar por TESTE_DIAS dias. Depois da última, espera o atraso do YouTube Analytics,
// pontua cada fase (CTR + retenção, não views — a 1ª sempre pega o pico de lançamento) e deixa a vencedora.
const TESTE_DIAS = 7; const TESTE_ATRASO = 3; const TESTE_MIN_VIEWS = 20;
function dataMais(string $d, int $n): string { return (new DateTime($d))->modify("$n day")->format('Y-m-d'); }
function idVideo(string $url): string { return preg_match('#(?:youtu\.be/|v=|shorts/)([\w-]{11})#', $url, $m) ? $m[1] : ''; }
function logTeste(array &$t, string $txt): void { $t['log'][] = ['em' => agora(), 'txt' => $txt]; $t['log'] = array_slice($t['log'], -40); }
function criarTeste(array $j): void {
	global $db; $th = array_values(array_filter((array)($j['thumbs'] ?? [])));
	if ($j['formato'] !== 'longo' || count($th) < 2 || !($vid = idVideo($j['youtube']['url'] ?? ''))) return;
	foreach ($db['testes'] as $t) if ($t['jobId'] === $j['id']) return;
	$h = horaLocal();
	$t = ['id' => novoId('t'), 'jobId' => $j['id'], 'canalId' => $j['canalId'], 'videoId' => $vid, 'titulo' => ($j['youtube']['titulo'] ?? '') ?: $j['tema'], 'thumbs' => $th,
		'estado' => 'ativo', 'criado' => agora(), 'atual' => 0, 'aplicada' => -1, 'fases' => [['inicio' => $h['data'], 'fim' => dataMais($h['data'], TESTE_DIAS - 1), 'm' => null]],
		'notas' => [], 'vencedora' => null, 'erro' => '', 'erroColeta' => '', 'tentativa' => 0, 'coleta' => '', 'log' => []];
	logTeste($t, 'Teste criado com ' . count($th) . ' thumbnails.'); $db['testes'][] = $t; salvar();
}
function httpJson(string $url, string $metodo = 'GET', $corpo = null, array $cab = []): array {
	$ch = curl_init($url); curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 25, CURLOPT_CUSTOMREQUEST => $metodo, CURLOPT_HTTPHEADER => $cab]);
	if ($corpo !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, $corpo);
	$txt = curl_exec($ch); $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
	$r = json_decode((string)$txt, true); $r = is_array($r) ? $r : []; $r['_http'] = $code; return $r;
}
function erroGoogle(array $r): string {
	$m = is_array($r['error'] ?? null) ? ($r['error']['message'] ?? '') : (($r['error_description'] ?? '') ?: (string)($r['error'] ?? '')); $m = $m ?: "HTTP {$r['_http']}";
	if (in_array($r['_http'], [401, 403], true) && preg_match('/scope|insufficient|permission/i', $m)) $m .= ' — reconecte o YouTube do canal (Canais → canal → YouTube) para liberar thumbnails e estatísticas.';
	if (preg_match('/verif|custom thumbnail/i', $m)) $m .= ' — o canal precisa estar verificado no YouTube para usar thumbnail personalizada.';
	return $m;
}
function acessoGoogle(array &$c): string {
	global $cfg; $cx = &$c['youtube']['conexao'];
	if (!$cx) throw new Exception('YouTube do canal não está conectado pelo painel.');
	if (($cx['acesso'] ?? '') && ($cx['expira'] ?? 0) > time() + 60) return $cx['acesso'];
	$u = usuario($c['dono'] ?? null); $g = $u ? googleDe($u) : ($cfg['google'] ?? []);
	$r = httpJson('https://oauth2.googleapis.com/token', 'POST', http_build_query(['client_id' => $g['clientId'] ?? '', 'client_secret' => $g['clientSecret'] ?? '', 'refresh_token' => $cx['refresh'], 'grant_type' => 'refresh_token']), ['Content-Type: application/x-www-form-urlencoded']);
	if (empty($r['access_token'])) throw new Exception('Renovar acesso ao YouTube: ' . erroGoogle($r));
	$cx['acesso'] = $r['access_token']; $cx['expira'] = time() + (int)($r['expires_in'] ?? 3600); salvar(); return $cx['acesso'];
}
function aplicarThumb(array &$t, array &$c, int $k): void {
	$f = DADOS . '/uploads/' . ($t['thumbs'][$k] ?? ''); if (!is_file($f)) throw new Exception('O arquivo da thumbnail ' . ($k + 1) . ' sumiu do painel.');
	$r = httpJson('https://www.googleapis.com/upload/youtube/v3/thumbnails/set?uploadType=media&videoId=' . $t['videoId'], 'POST', file_get_contents($f), ['Authorization: Bearer ' . acessoGoogle($c), 'Content-Type: image/jpeg']);
	if ($r['_http'] >= 300) throw new Exception('Trocar thumbnail: ' . erroGoogle($r));
	$t['aplicada'] = $k; logTeste($t, 'Thumbnail ' . ($k + 1) . ' no ar.');
}
function coletarTeste(array &$t, array &$c, string $hoje): void {
	$tok = acessoGoogle($c); $lim = dataMais($hoje, -1); $vid = $t['videoId'];
	$q = fn(array $p) => httpJson('https://youtubeanalytics.googleapis.com/v2/reports?' . http_build_query(array_merge(['ids' => 'channel==MINE', 'filters' => "video==$vid"], $p)), 'GET', null, ["Authorization: Bearer $tok"]);
	$base = 'views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,likes';
	foreach ($t['fases'] as &$f) {
		if ($f['inicio'] > $lim) continue; $fim = min($f['fim'], $lim); $per = ['startDate' => $f['inicio'], 'endDate' => $fim];
		$r = $q($per + ['metrics' => "$base,videoThumbnailImpressions,videoThumbnailImpressionsClickRate"]); $temCtr = $r['_http'] < 300;
		if (!$temCtr) $r = $q($per + ['metrics' => $base]);
		if ($r['_http'] >= 300) throw new Exception('Estatísticas: ' . erroGoogle($r));
		$cols = array_column($r['columnHeaders'] ?? [], 'name'); $row = $r['rows'][0] ?? null; $m = $row ? array_combine($cols, $row) : [];
		$ret = $q($per + ['metrics' => 'audienceWatchRatio', 'dimensions' => 'elapsedVideoTimeRatio', 'filters' => "video==$vid;audienceType==ORGANIC"]);
		$curva = array_map(fn($x) => [(float)$x[0], (float)$x[1]], $ret['rows'] ?? []);
		$em = function (float $alvo) use ($curva) { $b = null; $d = 9; foreach ($curva as [$x, $v]) if (abs($x - $alvo) < $d) { $d = abs($x - $alvo); $b = $v; } return $b === null ? null : round($b * 100, 1); };
		$ctr = $temCtr && isset($m['videoThumbnailImpressionsClickRate']) ? (float)$m['videoThumbnailImpressionsClickRate'] : null;
		$f['m'] = ['ate' => $fim, 'views' => (int)($m['views'] ?? 0), 'minutos' => (int)($m['estimatedMinutesWatched'] ?? 0), 'duracaoMedia' => (int)($m['averageViewDuration'] ?? 0),
			'pctMedio' => round((float)($m['averageViewPercentage'] ?? 0), 1), 'inscritos' => (int)($m['subscribersGained'] ?? 0), 'likes' => (int)($m['likes'] ?? 0),
			'impressoes' => $temCtr && isset($m['videoThumbnailImpressions']) ? (int)$m['videoThumbnailImpressions'] : null,
			'ctr' => $ctr === null ? null : round($ctr <= 1 ? $ctr * 100 : $ctr, 2),
			'ret10' => $em(0.1), 'ret30' => $em(0.3), 'ret50' => $em(0.5)];
	} unset($f);
	$t['coleta'] = $hoje; $t['erroColeta'] = ''; $t['notas'] = pontuar($t['fases']);
}
// Nota 0–100 por fase, relativa à melhor fase em cada métrica. Views ficam de fora de propósito.
function pontuar(array $fases): array {
	$ms = array_map(fn($f) => $f['m'] ?? [], $fases); if (!array_filter($ms)) return [];
	$temCtr = !array_filter($ms, fn($m) => ($m['ctr'] ?? null) === null);
	$pesos = $temCtr ? ['ctr' => .35, 'pctMedio' => .35, 'ret30' => .2, 'insc' => .1] : ['pctMedio' => .5, 'ret30' => .35, 'insc' => .15];
	$val = fn($m, $k) => $k === 'insc' ? (($m['views'] ?? 0) ? ($m['inscritos'] ?? 0) * 1000 / $m['views'] : 0) : (float)($m[$k] ?? 0);
	$ok = array_filter($ms, fn($m) => ($m['views'] ?? 0) >= TESTE_MIN_VIEWS) ?: $ms;
	$max = []; foreach ($pesos as $k => $_) $max[$k] = max(array_map(fn($m) => $val($m, $k), $ok)) ?: 1;
	return array_map(fn($m) => ($m['views'] ?? 0) < TESTE_MIN_VIEWS ? null : round(100 * array_sum(array_map(fn($k, $p) => $p * $val($m, $k) / $max[$k], array_keys($pesos), $pesos)), 1), $ms);
}
function decidirTeste(array &$t, array &$c, ?int $forcar = null): void {
	$notas = $t['notas']; $v = $forcar;
	if ($v === null) { $ok = array_filter($notas, fn($n) => $n !== null); $v = $ok ? array_search(max($ok), $ok, true) : 0; }
	if ($t['aplicada'] !== $v) aplicarThumb($t, $c, $v);
	$t['vencedora'] = $v; $t['estado'] = 'concluido'; $t['fim'] = agora();
	logTeste($t, 'Vencedora: thumbnail ' . ($v + 1) . ($forcar !== null ? ' (escolhida por você).' : (isset($notas[$v]) ? " (nota {$notas[$v]})." : ' (sem dados suficientes; ficou a 1ª).')));
	avisar($c['dono'] ?? null, "Teste de thumbnail concluído: \"{$t['titulo']}\" ficou com a thumbnail " . ($v + 1) . '.', ['canalId' => $c['id'], 'jobId' => $t['jobId']]);
}
function rodarTestes(array $h): void {
	global $db; $hoje = $h['data'];
	foreach ($db['testes'] as &$t) {
		if ($t['estado'] !== 'ativo' || time() < ($t['tentativa'] ?? 0)) continue;
		$c = &canal($t['canalId']); if (!$c) { $t['estado'] = 'cancelado'; $t['erro'] = 'Canal apagado.'; unset($c); continue; }
		$n = count($t['thumbs']); $f = $t['fases'][$t['atual']]; $rede = false;
		try {
			if ($hoje > $f['fim'] && $t['atual'] + 1 < $n) { // semana acabou: próxima thumbnail
				$t['atual']++; $t['fases'][] = ['inicio' => $hoje, 'fim' => dataMais($hoje, TESTE_DIAS - 1), 'm' => null];
				logTeste($t, 'Fim da semana da thumbnail ' . $t['atual'] . '.');
			}
			$ultima = end($t['fases']); $acabou = $hoje > $ultima['fim'] && $t['atual'] + 1 >= $n;
			if (!$acabou && $t['aplicada'] !== $t['atual']) { $rede = true; aplicarThumb($t, $c, $t['atual']); }
			if ($t['coleta'] !== $hoje) { $rede = true; try { coletarTeste($t, $c, $hoje); } catch (Exception $e) { $t['erroColeta'] = $e->getMessage(); $t['coleta'] = $hoje; } }
			if ($acabou && $hoje >= dataMais($ultima['fim'], TESTE_ATRASO + 1) && !$t['erroColeta']) { $rede = true; decidirTeste($t, $c); }
			$t['erro'] = '';
		} catch (Exception $e) {
			$t['erro'] = $e->getMessage(); $t['tentativa'] = time() + 1800;
			avisar($c['dono'] ?? null, "Teste de thumbnail de \"{$t['titulo']}\": {$t['erro']}", ['chave' => "teste:{$t['id']}:$hoje", 'canalId' => $c['id'], 'tipo' => 'erro']);
		}
		unset($c); salvar();
		if ($rede) break; // no máximo um teste falando com o Google por requisição
	} unset($t);
}

function executarRegra(array &$r): void {
	global $db; $log = [];
	if ($r['tipo'] === 'gerar') {
		$ids = criarLote(['canalId' => $r['canalId'], 'quantidade' => $r['quantidade'], 'formato' => $r['formato'], 'estilos' => $r['estilos'], 'distribuicao' => $r['distribuicao'], 'gates' => $r['gates'], 'instrucoes' => $r['instrucoes'], 'regraId' => $r['id'], 'privacidade' => $r['privacidade']]);
		foreach ($db['jobs'] as $j) if (in_array($j['id'], $ids)) { $e = estilo($j['estilo']); $log[] = ($j['tema'] ?: 'tema automático') . ($e ? " [{$e['nome']}]" : ''); }
	} else {
		$prontos = [];
		foreach ($db['jobs'] as $i => $j) { $e = etapaAtual($j); if ($j['status'] === 'ativo' && $j['canalId'] === $r['canalId'] && $e && $e['id'] === 'publicar' && !$j['publicarEm'] && (empty($r['formato']) || $r['formato'] === 'todos' || $j['formato'] === $r['formato'])) $prontos[] = $i; }
		usort($prontos, fn($a, $b) => strcmp($db['jobs'][$a]['criado'], $db['jobs'][$b]['criado']));
		foreach (array_slice($prontos, 0, (int)$r['quantidade']) as $i) { $db['jobs'][$i]['publicarEm'] = agora(); if ($r['privacidade']) $db['jobs'][$i]['youtube']['privacidade'] = $r['privacidade']; recalcular($db['jobs'][$i]); $log[] = $db['jobs'][$i]['youtube']['titulo'] ?: $db['jobs'][$i]['tema']; }
		if (!$prontos) $log[] = 'nenhum vídeo pronto no estoque';
	}
	$r['historico'] = array_slice(array_merge([['em' => agora(), 'log' => $log]], $r['historico'] ?? []), 0, 15);
}

function proximasExecucoes(array $u): array {
	global $db; $out = []; $h = horaLocal(); $ids = idsMeus($u); $DS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
	$prox = function ($dias, $hora, $feita) use ($h, $DS) { for ($k = 0; $k < 8; $k++) { $dia = ($h['dia'] + $k) % 7; if (!in_array($dia, $dias)) continue; if ($k === 0 && ($feita || $h['hm'] > $hora)) continue; return ['k' => $k, 'quando' => $k === 0 ? "hoje $hora" : ($k === 1 ? "amanhã $hora" : $DS[$dia] . " $hora")]; } return null; };
	foreach ($db['regras'] as $r) if ($r['ativo'] && in_array($r['canalId'], $ids)) { $x = $prox($r['dias'], $r['hora'], ($r['ultima'] ?? '') === $h['data']); if ($x) $out[] = ['regra' => $r['nome'], 'tipo' => $r['tipo'], 'canalId' => $r['canalId'], 'hora' => $r['hora']] + $x; }
	foreach (meusCanais($u) as $c) foreach ($c['pilotos'] as $pl) if ($pl['ativo'] && $pl['publicar']) foreach ($pl['horarios'] as $hora) { $x = $prox($pl['dias'], $hora, ($pl['ultimas'][$hora] ?? '') === $h['data']); if ($x) $out[] = ['regra' => $pl['nome'], 'tipo' => 'publicar', 'canalId' => $c['id'], 'pilotoId' => $pl['id'], 'hora' => $hora] + $x; }
	usort($out, fn($a, $b) => $a['k'] <=> $b['k'] ?: strcmp($a['hora'], $b['hora'])); return $out;
}
function naoRetroagir(array &$r): void { $h = horaLocal(); if ($h['hm'] >= $r['hora']) $r['ultima'] = $h['data']; }
function limparRegra(array $b, array $u): array {
	$cid = in_array($b['canalId'] ?? '', idsMeus($u), true) ? $b['canalId'] : (idsMeus($u)[0] ?? null);
	return ['nome' => trim($b['nome'] ?? '') ?: (($b['tipo'] ?? '') === 'publicar' ? 'Publicar' : 'Produzir'), 'tipo' => ($b['tipo'] ?? '') === 'publicar' ? 'publicar' : 'gerar', 'canalId' => $cid,
		'dias' => array_map('intval', $b['dias'] ?? [0, 1, 2, 3, 4, 5, 6]), 'hora' => preg_match('/^\d\d:\d\d$/', $b['hora'] ?? '') ? $b['hora'] : '09:00', 'quantidade' => max(1, min(20, (int)($b['quantidade'] ?? 1))),
		'formato' => ($b['formato'] ?? '') ?: 'short', 'estilos' => $b['estilos'] ?? [], 'distribuicao' => ($b['distribuicao'] ?? '') === 'aleatorio' ? 'aleatorio' : 'alternar',
		'gates' => $b['gates'] ?? null, 'instrucoes' => $b['instrucoes'] ?? '', 'privacidade' => $b['privacidade'] ?? '', 'ultima' => $b['ultima'] ?? null];
}

// Evolução: pesquisas → vídeos analisados → temas criados → vídeos feitos → publicados (por canal e por piloto)
function estatisticas(array $meus): array|stdClass {
	global $db; $o = [];
	$z = fn() => ['pesquisas' => 0, 'videosAnalisados' => 0, 'temasCriados' => 0, 'temasUsados' => 0, 'videosFeitos' => 0, 'publicados' => 0, 'custo' => 0.0];
	$add = function ($cid, $pid, $k, $v = 1) use (&$o, $z) { foreach ([$cid, "$cid|$pid"] as $chave) { $o[$chave] ??= $z(); $o[$chave][$k] += $v; } };
	foreach ($db['pesquisas'] as $q) if (in_array($q['canalId'], $meus, true) && $q['estado'] === 'feito') { $add($q['canalId'], $q['pilotoId'] ?? '', 'pesquisas'); $add($q['canalId'], $q['pilotoId'] ?? '', 'videosAnalisados', count($q['videos'] ?? []) ?: 5); }
	foreach ($db['temas'] as $t) if (in_array($t['canalId'], $meus, true)) { if (($t['origem'] ?? '') === 'pesquisa' || !empty($t['pesquisaId'])) $add($t['canalId'], $t['pilotoId'] ?? '', 'temasCriados'); if (!empty($t['usado'])) $add($t['canalId'], $t['pilotoId'] ?? '', 'temasUsados'); }
	foreach ($db['jobs'] as $j) if (in_array($j['canalId'], $meus, true)) { $e = etapaAtual($j); $pronto = !$e || $e['id'] === 'publicar';
		if ($pronto) $add($j['canalId'], $j['pilotoId'] ?? '', 'videosFeitos'); if ($j['status'] === 'concluido') $add($j['canalId'], $j['pilotoId'] ?? '', 'publicados'); $add($j['canalId'], $j['pilotoId'] ?? '', 'custo', (float)$j['custo']); }
	return $o ?: new stdClass;
}
// ── YouTube / URLs ──
function googleDe(array $u): array { global $cfg; return !empty($u['google']['clientId']) ? $u['google'] : ($cfg['google'] ?? ['clientId' => '', 'clientSecret' => '']); }
function urlBase(): string {
	global $cfg; if (!empty($cfg['urlPublica'])) return rtrim($cfg['urlPublica'], '/');
	$proto = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https' ? 'https' : 'http';
	return $proto . '://' . $_SERVER['HTTP_HOST'] . rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\');
}

// ── sessão ──
function sessao(): ?array {
	[$uid, $exp, $sig] = array_pad(explode('.', $_COOKIE['mg'] ?? ''), 3, '');
	if (!$uid || !$sig || (int)$exp < time() * 1000 || !hash_equals(assinar("$uid.$exp"), $sig)) return null;
	$u = &usuario($uid); return $u ?: null;
}
function abrirSessao(array $u): void {
	$exp = (string)((time() + 30 * 86400) * 1000);
	setcookie('mg', "{$u['id']}.$exp." . assinar("{$u['id']}.$exp"), ['expires' => time() + 30 * 86400, 'path' => rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\') . '/', 'httponly' => true, 'samesite' => 'Lax', 'secure' => str_starts_with(urlBase(), 'https')]);
	responder(['usuario' => pubUsuario($u)]);
}
function pubUsuario(?array $u): ?array { return $u ? ['id' => $u['id'], 'login' => $u['login'], 'nome' => $u['nome'], 'admin' => $u['admin'], 'criado' => $u['criado']] : null; }
function novoUsuario(array $b): array {
	global $db;
	$u = ['id' => novoId('u'), 'login' => strtolower(trim((string)$b['login'])), 'nome' => ($b['nome'] ?? '') ?: $b['login'], 'admin' => !empty($b['admin']), 'criado' => agora(),
		'hash' => password_hash((string)$b['senha'], PASSWORD_DEFAULT), 'tokenAgente' => b64u(random_bytes(24)), 'prefs' => PREFS,
		'avisos' => ['telegramToken' => '', 'telegramChat' => '', 'webhook' => ''], 'google' => ['clientId' => '', 'clientSecret' => '']];
	$db['usuarios'][] = $u; salvar(); return $u;
}
function contaPub(array $u): array { global $cfg; return pubUsuario($u) + ['prefs' => array_merge(PREFS, (array)$u['prefs']), 'avisos' => $u['avisos'], 'tokenAgente' => $u['tokenAgente'],
	'google' => ['clientId' => $u['google']['clientId'] ?? '', 'temSecret' => !empty($u['google']['clientSecret']), 'usandoGlobal' => empty($u['google']['clientId']) && !empty($cfg['google']['clientId'])]]; }

// ── HTTP util ──
function responder($obj, int $code = 200): never { http_response_code($code); header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store'); echo json_encode($obj, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); exit; }
function corpo(): array { static $b = null; if ($b === null) $b = json_decode(file_get_contents('php://input') ?: '{}', true) ?: []; return $b; }
function redirecionar(string $url): never { header('Location: ' . $url, true, 302); exit; }
function enviarArquivo(?string $file, string $tipo): never {
	global $LOCK; flock($LOCK, LOCK_UN); // libera o banco durante o envio
	if (!$file || !is_file($file)) { http_response_code(404); exit; }
	$tam = filesize($file); header('Content-Type: ' . $tipo); header('Accept-Ranges: bytes');
	$a = 0; $b = $tam - 1;
	if (preg_match('/bytes=(\d*)-(\d*)/', $_SERVER['HTTP_RANGE'] ?? '', $m)) { $a = $m[1] !== '' ? (int)$m[1] : $tam - (int)$m[2]; $b = $m[1] !== '' && $m[2] !== '' ? min((int)$m[2], $tam - 1) : $tam - 1; http_response_code(206); header("Content-Range: bytes $a-$b/$tam"); }
	header('Content-Length: ' . ($b - $a + 1));
	$f = fopen($file, 'rb'); fseek($f, $a); $rest = $b - $a + 1; while ($rest > 0 && !feof($f)) { $n = min(1 << 16, $rest); echo fread($f, $n); $rest -= $n; flush(); } fclose($f); exit;
}
function receberArquivo(string $destino): void { $in = fopen('php://input', 'rb'); $out = fopen($destino, 'wb'); stream_copy_to_stream($in, $out); fclose($in); fclose($out); }
function resumo(array $j): array {
	global $IDS_ETAPAS; $at = etapaAtual($j); $et = []; foreach ($IDS_ETAPAS as $k) $et[$k] = $j['etapas'][$k]['estado'];
	return ['id' => $j['id'], 'base' => base($j), 'tema' => $j['tema'], 'formato' => $j['formato'], 'status' => $j['status'], 'narracao' => $j['narracao'], 'origem' => $j['origem'], 'criado' => $j['criado'], 'publicarEm' => $j['publicarEm'],
		'canalId' => $j['canalId'], 'pilotoId' => $j['pilotoId'] ?? null, 'estilo' => $j['estilo'], 'loteId' => $j['loteId'], 'nota' => $j['etapas']['revisao']['nota'] ?? null, 'duracao' => $j['duracao'],
		'titulo' => $j['youtube']['titulo'], 'url' => $j['youtube']['url'], 'custo' => $j['custo'], 'etapas' => $et, 'atual' => $at['id'] ?? null, 'motivo' => $at ? ($j['etapas'][$at['id']]['motivo'] ?? '') : ''];
}
function canalPub(array $c): array { if ($c['youtube']['conexao']) $c['youtube']['conexao'] = ['canalYT' => $c['youtube']['conexao']['canalYT'], 'em' => $c['youtube']['conexao']['em']]; return $c; }
function jobIdx(?string $id, array $u): ?int { global $db; foreach ($db['jobs'] as $i => $j) if ($j['id'] === $id && donoJob($j) === $u['id']) return $i; return null; }

// ════════════════ ROTAS ════════════════
$rota = trim((string)($_GET['r'] ?? ''), '/');
$m = $_SERVER['REQUEST_METHOD'];
header('X-Frame-Options: DENY'); header('X-Content-Type-Options: nosniff');
rodarAgenda();

// ── agente ──
if (str_starts_with($rota, 'agente/')) {
	$tok = $_SERVER['HTTP_X_AGENTE'] ?? ''; $uIdx = null;
	foreach ($db['usuarios'] as $i => $x) if ($tok && hash_equals($x['tokenAgente'], $tok)) $uIdx = $i;
	if ($uIdx === null) responder(['erro' => 'token do agente inválido'], 401);
	$u = $db['usuarios'][$uIdx]; $sub = substr($rota, 7);
	if ($sub === 'pulso') {
		$b = corpo(); $db['agentes'][$u['id']] = ['visto' => microtime(true) * 1000, 'nome' => $b['nome'] ?? '', 'ocupado' => $b['ocupado'] ?? null, 'local' => $b['local'] ?? false];
		$oc = $b['ocupado'] ?? []; $now = microtime(true) * 1000;
		foreach ($db['jobs'] as &$j) if (donoJob($j) === $u['id']) foreach ($j['etapas'] as $k => &$s) if ($s['estado'] === 'rodando' && !(($oc['jobId'] ?? '') === $j['id'] && ($oc['etapa'] ?? '') === $k) && $now - ms($s['inicio']) > 15000) { $s['estado'] = 'erro'; $s['erro'] = 'Interrompido (o agente parou ou reiniciou).'; $s['fim'] = agora(); } unset($j, $s);
		foreach ($db['pesquisas'] as &$q) { $c = &canal($q['canalId']); if ($q['estado'] === 'rodando' && ($c['dono'] ?? '') === $u['id'] && ($oc['pesquisaId'] ?? '') !== $q['id'] && $now - ms($q['inicio']) > 15000) { $q['estado'] = 'erro'; $q['erro'] = 'Interrompida (o agente parou).'; } unset($c); } unset($q);
		$canc = $db['cancelar'][$u['id']] ?? []; $db['cancelar'][$u['id']] = []; salvar();
		$docs = []; foreach ($db['pesquisas'] as $q) { $c = canal($q['canalId']); if ($q['estado'] === 'feito' && !empty($q['relatorio']) && !isset($q['docs']) && ($c['dono'] ?? '') === $u['id']) $docs[] = ['id' => $q['id'], 'relatorio' => $q['relatorio']]; }
		responder(['cancelar' => array_values($canc), 'docs' => array_slice($docs, -3)]);
	}
	if ($sub === 'pegar') {
		$db['agentes'][$u['id']]['visto'] = microtime(true) * 1000; salvar();
		$x = proximaTarefa($u); if (!$x) responder(['tarefa' => null]);
		if (isset($x['pesquisa'])) {
			$q = &$db['pesquisas'][$x['pesquisa']]; $c = &canal($q['canalId']); $pr = array_merge(PREFS, (array)$u['prefs']);
			$q['estado'] = 'rodando'; $q['inicio'] = agora(); $q['log'] = []; $q['erro'] = '';
			responder(['tarefa' => ['pesquisaId' => $q['id'], 'etapa' => 'pesquisa', 'tipo' => 'pesquisa', 'prompt' => renderPrompt('pesquisa', ['canalId' => $c['id'], 'formato' => $q['formato'] ?? $c['formato'], 'palavraChave' => $q['palavraChave'] ?? '']),
				'claude' => motor('pesquisa', $pr)]]);
		}
		responder(['tarefa' => montarTarefa($x['i'], $x['e'], $u)]);
	}
	if ($sub === 'prompt') {
		$b = corpo(); $i = jobIdx($b['jobId'] ?? null, $u); if ($i === null) responder([], 404);
		$j = &$db['jobs'][$i]; if (!empty($b['nn'])) { $j['nn'] = $b['nn']; $j['slug'] = $b['slug']; }
		foreach ($j['arquivos'] as &$f) $f['sujo'] = false; unset($f); salvar();
		responder(['prompt' => renderPrompt(($b['promptId'] ?? '') ?: $b['etapa'], $j, ['feedback' => !empty($b['promptId']) ? '' : ($j['etapas'][$b['etapa']]['feedback'] ?? ''), 'erro' => $b['erro'] ?? '']), 'base' => base($j)]);
	}
	if ($sub === 'log') {
		$b = corpo();
		if (!empty($b['pesquisaId'])) { foreach ($db['pesquisas'] as &$q) if ($q['id'] === $b['pesquisaId']) { $q['log'] = array_slice(array_merge($q['log'], $b['linhas']), -500); } unset($q); }
		else { $i = jobIdx($b['jobId'] ?? null, $u); if ($i === null) responder([], 404); $s = &$db['jobs'][$i]['etapas'][$b['etapa']]; $s['log'] = array_slice(array_merge($s['log'], $b['linhas']), -500); }
		salvar(); responder(['ok' => 1]);
	}
	if ($sub === 'pesquisa-docs') { // dossiê (vídeos, comentários, análise) + relatório de sugestões, lidos do computador
		$b = corpo();
		foreach ($db['pesquisas'] as &$q) if ($q['id'] === ($b['pesquisaId'] ?? '')) { $c = canal($q['canalId']); if (($c['dono'] ?? '') !== $u['id']) break;
			$q['docs'] = ['dossie' => mb_substr((string)($b['dossie'] ?? ''), 0, 80000), 'relatorio' => mb_substr((string)($b['relatorio'] ?? ''), 0, 80000)]; unset($q); salvar(); responder(['ok' => 1]); }
		unset($q); responder([], 404);
	}
	if ($sub === 'fim-pesquisa') {
		$b = corpo(); $qi = null; foreach ($db['pesquisas'] as $k => $q) if ($q['id'] === ($b['pesquisaId'] ?? '')) $qi = $k;
		if ($qi === null) responder([], 404);
		$q = &$db['pesquisas'][$qi]; $c = &canal($q['canalId']); if (($c['dono'] ?? '') !== $u['id']) responder([], 404);
		$q['fim'] = agora(); $q['custo'] = $b['custo'] ?? 0; $q['relatorio'] = $b['relatorio'] ?? '';
		if (empty($b['ok'])) { $q['estado'] = 'erro'; $q['erro'] = $b['erro'] ?? 'falhou'; avisar($u['id'], "A pesquisa de temas do canal {$c['nome']} falhou: {$q['erro']}", ['canalId' => $c['id'], 'tipo' => 'erro']); }
		else {
			$novos = [];
			foreach ($b['temas'] ?? [] as $t) { $tit = trim($t['titulo'] ?? $t['tema'] ?? ''); if (!$tit) continue;
				$det = implode(' | ', array_filter([!empty($t['tema']) ? "Assunto: {$t['tema']}" : '', !empty($t['gancho']) ? "Gancho: {$t['gancho']}" : '', !empty($t['desenvolvimento']) ? "Desenvolvimento: {$t['desenvolvimento']}" : '', !empty($t['final']) ? "Final: {$t['final']}" : '']));
				$novos[] = ['canalId' => $c['id'], 'pilotoId' => $q['pilotoId'] ?? null, 'usado' => false, 'criado' => agora(), 'formato' => $q['formato'] ?? null, 'origem' => 'pesquisa', 'pesquisaId' => $q['id'], 'tema' => $tit, 'detalhe' => $det]; }
			array_push($db['temas'], ...$novos); $q['estado'] = 'feito'; $q['temas'] = array_column($novos, 'tema'); $q['sugestoes'] = array_slice((array)($b['temas'] ?? []), 0, 12);
			$q['videos'] = array_values(array_map(fn($v) => ['titulo' => mb_substr((string)($v['titulo'] ?? ''), 0, 200), 'canal' => mb_substr((string)($v['canal'] ?? ''), 0, 100), 'url' => preg_match('#^https://(www.)?(youtube.com|youtu.be)/#', (string)($v['url'] ?? '')) ? $v['url'] : '', 'views' => $v['views'] ?? null], array_slice((array)($b['videos'] ?? []), 0, 10)));
			avisar($u['id'], "Pesquisa concluída para {$c['nome']}: " . count($novos) . ' temas novos entraram na fila.', ['canalId' => $c['id']]);
		}
		salvar(); responder(['ok' => 1]);
	}
	if ($sub === 'fim') {
		global $ETAPAS;
		$b = corpo(); $i = jobIdx($b['jobId'] ?? null, $u); if ($i === null) responder([], 404);
		$j = &$db['jobs'][$i]; $s = &$j['etapas'][$b['etapa']]; $c = &canal($j['canalId']); $s['fim'] = agora();
		if (!empty($b['nn'])) { $j['nn'] = $b['nn']; $j['slug'] = $b['slug']; }
		if (!empty($b['tema'])) { $j['tema'] = $b['tema']; $j['slug'] = ($b['slug'] ?? '') ?: slugify($b['tema']); }
		foreach ((array)($b['info'] ?? []) as $k => $v) if (in_array($k, ['audioLocal', 'duracao', 'mp4Local', 'demo'], true)) $j[$k] = $v;
		if (!empty($b['custo'])) { $j['custo'] = round($j['custo'] + $b['custo'], 4); $s['custo'] = round(($s['custo'] ?? 0) + $b['custo'], 4); }
		$arqs = (array)$j['arquivos'];
		foreach ((array)($b['arquivos'] ?? []) as $rel => $conteudo) {
			if (!empty($arqs[$rel]['sujo'])) continue;
			$arqs[$rel] = ['conteudo' => $conteudo, 'em' => agora(), 'sujo' => false];
			if (str_ends_with($rel, '.meta.json') && empty($j['youtube']['editado'])) { $mt = json_decode($conteudo, true); if ($mt) { $j['youtube']['titulo'] = $mt['titulo'] ?? ''; $j['youtube']['descricao'] = $mt['descricao'] ?? ''; $j['youtube']['tags'] = $mt['tags'] ?? []; } }
		}
		$j['arquivos'] = $arqs ?: new stdClass;
		if (!empty($b['youtubeUrl'])) $j['youtube']['url'] = $b['youtubeUrl'];
		$s['motivo'] = ''; $nome = ($j['youtube']['titulo'] ?: $j['tema']) ?: 'vídeo';
		if (empty($b['ok'])) { $s['estado'] = 'erro'; $s['erro'] = ($b['erro'] ?? '') ?: 'falhou'; avisar($u['id'], "Erro em \"$nome\" ({$c['nome']}), etapa {$b['etapa']}: " . mb_substr($s['erro'], 0, 200), ['jobId' => $j['id'], 'canalId' => $c['id'], 'tipo' => 'erro']); }
		else {
			$s['estado'] = !empty($j['gates'][$b['etapa']]) ? 'aprovacao' : 'feito'; $s['feedback'] = '';
			if (!empty($b['revisao'])) {
				$s['nota'] = $b['revisao']['nota'] ?? null; $s['problemas'] = $b['revisao']['problemas'] ?? [];
				if (!($s['nota'] >= $c['notaMinima'])) { $s['estado'] = 'aprovacao'; $s['motivo'] = "Nota {$s['nota']} (mínimo {$c['notaMinima']}): " . (implode('; ', $s['problemas']) ?: 'ver log'); }
				elseif ($s['problemas']) $s['motivo'] = "Nota {$s['nota']}. Ajustes feitos: " . implode('; ', $s['problemas']);
			}
			if ($b['etapa'] === 'narracao' && !empty($j['duracao'])) {
				$alvo = $j['formato'] === 'longo' ? $c['duracaoLongo'] : $c['duracaoShort'];
				$s['motivo'] = number_format((float)$j['duracao'], 1) . " s (alvo $alvo s)";
				if ($j['formato'] !== 'longo' && $j['duracao'] > 70) $s['motivo'] .= ' — acima de 70 s mesmo após 3 encurtamentos automáticos';
			}
			if ($s['estado'] === 'aprovacao') avisar($u['id'], "\"$nome\" ({$c['nome']}) está esperando sua aprovação na etapa " . nomeEtapa($b['etapa']) . '.' . ($s['motivo'] ? ' ' . $s['motivo'] : ''), ['jobId' => $j['id'], 'canalId' => $c['id'], 'tipo' => 'aviso']);
			if (!empty($b['youtubeUrl'])) { avisar($u['id'], "Publicado em {$c['nome']}: $nome — {$b['youtubeUrl']}", ['jobId' => $j['id'], 'canalId' => $c['id']]); criarTeste($j); }
		}
		recalcular($j); salvar(); responder(['ok' => 1]);
	}
	// Kit do projeto (o conector baixa na pasta escolhida e atualiza quando muda)
	if ($sub === 'kit-versao') { header('Content-Type: text/plain'); echo is_file(DADOS . '/kit-versao.txt') ? trim(file_get_contents(DADOS . '/kit-versao.txt')) : ''; exit; }
	if ($sub === 'kit') enviarArquivo(is_file(DADOS . '/kit.zip') ? DADOS . '/kit.zip' : null, 'application/zip');
	if (preg_match('#^audio/(\w+)$#', $sub, $mm)) { $i = jobIdx($mm[1], $u); enviarArquivo($i !== null && $db['jobs'][$i]['audioUpload'] ? DADOS . '/uploads/' . $db['jobs'][$i]['audioUpload'] : null, 'application/octet-stream'); }
	if (preg_match('#^video/(\w+)$#', $sub, $mm) && $m === 'PUT') {
		$i = jobIdx($mm[1], $u); if ($i === null) responder([], 404);
		$parte = (int)($_GET['parte'] ?? 0); $total = max(1, (int)($_GET['total'] ?? 1)); $tmp = DADOS . '/uploads/' . $mm[1] . '-envio.part';
		flock($LOCK, LOCK_UN); $in = fopen('php://input', 'rb'); $out = fopen($tmp, $parte === 0 ? 'wb' : 'ab'); stream_copy_to_stream($in, $out); fclose($in); fclose($out); flock($LOCK, LOCK_EX);
		if ($parte + 1 < $total) responder(['ok' => 1, 'parte' => $parte]);
		$nome = $mm[1] . '-' . bin2hex(random_bytes(6)) . '.mp4'; rename($tmp, DADOS . "/uploads/$nome.part");
		$db = ler('db', $db); $i = jobIdx($mm[1], $u); rename(DADOS . "/uploads/$nome.part", DADOS . "/uploads/$nome");
		if ($i !== null) { if ($db['jobs'][$i]['mp4Upload']) @unlink(DADOS . '/uploads/' . $db['jobs'][$i]['mp4Upload']); $db['jobs'][$i]['mp4Upload'] = $nome; } salvar(); responder(['ok' => 1]);
	}
	if (preg_match('#^voz/(\w+)$#', $sub, $mm) && $m === 'PUT') {
		$i = jobIdx($mm[1], $u); if ($i === null) responder([], 404);
		$nome = $mm[1] . '-tts-' . bin2hex(random_bytes(6)) . '.mp3'; flock($LOCK, LOCK_UN); receberArquivo(DADOS . "/uploads/$nome"); flock($LOCK, LOCK_EX);
		$db = ler('db', $db); $i = jobIdx($mm[1], $u);
		if ($i !== null) { if (!empty($db['jobs'][$i]['audioGerado'])) @unlink(DADOS . '/uploads/' . $db['jobs'][$i]['audioGerado']); $db['jobs'][$i]['audioGerado'] = $nome; } salvar(); responder(['ok' => 1]);
	}
	if (preg_match('#^thumb/(\w+)/([1-3])$#', $sub, $mm) && $m === 'PUT') {
		$i = jobIdx($mm[1], $u); if ($i === null) responder([], 404);
		$nome = "{$mm[1]}-thumb{$mm[2]}-" . bin2hex(random_bytes(4)) . '.jpg'; receberArquivo(DADOS . "/uploads/$nome");
		if (filesize(DADOS . "/uploads/$nome") > 2 * 1024 * 1024) { @unlink(DADOS . "/uploads/$nome"); responder(['erro' => 'thumbnail acima de 2 MB'], 400); }
		$k = (int)$mm[2] - 1; $old = $db['jobs'][$i]['thumbs'][$k] ?? null; if ($old) @unlink(DADOS . "/uploads/$old");
		$db['jobs'][$i]['thumbs'] ??= []; $db['jobs'][$i]['thumbs'][$k] = $nome; ksort($db['jobs'][$i]['thumbs']); salvar(); responder(['ok' => 1]);
	}
	responder(['erro' => 'rota'], 404);
}

// ── sessão / login ──
if ($rota === 'sessao') responder(['usuario' => pubUsuario(sessao()), 'precisaSetup' => !$db['usuarios']]);
if ($rota === 'setup' && $m === 'POST') {
	if ($db['usuarios']) responder(['erro' => 'já configurado'], 400);
	$b = corpo(); if (empty($b['login']) || strlen((string)($b['senha'] ?? '')) < 8) responder(['erro' => 'login e senha (mín. 8 caracteres)'], 400);
	$u = novoUsuario($b + ['admin' => true]); $db['usuarios'][0]['admin'] = true;
	foreach ($db['canais'] as &$c) $c['dono'] ??= $u['id']; unset($c);
	salvar(); abrirSessao($db['usuarios'][0]);
}
if ($rota === 'login' && $m === 'POST') {
	$ip = $_SERVER['REMOTE_ADDR'] ?? '?'; $t = array_values(array_filter($db['tentativas'][$ip] ?? [], fn($x) => time() - $x < 600));
	if (count($t) >= 10) responder(['erro' => 'muitas tentativas; espere 10 minutos'], 429);
	$b = corpo(); $login = strtolower(trim((string)($b['login'] ?? ''))); $u = null;
	foreach ($db['usuarios'] as $x) if ($x['login'] === $login) $u = $x;
	if (!$u || !password_verify((string)($b['senha'] ?? ''), $u['hash'])) { $t[] = time(); $db['tentativas'][$ip] = $t; salvar(); responder(['erro' => 'login ou senha errados'], 401); }
	abrirSessao($u);
}
if ($rota === 'logout') { setcookie('mg', '', ['expires' => 1, 'path' => rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\') . '/']); responder([]); }

// Volta do Google
if ($rota === 'youtube/callback') {
	[$cid, $uid, $sig] = array_pad(explode('.', $_GET['state'] ?? ''), 3, ''); $u = &usuario($uid); $c = &canal($cid); $volta = urlBase() . '/';
	if (!$u || !$c || ($c['dono'] ?? '') !== $u['id'] || !hash_equals(assinar("$cid.$uid"), $sig)) redirecionar($volta . '#erro-youtube');
	if (!empty($_GET['error'])) redirecionar($volta . '#youtube-cancelado');
	$g = googleDe($u);
	$ch = curl_init('https://oauth2.googleapis.com/token');
	curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20, CURLOPT_POSTFIELDS => http_build_query(['code' => $_GET['code'] ?? '', 'client_id' => $g['clientId'], 'client_secret' => $g['clientSecret'], 'redirect_uri' => urlBase() . '/api/youtube/callback', 'grant_type' => 'authorization_code'])]);
	$r = json_decode((string)curl_exec($ch), true) ?: []; curl_close($ch);
	if (empty($r['refresh_token'])) { avisar($u['id'], "Falha ao conectar o YouTube ({$c['nome']}): " . ($r['error_description'] ?? $r['error'] ?? 'o Google não devolveu refresh_token'), ['tipo' => 'erro', 'canalId' => $c['id']]); redirecionar($volta . '#erro-youtube'); }
	$ch = curl_init('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true'); curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20, CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $r['access_token']]]);
	$it = (json_decode((string)curl_exec($ch), true)['items'][0] ?? null); curl_close($ch);
	$c['youtube']['conexao'] = ['refresh' => $r['refresh_token'], 'canalYT' => $it ? ['id' => $it['id'], 'titulo' => $it['snippet']['title']] : ['id' => '', 'titulo' => '(canal não identificado)'], 'em' => agora()];
	$c['youtube']['ativo'] = true; avisar($u['id'], "YouTube conectado ao canal {$c['nome']}: {$c['youtube']['conexao']['canalYT']['titulo']}.", ['canalId' => $c['id']]);
	salvar(); redirecionar($volta . '#youtube-ok');
}

$u = sessao(); if (!$u) responder(['erro' => 'login', 'login' => true], 401);
$uIdx = array_search($u['id'], array_column($db['usuarios'], 'id'), true); $U = &$db['usuarios'][$uIdx];
$meus = idsMeus($u);
$meuCanal = function (?string $id) use ($meus) { return in_array($id, $meus, true); };

if ($rota === 'estado') {
	$jobs = array_values(array_filter($db['jobs'], fn($j) => in_array($j['canalId'], $meus, true)));
	$estoque = []; foreach ($meus as $cid) $estoque[$cid] = 0;
	foreach ($jobs as $j) { $e = etapaAtual($j); if ($j['status'] === 'ativo' && $e && $e['id'] === 'publicar' && !$j['publicarEm']) $estoque[$j['canalId']]++; }
	$av = array_reverse(array_slice(array_values(array_filter($db['avisos'], fn($a) => $a['userId'] === $u['id'])), -40));
	$pesq = array_reverse(array_slice(array_values(array_filter($db['pesquisas'], fn($q) => in_array($q['canalId'], $meus, true))), -60));
	foreach ($pesq as &$q) { $q['log'] = array_slice($q['log'], -60); $q['temDocs'] = isset($q['docs']); unset($q['docs']); } unset($q);
	responder(['usuario' => pubUsuario($u), 'agente' => agenteDe($u), 'jobs' => array_map('resumo', array_reverse($jobs)),
		'regras' => array_values(array_filter($db['regras'], fn($r) => in_array($r['canalId'], $meus, true))), 'temas' => array_values(array_filter($db['temas'], fn($t) => in_array($t['canalId'], $meus, true) && empty($t['usado']))), 'stats' => estatisticas($meus),
		'pesquisas' => $pesq, 'proximas' => proximasExecucoes($u), 'canais' => array_map('canalPub', meusCanais($u)), 'estilos' => $db['estilos'], 'agora' => horaLocal(),
		'avisos' => $av, 'naoLidos' => count(array_filter($av, fn($a) => !$a['lido'])), 'estoque' => $estoque ?: new stdClass]);
}
// ── testes de thumbnail ──
if ($rota === 'testes' && $m === 'GET') {
	$tem = array_column($db['testes'], 'jobId');
	$espera = array_values(array_map(fn($j) => ['jobId' => $j['id'], 'canalId' => $j['canalId'], 'titulo' => ($j['youtube']['titulo'] ?: $j['tema']), 'thumbs' => count(array_filter((array)$j['thumbs'])), 'status' => $j['status'], 'url' => $j['youtube']['url']],
		array_filter($db['jobs'], fn($j) => in_array($j['canalId'], $meus, true) && $j['formato'] === 'longo' && array_filter((array)($j['thumbs'] ?? [])) && !in_array($j['id'], $tem, true) && $j['status'] !== 'cancelado')));
	$ts = array_values(array_map(fn($t) => array_merge($t, ['thumbs' => count($t['thumbs'])]), array_filter($db['testes'], fn($t) => in_array($t['canalId'], $meus, true))));
	responder(['testes' => array_reverse($ts), 'espera' => array_reverse($espera), 'hoje' => horaLocal()['data'], 'dias' => TESTE_DIAS, 'atraso' => TESTE_ATRASO]);
}
if ($rota === 'testes/thumb') { // ?job=ID&n=1..3
	$i = null; foreach ($db['jobs'] as $k => $j) if ($j['id'] === ($_GET['job'] ?? '') && in_array($j['canalId'], $meus, true)) $i = $k;
	$f = $i === null ? null : ($db['jobs'][$i]['thumbs'][(int)($_GET['n'] ?? 1) - 1] ?? null);
	header('Cache-Control: private, max-age=86400'); enviarArquivo($f ? DADOS . "/uploads/$f" : null, 'image/jpeg');
}
if ($rota === 'testes/acao' && $m === 'POST') {
	$b = corpo(); $t = &achar($db['testes'], fn($x) => $x['id'] === ($b['id'] ?? '') && in_array($x['canalId'], $meus, true)); if (!$t) responder([], 404);
	$c = &canal($t['canalId']); $h = horaLocal();
	try {
		if ($b['acao'] === 'avancar' && $t['estado'] === 'ativo') { $t['fases'][$t['atual']]['fim'] = min($t['fases'][$t['atual']]['fim'], dataMais($h['data'], -1)); $t['tentativa'] = 0; $t['coleta'] = ''; logTeste($t, 'Semana encerrada antes por você.'); }
		elseif ($b['acao'] === 'escolher') { $n = (int)($b['n'] ?? 0); if ($n < 0 || $n >= count($t['thumbs'])) responder(['erro' => 'thumbnail inválida'], 400); decidirTeste($t, $c, $n); }
		elseif ($b['acao'] === 'atualizar') { coletarTeste($t, $c, $h['data']); }
		elseif ($b['acao'] === 'cancelar') { $t['estado'] = 'cancelado'; logTeste($t, 'Teste cancelado por você.'); }
		elseif ($b['acao'] === 'retomar') { $t['estado'] = 'ativo'; $t['tentativa'] = 0; $t['erro'] = ''; }
	} catch (Exception $e) { salvar(); responder(['erro' => $e->getMessage()], 502); }
	salvar(); responder(['ok' => 1]);
}
if ($rota === 'testes/criar' && $m === 'POST') { // vídeo já publicado antes de existir o teste, ou url colada à mão
	$i = jobIdx(corpo()['jobId'] ?? null, $u); if ($i === null) responder([], 404);
	if (!idVideo($db['jobs'][$i]['youtube']['url'] ?? '')) responder(['erro' => 'O vídeo ainda não tem link do YouTube.'], 400);
	criarTeste($db['jobs'][$i]); responder(['ok' => 1]);
}
if ($rota === 'conector') { // instalador do agente para Windows, já com o token desta pessoa
	$nome = preg_replace('/[^\p{L}\p{N} ._-]/u', '', (string)$U['nome']) ?: $U['login'];
	$cmd = str_replace(['{{PAINEL}}', '{{TOKEN}}', '{{NOME}}'], [urlBase(), $U['tokenAgente'], $nome], file_get_contents(__DIR__ . '/conector.cmd.txt'));
	header('Content-Type: application/octet-stream'); header('Content-Disposition: attachment; filename="Conectar-Estudio.cmd"'); header('Cache-Control: no-store');
	echo str_replace("\n", "\r\n", str_replace("\r\n", "\n", $cmd)); exit;
}
if ($rota === 'avisos/lidos' && $m === 'POST') { foreach ($db['avisos'] as &$a) if ($a['userId'] === $u['id']) $a['lido'] = true; unset($a); salvar(); responder(['ok' => 1]); }
if ($rota === 'avisos/teste' && $m === 'POST') { avisar($u['id'], 'Teste de aviso: se chegou no Telegram/webhook, está funcionando.'); responder(['ok' => 1]); }

if ($rota === 'eu' && $m === 'GET') responder(contaPub($u) + ['etapas' => $ETAPAS, 'gatesIds' => GATES, 'promptsPadrao' => $PROMPTS, 'prompts' => $cfg['prompts'] ?: new stdClass, 'fuso' => $cfg['fuso'], 'urlPublica' => $cfg['urlPublica'], 'googleGlobal' => !empty($cfg['google']['clientId']), 'redirect' => urlBase() . '/api/youtube/callback']);
if ($rota === 'eu' && $m === 'PATCH') {
	$b = corpo();
	if (!empty($b['nome'])) $U['nome'] = $b['nome'];
	if (!empty($b['novaSenha'])) { if (!password_verify((string)($b['senhaAtual'] ?? ''), $U['hash'])) responder(['erro' => 'senha atual errada'], 400); if (strlen($b['novaSenha']) < 8) responder(['erro' => 'senha nova: mínimo 8 caracteres'], 400); $U['hash'] = password_hash($b['novaSenha'], PASSWORD_DEFAULT); }
	if (isset($b['prefs'])) foreach (array_keys(PREFS) as $k) if (array_key_exists($k, $b['prefs'])) $U['prefs'][$k] = $b['prefs'][$k];
	if (isset($b['avisos'])) $U['avisos'] = array_merge($U['avisos'], $b['avisos']);
	if (isset($b['google'])) { $U['google']['clientId'] = trim($b['google']['clientId'] ?? ''); if (!empty($b['google']['clientSecret'])) $U['google']['clientSecret'] = trim($b['google']['clientSecret']); if (!$U['google']['clientId']) $U['google']['clientSecret'] = ''; }
	if (!empty($b['novoToken'])) $U['tokenAgente'] = b64u(random_bytes(24));
	salvar(); responder(contaPub($U));
}
if (str_starts_with($rota, 'usuarios') || $rota === 'global') {
	if (!$u['admin']) responder(['erro' => 'só administrador'], 403);
	if ($rota === 'global' && $m === 'PATCH') {
		$b = corpo(); foreach (['fuso', 'urlPublica', 'prompts'] as $k) if (array_key_exists($k, $b)) $cfg[$k] = $b[$k];
		if (!empty($b['google']['clientId'])) { $cfg['google']['clientId'] = trim($b['google']['clientId']); if (!empty($b['google']['clientSecret'])) $cfg['google']['clientSecret'] = trim($b['google']['clientSecret']); }
		$cfg['prompts'] = $cfg['prompts'] ?: new stdClass; gravar('config', $cfg); responder(['ok' => 1]);
	}
	if ($rota === 'usuarios' && $m === 'GET') responder(array_map(fn($x) => pubUsuario($x) + ['canais' => count(meusCanais($x)), 'agente' => agenteDe($x)['online']], $db['usuarios']));
	if ($rota === 'usuarios' && $m === 'POST') {
		$b = corpo(); $login = strtolower(trim((string)($b['login'] ?? '')));
		if (!$login || strlen((string)($b['senha'] ?? '')) < 8) responder(['erro' => 'login e senha (mín. 8 caracteres)'], 400);
		foreach ($db['usuarios'] as $x) if ($x['login'] === $login) responder(['erro' => 'login já existe'], 400);
		responder(pubUsuario(novoUsuario(['login' => $login, 'senha' => $b['senha'], 'nome' => $b['nome'] ?? '', 'admin' => !empty($b['admin'])])));
	}
	if (preg_match('#^usuarios/(\w+)$#', $rota, $mm)) {
		$ai = array_search($mm[1], array_column($db['usuarios'], 'id'), true); if ($ai === false) responder([], 404); $A = &$db['usuarios'][$ai]; $b = corpo();
		if ($m === 'PATCH') { if (!empty($b['senha'])) { if (strlen($b['senha']) < 8) responder(['erro' => 'mínimo 8 caracteres'], 400); $A['hash'] = password_hash($b['senha'], PASSWORD_DEFAULT); } if (array_key_exists('admin', $b) && $A['id'] !== $u['id']) $A['admin'] = (bool)$b['admin']; if (!empty($b['nome'])) $A['nome'] = $b['nome']; salvar(); responder(pubUsuario($A)); }
		if ($m === 'DELETE') { if ($A['id'] === $u['id']) responder(['erro' => 'não dá para apagar a si mesmo'], 400); if (meusCanais($A)) responder(['erro' => 'o usuário ainda tem canais'], 400); array_splice($db['usuarios'], $ai, 1); salvar(); responder(['ok' => 1]); }
	}
}

if ($rota === 'youtube/conectar') {
	$c = &canal($_GET['canal'] ?? ''); $g = googleDe($u);
	if (!$c || !$meuCanal($c['id'])) responder(['erro' => 'canal'], 404);
	if (empty($g['clientId'])) redirecionar(urlBase() . '/#youtube-sem-cliente');
	redirecionar('https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query(['client_id' => $g['clientId'], 'redirect_uri' => urlBase() . '/api/youtube/callback', 'response_type' => 'code', 'access_type' => 'offline', 'prompt' => 'consent select_account',
		'scope' => 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly', 'state' => "{$c['id']}.{$u['id']}." . assinar("{$c['id']}.{$u['id']}")]));
}
if ($rota === 'youtube/desconectar' && $m === 'POST') { $c = &canal(corpo()['canalId'] ?? ''); if (!$c || !$meuCanal($c['id'])) responder([], 404); $c['youtube']['conexao'] = null; $c['youtube']['ativo'] = false; salvar(); responder(['ok' => 1]); }

// canais
if ($rota === 'canais' && $m === 'POST') {
	$b = corpo(); unset($b['youtube'], $b['dono'], $b['id']);
	$c = array_merge(['id' => substr(slugify($b['nome'] ?? 'canal'), 0, 24) . '-' . bin2hex(random_bytes(2))], canalPadrao($b), ['principal' => false, 'dono' => $u['id']]);
	$c['youtube']['token'] = "tokens/{$c['id']}.json"; $db['canais'][] = $c; salvar(); responder(canalPub($c));
}
// Pilotos automáticos do canal
if (preg_match('#^canais/([\w-]+)/pilotos(?:/([\w-]+))?(/pesquisar)?$#', $rota, $mm)) {
	if (!$meuCanal($mm[1])) responder([], 404); $c = &canal($mm[1]);
	if (empty($mm[2]) && $m === 'POST') { $p = limparPiloto(corpo(), pilotoPadrao(['estilos' => $c['estilos']])); naoRetroagirPiloto($p); $c['pilotos'][] = $p; salvar(); responder($p); }
	$k = null; foreach ($c['pilotos'] as $i => $x) if ($x['id'] === ($mm[2] ?? '')) $k = $i; if ($k === null) responder(['erro' => 'piloto'], 404);
	$p = &$c['pilotos'][$k];
	if (!empty($mm[3])) { $q = pedirPesquisa($c, $p, 'pedida manualmente'); salvar(); $q ? responder($q) : responder(['erro' => 'já existe uma pesquisa em andamento para este piloto'], 400); }
	if ($m === 'PATCH') { $b = corpo(); $antes = $p['horarios']; $p = limparPiloto($b, $p); if (isset($b['horarios']) && $antes !== $p['horarios']) { $p['ultimas'] = []; naoRetroagirPiloto($p); } salvar(); responder($p); }
	if ($m === 'DELETE') { $pid = $p['id']; unset($p); array_splice($c['pilotos'], $k, 1);
		$db['temas'] = array_values(array_filter($db['temas'], fn($t) => !(($t['pilotoId'] ?? null) === $pid && empty($t['usado'])))); salvar(); responder(['ok' => 1]); }
}
if (preg_match('#^canais/([\w-]+)$#', $rota, $mm)) {
	if (!$meuCanal($mm[1])) responder([], 404); $c = &canal($mm[1]);
	if ($m === 'PATCH') {
		$b = corpo(); unset($b['id'], $b['principal'], $b['dono'], $b['pilotos'], $b['piloto']);
		if (isset($b['youtube'])) { $cx = $c['youtube']['conexao']; $c['youtube'] = array_merge($c['youtube'], $b['youtube']); $c['youtube']['conexao'] = $cx; unset($b['youtube']); }
		foreach ($b as $k => $v) $c[$k] = $v; salvar(); responder(canalPub($c));
	}
	if ($m === 'DELETE') {
		if (!empty($c['principal'])) responder(['erro' => 'o canal principal não pode ser apagado'], 400);
		foreach ($db['jobs'] as $j) if ($j['canalId'] === $c['id'] && $j['status'] === 'ativo') responder(['erro' => 'o canal tem vídeos em produção'], 400);
		$id = $c['id']; unset($c);
		$db['canais'] = array_values(array_filter($db['canais'], fn($x) => $x['id'] !== $id)); $db['regras'] = array_values(array_filter($db['regras'], fn($r) => $r['canalId'] !== $id)); $db['temas'] = array_values(array_filter($db['temas'], fn($t) => $t['canalId'] !== $id));
		salvar(); responder(['ok' => 1]);
	}
}
if (preg_match('#^pesquisas/(\w+)$#', $rota, $mm) && $m === 'GET') {
	foreach ($db['pesquisas'] as $q) if ($q['id'] === $mm[1] && $meuCanal($q['canalId'])) responder($q);
	responder([], 404);
}
if (preg_match('#^pesquisas/(\w+)$#', $rota, $mm) && $m === 'DELETE') {
	foreach ($db['pesquisas'] as $k => $q) if ($q['id'] === $mm[1] && $meuCanal($q['canalId'])) { if ($q['estado'] === 'rodando') cancelarId($u['id'], $q['id']); array_splice($db['pesquisas'], $k, 1); salvar(); responder(['ok' => 1]); }
	responder([], 404);
}

// estilos (compartilhados)
if ($rota === 'estilos' && $m === 'POST') { $b = corpo(); $e = array_merge(['id' => substr(slugify($b['nome'] ?? 'estilo'), 0, 20) . '-' . bin2hex(random_bytes(2)), 'cor' => '#8b7cff', 'ativo' => true, 'referencia' => '', 'desc' => '', 'guia' => ''], $b); $db['estilos'][] = $e; salvar(); responder($e); }
if (preg_match('#^estilos/([\w-]+)$#', $rota, $mm)) {
	$k = array_search($mm[1], array_column($db['estilos'], 'id'), true); if ($k === false) responder([], 404);
	if ($m === 'PATCH') { $b = corpo(); unset($b['id']); $db['estilos'][$k] = array_merge($db['estilos'][$k], $b); salvar(); responder($db['estilos'][$k]); }
	if ($m === 'DELETE') { array_splice($db['estilos'], $k, 1); foreach ($db['canais'] as &$c) $c['estilos'] = array_values(array_diff($c['estilos'], [$mm[1]])); unset($c); salvar(); responder(['ok' => 1]); }
}

if (($rota === 'lote' || $rota === 'jobs') && $m === 'POST') { $b = corpo(); if (!$meuCanal($b['canalId'] ?? '')) responder(['erro' => 'canal'], 400); responder(['ids' => criarLote($b)]); }

if (preg_match('#^jobs/(\w+)(/[\w-]+)?$#', $rota, $mm)) {
	$i = jobIdx($mm[1], $u); if ($i === null) responder(['erro' => 'não existe'], 404);
	$j = &$db['jobs'][$i]; $sub = $mm[2] ?? '';
	if (!$sub && $m === 'GET') { $a = etapaAtual($j); responder($j + ['base' => base($j), 'atual' => $a['id'] ?? null, 'temVideo' => !empty($j['mp4Upload']) || !empty($j['mp4Local']), 'temVoz' => !empty($j['audioUpload']) || !empty($j['audioGerado'])]); }
	if (!$sub && $m === 'DELETE') { if ($j['mp4Upload']) @unlink(DADOS . '/uploads/' . $j['mp4Upload']); if ($j['audioUpload']) @unlink(DADOS . '/uploads/' . $j['audioUpload']); if (!empty($j['audioGerado'])) @unlink(DADOS . '/uploads/' . $j['audioGerado']); cancelarId($u['id'], $j['id']); unset($j); array_splice($db['jobs'], $i, 1); salvar(); responder(['ok' => 1]); }
	if (!$sub && $m === 'PATCH') {
		$b = corpo();
		foreach (['instrucoes', 'gates', 'narracao', 'publicarEm', 'estilo'] as $k) if (array_key_exists($k, $b)) $j[$k] = $b[$k];
		if (array_key_exists('tema', $b) && !$j['nn']) { $j['tema'] = $b['tema']; $j['slug'] = slugify($b['tema']); }
		if (isset($b['youtube'])) { $j['youtube'] = array_merge($j['youtube'], $b['youtube']); $j['youtube']['editado'] = true; }
		if (!empty($b['status']) && in_array($b['status'], ['ativo', 'pausado', 'cancelado'])) { $j['status'] = $b['status']; if ($b['status'] !== 'ativo') cancelarId($u['id'], $j['id']); }
		recalcular($j); salvar(); responder(['ok' => 1]);
	}
	if ($sub === '/acao') {
		$b = corpo(); $et = $b['etapa'] ?? ''; $idx = array_search($et, $IDS_ETAPAS, true); $tem = isset($j['etapas'][$et]);
		if ($tem) $s = &$j['etapas'][$et];
		if ($b['acao'] === 'aprovar' && $tem) { $s['estado'] = 'feito'; $s['motivo'] = ''; }
		if ($b['acao'] === 'pular' && $tem) { if ($s['estado'] === 'rodando') cancelarId($u['id'], $j['id']); $s['estado'] = 'pulado'; }
		if ($b['acao'] === 'refazer' && $tem) {
			$j['status'] = 'ativo'; if ($s['estado'] === 'rodando') cancelarId($u['id'], $j['id']);
			$s['feedback'] = $b['feedback'] ?? ''; $s['estado'] = 'pendente'; $s['erro'] = ''; $s['motivo'] = ''; if ($et === 'tema') $j['tema'] = '';
			foreach (array_slice($IDS_ETAPAS, $idx + 1) as $k) if ($j['etapas'][$k]['estado'] !== 'pulado') { $j['etapas'][$k]['estado'] = 'pendente'; $j['etapas'][$k]['motivo'] = ''; }
			$j['youtube']['url'] = '';
		}
		if ($b['acao'] === 'parar') { cancelarId($u['id'], $j['id']); if ($tem && $s['estado'] === 'rodando') { $s['estado'] = 'erro'; $s['erro'] = 'Parado pelo autor.'; } }
		if ($b['acao'] === 'publicar-agora') $j['publicarEm'] = agora();
		if ($b['acao'] === 'marcar-publicado') { $j['etapas']['publicar']['estado'] = 'feito'; if (!empty($b['url'])) { $j['youtube']['url'] = $b['url']; criarTeste($j); } }
		recalcular($j); salvar(); responder(['ok' => 1]);
	}
	if ($sub === '/arquivo' && $m === 'PUT') { $b = corpo(); $arqs = (array)$j['arquivos']; $arqs[$b['caminho']] = ['conteudo' => $b['conteudo'], 'em' => agora(), 'sujo' => true]; $j['arquivos'] = $arqs; salvar(); responder(['ok' => 1]); }
	if ($sub === '/audio' && $m === 'POST') {
		$ext = strtolower(pathinfo($_GET['nome'] ?? 'a.mp3', PATHINFO_EXTENSION) ?: 'mp3');
		if (!in_array($ext, ['mp3', 'wav', 'm4a', 'ogg', 'mp4', 'mov', 'webm'])) responder(['erro' => 'formato'], 400);
		$jid = $j['id']; unset($j); $nome = "$jid-voz-" . bin2hex(random_bytes(6)) . ".$ext";
		flock($LOCK, LOCK_UN); receberArquivo(DADOS . "/uploads/$nome"); flock($LOCK, LOCK_EX); $db = ler('db', $db);
		$i = jobIdx($jid, $u); if ($i === null) responder([], 404); $j = &$db['jobs'][$i];
		$j['audioUpload'] = $nome; $j['narracao'] = 'autor';
		if (in_array($j['etapas']['narracao']['estado'], ['aguardando', 'erro', 'feito', 'aprovacao'])) { $j['etapas']['narracao']['estado'] = 'pendente'; foreach (array_slice($IDS_ETAPAS, array_search('narracao', $IDS_ETAPAS) + 1) as $k) $j['etapas'][$k]['estado'] = 'pendente'; }
		if ($j['status'] === 'cancelado') $j['status'] = 'ativo'; recalcular($j); salvar(); responder(['ok' => 1]);
	}
	if ($sub === '/video') enviarArquivo($j['mp4Upload'] ? DADOS . '/uploads/' . $j['mp4Upload'] : null, 'video/mp4');
	if ($sub === '/voz') { $va = ($j['audioUpload'] ?? null) ?: ($j['audioGerado'] ?? null); enviarArquivo($va ? DADOS . '/uploads/' . $va : null, 'audio/mpeg'); }
}

if ($rota === 'regras' && $m === 'POST') { $r = array_merge(['id' => novoId('r'), 'ativo' => true, 'historico' => []], limparRegra(corpo(), $u)); if (!$r['canalId']) responder(['erro' => 'canal'], 400); naoRetroagir($r); $db['regras'][] = $r; salvar(); responder($r); }
if (preg_match('#^regras/(\w+)(/rodar)?$#', $rota, $mm)) {
	$k = null; foreach ($db['regras'] as $x => $r) if ($r['id'] === $mm[1] && $meuCanal($r['canalId'])) $k = $x; if ($k === null) responder([], 404);
	$r = &$db['regras'][$k];
	if (!empty($mm[2])) { executarRegra($r); salvar(); responder(['ok' => 1]); }
	if ($m === 'DELETE') { unset($r); array_splice($db['regras'], $k, 1); salvar(); responder(['ok' => 1]); }
	if ($m === 'PATCH') { $b = corpo(); $r = array_merge($r, limparRegra(array_merge($r, $b), $u)); if (array_key_exists('ativo', $b)) $r['ativo'] = (bool)$b['ativo']; if (!empty($b['hora'])) { $r['ultima'] = null; naoRetroagir($r); } salvar(); responder($r); }
}
if ($rota === 'historico') { // temas já usados + pesquisas de um piloto (ou do canal todo)
	$cid = $_GET['canal'] ?? ''; $pid = $_GET['piloto'] ?? null; if (!$meuCanal($cid)) responder([], 404);
	$doAlvo = fn($x) => $x['canalId'] === $cid && (!$pid || ($x['pilotoId'] ?? null) === $pid);
	$usados = array_reverse(array_values(array_filter($db['temas'], fn($t) => $doAlvo($t) && !empty($t['usado']))));
	$pesq = array_reverse(array_values(array_map(fn($q) => array_diff_key($q, ['log' => 1, 'docs' => 1]), array_filter($db['pesquisas'], $doAlvo))));
	responder(['usados' => array_slice($usados, 0, 300), 'pesquisas' => array_slice($pesq, 0, 100)]);
}
if ($rota === 'temas' && $m === 'PUT') {
	$b = corpo(); $cid = $b['canalId'] ?? ''; if (!$meuCanal($cid)) responder([], 404);
	// substitui só a FILA (temas ainda não usados) de um piloto; o histórico de usados fica
	$pid = $b['pilotoId'] ?? null; $daFila = fn($t) => $t['canalId'] === $cid && ($t['pilotoId'] ?? null) === $pid && empty($t['usado']);
	$antigos = []; foreach ($db['temas'] as $t) if ($daFila($t)) $antigos[$t['tema']] = $t;
	$novos = []; foreach ($b['temas'] ?? [] as $t) { $tt = trim((string)($t['tema'] ?? '')); if (!$tt) continue; $novos[] = array_merge(['origem' => 'manual', 'criado' => agora()], $antigos[$tt] ?? [], ['tema' => $tt, 'canalId' => $cid, 'pilotoId' => $pid, 'usado' => false]); }
	$db['temas'] = array_merge(array_values(array_filter($db['temas'], fn($t) => !$daFila($t))), $novos); salvar(); responder(['ok' => 1]);
}
responder(['erro' => 'rota'], 404);
