# ⚡ PowerApp — Powerlifting Training Platform

> **Full-stack training management SaaS for powerlifters and their coaches.**  
> Plan periodized blocks, track execution set-by-set, visualize e1RM progression, monitor wellness, and log competition results — all in one dark-mode app.

---

## What is this?

PowerApp replaces spreadsheets and generic fitness apps for serious strength athletes. It is built around the **block periodization model**: a coach (or the athlete themselves) designs a multi-week training block with precise targets for each set — weight, reps, and RPE. The athlete then executes each session inside the app, logging actual numbers. Everything flows into analytics automatically.

It supports both **self-coached athletes** (create your own blocks) and the **coach → athlete workflow** (coach designs, athlete executes, coach monitors compliance and progression).

---

## Screenshots

> *(coming soon — dark UI, 3-panel block editor, SVG progress charts)*

---

## Feature Overview

### Training Block Management
- **3-step wizard** to create a block: configure name / weeks / days → build exercises per day → choose a progression strategy
- **3-panel editor** (days list | exercise cards with per-set targets | exercise history panel) — same paradigm as professional coaching software
- Progression strategies: **Same every week**, **RPE wave** (intensity peaking), **Volume wave** (accumulation)
- Copy exercises from a previous block with one click
- Full cascade delete (block → weeks → days → planned workouts → sets)
- Blocks list with start date, week count, objective tag, and quick edit/delete

### Session Execution
- Athlete sees their day's workout with planned weight × reps @ RPE
- Logs actual weight, reps, RPE per set
- **e1RM auto-calculated** on save (Brzycki + RPE formula)
- Weight cap notes visible per set (coach-defined ceiling, e.g. "100–120 kg")
- Personal notes per set
- Timestamp (`logged_at`) stored on every completed set for date-based analytics

### Analytics & Progress
- **Exercise selector** — only shows exercises the athlete has actual data for, sorted by frequency
- **e1RM over time chart** — pure SVG line chart with gradient fill, one dot per session
- **Weekly tonnage bar chart** — total kg lifted (weight × reps) grouped by ISO week
- **Right-panel history** inside the block editor: for any exercise, see every session it was trained, grouped by block → week → day, with sets listed as `weight×reps @RPE`
- Best e1RM all-time badge per exercise

### Wellness Check-ins
- Weekly check-in with 5 metrics scored 1–10: **fatigue, soreness, sleep quality, motivation, stress**
- Upsert per week (fill it in across the week, last write wins)
- History grid showing past 16 weeks at a glance
- Optional free-text notes field

### Competitions
- Log competition results: name, date, federation, weight class
- Record best squat / bench / deadlift attempts and total
- **Total progression chart** — SVG bar chart across all competitions
- Inline create / edit / delete with confirmation

### Coach Panel
- Coach sees all linked athletes in a card grid
- One-click jump to any athlete's blocks or training calendar
- Athlete blocks are fully editable by the coach (same editor, same history access)
- Compliance view: each logged set flagged green / yellow / red based on how actual RPE compares to target RPE

### Connections
- Athletes send connection requests to coaches by email
- Coach accepts/rejects requests
- Once connected, coach can view and edit athlete data

### Calendar View
- Month view of planned training days
- Visual indicator for days with completed sessions

### Profile
- Display name and avatar (base64 upload)
- Squat / bench / deadlift PR fields

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3.12, FastAPI, SQLAlchemy ORM |
| **Database** | SQLite (single-file, zero config) |
| **Frontend** | React 19, Vite, 100% inline styles (no CSS files) |
| **Charts** | Pure SVG — no charting libraries |
| **HTTP client** | Axios |
| **Auth** | bcrypt password hashing, session via localStorage |
| **Deployment** | Single process — FastAPI serves the built React SPA |

---

## Data Model

```
User (athlete | coach)
 └─ Profile (display name, avatar, PRs)
 └─ CoachAthlete (M:N link with status pending/accepted)
 └─ Block (training cycle)
      └─ Week (1..N)
           └─ Day (1..M per week)
                └─ PlannedWorkout (one exercise slot)
                     ├─ target_weight, target_reps, target_rpe, modifier, weight_cap
                     └─ Set (one planned row)
                          ├─ planned: weight / reps / rpe
                          ├─ actual: weight / reps / rpe / estimated_1rm
                          ├─ weight_cap (coach ceiling note)
                          ├─ note (athlete note)
                          └─ logged_at (ISO timestamp, set when athlete logs actual data)
 └─ WeeklyCheckin (fatigue/soreness/sleep/motivation/stress 1-10, per ISO week)
 └─ Competition (name, date, federation, weight_class, squat/bench/deadlift bests, total)

Exercise (global library)
 └─ name, category, variant, subcategory
```

---

## API Endpoints

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/register/` | Register new user |
| POST | `/login/` | Login, returns user id + role |

### Blocks
| Method | Path | Description |
|---|---|---|
| POST | `/blocks/full/` | Create block with all weeks and days |
| GET | `/atleta/{id}/blocks/` | List athlete's blocks |
| DELETE | `/blocks/{id}/` | Delete block (full cascade) |
| POST | `/blocks/{id}/copy-from/{src}/` | Copy exercises from another block's week 1 |
| POST | `/blocks/{id}/replicate-template/` | Apply progression and fill weeks 2–N |
| GET/POST/DELETE | `/blocks/{id}/weeks/{w}/days/{d}/` | Read/manage a specific day |

### Workouts & Sets
| Method | Path | Description |
|---|---|---|
| GET | `/days/{id}/workouts/` | Get all planned workouts for a day |
| POST | `/days/{id}/workouts/` | Add exercise to a day |
| DELETE | `/workouts/{id}/` | Remove exercise from a day |
| GET | `/workouts/{id}/sets/` | Get sets for a planned workout |
| PUT | `/sets/{id}/` | Log actual data (weight/reps/RPE) for a set |

### Analytics
| Method | Path | Description |
|---|---|---|
| GET | `/atleta/{id}/ejercicios-con-datos/` | Exercises with logged sets, sorted by frequency |
| GET | `/atleta/{id}/ejercicio/{eid}/progreso/` | e1RM history + best e1RM |
| GET | `/atleta/{id}/tonelaje-semanal/` | Weekly tonnage (kg × reps per ISO week) |
| GET | `/atleta/{id}/ejercicio/{eid}/historial-sesiones/` | Grouped session history for history panel |
| GET | `/atleta/{id}/cumplimiento/` | RPE compliance per set (green/yellow/red) |

### Wellness & Competitions
| Method | Path | Description |
|---|---|---|
| POST | `/atleta/{id}/checkin/` | Submit weekly check-in (upsert by week) |
| GET | `/atleta/{id}/checkins/` | Last 16 check-ins |
| GET/POST | `/atleta/{id}/competitions/` | List / create competitions |
| PUT/DELETE | `/competitions/{id}/` | Update / delete competition |

### Connections & Profiles
| Method | Path | Description |
|---|---|---|
| POST | `/connections/request/` | Send coach request by email |
| GET | `/connections/coach/{id}/athletes/` | Coach's athlete list |
| GET/PUT | `/profiles/{id}/` | Get / update profile |

---

## Local Development

### Prerequisites
- Python 3.12+
- Node.js 20+

### Backend

```bash
cd ProyAPP
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The database (`powerapp.db`) is created automatically on first run. Migrations for new columns run automatically at startup.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite proxies `/api` to `localhost:8000`. Open [http://localhost:5173](http://localhost:5173).

### Build for production

```bash
cd frontend && npm run build
# FastAPI serves /dist as static files at "/"
uvicorn app.main:app --port 8000
```

---

## Project Structure

```
ProyAPP/
├── app/
│   ├── main.py              # FastAPI app, startup, migrations, static serving
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── database.py          # SQLite engine + session
│   ├── dependencies.py      # get_db dependency
│   ├── utils.py             # e1RM formula (Brzycki + RPE)
│   └── routers/
│       ├── auth.py
│       ├── blocks.py
│       ├── workouts.py
│       ├── exercises.py
│       ├── analytics.py
│       ├── connections.py
│       ├── profiles.py
│       ├── checkins.py
│       └── competitions.py
├── frontend/
│   └── src/
│       ├── App.jsx              # Root: routing state machine
│       ├── styles/theme.js      # Design tokens (colors, spacing)
│       └── components/
│           ├── AppShell.jsx         # Sidebar (desktop) + bottom nav (mobile)
│           ├── LoginForm.jsx
│           ├── RegistroForm.jsx
│           ├── BloquesView.jsx      # Block list
│           ├── CrearBloqueView.jsx  # 3-step creation wizard
│           ├── EditarBloqueView.jsx # 3-panel block editor
│           ├── SemanasView.jsx
│           ├── DiasView.jsx
│           ├── EntrenosDiaView.jsx  # Day workout list
│           ├── EjecucionSerieView.jsx  # Set-by-set execution
│           ├── ProgressView.jsx     # e1RM + tonnage charts
│           ├── CheckinView.jsx      # Weekly wellness check-in
│           ├── CompetitionsView.jsx # Competition log + chart
│           ├── CalendarioView.jsx   # Monthly calendar
│           ├── CoachPanelView.jsx   # Coach's athlete grid
│           ├── ConexionesView.jsx   # Coach/athlete connection requests
│           └── PerfilView.jsx       # User profile
├── powerapp.db              # SQLite database (auto-created)
└── requirements.txt
```

---

## Design System

- **Background:** `#0c0c10` (near-black)
- **Primary accent:** `#00ff87` (neon green)
- **Surface:** `#13131a` / `#1a1a24`
- **Text:** `#f0f0f5` / `#9090a0` (muted)
- **Danger:** `#ff4444`
- **No CSS files** — all styles are inline React objects via a shared `theme.js` token map
- **No UI component library** — every component is hand-rolled
- **Responsive:** sidebar on desktop (≥680px), bottom nav bar on mobile

---

## e1RM Formula

Uses a hybrid Brzycki + RPE approach:

```
repsEq = reps + (10 - rpe)       # effective reps at max effort
e1rm   = weight / (1.0278 - 0.0278 × repsEq)
```

RPE adjusts the effective rep count before applying the Brzycki curve, giving accurate estimates even at sub-maximal intensities.

---

## Roadmap / What's Next

- [ ] Athlete RPE fatigue trend alerts for coaches
- [ ] PDF export of a training block
- [ ] Push notifications for scheduled training days
- [ ] Multi-language support (ES / EN)
- [ ] Wilks / IPF GL score on competition results
- [ ] Video attachment per set (technique review)

---

## License

Private / proprietary. Not open for public contributions yet.
