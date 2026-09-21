#!/usr/bin/env bash
# One-shot backend setup. Run from the backend/ directory:  bash setup.sh
set -e

echo "==> Creating virtual environment"
python3 -m venv .venv

echo "==> Installing dependencies"
./.venv/bin/pip install --upgrade pip -q
./.venv/bin/pip install -r requirements.txt

if [ ! -f .env ]; then
  cp .env.example .env
  echo "==> Created .env -- open it and add your ANTHROPIC_API_KEY before running the server"
fi

echo "==> Creating database tables"
./.venv/bin/python manage.py makemigrations accounts questions rounds
./.venv/bin/python manage.py migrate

echo "==> Seeding question bank"
./.venv/bin/python manage.py seed_questions

echo ""
echo "Done. Next:"
echo "  1. Add your ANTHROPIC_API_KEY to backend/.env"
echo "  2. source .venv/bin/activate"
echo "  3. python manage.py runserver"
