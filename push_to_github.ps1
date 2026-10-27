# Script pour pousser le monorepo finalisé sur GitHub
Set-Location "C:\Users\Liberty Ride\.gemini\antigravity\scratch\Liberty-Ride-Mono"

Write-Host "Initialisation Git et Push vers GitHub..." -ForegroundColor Cyan

if (!(Test-Path ".git")) {
    git init
    git remote add origin https://github.com/nkytransportationlibertyride-tech/Liberty-Ride-Mono.git
}

git branch -M main
git add .
git commit -m "feat(monorepo): remplacement des apps par les interfaces finales Stitch/AI Studio (Jules-ready)"
git push -u origin main --force

Write-Host "`n>>> DÉPLOIEMENT GITHUB EFFECTUÉ AVEC SUCCÈS !" -ForegroundColor Green
Write-Host "Vercel va automatiquement lancer les builds de vos surfaces." -ForegroundColor Yellow
