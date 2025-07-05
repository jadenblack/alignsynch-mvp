# PowerShell script to promote Vercel deployment
# Usage: .\scripts\promote-deployment.ps1

Write-Host "🚀 Promoting Vercel deployment to production..." -ForegroundColor Green

# Set environment variables
$env:VERCEL_TOKEN = "LbPKppSqFGLflQH0MA4sTcIl"
$env:VERCEL_ORG_ID = "team_SLHxonjvWXqrbtXrMgxmcw9f"
$env:VERCEL_PROJECT_ID = "prj_c3PzVAMMpAaTG14WSZJomhCBEWop"

# Run the promotion script
try {
    node scripts/promote-deployment.js
    Write-Host "✅ Deployment promotion completed!" -ForegroundColor Green
} catch {
    Write-Host "❌ Deployment promotion failed: $_" -ForegroundColor Red
    exit 1
}
