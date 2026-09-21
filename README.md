# TWIN — Production Codebase

Meet the version of you built from your decisions.

This is the full implementation of the TWIN concept doc: a Django + DRF + PostgreSQL
backend and a React + Vite + Tailwind frontend, built around one non-negotiable rule —
**the AI's prediction is generated and locked to the database before the user's real
answer is ever accepted.** The server controls that sequence; the frontend has no way
to bypass or reorder it (see `backend/apps/rounds/views.py`, `StartRoundView` and
`SubmitRoundAnswerView`).

A standalone in-chat prototype of this same product (client-side only, no backend) was
built first to validate the UX — this codebase is the real thing, matching the
blueprint's architecture section exactly.

## Architecture

```
twin-production/
  backend/     Django 5 + DRF + PostgreSQL + JWT auth + Anthropic API
  frontend/    React 18 + Vite + Tailwind CSS
```

| Piece | Choice |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Django + Django REST Framework |
| Database | PostgreSQL |
| Auth | JWT (djangorestframework-simplejwt) |
| AI layer | Anthropic API (`anthropic` Python SDK), model `claude-sonnet-4-6` |

### Data model

`Question` · `Answer` · `Prediction` (locked, write-once) · `MatchResult` ·
`ProfileVersion` · `ConsentLog` · `UserProfile` (streaks, onboarding state) — this
maps directly onto the suggested data model in the product blueprint.

### The prediction lock, concretely

1. `POST /api/rounds/start/ {question_id}` — server builds the user's profile summary
   from their `Answer` history, calls the AI for a prediction, and **writes a
   `Prediction` row to Postgres** (hashed, marked locked) before returning. The
   response contains the question only — never the prediction.
2. Client shows the question, user types their real answer.
3. `POST /api/rounds/<prediction_id>/answer/ {text}` — server creates the `Answer`,
   scores it against the already-locked `Prediction`, creates the `MatchResult`, and
   reveals everything (prediction text, confidence, patterns, score, explanation) in
   one response.

If a request tries to submit an answer without a corresponding locked prediction, or
tries to answer a question twice, the API rejects it (409).

## Getting started

No Docker or Postgres install required to get running locally -- the backend
defaults to SQLite (a single file, nothing to install or start). Switch to
Postgres any time you want to match the production setup exactly (instructions
below the quickstart).

### 1. Backend

The fastest path -- one script does the venv, dependencies, migrations and seeding:

```bash
cd backend
bash setup.sh          # Windows PowerShell: .\setup.ps1
```

Then open `backend/.env`, paste in your `ANTHROPIC_API_KEY`, and:

```bash
source .venv/bin/activate      # Windows: .venv\Scripts\activate
python manage.py runserver
```

<details>
<summary>Or do it manually</summary>

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # then add your ANTHROPIC_API_KEY
python manage.py makemigrations accounts questions rounds
python manage.py migrate
python manage.py seed_questions
python manage.py createsuperuser   # optional, for /admin/
python manage.py runserver
```

Note the `makemigrations` step -- migration files aren't committed, so Django
needs to generate them once against your local database before `migrate` will
create the TWIN tables.

</details>

Backend runs at `http://localhost:8000`. This creates `backend/db.sqlite3` --
delete that file (and the generated `migrations/0001_initial.py` files) any time
to reset everything from scratch.

### Using Postgres instead (optional, matches production)

If you have Docker: `cd backend && docker compose up -d`. If not, install
Postgres natively and create a `twin`/`twin` db+user matching `.env.example`.
Either way, then in `backend/.env` set `DB_ENGINE=postgres`, run
`pip install -r requirements-postgres.txt`, and re-run `python manage.py migrate`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env          # defaults to http://localhost:8000/api
npm run dev
```

Frontend runs at `http://localhost:5173`.

### 3. Try it

Open `http://localhost:5173`, register an account, answer the 7 onboarding
questions, then run a prediction round. Check `/admin/` to see the locked
`Prediction` row appear before you ever submit your answer.

### Deploy to Render

The repository includes `render.yaml` for a free Render Blueprint deployment of the
Django API. Deploy the Vite frontend separately to Vercel. This free-only setup uses
SQLite on Render, so database data can be lost when the free service restarts or redeploys.

1. Push this repository to GitHub.
2. In Render, choose **New > Blueprint** and select the repository.
3. Enter `GEMINI_API_KEY` when Render prompts for the secret.
4. Deploy the Blueprint. The API runs migrations and seeds the question bank on startup.
5. Deploy `frontend/` as a Vercel Vite project with `VITE_API_BASE_URL` set to the
  Render API URL followed by `/api`.
6. Set Render's `CORS_ALLOWED_ORIGINS` to the Vercel URL and redeploy the API.

The Blueprint uses Gemini in production. Ollama remains a local-development fallback;
it is not available inside the Render service. Do not commit `.env`, API keys, `db.sqlite3`,
or `.venv` to the repository. If you rename either Render service, update
`VITE_API_BASE_URL`, `DJANGO_ALLOWED_HOSTS`, and `CORS_ALLOWED_ORIGINS` in Render's
environment settings to match the resulting URLs.

## Endless scenarios

The seeded bank holds 28 questions (7 onboarding + 21 round questions). Once a
user answers them all, the twin starts **writing its own** rather than dead-ending:

- `POST /api/questions/generate/` asks the AI for a fresh scenario, targeting the
  category where the twin's predictions have matched *worst* so far -- i.e. where
  a new question is most informative about what it doesn't understand yet.
- Generated questions are saved with `is_generated=True` and `created_for=<user>`,
  so they're scoped to the person they were written for and never leak into anyone
  else's rounds. `StartRoundView` enforces that scoping too.
- They then flow through the exact same prediction-lock path as seeded questions.

The "Surprise me" button on the dashboard triggers this on demand, even while
seeded questions remain.

## What's still v2/v3 scope

Per the blueprint's roadmap, not yet built: per-question-type scoring rubrics
(ranking similarity, numeric distance) beyond the current semantic scoring,
friend-to-friend prediction challenges, and a background job queue (Celery/RQ).
AI calls are deliberately synchronous -- the prediction-lock guarantee depends on
the server finishing them before it responds.

## Privacy

Data minimization, explicit consent logging (`ConsentLog`), full data export
(`GET /api/privacy/export/`), and full deletion (`DELETE /api/privacy/delete/`) are
implemented per the blueprint's privacy section. Deletion resets the TwinProfile and
wipes all answers/predictions/results, but keeps the login itself so the person isn't
locked out of their account.
