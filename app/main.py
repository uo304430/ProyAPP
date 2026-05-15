from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app import models, database
from app.routers import auth, blocks, exercises, workouts, analytics, connections, profiles, checkins, competitions

EXERCISE_LIBRARY = [
    # ── SQUAT ────────────────────────────────────────────────────────────────
    {"name": "Squat", "category": "basic", "variant": "Low Bar",                  "subcategory": "Barra y Técnica"},
    {"name": "Squat", "category": "basic", "variant": "High Bar",                 "subcategory": "Barra y Técnica"},
    {"name": "Squat", "category": "basic", "variant": "Safety Bar",               "subcategory": "Barra y Técnica"},
    {"name": "Squat", "category": "basic", "variant": "Front Squat",              "subcategory": "Barra y Técnica"},
    {"name": "Squat", "category": "basic", "variant": "Zercher",                  "subcategory": "Barra y Técnica"},
    {"name": "Squat", "category": "basic", "variant": "Duffalo Bar",              "subcategory": "Barra y Técnica"},
    {"name": "Squat", "category": "basic", "variant": "Anderson",                 "subcategory": "Barra y Técnica"},
    {"name": "Squat", "category": "basic", "variant": "Pin Squat",                "subcategory": "Barra y Técnica"},
    {"name": "Squat", "category": "basic", "variant": "Box Squat",                "subcategory": "Barra y Técnica"},
    {"name": "Squat", "category": "basic", "variant": "Goblet",                   "subcategory": "Barra y Técnica"},
    {"name": "Squat", "category": "basic", "variant": "Bulgarian Split",          "subcategory": "Barra y Técnica"},
    {"name": "Squat", "category": "basic", "variant": "Paused 1ct",               "subcategory": "Pausa"},
    {"name": "Squat", "category": "basic", "variant": "Paused 2ct",               "subcategory": "Pausa"},
    {"name": "Squat", "category": "basic", "variant": "Paused 3ct",               "subcategory": "Pausa"},
    {"name": "Squat", "category": "basic", "variant": "Paused 5ct",               "subcategory": "Pausa"},
    {"name": "Squat", "category": "basic", "variant": "Paused (Descent & Ascent)","subcategory": "Pausa"},
    {"name": "Squat", "category": "basic", "variant": "Tempo 3-0-3",              "subcategory": "Tempo"},
    {"name": "Squat", "category": "basic", "variant": "Tempo 3-1-0",              "subcategory": "Tempo"},
    {"name": "Squat", "category": "basic", "variant": "Tempo 3-2-0",              "subcategory": "Tempo"},
    {"name": "Squat", "category": "basic", "variant": "Tempo 3-3-0",              "subcategory": "Tempo"},
    {"name": "Squat", "category": "basic", "variant": "Tempo 4-1-0",              "subcategory": "Tempo"},
    {"name": "Squat", "category": "basic", "variant": "Tempo 5-1-0",              "subcategory": "Tempo"},
    {"name": "Squat", "category": "basic", "variant": "Tempo 5-3-0",              "subcategory": "Tempo"},
    {"name": "Squat", "category": "basic", "variant": "Tempo 5-5-0",              "subcategory": "Tempo"},
    {"name": "Squat", "category": "basic", "variant": "Chains",                   "subcategory": "Sobrecarga"},
    {"name": "Squat", "category": "basic", "variant": "Banded",                   "subcategory": "Sobrecarga"},
    {"name": "Squat", "category": "basic", "variant": "Reverse Band",             "subcategory": "Sobrecarga"},
    {"name": "Squat", "category": "basic", "variant": "1 & 1/4",                  "subcategory": "Sobrecarga"},
    # ── BENCH PRESS ──────────────────────────────────────────────────────────
    {"name": "Bench Press", "category": "basic", "variant": "Competition",        "subcategory": "Agarre y Estabilidad"},
    {"name": "Bench Press", "category": "basic", "variant": "Close Grip",         "subcategory": "Agarre y Estabilidad"},
    {"name": "Bench Press", "category": "basic", "variant": "Wide Grip",          "subcategory": "Agarre y Estabilidad"},
    {"name": "Bench Press", "category": "basic", "variant": "Reverse Grip",       "subcategory": "Agarre y Estabilidad"},
    {"name": "Bench Press", "category": "basic", "variant": "Larsen Press",       "subcategory": "Agarre y Estabilidad"},
    {"name": "Bench Press", "category": "basic", "variant": "Feet Up",            "subcategory": "Agarre y Estabilidad"},
    {"name": "Bench Press", "category": "basic", "variant": "Swiss Bar",          "subcategory": "Agarre y Estabilidad"},
    {"name": "Bench Press", "category": "basic", "variant": "Duffalo Bar",        "subcategory": "Agarre y Estabilidad"},
    {"name": "Bench Press", "category": "basic", "variant": "Spoto Press",        "subcategory": "Rango y Apoyo"},
    {"name": "Bench Press", "category": "basic", "variant": "Floor Press",        "subcategory": "Rango y Apoyo"},
    {"name": "Bench Press", "category": "basic", "variant": "Pin Press",          "subcategory": "Rango y Apoyo"},
    {"name": "Bench Press", "category": "basic", "variant": "Board Press 1-Board","subcategory": "Rango y Apoyo"},
    {"name": "Bench Press", "category": "basic", "variant": "Board Press 2-Board","subcategory": "Rango y Apoyo"},
    {"name": "Bench Press", "category": "basic", "variant": "Board Press 3-Board","subcategory": "Rango y Apoyo"},
    {"name": "Bench Press", "category": "basic", "variant": "Paused 1ct",         "subcategory": "Pausa"},
    {"name": "Bench Press", "category": "basic", "variant": "Paused 2ct",         "subcategory": "Pausa"},
    {"name": "Bench Press", "category": "basic", "variant": "Paused 3ct",         "subcategory": "Pausa"},
    {"name": "Bench Press", "category": "basic", "variant": "Paused 5ct",         "subcategory": "Pausa"},
    {"name": "Bench Press", "category": "basic", "variant": "Tempo 3-0-3",        "subcategory": "Tempo"},
    {"name": "Bench Press", "category": "basic", "variant": "Tempo 3-1-0",        "subcategory": "Tempo"},
    {"name": "Bench Press", "category": "basic", "variant": "Tempo 3-2-0",        "subcategory": "Tempo"},
    {"name": "Bench Press", "category": "basic", "variant": "Tempo 3-3-0",        "subcategory": "Tempo"},
    {"name": "Bench Press", "category": "basic", "variant": "Tempo 4-1-0",        "subcategory": "Tempo"},
    {"name": "Bench Press", "category": "basic", "variant": "Tempo 5-1-0",        "subcategory": "Tempo"},
    {"name": "Bench Press", "category": "basic", "variant": "Tempo 5-3-0",        "subcategory": "Tempo"},
    {"name": "Bench Press", "category": "basic", "variant": "Chains",             "subcategory": "Sobrecarga"},
    {"name": "Bench Press", "category": "basic", "variant": "Banded",             "subcategory": "Sobrecarga"},
    {"name": "Bench Press", "category": "basic", "variant": "Slingshot",          "subcategory": "Sobrecarga"},
    # ── DEADLIFT ─────────────────────────────────────────────────────────────
    {"name": "Deadlift", "category": "basic", "variant": "Conventional",               "subcategory": "Postura y Barra"},
    {"name": "Deadlift", "category": "basic", "variant": "Sumo",                       "subcategory": "Postura y Barra"},
    {"name": "Deadlift", "category": "basic", "variant": "Semi-Sumo",                  "subcategory": "Postura y Barra"},
    {"name": "Deadlift", "category": "basic", "variant": "Stiff Leg",                  "subcategory": "Postura y Barra"},
    {"name": "Deadlift", "category": "basic", "variant": "Romanian",                   "subcategory": "Postura y Barra"},
    {"name": "Deadlift", "category": "basic", "variant": "Snatch Grip",                "subcategory": "Postura y Barra"},
    {"name": "Deadlift", "category": "basic", "variant": "Trap Bar",                   "subcategory": "Postura y Barra"},
    {"name": "Deadlift", "category": "basic", "variant": "Deficit 1in",                "subcategory": "Rango"},
    {"name": "Deadlift", "category": "basic", "variant": "Deficit 2in",                "subcategory": "Rango"},
    {"name": "Deadlift", "category": "basic", "variant": "Deficit 3in",                "subcategory": "Rango"},
    {"name": "Deadlift", "category": "basic", "variant": "Block Pull 1in",             "subcategory": "Rango"},
    {"name": "Deadlift", "category": "basic", "variant": "Block Pull 2in",             "subcategory": "Rango"},
    {"name": "Deadlift", "category": "basic", "variant": "Block Pull 3in",             "subcategory": "Rango"},
    {"name": "Deadlift", "category": "basic", "variant": "Block Pull 5in",              "subcategory": "Rango"},
    {"name": "Deadlift", "category": "basic", "variant": "Rack Pull",                  "subcategory": "Rango"},
    {"name": "Deadlift", "category": "basic", "variant": "Paused 1ct (Off Floor)",     "subcategory": "Pausa"},
    {"name": "Deadlift", "category": "basic", "variant": "Paused 2ct (Off Floor)",     "subcategory": "Pausa"},
    {"name": "Deadlift", "category": "basic", "variant": "Paused 1ct (Below Knee)",    "subcategory": "Pausa"},
    {"name": "Deadlift", "category": "basic", "variant": "Paused 2ct (Below Knee)",    "subcategory": "Pausa"},
    {"name": "Deadlift", "category": "basic", "variant": "Tempo 3-1-0",                "subcategory": "Tempo"},
    {"name": "Deadlift", "category": "basic", "variant": "Tempo 3-0-3",                "subcategory": "Tempo"},
    {"name": "Deadlift", "category": "basic", "variant": "Tempo 3-3-3",                "subcategory": "Tempo"},
    {"name": "Deadlift", "category": "basic", "variant": "Tempo 5-1-0",                "subcategory": "Tempo"},
    {"name": "Deadlift", "category": "basic", "variant": "Chains",                     "subcategory": "Sobrecarga"},
    {"name": "Deadlift", "category": "basic", "variant": "Banded",                     "subcategory": "Sobrecarga"},
    {"name": "Deadlift", "category": "basic", "variant": "Reverse Band",               "subcategory": "Sobrecarga"},
    # ── ACCESORIOS — Pecho ───────────────────────────────────────────────────
    {"name": "Incline Dumbbell Press",          "category": "accessory", "variant": None, "subcategory": "Pecho"},
    {"name": "Incline Barbell Press",           "category": "accessory", "variant": None, "subcategory": "Pecho"},
    {"name": "Dumbbell Flat Press",             "category": "accessory", "variant": None, "subcategory": "Pecho"},
    {"name": "Machine Chest Press",             "category": "accessory", "variant": None, "subcategory": "Pecho"},
    {"name": "Weighted Dips",                   "category": "accessory", "variant": None, "subcategory": "Pecho"},
    {"name": "Cable Flyes",                     "category": "accessory", "variant": None, "subcategory": "Pecho"},
    {"name": "Dumbbell Flyes",                  "category": "accessory", "variant": None, "subcategory": "Pecho"},
    # ── ACCESORIOS — Espalda ─────────────────────────────────────────────────
    {"name": "Weighted Pull-ups",               "category": "accessory", "variant": None, "subcategory": "Espalda"},
    {"name": "Weighted Chin-ups",               "category": "accessory", "variant": None, "subcategory": "Espalda"},
    {"name": "Lat Pulldown",                    "category": "accessory", "variant": None, "subcategory": "Espalda"},
    {"name": "V-Bar Pulldown",                  "category": "accessory", "variant": None, "subcategory": "Espalda"},
    {"name": "Pendlay Row",                     "category": "accessory", "variant": None, "subcategory": "Espalda"},
    {"name": "Barbell Row",                     "category": "accessory", "variant": None, "subcategory": "Espalda"},
    {"name": "Dumbbell Row",                    "category": "accessory", "variant": None, "subcategory": "Espalda"},
    {"name": "Meadows Row",                     "category": "accessory", "variant": None, "subcategory": "Espalda"},
    {"name": "Seated Cable Row",                "category": "accessory", "variant": None, "subcategory": "Espalda"},
    {"name": "T-Bar Row",                       "category": "accessory", "variant": None, "subcategory": "Espalda"},
    {"name": "Chest Supported Row",             "category": "accessory", "variant": None, "subcategory": "Espalda"},
    # ── ACCESORIOS — Pierna ──────────────────────────────────────────────────
    {"name": "Leg Press",                       "category": "accessory", "variant": None, "subcategory": "Pierna"},
    {"name": "Hack Squat",                      "category": "accessory", "variant": None, "subcategory": "Pierna"},
    {"name": "Leg Extension",                   "category": "accessory", "variant": None, "subcategory": "Pierna"},
    {"name": "Lying Leg Curl",                  "category": "accessory", "variant": None, "subcategory": "Pierna"},
    {"name": "Seated Leg Curl",                 "category": "accessory", "variant": None, "subcategory": "Pierna"},
    {"name": "Glute Ham Raise",                 "category": "accessory", "variant": None, "subcategory": "Pierna"},
    {"name": "Good Mornings",                   "category": "accessory", "variant": None, "subcategory": "Pierna"},
    {"name": "Hip Thrust",                      "category": "accessory", "variant": None, "subcategory": "Pierna"},
    {"name": "45-degree Back Extension",        "category": "accessory", "variant": None, "subcategory": "Pierna"},
    # ── ACCESORIOS — Hombro ──────────────────────────────────────────────────
    {"name": "Overhead Press",                  "category": "accessory", "variant": None, "subcategory": "Hombro"},
    {"name": "Seated Dumbbell Press",           "category": "accessory", "variant": None, "subcategory": "Hombro"},
    {"name": "Z-Press",                         "category": "accessory", "variant": None, "subcategory": "Hombro"},
    {"name": "Lateral Raises",                  "category": "accessory", "variant": None, "subcategory": "Hombro"},
    {"name": "Front Raises",                    "category": "accessory", "variant": None, "subcategory": "Hombro"},
    {"name": "Facepulls",                       "category": "accessory", "variant": None, "subcategory": "Hombro"},
    {"name": "Reverse Pec Deck",                "category": "accessory", "variant": None, "subcategory": "Hombro"},
    {"name": "Rear Delt Flyes",                 "category": "accessory", "variant": None, "subcategory": "Hombro"},
    # ── ACCESORIOS — Brazos ──────────────────────────────────────────────────
    {"name": "JM Press",                        "category": "accessory", "variant": None, "subcategory": "Brazos"},
    {"name": "Rolling Dumbbell Tricep Ext",     "category": "accessory", "variant": None, "subcategory": "Brazos"},
    {"name": "Skullcrushers",                   "category": "accessory", "variant": None, "subcategory": "Brazos"},
    {"name": "Tricep Pushdowns",                "category": "accessory", "variant": None, "subcategory": "Brazos"},
    {"name": "Overhead Tricep Extension",       "category": "accessory", "variant": None, "subcategory": "Brazos"},
    {"name": "Barbell Curl",                    "category": "accessory", "variant": None, "subcategory": "Brazos"},
    {"name": "Dumbbell Hammer Curl",            "category": "accessory", "variant": None, "subcategory": "Brazos"},
    {"name": "Incline Dumbbell Curl",           "category": "accessory", "variant": None, "subcategory": "Brazos"},
    # ── ACCESORIOS — Core ────────────────────────────────────────────────────
    {"name": "Ab Wheel Rollout",                "category": "accessory", "variant": None, "subcategory": "Core"},
    {"name": "Hanging Leg Raise",               "category": "accessory", "variant": None, "subcategory": "Core"},
    {"name": "Weighted Plank",                  "category": "accessory", "variant": None, "subcategory": "Core"},
    {"name": "Pallof Press",                    "category": "accessory", "variant": None, "subcategory": "Core"},
    {"name": "Weighted Back Extension",         "category": "accessory", "variant": None, "subcategory": "Core"},
]


def _migrate():
    from sqlalchemy import text
    db = database.SessionLocal()
    try:
        for stmt in [
            "ALTER TABLE sets ADD COLUMN logged_at TEXT",
            "ALTER TABLE weeks ADD COLUMN published INTEGER DEFAULT 0",
            "ALTER TABLE days ADD COLUMN day_name TEXT",
            "ALTER TABLE exercises ADD COLUMN user_id INTEGER",
            "ALTER TABLE users ADD COLUMN username TEXT",
            "ALTER TABLE profiles ADD COLUMN first_name TEXT",
            "ALTER TABLE profiles ADD COLUMN last_name TEXT",
        ]:
            try:
                db.execute(text(stmt))
                db.commit()
            except Exception:
                db.rollback()
    finally:
        db.close()


def _run_startup():
    models.Base.metadata.create_all(bind=database.engine)
    _migrate()

    db = database.SessionLocal()
    try:
        existing = {
            (e.name, e.variant)
            for e in db.query(models.Exercise).all()
        }
        new_exercises = [
            models.Exercise(**ex)
            for ex in EXERCISE_LIBRARY
            if (ex["name"], ex["variant"]) not in existing
        ]
        if new_exercises:
            db.add_all(new_exercises)
            db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    _run_startup()
    yield


app = FastAPI(title="B2L", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(blocks.router)
app.include_router(exercises.router)
app.include_router(workouts.router)
app.include_router(analytics.router)
app.include_router(connections.router)
app.include_router(profiles.router)
app.include_router(checkins.router)
app.include_router(competitions.router)


@app.get("/")
def inicio():
    return {"mensaje": "API de Powerlifting activa"}
