from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app import models, database
from app.routers import auth, blocks, exercises, workouts, analytics

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Powerlifting SaaS")

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


@app.get("/")
def inicio():
    return {"mensaje": "API de Powerlifting activa"}


@app.on_event("startup")
def startup_event():
    db = database.SessionLocal()
    try:
        # Add objective column if it doesn't exist (migration for existing DBs)
        with database.engine.connect() as conn:
            try:
                conn.execute(text("ALTER TABLE blocks ADD COLUMN objective TEXT"))
                conn.commit()
            except Exception:
                pass  # Column already exists

        if not db.query(models.Exercise).first():
            ejercicios = [
                {"name": "Squat", "category": "basic", "variant": "Low Bar"},
                {"name": "Squat", "category": "basic", "variant": "High Bar"},
                {"name": "Bench Press", "category": "basic", "variant": "Competición"},
                {"name": "Bench Press", "category": "basic", "variant": "Con parada"},
                {"name": "Deadlift", "category": "basic", "variant": "Convencional"},
                {"name": "Deadlift", "category": "basic", "variant": "Sumo"},
                {"name": "Jalones al pecho", "category": "accessory", "variant": None},
                {"name": "Remo con barra", "category": "accessory", "variant": "Pronado"},
                {"name": "Press militar", "category": "accessory", "variant": None},
                {"name": "Curl de bíceps", "category": "accessory", "variant": None},
                {"name": "Extensión de tríceps", "category": "accessory", "variant": None},
                {"name": "Prensa", "category": "accessory", "variant": None},
                {"name": "Hip thrust", "category": "accessory", "variant": None},
                {"name": "Good morning", "category": "accessory", "variant": None},
            ]
            db.add_all([models.Exercise(**e) for e in ejercicios])
            db.commit()
    finally:
        db.close()
