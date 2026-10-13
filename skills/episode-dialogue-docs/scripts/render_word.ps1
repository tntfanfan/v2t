param([Parameter(Mandatory=$true)][string]$DocumentPath, [Parameter(Mandatory=$true)][string]$PdfPath)
$ErrorActionPreference = 'Stop'
$episodeDocumentPath = (Resolve-Path -LiteralPath $DocumentPath).Path
$episodePdfPath = [System.IO.Path]::GetFullPath($PdfPath)
if (Test-Path -LiteralPath $episodePdfPath) { throw "Refusing to overwrite $episodePdfPath" }
[void][System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($episodePdfPath))
$episodeWordApp = $null
$episodeWordDoc = $null
try {
    $episodeWordApp = New-Object -ComObject Word.Application
    $episodeWordApp.Visible = $false
    $episodeWordApp.DisplayAlerts = 0
    $episodeWordDoc = $episodeWordApp.Documents.Open($episodeDocumentPath, $false, $true)
    $episodeWordDoc.ExportAsFixedFormat($episodePdfPath, 17)
    Write-Output "Rendered PDF: $episodePdfPath"
} finally {
    if ($null -ne $episodeWordDoc) { $episodeWordDoc.Close(0); [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($episodeWordDoc) }
    if ($null -ne $episodeWordApp) { $episodeWordApp.Quit(0); [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($episodeWordApp) }
}
