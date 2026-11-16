# Conector do Estudio na bandeja do Windows (icones ocultos).
# Ao abrir, fecha qualquer conector/agente antigo e mantem o agente novo rodando (reinicia se cair).
# Menu do icone: Abrir painel, Ver log, Reiniciar, Fechar conector.
param([string]$Proj, [string]$Painel, [string]$Token, [string]$Log)
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -AssemblyName System.Windows.Forms, System.Drawing

# 1. So um conector por vez: derruba os antigos (bandeja, laco .cmd e node do agente)
function Matar-Antigos {
	Get-CimInstance Win32_Process | Where-Object {
		$_.ProcessId -ne $PID -and (
			$_.CommandLine -like '*agente.cjs*' -or
			$_.CommandLine -like '*estudio-agente.cmd*' -or
			$_.CommandLine -like '*bandeja.ps1*')
	} | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
}
Matar-Antigos

$script:filho = $null
$script:saindo = $false
function Iniciar-Agente {
	$psi = New-Object System.Diagnostics.ProcessStartInfo
	$psi.FileName = $env:ComSpec
	$psi.Arguments = "/c node painel\agente.cjs --painel `"$Painel`" --token `"$Token`" >> `"$Log`" 2>&1"
	$psi.WorkingDirectory = $Proj
	$psi.CreateNoWindow = $true
	$psi.UseShellExecute = $false
	$script:filho = [System.Diagnostics.Process]::Start($psi)
}
function Parar-Agente {
	if ($script:filho -and -not $script:filho.HasExited) { & taskkill /pid $script:filho.Id /T /F | Out-Null }
	$script:filho = $null
}

$icone = New-Object System.Windows.Forms.NotifyIcon
$node = (Get-Command node).Source
$icone.Icon = if ($node) { [System.Drawing.Icon]::ExtractAssociatedIcon($node) } else { [System.Drawing.SystemIcons]::Application }
$icone.Text = 'Estudio - conector ligado'
$menu = New-Object System.Windows.Forms.ContextMenuStrip
$menu.Items.Add('Abrir painel', $null, { Start-Process $Painel }) | Out-Null
$menu.Items.Add('Ver log', $null, { Start-Process notepad.exe "`"$Log`"" }) | Out-Null
$menu.Items.Add('Reiniciar conector', $null, { Parar-Agente; Iniciar-Agente; $icone.ShowBalloonTip(2000, 'Estudio', 'Conector reiniciado.', 'Info') }) | Out-Null
$menu.Items.Add('-') | Out-Null
$menu.Items.Add('Fechar conector', $null, {
	$script:saindo = $true; $relogio.Stop(); Parar-Agente
	$icone.Visible = $false; $icone.Dispose(); [System.Windows.Forms.Application]::Exit()
}) | Out-Null
$icone.ContextMenuStrip = $menu
$icone.add_DoubleClick({ Start-Process $Painel })
$icone.Visible = $true

# 2. Mantem o agente vivo: se cair, religa em 15 s
$script:caiuEm = $null
$relogio = New-Object System.Windows.Forms.Timer
$relogio.Interval = 3000
$relogio.add_Tick({
	if ($script:saindo) { return }
	if ($script:filho -and -not $script:filho.HasExited) { $script:caiuEm = $null; return }
	if (-not $script:caiuEm) { $script:caiuEm = Get-Date; $icone.Text = 'Estudio - religando...'; return }
	if (((Get-Date) - $script:caiuEm).TotalSeconds -ge 15) { $script:caiuEm = $null; Iniciar-Agente; $icone.Text = 'Estudio - conector ligado' }
})
Iniciar-Agente
$relogio.Start()
$icone.ShowBalloonTip(3000, 'Estudio', 'Conector ligado. Para fechar: clique com o botao direito neste icone.', 'Info')
[System.Windows.Forms.Application]::Run()
