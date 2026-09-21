# One-shot backend setup for Windows PowerShell. Run from backend\:  .\setup.ps1
$ErrorActionPreference = "Stop"

Write-Host "==> Creating virtual environment"
python -m venv .venv

Write-Host "==> Installing dependencies"
.\.venv\Scripts\pip install --upgrade pip -q
.\.venv\Scripts\pip install -r requirements.txt

if (-Not (Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "==> Created .env -- open it and add your ANTHROPIC_API_KEY"
}

Write-Host "==> Creating database tables"
.\.venv\Scripts\python manage.py makemigrations accounts questions rounds
.\.venv\Scripts\python manage.py migrate

Write-Host "==> Seeding question bank"
.\.venv\Scripts\python manage.py seed_questions

Write-Host ""
Write-Host "Done. Next:"
Write-Host "  1. Add your ANTHROPIC_API_KEY to backend\.env"
Write-Host "  2. .\.venv\Scripts\activate"
Write-Host "  3. python manage.py runserver"
