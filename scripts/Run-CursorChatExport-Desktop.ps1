# Invoked by Task Scheduler on the desktop. Appends to repo-root session-chat-export.md (shared with laptop; each run tags source: Desktop)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$env:CHAT_EXPORT_HANDOFF = Join-Path $repoRoot 'session-chat-export.md'
$env:CHAT_EXPORT_STATE_ID = 'desktop'
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) { Write-Error 'node is not on PATH.' }
& $nodeCmd.Source (Join-Path $repoRoot 'scripts\cursor-chat-export.mjs')
