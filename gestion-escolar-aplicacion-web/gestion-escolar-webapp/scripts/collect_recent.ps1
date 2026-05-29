$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location -Path $projectRoot
$since = (Get-Date).AddDays(-2)
$files = Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -ge $since }
$outPath = Join-Path $projectRoot 'recent_modified.json'
if (-not $files) { '[]' | Out-File -FilePath $outPath -Encoding utf8 }
else {
    $groups = $files | Group-Object DirectoryName | Sort-Object Count -Descending | Select-Object @{Name='Directory';Expression={$_.Name}},Count
    $top = $files | Sort-Object LastWriteTime -Descending | Select-Object FullName,LastWriteTime
    $out = @{ groups = $groups; top = $top }
    $out | ConvertTo-Json -Depth 5 | Out-File -FilePath $outPath -Encoding utf8
}
Write-Output "WROTE: $outPath"
