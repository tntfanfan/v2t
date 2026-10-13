param([string]$DocumentPath, [string]$PdfPath)
$ErrorActionPreference = 'Stop'
$wordDemoApp = $null
$wordDemoDoc = $null
try {
    $wordDemoApp = New-Object -ComObject Word.Application
    $wordDemoApp.Visible = $false
    $wordDemoApp.DisplayAlerts = 0
    $wordDemoDoc = $wordDemoApp.Documents.Open($DocumentPath, $false, $true)
    $wordDemoDoc.ExportAsFixedFormat($PdfPath, 17)
    Write-Output "Rendered PDF: $PdfPath"
} finally {
    if ($null -ne $wordDemoDoc) { $wordDemoDoc.Close(0); [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($wordDemoDoc) }
    if ($null -ne $wordDemoApp) { $wordDemoApp.Quit(0); [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($wordDemoApp) }
}
