$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location -Path $projectPath
$since = [datetime]::Parse('2026-05-20')
$files = Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime.Date -eq $since.Date }
if (-not $files) { '[]' | Out-File -FilePath (Join-Path $projectPath 'modified_2026-05-20.json') -Encoding utf8 }
else {
    $groups = $files | Group-Object DirectoryName | Sort-Object Count -Descending | Select-Object @{Name='Directory';Expression={$_.Name}},Count
    $top = $files | Sort-Object LastWriteTime -Descending | Select-Object FullName,LastWriteTime
    $out = @{ groups = $groups; top = $top }
    $out | ConvertTo-Json -Depth 5 | Out-File -FilePath (Join-Path $projectPath 'modified_2026-05-20.json') -Encoding utf8
}
Write-Output "WROTE: modified_2026-05-20.json"
