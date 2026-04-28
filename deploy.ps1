param(
    [Parameter(Position = 0, ValueFromRemainingArguments = $true)]
    [string[]]$Message
)

# Build and deploy script for GitHub Pages
$CommitMessage = if ($Message.Count -gt 0) {
    $Message -join " "
} else {
    "Build and deploy"
}

Write-Host "Building project..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Committing changes..." -ForegroundColor Cyan
git add .
git commit -m $CommitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "Commit failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
git push

if ($LASTEXITCODE -eq 0) {
    Write-Host "Deploy successful! 🚀" -ForegroundColor Green
} else {
    Write-Host "Push failed!" -ForegroundColor Red
    exit 1
}
