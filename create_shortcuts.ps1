$WshShell = New-Object -ComObject WScript.Shell

# 1. Shortcut in the project folder
$projShortcut = $WshShell.CreateShortcut("$PSScriptRoot\Supermarket-POS.lnk")
$projShortcut.TargetPath = "$PSScriptRoot\Supermarket-POS.exe"
$projShortcut.WorkingDirectory = "$PSScriptRoot"
$projShortcut.Description = "Supermarket POS & Management System"
$projShortcut.Save()

# 2. Shortcut on the user's Desktop
$desktopPath = [System.Environment]::GetFolderPath('Desktop')
if (Test-Path $desktopPath) {
    $deskShortcut = $WshShell.CreateShortcut("$desktopPath\Supermarket POS.lnk")
    $deskShortcut.TargetPath = "$PSScriptRoot\Supermarket-POS.exe"
    $deskShortcut.WorkingDirectory = "$PSScriptRoot"
    $deskShortcut.Description = "Supermarket POS & Management System"
    $deskShortcut.Save()
}

Write-Output "Shortcuts created successfully."
