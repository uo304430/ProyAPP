from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import bcrypt # Cambiamos passlib por bcrypt
from . import models, database

# Crear las tablas en la base de datos
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Powerlifting API - Sprint 2")

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

class UserCreate(BaseModel):
    email: str
    password: str
    role: str

# ---------------------------------------------------------
# Endpoints de Inicio y 1RM
# ---------------------------------------------------------

@app.get("/")
def inicio():
    return {"mensaje": "API de Powerlifting con Base de Datos y Usuarios activa"}

@app.get("/1rm")
def calcular_1rm(peso: float, reps: int, rpe: float):
    reps_equivalentes = reps + (10 - rpe)
    e1rm = peso / (1.0278 - (0.0278 * reps_equivalentes))
    
    return {
        "datos_entrada": {
            "peso": peso,
            "reps": reps,
            "rpe": rpe
        },
        "e1rm_estimado": round(e1rm, 2),
        "nota": f"Tu 1RM estimado es {round(e1rm, 2)}kg basado en un esfuerzo de {rpe}"
    }

# ---------------------------------------------------------
# Endpoints de Ejercicios
# ---------------------------------------------------------

@app.post("/ejercicios/")
def crear_ejercicio(nombre: str, db: Session = Depends(get_db)):
    nuevo_ejercicio = models.Exercise(name=nombre)
    db.add(nuevo_ejercicio)
    db.commit()
    db.refresh(nuevo_ejercicio)
    return {"mensaje": "Ejercicio creado", "id": nuevo_ejercicio.id, "nombre": nuevo_ejercicio.name}

# ---------------------------------------------------------
# Endpoints de Series (Sets)
# ---------------------------------------------------------

@app.post("/series/")
def registrar_serie(
    workout_id: int, 
    exercise_id: int, 
    peso: float, 
    reps: int, 
    rpe: float, 
    db: Session = Depends(get_db)
):
    reps_equivalentes = reps + (10 - rpe)
    e1rm = peso / (1.0278 - (0.0278 * reps_equivalentes))
    
    nueva_serie = models.Set(
        workout_id=workout_id,
        exercise_id=exercise_id,
        weight=peso,
        reps=reps,
        rpe=rpe,
        estimated_1rm=round(e1rm, 2)
    )
    
    db.add(nueva_serie)
    db.commit()
    db.refresh(nueva_serie)
    
    return {"mensaje": "Serie registrada con éxito", "e1rm": nueva_serie.estimated_1rm}

# ---------------------------------------------------------
# Endpoints de Registro de Usuario
# ---------------------------------------------------------

@app.post("/register/")
def registrar_usuario(user_data: UserCreate, db: Session = Depends(get_db)):
    # 1. Verificar si el usuario ya existe
    db_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    # 2. Encriptar la contraseña usando bcrypt directamente
    pwd_bytes = user_data.password.encode('utf-8')
    hashed_pass = bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode('utf-8')
    
    # 3. Crear el nuevo usuario
    nuevo_usuario = models.User(
        email=user_data.email,
        hashed_password=hashed_pass,
        role=user_data.role
    )
    
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    
    return {
        "mensaje": "Usuario registrado exitosamente",
        "usuario_id": nuevo_usuario.id,
        "email": nuevo_usuario.email,
        "rol": nuevo_usuario.role
    }
class CoachAthleteLink(BaseModel):
    coach_id: int
    athlete_id: int

@app.post("/vincular/")
def vincular_entrenador_atleta(link_data: CoachAthleteLink, db: Session = Depends(get_db)):
    # Verificamos que el coach exista
    coach = db.query(models.User).filter(models.User.id == link_data.coach_id, models.User.role == "coach").first()
    if not coach:
        raise HTTPException(status_code=404, detail="Entrenador no encontrado o no tiene el rol correcto")
    
    # Verificamos que el atleta exista
    athlete = db.query(models.User).filter(models.User.id == link_data.athlete_id, models.User.role == "athlete").first()
    if not athlete:
        raise HTTPException(status_code=404, detail="Atleta no encontrado o no tiene el rol correcto")
    
    # Verificamos si ya existe la relación para no duplicar
    existing_link = db.query(models.CoachAthlete).filter(
        models.CoachAthlete.coach_id == link_data.coach_id,
        models.CoachAthlete.athlete_id == link_data.athlete_id
    ).first()
    
    if existing_link:
        return {"mensaje": "Esta relación ya existe"}
    
    # Creamos el nuevo enlace
    nuevo_vinculo = models.CoachAthlete(
        coach_id=link_data.coach_id,
        athlete_id=link_data.athlete_id
    )
    
    db.add(nuevo_vinculo)
    db.commit()
    
    return {"mensaje": "Atleta vinculado al entrenador correctamente"}